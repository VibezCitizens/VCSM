import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useActorStore } from "@hydration";
import { queryKeys } from "@/queries/queryKeys";
import { useTranslation } from "@i18n";

import { useProfileView } from "@/features/profiles/hooks/useProfileView";
import { useProfileGate } from "@/features/profiles/hooks/useProfileGate";
import { useActorProfileActions } from "@/features/profiles/hooks/useActorProfileActions";
import { useActorSeoMeta } from "@/features/profiles/hooks/useActorSeoMeta";
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

export default function ActorProfileViewScreen({ viewerActorId, profileActorId, identity }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("posts");
  const [gateVersion, setGateVersion] = useState(0);

  const navigate = useNavigate();
  const qc = useQueryClient();

  // ── Seed profile from hydration store ─────────────────────────────────────
  // Renders the header immediately before the profile RPC resolves.
  // For own profile: identity prop provides the most current data.
  // For other profiles: actor store has data if they appeared in feed/chat.
  const storeActor = useActorStore((s) => s.actors[profileActorId] ?? null);
  const isSelf = viewerActorId === profileActorId;

  const seedProfile = useMemo(() => {
    // Prefer hydration store (complete); fall back to identity for own profile
    const src = storeActor ?? (isSelf ? identity : null);
    if (!src) return null;

    const isVport = (src.kind ?? src.actor_kind) === "vport";
    return {
      actorId: profileActorId,
      kind: src.kind ?? "user",
      displayName: isVport
        ? (src.vportName ?? src.vport_name ?? src.displayName ?? src.display_name ?? null)
        : (src.displayName ?? src.display_name ?? null),
      username: isVport
        ? (src.vportSlug ?? src.vport_slug ?? src.username ?? null)
        : (src.username ?? null),
      avatarUrl: isVport
        ? (src.vportAvatarUrl ?? src.vport_avatar_url ?? src.photoUrl ?? src.photo_url ?? "/avatar.jpg")
        : (src.photoUrl ?? src.photo_url ?? src.avatar ?? "/avatar.jpg"),
      bannerUrl: src.bannerUrl ?? src.banner_url ?? src.banner ?? "/default-banner.jpg",
      bio: src.bio ?? null,
      isFollowing: false,
      _isSeed: true,
    };
  }, [storeActor, isSelf, identity, profileActorId]);

  // ── Gate + block ───────────────────────────────────────────────────────────
  const gate = useProfileGate({
    viewerActorId,
    targetActorId: profileActorId,
    version: gateVersion,
  });

  const canViewContent = gate.loading ? undefined : gate.canView;

  const { loading: blockLoading, canViewProfile } = useBlockStatus(
    viewerActorId,
    profileActorId
  );

  useEffect(() => {
    if (!blockLoading && canViewProfile === false) {
      navigate("/feed", { replace: true });
    }
  }, [blockLoading, canViewProfile, navigate]);

  // ── Profile data (React Query) ─────────────────────────────────────────────
  const { loading, error, profile } = useProfileView({
    viewerActorId,
    profileActorId,
    canViewContent,
  });

  useActorSeoMeta(profile ?? null);

  // Use server profile when available; seed while loading for instant header.
  const displayProfile = profile ?? seedProfile;

  if (import.meta.env.DEV && seedProfile && !profile) {
    performance.mark("profile:seed-rendered");
  }
  if (import.meta.env.DEV && profile) {
    performance.mark("profile:fetch:end");
    performance.mark("profile:usable");
  }

  // ── Post actions ──────────────────────────────────────────────────────────
  const handlePostDeleted = useCallback(() => {
    qc.invalidateQueries({
      queryKey: queryKeys.profileView(viewerActorId, profileActorId, canViewContent),
    });
    qc.invalidateQueries({ queryKey: queryKeys.actorPosts(profileActorId) });
    setGateVersion((v) => v + 1);
  }, [qc, viewerActorId, profileActorId, canViewContent]);

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

  // ── Render gates ──────────────────────────────────────────────────────────
  // No seed data at all — full skeleton
  if (!displayProfile && (loading || blockLoading || gate.loading)) {
    return (
      <div className="profiles-modern h-full w-full overflow-y-auto touch-pan-y">
        <ActorProfileHeader loading />
      </div>
    );
  }

  // RPC failed and no seed to fall back on
  if (error && !displayProfile) {
    return (
      <div className="profiles-modern flex justify-center py-20 text-rose-300">
        {t('profile.header.failedToLoad')}
      </div>
    );
  }

  const resolvedProfile = displayProfile;
  const isCitizenProfile = resolvedProfile?.kind === "user";
  const isProfileOwner =
    Boolean(viewerActorId) &&
    Boolean(resolvedProfile?.actorId) &&
    viewerActorId === resolvedProfile.actorId;

  // Content area waits for security checks regardless of seed availability.
  const contentReady = !blockLoading && !gate.loading;

  return (
    <div className="profiles-modern h-full w-full overflow-y-auto touch-pan-y">
      {/* Header renders immediately from seed or confirmed profile */}
      <ActorProfileHeader
        profile={resolvedProfile}
        viewerActorId={viewerActorId}
        profileIsPrivate={gate.isPrivate}
        onSubscriptionChanged={() => setGateVersion((v) => v + 1)}
      />

      {contentReady && (
        <>
          <ActorProfileTabs tab={tab} setTab={setTab} includeTags={isCitizenProfile} />

          {!gate.canView && (
            <PrivateProfileNotice
              actor={{
                id: resolvedProfile?.actorId ?? profileActorId ?? null,
                kind: resolvedProfile?.kind ?? "user",
                displayName: resolvedProfile?.displayName ?? "Citizen",
                username: resolvedProfile?.username ?? "",
                avatar: resolvedProfile?.avatarUrl ?? "/avatar.jpg",
                route: `/profile/${resolvedProfile?.actorId ?? profileActorId}`,
              }}
              onRequestFollow={gate.requestFollow}
              canMessage={false}
            />
          )}

          {gate.canView && (
            <div className="profiles-shell px-4 pb-24">
              <div
                style={{ display: tab === "posts" ? undefined : "none" }}
                aria-hidden={tab !== "posts"}
              >
                <ActorProfilePostsView
                  profileActorId={resolvedProfile.actorId}
                  onShare={handleShare}
                  onOpenMenu={openPostMenu}
                />
              </div>

              {tab === "photos" && (
                <ActorProfilePhotosView
                  actorId={resolvedProfile.actorId}
                  viewerActorId={viewerActorId}
                  canViewContent={gate.canView}
                  handleShare={handleShare}
                />
              )}

              {tab === "videos" && (
                <div className="flex items-center justify-center py-10 text-white/40">
                  {t('profile.header.videosSoon')}
                </div>
              )}

              {isCitizenProfile && tab === "tags" && (
                <ActorProfileTagsView actorId={resolvedProfile.actorId} canAddTag={isProfileOwner} />
              )}

              {tab === "friends" && (
                <ActorProfileFriendsView
                  profileActorId={resolvedProfile.actorId}
                  canViewContent={gate.canView}
                  version={gateVersion}
                />
              )}
            </div>
          )}
        </>
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
