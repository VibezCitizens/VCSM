import { notFound, redirect } from "next/navigation";
import { getHomepageLiveDirectoryData } from "@/data/repositories/homepage.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import { getCountryBySlug } from "@/data/repositories/geo.repo";
import TopProvidersDiscoveryClient from "@/features/providers/components/TopProvidersDiscoveryClient";
import { getPlatformOrigin } from "@/lib/env";
import { TrazePageShell } from "@/shared/components/TrazePageShell";

export function generateStaticParams() {
  return listLiveProviderCountries().map((country) => ({ city: country.countrySlug }));
}

export function generateMetadata({ params }) {
  const country = getCountryBySlug(params.city);
  if (!country) return {};

  return {
    title: `Top Service Providers in ${country.name} | TRAZE`,
    description: `Browse top-ranked TRAZE service providers in ${country.name}.`,
    alternates: { canonical: `/${country.slug}/top-providers` }
  };
}

function buildClaimHref() {
  try {
    const url = new URL("/claim-profile", getPlatformOrigin());
    url.searchParams.set("source", "traffic");
    url.searchParams.set("surface", "top-providers");
    return url.toString();
  } catch {
    return "/claim-profile";
  }
}

export default async function CountryTopProvidersPage({ params }) {
  const country = getCountryBySlug(params.city);
  const liveCountry = listLiveProviderCountries().find(
    (entry) => entry.countryCode === country?.code
  );

  if (!country || !liveCountry) {
    notFound();
  }

  if (params.city !== country.slug) {
    redirect(`/${country.slug}/top-providers`);
  }

  const data = await getHomepageLiveDirectoryData({
    countryCode: country.code,
    defaultCitySlug: null,
    providerLimit: 40
  });

  const locationOptions = listLiveProviderLocationOptions();
  const allCountries = listLiveProviderCountries();

  return (
    <TrazePageShell>
      <TopProvidersDiscoveryClient
        providers={data.providers}
        stats={data.stats}
        claimHref={buildClaimHref()}
        locationOptions={locationOptions}
        countryOptions={allCountries}
        initialCountryCode={country.code}
        requireCountry
      />
    </TrazePageShell>
  );
}
