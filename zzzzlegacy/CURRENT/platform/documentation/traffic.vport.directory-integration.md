# TRAZE — VPORT Directory Integration

**Scope:** apps/Traffic (TRAZE)
**Last Updated:** 2026-05-09

---

## Purpose

Documents how VPORT data flows from VCSM into TRAZE, how the directory visibility toggle
controls listing eligibility, and how profile pages are generated for every active VPORT.

---

## Data Pipeline

```
VCSM (Supabase)
  └─ vport.public_traze_profiles_v           ← Supabase view (all VPORT fields)
       │
       ▼
  vportDataset.read.dal.js                   ← DAL: fetches all rows, ordered by created_at
       │
       ▼
  vportDataset.controller.js                 ← flattenVportPublicTrazeProfileRow()
       │
       ▼
  unifiedDataset.js (build-time)             ← mapVportRowToProvider() per row
       │
       ├─ MOCK_PROVIDERS[]                   ← All active VPORTs in memory
       ├─ MOCK_PROVIDER_SERVICES[]
       └─ MOCK_PROVIDER_STATS[]
              │
              ├─ listAllActiveProviders()    → for profile page static params
              └─ listProviders()             → for directory listing pages (isIndexable gate)
```

The dataset is built once at `next build` time. If Supabase is unavailable, arrays are empty
and the build falls back to mock provider slugs for the `/{country}/pro/[providerSlug]` canonical route only.

---

## Field: `directory_visible`

**Source:** `vport.profiles.directory_visible` (boolean, default: true)

**Set by:** VPORT owner via the "Show on TRAZE directory" toggle in VCSM settings
(`features/settings/vports/ui/VportSettingsTrazeCard.jsx`)

**Write path:**
```
VportSettingsTrazeCard → useVportDirectoryVisibility
  → ctrlSetVportDirectoryVisible({ vportId, visible })
  → setVportDirectoryVisibleDAL(vportId, visible)
  → UPDATE vport.profiles SET directory_visible = Boolean(visible)
```

**Effect in TRAZE:**
- `directory_visible = true`  → provider is `isIndexable = true` → appears in directory listing pages (city/service pages, country pages)
- `directory_visible = false` → provider is `isIndexable = false` → excluded from all directory listings
- In both cases the provider **always** has a canonical profile page at `/{country}/pro/[slug]`

---

## Field: `directory_status`

**Source:** `vport.profiles.directory_status` (text, default: `"pending"`)

**Set by:** Admin only — no user-facing control exists.

**Effect in TRAZE:** None. This field is stored and exposed by `public_traze_profiles_v`
but TRAZE does not filter on it. It was previously used as a filter (see Bugs section) but
was removed because it blocked all self-service directory access.

---

## Field: `isIndexable`

Computed in `mapVportRowToProvider()`:

```js
isIndexable: Boolean(row.is_active) && directoryVisible && slug.length > 0
```

- `row.is_active` is hardcoded `true` by `flattenVportPublicTrazeProfileRow()` (all rows
  from the view are considered active)
- `directoryVisible` = `row.directory_visible === true`
- `slug` must be non-empty

**Used by:**
- `listProviders()` — filters by `isActive && isIndexable` for all directory listing repos
- `isProviderIndexable()` — quality guard used in `listCountryProviderStaticParams()`

---

## Profile Pages vs. Directory Listings

These are two separate concepts:

| Surface | Route | Gate | robots | All VPORTs? |
|---------|-------|------|--------|-------------|
| Canonical profile page | `/{country}/pro/[providerSlug]` | `isIndexable` for static build | index | Only directory-listed (static) |
| Legacy redirect | `/pro/[providerSlug]` | none — always redirects | noindex | Yes — redirects to canonical |
| City service pages | `/{country}/[city]/[service]` | `isIndexable` | index | Only directory-listed |
| Service hub pages | `/{country}/services/[service]` | `isIndexable` | index | Only directory-listed |

**Canonical profile page** (`/{country}/pro/[slug]`) — `generateStaticParams` is driven by `listCountryProviderStaticParams()` which filters by `isProviderIndexable`. The page itself uses `getProviderBySlug()` for the lookup.

**Legacy redirect** (`/pro/[slug]`) — `generateStaticParams` uses `listAllActiveProviderStaticParams()` (all active VPORTs). Page resolves the provider's country and issues a Next.js `redirect()` to the canonical URL. It never renders content.

Directory listing pages use `listProviders()` which enforces `isIndexable`.

---

## Static Params Generation

### `/{country}/pro/[providerSlug]` (canonical profile pages — directory-listed VPORTs)

```js
// [city]/pro/[providerSlug]/page.jsx  (static segment "pro" wins over dynamic [segment])
export function generateStaticParams() {
  return listCountryProviderStaticParams().map(entry => ({
    city: entry.country,       // country slug goes in the [city] segment
    providerSlug: entry.slug
  }));
}
```

`listCountryProviderStaticParams()` in `staticParams.repo.js`:
```js
return listProviders().filter(isProviderIndexable).map(p => ({
  country: p.primaryCountrySlug,
  slug: p.slug
}));
```

### `/pro/[providerSlug]` (legacy redirect — all active VPORTs)

```js
// pro/[providerSlug]/page.jsx  — redirect-only, noindex
export function generateStaticParams() {
  const live = listAllActiveProviderStaticParams(); // all active VPORTs
  if (live.length > 0) return live;
  return listMockProviderSlugParams(); // build-time fallback only
}
```

This page never renders content — it resolves the provider's country from the dataset and calls `redirect(countryProviderPath(country.slug, provider.slug))`. robots: noindex, follow.

---

## Provider Lookup

