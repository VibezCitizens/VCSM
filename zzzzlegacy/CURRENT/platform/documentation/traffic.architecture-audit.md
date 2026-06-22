# Traffic — Architecture Audit

Generated: 2026-04-19
Last Updated: 2026-04-29
Source: `apps/Traffic/docs/TRAFFIC_ARCHITECTURE_REVIEW.md` (full 1444-line report)
Codebase: `/Users/vcsm/Desktop/VCSM/apps/Traffic`

---

## 1. What Traffic Is

Traffic is a **Next.js 14 (App Router) programmatic SEO directory engine** — not a social app, not part of VCSM or Wentrex. It is a completely standalone project with its own boundary.

**Purpose:** Publish indexable city/service/neighborhood/provider directory pages → generate organic search traffic → route qualified visitors back to the VCSM platform via deep links with tracking parameters.

**Target domain:** `traze.vibezcitizens.com` (internal: `DEFAULT_SITE_ORIGIN` in `src/lib/env.js`)

**Current state:** MVP prototype. All data is mock/hardcoded. No database. No Supabase. No engine imports. No auth. No user sessions. Fully self-contained.

---

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14.2.15 (App Router, React 18.3.1) |
| Rendering | 100% static at build time (no ISR, no server rendering) |
| State | None — read-only directory |
| Auth | None — public discovery only |
| Data | Mock dataset in memory (no DB) |
| Styling | CSS custom properties (`globals.css`) — dark theme |
| Deployment | Single domain, Cloudflare Pages |

---

## 3. Page Types

Traffic publishes **8 primary + 2 legacy** page types:

| Type | Pattern | Index |
|---|---|---|
| Country | `/{countrySlug}` e.g. `/us` | ✅ |
| Country-City | `/{country}/{city}` | ✅ |
| Country-City-Service | `/{country}/{city}/{service}` | ✅ (min 1 provider) |
| Country-Service-Hub | `/{country}/services/{service}` | ✅ (min 3 providers + 2 cities) |
| Country-Locality-Service | `/{country}/{city}/{locality}/{service}` | ✅ (min 1 provider) |
| Country-Locality-Service-Specialty | `/{country}/{city}/{locality}/{service}/{specialty}` | ✅ (min 1 provider) |
| Country-Provider | `/{country}/pro/{providerSlug}` e.g. `/us/pro/john-smith-barber` | ✅ (active + indexable) |
| Content Guide | `/guides/{profileSlug}/{contentSlug}` | ✅ (async from VCSM API) |
| Legacy City | `/{citySlug}` | ❌ noindex (transition) |
| Legacy City-Service | `/{citySlug}/{serviceSlug}` | ❌ noindex (transition) |

All routes have `generateStaticParams()` with quality guards. Legacy routes are `robots: noindex, follow: true` — they exist to preserve old URLs during URL scheme migration.

---

## 4. Data Layer Architecture

```
src/data/
  types.js                         ← JSDoc domain models (all entities)
  connectors/
    mockDataset.js                 ← All mock data (27 providers, 4 services, 11 cities)
    publicContent.connector.js     ← Async fetch from VCSM /api/public/content-pages
    publicReviewSummary.connector.js ← Async fetch from VCSM /api/public/vport-review-summary
  dal/
    publicContent.read.dal.js      ← Wraps content connector with filtering
  repositories/
    city.repo.js                   ← listCities, getCityBySlug, listLocalitiesByCity
    geo.repo.js                    ← Countries, regions, locales, currencies
    service.repo.js                ← listServices, listSpecialtiesByService
    provider.repo.js               ← listProviders, filtered by country/city/locality/service
    aggregate.repo.js              ← Provider stats and price aggregates
    content.repo.js                ← Public content pages (guides) — async, cached
    reviewSummary.repo.js          ← Review summaries — async, cached, not yet wired to routes
    pageCandidate.repo.js          ← Static param generation + quality guards + sitemap chunking
```

