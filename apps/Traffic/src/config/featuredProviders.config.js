/**
 * Featured (pinned) providers for the homepage "Global top providers" section.
 *
 * Any provider whose slug appears here is promoted to the FRONT of its country
 * group — ahead of the normal rankScore ordering — so it takes the lead card.
 * The array order is the display priority (first entry = highest). Slugs are
 * matched case-insensitively against the live provider index slug.
 *
 * This is the only editorial override of the otherwise data-driven ordering.
 * Leave the array empty to fall back to pure rankScore ordering.
 */
export const FEATURED_PROVIDER_SLUGS = [
  "hide-a-way-rv-park"
];

const FEATURED_RANK = new Map(
  FEATURED_PROVIDER_SLUGS.map((slug, index) => [String(slug).toLowerCase(), index])
);

/**
 * Pin priority for a provider slug: 0 = highest priority, ascending.
 * Returns Number.POSITIVE_INFINITY when the provider is not featured.
 *
 * @param {string} slug
 * @returns {number}
 */
export function getFeaturedProviderRank(slug) {
  return FEATURED_RANK.get(String(slug ?? "").toLowerCase()) ?? Number.POSITIVE_INFINITY;
}
