import { notFound } from "next/navigation";
import { getCityBySlug, getLocalityBySlug, listLocalitiesByCity } from "@/data/repositories/city.repo";
import { getCountryBySlug, getLocaleForCountryCode } from "@/data/repositories/geo.repo";
import {
  getServiceBySlug,
  getSpecialtyBySlug,
  listServices,
  listSpecialtiesByService
} from "@/data/repositories/service.repo";
import {
  listProvidersByLocalityServiceAndSpecialty
} from "@/data/repositories/provider.repo";
import { getPriceAggregate } from "@/data/repositories/aggregate.repo";
import { listLocalityServiceSpecialtyTaxonomyParams } from "@/data/repositories/taxonomyParams.repo";
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
  neighborhoodServiceSpecialtyPath
} from "@/lib/paths";
import { DirectoryPageTemplate } from "@/features/directories/templates/DirectoryPageTemplate";
// Static pages never have live VPORT data — unifiedDataset uses top-level await
// which makes it an async module incompatible with generateStaticParams detection.
const LIVE_DATA_STATUS = "unavailable";

export function generateStaticParams() {
  return listLocalityServiceSpecialtyTaxonomyParams().map((entry) => ({
    city: entry.country,
    segment: entry.city,
    service: entry.locality,
    detail: entry.service,
    specialty: entry.specialty,
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

  const specialty = getSpecialtyBySlug(service.id, params.specialty);
  if (!specialty) {
    return null;
  }

  return {
    country,
    city,
    locality,
    service,
    specialty
  };
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  return buildDirectoryMetadata({
    title: `${graph.specialty.name} ${graph.service.name} in ${graph.locality.name}, ${graph.city.name}, ${graph.country.name}`,
    description: `Find ${graph.specialty.name.toLowerCase()} ${graph.service.name.toLowerCase()} providers in ${graph.locality.name}, ${graph.city.name}. Compare ratings, response times, and availability.`,
    path: countryCityLocalityServiceSpecialtyPath(
      graph.country.slug,
      graph.city.slug,
      graph.locality.slug,
      graph.service.slug,
      graph.specialty.slug
    ),
    locale: getLocaleForCountryCode(graph.country.code)
  });
}

export default function CountryCityLocalityServiceSpecialtyPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  const providers = listProvidersByLocalityServiceAndSpecialty(
    graph.locality.id,
    graph.service.id,
    graph.specialty.id
  );
  if (!providers.length) {
    notFound();
  }

  const localities = listLocalitiesByCity(graph.city.id);
  const otherLocalities = localities.filter((entry) => entry.id !== graph.locality.id);
  const otherServices = listServices().filter((entry) => entry.id !== graph.service.id);
  const siblingSpecialties = listSpecialtiesByService(graph.service.id).filter(
    (entry) => entry.id !== graph.specialty.id
  );

  const priceAggregate = getPriceAggregate({
    countryId: graph.city.countryId,
    regionId: graph.city.regionId,
    cityId: graph.city.id,
    serviceId: graph.service.id,
    specialtyId: graph.specialty.id,
    localityId: graph.locality.id
  });

  const model = buildDirectoryPageModel({
    title: `${graph.specialty.name} ${graph.service.name} in ${graph.locality.name}, ${graph.city.name}, ${graph.country.name}`,
    description: `${providers.length} ${graph.specialty.name.toLowerCase()} ${graph.service.name.toLowerCase()} providers serving ${graph.locality.name}.`,
    itemName: `${graph.specialty.name} · ${graph.locality.name}`,
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
    {
      label: `${graph.service.name} in ${graph.locality.name}`,
      href: countryCityLocalityServicePath(
        graph.country.slug,
        graph.city.slug,
        graph.locality.slug,
        graph.service.slug
      )
    },
    { label: graph.specialty.name }
  ];

  const relatedLinks = dedupeInternalLinks([
    {
      label: `All ${graph.service.name} in ${graph.locality.name}`,
      href: countryCityLocalityServicePath(
        graph.country.slug,
        graph.city.slug,
        graph.locality.slug,
        graph.service.slug
      )
    },
    ...siblingSpecialties
      .filter(
        (specialty) =>
          listProvidersByLocalityServiceAndSpecialty(graph.locality.id, graph.service.id, specialty.id).length > 0
      )
      .map((specialty) => ({
        label: `${specialty.name} ${graph.service.name} in ${graph.locality.name}`,
        href: countryCityLocalityServiceSpecialtyPath(
          graph.country.slug,
          graph.city.slug,
          graph.locality.slug,
          graph.service.slug,
          specialty.slug
        )
      })),
    ...otherLocalities
      .filter(
        (locality) =>
          listProvidersByLocalityServiceAndSpecialty(locality.id, graph.service.id, graph.specialty.id).length > 0
      )
      .map((locality) => ({
        label: `${graph.specialty.name} ${graph.service.name} in ${locality.name}`,
        href: countryCityLocalityServiceSpecialtyPath(
          graph.country.slug,
          graph.city.slug,
          locality.slug,
          graph.service.slug,
          graph.specialty.slug
        )
      })),
    ...otherServices.map((service) => ({
      label: `${service.name} in ${graph.locality.name}`,
      href: countryCityLocalityServicePath(graph.country.slug, graph.city.slug, graph.locality.slug, service.slug)
    })),
    ...providers.slice(0, 8).map((item) => ({
      label: item.provider.displayName,
      href: countryProviderPath(graph.country.slug, item.provider.slug)
    })),
    {
      label: `${graph.service.name} across ${graph.country.name}`,
      href: countryServiceHubPath(graph.country.slug, graph.service.slug)
    },
    {
      label: "Legacy specialty URL",
      href: neighborhoodServiceSpecialtyPath(
        graph.city.slug,
        graph.locality.slug,
        graph.service.slug,
        graph.specialty.slug
      )
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildDirectoryItemListSchema({
      name: model.title,
      path: countryCityLocalityServiceSpecialtyPath(
        graph.country.slug,
        graph.city.slug,
        graph.locality.slug,
        graph.service.slug,
        graph.specialty.slug
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
