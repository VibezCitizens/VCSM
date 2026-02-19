// src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
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

// ✅ generalized tabs (barber, etc.)
import VportPortfolioView from "@/features/profiles/kinds/vport/screens/views/tabs/VportPortfolioView";
import VportServicesView from "@/features/profiles/kinds/vport/screens/views/tabs/VportServicesView";
import VportBookingView from "@/features/profiles/kinds/vport/screens/views/tabs/VportBookingView";

import { shareNative } from "@/shared/lib/shareNative";
import PrivateProfileNotice from "@/features/social/components/PrivateProfileNotice";

import ShareModal from "@/features/post/postcard/components/ShareModal";
import PostActionsMenu from "@/features/post/postcard/components/PostActionsMenu";
import useReportFlow from "@/features/moderation/hooks/useReportFlow";
import ReportModal from "@/features/moderation/components/ReportModal";
import { softDeletePostController } from "@/features/post/postcard/controller/deletePost.controller";

// ✅ fetch public details
import { fetchVportPublicDetails } from "@/features/settings/profile/dal/vportPublicDetails.read.dal";

export default function VportProfileViewScreen({
  viewerActorId,
  profileActorId,
  tabs = VPORT_TABS,
}) {
  // ✅ default to FIRST tab in the provided layout (restaurant => menu, etc.)
  const initialTab = useMemo(() => {
    const list = Array.isArray(tabs) ? tabs : [];
    return list[0]?.key ?? "vibes";
  }, [tabs]);

  const [tab, setTab] = useState(initialTab);
  const [gateVersion, setGateVersion] = useState(0);
  const [postsVersion, setPostsVersion] = useState(0);

  // ✅ one-shot default reviews tab (used when coming from Menu CTA)
  const [reviewsDefaultTab, setReviewsDefaultTab] = useState(null);

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

  // ✅ public details state
  const [publicDetails, setPublicDetails] = useState(null);
  const [publicDetailsLoading, setPublicDetailsLoading] = useState(false);

  // ✅ Menu -> Reviews (Food) entrypoint
  const openFoodReview = useCallback(() => {
    setReviewsDefaultTab("food");
    setTab("reviews");
  }, []);

  useEffect(() => {
    if (!blockLoading && canViewProfile === false) {
      navigate("/feed", { replace: true });
    }
  }, [blockLoading, canViewProfile, navigate]);

  // ✅ ensure selected tab exists in current tabs list
  // - if tabs change (restaurant/service layouts), reset to new layout default
  useEffect(() => {
    const list = Array.isArray(tabs) ? tabs : [];
    if (!list.length) return;

    const exists = list.some((t) => t.key === tab);
    if (!exists) setTab(list[0].key);
  }, [tabs, tab]);

  const visibleProfilePosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : [];
    return list.filter((p) => !p?.deleted_at);
  }, [posts]);

  // ============================================================
  // LOAD PUBLIC DETAILS (with debug)
  // ============================================================
  useEffect(() => {
    // vc.vport_public_details.vport_id references vc.vports.id
    // so ONLY use vportId here.
    const vportId = profile?.vportId ?? profile?.vport_id ?? null;

    // ✅ DEBUG: show ids every time this effect runs
    console.groupCollapsed("[VportProfileViewScreen] public details");
    console.log("viewerActorId:", viewerActorId);
    console.log("profileActorId (route):", profileActorId);
    console.log("profile.actorId:", profile?.actorId);
    console.log("profile.kind:", profile?.kind);
    console.log("profile.vportId:", profile?.vportId);
    console.log("profile.vport_id:", profile?.vport_id);
    console.log("FINAL vportId used:", vportId);
    console.groupEnd();

    if (!vportId) {
      console.warn(
        "[VportProfileViewScreen] missing vportId -> will NOT fetch vport_public_details"
      );
      setPublicDetails(null);
      return;
    }

    let alive = true;

    (async () => {
      setPublicDetailsLoading(true);
      try {
        console.log(
          "[VportProfileViewScreen] fetching vport_public_details for:",
          vportId
        );

        const d = await fetchVportPublicDetails(vportId);

        console.log(
          "[VportProfileViewScreen] fetchVportPublicDetails result:",
          d
        );

        if (!alive) return;
        setPublicDetails(d || null);
      } catch (e) {
        console.error(
          "[VportProfileViewScreen] fetchVportPublicDetails FAILED:",
          e
        );
        if (!alive) return;
        setPublicDetails(null);
      } finally {
        if (!alive) return;
        setPublicDetailsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    viewerActorId,
    profileActorId,
    profile?.actorId,
    profile?.kind,
    profile?.vportId,
    profile?.vport_id,
  ]);

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

  // ============================================================
  // REPORT FLOW
  // ============================================================
  const reportFlow = useReportFlow({ reporterActorId: viewerActorId });

  // ============================================================
  // POST MENU
  // ============================================================
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

  // ============================================================
  // STATES
  // ============================================================
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

  return (
    <div className="h-full w-full overflow-y-auto touch-pan-y bg-black text-white">
      <VportProfileHeader
        profile={profile}
        viewerActorId={viewerActorId}
        profileIsPrivate={gate.isPrivate}
        onSubscriptionChanged={() => setGateVersion((v) => v + 1)}
      />

      <VportProfileTabs tab={tab} setTab={setTab} tabs={tabs} />

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
