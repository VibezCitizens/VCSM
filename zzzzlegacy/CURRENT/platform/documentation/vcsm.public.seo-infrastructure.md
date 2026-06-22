# VCSM Public Pages & SEO Infrastructure

> **Version:** 1
> **Created:** 2026-04-25
> **Scope:** Static public pages, login footer navigation, sitemap, robots.txt

---

## 1. Purpose

Documents the public-facing static pages, their file locations, and the SEO infrastructure (sitemap index + sub-sitemaps + robots.txt) built on Cloudflare Pages Functions.

---

## 2. Scope

**In scope:**
- Static public pages: `/about`, `/contact`, `/legal/privacy-policy`, `/legal/terms-of-service`
- Login screen footer navigation
- Sitemap index + 4 sub-sitemaps via Cloudflare Pages Functions
- `public/robots.txt`
- Cloudflare Pages Functions OG injection for VPORT routes

**Out of scope:**
- Authenticated app routes
- VPORT profile pages (handled by VPORT pipeline doc)
- Wanders public routes (handled by Wanders system)
- How-to guide pages and conversion funnel (documented in `vcsm.public.conversion-funnel.md`)

---

## 3. Application Scope

VCSM only.

---

## 4. Public Pages

### 4.1 File Locations

All static public page screens and views now live in `src/features/legal/screens/`:

| Route | Screen | View |
|---|---|---|
| `/about` | `legal/screens/AboutScreen.jsx` | `legal/screens/AboutView.jsx` |
| `/contact` | `legal/screens/ContactScreen.jsx` | `legal/screens/ContactView.jsx` |
| `/legal/privacy-policy` | `legal/screens/LegalDocumentScreen.jsx` | `legal/docs/PrivacyPolicyContent.jsx` |
| `/legal/terms-of-service` | `legal/screens/LegalDocumentScreen.jsx` | `legal/docs/TermsOfServiceContent.jsx` |

**Note:** About and Contact were previously in `src/features/public/about/` and `src/features/public/contact/`. Those directories were deleted on 2026-04-25. All files now live under the legal feature for consistent organisation.

### 4.2 Route Registration

Lazy imports in `src/app/routes/index.jsx`:

```js
const AboutScreen   = lazyWithLog("AboutScreen",   () => import("@/features/legal/screens/AboutScreen"))
const ContactScreen = lazyWithLog("ContactScreen", () => import("@/features/legal/screens/ContactScreen"))
```

Route factories in `src/app/routes/public/about.routes.jsx` and `src/app/routes/public/contact.routes.jsx` remain unchanged — they only export the route shape; the screen import path is resolved at the `index.jsx` level.

### 4.3 Splash Skip

`public/index.html` splash logic skips the launch animation for all public routes:

```js
const isPublicRoute =
  /^\/profile\/[^/]+\/(?:menu|reviews)(\/|$)/.test(path) ||
  /^\/m\/[^/]+\/?$/.test(path) ||
  /^\/actor\/[^/]+\/menu(\/|$)/.test(path) ||
  /^\/vport\/[^/]+\/?$/.test(path) ||        // VPORT category landing pages (/vport/barber etc.)
  /^\/vport\/[^/]+\/card\/?$/.test(path) ||  // VPORT business card
  /^\/wanders(\/|$)/.test(path) ||
  /^\/legal(\/|$)/.test(path) ||
  path === '/about' ||
  path === '/contact' ||
  /^\/how-to(\/|$)/.test(path) ||
  path === '/login' ||
  path === '/register' ||
  path === '/forgot-password' ||
  path === '/reset-password' ||
  /^\/auth(\/|$)/.test(path)
```

---

## 5. Login Screen Footer Navigation

`src/features/auth/screens/LoginScreen.jsx` renders a `<nav>` below the login card:

```
About · Contact · Privacy · Terms
```

| Link | Route |
|---|---|
| About | `/about` |
| Contact | `/contact` |
| Privacy | `/legal/privacy-policy` |
| Terms | `/legal/terms-of-service` |

