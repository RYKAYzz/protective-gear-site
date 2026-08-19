/**
 * Quote request handler — platform-agnostic.
 *
 * Replaces Netlify Forms, which does not exist on Vercel. Takes a Web
 * Request, returns a Web Response; thin adapters wrap it per host.
 *
 * Required environment variables:
 *   RESEND_API_KEY   from resend.com — free tier covers this volume
 *   QUOTE_TO         where enquiries land (defaults to the site address)
 *   QUOTE_FROM       verified sender, e.g. "ARK Hygiene <quotes@yourdomain>"
 *
 * A lead that vanishes silently is worse than a visible error, so a
 * misconfiguration returns a clear failure rather than pretending to send.
 */

const TO = process.env.QUOTE_TO || "antoinette@gohorizonapp.co";
const FROM = process.env.QUOTE_FROM || "ARK Hygiene <onboarding@resend.dev>";

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const clean = (v, max = 2000) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

export async function handleQuote(req) {
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  let data = {};
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await req.json();
    } else {
      // Also accept a plain form post, so the form still works without JS.
      data = Object.fromEntries(new URLSearchParams(await req.text()));
    }
  } catch {
    return json(400, { error: "Could not read that submission." });
  }

  // Honeypot: hidden from people, tempting to bots. Accept silently so the
  // bot believes it succeeded and does not retry.
  if (clean(data["company-website"])) return json(200, { ok: true });

  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  const message = clean(data.message, 4000);
  const organisation = clean(data.organisation, 160);
  const phone = clean(data.phone, 60);
  const category = clean(data.category, 120);

  if (!name) return json(400, { error: "Please give your name." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(400, { error: "Please give a valid email address." });
  }
  if (!message) return json(400, { error: "Please tell us what you need." });

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return json(500, {
      error:
        "Quote requests are not configured yet. Please call or WhatsApp +254 716 253 184.",
    });
  }

  const rows = [
    ["Name", name],
    ["Organisation", organisation || "—"],
    ["Email", email],
    ["Phone", phone || "—"],
    ["Product area", category || "—"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6e645b">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#1a1512;line-height:1.6">
      <h2 style="margin:0 0 16px">New quote request</h2>
      <table style="border-collapse:collapse;margin-bottom:20px">${rows}</table>
      <p style="margin:0 0 6px;color:#6e645b">What they need</p>
      <div style="padding:12px 14px;background:#f4eee5;border-radius:6px;white-space:pre-wrap">${escapeHtml(message)}</div>
      <p style="margin-top:20px;color:#938a80;font-size:13px">
        Sent from arkhygienesolutions.com
      </p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email, // replying goes straight back to the customer
      subject: `Quote request — ${name}${organisation ? `, ${organisation}` : ""}`,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend failed:", res.status, detail);
    return json(502, {
      error:
        "We could not send that just now. Please call or WhatsApp +254 716 253 184.",
    });
  }

  return json(200, { ok: true });
}
