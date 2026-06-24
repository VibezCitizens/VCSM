import { TrazePageShell } from "@/shared/components/TrazePageShell";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import { buildDirectoryMetadata } from "@/seo/metadata";
import SearchClient from "@/features/search/components/SearchClient";

// /search is a parallel, interactive search layer — NOT part of the indexable
// SEO directory. It must never be indexed or crawled into infinite query pages,
// so it is marked noindex/nofollow and is excluded from the sitemap (the sitemap
// is built only from listPageCandidatesWithAnswers(), which does not include it).
export function buildSearchMetadata(routeLocale = null) {
  return buildDirectoryMetadata({
    title: "Search | TRAZE",
    description: "Search local service providers on TRAZE.",
    path: "/search",
    routeLocale,
    robots: { index: false, follow: false }
  });
}

export const metadata = buildSearchMetadata();

export default function SearchPage() {
  const countryOptions = listLiveProviderCountries();
  const locationOptions = listLiveProviderLocationOptions();

  return (
    <TrazePageShell>
      <SearchClient countryOptions={countryOptions} locationOptions={locationOptions} />
    </TrazePageShell>
  );
}
