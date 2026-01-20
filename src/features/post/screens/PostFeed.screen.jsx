// src/features/post/screens/PostFeed.screen.jsx
// ============================================================
// PostFeed Screen
// - Displays feed of posts
// - Read-only preview cards
// - Comments handled ONLY in PostDetail
// ============================================================

import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";

// Feed hook (actor-based, READ MODEL)
import { useFeed } from "@/features/feed/hooks/useFeed";

// ✅ report flow
import useReportFlow from "@/features/moderation/hooks/useReportFlow";

// ✅ report modal
import ReportModal from "@/features/moderation/components/ReportModal";

// ✅ post menu
import PostActionsMenu from "@/features/post/postcard/components/PostActionsMenu";

// ✅ delete controller (you already have)
import { softDeletePostController } from "@/features/post/postcard/controller/deletePost.controller";

// UI
import PostCardView from "@/features/post/postcard/ui/PostCard.view";

export default function PostFeedScreen() {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const actorId = identity?.actorId ?? null;

  // ------------------------------------------------------------
  // FEED (READ MODEL ONLY)
  // ------------------------------------------------------------
  const { posts, loading, hasMore, fetchPosts, setPosts, fetchViewer } =
    useFeed(actorId);

  // ------------------------------------------------------------
  // ✅ REPORT FLOW
  // ------------------------------------------------------------
  const reportFlow = useReportFlow({ reporterActorId: actorId });

  // ------------------------------------------------------------
  // ✅ POST ••• MENU STATE
  // ------------------------------------------------------------
  const [postMenu, setPostMenu] = useState(null);
  // postMenu = { postId, postActorId, isOwn, anchorRect } | null

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

  const closePostMenu = useCallback(() => {
    setPostMenu(null);
  }, []);

  const handleReportPost = useCallback(() => {
    if (!actorId) return;
    if (!postMenu?.postId) return;

    reportFlow.start({
      objectType: "post",
      objectId: postMenu.postId,

      postId: postMenu.postId,

      dedupeKey: `report:post:${postMenu.postId}`,

      title: "Report post",
      subtitle: "Tell us what’s wrong with this post.",
    });

    closePostMenu();
  }, [actorId, postMenu, reportFlow, closePostMenu]);

  // ------------------------------------------------------------
  // ✅ EDIT
  // ------------------------------------------------------------
  const handleEditPost = useCallback(() => {
    if (!postMenu?.postId) return;

    // optional: pass initial text to edit screen
    const post = posts.find((p) => p.id === postMenu.postId);
    const initialText = post?.text ?? "";

    closePostMenu();
    navigate(`/posts/${postMenu.postId}/edit`, { state: { initialText } });
  }, [postMenu, posts, navigate, closePostMenu]);

  // ------------------------------------------------------------
  // ✅ DELETE (SOFT DELETE)
  // ------------------------------------------------------------
  const handleDeletePost = useCallback(async () => {
    if (!actorId) return;
    if (!postMenu?.postId) return;

    const okConfirm = window.confirm("Delete this post?");
    if (!okConfirm) return;

    const res = await softDeletePostController({
      actorId,
      postId: postMenu.postId,
    });

    if (!res.ok) {
      window.alert(res.error?.message ?? "Failed to delete post");
      return;
    }

    // remove from UI immediately
    setPosts((prev) => prev.filter((p) => p.id !== postMenu.postId));

    closePostMenu();
  }, [actorId, postMenu, setPosts, closePostMenu]);

  // ------------------------------------------------------------
  // INITIAL LOAD / ACTOR SWITCH
  // ------------------------------------------------------------
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
  }, [actorId, fetchViewer, fetchPosts, setPosts]);

  // ------------------------------------------------------------
  // INFINITE SCROLL
  // ------------------------------------------------------------
  useEffect(() => {
    if (!hasMore || loading) return;

    function onScroll() {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 600;

      if (nearBottom && !loading && hasMore) {
        fetchPosts(false);
      }
    }

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, hasMore, fetchPosts]);

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="w-full max-w-2xl mx-auto pb-24">
      {/* HEADER */}
      <div className="px-4 py-3 text-lg font-semibold">Feed</div>

      {/* EMPTY */}
      {!loading && posts.length === 0 && (
        <div className="p-6 text-center text-neutral-500">No posts yet.</div>
      )}

      {/* POSTS (READ-ONLY) */}
      {posts.map((post) => (
        <div key={`feed-post:${post.id}`} className="mb-3">
          <PostCardView
            post={post}
            onOpenPost={() => navigate(`/post/${post.id}`)}
            onOpenMenu={openPostMenu}
          />
        </div>
      ))}

      {/* ✅ POST ••• MENU */}
      <PostActionsMenu
        open={!!postMenu}
        anchorRect={postMenu?.anchorRect}
        isOwn={!!postMenu?.isOwn}
        onClose={closePostMenu}
        onReport={handleReportPost}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
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

      {/* LOADING */}
      {loading && (
        <div className="p-6 text-center text-neutral-500">Loading…</div>
      )}

      {/* END */}
      {!hasMore && posts.length > 0 && !loading && (
        <div className="p-6 text-center text-neutral-600 text-sm">
          You reached the end.
        </div>
      )}
    </div>
  );
}
