/* ARK Hygiene — staff admin.
   Talks to /api/staff (a Netlify Function). The GitHub token never leaves
   the server; this file only ever holds a short-lived session token. */

const API = "/api/staff";
const KEY = "ark_staff_token";
const CATEGORIES = window.__CATEGORIES__ || [];

/* Preset units, plus a free-text option — "set of 50", "roll of 100" and
   similar are common and no fixed list would cover them. */
const UNITS = [
  "piece",
  "pair",
  "box",
  "pack",
  "carton",
  "roll",
  "set",
  "litre",
  "unit",
];

/* Drafts are mirrored to localStorage on every keystroke, so a refresh, a
   closed tab or a stray Log out no longer throws away everything typed.
 *
 * Publishing stays MANUAL and deliberate. Each publish is a git commit, and
 * every commit triggers a Netlify build — auto-committing as you type would
 * burn the account's monthly build minutes in an afternoon. Edit freely,
 * publish once. */
const DRAFT_KEY = "ark_staff_draft";

let products = [];
let baseCommit = null;
let dirty = new Set();
let editing = null;

const $ = (id) => document.getElementById(id);
const token = () => sessionStorage.getItem(KEY);

/* ------------------------------------------------------------- drafts --- */

function saveDraft() {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ baseCommit, products, dirty: [...dirty], at: Date.now() })
    );
  } catch {
    /* private mode or quota — nothing else to fall back on */
  }
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

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
  if (tone === "ok") setTimeout(() => (el.textContent = ""), 5000);
}

function markDirty(slug) {
  dirty.add(slug);
  $("save").disabled = false;
  saveDraft();
  status(
    `${dirty.size} unpublished change${dirty.size === 1 ? "" : "s"} — kept on this device`
  );
}

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const priceLabel = (p) =>
  p.price
    ? `From KSh ${Number(p.price).toLocaleString()}${p.unit ? " / " + esc(p.unit) : ""}`
    : "No price set";

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
  if (dirty.size && !confirm(`You have ${dirty.size} unsaved change(s). They are kept on this device and will reappear next time. Log out anyway?`)) return;
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
    baseCommit = data.baseCommit;
    dirty.clear();
    $("save").disabled = true;

    // Recover anything typed but never committed — a refresh or a closed tab
    // must not cost work.
    const draft = loadDraft();
    if (draft?.dirty?.length && Array.isArray(draft.products)) {
      products = draft.products;
      dirty = new Set(draft.dirty);
      $("save").disabled = false;
      status(
        draft.baseCommit === baseCommit
          ? `Recovered ${dirty.size} unsaved change${dirty.size === 1 ? "" : "s"} from your last session.`
          : `Recovered ${dirty.size} unsaved change${dirty.size === 1 ? "" : "s"}, but the catalogue changed elsewhere since — check them before they save.`,
        "ok"
      );
    }

    render();
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
    $("grid").innerHTML = `<p class="empty">No products match.</p>`;
    return;
  }

  $("grid").innerHTML = items
    .map((p) => {
      const cat = CATEGORIES.find((c) => c.slug === p.category);
      return `
      <button class="card" data-slug="${esc(p.slug)}" data-dirty="${dirty.has(p.slug)}">
        <span class="card__media">
          ${
            p.image
              ? `<img src="${esc(encodeURI(p.image))}" alt="" loading="lazy" />`
              : `<span class="card__media--empty">No image</span>`
          }
        </span>
        <span class="card__body">
          <span class="card__name">${esc(p.name)}</span>
          <span class="card__cat">${esc(cat ? cat.name : p.category || "—")}</span>
          <span class="card__price${p.price ? "" : " card__price--none"}">${priceLabel(p)}</span>
        </span>
      </button>`;
    })
    .join("");
}

/* -------------------------------------------------------------- editor --- */

function openEditor(slug) {
  const p = products.find((x) => x.slug === slug);
  if (!p) return;
  editing = slug;

  const isPreset = !p.unit || UNITS.includes(p.unit);

  $("editor-body").innerHTML = `
    <div class="field">
      <label>Image</label>
      <div class="imagebox">
        ${
          p.image
            ? `<img id="img-preview" src="${esc(encodeURI(p.image))}" alt="" />`
            : `<span class="imagebox__none" id="img-preview">No image yet</span>`
        }
        <span class="imagebox__path" id="img-path">${esc(p.image || "")}</span>
        <span class="imagebox__actions">
          <button type="button" class="btn btn--ghost" data-act="pick">Upload image</button>
          ${p.image ? `<button type="button" class="btn btn--ghost" data-act="clear-img">Remove</button>` : ""}
        </span>
        <input type="file" id="img-file" accept="image/*" hidden />
      </div>
      <span class="field__hint">PNG or JPG, plain background, up to 5MB.</span>
    </div>

    <label class="field"><span>Product name</span>
      <input data-f="name" value="${esc(p.name)}" /></label>

    <label class="field"><span>Slug</span>
      <input data-f="slug" value="${esc(p.slug)}" />
      <span class="field__hint">Lowercase with hyphens. Avoid changing once live.</span>
    </label>

    <label class="field"><span>Description</span>
      <textarea data-f="description" rows="3">${esc(p.description || "")}</textarea></label>

    <div class="grid2">
      <label class="field"><span>Category</span>
        <select data-f="category">
          ${CATEGORIES.map(
            (c) =>
              `<option value="${esc(c.slug)}"${c.slug === p.category ? " selected" : ""}>${esc(c.name)}</option>`
          ).join("")}
        </select></label>
      <label class="field"><span>Sub-category</span>
        <input data-f="subcategory" value="${esc(p.subcategory || "")}" placeholder="hand-protection" /></label>
    </div>

    <div class="grid2">
      <label class="field"><span>Price — from (KSh)</span>
        <input data-f="price" type="number" min="0" value="${p.price ?? ""}" placeholder="Leave blank to hide" /></label>
      <label class="field"><span>Price is per…</span>
        <select id="unit-select">
          <option value=""${!p.unit ? " selected" : ""}>— not set —</option>
          ${UNITS.map(
            (u) =>
              `<option value="${u}"${p.unit === u ? " selected" : ""}>${u[0].toUpperCase() + u.slice(1)}</option>`
          ).join("")}
          <option value="__custom"${!isPreset ? " selected" : ""}>Custom…</option>
        </select></label>
    </div>

    <label class="field" id="unit-custom-wrap"${isPreset ? " hidden" : ""}>
      <span>Custom unit</span>
      <input id="unit-custom" data-f="unit" value="${esc(isPreset ? "" : p.unit)}" placeholder="e.g. set of 50, box of 100" />
      <span class="field__hint">Shown to customers as "From KSh 2,500 per set of 50".</span>
    </label>

    <label class="field"><span>Sort position</span>
      <input data-f="order" type="number" value="${p.order ?? 999}" />
      <span class="field__hint">Lower numbers appear first within a category.</span>
    </label>
  `;

  $("editor").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeEditor() {
  $("editor").hidden = true;
  document.body.style.overflow = "";
  editing = null;
  render();
}

$("grid").addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) openEditor(card.dataset.slug);
});

