# Global Directory Audit & Implementation Report

Generated: 2026-04-12
Scope: `/Users/vcsm/Desktop/VCSM/apps/Traffic` only

## Changed File Tree

```text
src/app/layout.jsx
src/app/page.jsx
src/app/(seo)/[city]/page.jsx
src/app/(seo)/[city]/[segment]/page.jsx
src/app/(seo)/[city]/[segment]/[service]/page.jsx
src/app/(seo)/[city]/[segment]/[service]/[detail]/page.jsx
src/app/(seo)/pro/[providerSlug]/page.jsx
src/app/sitemap-index.xml/route.js
src/data/connectors/mockDataset.js
src/data/mappers/pageModel.mapper.js
src/data/repositories/aggregate.repo.js
src/data/repositories/city.repo.js
src/data/repositories/geo.repo.js
src/data/repositories/pageCandidate.repo.js
src/data/repositories/provider.repo.js
src/data/repositories/service.repo.js
src/data/types.js
src/features/conversion/lib/deepLinkBuilder.js
src/features/directories/components/ProviderListItem.jsx
src/lib/paths.js
src/lib/slugs.js
src/seo/metadata.js
src/seo/schemaOrg.js
jsconfig.json
docs/GLOBAL_DIRECTORY_ARCHITECTURE.md
```

## File Contents

### jsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

```

### docs/GLOBAL_DIRECTORY_ARCHITECTURE.md

```md
# Traffic Global Directory Architecture

Last updated: 2026-04-12
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

## Known Follow-up Work

1. Add localized content fields (service labels/descriptions per locale).
2. Add hreflang matrix generation per canonical URL.
3. Add region-level landing pages where market size justifies indexing.
4. Introduce country-aware phone/address rendering utilities.
5. Add explicit redirect strategy from legacy URLs to canonical global URLs once rollout is complete.

```

### src/app/layout.jsx

```jsx
import "./globals.css";
import { AppShell } from "@/shared/components/AppShell";

export const metadata = {
  title: "VCSM Traffic",
  description:
    "Public SEO acquisition surface for country, city, locality, service, and provider discovery.",
  metadataBase: new URL("https://traffic.vibezcitizens.com")
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          <main>{children}</main>
        </AppShell>
      </body>
    </html>
  );
}

```

### src/app/page.jsx

```jsx
import Link from "next/link";
import { listCities } from "@/data/repositories/city.repo";
import { listCountries } from "@/data/repositories/geo.repo";
import { listServices } from "@/data/repositories/service.repo";
import { countryCityPath, countryCityServicePath } from "@/lib/paths";

