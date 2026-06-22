import { notFound, redirect } from "next/navigation";
import { listTrazeCategories } from "@/data/repositories/category.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import { getCountryBySlug, listCountries } from "@/data/repositories/geo.repo";
import { CategoriesDiscoveryClient } from "@/features/categories/adapters/categories.adapter";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import { buildDirectoryMetadata } from "@/seo/metadata";

export function generateStaticParams() {
  const live = listLiveProviderCountries().map((country) => ({ city: country.countrySlug }));
  if (live.length > 0) return live;
  return listCountries().map((c) => ({ city: c.slug }));
}

export function generateMetadataForLocale({ params }, routeLocale = null) {
  const country = getCountryBySlug(params.city);
  if (!country) return {};

  return buildDirectoryMetadata({
    title: `Service Categories in ${country.name} | TRAZE`,
    description: `Browse live TRAZE service categories with providers in ${country.name}.`,
    path: `/${country.slug}/categories`,
    routeLocale
  });
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return generateMetadataForLocale({ params: resolvedParams });
}

export default async function CountryCategoriesPage({ params }) {
  const { city } = await params;
  const country = getCountryBySlug(city);
  const liveCountry = listLiveProviderCountries().find(
    (entry) => entry.countryCode === country?.code
  );

  if (!country || !liveCountry) {
    notFound();
  }

  if (city !== country.slug) {
    redirect(`/${country.slug}/categories`);
  }

  const categories = await listTrazeCategories({ countryCode: country.code });
  const locationOptions = listLiveProviderLocationOptions();
  const allCountries = listLiveProviderCountries();

  return (
    <TrazePageShell>
      <CategoriesDiscoveryClient
        countries={allCountries}
        categoriesByCountryCode={{ [country.code]: categories }}
        locationOptions={locationOptions}
        initialCountryCode={country.code}
        preferCountryRoute
      />
    </TrazePageShell>
  );
}
