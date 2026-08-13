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