**Mock dataset contains:**
- 10 countries, 11 cities, 17 neighborhoods, 4 services (2 live: barber + locksmith), 25 specialties
- 27 providers (14 barbers, 13 locksmiths), 1027 provider-service mappings, 27 stats, 16 price aggregates

---

## 5. Data Layer Production Readiness

| Layer | Status | Notes |
|---|---|---|
| Type system | ✅ Production-ready | Complete JSDoc, all domain entities covered |
| Repository layer | ✅ Production-ready | Synchronous, no N+1, efficient filtering |
| Public content DAL | ✅ Production-ready | Defensive parsing, 4.5s timeout, fallback on error |
| Review summary repo | ✅ Production-ready | Code exists, cached, NOT wired to routes yet |
| Mock dataset | ⚠️ Pilot only | 2 active verticals; no growth path without code edit |

**Overall: ~60% production-ready.** The code layer is solid. The blocker is the mock data — it has no write path and cannot grow without developer intervention.

---

## 6. SEO Implementation

**Status: ~90% complete.**

| Signal | Implementation | Status |
|---|---|---|
| Page titles | Dynamic per page type and entity | ✅ |
| Meta descriptions | Dynamic, context-aware | ✅ |
| OG tags | title, description, image, url | ✅ |
| Canonical URLs | `alternates.canonical` per page | ✅ |
| JSON-LD | LocalBusiness, BreadcrumbList, FAQPage, ItemList | ✅ |
| Sitemap | Chunked at 5000 URLs, `/sitemap-index.xml` | ✅ |
| Breadcrumbs | Accurate per route depth | ✅ |
| robots.txt | Allows all, disallows `/api/`, `/admin/` | ✅ |
| Internal linking | City service links, related provider cards | ✅ |
| Review integration | reviewSummary.repo exists but routes don't use it | ⚠️ |

**Notable:** `pageCandidate.repo.js` handles deduplication of static params across legacy and new routes — prevents duplicate indexable pages.

---

## 7. Conversion Pipeline

**Deep link builder:** `src/lib/deepLinks.js`

All deep links point to the VCSM platform with consistent tracking:
- `source=traffic`
- `surface={page_type}` (e.g. `surface=provider_profile`, `surface=directory`)

**Destinations generated:**
- `/profile/{slug}` — view provider profile
- `/booking/{slug}` — direct booking
- `/follow/{actorId}` — follow provider
- `/claim-profile` — provider claiming CTA
- `/explore?q={service}&location={city}` — explore from directory

**Status:** Deep link generation is confirmed correct. Tracking params are consistent across all CTA modules. CTAs are placed at provider cards, page headers, and directory listings.

---

## 8. Component Architecture

**Templates:**
- `DirectoryPageTemplate` — Used for city, city-service, locality, specialty pages
- `ProviderPageTemplate` — Used for individual provider profile pages

**Shared components:**
- `AppShell` — Navigation + footer shell
- `JsonLdScript` — JSON-LD injector (via `next/script`, `strategy="beforeInteractive"`)
- `ProviderCard` — Reusable provider listing card
- `BreadcrumbNav` — Breadcrumb renderer
- `CTAModule` — Conversion CTA block

**Status:** Clean separation. No logic in page files. No component handles both directory and provider responsibilities.

---

## 9. Styling System

**File:** `src/app/globals.css`

CSS custom property system:
- `--color-*` tokens for all colors (dark theme first)
- `--space-*` for spacing scale
- `--radius-*` for border radius
- `--font-*` for typography

Responsive breakpoints handled via CSS media queries. No Tailwind, no CSS-in-JS.

**Status:** Stable. Consistent dark theme across all pages.

---

## 10. Dead / Orphaned Files

**Confirmed:**
- `src/app/(seo)/pro/[providerSlug]/page.jsx` — Legacy provider route, robots noindex. Intentionally kept for URL continuity but not actively developed.

**Likely (to verify):**
- Any component imported only by legacy routes may become orphaned once legacy routes are deprecated.

**No dead data files confirmed** — all repositories are consumed by at least one route.

---

## 11. Platform Integration Readiness

**What Traffic needs from VCSM to be fully live:**

