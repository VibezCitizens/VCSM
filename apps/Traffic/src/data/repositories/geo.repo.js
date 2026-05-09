import { COUNTRIES, REGIONS } from "@/data/connectors/taxonomyDataset";
import { slugEquals } from "@/lib/slugs";

export function listCountries() {
  return COUNTRIES.filter((country) => country.isActive);
}

export function getCountryBySlug(countrySlug) {
  const rawSlug = String(countrySlug ?? "").trim();
  if (!rawSlug) return null;

  return listCountries().find((country) =>
    slugEquals(country.slug, rawSlug) ||
    (Array.isArray(country.aliases) && country.aliases.some((alias) => slugEquals(alias, rawSlug)))
  ) ?? null;
}

export function getCountryByCode(countryCode) {
  return listCountries().find((country) => country.code === String(countryCode ?? "").toUpperCase()) ?? null;
}

export function getCountryById(countryId) {
  return listCountries().find((country) => country.id === countryId) ?? null;
}

export function listRegionsByCountry(countryId) {
  return REGIONS.filter((region) => region.countryId === countryId && region.isActive);
}

export function getRegionById(regionId) {
  return REGIONS.find((region) => region.id === regionId && region.isActive) ?? null;
}

export function getRegionByCode(countryId, regionCode) {
  return listRegionsByCountry(countryId).find(
    (region) => region.code === String(regionCode ?? "").toUpperCase()
  ) ?? null;
}

export function getLocaleForCountryCode(countryCode) {
  return getCountryByCode(countryCode)?.defaultLocale ?? "en-US";
}

export function getCurrencyForCountryCode(countryCode) {
  return getCountryByCode(countryCode)?.defaultCurrencyCode ?? "USD";
}
