import { notFound, redirect } from "next/navigation";
import { listTrazeCategories } from "@/data/repositories/category.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import { getCountryBySlug } from "@/data/repositories/geo.repo";
import CategoriesDiscoveryClient from "@/features/categories/components/CategoriesDiscoveryClient";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import { buildDirectoryMetadata } from "@/seo/metadata";

export function generateStaticParams() {
  return listLiveProviderCountries().map((country) => ({ city: country.countrySlug }));
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

export function generateMetadata({ params }) {
  return generateMetadataForLocale({ params });
}

export default async function CountryCategoriesPage({ params }) {
  const country = getCountryBySlug(params.city);
  const liveCountry = listLiveProviderCountries().find(
    (entry) => entry.countryCode === country?.code
  );

  if (!country || !liveCountry) {
    notFound();
  }

  if (params.city !== country.slug) {
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
