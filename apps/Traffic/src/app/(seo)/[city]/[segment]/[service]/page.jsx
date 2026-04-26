import { notFound } from "next/navigation";
import {
  getCityById,
  getCityBySlug,
  getLocalityById,
  getLocalityBySlug,
  listLocalitiesByCity
} from "@/data/repositories/city.repo";
import {
  getCountryById,
  getCountryBySlug,
  getLocaleForCountryCode,
  getRegionByCode,
  getRegionById
} from "@/data/repositories/geo.repo";
import {
  getServiceById,
  getServiceBySlug,
  listServices,
  listSpecialtiesByService
} from "@/data/repositories/service.repo";
import {
  getProviderBySlug,
  listProvidersByCountryAndService,
  listProvidersByCityAndService,
  listProvidersByLocalityAndService,
  listServicesForProvider
} from "@/data/repositories/provider.repo";
import { getPriceAggregate, getProviderStats } from "@/data/repositories/aggregate.repo";
import {
  listCountryCityServiceStaticParams,
  listCountryProviderStaticParams,
  listCountryServiceHubStaticParams,
  listNeighborhoodServiceStaticParams
} from "@/data/repositories/pageCandidate.repo";
import {
  buildDirectoryPageModel,
  buildProviderPageModel
} from "@/data/mappers/pageModel.mapper";
import { buildDirectoryMetadata, buildProviderMetadata } from "@/seo/metadata";
import {
  buildBreadcrumbSchema,
  buildDirectoryItemListSchema,
  buildProviderSchema
} from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import {
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityLocalityServiceSpecialtyPath,
  countryCityPath,
  countryCityServicePath,
  countryPath,
  countryProviderPath,
  countryServiceHubPath,
  neighborhoodServicePath,
  providerPath
} from "@/lib/paths";
import { DirectoryPageTemplate } from "@/features/directories/templates/DirectoryPageTemplate";
import { ProviderPageTemplate } from "@/features/providers/templates/ProviderPageTemplate";

export const revalidate = 900;

const LEGACY_TRANSITION_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true
  }
};

