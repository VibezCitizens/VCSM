# Planning — May / 09 / Sequence 07

## Task
Upgrade the existing `CountrySelectorClient` atlas visualization to a real globe.gl hex-polygon globe. The existing market sidebar, country card list, and navigation logic are preserved unchanged. Only the `.country-selector__atlas` div is replaced with a live WebGL globe.

## Execution Plan

**Task Class:** IMPLEMENTATION
**Application Scope:** TRAFFIC
**SENTRY Review:** Optional — Post-Execution
**SENTRY Scope:** TrazeGlobe.jsx, CountrySelectorClient.jsx
**SENTRY Timing:** Post-Execution
**Estimated Time:** ~35 min
**Execution Type:** Split (3 slices)

---

### Current state

`CountrySelectorClient.jsx` has two columns:
- LEFT: `.country-selector__atlas` — CSS-only globe visual (concentric rings + country dot nodes + atlas panel). This gets replaced.
- RIGHT: `.country-selector__market-panel` — country cards sidebar. This stays 100% intact.

Navigation, active state, hover, writeStoredTrazeLocation — all preserved.

---

### Slice 1 — Install packages

In `apps/Traffic/`:
```
npm install react-globe.gl topojson-client
```

No other changes in this slice.

---

### Slice 2 — `TrazeGlobe` component

**File:** `apps/Traffic/src/shared/components/TrazeGlobe.jsx` (NEW)

`"use client"` — uses `useRef`, `useState`, `useEffect`, `next/dynamic`.

Globe dynamically imported:
```js
const ReactGlobe = dynamic(() => import("react-globe.gl"), { ssr: false });
```

**Props:**
- `countries` — array from `listLiveProviderCountries()`: `{ countryCode, countrySlug, countryName, providerCount, cityCount }`
- `activeCountryCode` — currently hovered/selected country code (string)
- `onHover(countryCode)` — called on point hover
- `onCountryClick(country)` — called on point click

**GeoJSON loading (client-side):**
```js
useEffect(() => {
  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(r => r.json())
    .then(topoData => {
      const { feature } = await import("topojson-client");
      setGeoJson(feature(topoData, topoData.objects.countries));
    })
    .catch(() => setGeoJson(null));
}, []);
```

**ISO numeric → alpha-2 lookup** (embedded in component):
```js
const ISO_NUMERIC = {
  "840": "US", "484": "MX", "320": "GT", "084": "BZ",
  "340": "HN", "222": "SV", "558": "NI", "188": "CR",
  "591": "PA", "124": "CA", "826": "GB", "724": "ES",
  "250": "FR", "276": "DE", "784": "AE", "076": "BR", "356": "IN"
};
```

**Globe layers:**

1. **hexPolygons** — from GeoJSON features
   - Hex resolution: 3, margin: 0.7
   - Color per feature:
     - Active country (in `countries` array + `activeCountryCode`) → `rgba(139,92,246,0.92)`
     - Live country (in `countries` array) → `rgba(109,70,220,0.55)`
     - Inactive → `rgba(22,26,52,0.5)`

2. **points** — `countries` mapped to centroid lat/lng
   - Country centroid map embedded (US, MX, GT, BZ, HN, SV, NI, CR, PA)
   - Radius: `Math.max(0.4, Math.sqrt(providerCount) * 0.3)`
   - Color: `rgba(200,185,255,0.95)`
   - Label: `<div>countryCode<br/>providerCount providers</div>`
   - `onPointHover` → calls `onHover(countryCode)`
   - `onPointClick` → calls `onCountryClick(country)`

**Globe appearance:**
- `backgroundColor="rgba(0,0,0,0)"`
- `atmosphereColor="rgba(109,70,220,0.35)"`
- `atmosphereAltitude={0.22}`
- `globeImageUrl=""` → dark surface via CSS background on the wrap div
- Globe auto-rotates slowly on desktop (`.controls().autoRotate = true`, speed 0.5)
- Width/height from container `ResizeObserver`

**WebGL guard:**
```js
function detectWebGL() {
  try {
    return !!document.createElement("canvas").getContext("webgl");
  } catch { return false; }
}
```
If WebGL fails → component returns `null` (parent `.country-selector__atlas` already has CSS fallback visual as background).

**Loading state:** while GeoJSON loads → show existing CSS atlas rings as background (they remain in DOM behind the canvas).

---

### Slice 3 — Wire into `CountrySelectorClient` + CSS update

**File:** `apps/Traffic/src/features/home/components/CountrySelectorClient.jsx` (MOD)

Add at top:
```js
import dynamic from "next/dynamic";
const TrazeGlobe = dynamic(
  () => import("@/shared/components/TrazeGlobe"),
  { ssr: false }
);
```

Replace the contents of `.country-selector__atlas` div:
- Keep: `.country-selector__atlas-ring` × 3 (show behind globe as loading fallback)
- Keep: `.country-selector__atlas-panel` (bottom-left info panel — overlays the globe)
- Remove: `.country-selector__atlas-grid`, `.country-selector__atlas-core`, `.country-selector__map-node` buttons
- Add: `<TrazeGlobe countries={countries} activeCountryCode={activeCountryCode} onHover={setActiveCountryCode} onCountryClick={handleSelectCountry} />`

