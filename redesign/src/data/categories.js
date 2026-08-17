import data from "./categories.json";

/**
 * Category metadata. The data itself lives in categories.json so the admin
 * at /admin can edit it; this module adds the helpers around it.
 *
 * The homepage index, the generated category pages, /products and the
 * footer all read from here.
 */
export const categories = data.categories;

export const getCategory = (slug) => categories.find((c) => c.slug === slug);

/** "head-protection" -> "Head protection" */
export const labelFor = (slug) =>
  slug
    ? slug.replace(/-/g, " ").replace(/^./, (ch) => ch.toUpperCase())
    : "Other";
