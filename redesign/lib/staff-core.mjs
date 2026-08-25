/**
 * Staff admin core — password login, no GitHub account required.
 *
 * Platform-agnostic: takes a Web Request, returns a Web Response. Vercel and
 * Netlify adapters wrap this, so moving host does not touch the logic.
 *
 * Sits alongside Decap at /admin (which needs a GitHub login). This one is
 * for staff who just need to keep prices and details current.
 *
 * Required environment variables (Netlify > Project configuration >
 * Environment variables):
 *   STAFF_PASSWORD  the password typed at /staff
 *   STAFF_SECRET    any long random string; signs the session token
 *   GITHUB_TOKEN    fine-grained token, Contents: read & write on
 *                   RYKAYzz/protective-gear-site
 *
 * Routes (under /api/staff):
 *   POST /login     { password }                  -> { token }
 *   GET  /products                                -> { products, baseCommit }
 *   PUT  /products  { products, baseCommit, changed } -> { commit, saved }
 *
 * Writes land as ONE commit via the git data API, so a multi-product save
 * cannot half-apply.
 */

const REPO = "RYKAYzz/protective-gear-site";
const BRANCH = "main";
const DIR = "redesign/src/data/products";
const SESSION_HOURS = 12;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/* ----------------------------------------------------------------- auth ---
 *
 * Web Crypto, not node:crypto. Cloudflare Workers has no Node crypto module,
 * and the whole point of this file is that it runs unchanged on any host.
 * Web Crypto is available on Node, Workers, Vercel and Netlify alike.
 */

const enc = new TextEncoder();

const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const b64urlDecode = (str) => {
  const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, enc.encode(message));
}

/** Constant-time comparison — no early return on first differing byte. */
function equal(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sign(payload, secret) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${b64url(await hmac(secret, body))}`;
}

async function verify(token, secret) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  if (!equal(mac, b64url(await hmac(secret, body)))) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    return payload.exp && Date.now() < payload.exp ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Compares HMACs of the two passwords rather than the strings, so length is
 * not leaked by the comparison. Both sides are trimmed: a value pasted into a
 * dashboard env field easily carries a trailing newline, and a login that
 * fails on an invisible character is undebuggable from the login screen.
 */
async function passwordMatches(given, expected) {
  if (typeof given !== "string" || typeof expected !== "string") return false;
  const [a, b] = await Promise.all([
    hmac("pw", given.trim()),
    hmac("pw", expected.trim()),
  ]);
  return equal(b64url(a), b64url(b));
}

/* -------------------------------------------------------------- github --- */

async function gh(path, token, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "ark-staff-admin",
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(body.message || `GitHub ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

async function ghGraphQL(token, query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "user-agent": "ark-staff-admin",
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors) {
    const err = new Error(
      body.errors?.[0]?.message || body.message || `GitHub GraphQL ${res.status}`
    );
    err.status = res.status;
    throw err;
  }
  return body.data;
}