**Styling:** `text-[#c4b5fd]` base / `hover:text-[#ddd6fe]` — matches the Forgot password and Create account link colors exactly. Separator `·` uses `mx-2` spacing. Base opacity nav color `rgba(255,255,255,0.45)`. `mt-8` top margin from card.

**Rule:** This nav is display-only. It must never change login form logic, validation, or navigation state.

---

## 6. Sitemap Architecture

### 6.1 Structure

```
GET /sitemap.xml
  → functions/sitemap.xml.js
  → Returns <sitemapindex> listing 4 sub-sitemaps

GET /sitemaps/static.xml
  → functions/sitemaps/static.xml.js
  → Static pages only, no DB, cache 24h
  → Includes: /about, /contact, /how-to/create-profile, /how-to/create-vport, /legal/*

GET /sitemaps/vport-cards.xml
  → functions/sitemaps/vport-cards.xml.js
  → vport.profiles WHERE business_card_published=true AND is_active=true AND is_deleted=false AND slug NOT NULL
  → URLs: /vport/:slug/card
  → cache 1h

GET /sitemaps/vport-menu.xml
  → functions/sitemaps/vport-menu.xml.js
  → vport.profiles WHERE is_active=true AND is_deleted=false AND slug NOT NULL
  → URLs: /profile/:slug/menu
  → cache 1h

GET /sitemaps/vport-reviews.xml
  → functions/sitemaps/vport-reviews.xml.js
  → Same filter as menu
  → URLs: /profile/:slug/reviews
  → cache 1h
```

### 6.2 Supabase Query Pattern

All dynamic sitemaps follow the same pattern as existing OG functions:

```js
fetch(`${env.SUPABASE_URL}/rest/v1/profiles?...`, {
  headers: {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Accept-Profile': 'vport',
    Accept: 'application/json',
  },
  signal: AbortSignal.timeout(5000),
})
```

PostgREST NOT NULL filter: `slug=not.is.null`

### 6.3 Fallback Behaviour

If Supabase is unreachable or returns an error, all dynamic sitemaps return an empty but valid `<urlset>` with status 200. Google never sees a 500. The sitemap index always succeeds (no DB calls).

### 6.4 Required Env Vars

`SUPABASE_URL` and `SUPABASE_ANON_KEY` — same vars used by all other Cloudflare Pages Functions. No new vars required.

### 6.5 RLS Risk

If the anon role lacks SELECT on `vport.profiles` in the vport schema, dynamic sitemaps return empty. To verify: open any dynamic sitemap in production and confirm rows appear. If empty, grant anon role SELECT on the relevant columns.

---

## 7. robots.txt

Location: `public/robots.txt`

```
User-agent: *
Allow: /

Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /reset
Disallow: /auth
Disallow: /settings
Disallow: /dashboard

Sitemap: https://vibezcitizens.com/sitemap.xml
```

**Rule:** Never disallow `/about`, `/contact`, `/legal`, or any VPORT public page. These must remain crawlable.

---

## 8. Homepage Static OG Image

The root URL (`https://vibezcitizens.com/`) has no Pages Function intercepting it — Cloudflare Pages serves `index.html` directly as a static file. The OG tags in `index.html` are therefore the final HTML crawlers receive, with no JavaScript execution required.

Current homepage OG image:

```
og:image    → https://vibezcitizens.com/VCSMcard.jpeg
twitter:image → https://vibezcitizens.com/VCSMcard.jpeg
```

Source file: `apps/VCSM/public/VCSMcard.jpeg` — deploys to the root CDN path.

**Rule:** To change the homepage share preview image, update the two `<meta>` tags in `apps/VCSM/index.html` (lines for `og:image` and `twitter:image`). Do not put the homepage image on the CDN `og/` path — it must be in `public/` to be served at the root.

**Why this differs from VPORT/Wanders routes:** Those routes have Pages Functions that strip and replace the OG tags dynamically. The homepage has no function — so whatever is in `index.html` ships as-is.

---

## 9. OG Edge Injection (Cloudflare Pages Functions)

