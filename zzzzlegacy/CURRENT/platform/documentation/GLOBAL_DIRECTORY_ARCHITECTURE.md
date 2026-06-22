# Traffic Global Directory Architecture

Last updated: 2026-05-09
Scope: `/Users/vcsm/Desktop/VCSM/apps/Traffic`

## Goal

Traffic now supports a global directory model where canonical SEO URLs are country-aware and data contracts can represent non-US geography, currency, and service areas.

## Global Geography Model

Traffic data now models:

- Country (`code`, `slug`, `defaultLocale`, `defaultCurrencyCode`)
- Region (`state` / `province` / `department` / `county` / `emirate`)
- City
- Locality (district / neighborhood / borough / locality / zone)
- Provider service area mode (`fixed_location`, `mobile`, `hybrid`)

## Canonical URL Model

Canonical URLs are country-prefixed:

- Country + city directory: `/:country/:city`
- Country + city + service: `/:country/:city/:service`
- Country + city + locality + service: `/:country/:city/:locality/:service`
- Country + provider profile: `/:country/pro/:providerSlug`

Legacy routes are preserved for compatibility:

- `/:city`
- `/:city/:service`
- `/:city/:locality/:service`
- `/pro/:providerSlug`

Legacy pages canonicalize to global country-prefixed paths.

## Route Resolution Strategy

Next.js disallows multiple sibling dynamic segment names for the same path depth (for example root `[city]` and root `[country]`).

To keep both legacy and global URLs without route collisions, Traffic uses a unified dynamic tree rooted at `src/app/(seo)/[city]`:

- `src/app/(seo)/[city]/page.jsx`
  - legacy city landing (`/:city`) with canonical to `/:country/:city`
- `src/app/(seo)/[city]/[segment]/page.jsx`
  - resolves either legacy city/service (`/:city/:service`) or global country/city (`/:country/:city`)
- `src/app/(seo)/[city]/[segment]/[service]/page.jsx`
  - resolves either:
    - legacy city/locality/service (`/:city/:locality/:service`)
    - global country/city/service (`/:country/:city/:service`)
    - global country/provider (`/:country/pro/:providerSlug`)
- `src/app/(seo)/[city]/[segment]/[service]/[detail]/page.jsx`
  - global country/city/locality/service (`/:country/:city/:locality/:service`)
- `src/app/(seo)/pro/[providerSlug]/page.jsx`
  - legacy provider route with canonical global provider path

## Slug and Duplication Safety

Slug normalization now supports:

- Unicode normalization (`NFKD`)
- Diacritic removal
- accent-safe ASCII slug output
- stable separator normalization

Country-prefixed canonical paths disambiguate duplicate city/locality names across countries.

## Provider Global Readiness

Provider model includes:

- `primaryCountryCode`
- `primaryRegionCode`
- `primaryCityId`
- `primaryLocalityId`
- `addressLine1`, `postalCode`, `phoneE164`
- `currencyCode`
- `serviceAreaMode`, `serviceAreaSummary`

Provider cards and provider schema now resolve global provider paths by country.

## Pricing and Currency

- `PriceAggregate` rows include `countryId` and `regionId`
- Directory page price formatting is locale-aware (`Intl.NumberFormat(locale, currency)`)
- Repository lookups support country/region-aware aggregate selection

## Sitemap Strategy

- Sitemap URLs are generated from global-first page candidates
- Chunk endpoint: `/sitemaps/[chunk]`
- Sitemap index endpoint: `/sitemap-index.xml`

## Data Coverage

Mock data now spans:

- US, Canada, Mexico, UK, Spain, France, Germany, UAE, Brazil, India
- local currencies and locality types
- country-specific providers and pricing aggregates

## Geographic Explorer (geoData Shape)

`_renderers.jsx` produces a `geoData` array inside `renderCountryPage()`. This array is passed as a prop to `CountryHubTemplate`, which forwards it to `TrazeGeoExplorer`.

### Shape

```js
geoData = [
  {
    countryCode: string,       // e.g. "US"
    countrySlug: string,       // e.g. "us"
    countryName: string,       // e.g. "United States"
    countryNameEs: string,     // e.g. "Estados Unidos"
    providerCount: number,     // total providers across all states
    cityCount: number,         // total cities across all states
    stateGroups: [
      {
        stateCode: string,     // e.g. "CA"
        stateName: string,     // resolved human name — see resolution below
        providerCount: number, // sum of provider counts across all cities in state
        cityCount: number,     // number of cities in state
        cities: [
          {
            citySlug: string,
            cityName: string,
            providerCount: number,
          }
        ]
      }
    ]
  }
]
```

### stateName resolution

`stateName` is resolved in `renderCountryPage()` via:

```js
getRegionByCode(graph.country.id, stateCode)?.name ?? stateCode
```

`getRegionByCode` is imported from `geo.repo`. If the region is not found in the taxonomy (e.g. an unmapped stateCode), the raw `stateCode` string is used as the fallback label.

### Multi-country behavior

`geoData` is always an array so the shape is multi-country aware. `TrazeGeoExplorer` skips rendering the country header when there is only one entry (single-country case). Countries and states with no cities are filtered out before the array is built.

### Consumer

`TrazeGeoExplorer` (`apps/Traffic/src/shared/components/TrazeGeoExplorer.jsx`) reads this shape directly. It renders a collapsible state-by-state tree with provider counts and city chips. All state groups start collapsed.

---

## Known Follow-up Work

1. Add localized content fields (service labels/descriptions per locale).
2. Add hreflang matrix generation per canonical URL.
3. Add region-level landing pages where market size justifies indexing. **State-level data is now available in the `geoData` shape** (`stateCode`, `stateName`, `providerCount`, `cityCount`) — the data contract is ready; what remains is generating static params and page routes for state-level landing pages.
4. Introduce country-aware phone/address rendering utilities.
5. Add explicit redirect strategy from legacy URLs to canonical global URLs once rollout is complete.
