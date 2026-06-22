# TRAZE Implementation Log (Traffic Public Layer)

This document summarizes the major implementation work completed in the Traffic app as it evolved into the TRAZE public discovery surface.

## 1) Public Content Distribution Layer

- Added read-only public content integration for VPORT content.
- Built DAL + connector + repository flow for public content consumption with safe fallbacks.
- Added standalone guide pages using canonical content data.
- Added homepage guide previews backed by repository data.
- Added related guides blocks on directory contexts.
- Integrated guide pages into static params + sitemap candidate flow.

Key outcomes:
- Traffic remains read-only.
- Content fetch failures fall back safely (no build hard-fail).
- Canonical guide pages became indexable SEO surfaces.

## 2) Canonical Guide URL Migration

- Implemented canonical guide route:
  - `/guides/[profileSlug]/[contentSlug]`
- Preserved backward compatibility:
  - Legacy slug-only guide URLs redirect to canonical provider-scoped URLs.
- Updated internal links (homepage, related guides, provider contexts) to canonical guide URLs.

Key outcomes:
- Reduced URL ambiguity.
- Provider-scoped guides now form the primary crawl target.

## 3) Internal Link Graph Strengthening

- Added/expanded provider ↔ guide ↔ directory linking:
  - Guide backlinks to provider and relevant directory pages.
  - Provider page “Guides & Resources” section.
  - Directory related guides with stronger provider context links.
  - Guide contextual navigation (“More from this provider”, service/city browse paths).

Key outcomes:
- Stronger crawl paths.
- Better user flow between discovery, trust, and conversion surfaces.

## 4) Public Review Trust Surfaces

- Added read-only public review summary integration.
- Introduced reusable trust summary component and rendered it across:
  - Provider pages
  - Guide provider context
  - Directory provider cards

Key outcomes:
- Trust signals (rating/count/badges) surfaced where users decide to click/book.
- Safe fallback to existing mock/provider stats when API summaries are unavailable.

## 5) TRAZE Branding Update (UI/Metadata)

- Updated user-facing branding references from Traffic/VCSM wording to TRAZE across:
  - Global shell branding
  - Homepage sections and CTA copy
  - Guide/provider/directory section labels
  - Empty/fallback guide messaging
  - Metadata defaults and OG site name fallback
  - Guide JSON-LD publisher naming

Constraints respected:
- No route renames.
- No API or data-layer contract renames.
- No import/path refactors.

## 6) ISR + On-Demand Revalidation (Current Phase)

### ISR TTLs

- Added page-level revalidation:
  - Guides: `3600s`
  - Service directories: `900s`
  - Specialty directories: `900s`
  - Provider pages: `900s`

### Revalidation API

- Added secure endpoint:
  - `POST /api/revalidate`
- Validates `x-revalidate-secret` against `REVALIDATE_SECRET`.
- Accepts payload:
  - `{ "paths": [...], "tags": [...] }`
- Applies:
  - `revalidatePath(path)`
  - `revalidateTag(tag)`

### Fetch Tagging

- Added lightweight fetch tagging in public content/review connectors.
- Supports tags such as:
  - `guide:{slug}`
  - `provider:{slug}`
  - `directory:{cityOrLocation}:{service}`

### Helper Client

- Added server helper for future integration:
  - `src/lib/revalidateClient.js`
- Sends signed POST to `/api/revalidate` with paths/tags payload.

### Cache Freshness Note

- Removed long-lived in-memory content/review summary caching that could outlive ISR windows.
- Freshness now relies on Next fetch cache + TTL/tags, so revalidate calls can take effect predictably.

## Operational Notes

- Required env var:
  - `REVALIDATE_SECRET`
- Typical trigger from VCSM:
  - Revalidate path(s) for canonical pages and matching tags for shared data.

Example:

```bash
curl -X POST https://traffic.vibezcitizens.com/api/revalidate \
  -H "x-revalidate-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"paths":["/us/pro/luna-cuts-sf"],"tags":["provider:luna-cuts-sf"]}'
```

