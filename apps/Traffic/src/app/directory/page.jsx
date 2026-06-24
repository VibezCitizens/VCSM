import { TrazePageShell } from "@/shared/components/TrazePageShell";
import { listTrazeCategories } from "@/data/repositories/category.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions,
  listProviders
} from "@/data/repositories/provider.repo";
import { buildHomepageProviderCard } from "@/data/repositories/homepage.repo";
import { DirectoryLandingClient } from "@/features/directories/adapters/directories.adapter";
import { buildDirectoryMetadata } from "@/seo/metadata";

const FEATURED_LIMIT = 3;

export function buildDirectoryLandingMetadata(routeLocale = null) {
  return buildDirectoryMetadata({
    title: "Directory | TRAZE",
    description: "Choose a country to browse live local service providers on TRAZE.",
    path: "/directory",
    routeLocale
  });
}

export const metadata = buildDirectoryLandingMetadata();

export default async function DirectoryLandingPage() {
  const countries = listLiveProviderCountries();
  const locationOptions = listLiveProviderLocationOptions();
  // Featured providers shown directly on the directory landing (TRAZE-DIRECTORY-001).
  const featuredProviders = listProviders()
    .map(buildHomepageProviderCard)
    .filter(Boolean)
    .slice(0, FEATURED_LIMIT);
  const categories = await listTrazeCategories();
  const liveServiceSlugs = [
    ...new Set(
      categories.flatMap((category) =>
        (category.services ?? [])
          .map((service) => service.serviceKey)
          .filter(Boolean)
      )
    )
  ];

  return (
    <TrazePageShell>
      <DirectoryLandingClient
        countries={countries}
        locationOptions={locationOptions}
        liveServiceSlugs={liveServiceSlugs}
        featuredProviders={featuredProviders}
      />
    </TrazePageShell>
  );
}
