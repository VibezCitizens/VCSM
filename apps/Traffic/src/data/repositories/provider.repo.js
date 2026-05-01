import { MOCK_PROVIDERS, MOCK_PROVIDER_SERVICES } from "@/data/connectors/unifiedDataset";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getCityById } from "@/data/repositories/city.repo";
import { getCountryByCode } from "@/data/repositories/geo.repo";
import { normalizeSlug, slugEquals } from "@/lib/slugs";

function sortByRank(items) {
  return [...items].sort((left, right) => {
    const leftScore = left.stats?.rankScore ?? 0;
    const rightScore = right.stats?.rankScore ?? 0;
    return rightScore - leftScore;
  });
}

function normalizeCountryCode(value) {
  return String(value ?? "").trim().toUpperCase();
}

function hasStructuredCity(provider) {
  return Boolean(provider?.primaryCitySlug && provider?.primaryCountryCode);
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

function parseCityRef(cityId) {
  const city = getCityById(cityId);
  if (city) {
    return {
      countryCode: normalizeCountryCode(city.countryCode),
      citySlug: normalizeSlug(city.slug)
    };
  }

  const value = String(cityId ?? "").trim();
  const match = value.match(/^vport-city:([A-Z]{2}):(.+)$/);
  if (!match) {
    return null;
  }

  return {
    countryCode: normalizeCountryCode(match[1]),
    citySlug: normalizeSlug(match[2])
  };
}

function toCityLabel(citySlug) {
  const cleaned = String(citySlug ?? "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

  if (!cleaned) {
    return "Unknown City";
  }

  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function listProviders(filters = {}) {
  return MOCK_PROVIDERS.filter((provider) => {
    if (!provider.isActive || !provider.isIndexable) {
      return false;
    }

    if (filters.countryCode && provider.primaryCountryCode !== normalizeCountryCode(filters.countryCode)) {
      return false;
    }

    if (filters.citySlug && normalizeSlug(provider.primaryCitySlug) !== normalizeSlug(filters.citySlug)) {
      return false;
    }

    if (filters.requireStructuredCity && !hasStructuredCity(provider)) {
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

export function listProvidersByCountryAndService(countryCode, serviceId) {
  const providerIds = listProviderIdsByService(serviceId);
  const providers = listProviders({ countryCode }).filter((provider) => providerIds.has(provider.id));
  return toDirectoryItems(providers);
}

export function listProvidersByCountryCitySlug(countryCode, citySlug) {
  const providers = listProviders({
    countryCode,
    citySlug,
    requireStructuredCity: true
  });

  return toDirectoryItems(providers);
}

export function listProvidersByCountryCitySlugAndService(countryCode, citySlug, serviceId) {
  const providerIds = listProviderIdsByService(serviceId);
  const providers = listProviders({
    countryCode,
    citySlug,
    requireStructuredCity: true
  }).filter((provider) => providerIds.has(provider.id));

  return toDirectoryItems(providers);
}

export function listProvidersByCity(cityId) {
  const cityRef = parseCityRef(cityId);
  if (!cityRef) {
    return [];
  }

  return listProvidersByCountryCitySlug(cityRef.countryCode, cityRef.citySlug);
}

export function listProvidersByCityAndService(cityId, serviceId) {
  const cityRef = parseCityRef(cityId);
  if (!cityRef) {
    return [];
  }

  return listProvidersByCountryCitySlugAndService(cityRef.countryCode, cityRef.citySlug, serviceId);
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

export function listStructuredCitiesByCountryCode(countryCode) {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const country = getCountryByCode(normalizedCountryCode);

  const grouped = new Map();

  listProviders({ countryCode: normalizedCountryCode, requireStructuredCity: true }).forEach((provider) => {
    const citySlug = normalizeSlug(provider.primaryCitySlug);
    if (!citySlug) {
      return;
    }

    if (!grouped.has(citySlug)) {
      grouped.set(citySlug, {
        id: provider.primaryCityId ?? `vport-city:${normalizedCountryCode}:${citySlug}`,
        slug: citySlug,
        name: provider.primaryCityName ?? toCityLabel(citySlug),
        stateCode: provider.primaryRegionCode ?? null,
        countryCode: normalizedCountryCode,
        countryId: country?.id ?? null,
        regionId: null,
        timezone: provider.timezone ?? null,
        isActive: true,
        isStructured: true
      });
    }
  });

  return [...grouped.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function getStructuredCityBySlug(countryCode, citySlug) {
  const normalized = normalizeSlug(citySlug);
  if (!normalized) {
    return null;
  }

  return (
    listStructuredCitiesByCountryCode(countryCode).find((city) => city.slug === normalized) ??
    null
  );
}

// Backward-compatible aliases while legacy route names still use "neighborhood".
export function listProvidersByNeighborhoodAndService(neighborhoodId, serviceId) {
  return listProvidersByLocalityAndService(neighborhoodId, serviceId);
}

export function listProvidersByNeighborhoodServiceAndSpecialty(neighborhoodId, serviceId, specialtyId) {
  return listProvidersByLocalityServiceAndSpecialty(neighborhoodId, serviceId, specialtyId);
}
