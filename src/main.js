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
  ArrowLeft,
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
  ArrowLeft,
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
  selectedRole: "student",
  domiHistory: [
    {
      role: "domi",
      text: "Kumusta! I am DOMI, your 24/7 AI housing companion for Tuguegarao City. Ask me anything about student boarding houses, campus distances (CSU Carig, Andrews, SPUP, USL), typical rents, or drafting inquiries to landlords!",
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
   LAYOUTS
   ============================================================================== */

// 1. Standalone Authentication Layout (NO SIDEBAR!)
function authLayout(content) {
  return `
    <div class="auth-page">
      <header class="auth-header">
        <a href="#/home" class="auth-brand">
          <span class="brand-icon">${icon("house")}</span>
          Dorm<span>Path</span>
        </a>
        <a href="#/home" class="auth-back-link">
          ${icon("arrow-left")} <span>Back to explore</span>
        </a>
      </header>
      <main class="auth-container">
        ${content}
      </main>
    </div>
  `;
}

// 2. Public Landing Layout (Clean top navbar, full width, NO sidebar)
function publicLayout(content) {
  return `
    <div class="public-layout">
      <header class="public-navbar">
        <div class="public-navbar-inner">
          <a href="#/home" class="auth-brand">
            <span class="brand-icon">${icon("house")}</span>
            Dorm<span>Path</span>
          </a>
          <nav class="nav-links">
            <a href="#/search" class="nav-link">Explore Rooms</a>
            <a href="#/map" class="nav-link">Map View</a>
            <a href="#/wanted" class="nav-link">Kwarto Wanted</a>
            <a href="#/domi" class="nav-link">${icon("sparkles")} Ask DOMI</a>
            <a href="#/about" class="nav-link">How It Works</a>
          </nav>
          <div class="nav-actions">
            <button class="button text-button" data-action="theme" aria-label="Toggle appearance">
              ${icon("sun-moon")}
            </button>
            ${
              api.currentUser
                ? `<a href="#/dashboard" class="button outline small">${icon("layout-dashboard")} Dashboard</a>
                   <a href="#/profile" class="button primary small" style="display:inline-flex; align-items:center; gap:8px;">
                     <span style="width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.25); display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; overflow:hidden;">
                       ${
                         api.currentUser?.photoURL || api.profile?.photoURL
                           ? `<img src="${e(api.currentUser?.photoURL || api.profile?.photoURL)}" style="width:100%; height:100%; object-fit:cover;">`
                           : (api.profile?.name || "U")[0].toUpperCase()
                       }
                     </span>
                     <span>${e(api.profile?.name || "Account")}</span>
                   </a>`
                : `<a href="#/login" class="button text-button">Log in</a>
                   <a href="#/register" class="button primary small">Get started ${icon("arrow-right")}</a>`
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
              <span class="brand-icon">${icon("house")}</span>
              Dorm<span>Path</span>
            </a>
            <p style="font-size:0.875rem; max-width:320px; line-height:1.6;">
              Finding your space in Tuguegarao City made simple, honest, and forever free for students.
            </p>
          </div>
          <div class="footer-col">
            <h4>Discover</h4>
            <ul>
              <li><a href="#/search">Boarding Houses</a></li>
              <li><a href="#/search">Dormitories</a></li>
              <li><a href="#/search">Apartments</a></li>
              <li><a href="#/map">City Map View</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Students</h4>
            <ul>
              <li><a href="#/wanted">Kwarto Wanted</a></li>
              <li><a href="#/about">Student Promise (₱0 Fees)</a></li>
              <li><a href="#/login">Student Login</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Trust & Privacy</h4>
            <ul>
              <li><a href="#/privacy">Data Privacy (RA 10173)</a></li>
              <li><a href="#/terms">Terms of Service</a></li>
              <li><a href="#/register">List Your Property</a></li>
              <li><a href="#/domi">DOMI AI Assistant</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} DormPath. Tuguegarao City, Cagayan, Philippines.</span>
          <span>Zero student booking fees · Verified property owners · RA 10173 Compliant</span>
        </div>
      </footer>
    </div>
  `;
}

// 3. Authenticated Workspace / App Shell (Sidebar + Topbar + Content)
function appLayout(content) {
  const current = location.hash.replace(/^#\/?/, "").split("/")[0] || "dashboard";
  const unreadMessages = state.conversations?.filter(
    (c) =>
      c.lastSender !== api.currentUser?.uid &&
      c.updatedAt?.seconds > (c.readAt?.[api.currentUser?.uid]?.seconds || 0),
  ).length || 0;

  return `
    <div class="app-shell">
      <aside class="app-sidebar">
        <div class="sidebar-header">
          <a href="#/home" class="auth-brand">
            <span class="brand-icon">${icon("house")}</span>
            Dorm<span>Path</span>
          </a>
        </div>

        ${
          api.profile?.role === "landlord"
            ? `
          <div class="sidebar-nav-group">
            <div class="sidebar-caption">LANDLORD PORTAL</div>
            ${navItem("dashboard", "Dashboard", "layout-dashboard")}
            ${navItem("properties", "My Properties", "building-2")}
            ${navItem("add-property", "Add Property", "plus-circle")}
            ${navItem("wanted", "Tenant Demand", "users")}
            <a href="#/messages" class="sidebar-link ${current === "messages" ? "active" : ""}">
              <div class="sidebar-link-left">
                ${icon("messages-square")}
                <span>Student Inquiries</span>
              </div>
              ${unreadMessages > 0 ? `<span class="sidebar-badge-count">${unreadMessages}</span>` : ""}
            </a>
            ${navItem("notifications", "Inquiry Alerts", "bell")}
            ${navItem("profile", "Profile & Settings", "user")}
            ${api.isAdmin ? navItem("admin", "Admin Console", "shield-check") : ""}
          </div>

          <div class="sidebar-nav-group">
            <div class="sidebar-caption">DISCOVER & MARKET</div>
            ${navItem("search", "Market Listings", "search")}
            ${navItem("map", "Tuguegarao Map", "map")}
            ${navItem("domi", "Ask DOMI AI", "sparkles")}
          </div>
        `
            : `
          <div class="sidebar-nav-group">
            <div class="sidebar-caption">FIND HOUSING</div>
            ${navItem("search", "Explore Rooms", "search")}
            ${navItem("map", "Map View", "map")}
            ${navItem("wanted", "Kwarto Wanted", "message-square-plus")}
            ${navItem("domi", "Ask DOMI AI", "sparkles")}
          </div>

          <div class="sidebar-nav-group">
            <div class="sidebar-caption">STUDENT WORKSPACE</div>
            ${navItem("dashboard", "Dashboard", "layout-dashboard")}
            ${navItem("favorites", "Saved Places", "heart")}
            <a href="#/messages" class="sidebar-link ${current === "messages" ? "active" : ""}">
              <div class="sidebar-link-left">
                ${icon("messages-square")}
                <span>Inquiries & Chat</span>
              </div>
              ${unreadMessages > 0 ? `<span class="sidebar-badge-count">${unreadMessages}</span>` : ""}
            </a>
            ${navItem("notifications", "Notifications", "bell")}
            ${navItem("profile", "Profile & Settings", "user")}
            ${api.isAdmin ? navItem("admin", "Admin Console", "shield-check") : ""}
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
                ${e(api.profile?.name || "Neighbor")}
              </strong>
              <span style="font-size:0.6875rem; color:var(--text-muted); text-transform:capitalize;">
                ${e(api.profile?.role || "Student")} · Settings ⚙️
              </span>
            </div>
          </a>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button class="button outline small" style="flex:1;" data-action="theme" title="Toggle theme">
              ${icon("sun-moon")} Appearance
            </button>
            <button class="button outline small" style="color:var(--danger);" data-action="logout" title="Sign out">
              ${icon("log-out")}
            </button>
          </div>
        </div>
      </aside>

      <div class="app-workspace">
        <header class="app-topbar">
          <div class="app-topbar-left">
            <div class="badge badge-outline" style="gap:6px;">
              ${icon("map-pin")} <span>Tuguegarao City, PH</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <a href="#/domi" class="button text-button">
              ${icon("sparkles")} Ask DOMI
            </a>
            ${
              api.profile?.role === "landlord"
                ? `<a href="#/add-property" class="button primary small">${icon("plus")} Add Property</a>`
                : ""
            }
          </div>
        </header>

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
        <a href="#/home" class="${current === "home" ? "active" : ""}">
          ${icon("compass")} <span>Home</span>
        </a>
        <a href="#/search" class="${current === "search" ? "active" : ""}">
          ${icon("search")} <span>Search</span>
        </a>
        <a href="#/domi" class="${current === "domi" ? "active" : ""}">
          ${icon("sparkles")} <span>DOMI AI</span>
        </a>
        <a href="#/favorites" class="${current === "favorites" ? "active" : ""}">
          ${icon("heart")} <span>Saved</span>
        </a>
        <a href="#/messages" class="${current === "messages" ? "active" : ""}">
          ${icon("messages-square")} <span>Chat</span>
        </a>
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
            Join thousands of students and verified landlords connecting directly across Tuguegarao City.
          </p>

          <div class="auth-mascot-card">
            <img src="/domi.png" alt="DOMI AI Mascot">
            <div>
              <strong>DOMI is here to help!</strong>
              <span>Get instant answers on room budgets, move-in deposits, and amenities.</span>
            </div>
          </div>
        </div>

        <div class="auth-trust-list">
          <div class="auth-trust-item">
            ${icon("shield-check")} <span>Admin-verified property owners</span>
          </div>
          <div class="auth-trust-item">
            ${icon("message-circle")} <span>Direct student-to-owner private messaging</span>
          </div>
          <div class="auth-trust-item">
            ${icon("sparkles")} <span>Always 100% free for students (₱0 booking fees)</span>
          </div>
        </div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-form-header">
          <h2>${register ? "Create your account" : "Welcome back"}</h2>
          <p class="text-secondary">
            ${register ? "Sign up in 30 seconds to start discovering rooms." : "Sign in to continue to your DormPath dashboard."}
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
                <div class="role-card ${state.selectedRole === "student" ? "selected" : ""}" data-role-select="student">
                  <div class="role-card-header">
                    <strong>🎓 Student / Renter</strong>
                    <div class="role-check">${state.selectedRole === "student" ? icon("check") : ""}</div>
                  </div>
                  <p>Browse spaces, message owners, and post room requests.</p>
                </div>
                <div class="role-card ${state.selectedRole === "landlord" ? "selected" : ""}" data-role-select="landlord">
                  <div class="role-card-header">
                    <strong>🏠 Property Owner</strong>
                    <div class="role-check">${state.selectedRole === "landlord" ? icon("check") : ""}</div>
                  </div>
                  <p>List rooms and receive verified inquiries (verification required).</p>
                </div>
              </div>
              <input type="hidden" name="role" id="auth-role-input" value="${state.selectedRole}">
              
              <label>Full name
                <input name="name" required maxlength="80" autocomplete="name" placeholder="Maria Santos">
              </label>
            `
              : ""
          }

          <label>Email address
            <input name="email" type="email" required autocomplete="email" placeholder="you@example.com">
          </label>

          <label class="password-field">Password
            <input name="password" id="auth-password" type="password" required minlength="8" autocomplete="${register ? "new-password" : "current-password"}" placeholder="At least 8 characters">
            <button type="button" class="password-toggle-btn" data-action="toggle-password" aria-label="Toggle password visibility">
              ${icon("eye")}
            </button>
          </label>

          ${
            !register
              ? `<div style="display:flex; justify-content:flex-end; margin:-6px 0 16px;">
                  <button type="button" class="button text-button small" data-action="reset-password">Forgot password?</button>
                 </div>`
              : ""
          }

          <button class="button primary full large" type="submit" style="margin-top:8px;">
            ${register ? "Create Account" : "Sign In"} ${icon("arrow-right")}
          </button>

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

        <form id="search-form" class="hero-search-card">
          <div class="hero-search-field">
            <span>Location</span>
            <input name="q" placeholder="Barangay, school, or landmark..." value="${e(state.filters.q || "")}">
          </div>
          <div class="hero-search-divider"></div>
          <div class="hero-search-field">
            <span>Monthly Budget</span>
            <select name="budget">
              <option value="">Any budget</option>
              <option value="2000" ${Number(state.filters.budget) === 2000 ? "selected" : ""}>Up to ₱2,000</option>
              <option value="3500" ${Number(state.filters.budget) === 3500 ? "selected" : ""}>Up to ₱3,500</option>
              <option value="5000" ${Number(state.filters.budget) === 5000 ? "selected" : ""}>Up to ₱5,000</option>
              <option value="8000" ${Number(state.filters.budget) === 8000 ? "selected" : ""}>Up to ₱8,000</option>
            </select>
          </div>
          <div class="hero-search-divider"></div>
          <div class="hero-search-field">
            <span>Space Type</span>
            <select name="type">
              <option value="">All space types</option>
              ${TYPES.map((t) => `<option value="${t}" ${state.filters.type === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>
          </div>
          <button class="button primary" type="submit">
            ${icon("search")} <span>Find Rooms</span>
          </button>
        </form>

        <div class="hero-campus-chips">
          <span>NEAR CAMPUS:</span>
          ${["University of Saint Louis", "CSU Carig", "CSU Andrews", "St. Paul University"]
            .map((s) => `<button type="button" class="campus-chip" data-school="${e(s)}">${s}</button>`)
            .join("")}
        </div>
      </div>

      <div class="hero-graphic">
        <div class="hero-graphic-bg"></div>
        <img src="/domi.png" alt="DOMI AI Mascot" class="hero-mascot-img">
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
            <strong>100% Free for Students</strong>
            <span>Direct contact & chat</span>
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
            <span>Identity confirmed before publishing</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box">${icon("clock")}</div>
          <div>
            <strong>Live Vacancies</strong>
            <span>Reported directly by property owners</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box">${icon("sparkles")}</div>
          <div>
            <strong>DOMI AI Helper</strong>
            <span>Smart budget advice & message drafts</span>
          </div>
        </div>
      </div>
    </section>

    <section class="landing-section">
      <div class="section-head">
        <div class="section-head-text">
          <div class="overline">AVAILABLE SPACES</div>
          <h2>Featured places to call home</h2>
        </div>
        <a href="#/search" class="button outline small">Explore all ${icon("arrow-right")}</a>
      </div>
      ${listingArea(state.properties.slice(0, 6))}
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
          <button type="button" class="category-card" data-type="${type}">
            <div class="category-icon">${icon(iconName)}</div>
            <div>
              <strong>${type}</strong>
              <span>${desc}</span>
            </div>
          </button>
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
      <div class="domi-spotlight-card">
        <div class="domi-spotlight-avatar">
          <img src="/domi.png" alt="DOMI AI">
        </div>
        <div class="domi-spotlight-text">
          <h2>Meet DOMI, your smart housing companion</h2>
          <p>Not sure where to start? Ask DOMI to recommend rooms matching your budget, explain typical advance deposits in Tuguegarao, or help you draft a friendly inquiry message.</p>
        </div>
        <button class="button primary large" data-action="domi" style="background:white; color:var(--navy);">
          ${icon("sparkles")} Ask DOMI
        </button>
      </div>
    </section>

    <section class="landing-section">
      <div class="section-head" style="text-align:center; display:block; margin-bottom:40px;">
        <div class="overline">FREQUENTLY ASKED QUESTIONS</div>
        <h2>Everything you need to know</h2>
      </div>
      <div class="faq-grid">
        <details class="faq-item">
          <summary>Is DormPath really 100% free for students? ${icon("chevron-down")}</summary>
          <p>Yes! Students can browse listings, save favorites, post room requests, and message property owners without paying any subscription or booking commission fees.</p>
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
          <span class="card-verified-tag">${icon("shield-check")} Verified</span>
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
      `<a class="button outline" href="#/wanted">Post a Kwarto Wanted Request ${icon("arrow-right")}</a>`,
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
  const saved = state.favorites.some((f) => f.propertyId === p.id);

  return `
    <div class="detail-container">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
          <div class="overline">${e(p.barangay)} · TUGUEGARAO CITY</div>
          <h1>${e(p.title)}</h1>
          <p style="display:flex; align-items:center; gap:6px; margin-top:4px;">
            ${icon("map-pin")} ${e(p.address)}
          </p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="button outline ${saved ? "saved" : ""}" data-save="${e(p.id)}">
            ${icon("heart")} <span>${saved ? "Saved" : "Save"}</span>
          </button>
          <a class="button outline" href="https://www.openstreetmap.org/directions?to=${Number(p.lat)},${Number(p.lng)}" target="_blank" rel="noopener">
            ${icon("navigation")} Directions
          </a>
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
            <button class="button text-button small" data-report="${e(p.id)}" style="color:var(--text-muted);">
              ${icon("flag")} Report listing
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
            <p>Manage your boarding houses, live vacancies, and direct student inquiries.</p>
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
              <span>Live Available Beds</span>
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
              <span>Student Inquiries</span>
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
                Get your boarding house or apartment in front of hundreds of students in Tuguegarao City.
              </p>
              <a href="#/add-property" class="button primary">${icon("plus")} Add Your First Property</a>
            </div>
          `
          }
        </div>
      </div>
    `;
  }

  // Student Dashboard
  const favs = await api.favorites();
  return `
    <div>
      <div style="margin-bottom:28px;">
        <div class="overline">STUDENT HOUSING WORKSPACE</div>
        <h2>Welcome back, ${e(api.profile?.name || "Student")} 👋</h2>
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
            <span>Student Platform Fees</span>
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
            ${icon("map")} Map View
          </a>
          <a href="#/wanted" class="button outline">
            ${icon("message-square-plus")} Kwarto Wanted
          </a>
          <a href="#/domi" class="button outline">
            ${icon("sparkles")} Ask DOMI AI
          </a>
        </div>
      </div>
    </div>
  `;
}

// Redesigned Search & Map Page
function searchPage(mapView = false) {
  const items = filterProperties(state.properties, state.filters);
  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <div>
          <div class="overline">EXPLORE TUGUEGARAO</div>
          <h2>${mapView ? "Interactive Map View" : "Available Rooms & Dorms"}</h2>
          <p>${items.length} verified space${items.length === 1 ? "" : "s"} found</p>
        </div>
        <div style="display:flex; gap:8px;">
          <a href="#/search" class="button ${!mapView ? "primary" : "outline"} small">
            ${icon("layout-grid")} List
          </a>
          <a href="#/map" class="button ${mapView ? "primary" : "outline"} small">
            ${icon("map")} Map
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

      ${mapView ? '<div id="map" style="height:550px; border-radius:var(--radius-xl); border:1px solid var(--border);"></div>' : listingArea(items)}
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
            <div style="display:flex; gap:8px;">
              ${selected.studentId === api.currentUser.uid ? button("Request viewing", "viewing", "button outline small") : ""}
              <button class="button text-button small" data-action="block">Block</button>
            </div>
          </header>
          <div id="viewings" style="padding:8px 24px;"></div>
          <div id="messages" class="chat-messages-area">
            <p class="text-muted" style="text-align:center;">Loading conversation...</p>
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
        <div style="font-size:0.6875rem; opacity:0.8; margin-top:4px; text-align:right;">
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

// Redesigned Kwarto Wanted Page
async function wantedPage() {
  const reqs = api.configured ? await api.requests() : [];
  state.requests = reqs;
  const isLandlord = api.profile?.role === "landlord";

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <div>
          <div class="overline">${isLandlord ? "TENANT DEMAND FEED" : "KWARTO WANTED"}</div>
          <h2>${isLandlord ? `Student Room Requests (${reqs.length})` : "Student Room Requests"}</h2>
          <p>${isLandlord ? "Review what students in Tuguegarao are looking for and submit matching room offers." : "Share what you are looking for so verified landlords can reach out."}</p>
        </div>
        ${
          isLandlord
            ? `<div class="badge badge-success" style="padding:8px 14px; font-weight:700;">${icon("home")} Landlord Offer Mode</div>`
            : `<button class="button primary" data-action="new-request">${icon("plus")} Post a Request</button>`
        }
      </div>

      <div class="property-grid">
        ${
          reqs.length
            ? reqs
                .map(
                  (r) => `
              <div class="detail-section" style="margin-bottom:0;">
                <div class="badge badge-outline" style="margin-bottom:10px;">Looking for ${e(r.type)}</div>
                <h3 style="margin-bottom:6px;">${e(r.location)}</h3>
                <div style="font-size:1.125rem; font-weight:800; color:var(--primary); margin-bottom:12px;">
                  Up to ${money(r.budget)} / month
                </div>
                <p style="font-size:0.875rem; margin-bottom:8px;">${e(r.notes || "No extra notes specified.")}</p>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:14px;">
                  By ${e(r.name)} · Move in: ${e(r.moveIn)} · ${r.occupants} occupant(s)
                </div>
                ${
                  r.userId === api.currentUser?.uid
                    ? `<button class="button outline small" data-close-request="${r.id}" style="color:var(--danger); border-color:var(--danger);">${icon("x")} Close request</button>`
                    : isLandlord
                      ? `<button class="button primary small" data-offer="${r.id}">${icon("send")} Offer a room</button>`
                      : ""
                }
              </div>
            `,
                )
                .join("")
            : `<div style="grid-column:1/-1;">${empty("No active requests yet", "Post what kind of room and budget you need to help local owners find you.")}</div>`
        }
      </div>
    </div>
  `;
}

// Redesigned Profile & Account Settings Page
async function profilePage() {
  const pfp = api.currentUser?.photoURL || api.profile?.photoURL || "";
  const initial = (api.profile?.name || "U")[0].toUpperCase();
  const isStudent = api.profile?.role === "student";
  const isLandlord = api.profile?.role === "landlord";
  const emailVerified = api.currentUser?.emailVerified;

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
              JPEG, PNG, or WebP under 10 MB. Profile photos help landlords and students recognize each other.
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
            isStudent
              ? `
            <label style="margin-top:12px;">Preferred School / Campus in Tuguegarao
              <input name="school" maxlength="120" value="${e(api.profile?.school || "")}" placeholder="e.g., Cagayan State University, SPUP, USL">
            </label>
            <label style="margin-top:12px;">Bio & Roommate Preferences
              <textarea name="bio" rows="3" maxlength="500" placeholder="Brief note about yourself, your year/course, study habits, or preferred room type...">${e(api.profile?.bio || "")}</textarea>
            </label>
          `
              : ""
          }

          <div style="margin:20px 0 16px; padding:12px 16px; background:var(--bg-subtle); border-radius:var(--radius-md); font-size:0.875rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div>
              Platform Role: <strong style="text-transform:capitalize;">${e(api.profile?.role || "student")}</strong>
              ${api.profile?.verified ? ` · <span class="admin-badge badge-verified">${icon("shield-check")} Verified Landlord</span>` : ""}
              ${api.isAdmin ? ` · <span class="admin-badge badge-you">${icon("shield-check")} Administrator</span>` : ""}
            </div>
            ${
              isLandlord && !api.profile?.verified
                ? `<span style="font-size:0.75rem; color:var(--text-muted);">Verification review is in progress by admins.</span>`
                : ""
            }
          </div>

          <button class="button primary" type="submit">
            Save Changes
          </button>
        </form>
      </div>

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

      <!-- Account Session -->
      <div class="profile-card" style="border-color:#fecaca;">
        <div class="profile-section-heading" style="color:var(--danger);">
          ${icon("log-out")} Account Session
        </div>
        <p style="color:var(--text-secondary); font-size:0.875rem; margin-bottom:16px;">
          Signing out will end your current session on this device.
        </p>
        <button class="button outline" data-action="logout" style="color:var(--danger); border-color:var(--danger);">
          ${icon("log-out")} Sign out
        </button>
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

// Redesigned Property Form (Add / Edit)
function propertyForm(p = {}) {
  return `
    <div style="max-width:800px;">
      <div style="margin-bottom:24px;">
        <div class="overline">LISTING EDITOR</div>
        <h2>${p.id ? "Edit Property" : "Add New Property"}</h2>
      </div>

      <form id="property-form" data-id="${e(p.id || "")}" class="detail-section">
        <label>Property title
          <input name="title" required maxlength="120" value="${e(p.title || "")}" placeholder="e.g. Green Dormitory Centro">
        </label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <label>Barangay
            <input name="barangay" required maxlength="100" value="${e(p.barangay || "")}" placeholder="e.g. Centro 01">
          </label>
          <label>Nearby school / campus
            <input name="school" maxlength="120" value="${e(p.school || "")}" placeholder="e.g. USL or CSU">
          </label>
        </div>
        <label>Full street address
          <input name="address" required maxlength="250" value="${e(p.address || "")}" placeholder="123 Rizal St...">
        </label>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px;">
          <label>Starting monthly rent (₱)
            <input name="minPrice" type="number" min="0" max="1000000" required value="${p.minPrice ?? ""}">
          </label>
          <label>Security deposit (₱)
            <input name="deposit" type="number" min="0" max="1000000" required value="${p.deposit ?? 0}">
          </label>
          <label>Advance payment (₱)
            <input name="advance" type="number" min="0" max="1000000" required value="${p.advance ?? 0}">
          </label>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <label>Latitude
            <input name="lat" type="number" step="any" min="-90" max="90" required value="${p.lat ?? 17.6132}">
          </label>
          <label>Longitude
            <input name="lng" type="number" step="any" min="-180" max="180" required value="${p.lng ?? 121.727}">
          </label>
        </div>
        <label>Full description
          <textarea name="description" required maxlength="4000">${e(p.description || "")}</textarea>
        </label>
        <label>Utilities policy
          <textarea name="utilities" required maxlength="1000" placeholder="Water, electricity, wifi details...">${e(p.utilities || "")}</textarea>
        </label>
        <label>House rules
          <textarea name="rules" required maxlength="2000" placeholder="Curfew, visitor policy, laundry rules...">${e(p.rules || "")}</textarea>
        </label>

        <fieldset style="border:none; margin:16px 0;">
          <legend style="font-weight:700; font-size:0.875rem; margin-bottom:10px;">Room types offered</legend>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            ${TYPES.map((t) => `<label class="check"><input type="checkbox" name="roomTypes" value="${t}" ${p.roomTypes?.includes(t) ? "checked" : ""}> ${t}</label>`).join("")}
          </div>
        </fieldset>

        <fieldset style="border:none; margin:16px 0;">
          <legend style="font-weight:700; font-size:0.875rem; margin-bottom:10px;">Available amenities</legend>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            ${AMENITIES.map((a) => `<label class="check"><input type="checkbox" name="amenities" value="${a}" ${p.amenities?.includes(a) ? "checked" : ""}> ${a}</label>`).join("")}
          </div>
        </fieldset>

        <label>Photos (Upload up to 8 WebP, PNG, or JPEG images)
          <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple>
        </label>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
          ${(p.photos || []).map((url) => `<label style="display:inline-flex; align-items:center; gap:6px;"><img src="${e(url)}" style="width:60px; height:60px; object-fit:cover; border-radius:6px;"><input name="keepPhotos" type="checkbox" value="${e(url)}" checked> Keep</label>`).join("")}
        </div>

        <button class="button primary large full" type="submit">
          Save Property for Review ${icon("arrow-right")}
        </button>
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
  const allowed = ["users", "properties", "reports", "auditLogs"];
  if (!allowed.includes(tab)) tab = "users";
  const data = await api.adminList(tab);

  return `
    <div class="admin-shell">
      <div class="admin-header">
        <div class="admin-title-area">
          <div class="overline">PLATFORM GOVERNANCE</div>
          <h2>${icon("shield-check")} Admin Console</h2>
          <p style="color:var(--text-secondary); font-size:0.875rem; margin-top:4px;">
            Supervise user identities, moderate boarding house listings, and resolve student safety reports.
          </p>
        </div>
      </div>

      <!-- Admin Tabs Navigation -->
      <div class="admin-tabs-nav">
        <a href="#/admin/users" class="admin-tab-link ${tab === "users" ? "active" : ""}">
          ${icon("users")} User Accounts
          <span class="admin-tab-count">${tab === "users" ? data.length : "•"}</span>
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
            <button type="button" class="admin-filter-chip" data-user-filter="student">Students (${data.filter((u) => u.role === "student").length})</button>
            <button type="button" class="admin-filter-chip" data-user-filter="unverified">Pending Landlords (${data.filter((u) => u.role === "landlord" && !u.verified).length})</button>
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
                    const isStudent = r.role === "student";
                    const initial = (r.name || "U")[0].toUpperCase();

                    return `
                <div class="admin-user-card ${r.disabled ? "is-suspended" : ""}" data-role="${e(r.role || "student")}" data-verified="${r.verified ? "true" : "false"}" data-disabled="${r.disabled ? "true" : "false"}">
                  <div class="admin-user-profile">
                    <div class="admin-avatar ${isLandlord ? "landlord" : "student"}">
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
                            : `<span class="admin-badge badge-student">🎓 Student Member</span>`
                        }
                        ${
                          isLandlord
                            ? r.verified
                              ? `<span class="admin-badge badge-verified">${icon("shield-check")} Verified Owner</span>`
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
                      isLandlord
                        ? !r.verified
                          ? `<button class="button small btn-verify-success" data-verify="${r.id}:true">
                              ${icon("shield-check")} Verify Owner
                            </button>`
                          : `<button class="button outline small" style="color:var(--text-secondary);" data-verify="${r.id}:false" title="Revoke verified owner badge">
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
        DormPath connects students with verified local property owners in Tuguegarao City without middleman fees.
      </p>

      <div class="detail-section">
        <h3>Our Promise to Students</h3>
        <p>Browse without an account. Join free to save places, message owners, and post room requests. No student subscriptions, platform booking markups, or messaging charges.</p>
        <h3 style="margin-top:20px;">Verified Owners & Accurate Vacancies</h3>
        <p>Owner badges are granted after manual identity review. Vacancies carry timestamps so you always know when availability was last updated.</p>
      </div>
    </div>
  `;
}

// Republic Act No. 10173 Compliant Data Privacy Policy
function privacyPage() {
  return `
    <div class="policy-page">
      <div class="policy-card">
        <div class="policy-badge">${icon("shield-check")} Republic Act No. 10173 Compliant</div>
        <h1>Data Privacy Policy</h1>
        <p style="color:var(--text-secondary); margin-top:8px;">
          Last updated: October 2026 · Tuguegarao City, Cagayan, Philippines
        </p>

        <div class="policy-callout">
          <strong>Our Core Student Guarantee (₱0 Fees, Zero Data Selling):</strong>
          <p style="margin-top:6px; font-size:0.875rem;">
            DormPath is a student-first public service platform. We NEVER sell, lease, or monetize your personal information to third-party data brokers or advertisers. Browse without tracking, search without sign-up.
          </p>
        </div>

        <div class="policy-section">
          <h3>1. Scope and Legal Basis</h3>
          <p>
            DormPath operates in full compliance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the Republic of the Philippines and its Implementing Rules and Regulations (IRR). This policy describes how we collect, protect, process, and respect the privacy rights of students, renters, and property owners in Tuguegarao City.
          </p>
        </div>

        <div class="policy-section">
          <h3>2. Information We Collect</h3>
          <ul>
            <li><strong>Student & Renter Accounts:</strong> Display name, email address, and optional saved bookmarks/preferences. We do not require or collect student payment cards or sensitive personal financial data.</li>
            <li><strong>Property Owner / Landlord Accounts:</strong> Contact details, property titles, physical street addresses, and proof of ownership / barangay verification documents.</li>
            <li><strong>Direct In-Platform Messages:</strong> Securely transmitted conversations between students and landlords solely for arranging inquiries and viewings.</li>
            <li><strong>Technical Telemetry:</strong> Minimal session tokens, device viewport characteristics, and offline cache preferences stored locally in your browser.</li>
          </ul>
        </div>

        <div class="policy-section">
          <h3>3. Confidential Landlord Verification Documents</h3>
          <p>
            Government-issued identification cards and barangay verification records uploaded by property owners are subject to strict data compartmentalization. These files are encrypted at rest, accessible strictly by authenticated platform administrators for identity audit, and are <strong>NEVER displayed publicly</strong> or shared with other users.
          </p>
        </div>

        <div class="policy-section">
          <h3>4. Data Security & Storage Architecture</h3>
          <p>
            Your information is protected through multi-layered industry safeguards:
          </p>
          <ul>
            <li><strong>Cryptographic Authorization:</strong> Authentication is verified via Firebase Identity Platform with short-lived JSON Web Tokens (JWT).</li>
            <li><strong>Row-Level Firestore Security Rules:</strong> Unauthenticated reads or writes to private chats, reports, or verification queues are rejected at the database level.</li>
            <li><strong>HMAC-SHA256 Signed Uploads:</strong> Media uploads through Cloudinary require cryptographic server-side signatures; anonymous write access is blocked.</li>
            <li><strong>HTTPS & Content Security:</strong> Enforced TLS 1.3 encryption, Content Security Policies (CSP), and Strict-Transport-Security.</li>
          </ul>
        </div>

        <div class="policy-section">
          <h3>5. Anti-Phishing & Anti-Scam Protection</h3>
          <div class="policy-callout" style="border-left-color:var(--danger);">
            <strong>Protect Yourself from Fraud:</strong>
            <ul style="margin:8px 0 0 16px; font-size:0.875rem;">
              <li>DormPath administrators will <strong>NEVER</strong> contact you asking for your password, OTP, or advance reservation fees.</li>
              <li>Always inspect rooms physically in Tuguegarao before transferring security deposits.</li>
              <li>Only transact with landlords displaying the official <strong>Verified Owner</strong> badge.</li>
            </ul>
          </div>
        </div>

        <div class="policy-section">
          <h3>6. Your Rights as a Data Subject</h3>
          <p>Under the Philippine Data Privacy Act of 2012, you possess the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of all personal information DormPath holds about you.</li>
            <li><strong>Rectification:</strong> Correct or update any inaccurate profile details at any time in your Settings.</li>
            <li><strong>Erasure / Deletion:</strong> Permanently delete your account, saved favorites, and associated messages.</li>
            <li><strong>Data Portability:</strong> Clear or export your cached offline storage via the Profile settings tab.</li>
          </ul>
        </div>

        <div class="policy-section">
          <h3>7. Contact Our Data Protection Officer</h3>
          <p>
            For any questions, verification inquiries, or data privacy requests, contact the DormPath administration team at:
            <br><strong>privacy@dormpath.ph</strong> · Tuguegarao City, Cagayan Valley, 3500.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Community Terms of Service & Housing Rules
function termsPage() {
  return `
    <div class="policy-page">
      <div class="policy-card">
        <div class="policy-badge">${icon("heart-handshake")} Community Trust</div>
        <h1>Terms of Service</h1>
        <p style="color:var(--text-secondary); margin-top:8px;">
          Fair, honest, and safe housing for Tuguegarao City
        </p>

        <div class="policy-section">
          <h3>1. The DormPath Community Standard</h3>
          <p>
            DormPath was created to make finding a home near Cagayan State University (Carig & Andrews), University of Saint Louis, St. Paul University Philippines, and other local schools safe, transparent, and respectful.
          </p>
        </div>

        <div class="policy-section">
          <h3>2. Honest Vacancy Policy for Landlords</h3>
          <p>
            Property owners listing boarding houses, dormitories, or apartments must:
          </p>
          <ul>
            <li>Accurately update room availability and total capacity numbers.</li>
            <li>Disclose real monthly rental rates, security deposits, and advance payments without hidden platform fees.</li>
            <li>Clearly specify utilities policies (e.g. Wi-Fi inclusion, electricity sub-meters for air conditioning).</li>
            <li>Never post fake listings, fabricated photos, or misleading room types.</li>
          </ul>
        </div>

        <div class="policy-section">
          <h3>3. Zero Student Fees</h3>
          <p>
            Students browse, filter, save, and message landlords completely free of charge. DormPath charges no transaction fees, viewing commissions, or booking markups.
          </p>
        </div>

        <div class="policy-section">
          <h3>4. Safety & Tenancy Guidelines</h3>
          <p>
            All agreements, room rentals, and security deposits are established directly between the student and the property owner. Students are strongly advised to perform a physical ocular inspection of the premises and request an official written receipt or contract prior to paying any deposit.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Dedicated DOMI AI Assistant Page (Unlimited Turns)
function domiPage() {
  const messagesHtml = (state.domiHistory || [])
    .map((m) => {
      const isUser = m.role === "user";
      return `
        <div class="domi-msg ${isUser ? "user" : "domi"}">
          ${
            !isUser
              ? `<div class="domi-msg-avatar"><img src="/domi.png" alt="DOMI AI" /></div>`
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
    <div class="domi-chat-wrapper">
      <div class="domi-chat-header">
        <div class="domi-header-left">
          <img src="/domi.png" class="domi-header-mascot" alt="DOMI Mascot" />
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <h2 style="font-size:1.25rem;">DOMI AI Assistant</h2>
              <span class="badge badge-success" style="font-size:0.6875rem;">Online · Unlimited</span>
            </div>
            <p style="font-size:0.8125rem; color:var(--text-secondary); margin-top:2px;">
              Your 24/7 Tuguegarao housing companion · Powered by real verified listings
            </p>
          </div>
        </div>
        <button class="button outline small" data-action="clear-domi" title="Reset chat history">
          ${icon("trash-2")} Reset
        </button>
      </div>

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
          placeholder="Ask DOMI anything about rooms, budgets, or landlords in Tuguegarao..."
          required
          autocomplete="off"
        />
        <button class="button primary" type="submit" aria-label="Send question">
          ${icon("sparkles")} <span>Send</span>
        </button>
      </form>
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
    state.more = Boolean(res.cursor);
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
  unsubscribe();
  unsubscribe = () => {};

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
    "wanted",
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

  try {
    switch (page) {
      case "home":
        innerHTML = home();
        break;
      case "search":
      case "map":
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
        innerHTML = await wantedPage();
        break;
      case "dashboard":
        innerHTML = await dashboard();
        break;
      case "properties":
        innerHTML = await propertiesPage();
        break;
      case "add-property":
      case "edit-property":
        innerHTML =
          api.profile?.role === "landlord"
            ? propertyForm(id ? await api.getProperty(id) : {})
            : empty("Landlord account required", "A landlord/owner account is required to list properties.");
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
    } else if (isPublic && !api.currentUser) {
      $("#app").innerHTML = publicLayout(innerHTML);
    } else {
      $("#app").innerHTML = appLayout(innerHTML);
    }

    refreshIcons();

    if (page === "domi") {
      const stream = $("#domi-chat-stream");
      if (stream) stream.scrollTop = stream.scrollHeight;
      $("#domi-chat-input")?.focus();
    }

    if (page === "map") await mountMap();

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
  } catch (err) {
    if (version === routeVersion) {
      if (err.message?.includes("sign in")) {
        location.hash = "/login";
        toast("Please sign in to continue.");
        return;
      }
      $("#app").innerHTML = `<div style="padding:40px; text-align:center;">${empty("Error loading page", e(err.message), button("Try Again", "retry"))}</div>`;
      refreshIcons();
    }
  }
}

async function mountMap() {
  const L = await import("leaflet");
  if (!$("#map")) return;
  map = L.map("map").setView([17.6132, 121.727], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  filterProperties(state.properties, state.filters).forEach((p) => {
    if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
      L.marker([p.lat, p.lng])
        .addTo(map)
        .bindPopup(`<a href="#/property/${e(p.id)}"><strong>${e(p.title)}</strong></a><br>${p.available} space(s) available`);
    }
  });
}

/* ==============================================================================
   GLOBAL EVENT DELEGATION
   ============================================================================== */
document.addEventListener("click", async (event) => {
  const el = event.target.closest("button, [data-action], [data-role-select], [data-school], [data-type], [data-save], [data-close-request], [data-offer], [data-send-offer], [data-status], [data-delete-property], [data-room], [data-occupy], [data-vacate], [data-verify], [data-suspend], [data-moderate], [data-report], [data-confirm-viewing], [data-user-filter], .domi-chip");
  if (!el) return;

  // DOMI prompt chip clicked
  const chip = el.closest(".domi-chip");
  if (chip) {
    const q = chip.dataset.ask;
    const inp = $("#domi-chat-input");
    if (inp) {
      inp.value = q;
      inp.focus();
      $("#domi-chat-form")?.requestSubmit();
    }
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

  // Close Student Room Request
  if (el.dataset.closeRequest) {
    try {
      await api.closeRequest(el.dataset.closeRequest);
      toast("Room request closed.");
      route();
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  // Landlord Room Offer to Student Request
  if (el.dataset.offer) {
    const req = state.requests?.find((r) => r.id === el.dataset.offer);
    if (!req) return;
    try {
      const props = await api.ownProperties().catch(() => []);
      if (!props.length) {
        modal(`
          <div style="text-align:center; padding:16px;">
            <div style="font-size:2.5rem; margin-bottom:12px;">🏠</div>
            <h3>No Properties Listed Yet</h3>
            <p style="margin:10px 0 20px; color:var(--text-secondary); font-size:0.875rem;">
              You need an active property listing before you can send direct room offers to students.
            </p>
            <a href="#/add-property" class="button primary" onclick="$('#modal')?.close()">Add a Property</a>
          </div>
        `);
        return;
      }
      modal(`
        <div>
          <h3>Send Room Offer</h3>
          <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:16px;">
            Select which property to offer to <strong>${e(req.name)}</strong> (${e(req.location)} · budget up to ${money(req.budget)}):
          </p>
          <div style="display:grid; gap:10px;">
            ${props
              .map(
                (p) => `
              <button class="button outline" data-send-offer="${p.id}:${req.userId}" style="text-align:left; justify-content:flex-start; padding:14px; display:flex; width:100%; gap:12px; align-items:center;">
                <div style="flex:1;">
                  <strong style="color:var(--text-primary); font-size:0.9375rem;">${e(p.title)}</strong>
                  <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;">
                    ${e(p.barangay)} · Rent from ₱${p.minPrice.toLocaleString()}/mo · ${p.available} vacancies available
                  </div>
                </div>
                <span class="button primary small" style="pointer-events:none;">Send Offer</span>
              </button>
            `,
              )
              .join("")}
          </div>
        </div>
      `);
    } catch (err) {
      toast(err.message);
    }
    return;
  }

  // Send Offer via Direct Messenger
  if (el.dataset.sendOffer) {
    const [propId, studentId] = el.dataset.sendOffer.split(":");
    try {
      const prop = await api.getProperty(propId);
      const convId = await api.startConversation(prop, studentId);
      await api.sendMessage(
        convId,
        `Hello! I saw your room request on Kwarto Wanted. I have vacancies available at ${prop.title} (${prop.barangay}) matching your budget and preferences. Feel free to ask any questions or schedule a viewing!`,
      );
      $("#modal")?.close();
      toast("Room offer sent via Messenger!");
      location.hash = `/messages/${convId}`;
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

  // Admin Verification Toggle (true/false)
  if (el.dataset.verify) {
    const parts = el.dataset.verify.split(":");
    const uid = parts[0];
    const isVerifying = parts[1] !== "false";
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
      else if (filter === "student") show = role === "student";
      else if (filter === "unverified") show = role === "landlord" && !verified;
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

  // Report Listing
  if (el.dataset.report) {
    const propId = el.dataset.report;
    modal(`
      <form id="report-form" data-property="${e(propId)}">
        <h3>Report Listing</h3>
        <p style="font-size:0.875rem; margin-bottom:12px; color:var(--text-secondary);">Help keep DormPath safe. Please specify the issue with this listing.</p>
        <label>Reason
          <textarea name="reason" required placeholder="e.g. Inaccurate photos, false pricing, suspicious deposit request..." style="min-height:100px;"></textarea>
        </label>
        <button class="button primary full" style="margin-top:12px;">Submit Report</button>
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
      try {
        await api.loginWithGoogle(state.selectedRole || "student");
        location.hash = "/dashboard";
      } catch (err) {
        const msg = formatAuthError(err);
        if (msg) toast(msg);
      }
      break;
    }
    case "logout":
      await api.logout();
      state.favorites = [];
      location.hash = "/home";
      break;
    case "domi":
      location.hash = "/domi";
      break;
    case "clear-domi":
      state.domiHistory = [
        {
          role: "domi",
          text: "Kumusta! I am DOMI, your 24/7 AI housing companion for Tuguegarao City. Ask me anything about student boarding houses, campus distances (CSU Carig, Andrews, SPUP, USL), typical rents, or drafting inquiries to landlords!",
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
    case "new-request":
      modal(`
        <form id="request-form">
          <h2>Post a Room Request</h2>
          <label>Preferred area / barangay
            <input name="location" required placeholder="e.g. Near USL or Centro">
          </label>
          <label>Monthly budget (₱)
            <input name="budget" type="number" required placeholder="3000">
          </label>
          <label>Space type
            <select name="type">${TYPES.map((t) => `<option>${t}</option>`).join("")}</select>
          </label>
          <label>Move-in date
            <input name="moveIn" type="date" required value="${new Date().toISOString().split("T")[0]}">
          </label>
          <label>Number of occupants
            <input name="occupants" type="number" min="1" max="10" value="1" required>
          </label>
          <label>Additional details
            <textarea name="notes" placeholder="Quiet study area, prefer female-only..."></textarea>
          </label>
          <button class="button primary full" style="margin-top:12px;">Publish Request</button>
        </form>
      `);
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
  const data = new FormData(form);
  const values = Object.fromEntries(data);

  try {
    switch (form.id) {
      case "login":
        await api.login(values.email, values.password);
        location.hash = "/dashboard";
        break;
      case "register":
        await api.register(values);
        toast("Account created! Check your email for a verification link.");
        location.hash = "/dashboard";
        break;
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
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        state.domiHistory.push({ role: "user", text, time: now });
        const reply = domiReply(text, state.properties);
        state.domiHistory.push({ role: "domi", text: reply, time: now });
        form.reset();

        const stream = $("#domi-chat-stream");
        if (stream) {
          stream.innerHTML = state.domiHistory
            .map((m) => {
              const isUser = m.role === "user";
              return `
                <div class="domi-msg ${isUser ? "user" : "domi"}">
                  ${!isUser ? `<div class="domi-msg-avatar"><img src="/domi.png" alt="DOMI AI" /></div>` : ""}
                  <div class="domi-msg-bubble">
                    <div class="domi-msg-text">${e(m.text)}</div>
                    <span class="domi-msg-time">${e(m.time)}</span>
                  </div>
                  ${isUser ? `<div class="domi-msg-avatar user-avatar">${(api.profile?.name || "U")[0].toUpperCase()}</div>` : ""}
                </div>
              `;
            })
            .join("");
          stream.scrollTop = stream.scrollHeight;
        }
        $("#domi-chat-input")?.focus();
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
      case "request-form":
        await api.createRequest({
          ...values,
          budget: Number(values.budget),
          occupants: Number(values.occupants),
        });
        $("#modal")?.close();
        toast("Room request published.");
        route();
        break;
      case "property-form": {
        const files = data.getAll("photos").filter((f) => f.size);
        const photos = data.getAll("keepPhotos");
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
        toast("Property saved for review.");
        location.hash = "/properties";
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
      case "report-form":
        await api.report(form.dataset.property, values.reason.trim());
        $("#modal")?.close();
        toast("Thank you. Report submitted for administrator review.");
        break;
      case "viewing-form":
        await api.viewing(state.chat.id, values.date.trim());
        $("#modal")?.close();
        toast("Viewing request sent!");
        route();
        break;
    }
  } catch (err) {
    const msg = formatAuthError(err);
    if (msg) toast(msg);
  }
});

// Profile Photo Upload Change Listener
document.addEventListener("change", async (event) => {
  if (event.target.id === "pfp-file-input") {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      toast("Uploading profile photo...");
      const url = await api.uploadPhoto(file);
      await api.saveProfile({ photoURL: url });
      toast("Profile photo updated!");
      route();
    } catch (err) {
      toast(err.message || "Failed to upload photo.");
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
