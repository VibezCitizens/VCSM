// src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { VPORT_TABS } from "@/features/profiles/config/profileTabs.config";

import { useProfileView } from "@/features/profiles/hooks/useProfileView";
import { useProfileGate } from "@/features/profiles/hooks/useProfileGate";
import { useBlockStatus } from "@/features/block/hooks/useBlockStatus";

import VportProfileHeader from "@/features/profiles/kinds/vport/ui/vportprofileheader/VportProfileHeader";
import VportProfileTabs from "@/features/profiles/kinds/vport/ui/tabs/VportProfileTabs";

import ActorProfilePostsView from "@/features/profiles/screens/views/ActorProfilePostsView";
import ActorProfilePhotosView from "@/features/profiles/screens/views/ActorProfilePhotosView";

import VportAboutView from "@/features/profiles/kinds/vport/screens/views/tabs/VportAboutView";
import VportSubscribersView from "@/features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView";
import VportReviewsView from "@/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView";
import VportMenuView from "@/features/profiles/kinds/vport/screens/views/tabs/VportMenuView";

import VportPortfolioView from "@/features/profiles/kinds/vport/screens/views/tabs/VportPortfolioView";
import VportServicesView from "@/features/profiles/kinds/vport/screens/services/view/VportServicesView";
import VportBookingView from "@/features/profiles/kinds/vport/screens/views/tabs/VportBookingView";

import { shareNative } from "@/shared/lib/shareNative";
import PrivateProfileNotice from "@/features/social/components/PrivateProfileNotice";

import ShareModal from "@/features/post/postcard/components/ShareModal";
import PostActionsMenu from "@/features/post/postcard/components/PostActionsMenu";
import useReportFlow from "@/features/moderation/hooks/useReportFlow";
import ReportModal from "@/features/moderation/components/ReportModal";
import { softDeletePostController } from "@/features/post/postcard/controller/deletePost.controller";

import { VportGasPricesView } from "@/features/profiles/kinds/vport/screens/gas/view/VportGasPricesView";
import VportOwnerView from "@/features/profiles/kinds/vport/screens/owner/VportOwnerView";

import { getVportTabsByType } from "@/features/profiles/kinds/vport/model/gas/getVportTabsByType.model";
import { useVportPublicDetails } from "@/features/profiles/kinds/vport/hooks/useVportPublicDetails";
import { useIdentity } from "@/state/identity/identityContext";

// ✅ NEW: Rates tab view
import VportRatesView from "@/features/profiles/kinds/vport/screens/rates/view/VportRatesView";

