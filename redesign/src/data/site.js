/**
 * Single source of truth for company details. Every page, the header, the
 * footer and the structured data read from here — change it once.
 */
export const site = {
  name: "ARK Hygiene Solutions",
  founded: 2018,
  phone: "+254 716 253 184",
  phoneHref: "tel:+254716253184",
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
