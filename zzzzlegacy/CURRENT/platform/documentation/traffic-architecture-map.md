# ARCHITECT — Traffic Architecture Map
Generated: 2026-05-09
Scope: TRAFFIC only — apps/Traffic/

---

## Overview

Traffic is a Next.js 14 static export acquisition engine.
Role: Programmatic SEO → organic search discovery → deep-link conversion to VCSM.
No auth. No mutations. No engine imports. Read-only public Supabase views.

---

## Route Families

### SEO Route Group: (seo)/

| Route | Purpose |
|---|---|
| /[city] | City directory — all providers in a city |
| /[city]/[segment] | City + service segment directory |
| /[city]/[segment]/[service] | City + segment + service — most granular SEO target |
| /[city]/categories | Category browser for a city |
| /[city]/pro | Provider listing for a city |
| /[city]/top-providers | Top providers in a city |
| /pro/[providerSlug] | Individual provider profile page |

### Public Content Routes

| Route | Purpose |
|---|---|
| / | Homepage — top providers, categories, discovery |
| /directory | Full provider directory |
| /categories | All categories |
| /top-providers | Global top providers |
| /answers/[slug] | Answer/FAQ content pages |
| /guides/[profileSlug]/[contentSlug] | Provider guide content pages |

### Sitemap Routes

| Route | Purpose |
|---|---|
| /sitemap-index.xml | Sitemap index |
| /sitemaps/[chunk] | Chunked sitemaps for large provider sets |

---

## Data Sources

| Source | Status | View/Table |
|---|---|---|
| public_traze_provider_index_v | LIVE — Supabase anon | Provider index with city/service/slug/geo |
| public_traze_portfolio_v | LIVE — Supabase anon | Provider portfolio/profile data |
| Taxonomy (categories/services) | LIVE — taxonomyDataset.js | Fetched from Supabase or static config |
| Price aggregates | LIVE — priceAggregate.read.dal.js | Price data by category |
| Public content/guides | LIVE — publicContent.read.dal.js | Guide/article content |
| Provider reviews | LIVE — providerReviews.connector.js | Review data |
| Mock data | DELETED — mockDataset.js, mockProviders.a/b/c.js removed | No longer used |

---

## Data Layer Architecture

```
public_traze_provider_index_v (Supabase view)
  ↓
vportDataset.read.dal.js      vportHomepage.read.dal.js     trazeCategories.read.dal.js
  ↓                                 ↓                              ↓
vportDataset.controller.js    vportHomepage.connector.js    taxonomyParams.repo.js
  ↓                                 ↓                              ↓
unifiedDataset.js             homepage.repo.js              category.repo.js
  ↓                                 ↓                              ↓
staticParams.repo.js          home feature components       [city]/[segment] pages
  ↓
generateStaticParams()

public_traze_portfolio_v (Supabase view)
  ↓
providerProfile.read.dal.js
  ↓
provider.repo.js
  ↓
/pro/[providerSlug] page
```

---

## Static Param Generation

Traffic uses Next.js generateStaticParams to pre-build all city/service/provider pages at build time.

Fan-out risk:
- generateStaticParams runs for [city], [city]/[segment], [city]/[segment]/[service], and /pro/[providerSlug]
- Each reads from public_traze_provider_index_v
- Three separate DAL files read the same view independently
- At large scale (1000+ providers × N cities × M services), build-time query count could be significant

---

## Conversion Path

Traffic provider page
 → CTA button (Book / View Profile / Contact)
 → Deep link to VCSM with tracking parameters
 → VCSM actor profile or booking flow

VCSM is the source of truth for provider identity, reviews, and booking.
Traffic displays a read-only view — it never writes to VCSM data.

---

## Provider Claim Flow

Provider claim entry: business_claim_requests (or business_intake_leads)
- Traffic surfaces a claim CTA on /pro/[providerSlug]
- Claim request submitted client-side via Supabase anon write
- No auth required to submit a claim request
- VCSM processes claims server-side and links to VPORT actor

SECURITY NOTE: anon claim writes must be validated server-side (RLS + edge function).
Traffic must never trust client-provided actorId or vportId for claim association.

---

## Feature Inventory

### features/answers/
Full layer stack: adapters, components, controller, dal, hooks, model, screens
Purpose: Answer/FAQ content pages (/answers/[slug])

### features/categories/
Components only — no DAL or controller
Purpose: Category browser components

### features/conversion/
Full layer stack: adapters, components, controller, dal, hooks, lib, model
Purpose: CTA, lead capture, deep-link generation to VCSM

### features/directories/
Components, lib, templates
Purpose: Directory listing pages