## 7) Traze Public Design System (May 9, 2026)

### Problem solved

Public-facing pages (homepage, category discovery, country hub) had grown an accumulation of copy-pasted shell divs, duplicate hero markup, and feature-local CSS classes that duplicated each other. There was no single source of truth for the page wrapper or shared visual primitives.

### New shared components

Six new shared components created in `apps/Traffic/src/shared/components/`:

- **`TrazePageShell.jsx`** — Server component. Single source of truth for the top-level page wrapper div (`homepage homepage--immersive traze-public-screen`). Props: `children`, `className`. Replaced 8 copy-pasted shell divs across all public pages.
- **`TrazeProviderCard.jsx`** — Full provider card, moved from `features/home/components/HomepageProviderCard.jsx`. Exports `getCategoryStyle`. `"use client"`.
- **`TrazeCategoryCard.jsx`** — Extracted category card. Props: `categoryKey`, `label`, `description`, `isLive`, `href`, `pills`, `lang`. `"use client"`.
- **`TrazeHero.jsx`** — Bilingual hero component. `"use client"`, uses `useTrafficLanguage`. Props: `eyebrowEn/Es`, `titleEn/Es`, `subtitleEn/Es`, `stats`, `children`.
- **`TrazeSection.jsx`** — Server-safe section wrapper. Props: `title`, `href`, `linkLabel`, `className`, `children`. Uses `.traze-section` CSS.
- **`TrazeEmptyState.jsx`** — Bilingual empty state. `"use client"`.

### New CSS

`apps/Traffic/src/styles/traze-public-system.css` — shared visual primitives used across all public page templates: `.traze-eyebrow`, `.traze-stat-pill`, `.traze-stats-row`, `.traze-hero-card`, `.traze-hero-title`, `.traze-hero-sub`, `.traze-section`, `.traze-section-header`, `.traze-section-title`, `.traze-section-link`, `.traze-empty-state`.

`globals.css` — added import for `traze-public-system.css` as the second import (after tokens).

### Migration

- `HomepageProviderCard.jsx` became a 1-line re-export shim: `export { default, getCategoryStyle } from "@/shared/components/TrazeProviderCard"`.
- 8 page/template files had their shell div replaced with `<TrazePageShell>`.
- `CountryHubTemplate.jsx` fully rewritten: uses `TrazeProviderCard`, `TrazeSection`, `TrazePageShell`; hero uses `.traze-hero-card .traze-page-hero` CSS; bilingual via `useTrafficLanguage` (added `"use client"`).
- `country-hub.css` — removed `.ch-hero-*`, `.ch-stat-pill`, `.ch-section*` classes (all moved to `traze-public-system.css`).

Key outcomes:
- Single page shell source of truth — no more copy-pasted wrapper divs.
- Shared CSS primitives replace scattered feature-local duplicates.
- Design system is now addable-to without touching individual page files.

---

## 8) TrazeGeoExplorer Geographic Explorer (May 9, 2026)

### Problem solved

The `StateCityBrowser` inner component in `CountryHubTemplate` displayed a flat list of city chips with no geographic hierarchy, no provider counts, and no expand/collapse behavior.

### New component

`apps/Traffic/src/shared/components/TrazeGeoExplorer.jsx`

- `"use client"`, uses `useTrafficLanguage` + `useState`
- Props: `geoData` — array of country objects (multi-country aware; single-country case skips country header)
- Sub-components defined in the same file: `CityLink`, `StateGroup` (expandable toggle), `CountryHeader`
- Behavior: all states start collapsed; clicking a state row expands/collapses its city list; each state row shows `stateName + N providers · N cities`; each city chip shows a provider count badge
- Countries and states with no cities are filtered out before render

### New CSS

`apps/Traffic/src/styles/pages/traze-geo-explorer.css` — `.tge-*` prefix. State toggle uses a `›` chevron that rotates 90deg when expanded and 0deg when collapsed. Mobile breakpoint (≤640px) hides `.tge-state-meta`.

`globals.css` — added import for `traze-geo-explorer.css` after `country-hub.css`.

