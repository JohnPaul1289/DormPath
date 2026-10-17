import "./style.css";
import "leaflet/dist/leaflet.css";
import {
  createIcons,
  House,
  Compass,
  Search,
  Map,
  MessageSquarePlus,
  Heart,
  MessagesSquare,
  Bell,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  CircleHelp,
  SunMoon,
  MapPin,
  ArrowUpRight,
  ArrowRight,
  UserRound,
  Wallet,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  KeyRound,
  Sofa,
  Armchair,
  BedSingle,
  HousePlus,
  HeartHandshake,
  SlidersHorizontal,
  LayoutGrid,
  Navigation,
  Flag,
  Plus,
  Send,
  X,
} from "lucide";
const icons = {
  House,
  Compass,
  Search,
  Map,
  MessageSquarePlus,
  Heart,
  MessagesSquare,
  Bell,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  CircleHelp,
  SunMoon,
  MapPin,
  ArrowUpRight,
  ArrowRight,
  UserRound,
  Wallet,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  KeyRound,
  Sofa,
  Armchair,
  BedSingle,
  HousePlus,
  HeartHandshake,
  SlidersHorizontal,
  LayoutGrid,
  Navigation,
  Flag,
  Plus,
  Send,
  X,
};
import * as api from "./api";
import {
  TYPES,
  AMENITIES,
  money,
  escapeHTML as e,
  filterProperties,
  domiReply,
} from "./domain";
import { cached, privateEnabled, clearPrivate } from "./offline";
const state = {
  properties: [],
  favorites: [],
  cursor: null,
  more: false,
  loaded: false,
  error: "",
  stale: false,
  syncedAt: null,
  filters: {},
  chat: null,
};
let unsubscribe = () => {},
  map,
  routeVersion = 0;
const $ = (s) => document.querySelector(s),
  icon = (name, cls = "") => `<i data-lucide="${name}" class="${cls}"></i>`;
const button = (text, action, cls = "primary") =>
  `<button class="${cls}" data-action="${action}">${text}</button>`;
const date = (value) =>
  value?.seconds
    ? new Date(value.seconds * 1000).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not confirmed";
function toast(message) {
  if ($("#modal")?.open) {
    let note = $("#modal .dialog-toast");
    if (!note) {
      note = document.createElement("div");
      note.className = "notice dialog-toast";
      note.setAttribute("role", "status");
      $("#modal").append(note);
    }
    note.textContent = message;
  }
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 5500);
}
function refreshIcons() {
  createIcons({ icons, attrs: { "stroke-width": 1.7 } });
}
const nav = (path, label, name) =>
  `<a href="#/${path}" class="${location.hash.split("/")[1] === path ? "active" : ""}">${icon(name)}<span>${label}</span></a>`;
