import { getCityBySlug } from "@/data/repositories/city.repo";
import {
  getCountryById,
  getCountryBySlug,
  getLocaleForCountryCode,
  getRegionById
} from "@/data/repositories/geo.repo";
import { getServiceBySlug } from "@/data/repositories/service.repo";
import {
  getStructuredCityBySlug,
  listProvidersByCityAndService,
  listProvidersByCountryCitySlug
} from "@/data/repositories/provider.repo";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { getDirectoryRobotsForQuality } from "@/seo/qualityGuards";
import { countryCityPath, countryCityServicePath } from "@/lib/paths";

export const LEGACY_TRANSITION_ROBOTS = {
  index: false,
  follow: true,
  googleBot: {
    index: false,
    follow: true
  }
};

export function resolveCountryCity(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const city = getCityBySlug(params.segment, { countryId: country.id })
    ?? getStructuredCityBySlug(country.code, params.segment);
  if (!city) {
    return null;
  }

  if (listProvidersByCountryCitySlug(country.code, city.slug).length === 0) {
    return null;
  }

  const region = city.regionId ? getRegionById(city.regionId) : null;
  return {
    routeMode: "country_city",
    country,
    city,
    region
  };
}

export function resolveLegacyCityService(params) {
  const city = getCityBySlug(params.city);
  if (!city) {
    return null;
  }

  const service = getServiceBySlug(params.segment);
  if (!service) {
    return null;
  }

  const country = getCountryById(city.countryId);
  if (!country) {
    return null;
  }

  const region = city.regionId ? getRegionById(city.regionId) : null;

  if (listProvidersByCityAndService(city.id, service.id).length === 0) {
    return null;
  }

  return {
    routeMode: "legacy_city_service",
    country,
    city,
    region,
    service
  };
}

export function resolvePage(params) {
  return resolveCountryCity(params) ?? resolveLegacyCityService(params);
}

export function buildCountryCityMetadata(graph, options = {}) {
  const locationTail = [graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");
  const providers = listProvidersByCountryCitySlug(graph.country.code, graph.city.slug);

  return buildDirectoryMetadata({
    title: `Top Service Providers in ${graph.city.name}${locationTail ? `, ${locationTail}` : ""}`,
    description: `Browse rated providers across all service categories in ${graph.city.name}, ${graph.country.name}. Compare pricing, reviews, and book directly.`,
    path: countryCityPath(graph.country.slug, graph.city.slug),
    locale: getLocaleForCountryCode(graph.country.code),
    routeLocale: options.routeLocale,
    robots: getDirectoryRobotsForQuality("country_city", {
      providerCount: providers.length,
      hasMeaningfulMetadata: true
    })
  });
}

export function buildLegacyCityServiceMetadata(graph, options = {}) {
  const locationTail = [graph.city.name, graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  return buildDirectoryMetadata({
    title: `Best ${graph.service.name} in ${locationTail}`,
    description: `Find top-rated ${graph.service.name.toLowerCase()} providers in ${graph.city.name}, ${graph.country.name}. Compare pricing, read reviews, and book directly.`,
    path: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug),
    locale: getLocaleForCountryCode(graph.country.code),
    routeLocale: options.routeLocale,
    robots: LEGACY_TRANSITION_ROBOTS
  });
}
