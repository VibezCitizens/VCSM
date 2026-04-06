import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useProfileView } from "@/features/profiles/hooks/useProfileView";
import { useProfileGate } from "@/features/profiles/hooks/useProfileGate";
import { useActorProfileActions } from "@/features/profiles/hooks/useActorProfileActions";
import {
  useBlockStatus,
  PrivateProfileNotice,
  ShareModal,
  PostActionsMenu,
  ReportModal,
} from "@/features/profiles/adapters/ui/actorProfileScreenDependencies.adapter";

import ActorProfileHeader from "@/features/profiles/screens/views/ActorProfileHeader";
import ActorProfileTabs from "@/features/profiles/screens/views/ActorProfileTabs";
import ActorProfilePostsView from "@/features/profiles/screens/views/ActorProfilePostsView";
import ActorProfileFriendsView from "@/features/profiles/screens/views/ActorProfileFriendsView";
import ActorProfilePhotosView from "@/features/profiles/screens/views/ActorProfilePhotosView";
import ActorProfileTagsView from "@/features/profiles/screens/views/ActorProfileTagsView";
import "@/features/profiles/styles/profiles-modern.css";

export default function ActorProfileViewScreen({ viewerActorId, profileActorId }) {
  const [tab, setTab] = useState("posts");
  const [gateVersion, setGateVersion] = useState(0);
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

  const visibleProfilePosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : [];
    return list.filter((post) => !post?.deleted_at);
  }, [posts]);

  const handlePostDeleted = useCallback(() => {
    setPostsVersion((value) => value + 1);
    setGateVersion((value) => value + 1);
  }, []);

  const {
    reportFlow,
    shareState,
    closeShare,
    handleShare,
    postMenu,
    openPostMenu,
    closePostMenu,
    handleReportPost,
    handleEditPost,
    handleDeletePost,
  } = useActorProfileActions({
    viewerActorId,
    navigate,
    onPostDeleted: handlePostDeleted,
  });

  if (loading || blockLoading || gate.loading) {
    return (
      <div className="profiles-modern h-full w-full overflow-y-auto touch-pan-y">
        <ActorProfileHeader loading />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profiles-modern flex justify-center py-20 text-rose-300">
        Failed to load profile.
      </div>
    );
  }

  const isCitizenProfile = profile?.kind === "user";
  const isProfileOwner =
    Boolean(viewerActorId) &&
    Boolean(profile?.actorId) &&
    viewerActorId === profile.actorId;

  return (
    <div className="profiles-modern h-full w-full overflow-y-auto touch-pan-y">
      <ActorProfileHeader
        profile={profile}
        viewerActorId={viewerActorId}
        profileIsPrivate={gate.isPrivate}
        onSubscriptionChanged={() => setGateVersion((value) => value + 1)}
      />

      <ActorProfileTabs tab={tab} setTab={setTab} includeTags={isCitizenProfile} />

      {!gate.canView && (
        <PrivateProfileNotice
          actor={{
            id: profile?.actorId ?? profileActorId ?? null,
            kind: profile?.kind ?? "user",
            displayName: profile?.displayName ?? "Citizen",
            username: profile?.username ?? "",
            avatar: profile?.avatarUrl ?? "/avatar.jpg",
            route: `/profile/${profile?.actorId ?? profileActorId}`,
          }}
          onRequestFollow={gate.requestFollow}
          canMessage={false}
        />
      )}

      {gate.canView && (
        <div className="profiles-shell px-4 pb-24">
          {tab === "posts" && (
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

          {tab === "videos" && (
            <div className="flex items-center justify-center py-10 text-neutral-500">
              Videos - coming soon
            </div>
          )}

          {isCitizenProfile && tab === "tags" && (
            <ActorProfileTagsView actorId={profile.actorId} canAddTag={isProfileOwner} />
          )}

          {tab === "friends" && (
            <ActorProfileFriendsView
              profileActorId={profile.actorId}
              canViewContent={gate.canView}
              version={gateVersion}
            />
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