function dedupeParamTriples(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = `${entry.city}::${entry.segment}::${entry.service}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entry);
  }

  return output;
}

export function generateStaticParams() {
  const globalCountryCityService = listCountryCityServiceStaticParams().map((entry) => ({
    city: entry.country,
    segment: entry.city,
    service: entry.service
  }));

  const countryServiceHubs = listCountryServiceHubStaticParams().map((entry) => ({
    city: entry.country,
    segment: "services",
    service: entry.service
  }));

  const legacyLocalityService = listNeighborhoodServiceStaticParams().map((entry) => ({
    city: entry.city,
    segment: entry.neighborhood,
    service: entry.service
  }));

  const countryProvider = listCountryProviderStaticParams().map((entry) => ({
    city: entry.country,
    segment: "pro",
    service: entry.providerSlug
  }));

  return dedupeParamTriples([
    ...globalCountryCityService,
    ...countryServiceHubs,
    ...legacyLocalityService,
    ...countryProvider
  ]);
}

function resolveCountryProvider(params) {
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

  const city = getCityById(provider.primaryCityId);
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

function resolveCountryServiceHub(params) {
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

  const activeCities = [...new Set(providers.map((item) => item.provider.primaryCityId))]
    .map((cityId) => getCityById(cityId))
    .filter(Boolean);

  return {
    routeMode: "country_service_hub",
    country,
    service,
    providers,
    activeCities
  };
}

function resolveCountryCityService(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const city = getCityBySlug(params.segment, { countryId: country.id });
  if (!city) {
    return null;
  }

  const service = getServiceBySlug(params.service);
  if (!service) {
    return null;
  }

  const region = city.regionId ? getRegionById(city.regionId) : null;

  return {
    routeMode: "country_city_service",
    country,
    city,
    region,
    service
  };
}

function resolveLegacyLocalityService(params) {
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

  return {
    routeMode: "legacy_locality_service",
    country,
    city,
    locality,
    service
  };
}

function resolvePage(params) {
  return (
    resolveCountryProvider(params) ??
    resolveCountryServiceHub(params) ??
    resolveCountryCityService(params) ??
    resolveLegacyLocalityService(params)
  );
}

function buildCountryProviderMetadata(graph) {
  return buildProviderMetadata({
    title: `${graph.provider.displayName}${graph.city?.name ? ` in ${graph.city.name}, ${graph.country.name}` : ""}`,
    description:
      graph.provider.shortBio ||
      `Learn more about ${graph.provider.displayName}. View services, reviews, and book directly.`,
    path: countryProviderPath(graph.country.slug, graph.provider.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

function buildCountryServiceHubMetadata(graph) {
  return buildDirectoryMetadata({
    title: `${graph.service.name} Providers Across ${graph.country.name}`,
    description: `Compare ${graph.service.name.toLowerCase()} providers across ${graph.activeCities.length} active cities in ${graph.country.name}.`,
    path: countryServiceHubPath(graph.country.slug, graph.service.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

function buildCountryCityServiceMetadata(graph) {
  const locationTail = [graph.city.name, graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  return buildDirectoryMetadata({
    title: `Best ${graph.service.name} in ${locationTail}`,
    description: `Find top-rated ${graph.service.name.toLowerCase()} providers in ${graph.city.name}, ${graph.country.name}. Compare pricing, read reviews, and book directly.`,
    path: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

function buildLegacyLocalityServiceMetadata(graph) {
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
    robots: LEGACY_TRANSITION_ROBOTS
  });
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country_provider") {
    return buildCountryProviderMetadata(graph);
  }

  if (graph.routeMode === "country_city_service") {
    return buildCountryCityServiceMetadata(graph);
  }

  if (graph.routeMode === "country_service_hub") {
    return buildCountryServiceHubMetadata(graph);
  }

  return buildLegacyLocalityServiceMetadata(graph);
}

function renderCountryProviderPage(graph) {
  const model = buildProviderPageModel({
    provider: graph.provider,
    cityName: graph.city?.name ?? "",
    countryName: graph.country.name,
    localityName: graph.locality?.name ?? "",
    services: graph.services
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(graph.city
      ? [{ label: graph.city.name, href: countryCityPath(graph.country.slug, graph.city.slug) }]
      : []),
    ...(graph.city && graph.services[0]
      ? [
          {
            label: `${graph.services[0].name} in ${graph.city.name}`,
            href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.services[0].slug)
          }
        ]
      : []),
    { label: graph.provider.displayName }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...(graph.city && graph.locality
      ? graph.services.map((service) => ({
          label: `${service.name} in ${graph.locality.name}`,
          href: countryCityLocalityServicePath(
            graph.country.slug,
            graph.city.slug,
            graph.locality.slug,
            service.slug
          )
        }))
      : []),
    ...(graph.city
      ? graph.services.map((service) => ({
          label: `All ${service.name} in ${graph.city.name}`,
          href: countryCityServicePath(graph.country.slug, graph.city.slug, service.slug)
        }))
      : []),
    {
      label: "Legacy provider path",
      href: providerPath(graph.provider.slug)
    },
    ...(graph.city
      ? graph.services.map((service) => ({
          label: `Legacy city-service path (${graph.city.slug}/${service.slug})`,
          href: cityServicePath(graph.city.slug, service.slug)
        }))
      : []),
    ...(graph.city && graph.locality
      ? graph.services.map((service) => ({
          label: `Legacy locality path (${graph.city.slug}/${graph.locality.slug}/${service.slug})`,
          href: neighborhoodServicePath(graph.city.slug, graph.locality.slug, service.slug)
        }))
      : [])
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildProviderSchema({
      providerName: graph.provider.displayName,
      description: graph.provider.shortBio,
      providerPath: countryProviderPath(graph.country.slug, graph.provider.slug),
      ratingAvg: graph.stats?.ratingAvg,
      reviewCount: graph.stats?.reviewCount,
      addressLine1: graph.provider.addressLine1,
      postalCode: graph.provider.postalCode,
      cityName: graph.city?.name,
      localityName: graph.locality?.name,
      regionName: graph.region?.name,
      countryCode: graph.provider.primaryCountryCode,
      countryName: graph.country.name
    })
  ];

  return (
    <ProviderPageTemplate
      model={model}
      stats={graph.stats}
      context={{
        countrySlug: graph.country.slug,
        citySlug: graph.city?.slug,
        localitySlug: graph.locality?.slug,
        serviceSlug: graph.services[0]?.slug
      }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

function renderCountryServiceHubPage(graph) {
  const model = buildDirectoryPageModel({
    title: `${graph.service.name} Providers Across ${graph.country.name}`,
    description: `Explore ${graph.providers.length} ${graph.service.name.toLowerCase()} providers across ${graph.activeCities.length} live cities in ${graph.country.name}.`,
    itemName: `${graph.service.name} · ${graph.country.name}`,
    providers: graph.providers,
    priceAggregate: null,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name, href: countryPath(graph.country.slug) },
    { label: `${graph.service.name} Services` }
  ];

  const localityLinks = graph.activeCities.flatMap((city) =>
    listLocalitiesByCity(city.id)
      .filter((locality) => listProvidersByLocalityAndService(locality.id, graph.service.id).length > 0)
      .map((locality) => ({
        label: `${graph.service.name} in ${locality.name}, ${city.name}`,
        href: countryCityLocalityServicePath(graph.country.slug, city.slug, locality.slug, graph.service.slug)
      }))
  );

  const relatedLinks = dedupeInternalLinks([
    {
      label: `All services in ${graph.country.name}`,
      href: countryPath(graph.country.slug)
    },
    ...graph.activeCities.map((city) => ({
      label: `${graph.service.name} in ${city.name}`,
      href: countryCityServicePath(graph.country.slug, city.slug, graph.service.slug)
    })),
    ...localityLinks,
    ...graph.providers.slice(0, 8).map((item) => ({
      label: item.provider.displayName,
      href: countryProviderPath(graph.country.slug, item.provider.slug)
    }))
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryServiceHubPath(graph.country.slug, graph.service.slug),
      providers: graph.providers,
      cityName: undefined,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{ countrySlug: graph.country.slug, serviceSlug: graph.service.slug }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

function renderCountryCityServicePage(graph) {
  const providers = listProvidersByCityAndService(graph.city.id, graph.service.id);
  const localities = listLocalitiesByCity(graph.city.id);
  const otherServices = listServices().filter((item) => item.id !== graph.service.id);
  const specialties = listSpecialtiesByService(graph.service.id);

  const priceAggregate = getPriceAggregate({
    countryId: graph.city.countryId,
    regionId: graph.city.regionId,
    cityId: graph.city.id,
    serviceId: graph.service.id
  });

  const locationTail = [graph.city.name, graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  const model = buildDirectoryPageModel({
    title: `Best ${graph.service.name} in ${locationTail}`,
    description: `${providers.length} ${graph.service.name.toLowerCase()} providers in ${graph.city.name}, ${graph.country.name}. Compare market pricing, reviews, and availability.`,
    itemName: `${graph.service.name} · ${graph.city.name}`,
    providers,
    priceAggregate,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.city.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.service.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...localities.map((locality) => ({
      label: `${graph.service.name} in ${locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, graph.service.slug)
    })),
    ...localities.flatMap((locality) =>
      specialties
        .filter(
          (specialty) =>
            listProvidersByLocalityAndService(locality.id, graph.service.id)
              .filter((item) =>
                item.providerServices.some(
                  (providerService) =>
                    providerService.serviceId === graph.service.id &&
                    providerService.specialtyId === specialty.id
                )
              ).length > 0
        )
        .slice(0, 3)
        .map((specialty) => ({
          label: `${specialty.name} ${graph.service.name} in ${locality.name}`,
          href: countryCityLocalityServiceSpecialtyPath(
            graph.country.slug,
            graph.city.slug,
            locality.slug,
            graph.service.slug,
            specialty.slug
          )
        }))
    ),
    ...otherServices.map((service) => ({
      label: `${service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, service.slug)
    })),
    {
      label: `${graph.service.name} across ${graph.country.name}`,
      href: countryServiceHubPath(graph.country.slug, graph.service.slug)
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug),
      providers,
      cityName: graph.city.name,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{
        countrySlug: graph.country.slug,
        citySlug: graph.city.slug,
        serviceSlug: graph.service.slug
      }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

function renderLegacyLocalityServicePage(graph) {
  const providers = listProvidersByLocalityAndService(graph.locality.id, graph.service.id);
  const otherLocalities = listLocalitiesByCity(graph.city.id).filter((entry) => entry.id !== graph.locality.id);
  const otherServices = listServices().filter((entry) => entry.id !== graph.service.id);
  const specialties = listSpecialtiesByService(graph.service.id).filter((specialty) =>
    providers.some((item) =>
      item.providerServices.some(
        (providerService) =>
          providerService.serviceId === graph.service.id &&
          providerService.specialtyId === specialty.id
      )
    )
  );

  const priceAggregate = getPriceAggregate({
    countryId: graph.city.countryId,
    regionId: graph.city.regionId,
    cityId: graph.city.id,
    serviceId: graph.service.id,
    localityId: graph.locality.id
  });

  const model = buildDirectoryPageModel({
    title: `${graph.service.name} in ${graph.locality.name}, ${graph.city.name}, ${graph.country.name}`,
    description: `${providers.length} ${graph.service.name.toLowerCase()} providers serving ${graph.locality.name}. Compare local rates and reviews.`,
    itemName: `${graph.service.name} · ${graph.locality.name}`,
    providers,
    priceAggregate,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    { label: graph.city.name, href: countryCityPath(graph.country.slug, graph.city.slug) },
    {
      label: `${graph.service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug)
    },
    { label: graph.locality.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...otherLocalities.map((locality) => ({
      label: `${graph.service.name} in ${locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, graph.service.slug)
    })),
    ...specialties.map((specialty) => ({
      label: `${specialty.name} ${graph.service.name} in ${graph.locality.name}`,
      href: countryCityLocalityServiceSpecialtyPath(
        graph.country.slug,
        graph.city.slug,
        graph.locality.slug,
        graph.service.slug,
        specialty.slug
      )
    })),
    ...otherServices.map((service) => ({
      label: `${service.name} in ${graph.locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, graph.locality.slug, service.slug)
    })),
    {
      label: `All ${graph.service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug)
    },
    {
      label: "Legacy locality URL",
      href: neighborhoodServicePath(graph.city.slug, graph.locality.slug, graph.service.slug)
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityLocalityServicePath(
        graph.country.slug,
        graph.city.slug,
        graph.locality.slug,
        graph.service.slug
      ),
      providers,
      cityName: graph.city.name,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{
        countrySlug: graph.country.slug,
        citySlug: graph.city.slug,
        localitySlug: graph.locality.slug,
        serviceSlug: graph.service.slug
      }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

export default function TripleSegmentPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country_provider") {
    return renderCountryProviderPage(graph);
  }

  if (graph.routeMode === "country_city_service") {
    return renderCountryCityServicePage(graph);
  }

  if (graph.routeMode === "country_service_hub") {
    return renderCountryServiceHubPage(graph);
  }

  return renderLegacyLocalityServicePage(graph);
}
