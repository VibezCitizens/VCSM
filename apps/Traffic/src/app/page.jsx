import { getPlatformOrigin } from "@/lib/env";
import { getHomepageLiveDirectoryData, groupProvidersByCountry } from "@/data/repositories/homepage.repo";
import { listTrazeCategories } from "@/data/repositories/category.repo";
import { getTrazeGeoCoverage } from "@/data/repositories/geoCoverage.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import HomepageHeroSection from "@/features/home/components/HomepageHeroSection";
import HomepageTopProvidersSection from "@/features/home/components/HomepageTopProvidersSection";
import HomepageTrendingSection from "@/features/home/components/HomepageTrendingSection";
import HomepageCategoryGrid from "@/features/home/components/HomepageCategoryGrid";
import HomepageCtaFooter from "@/features/home/components/HomepageCtaFooter";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import TrazeGeoCoverageGlobe from "@/shared/components/TrazeGeoCoverageGlobe";
import { buildDirectoryMetadata } from "@/seo/metadata";

const HOMEPAGE_TITLE = "Find Local Service Providers | TRAZE";
const HOMEPAGE_DESCRIPTION =
  "Find local services by location, compare availability, and book fast on TRAZE.";

export function buildHomepageMetadata(routeLocale = null) {
  return buildDirectoryMetadata({
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    path: "/",
    routeLocale,
    twitterCard: "summary_large_image"
  });
}

export const metadata = buildHomepageMetadata();

// No hardcoded default city — the homepage is location-neutral on first load.
// The client-side search panel handles city selection (including geolocation).

function buildClaimLandingLink(verticalId = null) {
  const url = new URL("/claim-profile", getPlatformOrigin());
  url.searchParams.set("source", "traffic");
  url.searchParams.set("surface", "homepage");
  if (verticalId) url.searchParams.set("vertical", verticalId);
  return url.toString();
}

function buildMainPlatformLink() {
  const url = new URL("/", getPlatformOrigin());
  url.searchParams.set("source", "traffic");
  url.searchParams.set("surface", "homepage");
  return url.toString();
}

function getHomepageCityCountries(locationOptions) {
  const countries = new Map();

  for (const option of locationOptions) {
    const countryCode = String(option.countryCode ?? "").toUpperCase();
    if (!countryCode || countries.has(countryCode)) continue;

    countries.set(countryCode, {
      countryCode,
      countrySlug: option.countrySlug,
      name: option.countryName,
      nameEs: option.countryNameEs
    });
  }

  return [...countries.values()].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

// Browse groups use city-agnostic country-level URLs where needed so no city is
// assumed on the server. The Cities group is client-filtered by country.
function buildBrowseGroups(locationOptions, liveCountries) {
  const cityCountries = getHomepageCityCountries(locationOptions);
  const countryLinks = liveCountries.map((country) => ({
    label: country.name,
    labelEs: country.nameEs,
    href: `/${country.countrySlug}`,
    countryCode: country.countryCode,
    countrySlug: country.countrySlug
  }));

  return [
    {
      title: "Service types",
      titleEs: "Tipos de servicio",
      description: "Jump straight to a service category.",
      descriptionEs: "Ve directo a una categoría de servicio.",
      type: "service_links",
      countries: liveCountries,
      links: [
        {
          label: "Locksmiths",
          labelEs: "Cerrajeros",
          serviceSlug: "locksmith"
        },
        {
          label: "Barbers",
          labelEs: "Barberos",
          serviceSlug: "barber"
        },
        {
          label: "Browse all",
          labelEs: "Ver todo",
          href: "/categories"
        }
      ]
    },
    {
      title: "Active cities",
      titleEs: "Ciudades activas",
      description: "Browse providers by active city.",
      descriptionEs: "Explora proveedores por ciudad activa.",
      type: "cities",
      defaultCountryCode: "",
      countries: cityCountries,
      cities: locationOptions.map((entry) => ({
        citySlug: entry.citySlug,
        countrySlug: entry.countrySlug,
        countryCode: entry.countryCode,
        label: entry.label,
        labelEs: entry.labelEs,
        href: entry.href
      }))
    },
    {
      title: "Active countries",
      titleEs: "Países activos",
      description: "Browse all active country directories.",
      descriptionEs: "Explora los directorios activos por país.",
      links: countryLinks
    }
  ];
}


export default async function TrafficHomePage() {
  const liveCountries = listLiveProviderCountries();
  const locationOptions = listLiveProviderLocationOptions();
  const geoCoverage = getTrazeGeoCoverage();

  // No city is assumed on the server — the homepage is location-neutral.
  // The client-side search panel resolves the city after mount (geolocation
  // if previously granted, or explicit user selection).
  const defaultLocation = null;

  // Fetch provider data and live VPort categories in parallel. The category
  // reader never uses static taxonomy data in production paths.
  const [homepageData, traceCategories] = await Promise.all([
    getHomepageLiveDirectoryData({
      defaultCitySlug: null,
      providerLimit: 32
    }),
    listTrazeCategories()
  ]);

  const countryGroups = groupProvidersByCountry(homepageData.providers);

  const browseGroups = buildBrowseGroups(locationOptions, liveCountries);
  const liveServiceSlugs = [
    ...new Set(
      traceCategories.flatMap((category) =>
        (category.services ?? []).map((service) => service.serviceKey).filter(Boolean)
      )
    )
  ];

  const claimHref = buildClaimLandingLink();
  const mainPlatformHref = buildMainPlatformLink();

  return (
    <TrazePageShell>
      <HomepageHeroSection
        defaultLocation={defaultLocation}
        locationOptions={locationOptions}
        countryOptions={liveCountries}
        liveServiceSlugs={liveServiceSlugs}
      />

      <HomepageTopProvidersSection
        countryGroups={countryGroups}
        stats={homepageData.stats}
        claimHref={claimHref}
        directoryHref="/top-providers"
      />

      <TrazeGeoCoverageGlobe
        coverage={geoCoverage}
        title="Traze coverage"
        subtitle="Live provider density across active countries, states, and cities."
      />

      <HomepageCategoryGrid
        categories={traceCategories}
        defaultCountrySlug=""
        defaultCitySlug={null}
      />

      <HomepageTrendingSection groups={browseGroups} />

      <HomepageCtaFooter
        claimHref={claimHref}
        mainPlatformHref={mainPlatformHref}
        directoryHref="/categories"
      />
    </TrazePageShell>
  );
}
