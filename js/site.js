const dataUrl = "data/news.json";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[character]));
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function card(item) {
  const demo = item.is_demo === "yes" ? `<span class="demo-badge">DEMO-INHALT</span>` : "";
  const sourceUrl = safeSourceUrl(item.source_url);
  const source = sourceUrl ? `<a class="source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">Quelle: ${escapeHtml(item.source_name || "Quelle")} ↗</a>` : `<span class="source">Quelle: ${escapeHtml(item.source_name || "nicht angegeben")}</span>`;
  const relevance = item.relevance ? `<span class="relevance">Relevanz: ${escapeHtml(item.relevance)}</span>` : "";
  const body = item.body ? `<details class="card-details"><summary>Mehr zur Einordnung</summary><p>${escapeHtml(item.body)}</p></details>` : "";
  return `<article class="news-card"><div><div class="news-meta"><span>${escapeHtml(item.category)}</span><span>${escapeHtml(formatDate(item.date))}</span></div>${demo}${relevance}<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p>${body}</div>${source}</article>`;
}

async function loadNews() {
  try {
    const response = await fetch(dataUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("news data unavailable");
    const items = await response.json();
    const featured = document.querySelector("#featured-news");
    const list = document.querySelector("#news-list");
    const movements = document.querySelector("#movement-list");
    const filters = document.querySelector("#category-filters");
    const requestedCategory = new URLSearchParams(window.location.search).get("category");
    const filtered = requestedCategory ? items.filter(item => item.category === requestedCategory) : items;
    if (filters) {
      const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
      filters.innerHTML = [`<a class="filter ${!requestedCategory ? "active" : ""}" href="news.html">Alle</a>`, ...categories.map(category => `<a class="filter ${requestedCategory === category ? "active" : ""}" href="news.html?category=${encodeURIComponent(category)}">${escapeHtml(category)}</a>`)].join("");
    }
    if (featured) featured.innerHTML = items.length ? items.slice(0, 3).map(card).join("") : `<p class="empty-state">Aktuell werden gepruefte Meldungen vorbereitet.</p>`;
    if (list) list.innerHTML = filtered.length ? filtered.map(card).join("") : `<p class="empty-state">Keine veroeffentlichten Meldungen in diesem Bereich.</p>`;
    if (movements) {
      const movementItems = items.filter(item => ["Special Movement", "Diversion", "Notfall"].includes(item.category));
      movements.innerHTML = movementItems.length ? movementItems.map(card).join("") : `<p class="empty-state">Aktuell liegen keine veroeffentlichten Special-Movement-Meldungen vor.</p>`;
    }
  } catch (error) {
    document.querySelectorAll(".news-grid, .news-list").forEach(element => { element.innerHTML = `<p class="empty-state">Die Meldungen konnten gerade nicht geladen werden.</p>`; });
  }
}

loadNews();