export default function TrafficHomePage() {
  const countries = listCountries();
  const cities = listCities();
  const services = listServices();

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <span className="pill">Programmatic SEO Directory Engine</span>
          <h1 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)" }}>
            Global Specialty × Locality Discovery
          </h1>
          <p>
            This app publishes indexable country/city/service/provider pages and routes discovery
            traffic back into the main VCSM ecosystem.
          </p>
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: "0.8rem" }}>
        <h2 style={{ fontSize: "1.05rem" }}>Country Entry Paths</h2>
        <ul className="link-grid">
          {countries.map((country) => {
            const city = cities.find((entry) => entry.countryId === country.id);
            if (!city) {
              return null;
            }

            return (
              <li key={country.id}>
                <Link href={countryCityPath(country.slug, city.slug)}>
                  {country.name} · {city.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card" style={{ display: "grid", gap: "0.8rem" }}>
        <h2 style={{ fontSize: "1.05rem" }}>Country + City + Service Examples</h2>
        <ul className="link-grid">
          {countries.flatMap((country) => {
            const countryCities = cities.filter((entry) => entry.countryId === country.id);
            const city = countryCities[0];
            if (!city) {
              return [];
            }

            return services.slice(0, 2).map((service) => (
              <li key={`${country.id}:${city.id}:${service.id}`}>
                <Link href={countryCityServicePath(country.slug, city.slug, service.slug)}>
                  {country.name} · {city.name} · {service.name}
                </Link>
              </li>
            ));
          })}
        </ul>
      </section>
    </div>
  );
}

```

### src/app/(seo)/[city]/page.jsx

```jsx
import { notFound } from "next/navigation";
import { getCityBySlug, listLocalitiesByCity } from "@/data/repositories/city.repo";
import { getCountryById, getLocaleForCountryCode, getRegionById } from "@/data/repositories/geo.repo";
import { listServices } from "@/data/repositories/service.repo";
import { listProvidersByCity } from "@/data/repositories/provider.repo";
import { listCityStaticParams } from "@/data/repositories/pageCandidate.repo";
import { buildDirectoryPageModel } from "@/data/mappers/pageModel.mapper";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { buildBreadcrumbSchema, buildDirectoryItemListSchema } from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import {
  cityPath,
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityPath,
  countryCityServicePath,
  countryProviderPath,
  neighborhoodServicePath
} from "@/lib/paths";
import { DirectoryPageTemplate } from "@/features/directories/templates/DirectoryPageTemplate";

export function generateStaticParams() {
  return listCityStaticParams();
}

export function generateMetadata({ params }) {
  const city = getCityBySlug(params.city);
  if (!city) return {};

  const country = getCountryById(city.countryId);
  if (!country) return {};

  const region = city.regionId ? getRegionById(city.regionId) : null;
  const locationTail = [region?.code ?? city.stateCode, country.code].filter(Boolean).join(", ");

  const title = `Top Service Providers in ${city.name}${locationTail ? `, ${locationTail}` : ""}`;
  const description = `Browse rated providers across all service categories in ${city.name}, ${country.name}. Compare pricing, reviews, and book directly.`;

  return buildDirectoryMetadata({
    title,
    description,
    path: countryCityPath(country.slug, city.slug),
    locale: getLocaleForCountryCode(country.code)
  });
}

export default function CityPage({ params }) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const country = getCountryById(city.countryId);
  if (!country) notFound();

  const region = city.regionId ? getRegionById(city.regionId) : null;
  const providers = listProvidersByCity(city.id);
  const services = listServices();
  const localities = listLocalitiesByCity(city.id);

  const locationTail = [region?.code ?? city.stateCode, country.code].filter(Boolean).join(", ");

  const model = buildDirectoryPageModel({
    title: `Top Service Providers in ${city.name}${locationTail ? `, ${locationTail}` : ""}`,
    description: `Explore ${providers.length} rated providers in ${city.name}, ${country.name}. Compare pricing, read reviews, and connect with top professionals.`,
    itemName: `${city.name}, ${country.name}`,
    providers,
    priceAggregate: null,
    locale: getLocaleForCountryCode(country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: country.name, href: countryCityPath(country.slug, city.slug) },
    { label: city.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...services.map((service) => ({
      label: `${service.name} in ${city.name}`,
      href: countryCityServicePath(country.slug, city.slug, service.slug)
    })),
    ...localities.flatMap((locality) =>
      services.slice(0, 2).map((service) => ({
        label: `${service.name} in ${locality.name}`,
        href: countryCityLocalityServicePath(country.slug, city.slug, locality.slug, service.slug)
      }))
    ),
    {
      label: `Legacy city URL (${city.slug})`,
      href: cityPath(city.slug)
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityPath(country.slug, city.slug),
      providers,
      cityName: city.name,
      countryName: country.name,
      resolveProviderPath: (provider) => countryProviderPath(country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{ countrySlug: country.slug, citySlug: city.slug }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

```

### src/app/(seo)/[city]/[segment]/page.jsx

```jsx
import { notFound } from "next/navigation";
import { getCityBySlug, listLocalitiesByCity } from "@/data/repositories/city.repo";
import {
  getCountryById,
  getCountryBySlug,
  getLocaleForCountryCode,
  getRegionById
} from "@/data/repositories/geo.repo";
import { getServiceBySlug, listServices } from "@/data/repositories/service.repo";
import { listProvidersByCity, listProvidersByCityAndService } from "@/data/repositories/provider.repo";
import { getPriceAggregate } from "@/data/repositories/aggregate.repo";
import {
  listCityServiceStaticParams,
  listCountryCityStaticParams
} from "@/data/repositories/pageCandidate.repo";
import { buildDirectoryPageModel } from "@/data/mappers/pageModel.mapper";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { buildBreadcrumbSchema, buildDirectoryItemListSchema } from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import {
  cityPath,
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityPath,
  countryCityServicePath,
  countryProviderPath,
  neighborhoodServicePath
} from "@/lib/paths";
import { DirectoryPageTemplate } from "@/features/directories/templates/DirectoryPageTemplate";

function dedupeParamPairs(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = `${entry.city}::${entry.segment}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entry);
  }

  return output;
}

export function generateStaticParams() {
  const globalCountryCity = listCountryCityStaticParams().map((entry) => ({
    city: entry.country,
    segment: entry.city
  }));

  const legacyCityService = listCityServiceStaticParams().map((entry) => ({
    city: entry.city,
    segment: entry.service
  }));

  return dedupeParamPairs([...globalCountryCity, ...legacyCityService]);
}

function resolveCountryCity(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const city = getCityBySlug(params.segment, { countryId: country.id });
  if (!city) {
    return null;
  }

  const region = city.regionId ? getRegionById(city.regionId) : null;
  return {
    routeMode: "country_city",
    country,
    city,
    region
  };
}

function resolveLegacyCityService(params) {
  const city = getCityBySlug(params.city);
  if (!city) {
    return null;
  }

  const service = getServiceBySlug(params.segment);
  if (!service) {
    return null;
  }

  const country = getCountryById(city.countryId);
  if (!country) {
    return null;
  }

  const region = city.regionId ? getRegionById(city.regionId) : null;

  return {
    routeMode: "legacy_city_service",
    country,
    city,
    region,
    service
  };
}

function resolvePage(params) {
  return resolveCountryCity(params) ?? resolveLegacyCityService(params);
}

function buildCountryCityMetadata(graph) {
  const locationTail = [graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  return buildDirectoryMetadata({
    title: `Top Service Providers in ${graph.city.name}${locationTail ? `, ${locationTail}` : ""}`,
    description: `Browse rated providers across all service categories in ${graph.city.name}, ${graph.country.name}. Compare pricing, reviews, and book directly.`,
    path: countryCityPath(graph.country.slug, graph.city.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

function buildLegacyCityServiceMetadata(graph) {
  const locationTail = [graph.city.name, graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  return buildDirectoryMetadata({
    title: `Best ${graph.service.name} in ${locationTail}`,
    description: `Find top-rated ${graph.service.name.toLowerCase()} providers in ${graph.city.name}, ${graph.country.name}. Compare pricing, read reviews, and book directly.`,
    path: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country_city") {
    return buildCountryCityMetadata(graph);
  }

  return buildLegacyCityServiceMetadata(graph);
}

function renderCountryCityPage(graph) {
  const providers = listProvidersByCity(graph.city.id);
  const services = listServices();
  const localities = listLocalitiesByCity(graph.city.id);

  const locationTail = [graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  const model = buildDirectoryPageModel({
    title: `Top Service Providers in ${graph.city.name}${locationTail ? `, ${locationTail}` : ""}`,
    description: `Explore ${providers.length} rated providers in ${graph.city.name}, ${graph.country.name}. Compare pricing, read reviews, and connect with top professionals.`,
    itemName: `${graph.city.name}, ${graph.country.name}`,
    providers,
    priceAggregate: null,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.city.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...services.map((service) => ({
      label: `${service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, service.slug)
    })),
    ...localities.flatMap((locality) =>
      services.slice(0, 2).map((service) => ({
        label: `${service.name} in ${locality.name}`,
        href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, service.slug)
      }))
    ),
    {
      label: `Legacy city URL (${graph.city.slug})`,
      href: cityPath(graph.city.slug)
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityPath(graph.country.slug, graph.city.slug),
      providers,
      cityName: graph.city.name,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{ countrySlug: graph.country.slug, citySlug: graph.city.slug }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

function renderLegacyCityServicePage(graph) {
  const providers = listProvidersByCityAndService(graph.city.id, graph.service.id);
  const localities = listLocalitiesByCity(graph.city.id);
  const otherServices = listServices().filter((item) => item.id !== graph.service.id);

  const priceAggregate = getPriceAggregate({
    countryId: graph.city.countryId,
    regionId: graph.city.regionId,
    cityId: graph.city.id,
    serviceId: graph.service.id
  });

  const locationTail = [graph.city.name, graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  const model = buildDirectoryPageModel({
    title: `Best ${graph.service.name} in ${locationTail}`,
    description: `${providers.length} ${graph.service.name.toLowerCase()} providers in ${graph.city.name}, ${graph.country.name}. Compare market pricing, reviews, and availability.`,
    itemName: `${graph.service.name} · ${graph.city.name}`,
    providers,
    priceAggregate,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.city.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.service.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...localities.map((locality) => ({
      label: `${graph.service.name} in ${locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, graph.service.slug)
    })),
    ...otherServices.map((service) => ({
      label: `${service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, service.slug)
    })),
    {
      label: `Canonical global URL (${graph.country.slug}/${graph.city.slug}/${graph.service.slug})`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug)
    },
    {
      label: `Legacy city-service URL (${graph.city.slug}/${graph.service.slug})`,
      href: cityServicePath(graph.city.slug, graph.service.slug)
    },
    ...localities.map((locality) => ({
      label: `Legacy locality path (${graph.city.slug}/${locality.slug}/${graph.service.slug})`,
      href: neighborhoodServicePath(graph.city.slug, locality.slug, graph.service.slug)
    }))
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug),
      providers,
      cityName: graph.city.name,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{
        countrySlug: graph.country.slug,
        citySlug: graph.city.slug,
        serviceSlug: graph.service.slug
      }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

export default function DualSegmentPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country_city") {
    return renderCountryCityPage(graph);
  }

  return renderLegacyCityServicePage(graph);
}

```

### src/app/(seo)/[city]/[segment]/[service]/page.jsx

```jsx
import { notFound } from "next/navigation";
import {
  getCityById,
  getCityBySlug,
  getLocalityById,
  getLocalityBySlug,
  listLocalitiesByCity
} from "@/data/repositories/city.repo";
import {
  getCountryById,
  getCountryBySlug,
  getLocaleForCountryCode,
  getRegionByCode,
  getRegionById
} from "@/data/repositories/geo.repo";
import { getServiceById, getServiceBySlug, listServices } from "@/data/repositories/service.repo";
import {
  getProviderBySlug,
  listProvidersByCityAndService,
  listProvidersByLocalityAndService,
  listServicesForProvider
} from "@/data/repositories/provider.repo";
import { getPriceAggregate, getProviderStats } from "@/data/repositories/aggregate.repo";
import {
  listCountryCityServiceStaticParams,
  listCountryProviderStaticParams,
  listNeighborhoodServiceStaticParams
} from "@/data/repositories/pageCandidate.repo";
import {
  buildDirectoryPageModel,
  buildProviderPageModel
} from "@/data/mappers/pageModel.mapper";
import { buildDirectoryMetadata, buildProviderMetadata } from "@/seo/metadata";
import {
  buildBreadcrumbSchema,
  buildDirectoryItemListSchema,
  buildProviderSchema
} from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import {
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityPath,
  countryCityServicePath,
  countryProviderPath,
  neighborhoodServicePath,
  providerPath
} from "@/lib/paths";
import { DirectoryPageTemplate } from "@/features/directories/templates/DirectoryPageTemplate";
import { ProviderPageTemplate } from "@/features/providers/templates/ProviderPageTemplate";

function dedupeParamTriples(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = `${entry.city}::${entry.segment}::${entry.service}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entry);
  }

  return output;
}

export function generateStaticParams() {
  const globalCountryCityService = listCountryCityServiceStaticParams().map((entry) => ({
    city: entry.country,
    segment: entry.city,
    service: entry.service
  }));

  const legacyLocalityService = listNeighborhoodServiceStaticParams().map((entry) => ({
    city: entry.city,
    segment: entry.neighborhood,
    service: entry.service
  }));

  const countryProvider = listCountryProviderStaticParams().map((entry) => ({
    city: entry.country,
    segment: "pro",
    service: entry.providerSlug
  }));

  return dedupeParamTriples([
    ...globalCountryCityService,
    ...legacyLocalityService,
    ...countryProvider
  ]);
}

function resolveCountryProvider(params) {
  if (params.segment !== "pro") {
    return null;
  }

  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const provider = getProviderBySlug(params.service, { countryCode: country.code });
  if (!provider) {
    return null;
  }

  const city = getCityById(provider.primaryCityId);
  const locality = provider.primaryLocalityId ? getLocalityById(provider.primaryLocalityId) : null;
  const region = provider.primaryRegionCode
    ? getRegionByCode(country.id, provider.primaryRegionCode)
    : null;

  const providerServices = listServicesForProvider(provider.id);
  const serviceIds = [...new Set(providerServices.map((item) => item.serviceId))];
  const services = serviceIds.map((serviceId) => getServiceById(serviceId)).filter(Boolean);

  return {
    routeMode: "country_provider",
    provider,
    country,
    city,
    locality,
    region,
    services,
    stats: getProviderStats(provider.id)
  };
}

function resolveCountryCityService(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const city = getCityBySlug(params.segment, { countryId: country.id });
  if (!city) {
    return null;
  }

  const service = getServiceBySlug(params.service);
  if (!service) {
    return null;
  }

  const region = city.regionId ? getRegionById(city.regionId) : null;

  return {
    routeMode: "country_city_service",
    country,
    city,
    region,
    service
  };
}

function resolveLegacyLocalityService(params) {
  const city = getCityBySlug(params.city);
  if (!city) {
    return null;
  }

  const locality = getLocalityBySlug(city.id, params.segment);
  if (!locality) {
    return null;
  }

  const service = getServiceBySlug(params.service);
  if (!service) {
    return null;
  }

  const country = getCountryById(city.countryId);
  if (!country) {
    return null;
  }

  return {
    routeMode: "legacy_locality_service",
    country,
    city,
    locality,
    service
  };
}

function resolvePage(params) {
  return (
    resolveCountryProvider(params) ??
    resolveCountryCityService(params) ??
    resolveLegacyLocalityService(params)
  );
}

function buildCountryProviderMetadata(graph) {
  return buildProviderMetadata({
    title: `${graph.provider.displayName}${graph.city?.name ? ` in ${graph.city.name}, ${graph.country.name}` : ""}`,
    description:
      graph.provider.shortBio ||
      `Learn more about ${graph.provider.displayName}. View services, reviews, and book directly.`,
    path: countryProviderPath(graph.country.slug, graph.provider.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

function buildCountryCityServiceMetadata(graph) {
  const locationTail = [graph.city.name, graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  return buildDirectoryMetadata({
    title: `Best ${graph.service.name} in ${locationTail}`,
    description: `Find top-rated ${graph.service.name.toLowerCase()} providers in ${graph.city.name}, ${graph.country.name}. Compare pricing, read reviews, and book directly.`,
    path: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

function buildLegacyLocalityServiceMetadata(graph) {
  return buildDirectoryMetadata({
    title: `${graph.service.name} in ${graph.locality.name}, ${graph.city.name}, ${graph.country.name}`,
    description: `Top ${graph.service.name.toLowerCase()} providers in ${graph.locality.name}, ${graph.city.name}. Compare local pricing, read reviews, and book.`,
    path: countryCityLocalityServicePath(
      graph.country.slug,
      graph.city.slug,
      graph.locality.slug,
      graph.service.slug
    ),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country_provider") {
    return buildCountryProviderMetadata(graph);
  }

  if (graph.routeMode === "country_city_service") {
    return buildCountryCityServiceMetadata(graph);
  }

  return buildLegacyLocalityServiceMetadata(graph);
}

function renderCountryProviderPage(graph) {
  const model = buildProviderPageModel({
    provider: graph.provider,
    cityName: graph.city?.name ?? "",
    countryName: graph.country.name,
    localityName: graph.locality?.name ?? "",
    services: graph.services
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(graph.city
      ? [{ label: graph.city.name, href: countryCityPath(graph.country.slug, graph.city.slug) }]
      : []),
    ...(graph.city && graph.services[0]
      ? [
          {
            label: `${graph.services[0].name} in ${graph.city.name}`,
            href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.services[0].slug)
          }
        ]
      : []),
    { label: graph.provider.displayName }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...(graph.city && graph.locality
      ? graph.services.map((service) => ({
          label: `${service.name} in ${graph.locality.name}`,
          href: countryCityLocalityServicePath(
            graph.country.slug,
            graph.city.slug,
            graph.locality.slug,
            service.slug
          )
        }))
      : []),
    ...(graph.city
      ? graph.services.map((service) => ({
          label: `All ${service.name} in ${graph.city.name}`,
          href: countryCityServicePath(graph.country.slug, graph.city.slug, service.slug)
        }))
      : []),
    {
      label: "Legacy provider path",
      href: providerPath(graph.provider.slug)
    },
    ...(graph.city
      ? graph.services.map((service) => ({
          label: `Legacy city-service path (${graph.city.slug}/${service.slug})`,
          href: cityServicePath(graph.city.slug, service.slug)
        }))
      : []),
    ...(graph.city && graph.locality
      ? graph.services.map((service) => ({
          label: `Legacy locality path (${graph.city.slug}/${graph.locality.slug}/${service.slug})`,
          href: neighborhoodServicePath(graph.city.slug, graph.locality.slug, service.slug)
        }))
      : [])
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildProviderSchema({
      providerName: graph.provider.displayName,
      description: graph.provider.shortBio,
      providerPath: countryProviderPath(graph.country.slug, graph.provider.slug),
      ratingAvg: graph.stats?.ratingAvg,
      reviewCount: graph.stats?.reviewCount,
      addressLine1: graph.provider.addressLine1,
      postalCode: graph.provider.postalCode,
      cityName: graph.city?.name,
      localityName: graph.locality?.name,
      regionName: graph.region?.name,
      countryCode: graph.provider.primaryCountryCode,
      countryName: graph.country.name
    })
  ];

  return (
    <ProviderPageTemplate
      model={model}
      stats={graph.stats}
      context={{
        countrySlug: graph.country.slug,
        citySlug: graph.city?.slug,
        localitySlug: graph.locality?.slug,
        serviceSlug: graph.services[0]?.slug
      }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

function renderCountryCityServicePage(graph) {
  const providers = listProvidersByCityAndService(graph.city.id, graph.service.id);
  const localities = listLocalitiesByCity(graph.city.id);
  const otherServices = listServices().filter((item) => item.id !== graph.service.id);

  const priceAggregate = getPriceAggregate({
    countryId: graph.city.countryId,
    regionId: graph.city.regionId,
    cityId: graph.city.id,
    serviceId: graph.service.id
  });

  const locationTail = [graph.city.name, graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  const model = buildDirectoryPageModel({
    title: `Best ${graph.service.name} in ${locationTail}`,
    description: `${providers.length} ${graph.service.name.toLowerCase()} providers in ${graph.city.name}, ${graph.country.name}. Compare market pricing, reviews, and availability.`,
    itemName: `${graph.service.name} · ${graph.city.name}`,
    providers,
    priceAggregate,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.city.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.service.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...localities.map((locality) => ({
      label: `${graph.service.name} in ${locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, graph.service.slug)
    })),
    ...otherServices.map((service) => ({
      label: `${service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, service.slug)
    }))
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug),
      providers,
      cityName: graph.city.name,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{
        countrySlug: graph.country.slug,
        citySlug: graph.city.slug,
        serviceSlug: graph.service.slug
      }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

function renderLegacyLocalityServicePage(graph) {
  const providers = listProvidersByLocalityAndService(graph.locality.id, graph.service.id);
  const otherLocalities = listLocalitiesByCity(graph.city.id).filter((entry) => entry.id !== graph.locality.id);
  const otherServices = listServices().filter((entry) => entry.id !== graph.service.id);

  const priceAggregate = getPriceAggregate({
    countryId: graph.city.countryId,
    regionId: graph.city.regionId,
    cityId: graph.city.id,
    serviceId: graph.service.id,
    localityId: graph.locality.id
  });

  const model = buildDirectoryPageModel({
    title: `${graph.service.name} in ${graph.locality.name}, ${graph.city.name}, ${graph.country.name}`,
    description: `${providers.length} ${graph.service.name.toLowerCase()} providers serving ${graph.locality.name}. Compare local rates and reviews.`,
    itemName: `${graph.service.name} · ${graph.locality.name}`,
    providers,
    priceAggregate,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.city.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    {
      label: `${graph.service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug)
    },
    { label: graph.locality.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...otherLocalities.map((locality) => ({
      label: `${graph.service.name} in ${locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, graph.service.slug)
    })),
    ...otherServices.map((service) => ({
      label: `${service.name} in ${graph.locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, graph.locality.slug, service.slug)
    })),
    {
      label: `All ${graph.service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug)
    },
    {
      label: "Legacy locality URL",
      href: neighborhoodServicePath(graph.city.slug, graph.locality.slug, graph.service.slug)
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityLocalityServicePath(
        graph.country.slug,
        graph.city.slug,
        graph.locality.slug,
        graph.service.slug
      ),
      providers,
      cityName: graph.city.name,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{
        countrySlug: graph.country.slug,
        citySlug: graph.city.slug,
        localitySlug: graph.locality.slug,
        serviceSlug: graph.service.slug
      }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

export default function TripleSegmentPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country_provider") {
    return renderCountryProviderPage(graph);
  }

  if (graph.routeMode === "country_city_service") {
    return renderCountryCityServicePage(graph);
  }

  return renderLegacyLocalityServicePage(graph);
}

```

### src/app/(seo)/[city]/[segment]/[service]/[detail]/page.jsx

```jsx
import { notFound } from "next/navigation";
import { getCityBySlug, getLocalityBySlug, listLocalitiesByCity } from "@/data/repositories/city.repo";
import { getCountryBySlug, getLocaleForCountryCode } from "@/data/repositories/geo.repo";
import { getServiceBySlug, listServices } from "@/data/repositories/service.repo";
import { listProvidersByLocalityAndService } from "@/data/repositories/provider.repo";
import { getPriceAggregate } from "@/data/repositories/aggregate.repo";
import { listCountryLocalityServiceStaticParams } from "@/data/repositories/pageCandidate.repo";
import { buildDirectoryPageModel } from "@/data/mappers/pageModel.mapper";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { buildBreadcrumbSchema, buildDirectoryItemListSchema } from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import {
  countryCityLocalityServicePath,
  countryCityPath,
  countryCityServicePath,
  countryProviderPath,
  neighborhoodServicePath
} from "@/lib/paths";
import { DirectoryPageTemplate } from "@/features/directories/templates/DirectoryPageTemplate";

export function generateStaticParams() {
  return listCountryLocalityServiceStaticParams().map((entry) => ({
    city: entry.country,
    segment: entry.city,
    service: entry.locality,
    detail: entry.service
  }));
}

function resolvePage(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const city = getCityBySlug(params.segment, { countryId: country.id });
  if (!city) {
    return null;
  }

  const locality = getLocalityBySlug(city.id, params.service);
  if (!locality) {
    return null;
  }

  const service = getServiceBySlug(params.detail);
  if (!service) {
    return null;
  }

  return {
    country,
    city,
    locality,
    service
  };
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  return buildDirectoryMetadata({
    title: `${graph.service.name} in ${graph.locality.name}, ${graph.city.name}, ${graph.country.name}`,
    description: `Top ${graph.service.name.toLowerCase()} providers in ${graph.locality.name}, ${graph.city.name}. Compare local pricing, read reviews, and book.`,
    path: countryCityLocalityServicePath(
      graph.country.slug,
      graph.city.slug,
      graph.locality.slug,
      graph.service.slug
    ),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

export default function CountryCityLocalityServicePage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  const providers = listProvidersByLocalityAndService(graph.locality.id, graph.service.id);
  const otherLocalities = listLocalitiesByCity(graph.city.id).filter((entry) => entry.id !== graph.locality.id);
  const otherServices = listServices().filter((entry) => entry.id !== graph.service.id);

  const priceAggregate = getPriceAggregate({
    countryId: graph.city.countryId,
    regionId: graph.city.regionId,
    cityId: graph.city.id,
    serviceId: graph.service.id,
    localityId: graph.locality.id
  });

  const model = buildDirectoryPageModel({
    title: `${graph.service.name} in ${graph.locality.name}, ${graph.city.name}, ${graph.country.name}`,
    description: `${providers.length} ${graph.service.name.toLowerCase()} providers serving ${graph.locality.name}. Compare local rates and reviews.`,
    itemName: `${graph.service.name} · ${graph.locality.name}`,
    providers,
    priceAggregate,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.city.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    {
      label: `${graph.service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug)
    },
    { label: graph.locality.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...otherLocalities.map((locality) => ({
      label: `${graph.service.name} in ${locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, graph.service.slug)
    })),
    ...otherServices.map((service) => ({
      label: `${service.name} in ${graph.locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, graph.locality.slug, service.slug)
    })),
    {
      label: `All ${graph.service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug)
    },
    {
      label: "Legacy locality URL",
      href: neighborhoodServicePath(graph.city.slug, graph.locality.slug, graph.service.slug)
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityLocalityServicePath(
        graph.country.slug,
        graph.city.slug,
        graph.locality.slug,
        graph.service.slug
      ),
      providers,
      cityName: graph.city.name,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{
        countrySlug: graph.country.slug,
        citySlug: graph.city.slug,
        localitySlug: graph.locality.slug,
        serviceSlug: graph.service.slug
      }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

```

### src/app/(seo)/pro/[providerSlug]/page.jsx

```jsx
import { notFound } from "next/navigation";
import { getProviderBySlug, listServicesForProvider } from "@/data/repositories/provider.repo";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getCityById, getLocalityById } from "@/data/repositories/city.repo";
import {
  getCountryByCode,
  getLocaleForCountryCode,
  getRegionByCode
} from "@/data/repositories/geo.repo";
import { getServiceById } from "@/data/repositories/service.repo";
import { listProviderStaticParams } from "@/data/repositories/pageCandidate.repo";
import { buildProviderPageModel } from "@/data/mappers/pageModel.mapper";
import { buildProviderMetadata } from "@/seo/metadata";
import { buildBreadcrumbSchema, buildProviderSchema } from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import {
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityPath,
  countryCityServicePath,
  countryProviderPath,
  neighborhoodServicePath,
  providerPath
} from "@/lib/paths";
import { ProviderPageTemplate } from "@/features/providers/templates/ProviderPageTemplate";

export function generateStaticParams() {
  return listProviderStaticParams();
}

function buildProviderGraph(providerSlug) {
  const provider = getProviderBySlug(providerSlug);
  if (!provider) {
    return null;
  }

  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) {
    return null;
  }

  const city = getCityById(provider.primaryCityId);
  const locality = provider.primaryLocalityId ? getLocalityById(provider.primaryLocalityId) : null;
  const region = provider.primaryRegionCode
    ? getRegionByCode(country.id, provider.primaryRegionCode)
    : null;

  const providerServices = listServicesForProvider(provider.id);
  const serviceIds = [...new Set(providerServices.map((item) => item.serviceId))];
  const services = serviceIds.map((serviceId) => getServiceById(serviceId)).filter(Boolean);

  return {
    provider,
    country,
    city,
    locality,
    region,
    services,
    stats: getProviderStats(provider.id)
  };
}

export function generateMetadata({ params }) {
  const graph = buildProviderGraph(params.providerSlug);
  if (!graph) {
    return {};
  }

  const title = `${graph.provider.displayName}${graph.city?.name ? ` in ${graph.city.name}, ${graph.country.name}` : ""}`;
  const description =
    graph.provider.shortBio ||
    `Learn more about ${graph.provider.displayName}. View services, reviews, and book directly.`;

  return buildProviderMetadata({
    title,
    description,
    path: countryProviderPath(graph.country.slug, graph.provider.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

export default function ProviderPage({ params }) {
  const graph = buildProviderGraph(params.providerSlug);
  if (!graph) {
    notFound();
  }

  const { provider, country, city, locality, region, services, stats } = graph;

  const model = buildProviderPageModel({
    provider,
    cityName: city?.name ?? "",
    countryName: country.name,
    localityName: locality?.name ?? "",
    services
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(city ? [{ label: city.name, href: countryCityPath(country.slug, city.slug) }] : []),
    ...(city && services[0]
      ? [
          {
            label: `${services[0].name} in ${city.name}`,
            href: countryCityServicePath(country.slug, city.slug, services[0].slug)
          }
        ]
      : []),
    { label: provider.displayName }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...(city && locality
      ? services.map((service) => ({
          label: `${service.name} in ${locality.name}`,
          href: countryCityLocalityServicePath(country.slug, city.slug, locality.slug, service.slug)
        }))
      : []),
    ...(city
      ? services.map((service) => ({
          label: `All ${service.name} in ${city.name}`,
          href: countryCityServicePath(country.slug, city.slug, service.slug)
        }))
      : []),
    ...(city && locality
      ? services.map((service) => ({
          label: `Legacy locality path (${city.slug}/${locality.slug}/${service.slug})`,
          href: neighborhoodServicePath(city.slug, locality.slug, service.slug)
        }))
      : []),
    ...(city
      ? services.map((service) => ({
          label: `Legacy city-service path (${city.slug}/${service.slug})`,
          href: cityServicePath(city.slug, service.slug)
        }))
      : []),
    {
      label: "Legacy provider path",
      href: providerPath(provider.slug)
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildProviderSchema({
      providerName: provider.displayName,
      description: provider.shortBio,
      providerPath: countryProviderPath(country.slug, provider.slug),
      ratingAvg: stats?.ratingAvg,
      reviewCount: stats?.reviewCount,
      addressLine1: provider.addressLine1,
      postalCode: provider.postalCode,
      cityName: city?.name,
      localityName: locality?.name,
      regionName: region?.name,
      countryCode: provider.primaryCountryCode,
      countryName: country.name
    })
  ];

  const context = {
    countrySlug: country.slug,
    citySlug: city?.slug,
    localitySlug: locality?.slug,
    serviceSlug: services[0]?.slug
  };

  return (
    <ProviderPageTemplate
      model={model}
      stats={stats}
      context={context}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

```

### src/app/sitemap-index.xml/route.js

```js
import { listSitemapChunks } from "@/data/repositories/pageCandidate.repo";
import { buildCanonical } from "@/seo/canonical";

export function GET() {
  const entries = listSitemapChunks()
    .map((chunk) => {
      const loc = buildCanonical(`/sitemaps/${chunk.chunk}`);
      const lastmod = chunk.urls[0]?.updatedAt ?? new Date().toISOString();

      return `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}

```

### src/data/connectors/mockDataset.js

```js
/** @typedef {import("@/data/types").Country} Country */
/** @typedef {import("@/data/types").Region} Region */
/** @typedef {import("@/data/types").City} City */
/** @typedef {import("@/data/types").Neighborhood} Neighborhood */
/** @typedef {import("@/data/types").Service} Service */
/** @typedef {import("@/data/types").Specialty} Specialty */
/** @typedef {import("@/data/types").Provider} Provider */
/** @typedef {import("@/data/types").ProviderService} ProviderService */
/** @typedef {import("@/data/types").ProviderStats} ProviderStats */
/** @typedef {import("@/data/types").PriceAggregate} PriceAggregate */

/** @type {Country[]} */
export const MOCK_COUNTRIES = [
  {
    id: "country-us",
    code: "US",
    slug: "us",
    name: "United States",
    defaultLocale: "en-US",
    defaultCurrencyCode: "USD",
    isActive: true
  },
  {
    id: "country-ca",
    code: "CA",
    slug: "canada",
    name: "Canada",
    defaultLocale: "en-CA",
    defaultCurrencyCode: "CAD",
    isActive: true
  },
  {
    id: "country-mx",
    code: "MX",
    slug: "mexico",
    name: "Mexico",
    defaultLocale: "es-MX",
    defaultCurrencyCode: "MXN",
    isActive: true
  },
  {
    id: "country-gb",
    code: "GB",
    slug: "uk",
    name: "United Kingdom",
    defaultLocale: "en-GB",
    defaultCurrencyCode: "GBP",
    isActive: true
  },
  {
    id: "country-es",
    code: "ES",
    slug: "spain",
    name: "Spain",
    defaultLocale: "es-ES",
    defaultCurrencyCode: "EUR",
    isActive: true
  },
  {
    id: "country-fr",
    code: "FR",
    slug: "france",
    name: "France",
    defaultLocale: "fr-FR",
    defaultCurrencyCode: "EUR",
    isActive: true
  },
  {
    id: "country-de",
    code: "DE",
    slug: "germany",
    name: "Germany",
    defaultLocale: "de-DE",
    defaultCurrencyCode: "EUR",
    isActive: true
  },
  {
    id: "country-ae",
    code: "AE",
    slug: "uae",
    name: "United Arab Emirates",
    defaultLocale: "en-AE",
    defaultCurrencyCode: "AED",
    isActive: true
  },
  {
    id: "country-br",
    code: "BR",
    slug: "brazil",
    name: "Brazil",
    defaultLocale: "pt-BR",
    defaultCurrencyCode: "BRL",
    isActive: true
  },
  {
    id: "country-in",
    code: "IN",
    slug: "india",
    name: "India",
    defaultLocale: "en-IN",
    defaultCurrencyCode: "INR",
    isActive: true
  }
];

/** @type {Region[]} */
export const MOCK_REGIONS = [
  { id: "region-us-ca", countryId: "country-us", code: "CA", slug: "california", name: "California", type: "state", isActive: true },
  { id: "region-us-fl", countryId: "country-us", code: "FL", slug: "florida", name: "Florida", type: "state", isActive: true },
  { id: "region-ca-on", countryId: "country-ca", code: "ON", slug: "ontario", name: "Ontario", type: "province", isActive: true },
  { id: "region-mx-cdmx", countryId: "country-mx", code: "CDMX", slug: "ciudad-de-mexico", name: "Ciudad de Mexico", type: "state", isActive: true },
  { id: "region-gb-eng", countryId: "country-gb", code: "ENG", slug: "england", name: "England", type: "county", isActive: true },
  { id: "region-es-md", countryId: "country-es", code: "MD", slug: "madrid", name: "Comunidad de Madrid", type: "department", isActive: true },
  { id: "region-fr-idf", countryId: "country-fr", code: "IDF", slug: "ile-de-france", name: "Ile-de-France", type: "department", isActive: true },
  { id: "region-de-be", countryId: "country-de", code: "BE", slug: "berlin", name: "Berlin", type: "state", isActive: true },
  { id: "region-ae-du", countryId: "country-ae", code: "DU", slug: "dubai", name: "Dubai", type: "emirate", isActive: true },
  { id: "region-br-sp", countryId: "country-br", code: "SP", slug: "sao-paulo", name: "Sao Paulo", type: "state", isActive: true },
  { id: "region-in-mh", countryId: "country-in", code: "MH", slug: "maharashtra", name: "Maharashtra", type: "state", isActive: true }
];

/** @type {City[]} */
export const MOCK_CITIES = [
  {
    id: "city-sf",
    countryId: "country-us",
    regionId: "region-us-ca",
    slug: "san-francisco",
    name: "San Francisco",
    stateCode: "CA",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    isActive: true
  },
  {
    id: "city-miami",
    countryId: "country-us",
    regionId: "region-us-fl",
    slug: "miami",
    name: "Miami",
    stateCode: "FL",
    countryCode: "US",
    timezone: "America/New_York",
    isActive: true
  },
  {
    id: "city-toronto",
    countryId: "country-ca",
    regionId: "region-ca-on",
    slug: "toronto",
    name: "Toronto",
    stateCode: null,
    countryCode: "CA",
    timezone: "America/Toronto",
    isActive: true
  },
  {
    id: "city-mexico-city",
    countryId: "country-mx",
    regionId: "region-mx-cdmx",
    slug: "mexico-city",
    name: "Mexico City",
    stateCode: null,
    countryCode: "MX",
    timezone: "America/Mexico_City",
    isActive: true
  },
  {
    id: "city-london",
    countryId: "country-gb",
    regionId: "region-gb-eng",
    slug: "london",
    name: "London",
    stateCode: null,
    countryCode: "GB",
    timezone: "Europe/London",
    isActive: true
  },
  {
    id: "city-madrid",
    countryId: "country-es",
    regionId: "region-es-md",
    slug: "madrid",
    name: "Madrid",
    stateCode: null,
    countryCode: "ES",
    timezone: "Europe/Madrid",
    isActive: true
  },
  {
    id: "city-paris",
    countryId: "country-fr",
    regionId: "region-fr-idf",
    slug: "paris",
    name: "Paris",
    stateCode: null,
    countryCode: "FR",
    timezone: "Europe/Paris",
    isActive: true
  },
  {
    id: "city-berlin",
    countryId: "country-de",
    regionId: "region-de-be",
    slug: "berlin",
    name: "Berlin",
    stateCode: null,
    countryCode: "DE",
    timezone: "Europe/Berlin",
    isActive: true
  },
  {
    id: "city-dubai",
    countryId: "country-ae",
    regionId: "region-ae-du",
    slug: "dubai",
    name: "Dubai",
    stateCode: null,
    countryCode: "AE",
    timezone: "Asia/Dubai",
    isActive: true
  },
  {
    id: "city-sao-paulo",
    countryId: "country-br",
    regionId: "region-br-sp",
    slug: "sao-paulo",
    name: "Sao Paulo",
    stateCode: null,
    countryCode: "BR",
    timezone: "America/Sao_Paulo",
    isActive: true
  },
  {
    id: "city-mumbai",
    countryId: "country-in",
    regionId: "region-in-mh",
    slug: "mumbai",
    name: "Mumbai",
    stateCode: null,
    countryCode: "IN",
    timezone: "Asia/Kolkata",
    isActive: true
  }
];

/** @type {Neighborhood[]} */
export const MOCK_NEIGHBORHOODS = [
  { id: "loc-sf-mission", cityId: "city-sf", slug: "mission-district", name: "Mission District", localityType: "district", isActive: true },
  { id: "loc-sf-soma", cityId: "city-sf", slug: "soma", name: "SoMa", localityType: "district", isActive: true },
  { id: "loc-miami-brickell", cityId: "city-miami", slug: "brickell", name: "Brickell", localityType: "neighborhood", isActive: true },
  { id: "loc-miami-wynwood", cityId: "city-miami", slug: "wynwood", name: "Wynwood", localityType: "neighborhood", isActive: true },
  { id: "loc-miami-little-havana", cityId: "city-miami", slug: "little-havana", name: "Little Havana", localityType: "neighborhood", isActive: true },
  { id: "loc-toronto-old-town", cityId: "city-toronto", slug: "old-town", name: "Old Town", localityType: "borough", isActive: true },
  { id: "loc-mx-roma", cityId: "city-mexico-city", slug: "roma-norte", name: "Roma Norte", localityType: "district", isActive: true },
  { id: "loc-london-shoreditch", cityId: "city-london", slug: "shoreditch", name: "Shoreditch", localityType: "borough", isActive: true },
  { id: "loc-london-east-end", cityId: "city-london", slug: "east-end", name: "East End", localityType: "borough", isActive: true },
  { id: "loc-london-soho", cityId: "city-london", slug: "soho", name: "Soho", localityType: "district", isActive: true },
  { id: "loc-madrid-salamanca", cityId: "city-madrid", slug: "salamanca", name: "Salamanca", localityType: "district", isActive: true },
  { id: "loc-paris-marais", cityId: "city-paris", slug: "le-marais", name: "Le Marais", localityType: "district", isActive: true },
  { id: "loc-berlin-kreuzberg", cityId: "city-berlin", slug: "kreuzberg", name: "Kreuzberg", localityType: "district", isActive: true },
  { id: "loc-berlin-mitte", cityId: "city-berlin", slug: "mitte", name: "Mitte", localityType: "district", isActive: true },
  { id: "loc-dubai-business-bay", cityId: "city-dubai", slug: "business-bay", name: "Business Bay", localityType: "zone", isActive: true },
  { id: "loc-sp-vila-mariana", cityId: "city-sao-paulo", slug: "vila-mariana", name: "Vila Mariana", localityType: "district", isActive: true },
  { id: "loc-mumbai-bandra", cityId: "city-mumbai", slug: "bandra-west", name: "Bandra West", localityType: "locality", isActive: true }
];

/** @type {Service[]} */
export const MOCK_SERVICES = [
  { id: "svc-barber", slug: "barber", name: "Barber", category: "grooming", isActive: true },
  { id: "svc-hair-color", slug: "hair-color", name: "Hair Color", category: "beauty", isActive: true },
  { id: "svc-makeup", slug: "makeup", name: "Makeup", category: "beauty", isActive: true },
  { id: "svc-locksmith", slug: "locksmith", name: "Locksmith", category: "home-services", isActive: true }
];

/** @type {Specialty[]} */
export const MOCK_SPECIALTIES = [
  { id: "spec-curly-fade", serviceId: "svc-barber", slug: "curly-fade", name: "Curly Fade", isActive: true },
  { id: "spec-taper-fade", serviceId: "svc-barber", slug: "taper-fade", name: "Taper Fade", isActive: true },
  { id: "spec-fade", serviceId: "svc-barber", slug: "fade", name: "Fade", isActive: true },
  { id: "spec-beard-trim", serviceId: "svc-barber", slug: "beard-trim", name: "Beard Trim", isActive: true },
  { id: "spec-line-up", serviceId: "svc-barber", slug: "line-up", name: "Line-Up", isActive: true },
  { id: "spec-kids-cuts", serviceId: "svc-barber", slug: "kids-cuts", name: "Kids Cuts", isActive: true },
  { id: "spec-razor-shave", serviceId: "svc-barber", slug: "razor-shave", name: "Razor Shave", isActive: true },
  { id: "spec-design-work", serviceId: "svc-barber", slug: "design-work", name: "Design Work", isActive: true },
  { id: "spec-house-call-barber", serviceId: "svc-barber", slug: "house-call-barber", name: "House Call Barber", isActive: true },
  { id: "spec-balayage", serviceId: "svc-hair-color", slug: "balayage", name: "Balayage", isActive: true },
  { id: "spec-color-correction", serviceId: "svc-hair-color", slug: "color-correction", name: "Color Correction", isActive: true },
  { id: "spec-bridal", serviceId: "svc-makeup", slug: "bridal", name: "Bridal Makeup", isActive: true },
  { id: "spec-editorial", serviceId: "svc-makeup", slug: "editorial", name: "Editorial Makeup", isActive: true },
  { id: "spec-emergency-lockout", serviceId: "svc-locksmith", slug: "emergency-lockout", name: "Emergency Lockout", isActive: true },
  { id: "spec-car-lockout", serviceId: "svc-locksmith", slug: "car-lockout", name: "Car Lockout", isActive: true },
  { id: "spec-residential-lockout", serviceId: "svc-locksmith", slug: "residential-lockout", name: "Residential Lockout", isActive: true },
  { id: "spec-rekey", serviceId: "svc-locksmith", slug: "rekey", name: "Rekey", isActive: true },
  { id: "spec-lock-change", serviceId: "svc-locksmith", slug: "lock-change", name: "Lock Change", isActive: true },
  { id: "spec-smart-lock-install", serviceId: "svc-locksmith", slug: "smart-lock-install", name: "Smart Lock Install", isActive: true },
  { id: "spec-lock-repair", serviceId: "svc-locksmith", slug: "lock-repair", name: "Lock Repair", isActive: true },
  { id: "spec-commercial-locksmith", serviceId: "svc-locksmith", slug: "commercial-locksmith", name: "Commercial Locksmith", isActive: true }
];

/** @type {Provider[]} */
export const MOCK_PROVIDERS = [
  {
    id: "pro-luna-cuts",
    slug: "luna-cuts-sf",
    displayName: "Luna Cuts Studio",
    primaryCountryCode: "US",
    primaryRegionCode: "CA",
    primaryCityId: "city-sf",
    primaryLocalityId: "loc-sf-mission",
    addressLine1: "104 Valencia St",
    postalCode: "94103",
    phoneE164: "+14155550110",
    currencyCode: "USD",
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio: "Precision barbering focused on textured fades and fast turnaround.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-mission-fade-house",
    slug: "mission-fade-house",
    displayName: "Mission Fade House",
    primaryCountryCode: "US",
    primaryRegionCode: "CA",
    primaryCityId: "city-sf",
    primaryLocalityId: "loc-sf-mission",
    addressLine1: "2830 Mission St",
    postalCode: "94110",
    phoneE164: "+14155550135",
    currencyCode: "USD",
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio: "Walk-in fade specialists in the heart of the Mission. Known for sharp line-ups and design work.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: "actor-mission-fade-house",
    vcsmSlug: "mission-fade-house",
    claimedAt: "2026-02-20T00:00:00Z"
  },
  {
    id: "pro-golden-gate-grooming",
    slug: "golden-gate-grooming",
    displayName: "Golden Gate Grooming",
    primaryCountryCode: "US",
    primaryRegionCode: "CA",
    primaryCityId: "city-sf",
    primaryLocalityId: "loc-sf-soma",
    addressLine1: "55 2nd St",
    postalCode: "94105",
    phoneE164: "+14155550142",
    currencyCode: "USD",
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio: "Classic grooming studio offering razor shaves, beard sculpting, and hot towel service in SoMa.",
    isActive: true,
    isIndexable: true,
    claimStatus: "unclaimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-wynwood-clippers",
    slug: "wynwood-clippers",
    displayName: "Wynwood Clippers",
    primaryCountryCode: "US",
    primaryRegionCode: "FL",
    primaryCityId: "city-miami",
    primaryLocalityId: "loc-miami-wynwood",
    addressLine1: "310 NW 25th St",
    postalCode: "33127",
    phoneE164: "+13055550145",
    currencyCode: "USD",
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio: "Wynwood barbershop known for creative fades, kid-friendly cuts, and mural-district vibes.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: "actor-wynwood-clippers",
    vcsmSlug: "wynwood-clippers",
    claimedAt: "2026-03-01T00:00:00Z"
  },
  {
    id: "pro-little-havana-barber-studio",
    slug: "little-havana-barber-studio",
    displayName: "Little Havana Barber Studio",
    primaryCountryCode: "US",
    primaryRegionCode: "FL",
    primaryCityId: "city-miami",
    primaryLocalityId: "loc-miami-little-havana",
    addressLine1: "1544 SW 8th St",
    postalCode: "33135",
    phoneE164: "+13055550148",
    currencyCode: "USD",
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio: "Old-school barber studio with bilingual staff, straight-razor shaves, and classic tapers.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-east-end-fades",
    slug: "east-end-fades",
    displayName: "East End Fades",
    primaryCountryCode: "GB",
    primaryRegionCode: "ENG",
    primaryCityId: "city-london",
    primaryLocalityId: "loc-london-east-end",
    addressLine1: "88 Brick Lane",
    postalCode: "E1 6RL",
    phoneE164: "+442055501200",
    currencyCode: "GBP",
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio: "East London fade specialists blending street culture with precision barbering since 2019.",
    isActive: true,
    isIndexable: true,
    claimStatus: "pending",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-soho-barber-club",
    slug: "soho-barber-club",
    displayName: "Soho Barber Club",
    primaryCountryCode: "GB",
    primaryRegionCode: "ENG",
    primaryCityId: "city-london",
    primaryLocalityId: "loc-london-soho",
    addressLine1: "42 Dean St",
    postalCode: "W1D 4PZ",
    phoneE164: "+442055501210",
    currencyCode: "GBP",
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio: "Traditional gentlemen's barbershop in the heart of Soho offering razor shaves and hot towel grooming.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: "actor-soho-barber-club",
    vcsmSlug: "soho-barber-club",
    claimedAt: "2026-01-15T00:00:00Z"
  },
  {
    id: "pro-berlin-razor-co",
    slug: "berlin-razor-co",
    displayName: "Berlin Razor Co",
    primaryCountryCode: "DE",
    primaryRegionCode: "BE",
    primaryCityId: "city-berlin",
    primaryLocalityId: "loc-berlin-mitte",
    addressLine1: "Rosenthaler Str 34",
    postalCode: "10178",
    phoneE164: "+493055501220",
    currencyCode: "EUR",
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio: "Minimalist barbershop in Mitte offering razor-sharp fades, beard grooming, and house-call service.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-kreuzberg-cuts",
    slug: "kreuzberg-cuts",
    displayName: "Kreuzberg Cuts",
    primaryCountryCode: "DE",
    primaryRegionCode: "BE",
    primaryCityId: "city-berlin",
    primaryLocalityId: "loc-berlin-kreuzberg",
    addressLine1: "Kottbusser Damm 22",
    postalCode: "10967",
    phoneE164: "+493055501225",
    currencyCode: "EUR",
    serviceAreaMode: "hybrid",
    serviceAreaSummary: "Kreuzberg and Neukolln house calls available",
    shortBio: "Neighborhood barbershop with multilingual crew, walk-ins welcome, and mobile barber service.",
    isActive: true,
    isIndexable: true,
    claimStatus: "unclaimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-tripoint-lock",
    slug: "tripoint-lock-keys-sf",
    displayName: "Tripoint Lock & Keys",
    primaryCountryCode: "US",
    primaryRegionCode: "CA",
    primaryCityId: "city-sf",
    primaryLocalityId: "loc-sf-soma",
    addressLine1: "370 9th St",
    postalCode: "94103",
    phoneE164: "+14155550120",
    currencyCode: "USD",
    serviceAreaMode: "hybrid",
    serviceAreaSummary: "San Francisco metro and near-peninsula emergency response",
    shortBio: "24/7 emergency locksmith for residential, commercial, and automotive clients.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: "actor-tripoint-locksmith",
    vcsmSlug: "tripoint-lock-and-keys",
    claimedAt: "2026-03-15T00:00:00Z"
  },
  {
    id: "pro-miami-secure",
    slug: "miami-secure-locksmith",
    displayName: "Miami Secure Locksmith",
    primaryCountryCode: "US",
    primaryRegionCode: "FL",
    primaryCityId: "city-miami",
    primaryLocalityId: "loc-miami-brickell",
    addressLine1: "120 Brickell Ave",
    postalCode: "33131",
    phoneE164: "+13055550110",
    currencyCode: "USD",
    serviceAreaMode: "mobile",
    serviceAreaSummary: "Greater Miami and coastal lockout dispatch",
    shortBio: "Licensed locksmith team with fast response for lockout and rekey calls.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-coastline-glam",
    slug: "coastline-glam-makeup",
    displayName: "Coastline Glam Makeup",
    primaryCountryCode: "US",
    primaryRegionCode: "FL",
    primaryCityId: "city-miami",
    primaryLocalityId: "loc-miami-wynwood",
    addressLine1: "24 NW 26th St",
    postalCode: "33127",
    phoneE164: "+13055550122",
    currencyCode: "USD",
    serviceAreaMode: "mobile",
    serviceAreaSummary: "On-site events across Miami-Dade",
    shortBio: "Bridal and editorial makeup artists for destination and local events.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-maple-lock",
    slug: "maple-lock-toronto",
    displayName: "Maple Lock Toronto",
    primaryCountryCode: "CA",
    primaryRegionCode: "ON",
    primaryCityId: "city-toronto",
    primaryLocalityId: "loc-toronto-old-town",
    addressLine1: "18 Front St E",
    postalCode: "M5E 1B2",
    phoneE164: "+14165550115",
    currencyCode: "CAD",
    serviceAreaMode: "hybrid",
    serviceAreaSummary: "Toronto core and GTA emergency service area",
    shortBio: "Downtown locksmith with condo access, rekey, and smart lock installs.",
    isActive: true,
    isIndexable: true,
    claimStatus: "unclaimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-roma-segura",
    slug: "roma-segura-cerrajeria",
    displayName: "Roma Segura Cerrajeria",
    primaryCountryCode: "MX",
    primaryRegionCode: "CDMX",
    primaryCityId: "city-mexico-city",
    primaryLocalityId: "loc-mx-roma",
    addressLine1: "Calle Orizaba 12",
    postalCode: "06700",
    phoneE164: "+525555010120",
    currencyCode: "MXN",
    serviceAreaMode: "mobile",
    serviceAreaSummary: "Servicio rapido en alcaldias centrales de CDMX",
    shortBio: "Cerrajeria movil para hogares, autos y negocios en Ciudad de Mexico.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-shoreditch-locksmith",
    slug: "shoreditch-locksmith-london",
    displayName: "Shoreditch Locksmith",
    primaryCountryCode: "GB",
    primaryRegionCode: "ENG",
    primaryCityId: "city-london",
    primaryLocalityId: "loc-london-shoreditch",
    addressLine1: "210 Shoreditch High St",
    postalCode: "E1 6PJ",
    phoneE164: "+442055501130",
    currencyCode: "GBP",
    serviceAreaMode: "hybrid",
    serviceAreaSummary: "East London same-day lock and access support",
    shortBio: "Trusted locksmith for lockouts, lock replacement, and office security.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-madrid-llaves",
    slug: "madrid-llaves-rapidas",
    displayName: "Madrid Llaves Rapidas",
    primaryCountryCode: "ES",
    primaryRegionCode: "MD",
    primaryCityId: "city-madrid",
    primaryLocalityId: "loc-madrid-salamanca",
    addressLine1: "Calle Serrano 62",
    postalCode: "28001",
    phoneE164: "+34915550140",
    currencyCode: "EUR",
    serviceAreaMode: "mobile",
    serviceAreaSummary: "Centro y barrios del noreste de Madrid",
    shortBio: "Cerrajero 24 horas con instalacion de cerraduras y apertura sin danos.",
    isActive: true,
    isIndexable: true,
    claimStatus: "unclaimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-paris-serrure",
    slug: "paris-serrure-express",
    displayName: "Paris Serrure Express",
    primaryCountryCode: "FR",
    primaryRegionCode: "IDF",
    primaryCityId: "city-paris",
    primaryLocalityId: "loc-paris-marais",
    addressLine1: "16 Rue de Turenne",
    postalCode: "75003",
    phoneE164: "+33185550150",
    currencyCode: "EUR",
    serviceAreaMode: "hybrid",
    serviceAreaSummary: "Intervention rapide dans Paris intramuros",
    shortBio: "Depannage serrurerie pour appartements, commerces, et locaux professionnels.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-berlin-schloss",
    slug: "berlin-schloss-profi",
    displayName: "Berlin Schloss Profi",
    primaryCountryCode: "DE",
    primaryRegionCode: "BE",
    primaryCityId: "city-berlin",
    primaryLocalityId: "loc-berlin-kreuzberg",
    addressLine1: "Oranienstrasse 47",
    postalCode: "10969",
    phoneE164: "+493055501160",
    currencyCode: "EUR",
    serviceAreaMode: "mobile",
    serviceAreaSummary: "Kreuzberg und zentrale Bezirke",
    shortBio: "Schlusseldienst fur Turen, Sicherheitsschlosser und Notoffnungen.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-dubai-key-rescue",
    slug: "dubai-key-rescue",
    displayName: "Dubai Key Rescue",
    primaryCountryCode: "AE",
    primaryRegionCode: "DU",
    primaryCityId: "city-dubai",
    primaryLocalityId: "loc-dubai-business-bay",
    addressLine1: "Bay Square Building 6",
    postalCode: null,
    phoneE164: "+97145550170",
    currencyCode: "AED",
    serviceAreaMode: "mobile",
    serviceAreaSummary: "Business Bay, Downtown, and Marina dispatch",
    shortBio: "24/7 key rescue and lock replacement for homes, offices, and vehicles.",
    isActive: true,
    isIndexable: true,
    claimStatus: "pending",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-sao-chave-pronta",
    slug: "sao-paulo-chave-pronta",
    displayName: "Sao Paulo Chave Pronta",
    primaryCountryCode: "BR",
    primaryRegionCode: "SP",
    primaryCityId: "city-sao-paulo",
    primaryLocalityId: "loc-sp-vila-mariana",
    addressLine1: "Rua Domingos de Morais 980",
    postalCode: "04010-100",
    phoneE164: "+551155501180",
    currencyCode: "BRL",
    serviceAreaMode: "hybrid",
    serviceAreaSummary: "Zona Sul e centro expandido",
    shortBio: "Chaveiro para troca de fechaduras, abertura de portas, e suporte empresarial.",
    isActive: true,
    isIndexable: true,
    claimStatus: "unclaimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  },
  {
    id: "pro-mumbai-lock-care",
    slug: "mumbai-lock-care",
    displayName: "Mumbai Lock Care",
    primaryCountryCode: "IN",
    primaryRegionCode: "MH",
    primaryCityId: "city-mumbai",
    primaryLocalityId: "loc-mumbai-bandra",
    addressLine1: "Hill Road 58",
    postalCode: "400050",
    phoneE164: "+912255501190",
    currencyCode: "INR",
    serviceAreaMode: "mobile",
    serviceAreaSummary: "Bandra, Khar, and western suburbs",
    shortBio: "On-demand lock and key support for homes, societies, and small businesses.",
    isActive: true,
    isIndexable: true,
    claimStatus: "claimed",
    vcsmActorId: null,
    vcsmSlug: null,
    claimedAt: null
  }
];

/** @type {ProviderService[]} */
export const MOCK_PROVIDER_SERVICES = [
  { id: "ps-1", providerId: "pro-luna-cuts", serviceId: "svc-barber", specialtyId: "spec-curly-fade", priceFromCents: 4500, priceToCents: 6500, currencyCode: "USD", isActive: true },
  { id: "ps-2", providerId: "pro-luna-cuts", serviceId: "svc-barber", specialtyId: "spec-taper-fade", priceFromCents: 4000, priceToCents: 6200, currencyCode: "USD", isActive: true },
  { id: "ps-2a", providerId: "pro-luna-cuts", serviceId: "svc-barber", specialtyId: "spec-beard-trim", priceFromCents: 2500, priceToCents: 3500, currencyCode: "USD", isActive: true },

  // Mission Fade House — SF
  { id: "ps-b1", providerId: "pro-mission-fade-house", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 3800, priceToCents: 5500, currencyCode: "USD", isActive: true },
  { id: "ps-b2", providerId: "pro-mission-fade-house", serviceId: "svc-barber", specialtyId: "spec-line-up", priceFromCents: 2000, priceToCents: 3000, currencyCode: "USD", isActive: true },
  { id: "ps-b3", providerId: "pro-mission-fade-house", serviceId: "svc-barber", specialtyId: "spec-design-work", priceFromCents: 5500, priceToCents: 8000, currencyCode: "USD", isActive: true },

  // Golden Gate Grooming — SF
  { id: "ps-b4", providerId: "pro-golden-gate-grooming", serviceId: "svc-barber", specialtyId: "spec-razor-shave", priceFromCents: 4000, priceToCents: 5500, currencyCode: "USD", isActive: true },
  { id: "ps-b5", providerId: "pro-golden-gate-grooming", serviceId: "svc-barber", specialtyId: "spec-beard-trim", priceFromCents: 2500, priceToCents: 4000, currencyCode: "USD", isActive: true },
  { id: "ps-b6", providerId: "pro-golden-gate-grooming", serviceId: "svc-barber", specialtyId: "spec-taper-fade", priceFromCents: 4200, priceToCents: 6000, currencyCode: "USD", isActive: true },

  // Wynwood Clippers — Miami
  { id: "ps-b7", providerId: "pro-wynwood-clippers", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 3500, priceToCents: 5000, currencyCode: "USD", isActive: true },
  { id: "ps-b8", providerId: "pro-wynwood-clippers", serviceId: "svc-barber", specialtyId: "spec-kids-cuts", priceFromCents: 2000, priceToCents: 3000, currencyCode: "USD", isActive: true },
  { id: "ps-b9", providerId: "pro-wynwood-clippers", serviceId: "svc-barber", specialtyId: "spec-line-up", priceFromCents: 1800, priceToCents: 2800, currencyCode: "USD", isActive: true },

  // Little Havana Barber Studio — Miami
  { id: "ps-b10", providerId: "pro-little-havana-barber-studio", serviceId: "svc-barber", specialtyId: "spec-taper-fade", priceFromCents: 3200, priceToCents: 4800, currencyCode: "USD", isActive: true },
  { id: "ps-b11", providerId: "pro-little-havana-barber-studio", serviceId: "svc-barber", specialtyId: "spec-razor-shave", priceFromCents: 3500, priceToCents: 5000, currencyCode: "USD", isActive: true },
  { id: "ps-b12", providerId: "pro-little-havana-barber-studio", serviceId: "svc-barber", specialtyId: "spec-beard-trim", priceFromCents: 2000, priceToCents: 3200, currencyCode: "USD", isActive: true },

  // East End Fades — London
  { id: "ps-b13", providerId: "pro-east-end-fades", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 2800, priceToCents: 4200, currencyCode: "GBP", isActive: true },
  { id: "ps-b14", providerId: "pro-east-end-fades", serviceId: "svc-barber", specialtyId: "spec-design-work", priceFromCents: 4500, priceToCents: 6500, currencyCode: "GBP", isActive: true },
  { id: "ps-b15", providerId: "pro-east-end-fades", serviceId: "svc-barber", specialtyId: "spec-line-up", priceFromCents: 1500, priceToCents: 2500, currencyCode: "GBP", isActive: true },

  // Soho Barber Club — London
  { id: "ps-b16", providerId: "pro-soho-barber-club", serviceId: "svc-barber", specialtyId: "spec-razor-shave", priceFromCents: 3500, priceToCents: 5500, currencyCode: "GBP", isActive: true },
  { id: "ps-b17", providerId: "pro-soho-barber-club", serviceId: "svc-barber", specialtyId: "spec-beard-trim", priceFromCents: 2200, priceToCents: 3500, currencyCode: "GBP", isActive: true },
  { id: "ps-b18", providerId: "pro-soho-barber-club", serviceId: "svc-barber", specialtyId: "spec-taper-fade", priceFromCents: 3200, priceToCents: 4800, currencyCode: "GBP", isActive: true },

  // Berlin Razor Co — Berlin
  { id: "ps-b19", providerId: "pro-berlin-razor-co", serviceId: "svc-barber", specialtyId: "spec-razor-shave", priceFromCents: 2800, priceToCents: 4200, currencyCode: "EUR", isActive: true },
  { id: "ps-b20", providerId: "pro-berlin-razor-co", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 2500, priceToCents: 3800, currencyCode: "EUR", isActive: true },
  { id: "ps-b21", providerId: "pro-berlin-razor-co", serviceId: "svc-barber", specialtyId: "spec-house-call-barber", priceFromCents: 5000, priceToCents: 7500, currencyCode: "EUR", isActive: true },

  // Kreuzberg Cuts — Berlin
  { id: "ps-b22", providerId: "pro-kreuzberg-cuts", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 2200, priceToCents: 3500, currencyCode: "EUR", isActive: true },
  { id: "ps-b23", providerId: "pro-kreuzberg-cuts", serviceId: "svc-barber", specialtyId: "spec-kids-cuts", priceFromCents: 1500, priceToCents: 2500, currencyCode: "EUR", isActive: true },
  { id: "ps-b24", providerId: "pro-kreuzberg-cuts", serviceId: "svc-barber", specialtyId: "spec-house-call-barber", priceFromCents: 4500, priceToCents: 7000, currencyCode: "EUR", isActive: true },

  { id: "ps-3", providerId: "pro-tripoint-lock", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 7500, priceToCents: 15000, currencyCode: "USD", isActive: true },
  { id: "ps-4", providerId: "pro-tripoint-lock", serviceId: "svc-locksmith", specialtyId: "spec-smart-lock-install", priceFromCents: 12000, priceToCents: 25000, currencyCode: "USD", isActive: true },
  { id: "ps-5", providerId: "pro-miami-secure", serviceId: "svc-locksmith", specialtyId: "spec-residential-lockout", priceFromCents: 6200, priceToCents: 12800, currencyCode: "USD", isActive: true },
  { id: "ps-6", providerId: "pro-coastline-glam", serviceId: "svc-makeup", specialtyId: "spec-bridal", priceFromCents: 15500, priceToCents: 28500, currencyCode: "USD", isActive: true },
  { id: "ps-7", providerId: "pro-maple-lock", serviceId: "svc-locksmith", specialtyId: "spec-rekey", priceFromCents: 9000, priceToCents: 18000, currencyCode: "CAD", isActive: true },
  { id: "ps-8", providerId: "pro-roma-segura", serviceId: "svc-locksmith", specialtyId: "spec-lock-change", priceFromCents: 120000, priceToCents: 260000, currencyCode: "MXN", isActive: true },
  { id: "ps-9", providerId: "pro-shoreditch-locksmith", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 8500, priceToCents: 22000, currencyCode: "GBP", isActive: true },
  { id: "ps-10", providerId: "pro-madrid-llaves", serviceId: "svc-locksmith", specialtyId: "spec-car-lockout", priceFromCents: 6500, priceToCents: 17000, currencyCode: "EUR", isActive: true },
  { id: "ps-11", providerId: "pro-paris-serrure", serviceId: "svc-locksmith", specialtyId: "spec-lock-repair", priceFromCents: 7800, priceToCents: 21000, currencyCode: "EUR", isActive: true },
  { id: "ps-12", providerId: "pro-berlin-schloss", serviceId: "svc-locksmith", specialtyId: "spec-commercial-locksmith", priceFromCents: 9000, priceToCents: 24000, currencyCode: "EUR", isActive: true },
  { id: "ps-13", providerId: "pro-dubai-key-rescue", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 18000, priceToCents: 42000, currencyCode: "AED", isActive: true },
  { id: "ps-14", providerId: "pro-sao-chave-pronta", serviceId: "svc-locksmith", specialtyId: "spec-rekey", priceFromCents: 22000, priceToCents: 59000, currencyCode: "BRL", isActive: true },
  { id: "ps-15", providerId: "pro-mumbai-lock-care", serviceId: "svc-locksmith", specialtyId: "spec-lock-change", priceFromCents: 250000, priceToCents: 700000, currencyCode: "INR", isActive: true }
];

/** @type {ProviderStats[]} */
export const MOCK_PROVIDER_STATS = [
  { providerId: "pro-luna-cuts", ratingAvg: 4.9, reviewCount: 231, bookingCount30d: 128, responseRate: 98, responseTimeP50Minutes: 4, rankScore: 93.2, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-mission-fade-house", ratingAvg: 4.8, reviewCount: 187, bookingCount30d: 102, responseRate: 97, responseTimeP50Minutes: 5, rankScore: 91.5, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-golden-gate-grooming", ratingAvg: 4.7, reviewCount: 94, bookingCount30d: 56, responseRate: 92, responseTimeP50Minutes: 12, rankScore: 82.4, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-wynwood-clippers", ratingAvg: 4.9, reviewCount: 162, bookingCount30d: 89, responseRate: 99, responseTimeP50Minutes: 3, rankScore: 92.1, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-little-havana-barber-studio", ratingAvg: 4.8, reviewCount: 134, bookingCount30d: 74, responseRate: 95, responseTimeP50Minutes: 8, rankScore: 87.6, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-east-end-fades", ratingAvg: 4.7, reviewCount: 78, bookingCount30d: 45, responseRate: 93, responseTimeP50Minutes: 10, rankScore: 80.9, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-soho-barber-club", ratingAvg: 4.9, reviewCount: 205, bookingCount30d: 98, responseRate: 98, responseTimeP50Minutes: 6, rankScore: 91.8, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-berlin-razor-co", ratingAvg: 4.8, reviewCount: 112, bookingCount30d: 63, responseRate: 96, responseTimeP50Minutes: 7, rankScore: 86.7, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-kreuzberg-cuts", ratingAvg: 4.6, reviewCount: 67, bookingCount30d: 41, responseRate: 91, responseTimeP50Minutes: 14, rankScore: 78.3, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-tripoint-lock", ratingAvg: 4.9, reviewCount: 96, bookingCount30d: 47, responseRate: 99, responseTimeP50Minutes: 8, rankScore: 90.3, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-miami-secure", ratingAvg: 4.8, reviewCount: 112, bookingCount30d: 71, responseRate: 97, responseTimeP50Minutes: 10, rankScore: 88.1, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-coastline-glam", ratingAvg: 5.0, reviewCount: 88, bookingCount30d: 39, responseRate: 96, responseTimeP50Minutes: 7, rankScore: 86.2, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-maple-lock", ratingAvg: 4.7, reviewCount: 76, bookingCount30d: 29, responseRate: 94, responseTimeP50Minutes: 14, rankScore: 79.2, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-roma-segura", ratingAvg: 4.8, reviewCount: 61, bookingCount30d: 33, responseRate: 95, responseTimeP50Minutes: 16, rankScore: 80.8, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-shoreditch-locksmith", ratingAvg: 4.8, reviewCount: 83, bookingCount30d: 40, responseRate: 97, responseTimeP50Minutes: 11, rankScore: 84.1, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-madrid-llaves", ratingAvg: 4.6, reviewCount: 57, bookingCount30d: 25, responseRate: 93, responseTimeP50Minutes: 18, rankScore: 76.4, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-paris-serrure", ratingAvg: 4.7, reviewCount: 69, bookingCount30d: 31, responseRate: 94, responseTimeP50Minutes: 15, rankScore: 80.2, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-berlin-schloss", ratingAvg: 4.7, reviewCount: 64, bookingCount30d: 28, responseRate: 95, responseTimeP50Minutes: 13, rankScore: 79.5, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-dubai-key-rescue", ratingAvg: 4.8, reviewCount: 51, bookingCount30d: 34, responseRate: 98, responseTimeP50Minutes: 9, rankScore: 82.9, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-sao-chave-pronta", ratingAvg: 4.6, reviewCount: 44, bookingCount30d: 23, responseRate: 93, responseTimeP50Minutes: 17, rankScore: 74.8, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-mumbai-lock-care", ratingAvg: 4.7, reviewCount: 58, bookingCount30d: 37, responseRate: 96, responseTimeP50Minutes: 12, rankScore: 81.3, updatedAt: "2026-04-12T00:00:00Z" }
];

/** @type {PriceAggregate[]} */
export const MOCK_PRICE_AGGREGATES = [
  {
    id: "pa-sf-locksmith",
    countryId: "country-us",
    regionId: "region-us-ca",
    cityId: "city-sf",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 180,
    priceP25Cents: 6500,
    priceP50Cents: 9800,
    priceP75Cents: 16200,
    currencyCode: "USD",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-miami-locksmith",
    countryId: "country-us",
    regionId: "region-us-fl",
    cityId: "city-miami",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 145,
    priceP25Cents: 6000,
    priceP50Cents: 8500,
    priceP75Cents: 15000,
    currencyCode: "USD",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-sf-barber",
    countryId: "country-us",
    regionId: "region-us-ca",
    cityId: "city-sf",
    neighborhoodId: null,
    serviceId: "svc-barber",
    specialtyId: null,
    sampleSize: 220,
    priceP25Cents: 4200,
    priceP50Cents: 5400,
    priceP75Cents: 6800,
    currencyCode: "USD",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-miami-barber",
    countryId: "country-us",
    regionId: "region-us-fl",
    cityId: "city-miami",
    neighborhoodId: null,
    serviceId: "svc-barber",
    specialtyId: null,
    sampleSize: 185,
    priceP25Cents: 3200,
    priceP50Cents: 4500,
    priceP75Cents: 5800,
    currencyCode: "USD",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-london-barber",
    countryId: "country-gb",
    regionId: "region-gb-eng",
    cityId: "city-london",
    neighborhoodId: null,
    serviceId: "svc-barber",
    specialtyId: null,
    sampleSize: 160,
    priceP25Cents: 2500,
    priceP50Cents: 3800,
    priceP75Cents: 5200,
    currencyCode: "GBP",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-berlin-barber",
    countryId: "country-de",
    regionId: "region-de-be",
    cityId: "city-berlin",
    neighborhoodId: null,
    serviceId: "svc-barber",
    specialtyId: null,
    sampleSize: 120,
    priceP25Cents: 2000,
    priceP50Cents: 3200,
    priceP75Cents: 4500,
    currencyCode: "EUR",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-toronto-locksmith",
    countryId: "country-ca",
    regionId: "region-ca-on",
    cityId: "city-toronto",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 74,
    priceP25Cents: 9500,
    priceP50Cents: 14000,
    priceP75Cents: 21000,
    currencyCode: "CAD",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-mexico-city-locksmith",
    countryId: "country-mx",
    regionId: "region-mx-cdmx",
    cityId: "city-mexico-city",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 68,
    priceP25Cents: 130000,
    priceP50Cents: 190000,
    priceP75Cents: 280000,
    currencyCode: "MXN",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-london-locksmith",
    countryId: "country-gb",
    regionId: "region-gb-eng",
    cityId: "city-london",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 84,
    priceP25Cents: 9000,
    priceP50Cents: 15500,
    priceP75Cents: 23000,
    currencyCode: "GBP",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-madrid-locksmith",
    countryId: "country-es",
    regionId: "region-es-md",
    cityId: "city-madrid",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 60,
    priceP25Cents: 7000,
    priceP50Cents: 12000,
    priceP75Cents: 18000,
    currencyCode: "EUR",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-paris-locksmith",
    countryId: "country-fr",
    regionId: "region-fr-idf",
    cityId: "city-paris",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 63,
    priceP25Cents: 7600,
    priceP50Cents: 13400,
    priceP75Cents: 20400,
    currencyCode: "EUR",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-berlin-locksmith",
    countryId: "country-de",
    regionId: "region-de-be",
    cityId: "city-berlin",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 58,
    priceP25Cents: 7800,
    priceP50Cents: 12800,
    priceP75Cents: 19500,
    currencyCode: "EUR",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-dubai-locksmith",
    countryId: "country-ae",
    regionId: "region-ae-du",
    cityId: "city-dubai",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 52,
    priceP25Cents: 19000,
    priceP50Cents: 30000,
    priceP75Cents: 46000,
    currencyCode: "AED",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-sao-paulo-locksmith",
    countryId: "country-br",
    regionId: "region-br-sp",
    cityId: "city-sao-paulo",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 49,
    priceP25Cents: 26000,
    priceP50Cents: 41000,
    priceP75Cents: 62000,
    currencyCode: "BRL",
    asOfDate: "2026-04-10"
  },
  {
    id: "pa-mumbai-locksmith",
    countryId: "country-in",
    regionId: "region-in-mh",
    cityId: "city-mumbai",
    neighborhoodId: null,
    serviceId: "svc-locksmith",
    specialtyId: null,
    sampleSize: 66,
    priceP25Cents: 280000,
    priceP50Cents: 420000,
    priceP75Cents: 640000,
    currencyCode: "INR",
    asOfDate: "2026-04-10"
  }
];

```

### src/data/mappers/pageModel.mapper.js

```js
/**
 * @typedef {Object} DirectoryPageModel
 * @property {string} title
 * @property {string} description
 * @property {string} itemName
 * @property {number} providerCount
 * @property {import("@/data/types").DirectoryProviderListItem[]} providers
 * @property {string|null} priceSummary
 */

/**
 * @typedef {Object} ProviderPageModel
 * @property {string} title
 * @property {string} description
 * @property {import("@/data/types").Provider} provider
 * @property {string[]} serviceNames
 */

function formatPrice(cents, currencyCode, locale = "en-US") {
  if (cents == null) {
    return null;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(cents / 100);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 0
    }).format(cents / 100);
  }
}

export function buildDirectoryPageModel(args) {
  const { priceAggregate } = args;
  const locale = args.locale ?? "en-US";

  const p25 = formatPrice(priceAggregate?.priceP25Cents ?? null, priceAggregate?.currencyCode ?? "USD", locale);
  const p50 = formatPrice(priceAggregate?.priceP50Cents ?? null, priceAggregate?.currencyCode ?? "USD", locale);
  const p75 = formatPrice(priceAggregate?.priceP75Cents ?? null, priceAggregate?.currencyCode ?? "USD", locale);

  let priceSummary = null;
  if (p25 && p50 && p75) {
    priceSummary = `Market range ${p25} - ${p75} · median ${p50}`;
  }

  return {
    title: args.title,
    description: args.description,
    itemName: args.itemName,
    providerCount: args.providers.length,
    providers: args.providers,
    priceSummary
  };
}

export function buildProviderPageModel(args) {
  const location = [args.cityName, args.countryName].filter(Boolean).join(", ");

  return {
    title: `${args.provider.displayName}${location ? ` in ${location}` : ""}`,
    description: `${args.provider.displayName} serves ${args.localityName || args.cityName}. Explore services, reputation signals, and route back to booking in Vibez Citizens.`,
    provider: args.provider,
    serviceNames: args.services.map((service) => service.name)
  };
}

```

### src/data/repositories/aggregate.repo.js

```js
import { MOCK_PRICE_AGGREGATES, MOCK_PROVIDER_STATS } from "@/data/connectors/mockDataset";

export function getProviderStats(providerId) {
  return MOCK_PROVIDER_STATS.find((stats) => stats.providerId === providerId) ?? null;
}

export function getPriceAggregate(params) {
  const localityId = params.localityId ?? params.neighborhoodId ?? null;

  const exact = MOCK_PRICE_AGGREGATES.find((row) => {
    if (params.countryId && row.countryId !== params.countryId) {
      return false;
    }

    if ((params.regionId ?? null) !== (row.regionId ?? null)) {
      return false;
    }

    return (
      row.cityId === params.cityId &&
      row.serviceId === params.serviceId &&
      localityId === row.neighborhoodId &&
      (params.specialtyId ?? null) === row.specialtyId
    );
  });

  if (exact) {
    return exact;
  }

  return (
    MOCK_PRICE_AGGREGATES.find((row) => {
      if (params.countryId && row.countryId !== params.countryId) {
        return false;
      }

      return (
        row.cityId === params.cityId &&
        row.serviceId === params.serviceId &&
        row.neighborhoodId === null &&
        row.specialtyId === null
      );
    }) ?? null
  );
}

```

### src/data/repositories/city.repo.js

```js
import { MOCK_CITIES, MOCK_NEIGHBORHOODS } from "@/data/connectors/mockDataset";
import { slugEquals } from "@/lib/slugs";

export function listCities(filters = {}) {
  return MOCK_CITIES.filter((city) => {
    if (!city.isActive) {
      return false;
    }

    if (filters.countryId && city.countryId !== filters.countryId) {
      return false;
    }

    if (filters.regionId && city.regionId !== filters.regionId) {
      return false;
    }

    return true;
  });
}

export function getCityById(cityId) {
  return listCities().find((city) => city.id === cityId) ?? null;
}

export function getCityBySlug(citySlug, options = {}) {
  return listCities({ countryId: options.countryId }).find((city) => slugEquals(city.slug, citySlug)) ?? null;
}

export function listLocalitiesByCity(cityId) {
  return MOCK_NEIGHBORHOODS.filter(
    (locality) => locality.cityId === cityId && locality.isActive
  );
}

export function getLocalityById(localityId) {
  return MOCK_NEIGHBORHOODS.find((locality) => locality.id === localityId && locality.isActive) ?? null;
}

export function getLocalityBySlug(cityId, localitySlug) {
  return (
    listLocalitiesByCity(cityId).find((locality) => slugEquals(locality.slug, localitySlug)) ?? null
  );
}

// Backward-compatible aliases while legacy city-first routes still exist.
export function listNeighborhoodsByCity(cityId) {
  return listLocalitiesByCity(cityId);
}

export function getNeighborhoodBySlug(cityId, neighborhoodSlug) {
  return getLocalityBySlug(cityId, neighborhoodSlug);
}

```

### src/data/repositories/geo.repo.js

```js
import { MOCK_COUNTRIES, MOCK_REGIONS } from "@/data/connectors/mockDataset";
import { slugEquals } from "@/lib/slugs";

export function listCountries() {
  return MOCK_COUNTRIES.filter((country) => country.isActive);
}

export function getCountryBySlug(countrySlug) {
  return listCountries().find((country) => slugEquals(country.slug, countrySlug)) ?? null;
}

export function getCountryByCode(countryCode) {
  return listCountries().find((country) => country.code === String(countryCode ?? "").toUpperCase()) ?? null;
}

export function getCountryById(countryId) {
  return listCountries().find((country) => country.id === countryId) ?? null;
}

export function listRegionsByCountry(countryId) {
  return MOCK_REGIONS.filter((region) => region.countryId === countryId && region.isActive);
}

export function getRegionById(regionId) {
  return MOCK_REGIONS.find((region) => region.id === regionId && region.isActive) ?? null;
}

export function getRegionByCode(countryId, regionCode) {
  return listRegionsByCountry(countryId).find(
    (region) => region.code === String(regionCode ?? "").toUpperCase()
  ) ?? null;
}

export function getLocaleForCountryCode(countryCode) {
  return getCountryByCode(countryCode)?.defaultLocale ?? "en-US";
}

export function getCurrencyForCountryCode(countryCode) {
  return getCountryByCode(countryCode)?.defaultCurrencyCode ?? "USD";
}

```

### src/data/repositories/pageCandidate.repo.js

```js
import { listCities, listLocalitiesByCity, listNeighborhoodsByCity } from "@/data/repositories/city.repo";
import { getCountryByCode, listCountries } from "@/data/repositories/geo.repo";
import { getServiceBySlug, listServices } from "@/data/repositories/service.repo";
import {
  listProviders,
  listProvidersByCity,
  listProvidersByCityAndService,
  listProvidersByLocalityAndService,
  listProvidersByNeighborhoodAndService
} from "@/data/repositories/provider.repo";
import {
  cityPath,
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityPath,
  countryCityServicePath,
  countryProviderPath,
  neighborhoodServicePath,
  providerPath
} from "@/lib/paths";
import {
  isCityIndexable,
  isCityServiceIndexable,
  isNeighborhoodServiceIndexable,
  isProviderIndexable
} from "@/seo/qualityGuards";

/**
 * @typedef {Object} PageCandidate
 * @property {"country_city"|"country_city_service"|"country_locality_service"|"country_provider"|"city"|"city_service"|"neighborhood_service"|"provider"} pageType
 * @property {string} path
 * @property {string} updatedAt
 */

function nowStamp() {
  return new Date().toISOString();
}

function listGlobalPageCandidates() {
  const updatedAt = nowStamp();
  const pages = [];

  for (const country of listCountries()) {
    const cities = listCities({ countryId: country.id });

    for (const city of cities) {
      const cityProviders = listProvidersByCity(city.id);
      if (isCityIndexable(cityProviders.length)) {
        pages.push({
          pageType: "country_city",
          path: countryCityPath(country.slug, city.slug),
          updatedAt
        });
      }

      for (const service of listServices()) {
        const cityServiceProviders = listProvidersByCityAndService(city.id, service.id);

        if (isCityServiceIndexable(cityServiceProviders.length)) {
          pages.push({
            pageType: "country_city_service",
            path: countryCityServicePath(country.slug, city.slug, service.slug),
            updatedAt
          });
        }

        for (const locality of listLocalitiesByCity(city.id)) {
          const localityServiceProviders = listProvidersByLocalityAndService(locality.id, service.id);

          if (isNeighborhoodServiceIndexable(localityServiceProviders.length)) {
            pages.push({
              pageType: "country_locality_service",
              path: countryCityLocalityServicePath(country.slug, city.slug, locality.slug, service.slug),
              updatedAt
            });
          }
        }
      }
    }
  }

  for (const provider of listProviders()) {
    if (!isProviderIndexable(provider)) {
      continue;
    }

    const country = getCountryByCode(provider.primaryCountryCode);
    if (!country) {
      continue;
    }

    pages.push({
      pageType: "country_provider",
      path: countryProviderPath(country.slug, provider.slug),
      updatedAt
    });
  }

  return pages;
}

function listLegacyPageCandidates() {
  const updatedAt = nowStamp();
  const pages = [];

  for (const city of listCities()) {
    const cityProviders = listProvidersByCity(city.id);
    if (isCityIndexable(cityProviders.length)) {
      pages.push({
        pageType: "city",
        path: cityPath(city.slug),
        updatedAt
      });
    }

    for (const service of listServices()) {
      const cityServiceProviders = listProvidersByCityAndService(city.id, service.id);
      if (isCityServiceIndexable(cityServiceProviders.length)) {
        pages.push({
          pageType: "city_service",
          path: cityServicePath(city.slug, service.slug),
          updatedAt
        });
      }

      for (const neighborhood of listNeighborhoodsByCity(city.id)) {
        const neighborhoodServiceProviders = listProvidersByNeighborhoodAndService(
          neighborhood.id,
          service.id
        );

        if (isNeighborhoodServiceIndexable(neighborhoodServiceProviders.length)) {
          pages.push({
            pageType: "neighborhood_service",
            path: neighborhoodServicePath(city.slug, neighborhood.slug, service.slug),
            updatedAt
          });
        }
      }
    }
  }

  for (const provider of listProviders()) {
    if (!isProviderIndexable(provider)) {
      continue;
    }

    pages.push({
      pageType: "provider",
      path: providerPath(provider.slug),
      updatedAt
    });
  }

  return pages;
}

export function listPageCandidates(options = {}) {
  const includeLegacy = options.includeLegacy === true;

  if (!includeLegacy) {
    return listGlobalPageCandidates();
  }

  return [...listGlobalPageCandidates(), ...listLegacyPageCandidates()];
}

/**
 * @typedef {Object} SitemapChunk
 * @property {string} chunk
 * @property {PageCandidate[]} urls
 */

export function listSitemapChunks(chunkSize = 5000) {
  const pages = listPageCandidates();
  const chunks = [];

  for (let index = 0; index < pages.length; index += chunkSize) {
    const pageSlice = pages.slice(index, index + chunkSize);
    chunks.push({
      chunk: `chunk-${Math.floor(index / chunkSize) + 1}.xml`,
      urls: pageSlice
    });
  }

  return chunks;
}

export function getSitemapChunk(chunk) {
  return listSitemapChunks().find((entry) => entry.chunk === chunk) ?? null;
}

// ----- Global route static params -----

export function listCountryCityStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      const count = listProvidersByCity(city.id).length;
      if (!isCityIndexable(count)) {
        continue;
      }

      entries.push({ country: country.slug, city: city.slug });
    }
  }

  return entries;
}

export function listCountryCityServiceStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      for (const service of listServices()) {
        const count = listProvidersByCityAndService(city.id, service.id).length;
        if (!isCityServiceIndexable(count)) {
          continue;
        }

        entries.push({ country: country.slug, city: city.slug, service: service.slug });
      }
    }
  }

  return entries;
}

export function listCountryLocalityServiceStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      for (const locality of listLocalitiesByCity(city.id)) {
        for (const service of listServices()) {
          const count = listProvidersByLocalityAndService(locality.id, service.id).length;
          if (!isNeighborhoodServiceIndexable(count)) {
            continue;
          }

          entries.push({
            country: country.slug,
            city: city.slug,
            locality: locality.slug,
            service: service.slug
          });
        }
      }
    }
  }

  return entries;
}

