/**
 * Staff admin API — password login, no GitHub account required.
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
 *   PUT  /products  { products, baseCommit }      -> { commit, saved }
 *
 * Writes land as ONE commit via the git data API, so a multi-product save
 * cannot half-apply.
 */

import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

const REPO = "RYKAYzz/protective-gear-site";
const BRANCH = "main";
const DIR = "redesign/src/data/products";
const SESSION_HOURS = 12;
const CONCURRENCY = 10;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/* ---------------------------------------------------------------- auth --- */

const b64url = (buf) =>
  Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const sign = (payload, secret) => {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${b64url(createHmac("sha256", secret).update(body).digest())}`;
};

function verify(token, secret) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = b64url(createHmac("sha256", secret).update(body).digest());
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64").toString());
    return payload.exp && Date.now() < payload.exp ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Constant-time compare that does not throw on differing lengths.
 *
 * Both sides are trimmed: pasting a value into Netlify's env var field very
 * easily carries a trailing space or newline, and a password that fails for
 * an invisible character is impossible to debug from the login screen.
 * Leading/trailing whitespace is not meaningful in a password anyway.
 */
function passwordMatches(given, expected) {
  if (typeof given !== "string" || typeof expected !== "string") return false;
  const a = createHmac("sha256", "pw").update(given.trim()).digest();
  const b = createHmac("sha256", "pw").update(expected.trim()).digest();
  return timingSafeEqual(a, b);
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

/** Run tasks with a small concurrency cap so 74 files do not open 74 sockets. */
async function pooled(items, worker, limit = CONCURRENCY) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const index = i++;
        out[index] = await worker(items[index]);
      }
    })
  );
  return out;
}

async function headCommit(token) {
  const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`, token);
  return ref.object.sha;
}

async function readProducts(token) {
  const commit = await headCommit(token);
  const { tree } = await gh(
    `/repos/${REPO}/git/trees/${commit}?recursive=1`,
    token
  );

  const files = tree.filter(
    (t) => t.type === "blob" && t.path.startsWith(`${DIR}/`) && t.path.endsWith(".json")
  );

  const products = await pooled(files, async (f) => {
    const blob = await gh(`/repos/${REPO}/git/blobs/${f.sha}`, token);
    const raw = Buffer.from(blob.content, "base64").toString("utf8");
    return { ...JSON.parse(raw), _path: f.path };
  });

  products.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { products, baseCommit: commit };
}

async function writeProducts(token, products, baseCommit) {
  const current = await headCommit(token);
  if (current !== baseCommit) {
    const err = new Error(
      "Someone else saved while you were editing. Reload and reapply your change."
    );
    err.status = 409;
    throw err;
  }

  const { tree: oldTree } = await gh(
    `/repos/${REPO}/git/trees/${current}?recursive=1`,
    token
  );
  const existing = new Set(
    oldTree
      .filter((t) => t.type === "blob" && t.path.startsWith(`${DIR}/`))
      .map((t) => t.path)
  );

  // One blob per product, then a single tree and commit.
  const entries = await pooled(products, async (p) => {
    const { _path, ...clean } = p;
    const path = `${DIR}/${p.slug}.json`;
    const blob = await gh(`/repos/${REPO}/git/blobs`, token, {
      method: "POST",
      body: JSON.stringify({
        content: JSON.stringify(clean, null, 2) + "\n",
        encoding: "utf-8",
      }),
    });
    return { path, mode: "100644", type: "blob", sha: blob.sha };
  });

  // Anything that existed but is no longer present has been deleted.
  const kept = new Set(entries.map((e) => e.path));
  for (const path of existing) {
    if (!kept.has(path)) {
      entries.push({ path, mode: "100644", type: "blob", sha: null });
    }
  }

  const newTree = await gh(`/repos/${REPO}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({ base_tree: current, tree: entries }),
  });

  const commit = await gh(`/repos/${REPO}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({
      message: `Update catalogue from staff admin (${products.length} products)`,
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

export default async function handler(req) {
  const { STAFF_PASSWORD, STAFF_SECRET, GITHUB_TOKEN } = process.env;

  if (!STAFF_PASSWORD || !STAFF_SECRET || !GITHUB_TOKEN) {
    return json(500, {
      error:
        "Staff admin is not configured. Set STAFF_PASSWORD, STAFF_SECRET and GITHUB_TOKEN in Netlify environment variables.",
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
      return json(200, {
        staffPasswordSet: Boolean(STAFF_PASSWORD),
        staffPasswordLength: STAFF_PASSWORD.trim().length,
        staffSecretSet: Boolean(STAFF_SECRET),
        staffSecretLength: STAFF_SECRET.trim().length,
        githubTokenSet: Boolean(GITHUB_TOKEN),
        github,
      });
    }

    if (route === "login" && req.method === "POST") {
      const { password } = await req.json().catch(() => ({}));
      if (!passwordMatches(password, STAFF_PASSWORD)) {
        await new Promise((r) => setTimeout(r, 400));
        return json(401, { error: "Incorrect password." });
      }
      return json(200, {
        token: sign(
          { sid: randomUUID(), exp: Date.now() + SESSION_HOURS * 3600 * 1000 },
          STAFF_SECRET
        ),
      });
    }

    const auth = req.headers.get("authorization") || "";
    const session = auth.startsWith("Bearer ")
      ? verify(auth.slice(7), STAFF_SECRET)
      : null;
    if (!session) return json(401, { error: "Session expired. Log in again." });

    if (route === "products" && req.method === "GET") {
      return json(200, await readProducts(GITHUB_TOKEN));
    }

    if (route === "products" && req.method === "PUT") {
      const { products, baseCommit } = await req.json().catch(() => ({}));

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

      const commit = await writeProducts(GITHUB_TOKEN, products, baseCommit);
      return json(200, { commit, saved: products.length });
    }

    return json(404, { error: "Unknown route." });
  } catch (err) {
    return json(err.status === 409 ? 409 : 500, {
      error: err.message || "Unexpected error.",
    });
  }
}

export const config = { path: "/api/staff/*" };
