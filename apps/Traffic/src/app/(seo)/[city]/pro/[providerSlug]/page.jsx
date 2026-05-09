import { notFound, redirect } from "next/navigation";
import {
  getProviderBySlugAny,
  getStructuredCityBySlug,
  listServicesForProvider
} from "@/data/repositories/provider.repo";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getCityById, getLocalityById } from "@/data/repositories/city.repo";
import {
  getCountryByCode,
  getCountryBySlug,
  getLocaleForCountryCode,
  getRegionByCode
} from "@/data/repositories/geo.repo";
import { getServiceById } from "@/data/repositories/service.repo";
import { listCountryProviderStaticParams } from "@/data/repositories/staticParams.repo";
import {
  getPublicReviewSummaryForProvider,
  listVisibleReviewsForProvider
} from "@/data/repositories/reviewSummary.repo";
import {
  fetchProviderServices,
  fetchProviderMenu,
  fetchProviderPortfolio
} from "@/data/dal/providerProfile.read.dal";
import { buildProviderPageModel } from "@/data/mappers/pageModel.model";
import { buildProviderMetadata } from "@/seo/metadata";
import { buildBreadcrumbSchema, buildProviderSchema } from "@/seo/schemaOrg";
import {
  countryCityPath,
  countryCityServicePath,
  countryPath,
  countryProviderPath
} from "@/lib/paths";
import { ProviderPageTemplate } from "@/features/providers/templates/ProviderPageTemplate";
import { buildProviderRelatedLinks } from "@/features/providers/lib/providerRelatedLinks";

const PROVIDER_ROBOTS = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true }
};

const PROVIDER_NOINDEX_ROBOTS = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true }
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
  return listCountryProviderStaticParams().map((entry) => ({
    city: entry.country,
    providerSlug: entry.providerSlug
  }));
}

function resolveCategorySlug(provider, services) {
  if (services[0]?.slug) return services[0].slug;
  const key = String(provider?.categoryKey ?? "").trim().toLowerCase();
  return CATEGORY_KEY_TO_SLUG[key] ?? null;
}

function buildTrafficLiveServices({ providerServices, services }) {
  return providerServices.map((providerService) => {
    const service = services.find((item) => item.id === providerService.serviceId);
    return {
      id: providerService.id,
      key: service?.slug ?? providerService.serviceId,
      label: service?.name ?? providerService.serviceId,
      description: null,
      serviceGroup: service?.category ?? null,
      booking:
        providerService.priceFromCents != null || providerService.priceToCents != null
          ? {
              service_id: providerService.id,
              duration_minutes: null,
              is_bookable: false,
              price_cents: providerService.priceFromCents ?? providerService.priceToCents,
              currency_code: providerService.currencyCode ?? "USD",
              booking_mode: null
            }
          : null
    };
  });
}

function buildProviderGraph(cityParam, providerSlug) {
  const provider = getProviderBySlugAny(providerSlug);
  if (!provider) return null;

  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) return null;

  // If the URL country doesn't match the provider's country, flag for redirect
  const urlCountry = getCountryBySlug(cityParam);
  const needsCountryRedirect = urlCountry && urlCountry.code !== country.code;

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
    stats: getProviderStats(provider.id),
    needsCountryRedirect
  };
}

export function generateMetadata({ params }) {
  const graph = buildProviderGraph(params.city, params.providerSlug);
  if (!graph) return {};

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
    robots: graph.provider.isIndexable ? PROVIDER_ROBOTS : PROVIDER_NOINDEX_ROBOTS
  });
}

export default async function CountryProviderPage({ params }) {
  const graph = buildProviderGraph(params.city, params.providerSlug);
  if (!graph) notFound();

  if (graph.needsCountryRedirect) {
    redirect(countryProviderPath(graph.country.slug, graph.provider.slug));
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

  const isSeedProvider = provider.source === "seed";

  const [reviewSummary, visibleReviews, liveServices, menuCategories, portfolio] = await Promise.all([
    getPublicReviewSummaryForProvider(provider, stats, { allowReviewsTableFallback: true }),
    listVisibleReviewsForProvider(provider, { limit: 50 }),
    isSeedProvider
      ? Promise.resolve(buildTrafficLiveServices({ providerServices, services }))
      : fetchProviderServices(provider.id),
    isSeedProvider ? Promise.resolve([]) : fetchProviderMenu(provider.id),
    isSeedProvider ? Promise.resolve([]) : fetchProviderPortfolio(provider.id)
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
      ? [{
          label: city?.name ?? provider.primaryCityName ?? citySlug,
          href: countryCityPath(country.slug, citySlug)
        }]
      : []),
    ...(cityCategoryHref
      ? [{
          label: services[0]?.name
            ? `${services[0].name} in ${city?.name ?? provider.primaryCityName ?? citySlug}`
            : "Back to city listings",
          href: cityCategoryHref
        }]
      : []),
    { label: provider.displayName }
  ];

  const relatedLinks = buildProviderRelatedLinks({
    provider, country, city, citySlug, locality, cityCategoryHref, services, providerServices
  });

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

  return (
    <ProviderPageTemplate
      model={model}
      stats={stats}
      context={{
        countrySlug: country.slug,
        citySlug,
        localitySlug: locality?.slug,
        serviceSlug: categorySlug ?? services[0]?.slug
      }}
      reviewSummary={reviewSummary}
      visibleReviews={visibleReviews}
      relatedLinks={relatedLinks}
      schema={schema}
      liveServices={liveServices}
      menuCategories={menuCategories}
      portfolio={portfolio}
    />
  );
}