export function listCountryProviderStaticParams() {
  return listProviders()
    .filter((provider) => isProviderIndexable(provider))
    .map((provider) => {
      const country = getCountryByCode(provider.primaryCountryCode);
      return country
        ? { country: country.slug, providerSlug: provider.slug }
        : null;
    })
    .filter(Boolean);
}

// ----- Legacy route static params (kept for transition compatibility) -----

export function listCityStaticParams() {
  return listCities().map((city) => ({ city: city.slug }));
}

export function listCityServiceStaticParams() {
  const entries = [];

  for (const city of listCities()) {
    for (const service of listServices()) {
      const count = listProvidersByCityAndService(city.id, service.id).length;
      if (!isCityServiceIndexable(count)) {
        continue;
      }

      entries.push({ city: city.slug, service: service.slug });
    }
  }

  return entries;
}

export function listNeighborhoodServiceStaticParams() {
  const entries = [];

  for (const city of listCities()) {
    for (const neighborhood of listNeighborhoodsByCity(city.id)) {
      for (const service of listServices()) {
        const count = listProvidersByNeighborhoodAndService(neighborhood.id, service.id).length;
        if (!isNeighborhoodServiceIndexable(count)) {
          continue;
        }

        entries.push({
          city: city.slug,
          neighborhood: neighborhood.slug,
          service: service.slug
        });
      }
    }
  }

  return entries;
}

