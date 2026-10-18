import "./style.css";
import { createLoginLimiter } from "./login-limiter";
const loginLimiter = createLoginLimiter({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v),removeItem:k=>localStorage.removeItem(k)});
function rememberedLogin() { try { return JSON.parse(localStorage.getItem("dormpath-login-preference")) || {}; } catch { return {}; } }
import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { allPublishedListings } from "./listing-pagination";
import { mountPropertyMapPicker } from "./property-map-picker.js";
maplibregl.setWorkerUrl(mapWorkerUrl);

function getMapLibre() { return maplibregl; }

import {
  createIcons,
  House,
  Compass,
  Search,
  Map as MapIcon,
  Users,
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
  ArrowLeft,
  UserRound,
  User,
  Wallet,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  Bot,
  FileText,
  Ban,
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
  Minus,
  Crosshair,
  Send,
  X,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Menu,
  LogOut,
  Share2,
  Phone,
  Mail,
  Info,
  Star,
  Clock,
  ExternalLink,
  Trash2,
  Edit3,
  Shield,
  UserCheck,
  AlertCircle,
  Download,
  Smartphone,
  BedDouble,
  Image as ImageIcon,
  Camera,
  Upload,
  Lock,
  HardDrive,
  Copy,
} from "lucide";

const icons = {
  House,
  Compass,
  Search,
  Map: MapIcon,
  Users,
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
  ArrowLeft,
  UserRound,
  User,
  Wallet,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  Bot,
  FileText,
  Ban,
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
  Minus,
  Crosshair,
  Send,
  X,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Menu,
  LogOut,
  Share2,
  Phone,
  Mail,
  Info,
  Star,
  Clock,
  ExternalLink,
  Trash2,
  Edit3,
  Shield,
  UserCheck,
  AlertCircle,
  Download,
  Smartphone,
  BedDouble,
  Image: ImageIcon,
  Camera,
  Upload,
  Lock,
  HardDrive,
  Copy,
};

import L from "leaflet";
import * as api from "./api";
import {
  TYPES,
  AMENITIES,
  TUGUEGARAO_BARANGAYS,
  PENABLANCA_BARANGAYS,
  ALL_BARANGAYS,
  BARANGAY_COORDINATES,
  money,
  escapeHTML as e,
  filterProperties,
  domiReply,
  domiLoaderHtml,
  calculateDistanceKm,
  formatDistance,
  NOTABLE_LANDMARKS,
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
  selectedRole: "tenant",
  domiHistory: [
    {
      role: "domi",
      text: "Kumusta! I am DOMI, your housing guide for Tuguegarao City. Ask me anything about tenant boarding houses, campus distances (CSU Carig, Andrews, SPUP, USL), typical rents, or drafting inquiries to landlords!",
      time: "Just now",
    },
  ],
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
  const t = $("#toast");
  if (t) {
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 5500);
  }
}

function formatAuthError(err) {
  if (!err) return "An unexpected error occurred.";
  const code = err.code || "";
  const msg = err.message || "";
  if (code.includes("configuration-not-found") || msg.includes("configuration-not-found")) {
    return "Firebase Authentication sign-in methods are not enabled yet. Please go to Firebase Console > Authentication > Sign-in method and enable Email/Password and Google.";
  }
  if (code === "auth/email-already-in-use") {
    return "This email is already registered. Please sign in instead.";
  }
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Invalid email or password. Please check your credentials.";
  }
  if (code === "auth/weak-password") {
    return "Password is too weak. Please use at least 8 characters with letters and numbers.";
  }
  if (code === "auth/popup-blocked") {
    return "The Google sign-in popup was blocked by your browser. Please allow popups for this site.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "";
  }
  return err.message || "Authentication failed. Please try again.";
}

function refreshIcons() {
  createIcons({ icons, attrs: { "stroke-width": 1.7 } });
}

