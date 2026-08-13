const navigationItems = [
  ["news.html", "News"],
  ["special-movements.html", "Movements"],
  ["karte.html", "Karte"],
  ["dashboard.html", "Dashboard"],
  ["spotting.html", "Spotting"],
  ["quellen.html", "Quellen"],
  ["ueber-aeronewsfra.html", "Ueber uns"],
  ["kontakt.html", "Kontakt"]
];

const currentPage = window.location.pathname.split("/").pop() || "index.html";
const header = document.querySelector(".site-header");
if (header) {
  let nav = header.querySelector("nav");
  if (!nav) {
    nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Hauptnavigation");
    header.append(nav);
  }
  nav.innerHTML = navigationItems.map(([href, label]) => `<a class="${currentPage === href ? "active" : ""}" href="${href}">${label}</a>`).join("");
}

const footer = document.querySelector(".site-footer");
if (footer) {
  footer.innerHTML = `<span>© AeroNewsFRA</span><span><a href="karte.html">Karte</a><a href="dashboard.html">Dashboard</a><a href="quellen.html">Quellen</a><a href="kontakt.html">Kontakt</a><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a></span>`;
}

const main = document.querySelector("main");
const addModule = (html, key) => {
  if (main && !document.querySelector(`[data-module="${key}"]`)) main.insertAdjacentHTML("beforeend", `<section class="shell page-module" data-module="${key}">${html}</section>`);
};

if (currentPage === "index.html") {
  addModule(`<div class="visual-banner"><img src="assets/fra-grid.svg" alt="Schematische AeroNewsFRA Airport-Grafik"><div class="visual-copy"><p class="eyebrow">AERONEWSFRA / VISUAL SYSTEM</p><h2>Der Flughafen ist mehr als ein Punkt auf der Karte.</h2><p>Verkehr, Infrastruktur, Airlines, Cargo und besondere Bewegungen treffen an FRA zusammen. AeroNewsFRA macht diese Ebenen lesbar.</p><a class="text-link" href="dashboard.html">Zum Dashboard <span>→</span></a></div></div>`, "home-visual");
}
if (currentPage === "spotting.html") {
  addModule(`<div class="visual-banner"><div class="visual-copy"><p class="eyebrow">SPOTTING WORKFLOW</p><h2>Beobachten. Einordnen. Respektvoll teilen.</h2><p>Jedes Bild bekommt Kontext: Zeitpunkt, Perspektive und ein klarer Bezug zum Standort. So entsteht aus einem Motiv ein nachvollziehbarer Beitrag.</p></div><img src="assets/terminal-lines.svg" alt="Schematische Terminalgrafik"></div><div class="feature-grid"><article class="feature-card"><span class="feature-number">01 / VOR ORT</span><h2>Perspektive</h2><p>Nur zulaessige oeffentliche Bereiche nutzen und lokale Hinweise beachten.</p></article><article class="feature-card"><span class="feature-number">02 / IM BILD</span><h2>Kontext</h2><p>Airline, Flugzeugtyp und Aufnahmezeit nur nennen, wenn sicher erkennbar.</p></article><article class="feature-card"><span class="feature-number">03 / ONLINE</span><h2>Rechte</h2><p>Nur eigenes oder freigegebenes Bildmaterial veroeffentlichen.</p></article></div>`, "spotting-toolkit");
}
if (currentPage === "quellen.html") {
  addModule(`<p class="eyebrow">DER REDAKTIONELLE LOOP</p><h2>Vier Schritte bis zur Freigabe.</h2><div class="process-line"><div><span>01</span><strong>Suchen</strong><p>Priorisierte Quellen und aktuelle Zeitfenster pruefen.</p></div><div><span>02</span><strong>Abgleichen</strong><p>Fakten, FRA-Bezug und widerspruechliche Angaben trennen.</p></div><div><span>03</span><strong>Einordnen</strong><p>Relevanz und Format fuer News oder Story bewerten.</p></div><div><span>04</span><strong>Freigeben</strong><p>Nur bestaetigte Inhalte werden auf published gesetzt.</p></div></div>`, "source-process");
}
if (currentPage === "dashboard.html") {
  addModule(`<div class="visual-banner"><img src="assets/fra-grid.svg" alt="Schematische FRA-Radar-Grafik"><div class="visual-copy"><p class="eyebrow">OPERATIVE SICHT</p><h2>Ein Newsroom mit nachvollziehbarem Status.</h2><p>Die oeffentliche Ansicht zeigt nur freigegebene Daten. Recherchekandidaten bleiben im internen Review und werden nicht automatisch als Fakten ausgegeben.</p></div></div><div class="dashboard-panel"><p class="eyebrow">ZEITLICHE VERTEILUNG</p><h2>Freigegebene Meldungen nach Datum</h2><div id="dashboard-trend" class="trend-chart"><p class="empty-state">Diagramm wird geladen.</p></div></div>`, "dashboard-visual");
  fetch("data/news.json", { cache: "no-store" }).then(response => response.json()).then(items => {
    const target = document.querySelector("#dashboard-trend");
    if (!target) return;
    const counts = items.reduce((result, item) => { result[item.date] = (result[item.date] || 0) + 1; return result; }, {});
    const max = Math.max(...Object.values(counts), 1);
    target.innerHTML = Object.entries(counts).sort().map(([date, count]) => `<div class="trend-row"><span>${date}</span><i><b style="width:${Math.round((count / max) * 100)}%"></b></i><strong>${count}</strong></div>`).join("");
  }).catch(() => {});
}
if (currentPage === "special-movements.html") {
  addModule(`<p class="eyebrow">EUROPA-FOKUS</p><h2>Von FRA aus weiterdenken.</h2><div class="feature-grid"><article class="feature-card"><span class="feature-number">FRA / REGIONAL</span><h2>Rund um Frankfurt</h2><p>Diversions, Umkehrfluege und besondere Bewegungen mit direktem Standortbezug.</p></article><article class="feature-card"><span class="feature-number">EUROPE / VERIFIED</span><h2>Europaweit</h2><p>Bestaetigte Ereignisse an europaeischen Flughaefen mit nachvollziehbarer Quelle.</p></article><article class="feature-card"><span class="feature-number">STATUS / CLEAR</span><h2>Kein Tracking-Geruecht</h2><p>Flightradar-Daten koennen Hinweise liefern, ersetzen aber keine Bestaetigung.</p></article></div>`, "movement-scope");
}
if (currentPage === "kontakt.html") {
  addModule(`<div class="feature-grid"><article class="feature-card"><span class="feature-number">KORREKTUR</span><h2>Fakten melden</h2><p>Bitte immer Quelle, Datum und konkreten FRA-Bezug angeben.</p></article><article class="feature-card"><span class="feature-number">BILDRECHTE</span><h2>Material anbieten</h2><p>Nur eigenes oder eindeutig freigegebenes Bildmaterial senden.</p></article><article class="feature-card"><span class="feature-number">INSTAGRAM</span><h2>Direkter Draht</h2><p>Fuer schnelle Hinweise ist der Instagram-Account der beste Einstieg.</p></article></div>`, "contact-options");
}
