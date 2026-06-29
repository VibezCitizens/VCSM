import { getCityBySlug } from "@/data/repositories/city.repo";
import { getCountryByCode, getAnyCountryByCode, getRegionByCode } from "@/data/repositories/geo.repo";
import {
  listProviders,
  listServicesForProvider,
  listStructuredCitiesByCountryCode
} from "@/data/repositories/provider.repo";
import { normalizeSlug } from "@/lib/slugs";

const COUNTRY_CENTROIDS = {
  US: { lat: 39.5, lng: -98.35 },
  MX: { lat: 23.6, lng: -102.5 },
  GT: { lat: 15.78, lng: -90.23 },
  BZ: { lat: 17.25, lng: -88.76 },
  HN: { lat: 15.2, lng: -86.24 },
  SV: { lat: 13.79, lng: -88.89 },
  NI: { lat: 12.87, lng: -85.21 },
  CR: { lat: 9.75, lng: -83.75 },
  PA: { lat: 8.99, lng: -79.52 }
};

const STATE_CENTROIDS = {
  "US:CA": { lat: 36.78, lng: -119.42 },
  "US:TX": { lat: 31.0, lng: -99.9 },
  "MX:MX": { lat: 19.35, lng: -99.65 },
  "MX:MEX": { lat: 19.35, lng: -99.65 },
  "SV:SS": { lat: 13.69, lng: -89.19 }
};