export function listProviderStaticParams() {
  return listProviders()
    .filter((provider) => isProviderIndexable(provider))
    .map((provider) => ({ providerSlug: provider.slug }));
}

export function getServiceNameBySlug(serviceSlug) {
  return getServiceBySlug(serviceSlug)?.name ?? serviceSlug;
}

```

### src/data/repositories/provider.repo.js

```js
import { MOCK_PROVIDERS, MOCK_PROVIDER_SERVICES } from "@/data/connectors/mockDataset";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { slugEquals } from "@/lib/slugs";

function sortByRank(items) {
  return [...items].sort((left, right) => {
    const leftScore = left.stats?.rankScore ?? 0;
    const rightScore = right.stats?.rankScore ?? 0;
    return rightScore - leftScore;
  });
}

function listProviderIdsByService(serviceId, specialtyId = null) {
  return new Set(
    MOCK_PROVIDER_SERVICES.filter((providerService) => {
      if (!providerService.isActive || providerService.serviceId !== serviceId) {
        return false;
      }

      if (specialtyId != null && providerService.specialtyId !== specialtyId) {
        return false;
      }

      return true;
    }).map((providerService) => providerService.providerId)
  );
}

function toDirectoryItems(providers) {
  return sortByRank(
    providers.map((provider) => ({
      provider,
      stats: getProviderStats(provider.id),
      providerServices: listServicesForProvider(provider.id)
    }))
  );
}

