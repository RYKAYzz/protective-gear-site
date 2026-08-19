/**
 * Netlify adapter for the staff admin API.
 *
 * Netlify Functions already speak Web Request/Response, so this is a
 * pass-through. The logic lives in lib/staff-core.mjs and is shared with the
 * Vercel adapter, so the site can run on either host unchanged.
 */
import { handleStaff } from "../../lib/staff-core.mjs";

export default async function handler(req) {
  return handleStaff(req);
}

export const config = { path: "/api/staff/*" };
