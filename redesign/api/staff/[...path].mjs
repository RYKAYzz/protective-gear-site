/**
 * Vercel adapter for the staff admin API.
 *
 * Vercel's Node runtime hands us (req, res) in Node's own shape, while the
 * logic in lib/staff-core.mjs speaks Web Request/Response — the same shape
 * Netlify Functions use. Translating here keeps the business logic identical
 * on both hosts, so changing provider never means rewriting the admin.
 */
import { handleStaff } from "../../lib/staff-core.mjs";

export default async function handler(req, res) {
  // Node gives the path without an origin; Request needs an absolute URL.
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = `${proto}://${host}${req.url}`;

  // Vercel pre-parses JSON bodies; re-serialise so the core can read it once.
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody
    ? typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body ?? {})
    : undefined;

  const response = await handleStaff(
    new Request(url, {
      method: req.method,
      headers: new Headers(req.headers),
      body,
    })
  );

  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.send(await response.text());
}