const navItem = (path, label, iconName) => {
  const current = location.hash.replace(/^#\/?/, "").split("/")[0] || "home";
  const active = current === path ? "active" : "";
  return `<a href="#/${path}" class="sidebar-link ${active}"><div class="sidebar-link-left">${icon(iconName)}<span>${label}</span></div></a>`;
};

/* ==============================================================================
   OFFICIAL DOMI AI GLOBAL LOADING SYSTEM
   ============================================================================== */

export { domiLoaderHtml };

let globalLoadingCount = 0;
let globalLoadingTimer = null;
let globalLoadingTimeoutRecovery = null;

export function startGlobalLoading(immediate = false) {
  globalLoadingCount++;
  clearTimeout(globalLoadingTimeoutRecovery);
  globalLoadingTimeoutRecovery = setTimeout(() => {
    if (globalLoadingCount > 0) {
      console.warn("DOMI loader auto-recovered after timeout");
      forceStopAllLoading();
      toast("Request took longer than expected. Please check your connection.");
    }
  }, 12000);

  const overlay = $("#domi-global-overlay");
  if (!overlay) return;
  if (immediate) {
    clearTimeout(globalLoadingTimer);
    globalLoadingTimer = null;
    overlay.innerHTML = domiLoaderHtml("global");
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
  } else if (!globalLoadingTimer && !overlay.classList.contains("is-active")) {
    globalLoadingTimer = setTimeout(() => {
      if (globalLoadingCount > 0 && overlay) {
        overlay.innerHTML = domiLoaderHtml("global");
        overlay.classList.add("is-active");
        overlay.setAttribute("aria-hidden", "false");
      }
    }, 80);
  }
}

export function stopGlobalLoading() {
  globalLoadingCount = Math.max(0, globalLoadingCount - 1);
  if (globalLoadingCount === 0) {
    clearTimeout(globalLoadingTimer);
    globalLoadingTimer = null;
    clearTimeout(globalLoadingTimeoutRecovery);
    globalLoadingTimeoutRecovery = null;
    const overlay = $("#domi-global-overlay");
    if (overlay) {
      overlay.classList.remove("is-active");
      overlay.setAttribute("aria-hidden", "true");
      setTimeout(() => {
        if (globalLoadingCount === 0) overlay.innerHTML = "";
      }, 260);
    }
  }
}

export function forceStopAllLoading() {
  globalLoadingCount = 0;
  clearTimeout(globalLoadingTimer);
  globalLoadingTimer = null;
  clearTimeout(globalLoadingTimeoutRecovery);
  globalLoadingTimeoutRecovery = null;
  const overlay = $("#domi-global-overlay");
  if (overlay) {
    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = "";
  }
  const l = $("#global-loader");
  if (l) {
    l.className = "";
    l.style.width = "0%";
  }
}

window.__domiLoaderHtml = domiLoaderHtml;
window.startGlobalLoading = startGlobalLoading;
window.stopGlobalLoading = stopGlobalLoading;
window.forceStopAllLoading = forceStopAllLoading;

let loadingTimer;
function startLoading() {
  clearTimeout(loadingTimer);
  const l = $("#global-loader");
  if (l) {
    l.style.opacity = "1";
    l.className = "is-loading";
  }
}

function stopLoading() {
  stopGlobalLoading();
  const l = $("#global-loader");
  if (l) {
    l.className = "is-done";
    loadingTimer = setTimeout(() => {
      l.className = "";
      l.style.width = "0%";
    }, 350);
  }
}

const brandLogoHtml = () => `
  <div class="brand-logo-emblem" aria-hidden="true">
    <img src="/domi-app-icon.png" alt="" class="brand-logo-image">
  </div>
  <span class="brand-text">Dorm<span class="brand-accent">Path</span></span>
`;

// 1. Standalone Authentication Layout (FIXED VIEWPORT)
function authLayout(content) {
  return `
    <div class="auth-page">
      <header class="auth-header">
        <a href="#/home" class="auth-brand" title="DormPath — Tuguegarao">
          ${brandLogoHtml()}
        </a>
        <a href="#/home" class="auth-back-link">
          ${icon("arrow-left")} <span>Back to explore</span>
        </a>
      </header>
      <main id="main" class="auth-container">
        ${content}
      </main>
    </div>
  `;
}

// 2. Public Landing Layout (Clean top navbar, full width, NO sidebar)
function publicLayout(content) {
  const current = location.hash.replace(/^#\/?/, "").split("/")[0] || "home";

  return `
    <div class="public-layout">
      <header class="public-navbar">
        <div class="public-navbar-inner">
          <a href="#/home" class="auth-brand" title="DormPath — Tuguegarao">
            ${brandLogoHtml()}
          </a>

          <div class="nav-actions">
            ${location.hash && !["#/", "#/home"].includes(location.hash) ? `<a href="#/home" class="button outline small">${icon("arrow-left")} Back to home</a>` : ""}
            <button class="button text-button" data-action="theme" aria-label="Toggle appearance" title="Toggle Dark/Light Mode">
              ${icon("sun-moon")}
            </button>
            <button type="button" class="button outline small install-apk-btn" data-action="install-pwa" title="Install DormPath on your phone or tablet">
              ${icon("download")} <span>Install App</span>
            </button>
            ${
              api.currentUser
                ? `<a href="#/profile" class="button primary small" style="display:inline-flex; align-items:center; gap:8px;">
                     <span style="width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.25); display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; overflow:hidden;">
                       ${
                         api.currentUser?.photoURL || api.profile?.photoURL
                           ? `<img src="${e(api.currentUser?.photoURL || api.profile?.photoURL)}" style="width:100%; height:100%; object-fit:cover;">`
                           : (api.profile?.name || "U")[0].toUpperCase()
                       }
                     </span>
                     <span>${e(api.profile?.name || "Account")}</span>
                   </a>`
                : `<a href="#/login" class="button primary small">Log In ${icon("arrow-right")}</a>`
            }
          </div>
        </div>
      </header>
      <main id="main">
        ${content}
      </main>
      <footer class="public-footer">
        <div class="footer-inner">
          <div class="footer-col">
            <a href="#/home" class="auth-brand" style="margin-bottom:14px;">
              ${brandLogoHtml()}
            </a>
            <p style="font-size:0.875rem; max-width:320px; line-height:1.6;">
              Finding your space in Tuguegarao City made simple, honest, and forever free for all room searchers.
            </p>
          </div>
          <div class="footer-col">
            <h4>Discover</h4>
            <ul>
              <li><a href="#/search">Boarding Houses</a></li>
              <li><a href="#/search">Dormitories</a></li>
              <li><a href="#/search">Apartments</a></li>
              <li><a href="#/map">Area Map</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Explore Housing</h4>
            <ul>
              <li><a href="#/search">Browse Available Rooms</a></li>
              <li><a href="#/about">Fair Housing Promise (₱0 Fees)</a></li>
              <li><a href="#/login">Tenant Log In</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Trust & Privacy</h4>
            <ul>
              <li><a href="#/privacy">Data Privacy (RA 10173)</a></li>
              <li><a href="#/terms">Terms of Service</a></li>
              <li><a href="#/register">List Your Property</a></li>
              <li><a href="#/domi">DOMI Housing Assistant</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} DormPath. Tuguegarao City, Cagayan, Philippines.</span>
          <span>Zero booking fees for tenants · Verified property owners</span>
        </div>
      </footer>
    </div>
  `;
}

// 3. Authenticated Workspace / App Shell (3D Tactile Sidebar + Workspace)
function appLayout(content) {
  const current = location.hash.replace(/^#\/?/, "").split("/")[0] || "dashboard";
  const unreadMessages =
    state.conversations?.filter(
      (c) =>
        c.lastSender !== api.currentUser?.uid &&
        c.updatedAt?.seconds > (c.readAt?.[api.currentUser?.uid]?.seconds || 0),
    ).length || 0;

  const isLandlord = api.profile?.role === "landlord";
  const roleLabel = isLandlord ? "Landlord / Owner" : "Tenant";

  return `
    <div class="app-shell">
      <aside class="app-sidebar">
        <div class="sidebar-header">
          <a href="#/dashboard" class="auth-brand" title="DormPath dashboard">
            ${brandLogoHtml()}
          </a>
        </div>

        ${
          isLandlord
            ? `
          <div class="sidebar-nav-group">
            <div class="sidebar-caption">LANDLORD PORTAL</div>
            ${navItem("dashboard", "Dashboard", "layout-dashboard")}
            ${navItem("properties", "My Properties", "building-2")}
            <a href="#/messages" class="sidebar-link ${current === "messages" ? "active" : ""}">
              <div class="sidebar-link-left">
                ${icon("messages-square")}
                <span>Tenant Inquiries</span>
              </div>
              ${unreadMessages > 0 ? `<span class="sidebar-badge-count">${unreadMessages}</span>` : ""}
            </a>

            ${navItem("profile", "Profile & Settings", "user")}
            ${api.isAdmin ? navItem("admin", "Admin Console", "shield-check") : ""}
          </div>

          <div class="sidebar-nav-group">
            <div class="sidebar-caption">DISCOVER & MARKET</div>
            ${navItem("search", "Market Listings", "search")}
            ${navItem("map", "Tuguegarao Map", "map")}
            ${navItem("domi", "Ask DOMI", "bot")}
          </div>
        `
            : `
          <div class="sidebar-nav-group">
            <div class="sidebar-caption">TENANT PORTAL</div>
            ${navItem("dashboard", "Dashboard", "layout-dashboard")}
            ${navItem("favorites", "Saved Places", "heart")}
            <a href="#/messages" class="sidebar-link ${current === "messages" ? "active" : ""}">
              <div class="sidebar-link-left">
                ${icon("messages-square")}
                <span>Inquiries & Chat</span>
              </div>
              ${unreadMessages > 0 ? `<span class="sidebar-badge-count">${unreadMessages}</span>` : ""}
            </a>

            ${navItem("profile", "Profile & Settings", "user")}
            ${api.isAdmin ? navItem("admin", "Admin Console", "shield-check") : ""}
          </div>

          <div class="sidebar-nav-group">
            <div class="sidebar-caption">FIND HOUSING</div>
            ${navItem("search", "Explore Rooms", "search")}
            ${navItem("map", "Map Explorer", "map")}
            ${navItem("domi", "Ask DOMI", "bot")}
          </div>
        `
        }

        <div class="sidebar-bottom">
          <a href="#/profile" class="sidebar-profile-pill ${current === "profile" ? "active" : ""}" style="text-decoration:none; color:inherit; cursor:pointer;" title="Edit Profile & Account Settings">
            <div class="sidebar-avatar">
              ${
                api.currentUser?.photoURL || api.profile?.photoURL
                  ? `<img src="${e(api.currentUser?.photoURL || api.profile?.photoURL)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="PFP">`
                  : (api.profile?.name || "U")[0].toUpperCase()
              }
            </div>
            <div style="flex:1; min-width:0;">
              <strong style="display:block; font-size:0.8125rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${e(api.profile?.name || "User")}
              </strong>
              <span style="font-size:0.6875rem; color:var(--text-muted); text-transform:capitalize;">
                ${roleLabel}
              </span>
            </div>
          </a>
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button type="button" class="button outline small" data-action="theme" style="flex:1; justify-content:center; padding:6px 10px; font-size:0.75rem; border-radius:var(--radius-md);" title="Toggle Dark/Light Mode">
              ${icon("sun-moon")} <span>Theme</span>
            </button>
            <button type="button" class="button outline small" data-action="logout" style="flex:1; justify-content:center; padding:6px 10px; font-size:0.75rem; color:var(--danger); border-color:rgba(239,68,68,0.35); border-radius:var(--radius-md);" title="Sign Out">
              ${icon("log-out")} <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      <div class="app-workspace">
        <header class="app-topbar">
          <div class="app-topbar-left">
            <div class="badge badge-outline" style="gap:6px; font-weight:600;">
              ${icon("map-pin")} <span>Tuguegarao & Peñablanca</span>
            </div>
            <button type="button" class="button outline small" data-action="open-notifications" aria-label="Notifications">${icon("bell")} Alerts</button>
          </div>
          <div class="app-topbar-right" style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="button text-button" data-action="theme" aria-label="Toggle appearance" title="Toggle Dark/Light Mode">
              ${icon("sun-moon")}
            </button>
            <button type="button" class="button outline small" data-action="logout" title="Log Out" style="color:var(--danger); border-color:rgba(239,68,68,0.3); font-weight:600; gap:6px;">
              ${icon("log-out")} <span class="hide-mobile">Log Out</span>
            </button>
          </div>
        </header>

        ${isLandlord && !api.profile?.verified && !api.isAdmin ? `<div class="connection-banner" style="background:#fff7ed; color:#9a3412; border-color:#fdba74;">Landlord publishing is locked until an administrator approves every permit. <a href="#/profile" style="font-weight:800; color:inherit;">Review or complete your permit application</a>.</div>` : ""}

        ${
          !navigator.onLine
            ? '<div class="connection-banner">Offline mode active. Showing cached records. Messages will queue as drafts until you reconnect.</div>'
            : ""
        }

        <main id="main" class="app-main-content" tabindex="-1">
          ${content}
        </main>
      </div>

      <nav class="mobile-nav">
        <a href="#/dashboard" class="${current === "dashboard" ? "active" : ""}">
          ${icon("layout-dashboard")} <span>Dashboard</span>
        </a>
        <a href="#/search" class="${current === "search" ? "active" : ""}">
          ${icon("search")} <span>Explore</span>
        </a>
        <a href="#/map" class="${current === "map" ? "active" : ""}">
          ${icon("map")} <span>Area Map</span>
        </a>
        <a href="#/domi" class="${current === "domi" ? "active" : ""}">
          ${icon("bot")} <span>DOMI</span>
        </a>
        ${
          isLandlord
            ? `
          <a href="#/properties" class="${current === "properties" ? "active" : ""}">
            ${icon("building-2")} <span>Properties</span>
          </a>
        `
            : `
          <a href="#/favorites" class="${current === "favorites" ? "active" : ""}">
            ${icon("heart")} <span>Saved</span>
          </a>
        `
        }
        <a href="#/messages" class="${current === "messages" ? "active" : ""}">
          ${icon("messages-square")} <span>Chat</span>
        </a>
        <button type="button" class="mobile-menu-btn" data-action="toggle-mobile-drawer" aria-label="More options" style="background:transparent; border:none; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; color:var(--text-secondary); cursor:pointer; font-size:0.6875rem; font-weight:600;">
          ${icon("menu")} <span>More</span>
        </button>
      </nav>
    </div>
  `;
}

/* ==============================================================================
   PAGES
   ============================================================================== */

// Redesigned Standalone Auth Page
function authPage(register = false) {
  return `
    <div class="auth-card-wrapper">
      <div class="auth-showcase">
        <div class="auth-showcase-content">
          <div class="overline" style="color:#60a5fa;">TUGUEGARAO HOUSING NETWORK</div>
          <h2>Find your space.<br>Feel at home.</h2>
          <p>
            Connect directly with verified room owners and renters across Tuguegarao City.
          </p>

          <div class="auth-mascot-card">
            <img src="/domi.png" alt="DOMI Mascot">
            <div>
              <strong>DOMI is here to help!</strong>
              <span>Get instant answers on room budgets, move-in deposits, and amenities.</span>
            </div>
          </div>
        </div>

        <div class="auth-trust-list">
          <div class="auth-trust-item">
            ${icon("shield-check")} <span>Verified property owners</span>
          </div>
          <div class="auth-trust-item">
            ${icon("message-circle")} <span>Direct private messaging between renters and owners</span>
          </div>
          <div class="auth-trust-item">
            ${icon("badge-check")} <span>Always 100% free for renters (₱0 booking fees)</span>
          </div>
        </div>
      </div>

      <div class="auth-form-panel auth-refined">
        <div class="auth-form-header">
          <h2>${register ? "Create your account" : "Welcome back"}</h2>
          <p class="text-secondary">
            ${register ? "Find a place that feels like home." : "Your next home is waiting. Pick up where you left off."}
          </p>
        </div>

        <button type="button" class="google-auth-btn" data-action="google-auth">
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div class="auth-divider">
          <span>or continue with email</span>
        </div>

        <form id="${register ? "register" : "login"}">
          ${
            register
              ? `
              <div class="role-cards-container">
                <div class="role-card ${state.selectedRole !== "landlord" ? "selected" : ""}" data-role-select="tenant">
                  <div class="role-card-header">
                    <strong style="display:flex; align-items:center; gap:6px;">${icon("user")} Tenant</strong>
                    <div class="role-check">${state.selectedRole !== "landlord" ? icon("check") : ""}</div>
                  </div>
                  <p>Browse spaces, message owners directly, and save favorites.</p>
                </div>
                <div class="role-card ${state.selectedRole === "landlord" ? "selected" : ""}" data-role-select="landlord">
                  <div class="role-card-header">
                    <strong style="display:flex; align-items:center; gap:6px;">${icon("building-2")} Property Owner</strong>
                    <div class="role-check">${state.selectedRole === "landlord" ? icon("check") : ""}</div>
                  </div>
                  <p>List rooms, manage vacancies, and connect directly with tenants.</p>
                </div>
              </div>
              <input type="hidden" name="role" id="auth-role-input" value="${state.selectedRole}">

              <label>Full name
                <input name="name" required maxlength="80" autocomplete="name" placeholder="Juan dela Cruz">
              </label>
            `
              : ""
          }

          <label>Email address
            <input name="email" type="email" required autocomplete="email" placeholder="you@example.com" value="${register ? "" : e(rememberedLogin().email || "")}">
          </label>

          <label class="password-field">Password
            <input name="password" id="auth-password" type="password" required minlength="8" autocomplete="${register ? "new-password" : "current-password"}" placeholder="${register ? "Create a strong password" : "Enter your password"}">
            <button type="button" class="password-toggle-btn" data-action="toggle-password" aria-label="Toggle password visibility">
              ${icon("eye")}
            </button>
          </label>

          ${
            !register
              ? `<div class="auth-options"><label class="check"><input name="remember" type="checkbox" ${rememberedLogin().remember ? "checked" : ""}> Remember me</label>
                  <button type="button" class="button text-button small" data-action="reset-password">Forgot password?</button>
                 </div>`
              : ""
          }

          ${register ? `<label class="check"><input type="checkbox" name="consent" required> I have read the <button type="button" class="legal-link" data-action="privacy-dialog">privacy policy</button> and agree to the <button type="button" class="legal-link" data-action="terms-dialog">terms</button>.</label>` : ""}<button class="button primary full large" type="submit" style="margin-top:8px;">
            ${register ? "Create Account" : "Log In"} ${icon("arrow-right")}
          </button>

          ${!register ? `<p id="verification-help" class="auth-verification-help" hidden>Email not verified. <button type="button" data-action="resend-verification">Resend verification</button></p>` : ""}
          <div class="auth-badges-row">
            <div class="auth-captcha-badge" role="status" aria-live="polite">
              <span class="captcha-dot"></span>
              <span id="captcha-status">${api.appCheck ? "reCAPTCHA · automatic verification at sign-in" : "Bot protection is not configured yet"}</span>
            </div>
            <div class="auth-security-badge">
              ${icon("shield-check")}
              <span>Your privacy matters. <button type="button" class="legal-link" data-action="privacy-dialog">Privacy policy</button> <span aria-hidden="true">·</span> <button type="button" class="legal-link" data-action="terms-dialog">Terms of use</button></span>
            </div>
          </div>

          <p class="auth-footer-text">
            ${
              register
                ? `Already have an account? <a href="#/login">Log in</a>`
                : `Don't have an account yet? <a href="#/register">Create one free</a>`
            }
          </p>

          ${
            !api.configured
              ? `<div class="notice" style="margin-top:16px;">
                  Firebase configuration required. Please ensure .env.local has valid credentials.
                 </div>`
              : ""
          }
        </form>
      </div>
    </div>
  `;
}

// Redesigned Public Homepage
function home() {
  return `
    <section class="hero-section">
      <div class="hero-content">
        <div class="overline">📍 TUGUEGARAO CITY HOUSING NETWORK</div>
        <h1>Find your space.<br>Feel <span class="highlight">at home.</span></h1>
        <p class="hero-sub">
          Discover verified boarding houses, dormitories, and apartments near your university. Your next chapter starts with the right room.
        </p>

        <div class="hero-cta-group">
          <a href="#/search" class="button primary large hero-btn-primary">
            ${icon("search")} <span>Explore Available Rooms</span>
          </a>
          <a href="#/map" class="button outline large hero-btn-secondary">
            ${icon("map")} <span>Area Map</span>
          </a>
          <button type="button" class="button outline large hero-install-cta" data-action="install-pwa">
            ${icon("download")} <span>Install DormPath</span>
          </button>
        </div>
      </div>

      <div class="hero-graphic">
        <div class="hero-graphic-bg"></div>
        <img src="/domi.png" alt="DOMI Mascot" class="hero-mascot-img">
        <div class="hero-badges-wrapper">
          <div class="hero-floating-badge badge-top">
            <span style="font-size:1.25rem;">🏠</span>
            <div>
              <strong>Verified Owners</strong>
              <span>Admin-reviewed listings</span>
            </div>
          </div>
          <div class="hero-floating-badge badge-bottom">
            <span style="font-size:1.25rem;">₱0</span>
            <div>
              <strong>100% Free for Tenants</strong>
              <span>Direct contact & chat</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="trust-metrics-section">
      <div class="trust-metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box">${icon("wallet")}</div>
          <div>
            <strong>₱0 Platform Fees</strong>
            <span>Zero charges or booking markups</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box">${icon("shield-check")}</div>
          <div>
            <strong>Verified Landlords</strong>
            <span>Owner verification required to publish</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box">${icon("clock")}</div>
          <div>
            <strong>Reported Vacancies</strong>
            <span>Reported directly by property owners</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box">${icon("sparkles")}</div>
          <div>
            <strong>DOMI Housing Helper</strong>
            <span>Smart budget advice & message drafts</span>
          </div>
        </div>
      </div>
    </section>
    <section class="landing-section" style="background:var(--bg-subtle); border-top:1px solid var(--border); border-bottom:1px solid var(--border);">
      <div class="section-head">
        <div class="section-head-text">
          <div class="overline">BROWSE BY CATEGORY</div>
          <h2>A room that fits your style</h2>
        </div>
      </div>
      <div class="categories-grid">
        ${[
          ["Boarding house", "house", "A warm home away from home"],
          ["Dormitory", "building-2", "Social living near campus"],
          ["Apartment", "sofa", "Independent living spaces"],
          ["Studio", "armchair", "Your own private setup"],
          ["Bedspace", "bed-single", "Budget-friendly shared options"],
        ]
          .map(
            ([type, iconName, desc]) => `
          <div class="category-card category-card-static">
            <div class="category-icon">${icon(iconName)}</div>
            <div>
              <strong>${type}</strong>
              <span>${desc}</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </section>

    <section class="landing-section">
      <div class="section-head" style="text-align:center; display:block; margin-bottom:48px;">
        <div class="overline">HOW DORMPATH WORKS</div>
        <h2>Three simple steps to your new room</h2>
      </div>
      <div class="how-it-works-grid">
        <div class="step-card">
          <div class="step-number">1</div>
          <h3>Discover & Filter</h3>
          <p>Search by campus, monthly budget, room type, and amenities like Wi-Fi and air conditioning.</p>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <h3>Chat with Owners</h3>
          <p>Send a message directly to the verified landlord. Confirm vacancies and schedule a physical viewing.</p>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <h3>Move In with Confidence</h3>
          <p>Inspect the place, verify the room, and pay directly to the owner without middleman fees.</p>
        </div>
      </div>
    </section>

    <section class="landing-section">
      <div class="section-head" style="text-align:center; display:block; margin-bottom:40px;">
        <div class="overline">FREQUENTLY ASKED QUESTIONS</div>
        <h2>Everything you need to know</h2>
      </div>
      <div class="faq-grid">
        <details class="faq-item">
          <summary>Is DormPath really 100% free for tenants? ${icon("chevron-down")}</summary>
          <p>Yes! Tenants can browse listings, save favorites, post room requests, and message property owners without paying any subscription or booking commission fees.</p>
        </details>
        <details class="faq-item">
          <summary>How are property owners verified? ${icon("chevron-down")}</summary>
          <p>Before a landlord can publish property listings, administrators review their identity and ownership verification documents to ensure listing authenticity.</p>
        </details>
        <details class="faq-item">
          <summary>Can I use DormPath offline? ${icon("chevron-down")}</summary>
          <p>Yes. DormPath is an installable PWA. Cached listings and public data remain available even with intermittent mobile internet.</p>
        </details>
      </div>
    </section>
  `;
}

// Redesigned Property Card
function card(p) {
  const saved = state.favorites.some((f) => f.propertyId === p.id);
  const isAvailable = p.available > 0;

  return `
    <article class="property-card">
      <div class="property-image-container">
        <a href="#/property/${e(p.id)}">
          ${
            p.photos?.[0]
              ? `<img src="${e(p.photos[0])}" alt="${e(p.title)}" loading="lazy">`
              : `<div class="property-image-placeholder">${icon("building-2")}<span>Photo pending</span></div>`
          }
        </a>
        <span class="card-badge-overlay ${isAvailable ? "badge-available" : "badge-occupied"}">
          ${isAvailable ? `● ${p.available} space${p.available > 1 ? "s" : ""} left` : "Currently full"}
        </span>
        <button class="card-save-btn ${saved ? "saved" : ""}" data-save="${e(p.id)}" aria-label="${saved ? "Unsave" : "Save"} ${e(p.title)}">
          ${icon("heart")}
        </button>
      </div>

      <div class="property-card-body">
        <div class="card-header-row">
          <span class="card-room-type">${e(p.roomTypes?.[0] || "Room")}</span>
          <span class="card-verified-tag">${icon("building-2")} Owner listing</span>
        </div>

        <a href="#/property/${e(p.id)}">
          <h3 class="property-card-title">${e(p.title)}</h3>
        </a>

        <div class="property-card-location">
          ${icon("map-pin")} <span>${e(p.barangay)}, Tuguegarao</span>
        </div>

        <div class="card-amenities-row">
          ${(p.amenities || []).slice(0, 3).map((a) => `<span class="card-amenity-chip">${e(a)}</span>`).join("")}
        </div>

        <div class="property-card-footer">
          <div class="card-price-block">
            <strong>${money(p.minPrice)}</strong>
            <small>/ month</small>
          </div>
          <a href="#/property/${e(p.id)}" class="button primary small">
            View Details ${icon("arrow-up-right")}
          </a>
        </div>
      </div>
    </article>
  `;
}

function listingArea(items) {
  if (!state.loaded) {
    return `
      <div class="property-grid">
        ${[1, 2, 3].map(() => `<div class="skeleton" style="height:360px; border-radius:var(--radius-xl);"></div>`).join("")}
      </div>
    `;
  }
  if (!items.length) {
    return empty(
      state.error ? "Connection notice" : "No properties found",
      state.error || "No published spaces match your current search filter. Try adjusting your budget or area.",
      `<a class="button outline" href="#/map">Explore Area Map ${icon("arrow-right")}</a>`,
    );
  }
  return `<div class="property-grid">${items.map(card).join("")}</div>`;
}

function empty(title, description, action = "") {
  return `
    <div style="text-align:center; padding:60px 24px; background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-xl); max-width:600px; margin:40px auto;">
      <div style="width:56px; height:56px; border-radius:50%; background:var(--primary-subtle); color:var(--primary); display:grid; place-items:center; margin:0 auto 16px;">
        ${icon("house-plus")}
      </div>
      <h3 style="font-size:1.25rem; margin-bottom:8px;">${title}</h3>
      <p style="margin-bottom:20px;">${description}</p>
      ${action}
    </div>
  `;
}

// Redesigned Property Details Page
async function details(id) {
  const p = await api.getProperty(id);
  const rooms = await api.listRooms(id, p.status === "published");
  state.currentProperty = p;
  const coords = getPropertyCoordinates(p);
  const lat = coords ? coords[1] : null;
  const lng = coords ? coords[0] : null;

  return `
    <div class="detail-container">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
          <div class="overline">${e(p.barangay)} · TUGUEGARAO / PEÑABLANCA</div>
          <h1>${e(p.title)}</h1>
          <p style="display:flex; align-items:center; gap:6px; margin-top:4px;">
            ${icon("map-pin")} ${e(p.address)}
          </p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="button outline ${saved ? "saved" : ""}" data-save="${e(p.id)}">
            ${icon("heart")} <span>${saved ? "Saved" : "Save"}</span>
          </button>
          ${lat && lng ? `<a class="button primary" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving" target="_blank" rel="noopener noreferrer">${icon("navigation")} Directions</a>` : `<span class="badge">Location pending</span>`}
        </div>
      </div>

      <div class="detail-gallery">
        ${
          p.photos?.[0]
            ? `<img src="${e(p.photos[0])}" class="gallery-main-img" alt="Primary view of ${e(p.title)}">`
            : `<div class="gallery-main-img" style="display:grid; place-items:center; background:var(--bg-subtle); color:var(--text-muted);">${icon("building-2")} No photos yet</div>`
        }
        <div class="gallery-sub-grid">
          ${(p.photos || [])
            .slice(1, 3)
            .map((url) => `<img src="${e(url)}" class="gallery-sub-img" alt="Photo of ${e(p.title)}">`)
            .join("") ||
            `<div class="gallery-sub-img" style="display:grid; place-items:center; background:var(--bg-subtle);">${icon("image")}</div><div class="gallery-sub-img" style="display:grid; place-items:center; background:var(--bg-subtle);">${icon("image")}</div>`
          }
        </div>
      </div>

      <div class="detail-layout">
        <div>
          <div class="detail-section">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
              <span class="badge badge-success">${icon("shield-check")} Verified Owner</span>
              <span class="badge badge-outline">${e(p.roomTypes?.[0] || "Room")}</span>
            </div>
            <h3>About this space</h3>
            <p style="white-space:pre-wrap; margin-top:8px;">${e(p.description)}</p>

            <h3 style="margin-top:24px; margin-bottom:12px;">Amenities</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${(p.amenities || []).map((a) => `<span class="badge badge-outline">${icon("check")} ${e(a)}</span>`).join("")}
            </div>

            <h3 style="margin-top:24px; margin-bottom:8px;">House Rules</h3>
            <p style="white-space:pre-wrap;">${e(p.rules)}</p>

            ${
              p.video
                ? `
              <div style="margin-top:24px; padding:16px; border-radius:var(--radius-lg); background:var(--bg-subtle); border:1px solid var(--border);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                  <span class="badge" style="background:#ef4444; color:#fff; font-weight:700;">▶ Video Tour</span>
                  <strong style="font-size:0.9375rem;">Walkthrough Video</strong>
                </div>
                <div style="border-radius:var(--radius-md); overflow:hidden; background:#000;">
                  ${
                    p.video.includes("youtube.com") || p.video.includes("youtu.be")
                      ? `<iframe src="${p.video.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}" style="width:100%; aspect-ratio:16/9; border:none;" allowfullscreen></iframe>`
                      : `<video src="${e(p.video)}" controls style="width:100%; max-height:400px; display:block;" poster="${e(p.photos?.[0] || "")}"></video>`
                  }
                </div>
              </div>
            `
                : ""
            }
          </div>

          <div class="detail-section">
            <h3>Rooms & Availability</h3>
            <p style="margin-bottom:16px;">Confirmed by owner: ${date(p.vacancyConfirmedAt)}</p>
            <div style="display:grid; gap:12px;">
              ${
                rooms
                  .map(
                    (r) => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:14px; background:var(--bg-subtle); border-radius:var(--radius-md);">
                  <div>
                    <strong>${e(r.name)}</strong>
                    <div style="font-size:0.8125rem; color:var(--text-secondary);">${e(r.type)} · ${r.available} of ${r.capacity} spaces available</div>
                  </div>
                  <div>
                    <strong style="font-size:1.125rem; color:var(--primary);">${money(r.price)}</strong>
                    <small>/ month</small>
                  </div>
                </div>
              `,
                  )
                  .join("") || "<p>No room inventory listed yet.</p>"
              }
            </div>
          </div>

          <!-- Location & Accurate Map Directions Section -->
          <div class="detail-section" style="margin-top:24px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px; margin-bottom:16px;">
              <div>
                <h3 style="display:flex; align-items:center; gap:8px;">
                  ${icon("map-pin")} Property Location & Directions
                </h3>
                <p style="font-size:0.875rem; color:var(--text-secondary); margin-top:4px;">
                  ${e(p.address)}, ${e(p.barangay)}, Tuguegarao / Peñablanca
                </p>
                ${lat && lng ? `<span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace; display:inline-block; margin-top:2px;">Pin GPS: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</span>` : ""}
              </div>
              ${lat && lng ? `
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                  <a class="button primary small" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving" target="_blank" rel="noopener noreferrer" style="font-weight:700;">
                    ${icon("navigation")} Turn-by-Turn Directions
                  </a>
                  <a class="button outline small" href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener noreferrer">
                    Google Maps
                  </a>
                  <a class="button outline small" href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" rel="noopener noreferrer">
                    Waze
                  </a>
                  <button type="button" class="button outline small" data-copy-coords="${lat},${lng}">
                    ${icon("copy")} Copy Coordinates
                  </button>
                </div>
              ` : `<span class="badge">Coordinates pending confirmation</span>`}
            </div>

            <!-- Interactive Leaflet Preview Canvas -->
            ${lat && lng ? `
              <div id="property-detail-map" style="width:100%; height:300px; border-radius:var(--radius-lg); overflow:hidden; border:1px solid var(--border); margin-bottom:14px; background:var(--bg-subtle);"></div>

              <!-- Campus Proximity Badges -->
              <div style="background:var(--bg-subtle); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:14px 16px;">
                <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                  ${icon("compass")} Proximity to Campuses & Landmarks
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
                  ${NOTABLE_LANDMARKS.slice(0, 6).map((lm) => {
                    const d = calculateDistanceKm(lat, lng, lm.lat, lm.lng);
                    const fmt = formatDistance(d);
                    const estWalk = Math.round(d * 12);
                    const estRide = Math.max(2, Math.round(d * 2.5));
                    return `
                      <div style="background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:8px 12px; font-size:0.8125rem;">
                        <div style="font-weight:700; color:var(--text-main); margin-bottom:2px;">${e(lm.short)}</div>
                        <div style="color:var(--primary); font-weight:700;">${fmt}</div>
                        <div style="color:var(--text-muted); font-size:0.75rem;">${d <= 1.2 ? `~${estWalk} min walk` : `~${estRide} min ride`}</div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            ` : ""}
          </div>
        </div>

        <aside class="sticky-inquiry-card">
          <div class="inquiry-price-header">
            <span class="text-muted" style="font-size:0.8125rem;">Starting from</span>
            <div><strong>${money(p.minPrice)}</strong> <span style="font-size:0.9375rem; color:var(--text-secondary);">/ month</span></div>
            <div style="margin-top:4px; font-size:0.875rem; color:${p.available > 0 ? "var(--success)" : "var(--text-muted)"}; font-weight:600;">
              ${p.available > 0 ? `● ${p.available} space(s) reported available` : "Currently full"}
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <div style="font-size:0.875rem; font-weight:700; margin-bottom:4px;">Landlord</div>
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="sidebar-avatar">${(p.ownerName || "O")[0].toUpperCase()}</div>
              <div>
                <strong>${e(p.ownerName)}</strong>
                <div style="font-size:0.75rem; color:var(--success);">Verified Property Owner</div>
              </div>
            </div>
          </div>

          <div style="display:grid; gap:10px;">
            <button class="button primary full large" data-chat-property="${e(p.id)}">
              ${icon("message-circle")} Message Landlord Free
            </button>
            <button class="button text-button small" data-report="${e(p.id)}" style="color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; gap:6px;">
              ${icon("flag")} Report Landlord or Listing
            </button>
          </div>
        </aside>
      </div>
    </div>
  `;
}

// Redesigned Dashboard Page
async function dashboard() {
  const isOwner = api.profile?.role === "landlord";
  const convs = await api.conversations();

  if (isOwner) {
    const props = await api.ownProperties();
    const totalAvailable = props.reduce((n, p) => n + (p.available || 0), 0);
    const totalCapacity = props.reduce((n, p) => n + (p.capacity || 0), 0);

    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; flex-wrap:wrap; gap:16px;">
          <div>
            <div class="overline">LANDLORD COMMAND CENTER</div>
            <h2>Welcome back, ${e(api.profile?.name || "Landlord")} 👋</h2>
            <p>Manage listings, update available spaces, and respond to tenant inquiries.</p>
          </div>
          <div style="display:flex; gap:10px;">
            <a href="#/add-property" class="button primary">
              ${icon("plus")} Add Property
            </a>
          </div>
        </div>

        <div class="trust-metrics-grid" style="margin-bottom:32px;">
          <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
            <div class="metric-icon-box">${icon("building-2")}</div>
            <div>
              <strong>${props.length}</strong>
              <span>Active Properties</span>
            </div>
          </div>
          <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
            <div class="metric-icon-box" style="background:rgba(16,185,129,0.1); color:var(--success);">${icon("bed-double")}</div>
            <div>
              <strong>${totalAvailable}</strong>
              <span>Reported Available Beds</span>
            </div>
          </div>
          <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
            <div class="metric-icon-box">${icon("users")}</div>
            <div>
              <strong>${totalCapacity}</strong>
              <span>Total Capacity</span>
            </div>
          </div>
          <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
            <div class="metric-icon-box" style="background:rgba(37,99,235,0.1); color:var(--primary);">${icon("messages-square")}</div>
            <div>
              <strong>${convs.length}</strong>
              <span>Tenant Inquiries</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <h3 style="margin-bottom:0;">Your Listed Boarding Houses (${props.length})</h3>
            <a href="#/properties" class="button outline small">Manage All ${icon("arrow-right")}</a>
          </div>
          ${
            props.length
              ? `
            <div style="display:grid; gap:12px;">
              ${props
                .map(
                  (p) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:14px; background:var(--bg-subtle); border-radius:var(--radius-md); flex-wrap:wrap; gap:12px;">
                  <div>
                    <strong style="font-size:1rem; display:block;">${e(p.title)}</strong>
                    <div style="font-size:0.8125rem; color:var(--text-muted); margin-top:3px;">
                      ${e(p.barangay)} · Rent from ₱${p.minPrice.toLocaleString()}/mo · <strong>${p.available} vacancies</strong> (${p.capacity} total)
                    </div>
                  </div>
                  <div style="display:flex; gap:8px;">
                    <a href="#/rooms/${p.id}" class="button outline small">${icon("sliders-horizontal")} Rooms & Vacancies</a>
                    <a href="#/edit-property/${p.id}" class="button text-button small">${icon("edit-3")} Edit</a>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : `
            <div style="text-align:center; padding:32px 16px;">
              <div style="font-size:2.5rem; margin-bottom:12px;">🏠</div>
              <h4>No Properties Listed Yet</h4>
              <p style="color:var(--text-secondary); max-width:440px; margin:8px auto 20px; font-size:0.875rem;">
                Share your boarding house or apartment with tenants in Tuguegarao City.
              </p>
              <a href="#/add-property" class="button primary">${icon("plus")} Add Your First Property</a>
            </div>
          `
          }
        </div>
      </div>
    `;
  }

  // Tenant Dashboard
  const favs = await api.favorites();
  return `
    <div>
      <div style="margin-bottom:28px;">
        <div class="overline">TENANT HOUSING WORKSPACE</div>
        <h2>Welcome back, ${e(api.profile?.name || "Tenant")} 👋</h2>
        <p>Track your saved boarding houses, landlord inquiries, and room requests.</p>
      </div>

      <div class="trust-metrics-grid" style="margin-bottom:32px;">
        <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
          <div class="metric-icon-box" style="background:rgba(239,68,68,0.1); color:var(--danger);">${icon("heart")}</div>
          <div>
            <strong>${favs.length}</strong>
            <span>Saved Places</span>
          </div>
        </div>
        <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
          <div class="metric-icon-box" style="background:rgba(37,99,235,0.1); color:var(--primary);">${icon("messages-square")}</div>
          <div>
            <strong>${convs.length}</strong>
            <span>Landlord Conversations</span>
          </div>
        </div>
        <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
          <div class="metric-icon-box" style="background:rgba(16,185,129,0.1); color:var(--success);">${icon("shield-check")}</div>
          <div>
            <strong>₱0</strong>
            <span>Tenant Platform Fees</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Quick Shortcuts</h3>
        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:14px;">
          <a href="#/search" class="button primary">
            ${icon("search")} Explore Rooms ${icon("arrow-right")}
          </a>
          <a href="#/map" class="button outline">
            ${icon("map")} Tuguegarao Map
          </a>
          <a href="#/domi" class="button outline">
            ${icon("sparkles")} Ask DOMI
          </a>
        </div>
      </div>

      <div class="detail-section" style="margin-top:24px; background:linear-gradient(135deg, rgba(239,68,68,0.04), rgba(245,158,11,0.04)); border:1px solid rgba(239,68,68,0.18); border-radius:var(--radius-xl); padding:20px 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; font-weight:700; color:var(--text-main); font-size:1.0625rem;">
              <span style="color:var(--danger);">${icon("flag")}</span> Tenant Safety & Landlord Accountability
            </div>
            <p style="font-size:0.875rem; color:var(--text-secondary); margin-top:4px; max-width:620px;">
              Encountered a landlord who is rude, disrespectful, demanding unauthorized deposits, or not nice? Report them directly to DormPath administrators.
            </p>
          </div>
          <button type="button" class="button outline small" data-action="report-landlord-direct" style="border-color:var(--danger); color:var(--danger); background:var(--bg-surface);">
            ${icon("flag")} Report a Landlord
          </button>
        </div>
      </div>
    </div>
  `;
}

// Tuguegarao City Coordinates & Fallbacks
const TUGUEGARAO_CENTER = [121.7270, 17.6132]; // [lng, lat] for MapLibre

const BARANGAY_COORDS = {
  centro: [121.7282, 17.6135],
  poblacion: [121.7282, 17.6135],
  "san gabriel": [121.7180, 17.6180],
  carig: [121.7580, 17.6530],
  "carig sur": [121.7550, 17.6480],
  "carig norte": [121.7610, 17.6580],
  caggay: [121.7370, 17.6320],
  balzain: [121.7225, 17.6190],
  "balzain east": [121.7250, 17.6195],
  "balzain west": [121.7200, 17.6185],
  "pengue-ruyu": [121.7390, 17.6170],
  pengue: [121.7390, 17.6170],
  ugac: [121.7190, 17.6040],
  "ugac sur": [121.7180, 17.6010],
  "ugac norte": [121.7200, 17.6070],
  buntun: [121.6960, 17.6080],
  cataggaman: [121.7050, 17.5990],
  "cataggaman pardo": [121.7040, 17.5970],
  "cataggaman nuevo": [121.7060, 17.6010],
  "cataggaman viejo": [121.7080, 17.5950],
  atulayan: [121.7330, 17.6185],
  "atulayan sur": [121.7320, 17.6170],
  "atulayan norte": [121.7340, 17.6200],
  annafunan: [121.7160, 17.6350],
  "annafunan east": [121.7180, 17.6360],
  "annafunan west": [121.7140, 17.6340],
  linao: [121.7020, 17.6310],
  "linao east": [121.7040, 17.6320],
  "linao west": [121.7000, 17.6300],
  "linao norte": [121.7020, 17.6340],
  libag: [121.7340, 17.6010],
  "libag sur": [121.7330, 17.5990],
  "libag norte": [121.7350, 17.6030],
  capatan: [121.7450, 17.5920],
  bagay: [121.6990, 17.6250],
  larion: [121.7520, 17.6150],
  "larion alto": [121.7540, 17.6170],
  "larion bajo": [121.7500, 17.6130],
  tanza: [121.7240, 17.6110],
  tagga: [121.7610, 17.6380],
  pallua: [121.7030, 17.6120],
  "pallua sur": [121.7020, 17.6100],
  "pallua norte": [121.7040, 17.6140],
  namabbalan: [121.7690, 17.5620],
  usl: [121.7245, 17.6185],
  spup: [121.7210, 17.6160],
  csu: [121.7580, 17.6530],
};

function getPropertyCoordinates(p) {
  const lat = Number(p.lat);
  const lng = Number(p.lng);
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    p.lat !== null && p.lat !== "" && p.lng !== null && p.lng !== "" &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0)
  ) {
    return [lng, lat]; // MapLibre takes [lng, lat]
  }

  return null; // Never invent a property location.
}

// Redesigned Search & 3D Map Page
function searchPage(mapView = false) {
  const items = filterProperties(state.properties, state.filters);

  if (mapView) {
    return `
      <div class="map3d-shell">
        <main class="map3d-viewport">
          <div id="map"></div>

          <!-- Sleek Floating Navigation & Filter Header -->
          <div class="map3d-floating-bar">
            <div class="map3d-floating-info">
              <div class="map3d-pill-brand">
                <span style="font-size:1.1rem;">📍</span>
                <strong>Tuguegarao & Peñablanca</strong>
              </div>
              <span class="map3d-pill-count">${items.length} place${items.length === 1 ? "" : "s"}</span>
            </div>

            <div class="map3d-floating-chips">
              <button class="map3d-filter-chip ${!state.filters.type ? "active" : ""}" data-map-filter="">All Types</button>
              ${TYPES.map((t) => `<button class="map3d-filter-chip ${state.filters.type === t ? "active" : ""}" data-map-filter="${t}">${t}</button>`).join("")}
              <button class="map3d-filter-chip ${state.filters.vacant ? "active" : ""}" data-map-vacant="toggle">
                ${state.filters.vacant ? "✓ Vacant" : "Vacant"}
              </button>
            </div>

            <a href="#/search" class="button outline small" style="background:var(--bg-surface); white-space:nowrap; border-radius:var(--radius-full); font-weight:700; height:34px; padding:0 12px; display:inline-flex; align-items:center; gap:6px;">
              ${icon("layout-grid")} <span>Grid View</span>
            </a>
          </div>

          <!-- Polished Floating Map Controls -->
          <div class="map3d-controls-overlay">
            <button class="map3d-ctrl-btn" id="map3d-compass-btn" title="Reset North">
              ${icon("compass")}
            </button>
            <button class="map3d-ctrl-btn" id="map3d-locate-btn" title="Locate Me">
              ${icon("crosshair")}
            </button>
            <button class="map3d-ctrl-btn" id="map3d-center-btn" title="Reset to Center">
              ${icon("house")}
            </button>
            <button class="map3d-ctrl-btn" id="map3d-zoom-in" title="Zoom In">
              ${icon("plus")}
            </button>
            <button class="map3d-ctrl-btn" id="map3d-zoom-out" title="Zoom Out">
              ${icon("minus")}
            </button>
          </div>

          <!-- Interactive Interaction Hint -->
          <div class="map3d-tip-pill">
            ${icon("map-pin")} Interactive map of Tuguegarao City & Peñablanca boarding houses
          </div>

          ${
            items.length
              ? `
            <!-- Floating bottom drawer for listings -->
            <div class="map3d-bottom-sheet">
              <div class="map3d-sheet-handle"></div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="font-size:0.875rem;">${items.length} Properties in Tuguegarao & Peñablanca</strong>
                <a href="#/search" class="button outline small" style="padding:2px 8px; font-size:0.75rem;">View Full List</a>
              </div>
              <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:4px;">
                ${items.slice(0, 15).map((p) => `
                  <div class="map3d-card" data-focus-property="${p.id}" style="min-width:240px; grid-template-columns:72px 1fr;">
                    <img src="${e(p.photos?.[0] || "/domi.png")}" class="map3d-card-thumb" style="width:72px; height:64px;" alt="${e(p.title)}" onerror="this.onerror=null;this.src='/domi.png'">
                    <div class="map3d-card-content">
                      <div class="map3d-card-title">${e(p.title)}</div>
                      <div class="map3d-card-price">₱${Number(p.minPrice || 0).toLocaleString()}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          `
              : ""
          }
        </main>
      </div>
    `;
  }

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <div>
          <div class="overline">EXPLORE TUGUEGARAO</div>
          <h2>Available Rooms & Dorms</h2>
          <p>${items.length} verified space${items.length === 1 ? "" : "s"} found</p>
        </div>
        <div style="display:flex; gap:8px;">
          <a href="#/search" class="button ${!mapView ? "primary" : "outline"} small">
            ${icon("layout-grid")} List
          </a>
          <a href="#/map" class="button ${mapView ? "primary" : "outline"} small">
            ${icon("map")} Map Explorer
          </a>
        </div>
      </div>

      <form id="filters" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:28px; background:var(--bg-surface); padding:16px; border-radius:var(--radius-lg); border:1px solid var(--border);">
        <select name="type" style="width:auto; min-width:160px;">
          <option value="">All space types</option>
          ${TYPES.map((t) => `<option ${state.filters.type === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
        <label class="check" style="margin:0;">
          <input type="checkbox" name="vacant" ${state.filters.vacant ? "checked" : ""}> With vacancies only
        </label>
        <button class="button outline small">Apply filters</button>
        <button type="button" class="button text-button small" data-action="reset-filters">Reset</button>
      </form>

      ${listingArea(items)}
      ${state.more ? `<div style="text-align:center; margin-top:32px;"><button class="button outline" data-action="load-more">Load more properties</button></div>` : ""}
    </div>
  `;
}

// Redesigned Messenger Page
async function messagesPage(id) {
  const convs = await api.conversations();
  state.conversations = convs;
  const selected = convs.find((c) => c.id === id);
  state.chat = selected;

  return `
    <div class="messenger-layout">
      <aside class="conversations-sidebar">
        <div class="conversations-header">Inbox</div>
        <div>
          ${
            convs.length
              ? convs
                  .map((c) => {
                    const isSelected = c.id === id;
                    const isUnread =
                      c.lastSender !== api.currentUser.uid &&
                      c.updatedAt?.seconds > (c.readAt?.[api.currentUser.uid]?.seconds || 0);
                    return `
              <a href="#/messages/${c.id}" class="conversation-card ${isSelected ? "selected" : ""}">
                <div class="sidebar-avatar">${icon("house")}</div>
                <div style="flex:1; min-width:0;">
                  <strong style="display:block; font-size:0.875rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${e(c.title)}
                  </strong>
                  <p style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;">
                    ${e(c.lastMessage || "Start conversation")}
                  </p>
                  <small style="font-size:0.6875rem; color:var(--text-muted);">${date(c.updatedAt)}</small>
                </div>
                ${isUnread ? `<span class="sidebar-badge-count">1</span>` : ""}
              </a>
            `;
                  })
                  .join("")
              : `<div style="padding:32px; text-align:center; color:var(--text-muted);">No messages yet. Open a property and message the owner.</div>`
          }
        </div>
      </aside>

      <section class="chat-container">
        ${
          selected
            ? `
          <header class="chat-header">
            <div>
              <strong style="font-size:1.0625rem;">${e(selected.title)}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">Direct encrypted conversation</div>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              ${selected.tenantId === api.currentUser.uid ? button("Request viewing", "viewing", "button outline small") : ""}
              ${selected.tenantId === api.currentUser.uid ? `<button class="button outline small" style="color:var(--danger); border-color:rgba(239,68,68,0.3);" data-report="${e(selected.propertyId)}" title="Report landlord if they are disrespectful or not nice">${icon("flag")} Report Landlord</button>` : ""}
              <button class="button text-button small" data-action="block">Block</button>
            </div>
          </header>
          <div id="viewings" style="padding:8px 24px;"></div>
          <div id="messages" class="chat-messages-area">
            <div style="display:flex; justify-content:center; padding:24px 0;">${domiLoaderHtml("compact")}</div>
          </div>
          <form id="message-form" class="chat-input-row">
            <textarea id="message-text" name="text" required placeholder="Type a message..." style="min-height:48px; height:48px; padding:10px 14px;"></textarea>
            <button class="button primary" style="height:48px; padding:0 20px;">
              ${icon("send")}
            </button>
          </form>
        `
            : `
          <div style="display:grid; place-items:center; height:100%; text-align:center; color:var(--text-muted);">
            <div>
              <div style="font-size:2rem; margin-bottom:12px;">💬</div>
              <strong>Select a conversation</strong>
              <p>Choose an inbox thread on the left, or visit a listing to message an owner.</p>
            </div>
          </div>
        `
        }
      </section>
    </div>
  `;
}

function renderMessages(items) {
  state.messages = items;
  const box = $("#messages");
  if (!box) return;
  box.innerHTML =
    items
      .map(
        (m) => `
      <div class="message-bubble ${m.senderId === api.currentUser.uid ? "mine" : "other"}">
        <p>${e(m.text)}</p>
        <div class="message-time" style="font-size:0.6875rem; opacity:0.85; margin-top:4px; text-align:right;">
          ${date(m.createdAt)}
        </div>
      </div>
    `,
      )
      .join("") || `<p class="text-muted" style="text-align:center;">No messages yet. Say hello!</p>`;
  box.scrollTop = box.scrollHeight;
}

// Redesigned Favorites Page
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

  return `
    <div>
      <div style="margin-bottom:24px;">
        <div class="overline">YOUR SHORTLIST</div>
        <h2>Saved Properties (${props.length})</h2>
      </div>
      ${props.length ? listingArea(props) : empty("No saved rooms yet", "Tap the heart button on any listing to build your shortlist.", `<a class="button primary" href="#/search">Explore rooms</a>`)}
    </div>
  `;
}

// Kwarto Wanted has been sunset in favor of direct 3D map exploration & verified listings
async function wantedPage() {
  location.hash = "/search";
  return "";
}

// Redesigned Profile & Account Settings Page
async function profilePage() {
  const pfp = api.currentUser?.photoURL || api.profile?.photoURL || "";
  const initial = (api.profile?.name || "U")[0].toUpperCase();
  const isTenant = api.profile?.role !== "landlord";
  const isLandlord = api.profile?.role === "landlord";
  const emailVerified = api.currentUser?.emailVerified;
  const landlordApplication = await api.getLandlordApplication().catch(() => null);

  return `
    <div class="profile-shell">
      <div style="margin-bottom:28px;">
        <div class="overline">ACCOUNT SETTINGS</div>
        <h2>Profile & Security</h2>
        <p style="color:var(--text-secondary); margin-top:4px;">
          Manage your personal details, profile picture, account security, and offline preferences.
        </p>
      </div>

      <!-- Avatar & Photo Upload -->
      <div class="profile-card">
        <div class="profile-section-heading">
          ${icon("camera")} Profile Picture
        </div>
        <div class="profile-avatar-row">
          <div class="profile-avatar-container">
            ${
              pfp
                ? `<img src="${e(pfp)}" class="profile-avatar-img" alt="Profile Picture">`
                : `<div class="profile-avatar-placeholder">${initial}</div>`
            }
          </div>
          <div class="profile-avatar-controls">
            <input type="file" id="pfp-file-input" accept="image/jpeg,image/png,image/webp" style="display:none;">
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="button primary small" data-action="trigger-pfp">
                ${icon("upload")} Upload Photo
              </button>
              ${
                pfp
                  ? `<button type="button" class="button outline small" data-action="remove-pfp" style="color:var(--danger); border-color:var(--danger);">
                      Remove Photo
                    </button>`
                  : ""
              }
            </div>
            <div class="profile-avatar-hint">
              JPEG, PNG, or WebP under 10 MB. Profile photos help landlords and tenants recognize each other.
            </div>
          </div>
        </div>

        <!-- Personal Details Form -->
        <form id="profile-form">
          <div class="profile-section-heading" style="margin-top:20px;">
            ${icon("user")} Personal Information
          </div>

          <div class="profile-grid-2">
            <label>Full Name
              <input name="name" required maxlength="80" value="${e(api.profile?.name || "")}" placeholder="Your Full Name">
            </label>
            <label>Contact Phone
              <input name="phone" type="tel" maxlength="30" value="${e(api.profile?.phone || "")}" placeholder="+63 912 345 6789">
            </label>
          </div>

          <label style="margin-top:12px;">Email Address
            <div style="position:relative; display:flex; align-items:center;">
              <input value="${e(api.currentUser?.email || "")}" disabled style="background:var(--bg-subtle); padding-right:120px;">
              <div style="position:absolute; right:10px;">
                ${
                  emailVerified
                    ? `<span class="admin-badge badge-active">${icon("shield-check")} Verified</span>`
                    : `<button type="button" class="button outline small" data-action="send-verify-email" style="padding:4px 8px; font-size:0.75rem;">Verify Email</button>`
                }
              </div>
            </div>
          </label>

          ${
            !isLandlord
              ? `
            <label style="margin-top:12px;">Preferred School / Campus in Tuguegarao
              <input name="school" maxlength="120" value="${e(api.profile?.school || "")}" placeholder="e.g., Cagayan State University, SPUP, USL">
            </label>
            <label style="margin-top:12px;">Bio & Housing Preferences
              <textarea name="bio" rows="3" maxlength="500" placeholder="Brief note about yourself, your year/course, study habits, or preferred room type...">${e(api.profile?.bio || "")}</textarea>
            </label>
          `
              : ""
          }

          <div style="margin:20px 0 16px; padding:12px 16px; background:var(--bg-subtle); border-radius:var(--radius-md); font-size:0.875rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div>
              Platform Role: <strong>${isLandlord ? "Landlord / Owner" : "Tenant"}</strong>
              ${api.profile?.verified ? ` · <span class="admin-badge badge-verified">${icon("shield-check")} Verified Landlord</span>` : ""}
              ${api.isAdmin ? ` · <span class="admin-badge badge-you">${icon("shield-check")} Administrator</span>` : ""}
            </div>
          </div>

          <button class="button primary" type="submit">
            Save Changes
          </button>
        </form>
      </div>

      ${
        api.profile?.verified || landlordApplication?.status === "approved"
          ? `
      <div class="profile-card" id="landlord-verification" style="border: 1px solid rgba(16, 185, 129, 0.35); background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:rgba(16, 185, 129, 0.15); color:var(--success); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${icon("shield-check")}
            </div>
            <div>
              <h3 style="margin:0 0 4px; font-size:1.125rem; color:var(--text-main);">Landlord Permits Approved & Verified</h3>
              <p style="margin:0; font-size:0.875rem; color:var(--text-secondary);">
                Your permits have been verified by an administrator. You can publish properties and manage room vacancies.
              </p>
            </div>
          </div>
          <span class="admin-badge badge-verified" style="font-size:0.8125rem; padding:6px 14px;">
            ${icon("badge-check")} Permit-Approved Owner
          </span>
        </div>

        ${
          landlordApplication
            ? `
        <div style="background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px; margin-top:12px;">
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); margin-bottom:10px;">
            Verified Permit Reference Record
          </div>
          <div class="profile-grid-2" style="font-size:0.8125rem;">
            <div><strong>Legal Owner Name:</strong> ${e(landlordApplication.legalName || "—")}</div>
            <div><strong>Registered Property:</strong> ${e(landlordApplication.propertyAddress || "—")}</div>
            <div><strong>Proof of Ownership / Lease:</strong> ${e(landlordApplication.proofOfOwnershipRef || "—")}</div>
            <div><strong>Business Permit:</strong> ${e(landlordApplication.businessPermitNumber || "—")} (exp: ${e(landlordApplication.businessPermitExpires || "—")})</div>
            <div><strong>Barangay Clearance:</strong> ${e(landlordApplication.barangayClearanceNumber || "—")} (exp: ${e(landlordApplication.barangayClearanceExpires || "—")})</div>
            <div><strong>Fire Safety Certificate:</strong> ${e(landlordApplication.fireSafetyNumber || "—")} (exp: ${e(landlordApplication.fireSafetyExpires || "—")})</div>
          </div>
        </div>
        `
            : ""
        }
      </div>`
          : `
      <div class="profile-card" id="landlord-verification">
        <div class="profile-section-heading">${icon("badge-check")} Landlord permit review</div>
        <p style="color:var(--text-secondary); font-size:0.875rem; margin-bottom:16px;">
          Submit every required permit reference. An administrator must review and approve this application before you can publish a property.
        </p>
        ${
          landlordApplication
            ? `<div class="badge ${landlordApplication.status === "approved" ? "badge-success" : "badge-outline"}" style="margin-bottom:14px;">Status: ${e(String(landlordApplication.status || "submitted").replaceAll("_", " "))}</div>
               ${landlordApplication.missingItems?.length ? `<div class="notice warning" style="margin-bottom:14px;"><strong>Missing or invalid:</strong> ${landlordApplication.missingItems.map((item) => e(item.replaceAll(/([A-Z])/g, " $1"))).join(", ")}. ${e(landlordApplication.reviewNotes || "Update the fields below and resubmit.")}</div>` : ""}`
            : ""
        }
        <form id="landlord-application-form">
          <div class="profile-grid-2">
            <label>Legal name<input name="legalName" required maxlength="120" value="${e(landlordApplication?.legalName || api.profile?.name || "")}"></label>
            <label>Property address<input name="propertyAddress" required maxlength="250" value="${e(landlordApplication?.propertyAddress || "")}"></label>
            <label>Proof of ownership / lease reference<input name="proofOfOwnershipRef" required maxlength="120" value="${e(landlordApplication?.proofOfOwnershipRef || "")}" placeholder="Title, tax declaration, or notarized lease reference"></label>
            <label>Mayor's / Business permit number<input name="businessPermitNumber" required maxlength="100" value="${e(landlordApplication?.businessPermitNumber || "")}"></label>
            <label>Mayor's permit expiry date<input name="businessPermitExpires" required type="date" value="${e(landlordApplication?.businessPermitExpires || "")}"></label>
            <label>Barangay clearance number<input name="barangayClearanceNumber" required maxlength="100" value="${e(landlordApplication?.barangayClearanceNumber || "")}"></label>
            <label>Barangay clearance expiry<input name="barangayClearanceExpires" required type="date" value="${e(landlordApplication?.barangayClearanceExpires || "")}"></label>
            <label>Fire safety certificate number<input name="fireSafetyNumber" required maxlength="100" value="${e(landlordApplication?.fireSafetyNumber || "")}"></label>
            <label>Fire safety certificate expiry<input name="fireSafetyExpires" required type="date" value="${e(landlordApplication?.fireSafetyExpires || "")}"></label>
          </div>

          <!-- Mayor's Permit Document Upload Field -->
          <div style="margin-top:16px; padding:16px; background:var(--bg-subtle); border:1px solid var(--border); border-radius:var(--radius-md);">
            <div style="font-weight:700; font-size:0.9375rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
              ${icon("upload")} Upload Mayor's Permit Document (Required Photo / Scan)
            </div>
            <p style="font-size:0.8125rem; color:var(--text-secondary); margin:0 0 12px; line-height:1.5;">
              Please upload a clear photo or scan of your official Tuguegarao City or Peñablanca Mayor's Permit (JPEG, PNG, or WebP under 10 MB). The administrator will inspect this document to verify it matches your name, address, and permit number.
            </p>

            <input type="file" name="mayorsPermitFile" id="mayors-permit-file-input" accept="image/jpeg,image/png,image/webp">
            <input type="hidden" name="mayorsPermitUrl" value="${e(landlordApplication?.mayorsPermitUrl || "")}">

            ${
              landlordApplication?.mayorsPermitUrl
                ? `
              <div style="display:flex; align-items:center; gap:14px; margin-top:12px; padding:10px 14px; background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-md);">
                <img src="${e(landlordApplication.mayorsPermitUrl)}" alt="Current Mayor's Permit" style="width:52px; height:52px; object-fit:cover; border-radius:6px; border:1px solid var(--border-light);" />
                <div style="flex:1;">
                  <strong style="font-size:0.875rem; color:var(--success); display:block;">Mayor's Permit Attached</strong>
                  <a href="${e(landlordApplication.mayorsPermitUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:0.75rem; color:var(--primary); font-weight:600;">
                    ${icon("external-link")} View Current Document
                  </a>
                </div>
                <span style="font-size:0.75rem; color:var(--text-muted);">Choose a new file to replace</span>
              </div>
            `
                : ""
            }
          </div>

          <label class="check" style="margin-top:16px;"><input type="checkbox" name="consent" required ${landlordApplication?.consent ? "checked" : ""}> I certify these permit details are accurate and authorize DormPath administrators to inspect and verify them.</label>
          <p class="text-muted" style="font-size:0.75rem; margin:10px 0;">Do not upload identity scans as public listing photos. Permit references and document scans are stored only in the secure administrator review record.</p>
          <button class="button primary" type="submit">${landlordApplication ? "Update and resubmit" : "Submit for admin review"}</button>
        </form>
      </div>`
      }

      <!-- Security: Password Management -->
      <div class="profile-card">
        <div class="profile-section-heading">
          ${icon("lock")} Password & Security
        </div>
        <p style="color:var(--text-secondary); font-size:0.875rem; margin-bottom:18px;">
          Keep your account secure with a strong password of at least 8 characters.
        </p>

        <form id="change-password-form">
          <div class="profile-grid-2">
            <label class="password-field">New Password
              <input name="newPassword" id="profile-new-pass" type="password" required minlength="8" placeholder="At least 8 characters">
              <button type="button" class="password-toggle-btn" data-action="toggle-password" aria-label="Toggle password visibility">
                ${icon("eye")}
              </button>
            </label>
            <label class="password-field">Confirm New Password
              <input name="confirmPassword" id="profile-confirm-pass" type="password" required minlength="8" placeholder="Repeat new password">
            </label>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; flex-wrap:wrap; gap:12px;">
            <button class="button outline" type="submit">
              Update Password
            </button>
            <button type="button" class="button text-button small" data-action="send-reset-email">
              Forgot password? Send reset email
            </button>
          </div>
        </form>
      </div>

      <!-- Offline Cache & Data Management -->
      <div class="profile-card">
        <div class="profile-section-heading">
          ${icon("hard-drive")} Offline Data & Privacy
        </div>
        <p style="color:var(--text-secondary); font-size:0.875rem; margin-bottom:16px;">
          Public listings are cached automatically for quick loading. You can choose whether to store private chat conversations on this device.
        </p>
        <label class="check" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" id="private-cache" ${privateEnabled() ? "checked" : ""}>
          <span>Cache private message threads locally on this device</span>
        </label>
        <div style="margin-top:16px;">
          <button class="button outline small" data-action="clear-private">
            ${icon("trash-2")} Clear Cached Offline Data
          </button>
        </div>
      </div>

      <!-- Appearance & Theme Settings -->
      <div class="profile-card">
        <div class="profile-section-heading">
          ${icon("sun-moon")} Appearance & Theme
        </div>
        <p style="color:var(--text-secondary); font-size:0.875rem; margin-bottom:14px;">
          Choose your visual appearance for browsing listings and managing properties.
        </p>
        <div class="profile-theme-box">
          <div class="profile-theme-info">
            <span style="font-size:1.25rem;">${document.documentElement.dataset.theme === "dark" ? "🌙" : "☀️"}</span>
            <div>
              <strong style="display:block; font-size:0.9375rem; color:var(--text-main);">
                Current Theme: ${document.documentElement.dataset.theme === "dark" ? "Dark Mode" : "Light Mode"}
              </strong>
              <span style="font-size:0.75rem; color:var(--text-muted);">
                ${document.documentElement.dataset.theme === "dark" ? "Sleek low-light contrast" : "Crisp high-clarity daylight"}
              </span>
            </div>
          </div>
          <button type="button" class="button outline small" data-action="theme">
            ${icon("sun-moon")} Switch Theme
          </button>
        </div>
      </div>

      <!-- Account & Session Management -->
      <div class="profile-card">
        <div class="profile-section-heading" style="color:var(--danger);">
          ${icon("log-out")} Account Session
        </div>
        <p style="color:var(--text-secondary); font-size:0.875rem; margin-bottom:14px;">
          Securely sign out of your DormPath session on this device.
        </p>
        <div class="profile-logout-box">
          <div>
            <strong style="display:block; font-size:0.875rem; color:var(--text-main);">
              Signed in as ${e(api.currentUser?.email || "User")}
            </strong>
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:capitalize;">
              Role: ${isLandlord ? "Landlord / Owner" : "Tenant"}
            </span>
          </div>
          <button type="button" class="button outline small" style="color:var(--danger); border-color:rgba(239, 68, 68, 0.4);" data-action="logout">
            ${icon("log-out")} Log Out
          </button>
        </div>
      </div>
    </div>
  `;
}

// Redesigned Landlord Properties Page
async function propertiesPage() {
  if (api.profile?.role !== "landlord") {
    return empty("Landlord area", "Register as a property owner to list and manage boarding houses.");
  }
  const properties = await api.ownProperties();
  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <div>
          <div class="overline">PROPERTY MANAGEMENT</div>
          <h2>My Properties (${properties.length})</h2>
        </div>
        <a href="#/add-property" class="button primary">
          ${icon("plus")} Add Property
        </a>
      </div>

      <div style="display:grid; gap:16px;">
        ${
          properties.length
            ? properties
                .map(
                  (p) => `
              <div class="detail-section" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:0;">
                <div>
                  <span class="badge ${p.status === "published" ? "badge-success" : "badge-warning"}" style="margin-bottom:6px;">
                    ${e(p.status)}
                  </span>
                  <h3>${e(p.title)}</h3>
                  <p>${p.available} available / ${p.capacity} total spaces reported</p>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                  <a href="#/edit-property/${p.id}" class="button outline small">${icon("edit-3")} Edit</a>
                  <a href="#/rooms/${p.id}" class="button primary small">${icon("sliders-horizontal")} Rooms</a>
                  <button class="button text-button small" data-status="${p.id}:paused">Pause</button>
                  <button class="button text-button small" data-status="${p.id}:archived">Archive</button>
                  ${p.status === "archived" ? `<button class="button text-button small" data-delete-property="${p.id}" style="color:var(--danger);">Delete</button>` : ""}
                </div>
              </div>
            `,
                )
                .join("")
            : empty("No properties added yet", "Click Add Property to submit your boarding house or dorm for moderation.")
        }
      </div>
    </div>
  `;
}

// Redesigned Property Form (Add / Edit) - Centered & Premium
function propertyForm(p = {}) {
  const isLandlord = (api.profile?.role === "landlord" && api.profile?.verified) || api.isAdmin;

  return `
    <div class="property-form-wrapper">
      <div style="text-align:center; margin-bottom:28px;">
        <div class="overline" style="justify-content:center;">${icon("building-2")} LISTING CREATOR</div>
        <h2 style="font-size:clamp(1.75rem, 3vw, 2.25rem); margin:6px 0;">${p.id ? "Edit Property Listing" : "Add New Property"}</h2>
        <p style="color:var(--text-secondary); max-width:540px; margin:0 auto; font-size:0.9375rem;">
          Publish and manage your boarding house, dormitory, or apartment in Tuguegarao City & Peñablanca.
        </p>
      </div>

      ${
        !isLandlord
          ? `
        <div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-xl); padding:20px; margin-bottom:24px; display:flex; align-items:flex-start; gap:16px;">
          <div style="width:42px; height:42px; border-radius:50%; background:rgba(239,68,68,0.15); color:var(--danger); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${icon("alert-circle")}
          </div>
          <div style="flex:1;">
            <strong style="color:var(--danger); font-size:1rem; display:block; margin-bottom:4px;">Landlord Account Required to Publish</strong>
            <p style="font-size:0.875rem; color:var(--text-secondary); margin:0 0 12px; line-height:1.5;">
              Your landlord permit application must be approved by an administrator before you can publish properties.
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <a href="#/profile" class="button primary small">${icon("shield-check")} Open permit review</a>
              <a href="#/dashboard" class="button outline small">
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      `
          : ""
      }

      <form id="property-form" data-id="${e(p.id || "")}" data-current-video="${e(p.video || "")}">
        <!-- Section 1: Property Location & Identification -->
        <div class="property-form-card">
          <div class="property-section-title">
            ${icon("map-pin")} Property Location & Title
          </div>

          <label>Property Listing Title
            <input name="title" required maxlength="120" value="${e(p.title || "")}" placeholder="e.g. Green Haven Residences Centro">
            <small style="color:var(--text-muted); font-size:0.75rem; margin-top:4px; display:block;">Use a descriptive name tenants can easily search and identify.</small>
          </label>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:14px;">
            <label>Barangay (Tuguegarao & Peñablanca)
              <select name="barangay" id="property-barangay-select" required>
                <option value="">Select Barangay...</option>
                <optgroup label="Tuguegarao City">
                  ${TUGUEGARAO_BARANGAYS.map((b) => `<option value="${b}" ${p.barangay === b ? "selected" : ""}>${b}</option>`).join("")}
                </optgroup>
                <optgroup label="Peñablanca, Cagayan">
                  ${PENABLANCA_BARANGAYS.map((b) => `<option value="${b}" ${p.barangay === b ? "selected" : ""}>${b}</option>`).join("")}
                </optgroup>
              </select>
            </label>
            <label>Nearby School or Campus
              <input name="school" maxlength="120" value="${e(p.school || "")}" placeholder="e.g. USL, SPUP, CSU Carig, CSU Andrews">
            </label>
          </div>

          <label style="margin-top:14px;">Complete Street Address
            <input name="address" required maxlength="250" value="${e(p.address || "")}" placeholder="e.g. 45 Gomez St., Centro 02, Tuguegarao City">
          </label>

          <!-- Hidden Internal Coordinates (No visible Lat/Lng inputs) -->
          <input type="hidden" name="lat" id="property-lat" value="${p.lat ?? ""}">
          <input type="hidden" name="lng" id="property-lng" value="${p.lng ?? ""}">
          <input type="hidden" name="locationConfirmed" id="property-location-confirmed" value="${p.lat && p.lng ? "true" : "false"}">

          <!-- Advanced Interactive Property Location Map -->
          <div style="margin-top:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:0.875rem; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                ${icon("map-pin")} Interactive Property Location Pin
              </span>
              <span style="font-size:0.75rem; color:var(--text-muted);">
                Drag pin or search street/landmark
              </span>
            </div>
            <div id="property-map-picker-mount"></div>
          </div>
        </div>

        <!-- Section 2: Pricing & Move-in Terms -->
        <div class="property-form-card">
          <div class="property-section-title">
            ${icon("wallet")} Pricing & Move-in Terms
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:16px;">
            <label>Starting Monthly Rent (₱)
              <input name="minPrice" type="number" min="0" max="1000000" required value="${p.minPrice ?? ""}" placeholder="e.g. 2500">
            </label>
            <label>Security Deposit (₱)
              <input name="deposit" type="number" min="0" max="1000000" required value="${p.deposit ?? 0}" placeholder="e.g. 2500">
            </label>
            <label>Advance Payment (₱)
              <input name="advance" type="number" min="0" max="1000000" required value="${p.advance ?? 0}" placeholder="e.g. 2500">
            </label>
          </div>
        </div>

        <!-- Section 3: Room Types Offered -->
        <div class="property-form-card">
          <div class="property-section-title">
            ${icon("bed-single")} Room Types Offered (Select at least one)
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            ${TYPES.map((t) => `
              <label class="check-pill">
                <input type="checkbox" name="roomTypes" value="${t}" ${p.roomTypes?.includes(t) ? "checked" : ""}>
                <span>${t}</span>
              </label>
            `).join("")}
          </div>
          <small style="color:var(--text-muted); font-size:0.75rem; margin-top:8px; display:block;">Select every room format available in this boarding house or dormitory.</small>
        </div>

        <!-- Section 4: Description, Utilities & House Policies -->
        <div class="property-form-card">
          <div class="property-section-title">
            ${icon("file-text")} Description & House Policies
          </div>

          <label>Full Property Description
            <textarea name="description" required maxlength="4000" rows="4" placeholder="Detail the property layout, environment, proximity to universities, security, and living vibe...">${e(p.description || "")}</textarea>
          </label>

          <label style="margin-top:14px;">Utilities Policy (Water, Electricity, Internet)
            <textarea name="utilities" required maxlength="1000" rows="2" placeholder="e.g., Free Wi-Fi, water included in rent, electricity sub-metered per room...">${e(p.utilities || "")}</textarea>
          </label>

          <label style="margin-top:14px;">House Rules & Curfew
            <textarea name="rules" required maxlength="2000" rows="2" placeholder="e.g., 10:00 PM curfew, visitors allowed in lounge until 8:00 PM, strictly no smoking, quiet hours...">${e(p.rules || "")}</textarea>
          </label>
        </div>

        <!-- Section 5: Amenities -->
        <div class="property-form-card">
          <div class="property-section-title">
            ${icon("sparkles")} Available Amenities
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            ${AMENITIES.map((a) => `
              <label class="check-pill">
                <input type="checkbox" name="amenities" value="${a}" ${p.amenities?.includes(a) ? "checked" : ""}>
                <span>${a}</span>
              </label>
            `).join("")}
          </div>
        </div>

        <!-- Section 6: Pictures & Direct Video Tour (NO External YouTube Link) -->
        <div class="property-form-card">
          <div class="property-section-title">
            ${icon("camera")} Pictures & Video Walkthrough
          </div>

          <label>Upload Photos (Up to 8 JPEG, PNG, or WebP images)
            <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple style="margin-top:6px;">
            <small style="color:var(--text-muted); font-size:0.75rem; margin-top:4px; display:block;">Select boarding house photos (rooms, exterior, amenities) under 10 MB each.</small>
          </label>

          <div style="margin-top:18px; padding-top:16px; border-top:1px dashed var(--border);">
            <label>Direct Video Tour File Upload
              <input name="videoFile" type="file" accept="video/mp4,video/webm,video/quicktime" style="margin-top:6px;">
              <small style="color:var(--text-muted); font-size:0.75rem; margin-top:4px; display:block;">Upload a room video walkthrough (MP4, WebM, MOV under 40 MB). Handled directly and securely via Cloudinary.</small>
            </label>
          </div>

          ${
            (p.photos || []).length
              ? `
            <div style="margin-top:18px;">
              <span style="font-size:0.8125rem; font-weight:700; display:block; margin-bottom:10px; color:var(--text-main);">Current Photos:</span>
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                ${(p.photos || [])
                  .map(
                    (url) => `
                  <label style="display:inline-flex; align-items:center; gap:8px; background:var(--bg-subtle); padding:6px 10px; border-radius:var(--radius-md); border:1px solid var(--border); cursor:pointer;">
                    <img src="${e(url)}" style="width:54px; height:54px; object-fit:cover; border-radius:6px;" alt="Photo">
                    <input name="keepPhotos" type="checkbox" value="${e(url)}" checked>
                    <span style="font-size:0.8125rem; font-weight:600;">Keep</span>
                  </label>
                `,
                  )
                  .join("")}
              </div>
            </div>
            `
              : ""
          }

          ${
            p.video
              ? `
            <div style="margin-top:18px; padding:12px 16px; background:var(--bg-subtle); border-radius:var(--radius-md); border:1px solid var(--border); font-size:0.8125rem;">
              <strong>Current Video Tour:</strong>
              <div style="word-break:break-all; color:var(--text-secondary); margin-top:4px;">${e(p.video)}</div>
            </div>
          `
              : ""
          }
        </div>

        <div style="display:flex; gap:12px; align-items:center; justify-content:center; margin-top:16px;">
          <a href="#/properties" class="button outline large" style="min-width:140px;">
            Cancel
          </a>
          <button class="button primary large" type="submit" style="min-width:240px;" ${!isLandlord ? "disabled" : ""}>
            Save Property Listing ${icon("arrow-right")}
          </button>
        </div>
      </form>
    </div>
  `;
}

// Redesigned Room Management Page
async function roomsPage(id) {
  const p = await api.getProperty(id);
  const rooms = await api.listRooms(id);
  state.rooms = rooms;
  state.roomProperty = id;

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <div>
          <div class="overline">ROOM INVENTORY</div>
          <h2>${e(p.title)}</h2>
          <p>Total capacity: ${p.capacity} spaces · Available: ${p.available} spaces</p>
        </div>
        <button class="button primary" data-action="add-room">
          ${icon("plus")} Add Room
        </button>
      </div>

      <div style="display:grid; gap:14px;">
        ${
          rooms.length
            ? rooms
                .map(
                  (r) => `
              <div class="detail-section" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:0;">
                <div>
                  <strong>${e(r.name)}</strong>
                  <div style="font-size:0.875rem; color:var(--text-secondary); margin-top:2px;">
                    ${e(r.type)} · ${money(r.price)}/mo · ${r.available}/${r.capacity} available
                  </div>
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="button outline small" data-room="${r.id}">Edit</button>
                  <button class="button outline small" data-occupy="${r.id}" ${r.available === 0 ? "disabled" : ""}>-1 (Occupied)</button>
                  <button class="button outline small" data-vacate="${r.id}" ${r.available === r.capacity ? "disabled" : ""}>+1 (Vacant)</button>
                </div>
              </div>
            `,
                )
                .join("")
            : empty("No rooms created yet", "Add room categories and set availability.")
        }
      </div>
    </div>
  `;
}

function roomDialog(r = {}) {
  modal(`
    <form id="room-form" data-id="${e(r.id || "")}">
      <h2>${r.id ? "Edit Room" : "Add Room"}</h2>
      <label>Room name
        <input name="name" required maxlength="100" value="${e(r.name || "")}" placeholder="e.g. Room 201">
      </label>
      <label>Type
        <select name="type">${TYPES.map((t) => `<option ${t === r.type ? "selected" : ""}>${t}</option>`).join("")}</select>
      </label>
      <label>Monthly rent (₱)
        <input name="price" type="number" required min="0" max="1000000" value="${r.price ?? ""}">
      </label>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <label>Total capacity
          <input name="capacity" type="number" required min="1" max="100" value="${r.capacity ?? 1}">
        </label>
        <label>Available spaces
          <input name="available" type="number" required min="0" max="100" value="${r.available ?? 1}">
        </label>
      </div>
      <button class="button primary full" style="margin-top:16px;">Save Room</button>
    </form>
  `);
}

// Redesigned Admin Console
async function adminPage(tab = "users") {
  if (!api.isAdmin) return empty("Admin Access Required", "This area is restricted to platform administrators.");
  const allowed = ["users", "landlordApplications", "properties", "reports", "auditLogs"];
  if (!allowed.includes(tab)) tab = "users";
  const data = await api.adminList(tab);

  return `
    <div class="admin-shell">
      <div class="admin-header">
        <div class="admin-title-area">
          <div class="overline">PLATFORM GOVERNANCE</div>
          <h2>${icon("shield-check")} Administrator Console</h2>
          <p style="color:var(--text-secondary); font-size:0.875rem; margin-top:4px;">
            Supervise user identities, manage verified property owners, and resolve community safety inquiries.
          </p>
        </div>
      </div>

      <div class="notice">Showing up to 100 records per tab. Counts describe loaded records, not platform totals. Verify ownership evidence before granting an owner badge.</div>
      <!-- Admin Top KPI Dashboard -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:20px;">
        <div class="card" style="padding:16px; border-radius:var(--radius-md); display:flex; align-items:center; gap:14px;">
          <div style="width:44px; height:44px; border-radius:10px; background:rgba(37,99,235,0.1); color:var(--brand-primary); display:flex; align-items:center; justify-content:center;">
            ${icon("users")}
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">User Accounts (loaded)</div>
            <div style="font-size:1.375rem; font-weight:800; color:var(--text-main);">${tab === "users" ? data.length : "—"}</div>
          </div>
        </div>

        <div class="card" style="padding:16px; border-radius:var(--radius-md); display:flex; align-items:center; gap:14px;">
          <div style="width:44px; height:44px; border-radius:10px; background:rgba(16,185,129,0.1); color:var(--success); display:flex; align-items:center; justify-content:center;">
            ${icon("building-2")}
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Published listings loaded</div>
            <div style="font-size:1.375rem; font-weight:800; color:var(--text-main);">${state.properties?.length || 0}</div>
          </div>
        </div>

        <div class="card" style="padding:16px; border-radius:var(--radius-md); display:flex; align-items:center; gap:14px;">
          <div style="width:44px; height:44px; border-radius:10px; background:rgba(245,158,11,0.1); color:#d97706; display:flex; align-items:center; justify-content:center;">
            ${icon("badge-check")}
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Direct Landlord Listings</div>
            <div style="font-size:1.375rem; font-weight:800; color:var(--text-main);">Admin Review</div>
          </div>
        </div>

        <div class="card" style="padding:16px; border-radius:var(--radius-md); display:flex; align-items:center; gap:14px;">
          <div style="width:44px; height:44px; border-radius:10px; background:rgba(239,68,68,0.1); color:var(--danger); display:flex; align-items:center; justify-content:center;">
            ${icon("flag")}
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Safety Center</div>
            <div style="font-size:1.375rem; font-weight:800; color:var(--text-main);">${tab === "reports" ? data.length : "—"}</div>
          </div>
        </div>
      </div>

      <!-- Admin Tabs Navigation -->
      <div class="admin-tabs-nav">
        <a href="#/admin/users" class="admin-tab-link ${tab === "users" ? "active" : ""}">
          ${icon("users")} User Accounts
          <span class="admin-tab-count">${tab === "users" ? data.length : "•"}</span>
        </a>
        <a href="#/admin/landlordApplications" class="admin-tab-link ${tab === "landlordApplications" ? "active" : ""}">
          ${icon("badge-check")} Permit Reviews
          <span class="admin-tab-count">${tab === "landlordApplications" ? data.length : "•"}</span>
        </a>
        <a href="#/admin/properties" class="admin-tab-link ${tab === "properties" ? "active" : ""}">
          ${icon("building-2")} Property Listings
          <span class="admin-tab-count">${tab === "properties" ? data.length : "•"}</span>
        </a>
        <a href="#/admin/reports" class="admin-tab-link ${tab === "reports" ? "active" : ""}">
          ${icon("flag")} Safety Reports
          <span class="admin-tab-count">${tab === "reports" ? data.length : "•"}</span>
        </a>
        <a href="#/admin/auditLogs" class="admin-tab-link ${tab === "auditLogs" ? "active" : ""}">
          ${icon("file-text")} Audit Trail
          <span class="admin-tab-count">${tab === "auditLogs" ? data.length : "•"}</span>
        </a>
      </div>

      <!-- Tab Content: Users -->
      ${
        tab === "users"
          ? `
        <div class="admin-toolbar">
          <div class="admin-search-box">
            <span class="admin-search-icon">${icon("search")}</span>
            <input type="text" id="admin-user-search" class="admin-search-input" placeholder="Search user by name or ID...">
          </div>
          <div class="admin-filter-pills">
            <button type="button" class="admin-filter-chip active" data-user-filter="all">All (${data.length})</button>
            <button type="button" class="admin-filter-chip" data-user-filter="landlord">Landlords (${data.filter((u) => u.role === "landlord").length})</button>
            <button type="button" class="admin-filter-chip" data-user-filter="tenant">Tenants (${data.filter((u) => u.role !== "landlord").length})</button>
            <button type="button" class="admin-filter-chip" data-user-filter="verified">Verified Owners (${data.filter((u) => u.role === "landlord" && u.verified).length})</button>
            <button type="button" class="admin-filter-chip" data-user-filter="suspended">Suspended (${data.filter((u) => u.disabled).length})</button>
          </div>
        </div>

        <div id="admin-users-list">
          ${
            data.length
              ? data
                  .map((r) => {
                    const isSelf = r.id === api.currentUser?.uid;
                    const isLandlord = r.role === "landlord";
                    const initial = (r.name || "U")[0].toUpperCase();

                    return `
                <div class="admin-user-card ${r.disabled ? "is-suspended" : ""}" data-role="${e(r.role || "user")}" data-verified="${r.verified ? "true" : "false"}" data-disabled="${r.disabled ? "true" : "false"}">
                  <div class="admin-user-profile">
                    <div class="admin-avatar ${isLandlord ? "landlord" : "tenant"}">
                      ${r.photoURL ? `<img src="${e(r.photoURL)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="User">` : initial}
                    </div>
                    <div class="admin-user-details">
                      <div class="admin-user-name">
                        <span>${e(r.name || "Unnamed User")}</span>
                        ${isSelf ? `<span class="admin-badge badge-you">Current Admin (You)</span>` : ""}
                      </div>
                      <div class="admin-user-meta">
                        ${
                          isLandlord
                            ? `<span class="admin-badge badge-landlord">🏠 Landlord / Owner</span>`
                            : `<span class="admin-badge badge-tenant">👤 Tenant</span>`
                        }
                        ${
                          isLandlord
                            ? r.verified
                              ? `<span class="admin-badge badge-verified">${icon("shield-check")} Permit-Approved Owner</span>`
                              : `<span class="admin-badge badge-unverified">${icon("clock")} Unverified</span>`
                            : ""
                        }
                        ${
                          r.disabled
                            ? `<span class="admin-badge badge-suspended">${icon("ban")} Suspended</span>`
                            : `<span class="admin-badge badge-active">${icon("check")} Active</span>`
                        }
                        <span style="font-size:0.75rem; color:var(--text-muted);">UID: ${e(r.id.slice(0, 10))}...</span>
                      </div>
                    </div>
                  </div>

                  <div class="admin-actions-group">
                    ${
                      isLandlord && r.verified
                        ? `<button class="button outline small" style="color:var(--text-secondary);" data-verify="${r.id}:false" title="Revoke verified owner badge">
                            Revoke Badge
                          </button>`
                        : ""
                    }
                    ${
                      !isSelf
                        ? r.disabled
                          ? `<button class="button outline small btn-restore" data-suspend="${r.id}:false">
                              ${icon("check")} Restore
                            </button>`
                          : `<button class="button outline small btn-danger-outline" data-suspend="${r.id}:true">
                              ${icon("ban")} Suspend
                            </button>`
                        : ""
                    }
                  </div>
                </div>
              `;
                  })
                  .join("")
              : `<div class="detail-section"><p class="text-muted">No users found.</p></div>`
          }
        </div>
      `
          : ""
      }

      ${
        tab === "landlordApplications"
          ? `<div style="display:grid; gap:16px;">
              ${
                data.length
                  ? data.map((application) => `
                    <article class="detail-section" style="margin:0; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px;">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; margin-bottom:14px;">
                        <div>
                          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                            <h3 style="margin:0; font-size:1.15rem;">${e(application.legalName || "Unnamed applicant")}</h3>
                            <span class="badge ${application.status === "approved" ? "badge-success" : application.status === "rejected" ? "badge-warning" : "badge-outline"}">
                              ${e(String(application.status || "submitted").replaceAll("_", " "))}
                            </span>
                          </div>
                          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                            Applicant UID: ${e(application.userId)}
                          </div>
                        </div>

                        <div class="admin-actions-group" style="display:flex; gap:8px; flex-wrap:wrap;">
                          ${
                            application.status !== "rejected"
                              ? `<button class="button outline small btn-danger-outline" data-review-landlord="${e(application.id)}:rejected" style="color:var(--danger); border-color:rgba(239,68,68,0.3);">
                                  ${icon("ban")} Decline (Mismatch)
                                </button>`
                              : ""
                          }
                          <button class="button outline small" data-review-landlord="${e(application.id)}:changes_requested">
                            Request Corrections
                          </button>
                          ${
                            application.status !== "approved"
                              ? `<button class="button primary small" data-review-landlord="${e(application.id)}:approved">
                                  ${icon("shield-check")} Approve (Details Match)
                                </button>`
                              : ""
                          }
                        </div>
                      </div>

                      <!-- Document Match Inspection Grid -->
                      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px; padding-top:16px; border-top:1px solid var(--border-light);">
                        <div style="background:var(--bg-surface); padding:14px; border:1px solid var(--border-light); border-radius:var(--radius-md);">
                          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); margin-bottom:10px;">
                            1. Submitted Permit Details
                          </div>
                          <div style="display:flex; flex-direction:column; gap:8px; font-size:0.875rem;">
                            <div><span style="color:var(--text-secondary);">Legal Owner:</span> <strong>${e(application.legalName)}</strong></div>
                            <div><span style="color:var(--text-secondary);">Property Address:</span> <strong>${e(application.propertyAddress)}</strong></div>
                            <div><span style="color:var(--text-secondary);">Mayor's / Business Permit #:</span> <strong>${e(application.businessPermitNumber)}</strong> (exp: ${e(application.businessPermitExpires)})</div>
                            <div><span style="color:var(--text-secondary);">Barangay Clearance #:</span> <strong>${e(application.barangayClearanceNumber)}</strong> (exp: ${e(application.barangayClearanceExpires)})</div>
                            <div><span style="color:var(--text-secondary);">Fire Safety Certificate #:</span> <strong>${e(application.fireSafetyNumber)}</strong> (exp: ${e(application.fireSafetyExpires)})</div>
                            <div><span style="color:var(--text-secondary);">Ownership Reference:</span> <strong>${e(application.proofOfOwnershipRef)}</strong></div>
                          </div>
                        </div>

                        <div style="background:var(--bg-surface); padding:14px; border:1px solid var(--border-light); border-radius:var(--radius-md);">
                          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                            <span>2. Uploaded Mayor's Permit Document</span>
                            ${application.mayorsPermitUrl ? `<span class="badge badge-success" style="font-size:0.7rem;">Document Attached</span>` : ""}
                          </div>
                          ${
                            application.mayorsPermitUrl
                              ? `
                            <div style="display:flex; flex-direction:column; gap:10px;">
                              <a href="${e(application.mayorsPermitUrl)}" target="_blank" rel="noopener noreferrer" title="Click to view full size" style="display:block; max-height:220px; overflow:hidden; border-radius:var(--radius-sm); border:1px solid var(--border); background:#0f172a; text-align:center;">
                                <img src="${e(application.mayorsPermitUrl)}" alt="Mayor's Permit Document" style="width:100%; height:auto; max-height:220px; object-fit:contain; margin:0 auto;" />
                              </a>
                              <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.75rem; color:var(--text-muted);">Verify permit number, business name & seal match</span>
                                <a href="${e(application.mayorsPermitUrl)}" target="_blank" rel="noopener noreferrer" class="button outline small" style="padding:4px 10px; font-size:0.75rem;">
                                  ${icon("external-link")} View Full Size
                                </a>
                              </div>
                            </div>
                          `
                              : `
                            <div style="background:rgba(239,68,68,0.06); border:1px dashed rgba(239,68,68,0.4); border-radius:var(--radius-md); padding:24px 16px; text-align:center; color:var(--danger); font-size:0.875rem;">
                              <div style="font-size:1.5rem; margin-bottom:6px;">${icon("alert-circle")}</div>
                              <strong>No Mayor's Permit uploaded</strong>
                              <p style="margin:4px 0 0; font-size:0.75rem; color:var(--text-secondary);">Decline or request document upload from applicant.</p>
                            </div>
                          `
                          }
                        </div>
                      </div>

                      ${application.missingItems?.length ? `<div class="notice warning" style="margin-top:12px;">Missing: ${application.missingItems.map((item) => e(item)).join(", ")} ${e(application.reviewNotes || "")}</div>` : ""}
                      ${application.reviewNotes && application.status === "rejected" ? `<div class="notice danger" style="margin-top:12px; background:rgba(239,68,68,0.08); color:var(--danger); border:1px solid rgba(239,68,68,0.3); padding:10px 14px; border-radius:var(--radius-md);"><strong>Decline Reason:</strong> ${e(application.reviewNotes)}</div>` : ""}
                    </article>`).join("")
                  : `<div class="detail-section"><p class="text-muted">No landlord permit applications submitted.</p></div>`
              }
            </div>`
          : ""
      }

      <!-- Tab Content: Properties -->
      ${
        tab === "properties"
          ? `
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${
            data.length
              ? data
                  .map((p) => {
                    const thumb = p.photos?.[0] || "";
                    const isPublished = p.status === "published";
                    const isPending = p.status === "pending" || !p.status;
                    const isRejected = p.status === "rejected";

                    return `
                <div class="admin-prop-card">
                  ${
                    thumb
                      ? `<img src="${e(thumb)}" class="admin-prop-thumb" alt="${e(p.title)}">`
                      : `<div class="admin-prop-thumb">${icon("building-2")}</div>`
                  }
                  <div>
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                      <strong>${e(p.title)}</strong>
                      ${
                        isPublished
                          ? `<span class="admin-badge badge-verified">${icon("check")} Published</span>`
                          : isPending
                            ? `<span class="admin-badge badge-unverified">${icon("clock")} Pending Approval</span>`
                            : `<span class="admin-badge badge-suspended">${icon("ban")} Rejected</span>`
                      }
                    </div>
                    <div style="font-size:0.8125rem; color:var(--text-secondary);">
                      Owner: <strong>${e(p.ownerName || "Unknown")}</strong> · ${e(p.barangay || "Tuguegarao")} · ₱${Number(p.minPrice || 0).toLocaleString()}/month · ${p.available ?? 0} vacancy
                    </div>
                  </div>
                  <div class="admin-actions-group">
                    <a href="#/property/${e(p.id)}" target="_blank" class="button outline small">
                      ${icon("external-link")} Preview
                    </a>
                    ${
                      !isPublished
                        ? `<button class="button small btn-verify-success" data-moderate="properties:${p.id}:published">
                            ${icon("check")} Approve
                          </button>`
                        : ""
                    }
                    ${
                      !isRejected
                        ? `<button class="button outline small btn-danger-outline" data-moderate="properties:${p.id}:rejected">
                            ${icon("x")} Reject
                          </button>`
                        : ""
                    }
                  </div>
                </div>
              `;
                  })
                  .join("")
              : `<div class="detail-section"><p class="text-muted">No properties submitted yet.</p></div>`
          }
        </div>
      `
          : ""
      }

      <!-- Tab Content: Reports -->
      ${
        tab === "reports"
          ? `
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${
            data.length
              ? data
                  .map((rep) => `
                <div class="admin-prop-card" style="grid-template-columns:1fr auto;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                      <span class="admin-badge badge-suspended">${icon("flag")} Report</span>
                      <strong>Property ID: ${e(rep.propertyId || rep.targetId || rep.id)}</strong>
                      <span class="admin-badge ${rep.status === "resolved" ? "badge-active" : "badge-unverified"}">${e(rep.status || "open")}</span>
                    </div>
                    <p style="font-size:0.875rem; color:var(--text-secondary); margin:4px 0;">
                      ${e(rep.reason || "No reason specified.")}
                    </p>
                    <div style="font-size:0.75rem; color:var(--text-muted);">
                      Reporter UID: ${e(rep.userId || "anonymous")}
                    </div>
                  </div>
                  <div class="admin-actions-group">
                    <a href="#/property/${e(rep.propertyId || rep.targetId)}" target="_blank" class="button outline small">
                      View Listing
                    </a>
                    ${
                      rep.status !== "resolved"
                        ? `<button class="button primary small" data-moderate="reports:${rep.id}:resolved">
                            ${icon("check")} Mark Resolved
                          </button>`
                        : ""
                    }
                  </div>
                </div>
              `)
                  .join("")
              : `<div class="detail-section"><p class="text-muted">No reports on file. The community is safe!</p></div>`
          }
        </div>
      `
          : ""
      }

      <!-- Tab Content: Audit Logs -->
      ${
        tab === "auditLogs"
          ? `
        <div class="detail-section">
          ${
            data.length
              ? data
                  .map((log) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-light); font-size:0.8125rem;">
                  <div>
                    <strong>${e(log.collection || "resource")}:${e(log.targetId || "")}</strong>
                    <div style="color:var(--text-secondary);">
                      Action: ${e(JSON.stringify(log.changes || {}))}
                    </div>
                  </div>
                  <div style="color:var(--text-muted); text-align:right;">
                    Actor: ${e((log.actorId || "").slice(0, 8))}...
                  </div>
                </div>
              `)
                  .join("")
              : `<p class="text-muted">No audit logs recorded yet.</p>`
          }
        </div>
      `
          : ""
      }
    </div>
  `;
}

// Redesigned About Page
function about() {
  return `
    <div style="max-width:800px; margin:40px auto; padding:0 24px;">
      <div class="overline">OUR MISSION</div>
      <h1>Built around belonging.</h1>
      <p style="font-size:1.125rem; margin:14px 0 32px;">
        DormPath connects tenants with verified local property owners in Tuguegarao City without middleman fees.
      </p>

      <div class="detail-section">
        <h3>Our Promise to Tenants</h3>
        <p>Browse without an account. Join free to save places, message owners, and post room requests. No tenant subscriptions, platform booking markups, or messaging charges.</p>
        <h3 style="margin-top:20px;">Verified Owners & Accurate Vacancies</h3>
        <p>Owner badges are granted after manual identity review. Vacancies carry timestamps so you always know when availability was last updated.</p>
      </div>
    </div>
  `;
}

// Republic Act No. 10173 Compliant Data Privacy Policy
function privacyPage() {
  return `
    <div class="legal-modal-inner">
      <div class="policy-badge">${icon("shield-check")} Data Privacy Notice (RA 10173)</div>
      <h2 style="font-size:1.625rem; font-weight:800; margin:10px 0 4px; color:var(--text-main);">Privacy Policy</h2>
      <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:20px;">
        Last updated: 17 October 2026 · Transparent information protection for DormPath tenants and landlords in Tuguegarao City.
      </p>

      <div class="legal-cards-grid">
        <div class="legal-card">
          <div class="legal-card-header">
            <span class="legal-card-icon">${icon("user-round")}</span>
            <strong>Accounts & Housing Activity</strong>
          </div>
          <p>
            Firebase Authentication handles your email/password or Google sign-in. DormPath stores your display name, role, saved listings, requests, encrypted messages, and moderation reports in Cloud Firestore. Published property addresses, photos, and approximate barangay coordinates are publicly visible to help tenants discover rooms.
          </p>
        </div>

        <div class="legal-card">
          <div class="legal-card-header">
            <span class="legal-card-icon">${icon("shield")}</span>
            <strong>Trusted Service Providers</strong>
          </div>
          <p>
            Firebase provides database and authentication. Netlify securely hosts the website and serverless upload function. Cloudinary stores optimized room photographs. Google reCAPTCHA protects against automated bots. OpenFreeMap and OpenStreetMap deliver 3D maps without personal location tracking.
          </p>
        </div>

        <div class="legal-card">
          <div class="legal-card-header">
            <span class="legal-card-icon">${icon("hard-drive")}</span>
            <strong>Device Storage & Offline Privacy</strong>
          </div>
          <p>
            "Remember me" securely preserves your login session token. Your password is never stored by DormPath. Offline message synchronization is optional; clear local cache anytime from your Profile Settings.
          </p>
        </div>

        <div class="legal-card">
          <div class="legal-card-header">
            <span class="legal-card-icon">${icon("message-square-plus")}</span>
            <strong>Direct Communication & Verification Safety</strong>
          </div>
          <p>
            Direct messages are restricted strictly to conversation participants. Administrators supervise safety reports and community standards. Never upload government IDs or banking credentials in public listing photos.
          </p>
        </div>

        <div class="legal-card">
          <div class="legal-card-header">
            <span class="legal-card-icon">${icon("badge-check")}</span>
            <strong>Your Rights & Control</strong>
          </div>
          <p>
            Under Philippine RA 10173, you retain rights to view, update, export, or request deletion of your account records. You can sign out or clear offline storage directly from the platform.
          </p>
        </div>
      </div>
    </div>
  `;
}

function termsPage() {
  return `
    <div class="legal-modal-inner">
      <div class="policy-badge">${icon("heart-handshake")} Community Trust & Standards</div>
      <h2 style="font-size:1.625rem; font-weight:800; margin:10px 0 4px; color:var(--text-main);">Terms of Service</h2>
      <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:20px;">
        Fair, honest, and respectful housing for Tuguegarao City tenants and property owners.
      </p>

      <div class="legal-cards-grid">
        <div class="legal-card">
          <div class="legal-card-header">
            <span class="legal-card-icon">${icon("house")}</span>
            <strong>1. The DormPath Community Standard</strong>
          </div>
          <p>
            DormPath was created to make finding a home near Cagayan State University (Carig & Andrews), University of Saint Louis, St. Paul University Philippines, and other local schools safe, transparent, and respectful. All users must maintain courteous and professional conduct.
          </p>
        </div>

        <div class="legal-card">
          <div class="legal-card-header">
            <span class="legal-card-icon">${icon("badge-check")}</span>
            <strong>2. Honest Vacancy & Pricing Policy for Landlords</strong>
          </div>
          <p>
            Property owners must accurately report vacancy counts, disclose exact monthly rates and deposit terms without hidden platform fees, and specify utility policies (Wi-Fi, water, electricity sub-meters). Fake photos or misleading room details are prohibited.
          </p>
        </div>

        <div class="legal-card">
          <div class="legal-card-header">
            <span class="legal-card-icon">${icon("sparkles")}</span>
            <strong>3. 100% Free for Tenants</strong>
          </div>
          <p>
            Tenants browse, explore 3D maps, save listings, and message landlords completely free of charge. DormPath charges zero reservation fees, commissions, or messaging charges.
          </p>
        </div>

        <div class="legal-card">
          <div class="legal-card-header">
            <span class="legal-card-icon">${icon("shield-check")}</span>
            <strong>4. Tenant Safety & Landlord Accountability</strong>
          </div>
          <p>
            DormPath enforces a strict zero-tolerance policy against rude, abusive, disrespectful, or deceptive behavior. Tenants can immediately file safety reports from chat, listing pages, or their dashboard for prompt administrator review and landlord suspension.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Dedicated DOMI Housing Assistant (Fullscreen with 3D Companion)
function domiPage() {
  const messagesHtml = (state.domiHistory || [])
    .map((m) => {
      const isUser = m.role === "user";
      return `
        <div class="domi-msg ${isUser ? "user" : "domi"}">
          ${
            !isUser
              ? `<div class="domi-msg-avatar"><img src="/domi.png" alt="DOMI" /></div>`
              : ""
          }
          <div class="domi-msg-bubble">
            <div class="domi-msg-text">${e(m.text)}</div>
            <span class="domi-msg-time">${e(m.time)}</span>
          </div>
          ${
            isUser
              ? `<div class="domi-msg-avatar user-avatar">${(api.profile?.name || "U")[0].toUpperCase()}</div>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  return `
    <div class="domi-fullscreen-shell">
      <!-- Left: Chat conversation stream -->
      <div class="domi-chat-pane">
        <header class="domi-chat-topbar">
          <div class="domi-brand-row">
            <div class="brand-mascot-badge">
              <img src="/domi.png" alt="DOMI Mascot" class="brand-mascot-img" />
            </div>
            <div>
              <h2 style="font-size:1.125rem; font-weight:800; color:var(--text-main); margin:0;">DOMI Housing Assistant</h2>
              <span style="font-size:0.75rem; color:var(--success); font-weight:600; display:flex; align-items:center; gap:4px;">
                <span style="width:6px; height:6px; border-radius:50%; background:var(--success); display:inline-block;"></span>
                Room search help, budgets, and message drafts
              </span>
            </div>
          </div>
          <button class="button outline small" data-action="fullscreen">Full screen</button><button class="button outline small" data-action="clear-domi" title="Reset chat history">
            ${icon("trash-2")} Reset
          </button>
        </header>

        <div class="domi-prompt-chips">
          <button class="domi-chip" data-ask="Find rooms under ₱3,000">💰 Under ₱3,000</button>
          <button class="domi-chip" data-ask="Dorms near CSU Carig">🎓 Near CSU Carig</button>
          <button class="domi-chip" data-ask="Boarding houses near USL and SPUP">📍 Near USL / SPUP</button>
          <button class="domi-chip" data-ask="Places with Wi-Fi and air conditioning">📶 Wi-Fi & AC</button>
          <button class="domi-chip" data-ask="What are typical deposit and advance rates?">📋 Deposit & Advance</button>
          <button class="domi-chip" data-ask="Draft a polite inquiry message to a landlord">✉️ Draft Message</button>
          <button class="domi-chip" data-ask="How to avoid housing scams in Tuguegarao?">🛡️ Anti-Scam Tips</button>
        </div>

        <div id="domi-chat-stream" class="domi-chat-messages">
          ${messagesHtml}
        </div>

        <form id="domi-chat-form" class="domi-composer">
          <input
            name="question"
            id="domi-chat-input"
            placeholder="Ask DOMI anything about rooms, budgets, or areas in Tuguegarao..."
            required
            maxlength="1000"
            autocomplete="off"
          />
          <button class="button primary" type="submit" aria-label="Send question">
            ${icon("send")} <span>Send</span>
          </button>
        </form>
      </div>

    </div>
  `;
}

function modal(content) {
  const m = $("#modal");
  if (!m) return;
  m.innerHTML = `
    <div class="modal-box">
      <button class="modal-close-btn" data-action="close-modal" aria-label="Close dialog">
        ${icon("x")}
      </button>
      ${content}
    </div>
  `;
  m.showModal();
  refreshIcons();
}

async function loadListings(more = false) {
  try {
    const res = await api.publicProperties(more ? state.cursor : null);
    state.properties = more ? [...state.properties, ...res.items] : res.items;
    state.cursor = res.cursor;
    state.more = res.more;
    state.loaded = true;
    state.syncedAt = Date.now();
  } catch (e) {
    state.loaded = true;
    state.error = e.message;
  }
}

/* ==============================================================================
   ROUTER & MAIN APPLICATION BOOTSTRAP
   ============================================================================== */
async function route() {
  const version = ++routeVersion;
  startLoading();
  unsubscribe();
  unsubscribe = () => {};
  for (const key of ["mapInstance", "domiMapInstance", "map2dInstance"]) {
    state[key]?.remove();
    state[key] = null;
  }

  if (map) {
    map.remove();
    map = null;
  }

  const cleanHash = location.hash.replace(/^#\/?/, "").trim();
  const segments = cleanHash ? cleanHash.split("/") : [];
  const page = segments[0] || "home";
  const id = segments[1] || "";

  // Determine Layout Structure & Page Types
  const isAuth = ["login", "register", "reset-password"].includes(page);
  const isPublic = [
    "home",
    "about",
    "search",
    "map",
    "property",
    "domi",
    "privacy",
    "terms",
  ].includes(page);
  const isProtected = [
    "dashboard",
    "favorites",
    "properties",
    "add-property",
    "edit-property",
    "rooms",
    "messages",
    "profile",
    "admin",
    "notifications",
  ].includes(page);

  // If user is not signed in and tries to access a protected workspace page
  if (isProtected && !api.currentUser) {
    location.hash = "/login";
    toast("Please sign in or create an account to access that page.");
    return;
  }

  // If user is already signed in and accesses login/register, send to dashboard
  if (isAuth && api.currentUser) {
    location.hash = "/dashboard";
    return;
  }

  let innerHTML = "";
  const isAsyncRoute = [
    "dashboard",
    "properties",
    "rooms",
    "messages",
    "favorites",
    "admin",
    "property",
    "notifications",
    "profile",
    "add-property",
    "edit-property",
  ].includes(page) || (page === "map" && api.configured && navigator.onLine);

  const existingMain = $("#main");
  if (existingMain && isAsyncRoute) {
    existingMain.innerHTML = `<div class="domi-route-loader-stage" style="min-height:55vh; display:flex; align-items:center; justify-content:center;">${domiLoaderHtml("page")}</div>`;
  }

  let routeTimeoutId = setTimeout(() => {
    if (version === routeVersion && !innerHTML) {
      console.warn(`Route ${page} timed out`);
      stopLoading();
      forceStopAllLoading();
      const target = $("#main") || $("#app");
      if (target) {
        target.innerHTML = `
          <div style="min-height:55vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px 16px; text-align:center;">
            <div class="brand-mascot-badge" style="width:72px; height:72px; margin-bottom:16px;">
              <img src="/domi.png" alt="DOMI" class="brand-mascot-img" />
            </div>
            <h3 style="margin:0 0 8px; font-size:1.25rem; font-weight:700; color:var(--text-main);">Loading took longer than expected</h3>
            <p style="color:var(--text-secondary); max-width:380px; margin-bottom:20px; font-size:0.875rem;">
              The network is taking longer to respond. Tap retry to load this page again.
            </p>
            <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
              <button class="button primary" data-action="retry">Try Again</button>
              <a href="#/home" class="button outline">Back to Home</a>
            </div>
          </div>
        `;
        refreshIcons();
      }
    }
  }, 12000);

  try {
    switch (page) {
      case "home":
        innerHTML = home();
        break;
      case "search":
      case "map":
        if (page === "map" && api.configured && navigator.onLine) {
          state.properties = await allPublishedListings(api.publicProperties);
          state.more = false;
        }
        innerHTML = searchPage(page === "map");
        break;
      case "login":
      case "register":
        innerHTML = authPage(page === "register");
        break;
      case "property":
        innerHTML = await details(id);
        break;
      case "favorites":
        innerHTML = await favoritesPage();
        break;
      case "wanted":
        location.hash = "/search";
        return;
      case "dashboard":
        innerHTML = await dashboard();
        break;
      case "properties":
        innerHTML = await propertiesPage();
        break;
      case "add-property":
      case "edit-property":
        innerHTML = propertyForm(id ? await api.getProperty(id) : {});
        break;
      case "rooms":
        innerHTML = await roomsPage(id);
        break;
      case "messages":
        innerHTML = await messagesPage(id);
        break;
      case "profile":
        innerHTML = await profilePage();
        break;
      case "admin":
        innerHTML = await adminPage(id);
        break;
      case "notifications": {
        const items = await api.notifications();
        innerHTML = `
          <div>
            <h2>Notifications</h2>
            <div class="detail-section" style="margin-top:20px;">
              ${
                items.length
                  ? items
                      .map((n) => `<div style="padding:10px 0; border-bottom:1px solid var(--border-light);">${icon("bell")} ${e(n.title)}</div>`)
                      .join("")
                  : `<p class="text-muted">No unread notifications.</p>`
              }
            </div>
          </div>
        `;
        break;
      }
      case "about":
        innerHTML = about();
        break;
      case "privacy":
        innerHTML = privacyPage();
        break;
      case "terms":
        innerHTML = termsPage();
        break;
      case "domi":
        innerHTML = domiPage();
        break;
      default:
        innerHTML = empty("Page not found", "Let's head back home.", `<a href="#/home" class="button primary">Back Home</a>`);
    }

    if (version !== routeVersion) return;

    // Render into appropriate Shell
    if (isAuth) {
      $("#app").innerHTML = authLayout(innerHTML);
    } else if (["home", "about", "privacy", "terms"].includes(page) || (isPublic && !api.currentUser)) {
      $("#app").innerHTML = publicLayout(innerHTML);
    } else {
      $("#app").innerHTML = appLayout(innerHTML);
    }

    document.body.dataset.page = page;
    refreshIcons();
    stopLoading();

    if (page === "domi") {
      const stream = $("#domi-chat-stream");
      if (stream) stream.scrollTop = stream.scrollHeight;
      $("#domi-chat-input")?.focus();

    }

    if (page === "map") {
      try { await mountMap(); } catch { await mountMapFallback($("#map")); }
    }

    if (page === "property" && state.currentProperty) {
      const p = state.currentProperty;
      const coords = getPropertyCoordinates(p);
      const mapContainer = $("#property-detail-map");
      if (mapContainer && coords) {
        const lat = coords[1];
        const lng = coords[0];
        try {
          const detailMap = L.map(mapContainer, {
            center: [lat, lng],
            zoom: 16,
            zoomControl: false,
            scrollWheelZoom: false,
          });
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(detailMap);

          const markerIcon = L.divIcon({
            className: "pmp-marker-wrapper",
            html: `
              <div class="pmp-marker-container">
                <div class="pmp-marker-pulse"></div>
                <div class="pmp-marker-badge" style="background:#2855e8; color:white;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div class="pmp-marker-tip" style="border-top-color:#2855e8;"></div>
              </div>
            `,
            iconSize: [44, 52],
            iconAnchor: [22, 50],
            popupAnchor: [0, -48]
          });

          const m = L.marker([lat, lng], { icon: markerIcon }).addTo(detailMap);
          m.bindPopup(`<div style="font-family:var(--font-sans);"><strong style="font-size:0.875rem;">${e(p.title)}</strong><div style="font-size:0.75rem; color:#64748b; margin-top:2px;">${e(p.address)}</div><div style="margin-top:6px;"><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving" target="_blank" rel="noopener noreferrer" style="color:#2855e8; font-weight:700; font-size:0.75rem;">Get Directions ↗</a></div></div>`).openPopup();
          setTimeout(() => detailMap.invalidateSize(), 250);
          setTimeout(() => detailMap.invalidateSize(), 800);
        } catch (e) {
          console.warn("Detail map initialization warning:", e);
        }
      }
    }

    if (page === "add-property" || page === "edit-property") {
      const pickerMount = $("#property-map-picker-mount");
      if (pickerMount) {
        const form = $("#property-form");
        const latInput = $("#property-lat");
        const lngInput = $("#property-lng");
        const confirmedInput = $("#property-location-confirmed");
        const barangaySelect = $("#property-barangay-select");
        const addressInput = form?.querySelector('input[name="address"]');

        state.propertyPicker = mountPropertyMapPicker(pickerMount, {
          initialLat: latInput?.value ? Number(latInput.value) : null,
          initialLng: lngInput?.value ? Number(lngInput.value) : null,
          initialBarangay: barangaySelect?.value || "",
          initialAddress: addressInput?.value || "",
          onLocationConfirmed: ({ lat, lng, address, barangay }) => {
            if (latInput) latInput.value = lat;
            if (lngInput) lngInput.value = lng;
            if (confirmedInput) confirmedInput.value = "true";
            if (barangaySelect && barangay && (!barangaySelect.value || barangaySelect.value === "Select Barangay...")) {
              barangaySelect.value = barangay;
            }
            if (addressInput && !addressInput.value && address) {
              addressInput.value = address;
            }
          },
          notify: toast
        });
      }
    }

    // Messages listeners setup
    if (page === "messages" && state.chat) {
      const stopMessages = api.watchMessages(
        id,
        (items) => renderMessages(items),
        (err) => toast(err.message),
      );
      api
        .viewings(id)
        .then((vList) => {
          const vBox = $("#viewings");
          if (vBox && vList?.length) {
            vBox.innerHTML = vList
              .map(
                (v) => `
              <div style="background:var(--bg-subtle); border:1px solid var(--border-light); padding:10px 16px; border-radius:var(--radius-sm); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div>
                  <span class="badge ${v.status === "confirmed" ? "badge-success" : "badge-warning"}">${e(v.status)}</span>
                  <span style="font-size:0.875rem; margin-left:8px;">Ocular Inspection: <strong>${e(v.date)}</strong></span>
                </div>
                ${
                  v.status === "requested" && v.ownerId === api.currentUser?.uid
                    ? `<button class="button primary small" data-confirm-viewing="${v.id}">Accept & Confirm</button>`
                    : ""
                }
              </div>
            `,
              )
              .join("");
          }
        })
        .catch(() => {});
      unsubscribe = () => stopMessages();
    }
    clearTimeout(routeTimeoutId);
  } catch (err) {
    clearTimeout(routeTimeoutId);
    stopLoading();
    if (version === routeVersion) {
      if (err.message?.includes("sign in")) {
        location.hash = "/login";
        toast("Please log in to continue.");
        return;
      }
      const target = $("#main") || $("#app");
      if (target) {
        target.innerHTML = `<div style="padding:40px; text-align:center;">${empty("Error loading page", e(err.message), button("Try Again", "retry") + `<a class="button outline" href="#/home">Back to home</a>`)}</div>`;
        refreshIcons();
      }
    }
  } finally {
    clearTimeout(routeTimeoutId);
  }
}

const FAST_OSM_STYLE = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

let currentMapPopup = null;
let activeMarkerEl = null;

function attachMapStatus(instance, container) {
  const notice = document.createElement("div");
  notice.className = "map-unavailable";
  notice.setAttribute("role", "status");
  notice.textContent = "Loading map tiles…";
  container.append(notice);
  const timeout = setTimeout(() => { notice.textContent = "Map tiles are taking longer than expected. Check your connection or use Explore Rooms."; }, 12000);
  instance.on("load", () => { clearTimeout(timeout); notice.remove(); const label = $("#domi-3d-status-text"); if (label) label.textContent = "Map loaded · pins use saved coordinates"; });
  instance.on("error", () => { notice.textContent = "Some map tiles could not load. Check your connection or use Explore Rooms."; if (!notice.isConnected) container.append(notice); });
  instance.on("remove", () => clearTimeout(timeout));
}

async function mountMapFallback(container) {
  if (!container?.isConnected) return;
  const { mountRasterMap } = await import("./map2d");
  if (!container.isConnected) return;
  state.map2dInstance = mountRasterMap(container, {
    items: filterProperties(state.properties, state.filters), coordinates: getPropertyCoordinates, escape: e, notify: toast,
    onFilter: type => { state.filters.type = type; route(); },
    onVacant: () => { state.filters.vacant = !state.filters.vacant; route(); },
  });
  const label = $("#domi-3d-status-text");
  if (label) label.textContent = "Map explorer · 2D view";
}

function addBuildingLayer(map) {
  const label = map.getStyle().layers.find(layer => layer.type === "symbol" && layer.layout?.["text-field"]);
  map.addSource("dormpath-buildings", { type: "vector", url: "https://tiles.openfreemap.org/planet" });
  map.addLayer({ id: "dormpath-buildings-3d", type: "fill-extrusion", source: "dormpath-buildings", "source-layer": "building", minzoom: 14,
    filter: ["!=", ["get", "hide_3d"], true],
    paint: { "fill-extrusion-color": "#c1cbdc", "fill-extrusion-height": ["coalesce", ["get", "render_height"], 0], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": 0.85 }
  }, label?.id);
}

async function mountMap() {
  const mapContainer = $("#map");
  if (!mapContainer) return;

  // Clean up previous MapLibre instance to prevent WebGL context leaks
  if (state.mapInstance) {
    try {
      state.mapInstance.remove();
    } catch (e) {
      console.warn("Map disposal error", e);
    }
    state.mapInstance = null;
  }

  const { Map: MapLibreMap, Marker: MapLibreMarker, Popup: MapLibrePopup } = getMapLibre();
  if (!MapLibreMap) {
    return mountMapFallback(mapContainer);
  }

  // Initialize MapLibre GL 3D Map with instant OSM tiles
  const map = new MapLibreMap({
    container: "map",
    style: "https://tiles.openfreemap.org/styles/bright",
    center: TUGUEGARAO_CENTER,
    zoom: 14.5,
    pitch: 0, // Clean 2D top-down map view
    bearing: 0,
    canvasContextAttributes: { antialias: true },
  });

  state.mapInstance = map;
  attachMapStatus(map, mapContainer);

  map.on("load", () => {
    addBuildingLayer(map);
    map.resize();
  });
  setTimeout(() => map.resize(), 50);
  setTimeout(() => map.resize(), 200);
  setTimeout(() => map.resize(), 500);

  // Collect properties filtered by active criteria
  const items = filterProperties(state.properties, state.filters);
  const markers = new Map();

  items.forEach((p) => {
    const coords = getPropertyCoordinates(p);
    if (!coords) return;

    // Create Apple Maps / Airbnb style price pill element
    const el = document.createElement("div");
    el.className = "map3d-marker";
    el.dataset.propertyId = p.id;
    el.innerHTML = `
      <div class="map3d-pill">
        <span class="map3d-currency">₱</span>${Number(p.minPrice || 0).toLocaleString()}
        <span class="map3d-dot" style="background:${p.available > 0 ? "#10b981" : "#94a3b8"};"></span>
      </div>
      <div class="map3d-arrow"></div>
    `;

    const popupHTML = `
      <div class="map3d-popup-card">
        <img src="${e(p.photos?.[0] || "/domi.png")}" class="map3d-popup-thumb" alt="${e(p.title)}" onerror="this.onerror=null;this.src='/domi.png'">
        <div class="map3d-popup-body">
          <span class="badge ${p.available > 0 ? "badge-success" : "badge-subtle"}" style="align-self:flex-start; font-size:0.6875rem;">
            ${p.available > 0 ? `${p.available} space(s) available` : "Fully occupied"}
          </span>
          <div class="map3d-popup-title">${e(p.title)}</div>
          <div class="map3d-popup-location">${icon("map-pin")} ${e(p.barangay || p.location || "Tuguegarao City")}</div>
          <div class="map3d-popup-footer">
            <div>
              <div style="font-size:0.6875rem; color:var(--text-muted);">Monthly Rent</div>
              <div class="map3d-popup-price">₱${Number(p.minPrice || 0).toLocaleString()}<span style="font-size:0.6875rem; font-weight:500; color:var(--text-secondary);">/mo</span></div>
            </div>
            <a href="#/property/${p.id}" class="button primary small" style="padding:6px 12px; font-size:0.75rem;">
              View Details ${icon("arrow-right")}
            </a>
          </div>
        </div>
      </div>
    `;

    const popup = new MapLibrePopup({
      offset: 36,
      closeButton: true,
      closeOnClick: false,
      maxWidth: "300px",
    }).setHTML(popupHTML);

    const marker = new MapLibreMarker({ element: el, anchor: "bottom" })
      .setLngLat(coords)
      .setPopup(popup)
      .addTo(map);

    markers.set(p.id, { marker, popup, coords, element: el });

    el.addEventListener("click", () => {
      focusPropertyOnMap(p.id);
    });
  });

  if (markers.size) {
    const bounds = new maplibregl.LngLatBounds();
    markers.forEach(entry => bounds.extend(entry.coords));
    map.fitBounds(bounds, { padding:70, maxZoom:16, duration:0 });
  }

  function focusPropertyOnMap(id) {
    const entry = markers.get(id);
    if (!entry) { toast("No saved map location. Contact the owner through the listing details."); return; }

    if (activeMarkerEl) activeMarkerEl.classList.remove("active");
    entry.element.classList.add("active");
    activeMarkerEl = entry.element;

    if (currentMapPopup && currentMapPopup.isOpen()) {
      currentMapPopup.remove();
    }
    entry.popup.setLngLat(entry.coords).addTo(map);
    currentMapPopup = entry.popup;

    map.flyTo({
      center: entry.coords,
      zoom: 16.5,
      pitch: 0,
      bearing: 0,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });

    // Sync left feed card active state & scroll
    $$(".map3d-card").forEach((card) => {
      if (card.dataset.focusProperty === id) {
        card.classList.add("active");
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        card.classList.remove("active");
      }
    });
  }

  // Sidebar card clicks
  $$("[data-focus-property]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pid = btn.dataset.focusProperty;
      focusPropertyOnMap(pid);
    });
  });

  // Floating map controls
  $("#map3d-compass-btn")?.addEventListener("click", () => {
    map.easeTo({ bearing: 0, pitch: 0, duration: 600 });
  });

  $("#map3d-locate-btn")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      toast("Geolocation is not supported by your browser.");
      return;
    }
    toast("Locating your position in Tuguegarao...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 16,
          pitch: 55,
          speed: 1.2,
          essential: true,
        });
        toast("Centered to your location.");
      },
      () => {
        toast("Unable to retrieve location. Defaulting to Tuguegarao.");
      },
      { timeout: 8000 },
    );
  });

  $("#map3d-center-btn")?.addEventListener("click", () => {
    map.flyTo({
      center: TUGUEGARAO_CENTER,
      zoom: 14.8,
      pitch: 55,
      bearing: -15,
      speed: 1.1,
      essential: true,
    });
  });

  $("#map3d-zoom-in")?.addEventListener("click", () => map.zoomIn());
  $("#map3d-zoom-out")?.addEventListener("click", () => map.zoomOut());

  // Quick filter chips inside 3D sidebar
  $$("[data-map-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const type = chip.dataset.mapFilter;
      state.filters.type = type;
      route();
    });
  });

  $$("[data-map-vacant]").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.filters.vacant = !state.filters.vacant;
      route();
    });
  });
}