export default function VportProfileViewScreen({
  viewerActorId,
  profileActorId,
  tabs = VPORT_TABS,
}) {
  const [tab, setTab] = useState("vibes");
  const [gateVersion, setGateVersion] = useState(0);
  const [postsVersion, setPostsVersion] = useState(0);

  const [reviewsDefaultTab, setReviewsDefaultTab] = useState(null);
  const didInitTabRef = useRef(false);

  const navigate = useNavigate();

  const gate = useProfileGate({
    viewerActorId,
    targetActorId: profileActorId,
    version: gateVersion,
  });

  const canViewContent = gate.loading ? undefined : gate.canView;

  const { loading, error, profile, posts, loadingPosts } = useProfileView({
    viewerActorId,
    profileActorId,
    canViewContent,
  });

  const { loading: blockLoading, canViewProfile } = useBlockStatus(
    viewerActorId,
    profileActorId
  );

  const { loading: publicDetailsLoading, details: publicDetails } =
    useVportPublicDetails(profileActorId);

  const identity = useIdentity();

  const isOwner = useMemo(() => {
    if (!viewerActorId || !profileActorId) return false;
    return String(viewerActorId) === String(profileActorId);
  }, [viewerActorId, profileActorId]);

  const openFoodReview = useCallback(() => {
    setReviewsDefaultTab("food");
    setTab("reviews");
  }, []);

  useEffect(() => {
    if (!blockLoading && canViewProfile === false) {
      navigate("/feed", { replace: true });
    }
  }, [blockLoading, canViewProfile, navigate]);

  const visibleProfilePosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : [];
    return list.filter((p) => !p?.deleted_at);
  }, [posts]);

  // ============================================================
  // TAB LAYOUT SELECTION (+ OWNER TAB ONLY IF isOwner)
  // ============================================================
  const effectiveTabs = useMemo(() => {
    const fallbackTabs = Array.isArray(tabs) && tabs.length ? tabs : VPORT_TABS;

    const vportType =
      publicDetails?.vportType ??
      profile?.vport_type ??
      profile?.vportType ??
      profile?.category ??
      null;

    const baseTabs = vportType ? getVportTabsByType(vportType) : fallbackTabs;

    if (isOwner) {
      if (baseTabs.some((t) => t.key === "owner")) return baseTabs;
      return [...baseTabs, { key: "owner", label: "Owner" }];
    }

    // viewer → never include owner tab
    return baseTabs.filter((t) => t.key !== "owner");
  }, [tabs, publicDetails, profile, isOwner]);

  useEffect(() => {
    const list = Array.isArray(effectiveTabs) ? effectiveTabs : [];
    const firstKey = list[0]?.key;
    if (!firstKey) return;

    if (didInitTabRef.current) return;

    if (tab === "vibes" && firstKey !== "vibes") {
      setTab(firstKey);
    }

    didInitTabRef.current = true;
  }, [effectiveTabs, tab]);

  useEffect(() => {
    setTab((prev) => {
      const list = Array.isArray(effectiveTabs) ? effectiveTabs : [];
      if (!list.length) return prev || "vibes";
      const exists = list.some((t) => t.key === prev);
      return exists ? prev : list[0]?.key ?? "vibes";
    });
  }, [effectiveTabs]);

  // ============================================================
  // SHARE
  // ============================================================
  const [shareState, setShareState] = useState({
    open: false,
    url: "",
    postId: null,
  });

  const closeShare = useCallback(() => {
    setShareState({ open: false, url: "", postId: null });
  }, []);

  const handleShare = useCallback(async (postId) => {
    if (!postId) return;

    const url = `${window.location.origin}/post/${postId}`;

    const res = await shareNative({
      title: "Spread",
      text: "",
      url,
    });

    if (!res.ok) {
      setShareState({ open: true, url, postId });
    }
  }, []);

  const reportFlow = useReportFlow({ reporterActorId: viewerActorId });

  const [postMenu, setPostMenu] = useState(null);

  const openPostMenu = useCallback(
    ({ postId, postActorId, anchorRect }) => {
      if (!postId || !anchorRect) return;

      setPostMenu({
        postId,
        postActorId: postActorId ?? null,
        isOwn: (postActorId ?? null) === (viewerActorId ?? null),
        anchorRect,
      });
    },
    [viewerActorId]
  );

  const closePostMenu = useCallback(() => setPostMenu(null), []);

  const handleReportPost = useCallback(() => {
    if (!viewerActorId) return;
    if (!postMenu?.postId) return;

    reportFlow.start({
      objectType: "post",
      objectId: postMenu.postId,
      postId: postMenu.postId,
      dedupeKey: `report:post:${postMenu.postId}`,
      title: "Report Vibe",
      subtitle: "Tell us what’s wrong with this Vibe.",
    });

    closePostMenu();
  }, [viewerActorId, postMenu, reportFlow, closePostMenu]);

  const handleEditPost = useCallback(() => {
    if (!postMenu?.postId) return;
    closePostMenu();
    navigate(`/post/${postMenu.postId}/edit`);
  }, [postMenu, navigate, closePostMenu]);

  const handleDeletePost = useCallback(async () => {
    if (!viewerActorId) return;
    if (!postMenu?.postId) return;

    const okConfirm = window.confirm("Delete this Vibe?");
    if (!okConfirm) return;

    const res = await softDeletePostController({
      actorId: viewerActorId,
      postId: postMenu.postId,
    });

    if (!res.ok) {
      window.alert(res.error?.message ?? "Failed to delete Vibe");
      return;
    }

    setPostsVersion((v) => v + 1);
    setGateVersion((v) => v + 1);
    closePostMenu();
  }, [viewerActorId, postMenu, closePostMenu]);

  if (loading || blockLoading || gate.loading) {
    return (
      <div className="flex justify-center py-20 text-neutral-400">Loading…</div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex justify-center py-20 text-red-400">
        Failed to load profile.
      </div>
    );
  }

  if (profile.kind !== "vport") {
    return (
      <div className="flex justify-center py-20 text-neutral-400">
        Profile kind mismatch.
      </div>
    );
  }

  const actorIdForOwnerView = profile?.actorId ?? profileActorId ?? null;

  return (
    <div className="h-full w-full overflow-y-auto touch-pan-y bg-black text-white">
      <VportProfileHeader
        profile={profile}
        viewerActorId={viewerActorId}
        profileIsPrivate={gate.isPrivate}
        onSubscriptionChanged={() => setGateVersion((v) => v + 1)}
      />

      <VportProfileTabs tab={tab} setTab={setTab} tabs={effectiveTabs} />

      {!gate.canView && (
        <PrivateProfileNotice
          actor={profile.actor}
          onRequestFollow={gate.requestFollow}
          canMessage
        />
      )}

      {gate.canView && (
        <div className="px-4 pb-24 max-w-3xl mx-auto">
          {tab === "vibes" && (
            <ActorProfilePostsView
              profileActorId={profile.actorId}
              onShare={handleShare}
              onOpenMenu={openPostMenu}
              version={postsVersion}
            />
          )}

          {tab === "photos" && (
            <ActorProfilePhotosView
              actorId={profile.actorId}
              viewerActorId={viewerActorId}
              posts={visibleProfilePosts}
              loadingPosts={loadingPosts}
              canViewContent={gate.canView}
              handleShare={handleShare}
            />
          )}

          {tab === "portfolio" && (
            <VportPortfolioView
              profile={profile}
              posts={visibleProfilePosts}
              loadingPosts={loadingPosts}
              viewerActorId={viewerActorId}
              canViewContent={gate.canView}
              handleShare={handleShare}
            />
          )}

          {tab === "services" && (
            <VportServicesView profile={profile} viewerActorId={viewerActorId} />
          )}

          {tab === "book" && <VportBookingView profile={profile} />}

          {tab === "about" && (
            <VportAboutView profile={profile} details={publicDetails} />
          )}

          {tab === "subscribers" && <VportSubscribersView profile={profile} />}

          {tab === "reviews" && (
            <VportReviewsView
              profile={profile}
              viewerActorId={viewerActorId}
              initialReviewTab={reviewsDefaultTab}
              onConsumedInitialTab={() => setReviewsDefaultTab(null)}
            />
          )}

          {tab === "menu" && (
            <VportMenuView profile={profile} onOpenFoodReview={openFoodReview} />
          )}

          {/* ✅ NEW: Rates tab */}
          {tab === "rates" && (
            <div className="mt-4">
              <VportRatesView actorId={profileActorId} rateType="fx" />
            </div>
          )}

          {tab === "gas" && (
            <div className="mt-4">
              <VportGasPricesView actorId={profileActorId} identity={identity} />
            </div>
          )}

          {/* ✅ HARD GATE: owner view only renders for owner */}
          {tab === "owner" && isOwner ? (
            <VportOwnerView actorId={actorIdForOwnerView} />
          ) : null}

          {tab === "about" && publicDetailsLoading && !publicDetails && (
            <div className="mt-4 text-xs text-neutral-500">
              Loading public details…
            </div>
          )}
        </div>
      )}

      <PostActionsMenu
        open={!!postMenu}
        anchorRect={postMenu?.anchorRect}
        isOwn={!!postMenu?.isOwn}
        onClose={closePostMenu}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onReport={handleReportPost}
      />

      <ReportModal
        open={reportFlow.open}
        title={reportFlow.context?.title ?? "Report"}
        subtitle={reportFlow.context?.subtitle ?? null}
        loading={reportFlow.loading}
        onClose={reportFlow.close}
        onSubmit={reportFlow.submit}
      />

      <ShareModal
        open={shareState.open}
        title="Spread"
        url={shareState.url}
        onClose={closeShare}
      />
    </div>
  );
}