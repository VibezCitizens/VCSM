import { listCities, listLocalitiesByCity, listNeighborhoodsByCity } from "@/data/repositories/city.repo";
import { getCountryByCode, listCountries } from "@/data/repositories/geo.repo";
import { getServiceBySlug, listServices, listSpecialtiesByService } from "@/data/repositories/service.repo";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getAllPublicContentPages } from "@/data/repositories/content.repo";
import {
  listProviders,
  listProvidersByCity,
  listProvidersByCityAndService,
  listProvidersByCountry,
  listProvidersByCountryAndService,
  listProvidersByLocalityAndService,
  listProvidersByLocalityServiceAndSpecialty,
  listProvidersByNeighborhoodAndService
} from "@/data/repositories/provider.repo";
import {
  cityPath,
  contentGuideCanonicalPath,
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityLocalityServiceSpecialtyPath,
  countryCityPath,
  countryCityServicePath,
  countryPath,
  countryProviderPath,
  countryServiceHubPath,
  neighborhoodServicePath,
  providerPath
} from "@/lib/paths";
import {
  isCityIndexable,
  isCityServiceIndexable,
  isCountryIndexable,
  isCountryServiceIndexable,
  isNeighborhoodServiceIndexable,
  isNeighborhoodSpecialtyIndexable,
  isProviderIndexable
} from "@/seo/qualityGuards";

/**
 * @typedef {Object} PageCandidate
 * @property {"country"|"country_service"|"country_city"|"country_city_service"|"country_locality_service"|"country_locality_service_specialty"|"country_provider"|"content_guide"|"city"|"city_service"|"neighborhood_service"|"provider"} pageType
 * @property {string} path
 * @property {string} updatedAt
 */

const FALLBACK_UPDATED_AT = "2026-01-01T00:00:00.000Z";

function normalizeUpdatedAt(value) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function pickLatestUpdatedAt(values) {
  let latest = null;

  for (const value of values) {
    const normalized = normalizeUpdatedAt(value);
    if (!normalized) {
      continue;
    }

    if (!latest || normalized > latest) {
      latest = normalized;
    }
  }

  return latest;
}

function getPageUpdatedAtFromDirectoryItems(items, extraValues = []) {
  const itemValues = items.flatMap((item) => [item.stats?.updatedAt, item.provider?.claimedAt]);
  return pickLatestUpdatedAt([...itemValues, ...extraValues]) ?? STABLE_FALLBACK_UPDATED_AT;
}

function getProviderUpdatedAt(provider) {
  const stats = getProviderStats(provider.id);
  return pickLatestUpdatedAt([stats?.updatedAt, provider.claimedAt]) ?? STABLE_FALLBACK_UPDATED_AT;
}

function getCountryServiceCityCount(providers) {
  return new Set(providers.map((item) => item.provider.primaryCityId)).size;
}

const STABLE_FALLBACK_UPDATED_AT =
  pickLatestUpdatedAt(
    listProviders()
      .filter((provider) => isProviderIndexable(provider))
      .flatMap((provider) => [getProviderStats(provider.id)?.updatedAt, provider.claimedAt])
  ) ?? FALLBACK_UPDATED_AT;

