import { notFound } from "next/navigation";
import { getProviderBySlug, listServicesForProvider } from "@/data/repositories/provider.repo";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getCityById, getLocalityById } from "@/data/repositories/city.repo";
import {
  getCountryByCode,
  getLocaleForCountryCode,
  getRegionByCode
} from "@/data/repositories/geo.repo";
import { getServiceById, listSpecialtiesByService } from "@/data/repositories/service.repo";
import { listProviderStaticParams } from "@/data/repositories/pageCandidate.repo";
import { buildProviderPageModel } from "@/data/mappers/pageModel.mapper";
import { buildProviderMetadata } from "@/seo/metadata";
import { buildBreadcrumbSchema, buildProviderSchema } from "@/seo/schemaOrg";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import {
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityLocalityServiceSpecialtyPath,
  countryCityPath,
  countryCityServicePath,
  countryPath,
  countryProviderPath,
  neighborhoodServicePath,
  providerPath
} from "@/lib/paths";
import { ProviderPageTemplate } from "@/features/providers/templates/ProviderPageTemplate";

export const revalidate = 900;

const PROVIDER_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true
  }
};

export function generateStaticParams() {
  return listProviderStaticParams();
}

function buildProviderGraph(providerSlug) {
  const provider = getProviderBySlug(providerSlug);
  if (!provider) {
    return null;
  }

  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) {
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
    provider,
    country,
    city,
    locality,
    region,
    providerServices,
    services,
    stats: getProviderStats(provider.id)
  };
}

export function generateMetadata({ params }) {
  const graph = buildProviderGraph(params.providerSlug);
  if (!graph) {
    return {};
  }

  const title = `${graph.provider.displayName}${graph.city?.name ? ` in ${graph.city.name}, ${graph.country.name}` : ""}`;
  const description =
    graph.provider.shortBio ||
    `Learn more about ${graph.provider.displayName}. View services, reviews, and book directly.`;

  return buildProviderMetadata({
    title,
    description,
    path: countryProviderPath(graph.country.slug, graph.provider.slug),
    locale: getLocaleForCountryCode(graph.country.code),
    robots: PROVIDER_ROBOTS
  });
}

export default function ProviderPage({ params }) {
  const graph = buildProviderGraph(params.providerSlug);
  if (!graph) {
    notFound();
  }

  const { provider, country, city, locality, region, providerServices, services, stats } = graph;

  const model = buildProviderPageModel({
    provider,
    cityName: city?.name ?? "",
    countryName: country.name,
    localityName: locality?.name ?? "",
    services
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: country.name, href: countryPath(country.slug) },
    ...(city ? [{ label: city.name, href: countryCityPath(country.slug, city.slug) }] : []),
    ...(city && services[0]
      ? [
          {
            label: `${services[0].name} in ${city.name}`,
            href: countryCityServicePath(country.slug, city.slug, services[0].slug)
          }
        ]
      : []),
    { label: provider.displayName }
  ];

  const relatedLinks = dedupeInternalLinks([
    ...(city && locality
      ? services.map((service) => ({
          label: `${service.name} in ${locality.name}`,
          href: countryCityLocalityServicePath(country.slug, city.slug, locality.slug, service.slug)
        }))
      : []),
    ...(city && locality
      ? services.flatMap((service) => {
          const specialtyById = new Map(
            listSpecialtiesByService(service.id).map((specialty) => [specialty.id, specialty])
          );
          const specialtyIds = providerServices
            .filter(
              (providerService) =>
                providerService.serviceId === service.id && Boolean(providerService.specialtyId)
            )
            .map((providerService) => providerService.specialtyId);
          const uniqueSpecialties = [...new Set(specialtyIds)]
            .map((specialtyId) => specialtyById.get(specialtyId))
            .filter(Boolean);

          return uniqueSpecialties.map((specialty) => ({
            label: `${specialty.name} ${service.name} in ${locality.name}`,
            href: countryCityLocalityServiceSpecialtyPath(
              country.slug,
              city.slug,
              locality.slug,
              service.slug,
              specialty.slug
            )
          }));
        })
      : []),
    ...(city
      ? services.map((service) => ({
          label: `All ${service.name} in ${city.name}`,
          href: countryCityServicePath(country.slug, city.slug, service.slug)
        }))
      : []),
    ...(city && locality
      ? services.map((service) => ({
          label: `Legacy locality path (${city.slug}/${locality.slug}/${service.slug})`,
          href: neighborhoodServicePath(city.slug, locality.slug, service.slug)
        }))
      : []),
    ...(city
      ? services.map((service) => ({
          label: `Legacy city-service path (${city.slug}/${service.slug})`,
          href: cityServicePath(city.slug, service.slug)
        }))
      : []),
    {
      label: "Legacy provider path",
      href: providerPath(provider.slug)
    }
  ]);

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildProviderSchema({
      providerName: provider.displayName,
      description: provider.shortBio,
      providerPath: countryProviderPath(country.slug, provider.slug),
      ratingAvg: stats?.ratingAvg,
      reviewCount: stats?.reviewCount,
      addressLine1: provider.addressLine1,
      postalCode: provider.postalCode,
      cityName: city?.name,
      localityName: locality?.name,
      regionName: region?.name,
      countryCode: provider.primaryCountryCode,
      countryName: country.name
    })
  ];

  const context = {
    countrySlug: country.slug,
    citySlug: city?.slug,
    localitySlug: locality?.slug,
    serviceSlug: services[0]?.slug
  };

  return (
    <ProviderPageTemplate
      model={model}
      stats={stats}
      context={context}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}
