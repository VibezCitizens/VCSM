import { listLocalitiesByCity } from "@/data/repositories/city.repo";
import { getLocaleForCountryCode } from "@/data/repositories/geo.repo";
import { listServices, listSpecialtiesByService } from "@/data/repositories/service.repo";
import {
  listProvidersByCityAndService,
  listProvidersByCountryAndService,
  listProvidersByCountryCitySlug,
  listProvidersByCountryCitySlugAndService
} from "@/data/repositories/provider.repo";
import { getPriceAggregate } from "@/data/repositories/aggregate.repo";
import { buildDirectoryPageModel } from "@/data/mappers/pageModel.model";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import { keepGeneratedLinks } from "@/seo/generatedPaths";
import { buildBreadcrumbSchema, buildDirectoryItemListSchema } from "@/seo/schemaOrg";
import { isCountryServiceIndexable } from "@/seo/qualityGuards";
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
import { DirectoryPageTemplate } from "@/features/directories/adapters/directories.adapter";
import { LIVE_DATA_STATUS } from "@/data/connectors/unifiedDataset";

export function renderCountryCityPage(graph) {
  const providers = listProvidersByCountryCitySlug(graph.country.code, graph.city.slug);
  const services = listServices();
  const localities = listLocalitiesByCity(graph.city.id);

  // The [service] route calls notFound() when a city/service combo has zero
  // providers, so linking the full service taxonomy here produces dead 404
  // links (e.g. /us/san-lorenzo/hair-color when the city only has a barber).
  // Restrict service links to services that actually have coverage.
  const cityServiceIds = new Set(
    providers.flatMap((item) => item.providerServices.map((ps) => ps.serviceId))
  );
  const cityServices = services.filter((service) => cityServiceIds.has(service.id));
  // Country-hub links must mirror the static-export indexability gate
  // (>=3 providers across >=2 cities), or they 404 in the production export.
  const countryServices = services.filter((service) => {
    const countryServiceProviders = listProvidersByCountryAndService(graph.country.code, service.id);
    const cityCount = new Set(
      countryServiceProviders.map((item) => item.provider.primaryCitySlug).filter(Boolean)
    ).size;
    return isCountryServiceIndexable(countryServiceProviders.length, cityCount);
  });

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

  const relatedLinks = keepGeneratedLinks(dedupeInternalLinks([
    ...cityServices.map((service) => ({
      label: `${service.name} in ${graph.city.name}`,
      href: countryCityServicePath(graph.country.slug, graph.city.slug, service.slug)
    })),
    ...localities.flatMap((locality) =>
      cityServices.slice(0, 2).map((service) => ({
        label: `${service.name} in ${locality.name}`,
        href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, service.slug)
      }))
    ),
    ...countryServices.map((service) => ({
      label: `${service.name} across ${graph.country.name}`,
      href: countryServiceHubPath(graph.country.slug, service.slug)
    })),
    {
      label: `Legacy city URL (${graph.city.slug})`,
      href: cityPath(graph.city.slug)
    }
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

export function renderLegacyCityServicePage(graph) {
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

  const relatedLinks = keepGeneratedLinks(dedupeInternalLinks([
    ...localities.map((locality) => ({
      label: `${graph.service.name} in ${locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, locality.slug, graph.service.slug)
    })),
    ...localities.flatMap((locality) =>
      specialties
        .filter(
          (specialty) =>
            listProvidersByCountryCitySlugAndService(graph.country.code, graph.city.slug, graph.service.id)
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
  ]));

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
      liveDataStatus={LIVE_DATA_STATUS}
    />
  );
}
