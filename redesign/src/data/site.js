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
 * WhatsApp is answered on a different line from the one the call button
 * dials — see `whatsapp` below.
 */
const phones = [
  { display: "+254 716 253 184", href: "tel:+254716253184" },
  { display: "+254 712 773 220", href: "tel:+254712773220" },
];

const whatsappLine = phones[1];

export const site = {
  name: "ARK Hygiene Solutions",
  founded: 2018,
  phones,
  phone: phones[0].display,
  phoneHref: phones[0].href,

  // WhatsApp is answered on the second line, not the first. The chat button
  // and every product enquiry link go there, while the call button, the
  // header and the page-foot CTAs keep dialling the primary. Derived from
  // the list so the two can never drift apart, and carried alongside as a
  // display string because the chat button has to say which number it is
  // reaching for anyone using a screen reader.
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