export function listProviders(filters = {}) {
  return MOCK_PROVIDERS.filter((provider) => {
    if (!provider.isActive || !provider.isIndexable) {
      return false;
    }

    if (filters.countryCode && provider.primaryCountryCode !== String(filters.countryCode).toUpperCase()) {
      return false;
    }

    return true;
  });
}

export function getProviderBySlug(providerSlug, options = {}) {
  return listProviders({ countryCode: options.countryCode }).find(
    (provider) => slugEquals(provider.slug, providerSlug)
  ) ?? null;
}

export function listServicesForProvider(providerId) {
  return MOCK_PROVIDER_SERVICES.filter(
    (providerService) => providerService.providerId === providerId && providerService.isActive
  );
}

export function listProvidersByCountry(countryCode) {
  return toDirectoryItems(listProviders({ countryCode }));
}

export function listProvidersByCity(cityId) {
  const providers = listProviders().filter((provider) => provider.primaryCityId === cityId);
  return toDirectoryItems(providers);
}

export function listProvidersByCityAndService(cityId, serviceId) {
  const providerIds = listProviderIdsByService(serviceId);
  const providers = listProviders().filter(
    (provider) => provider.primaryCityId === cityId && providerIds.has(provider.id)
  );

  return toDirectoryItems(providers);
}

