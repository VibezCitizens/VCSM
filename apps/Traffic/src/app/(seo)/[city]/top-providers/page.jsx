import { notFound, redirect } from "next/navigation";
import { getHomepageLiveDirectoryData } from "@/data/repositories/homepage.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions,
  listProvidersByCountry
} from "@/data/repositories/provider.repo";
import { getCountryBySlug, listCountries } from "@/data/repositories/geo.repo";
import { TopProvidersDiscoveryClient } from "@/features/providers/adapters/providers.adapter";
import { countryProviderPath } from "@/lib/paths";
import { isProviderIndexable } from "@/seo/qualityGuards";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import SeoCrawlLinks from "@/shared/components/SeoCrawlLinks";
import { buildDirectoryMetadata } from "@/seo/metadata";

export function generateStaticParams() {
  const live = listLiveProviderCountries().map((country) => ({ city: country.countrySlug }));
  if (live.length > 0) return live;
  return listCountries().map((c) => ({ city: c.slug }));
}

export async function generateMetadataForLocale({ params }, routeLocale = null) {
  const resolvedParams = await params;
  const country = getCountryBySlug(resolvedParams.city);
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

// SSR-crawlable provider links (TICKET-TRAZE-SEO-TOP-PROVIDERS-SSR-LINKS-001).
// The interactive listing (TopProvidersDiscoveryClient) is client-rendered, so
// the per-country surface emitted 0 crawlable provider anchors in SSR. This adds
// a real <a href> index of every indexable provider in the country, ranked
// deterministically. Mirrors the global /top-providers crawl-link pattern; only
// indexable providers are linked so every anchor resolves to a generated page.
function buildCountryProviderCrawlGroups(country) {
  const links = listProvidersByCountry(country.code)
    .filter((item) => isProviderIndexable(item.provider))
    .sort((a, b) => {
      const reviewDelta = Number(b.stats?.reviewCount ?? 0) - Number(a.stats?.reviewCount ?? 0);
      if (reviewDelta !== 0) return reviewDelta;
      const ratingDelta = Number(b.stats?.ratingAvg ?? 0) - Number(a.stats?.ratingAvg ?? 0);
      if (ratingDelta !== 0) return ratingDelta;
      return String(a.provider.slug).localeCompare(String(b.provider.slug));
    })
    .map((item) => ({
      href: countryProviderPath(country.slug, item.provider.slug),
      label: item.provider.displayName
    }));

  return [{ heading: `All providers in ${country.name}`, links }];
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
        claimSurface="top-providers"
        locationOptions={locationOptions}
        countryOptions={allCountries}
        initialCountryCode={country.code}
        requireCountry
      />
      <SeoCrawlLinks
        title={`Browse providers in ${country.name}`}
        groups={buildCountryProviderCrawlGroups(country)}
      />
    </TrazePageShell>
  );
}
