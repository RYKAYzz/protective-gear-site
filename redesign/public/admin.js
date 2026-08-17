/* ARK Hygiene — catalogue admin client.
   Talks to /api/admin (a Netlify Function). The GitHub token never leaves
   the server; this file only ever holds a short-lived session token. */

const API = "/api/admin";
const KEY = "ark_admin_token";
const CATEGORIES = window.__CATEGORIES__ || [];

let products = [];
let sha = null;
let dirty = new Set();
let openSlug = null;

const $ = (id) => document.getElementById(id);
const token = () => sessionStorage.getItem(KEY);

/* ------------------------------------------------------------- helpers --- */

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token() ? { authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

function status(message, tone = "") {
  const el = $("status");
  el.textContent = message;
  el.dataset.tone = tone;
  if (tone === "ok") setTimeout(() => (el.textContent = ""), 4000);
}

function markDirty(slug) {
  dirty.add(slug);
  $("save").disabled = false;
  const row = document.querySelector(`[data-slug="${CSS.escape(slug)}"]`);
  if (row) row.dataset.dirty = "true";
  status(`${dirty.size} unsaved change${dirty.size === 1 ? "" : "s"}`);
}

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]
  );

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* ---------------------------------------------------------------- auth --- */

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("login-btn");
  const err = $("login-error");
  err.hidden = true;
  btn.disabled = true;
  btn.textContent = "Checking…";

  try {
    const { token: t } = await api("/login", {
      method: "POST",
      body: JSON.stringify({ password: $("pw").value }),
    });
    sessionStorage.setItem(KEY, t);
    await start();
  } catch (e2) {
    err.textContent = e2.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Log in";
  }
});

$("logout").addEventListener("click", () => {
  if (dirty.size && !confirm(`Discard ${dirty.size} unsaved change(s)?`)) return;
  sessionStorage.removeItem(KEY);
  location.reload();
});

/* ---------------------------------------------------------------- boot --- */

async function start() {
  $("login").hidden = true;
  $("app").hidden = false;
  status("Loading…");
  try {
    const data = await api("/products");
    products = data.products;
    sha = data.sha;
    dirty.clear();
    $("save").disabled = true;
    render();
    status("");
  } catch (e) {
    status(e.message, "err");
    if (/session/i.test(e.message)) {
      sessionStorage.removeItem(KEY);
      location.reload();
    }
  }
}

/* -------------------------------------------------------------- render --- */

function visible() {
  const q = $("search").value.trim().toLowerCase();
  const cat = $("filter").value;
  return products.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (!q) return true;
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.slug || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  });
}

function render() {
  const items = visible();
  $("count").textContent = `${products.length} products`;

  if (!items.length) {
    $("list").innerHTML = `<p class="empty">No products match.</p>`;
    return;
  }

  $("list").innerHTML = items
    .map((p) => {
      const open = p.slug === openSlug;
      const cat = CATEGORIES.find((c) => c.slug === p.category);
      return `
      <article class="row" data-slug="${esc(p.slug)}" data-open="${open}" data-dirty="${dirty.has(p.slug)}">
        <button class="row__head" data-act="toggle">
          <img class="row__thumb" src="${esc(encodeURI(p.image || ""))}" alt="" loading="lazy" />
          <span>
            <span class="row__name">${esc(p.name)}</span><br />
            <span class="row__meta">${esc(cat ? cat.name : p.category || "—")}${p.subcategory ? " · " + esc(p.subcategory) : ""}</span>
          </span>
          <span class="row__price">${p.price ? "KES " + Number(p.price).toLocaleString() : ""}</span>
          <span class="row__chev">&rsaquo;</span>
        </button>
        ${open ? body(p) : ""}
      </article>`;
    })
    .join("");
}

function body(p) {
  return `
  <div class="row__body">
    <div class="grid2">
      <label class="field"><span>Name</span>
        <input data-f="name" value="${esc(p.name)}" /></label>
      <label class="field"><span>Slug</span>
        <input data-f="slug" value="${esc(p.slug)}" /></label>
    </div>
    <label class="field"><span>Description</span>
      <textarea data-f="description" rows="2">${esc(p.description || "")}</textarea></label>
    <label class="field"><span>Image path</span>
      <input data-f="image" value="${esc(p.image || "")}" placeholder="/assets/PPE-safety-gear/face shield.png" /></label>
    <div class="grid2">
      <label class="field"><span>Category</span>
        <select data-f="category">
          ${CATEGORIES.map((c) => `<option value="${esc(c.slug)}"${c.slug === p.category ? " selected" : ""}>${esc(c.name)}</option>`).join("")}
        </select></label>
      <label class="field"><span>Sub-category</span>
        <input data-f="subcategory" value="${esc(p.subcategory || "")}" placeholder="hand-protection" /></label>
    </div>
    <label class="field"><span>Price (KES) — leave blank to hide</span>
      <input data-f="price" type="number" min="0" value="${p.price ?? ""}" /></label>
    <div class="row__actions">
      <button class="btn btn--danger" data-act="delete">Delete product</button>
    </div>
  </div>`;
}

/* ------------------------------------------------------------- editing --- */

$("list").addEventListener("click", (e) => {
  const row = e.target.closest(".row");
  if (!row) return;
  const slug = row.dataset.slug;

  if (e.target.closest('[data-act="toggle"]')) {
    openSlug = openSlug === slug ? null : slug;
    render();
    return;
  }

  if (e.target.closest('[data-act="delete"]')) {
    const p = products.find((x) => x.slug === slug);
    if (!confirm(`Delete "${p.name}"? This cannot be undone once saved.`)) return;
    products = products.filter((x) => x.slug !== slug);
    openSlug = null;
    markDirty(slug);
    render();
  }
});

$("list").addEventListener("input", (e) => {
  const field = e.target.dataset.f;
  if (!field) return;
  const row = e.target.closest(".row");
  const p = products.find((x) => x.slug === row.dataset.slug);
  if (!p) return;

  let value = e.target.value;
  if (field === "price") value = value === "" ? null : Number(value);
  if (field === "slug") value = slugify(value);

  const previous = p.slug;
  p[field] = value;

  markDirty(field === "slug" ? previous : p.slug);
  if (field === "slug") {
    row.dataset.slug = p.slug;
    openSlug = p.slug;
  }
});

/* ----------------------------------------------------------------- add --- */

$("add").addEventListener("click", () => {
  const p = {
    slug: `new-product-${Date.now().toString(36)}`,
    name: "New product",
    description: "",
    image: "",
    category: CATEGORIES[0]?.slug || "ppe-safety-gear",
    subcategory: null,
    price: null,
  };
  products.unshift(p);
  openSlug = p.slug;
  $("search").value = "";
  $("filter").value = "";
  markDirty(p.slug);
  render();
  document.querySelector(".row [data-f='name']")?.select();
});

/* ---------------------------------------------------------------- save --- */

$("save").addEventListener("click", async () => {
  const btn = $("save");
  btn.disabled = true;
  status("Saving…");
  try {
    const res = await api("/products", {
      method: "PUT",
      body: JSON.stringify({ products, sha }),
    });
    sha = res.sha;
    dirty.clear();
    render();
    status(`Saved ${res.saved} products. Live in about a minute.`, "ok");
  } catch (e) {
    status(e.message, "err");
    btn.disabled = false;
  }
});

/* --------------------------------------------------------------- misc ---- */

$("search").addEventListener("input", render);
$("filter").addEventListener("change", render);

window.addEventListener("beforeunload", (e) => {
  if (dirty.size) e.preventDefault();
});

if (token()) start();
