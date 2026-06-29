import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { VPORT_TABS } from "@/features/profiles/kinds/vport/config/profileTabs.config";
import { useProfileView } from "@/features/profiles/hooks/useProfileView";
import { useProfileGate } from "@/features/profiles/hooks/useProfileGate";

import VportProfileHeader from "@/features/profiles/kinds/vport/components/vportprofileheader/VportProfileHeader";
import VportProfileTabs from "@/features/profiles/kinds/vport/components/tabs/VportProfileTabs";

import PrivateProfileNotice from "@/features/social/adapters/components/PrivateProfileNotice.adapter";
import { PostActionsMenu, ShareModal } from "@/features/post/adapters/post.adapter";
import ReportModal from "@/features/moderation/adapters/components/ReportModal.adapter";

import VportBarberShopOwnerBand from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopOwnerBand";
import VportBarberShopBookingView from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView";

import { useActorStore } from "@hydration";
import { queryKeys } from "@/queries/queryKeys";
import { getVportTabsByType } from "@/features/profiles/kinds/vport/model/getVportTabsByType.model";
import { useVportProfileBySlug } from "@/features/profiles/kinds/vport/hooks/useVportProfileBySlug";
import { useActorSeoMeta } from "@/features/profiles/hooks/useActorSeoMeta";
import UnavailableProfileGate from "@/features/profiles/adapters/ui/UnavailableProfileGate.adapter";
import { deriveVportIsOwner } from "@/features/profiles/kinds/vport/model/vportOwnership.model";
import { VportProfileContext } from "@/features/profiles/kinds/vport/context/VportProfileContext";
import { useVportProfileActions } from "@/features/profiles/kinds/vport/hooks/useVportProfileActions";
import VportTabRouter from "../tabs/VportTabRouter";

import "@/shared/styles/profiles-modern.css";
import "@/features/profiles/styles/barbershop-owner-mode.css";

