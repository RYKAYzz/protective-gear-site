/**
 * Self-contained admin API.
 *
 * No Netlify Identity, no Git Gateway, no OAuth app. One password that you
 * set, and a GitHub token that only this function ever sees.
 *
 * Required environment variables (Netlify > Project configuration >
 * Environment variables):
 *   ADMIN_PASSWORD  the password you type at /admin
 *   ADMIN_SECRET    any long random string; signs the session token
 *   GITHUB_TOKEN    a GitHub fine-grained token with Contents: read & write
 *                   on RYKAYzz/protective-gear-site
 *
 * Routes (all under /api/admin):
 *   POST /login      { password }        -> { token }
 *   GET  /products                       -> { products, sha }
 *   PUT  /products   { products, sha }   -> { sha }   (commits to main)
 */

import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

const REPO = "RYKAYzz/protective-gear-site";
const BRANCH = "main";
const FILE = "redesign/src/data/products.json";
const SESSION_HOURS = 12;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

/* ---------------------------------------------------------------- auth --- */

const b64url = (buf) =>
  Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

function sign(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const mac = b64url(createHmac("sha256", secret).update(body).digest());
  return `${body}.${mac}`;
}

function verify(token, secret) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = b64url(createHmac("sha256", secret).update(body).digest());
  // Compare in constant time; bail if lengths differ, which timingSafeEqual
  // would otherwise throw on.
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64").toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time password comparison that does not leak length via throw. */
function passwordMatches(given, expected) {
  if (typeof given !== "string" || typeof expected !== "string") return false;
  const a = createHmac("sha256", "pw").update(given).digest();
  const b = createHmac("sha256", "pw").update(expected).digest();
  return timingSafeEqual(a, b);
}

function requireSession(req, secret) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  return token ? verify(token, secret) : null;
}

/* -------------------------------------------------------------- github --- */

async function gh(path, token, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "ark-hygiene-admin",
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

async function readProducts(token) {
  const file = await gh(
    `/repos/${REPO}/contents/${encodeURI(FILE)}?ref=${BRANCH}`,
    token
  );
  const content = Buffer.from(file.content, "base64").toString("utf8");
  const parsed = JSON.parse(content);
  return { products: parsed.products || [], sha: file.sha };
}

async function writeProducts(token, products, sha) {
  const content = Buffer.from(
    JSON.stringify({ products }, null, 2) + "\n"
  ).toString("base64");

  const res = await gh(`/repos/${REPO}/contents/${encodeURI(FILE)}`, token, {
    method: "PUT",
    body: JSON.stringify({
      message: `Update catalogue from admin (${products.length} products)`,
      content,
      sha,
      branch: BRANCH,
    }),
  });
  return res.content.sha;
}

/* --------------------------------------------------------------- routes --- */

export default async function handler(req) {
  const { ADMIN_PASSWORD, ADMIN_SECRET, GITHUB_TOKEN } = process.env;

  if (!ADMIN_PASSWORD || !ADMIN_SECRET || !GITHUB_TOKEN) {
    return json(500, {
      error:
        "Admin is not configured. Set ADMIN_PASSWORD, ADMIN_SECRET and GITHUB_TOKEN in Netlify environment variables.",
    });
  }

  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/admin\/?/, "").replace(/\/$/, "");

  try {
    /* ---- login ---- */
    if (route === "login" && req.method === "POST") {
      const { password } = await req.json().catch(() => ({}));
      if (!passwordMatches(password, ADMIN_PASSWORD)) {
        // Uniform delay so failures are not obviously faster than successes.
        await new Promise((r) => setTimeout(r, 400));
        return json(401, { error: "Incorrect password." });
      }
      const token = sign(
        { sid: randomUUID(), exp: Date.now() + SESSION_HOURS * 3600 * 1000 },
        ADMIN_SECRET
      );
      return json(200, { token, expiresInHours: SESSION_HOURS });
    }

    /* ---- everything below needs a session ---- */
    const session = requireSession(req, ADMIN_SECRET);
    if (!session) return json(401, { error: "Session expired. Log in again." });

    if (route === "products" && req.method === "GET") {
      return json(200, await readProducts(GITHUB_TOKEN));
    }

    if (route === "products" && req.method === "PUT") {
      const { products, sha } = await req.json().catch(() => ({}));

      if (!Array.isArray(products)) {
        return json(400, { error: "products must be an array." });
      }
      if (!sha) {
        return json(400, { error: "Missing sha — reload before saving." });
      }

      // Validate before committing: a bad write here breaks the live build.
      for (const [i, p] of products.entries()) {
        if (!p || typeof p.name !== "string" || !p.name.trim()) {
          return json(400, { error: `Product ${i + 1} needs a name.` });
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug || "")) {
          return json(400, {
            error: `"${p.name}" needs a slug in lowercase-with-hyphens form.`,
          });
        }
        if (!p.image) {
          return json(400, { error: `"${p.name}" needs an image path.` });
        }
        if (p.price != null && (isNaN(p.price) || Number(p.price) < 0)) {
          return json(400, { error: `"${p.name}" has an invalid price.` });
        }
      }

      const slugs = products.map((p) => p.slug);
      const dupe = slugs.find((s, i) => slugs.indexOf(s) !== i);
      if (dupe) return json(400, { error: `Duplicate slug: "${dupe}".` });

      try {
        const newSha = await writeProducts(GITHUB_TOKEN, products, sha);
        return json(200, { sha: newSha, saved: products.length });
      } catch (err) {
        if (err.status === 409) {
          return json(409, {
            error:
              "Someone else saved while you were editing. Reload and reapply your change.",
          });
        }
        throw err;
      }
    }

    return json(404, { error: "Unknown route." });
  } catch (err) {
    return json(err.status === 401 ? 502 : 500, {
      error: err.message || "Unexpected error.",
    });
  }
}

export const config = {
  path: "/api/admin/*",
};
