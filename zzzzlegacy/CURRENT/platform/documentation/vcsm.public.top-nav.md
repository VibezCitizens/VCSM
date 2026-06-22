# VCSM Public — Top Navigation Bar

> **Version:** 2
> **Updated:** 2026-04-29
> **Scope:** PublicNavbar component — shared fixed navigation bar for all VCSM public pages

---

## 1. Purpose

Documents the shared top navigation bar rendered on all public-facing VCSM pages. Provides brand identity, route navigation, auth CTAs, and a mobile hamburger menu to unauthenticated visitors.

---

## 2. Scope

**In scope:**
- `PublicNavbar` component — design, behavior, responsive variants
- Pages that render it: `/about`, `/contact`, `/how-to/create-profile`, `/how-to/create-vport`, `/vport/:type`, `/legal/privacy-policy`, `/legal/terms-of-service`
- Active state detection via `useLocation()`
- Scroll-aware background darkening
- Mobile hamburger menu + drawer (below 768px)
- PWA manifest maskable icon

**Out of scope:**
- Authenticated app navigation (handled by `BottomNavBar` in `shared/components/`)
- Login/Register screen nav

---

## 3. Application Scope

VCSM only.

---

## 4. Component Location

```
apps/VCSM/src/shared/components/PublicNavbar.jsx
```

**Previous location (v1):** `apps/VCSM/src/features/legal/components/PublicTopNav.jsx` — deleted. All imports updated to the shared path.

**Export:**
```js
export const PUBLIC_NAV_HEIGHT = 64
export default function PublicNavbar() { ... }
```

---

## 5. Entry Points (Rendered On)

| Route | Screen File | paddingTop Applied |
|---|---|---|
| `/about` | `legal/screens/AboutView.jsx` | `calc(64px + env(safe-area-inset-top))` |
| `/contact` | `legal/screens/ContactView.jsx` | `calc(64px + env(safe-area-inset-top))` |
| `/how-to/create-profile` | `legal/screens/HowToCreateProfileScreen.jsx` | `calc(64px + env(safe-area-inset-top))` |
| `/how-to/create-vport` | `legal/screens/HowToCreateVportScreen.jsx` | `calc(64px + env(safe-area-inset-top))` |
| `/vport/:type` | `legal/screens/VportCategoryLandingScreen.jsx` | `calc(64px + env(safe-area-inset-top))` |
| `/legal/privacy-policy` | `legal/screens/LegalDocumentScreen.jsx` | `calc(64px + env(safe-area-inset-top))` |
| `/legal/terms-of-service` | `legal/screens/LegalDocumentScreen.jsx` | `calc(64px + env(safe-area-inset-top))` |

`PUBLIC_NAV_HEIGHT` is the exported constant (64). All host pages reference it for padding computation.

---

## 6. Component Structure

```
<>
  <nav>                            fixed, z-9000, h-64px, glass bg
    <div> (max-w-1280, centered)
      [ Logo ]                     /pwa-192x192.png + "Vibez Citizens" wordmark → /
      [ Nav Links ]                About / VPORT / How-To / Contact (hidden < 768px)
      [ Actions ]                  Log in (hidden < 480px) | Get started (hidden < 768px)
      [ Hamburger ]                shown < 768px — 3-line icon, animates to X when open
    </div>
  </nav>

  {/* Mobile only, rendered as siblings outside <nav> */}
  [ Backdrop ]                     fixed overlay, blur(4px), closes drawer on tap
  [ Drawer panel ]                 slide-down below nav, links + Log in + Get started
</>
```

---

## 7. Design Tokens

| Property | Value |
|---|---|
| Height | Always 64px (no mobile variant) |
| Max width container | 1280px |
| Horizontal padding | 24px desktop / 16px mobile |
| Background (idle) | `rgba(10,10,15,0.62)` |
| Background (scrolled) | `rgba(7,7,11,0.90)` |
| Backdrop blur (idle) | `blur(14px)` |
| Backdrop blur (scrolled) | `blur(20px)` |
| Bottom border | `1px solid rgba(255,255,255,0.055)` |
| Box shadow (idle) | `0 1px 0 0 rgba(139,92,246,0.07)` |
| Box shadow (scrolled) | `0 1px 0 0 rgba(139,92,246,0.10), 0 4px 24px rgba(0,0,0,0.28)` |
| z-index | 9000 |

