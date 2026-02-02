import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useProfileView } from "@/features/profiles/hooks/useProfileView";
import { useProfileGate } from "@/features/profiles/hooks/useProfileGate";
import { useBlockStatus } from "@/features/block/hooks/useBlockStatus";

import ActorProfileHeader from "./ActorProfileHeader";
import ActorProfileTabs from "./ActorProfileTabs";

import ActorProfilePostsView from "./ActorProfilePostsView";
import ActorProfileFriendsView from "./ActorProfileFriendsView";
import ActorProfilePhotosView from "./ActorProfilePhotosView";
import { shareNative } from "@/shared/lib/shareNative";

import PrivateProfileNotice from "@/features/social/components/PrivateProfileNotice";

// ✅ SHARE fallback modal
import ShareModal from "@/features/post/postcard/components/ShareModal";

// ✅ POST MENU + REPORT FLOW (same behavior as feed)
import PostActionsMenu from "@/features/post/postcard/components/PostActionsMenu";
import useReportFlow from "@/features/moderation/hooks/useReportFlow";
import ReportModal from "@/features/moderation/components/ReportModal";

// ✅ delete controller (same as feed)
import { softDeletePostController } from "@/features/post/postcard/controller/deletePost.controller";

export default function ActorProfileViewScreen({ viewerActorId, profileActorId }) {
  const [tab, setTab] = useState("posts");
  const [gateVersion, setGateVersion] = useState(0);

  // ✅ NEW: posts refresh signal for profile posts tab
  const [postsVersion, setPostsVersion] = useState(0);

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

  useEffect(() => {
    if (!blockLoading && canViewProfile === false) {
      navigate("/feed", { replace: true });
    }
  }, [blockLoading, canViewProfile, navigate]);

  // ============================================================
  // ✅ FILTER: remove soft-deleted posts from profile-provided posts
  // (This fixes Photos tab showing deleted posts immediately)
  // ============================================================
  const visibleProfilePosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : [];
    return list.filter((p) => !p?.deleted_at);
  }, [posts]);

  // ============================================================
  // ✅ SHARE (native + fallback modal)
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
  // ✅ REPORT FLOW (viewer actor is reporter)
  // ============================================================
  const reportFlow = useReportFlow({ reporterActorId: viewerActorId });

  // ============================================================
  // ✅ POST ••• MENU STATE
  // ============================================================
  const [postMenu, setPostMenu] = useState(null);
  // postMenu = { postId, postActorId, isOwn, anchorRect } | null

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

  const closePostMenu = useCallback(() => {
    setPostMenu(null);
  }, []);

  // ============================================================
  // ✅ MENU ACTIONS
  // ============================================================
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

    // ✅ refresh Posts tab data without navigating away
    setPostsVersion((v) => v + 1);

    // ✅ if your useProfileView also caches, bump gateVersion to re-walk gates
    // (optional, but harmless)
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

  return (
    <div
      className="
        h-full
        w-full
        overflow-y-auto
        touch-pan-y
        bg-black
        text-white
      "
    >
      <ActorProfileHeader
        profile={profile}
        viewerActorId={viewerActorId}
        profileIsPrivate={gate.isPrivate}
        onSubscriptionChanged={() => setGateVersion((v) => v + 1)}
      />

      <ActorProfileTabs tab={tab} setTab={setTab} />

      {!gate.canView && (
        <PrivateProfileNotice
          actor={profile.actor}
          onRequestFollow={gate.requestFollow}
          canMessage
        />
      )}

      {gate.canView && (
        <div className="px-4 pb-24 max-w-3xl mx-auto">
          {tab === "posts" && (
            <ActorProfilePostsView
              profileActorId={profile.actorId}
              onShare={handleShare}
              onOpenMenu={openPostMenu}
              version={postsVersion} // ✅ NEW
            />
          )}

          {tab === "photos" && (
            <ActorProfilePhotosView
              actorId={profile.actorId}
              posts={visibleProfilePosts}
              loadingPosts={loadingPosts}
              canViewContent={gate.canView}
              handleShare={handleShare}
            />
          )}

          {tab === "videos" && (
            <div className="flex items-center justify-center py-10 text-neutral-500">
              Videos — coming soon
            </div>
          )}

          {tab === "friends" && (
            <ActorProfileFriendsView
              profileActorId={profile.actorId}
              canViewContent={gate.canView}
            />
          )}
        </div>
      )}

      {/* ✅ POST ••• MENU */}
      <PostActionsMenu
        open={!!postMenu}
        anchorRect={postMenu?.anchorRect}
        isOwn={!!postMenu?.isOwn}
        onClose={closePostMenu}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onReport={handleReportPost}
      />

      {/* ✅ REPORT MODAL */}
      <ReportModal
        open={reportFlow.open}
        title={reportFlow.context?.title ?? "Report"}
        subtitle={reportFlow.context?.subtitle ?? null}
        loading={reportFlow.loading}
        onClose={reportFlow.close}
        onSubmit={reportFlow.submit}
      />

      {/* ✅ SHARE fallback modal */}
      <ShareModal
        open={shareState.open}
        title="Spread"
        url={shareState.url}
        onClose={closeShare}
      />
    </div>
  );
}