| Function | Filters | Used for |
|----------|---------|----------|
| `getProviderBySlug(slug)` | `isActive && isIndexable` | Canonical profile page (`/{country}/pro/[slug]`) and directory contexts |
| `getProviderBySlugAny(slug)` | `isActive` only | Legacy redirect page (`/pro/[slug]`) — resolves any VPORT to get its country |

---

## Build-Time Fallback (Mock Data)

When Supabase is unavailable at build time (e.g., local build without env vars):
- `loadVportRows()` returns `[]`
- `MOCK_PROVIDERS`, `MOCK_PROVIDER_SERVICES`, `MOCK_PROVIDER_STATS` are all empty arrays
- `listAllActiveProviderStaticParams()` returns `[]`
- `generateStaticParams()` falls back to `listMockProviderSlugParams()` — 28 hardcoded slugs from `mockProviders.a/b/c.js`
- These mock pages render correctly because the mock connectors are still used as fallback

In production deploys with Supabase credentials, the mock fallback is never reached.

---

## Routing Change — 2026-05-09

### Country-first canonical provider URL

**Change:** Provider profile pages moved from `/pro/[slug]` to `/{country}/pro/[slug]`.

- New canonical route: `src/app/(seo)/[city]/pro/[providerSlug]/page.jsx` (static segment `pro` wins over dynamic `[segment]` in Next.js route resolution)
- Legacy route `src/app/(seo)/pro/[providerSlug]/page.jsx` rewritten to redirect-only (noindex, follow)
- `countryProviderPath(countrySlug, providerSlug)` in `lib/paths.js` now returns `/{country}/pro/{slug}` (previously ignored `countrySlug` and returned `/pro/{slug}`)
- Related links and sitemap entries that previously linked to `/pro/{slug}` updated to use `countryProviderPath()`
- `listLegacyPageCandidates()` no longer generates sitemap entries for `/pro/{slug}` paths (redirect-only pages excluded from sitemap)
- VCSM business card Profile button updated to `https://traze.vibezcitizens.com/us/pro/{slug}` (country hardcoded as `us` — VCSM business card model does not expose countrySlug)

---

## Bugs Fixed — 2026-05-03

### Bug 1: "Show on TRAZE directory" toggle had no effect

**Root cause:** TRAZE DAL had two filters:
```js
.eq("directory_visible", true)
.eq("directory_status", "listed")
```

The toggle correctly sets `directory_visible`. But `directory_status` is admin-only and
defaults to `"pending"` for all VPORTs — it is never set to `"listed"` by any user-facing
action. So NO VPORT ever passed the filter, regardless of toggle state.

**Fix:** Removed both filters from `vportDataset.read.dal.js`. All rows from the view are
fetched. `isIndexable` (computed from `directory_visible` in the mapper) is now the sole gate
for directory listing eligibility.

### Bug 2: All VPORT profile pages returned 404 on TRAZE

**Root cause:** Same filter problem. Because no VPORTs loaded into the dataset, `MOCK_PROVIDERS`
was empty. `getProviderBySlug()` returned null for every VPORT slug. `buildProviderGraph()`
returned null → `notFound()` → 404.

**Fix:**
- `isIndexable` now uses `directory_visible` only (not `directory_status`)
- `getProviderBySlugAny()` added — searches all active providers without `isIndexable` gate
- `listAllActiveProviderStaticParams()` added — generates static routes for all active VPORTs
- `/pro/[providerSlug]/page.jsx` now redirect-only (added 2026-05-09; previously was full profile page)

### Bug 3: VCSM business card "Profile" button 404 (related)

**Root cause:** `VportBusinessCardPublic.view.jsx` hardcoded TRAZE URL using VCSM slug:
```js
return `https://traze.vibezcitizens.com/pro/${key}`;
```
This always pointed to TRAZE. For VPORTs not in the TRAZE dataset (because of the DAL filter),
the TRAZE page didn't exist → 404.

**Fix:** Resolved by Bug 1 + Bug 2 fixes above. All VPORTs now have TRAZE pages.
The VCSM business card link is correct and no longer needs a fallback.

---

## Files (apps/Traffic)

| File | Role |
|------|------|
| `src/data/dal/vportDataset.read.dal.js` | Fetches all VPORT rows from Supabase view |
| `src/data/controllers/vportDataset.controller.js` | Flattens raw rows |
| `src/data/connectors/vportDataset.js` | Re-exports `loadVportRows` |
| `src/data/connectors/unifiedDataset.js` | Builds `MOCK_PROVIDERS` from live data |
| `src/data/mappers/vportDataset.model.js` | `flattenVportPublicTrazeProfileRow()` |
| `src/data/mappers/vportToProvider.model.js` | `mapVportRowToProvider()` — computes `isIndexable` |
| `src/data/repositories/provider.repo.js` | `listProviders()`, `getProviderBySlugAny()`, `listAllActiveProviders()` |
| `src/data/repositories/staticParams.repo.js` | `listAllActiveProviderStaticParams()`, `listCountryProviderStaticParams()` |
| `src/app/(seo)/pro/[providerSlug]/page.jsx` | Legacy redirect → `/{country}/pro/{slug}` — uses `getProviderBySlugAny()`, noindex |
| `src/app/(seo)/[city]/pro/[providerSlug]/page.jsx` | Canonical profile page — uses `getProviderBySlug()`, index |

---

## VCSM Side (reference only — no Traffic imports)

| Field | Table | Who writes it |
|-------|-------|---------------|
| `directory_visible` | `vport.profiles` | VPORT owner via settings toggle |
| `directory_status` | `vport.profiles` | Admin only (no user-facing path) |

The `vport.public_traze_profiles_v` Supabase view exposes both fields for TRAZE to read.
