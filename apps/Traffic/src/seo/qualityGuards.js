export const QUALITY_THRESHOLDS = {
  countryMinProviders: 1,
  countryServiceMinProviders: 3,
  countryServiceMinCities: 2,
  cityMinProviders: 1,
  cityServiceMinProviders: 1,
  neighborhoodServiceMinProviders: 1,
  neighborhoodSpecialtyMinProviders: 1
};

export const SITEMAP_QUALITY_THRESHOLDS = {
  countryMinProviders: 1,
  countryServiceMinProviders: 3,
  countryServiceMinCities: 2,
  countryCityMinProviders: 2,
  countryCityServiceMinProviders: 2,
  countryLocalityServiceMinProviders: 2,
  countryLocalityServiceSpecialtyMinProviders: 2,
  legacyCityMinProviders: 2,
  legacyCityServiceMinProviders: 2,
  legacyNeighborhoodServiceMinProviders: 2,
  minTitleLength: 12,
  minDescriptionLength: 40
};

export const DIRECTORY_INDEX_ROBOTS = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true }
};

export const DIRECTORY_NOINDEX_ROBOTS = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true }
};

function toCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function hasMeaningfulDirectoryMetadata({ title, description } = {}) {
  return (
    String(title ?? "").trim().length >= SITEMAP_QUALITY_THRESHOLDS.minTitleLength &&
    String(description ?? "").trim().length >= SITEMAP_QUALITY_THRESHOLDS.minDescriptionLength
  );
}

export function isDirectoryPageQualityEligible(pageType, signals = {}) {
  if (signals.hasRealProviderData === false || signals.hasMeaningfulMetadata === false) {
    return false;
  }

  const providerCount = toCount(signals.providerCount);
  const cityCount = toCount(signals.cityCount);

  switch (pageType) {
    case "country":
      return providerCount >= SITEMAP_QUALITY_THRESHOLDS.countryMinProviders;
    case "country_service":
      return (
        providerCount >= SITEMAP_QUALITY_THRESHOLDS.countryServiceMinProviders &&
        cityCount >= SITEMAP_QUALITY_THRESHOLDS.countryServiceMinCities
      );
    case "country_city":
      return providerCount >= SITEMAP_QUALITY_THRESHOLDS.countryCityMinProviders;
    case "country_city_service":
      return providerCount >= SITEMAP_QUALITY_THRESHOLDS.countryCityServiceMinProviders;
    case "country_locality_service":
      return providerCount >= SITEMAP_QUALITY_THRESHOLDS.countryLocalityServiceMinProviders;
    case "country_locality_service_specialty":
      return providerCount >= SITEMAP_QUALITY_THRESHOLDS.countryLocalityServiceSpecialtyMinProviders;
    case "city":
      return providerCount >= SITEMAP_QUALITY_THRESHOLDS.legacyCityMinProviders;
    case "city_service":
      return providerCount >= SITEMAP_QUALITY_THRESHOLDS.legacyCityServiceMinProviders;
    case "neighborhood_service":
      return providerCount >= SITEMAP_QUALITY_THRESHOLDS.legacyNeighborhoodServiceMinProviders;
    default:
      return true;
  }
}

export function getDirectoryRobotsForQuality(pageType, signals = {}) {
  return isDirectoryPageQualityEligible(pageType, signals)
    ? DIRECTORY_INDEX_ROBOTS
    : DIRECTORY_NOINDEX_ROBOTS;
}

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