async function headCommit(token) {
  const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`, token);
  return ref.object.sha;
}

/**
 * Reads the whole catalogue in ONE request.
 *
 * The REST version fetched a blob per product: 1 ref + 1 tree + 73 blobs = 75
 * calls. A Cloudflare Worker on the free plan may make 50 subrequests per
 * invocation, so the panel died with "Too many subrequests" and rendered an
 * empty grid. Node hosts have no such cap, which is why this only appeared
 * after the move. GraphQL returns every blob's text inline, so the cost is
 * one call no matter how large the catalogue grows.
 */
async function readProducts(token) {
  const [owner, name] = REPO.split("/");

  const data = await ghGraphQL(
    token,
    `query($owner:String!, $name:String!, $branch:String!, $expr:String!) {
      repository(owner:$owner, name:$name) {
        ref(qualifiedName:$branch) { target { oid } }
        object(expression:$expr) {
          ... on Tree {
            entries { name  object { ... on Blob { text } } }
          }
        }
      }
    }`,
    { owner, name, branch: BRANCH, expr: `${BRANCH}:${DIR}` }
  );

  const repo = data?.repository;
  const commit = repo?.ref?.target?.oid;
  if (!commit) throw new Error(`Could not read branch ${BRANCH}.`);

  const products = [];
  for (const entry of repo.object?.entries ?? []) {
    if (!entry.name.endsWith(".json")) continue;
    const text = entry.object?.text;
    if (!text) continue; // binary or truncated — skip rather than corrupt
    try {
      products.push({ ...JSON.parse(text), _path: `${DIR}/${entry.name}` });
    } catch {
      throw new Error(`${entry.name} is not valid JSON.`);
    }
  }

  products.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { products, baseCommit: commit };
}

async function writeProducts(token, products, baseCommit, changed) {
  // Always build on top of whatever main is now. The previous version
  // rejected the save whenever main had moved at all — including for commits
  // that never touched a product — which surfaced as a spurious "someone else
  // saved" every time anything else was pushed.
  const current = await headCommit(token);

  const { tree: oldTree } = await gh(
    `/repos/${REPO}/git/trees/${current}?recursive=1`,
    token
  );
  const existing = new Set(
    oldTree
      .filter((t) => t.type === "blob" && t.path.startsWith(`${DIR}/`))
      .map((t) => t.path)
  );

  // When the client tells us which products it actually touched, write only
  // those. Anything edited elsewhere in the meantime is then left alone
  // rather than being clobbered by this session's stale copy.
  const touched =
    Array.isArray(changed) && changed.length ? new Set(changed) : null;

  const toWrite = touched
    ? products.filter((p) => touched.has(p.slug))
    : products;

  // The create-tree call accepts file content inline, so there is no need to
  // POST a blob per product first. That kept the old version's cost linear in
  // the number of edits — publishing a full catalogue blew the Worker's
  // 50-subrequest ceiling. A save is now a flat five calls however many
  // products changed.
  const entries = toWrite.map((p) => {
    const { _path, ...clean } = p;
    return {
      path: `${DIR}/${p.slug}.json`,
      mode: "100644",
      type: "blob",
      content: JSON.stringify(clean, null, 2) + "\n",
    };
  });

  // Deletions: a slug the client no longer has, that it says it touched.
  const present = new Set(products.map((p) => `${DIR}/${p.slug}.json`));
  for (const path of existing) {
    if (present.has(path)) continue;
    const slug = path.slice(DIR.length + 1, -".json".length);
    if (touched && !touched.has(slug)) continue; // deleted by someone else
    entries.push({ path, mode: "100644", type: "blob", sha: null });
  }

  if (!entries.length) return current; // nothing to do

  const newTree = await gh(`/repos/${REPO}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({ base_tree: current, tree: entries }),
  });

  const commit = await gh(`/repos/${REPO}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({
      message: `Update catalogue from staff admin (${entries.length} changed)`,
      tree: newTree.sha,
      parents: [current],
    }),
  });

  await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, token, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return commit.sha;
}

/* --------------------------------------------------------------- routes --- */

export async function handleStaff(req, env = globalThis.process?.env ?? {}) {
  // Cloudflare Workers has no process.env — the platform hands env to the
  // adapter, which passes it in. Node hosts fall back to process.env.
  const { STAFF_PASSWORD, STAFF_SECRET, GITHUB_TOKEN } = env;

  if (!STAFF_PASSWORD || !STAFF_SECRET || !GITHUB_TOKEN) {
    return json(500, {
      error:
        "Staff admin is not configured. Set STAFF_PASSWORD, STAFF_SECRET and GITHUB_TOKEN in the hosting dashboard.",
    });
  }

  const route = new URL(req.url).pathname
    .replace(/^\/api\/staff\/?/, "")
    .replace(/\/$/, "");

  try {
    /**
     * Diagnostics. Reports whether each variable is present, the length of
     * the password, and whether the GitHub token actually works — enough to
     * find a misconfiguration, without returning any secret value.
     * Safe to delete once the admin is running.
     */
    if (route === "health" && req.method === "GET") {
      let github = "not checked";
      try {
        const repo = await gh(`/repos/${REPO}`, GITHUB_TOKEN);
        github = `ok — can see ${repo.full_name}`;
      } catch (e) {
        github = `FAILED — ${e.message}`;
      }
      // Deliberately no lengths or values: this endpoint is unauthenticated,
      // and password length is a real hint to anyone guessing.
      return json(200, {
        staffPasswordSet: Boolean(STAFF_PASSWORD),
        staffSecretSet: Boolean(STAFF_SECRET),
        githubTokenSet: Boolean(GITHUB_TOKEN),
        github,
      });
    }

    if (route === "login" && req.method === "POST") {
      const { password } = await req.json().catch(() => ({}));
      if (!(await passwordMatches(password, STAFF_PASSWORD))) {
        await new Promise((r) => setTimeout(r, 400));
        return json(401, { error: "Incorrect password." });
      }
      return json(200, {
        token: await sign(
          {
            sid: crypto.randomUUID(),
            exp: Date.now() + SESSION_HOURS * 3600 * 1000,
          },
          STAFF_SECRET
        ),
      });
    }

    const auth = req.headers.get("authorization") || "";
    const session = auth.startsWith("Bearer ")
      ? await verify(auth.slice(7), STAFF_SECRET)
      : null;
    if (!session) return json(401, { error: "Session expired. Log in again." });

    if (route === "products" && req.method === "GET") {
      return json(200, await readProducts(GITHUB_TOKEN));
    }

    /* ---- image upload: commits straight into assets/uploads ---- */
    if (route === "upload" && req.method === "POST") {
      const { filename, dataUrl } = await req.json().catch(() => ({}));

      if (!filename || !dataUrl) {
        return json(400, { error: "Missing filename or file data." });
      }

      const match = /^data:(image\/(png|jpeg|jpg|webp|gif|avif));base64,(.+)$/i.exec(
        dataUrl
      );
      if (!match) {
        return json(400, {
          error: "Only PNG, JPG, WebP, GIF or AVIF images can be uploaded.",
        });
      }

      // Strip any whitespace a client may have wrapped into the data URL, so
      // the size maths below counts real payload characters.
      const base64 = match[3].replace(/\s+/g, "");

      // 5MB ceiling, measured on the decoded bytes rather than the string.
      // Computed arithmetically because Workers has no Buffer: every 4 base64
      // characters carry 3 bytes, less one byte per '=' of padding.
      const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
      const bytes = Math.floor((base64.length * 3) / 4) - padding;
      if (bytes > 5 * 1024 * 1024) {
        return json(400, { error: "Image is larger than 5MB." });
      }

      // Normalise the name: no spaces or path traversal, keep it predictable.
      const ext = (filename.split(".").pop() || "png").toLowerCase();
      const stem = filename
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "image";
      const path = `assets/uploads/${stem}-${Date.now().toString(36)}.${ext}`;

      await gh(`/repos/${REPO}/contents/${encodeURI(path)}`, GITHUB_TOKEN, {
        method: "PUT",
        body: JSON.stringify({
          message: `Upload ${path} from staff admin`,
          content: base64,
          branch: BRANCH,
        }),
      });

      // The site serves assets from the root, so drop the leading folder.
      return json(200, { path: `/${path}` });
    }

    if (route === "products" && req.method === "PUT") {
      const { products, baseCommit, changed } = await req.json().catch(() => ({}));

      if (!Array.isArray(products) || !products.length) {
        return json(400, { error: "products must be a non-empty array." });
      }
      if (!baseCommit) {
        return json(400, { error: "Missing baseCommit — reload before saving." });
      }

      // Validate before committing: a bad write breaks the live build.
      for (const [i, p] of products.entries()) {
        if (!p || typeof p.name !== "string" || !p.name.trim()) {
          return json(400, { error: `Product ${i + 1} needs a name.` });
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug || "")) {
          return json(400, {
            error: `"${p.name}" needs a slug in lowercase-with-hyphens form.`,
          });
        }
        if (!p.image) return json(400, { error: `"${p.name}" needs an image.` });
        if (p.price != null && p.price !== "" && !(Number(p.price) >= 0)) {
          return json(400, { error: `"${p.name}" has an invalid price.` });
        }
      }

      const slugs = products.map((p) => p.slug);
      const dupe = slugs.find((s, i) => slugs.indexOf(s) !== i);
      if (dupe) return json(400, { error: `Duplicate slug: "${dupe}".` });

      const commit = await writeProducts(
        GITHUB_TOKEN,
        products,
        baseCommit,
        changed
      );
      return json(200, { commit, saved: products.length });
    }

    return json(404, { error: "Unknown route." });
  } catch (err) {
    return json(err.status === 409 ? 409 : 500, {
      error: err.message || "Unexpected error.",
    });
  }
}

