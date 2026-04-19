import { InternalLinkGrid } from "@/features/directories/components/InternalLinkGrid";
import { ProviderCtaModules } from "@/features/conversion/components/CtaModules";
import { getProviderGuideLinks } from "@/features/providers/lib/providerGuideLinks";
import { ReviewTrustSummary } from "@/features/reviews/components/ReviewTrustSummary";
import { getPublicReviewSummaryForProvider } from "@/data/repositories/reviewSummary.repo";
import { JsonLdScript } from "@/shared/components/JsonLdScript";

export async function ProviderPageTemplate({
  model,
  stats,
  context,
  reviewSummary = null,
  guideLinks = [],
  relatedLinks,
  schema
}) {
  const providerGuideLinks = guideLinks.length
    ? guideLinks
    : await getProviderGuideLinks(model.provider, { limit: 4 });
  const providerReviewSummary = reviewSummary
    ? reviewSummary
    : await getPublicReviewSummaryForProvider(model.provider, stats);

  return (
    <div className="stack-grid">
      <JsonLdScript id="provider-schema" schema={schema} />

      <section className="card stack-grid">
        <span className="pill">TRAZE Provider</span>
        <h1 className="template-title">{model.title}</h1>
        <p>{model.description}</p>

        <div className="row-wrap">
          {model.provider.vcsmActorId ? (
            <span className="pill pill--ok">✔ Verified Provider</span>
          ) : (
            <span className="pill">Claim: {model.provider.claimStatus}</span>
          )}
          <span className="pill">Rating: {stats?.ratingAvg?.toFixed(1) ?? "--"}</span>
          <span className="pill">Reviews: {stats?.reviewCount ?? 0}</span>
        </div>

        <div className="row-wrap">
          {model.serviceNames.map((serviceName) => (
            <span className="pill" key={serviceName}>
              {serviceName}
            </span>
          ))}
        </div>
      </section>

      {providerReviewSummary ? (
        <section className="card stack-grid">
          <h3 className="homepage-card-title">Public Review Summary</h3>
          <ReviewTrustSummary summary={providerReviewSummary} />
        </section>
      ) : null}

      <ProviderCtaModules
        providerSlug={model.provider.slug}
        context={context}
        claimStatus={model.provider.claimStatus}
        vcsmActorId={model.provider.vcsmActorId}
        vcsmSlug={model.provider.vcsmSlug}
      />

      <InternalLinkGrid title="TRAZE Guides & Resources" links={providerGuideLinks} />
      <InternalLinkGrid title="Nearby TRAZE Directory Paths" links={relatedLinks} />
    </div>
  );
}
