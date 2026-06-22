# VCSM Public — VPORT Category Landing Pages

> **Version:** 1
> **Created:** 2026-04-29
> **Scope:** VPORT category SEO landing pages + how-to create VPORT page + preview carousel system

---

## 1. Purpose

Documents the public VPORT marketing and SEO pages: six category-specific landing pages at `/vport/:type` and the general how-to page at `/how-to/create-vport`. These pages are unauthenticated, indexable, and designed to convert business owners into VPORT creators.

---

## 2. Scope

**In scope:**
- `/vport/:type` — category landing pages (barber, barbershop, restaurant, locksmith, gas-station, money-exchange)
- `/how-to/create-vport` — general VPORT creation guide
- `VportCategoryLandingScreen` — template screen for all 6 types
- `HowToCreateVportScreen` — standalone screen for the how-to page
- `vportLandingContent.js` — content config for all types
- `VportPreviewShowcase` — phone preview carousel component
- `vportPreviewData.js` — static marketing preview data
- Design system applied to all public VPORT pages

**Out of scope:**
- Authenticated VPORT owner screens (settings, content tab, reviews)
- VPORT business card at `/vport/:slug/card`
- VPORT profile at `/profile/:slug`

---

## 3. Application Scope

VCSM only.

---

## 4. Routes

| Route | Screen | Auth Required |
|---|---|---|
| `/how-to/create-vport` | `legal/screens/HowToCreateVportScreen.jsx` | No |
| `/vport/barber` | `legal/screens/VportCategoryLandingScreen.jsx` | No |
| `/vport/barbershop` | `legal/screens/VportCategoryLandingScreen.jsx` | No |
| `/vport/restaurant` | `legal/screens/VportCategoryLandingScreen.jsx` | No |
| `/vport/locksmith` | `legal/screens/VportCategoryLandingScreen.jsx` | No |
| `/vport/gas-station` | `legal/screens/VportCategoryLandingScreen.jsx` | No |
| `/vport/money-exchange` | `legal/screens/VportCategoryLandingScreen.jsx` | No |

Unrecognised `/vport/:type` values redirect to `/how-to/create-vport` via `<Navigate replace />`.

---

## 5. Splash Skip

Both route patterns are in the `isPublicRoute` allow-list in `index.html`:

```js
/^\/vport\/[^/]+\/?$/.test(path)   // category landing pages
/^\/how-to(\/|$)/.test(path)        // how-to pages including create-vport
```

No splash animation fires when arriving from a search engine.

---

## 6. Content Config — `vportLandingContent.js`

**Location:** `apps/VCSM/src/features/legal/config/vportLandingContent.js`

**Exports:**
- `VPORT_LANDING_CONTENT` — keyed object, one entry per type
- `VPORT_LANDING_TYPES` — `Object.keys(VPORT_LANDING_CONTENT)` (array of 6 slugs)
- `getVportLandingContent(type)` — case-insensitive lookup, returns `null` for unknown types

**Content shape per type:**

```js
{
  type,           // 'barber' | 'barbershop' | 'restaurant' | 'locksmith' | 'gas-station' | 'money-exchange'
  typeLabel,      // display string e.g. 'gas station'
  displayName,    // capitalised e.g. 'Gas Station'
  heroHeadline,   // h1 copy
  heroSubheadline,
  ctaLabel,       // 'Create your VPORT'
  exampleHref,    // link to a real VPORT profile — used nowhere currently (secondary CTA removed)
  benefits: [     // array of { heading: string, text: string }
    { heading: 'Clear fuel details', text: 'Show fuel options and...' },
    ...
  ],
  useCases: [     // array of plain strings, written as "You..." first-person
    'You run a neighborhood station...',
    ...
  ],
  preview: {
    title, tagline, accent, imageUrl,
  },
  seo: {
    title,        // <title> and og:title
    description,
    keywords: [], // array of strings, joined as meta keywords
  },
}
```

**Benefits structure (important):** Each benefit is `{ heading, text }` — NOT a plain string. The heading is displayed at 15px/600 weight; the text is muted body copy at 14px/0.54 opacity. Numbers (01, 02...) are not used.

---

## 7. VportCategoryLandingScreen

**Location:** `apps/VCSM/src/features/legal/screens/VportCategoryLandingScreen.jsx`

**Key behaviors:**
- `useParams()` reads `:type` slug
- `getVportLandingContent(type)` resolves content or returns null → `<Navigate to="/how-to/create-vport" replace />`
- `useEffect` sets page title + meta tags (description, keywords, og:*, twitter:*), restores on unmount
- `sessionStorage.setItem('vcsm_funnel_source', \`vport_${content.type}\`)` for funnel tracking

**Page sections (in order):**
1. Hero — badge + h1 + subheadline + single CTA ("Create your VPORT")
2. Product preview — `<VportPreviewShowcase activeType={content.type} single />` (one centered phone)
3. Benefits — `SectionHeading` + 4-col card grid, heading+text per card, no numbers
4. Who it's built for — `SectionHeading` + card grid, plain text use-case cards
5. Why businesses use VPORT — static paragraph (`WHY_VPORT_BODY` constant)
6. Bottom CTA — single "Create your VPORT" button
7. Explore more VPORT types — pill links to all other 5 types

