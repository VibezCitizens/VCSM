import {
  listLiveProviderCountries,
  listProvidersByCountry
} from "@/data/repositories/provider.repo";
import { countryProviderPath } from "@/lib/paths";
import { isProviderIndexable } from "@/seo/qualityGuards";
import { CountrySelectorClient } from "@/features/home/adapters/home.adapter";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import SeoCrawlLinks from "@/shared/components/SeoCrawlLinks";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { getAggregatorIndexRobots } from "@/seo/qualityGuards";

const TOP_PROVIDERS_PER_COUNTRY = 6;

export function buildTopProvidersMetadata(routeLocale = null) {
  return buildDirectoryMetadata({
    title: "Top Service Providers | TRAZE",
    description: "Choose your country to browse top-rated service providers on TRAZE.",
    path: "/top-providers",
    routeLocale,
    // Density gate: noindex unless >=2 live countries exist (see
    // getAggregatorIndexRobots) so this global page never becomes a thin surface.
    robots: getAggregatorIndexRobots(listLiveProviderCountries().length)
  });
}

export const metadata = buildTopProvidersMetadata();

// Crawlable SSR links so Country -> Provider is discoverable without client
// interaction. Country links target generated per-country pages; provider links
// target only indexable (generated) provider pages, ranked deterministically.
function rankTopProviders(countryCode) {
  return listProvidersByCountry(countryCode)
    .filter((item) => isProviderIndexable(item.provider))
    .sort((a, b) => {
      const reviewDelta = Number(b.stats?.reviewCount ?? 0) - Number(a.stats?.reviewCount ?? 0);
      if (reviewDelta !== 0) return reviewDelta;
      const ratingDelta = Number(b.stats?.ratingAvg ?? 0) - Number(a.stats?.ratingAvg ?? 0);
      if (ratingDelta !== 0) return ratingDelta;
      return String(a.provider.slug).localeCompare(String(b.provider.slug));
    })
    .slice(0, TOP_PROVIDERS_PER_COUNTRY);
}

function buildTopProvidersCrawlGroups(countries) {
  const countryLinks = countries.map((country) => ({
    href: `/${country.countrySlug}/top-providers`,
    label: `Top providers in ${country.name}`
  }));

  const providerLinks = countries.flatMap((country) =>
    rankTopProviders(country.countryCode).map((item) => ({
      href: countryProviderPath(country.countrySlug, item.provider.slug),
      label: `${item.provider.displayName} — ${country.name}`
    }))
  );

  return [
    { heading: "Top providers by country", links: countryLinks },
    { heading: "Featured providers", links: providerLinks }
  ];
}

export default function TopProvidersPage() {
  const countries = listLiveProviderCountries();

  return (
    <TrazePageShell>
      <CountrySelectorClient countries={countries} destinationPath="top-providers" />
      <SeoCrawlLinks
        title="Browse top providers"
        groups={buildTopProvidersCrawlGroups(countries)}
      />
    </TrazePageShell>
  );
}
