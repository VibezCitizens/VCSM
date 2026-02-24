// src/features/post/screens/PostFeed.screen.jsx

import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import { useFeed } from "@/features/feed/hooks/useFeed";

import useReportFlow from "@/features/moderation/hooks/useReportFlow";
import ReportModal from "@/features/moderation/components/ReportModal";
import PostActionsMenu from "@/features/post/postcard/components/PostActionsMenu";

import { softDeletePostController } from "@/features/post/postcard/controller/deletePost.controller";
import PostCardView from "@/features/post/postcard/ui/PostCard.view";

import { shareNative } from "@/shared/lib/shareNative";
import ShareModal from "@/features/post/postcard/components/ShareModal";
import "@/features/post/styles/post-modern.css";

// ✅ NEW
import usePostCovers from "@/features/post/postcard/hooks/usePostCovers";
import ReportThanksOverlay from "@/features/moderation/components/ReportThanksOverlay";

export default function PostFeedScreen() {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const actorId = identity?.actorId ?? null;
  const realmId = identity?.realmId ?? null;

  // ✅ FIX: useFeed requires (viewerActorId, realmId)
  const { posts, loading, hasMore, fetchPosts, setPosts, fetchViewer } = useFeed(
    actorId,
    realmId
  );

  const reportFlow = useReportFlow({ reporterActorId: actorId });

  // ✅ rehydrate covered posts for this actor
  const postCovers = usePostCovers({
    actorId,
    postIds: posts.map((p) => p.id),
  });

  const [postMenu, setPostMenu] = useState(null);

  const openPostMenu = useCallback(
    ({ postId, postActorId, anchorRect }) => {
      if (!postId || !anchorRect) return;
      setPostMenu({
        postId,
        postActorId: postActorId ?? null,
        isOwn: (postActorId ?? null) === (actorId ?? null),
        anchorRect,
      });
    },
    [actorId]
  );

  const closePostMenu = useCallback(() => setPostMenu(null), []);

  const handleReportPost = useCallback(() => {
    if (!actorId) return;
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
  }, [actorId, postMenu, reportFlow, closePostMenu]);

  const handleEditPost = useCallback(() => {
    if (!postMenu?.postId) return;

    const post = posts.find((p) => p.id === postMenu.postId);
    const initialText = post?.text ?? "";

    closePostMenu();
    navigate(`/posts/${postMenu.postId}/edit`, { state: { initialText } });
  }, [postMenu, posts, navigate, closePostMenu]);

  const handleDeletePost = useCallback(async () => {
    if (!actorId) return;
    if (!postMenu?.postId) return;

    const okConfirm = window.confirm("Delete this Vibe?");
    if (!okConfirm) return;

    const res = await softDeletePostController({
      actorId,
      postId: postMenu.postId,
    });

    if (!res.ok) {
      window.alert(res.error?.message ?? "Failed to delete Vibe");
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== postMenu.postId));
    closePostMenu();
  }, [actorId, postMenu, setPosts, closePostMenu]);

  const [shareState, setShareState] = useState({
    open: false,
    postId: null,
    url: "",
  });

  const closeShare = useCallback(() => {
    setShareState({ open: false, postId: null, url: "" });
  }, []);

  const handleShare = useCallback(
    async (postId) => {
      if (!postId) return;

      const url = `${window.location.origin}/post/${postId}`;
      const post = posts.find((p) => p.id === postId);
      const text = post?.text ? post.text.slice(0, 140) : "";
      const title = "Spread";

      const res = await shareNative({ title, text, url });
      if (!res.ok) setShareState({ open: true, postId, url });
    },
    [posts]
  );

  useEffect(() => {
    let cancelled = false;

    setPosts([]);

    (async () => {
      await fetchViewer();
      if (!cancelled) {
        await fetchPosts(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorId, realmId, fetchViewer, fetchPosts, setPosts]);

  useEffect(() => {
    if (!hasMore || loading) return;

    function onScroll() {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 600;

      if (nearBottom && !loading && hasMore) {
        fetchPosts(false);
      }
    }

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, hasMore, fetchPosts]);

  return (
    <div className="post-modern w-full max-w-2xl mx-auto pb-24">
      <div className="px-4 py-3 text-lg font-semibold text-slate-100">Feed</div>

      {!loading && posts.length === 0 && (
        <div className="p-6 text-center text-slate-500">No Vibes yet.</div>
      )}

      {posts.map((post) => {
        const covered = postCovers.coveredIds?.has?.(post.id);

        return (
          <div key={`feed-post:${post.id}`} className="mb-3">
            <PostCardView
              post={post}
              onOpenPost={() => navigate(`/post/${post.id}`)}
              onOpenMenu={openPostMenu}
              onShare={handleShare}
              covered={!!covered}
              cover={
                <ReportThanksOverlay
                  variant="post"
                  title="Reported"
                  subtitle="Thanks — we’ll review it. This Vibe is hidden for you."
                />
              }
            />
          </div>
        );
      })}

      <PostActionsMenu
        open={!!postMenu}
        anchorRect={postMenu?.anchorRect}
        isOwn={!!postMenu?.isOwn}
        onClose={closePostMenu}
        onReport={handleReportPost}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />

      <ReportModal
        open={reportFlow.open}
        title={reportFlow.context?.title ?? "Report"}
        subtitle={reportFlow.context?.subtitle ?? null}
        loading={reportFlow.loading}
        onClose={reportFlow.close}
        onSubmit={async (payload) => {
          await reportFlow.submit(payload);
          // refresh covers after reporting so feed updates immediately
          await postCovers.refresh?.();
        }}
      />

      <ShareModal
        open={shareState.open}
        title="Spread"
        url={shareState.url}
        onClose={closeShare}
      />

      {loading && <div className="p-6 text-center text-slate-500">Loading...</div>}

      {!hasMore && posts.length > 0 && !loading && (
        <div className="p-6 text-center text-slate-600 text-sm">
          You reached the end.
        </div>
      )}
    </div>
  );
}
