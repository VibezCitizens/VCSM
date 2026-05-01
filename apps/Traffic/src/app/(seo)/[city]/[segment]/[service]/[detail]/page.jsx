import { notFound } from "next/navigation";
import { getCityBySlug, getLocalityBySlug, listLocalitiesByCity } from "@/data/repositories/city.repo";
import { getCountryBySlug, getLocaleForCountryCode } from "@/data/repositories/geo.repo";
import { getServiceBySlug, listServices, listSpecialtiesByService } from "@/data/repositories/service.repo";
import { listProvidersByLocalityAndService } from "@/data/repositories/provider.repo";
import { getPriceAggregate } from "@/data/repositories/aggregate.repo";
import { listCountryLocalityServiceStaticParams } from "@/data/repositories/staticParams.repo";
import { buildDirectoryPageModel } from "@/data/mappers/pageModel.model";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { buildBreadcrumbSchema, buildDirectoryItemListSchema } from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
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
import { DirectoryPageTemplate } from "@/features/directories/templates/DirectoryPageTemplate";
import { LIVE_DATA_STATUS } from "@/data/connectors/unifiedDataset";

export function generateStaticParams() {
  return listCountryLocalityServiceStaticParams().map((entry) => ({
    city: entry.country,
    segment: entry.city,
    service: entry.locality,
    detail: entry.service
  }));
}

function resolvePage(params) {
  const country = getCountryBySlug(params.city);
  if (!country) {
    return null;
  }

  const city = getCityBySlug(params.segment, { countryId: country.id });
  if (!city) {
    return null;
  }

  const locality = getLocalityBySlug(city.id, params.service);
  if (!locality) {
    return null;
  }

  const service = getServiceBySlug(params.detail);
  if (!service) {
    return null;
  }

  return {
    country,
    city,
    locality,
    service
  };
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  return buildDirectoryMetadata({
    title: `${graph.service.name} in ${graph.locality.name}, ${graph.city.name}, ${graph.country.name}`,
    description: `Top ${graph.service.name.toLowerCase()} providers in ${graph.locality.name}, ${graph.city.name}. Compare local pricing, read reviews, and book.`,
    path: countryCityLocalityServicePath(
      graph.country.slug,
      graph.city.slug,
      graph.locality.slug,
      graph.service.slug
    ),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

export default function CountryCityLocalityServicePage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

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
    { label: graph.country.name, href: countryPath(graph.country.slug) },
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
      label: `${graph.service.name} across ${graph.country.name}`,
      href: countryServiceHubPath(graph.country.slug, graph.service.slug)
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
      liveDataStatus={LIVE_DATA_STATUS}
    />
  );
}
