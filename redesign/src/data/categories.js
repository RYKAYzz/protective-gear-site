/**
 * Categories are one JSON file each, under src/data/categories/.
 *
 * Same reason as products: Decap renders a folder collection as a proper
 * grid, whereas a single file behind a list widget shows as one blank card.
 *
 * `order` fixes the display sequence, since files load alphabetically.
 */
const modules = import.meta.glob("./categories/*.json", { eager: true });

export const categories = Object.values(modules)
  .map((m) => m.default ?? m)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const getCategory = (slug) => categories.find((c) => c.slug === slug);

/** "head-protection" -> "Head protection" */
export const labelFor = (slug) =>
  slug
    ? slug.replace(/-/g, " ").replace(/^./, (ch) => ch.toUpperCase())
    : "Other";