### `_renderers.jsx` changes

- Added `getRegionByCode` to the `geo.repo` import.
- `groupCitiesByState()` output extended inside `renderCountryPage()`: each state group now carries `stateName` (resolved via `getRegionByCode(graph.country.id, stateCode)?.name`, falling back to the raw `stateCode`), `providerCount` (sum of all city provider counts), and `cityCount`.
- Builds a `geoData` array with shape: `[{ countryCode, countrySlug, countryName, countryNameEs, providerCount, cityCount, stateGroups: [{ stateCode, stateName, providerCount, cityCount, cities }] }]`.
- Passes `geoData` prop to `CountryHubTemplate` (replaces the old `stateGroups` prop).

### `CountryHubTemplate.jsx` changes

- Removed the `StateCityBrowser` inner function.
- Added `import TrazeGeoExplorer from "@/shared/components/TrazeGeoExplorer"`.
- `geoData` prop replaces `stateGroups` prop.
- Geo section now rendered as: `<TrazeSection title={...}><TrazeGeoExplorer geoData={geoData} /></TrazeSection>`.

### `country-hub.css` changes

Removed all old location tree classes: `.ch-location-tree`, `.ch-country-row`, `.ch-country-header`, `.ch-country-code`, `.ch-state-groups`, `.ch-state-group`, `.ch-state-label`, `.ch-city-grid`, `.ch-city-chip`, `.ch-city-name`, `.ch-city-count`. Kept: `.ch-featured-grid`, `.ch-service-grid`, `.ch-service-chip`, `.ch-service-name`, `.ch-service-count`.

Key outcomes:
- State/region hierarchy now visible with provider counts.
- Expand/collapse keeps the page scannable without overwhelming the user.
- `geoData` shape is now the canonical data contract between `_renderers.jsx` and `CountryHubTemplate`.

---

## 9) Homepage and Search UX Fixes (May 9, 2026)

### `HomepageCountryGroup.jsx`

- Removed `Link` import (no longer used in the component).
- Removed the "Ver directorio →" link from country group headers.
- Added `const visibleProviders = group.providers.slice(0, 3)` — always shows a maximum of 3 providers per country group.

### `HomepageTopProvidersSection.jsx`

- Removed the "Ver todos los listados →" (`hp-view-all`) link from the section header.

### `CategoriesDiscoveryClient.jsx`

- Hero section restructured: class changed from `homepage-section homepage-directory-surface traze-page-hero` to `traze-hero-card traze-page-hero`, now uses `traze-eyebrow`, `traze-hero-title`, `traze-hero-sub`.
- `TrazeSearchBar` moved out of the hero section — now sits as a standalone panel below the hero, matching the country hub visual structure.

### `DirectoryFilterRow.jsx`

- Fixed: `initialLocation` is now only passed when a `citySlug` exists. Previously, on country-level pages it passed `{ label: locationLabel, countrySlug, citySlug: null }`, which caused the country name to appear as a chip inside the city text input.
- Fix: `initialLocation={citySlug ? { label: locationLabel, countrySlug, citySlug } : null}`.

### `TrazeSearchBar.jsx`

- Fixed `handleCountryChange`: when `onSearch` is not provided and a country is selected, the component now auto-navigates to `/${country.countrySlug}`. Previously, the country dropdown on directory and country hub pages required an explicit "Buscar" click to navigate; now it navigates immediately on selection.

---

## Current Architecture Status

- Traffic/TRAZE remains an isolated, read-only Next.js App Router surface.
- Content/review public integration is additive and resilient.
- Canonical routing and sitemap behavior remain intact.
- ISR + on-demand revalidation now provide controlled freshness without broad route rewrites.
- A shared design system is in place (`TrazePageShell`, `TrazeSection`, `TrazeHero`, `TrazeProviderCard`, `TrazeCategoryCard`, `TrazeEmptyState`, `TrazeGeoExplorer`) backed by `traze-public-system.css` and `traze-geo-explorer.css`. All public pages consume the shared shell; no copy-pasted page wrappers remain.
