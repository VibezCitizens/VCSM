import { TrazePageShell } from "@/shared/components/TrazePageShell";
import { listTrazeCategories } from "@/data/repositories/category.repo";
import { getTrazeGeoCoverage } from "@/data/repositories/geoCoverage.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import DirectoryLandingClient from "@/features/directories/components/DirectoryLandingClient";

export const metadata = {
  title: "Directory | TRAZE",
  description: "Choose a country to browse live local service providers on TRAZE.",
  alternates: { canonical: "/directory" }
};

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