export function listProvidersByLocalityAndService(localityId, serviceId) {
  const providerIds = listProviderIdsByService(serviceId);
  const providers = listProviders().filter(
    (provider) => provider.primaryLocalityId === localityId && providerIds.has(provider.id)
  );

  return toDirectoryItems(providers);
}

export function listProvidersByLocalityServiceAndSpecialty(localityId, serviceId, specialtyId) {
  const providerIds = listProviderIdsByService(serviceId, specialtyId);

  const providers = listProviders().filter(
    (provider) => provider.primaryLocalityId === localityId && providerIds.has(provider.id)
  );

  return toDirectoryItems(providers);
}

// Backward-compatible aliases while legacy route names still use "neighborhood".
export function listProvidersByNeighborhoodAndService(neighborhoodId, serviceId) {
  return listProvidersByLocalityAndService(neighborhoodId, serviceId);
}

export function listProvidersByNeighborhoodServiceAndSpecialty(neighborhoodId, serviceId, specialtyId) {
  return listProvidersByLocalityServiceAndSpecialty(neighborhoodId, serviceId, specialtyId);
}

```

### src/data/repositories/service.repo.js

```js
import { MOCK_SERVICES, MOCK_SPECIALTIES } from "@/data/connectors/mockDataset";
import { slugEquals } from "@/lib/slugs";

