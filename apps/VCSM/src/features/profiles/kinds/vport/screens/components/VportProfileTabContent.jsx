import ActorProfilePostsView from "@/features/profiles/screens/views/ActorProfilePostsView";
import ActorProfilePhotosView from "@/features/profiles/screens/views/ActorProfilePhotosView";
import VportAboutView from "@/features/profiles/kinds/vport/screens/views/tabs/VportAboutView";
import VportSubscribersView from "@/features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView";
import VportReviewsView from "@/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView";
import VportMenuView from "@/features/profiles/kinds/vport/screens/views/tabs/VportMenuView";
import VportPortfolioView from "@/features/profiles/kinds/vport/screens/views/tabs/VportPortfolioView";
import VportServicesView from "@/features/profiles/kinds/vport/screens/services/view/VportServicesView";
import VportBookingView from "@/features/profiles/kinds/vport/screens/views/tabs/VportBookingView";
import VportContentView from "@/features/profiles/kinds/vport/screens/views/tabs/VportContentView";
import VportBarberShopTeamView from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView";
import VportBarberShopBookingView from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView";
import VportOwnerView from "@/features/profiles/kinds/vport/screens/owner/VportOwnerView";
import VportRatesView from "@/features/profiles/kinds/vport/screens/rates/view/VportRatesView";
import { VportGasPricesView } from "@/features/dashboard/vport/dashboard/cards/gasprices/screens/VportGasPricesView";

export default function VportProfileTabContent({
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
      <div
        style={{ display: tab === "vibes" ? undefined : "none" }}
        aria-hidden={tab !== "vibes"}
      >
        <ActorProfilePostsView
          profileActorId={profile.actorId}
          onShare={onShare}
          onOpenMenu={onOpenMenu}
        />
      </div>

      {tab === "photos" && (
        <ActorProfilePhotosView
          actorId={profile.actorId}
          viewerActorId={viewerActorId}
          canViewContent
          handleShare={onShare}
        />
      )}

      {tab === "portfolio" && (
        <VportPortfolioView
          profile={profile}
          availableTabs={effectiveTabs}
          onSelectTab={onSetTab}
        />
      )}

      {tab === "services" && (
        <VportServicesView profile={profile} viewerActorId={viewerActorId} />
      )}

      {tab === "book" && vportType === "barbershop" && (
        <VportBarberShopBookingView profile={profile} isOwner={isOwner} />
      )}
      {tab === "book" && vportType !== "barbershop" && (
        <VportBookingView profile={profile} isOwner={isOwner} />
      )}

      {tab === "team" && vportType === "barbershop" && (
        <VportBarberShopTeamView profile={profile} isOwner={isOwner} />
      )}

      {tab === "about" && (
        <VportAboutView profile={profile} details={publicDetails} />
      )}

      {tab === "subscribers" && <VportSubscribersView profile={profile} />}

      {tab === "reviews" && (
        <VportReviewsView
          profile={profile}
          viewerActorId={viewerActorId}
          initialReviewTab={reviewsDefaultTab}
          onConsumedInitialTab={onConsumedReviewsTab}
        />
      )}

      {tab === "menu" && (
        <VportMenuView
          profile={profile}
          onOpenFoodReview={() => { onConsumedReviewsTab?.("food"); onSetTab("reviews"); }}
        />
      )}

      {tab === "content" && (
        <VportContentView profile={profile} isOwner={isOwner} />
      )}

      {tab === "rates" && (
        <div className="mt-4">
          <VportRatesView actorId={profileActorId} rateType="fx" />
        </div>
      )}

      {tab === "gas" && (
        <div className="mt-4">
          <VportGasPricesView actorId={profileActorId} identity={identity} isOwner={isOwner} />
        </div>
      )}

      {tab === "owner" && isOwner ? (
        <VportOwnerView actorId={profile?.actorId ?? profileActorId ?? null} />
      ) : null}

      {tab === "about" && publicDetailsLoading && !publicDetails && (
        <div className="mt-4 text-xs profiles-muted">Loading public details...</div>
      )}
    </div>
  );
}