Existing pattern — documented here for completeness. Each public VPORT/Wanders route has a corresponding Pages Function that:
1. Fetches `index.html` via `env.ASSETS`
2. Strips existing OG/Twitter/canonical tags
3. Injects per-route tags before `</head>`
4. Returns rewritten HTML before the SPA boots

| Route | Function | Data source |
|---|---|---|
| `/vport/:slug/card` | `functions/vport/[slug]/card.js` | `vport.read_business_card_public` RPC |
| `/profile/:slug/menu` | `functions/profile/[slug]/menu.js` | `vport.profiles` REST query |
| `/m/:actorId` | `functions/m/[actorId].js` | `vport.profiles` REST query |
| `/wanders/c/:publicId` | `functions/wanders/c/[publicId].js` | Static OG only |
| `/wanders/i/:publicId` | `functions/wanders/i/[publicId].js` | Static OG only |

---

## 10. Files Map

| File | Role |
|---|---|
| `apps/VCSM/src/features/legal/components/PublicTopNav.jsx` | Shared fixed top nav — rendered on all public pages |
| `apps/VCSM/src/features/legal/screens/AboutScreen.jsx` | /about screen — sets title + meta description |
| `apps/VCSM/src/features/legal/screens/AboutView.jsx` | /about view — hero, info cards, CTA |
| `apps/VCSM/src/features/legal/screens/ContactScreen.jsx` | /contact screen — sets title + meta description |
| `apps/VCSM/src/features/legal/screens/ContactView.jsx` | /contact view — 4 mailto contact cards |
| `apps/VCSM/src/features/legal/screens/LegalDocumentScreen.jsx` | /legal/:docType — DB-driven legal docs |
| `apps/VCSM/src/features/legal/docs/PrivacyPolicyContent.jsx` | Privacy policy JSX content |
| `apps/VCSM/src/features/legal/docs/TermsOfServiceContent.jsx` | Terms of service JSX content |
| `apps/VCSM/src/app/routes/public/about.routes.jsx` | Route factory for /about |
| `apps/VCSM/src/app/routes/public/contact.routes.jsx` | Route factory for /contact |
| `apps/VCSM/src/app/routes/public/legal.routes.jsx` | Route factory for /legal/:docType |
| `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` | Login form + public footer nav |
| `apps/VCSM/functions/sitemap.xml.js` | Sitemap index |
| `apps/VCSM/functions/sitemaps/static.xml.js` | Static pages sitemap |
| `apps/VCSM/functions/sitemaps/vport-cards.xml.js` | Published business cards sitemap |
| `apps/VCSM/functions/sitemaps/vport-menu.xml.js` | Active VPORT menus sitemap |
| `apps/VCSM/functions/sitemaps/vport-reviews.xml.js` | Active VPORT reviews sitemap |
| `apps/VCSM/public/robots.txt` | Crawler directives + sitemap reference |
| `apps/VCSM/public/index.html` | Splash skip allow-list for public routes |
| `apps/VCSM/index.html` | Root SPA entry — static OG tags for homepage share preview |
| `apps/VCSM/public/VCSMcard.jpeg` | Homepage share preview image — deployed at `/VCSMcard.jpeg` |

---

## 11. Invariants

1. `/about` and `/contact` must not require authentication — they are static public marketing pages.
2. The sitemap index must never return a 4xx or 5xx. Fallback to empty `<sitemapindex>` if needed.
3. Dynamic sitemaps must exclude: deleted VPORTs (`is_deleted=true`), inactive VPORTs (`is_active=false`), unpublished cards (`business_card_published=false`), null slugs.
4. `robots.txt` must always reference `https://vibezcitizens.com/sitemap.xml`.
5. Login screen footer links must use `<Link>` (React Router), not `<a href>`, so they do client-side navigation without triggering a full page reload.
6. `PublicNavbar` must be rendered on every public page: `/about`, `/contact`, `/how-to/create-profile`, `/how-to/create-vport`, `/vport/:type`, `/legal/privacy-policy`, `/legal/terms-of-service`.
7. Public pages using `PublicNavbar` must apply `paddingTop: calc(${PUBLIC_NAV_HEIGHT}px + env(safe-area-inset-top))` to their outer wrapper.
8. `← Back` links must never exist on public pages — `PublicNavbar` handles all public navigation.
9. `PublicNavbar` includes a hamburger menu on viewports < 768px — all nav links are accessible through the mobile drawer.
10. The logo icon in `PublicNavbar` must reference `/pwa-192x192.png` from the public directory.

