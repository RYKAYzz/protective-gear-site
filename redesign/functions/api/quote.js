/** Cloudflare Pages Functions adapter for the quote form. */
import { handleQuote } from "../../lib/quote-core.mjs";

export const onRequest = (context) => handleQuote(context.request, context.env);
