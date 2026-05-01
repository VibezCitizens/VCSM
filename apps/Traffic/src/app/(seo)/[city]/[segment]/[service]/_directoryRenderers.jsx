import { DirectoryPageTemplate } from "@/features/directories/templates/DirectoryPageTemplate";
import { LIVE_DATA_STATUS } from "@/data/connectors/unifiedDataset";
import { buildDirectoryPageModel } from "@/data/mappers/pageModel.model";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import { buildBreadcrumbSchema, buildDirectoryItemListSchema } from "@/seo/schemaOrg";
import { listLocalitiesByCity } from "@/data/repositories/city.repo";
import { getLocaleForCountryCode } from "@/data/repositories/geo.repo";
import { listServices, listSpecialtiesByService } from "@/data/repositories/service.repo";
import {
  listProvidersByCountryCitySlugAndService,
  listProvidersByLocalityAndService
} from "@/data/repositories/provider.repo";
import { getPriceAggregate } from "@/data/repositories/aggregate.repo";
import {
  countryCityLocalityServicePath,
  countryCityLocalityServiceSpecialtyPath,
  countryCityPath,
  countryCityServicePath,
  countryPath,
  countryProviderPath,
  countryServiceHubPath,
  neighborhoodServicePath
} from "@/lib/paths";

export function renderCountryServiceHubPage(graph) {
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
    { label: `All services in ${graph.country.name}`, href: countryPath(graph.country.slug) },
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
      liveDataStatus={LIVE_DATA_STATUS}
    />
  );
}

export function renderCountryCityServicePage(graph) {
  const providers = listProvidersByCountryCitySlugAndService(
    graph.country.code, graph.city.slug, graph.service.id
  );
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
    .filter(Boolean).join(", ");

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
                  (ps) => ps.serviceId === graph.service.id && ps.specialtyId === specialty.id
                )
              ).length > 0
        )
        .slice(0, 3)
        .map((specialty) => ({
          label: `${specialty.name} ${graph.service.name} in ${locality.name}`,
          href: countryCityLocalityServiceSpecialtyPath(
            graph.country.slug, graph.city.slug, locality.slug, graph.service.slug, specialty.slug
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
      context={{ countrySlug: graph.country.slug, citySlug: graph.city.slug, serviceSlug: graph.service.slug }}
      relatedLinks={relatedLinks}
      schema={schema}
      liveDataStatus={LIVE_DATA_STATUS}
    />
  );
}

export function renderLegacyLocalityServicePage(graph) {
  const providers = listProvidersByLocalityAndService(graph.locality.id, graph.service.id);
  const otherLocalities = listLocalitiesByCity(graph.city.id).filter((e) => e.id !== graph.locality.id);
  const otherServices = listServices().filter((e) => e.id !== graph.service.id);
  const specialties = listSpecialtiesByService(graph.service.id).filter((specialty) =>
    providers.some((item) =>
      item.providerServices.some(
        (ps) => ps.serviceId === graph.service.id && ps.specialtyId === specialty.id
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
        graph.country.slug, graph.city.slug, graph.locality.slug, graph.service.slug, specialty.slug
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
    { label: "Legacy locality URL", href: neighborhoodServicePath(graph.city.slug, graph.locality.slug, graph.service.slug) }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityLocalityServicePath(
        graph.country.slug, graph.city.slug, graph.locality.slug, graph.service.slug
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
      liveDataStatus={LIVE_DATA_STATUS}
    />
  );
}
