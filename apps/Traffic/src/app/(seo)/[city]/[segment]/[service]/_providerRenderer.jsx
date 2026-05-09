import { ProviderPageTemplate } from "@/features/providers/templates/ProviderPageTemplate";
import { buildProviderPageModel } from "@/data/mappers/pageModel.model";
import { dedupeInternalLinks } from "@/seo/internalLinks";
import { buildBreadcrumbSchema, buildProviderSchema } from "@/seo/schemaOrg";
import {
  getPublicReviewSummaryForProvider,
  listVisibleReviewsForProvider
} from "@/data/repositories/reviewSummary.repo";
import {
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityPath,
  countryCityServicePath,
  countryProviderPath,
  neighborhoodServicePath
} from "@/lib/paths";

export async function renderCountryProviderPage(graph) {
  const [reviewSummary, visibleReviews] = await Promise.all([
    getPublicReviewSummaryForProvider(graph.provider, graph.stats, { allowReviewsTableFallback: true }),
    listVisibleReviewsForProvider(graph.provider, { limit: 50 })
  ]);

  const model = buildProviderPageModel({
    provider: graph.provider,
    cityName: graph.city?.name ?? graph.provider.primaryCityName ?? "",
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
      ? [{
          label: `${graph.services[0].name} in ${graph.city.name}`,
          href: countryCityServicePath(graph.country.slug, graph.city.slug, graph.services[0].slug)
        }]
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
      cityName: graph.city?.name ?? graph.provider.primaryCityName,
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
        citySlug: graph.city?.slug ?? graph.provider.primaryCitySlug,
        localitySlug: graph.locality?.slug,
        serviceSlug: graph.services[0]?.slug
      }}
      reviewSummary={reviewSummary}
      visibleReviews={visibleReviews}
      relatedLinks={relatedLinks}
      schema={schema}
    />
  );
}