async function askDomi(text) {
  if (!text?.trim() || state.domiBusy) return;
  if (text.length > 1000) { toast("Keep questions under 1,000 characters."); return; }
  state.domiBusy = true;
  state.domiHistory = state.domiHistory.slice(-38);
  const q = text.trim();
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  state.domiHistory.push({ role: "user", text: q, time: now });

  const stream = $("#domi-chat-stream");
  const renderChat = (isThinking = false) => {
    if (!stream) return;
    let html = state.domiHistory
      .map((m) => {
        const isUser = m.role === "user";
        return `
          <div class="domi-msg ${isUser ? "user" : "domi"}">
            ${!isUser ? `<div class="domi-msg-avatar"><img src="/domi.png" alt="DOMI" /></div>` : ""}
            <div class="domi-msg-bubble">
              <div class="domi-msg-text">${e(m.text)}</div>
              <span class="domi-msg-time">${e(m.time)}</span>
            </div>
            ${isUser ? `<div class="domi-msg-avatar user-avatar">${(api.profile?.name || "U")[0].toUpperCase()}</div>` : ""}
          </div>
        `;
      })
      .join("");

    if (isThinking) {
      html += `
        <div class="domi-msg domi" id="domi-thinking-row">
          <div class="domi-msg-avatar"><img src="/domi.png" alt="DOMI" /></div>
          <div class="domi-msg-bubble" style="display:flex; align-items:center; gap:8px;">
            <span class="domi-thinking-dots"><span></span><span></span><span></span></span>
            <span style="font-size:0.8125rem; color:var(--text-secondary); font-weight:500;">DOMI is checking the loaded listings...</span>
          </div>
        </div>
      `;
    }
    stream.innerHTML = html;
    stream.scrollTop = stream.scrollHeight;
  };

  renderChat(true);

  // Brief natural thinking delay
  await new Promise((r) => setTimeout(r, 700));

  const reply = domiReply(q, state.properties);
  const finishTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  state.domiHistory.push({ role: "domi", text: reply, time: finishTime });


  renderChat(false);
  state.domiBusy = false;
  $("#domi-chat-input")?.focus();
}

