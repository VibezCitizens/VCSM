import {
  getCityById,
  getCityBySlug,
  getLocalityById,
  getLocalityBySlug
} from "@/data/repositories/city.repo";
import {
  getCountryById,
  getCountryBySlug,
  getLocaleForCountryCode,
  getRegionByCode,
  getRegionById
} from "@/data/repositories/geo.repo";
import { getServiceById, getServiceBySlug } from "@/data/repositories/service.repo";
import {
  getProviderBySlug,
  getStructuredCityBySlug,
  listProvidersByCountryAndService,
  listProvidersByCountryCitySlugAndService,
  listProvidersByLocalityAndService,
  listServicesForProvider
} from "@/data/repositories/provider.repo";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { buildDirectoryMetadata, buildProviderMetadata } from "@/seo/metadata";
import { providerMetaDescription } from "@/seo/providerBio";
import { getDirectoryRobotsForQuality } from "@/seo/qualityGuards";
import {
  countryCityLocalityServicePath,
  countryCityServicePath,
  countryProviderPath,
  countryServiceHubPath
} from "@/lib/paths";

export const LEGACY_TRANSITION_ROBOTS = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true }
};

export function resolveCountryProvider(params) {
  if (params.segment !== "pro") {
    return null;
  }

  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const provider = getProviderBySlug(params.service, { countryCode: country.code });
  if (!provider) {
    return null;
  }

  const city = (provider.primaryCityId ? getCityById(provider.primaryCityId) : null)
    ?? (provider.primaryCitySlug ? getStructuredCityBySlug(country.code, provider.primaryCitySlug) : null);
  const locality = provider.primaryLocalityId ? getLocalityById(provider.primaryLocalityId) : null;
  const region = provider.primaryRegionCode
    ? getRegionByCode(country.id, provider.primaryRegionCode)
    : null;

  const providerServices = listServicesForProvider(provider.id);
  const serviceIds = [...new Set(providerServices.map((item) => item.serviceId))];
  const services = serviceIds.map((serviceId) => getServiceById(serviceId)).filter(Boolean);

  return {
    routeMode: "country_provider",
    provider,
    country,
    city,
    locality,
    region,
    services,
    stats: getProviderStats(provider.id)
  };
}

export function resolveCountryServiceHub(params) {
  if (params.segment !== "services") {
    return null;
  }

  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const service = getServiceBySlug(params.service);
  if (!service) {
    return null;
  }

  const providers = listProvidersByCountryAndService(country.code, service.id);
  if (!providers.length) {
    return null;
  }

  const activeCities = [...new Set(
    providers.map((item) => item.provider.primaryCitySlug).filter(Boolean)
  )]
    .map((citySlug) => getStructuredCityBySlug(country.code, citySlug))
    .filter(Boolean);

  return { routeMode: "country_service_hub", country, service, providers, activeCities };
}

export function resolveCountryCityService(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const city = getCityBySlug(params.segment, { countryId: country.id })
    ?? getStructuredCityBySlug(country.code, params.segment);
  if (!city) {
    return null;
  }

  const service = getServiceBySlug(params.service);
  if (!service) {
    return null;
  }

  if (listProvidersByCountryCitySlugAndService(country.code, city.slug, service.id).length === 0) {
    return null;
  }

  const region = city.regionId ? getRegionById(city.regionId) : null;
  return { routeMode: "country_city_service", country, city, region, service };
}

export function resolveLegacyLocalityService(params) {
  const city = getCityBySlug(params.city);
  if (!city) {
    return null;
  }

  const locality = getLocalityBySlug(city.id, params.segment);
  if (!locality) {
    return null;
  }

  const service = getServiceBySlug(params.service);
  if (!service) {
    return null;
  }

  const country = getCountryById(city.countryId);
  if (!country) {
    return null;
  }

  if (listProvidersByLocalityAndService(locality.id, service.id).length === 0) {
    return null;
  }

  return { routeMode: "legacy_locality_service", country, city, locality, service };
}

export function resolvePage(params) {
  return (
    resolveCountryProvider(params) ??
    resolveCountryServiceHub(params) ??
    resolveCountryCityService(params) ??
    resolveLegacyLocalityService(params)
  );
}

export function buildCountryProviderMetadata(graph, options = {}) {
  return buildProviderMetadata({
    title: `${graph.provider.displayName}${graph.city?.name ? ` in ${graph.city.name}, ${graph.country.name}` : ""}`,
    description: providerMetaDescription(graph.provider),
    path: countryProviderPath(graph.country.slug, graph.provider.slug),
    locale: getLocaleForCountryCode(graph.country.code),
    routeLocale: options.routeLocale
  });
}

export function buildCountryServiceHubMetadata(graph, options = {}) {
  return buildDirectoryMetadata({
    title: `${graph.service.name} Providers Across ${graph.country.name}`,
    description: `Compare ${graph.service.name.toLowerCase()} providers across ${graph.activeCities.length} active cities in ${graph.country.name}.`,
    path: countryServiceHubPath(graph.country.slug, graph.service.slug),
    locale: getLocaleForCountryCode(graph.country.code),
    routeLocale: options.routeLocale,
    robots: getDirectoryRobotsForQuality("country_service", {
      providerCount: graph.providers.length,
      cityCount: graph.activeCities.length,
      hasMeaningfulMetadata: true
    })
  });
}

export function buildCountryCityServiceMetadata(graph, options = {}) {
  const locationTail = [graph.city.name, graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");
  const providers = listProvidersByCountryCitySlugAndService(
    graph.country.code,
    graph.city.slug,
    graph.service.id
  );

  return buildDirectoryMetadata({
    title: `Best ${graph.service.name} in ${locationTail}`,
    description: `Find top-rated ${graph.service.name.toLowerCase()} providers in ${graph.city.name}, ${graph.country.name}. Compare pricing, read reviews, and book directly.`,
    path: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug),
    locale: getLocaleForCountryCode(graph.country.code),
    routeLocale: options.routeLocale,
    robots: getDirectoryRobotsForQuality("country_city_service", {
      providerCount: providers.length,
      hasMeaningfulMetadata: true
    })
  });
}

export function buildLegacyLocalityServiceMetadata(graph, options = {}) {
  return buildDirectoryMetadata({
    title: `${graph.service.name} in ${graph.locality.name}, ${graph.city.name}, ${graph.country.name}`,
    description: `Top ${graph.service.name.toLowerCase()} providers in ${graph.locality.name}, ${graph.city.name}. Compare local pricing, read reviews, and book.`,
    path: countryCityLocalityServicePath(
      graph.country.slug,
      graph.city.slug,
      graph.locality.slug,
      graph.service.slug
    ),
    locale: getLocaleForCountryCode(graph.country.code),
    routeLocale: options.routeLocale,
    robots: LEGACY_TRANSITION_ROBOTS
  });
}