---

## 8. Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `≥ 768px` (`isWide`) | Center nav links visible, "Get started" button visible, hamburger hidden |
| `< 768px` (`!isWide`) | Center nav links hidden, hamburger button shown |
| `< 480px` (`isMobile`) | "Log in" link hidden (both in top bar and inside drawer still shows it) |

Both `isWide` and `isMobile` use `window.matchMedia` with `addEventListener('change')` for live responsive updates.

---

## 9. Nav Links

| Label | Route |
|---|---|
| About | `/about` |
| VPORT | `/how-to/create-vport` |
| How-To | `/how-to/create-profile` |
| Contact | `/contact` |

**Active detection:** `pathname === to` via `useLocation()`

**Active styles:** `color: #c4b5fd`, `background: rgba(139,92,246,0.11)`, `font-weight: 600`

**Hover styles (per-link `useState`):** `color: rgba(255,255,255,0.86)`, `background: rgba(255,255,255,0.04)`, `transform: translateY(-1px)`, `0.18s ease` transition

---

## 10. Action Buttons

### Log in
- Visible: `>= 480px` in top bar, always in mobile drawer
- Route: `/login`
- Ghost style — transparent background at rest

### Get started
- Visible: `>= 768px` in top bar, always in mobile drawer
- Route: `/register`
- Pill gradient: `linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #8b5cf6 100%)`
- Hover: `translateY(-1px) scale(1.02)`, deeper glow shadow

---

## 11. Hamburger Menu (Mobile)

Shown when `!isWide` (viewport < 768px).

**Trigger button:**
- 36×36px, `border-radius: 8px`
- Background: `rgba(255,255,255,0.05)` → `rgba(139,92,246,0.14)` when open
- Contains `<HamburgerIcon open={menuOpen} />` — 3 spans that animate to X on open

**Drawer panel:**
- `position: fixed`, top = `calc(64px + env(safe-area-inset-top))`, full width
- Background: `rgba(8,8,13,0.97)`, `backdrop-filter: blur(24px)`
- Slide-down animation: `translateY(-8px) + opacity 0` → `translateY(0) + opacity 1`, `0.24s cubic-bezier(0.4,0,0.2,1)`
- Contains: all 4 nav links (stacked, active highlight) + divider + "Log in" / "Get started" row
- `paddingBottom: env(safe-area-inset-bottom)` for home indicator clearance

**Backdrop:**
- `position: fixed, inset: 0`, z-index 8998 (below drawer at 8999)
- `rgba(0,0,0,0.54)`, `backdrop-filter: blur(4px)`
- Tap to close

**Auto-close triggers:**
- Route change (`useEffect` on `pathname`)
- Viewport goes wide (`useEffect` on `isWide`)
- Any nav link or CTA click (`onClick={closeMenu}`)

**Body scroll lock:**
```js
useEffect(() => {
  document.body.style.overflow = menuOpen ? 'hidden' : ''
  return () => { document.body.style.overflow = '' }
}, [menuOpen])
```

---

## 12. Logo

| Property | Value |
|---|---|
| Icon | `<img src="/pwa-192x192.png">` — 28×28px, `border-radius: 7px` |
| Wordmark | "Vibez Citizens" — 15px, weight 700, `letter-spacing: -0.025em` |
| Gradient | `linear-gradient(125deg, #fff 35%, #c4b5fd 100%)` via `-webkit-background-clip: text` |
| Link target | `/` |
| Hover | `opacity: 0.78`, icon glow `0 0 14px rgba(139,92,246,0.50)` |

---

## 13. Scroll Behavior

```js
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 12)
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}, [])
```

At scroll > 12px: background darkens, blur increases, shadow deepens.

---

## 14. PWA Manifest (Related)