---

## 12. Change Log

### 2026-04-25 — v1

**Task:** Public pages consolidation, login footer, sitemap, robots.txt

**Files Changed:**
- `src/features/legal/screens/AboutScreen.jsx` (NEW — moved from public/about)
- `src/features/legal/screens/AboutView.jsx` (NEW — moved from public/about)
- `src/features/legal/screens/ContactScreen.jsx` (NEW — moved from public/contact)
- `src/features/legal/screens/ContactView.jsx` (NEW — moved from public/contact)
- `src/features/public/about/` (DELETED)
- `src/features/public/contact/` (DELETED)
- `src/app/routes/index.jsx` (MODIFIED — lazy import paths updated)
- `src/features/auth/screens/LoginScreen.jsx` (MODIFIED — footer nav added, styled, color matched)
- `functions/sitemap.xml.js` (NEW)
- `functions/sitemaps/static.xml.js` (NEW)
- `functions/sitemaps/vport-cards.xml.js` (NEW)
- `functions/sitemaps/vport-menu.xml.js` (NEW)
- `functions/sitemaps/vport-reviews.xml.js` (NEW)
- `public/robots.txt` (MODIFIED — was empty)

### 2026-04-25 — v1.1

**Task:** Conversion funnel integration — how-to guide pages added to sitemap and splash skip

**Files Changed:**
- `functions/sitemaps/static.xml.js` (MODIFIED — added /how-to/create-profile and /how-to/create-vport at priority 0.8)
- `index.html` (MODIFIED — added `/^\/how-to(\/|$)/` to splash skip allow-list)

**See also:** `vcsm.public.conversion-funnel.md` for full funnel documentation.

### 2026-04-26 — v1.3

**Task:** PublicTopNav — shared navigation bar for all public pages

**What changed:**
- Created `apps/VCSM/src/features/legal/components/PublicTopNav.jsx` (NEW)
  - Fixed 64px glass nav: dark translucent bg, `backdrop-filter: blur`, scroll-aware darkening
  - Logo: `/pwa-192x192.png` icon + "Vibez Citizens" gradient wordmark
  - Nav links: About / Create Profile / Create VPORT / Contact / Privacy / Terms
    - Active state via `useLocation()`, soft purple pill, no border
    - Hover: `onMouseEnter`/`onMouseLeave` per link, color brighten + `translateY(-1px)`
  - Actions: Log in (ghost) + Get started (pill gradient, glow, `scale(1.02)` on hover)
  - No hamburger — all links always visible at all viewport widths
- Added `PublicTopNav` + `paddingTop: 60` to: `AboutView.jsx`, `ContactView.jsx`, `HowToCreateProfileScreen.jsx`, `HowToCreateVportScreen.jsx`
- Added `PublicTopNav` + `paddingTop: 92` to: `LegalDocumentScreen.jsx` (terms + privacy)
- Removed all `← Back` link blocks from all 5 pages
- Removed all `→` Unicode arrows and `<ArrowRight />` icon from CTA buttons across ContactView, AboutView, HowToCreateProfileScreen, HowToCreateVportScreen

**Files Created:**
- `apps/VCSM/src/features/legal/components/PublicTopNav.jsx`

**Files Modified:**
- `apps/VCSM/src/features/legal/screens/AboutView.jsx`
- `apps/VCSM/src/features/legal/screens/ContactView.jsx`
- `apps/VCSM/src/features/legal/screens/HowToCreateProfileScreen.jsx`
- `apps/VCSM/src/features/legal/screens/HowToCreateVportScreen.jsx`
- `apps/VCSM/src/features/legal/screens/LegalDocumentScreen.jsx`

