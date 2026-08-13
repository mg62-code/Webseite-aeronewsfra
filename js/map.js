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
  const clearMeasure = document.querySelector("#map-clear-measure");
  const copyCoordinates = document.querySelector("#map-copy-coordinates");
  const shareMap = document.querySelector("#map-share");
  const weatherButton = document.querySelector("#map-weather-button");
  const weatherResult = document.querySelector("#map-weather");
  const weatherDetail = document.querySelector("#map-weather-detail");
  const measureResult = document.querySelector("#measure-result");
  const measurePointsOutput = document.querySelector("#measure-points");
  const aircraftSearch = document.querySelector("#aircraft-search");
  const aircraftAltitude = document.querySelector("#aircraft-altitude");
  const aircraftResult = document.querySelector("#aircraft-result");
  const aircraftRefresh = document.querySelector("#aircraft-refresh");
  let lastCoordinates = null;
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
  const updateMeasureOutput = distance => { if (measureResult) measureResult.textContent = `${distance.toFixed(2).replace(".", ",")} km`; if (measurePointsOutput) measurePointsOutput.textContent = measurePoints.length ? `${measurePoints.length} Messpunkt(e)` : "Keine Messpunkte"; };
  measure?.addEventListener("click", () => { measuring = !measuring; measure.classList.toggle("is-active", measuring); measurePoints = []; measureLine?.remove(); measureLine = null; updateMeasureOutput(0); setStatus(measuring ? "Messung aktiv: zwei oder mehr Punkte auf der Karte anklicken." : "Messung beendet."); });
  clearMeasure?.addEventListener("click", () => { measurePoints = []; measureLine?.remove(); measureLine = null; measuring = false; measure?.classList.remove("is-active"); updateMeasureOutput(0); setStatus("Messung geloescht."); });
  map.on("click", event => {
    lastCoordinates = event.latlng;
    setStatus(`Koordinaten: ${event.latlng.lat.toFixed(5)}, ${event.latlng.lng.toFixed(5)}${measuring ? " | Messung aktiv" : ""}`);
    if (!measuring) return;
    measurePoints.push(event.latlng);
    measureLine?.remove();
    measureLine = L.polyline(measurePoints, { color: "#003b6f", weight: 4, dashArray: "6 5" }).addTo(map);
    let distance = 0;
    for (let index = 1; index < measurePoints.length; index += 1) distance += measurePoints[index - 1].distanceTo(measurePoints[index]);
    updateMeasureOutput(distance / 1000);
    setStatus(`${measurePoints.length} Messpunkt(e) | Entfernung: ${(distance / 1000).toFixed(2)} km`);
  });
  fullscreen?.addEventListener("click", () => {
    if (!document.fullscreenElement) mapElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    window.setTimeout(() => map.invalidateSize(), 300);
  });
  copyCoordinates?.addEventListener("click", async () => {
    if (!lastCoordinates) { setStatus("Zuerst einen Punkt auf der Karte anklicken."); return; }
    const value = `${lastCoordinates.lat.toFixed(5)}, ${lastCoordinates.lng.toFixed(5)}`;
    try { await navigator.clipboard.writeText(value); setStatus(`Koordinaten kopiert: ${value}`); } catch { setStatus(`Koordinaten: ${value}`); }
  });
  shareMap?.addEventListener("click", async () => {
    const center = map.getCenter();
    const url = `${window.location.href.split("#")[0]}#lat=${center.lat.toFixed(5)}&lon=${center.lng.toFixed(5)}&z=${map.getZoom()}`;
    try { await navigator.clipboard.writeText(url); setStatus("Kartenlink kopiert."); } catch { window.prompt("Kartenlink kopieren:", url); }
  });
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, "").replaceAll("&", "&"));
  if (hash.has("lat") && hash.has("lon")) map.setView([Number(hash.get("lat")), Number(hash.get("lon"))], Number(hash.get("z")) || 13);
  const escapePopup = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[character]));
  let aircraftRecords = [];
  const renderAircraft = () => {
    aircraftLayer.clearLayers();
    const term = (aircraftSearch?.value || "").trim().toLowerCase();
    const minimumAltitude = Number(aircraftAltitude?.value || 0);
    const visible = aircraftRecords.filter(record => record.callsign.toLowerCase().includes(term) && (record.altitude == null || record.altitude >= minimumAltitude));
    visible.forEach(record => L.circleMarker([record.lat, record.lon], { radius: 5, color: "#003b6f", fillColor: "#00a6c8", fillOpacity: .9, weight: 1 }).bindPopup(`<strong>${record.callsign}</strong><br>${record.country}<br>Hoehe: ${record.altitude == null ? "unbekannt" : `${Math.round(record.altitude)} m`}<br>Geschwindigkeit: ${record.speed == null ? "unbekannt" : `${Math.round(record.speed * 3.6)} km/h`}<br>Kurs: ${record.track == null ? "unbekannt" : `${Math.round(record.track)}°`}<br><small>Quelle: OpenSky zum Abrufzeitpunkt</small>`).addTo(aircraftLayer));
    if (aircraftResult) aircraftResult.textContent = `${visible.length} von ${aircraftRecords.length} Flugzustaenden sichtbar.`;
  };
  const loadAircraft = async () => {
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
      aircraftRecords = (payload.states || []).filter(state => state[5] != null && state[6] != null).map(state => ({ callsign: (state[1] || "unbekannt").trim(), country: state[2] || "unbekannt", lon: state[5], lat: state[6], altitude: state[7], speed: state[9], track: state[10] }));
      renderAircraft();
      aircraftLayer.addTo(map);
      liveAircraft.classList.add("is-active");
      setStatus(`${aircraftRecords.length} Flugzustaende geladen. Quelle: OpenSky zum Abrufzeitpunkt.`);
    } catch (error) {
      setStatus("Live-Daten konnten nicht geladen werden. Bitte spaeter erneut versuchen oder externe Live-Links nutzen.");
    } finally {
      liveAircraft.disabled = false;
    }
  };
  liveAircraft?.addEventListener("click", loadAircraft);
  aircraftRefresh?.addEventListener("click", () => { if (map.hasLayer(aircraftLayer)) map.removeLayer(aircraftLayer); liveAircraft?.classList.remove("is-active"); loadAircraft(); });
  aircraftSearch?.addEventListener("input", renderAircraft);
  aircraftAltitude?.addEventListener("change", renderAircraft);
  weatherButton?.addEventListener("click", async () => {
    weatherButton.disabled = true;
    if (weatherResult) weatherResult.textContent = "Wird geladen...";
    try {
      const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=50.0379&longitude=8.5622&current=temperature_2m,wind_speed_10m,wind_direction_10m,visibility&timezone=Europe%2FBerlin", { cache: "no-store" });
      if (!response.ok) throw new Error("weather unavailable");
      const current = (await response.json()).current;
      if (weatherResult) weatherResult.textContent = `${current.temperature_2m}°C / ${current.wind_speed_10m} km/h Wind`;
      if (weatherDetail) weatherDetail.textContent = `Richtung ${current.wind_direction_10m}° · Sichtweite ${Math.round(current.visibility / 1000)} km · Open-Meteo`;
      setStatus("Wetterdaten fuer FRA aktualisiert.");
    } catch { if (weatherResult) weatherResult.textContent = "Nicht verfuegbar"; if (weatherDetail) weatherDetail.textContent = "Wetterdienst konnte nicht erreicht werden."; setStatus("Wetterdaten konnten nicht geladen werden."); }
    finally { weatherButton.disabled = false; }
  });
});