### features/home/
Components only
Purpose: Homepage sections

### features/providers/
Components, lib, templates
Purpose: Provider card rendering, /pro/[slug] page components

### features/reviews/
Components only
Purpose: Review display components

---

## Sitemap Architecture

/sitemap-index.xml — master sitemap
/sitemaps/[chunk] — chunked provider/page sitemaps

Sitemap generation reads provider index at build time (or runtime if not static).
Large provider counts will increase sitemap build cost.

---

## Execution Model

| Layer | Execution |
|---|---|
| generateStaticParams | Build-time — Supabase reads at build |
| page.jsx data fetch | Build-time (static export) or runtime if ISR enabled |
| provider.repo.js, staticParams.repo.js | Server-side (Next.js server) |
| /api/* routes (reverse-geocode, etc.) | Runtime server — cannot be static |
| Client components | Client-side hydration after static HTML |
| Conversion CTAs | Client-side — no server dependency |

---

## Product Identity

Traffic is a standalone programmatic SEO directory engine. It is NOT part of VCSM and NOT part of Wentrex. It generates static, indexable city/service/neighborhood/provider directory pages and routes organic search visitors back to the VCSM platform via deep links with tracking parameters.

Target domain: `traffic.vibezcitizens.com`

---

## Stack

| Dimension | Value |
|-----------|-------|
| Framework | Next.js 14 (App Router) |
| Language | JavaScript (ES Modules) — `.jsx` / `.js` only, no TypeScript |
| Rendering | Full Static Generation (`output: export`) — `generateStaticParams` on all dynamic routes |
| Styling | Tailwind CSS + CSS custom properties in `globals.css` |
| Data — taxonomy | Static mock dataset in `taxonomyDataset.js` (countries, cities, services, specialties) |
| Data — providers | Supabase read-only via vport connector; falls back to empty if unavailable |
| Deployment | Cloudflare Pages static export |
| Engine imports | ZERO — fully self-contained |
| VCSM imports | ZERO — boundary clean |
| Auth / mutations | ZERO — read-only, no user sessions |

---

## Directory Structure

```
apps/Traffic/src/
├── app/
│   ├── (seo)/                         — SEO route group (no layout wrapper)
│   │   ├── [city]/
│   │   │   ├── _graph.js              — resolvers + metadata builders
│   │   │   ├── _renderers.jsx         — renderCountryPage, renderLegacyCityPage
│   │   │   ├── page.jsx               — thin shell: generateStaticParams, generateMetadata, CityPage
│   │   │   └── [segment]/
│   │   │       ├── _graph.js          — resolvers + metadata builders
│   │   │       ├── _renderers.jsx     — renderCountryCityPage, renderLegacyCityServicePage
│   │   │       ├── page.jsx           — thin shell: generateStaticParams, generateMetadata, DualSegmentPage
│   │   │       └── [service]/
│   │   │           ├── _graph.js      — resolvers + metadata builders (4 route modes)
│   │   │           ├── _directoryRenderers.jsx — directory render functions
│   │   │           ├── _providerRenderer.jsx   — provider profile render function (async)
│   │   │           ├── page.jsx       — thin shell: 4-mode dispatcher
│   │   │           ├── [detail]/
│   │   │           │   └── page.jsx   — locality/detail pages
│   │   │           └── [detail]/[specialty]/
│   │   │               └── page.jsx   — specialty-scoped locality pages
│   │   └── pro/
│   │       └── [providerSlug]/
│   │           └── page.jsx           — legacy provider slug route (redirects to country_provider mode)
│   ├── page.jsx                       — Homepage (live provider cards via Supabase)
│   ├── layout.jsx                     — Root layout + AppShell
│   ├── globals.css                    — CSS custom properties + base styles
│   ├── sitemap.js                     — Next.js sitemap (top-level pages only)
│   ├── sitemaps/[chunk]/route.js      — Chunked XML sitemaps for large page graphs
│   ├── sitemap-index.xml/route.js     — Sitemap index pointing to all chunks
│   └── robots.txt/route.js            — robots.txt generation
│
├── data/
│   ├── dal/                           — Database Access Layer (Supabase queries only)
│   │   ├── providerProfile.read.dal.js
│   │   ├── publicContent.read.dal.js
│   │   └── vportHomepage.read.dal.js
│   ├── connectors/                    — Thin re-export wrappers between DAL and repos
│   │   ├── supabase.client.js         — Supabase client singleton
│   │   ├── unifiedDataset.js          — Primary runtime connector: loads + maps all providers
│   │   ├── vportDataset.js            — Fetches raw vport rows from Supabase (no mapping)
│   │   ├── taxonomyDataset.js         — Static taxonomy (countries, cities, services, specialties)
│   │   ├── providerReviews.connector.js
│   │   ├── publicContent.connector.js
│   │   ├── publicReviewSummary.connector.js
│   │   ├── vportHomepage.connector.js
│   │   ├── mockDataset.js             — DEV ONLY barrel (28 providers, not used by runtime)
│   │   ├── mockProviders.a.js         — DEV ONLY: providers 1–9
│   │   ├── mockProviders.b.js         — DEV ONLY: providers 10–19
│   │   ├── mockProviders.c.js         — DEV ONLY: providers 20–28
│   │   └── mockPriceAggregates.js     — DEV ONLY: price aggregate seeds
│   ├── mappers/                       — Pure transform functions (suffix: .model.js)
│   │   ├── vportToProvider.model.js   — Maps raw Supabase vport row → Provider entity
│   │   └── pageModel.model.js         — Builds DirectoryPageModel / ProviderPageModel
│   ├── repositories/                  — Domain query functions (consume connectors)
│   │   ├── city.repo.js
│   │   ├── geo.repo.js
│   │   ├── service.repo.js
│   │   ├── provider.repo.js
│   │   ├── aggregate.repo.js
│   │   ├── reviewSummary.repo.js
│   │   ├── content.repo.js
│   │   ├── homepage.repo.js
│   │   ├── pageCandidate.repo.js      — Sitemap generation + page candidate lists
│   │   └── staticParams.repo.js       — All generateStaticParams helpers
│   └── types.js                       — JSDoc @typedef entity types
│
├── features/
│   ├── directories/
│   │   ├── templates/
│   │   │   ├── DirectoryPageTemplate.jsx
│   │   │   └── CountryHubTemplate.jsx  — "use client"; receives geoData prop; uses TrazeGeoExplorer + TrazeSection + TrazePageShell
│   │   └── components/                — ProviderListItem, InternalLinkGrid, etc.
│   ├── providers/
│   │   └── templates/ProviderPageTemplate.jsx
│   ├── home/
│   │   └── components/                — Homepage sections
│   ├── reviews/
│   │   └── components/ReviewTrustSummary.jsx
│   └── conversion/
│       ├── components/CtaModules.jsx
│       └── lib/deepLinkBuilder.js
│
├── seo/
│   ├── metadata.js                    — buildDirectoryMetadata, buildProviderMetadata
│   ├── schemaOrg.js                   — JSON-LD builders (BreadcrumbList, ItemList, LocalBusiness)
│   ├── internalLinks.js               — dedupeInternalLinks
│   ├── canonical.js
│   └── qualityGuards.js               — isCountryServiceIndexable, etc.
│
├── lib/
│   ├── paths.js                       — All canonical URL builders
│   ├── slugs.js
│   ├── env.js
│   └── revalidateClient.js
│
├── styles/
│   ├── traze-public-system.css         — Shared public design system primitives (.traze-eyebrow, .traze-hero-card, .traze-section, etc.)
│   └── pages/
│       ├── traze-geo-explorer.css      — TrazeGeoExplorer styles (.tge-* prefix)
│       └── ... (other page-scoped CSS files)
│
└── shared/
    └── components/
        ├── AppShell.jsx
        ├── TrazePageShell.jsx          — Server component; canonical page wrapper div (homepage homepage--immersive traze-public-screen)
        ├── TrazeProviderCard.jsx       — "use client"; full provider card; exports getCategoryStyle
        ├── TrazeCategoryCard.jsx       — "use client"; category card (categoryKey, label, description, isLive, href, pills, lang)
        ├── TrazeHero.jsx               — "use client"; bilingual hero (eyebrowEn/Es, titleEn/Es, subtitleEn/Es, stats, children)
        ├── TrazeSection.jsx            — Server-safe section wrapper (title, href, linkLabel, className, children)
        ├── TrazeEmptyState.jsx         — "use client"; bilingual empty state
        └── TrazeGeoExplorer.jsx        — "use client"; hierarchical geo browser; consumes geoData array prop
```

---

## Architecture Layer Order

```
DAL → Connector → Repo/Model → _graph.js → _renderers.jsx → page.jsx
```

| Layer | Role | Rule |
|-------|------|------|
| DAL | Raw Supabase queries | Never imported directly by repos — always via connector |
| Connector | Thin re-export wrapper | Owns the DAL → domain mapping boundary |
| Repo | Domain queries | Consumes connectors; no DAL imports |
| Model (`*.model.js`) | Pure transforms | No I/O; called by connectors or repos |
| `_graph.js` | Route resolvers + metadata builders | Pure functions; no JSX |
| `_renderers.jsx` | Render functions | Calls repos; returns JSX |
| `page.jsx` | Next.js thin shell | Only `generateStaticParams`, `generateMetadata`, default export |

**Enforced boundaries:**
- Templates/components must NOT import from repos or connectors
- Repos must NOT import DAL directly (must go through a connector)
- Connectors must NOT call model-layer mappers (mapping belongs in the connector that owns the data flow, or in the repo)
- File size limit: 300 LOC per file (excluding blank lines and doc comment blocks)
- Mapper naming: `*.model.js` — not `*.mapper.js`

---

## Route Architecture

| Route Pattern | Route Modes | Static Params Source |
|--------------|-------------|---------------------|
| `/[city]` | `country` \| `legacy_city` | `listCountryStaticParams` + `listCityStaticParams` |
| `/[city]/[segment]` | `country_city` \| `legacy_city_service` | `listCountryCityStaticParams` + `listCityServiceStaticParams` |
| `/[city]/[segment]/[service]` | `country_provider` \| `country_service_hub` \| `country_city_service` \| `legacy_locality_service` | `listCountryProviderStaticParams` + `listCountryServiceHubStaticParams` + `listCountryCityServiceStaticParams` + `listNeighborhoodServiceStaticParams` |
| `/[city]/[segment]/[service]/[detail]` | locality-service | `listCountryLocalityServiceStaticParams` |
| `/[city]/[segment]/[service]/[detail]/[specialty]` | locality-service-specialty | `listCountryLocalityServiceSpecialtyStaticParams` |
| `/pro/[providerSlug]` | provider (legacy slug) | `listProviderStaticParams` |

All `list*StaticParams` functions live in `staticParams.repo.js`. Page files import only from there — not from `pageCandidate.repo.js`.

**Multi-mode dispatch pattern** (service page example):
```
params → _graph.resolvePage() → routeMode
  "country_provider"       → renderCountryProviderPage (async — fetches reviews)
  "country_service_hub"    → renderCountryServiceHubPage
  "country_city_service"   → renderCountryCityServicePage
  "legacy_locality_service"→ renderLegacyLocalityServicePage
```

---

## Data Layer

### Runtime provider data (Supabase)

`vportDataset.js` fetches raw vport rows from Supabase. `unifiedDataset.js` owns the mapping loop via `vportToProvider.model.js`. The result is cached in-process for the build window.

`LIVE_DATA_STATUS` is exported from `unifiedDataset.js` — value is `"ok"` when Supabase loaded successfully, `"unavailable"` on failure. Templates receive it as a prop for user-facing status indicators.

### Taxonomy (static)

Countries, regions, cities, localities, services, and specialties live in `taxonomyDataset.js` as plain JS arrays. This file is the single source of truth for the geographic and service taxonomy — no database required.

### Mock dataset (dev only)

`mockDataset.js` is a barrel that assembles 28 providers from three split files (`mockProviders.a/b/c.js`) plus `mockPriceAggregates.js`. No runtime route imports this file. Safe to delete once dev seeding workflows no longer need it.

---

## SEO Pipeline

- All pages statically generated at build (`output: export`)
- `generateMetadata()` exported from every `page.jsx` — produces title, description, robots, canonical, locale
- Schema.org JSON-LD rendered via `JsonLdScript` inside templates — types used: `BreadcrumbList`, `ItemList`, `LocalBusiness`
- Sitemap chunked at ~200 URLs/chunk via `sitemaps/[chunk]/route.js` with a `sitemap-index.xml` pointing to all chunks
- Internal links deduplicated via `dedupeInternalLinks()` to avoid identical hrefs in related-links grids
- Quality guards (`qualityGuards.js`) gate indexability — e.g. `isCountryServiceIndexable` requires minimum provider count and city coverage before a service hub page is linked

---

## VCSM Bridge

Provider entities include:

```js
vcsmActorId: string | null   // VCSM actor UUID
vcsmSlug: string | null      // VCSM profile slug
claimStatus: 'unclaimed' | 'claimed' | 'pending'
claimedAt: string | null
```

Deep link construction via `features/conversion/lib/deepLinkBuilder.js` — adds `utm_source=traffic` and surface params to VCSM profile URLs.

---

## Cross-App Boundary

| Boundary | Status |
|----------|--------|
| Traffic → VCSM imports | ZERO — clean |
| Traffic → Wentrex imports | ZERO — clean |
| Traffic → engines | ZERO — fully standalone |
| VCSM → Traffic imports | ZERO — clean |
