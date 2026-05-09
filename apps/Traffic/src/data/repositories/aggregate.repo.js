import {
  LIVE_PROVIDER_INDEX_PRICE_AGGREGATES,
  LIVE_PROVIDER_INDEX_PROVIDER_STATS
} from "@/data/connectors/unifiedDataset";

export function getProviderStats(providerId) {
  return LIVE_PROVIDER_INDEX_PROVIDER_STATS.find((stats) => stats.providerId === providerId) ?? null;
}

export function getPriceAggregate(params) {
  const localityId = params.localityId ?? params.neighborhoodId ?? null;

  const exact = LIVE_PROVIDER_INDEX_PRICE_AGGREGATES.find((row) => {
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
    LIVE_PROVIDER_INDEX_PRICE_AGGREGATES.find((row) => {
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
