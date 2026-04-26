import { MOCK_PROVIDERS, MOCK_PROVIDER_SERVICES } from "@/data/connectors/unifiedDataset";
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

export function listProvidersByCountryAndService(countryCode, serviceId) {
  const providerIds = listProviderIdsByService(serviceId);
  const providers = listProviders({ countryCode }).filter((provider) => providerIds.has(provider.id));
  return toDirectoryItems(providers);
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
