(() => {
  const world = { minLon: 8.2, maxLon: 8.9, minLat: 49.8, maxLat: 50.3, width: 1000, height: 650 };
  const fra = [8.5622, 50.0379];
  const facilities = {
    fra: { point: fra, label: "FRA Standortmitte", note: "Frankfurt Airport, ungefaehre Standortmitte." },
    "terminal-1": { point: [8.570, 50.050], label: "Terminal 1", note: "Schematische Orientierung, keine offizielle Navigation." },
    "terminal-3": { point: [8.561, 49.991], label: "Terminal 3", note: "Schematische Lage im Sueden des Flughafenareals." },
    cargo: { point: [8.532, 50.026], label: "Cargo-Bereich", note: "Schematische Einordnung des Cargo-Schwerpunkts." }
  };

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[char]));
  const project = ([lon, lat]) => [((lon - world.minLon) / (world.maxLon - world.minLon)) * world.width, ((world.maxLat - lat) / (world.maxLat - world.minLat)) * world.height];
  const inverse = ([x, y]) => [world.minLon + (x / world.width) * (world.maxLon - world.minLon), world.maxLat - (y / world.height) * (world.maxLat - world.minLat)];
  const distance = (a, b) => { const rad = Math.PI / 180; const dLat = (b[1] - a[1]) * rad; const dLon = (b[0] - a[0]) * rad; const q = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)); };

  document.querySelectorAll("#fra-map, #home-map").forEach(container => {
    const home = container.id === "home-map";
    const state = { scale: home ? .72 : 1, tx: 0, ty: 0, layer: { area: true, points: true, axes: true, aircraft: false }, aircraft: [], measure: false, points: [], moving: false };
    container.classList.add("aero-map-container", home ? "aero-map-home" : "aero-map-full");
    container.innerHTML = `<svg class="aero-map-svg" viewBox="0 0 ${world.width} ${world.height}" role="img" aria-label="Eigene interaktive AeroNewsFRA Karte"><defs><pattern id="map-grid-${container.id}" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#8ed7cf" stroke-opacity=".18" stroke-width="1"/></pattern></defs><rect class="aero-map-background" width="1000" height="650"/><rect class="aero-map-grid" width="1000" height="650" fill="url(#map-grid-${container.id})"/><g class="aero-map-world"></g></svg>`;
    const svg = container.querySelector("svg");
    const worldGroup = container.querySelector(".aero-map-world");
    const status = document.querySelector("#map-status");
    const setStatus = value => { if (status && !home) status.textContent = value; };
    let lastCoordinates = null;
    let measureLine = null;

    const render = () => {
      const area = state.layer.area ? `<circle cx="500" cy="325" r="190" class="map-area"/>` : "";
      const axes = state.layer.axes ? `<path d="M90 560L810 100M180 600L930 150" class="map-axis"/><path d="M100 130L850 530" class="map-axis map-axis-yellow"/>` : "";
      const pointMarkup = state.layer.points ? Object.entries(facilities).map(([key, item]) => { const [x, y] = project(item.point); return `<g class="map-facility" data-map-key="${key}" tabindex="0"><circle cx="${x}" cy="${y}" r="${key === "fra" ? 12 : 9}"/><text x="${x + 15}" y="${y - 12}">${esc(item.label)}</text></g>`; }).join("") : "";
      const aircraft = state.layer.aircraft ? state.aircraft.map(item => { const [x, y] = project([item.lon, item.lat]); return `<g class="map-aircraft" data-map-key="aircraft-${esc(item.callsign)}"><path d="M${x} ${y - 8}l12 8-12 8 3-7-9-2v-2l9-2z" transform="rotate(${Number(item.track) || 0} ${x} ${y})"/><text x="${x + 13}" y="${y + 4}">${esc(item.callsign)}</text></g>`; }).join("") : "";
      worldGroup.setAttribute("transform", `translate(${state.tx} ${state.ty}) scale(${state.scale})`);
      worldGroup.innerHTML = `<rect x="0" y="0" width="1000" height="650" class="map-land"/>${area}${axes}<path d="M100 240h800v120H100zM420 105h120v440H420z" class="map-airport"/><path d="M60 100L930 540M120 575L900 75" class="map-runway"/><text x="35" y="45" class="map-title">FRA / AERONEWSFRA</text>${pointMarkup}${aircraft}${measureLine || ""}`;
    };
    const worldFromEvent = event => { const rect = svg.getBoundingClientRect(); return inverse([(event.clientX - rect.left) / rect.width * world.width, (event.clientY - rect.top) / rect.height * world.height].map((value, index) => (value - (index ? state.ty : state.tx)) / state.scale)); };
    const focus = point => { const [x, y] = project(point); state.scale = 2.1; state.tx = 500 - x * state.scale; state.ty = 325 - y * state.scale; render(); };
    const mapAction = (id, callback) => document.querySelector(`#${id}`)?.addEventListener("click", callback);
    const setButton = (id, active) => document.querySelector(`#${id}`)?.classList.toggle("is-active", active);
    render();

    if (home) return;
    const layerControls = document.createElement("div");
    layerControls.className = "aero-layer-controls";
    layerControls.innerHTML = `<span>Layer</span><button data-layer="area" class="is-active">Bereich</button><button data-layer="points" class="is-active">Punkte</button><button data-layer="axes" class="is-active">Achsen</button><button data-layer="aircraft">Live-Fluege</button>`;
    container.parentElement.insertBefore(layerControls, container);
    layerControls.querySelectorAll("button").forEach(button => button.addEventListener("click", () => { const key = button.dataset.layer; state.layer[key] = !state.layer[key]; button.classList.toggle("is-active", state.layer[key]); render(); }));
    layerControls.className = "aero-layer-controls";
    layerControls.innerHTML = `<span>Layer</span><button data-layer="area" class="is-active">Bereich</button><button data-layer="points" class="is-active">Punkte</button><button data-layer="axes" class="is-active">Achsen</button><button data-layer="aircraft">Live-Fluege</button>`;
    container.parentElement.insertBefore(layerControls, container);
    layerControls.querySelectorAll("button").forEach(button => button.addEventListener("click", () => { const key = button.dataset.layer; state.layer[key] = !state.layer[key]; button.classList.toggle("is-active", state.layer[key]); render(); }));
    const zoom = factor => { state.scale = Math.min(4, Math.max(.65, state.scale * factor)); render(); };
    let pointerStart = null;
    svg.addEventListener("pointerdown", event => { pointerStart = { x: event.clientX, y: event.clientY, tx: state.tx, ty: state.ty }; state.moving = false; svg.setPointerCapture(event.pointerId); });
    svg.addEventListener("pointermove", event => { if (!pointerStart) return; const rect = svg.getBoundingClientRect(); const dx = (event.clientX - pointerStart.x) / rect.width * world.width; const dy = (event.clientY - pointerStart.y) / rect.height * world.height; if (Math.abs(dx) + Math.abs(dy) > 3) state.moving = true; state.tx = pointerStart.tx + dx; state.ty = pointerStart.ty + dy; render(); });
    svg.addEventListener("pointerup", () => { pointerStart = null; });
    svg.addEventListener("wheel", event => { event.preventDefault(); zoom(event.deltaY < 0 ? 1.15 : .87); }, { passive: false });
    svg.addEventListener("click", event => {
      if (state.moving) return;
      const target = event.target.closest("[data-map-key]");
      if (target) { const key = target.dataset.mapKey; if (facilities[key]) { focus(facilities[key].point); setStatus(`${facilities[key].label}: ${facilities[key].note}`); } return; }
      const point = worldFromEvent(event); lastCoordinates = point; setStatus(`Koordinaten: ${point[1].toFixed(5)}, ${point[0].toFixed(5)}${state.measure ? " | Messung aktiv" : ""}`);
      if (state.measure) { state.points.push(point); let total = 0; for (let i = 1; i < state.points.length; i += 1) total += distance(state.points[i - 1], state.points[i]); measureLine = `<polyline points="${state.points.map(p => { const xy = project(p); return `${xy[0]},${xy[1]}`; }).join(" ")}" class="map-measure-line"/>`; document.querySelector("#measure-result")?.replaceChildren(document.createTextNode(`${total.toFixed(2).replace(".", ",")} km`)); document.querySelector("#measure-points")?.replaceChildren(document.createTextNode(`${state.points.length} Messpunkt(e)`)); render(); }
    });
    document.querySelector("#map-point-search")?.addEventListener("change", event => { const selected = facilities[event.target.value]; if (selected) { focus(selected.point); setStatus(`${selected.label} ausgewaehlt.`); } });
    mapAction("map-reset", () => { state.scale = 1; state.tx = 0; state.ty = 0; render(); setStatus("Ansicht zurueckgesetzt."); });
    mapAction("map-measure", () => { state.measure = !state.measure; state.points = []; measureLine = null; setButton("map-measure", state.measure); document.querySelector("#measure-result")?.replaceChildren(document.createTextNode("0,00 km")); document.querySelector("#measure-points")?.replaceChildren(document.createTextNode("Keine Messpunkte")); setStatus(state.measure ? "Messung aktiv: Punkte anklicken." : "Messung beendet."); render(); });
    mapAction("map-clear-measure", () => { state.measure = false; state.points = []; measureLine = null; setButton("map-measure", false); render(); setStatus("Messung geloescht."); });
    mapAction("map-copy-coordinates", async () => { if (!lastCoordinates) { setStatus("Zuerst einen Punkt auf der Karte anklicken."); return; } const value = `${lastCoordinates[1].toFixed(5)}, ${lastCoordinates[0].toFixed(5)}`; try { await navigator.clipboard.writeText(value); setStatus(`Koordinaten kopiert: ${value}`); } catch { setStatus(`Koordinaten: ${value}`); } });
    mapAction("map-share", async () => { const url = `${window.location.href.split("#")[0]}#zoom=${state.scale.toFixed(2)}&x=${state.tx.toFixed(2)}&y=${state.ty.toFixed(2)}`; try { await navigator.clipboard.writeText(url); setStatus("Kartenlink kopiert."); } catch { window.prompt("Kartenlink kopieren:", url); } });
    mapAction("map-fullscreen", () => { if (!document.fullscreenElement) container.requestFullscreen?.(); else document.exitFullscreen?.(); window.setTimeout(() => render(), 300); });
    mapAction("map-locate", () => { setStatus("Standort wird angefragt..."); navigator.geolocation?.getCurrentPosition(position => { focus([position.coords.longitude, position.coords.latitude]); setStatus("Standort gefunden. Die Position bleibt im Browser."); }, () => setStatus("Standort konnte nicht ermittelt werden.")); });

    let aircraft = [];
    const aircraftLayer = "aircraft";
    const renderAircraft = () => { const term = (document.querySelector("#aircraft-search")?.value || "").toLowerCase(); const min = Number(document.querySelector("#aircraft-altitude")?.value || 0); state.aircraft = aircraft.filter(item => item.callsign.toLowerCase().includes(term) && (item.altitude == null || item.altitude >= min)); state.layer[aircraftLayer] = true; document.querySelector("#aircraft-result")?.replaceChildren(document.createTextNode(`${state.aircraft.length} von ${aircraft.length} Flugzustaenden sichtbar.`)); render(); };
    const loadAircraft = async () => { const button = document.querySelector("#map-live-aircraft"); if (button) button.disabled = true; setStatus("OpenSky-Live-Zustaende werden geladen..."); try { const response = await fetch("https://opensky-network.org/api/states/all?lamin=49.8&lomin=8.2&lamax=50.3&lomax=8.9", { cache: "no-store" }); if (!response.ok) throw new Error(); const payload = await response.json(); aircraft = (payload.states || []).filter(s => s[5] != null && s[6] != null).map(s => ({ callsign: (s[1] || "unbekannt").trim(), country: s[2] || "unbekannt", lon: s[5], lat: s[6], altitude: s[7], speed: s[9], track: s[10] })); renderAircraft(); setStatus(`${aircraft.length} Flugzustaende geladen. Quelle: OpenSky.`); } catch { setStatus("OpenSky ist aktuell nicht erreichbar oder rate-limited."); } finally { if (button) button.disabled = false; } };
    mapAction("map-live-aircraft", loadAircraft); mapAction("aircraft-refresh", loadAircraft); document.querySelector("#aircraft-search")?.addEventListener("input", renderAircraft); document.querySelector("#aircraft-altitude")?.addEventListener("change", renderAircraft);
    mapAction("map-weather-button", async () => { const button = document.querySelector("#map-weather-button"); if (button) button.disabled = true; try { const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=50.0379&longitude=8.5622&current=temperature_2m,wind_speed_10m,wind_direction_10m,visibility&timezone=Europe%2FBerlin", { cache: "no-store" }); if (!response.ok) throw new Error(); const current = (await response.json()).current; document.querySelector("#map-weather")?.replaceChildren(document.createTextNode(`${current.temperature_2m}°C / ${current.wind_speed_10m} km/h Wind`)); document.querySelector("#map-weather-detail")?.replaceChildren(document.createTextNode(`Richtung ${current.wind_direction_10m}° · Sicht ${Math.round(current.visibility / 1000)} km · Open-Meteo`)); setStatus("Wetterdaten aktualisiert."); } catch { setStatus("Wetterdaten nicht verfuegbar."); } finally { if (button) button.disabled = false; } });
  });
})();
