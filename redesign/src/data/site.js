/**
 * Single source of truth for company details. Every page, the header, the
 * footer and the structured data read from here — change it once.
 */
/**
 * Reachable lines, primary first.
 *
 * Most of the site can only show one. The header has no room for two, and a
 * floating call button dials a single number — those places use `phone` and
 * `phoneHref` below, which are just the first entry. The contact page, the
 * footer and the structured data have room for every line, so they walk this
 * array instead.
 *
 * WhatsApp runs on the primary line only.
 */
const phones = [
  { display: "+254 716 253 184", href: "tel:+254716253184" },
  { display: "+254 712 773 220", href: "tel:+254712773220" },
];

export const site = {
  name: "ARK Hygiene Solutions",
  founded: 2018,
  phones,
  phone: phones[0].display,
  phoneHref: phones[0].href,
  whatsapp: "https://wa.me/254716253184",
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
