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
      <h3 className="homepage-card-title">Continue on TRAZE</h3>
      <p>
        Open live provider profiles, compare availability, and continue booking workflows on TRAZE.
      </p>
      <div className="row-wrap">
        <a
          className="pill pill--primary pill--strong"
          href={buildPlatformExploreLink(context, "directory")}
          target="_blank"
          rel="noreferrer"
        >
          Explore on TRAZE
        </a>
      </div>
    </div>
  );
}

export function ProviderCtaModules({ providerSlug, context, claimStatus, vcsmActorId, vcsmSlug }) {
  const isLinked = Boolean(vcsmActorId);
  const claimLink = buildPlatformClaimLink(providerSlug, vcsmActorId, "provider");

  return (
    <div className="card stack-grid">
      <h3 className="homepage-card-title">Take Action on TRAZE</h3>
      <p>
        {isLinked
          ? "This provider is verified on TRAZE. View their live profile, book, or follow."
          : "Book, follow, or open the full provider profile on TRAZE."}
      </p>
      <div className="row-wrap">
        <a
          className="pill"
          href={buildPlatformProviderLink(providerSlug, vcsmSlug, "provider")}
          target="_blank"
          rel="noreferrer"
        >
          View Profile
        </a>
        <a
          className="pill"
          href={buildPlatformBookingLink(providerSlug, context, vcsmSlug, "provider")}
          target="_blank"
          rel="noreferrer"
        >
          Book Now
        </a>
        <a
          className="pill"
          href={buildPlatformFollowLink(providerSlug, vcsmSlug, "provider")}
          target="_blank"
          rel="noreferrer"
        >
          Follow
        </a>
        {claimStatus !== "claimed" && claimLink ? (
          <a className="pill" href={claimLink} target="_blank" rel="noreferrer">
            Claim Profile
          </a>
        ) : null}
      </div>
    </div>
  );
}
