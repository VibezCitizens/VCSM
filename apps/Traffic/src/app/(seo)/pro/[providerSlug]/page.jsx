import { notFound } from "next/navigation";
import {
  getProviderBySlugAny,
  getStructuredCityBySlug,
  listServicesForProvider
} from "@/data/repositories/provider.repo";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getCityById, getLocalityById } from "@/data/repositories/city.repo";
import {
  getCountryByCode,
  getLocaleForCountryCode,
  getRegionByCode
} from "@/data/repositories/geo.repo";
import { getServiceById, listSpecialtiesByService } from "@/data/repositories/service.repo";
import { listAllActiveProviderStaticParams } from "@/data/repositories/staticParams.repo";
import { listMockProviderSlugParams } from "@/data/repositories/taxonomyParams.repo";
import {
  getPublicReviewSummaryForProvider,
  listVisibleReviewsForProvider
} from "@/data/repositories/reviewSummary.repo";
import { buildProviderPageModel } from "@/data/mappers/pageModel.model";
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

const PROVIDER_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true
  }
};

const CATEGORY_KEY_TO_SLUG = {
  barber: "barber",
  hairstylist: "barber",
  barbershop: "barber",
  esthetician: "barber",
  locksmith: "locksmith",
  lock_smith: "locksmith"
};

export function generateStaticParams() {
  const live = listAllActiveProviderStaticParams();
  if (live.length > 0) return live;
  // Fallback: use mock provider slugs when Supabase is unavailable at build time.
  return listMockProviderSlugParams();
}

function resolveCategorySlug(provider, services) {
  if (services[0]?.slug) {
    return services[0].slug;
  }

  const key = String(provider?.categoryKey ?? "").trim().toLowerCase();
  return CATEGORY_KEY_TO_SLUG[key] ?? null;
}

function buildProviderGraph(providerSlug) {
  const provider = getProviderBySlugAny(providerSlug);
  if (!provider) {
    return null;
  }

  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) {
    return null;
  }

  const cityFromStaticTaxonomy = provider.primaryCityId ? getCityById(provider.primaryCityId) : null;
  const cityFromStructuredSlug = provider.primaryCitySlug
    ? getStructuredCityBySlug(country.code, provider.primaryCitySlug)
    : null;
  const city = cityFromStaticTaxonomy ?? cityFromStructuredSlug ?? null;

  const locality = provider.primaryLocalityId ? getLocalityById(provider.primaryLocalityId) : null;
  const region = provider.primaryRegionCode
    ? getRegionByCode(country.id, provider.primaryRegionCode)
    : null;

  const providerServices = listServicesForProvider(provider.id);
  const serviceIds = [...new Set(providerServices.map((item) => item.serviceId))];
  const services = serviceIds.map((serviceId) => getServiceById(serviceId)).filter(Boolean);

  const citySlug = city?.slug ?? provider.primaryCitySlug ?? null;
  const categorySlug = resolveCategorySlug(provider, services);
  const cityCategoryHref =
    citySlug && categorySlug
      ? countryCityServicePath(country.slug, citySlug, categorySlug)
      : null;

  return {
    provider,
    country,
    city,
    citySlug,
    categorySlug,
    cityCategoryHref,
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

  const cityName = graph.city?.name ?? graph.provider.primaryCityName ?? null;

  const title = `${graph.provider.displayName}${cityName ? ` in ${cityName}, ${graph.country.name}` : ""}`;
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

export default async function ProviderPage({ params }) {
  const graph = buildProviderGraph(params.providerSlug);
  if (!graph) {
    notFound();
  }

  const {
    provider,
    country,
    city,
    citySlug,
    categorySlug,
    cityCategoryHref,
    locality,
    region,
    providerServices,
    services,
    stats
  } = graph;

  const [reviewSummary, visibleReviews] = await Promise.all([
    getPublicReviewSummaryForProvider(provider, stats, { allowReviewsTableFallback: true }),
    listVisibleReviewsForProvider(provider, { limit: 50 })
  ]);

  const model = buildProviderPageModel({
    provider,
    cityName: city?.name ?? provider.primaryCityName ?? "",
    countryName: country.name,
    localityName: locality?.name ?? "",
    services
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: country.name, href: countryPath(country.slug) },
    ...(citySlug
      ? [
          {
            label: city?.name ?? provider.primaryCityName ?? citySlug,
            href: countryCityPath(country.slug, citySlug)
          }
        ]
      : []),
    ...(cityCategoryHref
      ? [
          {
            label: services[0]?.name
              ? `${services[0].name} in ${city?.name ?? provider.primaryCityName ?? citySlug}`
              : "Back to city listings",
            href: cityCategoryHref
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
    ...(citySlug
      ? services.map((service) => ({
          label: `All ${service.name} in ${city?.name ?? provider.primaryCityName ?? citySlug}`,
          href: countryCityServicePath(country.slug, citySlug, service.slug)
        }))
      : []),
    ...(cityCategoryHref
      ? [
          {
            label: "Back to city listings",
            href: cityCategoryHref
          }
        ]
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
      cityName: city?.name ?? provider.primaryCityName,
      localityName: locality?.name,
      regionName: region?.name,
      countryCode: provider.primaryCountryCode,
      countryName: country.name
    })
  ];

  const context = {
    countrySlug: country.slug,
    citySlug,
    localitySlug: locality?.slug,
    serviceSlug: categorySlug ?? services[0]?.slug
  };

  return (
    <ProviderPageTemplate
      model={model}
      stats={stats}
      context={context}
      reviewSummary={reviewSummary}
      visibleReviews={visibleReviews}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}
