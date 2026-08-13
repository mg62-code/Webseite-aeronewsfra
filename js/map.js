document.querySelectorAll("#fra-map, #home-map").forEach(mapElement => {
  if (!window.L) return;
  const isHomeMap = mapElement.id === "home-map";
  const fraCenter = [50.0379, 8.5622];
  const map = L.map(mapElement, { scrollWheelZoom: false, dragging: !isHomeMap }).setView(fraCenter, isHomeMap ? 10 : 11);
  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
  }).addTo(map);
  const light = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  });
  const marker = L.marker(fraCenter, { title: "Frankfurt Airport FRA", alt: "Frankfurt Airport FRA" }).addTo(map);
  marker.bindPopup("<strong>Frankfurt Airport (FRA)</strong><br>Ungefaehre Standortmitte");
  const airportArea = L.layerGroup().addTo(map);
  L.circle(fraCenter, { radius: 6500, color: "#003b6f", fillColor: "#00a6c8", fillOpacity: .12, weight: 2 }).addTo(airportArea);
  const facilities = L.layerGroup().addTo(map);
  const facilityPoints = [
    ["fra", fraCenter, "FRA Standortmitte", "Frankfurt Airport, schematische Standortmitte."],
    ["terminal-1", [50.050, 8.570], "Terminal 1", "Schematische Orientierung, keine offizielle Navigation."],
    ["terminal-3", [49.991, 8.561], "Terminal 3", "Schematische Lage im Sueden des Flughafenareals."],
    ["cargo", [50.026, 8.532], "Cargo-Bereich", "Schematische Einordnung des Cargo-Schwerpunkts."],
  ];
  const pointIndex = {};
  facilityPoints.forEach(([key, position, label, note]) => {
    const point = L.circleMarker(position, { radius: 8, color: "#003b6f", fillColor: "#ffcb05", fillOpacity: 1, weight: 2, title: label });
    point.bindPopup(`<strong>${label}</strong><br>${note}`);
    point.addTo(facilities);
    pointIndex[key] = { position, label };
  });
  const axes = L.layerGroup();
  L.polyline([[50.055, 8.50], [50.018, 8.67]], { color: "#00a6c8", weight: 3, dashArray: "8 8", opacity: .8 }).bindPopup("Schematische Flughafenachse").addTo(axes);
  L.polyline([[49.98, 8.52], [50.09, 8.62]], { color: "#ffcb05", weight: 3, dashArray: "8 8", opacity: .8 }).bindPopup("Schematische Flughafenachse").addTo(axes);
  const aircraftLayer = L.layerGroup();
  L.control.layers({ "OpenStreetMap": osm, "Helle Karte": light }, { "Standortbereich": airportArea, "Flughafenpunkte": facilities, "Schematische Achsen": axes, "Live-Fluege": aircraftLayer }, { collapsed: isHomeMap }).addTo(map);
  const legend = document.createElement("div");
  legend.className = "map-legend";
  legend.innerHTML = "<span>Standortbereich</span><span>Flughafenpunkte</span><span>Orientierungsachsen</span>";
  mapElement.parentElement.insertBefore(legend, mapElement.nextSibling);

  if (isHomeMap) return;
  const status = document.querySelector("#map-status");
  const setStatus = message => { if (status) status.textContent = message; };
  const select = document.querySelector("#map-point-search");
  const reset = document.querySelector("#map-reset");
  const locate = document.querySelector("#map-locate");
  const measure = document.querySelector("#map-measure");
  const fullscreen = document.querySelector("#map-fullscreen");
  const liveAircraft = document.querySelector("#map-live-aircraft");
  select?.addEventListener("change", () => {
    const selected = pointIndex[select.value];
    if (!selected) return;
    map.flyTo(selected.position, 14, { duration: .8 });
    facilities.eachLayer(layer => { if (layer.getLatLng && layer.getLatLng().equals(selected.position)) layer.openPopup(); });
    setStatus(`${selected.label} ausgewaehlt.`);
  });
  reset?.addEventListener("click", () => { map.flyTo(fraCenter, 11, { duration: .8 }); setStatus("Ansicht auf FRA zurueckgesetzt."); });
  locate?.addEventListener("click", () => {
    setStatus("Standort wird angefragt. Der Browser kann eine Berechtigung verlangen.");
    map.locate({ setView: true, maxZoom: 14, enableHighAccuracy: false });
  });
  map.on("locationfound", event => { L.circle(event.latlng, { radius: event.accuracy, color: "#003b6f", fillColor: "#00a6c8", fillOpacity: .18 }).addTo(map).bindPopup("Dein ungefaehrer Standort").openPopup(); setStatus("Standort gefunden. Die Position bleibt im Browser."); });
  map.on("locationerror", () => setStatus("Standort konnte nicht ermittelt werden. Bitte Browser-Berechtigung pruefen."));
  let measuring = false;
  let measurePoints = [];
  let measureLine = null;
  measure?.addEventListener("click", () => { measuring = !measuring; measure.classList.toggle("is-active", measuring); measurePoints = []; measureLine?.remove(); measureLine = null; setStatus(measuring ? "Messung aktiv: zwei oder mehr Punkte auf der Karte anklicken." : "Messung beendet."); });
  map.on("click", event => {
    setStatus(`Koordinaten: ${event.latlng.lat.toFixed(5)}, ${event.latlng.lng.toFixed(5)}${measuring ? " | Messung aktiv" : ""}`);
    if (!measuring) return;
    measurePoints.push(event.latlng);
    measureLine?.remove();
    measureLine = L.polyline(measurePoints, { color: "#003b6f", weight: 4, dashArray: "6 5" }).addTo(map);
    let distance = 0;
    for (let index = 1; index < measurePoints.length; index += 1) distance += measurePoints[index - 1].distanceTo(measurePoints[index]);
    setStatus(`${measurePoints.length} Messpunkt(e) | Entfernung: ${(distance / 1000).toFixed(2)} km`);
  });
  fullscreen?.addEventListener("click", () => {
    if (!document.fullscreenElement) mapElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    window.setTimeout(() => map.invalidateSize(), 300);
  });
  const escapePopup = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[character]));
  liveAircraft?.addEventListener("click", async () => {
    if (map.hasLayer(aircraftLayer)) {
      map.removeLayer(aircraftLayer);
      liveAircraft.classList.remove("is-active");
      setStatus("Live-Flugzeugschicht ausgeblendet.");
      return;
    }
    liveAircraft.disabled = true;
    setStatus("Live-Flugzustaende werden von OpenSky geladen...");
    try {
      const response = await fetch("https://opensky-network.org/api/states/all?lamin=49.8&lomin=8.2&lamax=50.3&lomax=8.9", { cache: "no-store" });
      if (!response.ok) throw new Error("OpenSky antwortet nicht");
      const payload = await response.json();
      aircraftLayer.clearLayers();
      (payload.states || []).filter(state => state[5] != null && state[6] != null).forEach(state => {
        const callsign = escapePopup((state[1] || "unbekannt").trim());
        const country = escapePopup(state[2] || "unbekannt");
        const altitude = state[7] == null ? "unbekannt" : `${Math.round(state[7])} m`;
        const speed = state[9] == null ? "unbekannt" : `${Math.round(state[9] * 3.6)} km/h`;
        L.circleMarker([state[6], state[5]], { radius: 5, color: "#003b6f", fillColor: "#00a6c8", fillOpacity: .9, weight: 1 }).bindPopup(`<strong>${callsign}</strong><br>${country}<br>Hoehe: ${altitude}<br>Geschwindigkeit: ${speed}<br><small>Quelle: OpenSky zum Abrufzeitpunkt</small>`).addTo(aircraftLayer);
      });
      aircraftLayer.addTo(map);
      liveAircraft.classList.add("is-active");
      setStatus(`${aircraftLayer.getLayers().length} Flugzustaende geladen. Quelle: OpenSky zum Abrufzeitpunkt.`);
    } catch (error) {
      setStatus("Live-Daten konnten nicht geladen werden. Bitte spaeter erneut versuchen oder externe Live-Links nutzen.");
    } finally {
      liveAircraft.disabled = false;
    }
  });
});
