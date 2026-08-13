document.querySelectorAll("#fra-map, #home-map").forEach(mapElement => {
  if (!window.L) return;
  const isHomeMap = mapElement.id === "home-map";
  const map = L.map(mapElement, { scrollWheelZoom: false, dragging: !isHomeMap }).setView([50.0379, 8.5622], isHomeMap ? 10 : 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
  }).addTo(map);
  const marker = L.marker([50.0379, 8.5622]).addTo(map);
  marker.bindPopup("<strong>Frankfurt Airport (FRA)</strong><br>Ungefaehre Standortmitte");
  const airportArea = L.layerGroup().addTo(map);
  L.circle([50.0379, 8.5622], { radius: 6500, color: "#003b6f", fillColor: "#00a6c8", fillOpacity: .12, weight: 2 }).addTo(airportArea);
  const facilities = L.layerGroup().addTo(map);
  const facilityPoints = [
    [[50.050, 8.570], "Terminal 1", "Schematische Orientierung, keine offizielle Navigation."],
    [[49.991, 8.561], "Terminal 3", "Schematische Lage im Sueden des Flughafenareals."],
    [[50.026, 8.532], "Cargo-Bereich", "Schematische Einordnung des Cargo-Schwerpunkts."],
  ];
  facilityPoints.forEach(([position, label, note]) => L.circleMarker(position, { radius: 8, color: "#003b6f", fillColor: "#ffcb05", fillOpacity: 1, weight: 2 }).bindPopup(`<strong>${label}</strong><br>${note}`).addTo(facilities));
  const axes = L.layerGroup();
  L.polyline([[50.055, 8.50], [50.018, 8.67]], { color: "#00a6c8", weight: 3, dashArray: "8 8", opacity: .8 }).bindPopup("Schematische Flughafenachse").addTo(axes);
  L.polyline([[49.98, 8.52], [50.09, 8.62]], { color: "#ffcb05", weight: 3, dashArray: "8 8", opacity: .8 }).bindPopup("Schematische Flughafenachse").addTo(axes);
  L.control.layers({ "Standortbereich": airportArea }, { "Flughafenpunkte": facilities, "Schematische Achsen": axes }, { collapsed: isHomeMap }).addTo(map);
  const legend = document.createElement("div");
  legend.className = "map-legend";
  legend.innerHTML = "<span>Standortbereich</span><span>Flughafenpunkte</span><span>Orientierungsachsen</span>";
  mapElement.parentElement.insertBefore(legend, mapElement.nextSibling);
});
