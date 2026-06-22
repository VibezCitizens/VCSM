import VportVibesTab from "./vibes/VportVibesTab";
import VportPhotosTab from "./photos/VportPhotosTab";
import VportPortfolioTab from "./portfolio/VportPortfolioTab";
import VportServicesTab from "./services/VportServicesTab";
import VportBookTab from "./book/VportBookTab";
import VportTeamTab from "./team/VportTeamTab";
import VportAboutTab from "./about/VportAboutTab";
import VportSubscribersTab from "./subscribers/VportSubscribersTab";
import VportReviewsTab from "./reviews/VportReviewsTab";
import VportMenuTab from "./menu/VportMenuTab";
import VportContentTab from "./content/VportContentTab";
import VportRatesTab from "./rates/VportRatesTab";
import VportGasTab from "./gas/VportGasTab";
import VportOwnerTab from "./owner/VportOwnerTab";

export default function VportTabRouter({
  tab,
  profile,
  publicDetails,
  publicDetailsLoading,
  viewerActorId,
  profileActorId,
  identity,
  isOwner,
  vportType,
  effectiveTabs,
  reviewsDefaultTab,
  onSetTab,
  onConsumedReviewsTab,
  onShare,
  onOpenMenu,
}) {
  return (
    <div className="profiles-shell px-4 pb-24">
      {/* Vibes always mounted — preserves scroll position and avoids re-fetch on tab switch */}
      <div
        style={{ display: tab === "vibes" ? undefined : "none" }}
        aria-hidden={tab !== "vibes"}
      >
        <VportVibesTab profile={profile} onShare={onShare} onOpenMenu={onOpenMenu} />
      </div>

      {tab === "photos" && (
        <VportPhotosTab profile={profile} viewerActorId={viewerActorId} onShare={onShare} />
      )}

      {tab === "portfolio" && (
        <VportPortfolioTab profile={profile} effectiveTabs={effectiveTabs} onSetTab={onSetTab} />
      )}

      {tab === "services" && (
        <VportServicesTab profile={profile} viewerActorId={viewerActorId} />
      )}

      {tab === "book" && (
        <VportBookTab profile={profile} isOwner={isOwner} vportType={vportType} />
      )}

      {tab === "team" && (
        <VportTeamTab profile={profile} isOwner={isOwner} vportType={vportType} />
      )}

      {tab === "about" && (
        <VportAboutTab
          profile={profile}
          publicDetails={publicDetails}
          publicDetailsLoading={publicDetailsLoading}
        />
      )}

      {tab === "subscribers" && <VportSubscribersTab profile={profile} />}

      {tab === "reviews" && (
        <VportReviewsTab
          profile={profile}
          viewerActorId={viewerActorId}
          reviewsDefaultTab={reviewsDefaultTab}
          onConsumedReviewsTab={onConsumedReviewsTab}
        />
      )}

      {tab === "menu" && (
        <VportMenuTab
          profile={profile}
          onConsumedReviewsTab={onConsumedReviewsTab}
          onSetTab={onSetTab}
        />
      )}

      {tab === "content" && <VportContentTab profile={profile} isOwner={isOwner} />}

      {tab === "rates" && <VportRatesTab profileActorId={profileActorId} />}

      {tab === "gas" && (
        <VportGasTab profileActorId={profileActorId} identity={identity} isOwner={isOwner} />
      )}

      {tab === "owner" && (
        <VportOwnerTab profile={profile} profileActorId={profileActorId} isOwner={isOwner} />
      )}
    </div>
  );
}
