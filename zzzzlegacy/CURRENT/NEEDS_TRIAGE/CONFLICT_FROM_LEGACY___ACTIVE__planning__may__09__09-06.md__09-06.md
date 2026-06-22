# Planning — May / 09 / Sequence 06

## Task
Redesign "Explora por ubicación" into a structured geographic explorer: Country → State → City with expandable groups, provider counts, and mobile accordion.

## Execution Plan

**Task Class:** IMPLEMENTATION
**Application Scope:** TRAFFIC
**SENTRY Review:** Optional — Post-Execution
**SENTRY Scope:** TrazeGeoExplorer.jsx, CountryHubTemplate.jsx
**SENTRY Timing:** Post-Execution
**Estimated Time:** ~25 min
**Execution Type:** Split (4 slices)

---

### Current State

`groupCitiesByState()` in `_renderers.jsx` already produces:
```
[{ stateCode, cities: [{ slug, name, nameEs, href, providerCount }] }]
```

Missing:
- `providerCount` per state (cities have it; state does not)
- `stateName` for display (only `stateCode` available)
- Proper visual hierarchy — current output is small chips in a flat group
- Expandable/accordion behavior
- Mobile responsiveness
- Provider count badges at state level

---

### Slice 1 — Data enrichment in `_renderers.jsx`

**File:** `apps/Traffic/src/app/(seo)/[city]/_renderers.jsx`

Enhance `groupCitiesByState()`:
- Compute `providerCount` per state = sum of city providerCounts
- Add `stateName`: try `getRegionByCode(country.id, stateCode)?.name` → fallback to stateCode

Build `geoData` prop as:
```
[{
  countryCode,
  countrySlug,
  countryName,
  countryNameEs,
  providerCount,
  cityCount,
  stateGroups: [{
    stateCode,
    stateName,
    providerCount,
    cityCount,
    cities: [{ slug, name, nameEs, href, providerCount }]
  }]
}]
```

Pass `geoData` to `CountryHubTemplate` (replaces `stateGroups` prop).

Import `getRegionByCode` from `@/data/repositories/geo.repo`.

---

### Slice 2 — `TrazeGeoExplorer` component

**File:** `apps/Traffic/src/shared/components/TrazeGeoExplorer.jsx` (NEW)

`"use client"` — uses `useTrafficLanguage` + `useState`.

Props:
- `geoData` — array described above (multi-country aware)
- single-country case: `geoData.length === 1` skips country header, goes straight to states

Sub-components (all in same file):
- `CountryHeader({ country, lang })` — country row with name + meta counts (only shown if >1 country)
- `StateGroup({ state, expanded, onToggle, lang })` — clickable state row + city list
- `CityLink({ city, lang })` — individual city chip

Behavior:
- Desktop (≥768px): all state groups expanded by default
- Mobile: first state group expanded, rest collapsed; click header to toggle
- State row shows: `stateName` + `{providerCount} providers · {cityCount} cities`
- City chip shows: city name + optional tiny provider count badge if `providerCount > 0`
- Countries with no states and no cities: hidden
- States with no cities: hidden

---

### Slice 3 — CSS: `traze-geo-explorer.css`

**File:** `apps/Traffic/src/styles/pages/traze-geo-explorer.css` (NEW)

Classes (`.tge-*` prefix):
- `.tge-wrap` — outer container
- `.tge-country-header` — country row (code badge + name + meta)
- `.tge-state-list` — flex-column list of state groups
- `.tge-state-group` — single state block
- `.tge-state-toggle` — clickable state header row
- `.tge-state-code` — uppercase code badge
- `.tge-state-name` — state display name
- `.tge-state-meta` — "N providers · N cities" dimmed text
- `.tge-state-chevron` — expand/collapse arrow (rotates on expand)
- `.tge-city-grid` — flex-wrap city chips row
- `.tge-city-chip` — individual city link
- `.tge-city-name` — city label
- `.tge-city-count` — optional provider count badge

Mobile:
- `.tge-state-group--collapsed .tge-city-grid` → `display: none` (or `max-height: 0`)
- Smooth height transition on expand

**File:** `apps/Traffic/src/app/globals.css`
- Add import for `traze-geo-explorer.css`

---

### Slice 4 — Integration + cleanup

**File:** `apps/Traffic/src/features/directories/templates/CountryHubTemplate.jsx`
- Import `TrazeGeoExplorer` from `@/shared/components/TrazeGeoExplorer`
- Remove `StateCityBrowser` inner function
- Replace: `<StateCityBrowser country={country} stateGroups={stateGroups} lang={lang} />`
  → `<TrazeGeoExplorer geoData={geoData} />`
