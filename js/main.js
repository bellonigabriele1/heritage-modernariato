const STATUS_LABEL = {
  available: "Disponibile",
  reserved: "In trattativa",
  sold: "Venduto"
};

const CATEGORY_LABEL = {
  lampade: "Lampade & Illuminazione",
  vetri: "Vetri d'Autore",
  arredi: "Arredi",
  sculture: "Sculture & Oggetti"
};

let DATA = null;

async function loadData() {
  if (DATA) return DATA;
  const res = await fetch("data/prodotti.json");
  DATA = await res.json();
  return DATA;
}

function fmtPrice(n) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function placeholderHTML(text) {
  return `<div class="placeholder-art">${text || "—"}</div>`;
}

function imageHTML(images, placeholder, alt) {
  if (images && images.length) {
    return `<img src="${images[0]}" alt="${alt || ""}" data-fallback="${(placeholder || "—").replace(/"/g, "&quot;")}">`;
  }
  return placeholderHTML(placeholder);
}

function setupImageFallbacks(scope = document) {
  scope.querySelectorAll("img[data-fallback]").forEach(img => {
    if (img.dataset.fallbackBound) return;
    img.dataset.fallbackBound = "1";
    const replaceWithPlaceholder = () => {
      const wrapper = document.createElement("div");
      wrapper.className = "placeholder-art";
      wrapper.textContent = img.dataset.fallback || "—";
      img.replaceWith(wrapper);
    };
    img.addEventListener("error", replaceWithPlaceholder);
    if (img.complete && img.naturalWidth === 0) replaceWithPlaceholder();
  });
}

function statusBadge(status) {
  if (status === "sold") return `<span class="badge badge--sold">${STATUS_LABEL.sold}</span>`;
  if (status === "reserved") return `<span class="badge badge--reserved">${STATUS_LABEL.reserved}</span>`;
  return `<span class="badge badge--available">${STATUS_LABEL.available}</span>`;
}

function priceFromTiers(tiers, qty) {
  const t = tiers.find(t => qty >= t.min && qty <= t.max);
  return t ? t.unit : tiers[0].unit;
}

function productCard(p) {
  let priceHTML;
  if (p.pricingTiers && p.quantity) {
    const minUnit = Math.min(...p.pricingTiers.map(t => t.unit));
    priceHTML = `
      <span class="price">da ${fmtPrice(minUnit)}<span class="price-suffix">/pezzo</span></span>
      <div class="card-qty-hint">fino a ${p.quantity.available} pezzi disponibili</div>
    `;
  } else if (p.priceOriginal) {
    priceHTML = `<span class="price struck">${fmtPrice(p.priceOriginal)}</span><span class="price">${fmtPrice(p.price)}</span>`;
  } else {
    priceHTML = `<span class="price">${fmtPrice(p.price)}</span>`;
  }
  return `
    <a class="card" href="prodotto.html?id=${p.id}">
      <div class="card-image">
        ${statusBadge(p.status)}
        ${imageHTML(p.images, p.placeholder, p.title)}
      </div>
      <div class="card-body">
        <div class="maker">${p.maker}</div>
        <div class="title">${p.title}</div>
        <div class="meta">${p.year}</div>
        <div>${priceHTML}</div>
      </div>
    </a>
  `;
}

// ============ HOME ============
async function renderHome() {
  const featuredEl = document.querySelector("[data-featured-grid]");
  if (!featuredEl) return;
  const data = await loadData();
  const featured = data.prodotti.filter(p => p.featured).slice(0, 6);
  featuredEl.innerHTML = featured.map(productCard).join("");
  setupImageFallbacks(featuredEl);
}