**Removed sections:**
- Problem points section (removed 2026-04-29)
- SEO keywords section (replaced with static `WHY_VPORT_BODY` paragraph)
- "See VPORT example" secondary CTA button (removed 2026-04-29)
- "Explore" tertiary buttons from About page

**Single phone preview:** `VportPreviewShowcase` with `single` prop renders only the type-matched phone, centered, without carousel or dots. The active phone is determined by `activeType`.

**Related types footer:** `VPORT_LANDING_TYPES.filter(e => e !== content.type)` — all types except current.

---

## 8. HowToCreateVportScreen

**Location:** `apps/VCSM/src/features/legal/screens/HowToCreateVportScreen.jsx`

**Purpose:** General VPORT creation guide. Not type-specific. CTA → `/register?intent=vport`.

**Page sections (in order):**
1. Hero — badge + h1 ("Create Your VPORT") + subheadline + CTA
2. Preview — `<VportPreviewShowcase />` (no `activeType`, no `single`) — full carousel, opens on middle item
3. How to get started — numbered steps (01–05)
4. Explore category VPORT pages — premium category pill section
5. Bottom CTA

**Category pill section — premium design:**
- Container: `linear-gradient(145deg, rgba(255,255,255,0.026), rgba(255,255,255,0.012))`, inset highlight, `0 20px 40px rgba(0,0,0,0.4)` outer shadow
- Buttons: `{ heading, text }` structure with hover state tracking via `useState(hoveredLink)`
- Hover: `rgba(255,255,255,0.08)` bg, `rgba(255,255,255,0.16)` border, purple glow `0 0 0 2px rgba(139,92,246,0.22)`, `translateY(-1px)`, 180ms ease
- Dot accent: 5px circle, turns `#8b5cf6` on hover

---

## 9. Design System

All public VPORT pages use a consistent design system:

**Typography constants (defined per file):**
```js
const SERIF = "'DM Serif Display', serif"
const SANS  = "'Inter', sans-serif"
```

Both fonts loaded in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

**Type scale:**
| Element | Font | Size | Weight | Letter-spacing |
|---|---|---|---|---|
| h1 (hero) | SERIF | `clamp(40px, 6vw, 58px)` | 500 | -0.02em |
| h2 (section) | SERIF | `clamp(26px, 4vw, 32px)` | 500 | -0.01em |
| Section subheading | SANS | 16px | 400 | — |
| Badge/label | SANS | 11px | 600 | 0.12em uppercase |
| Body / card text | SANS | 14–15px | 400 | — |
| CTA button | SANS | 14px | 500–700 | — |
| CTA button height | — | 48px | — | border-radius: 12 |

**Section vertical spacing:** 96px top padding (`padding: '96px 24px 0'`)

**Page background:** `#060609`

**Root div:** always `fontFamily: SANS` — SERIF only for headings.

---

## 10. VportPreviewShowcase

**Location:** `apps/VCSM/src/features/vport/public/VportPreviewShowcase.jsx`

**Props:**
- `activeType` — optional slug string. Determines which preview to show/center.
- `single` — boolean. If true, renders one centered phone without carousel.

**Index resolution:**

```js
const CAROUSEL_DEFAULT = Math.floor(VPORT_PREVIEWS.length / 2)

function resolveIndex(type) {
  if (!type) return CAROUSEL_DEFAULT   // center item when no type given
  const idx = getPreviewIndex(type)
  return idx >= 0 ? idx : CAROUSEL_DEFAULT
}
```

**Centering fix (2026-04-29):** On mount, always scrolls to the resolved index regardless of whether it is index 0. Previous bug: `if (idx === 0) return` prevented centering on the how-to page where `activeType` is undefined and `resolveIndex` returns the middle item.

**Route navigation sync:** `useEffect` on `activeType` calls `setActiveIndex(resolveIndex(activeType))` so navigating between `/vport/barber` → `/vport/restaurant` updates the active phone without remounting.

**Export path:** Through adapter: `@/features/vport/adapters/vport.public.adapter`

---

## 11. vportPreviewData.js

**Location:** `apps/VCSM/src/features/vport/public/vportPreviewData.js`

**Exports:**
- `VPORT_PREVIEWS` — array of 5 preview objects (restaurant, barber, locksmith, gas-station, money-exchange)
- `getPreviewIndex(slug)` — finds first preview where `p.slugs.includes(slug)`, returns 0 if not found

**Note:** barber and barbershop map to the same preview (both in `slugs: ['barber', 'barbershop']`). Only 5 distinct phone previews exist for 6 content types.

**Data fields per preview:** `type`, `slugs[]`, `title`, `tagline`, `accent` (hex color), `imageUrl`, `profile` (name, handle, bio, avatarUrl, bannerUrl), `tabs[]`, `activeTab`, `ctaLabel`, `ctaPath`, plus type-specific fields (`menuItems`, `portfolioItems`, `services`, `fuelPrices`, `rates`, `chips`).

