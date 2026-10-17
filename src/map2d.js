import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Raster map needs no WebGL and uses the same saved listing coordinates.
export function mountRasterMap(container, { items, coordinates, escape, onFilter, onVacant, notify }) {
  container.replaceChildren();
  const map = L.map(container, { zoomControl: false }).setView([17.6132, 121.727], 14);
  const status = document.createElement("div");
  status.className = "raster-map-status";
  status.setAttribute("role", "status");
  status.textContent = "Loading map…";
  container.append(status);
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  let failed = false;
  tiles.on("tileerror", () => { failed = true; status.textContent = "Some tiles could not load. Check your connection."; status.hidden = false; });
  tiles.on("loading", () => { failed = false; });
  tiles.on("load", () => { if (!failed) status.hidden = true; });
  const markers = new Map();
  for (const p of items) {
    const point = coordinates(p);
    if (!point) continue;
    const marker = L.marker([point[1], point[0]], { icon: L.divIcon({
      className: "raster-price-pin", html: `<span>₱${Number(p.minPrice || 0).toLocaleString()}</span>`, iconSize: [84, 32], iconAnchor: [42, 32],
    }) }).addTo(map);
    marker.bindPopup(`<strong>${escape(p.title)}</strong><p>${escape(p.barangay || "Tuguegarao")}</p><a href="#/property/${encodeURIComponent(p.id)}">View room details</a>`);
    markers.set(p.id, marker);
  }
  const root = container.closest(".map3d-shell");
  if (root) {
    root.classList.add("is-raster");
    root.querySelectorAll("[data-focus-property]").forEach(card => card.addEventListener("click", () => {
      const marker = markers.get(card.dataset.focusProperty);
      if (!marker) { notify("This listing has no saved map location. Open its details to contact the owner."); return; }
      map.setView(marker.getLatLng(), 16); marker.openPopup();
    }));
    root.querySelector("#map3d-zoom-in")?.addEventListener("click", () => map.zoomIn());
    root.querySelector("#map3d-zoom-out")?.addEventListener("click", () => map.zoomOut());
    root.querySelector("#map3d-center-btn")?.addEventListener("click", () => map.setView([17.6132, 121.727], 14));
    root.querySelector("#map3d-locate-btn")?.addEventListener("click", () => map.locate({ setView: true, maxZoom: 16, timeout: 10000 }));
    map.on("locationerror", () => notify("Location unavailable. Allow location access or browse the map manually."));
    root.querySelectorAll("[data-map-filter]").forEach(chip => chip.addEventListener("click", () => onFilter(chip.dataset.mapFilter)));
    root.querySelectorAll("[data-map-vacant]").forEach(chip => chip.addEventListener("click", onVacant));
  }
  const observer = new ResizeObserver(() => map.invalidateSize());
  observer.observe(container);
  map.on("unload", () => observer.disconnect());
  return map;
}
