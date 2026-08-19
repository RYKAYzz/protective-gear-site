/**
 * Cloudflare Pages Functions adapter for the staff admin API.
 *
 * Workers already speak Web Request/Response, so this is nearly a
 * pass-through — the one difference from Node hosts is that environment
 * variables arrive on the context rather than process.env.
 */
import { handleStaff } from "../../../lib/staff-core.mjs";

export const onRequest = (context) => handleStaff(context.request, context.env);
