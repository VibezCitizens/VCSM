import { providerPath, countryProviderPath } from "@/lib/paths";

function titleize(value) {
  return String(value ?? "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

/**
 * Map a traffic.search_public_providers() RPC row to the provider shape
 * consumed by TrazeProviderCard. `href` is the un-localized provider path;
 * the card wraps it with withLocale() at render time.
 *
 * @param {object} row
 * @param {Array<{countryCode:string, countrySlug:string}>} [countryOptions]
 */
export function searchRowToCard(row, countryOptions = []) {
  if (!row || !row.provider_slug) return null;

  const countryCode = String(row.country_code ?? "").trim().toUpperCase();
  const countrySlug =
    countryOptions.find((c) => c.countryCode === countryCode)?.countrySlug ?? null;

  // Prefer the country-scoped provider route when we can resolve the slug,
  // else fall back to the bare /pro/{slug} route (both are valid SEO pages).
  const href = countrySlug
    ? countryProviderPath(countrySlug, row.provider_slug)
    : providerPath(row.provider_slug);

  const rating = Number(row.rating_avg);
  const reviewCount = Number(row.review_count);

  return {
    id: row.provider_id ?? row.provider_slug,
    slug: row.provider_slug,
    name: row.display_name,
    href,
    category: row.primary_service || titleize(row.business_type),
    categoryKey: row.category_key || row.business_type || null,
    rating: Number.isFinite(rating) ? rating : null,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    verified: row.claim_status === "claimed",
    avatarUrl: row.avatar_url || null,
    logoUrl: row.logo_url || null,
    primaryCityName: row.city_name || null,
    primaryRegionCode: row.state_code || null,
    primaryCountryCode: countryCode || null,
    countrySlug,
    primaryCitySlug: row.city_slug || null,
    locationText: null
  };
}
