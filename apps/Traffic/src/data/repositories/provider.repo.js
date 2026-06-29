import {
  LIVE_PROVIDER_INDEX_PROVIDERS,
  LIVE_PROVIDER_INDEX_PROVIDER_SERVICES
} from "@/data/connectors/unifiedDataset";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getCityById, getCityBySlug } from "@/data/repositories/city.repo";
import { getCountryByCode, getAnyCountryByCode, listCountries } from "@/data/repositories/geo.repo";
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
    LIVE_PROVIDER_INDEX_PROVIDER_SERVICES.filter((providerService) => {
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
  const match = value.match(/^(?:vport|traffic|seed)-city:([A-Z]{2}):(.+)$/);
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

function maybeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function listProviders(filters = {}) {
  return LIVE_PROVIDER_INDEX_PROVIDERS.filter((provider) => {
    if (!provider.isActive || !provider.isIndexable || provider.directoryVisible === false) {
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

export function getProviderBySlugAny(providerSlug) {
  return LIVE_PROVIDER_INDEX_PROVIDERS.find(
    (provider) => provider.isActive && provider.isIndexable && slugEquals(provider.slug, providerSlug)
  ) ?? null;
}

export function listAllActiveProviders() {
  return LIVE_PROVIDER_INDEX_PROVIDERS.filter((provider) => provider.isActive && provider.isIndexable && provider.slug);
}

export function listServicesForProvider(providerId) {
  return LIVE_PROVIDER_INDEX_PROVIDER_SERVICES.filter(
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
      const taxCity = getCityBySlug(citySlug, { countryId: country?.id });
      grouped.set(citySlug, {
        id: provider.primaryCityId ?? taxCity?.id ?? `vport-city:${normalizedCountryCode}:${citySlug}`,
        slug: citySlug,
        name: provider.primaryCityName ?? taxCity?.name ?? toCityLabel(citySlug),
        stateCode: provider.primaryRegionCode ?? taxCity?.stateCode ?? null,
        countryCode: normalizedCountryCode,
        countryId: country?.id ?? null,
        regionId: null,
        timezone: provider.timezone ?? null,
        lat: maybeNumber(provider.lat) ?? taxCity?.lat ?? null,
        lon: maybeNumber(provider.lng) ?? taxCity?.lon ?? null,
        isActive: true,
        isStructured: true
      });
      return;
    }

    const current = grouped.get(citySlug);
    if (current.lat == null) {
      const taxCity = getCityBySlug(citySlug, { countryId: country?.id });
      current.lat = maybeNumber(provider.lat) ?? taxCity?.lat ?? null;
      current.lon = maybeNumber(provider.lng) ?? taxCity?.lon ?? null;
    }
    if (!current.stateCode && provider.primaryRegionCode) {
      current.stateCode = provider.primaryRegionCode;
    }
  });

  return [...grouped.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function listLiveProviderCountries() {
  const grouped = new Map();

  for (const provider of listProviders()) {
    const countryCode = normalizeCountryCode(provider.primaryCountryCode);
    if (!countryCode) continue;

    const country = getCountryByCode(countryCode);
    // Display name resolves across the full taxonomy so a country with live data
    // but isActive:false (e.g. CA → "Canada") still shows its real name.
    const displayCountry = getAnyCountryByCode(countryCode);
    const key = countryCode;
    const current = grouped.get(key) ?? {
      countryCode,
      countrySlug: country?.slug ?? countryCode.toLowerCase(),
      name: displayCountry?.name ?? countryCode,
      nameEs: displayCountry?.nameEs ?? displayCountry?.name ?? countryCode,
      providerCount: 0,
      citySlugs: new Set()
    };

    current.providerCount += 1;
    if (provider.primaryCitySlug) {
      current.citySlugs.add(normalizeSlug(provider.primaryCitySlug));
    }
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .map((entry) => ({
      countryCode: entry.countryCode,
      countrySlug: entry.countrySlug,
      name: entry.name,
      nameEs: entry.nameEs,
      providerCount: entry.providerCount,
      cityCount: entry.citySlugs.size
    }))
    .sort((left, right) => {
      const countryOrder = new Map(listCountries().map((country, index) => [country.code, index]));
      const leftOrder = countryOrder.get(left.countryCode) ?? 999;
      const rightOrder = countryOrder.get(right.countryCode) ?? 999;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return left.name.localeCompare(right.name);
    });
}

export function listLiveProviderLocationOptions() {
  return listLiveProviderCountries().flatMap((country) =>
    listStructuredCitiesByCountryCode(country.countryCode).map((city) => ({
      citySlug: city.slug,
      countrySlug: country.countrySlug,
      name: city.name,
      nameEs: city.nameEs ?? city.name,
      stateCode: city.stateCode ?? null,
      countryCode: country.countryCode,
      countryName: country.name,
      countryNameEs: country.nameEs,
      label: city.stateCode
        ? `${city.name}, ${city.stateCode}, ${country.countryCode}`
        : `${city.name}, ${country.countryCode}`,
      labelEs: city.stateCode
        ? `${city.nameEs ?? city.name}, ${city.stateCode}, ${country.countryCode}`
        : `${city.nameEs ?? city.name}, ${country.countryCode}`,
      href: `/${country.countrySlug}/${city.slug}`,
      lat: city.lat ?? null,
      lon: city.lon ?? null
    }))
  );
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
