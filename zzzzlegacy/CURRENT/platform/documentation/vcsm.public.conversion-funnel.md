# VCSM Public — Conversion Funnel

> **Version:** 1
> **Created:** 2026-04-25
> **Scope:** Public SEO guide pages → intent-aware registration → onboarding → welcome screen

---

## 1. Purpose

Documents the full top-of-funnel flow from public discovery pages through account creation and post-signup activation. The funnel carries intent from first touch through to the appropriate post-onboarding destination.

---

## 2. Scope

**In scope:**
- `/how-to/create-profile` — public SEO guide page for personal profile creation
- `/how-to/create-vport` — public SEO guide page for VPORT (business page) creation
- `/register?intent=profile|vport` — intent-aware registration entry point
- `/welcome` — protected post-onboarding activation screen
- `sessionStorage` funnel source tracking
- Intent propagation through `useRegister` → `useAuthOnboarding`

**Out of scope:**
- `/onboarding` flow internals (documented in identity pipeline)
- Email verification flow
- Invite link flow (separate `state.wandersFlow` path)
- VPORT creation itself (handled in VPORT settings pipeline)

---

## 3. Application Scope

VCSM only.

---

## 4. Entry Points

| Route | Screen | Auth Required |
|---|---|---|
| `/how-to/create-profile` | `legal/screens/HowToCreateProfileScreen.jsx` | No |
| `/how-to/create-vport` | `legal/screens/HowToCreateVportScreen.jsx` | No |
| `/register?intent=profile` | `auth/screens/RegisterScreen.jsx` | No |
| `/register?intent=vport` | `auth/screens/RegisterScreen.jsx` | No |
| `/welcome` | `auth/screens/WelcomeScreen.jsx` | Yes (ProtectedRoute) |
| `/welcome?intent=profile` | `auth/screens/WelcomeScreen.jsx` | Yes |
| `/welcome?intent=vport` | `auth/screens/WelcomeScreen.jsx` | Yes |

---

## 5. Data Flow

```
User arrives at /how-to/create-profile or /how-to/create-vport
  → sessionStorage.setItem('vcsm_funnel_source', 'how_to_profile|how_to_vport')
  → CTA link: /register?intent=profile|vport

useRegister reads URLSearchParams('intent')
  → validates to 'profile' | 'vport' | null
  → builds intentDest: /welcome?intent=profile|vport  (fallback: /welcome)
  → navState.from = state.from (Wanders/invite priority) ?? intentDest

handleRegister completes signup
  → calls goOnboarding()
  → navigates to /onboarding with state: { from: navState.from, card, wandersFlow }

useAuthOnboarding reads state.from as redirectTo
  → after onboarding save: navigate(redirectTo)
  → redirectTo = /welcome?intent=profile|vport

WelcomeScreen
  → reads intent from URLSearchParams
  → sorts options: intent-matched option first with "Recommended" badge
  → user picks destination → navigates into app
```

---

## 6. Source of Truth

| Concern | Owner |
|---|---|
| Intent value | URL query param `?intent=profile\|vport` — read-only, no persistence |
| Funnel source | `sessionStorage['vcsm_funnel_source']` — set on guide page load |
| Post-signup destination | `state.from` passed through navigate state chain |
| Onboarding redirect | `useAuthOnboarding` → reads `state.from` as `redirectTo` |

---

## 7. Intent Priority

The destination after onboarding follows this priority order:

1. `state.from` set explicitly (Wanders invite flow, direct navigation with state)
2. `intent` query param → `/welcome?intent={value}`
3. Default → `/welcome`

This ensures the Wanders invite flow (`state.wandersFlow=true`, `state.from=/wanders/...`) is never overridden by a funnel intent.

---

## 8. Guide Pages — SEO Architecture

Both guide pages follow the same pattern:

