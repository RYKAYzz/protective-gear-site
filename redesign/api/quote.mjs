/** Vercel adapter for the quote form. See lib/quote-core.mjs. */
import { handleQuote } from "../lib/quote-core.mjs";

export default async function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";

  const body =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});

  const response = await handleQuote(
    new Request(`${proto}://${host}${req.url}`, {
      method: req.method,
      headers: new Headers(req.headers),
      body: req.method === "GET" ? undefined : body,
    })
  );

  res.status(response.status);
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await response.text());
}
