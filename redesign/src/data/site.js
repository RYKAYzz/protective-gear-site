/**
 * Single source of truth for company details. Every page, the header, the
 * footer and the structured data read from here — change it once.
 */
/**
 * Reachable lines, primary first.
 *
 * The old primary, +254 716 253 184, was lost and has been taken off the site
 * entirely: a number nobody can answer is worse than one fewer number. It is
 * still in git history if that line is ever recovered.
 *
 * This stays an array even with a single entry, because the places with room
 * for more than one line — the contact page, the footer, the structured data —
 * walk it, so restoring a second line is a one-line change here and nothing
 * else. The header and the floating call button have room for only one and
 * use `phone` / `phoneHref`, which are the first entry.
 */
const phones = [{ display: "+254 712 773 220", href: "tel:+254712773220" }];

const whatsappLine = phones[0];

export const site = {
  name: "ARK Hygiene Solutions",
  founded: 2018,
  phones,
  phone: phones[0].display,
  phoneHref: phones[0].href,

  // WhatsApp is answered on this same line. Derived from the list rather than
  // written out again so the link and the number shown beside it cannot
  // drift apart, and carried as a display string too because the chat button
  // has to say which number it is reaching for anyone using a screen reader.
  whatsapp: `https://wa.me/${whatsappLine.href.replace("tel:+", "")}`,
  whatsappNumber: whatsappLine.display,
  email: "arkhygieneexperts@gmail.com",
  address: {
    line1: "Tumaini House, Room 310",
    line2: "CBD, Nairobi",
    poBox: "P.O. Box 28255-00100",
    country: "Kenya",
  },
  certification: "ISO 13485",
  facilitiesServed: "500+",
  reviews: { count: 28, rating: 4.8 },
};

export const nav = [
  { label: "Products", href: "/#products" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];