function listGlobalPageCandidates() {
  const pages = [];

  for (const country of listCountries()) {
    const countryProviders = listProvidersByCountry(country.code);
    if (isCountryIndexable(countryProviders.length)) {
      pages.push({
        pageType: "country",
        path: countryPath(country.slug),
        updatedAt: getPageUpdatedAtFromDirectoryItems(countryProviders)
      });
    }

    for (const service of listServices()) {
      const countryServiceProviders = listProvidersByCountryAndService(country.code, service.id);
      const cityCount = getCountryServiceCityCount(countryServiceProviders);

      if (!isCountryServiceIndexable(countryServiceProviders.length, cityCount)) {
        continue;
      }

      pages.push({
        pageType: "country_service",
        path: countryServiceHubPath(country.slug, service.slug),
        updatedAt: getPageUpdatedAtFromDirectoryItems(countryServiceProviders)
      });
    }

    const cities = listCities({ countryId: country.id });

    for (const city of cities) {
      const cityProviders = listProvidersByCity(city.id);
      if (isCityIndexable(cityProviders.length)) {
        pages.push({
          pageType: "country_city",
          path: countryCityPath(country.slug, city.slug),
          updatedAt: getPageUpdatedAtFromDirectoryItems(cityProviders)
        });
      }

      for (const service of listServices()) {
        const cityServiceProviders = listProvidersByCityAndService(city.id, service.id);

        if (isCityServiceIndexable(cityServiceProviders.length)) {
          pages.push({
            pageType: "country_city_service",
            path: countryCityServicePath(country.slug, city.slug, service.slug),
            updatedAt: getPageUpdatedAtFromDirectoryItems(cityServiceProviders)
          });
        }

        for (const locality of listLocalitiesByCity(city.id)) {
          const localityServiceProviders = listProvidersByLocalityAndService(locality.id, service.id);

          if (isNeighborhoodServiceIndexable(localityServiceProviders.length)) {
            pages.push({
              pageType: "country_locality_service",
              path: countryCityLocalityServicePath(country.slug, city.slug, locality.slug, service.slug),
              updatedAt: getPageUpdatedAtFromDirectoryItems(localityServiceProviders)
            });
          }

          for (const specialty of listSpecialtiesByService(service.id)) {
            const localitySpecialtyProviders = listProvidersByLocalityServiceAndSpecialty(
              locality.id,
              service.id,
              specialty.id
            );

            if (!isNeighborhoodSpecialtyIndexable(localitySpecialtyProviders.length)) {
              continue;
            }

            pages.push({
              pageType: "country_locality_service_specialty",
              path: countryCityLocalityServiceSpecialtyPath(
                country.slug,
                city.slug,
                locality.slug,
                service.slug,
                specialty.slug
              ),
              updatedAt: getPageUpdatedAtFromDirectoryItems(localitySpecialtyProviders)
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
      updatedAt: getProviderUpdatedAt(provider)
    });
  }

  return pages;
}

function listLegacyPageCandidates() {
  const pages = [];

  for (const city of listCities()) {
    const cityProviders = listProvidersByCity(city.id);
    if (isCityIndexable(cityProviders.length)) {
      pages.push({
        pageType: "city",
        path: cityPath(city.slug),
        updatedAt: getPageUpdatedAtFromDirectoryItems(cityProviders)
      });
    }

    for (const service of listServices()) {
      const cityServiceProviders = listProvidersByCityAndService(city.id, service.id);
      if (isCityServiceIndexable(cityServiceProviders.length)) {
        pages.push({
          pageType: "city_service",
          path: cityServicePath(city.slug, service.slug),
          updatedAt: getPageUpdatedAtFromDirectoryItems(cityServiceProviders)
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
            updatedAt: getPageUpdatedAtFromDirectoryItems(neighborhoodServiceProviders)
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
      updatedAt: getProviderUpdatedAt(provider)
    });
  }

  return pages;
}

function listContentPageCandidates(contentPages = []) {
  return contentPages
    .filter((page) => Boolean(page.slug && page.profileSlug))
    .map((page) => ({
      pageType: "content_guide",
      path: contentGuideCanonicalPath(page.profileSlug, page.slug),
      updatedAt: pickLatestUpdatedAt([page.updatedAt, page.publishedAt, page.createdAt]) ?? STABLE_FALLBACK_UPDATED_AT
    }));
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
 * @property {string} updatedAt
 */

export async function listSitemapChunks(chunkSize = 5000) {
  const contentPages = await getAllPublicContentPages();
  const pages = [...listPageCandidates(), ...listContentPageCandidates(contentPages)];
  const chunks = [];

  for (let index = 0; index < pages.length; index += chunkSize) {
    const pageSlice = pages.slice(index, index + chunkSize);
    chunks.push({
      chunk: `chunk-${Math.floor(index / chunkSize) + 1}.xml`,
      urls: pageSlice,
      updatedAt: pickLatestUpdatedAt(pageSlice.map((page) => page.updatedAt)) ?? STABLE_FALLBACK_UPDATED_AT
    });
  }

  return chunks;
}

export async function getSitemapChunk(chunk) {
  const chunks = await listSitemapChunks();
  return chunks.find((entry) => entry.chunk === chunk) ?? null;
}

// ----- Global route static params -----

export function listCountryStaticParams() {
  return listCountries()
    .filter((country) => isCountryIndexable(listProvidersByCountry(country.code).length))
    .map((country) => ({ country: country.slug }));
}

export function listCountryServiceHubStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const service of listServices()) {
      const countryServiceProviders = listProvidersByCountryAndService(country.code, service.id);
      const cityCount = getCountryServiceCityCount(countryServiceProviders);

      if (!isCountryServiceIndexable(countryServiceProviders.length, cityCount)) {
        continue;
      }

      entries.push({ country: country.slug, service: service.slug });
    }
  }

  return entries;
}

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

export function listCountryLocalityServiceSpecialtyStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      for (const locality of listLocalitiesByCity(city.id)) {
        for (const service of listServices()) {
          for (const specialty of listSpecialtiesByService(service.id)) {
            const count = listProvidersByLocalityServiceAndSpecialty(
              locality.id,
              service.id,
              specialty.id
            ).length;

            if (!isNeighborhoodSpecialtyIndexable(count)) {
              continue;
            }

            entries.push({
              country: country.slug,
              city: city.slug,
              locality: locality.slug,
              service: service.slug,
              specialty: specialty.slug
            });
          }
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