$("editor").addEventListener("click", (e) => {
  if (e.target.closest('[data-act="close"]')) return closeEditor();

  if (e.target.closest('[data-act="delete"]')) {
    const p = products.find((x) => x.slug === editing);
    if (!p) return;
    if (!confirm(`Delete "${p.name}"? This cannot be undone once saved.`)) return;
    products = products.filter((x) => x.slug !== editing);
    markDirty(editing);
    closeEditor();
    return;
  }

  if (e.target.closest('[data-act="pick"]')) $("img-file").click();

  if (e.target.closest('[data-act="clear-img"]')) {
    const p = products.find((x) => x.slug === editing);
    if (!p) return;
    p.image = "";
    markDirty(p.slug);
    openEditor(p.slug);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("editor").hidden) closeEditor();
});

/* --------------------------------------------------------- field edits --- */

$("editor").addEventListener("input", (e) => {
  const field = e.target.dataset.f;
  if (!field || !editing) return;
  const p = products.find((x) => x.slug === editing);
  if (!p) return;

  let value = e.target.value;
  if (field === "price") value = value === "" ? null : Number(value);
  if (field === "order") value = value === "" ? 999 : Number(value);
  if (field === "slug") value = slugify(value);

  const previous = p.slug;
  p[field] = value;

  markDirty(field === "slug" ? previous : p.slug);
  if (field === "slug") editing = p.slug;
});

$("editor").addEventListener("change", (e) => {
  if (e.target.id !== "unit-select" || !editing) return;
  const p = products.find((x) => x.slug === editing);
  if (!p) return;

  const wrap = $("unit-custom-wrap");
  if (e.target.value === "__custom") {
    wrap.hidden = false;
    $("unit-custom").focus();
    p.unit = $("unit-custom").value || "";
  } else {
    wrap.hidden = true;
    p.unit = e.target.value;
  }
  markDirty(p.slug);
});

/* -------------------------------------------------------------- upload --- */

$("editor").addEventListener("change", async (e) => {
  if (e.target.id !== "img-file") return;
  const file = e.target.files?.[0];
  if (!file || !editing) return;

  if (file.size > 5 * 1024 * 1024) {
    status("Image is larger than 5MB.", "err");
    return;
  }

  status("Uploading image…");
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error("Could not read that file."));
      r.readAsDataURL(file);
    });

    const { path } = await api("/upload", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, dataUrl }),
    });

    const p = products.find((x) => x.slug === editing);
    p.image = path;
    markDirty(p.slug);
    openEditor(p.slug);
    status("Image uploaded.", "ok");
  } catch (err) {
    status(err.message, "err");
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
    subcategory: "",
    price: null,
    unit: "",
    order: 999,
  };
  products.unshift(p);
  $("search").value = "";
  $("filter").value = "";
  markDirty(p.slug);
  render();
  openEditor(p.slug);
});

/* ---------------------------------------------------------------- save --- */

let saving = false;

async function commit({ auto = false } = {}) {
  if (saving || !dirty.size) return;
  saving = true;
  $("save").disabled = true;
  status(auto ? "Saving…" : "Saving…");

  try {
    const res = await api("/products", {
      method: "PUT",
      body: JSON.stringify({ products, baseCommit, changed: [...dirty] }),
    });
    baseCommit = res.commit;
    dirty.clear();
    clearDraft();
    render();
    status("Saved. The site rebuilds — live in about a minute.", "ok");
  } catch (e) {
    // The draft stays on disk, so nothing typed is lost by a failed save.
    status(`${e.message} Your changes are kept — try Save again.`, "err");
    $("save").disabled = false;
  } finally {
    saving = false;
  }
}

$("save").addEventListener("click", () => commit());

// Last resort: flush to disk if the tab is being closed mid-edit.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && dirty.size) saveDraft();
});

/* --------------------------------------------------------------- misc ---- */

$("search").addEventListener("input", render);
$("filter").addEventListener("change", render);

window.addEventListener("beforeunload", (e) => {
  if (dirty.size) e.preventDefault();
});

if (token()) start();
