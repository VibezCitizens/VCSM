import { listLocalitiesByCity } from "@/data/repositories/city.repo";
import { getLocaleForCountryCode, getRegionByCode } from "@/data/repositories/geo.repo";
import { listServices } from "@/data/repositories/service.repo";
import {
  listProvidersByCity,
  listProvidersByCountry,
  listProvidersByCountryCitySlug,
  listProvidersByCountryAndService,
  listStructuredCitiesByCountryCode
} from "@/data/repositories/provider.repo";
import { listCountryServiceHubStaticParams } from "@/data/repositories/staticParams.repo";
import { buildDirectoryPageModel } from "@/data/mappers/pageModel.model";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import { keepGeneratedLinks } from "@/seo/generatedPaths";
import { buildBreadcrumbSchema, buildDirectoryItemListSchema } from "@/seo/schemaOrg";
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
import {
  DirectoryPageTemplate,
  CountryHubTemplate
} from "@/features/directories/adapters/directories.adapter";
import { buildHomepageProviderCard } from "@/data/repositories/homepage.repo";
import { LIVE_DATA_STATUS } from "@/data/connectors/unifiedDataset";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";

function groupCitiesByState(cities, countrySlug) {
  const order = [];
  const map = new Map();

  for (const city of cities) {
    const key = city.stateCode ?? "__none__";
    if (!map.has(key)) {
      order.push(key);
      map.set(key, { stateCode: city.stateCode ?? null, cities: [] });
    }
    map.get(key).cities.push({
      slug: city.slug,
      name: city.name,
      nameEs: city.nameEs ?? city.name,
      href: countryCityPath(countrySlug, city.slug),
      providerCount: 0
    });
  }

  return order.map((k) => map.get(k));
}

export function renderCountryPage(graph) {
  const services = listServices();
  const allProviders = listProvidersByCountry(graph.country.code);
  const structuredCities = listStructuredCitiesByCountryCode(graph.country.code);

  const liveCities = structuredCities.filter(
    (city) => listProvidersByCountryCitySlug(graph.country.code, city.slug).length > 0
  );

  // Featured — max 3 cards, built with the shared homepage card builder
  // so country-hub cards render identically to the homepage cards.
  const featuredProviders = allProviders
    .slice(0, 3)
    .map((item) => buildHomepageProviderCard(item.provider))
    .filter(Boolean);

  // Cities grouped by state with provider counts, state name, and state-level aggregates
  const rawGroups = groupCitiesByState(liveCities, graph.country.slug);
  const enrichedStateGroups = rawGroups.map((group) => {
    const citiesWithCounts = group.cities.map((city) => ({
      ...city,
      providerCount: listProvidersByCountryCitySlug(graph.country.code, city.slug).length
    }));
    const stateProviderCount = citiesWithCounts.reduce((sum, c) => sum + c.providerCount, 0);
    const stateName = group.stateCode
      ? (getRegionByCode(graph.country.id, group.stateCode)?.name ?? group.stateCode)
      : null;
    return {
      stateCode: group.stateCode,
      stateName,
      providerCount: stateProviderCount,
      cityCount: citiesWithCounts.length,
      cities: citiesWithCounts
    };
  });

  const geoData = [{
    countryCode: graph.country.code,
    countrySlug: graph.country.slug,
    countryName: graph.country.name,
    countryNameEs: graph.country.nameEs ?? graph.country.name,
    providerCount: allProviders.length,
    cityCount: liveCities.length,
    stateGroups: enrichedStateGroups
  }];

  // Services active in this country
  const serviceHubCandidates = new Set(
    listCountryServiceHubStaticParams().map((entry) => `${entry.country}:${entry.service}`)
  );

  const serviceGroups = services
    .map((service) => {
      const serviceProviders = listProvidersByCountryAndService(graph.country.code, service.id);
      if (!serviceProviders.length) return null;
      const cityCount = new Set(serviceProviders.map((i) => i.provider.primaryCitySlug).filter(Boolean)).size;
      const isIndexed = serviceHubCandidates.has(`${graph.country.slug}:${service.slug}`);
      const hasHub = isCountryServiceIndexable(serviceProviders.length, cityCount) && isIndexed;
      return {
        slug: service.slug,
        name: service.name,
        nameEs: service.nameEs ?? service.name,
        href: hasHub
          ? countryServiceHubPath(graph.country.slug, service.slug)
          : countryCityPath(graph.country.slug, liveCities[0]?.slug ?? ""),
        providerCount: serviceProviders.length
      };
    })
    .filter(Boolean);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: graph.country.name }
  ];

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: `Service directory in ${graph.country.name}`,
      path: countryPath(graph.country.slug),
      providers: allProviders,
      cityName: undefined,
      countryName: graph.country.name,
      resolveProviderPath: (provider) => countryProviderPath(graph.country.slug, provider.slug)
    })
  ];

  return (
    <CountryHubTemplate
      country={graph.country}
      breadcrumbs={breadcrumbs}
      schema={schema}
      context={{ countrySlug: graph.country.slug }}
      stats={{
        providerCount: allProviders.length,
        cityCount: liveCities.length,
        serviceCount: serviceGroups.length
      }}
      featuredProviders={featuredProviders}
      geoData={geoData}
      serviceGroups={serviceGroups}
      locationOptions={listLiveProviderLocationOptions()}
      countryOptions={listLiveProviderCountries()}
    />
  );
}

export function renderLegacyCityPage(graph) {
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

  const relatedLinks = keepGeneratedLinks(dedupeInternalLinks([
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
  ]));

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
      liveDataStatus={LIVE_DATA_STATUS}
    />
  );
}
