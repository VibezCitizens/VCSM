import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import { VPORT_TABS } from "@/features/profiles/config/profileTabs.config";
import { useProfileView } from "@/features/profiles/hooks/useProfileView";
import { useProfileGate } from "@/features/profiles/hooks/useProfileGate";
import { useBlockStatus } from "@/features/block/adapters/hooks/useBlockStatus.adapter";

import VportProfileHeader from "@/features/profiles/kinds/vport/ui/vportprofileheader/VportProfileHeader";
import VportProfileTabs from "@/features/profiles/kinds/vport/ui/tabs/VportProfileTabs";

import PrivateProfileNotice from "@/features/social/adapters/components/PrivateProfileNotice.adapter";
import PostActionsMenu from "@/features/post/adapters/postcard/components/PostActionsMenu.adapter";
import ReportModal from "@/features/moderation/adapters/components/ReportModal.adapter";
import ShareModal from "@/features/post/adapters/postcard/components/ShareModal.adapter";

import VportBarberShopOwnerBand from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopOwnerBand";
import VportBarberShopBookingView from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView";

import { getVportTabsByType } from "@/features/profiles/kinds/vport/model/gas/getVportTabsByType.model";
import { useVportProfileBySlug } from "@/features/profiles/kinds/vport/hooks/useVportProfileBySlug";
import { useActorSeoMeta } from "@/features/profiles/hooks/useActorSeoMeta";
import { useIsActorOwner } from "@/features/profiles/hooks/useIsActorOwner";
import { useVportProfileActions } from "@/features/profiles/kinds/vport/hooks/useVportProfileActions";
import VportProfileTabContent from "./components/VportProfileTabContent";

import "@/features/profiles/styles/profiles-modern.css";
import "@/features/profiles/styles/barbershop-owner-mode.css";

export default function VportProfileViewScreen({
  viewerActorId,
  profileActorId,
  identity,
  tabs = VPORT_TABS,
}) {
  const [tab, setTab] = useState("vibes");
  const [gateVersion, setGateVersion] = useState(0);
  const [postsVersion, setPostsVersion] = useState(0);
  const [reviewsDefaultTab, setReviewsDefaultTab] = useState(null);

  const autoAppliedFirstKeyRef = useRef(null);
  const userHasSelectedTabRef = useRef(false);
  const appliedSearchTabRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const gate = useProfileGate({ viewerActorId, targetActorId: profileActorId, version: gateVersion });
  const canViewContent = gate.loading ? undefined : gate.canView;

  const { loading, error, profile, posts, loadingPosts } = useProfileView({ viewerActorId, profileActorId, canViewContent });
  const { loading: blockLoading, canViewProfile } = useBlockStatus(viewerActorId, profileActorId);

  const { actorId: routeSlug } = useParams();
  const { publicDetails, isLoading: publicDetailsLoading } = useVportProfileBySlug(routeSlug);

  useActorSeoMeta(profile ?? null, publicDetails ?? null);

  const isDirectMatch = useMemo(() => {
    if (!viewerActorId || !profileActorId) return false;
    return String(viewerActorId) === String(profileActorId);
  }, [viewerActorId, profileActorId]);

  const userId = identity?.userId ?? null;
  const { ownsViaAccount } = useIsActorOwner({ userId, actorId: profileActorId, directMatch: isDirectMatch });
  const isOwner = isDirectMatch || ownsViaAccount;

  const vportType = useMemo(() => (
    publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category ?? null
  ), [publicDetails, profile]);

  const handleTabSelect = useCallback((key) => {
    userHasSelectedTabRef.current = true;
    setTab(key);
  }, []);

  useEffect(() => {
    if (!blockLoading && canViewProfile === false) navigate("/feed", { replace: true });
  }, [blockLoading, canViewProfile, navigate]);

  const visibleProfilePosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : [];
    return list.filter((p) => !p?.deleted_at);
  }, [posts]);

  const effectiveTabs = useMemo(() => {
    const fallbackTabs = Array.isArray(tabs) && tabs.length ? tabs : VPORT_TABS;
    const type = publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category ?? null;
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
    onPostDeleted: () => { setPostsVersion((v) => v + 1); setGateVersion((v) => v + 1); },
  });

  if (loading || blockLoading || gate.loading) {
    return (
      <div className="profiles-modern h-full w-full overflow-y-auto touch-pan-y">
        <VportProfileHeader loading />
      </div>
    );
  }

  if (error || !profile) {
    return <div className="profiles-modern flex justify-center py-20 text-rose-300">Failed to load profile.</div>;
  }

  if (profile.kind !== "vport") {
    return <div className="profiles-modern flex justify-center py-20 profiles-muted">Profile kind mismatch.</div>;
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
        profile={profile}
        viewerActorId={viewerActorId}
        profileIsPrivate={gate.isPrivate}
        onSubscriptionChanged={() => setGateVersion((v) => v + 1)}
      />

      {isBarbershopOwner && profile?.actorId && (
        <VportBarberShopOwnerBand
          actorId={profile.actorId}
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

      {gate.canView && isCalendarActive && (
        <VportBarberShopBookingView profile={profile} isOwner={isOwner} />
      )}

      {gate.canView && !isCalendarActive && (
        <VportProfileTabContent
          tab={tab}
          profile={profile}
          publicDetails={publicDetails}
          publicDetailsLoading={publicDetailsLoading}
          visibleProfilePosts={visibleProfilePosts}
          loadingPosts={loadingPosts}
          viewerActorId={viewerActorId}
          profileActorId={profileActorId}
          identity={identity}
          isOwner={isOwner}
          vportType={vportType}
          effectiveTabs={effectiveTabs}
          postsVersion={postsVersion}
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
