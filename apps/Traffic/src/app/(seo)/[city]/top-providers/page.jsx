import { notFound, redirect } from "next/navigation";
import { getHomepageLiveDirectoryData } from "@/data/repositories/homepage.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import { getCountryBySlug, listCountries } from "@/data/repositories/geo.repo";
import { TopProvidersDiscoveryClient } from "@/features/providers/adapters/providers.adapter";
import { getPlatformOrigin } from "@/lib/env";
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
    title: `Top Service Providers in ${country.name} | TRAZE`,
    description: `Browse top-ranked TRAZE service providers in ${country.name}.`,
    path: `/${country.slug}/top-providers`,
    routeLocale
  });
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return generateMetadataForLocale({ params: resolvedParams });
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
  const { city } = await params;
  const country = getCountryBySlug(city);
  const liveCountry = listLiveProviderCountries().find(
    (entry) => entry.countryCode === country?.code
  );

  if (!country || !liveCountry) {
    notFound();
  }

  if (city !== country.slug) {
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