### Meta tag management
- `setMeta(property, content, isName)` helper sets and restores meta tags on mount/unmount
- Sets: `document.title`, `meta[name="description"]`, `og:title`, `og:description`, `og:url`
- og:url is hardcoded to production URL (SPA, no SSR — standard practice)

### Funnel source tracking
- `sessionStorage.setItem('vcsm_funnel_source', 'how_to_profile|how_to_vport')` on mount
- Lightweight, no backend call, ignored on failure (try/catch)

### Page structure (4 sections)
1. Hero card with icon + headline + primary CTA
2. Benefits grid (2×2, icon cards)
3. Numbered steps list
4. Bottom CTA card with secondary "Already have an account?" login link

### Styling
- `authTheme.pageBackground`, `authTheme.cardBackground`, `authTheme.cardShadow`
- `max-w-[540px]`, mobile-first
- Color accents: profile pages use purple (`#8b5cf6`), VPORT pages use amber (`#f59e0b`)

---

## 9. Welcome Screen

`WelcomeScreen` is a protected route (inside `ProtectedRoute`, outside `ProfileGatedOutlet`).

Three options presented as cards:

| Key | Icon | Color | Destination |
|---|---|---|---|
| `profile` | User | `#8b5cf6` | `/settings?tab=profile` |
| `vport` | Store | `#f59e0b` | `/settings` |
| `explore` | Compass | `#42d3ff` | `/explore` |

- Intent-matched option sorts to top and receives a "Recommended" badge
- All three are always shown — intent only affects order and badge, not visibility
- No profile completion gate — `WelcomeScreen` is accessible immediately after onboarding

---

## 10. Route Registration

### Route factory
`src/app/routes/public/howto.routes.jsx` exports `howToPublicRoutes({ HowToCreateProfileScreen, HowToCreateVportScreen })` — returns array of route objects.

### index.jsx wiring
```js
// Lazy imports
const HowToCreateProfileScreen = lazyWithLog("HowToCreateProfileScreen",
  () => import("@/features/howto/screens/HowToCreateProfileScreen"))
const HowToCreateVportScreen = lazyWithLog("HowToCreateVportScreen",
  () => import("@/features/howto/screens/HowToCreateVportScreen"))
const WelcomeScreen = lazyWithLog("WelcomeScreen",
  () => import("@/features/auth/screens/WelcomeScreen"))

// In routes array
...howToPublicRoutes({ HowToCreateProfileScreen, HowToCreateVportScreen })   // public
{ path: '/welcome', element: <WelcomeScreen /> }                              // inside ProtectedRoute, sibling to /onboarding
```

---

## 11. Splash Skip

`/how-to/*` routes are added to the splash skip allow-list in `index.html`:

```js
/^\/how-to(\/|$)/.test(path)
```

This prevents the launch animation from running when a user arrives cold from a search engine result.

---

## 12. Sitemap

Both guide pages are included in the static sitemap at `functions/sitemaps/static.xml.js` with `changefreq: 'monthly'` and `priority: '0.8'` (higher than About/Contact, lower than VPORT-specific pages).

---

## 13. Rules / Invariants

1. `/how-to/create-profile` and `/how-to/create-vport` must never require authentication.
2. `state.from` (Wanders/invite flow) must always take priority over `intent` in `useRegister`.
3. `intent` must be validated to `'profile' | 'vport'` before use — arbitrary query param values are discarded.
4. `/welcome` must sit outside `ProfileGatedOutlet` — users arrive immediately after onboarding before profile is complete.
5. The WelcomeScreen must always show all three options regardless of intent — intent only affects order and badge.
6. `sessionStorage` writes in guide pages must be wrapped in try/catch — private browsing mode throws on write.

---

## 14. Failure Risks