export function listServices() {
  return MOCK_SERVICES.filter((service) => service.isActive);
}

export function getServiceById(serviceId) {
  return listServices().find((service) => service.id === serviceId) ?? null;
}

export function getServiceBySlug(serviceSlug) {
  return listServices().find((service) => slugEquals(service.slug, serviceSlug)) ?? null;
}

export function listSpecialtiesByService(serviceId) {
  return MOCK_SPECIALTIES.filter(
    (specialty) => specialty.serviceId === serviceId && specialty.isActive
  );
}

export function getSpecialtyBySlug(serviceId, specialtySlug) {
  return (
    listSpecialtiesByService(serviceId).find((specialty) =>
      slugEquals(specialty.slug, specialtySlug)
    ) ?? null
  );
}

```

### src/data/types.js

```js
/**
 * @typedef {Object} Country
 * @property {string} id
 * @property {string} code
 * @property {string} slug
 * @property {string} name
 * @property {string} defaultLocale
 * @property {string} defaultCurrencyCode
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Region
 * @property {string} id
 * @property {string} countryId
 * @property {string} code
 * @property {string} slug
 * @property {string} name
 * @property {"state"|"province"|"department"|"county"|"emirate"|"union_territory"} type
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} City
 * @property {string} id
 * @property {string} countryId
 * @property {string|null} regionId
 * @property {string} slug
 * @property {string} name
 * @property {string|null} stateCode
 * @property {string} countryCode
 * @property {string} timezone
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Locality
 * @property {string} id
 * @property {string} cityId
 * @property {string} slug
 * @property {string} name
 * @property {"neighborhood"|"district"|"borough"|"locality"|"zone"} localityType
 * @property {boolean} isActive
 */

