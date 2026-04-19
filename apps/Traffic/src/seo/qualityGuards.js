export const QUALITY_THRESHOLDS = {
  countryMinProviders: 1,
  countryServiceMinProviders: 3,
  countryServiceMinCities: 2,
  cityMinProviders: 1,
  cityServiceMinProviders: 1,
  neighborhoodServiceMinProviders: 1,
  neighborhoodSpecialtyMinProviders: 1
};

export function isProviderIndexable(provider) {
  return Boolean(provider?.isActive && provider?.isIndexable);
}

export function isCityIndexable(providerCount) {
  return providerCount >= QUALITY_THRESHOLDS.cityMinProviders;
}

export function isCountryIndexable(providerCount) {
  return providerCount >= QUALITY_THRESHOLDS.countryMinProviders;
}

export function isCountryServiceIndexable(providerCount, cityCount) {
  return (
    providerCount >= QUALITY_THRESHOLDS.countryServiceMinProviders &&
    cityCount >= QUALITY_THRESHOLDS.countryServiceMinCities
  );
}

export function isCityServiceIndexable(providerCount) {
  return providerCount >= QUALITY_THRESHOLDS.cityServiceMinProviders;
}

export function isNeighborhoodServiceIndexable(providerCount) {
  return providerCount >= QUALITY_THRESHOLDS.neighborhoodServiceMinProviders;
}

export function isNeighborhoodSpecialtyIndexable(providerCount) {
  return providerCount >= QUALITY_THRESHOLDS.neighborhoodSpecialtyMinProviders;
}