`apps/VCSM/public/manifest.json` — updated 2026-04-29 to add `"purpose": "maskable"` icon entry for Android adaptive icon support:

```json
{
  "src": "/vibez-icon-512x512.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "maskable"
}
```

Without this, Android home screen installs do not apply the safe-zone crop.

---

## 15. Rules / Invariants

1. `PublicNavbar` must be the first child rendered inside the outer wrapper div of every public page.
2. Every public page using `PublicNavbar` must apply `paddingTop: calc(${PUBLIC_NAV_HEIGHT}px + env(safe-area-inset-top))` — failure creates content hidden behind the fixed bar.
3. Nav height is always 64px at all viewport widths — do not introduce viewport-specific height variants.
4. On mobile (< 768px), center nav links are hidden and replaced by the hamburger drawer. All 4 links must remain accessible through the drawer.
5. The logo must always link to `/` — never use `useNavigate(-1)` or browser back.
6. Active link detection must use `pathname === to` exact match.
7. Hover effects must use `onMouseEnter`/`onMouseLeave` — not CSS class hover.
8. The icon source must always be `/pwa-192x192.png` (public root, not CDN).
9. `PublicNavbar` calls `useIdentity()` to determine if a user is logged in — if so, shows "Go to app" instead of "Log in" / "Get started".
10. Body scroll lock (`document.body.style.overflow = 'hidden'`) must always be cleaned up on drawer close and component unmount.
11. Arrow icons (`→`, `<ArrowRight />`) must not appear in any button or link text on public pages.

---

## 16. Files Map

| File | Role |
|---|---|
| `apps/VCSM/src/shared/components/PublicNavbar.jsx` | The nav component — single source of truth |
| `apps/VCSM/src/features/legal/screens/AboutView.jsx` | Renders `PublicNavbar` |
| `apps/VCSM/src/features/legal/screens/ContactView.jsx` | Renders `PublicNavbar` |
| `apps/VCSM/src/features/legal/screens/HowToCreateProfileScreen.jsx` | Renders `PublicNavbar` |
| `apps/VCSM/src/features/legal/screens/HowToCreateVportScreen.jsx` | Renders `PublicNavbar` |
| `apps/VCSM/src/features/legal/screens/VportCategoryLandingScreen.jsx` | Renders `PublicNavbar` |
| `apps/VCSM/src/features/legal/screens/LegalDocumentScreen.jsx` | Renders `PublicNavbar` |
| `apps/VCSM/public/manifest.json` | PWA manifest — maskable icon added |
| `apps/VCSM/public/pwa-192x192.png` | Logo icon source |

---

## 17. Change Log

### 2026-04-26 — v1 (Created)

Initial PublicTopNav built at `legal/components/PublicTopNav.jsx`. No hamburger at any viewport — all links always rendered. No responsive breakpoints.

### 2026-04-29 — v2 (Mobile PWA overhaul)

**Task:** Mobile PWA compatibility for all public pages.

**Root cause:** Nav links were invisible on mobile (< 768px) with no replacement. The manifest lacked a maskable icon. Nav height was inconsistent (56px on mobile vs 64px desktop), misaligning page `paddingTop`.

**Changes:**

- Component moved: `legal/components/PublicTopNav.jsx` → `shared/components/PublicNavbar.jsx`
- All host page imports updated to new path
- Added `isWide` (768px) and `isMobile` (480px) responsive breakpoints
- Nav height locked to 64px at all viewports (removed `isMobile ? 56 : 64` variant)
- Added hamburger button (`!isWide`): 36px square, animates to X, opens drawer
- Added mobile drawer: slide-down panel with all nav links + Log in + Get started
- Added backdrop overlay: tap-outside-to-close, blur(4px)
- Added body scroll lock while drawer open
- Auto-close: on route change, on viewport resize past 768px, on any link/CTA click
- `manifest.json`: added maskable icon entry for Android adaptive icons

**Files Modified:**
- `apps/VCSM/src/shared/components/PublicNavbar.jsx` (moved + rewritten)
- `apps/VCSM/public/manifest.json` (maskable icon added)
- All 7 host page files (import path updated)
