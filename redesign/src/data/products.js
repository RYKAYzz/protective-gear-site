/**
 * Products are one JSON file each, under src/data/products/.
 *
 * That shape is what makes the admin usable: Decap renders a folder
 * collection as a searchable, sortable grid of entries, rather than one
 * blank card hiding a 74-row accordion.
 *
 * `order` preserves the original catalogue sequence, since files load
 * alphabetically.
 */
const modules = import.meta.glob("./products/*.json", { eager: true });

export const products = Object.values(modules)
  .map((m) => m.default ?? m)
  .map((p) => ({
    ...p,
    // Blank strings come back from the admin's optional fields; normalise
    // them so templates only ever test for null.
    description: p.description || null,
    subcategory: p.subcategory || null,
    price: p.price === "" || p.price === undefined ? null : p.price,
  }))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const byCategory = (slug) =>
  products.filter((p) => p.category === slug);

export const total = products.length;