// ============ CATALOGO ============
async function renderCatalogo() {
  const gridEl = document.querySelector("[data-catalog-grid]");
  const filtersEl = document.querySelector("[data-catalog-filters]");
  if (!gridEl) return;

  const data = await loadData();
  const urlParams = new URLSearchParams(window.location.search);
  let activeCat = urlParams.get("cat") || "all";

  // Filters
  const filters = [{ id: "all", nome: "Tutti i pezzi" }, ...data.categorie];
  filtersEl.innerHTML = filters.map(f =>
    `<button class="filter-btn ${f.id === activeCat ? "active" : ""}" data-filter="${f.id}">${f.nome}</button>`
  ).join("");

  function render(cat) {
    activeCat = cat;
    const list = cat === "all" ? data.prodotti : data.prodotti.filter(p => p.category === cat);
    gridEl.innerHTML = list.length
      ? list.map(productCard).join("")
      : `<p style="color: var(--color-muted);">Nessun pezzo in questa categoria al momento.</p>`;
    setupImageFallbacks(gridEl);
    filtersEl.querySelectorAll(".filter-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.filter === cat)
    );
    // update URL
    const url = new URL(window.location);
    if (cat === "all") url.searchParams.delete("cat");
    else url.searchParams.set("cat", cat);
    history.replaceState({}, "", url);
  }

  filtersEl.addEventListener("click", e => {
    if (e.target.classList.contains("filter-btn")) {
      render(e.target.dataset.filter);
    }
  });

  render(activeCat);
}

// ============ PRODOTTO ============
async function renderProdotto() {
  const root = document.querySelector("[data-product-root]");
  if (!root) return;

  const data = await loadData();
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const p = data.prodotti.find(x => x.id === id);

  if (!p) {
    root.innerHTML = `<div style="padding: 4rem 0; text-align: center;">
      <h2>Pezzo non trovato</h2>
      <p><a href="catalogo.html">← Torna al catalogo</a></p>
    </div>`;
    return;
  }

  document.title = `${p.title} — ${p.maker} — Heritage Modernariato`;

  const hasTiers = Array.isArray(p.pricingTiers) && p.pricingTiers.length > 0 && p.quantity;

  let priceHTML;
  if (hasTiers) {
    const defaultQty = p.quantity.default || p.quantity.available;
    const defaultUnit = priceFromTiers(p.pricingTiers, defaultQty);
    const defaultTotal = defaultUnit * defaultQty;
    priceHTML = `
      <span class="price" data-total>${fmtPrice(defaultTotal)}</span>
      <span class="price-detail">
        <span data-qty>${defaultQty}</span> pezzi × <span data-unit>${fmtPrice(defaultUnit)}</span>/cad.
      </span>
    `;
  } else if (p.priceOriginal) {
    priceHTML = `<span class="price struck">${fmtPrice(p.priceOriginal)}</span><span class="price">${fmtPrice(p.price)}</span>`;
  } else {
    priceHTML = `<span class="price">${fmtPrice(p.price)}</span>`;
  }

  const statusClass = `status status--${p.status}`;
  const statusText = STATUS_LABEL[p.status];

  const specsHTML = Object.entries(p.specs || {})
    .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
    .join("");

  const images = p.images && p.images.length ? p.images : [];
  const fbAttr = `data-fallback="${(p.placeholder || "—").replace(/"/g, "&quot;")}"`;
  const mainImg = images.length
    ? `<img src="${images[0]}" alt="${p.title}" ${fbAttr}>`
    : placeholderHTML(p.placeholder);

  const thumbsHTML = images.length
    ? images.map((src, i) =>
        `<div class="thumb ${i === 0 ? "active" : ""}" data-src="${src}">
          <img src="${src}" alt="" ${fbAttr}>
        </div>`
      ).join("")
    : Array.from({length: 3}).map((_, i) =>
        `<div class="thumb ${i === 0 ? "active" : ""}">${placeholderHTML(p.placeholder)}</div>`
      ).join("");

  const ctaDisabled = p.status === "sold" ? "disabled" : "";
  const ctaLabel = p.status === "sold" ? "Pezzo non più disponibile"
                  : p.status === "reserved" ? "Iscriviti alla lista d'attesa"
                  : hasTiers ? "Richiedi questo set"
                  : "Richiedi informazioni";

  // Quantity picker + pricing tiers block (only if hasTiers)
  let quantityBlockHTML = "";
  if (hasTiers) {
    const maxQ = p.quantity.available;
    const minQ = p.quantity.min || 1;
    const defQ = p.quantity.default || maxQ;
    const tiersHTML = p.pricingTiers.map(t => `
      <li class="tier${t.best ? " tier--best" : ""}" data-tier-min="${t.min}" data-tier-max="${t.max}">
        <span class="tier-label">${t.label}${t.best ? ' <span class="tier-badge">miglior prezzo</span>' : ""}</span>
        <span class="tier-unit">${fmtPrice(t.unit)}/cad.</span>
      </li>
    `).join("");
    quantityBlockHTML = `
      <div class="quantity-picker" data-qty-picker>
        <div class="qty-head">
          <label for="qty-input">Quantità</label>
          <div class="qty-stepper">
            <button type="button" data-qty-dec aria-label="Diminuisci">−</button>
            <input id="qty-input" type="number" min="${minQ}" max="${maxQ}" step="1" value="${defQ}" data-qty-input>
            <button type="button" data-qty-inc aria-label="Aumenta">+</button>
            <span class="qty-of">/ ${maxQ} disponibili</span>
          </div>
        </div>
        <ul class="tiers">${tiersHTML}</ul>
        <div class="qty-savings" data-savings></div>
      </div>
    `;
  }

  root.innerHTML = `
    <nav style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1.5rem;">
      <a href="index.html">Home</a> / <a href="catalogo.html">Catalogo</a> / ${p.title}
    </nav>
    <div class="product-page">
      <div class="gallery">
        <div class="main-image${hasTiers ? " main-image--carousel" : ""}" data-main-image data-carousel="${hasTiers ? 1 : 0}">${mainImg}</div>
        <div class="thumbs">${thumbsHTML}</div>
      </div>
      <div class="detail">
        <div class="maker">${p.maker}</div>
        <h1>${p.title}</h1>
        <p class="subtitle">${p.shortDescription || ""}</p>
        <div class="price-row">
          ${priceHTML}
          <span class="${statusClass}">${statusText}</span>
        </div>
        ${quantityBlockHTML}
        <dl class="specs">${specsHTML}</dl>
        ${p.authenticity ? `<div class="authenticity"><strong>Autenticità.</strong> ${p.authenticity}</div>` : ""}
        ${p.notes ? `<div class="authenticity" style="border-color: var(--color-ink-soft);"><strong>Nota.</strong> ${p.notes}</div>` : ""}
        <a href="contatti.html?prodotto=${encodeURIComponent(p.id)}" class="btn btn--block" data-cta ${ctaDisabled ? 'style="pointer-events:none;opacity:0.4"' : ''}>
          ${ctaLabel}
        </a>
      </div>
    </div>
  `;

  setupImageFallbacks(root);

  // Carousel (auto-rotate) — only if hasTiers and multiple images
  const carouselEl = root.querySelector("[data-carousel='1']");
  if (carouselEl && images.length > 1) {
    setupCarousel(carouselEl, images, root, p);
  } else {
    // standard thumb-click behaviour
    root.querySelectorAll(".thumb[data-src]").forEach(t => {
      t.addEventListener("click", () => {
        const src = t.dataset.src;
        const main = root.querySelector("[data-main-image]");
        main.innerHTML = `<img src="${src}" alt="${p.title}" ${fbAttr}>`;
        setupImageFallbacks(main);
        root.querySelectorAll(".thumb").forEach(x => x.classList.remove("active"));
        t.classList.add("active");
      });
    });
  }

  // Quantity picker live update
  if (hasTiers) {
    setupQuantityPicker(root, p);
  }
}

