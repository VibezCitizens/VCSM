import { CITIES, NEIGHBORHOODS } from "@/data/connectors/taxonomyDataset";
import { slugEquals } from "@/lib/slugs";

export function listCities(filters = {}) {
  return CITIES.filter((city) => {
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
  return NEIGHBORHOODS.filter(
    (locality) => locality.cityId === cityId && locality.isActive
  );
}

export function getLocalityById(localityId) {
  return NEIGHBORHOODS.find((locality) => locality.id === localityId && locality.isActive) ?? null;
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
