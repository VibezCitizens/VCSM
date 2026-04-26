import { notFound } from "next/navigation";
import { getCityBySlug, listCities, listLocalitiesByCity } from "@/data/repositories/city.repo";
import {
  getCountryById,
  getCountryBySlug,
  getLocaleForCountryCode,
  getRegionById
} from "@/data/repositories/geo.repo";
import { listServices } from "@/data/repositories/service.repo";
import {
  listProvidersByCity,
  listProvidersByCountry,
  listProvidersByCountryAndService
} from "@/data/repositories/provider.repo";
import {
  listCityStaticParams,
  listCountryServiceHubStaticParams,
  listCountryStaticParams
} from "@/data/repositories/pageCandidate.repo";
import { buildDirectoryPageModel } from "@/data/mappers/pageModel.mapper";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { buildBreadcrumbSchema, buildDirectoryItemListSchema } from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import { isCountryServiceIndexable } from "@/seo/qualityGuards";
import {
  cityPath,
  cityServicePath,
  countryCityLocalityServicePath,
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

function dedupeCityParams(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = entry.city;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entry);
  }

  return output;
}

export function generateStaticParams() {
  const countryPages = listCountryStaticParams().map((entry) => ({ city: entry.country }));
  return dedupeCityParams([...countryPages, ...listCityStaticParams()]);
}

function resolveCountryPage(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  return {
    routeMode: "country",
    country
  };
}

function resolveLegacyCityPage(params) {
  const city = getCityBySlug(params.city);
  if (!city) {
    return null;
  }

  const country = getCountryById(city.countryId);
  if (!country) {
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

function resolvePage(params) {
  return resolveCountryPage(params) ?? resolveLegacyCityPage(params);
}

function buildCountryMetadata(graph) {
  const providers = listProvidersByCountry(graph.country.code);
  const cities = listCities({ countryId: graph.country.id });

  return buildDirectoryMetadata({
    title: `Top Local Service Providers in ${graph.country.name}`,
    description: `Explore ${providers.length} verified and discoverable providers across ${cities.length} cities in ${graph.country.name}.`,
    path: countryPath(graph.country.slug),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

function buildLegacyCityMetadata(graph) {
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

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country") {
    return buildCountryMetadata(graph);
  }

  return buildLegacyCityMetadata(graph);
}

function renderCountryPage(graph) {
  const services = listServices();
  const providers = listProvidersByCountry(graph.country.code);
  const cities = listCities({ countryId: graph.country.id }).filter(
    (city) => listProvidersByCity(city.id).length > 0
  );

  const model = buildDirectoryPageModel({
    title: `Top Local Service Providers in ${graph.country.name}`,
    description: `Explore ${providers.length} discoverable providers across ${cities.length} active cities in ${graph.country.name}.`,
    itemName: graph.country.name,
    providers,
    priceAggregate: null,
    locale: getLocaleForCountryCode(graph.country.code)
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name }
  ];

  const serviceHubCandidates = new Set(
    listCountryServiceHubStaticParams().map((entry) => `${entry.country}:${entry.service}`)
  );

  const serviceHubLinks = services
    .map((service) => {
      const serviceProviders = listProvidersByCountryAndService(graph.country.code, service.id);
      const cityCount = new Set(serviceProviders.map((item) => item.provider.primaryCityId)).size;
      const isStrongCoverage = isCountryServiceIndexable(serviceProviders.length, cityCount);
      const isIndexed = serviceHubCandidates.has(`${graph.country.slug}:${service.slug}`);

      if (!isStrongCoverage || !isIndexed) {
        return null;
      }

      return {
        label: `${service.name} in ${graph.country.name}`,
        href: countryServiceHubPath(graph.country.slug, service.slug)
      };
    })
    .filter(Boolean);

  const cityLinks = cities.map((city) => ({
    label: `Providers in ${city.name}`,
    href: countryCityPath(graph.country.slug, city.slug)
  }));

  const featuredProviderLinks = providers.slice(0, 8).map((item) => ({
    label: item.provider.displayName,
    href: countryProviderPath(graph.country.slug, item.provider.slug)
  }));

  const relatedLinks = dedupeInternalLinks([
    ...serviceHubLinks,
    ...cityLinks,
    ...featuredProviderLinks
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryPath(graph.country.slug),
      providers,
      cityName: undefined,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <DirectoryPageTemplate
      breadcrumbs={breadcrumbs}
      model={model}
      context={{ countrySlug: graph.country.slug }}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}

function renderLegacyCityPage(graph) {
  const providers = listProvidersByCity(graph.city.id);
  const services = listServices();
  const localities = listLocalitiesByCity(graph.city.id);

  const locationTail = [graph.region?.code ?? graph.city.stateCode, graph.country.code].filter(Boolean).join(", ");

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
    {
      label: `Canonical city page in ${graph.country.name}`,
      href: countryCityPath(graph.country.slug, graph.city.slug)
    },
    ...services.map((service) => ({
      label: `${service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, service.slug)
    })),
    ...localities.flatMap((locality) =>
      services.slice(0, 2).map((service) => ({
        label: `${service.name} in ${locality.name}`,
        href: countryCityLocalityServicePath(
          graph.country.slug,
          graph.city.slug,
          locality.slug,
          service.slug
        )
      }))
    ),
    {
      label: `Legacy city URL (${graph.city.slug})`,
      href: cityPath(graph.city.slug)
    },
    ...services.map((service) => ({
      label: `Legacy city-service URL (${graph.city.slug}/${service.slug})`,
      href: cityServicePath(graph.city.slug, service.slug)
    })),
    ...localities.map((locality) => ({
      label: `Legacy locality URL (${graph.city.slug}/${locality.slug}/...)`,
      href: neighborhoodServicePath(graph.city.slug, locality.slug, services[0]?.slug ?? "")
    }))
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

export default function CityPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country") {
    return renderCountryPage(graph);
  }

  return renderLegacyCityPage(graph);
}
