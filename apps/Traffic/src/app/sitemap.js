import { getSiteOrigin } from "@/lib/env";
import { listPageCandidatesWithAnswers } from "@/data/repositories/pageCandidate.repo";
import { buildLocalizedAlternates } from "@/seo/locale";

export const dynamic = "force-static";

const PRIORITY = {
  answer: 0.7,
  country_provider: 0.9,
  country_city_service: 0.8,
  country_locality_service: 0.75,
  country_locality_service_specialty: 0.7,
  country_service: 0.7,
  country_city: 0.65,
  country: 0.6
};

const CHANGE_FREQ = {
  answer: "monthly",
  country_provider: "weekly",
  country_city_service: "weekly",
  country_locality_service: "monthly",
  country_locality_service_specialty: "monthly",
  country_service: "monthly",
  country_city: "monthly",
  country: "monthly"
};

export default async function sitemap() {
  const siteOrigin = getSiteOrigin();

  const pages = await listPageCandidatesWithAnswers();

  return pages.map((page) => ({
    url: `${siteOrigin}${page.path}`,
    lastModified: new Date(page.updatedAt),
    changeFrequency: CHANGE_FREQ[page.pageType] ?? "monthly",
    priority: PRIORITY[page.pageType] ?? 0.6,
    alternates: {
      languages: buildLocalizedAlternates(page.path).languages
    }
  }));
}
