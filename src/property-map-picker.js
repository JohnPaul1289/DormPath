import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TUGUEGARAO_BARANGAYS, PENABLANCA_BARANGAYS, BARANGAY_COORDINATES } from "./domain.js";

// Common landmarks in Tuguegarao City & Peñablanca for instant search
const NOTABLE_LANDMARKS = [
  { name: "University of Saint Louis (USL)", barangay: "Ugac Sur", lat: 17.6056, lng: 121.7228 },
  { name: "St. Paul University Philippines (SPUP)", barangay: "Ugac Norte", lat: 17.6160, lng: 121.7210 },
  { name: "Cagayan State University (CSU) - Andrews Campus", barangay: "Caritan Centro", lat: 17.6189, lng: 121.7197 },
  { name: "Cagayan State University (CSU) - Carig Campus", barangay: "Carig Sur", lat: 17.6534, lng: 121.7501 },
  { name: "Cagayan Valley Medical Center (CVMC)", barangay: "Carig Sur", lat: 17.6565, lng: 121.7516 },
  { name: "Tuguegarao City Hall (People's Center)", barangay: "Enrile Boulevard", lat: 17.6508, lng: 121.7482 },
  { name: "SM Center Tuguegarao Downtown", barangay: "Centro 02", lat: 17.6142, lng: 121.7265 },
  { name: "Robinsons Place Tuguegarao", barangay: "Tanza", lat: 17.6042, lng: 121.7348 },
  { name: "Mall of the Valley", barangay: "Centro 01", lat: 17.6135, lng: 121.7278 },
  { name: "St. Peter Metropolitan Cathedral", barangay: "Centro 02", lat: 17.6138, lng: 121.7273 },
  { name: "Callao Cave Tourist Zone", barangay: "Callao", lat: 17.7058, lng: 121.8214 },
  { name: "Peñablanca Municipal Hall", barangay: "Camasi", lat: 17.6394, lng: 121.7942 },
  { name: "Sierra Cave Protected Area", barangay: "Alimanao", lat: 17.6892, lng: 121.8152 }
];

// In-memory geocode query cache
const searchCache = new Map();
const reverseCache = new Map();

/**
 * Creates the 3D-styled house marker DivIcon with glowing aura
 */
