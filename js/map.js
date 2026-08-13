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
  L.circle([50.0379, 8.5622], { radius: 6500, color: "#003b6f", fillColor: "#00a6c8", fillOpacity: .12, weight: 2 }).addTo(map);
});