function shell() {
  return `<aside class="sidebar"><a href="#/home" class="brand"><span class="brand-icon">${icon("house")}</span>Dorm<span>Path</span><small>YOUR NEXT CHAPTER STARTS HERE</small></a><div class="nav-caption">DISCOVER</div><nav>${nav("home", "Discover", "compass")}${nav("search", "Explore rooms", "search")}${nav("map", "Map view", "map")}${nav("wanted", "Kwarto Wanted", "message-square-plus")}</nav><div class="nav-caption">YOUR SPACE</div><nav>${nav("favorites", "Saved places", "heart")}${nav("messages", "Messages", "messages-square")}${nav("notifications", "Notifications", "bell")}${nav("dashboard", "Dashboard", "layout-dashboard")}${api.profile?.role === "landlord" ? nav("properties", "My properties", "building-2") : ""}${api.isAdmin ? nav("admin", "Admin console", "shield-check") : ""}</nav><div class="sidebar-bottom"><div class="free-note">${icon("sparkles")}<strong>A little less searching.<br>A lot more living.</strong><p>Always free for students.</p></div><nav>${nav("about", "About DormPath", "circle-help")}</nav><button class="theme-btn" data-action="theme">${icon("sun-moon")}<span>Switch appearance</span></button><div class="sidebar-footer">Made for your next chapter <span>✦</span></div></div></aside><div class="workspace"><header class="topbar"><div class="location">${icon("map-pin")}<span>Tuguegarao City, <strong>PH</strong></span><span class="live-dot"></span></div><a class="mobile-brand" href="#/home">Dorm<span>Path</span></a><div class="top-actions"><a class="owner-link" href="#/${api.currentUser ? "properties" : "register"}">List your property ${icon("arrow-up-right")}</a><span class="divider"></span>${api.currentUser ? `<a class="account" href="#/profile">${icon("user-round")}<span>${e(api.profile?.name || "My account")}</span></a>` : `<a class="signin" href="#/login">Log in</a><a class="button primary small" href="#/register">Get started ${icon("arrow-right")}</a>`}</div></header>${!navigator.onLine ? '<div class="connection-banner">Offline · cached details and vacancies may have changed. Messages are not delivered until reconnection.</div>' : ""}<main id="main" tabindex="-1"></main><footer class="page-footer"><span>© ${new Date().getFullYear()} DormPath</span><span>Find your space. Feel at home.</span><a href="#/about">Privacy & community</a></footer></div><nav class="mobile-nav">${nav("home", "Discover", "compass")}${nav("search", "Search", "search")}${nav("favorites", "Saved", "heart")}${nav("messages", "Chat", "messages-square")}${nav("profile", "You", "user-round")}</nav>`;
}
function searchForm() {
  return `<form id="search-form" class="search-bar"><label>${icon("map-pin")}<span><strong>Where do you want to stay?</strong><input name="q" aria-label="School, barangay or location" placeholder="School, barangay, or neighborhood" value="${e(state.filters.q || "")}"></span></label><label>${icon("wallet")}<span><strong>Monthly budget</strong><select name="budget" aria-label="Monthly budget"><option value="">Any budget</option>${[2000, 3000, 5000, 8000, 12000].map((n) => `<option value="${n}" ${Number(state.filters.budget) === n ? "selected" : ""}>Up to ${money(n)}</option>`).join("")}</select></span></label><button class="primary" type="submit">${icon("search")}<span>Find my space</span></button></form>`;
}
function home() {
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span> A NEW CHAPTER. A PLACE TO CALL YOURS.</div><h1>Find your space.<br>Feel <span>at home.<svg viewBox="0 0 300 12" aria-hidden="true"><path d="M3 8Q140-3 295 5"/></svg></span></h1><p>Your kind of room. Your kind of people.<br>Discover a place that feels right, right here in Tuguegarao.</p><div class="hero-benefits"><span>${icon("badge-check")}Verified owners</span><span>${icon("message-circle")}Direct conversations</span><span>${icon("heart")}Always free</span></div><a class="hero-link" href="#/search">Let’s find where you belong ${icon("arrow-up-right")}</a></div><div class="hero-art"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="art-dot dot-one"></div><div class="art-dot dot-two"></div><div class="floating greeting"><span>Hey, I’m <b>DOMI!</b> 👋</span><small>Your little home-finding helper.</small></div><img src="/domi.png" alt="DOMI, a friendly blue house-shaped robot holding a golden key" fetchpriority="high"><div class="floating key-note">${icon("key-round")}<span>Your next chapter<br><b>starts with a key.</b></span></div><span class="art-spark">✦</span></div></section><section class="search-section">${searchForm()}<div class="popular"><span>START NEAR YOUR CAMPUS</span>${["University of Saint Louis", "Cagayan State University", "St. Paul University"].map((s) => `<button data-school="${e(s)}">${s} ${icon("arrow-up-right")}</button>`).join("")}</div></section><section class="section"><div class="section-heading"><div><span class="overline">A SPACE FOR EVERY KIND OF YOU</span><h2>Make yourself at home.</h2></div><a href="#/search">Explore all spaces ${icon("arrow-right")}</a></div><div class="type-grid">${[
    ["Boarding house", "house", "A home away from home"],
    ["Dormitory", "building-2", "Better together"],
    ["Apartment", "sofa", "A little more independence"],
    ["Studio", "armchair", "Your own little world"],
    ["Bedspace", "bed-single", "Big possibilities. Small budget."],
  ]
    .map(
      ([t, i, d], n) =>
        `<button class="type-card type-${n}" data-type="${t}"><span class="type-icon">${icon(i)}</span><strong>${t}</strong><small>${d}</small><span class="type-arrow">${icon("arrow-up-right")}</span></button>`,
    )
    .join(
      "",
    )}</div></section><section class="section"><div class="section-heading"><div><span class="overline">YOUR NEXT HOME COULD BE HERE</span><h2>Spaces to start your story.</h2><p>Real listings. Clear prices. A direct hello to the owner.</p></div><a href="#/map">${icon("map")} Explore the map</a></div>${listingArea(state.properties.slice(0, 3))}</section><section class="domi-banner"><div class="domi-avatar"><img src="/domi.png" alt="DOMI"></div><div><span class="overline">A LITTLE HELP FROM DOMI</span><h2>Not sure where to start? Let’s figure it out.</h2><p>Tell me your budget and what feels like home. We’ll take it from there.</p></div>${button(`Meet DOMI ${icon("sparkles")}`, "domi", "primary")}</section><section class="promise-row"><div>${icon("heart-handshake")}<span><strong>Student life is expensive enough.</strong><small>Finding your next home shouldn’t be. No subscriptions. No messaging fees.</small></span></div><a href="#/about">Our promise ${icon("arrow-right")}</a></section>`;
}
function empty(title, description, action = "") {
  return `<div class="empty"><span class="empty-icon">${icon("house-plus")}</span><h3>${title}</h3><p>${description}</p>${action}</div>`;
}
function listingArea(items) {
  if (!state.loaded)
    return `<div class="skeleton-grid">${'<div class="skeleton"></div>'.repeat(3)}</div>`;
  if (!items.length)
    return empty(
      state.error
        ? "Your next home is on its way."
        : "A fresh start for Tuguegarao.",
      state.error ||
        "No published spaces yet. Owners can add their properties, and students can tell the community what they’re looking for.",
      `<a class="button outline" href="#/wanted">Post what you’re looking for ${icon("arrow-right")}</a>`,
    );
  return `<div class="property-grid">${items.map(card).join("")}</div>`;
}
function card(p) {
  const saved = state.favorites.some((f) => f.propertyId === p.id);
  return `<article class="property-card"><a href="#/property/${e(p.id)}" class="property-image">${p.photos?.[0] ? `<img src="${e(p.photos[0])}" alt="${e(p.title)}" loading="lazy">` : `<div class="no-photo">${icon("building-2")}<span>Photo not provided</span></div>`}<span class="vacancy">${p.available > 0 ? `${p.available} spaces reported` : "Currently full"}</span></a><button class="save-button ${saved ? "saved" : ""}" data-save="${e(p.id)}" aria-label="${saved ? "Unsave" : "Save"} ${e(p.title)}">${icon("heart")}</button><div class="property-body"><div class="property-meta">${e(p.roomTypes?.[0] || "Room")}<span>${icon("shield-check")} Owner verified</span></div><a href="#/property/${e(p.id)}"><h3>${e(p.title)}</h3></a><p>${icon("map-pin")} ${e(p.barangay)}, Tuguegarao</p><div class="amenity-line">${(
    p.amenities || []
  )
    .slice(0, 3)
    .map((a) => `<span>${e(a)}</span>`)
    .join(
      "",
    )}</div><div class="price"><strong>${money(p.minPrice)}</strong><span> / month · from</span><a href="#/property/${e(p.id)}" aria-label="View ${e(p.title)}">${icon("arrow-up-right")}</a></div><small class="muted">Owner updated ${date(p.vacancyConfirmedAt)}${state.stale ? " · Cached" : ""}</small></div></article>`;
}
function pageHeading(kicker, title, description = "", action = "") {
  return `<div class="page-heading"><div><span class="overline">${kicker}</span><h1>${title}</h1>${description ? `<p>${description}</p>` : ""}</div>${action}</div>`;
}
function filters() {
  return `<form id="filters" class="filter-row"><select name="type" aria-label="Room type"><option value="">All room types</option>${TYPES.map((t) => `<option ${state.filters.type === t ? "selected" : ""}>${t}</option>`).join("")}</select><label class="check"><input type="checkbox" name="vacant" ${state.filters.vacant ? "checked" : ""}> With vacancies</label><details><summary>${icon("sliders-horizontal")} Amenities</summary><div class="filter-popover">${AMENITIES.map((a) => `<label class="check"><input name="amenities" type="checkbox" value="${a}" ${state.filters.amenities?.includes(a) ? "checked" : ""}>${a}</label>`).join("")}</div></details><button class="outline">Apply filters</button><button type="button" class="text-button" data-action="reset-filters">Reset</button></form>`;
}
function searchPage(mapView = false) {
  const items = filterProperties(state.properties, state.filters);
  return `${pageHeading("FIND YOUR PEOPLE. FIND YOUR PLACE.", mapView ? "A new perspective on home." : "Your space is out there.", "Explore owner-listed spaces in Tuguegarao City.", `<a class="button outline" href="#/${mapView ? "search" : "map"}">${icon(mapView ? "layout-grid" : "map")}${mapView ? "List view" : "Map view"}</a>`)}${searchForm()}${filters()}<div class="results-meta"><span>${items.length} matching ${items.length === 1 ? "space" : "spaces"} in loaded results</span><span>${state.stale ? "Offline cache · vacancies may have changed" : state.syncedAt ? `Last sync ${new Date(state.syncedAt).toLocaleTimeString()}` : "Awaiting live listings"}</span></div>${mapView ? '<div id="map" aria-label="Property locations"></div>' : listingArea(items)}${state.more ? button("Load more properties", "load-more", "outline load-more") : ""}`;
}
function authPage(register = false) {
  return `<div class="auth-layout"><div class="auth-intro"><span class="overline">WELCOME TO YOUR NEXT CHAPTER</span><h1>A place to stay.<br>A place to belong.</h1><img src="/domi.png" alt="DOMI welcomes you"><p>Student accounts and conversations are always free.</p></div><form class="panel auth-form" id="${register ? "register" : "login"}"><h2>${register ? "Make yourself at home." : "Welcome home."}</h2><p>${register ? "Create your free DormPath account." : "Sign in to pick up where you left off."}</p>${register ? '<label>Your name<input name="name" required maxlength="80" autocomplete="name" placeholder="What should we call you?"></label>' : ""}<label>Email address<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label><label>Password<input name="password" type="password" required minlength="8" autocomplete="${register ? "new-password" : "current-password"}" placeholder="At least 8 characters"></label>${register ? '<label>I’m here as a<select name="role"><option value="student">Student / renter</option><option value="landlord">Property owner</option></select></label><p class="fine-print">Owners require administrator verification before managing listings. By joining, you agree to our <a href="#/about">community and privacy guidelines</a>.</p>' : button("Forgot password?", "reset-password", "text-button")}<button class="primary">${register ? "Create free account" : "Log in"} ${icon("arrow-right")}</button><div class="auth-divider"><span>or</span></div><button type="button" class="button outline full google-btn" data-action="google-auth" data-register="${register}">${icon("sparkles")} Continue with Google</button><p class="auth-switch">${register ? "Already found us?" : "New around here?"} <a href="#/${register ? "login" : "register"}">${register ? "Log in" : "Create an account"}</a></p>${!api.configured ? '<div class="notice">Account services are not connected yet. The project owner must configure Firebase before sign-in is available.</div>' : ""}</form></div>`;
}
function gate() {
  return empty(
    "Your own little corner of DormPath.",
    "Sign in to save rooms, message owners, and manage your space.",
    `<a class="button primary" href="#/login">Log in</a> <a class="button outline" href="#/register">Join for free</a>`,
  );
}
async function details(id) {
  const p = await api.getProperty(id),
    rooms = await api.listRooms(id, p.status === "published");
  return `${pageHeading(e(p.barangay) + " · TUGUEGARAO CITY", e(p.title), e(p.address), button(`${icon("heart")} Save place`, `save:${p.id}`, "outline"))}<div class="gallery">${p.photos?.length ? p.photos.map((url) => `<a href="${e(url)}" target="_blank" rel="noopener"><img src="${e(url)}" alt="Photo of ${e(p.title)}"></a>`).join("") : empty("No photos provided", "Ask the owner for current photos before arranging a viewing.")}</div><div class="detail-grid"><div><section class="panel"><span class="badge">${icon("shield-check")} Verified property owner</span><h2>A little about this space</h2><p class="preserve">${e(p.description)}</p><div class="amenity-line">${p.amenities.map((a) => `<span>${e(a)}</span>`).join("")}</div><h3>House rules</h3><p class="preserve">${e(p.rules)}</p><h3>Move-in costs</h3><p>Deposit: ${money(p.deposit)} · Advance: ${money(p.advance)}</p><p>Utilities: ${e(p.utilities)}</p></section><section class="panel"><h2>Rooms & availability</h2><p class="muted">Owner confirmed ${date(p.vacancyConfirmedAt)}. Please reconfirm directly.</p>${rooms.map((r) => `<div class="list-row"><div><strong>${e(r.name)}</strong><p>${e(r.type)} · ${r.available} of ${r.capacity} spaces available</p></div><strong>${money(r.price)}<small> / month</small></strong></div>`).join("") || "<p>No room inventory published yet.</p>"}</section></div><aside class="panel contact-card"><span class="overline">YOUR NEXT CHAPTER</span><h2>${money(p.minPrice)}<small> / month, from</small></h2><p>${p.available} owner-reported spaces</p><hr><h3>${e(p.ownerName)}</h3><p>Verified property owner</p><button class="primary" data-chat-property="${e(p.id)}">${icon("message-circle")} Message owner</button><a class="button outline" href="https://www.openstreetmap.org/directions?to=${Number(p.lat)},${Number(p.lng)}" target="_blank" rel="noopener">${icon("navigation")} Get directions</a><p class="fine-print">No platform booking or messaging fees. Inspect the room and verify payment details directly with the owner.</p><button class="text-button" data-report="${e(p.id)}">${icon("flag")} Report this listing</button></aside></div>`;
}
function propertyForm(p = {}) {
  return `${pageHeading("OWNER WORKSPACE", p.id ? "Edit your property." : "Welcome someone home.", "Submit real details and photos. Listing changes return to moderation.")}<form id="property-form" data-id="${e(p.id || "")}" class="panel form-grid"><label>Property name<input name="title" required maxlength="120" value="${e(p.title)}"></label><label>Barangay<input name="barangay" required maxlength="100" value="${e(p.barangay)}"></label><label class="full">Street address<input name="address" required maxlength="250" value="${e(p.address)}"></label><label>Nearby school<input name="school" maxlength="120" value="${e(p.school)}"></label><label>Starting monthly price (₱)<input name="minPrice" type="number" min="0" max="1000000" required value="${p.minPrice ?? ""}"></label><label>Latitude<input name="lat" type="number" step="any" min="-90" max="90" required value="${p.lat ?? 17.6132}"></label><label>Longitude<input name="lng" type="number" step="any" min="-180" max="180" required value="${p.lng ?? 121.727}"></label><p class="fine-print full">Set the actual coordinates of your entrance. You can locate them using the map view / OpenStreetMap.</p><label>Deposit (₱)<input name="deposit" type="number" min="0" max="1000000" required value="${p.deposit ?? 0}"></label><label>Advance payment (₱)<input name="advance" type="number" min="0" max="1000000" required value="${p.advance ?? 0}"></label><label class="full">Description<textarea name="description" required maxlength="4000">${e(p.description)}</textarea></label><label class="full">Utilities and other charges<textarea name="utilities" required maxlength="1000">${e(p.utilities)}</textarea></label><label class="full">House rules<textarea name="rules" required maxlength="2000">${e(p.rules)}</textarea></label><fieldset class="full"><legend>Room types</legend><div class="checks">${TYPES.map((t) => `<label class="check"><input type="checkbox" name="roomTypes" value="${t}" ${p.roomTypes?.includes(t) ? "checked" : ""}>${t}</label>`).join("")}</div></fieldset><fieldset class="full"><legend>Amenities</legend><div class="checks">${AMENITIES.map((t) => `<label class="check"><input type="checkbox" name="amenities" value="${t}" ${p.amenities?.includes(t) ? "checked" : ""}>${t}</label>`).join("")}</div></fieldset><label class="full">Property photos (up to 8 total)<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple><small>JPEG, PNG or WebP, up to 10 MB each. Images are compressed before upload.</small></label><div class="full existing-photos">${(p.photos || []).map((url) => `<label><img src="${e(url)}" alt="Existing property photo"><span><input name="keepPhotos" type="checkbox" value="${e(url)}" checked> Keep photo</span></label>`).join("")}</div><button class="primary full">Save for review ${icon("arrow-right")}</button></form>`;
}
async function propertiesPage() {
  if (api.profile?.role !== "landlord")
    return empty(
      "Have a space to share?",
      "Landlord accounts can add and manage properties. Register as an owner to begin.",
    );
  if (!api.profile.verified)
    return empty(
      "Let’s verify your ownership.",
      "An administrator must verify your identity and ownership before you can manage listings. Contact the platform operator using the launch contact in the setup guide.",
    );
  const properties = await api.ownProperties();
  return `${pageHeading("OWNER WORKSPACE", "A home for your properties.", "Keep your vacancies current. Every inquiry is free.", `<a class="button primary" href="#/add-property">${icon("plus")} Add property</a>`)}${properties.length ? properties.map((p) => `<div class="panel owner-property"><div><span class="badge">${e(p.status)}</span><h2>${e(p.title)}</h2><p>${p.available} available / ${p.capacity} total spaces</p></div><div class="button-row"><a class="button outline" href="#/edit-property/${p.id}">Edit</a><a class="button primary" href="#/rooms/${p.id}">Manage rooms</a><button class="text-button" data-status="${p.id}:paused">Pause</button><button class="text-button" data-status="${p.id}:archived">Archive</button>${p.status === "archived" ? `<button class="text-button" data-delete-property="${p.id}">Delete</button>` : ""}</div></div>`).join("") : empty("Your first welcome starts here.", "Add a property, then create its room inventory.")}`;
}
async function roomsPage(id) {
  const p = await api.getProperty(id),
    rooms = await api.listRooms(id);
  state.rooms = rooms;
  state.roomProperty = id;
  return `${pageHeading("ROOM INVENTORY", e(p.title), "Keep availability accurate. Occupancy changes are saved atomically.", button(`${icon("plus")} Add room`, "add-room"))}<div class="panel">${rooms.map((r) => `<div class="list-row"><div><strong>${e(r.name)}</strong><p>${e(r.type)} · ${money(r.price)}/month · ${r.available}/${r.capacity} available</p></div><div class="button-row"><button class="outline" data-room="${r.id}">Edit</button><button class="outline" data-occupy="${r.id}" ${r.available === 0 ? "disabled" : ""}>Mark one occupied</button><button class="outline" data-vacate="${r.id}" ${r.available === r.capacity ? "disabled" : ""}>Free one space</button></div></div>`).join("") || empty("Room for a new beginning.", "Add room types, prices, capacity and current availability.")}</div>`;
}
function roomDialog(r = {}) {
  modal(
    `<form id="room-form" data-id="${e(r.id || "")}"><h2>${r.id ? "Edit room" : "Add a room"}</h2><label>Room name<input name="name" required maxlength="100" value="${e(r.name)}"></label><label>Type<select name="type">${TYPES.map((t) => `<option ${t === r.type ? "selected" : ""}>${t}</option>`).join("")}</select></label><label>Monthly price (₱)<input name="price" type="number" required min="0" max="1000000" value="${r.price ?? ""}"></label><label>Capacity<input name="capacity" type="number" required min="1" max="100" value="${r.capacity ?? 1}"></label><label>Available spaces<input name="available" type="number" required min="0" max="100" value="${r.available ?? 1}"></label><button class="primary">Save room</button></form>`,
  );
}
async function wantedPage() {
  let requests = [];
  if (api.configured) requests = await api.requests();
  state.requests = requests;
  return `${pageHeading("KWARTO WANTED", "A room that gets you.", "Tell local owners what you’re looking for. Keep contact details private.", button(`${icon("plus")} Post a room request`, "new-request"))}${requests.length ? `<div class="request-grid">${requests.map((r) => `<article class="panel request-card"><span class="badge">Looking for ${e(r.type)}</span><h2>${e(r.location)}</h2><strong class="request-price">Up to ${money(r.budget)} / month</strong><p>${e(r.name)} · ${r.occupants} occupant(s)</p><p>Move-in: ${e(r.moveIn)}</p><p>${e(r.notes)}</p>${r.userId === api.currentUser?.uid ? `<button class="outline" data-close-request="${r.id}">Close request</button>` : api.profile?.role === "landlord" ? `<button class="primary" data-offer="${r.id}">Offer a room</button>` : "<small>Verified owners can respond privately.</small>"}</article>`).join("")}</div>` : empty("Put your next home out there.", "No open requests yet. Share your budget, preferred area, and move-in date to help owners find you.")}`;
}
async function favoritesPage() {
  const favs = await api.favorites();
  state.favorites = favs;
  const props = (
    await Promise.all(
      favs.map(async (f) => {
        try {
          return await api.getProperty(f.propertyId);
        } catch {
          return null;
        }
      }),
    )
  ).filter(Boolean);
  return `${pageHeading("YOUR SHORTLIST", "The places that feel like you.", "Save a little inspiration. Compare the details before saying hello.")}${props.length ? `${listingArea(props)}<section class="panel comparison"><h2>A closer look</h2><div class="table-scroll"><table><thead><tr><th>Property</th><th>From / month</th><th>Deposit</th><th>Advance</th><th>Reported spaces</th><th>Amenities</th></tr></thead><tbody>${props.map((p) => `<tr><td><a href="#/property/${p.id}">${e(p.title)}</a></td><td>${money(p.minPrice)}</td><td>${money(p.deposit)}</td><td>${money(p.advance)}</td><td>${p.available}</td><td>${p.amenities.map(e).join(", ")}</td></tr>`).join("")}</tbody></table></div></section>` : empty("Keep the good ones close.", "Tap the heart on any listing to build your shortlist.", `<a class="button primary" href="#/search">Explore rooms</a>`)}`;
}
async function dashboard() {
  const owner = api.profile?.role === "landlord";
  const data = owner ? await api.ownProperties() : await api.favorites();
  const convs = await api.conversations();
  return `${pageHeading("YOUR DORMPATH", `Welcome back, ${e(api.profile?.name || "neighbor")}.`, "A little closer to feeling at home.")}<div class="stats-grid"><div class="panel"><span>${owner ? "Properties" : "Saved places"}</span><strong>${data.length}</strong></div><div class="panel"><span>Conversations</span><strong>${convs.length}</strong></div><div class="panel"><span>${owner ? "Reported vacancies" : "Student platform fees"}</span><strong>${owner ? data.reduce((n, p) => n + p.available, 0) : "₱0"}</strong></div></div><div class="panel"><h2>Where would you like to go?</h2><div class="button-row"><a class="button primary" href="#/${owner ? "properties" : "search"}">${owner ? "Manage properties" : "Explore rooms"}</a><a class="button outline" href="#/messages">Open messages</a><a class="button outline" href="#/wanted">Kwarto Wanted</a></div></div>`;
}
async function messagesPage(id) {
  const convs = await api.conversations();
  state.conversations = convs;
  const selected = convs.find((c) => c.id === id);
  state.chat = selected;
  return `${pageHeading("A CONVERSATION CAN OPEN A DOOR.", "Your messages.", "Private conversations between you and your future neighbor.")}<div class="messenger"><aside class="conversation-list"><h3>Inbox <span>${convs.filter((c) => c.lastSender !== api.currentUser.uid && c.updatedAt?.seconds > (c.readAt?.[api.currentUser.uid]?.seconds || 0)).length} unread</span></h3>${convs.map((c) => `<a class="conversation ${c.id === id ? "selected" : ""}" href="#/messages/${c.id}"><span class="conversation-avatar">${icon("house")}</span><div><strong>${e(c.title)}</strong><p>${e(c.lastMessage || "Say hello to start the conversation.")}</p><small>${date(c.updatedAt)}</small></div>${c.lastSender !== api.currentUser.uid && c.updatedAt?.seconds > (c.readAt?.[api.currentUser.uid]?.seconds || 0) ? '<span class="unread-dot"></span>' : ""}</a>`).join("") || '<p class="muted">No conversations yet. Open a listing and message its owner.</p>'}</aside><section class="chat-pane">${selected ? `<header class="chat-header"><div><strong>${e(selected.title)}</strong><small>Only conversation participants can read messages</small></div><button class="text-button" data-action="block">Block</button></header><div id="viewings"></div><button class="text-button" data-action="older-messages">Load older messages</button><div id="messages" class="message-list" aria-live="polite"><p>Loading conversation…</p></div><form id="message-form"><label class="sr-only" for="message-text">Message</label><textarea id="message-text" name="text" maxlength="2000" required placeholder="A friendly hello goes a long way…"></textarea><button class="primary" aria-label="Send message">${icon("send")}</button></form><div class="chat-footer"><span>${navigator.onLine ? "Messages are sent only after server confirmation." : "Offline · drafts stay pending until delivered."}</span>${selected.studentId === api.currentUser.uid ? button("Request a viewing", "viewing", "text-button") : ""}</div>` : empty("A good home starts with a hello.", "Choose a conversation, or explore a listing to message its owner.")}</section></div>`;
}
function renderMessages(items) {
  state.messages = items;
  const box = $("#messages");
  if (!box) return;
  box.innerHTML =
    items
      .map(
        (m) =>
          `<div class="message ${m.senderId === api.currentUser.uid ? "mine" : ""}"><p>${e(m.text)}</p><small>${date(m.createdAt)}${m.senderId === api.currentUser.uid ? (state.chat.readAt?.[state.chat.ownerId === api.currentUser.uid ? state.chat.studentId : state.chat.ownerId]?.seconds >= m.createdAt?.seconds ? " · Read" : " · Sent") : ""}</small></div>`,
      )
      .join("") || '<p class="muted">Start with a friendly hello.</p>';
  box.scrollTop = box.scrollHeight;
  showPending();
}
async function showPending() {
  const queue = (await cached(`queue:${api.currentUser?.uid}`)) || [];
  if (!$("#messages")) return;
  document.querySelectorAll("#messages .pending").forEach((el) => el.remove());
  $("#messages").insertAdjacentHTML(
    "beforeend",
    queue
      .filter((m) => m.conversationId === state.chat?.id)
      .map(
        (m) =>
          `<div class="message mine pending"><p>${e(m.text)}</p><small>Pending · saved on this device</small></div>`,
      )
      .join(""),
  );
}
async function profilePage() {
  return `${pageHeading("YOUR ACCOUNT", "Make it yours.", "Your settings, privacy and device preferences.")}<form id="profile-form" class="panel narrow"><label>Display name<input name="name" required maxlength="80" value="${e(api.profile?.name)}"></label><label>Email<input value="${e(api.currentUser.email)}" disabled></label><p>Account: ${e(api.profile?.role || "Profile setup incomplete")}${api.profile?.verified ? " · Verified owner" : ""}${api.isAdmin ? " · Administrator" : ""}</p><button class="primary">Save profile</button></form><section class="panel narrow"><h2>Offline access</h2><p>Public listings are cached automatically. Opt in to store recent conversations and pending message drafts on this browser. Anyone using this device may be able to access stored data. Avoid enabling this on shared devices.</p><label class="check"><input type="checkbox" id="private-cache" ${privateEnabled() ? "checked" : ""}> Store private conversations and drafts on this device</label><button class="outline" data-action="clear-private">Clear private offline data</button></section><button class="outline" data-action="logout">Log out & clear private data</button>`;
}
async function adminPage(tab = "properties") {
  if (!api.isAdmin)
    return empty(
      "Administrator access required.",
      "Admin permissions are assigned securely by the project operator.",
    );
  const allowed = [
    "properties",
    "users",
    "reports",
    "auditLogs",
    "subscriptions",
  ];
  if (!allowed.includes(tab)) tab = "properties";
  const data = await api.adminList(tab);
  return `${pageHeading("TRUST & COMMUNITY", "The admin workspace.", "Review ownership evidence outside the app before verifying an owner.")}<div class="tabs">${allowed.map((t) => `<a class="button ${t === tab ? "primary" : "outline"}" href="#/admin/${t}">${t === "properties" ? "Listings" : t === "auditLogs" ? "Audit log" : t[0].toUpperCase() + t.slice(1)}</a>`).join("")}</div><div class="panel">${data.map((r) => `<div class="list-row"><div><strong>${e(r.title || r.name || r.reason || r.targetId || r.id)}</strong><p>${e(r.status || r.role || r.collection || "")} ${tab === "users" ? `· ${r.verified ? "Verified" : "Unverified"} · ${r.disabled ? "Suspended" : "Active"} · ID: ${e(r.id)}` : ""}</p>${tab === "reports" ? `<a href="#/property/${e(r.propertyId)}">Review reported listing</a>` : ""}</div><div class="button-row">${tab === "properties" ? `<button class="outline" data-moderate="properties:${r.id}:published">Approve</button><button class="outline" data-moderate="properties:${r.id}:rejected">Reject</button>` : tab === "users" ? `<button class="outline" data-verify="${r.id}">Verify owner</button><button class="outline" data-suspend="${r.id}:${!r.disabled}">${r.disabled ? "Restore" : "Suspend"}</button>` : tab === "reports" ? `<button class="outline" data-moderate="reports:${r.id}:resolved">Resolve</button>` : ""}</div></div>`).join("") || empty("All clear for now.", tab === "subscriptions" ? "Optional Pro payments are deferred until the core launch is verified. All essential owner features remain free." : "There are no records to review.")}</div>`;
}
function about() {
  return `${pageHeading("BUILT AROUND BELONGING.", "Less searching. More living.", "DormPath helps students and renters connect directly with property owners in Tuguegarao City.")}<div class="about-grid"><section class="panel"><h2>Our promise to students</h2><p>Browse without an account. Join free to save places, message owners and post room requests. No student subscriptions, platform booking fees or paid messages.</p><h2>Real people. Clear details.</h2><p>Owner badges are granted by administrators after reviewing ownership evidence. Vacancies are reported by owners and carry an update timestamp. Always confirm availability, costs and viewing arrangements directly.</p></section><section class="panel"><h2>Your privacy matters</h2><p>Account profiles and messages are restricted to authorized users. Public room requests show your display name and housing preferences; never include your phone number, ID documents or sensitive information.</p><p>Offline private storage is optional and cleared on logout. The app uses Firebase for accounts and data, Cloudinary for property photos, and OpenStreetMap for map tiles. Map requests disclose your IP address to the tile provider.</p><h2>A respectful community</h2><p>Use accurate descriptions and photos you have permission to share. Report suspicious listings from their detail page and block abusive participants in chat. Contact the platform operator for account deletion or data requests; launch contact details must be supplied before public release.</p></section></div><div class="notice">DOMI uses local, rule-based suggestions from loaded listing data. No AI model download or paid AI service is required.</div>`;
}
function modal(content) {
  $("#modal").innerHTML =
    `<button class="modal-close" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button>${content}`;
  $("#modal").showModal();
  refreshIcons();
}
function requireLogin() {
  if (api.currentUser) return true;
  location.hash = "/login";
  return false;
}
async function route() {
  const version = ++routeVersion;
  unsubscribe();
  unsubscribe = () => {};
  if (map) {
    map.remove();
    map = null;
  }
  const [page = "home", id] = location.hash.replace(/^#\/?/, "").split("/");
  $("#app").innerHTML = shell();
  const main = $("#main");
  const protectedPages = [
    "favorites",
    "dashboard",
    "messages",
    "profile",
    "properties",
    "add-property",
    "edit-property",
    "rooms",
    "notifications",
    "admin",
  ];
  if (protectedPages.includes(page) && !api.currentUser) {
    main.innerHTML = gate();
    refreshIcons();
    return;
  }
  main.innerHTML =
    '<div class="skeleton-grid"><div class="skeleton"></div><div class="skeleton"></div></div>';
  try {
    let html;
    switch (page) {
      case "home":
        html = home();
        break;
      case "search":
      case "map":
        html = searchPage(page === "map");
        break;
      case "login":
      case "register":
        html = authPage(page === "register");
        break;
      case "property":
        html = await details(id);
        break;
      case "favorites":
        html = await favoritesPage();
        break;
      case "wanted":
        html = await wantedPage();
        break;
      case "dashboard":
        html = await dashboard();
        break;
      case "properties":
        html = await propertiesPage();
        break;
      case "add-property":
      case "edit-property":
        html =
          api.profile?.verified && api.profile?.role === "landlord"
            ? propertyForm(id ? await api.getProperty(id) : {})
            : empty(
                "Owner verification required.",
                "A verified landlord account is required to manage properties.",
              );
        break;
      case "rooms":
        html = await roomsPage(id);
        break;
      case "messages":
        html = await messagesPage(id);
        break;
      case "profile":
        html = await profilePage();
        break;
      case "admin":
        html = await adminPage(id);
        break;
      case "notifications": {
        const items = await api.notifications();
        html =
          pageHeading(
            "STAY IN THE LOOP.",
            "A little heads-up.",
            "Vacancy checks for your first 20 saved places are refreshed when you open this page.",
          ) +
          (items.length
            ? items
                .map(
                  (n) =>
                    `<a class="panel list-row" href="#/property/${e(n.propertyId)}"><div>${icon("bell")} ${e(n.title)}<p>${date(n.createdAt)}</p></div>${icon("arrow-right")}</a>`,
                )
                .join("")
            : empty(
                "A quiet moment.",
                "Save properties to check their reported vacancies here.",
              ));
        break;
      }
      case "about":
        html = about();
        break;
      default:
        html = empty(
          "This path hasn’t been mapped.",
          "Head back to discover your next home.",
          '<a href="#/home" class="button primary">Back home</a>',
        );
    }
    if (version !== routeVersion) return;
    main.innerHTML = html;
    refreshIcons();
    if (page === "map") await mountMap();
    if (page === "messages" && state.chat) {
      if (privateEnabled()) {
        const messages = await cached(`messages:${api.currentUser.uid}:${id}`);
        if (messages) renderMessages(messages);
      }
      const stopMessages = api.watchMessages(
        id,
        (items) => {
          renderMessages(items);
          api.markRead(id).catch(() => {});
        },
        (err) => toast(err.message),
      );
      const stopConversation = api.watchConversation(
        id,
        (c) => {
          state.chat = c;
          if (state.messages) renderMessages(state.messages);
        },
        (err) => toast(err.message),
      );
      unsubscribe = () => {
        stopMessages();
        stopConversation();
      };
      const viewings = await api.viewings(id).catch((err) => {
        toast(err.message);
        return [];
      });
      if ($("#viewings"))
        $("#viewings").innerHTML = viewings
          .map(
            (v) =>
              `<div class="viewing-note">Viewing: ${e(v.date)} · ${e(v.status)} ${v.ownerId === api.currentUser.uid && v.status === "requested" ? `<button class="text-button" data-confirm-viewing="${v.id}">Confirm</button>` : ""}</div>`,
          )
          .join("");
    }
  } catch (err) {
    if (version === routeVersion) {
      main.innerHTML = empty(
        "We couldn’t open this space.",
        e(err.message),
        button("Try again", "retry", "outline"),
      );
      refreshIcons();
    }
  }
}
async function mountMap() {
  const L = await import("leaflet");
  if (!$("#map")) return;
  map = L.map("map").setView([17.6132, 121.727], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);
  filterProperties(state.properties, state.filters).forEach((p) => {
    if (Number.isFinite(p.lat) && Number.isFinite(p.lng))
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: "map-price",
          html: e(money(p.minPrice)),
          iconSize: [80, 30],
        }),
      })
        .addTo(map)
        .bindPopup(
          `<a href="#/property/${e(p.id)}"><strong>${e(p.title)}</strong></a><br>${p.available} owner-reported spaces`,
        );
  });
}
async function loadListings(more = false) {
  try {
    if (!api.configured)
      throw Error(
        "Live listings will appear once Firebase is connected. No sample properties are shown.",
      );
    const data = await api.publicProperties(more ? state.cursor : null);
    state.properties = more ? [...state.properties, ...data.items] : data.items;
    state.cursor = data.cursor;
    state.more = data.more;
    state.error = "";
    state.stale = false;
    state.syncedAt = Date.now();
  } catch (err) {
    const cache = await cached("public:listings").catch(() => null);
    state.properties = cache?.items || [];
    state.stale = Boolean(cache);
    state.syncedAt = cache?.syncedAt;
    state.error = err.message;
  }
  state.loaded = true;
}
document.addEventListener("click", async (event) => {
  const el = event.target.closest("button,a");
  if (!el) return;
  try {
    if (el.dataset.school) {
      state.filters = { q: el.dataset.school };
      location.hash = "/search";
      if (location.hash === "#/search") route();
    }
    if (el.dataset.type) {
      state.filters = { type: el.dataset.type };
      location.hash = "/search";
    }
    if (el.dataset.save || el.dataset.action?.startsWith("save:")) {
      if (!requireLogin()) return;
      const id = el.dataset.save || el.dataset.action.split(":")[1];
      await api.toggleFavorite(
        id,
        state.favorites.some((f) => f.propertyId === id),
      );
      state.favorites = await api.favorites();
      toast("Shortlist updated.");
      route();
    }
    if (el.dataset.chatProperty) {
      if (!requireLogin()) return;
      const id = await api.startConversation(
        await api.getProperty(el.dataset.chatProperty),
      );
      location.hash = `/messages/${id}`;
    }
    if (el.dataset.report) {
      if (!requireLogin()) return;
      modal(
        `<form id="report-form" data-id="${e(el.dataset.report)}"><h2>Report this listing</h2><label>What concerns you?<textarea name="reason" required maxlength="2000"></textarea></label><button class="primary">Submit report</button></form>`,
      );
    }
    if (el.dataset.status) {
      const [id, status] = el.dataset.status.split(":");
      await api.propertyStatus(id, status);
      toast(`Property ${status}.`);
      route();
    }
    if (el.dataset.deleteProperty) {
      modal(
        `<form id="delete-property-form" data-id="${e(el.dataset.deleteProperty)}"><h2>Delete this archived property?</h2><p>This permanently removes the property and its room inventory. Existing conversations remain available to their participants.</p><label class="check"><input type="checkbox" required>I understand this cannot be undone.</label><button class="primary">Delete property and rooms</button></form>`,
      );
    }
    if (el.dataset.room)
      roomDialog(state.rooms.find((r) => r.id === el.dataset.room));
    if (el.dataset.occupy || el.dataset.vacate) {
      const id = el.dataset.occupy || el.dataset.vacate;
      const r = state.rooms.find((r) => r.id === id);
      await api.adjustVacancy(
        state.roomProperty,
        r.id,
        el.dataset.occupy ? -1 : 1,
      );
      toast("Vacancy updated.");
      route();
    }
    if (el.dataset.closeRequest) {
      await api.closeRequest(el.dataset.closeRequest);
      route();
    }
    if (el.dataset.offer) {
      const request = state.requests.find((r) => r.id === el.dataset.offer),
        props = (await api.ownProperties()).filter(
          (p) => p.status === "published" && p.available > 0,
        );
      if (!props.length)
        throw Error(
          "You need a published property with available spaces to make an offer.",
        );
      state.offerRequest = request;
      state.offerProps = props;
      modal(
        `<form id="offer-form"><h2>Offer a room to ${e(request.name)}</h2><label>Your property<select name="propertyId">${props.map((p) => `<option value="${p.id}">${e(p.title)} · ${money(p.minPrice)}</option>`).join("")}</select></label><label>Personal message<textarea name="text" required maxlength="2000" placeholder="Explain how your room fits their request"></textarea></label><button class="primary">Send offer privately</button></form>`,
      );
    }
    if (el.dataset.moderate) {
      const [name, id, status] = el.dataset.moderate.split(":");
      await api.moderate(name, id, { status });
      toast("Review saved.");
      route();
    }
    if (el.dataset.verify) {
      modal(
        `<form id="verify-form" data-id="${el.dataset.verify}"><h2>Verify this owner</h2><p>Grant this badge only after reviewing identity and property ownership evidence through your established verification process.</p><label class="check"><input type="checkbox" required>I have verified identity and ownership.</label><button class="primary">Confirm verification</button></form>`,
      );
    }
    if (el.dataset.suspend) {
      const [id, disabled] = el.dataset.suspend.split(":");
      await api.moderate("users", id, { disabled: disabled === "true" });
      route();
    }
    if (el.dataset.confirmViewing) {
      await api.confirmViewing(el.dataset.confirmViewing);
      toast("Viewing confirmed.");
      route();
    }
    switch (el.dataset.action) {
      case "theme": {
        const dark = document.documentElement.dataset.theme !== "dark";
        document.documentElement.dataset.theme = dark ? "dark" : "light";
        localStorage.setItem("theme", dark ? "dark" : "light");
        break;
      }
      case "retry":
        route();
        break;
      case "close-modal":
        $("#modal").close();
        break;
      case "load-more":
        await loadListings(true);
        route();
        break;
      case "reset-filters":
        state.filters = {};
        route();
        break;
      case "logout":
        unsubscribe();
        await api.logout();
        state.favorites = [];
        state.messages = [];
        state.chat = null;
        location.hash = "/home";
        break;
      case "clear-private":
        await clearPrivate();
        toast("Private offline data cleared.");
        break;
      case "reset-password":
        modal(
          '<form id="reset-form"><h2>Reset your password</h2><label>Email address<input name="email" type="email" required></label><button class="primary">Send reset link</button></form>',
        );
        break;
      case "google-auth": {
        try {
          const form = el.closest("form");
          const role =
            form?.querySelector('select[name="role"]')?.value || "student";
          await api.loginWithGoogle(role);
          location.hash = "/dashboard";
        } catch (err) {
          if (err?.code !== "auth/popup-closed-by-user") {
            toast(err?.message || "Google sign-in could not be completed.");
          }
        }
        break;
      }
      case "add-room":
        roomDialog();
        break;
      case "new-request":
        if (!requireLogin()) return;
        modal(
          `<form id="request-form"><h2>Tell us what feels like home.</h2><label>Preferred location<input name="location" required maxlength="120" placeholder="School or barangay"></label><label>Monthly budget (₱)<input name="budget" required type="number" min="1" max="1000000"></label><label>Room type<select name="type">${TYPES.map((t) => `<option>${t}</option>`).join("")}</select></label><label>Move-in date<input name="moveIn" type="date" min="${new Date().toLocaleDateString("en-CA")}" required></label><label>Occupants<input name="occupants" type="number" min="1" max="20" value="1" required></label><label>A little more about your needs<textarea name="notes" maxlength="1000"></textarea></label><button class="primary">Post request</button></form>`,
        );
        break;
      case "domi":
        modal(
          `<div class="domi-dialog"><img src="/domi.png" alt="DOMI"><span class="overline">YOUR HOME-FINDING HELPER</span><h2>A little closer to home.</h2><p>Hi, I’m DOMI! Tell me your budget, ask about move-in costs, or let’s draft a friendly hello.</p></div><div id="domi-answer" class="notice" aria-live="polite">Suggestions use loaded listings only. Availability must be confirmed with the owner.</div><form id="domi-form"><label class="sr-only" for="domi-question">Ask DOMI</label><input id="domi-question" name="question" required placeholder="Find a room under ₱3,000…"><button class="primary">Ask DOMI ${icon("sparkles")}</button></form>`,
        );
        break;
      case "block": {
        const other =
          state.chat.ownerId === api.currentUser.uid
            ? state.chat.studentId
            : state.chat.ownerId;
        await api.blockUser(other);
        toast("User blocked. New messages between you are disabled.");
        break;
      }
      case "viewing":
        modal(
          '<form id="viewing-form"><h2>Arrange a viewing</h2><p>The owner will confirm your request. Times are in your local time zone.</p><label>Preferred date and time<input name="date" type="datetime-local" required></label><button class="primary">Request viewing</button></form>',
        );
        break;
      case "older-messages": {
        const first = state.messages?.[0];
        if (!first?.createdAt) break;
        const older = await api.olderMessages(state.chat.id, first.createdAt);
        if (!older.length)
          toast("You’re at the beginning of this conversation.");
        else renderMessages([...older, ...state.messages]);
        break;
      }
    }
  } catch (err) {
    toast(err.message);
  }
});
document.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target,
    data = new FormData(form),
    values = Object.fromEntries(data),
    submit = form.querySelector('button[type="submit"],button:not([type])');
  if (submit) submit.disabled = true;
  try {
    switch (form.id) {
      case "search-form":
        state.filters = {
          ...state.filters,
          q: values.q,
          budget: values.budget,
        };
        location.hash = "/search";
        route();
        break;
      case "filters":
        state.filters = {
          ...state.filters,
          type: values.type,
          vacant: data.has("vacant"),
          amenities: data.getAll("amenities"),
        };
        route();
        break;
      case "login":
        await api.login(values.email, values.password);
        location.hash = "/dashboard";
        break;
      case "register":
        await api.register(values);
        toast("Account created. Check your email for a verification link.");
        location.hash = "/dashboard";
        route();
        break;
      case "reset-form":
        await api.resetPassword(values.email);
        $("#modal").close();
        toast("If an account exists, a reset link has been sent.");
        break;
      case "profile-form":
        await api.saveProfile(values.name);
        toast("Profile updated.");
        route();
        break;
      case "domi-form":
        $("#domi-answer").textContent = domiReply(
          values.question,
          state.properties,
        );
        break;
      case "property-form": {
        const files = data.getAll("photos").filter((f) => f.size),
          photos = data.getAll("keepPhotos");
        if (files.length + photos.length > 8)
          throw Error("Please use no more than 8 photos per property.");
        if (!data.getAll("roomTypes").length)
          throw Error("Select at least one room type.");
        for (const file of files) photos.push(await api.uploadPhoto(file));
        const p = {
          title: values.title.trim(),
          barangay: values.barangay.trim(),
          address: values.address.trim(),
          school: values.school.trim(),
          minPrice: Number(values.minPrice),
          lat: Number(values.lat),
          lng: Number(values.lng),
          deposit: Number(values.deposit),
          advance: Number(values.advance),
          description: values.description.trim(),
          utilities: values.utilities.trim(),
          rules: values.rules.trim(),
          roomTypes: data.getAll("roomTypes"),
          amenities: data.getAll("amenities"),
          photos,
        };
        await api.saveProperty(p, form.dataset.id || null);
        toast("Property submitted for review.");
        location.hash = "/properties";
        break;
      }
      case "delete-property-form":
        await api.deleteProperty(form.dataset.id);
        $("#modal").close();
        toast("Property and rooms deleted.");
        route();
        break;
      case "room-form":
        await api.saveRoom(
          state.roomProperty,
          {
            name: values.name.trim(),
            type: values.type,
            price: Number(values.price),
            capacity: Number(values.capacity),
            available: Number(values.available),
          },
          form.dataset.id || null,
        );
        $("#modal").close();
        toast("Room saved.");
        route();
        break;
      case "request-form":
        await api.createRequest({
          ...values,
          budget: Number(values.budget),
          occupants: Number(values.occupants),
        });
        $("#modal").close();
        toast("Room request published.");
        route();
        break;
      case "offer-form": {
        const p = state.offerProps.find((p) => p.id === values.propertyId);
        const id = await api.startConversation(p, state.offerRequest.userId);
        await api.sendMessage(id, values.text);
        $("#modal").close();
        location.hash = `/messages/${id}`;
        break;
      }
      case "message-form": {
        if (navigator.onLine) {
          await api.sendMessage(state.chat.id, values.text);
        } else {
          await api.queueMessage(state.chat.id, values.text);
          toast("Draft saved as Pending. It has not been delivered.");
          renderMessages(state.messages || []);
        }
        form.reset();
        break;
      }
      case "viewing-form":
        if (new Date(values.date) <= new Date())
          throw Error("Choose a future date and time.");
        await api.viewing(state.chat.id, new Date(values.date).toISOString());
        $("#modal").close();
        toast("Viewing requested. Awaiting owner confirmation.");
        route();
        break;
      case "report-form":
        await api.report(form.dataset.id, values.reason);
        $("#modal").close();
        toast("Report submitted for review.");
        break;
      case "verify-form":
        await api.moderate("users", form.dataset.id, { verified: true });
        $("#modal").close();
        route();
        break;
    }
  } catch (err) {
    toast(err.message);
  } finally {
    if (submit) submit.disabled = false;
  }
});
document.addEventListener("change", async (event) => {
  if (event.target.id === "private-cache") {
    localStorage.setItem(
      "dormpath-private-cache",
      String(event.target.checked),
    );
    if (!event.target.checked) await clearPrivate();
    toast(
      event.target.checked
        ? "Private offline storage enabled on this device."
        : "Private offline storage disabled and cleared.",
    );
  }
});
window.addEventListener("hashchange", () => {
  window.scrollTo(0, 0);
  route();
});
window.addEventListener("online", async () => {
  toast("Connection restored. Checking pending drafts…");
  try {
    await api.flushQueue();
    await loadListings();
    route();
  } catch (err) {
    toast(`Pending drafts were not sent: ${err.message}`);
  }
});
window.addEventListener("offline", () => {
  state.stale = true;
  toast("You’re offline. Cached vacancies may have changed.");
  if (!$(".connection-banner"))
    $(".topbar").insertAdjacentHTML(
      "afterend",
      '<div class="connection-banner">Offline · cached details may have changed. Messages remain pending until delivered.</div>',
    );
});
document.documentElement.dataset.theme =
  localStorage.getItem("theme") || "light";
api.watchAuth(async (user, error) => {
  if (error) toast(error.message);
  state.favorites = [];
  if (user && api.profile) {
    try {
      state.favorites = await api.favorites();
      await api.flushQueue();
    } catch (err) {
      toast(err.message);
    }
  }
  route();
});
loadListings().then(() => route());
if ("serviceWorker" in navigator && import.meta.env.PROD)
  navigator.serviceWorker.register("/sw.js").catch(() => {});
