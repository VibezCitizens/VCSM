import { notFound } from "next/navigation";
import { getCityBySlug, listLocalitiesByCity } from "@/data/repositories/city.repo";
import {
  getCountryById,
  getCountryBySlug,
  getLocaleForCountryCode,
  getRegionById
} from "@/data/repositories/geo.repo";
import { getServiceBySlug, listServices, listSpecialtiesByService } from "@/data/repositories/service.repo";
import { listProvidersByCity, listProvidersByCityAndService } from "@/data/repositories/provider.repo";
import { getPriceAggregate } from "@/data/repositories/aggregate.repo";
import {
  listCityServiceStaticParams,
  listCountryCityStaticParams
} from "@/data/repositories/pageCandidate.repo";
import { buildDirectoryPageModel } from "@/data/mappers/pageModel.mapper";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { buildBreadcrumbSchema, buildDirectoryItemListSchema } from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import {
  cityPath,
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityLocalityServiceSpecialtyPath,
  countryCityPath,
  countryCityServicePath,
  countryPath,
  countryProviderPath,
  countryServiceHubPath,
  neighborhoodServicePath
} from "@/lib/paths";
import { DirectoryPageTemplate } from "@/features/directories/templates/DirectoryPageTemplate";

const LEGACY_TRANSITION_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true
  }
};

function dedupeParamPairs(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = `${entry.city}::${entry.segment}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entry);
  }

  return output;
}

export function generateStaticParams() {
  const globalCountryCity = listCountryCityStaticParams().map((entry) => ({
    city: entry.country,
    segment: entry.city
  }));

  const legacyCityService = listCityServiceStaticParams().map((entry) => ({
    city: entry.city,
    segment: entry.service
  }));

  return dedupeParamPairs([...globalCountryCity, ...legacyCityService]);
}

function resolveCountryCity(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const city = getCityBySlug(params.segment, { countryId: country.id });
  if (!city) {
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

function resolveLegacyCityService(params) {
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

  return {
    routeMode: "legacy_city_service",
    country,
    city,
    region,
    service
  };
}

function resolvePage(params) {
  return resolveCountryCity(params) ?? resolveLegacyCityService(params);
}

function buildCountryCityMetadata(graph) {
  const locationTail = [graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  return buildDirectoryMetadata({
    title: `Top Service Providers in ${graph.city.name}${locationTail ? `, ${locationTail}` : ""}`,
    description: `Browse rated providers across all service categories in ${graph.city.name}, ${graph.country.name}. Compare pricing, reviews, and book directly.`,
    path: countryCityPath(graph.country.slug, graph.city.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

function buildLegacyCityServiceMetadata(graph) {
  const locationTail = [graph.city.name, graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  return buildDirectoryMetadata({
    title: `Best ${graph.service.name} in ${locationTail}`,
    description: `Find top-rated ${graph.service.name.toLowerCase()} providers in ${graph.city.name}, ${graph.country.name}. Compare pricing, read reviews, and book directly.`,
    path: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug),
    locale: getLocaleForCountryCode(graph.country.code),
    robots: LEGACY_TRANSITION_ROBOTS
  });
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country_city") {
    return buildCountryCityMetadata(graph);
  }

  return buildLegacyCityServiceMetadata(graph);
}

function renderCountryCityPage(graph) {
  const providers = listProvidersByCity(graph.city.id);
  const services = listServices();
  const localities = listLocalitiesByCity(graph.city.id);

  const locationTail = [graph.region?.code ?? graph.city.stateCode, graph.country.code]
    .filter(Boolean)
    .join(", ");

  const model = buildDirectoryPageModel({
    title: `Top Service Providers in ${graph.city.name}${locationTail ? `, ${locationTail}` : ""}`,
    description: `Explore ${providers.length} rated providers in ${graph.city.name}, ${graph.country.name}. Compare pricing, read reviews, and connect with top professionals.`,
    itemName: `${graph.city.name}, ${graph.country.name}`,
    providers,
    priceAggregate: null,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name, href: countryPath(graph.country.slug) },
    { label: graph.city.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...services.map((service) => ({
      label: `${service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, service.slug)
    })),
    ...localities.flatMap((locality) =>
      services.slice(0, 2).map((service) => ({
        label: `${service.name} in ${locality.name}`,
        href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, service.slug)
      }))
    ),
    ...services.map((service) => ({
      label: `${service.name} across ${graph.country.name}`,
      href: countryServiceHubPath(graph.country.slug, service.slug)
    })),
    {
      label: `Legacy city URL (${graph.city.slug})`,
      href: cityPath(graph.city.slug)
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityPath(graph.country.slug, graph.city.slug),
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
      context={{ countrySlug: graph.country.slug, citySlug: graph.city.slug }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

function renderLegacyCityServicePage(graph) {
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
    { label: graph.country.name, href: countryPath(graph.country.slug) },
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
            listProvidersByCityAndService(graph.city.id, graph.service.id)
              .filter((item) => item.provider.primaryLocalityId === locality.id)
              .some((item) =>
                item.providerServices.some(
                  (providerService) =>
                    providerService.serviceId === graph.service.id &&
                    providerService.specialtyId === specialty.id
                )
              )
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
    },
    {
      label: `Canonical global URL (${graph.country.slug}/${graph.city.slug}/${graph.service.slug})`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.service.slug)
    },
    {
      label: `Legacy city-service URL (${graph.city.slug}/${graph.service.slug})`,
      href: cityServicePath(graph.city.slug, graph.service.slug)
    },
    ...localities.map((locality) => ({
      label: `Legacy locality path (${graph.city.slug}/${locality.slug}/${graph.service.slug})`,
      href: neighborhoodServicePath(graph.city.slug, locality.slug, graph.service.slug)
    }))
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

export default function DualSegmentPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country_city") {
    return renderCountryCityPage(graph);
  }

  return renderLegacyCityServicePage(graph);
}
