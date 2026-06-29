import { listProvidersByCountry } from "@/data/repositories/provider.repo";
import { buildHomepageProviderCard } from "@/data/repositories/homepage.repo";
import { getServiceBySlug } from "@/data/repositories/service.repo";
import { isProviderIndexable } from "@/seo/qualityGuards";

/**
 * Provider deep-link cards for the Categories discovery view (build-time).
 *
 * The Categories page lets a visitor filter to one service category; the filtered
 * view then lists that category's providers instead of looping the card back to
 * itself. Each card links to the provider's /<country>/pro/<slug> page, which is
 * always generated for indexable providers — so the list never emits a phantom
 * link (TICKET-TRAZE-PHANTOM-LINKS-001). Build-time only, no runtime fetch.
 */

// Bucket a provider card under the SAME key the discovery grid groups categories
// by: a recognized taxonomy service maps to its canonical slug; everything else
// (unmapped business types such as "rv-park") collapses into the "other" bucket,
// mirroring category.repo's grouping so providers line up with their card.
export function providerBucketKey(card) {
  const service = card?.categoryKey ? getServiceBySlug(card.categoryKey) : null;
  return service ? service.slug : "other";
}

export function listCategoryProviderCardsByCountryCode(countryCode) {
  return listProvidersByCountry(countryCode)
    .filter((item) => isProviderIndexable(item.provider))
    .map((item) => buildHomepageProviderCard(item.provider))
    .filter(Boolean)
    .map((card) => ({ ...card, bucketKey: providerBucketKey(card) }));
}

export function buildProvidersByCountryCode(countries) {
  return Object.fromEntries(
    countries.map((country) => [
      country.countryCode,
      listCategoryProviderCardsByCountryCode(country.countryCode)
    ])
  );
}