function normalizeCountryCode(value) {
  const code = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function normalizeStateCode(value) {
  return String(value ?? "").trim().toUpperCase() || null;
}

function maybeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isUsableCoord(lat, lng) {
  if (lat == null || lng == null) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function titleizeSlug(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function addCategoryKeys(target, provider) {
  const services = listServicesForProvider(provider.id);
  for (const service of services) {
    if (service.serviceId) target.add(`service:${service.serviceId}`);
  }

  if (provider.categoryKey) target.add(`category:${provider.categoryKey}`);
  if (provider.businessType) target.add(`type:${provider.businessType}`);
}

function addCoord(target, lat, lng) {
  const cleanLat = maybeNumber(lat);
  const cleanLng = maybeNumber(lng);
  if (!isUsableCoord(cleanLat, cleanLng)) return;

  target.coordLatSum += cleanLat;
  target.coordLngSum += cleanLng;
  target.coordCount += 1;
}

function resolveAveragedCoord(entry, fallback) {
  if (entry.coordCount > 0) {
    return {
      lat: entry.coordLatSum / entry.coordCount,
      lng: entry.coordLngSum / entry.coordCount
    };
  }

  const fallbackLat = maybeNumber(fallback?.lat);
  const fallbackLng = maybeNumber(fallback?.lng);
  if (!isUsableCoord(fallbackLat, fallbackLng)) {
    const countryFallback = COUNTRY_CENTROIDS[entry.countryCode];
    return {
      lat: countryFallback?.lat ?? null,
      lng: countryFallback?.lng ?? null
    };
  }

  return {
    lat: fallbackLat,
    lng: fallbackLng
  };
}

function findStateFallback(countryCode, stateCode) {
  return STATE_CENTROIDS[`${countryCode}:${stateCode}`] ?? COUNTRY_CENTROIDS[countryCode] ?? null;
}

function findCityFallback(countryCode, citySlug, stateCode) {
  if (!countryCode || !citySlug) return null;
  const country = getCountryByCode(countryCode);
  const city = getCityBySlug(citySlug, { countryId: country?.id });
  if (isUsableCoord(maybeNumber(city?.lat), maybeNumber(city?.lon))) {
    return { lat: city.lat, lng: city.lon };
  }

  const structured = listStructuredCitiesByCountryCode(countryCode).find(
    (item) => normalizeSlug(item.slug) === citySlug
  );
  if (isUsableCoord(maybeNumber(structured?.lat), maybeNumber(structured?.lon))) {
    return { lat: structured.lat, lng: structured.lon };
  }

  return findStateFallback(countryCode, stateCode);
}

function createCountryEntry(countryCode) {
  const country = getCountryByCode(countryCode);
  const display = getAnyCountryByCode(countryCode);
  return {
    countryCode,
    countrySlug: country?.slug ?? countryCode.toLowerCase(),
    countryName: display?.name ?? countryCode,
    countryNameEs: display?.nameEs ?? display?.name ?? countryCode,
    stateCodes: new Set(),
    citySlugs: new Set(),
    categories: new Set(),
    providerCount: 0,
    coordLatSum: 0,
    coordLngSum: 0,
    coordCount: 0
  };
}

function createStateEntry(countryCode, stateCode) {
  const country = getCountryByCode(countryCode);
  const display = getAnyCountryByCode(countryCode);
  const region = country ? getRegionByCode(country.id, stateCode) : null;
  return {
    countryCode,
    countrySlug: country?.slug ?? countryCode.toLowerCase(),
    countryName: display?.name ?? countryCode,
    countryNameEs: display?.nameEs ?? display?.name ?? countryCode,
    stateCode,
    stateName: region?.name ?? stateCode,
    citySlugs: new Set(),
    categories: new Set(),
    providerCount: 0,
    coordLatSum: 0,
    coordLngSum: 0,
    coordCount: 0
  };
}

function createCityEntry(countryCode, citySlug, provider) {
  const country = getCountryByCode(countryCode);
  const display = getAnyCountryByCode(countryCode);
  const stateCode = normalizeStateCode(provider.primaryRegionCode);
  return {
    countryCode,
    countrySlug: country?.slug ?? countryCode.toLowerCase(),
    countryName: display?.name ?? countryCode,
    countryNameEs: display?.nameEs ?? display?.name ?? countryCode,
    stateCode,
    stateName: stateCode && country ? (getRegionByCode(country.id, stateCode)?.name ?? stateCode) : null,
    cityName: provider.primaryCityName ?? titleizeSlug(citySlug),
    citySlug,
    categories: new Set(),
    providerCount: 0,
    coordLatSum: 0,
    coordLngSum: 0,
    coordCount: 0
  };
}

function finalizeCountry(entry) {
  const coord = resolveAveragedCoord(entry, COUNTRY_CENTROIDS[entry.countryCode]);
  return {
    countryCode: entry.countryCode,
    countrySlug: entry.countrySlug,
    countryName: entry.countryName,
    countryNameEs: entry.countryNameEs,
    stateCode: null,
    stateName: null,
    cityName: null,
    citySlug: null,
    providerCount: entry.providerCount,
    categoryCount: entry.categories.size,
    cityCount: entry.citySlugs.size,
    lat: coord.lat,
    lng: coord.lng,
    href: `/${entry.countrySlug}`
  };
}

function finalizeState(entry) {
  const coord = resolveAveragedCoord(
    entry,
    findStateFallback(entry.countryCode, entry.stateCode)
  );
  return {
    countryCode: entry.countryCode,
    countrySlug: entry.countrySlug,
    countryName: entry.countryName,
    countryNameEs: entry.countryNameEs,
    stateCode: entry.stateCode,
    stateName: entry.stateName,
    cityName: null,
    citySlug: null,
    providerCount: entry.providerCount,
    categoryCount: entry.categories.size,
    cityCount: entry.citySlugs.size,
    lat: coord.lat,
    lng: coord.lng,
    href: `/${entry.countrySlug}`
  };
}

function finalizeCity(entry) {
  const coord = resolveAveragedCoord(
    entry,
    findCityFallback(entry.countryCode, entry.citySlug, entry.stateCode)
  );

  return {
    countryCode: entry.countryCode,
    countrySlug: entry.countrySlug,
    countryName: entry.countryName,
    countryNameEs: entry.countryNameEs,
    stateCode: entry.stateCode,
    stateName: entry.stateName,
    cityName: entry.cityName,
    citySlug: entry.citySlug,
    providerCount: entry.providerCount,
    categoryCount: entry.categories.size,
    cityCount: 1,
    lat: coord.lat,
    lng: coord.lng,
    href: `/${entry.countrySlug}/${entry.citySlug}`
  };
}

export function getTrazeGeoCoverage() {
  const countries = new Map();
  const states = new Map();
  const cities = new Map();

  for (const provider of listProviders({ requireStructuredCity: false })) {
    const countryCode = normalizeCountryCode(provider.primaryCountryCode);
    if (!countryCode) continue;

    const stateCode = normalizeStateCode(provider.primaryRegionCode);
    const citySlug = normalizeSlug(provider.primaryCitySlug);
    const lat = maybeNumber(provider.lat);
    const lng = maybeNumber(provider.lng);

    if (!countries.has(countryCode)) {
      countries.set(countryCode, createCountryEntry(countryCode));
    }
    const countryEntry = countries.get(countryCode);
    countryEntry.providerCount += 1;
    addCategoryKeys(countryEntry.categories, provider);
    addCoord(countryEntry, lat, lng);
    if (stateCode) countryEntry.stateCodes.add(stateCode);
    if (citySlug) countryEntry.citySlugs.add(citySlug);

    if (stateCode) {
      const stateKey = `${countryCode}:${stateCode}`;
      if (!states.has(stateKey)) {
        states.set(stateKey, createStateEntry(countryCode, stateCode));
      }
      const stateEntry = states.get(stateKey);
      stateEntry.providerCount += 1;
      addCategoryKeys(stateEntry.categories, provider);
      addCoord(stateEntry, lat, lng);
      if (citySlug) stateEntry.citySlugs.add(citySlug);
    }

    if (citySlug) {
      const cityKey = `${countryCode}:${citySlug}`;
      if (!cities.has(cityKey)) {
        cities.set(cityKey, createCityEntry(countryCode, citySlug, provider));
      }
      const cityEntry = cities.get(cityKey);
      cityEntry.providerCount += 1;
      addCategoryKeys(cityEntry.categories, provider);
      addCoord(cityEntry, lat, lng);
    }
  }

  const byProviderCount = (left, right) => {
    if (right.providerCount !== left.providerCount) return right.providerCount - left.providerCount;
    return String(left.countryName ?? left.cityName ?? "").localeCompare(
      String(right.countryName ?? right.cityName ?? "")
    );
  };

  return {
    countries: [...countries.values()].map(finalizeCountry).sort(byProviderCount),
    states: [...states.values()].map(finalizeState).sort(byProviderCount),
    cities: [...cities.values()].map(finalizeCity).sort(byProviderCount)
  };
}