// Standards-based PWA installation
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  toast("DormPath is installed! You can launch it directly from your home screen.");
});

function openInstallModal() {
  modal(`
    <div class="install-modal-shell" style="padding:4px 0;">
      <div style="display:flex; align-items:center; gap:14px; margin-bottom:16px;">
        <div class="brand-logo-emblem" style="width:48px; height:48px; flex-shrink:0;">
          <img src="/domi-app-icon.png" alt="" class="brand-logo-image">
        </div>
        <div>
          <h3 style="margin:0 0 2px; font-size:1.25rem; font-weight:800; color:var(--text-main);">Install DormPath App</h3>
          <span style="font-size:0.8125rem; color:var(--text-secondary); font-weight:500;">Installable mobile web app · Tuguegarao & Peñablanca</span>
        </div>
      </div>

      <p style="font-size:0.875rem; color:var(--text-secondary); line-height:1.55; margin-bottom:20px;">
        Install DormPath directly on your phone or tablet for instant access, offline rooms, 60fps interactive map, and instant landlord chat without typing URLs.
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:22px;">
        <button type="button" class="button primary large" id="btn-trigger-pwa-install" style="width:100%; justify-content:center; gap:8px; font-weight:700;">
          ${icon("download")} <span>1-Tap Install App on Device</span>
        </button>
      </div>

      <div style="background:var(--bg-subtle); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:16px;">
        <h4 style="margin:0 0 10px; font-size:0.875rem; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:6px;">
          ${icon("smartphone")} How to Install:
        </h4>
        <ul style="margin:0; padding-left:18px; font-size:0.8125rem; color:var(--text-secondary); line-height:1.65;">
          <li><strong>Android (Chrome / Samsung / Brave):</strong> Tap <strong>"1-Tap Install"</strong> above, or tap the browser menu (<strong>⋮</strong> three dots) and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
          <li><strong>iPhone / iPad (Safari):</strong> Tap the <strong>Share</strong> button (box with up-arrow) at the bottom, then tap <strong>"Add to Home Screen"</strong>.</li>
        </ul>
      </div>
    </div>
  `);

  $("#btn-trigger-pwa-install")?.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") {
        toast("Installing DormPath to your phone...");
      }
      deferredInstallPrompt = null;
    } else {
      toast("To install on Android: Tap ⋮ in your browser's top-right corner and select 'Install app' or 'Add to Home screen'.");
    }
  });
}