- Remove `stateGroups` prop; add `geoData` prop

**File:** `apps/Traffic/src/styles/pages/country-hub.css`
- Remove unused `.ch-location-tree`, `.ch-country-row`, `.ch-country-header`, `.ch-country-code`, `.ch-state-groups`, `.ch-state-group`, `.ch-state-label`, `.ch-city-grid`, `.ch-city-chip`, `.ch-city-name`
- Keep: `.ch-featured-grid`, `.ch-service-grid`, `.ch-service-chip`, `.ch-service-name`

---

### Files Expected To Change

NEW:
- `apps/Traffic/src/shared/components/TrazeGeoExplorer.jsx`
- `apps/Traffic/src/styles/pages/traze-geo-explorer.css`

MOD:
- `apps/Traffic/src/app/(seo)/[city]/_renderers.jsx`
- `apps/Traffic/src/features/directories/templates/CountryHubTemplate.jsx`
- `apps/Traffic/src/styles/pages/country-hub.css`
- `apps/Traffic/src/app/globals.css`

### No Changes
- Routing — no URL changes
- Provider data logic
- Supabase views
- City/service/provider pages

### Blocking Risks
- `getRegionByCode(countryId, stateCode)` takes a countryId (UUID), not countryCode. Must resolve via `getCountryByCode(countryCode).id`. If country ID is null (for seed countries not in taxonomy), stateName falls back to stateCode.
- CSS accordion: use `display: none` toggle via JS className for reliability across browsers (not CSS-only max-height hack).

---

## Execution Summary

**Completed:** TrazeGeoExplorer built and integrated. All 4 slices executed.

### Slice 1 — Data enrichment in `_renderers.jsx`
- Added `getRegionByCode` to geo.repo import
- Replaced flat `stateGroups` computation with enriched per-state data: `stateName` (via `getRegionByCode(graph.country.id, stateCode)?.name ?? stateCode`), `providerCount` (sum of city counts), `cityCount`
- Built `geoData` array with country-level wrapper (`countryCode`, `countrySlug`, `countryName`, `countryNameEs`, `providerCount`, `cityCount`, `stateGroups`)
- Used `graph.country.id` directly (already the UUID from taxonomy lookup — no extra `getCountryByCode` call needed)
- Fallback chain working: null countryId → `getRegionByCode` returns null → stateName falls back to stateCode

### Slice 2 — `TrazeGeoExplorer.jsx` (NEW)
- NEW `src/shared/components/TrazeGeoExplorer.jsx` — `"use client"`, uses `useTrafficLanguage` + `useState`
- Sub-components in same file: `CityLink`, `StateGroup`, `CountryHeader`
- Desktop: all state groups expanded on mount (all keys in initial Set)
- Mobile (`<768px`): `useEffect` collapses all but first state key after hydration
- `toggleState()` uses functional Set update to avoid stale closure
- Country headers only rendered when `geoData.length > 1` (single-country case skips header)
- States/countries with no cities are filtered out before render

### Slice 3 — `traze-geo-explorer.css` (NEW)
- NEW `src/styles/pages/traze-geo-explorer.css` — `.tge-*` prefix throughout
- State toggle: `›` chevron rotates 90deg when expanded, 0deg when collapsed
- Mobile: `.tge-state-meta` hidden at ≤640px (saves horizontal space)
- JS className toggle (`tge-state-group--collapsed`) used per plan — no max-height CSS hack

### Slice 4 — Integration + cleanup
- MOD `CountryHubTemplate.jsx` — removed `StateCityBrowser` inner function; added `TrazeGeoExplorer` import; `geoData` prop replaces `stateGroups`; geo section wrapped in `<TrazeSection>` with bilingual title
- MOD `country-hub.css` — removed all old location tree classes (`.ch-location-tree`, `.ch-country-row`, `.ch-country-header`, `.ch-country-code`, `.ch-state-groups`, `.ch-state-group`, `.ch-state-label`, `.ch-city-grid`, `.ch-city-chip`, `.ch-city-name`, `.ch-city-count`); kept `.ch-featured-grid`, `.ch-service-grid`, `.ch-service-chip`, `.ch-service-name`, `.ch-service-count`
- MOD `globals.css` — added `@import "../styles/pages/traze-geo-explorer.css"` after `country-hub.css`
- Verified zero remaining references to removed CSS classes across all `.jsx`/`.js`/`.css` files

**SENTRY:** Optional post-execution on `TrazeGeoExplorer.jsx` and `CountryHubTemplate.jsx` per plan.

NOTE OF COMPLETITION