---

## 12. Adapter

**Location:** `apps/VCSM/src/features/vport/adapters/vport.public.adapter.js`

All public VPORT preview components must be imported through this adapter:

```js
export { default as VportPreviewShowcase } from '@/features/vport/public/VportPreviewShowcase'
export { VportPreviewCard } from '@/features/vport/public/VportPreviewCard'
export { generateVportPreview, ACCENT_BY_TYPE } from '@/features/vport/public/vportPreviewModel'
```

Direct imports from `@/features/vport/public/` from screens outside the vport feature are forbidden. Always use `@/features/vport/adapters/vport.public.adapter`.

---

## 13. Meta Tag Management

Both screens manage their own SEO meta tags via a `setMeta()` helper that sets + restores on unmount:

```js
function setMeta(property, content, isName = false) {
  const attr = isName ? 'name' : 'property'
  let el = document.head.querySelector(`meta[${attr}="${property}"]`)
  const created = !el
  // ... creates if missing, returns cleanup fn
}
```

Tags set per category page: `description`, `keywords`, `og:title`, `og:description`, `og:url`, `twitter:title`, `twitter:description`.

**og:url** is computed as `${BASE_URL}/vport/${content.type}` — hardcoded to production (SPA, no SSR).

---

## 14. Rules / Invariants

1. All 6 category pages share one screen component (`VportCategoryLandingScreen`). Content is data-driven via `vportLandingContent.js` — never hardcoded in the screen.
2. Unknown type slugs must redirect to `/how-to/create-vport` — never 404.
3. `benefits` array must always be `{ heading, text }` objects — never plain strings.
4. `useCases` array must be plain strings written in first-person "You..." voice.
5. The "See VPORT example" secondary CTA button must not exist on any VPORT public page.
6. `VportPreviewShowcase` must always be imported through the vport adapter, never directly.
7. The `single` prop on `/vport/:type` pages must show only the type-matched phone — not the full carousel.
8. The full carousel on `/how-to/create-vport` must open with the middle item centered on every load.
9. Meta tag setters must clean up on unmount — all `setMeta()` return values collected in an array and iterated in the cleanup function.
10. `sessionStorage` writes must be wrapped in try/catch (private browsing mode throws).

---

## 15. Files Map

| File | Role |
|---|---|
| `apps/VCSM/src/features/legal/screens/HowToCreateVportScreen.jsx` | `/how-to/create-vport` guide page |
| `apps/VCSM/src/features/legal/screens/VportCategoryLandingScreen.jsx` | `/vport/:type` template screen (all 6 types) |
| `apps/VCSM/src/features/legal/config/vportLandingContent.js` | Content config for all 6 types + lookup fn |
| `apps/VCSM/src/features/vport/public/VportPreviewShowcase.jsx` | Phone preview carousel + single mode |
| `apps/VCSM/src/features/vport/public/vportPreviewData.js` | Static preview data (5 phones) + index lookup |
| `apps/VCSM/src/features/vport/public/VportPhonePreview.jsx` | Phone shell + per-type content renderer |
| `apps/VCSM/src/features/vport/public/VportPreviewCard.jsx` | Real-data phone preview (uses generateVportPreview) |
| `apps/VCSM/src/features/vport/public/vportPreviewModel.js` | Pure normalizer: DB data → PreviewModel |
| `apps/VCSM/src/features/vport/public/vportCarousel.css` | Carousel scroll container CSS |
| `apps/VCSM/src/features/vport/adapters/vport.public.adapter.js` | Public adapter — all exports go through here |
| `apps/VCSM/index.html` | Splash skip for `/vport/:type` + Google Fonts |

---

## 16. Change Log

### 2026-04-29 — v1 (Created)

**What was built (accumulated over multiple sessions):**

- `VportCategoryLandingScreen` — full rewrite: adapter import, VPORT naming, design system applied, benefits changed to `{ heading, text }` objects, numbers removed from cards, secondary CTA removed, "Explore" buttons removed, useCases rewritten in first-person "You..." voice for all 6 types
- `HowToCreateVportScreen` — full rewrite: design system applied, category pill section upgraded to premium with hover interactions and dot accents, carousel heading changed to "Built for real-world businesses like yours"
- `vportLandingContent.js` — benefits data structure changed from string arrays to `{ heading, text }` objects for all 6 types; useCases rewritten for all 6 types
- `VportPreviewShowcase` — added `single` prop for category pages, added `resolveIndex()` with `CAROUSEL_DEFAULT` fallback (middle item), removed `if (idx === 0) return` guard that prevented centering, added `useEffect` sync for `activeType` prop changes across route navigation
- `index.html` — added `/^\/vport\/[^/]+\/?$/` to splash skip allow-list; added Google Fonts link for DM Serif Display + Inter
- `manifest.json` — added maskable icon entry (see `vcsm.public.top-nav.md`)