| Risk | Impact | Mitigation |
|---|---|---|
| `state.from` not passed to onboarding | User lands at `/welcome` without intent | Acceptable default — all 3 options shown |
| `intent` spoofed with unexpected value | Falls through validation to `null` | Validated with explicit equality check before use |
| `sessionStorage` unavailable | Source tracking silently drops | try/catch in guide page useEffect |
| `/welcome` placed inside `ProfileGatedOutlet` | Redirect loop after onboarding | Route placed as sibling to `/onboarding`, not inside gate |

---

## 15. Files Map

| File | Role |
|---|---|
| `apps/VCSM/src/features/legal/screens/HowToCreateProfileScreen.jsx` | `/how-to/create-profile` — guide page for personal profiles |
| `apps/VCSM/src/features/legal/screens/HowToCreateVportScreen.jsx` | `/how-to/create-vport` — guide page for VPORT creation |
| `apps/VCSM/src/features/auth/screens/WelcomeScreen.jsx` | `/welcome` — post-onboarding activation screen |
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | Register hook — reads intent, builds navState.from |
| `apps/VCSM/src/app/routes/public/howto.routes.jsx` | Route factory for /how-to/* pages |
| `apps/VCSM/src/app/routes/index.jsx` | Lazy imports + route registration for all three screens |
| `apps/VCSM/functions/sitemaps/static.xml.js` | Sitemap — includes /how-to/create-profile + create-vport |
| `apps/VCSM/index.html` | Splash skip — /how-to/* added to allow-list |

---

## 16. Change Log

### 2026-04-25 — v1

**Task:** Conversion funnel build — guide pages, intent-aware registration, welcome screen

**Files Created:**
- `src/features/howto/screens/HowToCreateProfileScreen.jsx` (NEW)
- `src/features/howto/screens/HowToCreateVportScreen.jsx` (NEW)
- `src/features/auth/screens/WelcomeScreen.jsx` (NEW)
- `src/app/routes/public/howto.routes.jsx` (NEW)

**Files Modified:**
- `src/features/auth/hooks/useRegister.js` — intent reading + navState.from priority logic
- `src/app/routes/index.jsx` — lazy imports + route registration for all 3 screens
- `functions/sitemaps/static.xml.js` — added how-to pages at priority 0.8
- `index.html` — added /how-to regex to splash skip allow-list

**Validation:** Route flow verified by reading final state of index.jsx and useRegister.js.

### 2026-04-26 — v1.1 (Drift Fix + UI Overhaul)

**Drift Fixed:**
- File paths corrected throughout: `features/howto/screens/` → `features/legal/screens/`
  - `HowToCreateProfileScreen.jsx` and `HowToCreateVportScreen.jsx` were never at `howto/screens/`. They were built directly inside `legal/screens/`. This doc had incorrect paths from v1.

**UI Changes to guide pages:**
- `/how-to/create-profile` phone preview rebuilt:
  - Removed surrounding callout cards (Public identity / Connected everywhere / Shareable profile)
  - Profile card: avatar LEFT (62×62px) + info stack RIGHT — `[ Avatar ] [ Name / @handle / Bio / 0 SUBSCRIBERS ]`
  - Glass card: `rgba(14,11,28,0.93)` + purple border + `backdrop-filter: blur(14px)`
  - Tabs: Photos / Videos / Vibes (active) / Tags / Friends
  - Feed card: updated to vibe-style card with correct copy
- All arrow icons (`→`, `<ArrowRight />`) removed from CTA buttons across all guide pages and ContactView/AboutView

**PublicTopNav added to guide pages:**
- `← Back` links removed from both guide pages
- `PublicTopNav` imported and rendered in both screens
- `paddingTop: 60` added to outer wrapper div
- See `vcsm.public.top-nav.md` for full nav documentation

**Files Modified:**
- `src/features/legal/screens/HowToCreateProfileScreen.jsx` — phone preview rebuild + nav
- `src/features/legal/screens/HowToCreateVportScreen.jsx` — nav added
- `zNOTFORPRODUCTION/logan/vcsm/public/vcsm.public.conversion-funnel.md` — this drift fix
