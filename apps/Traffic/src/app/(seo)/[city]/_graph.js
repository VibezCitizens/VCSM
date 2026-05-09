import { getCityBySlug } from "@/data/repositories/city.repo";
import {
  getCountryById,
  getCountryBySlug,
  getLocaleForCountryCode,
  getRegionById
} from "@/data/repositories/geo.repo";
import {
  listProvidersByCity,
  listProvidersByCountry,
  listStructuredCitiesByCountryCode
} from "@/data/repositories/provider.repo";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { countryPath, countryCityPath } from "@/lib/paths";

export const LEGACY_TRANSITION_ROBOTS = {
  index: false,
  follow: true,
  googleBot: {
    index: false,
    follow: true
  }
};

export function resolveCountryPage(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  if (listProvidersByCountry(country.code).length === 0) {
    return null;
  }

  return {
    routeMode: "country",
    country
  };
}

export function resolveLegacyCityPage(params) {
  const city = getCityBySlug(params.city);
  if (!city) {
    return null;
  }

  const country = getCountryById(city.countryId);
  if (!country) {
    return null;
  }

  if (listProvidersByCity(city.id).length === 0) {
    return null;
  }

  const region = city.regionId ? getRegionById(city.regionId) : null;

  return {
    routeMode: "legacy_city",
    city,
    country,
    region
  };
}

export function resolvePage(params) {
  return resolveCountryPage(params) ?? resolveLegacyCityPage(params);
}

export function buildCountryMetadata(graph) {
  const providers = listProvidersByCountry(graph.country.code);
  const cities = listStructuredCitiesByCountryCode(graph.country.code);

  return buildDirectoryMetadata({
    title: `Top Local Service Providers in ${graph.country.name}`,
    description: `Explore ${providers.length} verified and discoverable providers across ${cities.length} cities in ${graph.country.name}.`,
    path: countryPath(graph.country.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

export function buildLegacyCityMetadata(graph) {
  const locationTail = [graph.region?.code ?? graph.city.stateCode, graph.country.code].filter(Boolean).join(", ");

  const title = `Top Service Providers in ${graph.city.name}${locationTail ? `, ${locationTail}` : ""}`;
  const description = `Browse rated providers across all service categories in ${graph.city.name}, ${graph.country.name}. Compare pricing, reviews, and book directly.`;

  return buildDirectoryMetadata({
    title,
    description,
    path: countryCityPath(graph.country.slug, graph.city.slug),
    locale: getLocaleForCountryCode(graph.country.code),
    robots: LEGACY_TRANSITION_ROBOTS
  });
}
