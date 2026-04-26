import {
  buildPlatformBookingLink,
  buildPlatformClaimLink,
  buildPlatformExploreLink,
  buildPlatformFollowLink,
  buildPlatformProviderLink
} from "@/features/conversion/lib/deepLinkBuilder";

export function DirectoryCtaModules({ context }) {
  return (
    <div className="card stack-grid">
      <h3 className="homepage-card-title">Continue on Vibez Citizens</h3>
      <p>
        Open live provider profiles, compare availability, and continue booking workflows on the platform.
      </p>
      <div className="row-wrap">
        <a
          className="pill pill--primary pill--strong"
          href={buildPlatformExploreLink(context, "directory")}
          target="_blank"
          rel="noreferrer"
        >
          Explore on Vibez Citizens
        </a>
      </div>
    </div>
  );
}

export function ProviderCtaModules({ providerSlug, context, claimStatus, vcsmActorId, vcsmSlug }) {
  const isLinked = Boolean(vcsmActorId);
  const claimLink = buildPlatformClaimLink(providerSlug, vcsmActorId, "provider");

  return (
    <div className="card card--cta pro-cta">
      <div className="pro-cta-brand">
        <span className="pro-cta-tagline">Vibez Citizens</span>
      </div>

      <h2 className="pro-cta-title">Continue on Vibez Citizens</h2>

      <p className="pro-cta-desc">
        {isLinked
          ? "View this provider's live profile, book a service, or follow their updates."
          : "Explore this provider's full profile and book directly on the platform."}
      </p>

      <div className="pro-cta-actions">
        <a
          className="btn btn--primary"
          href={buildPlatformProviderLink(providerSlug, vcsmSlug, "provider")}
          target="_blank"
          rel="noreferrer"
        >
          View Live Profile
        </a>
        <a
          className="btn btn--ghost"
          href={buildPlatformBookingLink(providerSlug, context, vcsmSlug, "provider")}
          target="_blank"
          rel="noreferrer"
        >
          Book a Service
        </a>
        <a
          className="btn btn--ghost"
          href={buildPlatformFollowLink(providerSlug, vcsmSlug, "provider")}
          target="_blank"
          rel="noreferrer"
        >
          Follow
        </a>
        {claimStatus !== "claimed" && claimLink ? (
          <a className="btn btn--claim" href={claimLink} target="_blank" rel="noreferrer">
            Claim This Profile
          </a>
        ) : null}
      </div>
    </div>
  );
}