function createHouseMarkerIcon() {
  return L.divIcon({
    className: "pmp-marker-wrapper",
    html: `
      <div class="pmp-marker-container">
        <div class="pmp-marker-pulse"></div>
        <div class="pmp-marker-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div class="pmp-marker-tip"></div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -48]
  });
}

/**
 * Finds the nearest known barangay name from coordinate distance
 */
function findNearestBarangay(lat, lng) {
  let nearest = "Centro 01";
  let minDistance = Infinity;

  for (const [name, coords] of Object.entries(BARANGAY_COORDINATES)) {
    const dLat = lat - coords[1];
    const dLng = lng - coords[0];
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDistance) {
      minDistance = dist;
      nearest = name;
    }
  }
  return nearest;
}

/**
 * Mounts the advanced interactive property location map picker.
 */
export function mountPropertyMapPicker(mountEl, {
  initialLat = null,
  initialLng = null,
  initialBarangay = "",
  initialAddress = "",
  onLocationConfirmed = () => {},
  notify = (msg) => console.log(msg)
}) {
  if (!mountEl) return null;

  // Render container shell
  mountEl.innerHTML = `
    <div class="pmp-shell">
      <!-- Floating Glass Search Bar -->
      <div class="pmp-search-wrapper">
        <div class="pmp-search-bar">
          <svg class="pmp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input 
            type="text" 
            id="pmp-search-input" 
            class="pmp-search-input" 
            placeholder="Search street, barangay, or landmark (e.g. Gomez St, USL, Camasi)..." 
            autocomplete="off" 
          />
          <button type="button" id="pmp-search-clear" class="pmp-search-clear-btn" aria-label="Clear search" style="display:none;">✕</button>
        </div>
        <div id="pmp-search-dropdown" class="pmp-search-dropdown" style="display:none;"></div>

        <!-- Quick Landmark Flying Chips -->
        <div class="pmp-quick-chips" style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; align-items:center;">
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Quick jump:</span>
          <button type="button" class="pmp-chip-btn" data-lat="17.6056" data-lng="121.7228" data-name="University of Saint Louis (USL)">USL</button>
          <button type="button" class="pmp-chip-btn" data-lat="17.6160" data-lng="121.7210" data-name="St. Paul University Philippines (SPUP)">SPUP</button>
          <button type="button" class="pmp-chip-btn" data-lat="17.6189" data-lng="121.7197" data-name="CSU Andrews (Main)">CSU Andrews</button>
          <button type="button" class="pmp-chip-btn" data-lat="17.6534" data-lng="121.7501" data-name="CSU Carig Campus">CSU Carig</button>
          <button type="button" class="pmp-chip-btn" data-lat="17.6565" data-lng="121.7516" data-name="CVMC Hospital">CVMC</button>
          <button type="button" class="pmp-chip-btn" data-lat="17.6142" data-lng="121.7265" data-name="SM Center Downtown">SM Downtown</button>
        </div>
      </div>

      <!-- Map Display Container -->
      <div id="pmp-leaflet-map" class="pmp-map-canvas">
        <!-- Floating Glass Action Controls -->
        <div class="pmp-floating-actions">
          <button type="button" id="pmp-locate-btn" class="pmp-action-btn pmp-locate-btn" title="Center on My Device Location">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="22" y1="12" x2="18" y2="12"/>
              <line x1="6" y1="12" x2="2" y2="12"/>
              <line x1="12" y1="6" x2="12" y2="2"/>
              <line x1="12" y1="22" x2="12" y2="18"/>
            </svg>
            <span>Use My Location</span>
          </button>
          <button type="button" id="pmp-recenter-btn" class="pmp-action-btn pmp-icon-btn" title="Reset to Tuguegarao Center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
          <div class="pmp-zoom-controls">
            <button type="button" id="pmp-zoom-in" class="pmp-zoom-btn" title="Zoom in">+</button>
            <button type="button" id="pmp-zoom-out" class="pmp-zoom-btn" title="Zoom out">−</button>
          </div>
        </div>

        <!-- Instructional Tip Banner -->
        <div class="pmp-map-tip">
          <span style="font-size:1rem;">📍</span>
          <span>Click map or drag the house marker to set exact property pin</span>
        </div>
      </div>

      <!-- Selected Location & Confirmation Bar -->
      <div class="pmp-confirmation-card">
        <div class="pmp-loc-info">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
            <span class="pmp-label">PROPERTY LOCATION</span>
            <span id="pmp-status-pill" class="pmp-status-pill ${initialLat && initialLng ? 'is-confirmed' : 'is-pending'}">
              ${initialLat && initialLng ? '✓ Location Confirmed' : 'Location Not Confirmed'}
            </span>
          </div>
          <div id="pmp-readable-address" class="pmp-address-preview">
            ${initialAddress || (initialBarangay ? `${initialBarangay}, Tuguegarao / Peñablanca` : "Click on the map or search above to choose your property's location.")}
          </div>
        </div>
        <div class="pmp-confirm-action">
          <button type="button" id="pmp-btn-confirm" class="button primary pmp-btn-confirm" style="font-weight:700;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Confirm Property Location</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const mapContainer = mountEl.querySelector("#pmp-leaflet-map");
  const searchInput = mountEl.querySelector("#pmp-search-input");
  const searchDropdown = mountEl.querySelector("#pmp-search-dropdown");
  const searchClear = mountEl.querySelector("#pmp-search-clear");
  const addressPreview = mountEl.querySelector("#pmp-readable-address");
  const statusPill = mountEl.querySelector("#pmp-status-pill");
  const confirmBtn = mountEl.querySelector("#pmp-btn-confirm");

  // Determine starting coordinates
  let currentLat = initialLat ? Number(initialLat) : null;
  let currentLng = initialLng ? Number(initialLng) : null;
  let isConfirmed = Boolean(currentLat && currentLng);

  const defaultCoords = initialBarangay && BARANGAY_COORDINATES[initialBarangay]
    ? [BARANGAY_COORDINATES[initialBarangay][1], BARANGAY_COORDINATES[initialBarangay][0]]
    : [17.6132, 121.7270];

  const startLat = currentLat || defaultCoords[0];
  const startLng = currentLng || defaultCoords[1];

  // Initialize Leaflet Map
  const map = L.map(mapContainer, {
    center: [startLat, startLng],
    zoom: currentLat ? 16 : 14.5,
    zoomControl: false,
    minZoom: 11,
    maxZoom: 19
  });

  // OpenStreetMap Tile Layer
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Single Draggable House Marker
  let marker = null;
  let accuracyCircle = null;

  function placeOrMoveMarker(lat, lng, shouldCenter = false, zoomLevel = null) {
    currentLat = Number(lat.toFixed(6));
    currentLng = Number(lng.toFixed(6));

    if (!marker) {
      marker = L.marker([currentLat, currentLng], {
        icon: createHouseMarkerIcon(),
        draggable: true,
        autoPan: true
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onLocationChanged(pos.lat, pos.lng, false);
      });
    } else {
      marker.setLatLng([currentLat, currentLng]);
    }

    if (shouldCenter) {
      if (zoomLevel) {
        map.setView([currentLat, currentLng], zoomLevel, { animate: true });
      } else {
        map.panTo([currentLat, currentLng], { animate: true });
      }
    }
  }

  // If initial coordinates exist, place marker immediately
  if (currentLat && currentLng) {
    placeOrMoveMarker(currentLat, currentLng, false);
  }

  // Reverse Geocode Handler
  let reverseDebounce = null;
  async function reverseGeocode(lat, lng) {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (reverseCache.has(cacheKey)) {
      return reverseCache.get(cacheKey);
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { "Accept-Language": "en" }
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.street || addr.pedestrian || "";
        const village = addr.village || addr.suburb || addr.neighbourhood || addr.quarter || "";
        const city = addr.city || addr.town || addr.municipality || "Tuguegarao City";
        const state = addr.state || addr.province || "Cagayan";

        const parts = [road, village, city, state].filter(Boolean);
        const readable = parts.length ? parts.join(", ") : data.display_name;
        reverseCache.set(cacheKey, readable);
        return readable;
      }
    } catch (e) {
      console.warn("Reverse geocode failed, using local barangay fallback", e);
    }

    const fallbackBarangay = findNearestBarangay(lat, lng);
    const fallbackText = `${fallbackBarangay}, Tuguegarao / Peñablanca, Cagayan`;
    reverseCache.set(cacheKey, fallbackText);
    return fallbackText;
  }

  // Location Change Dispatcher
  function onLocationChanged(lat, lng, shouldCenter = false, zoomLevel = null, precomputedAddress = "") {
    placeOrMoveMarker(lat, lng, shouldCenter, zoomLevel);

    isConfirmed = true;
    statusPill.className = "pmp-status-pill is-confirmed";
    statusPill.textContent = "✓ Accurate Location Selected";
    confirmBtn.disabled = false;

    const nearestBarangay = findNearestBarangay(lat, lng);
    const initialAddr = precomputedAddress || `${nearestBarangay}, Tuguegarao / Peñablanca`;

    // Immediately push exact coordinates to parent form inputs so saving listing never uses fallback!
    onLocationConfirmed({
      lat: currentLat,
      lng: currentLng,
      address: initialAddr,
      barangay: nearestBarangay
    });

    // Update address preview
    if (precomputedAddress) {
      addressPreview.textContent = precomputedAddress;
    } else {
      addressPreview.textContent = "Locating exact address details...";
      clearTimeout(reverseDebounce);
      reverseDebounce = setTimeout(async () => {
        const addr = await reverseGeocode(lat, lng);
        addressPreview.textContent = addr;
        onLocationConfirmed({
          lat: currentLat,
          lng: currentLng,
          address: addr,
          barangay: nearestBarangay
        });
      }, 350);
    }
  }

  // Click on Map to Place / Move Marker
  map.on("click", (e) => {
    onLocationChanged(e.latlng.lat, e.latlng.lng, false);
  });

  // Confirm Location Button
  confirmBtn.addEventListener("click", () => {
    if (!currentLat || !currentLng) {
      notify("Please click or search the map to choose your property location first.");
      return;
    }

    isConfirmed = true;
    statusPill.className = "pmp-status-pill is-confirmed";
    statusPill.textContent = "✓ Location Confirmed";

    const resolvedAddress = addressPreview.textContent.trim();
    const nearestBarangay = findNearestBarangay(currentLat, currentLng);

    // Notify caller with exact coordinates and metadata
    onLocationConfirmed({
      lat: currentLat,
      lng: currentLng,
      address: resolvedAddress,
      barangay: nearestBarangay
    });

    notify(`Property location confirmed! (${currentLat.toFixed(5)}° N, ${currentLng.toFixed(5)}° E)`);
  });

  // "Use My Current Location" button
  const locateBtn = mountEl.querySelector("#pmp-locate-btn");
  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      notify("Geolocation is not supported by your browser.");
      return;
    }

    const originalText = locateBtn.innerHTML;
    locateBtn.disabled = true;
    locateBtn.innerHTML = `<span>Locating...</span>`;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locateBtn.disabled = false;
        locateBtn.innerHTML = originalText;

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        // Accuracy circle indicator
        if (accuracyCircle) map.removeLayer(accuracyCircle);
        accuracyCircle = L.circle([lat, lng], {
          radius: Math.max(accuracy, 20),
          color: "#3b82f6",
          fillColor: "#60a5fa",
          fillOpacity: 0.15,
          weight: 1.5
        }).addTo(map);

        onLocationChanged(lat, lng, true, 16.5);
        notify("Current location detected! Click 'Confirm Property Location' to save.");
      },
      (err) => {
        locateBtn.disabled = false;
        locateBtn.innerHTML = originalText;
        notify(`Could not get GPS location (${err.message}). Tap the map directly.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });

  // Recenter Button
  mountEl.querySelector("#pmp-recenter-btn").addEventListener("click", () => {
    map.setView([17.6132, 121.7270], 14.5, { animate: true });
  });

  // Zoom Controls
  mountEl.querySelector("#pmp-zoom-in").addEventListener("click", () => map.zoomIn());
  mountEl.querySelector("#pmp-zoom-out").addEventListener("click", () => map.zoomOut());

  // Search Logic (Local Landmarks + Nominatim Geocoding)
  let searchDebounce = null;

  function performSearch(query) {
    query = query.toLowerCase().trim();
    if (!query) {
      searchDropdown.style.display = "none";
      searchClear.style.display = "none";
      return;
    }

    searchClear.style.display = "block";
    const matches = [];

    // 1. Search notable universities, malls & landmarks
    for (const lm of NOTABLE_LANDMARKS) {
      if (lm.name.toLowerCase().includes(query) || lm.barangay.toLowerCase().includes(query)) {
        matches.push({
          title: lm.name,
          subtitle: `${lm.barangay}, Tuguegarao / Peñablanca`,
          lat: lm.lat,
          lng: lm.lng,
          icon: "🏫"
        });
      }
    }

    // 2. Search Tuguegarao & Peñablanca Barangays
    for (const [name, coords] of Object.entries(BARANGAY_COORDINATES)) {
      if (name.toLowerCase().includes(query)) {
        const isPenablanca = PENABLANCA_BARANGAYS.includes(name);
        matches.push({
          title: `Brgy. ${name}`,
          subtitle: isPenablanca ? "Peñablanca, Cagayan" : "Tuguegarao City, Cagayan",
          lat: coords[1],
          lng: coords[0],
          icon: "📍"
        });
      }
    }

    // Render local matches instantly
    renderSearchResults(matches.slice(0, 6));

    // 3. Search Nominatim for full street addresses
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(async () => {
      if (query.length < 3) return;
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Cagayan, Philippines')}&viewbox=121.5,17.8,121.9,17.5&bounded=0&countrycodes=ph&limit=5`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        if (res.ok) {
          const remoteResults = await res.json();
          for (const item of remoteResults) {
            matches.push({
              title: item.display_name.split(",")[0],
              subtitle: item.display_name.split(",").slice(1, 4).join(","),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              icon: "🏠"
            });
          }
          renderSearchResults(matches.slice(0, 8));
        }
      } catch (err) {
        console.warn("Geocoding lookup error", err);
      }
    }, 400);
  }

  function renderSearchResults(results) {
    if (!results.length) {
      searchDropdown.innerHTML = `<div class="pmp-dropdown-empty">No exact locations found. Tap directly on the map.</div>`;
      searchDropdown.style.display = "block";
      return;
    }

    searchDropdown.innerHTML = results.map((r, idx) => `
      <div class="pmp-dropdown-item" data-idx="${idx}">
        <span class="pmp-item-icon">${r.icon}</span>
        <div class="pmp-item-text">
          <strong class="pmp-item-title">${r.title}</strong>
          <span class="pmp-item-subtitle">${r.subtitle}</span>
        </div>
      </div>
    `).join("");

    searchDropdown.style.display = "block";

    searchDropdown.querySelectorAll(".pmp-dropdown-item").forEach((el) => {
      el.addEventListener("click", () => {
        const item = results[Number(el.dataset.idx)];
        if (item) {
          searchInput.value = item.title;
          searchDropdown.style.display = "none";
          onLocationChanged(item.lat, item.lng, true, 16.5, `${item.title}, ${item.subtitle}`);
        }
      });
    });
  }

  searchInput.addEventListener("input", (e) => performSearch(e.target.value));

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchDropdown.style.display = "none";
    searchClear.style.display = "none";
  });

  // Close search dropdown on click outside
  document.addEventListener("click", (evt) => {
    if (!mountEl.contains(evt.target)) {
      searchDropdown.style.display = "none";
    }
  });

  // Handle Resize & Invalidate Size for Smooth Display
  setTimeout(() => map.invalidateSize(), 100);
  setTimeout(() => map.invalidateSize(), 400);
  setTimeout(() => map.invalidateSize(), 800);

  const resizeObserver = new ResizeObserver(() => {
    map.invalidateSize();
  });
  resizeObserver.observe(mapContainer);

  // Quick Landmark Flying Chips click listener
  mountEl.querySelectorAll(".pmp-chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lat = Number(btn.dataset.lat);
      const lng = Number(btn.dataset.lng);
      const name = btn.dataset.name;
      onLocationChanged(lat, lng, true, 16.5, name);
      searchInput.value = name;
      notify(`Map centered on ${name}. Adjust pin to your exact building entrance.`);
    });
  });

  return {
    map,
    getCoordinates: () => ({ lat: currentLat, lng: currentLng, isConfirmed }),
    setBarangay: (barangayName) => {
      if (barangayName && BARANGAY_COORDINATES[barangayName]) {
        const coords = BARANGAY_COORDINATES[barangayName];
        const lat = coords[1];
        const lng = coords[0];
        onLocationChanged(lat, lng, true, 15.5, `${barangayName}, Tuguegarao / Peñablanca`);
      }
    },
    setCoordinates: (lat, lng, addr = "") => {
      onLocationChanged(lat, lng, true, 16.5, addr);
    },
    destroy: () => {
      resizeObserver.disconnect();
      map.remove();
    }
  };
}