| Integration | Endpoint | Status |
|---|---|---|
| Content guides | `GET /api/public/content-pages` | Connector ready, env var not set |
| Review summaries | `GET /api/public/vport-review-summary` | Repo ready, not wired to routes |
| Provider data | Supabase query (no endpoint yet) | Mock only |

**To swap mock data for real DB (estimated 2–3 days):**
1. Replace `mockDataset.js` with async Supabase loaders in repository layer
2. Ensure DB schema matches `types.js` field definitions
3. Add ISR or build-time caching (Redis) to keep build time manageable
4. Set env vars: `NEXT_PUBLIC_PLATFORM_ORIGIN`, `TRAFFIC_PUBLIC_CONTENT_API_URL`, `TRAFFIC_PUBLIC_REVIEW_SUMMARY_API_URL`

**Does Traffic need engines?** No. Traffic is read-only discovery. It has no write path, no auth, no user sessions. It should remain standalone. The only integration is HTTP fetch from VCSM public APIs — no engine imports.

**Does Traffic need auth?** Not currently. Provider claiming CTA routes to VCSM — claiming happens on the platform, not in Traffic.

---

## 12. Structural Risks

| Risk | Severity | Details |
|---|---|---|
| Build time at scale | 🔴 High | Current: instant (27 providers). At 5K providers: 30+ min build. ISR required before 500+ providers. |
| Mock data growth | 🔴 High | No way to add providers without code edit. Blocks real use before DB migration. |
| Content guide endpoint not wired | 🟡 Medium | Code is ready; just needs env var + 1 day of wiring. |
| Review summary unused | 🟡 Medium | `reviewSummary.repo.js` exists, route templates don't consume it yet. |
| Hardcoded homepage config | 🟡 Medium | `HOMEPAGE_CITY_SLUGS`, featured verticals are hardcoded in page. Should be DB-driven. |
| Legacy route cleanup | 🟢 Low | Legacy routes are noindex. Deprecation is planned, not urgent. |

---

## 13. Future Work Backlog (Prioritized)

### P0 — Before scaling
1. **ISR implementation** — Add `revalidate` to high-traffic routes before 500+ providers
2. **Supabase migration** — Replace mock dataset with real DB reads (2–3 days)
3. **Wire content guide endpoint** — Set env vars, confirm VCSM API is live (1 day)

### P1 — MVP completion
4. **Wire review summary to provider templates** — `reviewSummary.repo` → `ProviderPageTemplate`
5. **Add makeup + restaurant verticals** — Currently in mock but no live providers
6. **Homepage city config → DB-driven** — Remove hardcoded `HOMEPAGE_CITY_SLUGS`

### P2 — SEO completeness
7. **Image OG coverage** — Some pages may lack actual images for OG (uses placeholder)
8. **FAQ schema expansion** — FAQPage JSON-LD could be richer with real service descriptions
9. **Review-rich snippets** — Once review summary is wired, add `AggregateRating` to provider JSON-LD

### P3 — Infrastructure
10. **Analytics / tracking verification** — Confirm `source=traffic` params are reaching VCSM analytics
11. **Error boundaries** — Pages have no `error.jsx` in App Router convention
12. **404 / not-found pages** — `notFound()` is called in pages but no custom `not-found.jsx`

---

## 14. Recommended Next Steps (Ordered)

1. Confirm VCSM public APIs exist: `GET /api/public/content-pages`, `GET /api/public/vport-review-summary`
2. Set Traffic env vars for those endpoints + deploy to trigger content guide population
3. Wire `reviewSummary.repo.js` to `ProviderPageTemplate` (2–3 hours)
4. Plan Supabase migration for provider/city data — align DB schema with `types.js`
5. Implement ISR (`export const revalidate = 3600`) on city and provider routes before real data
6. Add `error.jsx` and `not-found.jsx` to App Router layout
7. Deploy and monitor — verify tracking params, OG rendering, JSON-LD via Google Search Console

---

## Change Log

| Date | Change |
|---|---|
| 2026-04-19 | Initial audit generated from full codebase review |
