# Planning — May / 09 / Sequence 03

## Task
Refactor country directory page (/us, /mx, etc.) into a structured navigation hub instead of a flat all-provider list.

## Execution Plan

**Task Class:** IMPLEMENTATION
**Application Scope:** TRAFFIC
**SENTRY Review:** Required — Post-Execution
**SENTRY Scope:** _renderers.jsx, CountryHubTemplate.jsx
**SENTRY Timing:** Post-Execution
**Estimated Time:** ~15 min
**Execution Type:** Split (3 slices)

---

### What changes

**Current behavior (bad):**
`renderCountryPage()` → `DirectoryPageTemplate` → dumps ALL providers in one long list

**New behavior:**
`renderCountryPage()` → `CountryHubTemplate` → structured hub:
  1. Hero + breadcrumbs + stats
  2. Search bar (existing DirectoryFilterRow)
  3. Featured providers (max 6 cards — HomepageProviderCard shape)
  4. Browse by state/city (cities grouped by stateCode)
  5. Browse by service (service links with provider counts)
  6. CTA footer

---

### Slice 1 — CountryHubTemplate.jsx (NEW)

**Path:** `apps/Traffic/src/features/directories/templates/CountryHubTemplate.jsx`

Server component. Props:
- `country` — { name, slug, nameEs, code }
- `breadcrumbs` — array
- `schema` — JSON-LD
- `context` — { countrySlug }
- `featuredProviders` — max 6 mapped cards
- `stateGroups` — [{ stateCode, stateName, cities: [{name,slug,providerCount}] }]
- `serviceGroups` — [{ label, labelEs, href, providerCount }]
- `locationOptions`, `countryOptions` — for search bar
- `lang` handled client-side via useTrafficLanguage inside child components

Sections rendered:
- JsonLdScript
- Breadcrumbs + hero stat bar (providerCount · cityCount · categoryCount)
- DirectoryFilterRow (existing)
- Featured providers grid (HomepageProviderCard)
- State/city browser (stateGroups)
- Service links grid
- DirectoryCtaModules

**Estimated lines:** ~210

---

### Slice 2 — _renderers.jsx (MODIFIED)

**Path:** `apps/Traffic/src/app/(seo)/[city]/_renderers.jsx`

`renderCountryPage()` changes:
1. Add `groupCitiesByState(cities)` pure helper (groups by stateCode)
2. Add `toHubCard(item, countrySlug)` mapper (DirectoryItem → HomepageProviderCard shape)
3. Compute:
   - `featuredProviders` = first 6 providers mapped via toHubCard
   - `stateGroups` = groupCitiesByState(cities) with per-city provider counts
   - `serviceGroups` = services that have ≥1 provider in this country
4. Import and render `CountryHubTemplate` instead of `DirectoryPageTemplate`

**renderLegacyCityPage()** — untouched.

**Current lines:** 195
**Estimated after:** ~255 (under 300 ✓)

---

### Slice 3 — CSS + globals import

**Path:** `apps/Traffic/src/styles/pages/country-hub.css` (NEW)

Classes:
- `.ch-hero-stats` — stat pills row
- `.ch-featured-grid` — 3-col provider card grid
- `.ch-section` — generic hub section wrapper
- `.ch-section-header` — section title + "view all" link
- `.ch-state-group` — one state block
- `.ch-state-label` — state name badge
- `.ch-city-grid` — city link chips
- `.ch-city-chip` — individual city link
- `.ch-service-grid` — service link chips
- `.ch-service-chip` — individual service link

**Path:** `apps/Traffic/src/app/globals.css` — add import line

---

## Execution Summary

**Completed:** Country directory page refactored from flat provider dump → structured navigation hub.

**Files Changed:**

1. NEW `apps/Traffic/src/features/directories/templates/CountryHubTemplate.jsx` (169 lines)
   - Server component — hub layout with 4 sections
   - Stat pills (providerCount · cityCount · serviceCount)
   - Featured providers grid (≤6 cards via HomepageProviderCard)
   - State/city browser (cities grouped by stateCode → city chips)
   - Service browser (service chips with provider count)
   - Reuses: DirectoryBreadcrumbs, DirectoryFilterRow, DirectoryCtaModules, HomepageProviderCard

2. MOD `apps/Traffic/src/app/(seo)/[city]/_renderers.jsx` (195 → 239 lines)
   - Added `groupCitiesByState()` pure helper
   - Added `toHubCard()` mapper (DirectoryItem → HomepageProviderCard shape)
   - `renderCountryPage()` now computes: featuredProviders (≤6), stateGroups, serviceGroups
   - Returns `<CountryHubTemplate>` instead of `<DirectoryPageTemplate>`
   - `renderLegacyCityPage()` — untouched

3. NEW `apps/Traffic/src/styles/pages/country-hub.css` (211 lines)
   - `.ch-hero-title/sub/stats` — hero typography + stat pills
   - `.ch-section/ch-section-header/ch-section-title` — generic section wrapper
   - `.ch-featured-grid` — 3-col responsive provider card grid
   - `.ch-state-group/ch-state-label/ch-city-grid/ch-city-chip` — state/city browser
   - `.ch-service-grid/ch-service-chip` — service browser

4. MOD `apps/Traffic/src/app/globals.css`
   - Added `@import "../styles/pages/country-hub.css"`

**Contract compliance:**
- All files under 300 lines (§4.1 ✓)
- All imports use `@/...` (§1.1 ✓)
- No city/service pages touched
- No Supabase changes

**SENTRY:** Post-execution — architecture clean. CountryHubTemplate is a pure composition layer (no DB, no business logic). _renderers.jsx helper functions are pure transformers. No layer boundary violations.

### No Changes
- City pages (`/us/dallas`) — untouched
- Service pages — untouched
- DirectoryPageTemplate — still used for city/service pages
- provider.repo.js — no changes (already at 337 lines — noted as pre-existing violation)
- Supabase views — no changes
- All other routes

NOTE OF COMPLETITION

