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
            <a href="#/about" class="nav-link">How It Works</a>
          </nav>
          <div class="nav-actions">
            <button class="button text-button" data-action="theme" aria-label="Toggle appearance">
              ${icon("sun-moon")}
            </button>
            ${
              api.currentUser
                ? `<a href="#/dashboard" class="button outline small">${icon("layout-dashboard")} Dashboard</a>
                   <a href="#/profile" class="button primary small">${e(api.profile?.name || "Account")}</a>`
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
            <h4>Owners</h4>
            <ul>
              <li><a href="#/register">List Your Property</a></li>
              <li><a href="#/about">Owner Verification</a></li>
              <li><a href="#/about">Terms & Community</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} DormPath. Tuguegarao City, Cagayan, Philippines.</span>
          <span>Zero student booking fees · Verified property owners</span>
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

        <div class="sidebar-nav-group">
          <div class="sidebar-caption">DISCOVER</div>
          ${navItem("search", "Explore Rooms", "search")}
          ${navItem("map", "Map View", "map")}
          ${navItem("wanted", "Kwarto Wanted", "message-square-plus")}
        </div>

        <div class="sidebar-nav-group">
          <div class="sidebar-caption">WORKSPACE</div>
          ${navItem("dashboard", "Dashboard", "layout-dashboard")}
          ${navItem("favorites", "Saved Places", "heart")}
          <a href="#/messages" class="sidebar-link ${current === "messages" ? "active" : ""}">
            <div class="sidebar-link-left">
              ${icon("messages-square")}
              <span>Messages</span>
            </div>
            ${unreadMessages > 0 ? `<span class="sidebar-badge-count">${unreadMessages}</span>` : ""}
          </a>
          ${navItem("notifications", "Notifications", "bell")}
          ${api.profile?.role === "landlord" ? navItem("properties", "My Properties", "building-2") : ""}
          ${api.isAdmin ? navItem("admin", "Admin Console", "shield-check") : ""}
        </div>

        <div class="sidebar-bottom">
          <div class="sidebar-profile-pill">
            <div class="sidebar-avatar">${(api.profile?.name || "U")[0].toUpperCase()}</div>
            <div style="flex:1; min-width:0;">
              <strong style="display:block; font-size:0.8125rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${e(api.profile?.name || "Neighbor")}
              </strong>
              <span style="font-size:0.6875rem; color:var(--text-muted); text-transform:capitalize;">
                ${e(api.profile?.role || "Student")}
              </span>
            </div>
          </div>
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
            <button class="button text-button" data-action="domi">
              ${icon("sparkles")} Ask DOMI
            </button>
            ${
              api.profile?.role === "landlord" && api.profile?.verified
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
        <a href="#/favorites" class="${current === "favorites" ? "active" : ""}">
          ${icon("heart")} <span>Saved</span>
        </a>
        <a href="#/messages" class="${current === "messages" ? "active" : ""}">
          ${icon("messages-square")} <span>Chat</span>
        </a>
        <a href="#/profile" class="${current === "profile" ? "active" : ""}">
          ${icon("user-round")} <span>You</span>
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
  const data = isOwner ? await api.ownProperties() : await api.favorites();
  const convs = await api.conversations();

  return `
    <div>
      <div style="margin-bottom:28px;">
        <div class="overline">YOUR DORMPATH WORKSPACE</div>
        <h2>Welcome back, ${e(api.profile?.name || "neighbor")} 👋</h2>
        <p>Manage your saved places, inquiries, and housing preferences.</p>
      </div>

      <div class="trust-metrics-grid" style="margin-bottom:32px;">
        <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
          <div class="metric-icon-box">${icon(isOwner ? "building-2" : "heart")}</div>
          <div>
            <strong>${data.length}</strong>
            <span>${isOwner ? "Properties Managed" : "Saved Places"}</span>
          </div>
        </div>
        <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
          <div class="metric-icon-box">${icon("messages-square")}</div>
          <div>
            <strong>${convs.length}</strong>
            <span>Conversations</span>
          </div>
        </div>
        <div class="metric-card" style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-xl); border:1px solid var(--border);">
          <div class="metric-icon-box">${icon(isOwner ? "clock" : "wallet")}</div>
          <div>
            <strong>${isOwner ? data.reduce((n, p) => n + p.available, 0) : "₱0"}</strong>
            <span>${isOwner ? "Available Spaces" : "Student Platform Fees"}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Quick Navigation</h3>
        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:14px;">
          <a href="#/${isOwner ? "properties" : "search"}" class="button primary">
            ${isOwner ? "Manage Properties" : "Explore Rooms"} ${icon("arrow-right")}
          </a>
          <a href="#/messages" class="button outline">
            ${icon("messages-square")} View Messages
          </a>
          <a href="#/wanted" class="button outline">
            ${icon("message-square-plus")} Kwarto Wanted
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

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <div>
          <div class="overline">KWARTO WANTED</div>
          <h2>Student Room Requests</h2>
          <p>Share what you are looking for so verified landlords can reach out.</p>
        </div>
        <button class="button primary" data-action="new-request">
          ${icon("plus")} Post a Request
        </button>
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
                    ? `<button class="button outline small" data-close-request="${r.id}">Close request</button>`
                    : api.profile?.role === "landlord"
                      ? `<button class="button primary small" data-offer="${r.id}">Offer a room</button>`
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

// Redesigned Profile Page
async function profilePage() {
  return `
    <div style="max-width:640px;">
      <div style="margin-bottom:24px;">
        <div class="overline">ACCOUNT SETTINGS</div>
        <h2>Your Profile</h2>
      </div>

      <div class="detail-section">
        <form id="profile-form">
          <label>Display name
            <input name="name" required maxlength="80" value="${e(api.profile?.name)}">
          </label>
          <label>Email address
            <input value="${e(api.currentUser?.email)}" disabled style="background:var(--bg-subtle);">
          </label>
          <div style="margin:16px 0; font-size:0.875rem;">
            Account type: <strong style="text-transform:capitalize;">${e(api.profile?.role || "student")}</strong>
            ${api.profile?.verified ? ` · <span class="badge badge-success">Verified Owner</span>` : ""}
            ${api.isAdmin ? ` · <span class="badge badge-outline">Administrator</span>` : ""}
          </div>
          <button class="button primary">Save Changes</button>
        </form>
      </div>

      <div class="detail-section">
        <h3>Offline Cache Preferences</h3>
        <p style="margin:8px 0 16px;">Public listings are cached automatically. You can opt in to cache private chats on this device.</p>
        <label class="check">
          <input type="checkbox" id="private-cache" ${privateEnabled() ? "checked" : ""}> Store conversations and message drafts offline
        </label>
        <div style="margin-top:16px;">
          <button class="button outline small" data-action="clear-private">Clear cached offline data</button>
        </div>
      </div>

      <button class="button outline" data-action="logout" style="color:var(--danger); border-color:var(--danger);">
        ${icon("log-out")} Sign out
      </button>
    </div>
  `;
}

// Redesigned Landlord Properties Page
async function propertiesPage() {
  if (api.profile?.role !== "landlord") {
    return empty("Landlord area", "Register as a property owner to list and manage boarding houses.");
  }
  if (!api.profile.verified) {
    return empty(
      "Owner verification in progress",
      "An administrator will verify your ownership evidence before your listings become active.",
    );
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
async function adminPage(tab = "properties") {
  if (!api.isAdmin) return empty("Admin Access Required", "This area is restricted to platform administrators.");
  const allowed = ["properties", "users", "reports", "auditLogs"];
  if (!allowed.includes(tab)) tab = "properties";
  const data = await api.adminList(tab);

  return `
    <div>
      <div style="margin-bottom:24px;">
        <div class="overline">PLATFORM GOVERNANCE</div>
        <h2>Admin Console</h2>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:12px;">
        ${allowed.map((t) => `<a href="#/admin/${t}" class="button ${t === tab ? "primary" : "outline"} small">${t.toUpperCase()}</a>`).join("")}
      </div>

      <div class="detail-section">
        ${
          data.length
            ? data
                .map(
                  (r) => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-light);">
                <div>
                  <strong>${e(r.title || r.name || r.reason || r.targetId || r.id)}</strong>
                  <div style="font-size:0.8125rem; color:var(--text-secondary);">
                    ${e(r.status || r.role || r.collection || "")}
                    ${tab === "users" ? `· ${r.verified ? "Verified" : "Unverified"} · ${r.disabled ? "Suspended" : "Active"}` : ""}
                  </div>
                </div>
                <div>
                  ${
                    tab === "properties"
                      ? `<button class="button outline small" data-moderate="properties:${r.id}:published">Approve</button>
                         <button class="button outline small" data-moderate="properties:${r.id}:rejected">Reject</button>`
                      : tab === "users"
                        ? `<button class="button outline small" data-verify="${r.id}">Verify Owner</button>
                           <button class="button outline small" data-suspend="${r.id}:${!r.disabled}">${r.disabled ? "Restore" : "Suspend"}</button>`
                        : tab === "reports"
                          ? `<button class="button outline small" data-moderate="reports:${r.id}:resolved">Resolve</button>`
                          : ""
                  }
                </div>
              </div>
            `,
                )
                .join("")
            : `<p class="text-muted">No items in this section.</p>`
        }
      </div>
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

  const [page = "home", id] = location.hash.replace(/^#\/?/, "").split("/");

  // Determine Layout Structure
  const isAuth = ["login", "register", "reset-password"].includes(page);
  const isPublic = ["home", "about"].includes(page);

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
          api.profile?.verified && api.profile?.role === "landlord"
            ? propertyForm(id ? await api.getProperty(id) : {})
            : empty("Owner verification required", "A verified landlord account is required to list properties.");
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

    if (page === "map") await mountMap();

    // Messages listeners setup
    if (page === "messages" && state.chat) {
      const stopMessages = api.watchMessages(
        id,
        (items) => renderMessages(items),
        (err) => toast(err.message),
      );
      unsubscribe = () => stopMessages();
    }
  } catch (err) {
    if (version === routeVersion) {
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
  const el = event.target.closest("button, [data-action], [data-role-select], [data-school], [data-type], [data-save]");
  if (!el) return;

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
      const inp = $("#auth-password");
      if (inp) {
        inp.type = inp.type === "password" ? "text" : "password";
        el.innerHTML = icon(inp.type === "password" ? "eye" : "eye-off");
        refreshIcons();
      }
      break;
    }
    case "google-auth": {
      try {
        await api.loginWithGoogle(state.selectedRole || "student");
        location.hash = "/dashboard";
      } catch (err) {
        if (err?.code !== "auth/popup-closed-by-user") {
          toast(err?.message || "Google sign-in could not be completed.");
        }
      }
      break;
    }
    case "logout":
      await api.logout();
      state.favorites = [];
      location.hash = "/home";
      break;
    case "domi":
      modal(`
        <div style="text-align:center; margin-bottom:20px;">
          <img src="/domi.png" style="width:72px; height:72px; object-fit:contain; margin:0 auto 8px;">
          <h2>Ask DOMI AI</h2>
          <p>Local housing suggestions based on loaded Tuguegarao listings.</p>
        </div>
        <div id="domi-answer" class="detail-section" style="background:var(--bg-subtle);">
          Hi! Ask me about budgets, campus distances, or draft messages to owners.
        </div>
        <form id="domi-form" style="display:flex; gap:8px;">
          <input name="question" required placeholder="e.g. Find rooms under ₱3,000...">
          <button class="button primary">${icon("sparkles")}</button>
        </form>
      `);
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
        await api.saveProfile(values.name);
        toast("Profile updated.");
        route();
        break;
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
    }
  } catch (err) {
    toast(err.message);
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