/* ==============================================================================
   GLOBAL EVENT DELEGATION
   ============================================================================== */
document.addEventListener("click", async (event) => {
  const el = event.target.closest("button, [data-action], [data-role-select], [data-school], [data-type], [data-save], [data-status], [data-delete-property], [data-room], [data-occupy], [data-vacate], [data-verify], [data-suspend], [data-moderate], [data-report], [data-confirm-viewing], [data-user-filter], .domi-chip");
  if (!el) return;

  // Install PWA Trigger
  if (el.dataset.action === "install-pwa") {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choice) => {
        if (choice?.outcome === "accepted") {
          toast("Installing DormPath to your phone...");
        }
        deferredInstallPrompt = null;
      }).catch(() => {});
    }
    openInstallModal();
    return;
  }

  // DOMI prompt chip clicked
  const chip = el.closest(".domi-chip");
  if (chip) {
    const q = chip.dataset.ask;
    const inp = $("#domi-chat-input");
    if (inp) inp.value = q;
    await askDomi(q);
    return;
  }

  // Role card selection in register
  if (el.dataset.roleSelect) {
    state.selectedRole = el.dataset.roleSelect;
    document.querySelectorAll(".role-card").forEach((c) => c.classList.remove("selected"));
    el.classList.add("selected");
    const inp = $("#auth-role-input");
    if (inp) inp.value = state.selectedRole;
    return;
  }

  // Campus chip in hero
  if (el.dataset.school) {
    state.filters.q = el.dataset.school;
    location.hash = "/search";
    route();
    return;
  }

  // Space type card
  if (el.dataset.type && el.classList.contains("category-card")) {
    state.filters.type = el.dataset.type;
    location.hash = "/search";
    route();
    return;
  }

  // Favorite save
  if (el.dataset.save) {
    try {
      const id = el.dataset.save;
      const isSaved = state.favorites.some((f) => f.propertyId === id);
      await api.toggleFavorite(id, isSaved);
      if (isSaved) {
        state.favorites = state.favorites.filter((f) => f.propertyId !== id);
        toast("Removed from saved places.");
      } else {
        state.favorites.push({ propertyId: id });
        toast("Saved to your shortlist!");
      }
      route();
    } catch (err) {
      toast(err.message);
    }
    return;
  }


  // Property Pause / Archive
  if (el.dataset.status) {
    const [id, nextStatus] = el.dataset.status.split(":");
    try {
      await api.propertyStatus(id, nextStatus);
      toast(`Property status set to ${nextStatus}.`);
      route();
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  // Delete Archived Property
  if (el.dataset.deleteProperty) {
    if (confirm("Are you sure you want to permanently delete this archived property?")) {
      try {
        await api.deleteProperty(el.dataset.deleteProperty);
        toast("Property deleted.");
        route();
      } catch (err) {
        toast(err.message);
      }
    }
    return;
  }

  // Room Dialog Trigger
  if (el.dataset.room) {
    const r = state.rooms?.find((item) => item.id === el.dataset.room);
    if (r) roomDialog(r);
    return;
  }

  // Quick Vacancy +/-
  if (el.dataset.occupy) {
    try {
      await api.adjustVacancy(state.roomProperty, el.dataset.occupy, -1);
      toast("Occupancy updated (-1 vacancy).");
      route();
    } catch (err) {
      toast(err.message);
    }
    return;
  }
  if (el.dataset.vacate) {
    try {
      await api.adjustVacancy(state.roomProperty, el.dataset.vacate, 1);
      toast("Vacancy increased (+1 vacancy).");
      route();
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  if (el.dataset.reviewLandlord) {
    const [uid, status] = el.dataset.reviewLandlord.split(":");
    if (status === "approved") {
      try {
        await api.reviewLandlordApplication(uid, "approved");
        toast("Permit application approved. Landlord publishing access is now active.");
        route();
      } catch (err) {
        toast(err.message);
      }
    } else if (status === "rejected") {
      modal(`
        <form id="admin-landlord-review-form">
          <h2 style="color:var(--danger); display:flex; align-items:center; gap:8px;">
            ${icon("ban")} Decline Landlord Application
          </h2>
          <input type="hidden" name="uid" value="${e(uid)}">
          <input type="hidden" name="reviewStatus" value="rejected">
          <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:14px; line-height:1.5;">
            State why this permit application does not match the uploaded Mayor's permit or fails verification criteria.
          </p>
          <label>Reason for declining (recorded and shown to applicant)
            <textarea name="reviewNotes" required maxlength="1000" rows="4" placeholder="e.g. The uploaded Mayor's permit business name or property address does not match your submitted application details."></textarea>
          </label>
          <div style="display:flex; gap:10px; margin-top:14px;">
            <button class="button primary full" style="background:var(--danger); border-color:var(--danger);" type="submit">Confirm Decline</button>
            <button type="button" class="button outline full" onclick="this.closest('dialog').close();">Cancel</button>
          </div>
        </form>`);
    } else {
      modal(`
        <form id="admin-landlord-review-form">
          <h2>Request permit corrections</h2>
          <input type="hidden" name="uid" value="${e(uid)}">
          <input type="hidden" name="reviewStatus" value="changes_requested">
          <label>Missing or mismatched fields (comma-separated)
            <input name="missingItems" required maxlength="300" placeholder="mayorsPermitUrl, businessPermitNumber, fireSafetyExpires">
          </label>
          <label>Instructions for the landlord
            <textarea name="reviewNotes" required maxlength="1000" rows="4" placeholder="Explain exactly what must be corrected."></textarea>
          </label>
          <button class="button primary full" type="submit">Send correction request</button>
        </form>`);
    }
    return;
  }

  // Legacy verification can only be revoked here. Approval is performed from Permit Reviews.
  if (el.dataset.verify) {
    const parts = el.dataset.verify.split(":");
    const uid = parts[0];
    const isVerifying = parts[1] !== "false";
    if (isVerifying) {
      toast("Open Permit Reviews and approve a complete application instead.");
      return;
    }
    try {
      await api.moderate("users", uid, { verified: isVerifying });
      toast(isVerifying ? "Owner verified successfully!" : "Verification badge revoked.");
      route();
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  // Admin Suspension Toggle
  if (el.dataset.suspend) {
    const [id, dis] = el.dataset.suspend.split(":");
    const shouldDisable = dis === "true";
    try {
      await api.moderate("users", id, { disabled: shouldDisable });
      toast(shouldDisable ? "User account suspended." : "User account restored.");
      route();
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  // Admin User Filtering
  if (el.dataset.userFilter) {
    const filter = el.dataset.userFilter;
    document.querySelectorAll(".admin-filter-chip").forEach((btn) => btn.classList.remove("active"));
    el.classList.add("active");
    document.querySelectorAll(".admin-user-card").forEach((card) => {
      const role = card.dataset.role;
      const verified = card.dataset.verified === "true";
      const disabled = card.dataset.disabled === "true";
      let show = true;
      if (filter === "landlord") show = role === "landlord";
      else if (filter === "tenant") show = role !== "landlord";
      else if (filter === "verified") show = role === "landlord" && verified;
      else if (filter === "suspended") show = disabled;
      card.style.display = show ? "" : "none";
    });
    return;
  }

  // Admin Listing Moderation
  if (el.dataset.moderate) {
    const [coll, id, st] = el.dataset.moderate.split(":");
    try {
      await api.moderate(coll, id, { status: st });
      toast(`Item updated to ${st}.`);
      route();
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  // Report Listing or Landlord (from listing, chat, or tenant dashboard)
  if (el.dataset.report || el.dataset.action === "report-landlord-direct") {
    const propId = el.dataset.report || "";
    let propertySelectHtml = "";
    if (!propId) {
      const userConvs = await api.conversations().catch(() => []);
      const userFavs = await api.favorites().catch(() => []);
      const options = [];
      const seen = new Set();
      for (const c of userConvs) {
        if (c.propertyId && !seen.has(c.propertyId)) {
          seen.add(c.propertyId);
          options.push(`<option value="${e(c.propertyId)}">Listing: ${e(c.title || c.propertyId)}</option>`);
        }
      }
      for (const f of userFavs) {
        if (f.id && !seen.has(f.id)) {
          seen.add(f.id);
          options.push(`<option value="${e(f.id)}">Saved Place: ${e(f.title || f.id)}</option>`);
        }
      }
      if (options.length > 0) {
        propertySelectHtml = `
          <label style="margin-bottom:12px;">Select Landlord / Listing
            <select name="propertyId" required style="width:100%; padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--bg-surface); color:var(--text-main); font-size:0.875rem;">
              <option value="">-- Choose a property or landlord thread --</option>
              ${options.join("")}
            </select>
          </label>
        `;
      } else {
        toast("To report a landlord, open their listing or message thread and tap 'Report Landlord'.");
        return;
      }
    }

    modal(`
      <form id="report-form" data-property="${e(propId)}">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span style="color:var(--danger); display:inline-flex;">${icon("flag")}</span>
          <h3 style="margin:0; font-size:1.25rem;">Report Landlord or Property</h3>
        </div>
        <p style="font-size:0.875rem; margin-bottom:16px; color:var(--text-secondary); line-height:1.5;">
          DormPath enforces community standards to ensure tenant safety and respect. If a landlord is rude, disrespectful, demanding cash deposits without a receipt, or not nice, report them directly for administrator review.
        </p>

        ${propertySelectHtml}

        <label style="margin-top:10px;">Reason for Report
          <select name="category" required style="width:100%; padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--bg-surface); color:var(--text-main); font-size:0.875rem;">
            <option value="Landlord is rude or not nice">Landlord is rude, disrespectful, or not nice</option>
            <option value="Harassment or threatening conduct">Harassment, intimidation, or safety concern</option>
            <option value="Demanding unauthorized fees or deposits">Demanding unauthorized deposit or hidden charges</option>
            <option value="Inaccurate listing or unavailable vacancy">Inaccurate photos, false pricing, or unavailable room</option>
            <option value="Privacy invasion or unreasonable house rules">Privacy invasion or unreasonable house rules</option>
            <option value="Other tenancy safety issue">Other tenancy or community policy violation</option>
          </select>
        </label>

        <label style="margin-top:14px;">Describe what happened
          <textarea name="details" required minlength="10" maxlength="1800" placeholder="Please describe what the landlord said or did, and any relevant dates or conversation details..." style="min-height:110px; width:100%; padding:10px 12px; margin-top:4px; font-size:0.875rem; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--bg-surface); color:var(--text-main);"></textarea>
        </label>

        <div style="display:flex; gap:10px; margin-top:20px; justify-content:flex-end;">
          <button type="button" class="button outline small" data-action="close-modal">Cancel</button>
          <button type="submit" class="button primary small" style="background:var(--danger); border-color:var(--danger);">
            ${icon("flag")} Submit Report
          </button>
        </div>
      </form>
    `);
    return;
  }

  // Confirm Viewing
  if (el.dataset.confirmViewing) {
    try {
      await api.confirmViewing(el.dataset.confirmViewing);
      toast("Viewing confirmed!");
      route();
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  if (el.dataset.chatProperty) {
    try {
      const p = await api.getProperty(el.dataset.chatProperty);
      const convId = await api.startConversation(p);
      location.hash = `/messages/${convId}`;
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  // Action switches
  switch (el.dataset.action) {
    case "theme": {
      const dark = document.documentElement.dataset.theme !== "dark";
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      localStorage.setItem("theme", dark ? "dark" : "light");
      toast(dark ? "Dark mode activated 🌙" : "Light mode activated ☀️");
      route();
      break;
    }
    case "toggle-password": {
      const field = el.closest(".password-field");
      const inp = field ? field.querySelector("input") : ($("#auth-password") || $("#profile-new-pass"));
      if (inp) {
        inp.type = inp.type === "password" ? "text" : "password";
        el.innerHTML = icon(inp.type === "password" ? "eye" : "eye-off");
        refreshIcons();
      }
      break;
    }
    case "trigger-pfp":
      $("#pfp-file-input")?.click();
      break;
    case "logout-to-register-landlord":
      await api.logout();
      state.selectedRole = "landlord";
      location.hash = "/register";
      break;
    case "remove-pfp":
      try {
        await api.saveProfile({ photoURL: "" });
        toast("Profile photo removed.");
        route();
      } catch (err) {
        toast(err.message);
      }
      break;
    case "send-verify-email":
      try {
        await api.sendVerification();
        toast("Verification email sent! Please check your inbox.");
      } catch (err) {
        toast(err.message);
      }
      break;
    case "send-reset-email":
      try {
        await api.resetPassword(api.currentUser.email);
        toast(`Password reset link sent to ${api.currentUser.email}`);
      } catch (err) {
        toast(err.message);
      }
      break;
    case "google-auth": {
      if (el.disabled) break;
      if (location.hash.includes("register") && !$('input[name="consent"]')?.checked) { toast("Read and accept the privacy policy and terms first."); break; }
      el.disabled = true;
      startGlobalLoading(true);
      try {
        await api.loginWithGoogle(state.selectedRole || "tenant", Boolean($('input[name="remember"]')?.checked));
        location.hash = "/dashboard";
      } catch (err) {
        const msg = formatAuthError(err);
        if (msg) toast(msg);
      } finally {
        el.disabled = false;
        stopGlobalLoading();
      }
      break;
    }
    case "privacy-dialog":
      modal(`<div class="legal-dialog">${privacyPage()}</div>`);
      break;
    case "terms-dialog":
      modal(`<div class="legal-dialog">${termsPage()}</div>`);
      break;
    case "resend-verification": {
      const form = $("#login");
      if (!form?.reportValidity()) break;
      el.disabled = true;
      try { await api.resendVerificationEmail(form.email.value, form.password.value); toast("Verification email sent. Check your inbox and spam folder."); }
      catch (err) { toast(formatAuthError(err)); }
      finally { el.disabled = false; }
      break;
    }
    case "fullscreen":
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await $("main").requestFullscreen(); } catch { toast("Full screen is unavailable in this browser."); }
      break;
    case "logout":
      startGlobalLoading(true);
      try {
        await api.logout();
        state.favorites = [];
        location.hash = "/home";
      } finally {
        stopGlobalLoading();
      }
      break;
    case "open-notifications": {
      modal(`
        <div class="notifications-popup-modal">
          <div class="notifications-header">
            <h3>${icon("bell")} Recent Alerts & Updates</h3>
          </div>
          <div id="notifications-popup-content">
            ${domiLoaderHtml("section")}
          </div>
        </div>
      `);
      try {
        const items = await api.notifications();
        const container = $("#notifications-popup-content");
        if (!container) return;
        if (!items || items.length === 0) {
          container.innerHTML = `
            <div style="text-align:center; padding:28px 12px; color:var(--text-muted);">
              <div style="font-size:2.2rem; margin-bottom:8px;">🔔</div>
              <strong style="color:var(--text-main); font-size:1rem;">All caught up!</strong>
              <p style="font-size:0.8125rem; margin-top:4px;">No new alerts or room inquiry notifications right now.</p>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="notifications-list">
              ${items
                .map(
                  (n) => `
                <div class="notification-item-card">
                  <div class="notification-icon-box">${icon("bell")}</div>
                  <div class="notification-content">
                    <div class="notification-title">${e(n.title || n.message || "Notification")}</div>
                    <div class="notification-time">${date(n.createdAt)}</div>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          `;
        }
        refreshIcons();
      } catch (err) {
        const container = $("#notifications-popup-content");
        if (container) {
          container.innerHTML = `<p style="color:var(--danger); font-size:0.875rem; text-align:center;">${e(err.message || "Failed to load notifications.")}</p>`;
        }
      }
      break;
    }
    case "toggle-mobile-drawer": {
      const isLandlord = api.profile?.role === "landlord";
      const roleLabel = isLandlord ? "Landlord / Owner" : "User / Tenant";
      modal(`
        <div style="padding:4px 0;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border-light);">
            <div class="sidebar-avatar" style="width:48px; height:48px; font-size:1.25rem;">
              ${
                api.currentUser?.photoURL || api.profile?.photoURL
                  ? `<img src="${e(api.currentUser?.photoURL || api.profile?.photoURL)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="PFP">`
                  : (api.profile?.name || "U")[0].toUpperCase()
              }
            </div>
            <div style="flex:1; min-width:0;">
              <h3 style="margin:0; font-size:1rem; font-weight:700;">${e(api.profile?.name || "User")}</h3>
              <span style="font-size:0.75rem; color:var(--text-muted);">${roleLabel} · Tuguegarao & Peñablanca</span>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
            <a href="#/search" class="button outline" style="justify-content:flex-start; padding:10px 12px;" onclick="this.closest('dialog').close();">
              ${icon("search")} Explore
            </a>
            <a href="#/map" class="button outline" style="justify-content:flex-start; padding:10px 12px;" onclick="this.closest('dialog').close();">
              ${icon("map")} Area Map
            </a>
            <a href="#/domi" class="button outline" style="justify-content:flex-start; padding:10px 12px;" onclick="this.closest('dialog').close();">
              ${icon("bot")} DOMI
            </a>
            <a href="#/favorites" class="button outline" style="justify-content:flex-start; padding:10px 12px;" onclick="this.closest('dialog').close();">
              ${icon("heart")} Saved
            </a>
            <a href="#/messages" class="button outline" style="justify-content:flex-start; padding:10px 12px;" onclick="this.closest('dialog').close();">
              ${icon("messages-square")} Chat
            </a>
            <button type="button" class="button outline" style="justify-content:flex-start; padding:10px 12px;" data-action="open-notifications">
              ${icon("bell")} Alerts
            </button>
            ${
              isLandlord
                ? `
              <a href="#/properties" class="button outline" style="justify-content:flex-start; padding:10px 12px; grid-column:span 2;" onclick="this.closest('dialog').close();">
                ${icon("building-2")} My Properties
              </a>
            `
                : ""
            }
            ${
              api.isAdmin
                ? `
              <a href="#/admin" class="button outline" style="justify-content:flex-start; padding:10px 12px; grid-column:span 2; border-color:var(--brand-primary); color:var(--brand-primary);" onclick="this.closest('dialog').close();">
                ${icon("shield-check")} Administrator Console
              </a>
            `
                : ""
            }
            <a href="#/profile" class="button outline" style="justify-content:flex-start; padding:10px 12px; grid-column:span 2;" onclick="this.closest('dialog').close();">
              ${icon("user")} Profile & Settings
            </a>
            <a href="#/about" class="button text-button" style="justify-content:flex-start; padding:8px 12px;" onclick="this.closest('dialog').close();">
              ${icon("info")} Fair Housing
            </a>
            <a href="#/terms" class="button text-button" style="justify-content:flex-start; padding:8px 12px;" onclick="this.closest('dialog').close();">
              ${icon("file-text")} Rules & Terms
            </a>
          </div>

          <div style="display:flex; gap:10px; border-top:1px solid var(--border-light); padding-top:14px;">
            <button class="button outline" style="flex:1;" data-action="theme">
              ${icon("sun-moon")} Toggle Theme
            </button>
            <button class="button outline" style="flex:1; color:var(--danger); border-color:rgba(239, 68, 68, 0.3);" data-action="logout" onclick="this.closest('dialog').close();">
              ${icon("log-out")} Log Out
            </button>
          </div>
        </div>
      `);
      break;
    }
    case "domi":
      location.hash = "/domi";
      break;
    case "clear-domi":
      state.domiHistory = [
        {
          role: "domi",
          text: "Kumusta! I am DOMI, your housing guide for Tuguegarao City. Ask me anything about boarding houses, campus distances (CSU Carig, Andrews, SPUP, USL), typical rents, or drafting inquiries to landlords!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ];
      route();
      break;
    case "close-modal":
      $("#modal")?.close();
      break;
    case "reset-filters":
      state.filters = {};
      route();
      break;
    case "load-more":
      await loadListings(true);
      route();
      break;
    case "add-room":
      roomDialog();
      break;
    case "viewing":
      modal(`
        <form id="viewing-form">
          <h3>Request an In-Person Viewing</h3>
          <p style="font-size:0.875rem; margin-bottom:14px; color:var(--text-secondary);">
            Coordinate an ocular inspection with the landlord. Please suggest a date and preferred time.
          </p>
          <label>Proposed Date & Time
            <input name="date" type="text" required placeholder="e.g. Saturday Oct 24 at 2:00 PM">
          </label>
          <button class="button primary full" style="margin-top:16px;">Send Viewing Request</button>
        </form>
      `);
      break;
    case "block": {
      if (!state.chat) break;
      const otherId = state.chat.participants.find((p) => p !== api.currentUser?.uid);
      if (otherId && confirm("Block this user? They will not be able to message you or request viewings.")) {
        try {
          await api.blockUser(otherId);
          toast("User blocked.");
          location.hash = "/messages";
        } catch (err) {
          toast(err.message);
        }
      }
      break;
    }
    case "clear-private":
      if (confirm("Clear local cached offline data?")) {
        try {
          indexedDB.deleteDatabase("dormpath");
          toast("Offline cache cleared.");
          location.reload();
        } catch (e) {
          toast("Cache cleared.");
        }
      }
      break;
    case "retry":
      route();
      break;
    case "reset-password":
      modal(`
        <form id="reset-form">
          <h2>Reset password</h2>
          <p style="margin-bottom:14px;">Enter your email to receive a password reset link.</p>
          <label>Email address
            <input name="email" type="email" required placeholder="you@example.com">
          </label>
          <button class="button primary full">Send Reset Email</button>
        </form>
      `);
      break;
  }
});

/* ==============================================================================
   FORM SUBMISSIONS
   ============================================================================== */
document.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.dataset.busy) return;
  form.dataset.busy = "true";
  form.setAttribute("aria-busy", "true");
  const submitters = [...form.querySelectorAll('[type="submit"]')];
  const originalButtonContents = new Map();
  submitters.forEach((b) => {
    originalButtonContents.set(b, b.innerHTML);
    b.disabled = true;
    const txt = b.textContent.trim();
    b.innerHTML = `<span style="display:inline-flex; align-items:center; gap:8px;">${domiLoaderHtml("button")}<span>${txt || "Please wait..."}</span></span>`;
  });
  startLoading();
  const data = new FormData(form);
  const values = Object.fromEntries(data);

  try {
    switch (form.id) {
      case "login":
        startGlobalLoading(true);
        loginLimiter.check();
        if ($("#captcha-status")) $("#captcha-status").textContent = "Verifying your sign-in…";
        await api.login(values.email, values.password, data.has("remember"));
        loginLimiter.clear();
        try { if (data.has("remember")) localStorage.setItem("dormpath-login-preference", JSON.stringify({remember:true,email:values.email.trim()})); else localStorage.removeItem("dormpath-login-preference"); } catch {}
        location.hash = "/dashboard";
        break;
      case "register": {
        await api.register(values);
        modal(`
          <div style="text-align:center; padding:16px 8px;">
            <div class="brand-mascot-badge" style="width:64px; height:64px; margin:0 auto 16px; border-radius:18px;">
              <img src="/domi.png" alt="DOMI Mascot" style="width:48px; height:48px; object-fit:contain;" />
            </div>
            <h3 style="margin:0 0 8px; font-size:1.25rem; font-weight:800; color:var(--text-main);">Email Verification Required</h3>
            <p style="color:var(--text-secondary); font-size:0.875rem; line-height:1.6; margin-bottom:20px;">
              Your account has been created! A verification link was sent to <strong>${e(values.email)}</strong>.<br>
              Please open the email and click the verification link before logging in.
            </p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <a href="#/login" class="button primary full" onclick="this.closest('dialog').close();">
                Proceed to Log In
              </a>
              <button type="button" class="button outline full" onclick="this.closest('dialog').close();">
                Dismiss
              </button>
            </div>
          </div>
        `);
        break;
      }
      case "search-form":
        state.filters = { ...state.filters, q: values.q, budget: values.budget, type: values.type };
        location.hash = "/search";
        route();
        break;
      case "filters":
        state.filters = { ...state.filters, type: values.type, vacant: data.has("vacant") };
        route();
        break;
      case "profile-form":
        await api.saveProfile({
          name: values.name?.trim(),
          phone: values.phone?.trim() || "",
          school: values.school?.trim() || "",
          bio: values.bio?.trim() || "",
        });
        toast("Profile updated successfully!");
        route();
        break;
      case "landlord-application-form": {
        let mayorsPermitUrl = values.mayorsPermitUrl || "";
        const fileInput = form.querySelector('input[name="mayorsPermitFile"]');
        if (fileInput && fileInput.files && fileInput.files[0]) {
          toast("Uploading Mayor's Permit document...");
          mayorsPermitUrl = await api.uploadMedia(fileInput.files[0]);
        }
        if (!mayorsPermitUrl) {
          throw new Error("Please upload a photo or scan of your official Mayor's Permit before submitting.");
        }
        await api.submitLandlordApplication({
          ...values,
          mayorsPermitUrl,
          consent: data.has("consent"),
        });
        toast("Permit application submitted for administrator review.");
        route();
        break;
      }
      case "admin-landlord-review-form":
        await api.reviewLandlordApplication(
          values.uid,
          values.reviewStatus || "changes_requested",
          String(values.missingItems || "").split(",").map((item) => item.trim()).filter(Boolean),
          values.reviewNotes,
        );
        $("#modal")?.close();
        toast(values.reviewStatus === "rejected" ? "Landlord application was declined." : "The landlord was notified which permit details need correction.");
        route();
        break;
      case "change-password-form": {
        const p1 = values.newPassword;
        const p2 = values.confirmPassword;
        if (p1 !== p2) {
          toast("New passwords do not match.");
          break;
        }
        await api.changePassword(p1);
        toast("Password successfully updated!");
        form.reset();
        break;
      }
      case "domi-chat-form": {
        const text = values.question?.trim();
        if (!text) break;
        form.reset();
        await askDomi(text);
        break;
      }
      case "domi-form":
        $("#domi-answer").textContent = domiReply(values.question, state.properties);
        break;
      case "reset-form":
        await api.resetPassword(values.email);
        $("#modal")?.close();
        toast("If an account exists, a reset link was sent.");
        break;
      case "message-form":
        await api.sendMessage(state.chat.id, values.text);
        form.reset();
        break;
      case "property-form": {
        // 1. Strict Landlord / Admin Check
        if ((!api.profile?.verified || api.profile?.role !== "landlord") && !api.isAdmin) {
          toast("Administrator approval of your permit application is required before publishing properties.");
          return;
        }

        // 2. Validate Room Types (Firestore schema strictly requires 1 <= roomTypes <= 7)
        const roomTypes = data.getAll("roomTypes");
        if (!roomTypes || roomTypes.length === 0) {
          toast("Please select at least one Room Type offered.");
          return;
        }

        // 3. Validate Required Text Fields
        const title = values.title?.trim();
        const address = values.address?.trim();
        const description = values.description?.trim();
        const utilities = values.utilities?.trim() || "Standard utilities policy.";
        const rules = values.rules?.trim() || "Standard house rules and curfew apply.";
        const selectedBarangay = values.barangay?.trim();

        if (!title) { toast("Please enter a property title."); return; }
        if (!selectedBarangay) { toast("Please select a barangay in Tuguegarao or Peñablanca."); return; }
        if (!address) { toast("Please enter the complete street address."); return; }
        if (!description) { toast("Please enter a property description."); return; }

        const pendingPhotos = data.getAll("photos").filter((f) => f.size).length;
        const keptPhotos = data.getAll("keepPhotos").length;
        if (pendingPhotos + keptPhotos > 8) {
          toast(`A listing can have at most 8 photos. You have ${keptPhotos} kept and ${pendingPhotos} new — remove ${pendingPhotos + keptPhotos - 8}.`);
          return;
        }

        startGlobalLoading(true);
        const files = data.getAll("photos").filter((f) => f.size);
        const photos = data.getAll("keepPhotos");
        const videoFileInput = form.querySelector('input[name="videoFile"]');
        const videoFile = videoFileInput?.files?.[0];

        try {
          if (files.length > 0) {
            toast(`Uploading ${files.length} property photo(s)...`);
            for (let i = 0; i < files.length; i++) {
              const url = await api.uploadMedia(files[i]);
              photos.push(url);
            }
          }

          let videoUrl = form.dataset.currentVideo || "";
          if (videoFile && videoFile.size > 0) {
            toast("Uploading property walkthrough video...");
            videoUrl = await api.uploadMedia(videoFile);
          }

          // Compute/read exact coordinates from interactive map picker or fallback
          const coords = BARANGAY_COORDINATES[selectedBarangay] || [121.7270, 17.6132];
          const latInput = form.querySelector('input[name="lat"]');
          const lngInput = form.querySelector('input[name="lng"]');
          const rawLat = latInput?.value ? Number(latInput.value) : (values.lat ? Number(values.lat) : Number(coords[1]));
          const rawLng = lngInput?.value ? Number(lngInput.value) : (values.lng ? Number(values.lng) : Number(coords[0]));
          const lat = !isNaN(rawLat) ? Math.max(-90, Math.min(90, rawLat)) : Number(coords[1]);
          const lng = !isNaN(rawLng) ? Math.max(-180, Math.min(180, rawLng)) : Number(coords[0]);

          const p = {
            title,
            barangay: selectedBarangay,
            address,
            school: values.school ? values.school.trim() : "",
            minPrice: Math.max(0, Math.min(1000000, Number(values.minPrice) || 0)),
            lat,
            lng,
            deposit: Math.max(0, Math.min(1000000, Number(values.deposit) || 0)),
            advance: Math.max(0, Math.min(1000000, Number(values.advance) || 0)),
            description,
            utilities,
            rules,
            roomTypes,
            amenities: data.getAll("amenities"),
            photos,
            video: videoUrl,
          };
          await api.saveProperty(p, form.dataset.id || null);
          toast("Property listing saved successfully.");
          location.hash = "/properties";
        } catch (err) {
          console.error("Property save error:", err);
          if (err.message?.includes("permission") || err.code === "permission-denied") {
            toast("Permission Denied: Please ensure your account is a verified Landlord and all required fields are complete.");
          } else {
            toast(err.message || "Failed to save property listing.");
          }
        } finally {
          stopGlobalLoading();
        }
        break;
      }
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
        $("#modal")?.close();
        toast("Room saved.");
        route();
        break;
      case "report-form": {
        const propId = form.dataset.property || values.propertyId;
        if (!propId) throw Error("Please select a valid property or landlord listing.");
        const category = values.category || "General Conduct";
        const details = (values.details || values.reason || "").trim();
        if (!details) throw Error("Please provide details for the safety report.");
        const fullReason = `[${category}] ${details}`.slice(0, 1999);
        await api.report(propId, fullReason);
        $("#modal")?.close();
        toast("Thank you. Safety report submitted for administrator review.");
        break;
      }
      case "viewing-form":
        await api.viewing(state.chat.id, values.date.trim());
        $("#modal")?.close();
        toast("Viewing request sent!");
        route();
        break;
    }
  } catch (err) {
    if (form.id === "login" && ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/too-many-requests"].includes(err.code)) loginLimiter.fail();
    if (err.code === "auth/unverified-email") {
      const help = $("#verification-help"); if (help) help.hidden = false;
      const emailField = $("#login input[name=email]"); if (emailField) emailField.value = values.email;
      modal(`
        <div style="text-align:center; padding:16px 8px;">
          <div style="width:56px; height:56px; border-radius:50%; background:rgba(239,68,68,0.1); color:var(--danger); display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px;">
            ${icon("alert-circle")}
          </div>
          <h3 style="margin:0 0 8px; font-size:1.2rem; font-weight:800; color:var(--text-main);">Verify Your Email Address</h3>
          <p style="color:var(--text-secondary); font-size:0.875rem; line-height:1.6; margin-bottom:20px;">
            ${e(err.message)}
          </p>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <button type="button" class="button primary full" onclick="this.closest('dialog').close();">
              I Understand, I'll Check Email
            </button>
          </div>
        </div>
      `);
      return;
    }
    const msg = formatAuthError(err);
    if (msg) toast(msg);
  } finally {
    if ($("#captcha-status")) $("#captcha-status").textContent = api.appCheck ? "reCAPTCHA · automatic verification at sign-in" : "Bot protection is not configured yet";
    delete form.dataset.busy;
    form.removeAttribute("aria-busy");
    submitters.forEach((b) => {
      b.disabled = false;
      if (originalButtonContents.has(b)) {
        b.innerHTML = originalButtonContents.get(b);
      }
    });
    stopLoading();
    stopGlobalLoading();
  }
});

// ==============================================================================
// INTERACTIVE CIRCULAR PROFILE PHOTO CROPPER MODAL
// ==============================================================================
function openPhotoCropper(imageSrc) {
  const modal = $("#modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="cropper-modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="margin:0; font-size:1.125rem; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:8px;">
          ${icon("camera")} Crop Profile Picture
        </h3>
        <button type="button" class="button text-button small" id="crop-modal-close" style="padding:4px 8px; font-size:1.25rem; line-height:1;" aria-label="Close">✕</button>
      </div>
      <p style="font-size:0.8125rem; color:var(--text-secondary); margin:0 0 14px; line-height:1.4;">
        Drag photo to center inside the circle. Use slider or pinch/scroll to zoom.
      </p>

      <div id="crop-viewport">
        <canvas id="crop-canvas" width="280" height="280" style="display:block; width:280px; height:280px;"></canvas>
      </div>

      <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:18px;">
        <button type="button" class="button outline small" id="crop-zoom-out" style="width:34px; height:34px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:50%;" title="Zoom Out">
          ${icon("minus")}
        </button>
        <div style="display:flex; align-items:center; gap:8px; flex:1; max-width:180px;">
          <input type="range" id="crop-zoom-slider" min="0.6" max="3.5" step="0.02" value="1" style="width:100%; accent-color:var(--primary); cursor:pointer;">
        </div>
        <button type="button" class="button outline small" id="crop-zoom-in" style="width:34px; height:34px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:50%;" title="Zoom In">
          ${icon("plus")}
        </button>
        <button type="button" class="button outline small" id="crop-reset-btn" style="height:34px; padding:0 10px; font-size:0.75rem;" title="Reset Center">
          Reset
        </button>
      </div>

      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button type="button" class="button outline" id="crop-cancel-btn">
          Cancel
        </button>
        <button type="button" class="button primary" id="crop-save-btn" style="min-width:130px;">
          Crop & Save ${icon("arrow-right")}
        </button>
      </div>
    </div>
  `;
  refreshIcons();
  modal.showModal();

  const canvas = $("#crop-canvas");
  const ctx = canvas?.getContext("2d");
  const slider = $("#crop-zoom-slider");
  const viewport = $("#crop-viewport");

  if (!canvas || !ctx || !viewport) return;

  const W = 280;
  const H = 280;
  const CX = 140;
  const CY = 140;
  const R = 115; // 230px circle diameter inside 280px box

  let img = new Image();
  let baseScale = 1;
  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialTouchDistance = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!img.complete || img.naturalWidth === 0) return;

    const scale = baseScale * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const drawX = CX + offsetX - drawW / 2;
    const drawY = CY + offsetY - drawH / 2;

    // Draw original image
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Darkened circular cutout mask
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Crisp circular guide boundary
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(0, 245, 255, 0.5)";
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();
  }

  function resetPosition() {
    zoom = 1;
    offsetX = 0;
    offsetY = 0;
    if (slider) slider.value = "1";
    draw();
  }

  img.onload = () => {
    const minD = R * 2;
    baseScale = Math.max(minD / img.naturalWidth, minD / img.naturalHeight);
    resetPosition();
  };
  img.src = imageSrc;

  // Mouse Drag Events
  viewport.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX - offsetX;
    dragStartY = e.clientY - offsetY;
  });

  const onMouseMove = (e) => {
    if (!isDragging) return;
    offsetX = e.clientX - dragStartX;
    offsetY = e.clientY - dragStartY;
    draw();
  };

  const onMouseUp = () => {
    isDragging = false;
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  // Touch Drag & Pinch-to-zoom Events
  viewport.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX - offsetX;
      dragStartY = e.touches[0].clientY - offsetY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialTouchDistance = Math.hypot(dx, dy);
    }
  }, { passive: true });

  viewport.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && isDragging) {
      offsetX = e.touches[0].clientX - dragStartX;
      offsetY = e.touches[0].clientY - dragStartY;
      draw();
    } else if (e.touches.length === 2 && initialTouchDistance > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.hypot(dx, dy);
      const factor = currentDistance / initialTouchDistance;
      zoom = Math.min(3.5, Math.max(0.6, zoom * factor));
      initialTouchDistance = currentDistance;
      if (slider) slider.value = zoom.toFixed(2);
      draw();
    }
  }, { passive: true });

  viewport.addEventListener("touchend", () => {
    isDragging = false;
    initialTouchDistance = 0;
  });

  // Wheel Zoom
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const step = e.deltaY > 0 ? -0.05 : 0.05;
    zoom = Math.min(3.5, Math.max(0.6, zoom + step));
    if (slider) slider.value = zoom.toFixed(2);
    draw();
  }, { passive: false });

  // Slider Input
  slider?.addEventListener("input", (e) => {
    zoom = parseFloat(e.target.value);
    draw();
  });

  $("#crop-zoom-in")?.addEventListener("click", () => {
    zoom = Math.min(3.5, zoom + 0.15);
    if (slider) slider.value = zoom.toFixed(2);
    draw();
  });

  $("#crop-zoom-out")?.addEventListener("click", () => {
    zoom = Math.max(0.6, zoom - 0.15);
    if (slider) slider.value = zoom.toFixed(2);
    draw();
  });

  $("#crop-reset-btn")?.addEventListener("click", resetPosition);

  const cleanupListeners = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const closeModal = () => {
    cleanupListeners();
    modal.close();
    const pfpInput = $("#pfp-file-input");
    if (pfpInput) pfpInput.value = "";
  };

  $("#crop-modal-close")?.addEventListener("click", closeModal);
  $("#crop-cancel-btn")?.addEventListener("click", closeModal);

  // Apply & Save Cropped Photo
  $("#crop-save-btn")?.addEventListener("click", () => {
    if (!img.complete || img.naturalWidth === 0) return;

    const exportSize = 512;
    const outCanvas = document.createElement("canvas");
    outCanvas.width = exportSize;
    outCanvas.height = exportSize;
    const outCtx = outCanvas.getContext("2d");

    const previewDiameter = R * 2;
    const scaleFactor = exportSize / previewDiameter;

    const finalScale = baseScale * zoom * scaleFactor;
    const finalW = img.naturalWidth * finalScale;
    const finalH = img.naturalHeight * finalScale;
    const finalCX = exportSize / 2;
    const finalCY = exportSize / 2;
    const finalX = finalCX + (offsetX * scaleFactor) - finalW / 2;
    const finalY = finalCY + (offsetY * scaleFactor) - finalH / 2;

    outCtx.drawImage(img, finalX, finalY, finalW, finalH);

    outCanvas.toBlob(async (blob) => {
      closeModal();
      if (!blob) {
        toast("Failed to process cropped photo.");
        return;
      }
      startGlobalLoading(true);
      try {
        toast("Uploading cropped profile photo...");
        const croppedFile = new File([blob], "profile-avatar.jpg", { type: "image/jpeg" });
        const url = await api.uploadPhoto(croppedFile);
        await api.saveProfile({ photoURL: url });
        toast("Profile photo updated successfully!");
        route();
      } catch (err) {
        toast(err.message || "Failed to upload photo.");
      } finally {
        stopGlobalLoading();
      }
    }, "image/jpeg", 0.92);
  });
}

// Profile Photo File Selection Listener
document.addEventListener("change", (event) => {
  if (event.target.id === "pfp-file-input") {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Please select an image file (JPEG, PNG, or WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      openPhotoCropper(e.target.result);
    };
    reader.readAsDataURL(file);
  }
});

// Copy GPS Coordinates & Landlord Live GPS Location Capture Listener
document.addEventListener("click", (event) => {
  const copyBtn = event.target.closest("[data-copy-coords]");
  if (copyBtn) {
    const coords = copyBtn.dataset.copyCoords;
    if (coords && navigator.clipboard) {
      navigator.clipboard.writeText(coords).then(() => {
        toast(`GPS coordinates (${coords}) copied! You can paste directly into Grab, Angkas, Maxim, or Google Maps.`);
      }).catch(() => {
        toast("Unable to access clipboard.");
      });
    }
    return;
  }

  const btn = event.target.closest("#btn-capture-landlord-gps");
  if (!btn) return;
  if (!navigator.geolocation) {
    toast("Geolocation is not supported by your browser.");
    return;
  }
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `${icon("crosshair")} <span>Detecting GPS...</span>`;
  refreshIcons();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const latInput = $("#property-lat");
      const lngInput = $("#property-lng");
      if (latInput) latInput.value = lat;
      if (lngInput) lngInput.value = lng;
      if (state.propertyPicker) {
        state.propertyPicker.setCoordinates(lat, lng, "Device GPS Pinpoint");
      }
      const statusText = $("#gps-status-text");
      if (statusText) {
        statusText.innerHTML = `📍 <strong style="color:var(--success);">Live GPS Captured:</strong> ${lat}° N, ${lng}° E <span style="color:var(--text-muted);">(Accuracy: ±${Math.round(pos.coords.accuracy)}m)</span>`;
      }
      toast("Location captured from your device GPS!");
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      refreshIcons();
    },
    (err) => {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      refreshIcons();
      toast(`GPS location request failed (${err.message}). Defaulting to selected barangay coordinates.`);
      const select = $("#property-barangay-select");
      if (select?.value && BARANGAY_COORDINATES[select.value]) {
        const coords = BARANGAY_COORDINATES[select.value];
        const latInput = $("#property-lat");
        const lngInput = $("#property-lng");
        if (latInput) latInput.value = coords[1];
        if (lngInput) lngInput.value = coords[0];
      }
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
});

// Barangay Select Coordinate Sync Listener
document.addEventListener("change", (event) => {
  if (event.target.id === "property-barangay-select") {
    const val = event.target.value;
    if (val && state.propertyPicker) {
      state.propertyPicker.setBarangay(val);
    } else if (val && BARANGAY_COORDINATES[val]) {
      const coords = BARANGAY_COORDINATES[val];
      const latInput = $("#property-lat");
      const lngInput = $("#property-lng");
      const statusText = $("#gps-status-text");
      if (latInput) latInput.value = coords[1];
      if (lngInput) lngInput.value = coords[0];
      if (statusText) {
        statusText.innerHTML = `📍 Coordinates set to <strong>${val}</strong> center (${coords[1]}° N, ${coords[0]}° E). Click button to use exact device GPS.`;
      }
    }
  }
});

// Admin User Real-time Search Listener
document.addEventListener("input", (event) => {
  if (event.target.id === "admin-user-search") {
    const q = event.target.value.toLowerCase().trim();
    document.querySelectorAll(".admin-user-card").forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? "" : "none";
    });
  }
});

// Window listeners
window.addEventListener("hashchange", () => {
  window.scrollTo(0, 0);
  route();
});

document.documentElement.dataset.theme = localStorage.getItem("theme") || "light";

api.watchAuth(async (user, error) => {
  if (error) toast(error.message);
  state.favorites = [];
  if (user && api.profile) {
    try {
      state.favorites = await api.favorites();
    } catch (e) {}
  }
  route();
});

loadListings().then(() => route());

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