### 2026-04-29 — v1.4

**Task:** VPORT category landing pages + mobile PWA nav

**Changes:**
- Splash skip updated: added `/^\/vport\/[^/]+\/?$/` regex for VPORT category landing pages (`/vport/barber`, `/vport/restaurant`, etc.). Previously only `/vport/:slug/card` was in the allow-list.
- Invariants updated: `PublicTopNav` → `PublicNavbar` (component renamed and moved to `shared/`), padding rule updated to include `env(safe-area-inset-top)`, hamburger-related invariant corrected (mobile hamburger now exists).

**Files Changed:**
- `apps/VCSM/index.html` (MODIFIED — `/vport/:type` pattern added to splash skip)
- `zNOTFORPRODUCTION/logan/vcsm/public/vcsm.public.seo-infrastructure.md` (this doc)

**See also:** `vcsm.public.vport-landing-pages.md` (new), `vcsm.public.top-nav.md` (v2)

### 2026-04-25 — v1.2

**Task:** Homepage share preview image

**Change:** `og:image` and `twitter:image` in `index.html` changed from `https://cdn.vibezcitizens.com/og/vibez-citizens-1200x630.png` to `https://vibezcitizens.com/VCSMcard.jpeg`.

**Why:** Previous CDN image was generic. `VCSMcard.jpeg` is the platform's own brand card image and was already present in `public/`. No CDN upload required — served directly from Cloudflare Pages at the root path.

**Files Changed:**
- `index.html` (MODIFIED — og:image + twitter:image URLs updated)

### 2026-05-03 — v1.5

**Task:** Fix `/sitemap.xml` being caught by React Router `*` wildcard and redirected to `/login` instead of being served by the Cloudflare Function.

**Root cause (two layers):**

1. React Router `*` wildcard at the bottom of `routes/index.jsx` matched every unrecognized path — including `/sitemap.xml` — and redirected to `/login`. The Cloudflare Function at `functions/sitemap.xml.js` never got a chance to respond because the SPA intercepted the client-side navigation first.

2. Missing `_routes.json` meant Cloudflare Pages didn't always invoke the Functions runtime for sitemap-adjacent paths, allowing the SPA catch-all to take over on edge cache misses.

**Fix — three files changed:**

**1. `apps/VCSM/public/_routes.json` (NEW)**
Explicit Cloudflare Pages Functions route declaration. Forces the Functions runtime for all paths that have corresponding Functions, preventing the SPA catch-all from swallowing them:
```json
{
  "version": 1,
  "include": ["/sitemap.xml", "/sitemaps/*", "/how-to/*", "/lovedrop/*", "/m/*", "/p/*", "/profile/*", "/vport/*", "/wanders/*"],
  "exclude": []
}
```

**2. `apps/VCSM/src/app/routes/index.jsx` (MODIFIED)**
Added defense-in-depth routes immediately before the `*` wildcard so these paths never reach the login redirect in client-side navigation:
```jsx
{ path: "sitemap.xml", element: <Navigate to="/" replace /> },
{ path: "robots.txt", element: <Navigate to="/" replace /> },
{ path: "sitemaps/*", element: <Navigate to="/" replace /> },
{ path: "*", element: <Navigate to="/login" replace /> },
```
These are fallbacks only — direct requests are served by Cloudflare Functions before reaching the SPA at all.

**3. `apps/VCSM/public/_redirects` (MODIFIED)**
Replaced 10 per-route SPA rewrites (which Cloudflare was flagging as potential infinite-loop warnings) with a single safe catch-all:
```
/* /index.html 200
```
Cloudflare Functions take automatic priority over `_redirects`, so all Function-handled paths (sitemap, profile, vport, etc.) are served by Functions first; everything else falls through to the SPA.

**Files Changed:**
- `apps/VCSM/public/_routes.json` (NEW)
- `apps/VCSM/src/app/routes/index.jsx` (MODIFIED — defense routes before `*`)
- `apps/VCSM/public/_redirects` (MODIFIED — single catch-all replaces 10 per-route rules)
