/**
 * Cloudflare Worker entry.
 *
 * Cloudflare's newer Workers-with-static-assets model uses a single entry
 * point rather than a functions/ directory. Everything except /api/* is
 * served straight from the built site; the API paths reuse the same cores
 * as the Netlify and Vercel adapters.
 */
import { handleStaff } from "./lib/staff-core.mjs";
import { handleQuote } from "./lib/quote-core.mjs";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // env carries the dashboard's environment variables — Workers has no
    // process.env, which is why the cores take it as an argument.
    if (pathname.startsWith("/api/staff")) return handleStaff(request, env);
    if (pathname === "/api/quote") return handleQuote(request, env);

    return env.ASSETS.fetch(request);
  },
};