**File:** `apps/Traffic/src/styles/layout.css` (MOD, targeted edits)
- `.country-selector__atlas` — remove `::before` conic gradient (globe replaces it), keep dimensions, border, box-shadow
- `.country-selector__atlas-grid` — keep (shows as subtle bg while globe loads)
- `.country-selector__map-node*` — remove (buttons replaced by globe interaction)
- `.country-selector__atlas-panel` — promote `z-index` to 10 (overlays globe canvas)

**File:** `apps/Traffic/src/app/globals.css` — no change needed (globe canvas has no new stylesheet)

---

### Files Expected To Change

NEW:
- `apps/Traffic/src/shared/components/TrazeGlobe.jsx`

MOD:
- `apps/Traffic/src/features/home/components/CountrySelectorClient.jsx`
- `apps/Traffic/src/styles/layout.css` (targeted class removals + z-index tweak)
- `apps/Traffic/package.json` (via npm install)

### No Changes
- Routing
- Country card sidebar (market-panel)
- Navigation logic (`handleSelectCountry`, `writeStoredTrazeLocation`)
- Any other page

### Blocking Risks
- `react-globe.gl` = WebGL + Three.js — must be `dynamic({ ssr: false })` at both import sites
- `topojson-client` dynamic import inside `useEffect` — must use `.then(mod => mod.feature(...))` pattern (not top-level `await`)
- `countries-110m.json` numeric codes — need ISO numeric → alpha-2 lookup to identify active countries; missing codes fall back to inactive color
- Globe canvas fills the `.country-selector__atlas` container — must set `width` and `height` via `ResizeObserver` on the container ref, not hardcoded values
- The `globe.gl` `controls()` method is only available after mount — wrap in `useEffect` with null guard

---

## Execution Summary

### Completed

**Slice 1 — Package install**
- Installed `react-globe.gl@^2.37.1` and `topojson-client@^3.1.0` into `apps/Traffic/`
- Both appear in `apps/Traffic/package.json` dependencies

**Slice 2 — TrazeGlobe component**
- Created `apps/Traffic/src/shared/components/TrazeGlobe.jsx`
- `"use client"` with `useRef`, `useState`, `useEffect`, `next/dynamic`
- `ReactGlobe` dynamically imported with `ssr: false`
- ISO numeric → alpha-2 lookup embedded (`ISO_NUMERIC` map)
- Approximate country centroids embedded (`CENTROIDS` map)
- `detectWebGL()` guard — returns `null` on failure (CSS rings show through as fallback)
- GeoJSON fetched client-side from jsDelivr CDN, converted via dynamic `topojson-client` import
- hexPolygons layer: active → purple, live → muted purple, inactive → dark
- Points layer: sized by `Math.sqrt(providerCount)`, pulse-colored on active
- Auto-rotate enabled 400ms after mount via `controls()` guard
- `ResizeObserver` feeds canvas `width`/`height` from container ref

**Slice 3 — CountrySelectorClient wiring + CSS cleanup**
- Modified `apps/Traffic/src/features/home/components/CountrySelectorClient.jsx`
  - Added `dynamic` import of `TrazeGlobe` with `ssr: false`
  - Removed `COUNTRY_ATLAS_POINTS` constant (no longer used)
  - Removed `.country-selector__atlas-grid`, `.country-selector__atlas-core`, all `.country-selector__map-node` buttons from JSX
  - Kept: rings × 3 (loading fallback), `.country-selector__atlas-panel` (info overlay)
  - Added `<TrazeGlobe>` wired with `countries`, `activeCountryCode`, `onHover`, `onCountryClick`
- Modified `apps/Traffic/src/styles/layout.css`
  - Removed: `.country-selector__atlas-grid`, `.country-selector__atlas-core`, `.country-selector__atlas-core span`, `.country-selector__map-node` (all variants)
  - Simplified `.country-selector__atlas-ring` — added `pointer-events: none`, reduced opacity
  - Promoted `.country-selector__atlas-panel` `z-index` from 6 → 10 (overlays WebGL canvas)

### Files Changed
- NEW: `apps/Traffic/src/shared/components/TrazeGlobe.jsx`
- MOD: `apps/Traffic/src/features/home/components/CountrySelectorClient.jsx`
- MOD: `apps/Traffic/src/styles/layout.css`
- MOD: `apps/Traffic/package.json`

### SENTRY Status
ALIGNED — component added at shared layer, no layer boundary crossed. `TrazeGlobe` is a pure presentational WebGL component with no data fetching or business logic. `CountrySelectorClient` retains full navigation/state ownership.

### Follow-Up (Non-Blocking)
- Mobile: consider reducing globe height and disabling auto-rotate below 640px via `useEffect` media query

NOTE OF COMPLETITION
