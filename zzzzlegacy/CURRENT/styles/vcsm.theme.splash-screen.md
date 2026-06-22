# VCSM Splash Screen System

**Last updated:** April 18, 2026

## Overview

The VCSM app has a pre-React splash screen that displays a branded image with animations while the JavaScript bundle loads and the app hydrates. It is defined entirely in `index.html` — no React components involved.

---

## How It Works

### 1. Splash Markup (index.html)

```html
<div id="splash">
  <img src="/VCSM.jpg" alt="Vibez Citizens Splash" />
</div>
```

Located directly in `<body>` before `<div id="root">`. Renders immediately on page load before any JS executes.

### 2. Splash Styling (index.html `<style>`)

The `#splash` element is:
- Fixed fullscreen (`position: fixed; inset: 0; z-index: 9999`)
- Dark background with radial gradients (cyan + pink on black)
- Centers the image with rounded corners and purple glow shadow

The image has three CSS animations:
- `vcFloat` — subtle vertical float (2.8s infinite)
- `vcGlow` — brightness/saturation pulse (2.2s infinite)
- `vcHue` — hue rotation shift (8.5s infinite)

Exit animation: `opacity 320ms ease` via `.is-exiting` class.

Respects `prefers-reduced-motion` — disables all animations.

### 3. Splash Removal Logic (index.html `<script>`)

The inline script at the bottom of `<body>` manages splash lifecycle:

```
1. Check route path
2. If route is bypassed (public menu, legal) → splash.remove() immediately
3. Otherwise, listen for 'vc:splash:hide' event → fade out + remove
4. Safety fallback: auto-remove after 12 seconds
```

**Routes that bypass splash entirely (no animation shown):**
- `/m/:slug` — public menu redirect
- `/actor/:id/menu`, `/actor/:id/menu/qr`, `/actor/:id/menu/flyer` — legacy public menu screens
- `/profile/:slug/menu` — canonical public menu screen (added 2026-04-18)
- `/legal/*` — legal document screens (Terms, Privacy Policy)

### 4. Hide Signal

React signals splash removal via a custom DOM event:

```js
window.dispatchEvent(new Event('vc:splash:hide'))
```

This is wrapped in a helper:

**File:** `src/shared/lib/hideLaunchSplash.js`
```js
export function hideLaunchSplash() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("vc:splash:hide"));
}
```

---

## Files That Call hideLaunchSplash()

| File | When it fires |
|---|---|
| `src/app/layout/RootLayout.jsx` | On every route change (except `/feed` which has its own timing) |
| `src/app/guards/ProtectedRoute.jsx` | When user is not authenticated (redirecting to login) |
| `src/app/routes/public/AuthPublicRoute.jsx` | When auth public route renders |
| `src/app/providers/AuthProvider.jsx` | On logout (before navigate to /login) |
| `src/features/feed/screens/CentralFeedScreen.jsx` | After first batch of posts is ready (`firstBatchReady`) |

### Feed Special Case

The feed screen deliberately delays splash removal until `firstBatchReady === true`. This means:
- Other routes: splash hides when `RootLayout` mounts
- Feed route: splash stays until actual post data loads

---

## Files Involved

| File | Role |
|---|---|
| `apps/VCSM/index.html` | Splash markup, CSS animations, route bypass logic, event listener, 12s fallback |
| `src/shared/lib/hideLaunchSplash.js` | Helper that dispatches `vc:splash:hide` event |
| `src/app/layout/RootLayout.jsx` | Calls `hideLaunchSplash()` on route change |
| `src/app/guards/ProtectedRoute.jsx` | Calls `hideLaunchSplash()` on auth redirect |
| `src/app/routes/public/AuthPublicRoute.jsx` | Calls `hideLaunchSplash()` on public auth screen render |
| `src/app/providers/AuthProvider.jsx` | Calls `hideLaunchSplash()` during logout |
| `src/features/feed/screens/CentralFeedScreen.jsx` | Calls `hideLaunchSplash()` after first data batch |
| `/public/VCSM.jpg` | The splash image (brain/circuit artwork) |

---

## Splash Bypass Routes

Defined in the inline `<script>` in `index.html`:

```js
const isPublicMenuRoute =
  /^\/m\/[^/]+\/?$/.test(path) ||
  /^\/actor\/[^/]+\/menu(?:\/(?:qr|flyer))?\/?$/.test(path) ||
  /^\/profile\/[^/]+\/menu\/?$/.test(path)
const isLegalRoute = /^\/legal(\/|$)/.test(path)

if (isPublicMenuRoute || isLegalRoute) {
  splash.remove()
  return
}
```

To add a new bypass route, add a regex check in this block.

---

## How to Modify

### Change splash image
Replace `/public/VCSM.jpg`. The image is served statically.

### Change splash background
Edit the `#splash` CSS in `index.html`:
```css
background:
  radial-gradient(900px 500px at 15% 20%, rgba(0, 194, 255, 0.18), transparent 55%),
  radial-gradient(800px 450px at 85% 15%, rgba(255, 0, 128, 0.15), transparent 55%),
  #000;
```

### Change animations
Edit `vcFloat`, `vcGlow`, `vcHue` keyframes in `index.html`.

### Change fallback timeout
Edit the `setTimeout(hideSplash, 12000)` line in the inline script. Currently 12 seconds.

### Add a new bypass route
Add a regex to the route-check block in the inline script.

### Remove splash entirely
Delete the `<div id="splash">` element and the `<style>` / `<script>` blocks in `index.html`. Remove all `hideLaunchSplash()` calls (they're safe no-ops if splash doesn't exist, but clean up is good practice).

---

## Known Behaviors

1. **New tab to legal route** — splash is bypassed, page renders instantly
2. **New tab to any other route** — splash shows until React hydrates and fires the event
3. **App crash before signal** — splash auto-removes after 12 seconds
4. **Feed route** — splash stays longer than other routes (waits for data)
5. **Reduced motion** — animations disabled, splash still shows/hides normally

---

## What NOT to Do

1. Don't move splash logic into React — it must render before JS loads
2. Don't remove the 12s fallback — it prevents permanent splash on crash
3. Don't call `hideLaunchSplash()` too early on the feed route — it causes a flash of empty content
4. Don't add heavy resources to the splash — it must be instant on first paint
