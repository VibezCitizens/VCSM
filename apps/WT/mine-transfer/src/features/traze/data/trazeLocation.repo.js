import { listTrazeProviders } from "@/features/traze/data/trazeProvider.repo";

function label(value, fallback = "Unknown") {
  return String(value ?? "").trim() || fallback;
}

export async function listTrazeLocations(filters = {}) {
  const providers = await listTrazeProviders(filters);
  const countryMap = new Map();
  const cityMap = new Map();
  const neighborhoodMap = new Map();
  let missingNeighborhood = 0;

  for (const provider of providers) {
    const countryCode = provider.countryCode || "UNKNOWN";
    const citySlug = provider.citySlug || "missing-city";
    const neighborhoodSlug = provider.neighborhoodSlug || "";

    const country = countryMap.get(countryCode) ?? {
      countryCode,
      providerCount: 0,
      cityKeys: new Set(),
      missingNeighborhood: 0,
    };
    country.providerCount += 1;
    if (provider.citySlug) country.cityKeys.add(provider.citySlug);

    const cityKey = `${countryCode}:${citySlug}`;
    const city = cityMap.get(cityKey) ?? {
      countryCode,
      citySlug: provider.citySlug,
      cityName: label(provider.cityName, provider.citySlug ? "Unnamed city" : "Missing city"),
      stateCode: provider.stateCode,
      providerCount: 0,
      neighborhoodKeys: new Set(),
      missingNeighborhood: 0,
    };
    city.providerCount += 1;

    if (neighborhoodSlug) {
      const neighborhoodKey = `${cityKey}:${neighborhoodSlug}`;
      const neighborhood = neighborhoodMap.get(neighborhoodKey) ?? {
        countryCode,
        citySlug: provider.citySlug,
        cityName: city.cityName,
        neighborhoodSlug,
        neighborhoodName: label(provider.neighborhoodName, neighborhoodSlug),
        providerCount: 0,
      };
      neighborhood.providerCount += 1;
      neighborhoodMap.set(neighborhoodKey, neighborhood);
      city.neighborhoodKeys.add(neighborhoodKey);
    } else {
      missingNeighborhood += 1;
      country.missingNeighborhood += 1;
      city.missingNeighborhood += 1;
    }

    countryMap.set(countryCode, country);
    cityMap.set(cityKey, city);
  }

  const countries = [...countryMap.values()]
    .map((country) => ({
      countryCode: country.countryCode,
      providerCount: country.providerCount,
      cityCount: country.cityKeys.size,
      missingNeighborhood: country.missingNeighborhood,
    }))
    .sort((left, right) => right.providerCount - left.providerCount);

  const cities = [...cityMap.values()]
    .map((city) => ({
      countryCode: city.countryCode,
      citySlug: city.citySlug,
      cityName: city.cityName,
      stateCode: city.stateCode,
      providerCount: city.providerCount,
      neighborhoodCount: city.neighborhoodKeys.size,
      missingNeighborhood: city.missingNeighborhood,
    }))
    .sort((left, right) => right.providerCount - left.providerCount);

  const neighborhoods = [...neighborhoodMap.values()]
    .sort((left, right) => right.providerCount - left.providerCount);

  return {
    countries,
    cities,
    neighborhoods,
    missingNeighborhood,
    providerCount: providers.length,
  };
}
