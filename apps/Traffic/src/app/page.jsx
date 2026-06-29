import { getPlatformOrigin } from "@/lib/env";
import { getHomepageLiveDirectoryData, groupProvidersByCountry } from "@/data/repositories/homepage.repo";
import { listTrazeCategories } from "@/data/repositories/category.repo";
import { getTrazeGeoCoverage } from "@/data/repositories/geoCoverage.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import {
  HomepageHeroSection,
  HomepageTopProvidersSection,
  HomepageCategoryGrid,
  HomepageCtaFooter
} from "@/features/home/adapters/home.adapter";
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

function buildMainPlatformLink() {
  const url = new URL("/", getPlatformOrigin());
  url.searchParams.set("source", "traffic");
  url.searchParams.set("surface", "homepage");
  return url.toString();
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

  const liveServiceSlugs = [
    ...new Set(
      traceCategories.flatMap((category) =>
        (category.services ?? []).map((service) => service.serviceKey).filter(Boolean)
      )
    )
  ];

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
        claimSurface="homepage"
        directoryHref="/top-providers"
      />

      <TrazeGeoCoverageGlobe
        coverage={geoCoverage}
        spotlightProviders={homepageData.providers}
        title="Traze coverage"
        showMeta={false}
      />

      <HomepageCategoryGrid
        categories={traceCategories}
        defaultCountrySlug=""
        defaultCitySlug={null}
      />

      <HomepageCtaFooter
        mainPlatformHref={mainPlatformHref}
        directoryHref="/categories"
      />
    </TrazePageShell>
  );
}
