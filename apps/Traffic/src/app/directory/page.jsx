import { TrazePageShell } from "@/shared/components/TrazePageShell";
import { listTrazeCategories } from "@/data/repositories/category.repo";
import { getTrazeGeoCoverage } from "@/data/repositories/geoCoverage.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import DirectoryLandingClient from "@/features/directories/components/DirectoryLandingClient";
import { buildDirectoryMetadata } from "@/seo/metadata";

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
  const geoCoverage = getTrazeGeoCoverage();
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
        geoCoverage={geoCoverage}
      />
    </TrazePageShell>
  );
}