function setupCarousel(mainEl, images, root, p) {
  const fbAttr = `data-fallback="${(p.placeholder || "—").replace(/"/g, "&quot;")}"`;
  let idx = 0;
  let timer = null;
  let paused = false;

  function show(i) {
    idx = (i + images.length) % images.length;
    const src = images[idx];
    mainEl.innerHTML = `<img src="${src}" alt="${p.title}" ${fbAttr} class="fade-in">`;
    setupImageFallbacks(mainEl);
    root.querySelectorAll(".thumb").forEach((t, ti) => {
      t.classList.toggle("active", ti === idx);
    });
  }

  function next() { show(idx + 1); }

  function start() {
    stop();
    if (paused) return;
    timer = setInterval(next, 4000);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  // Hover pause
  mainEl.addEventListener("mouseenter", () => { paused = true; stop(); });
  mainEl.addEventListener("mouseleave", () => { paused = false; start(); });

  // Thumb click jumps to that image and restarts timer
  root.querySelectorAll(".thumb[data-src]").forEach((t, ti) => {
    t.addEventListener("click", () => {
      show(ti);
      paused = false;
      start();
    });
  });

  show(0);
  start();
}

function setupQuantityPicker(root, p) {
  const input = root.querySelector("[data-qty-input]");
  const dec = root.querySelector("[data-qty-dec]");
  const inc = root.querySelector("[data-qty-inc]");
  const totalEl = root.querySelector("[data-total]");
  const qtyEl = root.querySelector("[data-qty]");
  const unitEl = root.querySelector("[data-unit]");
  const savingsEl = root.querySelector("[data-savings]");
  const tierItems = root.querySelectorAll(".tier");
  const cta = root.querySelector("[data-cta]");

  const minQ = parseInt(input.min, 10);
  const maxQ = parseInt(input.max, 10);
  const baseUrl = cta.getAttribute("href").split("&qty=")[0];

  function update() {
    let q = parseInt(input.value, 10);
    if (isNaN(q) || q < minQ) q = minQ;
    if (q > maxQ) q = maxQ;
    input.value = q;
    const unit = priceFromTiers(p.pricingTiers, q);
    const total = unit * q;
    if (totalEl) totalEl.textContent = fmtPrice(total);
    if (qtyEl) qtyEl.textContent = q;
    if (unitEl) unitEl.textContent = fmtPrice(unit);

    // Highlight active tier
    tierItems.forEach(li => {
      const tMin = +li.dataset.tierMin, tMax = +li.dataset.tierMax;
      li.classList.toggle("tier--active", q >= tMin && q <= tMax);
    });

    // Savings vs single-piece
    const singleUnit = p.pricingTiers[0].unit;
    const singleTotal = singleUnit * q;
    const saving = singleTotal - total;
    if (saving > 0) {
      savingsEl.innerHTML = `Risparmi <strong>${fmtPrice(saving)}</strong> rispetto al prezzo dei singoli esemplari.`;
      savingsEl.classList.add("qty-savings--show");
    } else {
      savingsEl.innerHTML = `Acquistando di più il prezzo unitario scende fino a ${fmtPrice(p.pricingTiers[p.pricingTiers.length - 1].unit)}/cad.`;
      savingsEl.classList.remove("qty-savings--show");
    }

    // Update CTA URL to include qty
    cta.setAttribute("href", `${baseUrl}&qty=${q}`);
  }

  input.addEventListener("input", update);
  dec.addEventListener("click", () => { input.value = Math.max(minQ, (+input.value || minQ) - 1); update(); });
  inc.addEventListener("click", () => { input.value = Math.min(maxQ, (+input.value || minQ) + 1); update(); });
  update();
}

// ============ CONTATTI ============
function renderContattiPrefill() {
  const urlParams = new URLSearchParams(window.location.search);
  const prodId = urlParams.get("prodotto");
  if (!prodId) return;
  const qty = parseInt(urlParams.get("qty"), 10);
  loadData().then(data => {
    const p = data.prodotti.find(x => x.id === prodId);
    if (!p) return;
    const subjEl = document.querySelector("[name=subject]");
    const msgEl = document.querySelector("[name=message]");
    let qtyLine = "";
    if (p.pricingTiers && qty > 0) {
      const unit = priceFromTiers(p.pricingTiers, qty);
      const total = unit * qty;
      qtyLine = `Quantità desiderata: ${qty} ${qty === 1 ? "pezzo" : "pezzi"} (€${unit}/cad. — totale ${fmtPrice(total)}).\n\n`;
    }
    if (subjEl) subjEl.value = `Richiesta informazioni — ${p.title}${qty ? ` (${qty} pz)` : ""}`;
    if (msgEl) msgEl.value = `Buongiorno,\n\nsono interessato/a a "${p.title}" di ${p.maker} (rif. ${p.id}).\n\n${qtyLine}Vorrei ricevere maggiori informazioni su:\n- Disponibilità e modalità di consegna\n- Dettagli sulle condizioni\n- Possibilità di visione\n\nGrazie,\n`;
  });
}

// ============ HEADER MOBILE TOGGLE ============
function setupHeader() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }
}

// ============ INIT ============
document.addEventListener("DOMContentLoaded", () => {
  setupHeader();
  renderHome();
  renderCatalogo();
  renderProdotto();
  renderContattiPrefill();
});
