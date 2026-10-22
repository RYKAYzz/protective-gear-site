import { site } from "./site.js";

/**
 * Builds a WhatsApp deep link that carries the product the buyer is looking at.
 *
 * A bare "WhatsApp us" button starts every conversation from nothing: the
 * buyer sends "how much?" without saying which product, and staff reply
 * asking which one. That round trip is where enquiries go cold.
 *
 * So the message states the product, the price the buyer actually saw, and
 * the page it was seen on — then leaves exactly two blanks. Quantity and
 * delivery location are what every quote needs and what a buyer can answer
 * without thinking, and a message that is already half-written is far more
 * likely to be sent than an empty box.
 *
 * Quoting the seen price matters beyond convenience: prices move, and a
 * buyer working from a figure they saw last week is a dispute waiting to
 * happen. Staff can see immediately what was on screen.
 */
export function productEnquiry({ name, price, unit, url } = {}) {
  const lines = [`Hello ${site.name}.`, "", `Product: ${name}`];

  // Only when a price is actually listed. Most lines are quoted rather than
  // listed, and inventing "price on request" here would just be noise in a
  // message the buyer has to read before sending.
  if (typeof price === "number" && price > 0) {
    const amount = price.toLocaleString("en-KE");
    const per = unit && unit.trim() ? ` per ${unit.trim()}` : "";
    lines.push(`Listed price: From KSh ${amount}${per}`);
  }

  if (url) lines.push(`Page: ${url}`);

  lines.push("", "Quantity needed:", "Delivery location:");

  return `${site.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
}
