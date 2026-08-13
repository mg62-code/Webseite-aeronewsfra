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
    const search = document.querySelector("#news-search");
    const requestedCategory = new URLSearchParams(window.location.search).get("category");
    const filtered = requestedCategory ? items.filter(item => item.category === requestedCategory) : items;
    if (filters) {
      const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
      filters.innerHTML = [`<a class="filter ${!requestedCategory ? "active" : ""}" href="news.html">Alle</a>`, ...categories.map(category => `<a class="filter ${requestedCategory === category ? "active" : ""}" href="news.html?category=${encodeURIComponent(category)}">${escapeHtml(category)}</a>`)].join("");
    }
    if (featured) featured.innerHTML = items.length ? items.slice(0, 3).map(card).join("") : `<p class="empty-state">Aktuell werden gepruefte Meldungen vorbereitet.</p>`;
    if (list) list.innerHTML = filtered.length ? filtered.map(card).join("") : `<p class="empty-state">Keine veroeffentlichten Meldungen in diesem Bereich.</p>`;
    if (search && list) search.addEventListener("input", () => {
      const term = search.value.trim().toLowerCase();
      const searched = filtered.filter(item => `${item.title} ${item.summary} ${item.category} ${item.source_name}`.toLowerCase().includes(term));
      list.innerHTML = searched.length ? searched.map(card).join("") : `<p class="empty-state">Keine Meldung passt zu dieser Suche.</p>`;
    });
    if (movements) {
      const movementItems = items.filter(item => ["Special Movement", "Special Movement Europa", "Diversion", "Notfall"].includes(item.category));
      movements.innerHTML = movementItems.length ? movementItems.map(card).join("") : `<p class="empty-state">Aktuell liegen keine veroeffentlichten Special-Movement-Meldungen vor.</p>`;
    }
  } catch (error) {
    document.querySelectorAll(".news-grid, .news-list").forEach(element => { element.innerHTML = `<p class="empty-state">Die Meldungen konnten gerade nicht geladen werden.</p>`; });
  }
}

async function loadDashboard() {
  const stats = document.querySelector("#dashboard-stats, #home-stats");
  const categories = document.querySelector("#dashboard-categories");
  if (!stats && !categories) return;
  try {
    const response = await fetch(dataUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("dashboard data unavailable");
    const items = await response.json();
    const movementCount = items.filter(item => ["Special Movement", "Special Movement Europa", "Diversion", "Notfall"].includes(item.category)).length;
    const latest = items[0]?.date ? formatDate(items[0].date) : "Keine Daten";
    if (stats?.id === "home-stats") stats.innerHTML = `<div><strong>${items.length}</strong><span>Meldungen online</span></div><div><strong>${movementCount}</strong><span>Special Movements</span></div><div><strong>${escapeHtml(latest)}</strong><span>Letztes Update</span></div>`;
    else if (stats) stats.innerHTML = `<div class="stat-card"><span>Meldungen online</span><strong>${items.length}</strong><small>freigegebene Beiträge</small></div><div class="stat-card"><span>Special Movements</span><strong>${movementCount}</strong><small>im öffentlichen Newsroom</small></div><div class="stat-card"><span>Letztes Update</span><strong>${escapeHtml(latest)}</strong><small>nach Quellenlage</small></div>`;
    if (categories) {
      const counts = items.reduce((result, item) => { result[item.category] = (result[item.category] || 0) + 1; return result; }, {});
      categories.innerHTML = Object.entries(counts).map(([category, count]) => `<a href="news.html?category=${encodeURIComponent(category)}"><span>${escapeHtml(category)}</span><b>${count}</b></a>`).join("") || `<p class="empty-state">Noch keine freigegebenen Themen.</p>`;
    }
  } catch {
    if (stats) stats.innerHTML = `<p class="empty-state">Dashboard-Daten konnten nicht geladen werden.</p>`;
  }
}

loadNews();
loadDashboard();
