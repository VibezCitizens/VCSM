import { listTrazeCategories } from "@/data/repositories/category.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import CategoriesDiscoveryClient from "@/features/categories/components/CategoriesDiscoveryClient";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import { buildDirectoryMetadata } from "@/seo/metadata";

export function buildCategoriesMetadata(routeLocale = null) {
  return buildDirectoryMetadata({
    title: "Service Categories | TRAZE",
    description: "Choose your country to explore live service categories on TRAZE.",
    path: "/categories",
    routeLocale
  });
}

export const metadata = buildCategoriesMetadata();

export default async function CategoriesPage() {
  const countries = listLiveProviderCountries();
  const locationOptions = listLiveProviderLocationOptions();
  const entries = await Promise.all(
    countries.map(async (country) => [
      country.countryCode,
      await listTrazeCategories({ countryCode: country.countryCode })
    ])
  );

  return (
    <TrazePageShell>
      <CategoriesDiscoveryClient
        countries={countries}
        categoriesByCountryCode={Object.fromEntries(entries)}
        locationOptions={locationOptions}
      />
    </TrazePageShell>
  );
}