export default function VportProfileViewScreen({
  viewerActorId,
  profileActorId,
  identity,
  tabs = VPORT_TABS,
}) {
  const [tab, setTab] = useState(null);
  const [gateVersion, setGateVersion] = useState(0);
  const [reviewsDefaultTab, setReviewsDefaultTab] = useState(null);

  const qc = useQueryClient();

  const autoAppliedFirstKeyRef = useRef(null);
  const userHasSelectedTabRef = useRef(false);
  const appliedSearchTabRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const gate = useProfileGate({ viewerActorId, targetActorId: profileActorId, version: gateVersion });
  const canViewContent = gate.loading ? undefined : gate.canView;

  const { loading, error, profile } = useProfileView({ viewerActorId, profileActorId, canViewContent });

  const storeActor = useActorStore((s) => s.actors[profileActorId] ?? null);
  const seedProfile = useMemo(() => {
    if (!storeActor) return null;
    return {
      actorId: profileActorId,
      kind: "vport",
      displayName: storeActor.vportName ?? storeActor.vport_name ?? storeActor.displayName ?? null,
      username: storeActor.vportSlug ?? storeActor.vport_slug ?? storeActor.username ?? null,
      avatarUrl: storeActor.vportAvatarUrl ?? storeActor.vport_avatar_url ?? storeActor.photoUrl ?? "/avatar.jpg",
      bannerUrl: storeActor.bannerUrl ?? storeActor.banner_url ?? "/default-banner.jpg",
      bio: storeActor.bio ?? null,
      _isSeed: true,
    };
  }, [storeActor, profileActorId]);
  const displayProfile = profile ?? seedProfile;

  const { actorId: routeSlug } = useParams();
  const { publicDetails, isLoading: publicDetailsLoading } = useVportProfileBySlug(routeSlug);

  // V05A-M2: gate SEO head-write on the visibility decision — never write a denied
  // profile's bio/name into <title>/<meta description>/JSON-LD.
  useActorSeoMeta(gate.canView ? profile : null, gate.canView ? publicDetails : null);

  const isOwner = useMemo(
    () => deriveVportIsOwner({ viewerActorId, profileActorId }),
    [viewerActorId, profileActorId]
  );

  const vportProfileCtx = useMemo(() => ({
    viewerActorId,
    vportActorId: profileActorId,
    vportProfileId: profile?.id ?? null,
    mode: isOwner ? "owner" : "public",
    authorization: {
      canManage: isOwner,
      mode: isOwner ? "self" : "public",
    },
  }), [viewerActorId, profileActorId, profile?.id, isOwner]);

  const vportType = useMemo(() => (
    publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? null
  ), [publicDetails, profile]);

  const handleTabSelect = useCallback((key) => {
    userHasSelectedTabRef.current = true;
    setTab(key);
  }, []);

  useEffect(() => {
    if (!gate.loading && gate.isBlocked) navigate("/CentralFeed", { replace: true });
  }, [gate.loading, gate.isBlocked, navigate]);

  const effectiveTabs = useMemo(() => {
    const fallbackTabs = Array.isArray(tabs) && tabs.length ? tabs : VPORT_TABS;
    const type = publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? null;
    const baseTabs = type ? getVportTabsByType(type) : fallbackTabs;
    if (isOwner) {
      if (baseTabs.some((t) => t.key === "owner")) return baseTabs;
      return [...baseTabs, { key: "owner", label: "Owner" }];
    }
    return baseTabs.filter((t) => t.key !== "owner");
  }, [tabs, publicDetails, profile, isOwner]);

  useEffect(() => {
    const list = Array.isArray(effectiveTabs) ? effectiveTabs : [];
    if (!list.length) return;
    const firstKey = list[0]?.key;
    setTab((prev) => {
      const exists = list.some((t) => t.key === prev);
      if (!exists) return firstKey ?? "vibes";
      if (!userHasSelectedTabRef.current && firstKey && firstKey !== autoAppliedFirstKeyRef.current) {
        autoAppliedFirstKeyRef.current = firstKey;
        return firstKey;
      }
      return prev;
    });
  }, [effectiveTabs]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const requestedTab = String(params.get("tab") || "").trim().toLowerCase();
    if (!requestedTab || appliedSearchTabRef.current === requestedTab) return;
    const list = Array.isArray(effectiveTabs) ? effectiveTabs : [];
    if (!list.some((t) => String(t?.key || "").toLowerCase() === requestedTab)) return;
    setTab(requestedTab);
    appliedSearchTabRef.current = requestedTab;
  }, [location.search, effectiveTabs]);

  const actions = useVportProfileActions({
    viewerActorId,
    onPostDeleted: () => {
      qc.invalidateQueries({ queryKey: queryKeys.actorPosts(profile?.actorId ?? profileActorId) });
      setGateVersion((v) => v + 1);
    },
  });

  if (!displayProfile && (loading || gate.loading)) {
    return (
      <div className="profiles-modern h-full w-full overflow-y-auto touch-pan-y">
        <VportProfileHeader loading />
      </div>
    );
  }

  if (error && !displayProfile) {
    return <div className="profiles-modern flex justify-center py-20 text-rose-300">Failed to load profile.</div>;
  }

  // Deleted and inactive VPORTs are filtered at the DAL query layer — they return null.
  // Any non-null publicDetails is guaranteed to be active and non-deleted.
  const isVportUnavailable = !publicDetailsLoading && publicDetails === null;

  if (isVportUnavailable) {
    return (
      <div className="profiles-modern h-full w-full overflow-y-auto touch-pan-y">
        <UnavailableProfileGate />
      </div>
    );
  }

  const isBarbershopOwner = isOwner && vportType === "barbershop";
  const isCalendarActive = isBarbershopOwner && tab === "book";

  const rootClass = [
    "profiles-modern", "h-full", "w-full", "touch-pan-y",
    isBarbershopOwner ? "bs-owner-mode" : "",
    isCalendarActive ? "bs-owner-calendar-active" : "overflow-y-auto",
  ].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <VportProfileHeader
        profile={displayProfile}
        viewerActorId={viewerActorId}
        profileIsPrivate={gate.isPrivate}
        onSubscriptionChanged={() => setGateVersion((v) => v + 1)}
      />

      {isBarbershopOwner && profile?.actorId && (
        <VportBarberShopOwnerBand
          actorId={profile.actorId}
          callerActorId={viewerActorId}
          onNewBooking={() => handleTabSelect("book")}
          hideBookingButton={isCalendarActive}
        />
      )}

      <VportProfileTabs tab={tab} setTab={handleTabSelect} tabs={effectiveTabs} />

      {!gate.canView && (
        <PrivateProfileNotice
          actor={{
            id: profile?.actorId ?? profileActorId ?? null,
            kind: profile?.kind ?? "vport",
            displayName: profile?.displayName ?? "Vport",
            username: profile?.username ?? "",
            avatar: profile?.avatarUrl ?? "/avatar.jpg",
            route: `/profile/${profile?.actorId ?? profileActorId}`,
          }}
          onRequestFollow={gate.requestFollow}
          canMessage={false}
        />
      )}

      <VportProfileContext.Provider value={vportProfileCtx}>
        {gate.canView && isCalendarActive && (
          <VportBarberShopBookingView profile={profile} isOwner={isOwner} />
        )}

        {gate.canView && !isCalendarActive && !!profile && (
          <VportTabRouter
            tab={tab}
            profile={profile}
            publicDetails={publicDetails}
            publicDetailsLoading={publicDetailsLoading}
            viewerActorId={viewerActorId}
            profileActorId={profileActorId}
            identity={identity}
            isOwner={isOwner}
            vportType={vportType}
            effectiveTabs={effectiveTabs}
            reviewsDefaultTab={reviewsDefaultTab}
            onSetTab={handleTabSelect}
            onConsumedReviewsTab={(defaultTab) => {
              if (defaultTab) setReviewsDefaultTab(defaultTab);
              else setReviewsDefaultTab(null);
            }}
            onShare={actions.handleShare}
            onOpenMenu={actions.openPostMenu}
          />
        )}
      </VportProfileContext.Provider>

      <PostActionsMenu
        open={!!actions.postMenu}
        anchorRect={actions.postMenu?.anchorRect}
        isOwn={!!actions.postMenu?.isOwn}
        onClose={actions.closePostMenu}
        onEdit={actions.handleEditPost}
        onDelete={actions.handleDeletePost}
        onReport={actions.handleReportPost}
      />

      <ReportModal
        open={actions.reportFlow.open}
        title={actions.reportFlow.context?.title ?? "Report"}
        subtitle={actions.reportFlow.context?.subtitle ?? null}
        loading={actions.reportFlow.loading}
        onClose={actions.reportFlow.close}
        onSubmit={actions.reportFlow.submit}
      />

      <ShareModal
        open={actions.shareState.open}
        title="Spread"
        url={actions.shareState.url}
        onClose={actions.closeShare}
      />
    </div>
  );
}