/** @typedef {Locality} Neighborhood */

/**
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} category
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Specialty
 * @property {string} id
 * @property {string} serviceId
 * @property {string} slug
 * @property {string} name
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Provider
 * @property {string} id
 * @property {string} slug
 * @property {string} displayName
 * @property {string} primaryCountryCode
 * @property {string|null} primaryRegionCode
 * @property {string} primaryCityId
 * @property {string|null} primaryLocalityId
 * @property {string|null} addressLine1
 * @property {string|null} postalCode
 * @property {string|null} phoneE164
 * @property {string} currencyCode
 * @property {"fixed_location"|"mobile"|"hybrid"} serviceAreaMode
 * @property {string|null} serviceAreaSummary
 * @property {string} shortBio
 * @property {boolean} isActive
 * @property {boolean} isIndexable
 * @property {"claimed"|"unclaimed"|"pending"} claimStatus
 * @property {string|null} vcsmActorId — VCSM actor UUID, set when provider is claimed and linked
 * @property {string|null} vcsmSlug — VCSM vport slug, used for deep linking to the real profile
 * @property {string|null} claimedAt — ISO 8601 timestamp of when the claim was approved
 */

/**
 * @typedef {Object} ProviderService
 * @property {string} id
 * @property {string} providerId
 * @property {string} serviceId
 * @property {string|null} specialtyId
 * @property {number|null} priceFromCents
 * @property {number|null} priceToCents
 * @property {string} currencyCode
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} ProviderStats
 * @property {string} providerId
 * @property {number} ratingAvg
 * @property {number} reviewCount
 * @property {number} bookingCount30d
 * @property {number} responseRate
 * @property {number} responseTimeP50Minutes
 * @property {number} rankScore
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} PriceAggregate
 * @property {string} id
 * @property {string} countryId
 * @property {string|null} regionId
 * @property {string} cityId
 * @property {string|null} neighborhoodId
 * @property {string} serviceId
 * @property {string|null} specialtyId
 * @property {number} sampleSize
 * @property {number|null} priceP25Cents
 * @property {number|null} priceP50Cents
 * @property {number|null} priceP75Cents
 * @property {string} currencyCode
 * @property {string} asOfDate
 */

/**
 * @typedef {Object} InternalLinkItem
 * @property {string} href
 * @property {string} label
 * @property {string} [description]
 */

/**
 * @typedef {Object} DirectoryProviderListItem
 * @property {Provider} provider
 * @property {ProviderStats|null} stats
 * @property {ProviderService[]} providerServices
 */

```

### src/features/conversion/lib/deepLinkBuilder.js

```js
import { getPlatformOrigin } from "@/lib/env";

/**
 * @typedef {Object} DiscoveryContext
 * @property {string} [countrySlug]
 * @property {string} [citySlug]
 * @property {string} [localitySlug]
 * @property {string} [neighborhoodSlug]
 * @property {string} [serviceSlug]
 */

function buildUrl(path, params) {
  const url = new URL(path, getPlatformOrigin());

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (!value) {
        continue;
      }
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function getLocalitySlug(context) {
  return context?.localitySlug ?? context?.neighborhoodSlug;
}

export function buildPlatformExploreLink(context) {
  return buildUrl("/explore", {
    country: context?.countrySlug,
    city: context?.citySlug,
    locality: getLocalitySlug(context),
    service: context?.serviceSlug,
    source: "traffic"
  });
}

export function buildPlatformProviderLink(providerSlug, vcsmSlug) {
  const slug = vcsmSlug || providerSlug;
  return buildUrl(`/profile/${slug}`, {
    source: "traffic",
    surface: "provider"
  });
}

export function buildPlatformBookingLink(providerSlug, context, vcsmSlug) {
  const slug = vcsmSlug || providerSlug;
  return buildUrl("/booking", {
    provider: slug,
    country: context?.countrySlug,
    city: context?.citySlug,
    locality: getLocalitySlug(context),
    service: context?.serviceSlug,
    source: "traffic"
  });
}

export function buildPlatformFollowLink(providerSlug, vcsmSlug) {
  const slug = vcsmSlug || providerSlug;
  return buildUrl("/follow", {
    actor: slug,
    source: "traffic"
  });
}

/**
 * Build a claim link for unclaimed providers.
 * Returns null if the provider already has a VCSM actor (claimed and linked).
 * @param {string} providerSlug
 * @param {string|null} [vcsmActorId]
 * @returns {string|null}
 */
export function buildPlatformClaimLink(providerSlug, vcsmActorId) {
  if (vcsmActorId) {
    return null;
  }

  return buildUrl("/claim-profile", {
    provider: providerSlug,
    source: "traffic"
  });
}

```

### src/features/directories/components/ProviderListItem.jsx

```jsx
import Link from "next/link";
import { getCountryByCode } from "@/data/repositories/geo.repo";
import { countryProviderPath, providerPath } from "@/lib/paths";

function resolveProviderHref(provider) {
  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) {
    return providerPath(provider.slug);
  }

  return countryProviderPath(country.slug, provider.slug);
}

export function ProviderListItem({ item }) {
  return (
    <article className="card" style={{ display: "grid", gap: "0.45rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
        <h3 style={{ fontSize: "1.05rem" }}>{item.provider.displayName}</h3>
        <span className="pill">Rank {item.stats?.rankScore.toFixed(1) ?? "--"}</span>
      </div>

      <p>{item.provider.shortBio}</p>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <span className="pill">Rating {item.stats?.ratingAvg.toFixed(1) ?? "--"}</span>
        <span className="pill">Reviews {item.stats?.reviewCount ?? 0}</span>
        <span className="pill">Reply p50 {item.stats?.responseTimeP50Minutes ?? "--"}m</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {item.providerServices.length} listed services
        </span>
        <Link className="pill" href={resolveProviderHref(item.provider)}>
          View Provider
        </Link>
      </div>
    </article>
  );
}

```

### src/lib/paths.js

```js
function safe(segment) {
  return String(segment ?? "").trim();
}

export function cityPath(citySlug) {
  return `/${safe(citySlug)}`;
}

export function cityServicePath(citySlug, serviceSlug) {
  return `/${safe(citySlug)}/${safe(serviceSlug)}`;
}

export function neighborhoodServicePath(citySlug, neighborhoodSlug, serviceSlug) {
  return `/${safe(citySlug)}/${safe(neighborhoodSlug)}/${safe(serviceSlug)}`;
}

export function neighborhoodServiceSpecialtyPath(citySlug, neighborhoodSlug, serviceSlug, specialtySlug) {
  return `/${safe(citySlug)}/${safe(neighborhoodSlug)}/${safe(serviceSlug)}/${safe(specialtySlug)}`;
}

export function providerPath(providerSlug) {
  return `/pro/${safe(providerSlug)}`;
}

export function countryCityPath(countrySlug, citySlug) {
  return `/${safe(countrySlug)}/${safe(citySlug)}`;
}

export function countryCityServicePath(countrySlug, citySlug, serviceSlug) {
  return `/${safe(countrySlug)}/${safe(citySlug)}/${safe(serviceSlug)}`;
}

export function countryCityLocalityServicePath(countrySlug, citySlug, localitySlug, serviceSlug) {
  return `/${safe(countrySlug)}/${safe(citySlug)}/${safe(localitySlug)}/${safe(serviceSlug)}`;
}

export function countryProviderPath(countrySlug, providerSlug) {
  return `/${safe(countrySlug)}/pro/${safe(providerSlug)}`;
}

```

### src/lib/slugs.js

```js
function toSafeString(input) {
  if (input == null) {
    return "";
  }
  return String(input);
}

export function normalizeSlug(input) {
  return toSafeString(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugEquals(left, right) {
  return normalizeSlug(left) === normalizeSlug(right);
}

export function toSlug(input) {
  return normalizeSlug(input);
}

```

### src/seo/metadata.js

```js
import { buildCanonical } from "@/seo/canonical";

function normalizeLanguageAlternates(languageAlternates) {
  if (!languageAlternates) {
    return undefined;
  }

  const entries = Object.entries(languageAlternates)
    .filter(([, path]) => Boolean(path))
    .map(([locale, path]) => [locale, buildCanonical(path)]);

  return entries.length ? Object.fromEntries(entries) : undefined;
}

function baseMetadata(args) {
  const canonical = buildCanonical(args.path);
  const languages = normalizeLanguageAlternates(args.languageAlternates);

  return {
    title: args.title,
    description: args.description,
    alternates: {
      canonical,
      ...(languages ? { languages } : {})
    },
    openGraph: {
      title: args.title,
      description: args.description,
      url: canonical,
      type: "website",
      locale: args.locale ?? "en_US"
    },
    twitter: {
      card: "summary",
      title: args.title,
      description: args.description
    }
  };
}

export function buildDirectoryMetadata(args) {
  return baseMetadata(args);
}

export function buildProviderMetadata(args) {
  return baseMetadata(args);
}

```

### src/seo/schemaOrg.js

```js
import { buildCanonical } from "@/seo/canonical";

export function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? buildCanonical(item.href) : undefined
    }))
  };
}

export function buildDirectoryItemListSchema(args) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: args.name,
    url: buildCanonical(args.path),
    numberOfItems: args.providers.length,
    itemListElement: args.providers.map((item, index) => {
      const providerPath = args.resolveProviderPath
        ? args.resolveProviderPath(item.provider)
        : `/pro/${item.provider.slug}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "LocalBusiness",
          name: item.provider.displayName,
          url: buildCanonical(providerPath),
          address: {
            "@type": "PostalAddress",
            streetAddress: item.provider.addressLine1 ?? undefined,
            postalCode: item.provider.postalCode ?? undefined,
            addressLocality: args.cityName,
            addressCountry: item.provider.primaryCountryCode
          },
          areaServed: [args.cityName, args.countryName].filter(Boolean),
          aggregateRating:
            item.stats && item.stats.reviewCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: item.stats.ratingAvg,
                  reviewCount: item.stats.reviewCount
                }
              : undefined
        }
      };
    })
  };
}

export function buildProviderSchema(args) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: args.providerName,
    description: args.description,
    url: buildCanonical(args.providerPath),
    address: {
      "@type": "PostalAddress",
      streetAddress: args.addressLine1 ?? undefined,
      postalCode: args.postalCode ?? undefined,
      addressLocality: args.cityName ?? undefined,
      addressRegion: args.regionName ?? undefined,
      addressCountry: args.countryCode ?? undefined
    },
    areaServed: [args.localityName, args.cityName, args.countryName].filter(Boolean),
    aggregateRating:
      args.ratingAvg && args.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: args.ratingAvg,
            reviewCount: args.reviewCount
          }
        : undefined
  };
}

```

