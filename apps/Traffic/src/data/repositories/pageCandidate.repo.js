import { listCities, listLocalitiesByCity, listNeighborhoodsByCity } from "@/data/repositories/city.repo";
import { getCountryByCode, listCountries } from "@/data/repositories/geo.repo";
import { listServices, listSpecialtiesByService } from "@/data/repositories/service.repo";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getAllPublicContentPages } from "@/data/repositories/content.repo";
import { listAnswerPageCandidates } from "@/features/answers/controller/readAnswerPage.controller";
import {
  listProviders,
  listProvidersByCity,
  listProvidersByCityAndService,
  listProvidersByCountry,
  listProvidersByCountryCitySlug,
  listProvidersByCountryCitySlugAndService,
  listProvidersByCountryAndService,
  listProvidersByLocalityAndService,
  listProvidersByLocalityServiceAndSpecialty,
  listProvidersByNeighborhoodAndService,
  listStructuredCitiesByCountryCode
} from "@/data/repositories/provider.repo";
import {
  isCityIndexable,
  isCityServiceIndexable,
  isCountryIndexable,
  isCountryServiceIndexable,
  isDirectoryPageQualityEligible,
  isNeighborhoodServiceIndexable,
  isNeighborhoodSpecialtyIndexable,
  isProviderIndexable
} from "@/seo/qualityGuards";
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
  neighborhoodServicePath
} from "@/lib/paths";

/**
 * @typedef {Object} PageCandidate
 * @property {"answer"|"country"|"country_service"|"country_city"|"country_city_service"|"country_locality_service"|"country_locality_service_specialty"|"country_provider"|"content_guide"|"city"|"city_service"|"neighborhood_service"|"provider"} pageType
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
  return new Set(
    providers
      .map((item) => item.provider.primaryCitySlug)
      .filter(Boolean)
  ).size;
}

function pushDirectoryCandidate(pages, pageType, path, items, extra = {}) {
  if (!isDirectoryPageQualityEligible(pageType, {
    providerCount: items.length,
    cityCount: extra.cityCount,
    hasRealProviderData: items.length > 0,
    hasMeaningfulMetadata: true
  })) {
    return;
  }

  pages.push({
    pageType,
    path,
    updatedAt: getPageUpdatedAtFromDirectoryItems(items, extra.updatedAtValues ?? [])
  });
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
      pushDirectoryCandidate(pages, "country", countryPath(country.slug), countryProviders);
    }

    for (const service of listServices()) {
      const countryServiceProviders = listProvidersByCountryAndService(country.code, service.id);
      const cityCount = getCountryServiceCityCount(countryServiceProviders);

      if (!isCountryServiceIndexable(countryServiceProviders.length, cityCount)) {
        continue;
      }

      pushDirectoryCandidate(
        pages,
        "country_service",
        countryServiceHubPath(country.slug, service.slug),
        countryServiceProviders,
        { cityCount }
      );
    }

    const structuredCities = listStructuredCitiesByCountryCode(country.code);

    for (const city of structuredCities) {
      const cityProviders = listProvidersByCountryCitySlug(country.code, city.slug);
      if (isCityIndexable(cityProviders.length)) {
        pushDirectoryCandidate(
          pages,
          "country_city",
          countryCityPath(country.slug, city.slug),
          cityProviders
        );
      }

      for (const service of listServices()) {
        const cityServiceProviders = listProvidersByCountryCitySlugAndService(
          country.code,
          city.slug,
          service.id
        );

        if (isCityServiceIndexable(cityServiceProviders.length)) {
          pushDirectoryCandidate(
            pages,
            "country_city_service",
            countryCityServicePath(country.slug, city.slug, service.slug),
            cityServiceProviders
          );
        }

        for (const locality of listLocalitiesByCity(city.id)) {
          const localityServiceProviders = listProvidersByLocalityAndService(locality.id, service.id);

          if (isNeighborhoodServiceIndexable(localityServiceProviders.length)) {
            pushDirectoryCandidate(
              pages,
              "country_locality_service",
              countryCityLocalityServicePath(country.slug, city.slug, locality.slug, service.slug),
              localityServiceProviders
            );
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

            pushDirectoryCandidate(
              pages,
              "country_locality_service_specialty",
              countryCityLocalityServiceSpecialtyPath(
                country.slug,
                city.slug,
                locality.slug,
                service.slug,
                specialty.slug
              ),
              localitySpecialtyProviders
            );
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
      pushDirectoryCandidate(pages, "city", cityPath(city.slug), cityProviders);
    }

    for (const service of listServices()) {
      const cityServiceProviders = listProvidersByCityAndService(city.id, service.id);
      if (isCityServiceIndexable(cityServiceProviders.length)) {
        pushDirectoryCandidate(
          pages,
          "city_service",
          cityServicePath(city.slug, service.slug),
          cityServiceProviders
        );
      }

      for (const neighborhood of listNeighborhoodsByCity(city.id)) {
        const neighborhoodServiceProviders = listProvidersByNeighborhoodAndService(
          neighborhood.id,
          service.id
        );

        if (isNeighborhoodServiceIndexable(neighborhoodServiceProviders.length)) {
          pushDirectoryCandidate(
            pages,
            "neighborhood_service",
            neighborhoodServicePath(city.slug, neighborhood.slug, service.slug),
            neighborhoodServiceProviders
          );
        }
      }
    }
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

export async function listPageCandidatesWithAnswers(options = {}) {
  const answers = await listAnswerPageCandidates();
  return [...listPageCandidates(options), ...answers];
}

/**
 * @typedef {Object} SitemapChunk
 * @property {string} chunk
 * @property {PageCandidate[]} urls
 * @property {string} updatedAt
 */

export async function listSitemapChunks(chunkSize = 5000) {
  const contentPages = await getAllPublicContentPages();
  const pages = [
    ...(await listPageCandidatesWithAnswers()),
    ...listContentPageCandidates(contentPages)
  ];
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
