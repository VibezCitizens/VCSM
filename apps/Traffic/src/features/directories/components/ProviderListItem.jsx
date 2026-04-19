import Link from "next/link";
import { getCountryByCode } from "@/data/repositories/geo.repo";
import { getPublicReviewSummaryForProvider } from "@/data/repositories/reviewSummary.repo";
import { ReviewTrustSummary } from "@/features/reviews/components/ReviewTrustSummary";
import { countryProviderPath, providerPath } from "@/lib/paths";

function resolveProviderHref(provider) {
  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) {
    return providerPath(provider.slug);
  }

  return countryProviderPath(country.slug, provider.slug);
}

export async function ProviderListItem({ item }) {
  const reviewSummary = await getPublicReviewSummaryForProvider(item.provider, item.stats);

  return (
    <article className="card stack-grid">
      <div className="row-between">
        <h3 className="homepage-city-title">{item.provider.displayName}</h3>
        <span className="pill">Rank {item.stats?.rankScore.toFixed(1) ?? "--"}</span>
      </div>

      <p>{item.provider.shortBio}</p>

      <div className="row-wrap">
        {reviewSummary ? (
          <ReviewTrustSummary summary={reviewSummary} compact />
        ) : (
          <>
            <span className="pill">Rating {item.stats?.ratingAvg.toFixed(1) ?? "--"}</span>
            <span className="pill">Reviews {item.stats?.reviewCount ?? 0}</span>
          </>
        )}
        <span className="pill">Reply p50 {item.stats?.responseTimeP50Minutes ?? "--"}m</span>
      </div>

      <div className="row-between">
        <span className="text-xs text-muted">
          {item.providerServices.length} listed services
        </span>
        <Link className="pill" href={resolveProviderHref(item.provider)}>
          View Provider
        </Link>
      </div>
    </article>
  );
}
