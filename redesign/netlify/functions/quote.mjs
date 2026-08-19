/** Netlify adapter for the quote form. See lib/quote-core.mjs. */
import { handleQuote } from "../../lib/quote-core.mjs";

export default async function handler(req) {
  return handleQuote(req);
}

export const config = { path: "/api/quote" };
