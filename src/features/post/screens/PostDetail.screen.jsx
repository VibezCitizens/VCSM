// ============================================================
// PostDetail Screen
// ============================================================

import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

import { useIdentity } from "@/state/identity/identityContext";

// ✅ report flow
import useReportFlow from "@/features/moderation/hooks/useReportFlow";

// ✅ report modal
import ReportModal from "@/features/moderation/components/ReportModal";

// ✅ post actions menu
import PostActionsMenu from "@/features/post/postcard/components/PostActionsMenu";

// Post UI
import PostHeader from "@/features/post/postcard/components/PostHeader";
import PostBody from "@/features/post/postcard/components/PostBody";
import MediaCarousel from "@/features/post/postcard/components/MediaCarousel";
import ReactionBar from "@/features/post/postcard/components/ReactionBar";

// Comments
import useCommentThread from "@/features/post/commentcard/hooks/useCommentThread";
import { usePostCommentCount } from "@/features/post/commentcard/hooks/usePostCommentCount";
import CommentList from "@/features/post/commentcard/components/CommentList";
import CommentInputView from "@/features/post/commentcard/ui/CommentInput.view";

// Data
import { getPostById } from "@/features/post/postcard/controller/getPostById.controller";

export default function PostDetailScreen() {
  const { postId } = useParams();
  const { identity } = useIdentity();

  const actorId = identity?.actorId ?? null;

  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);

  const commentCount = usePostCommentCount(postId);
  const thread = useCommentThread(postId);

  // ✅ report flow
  const reportFlow = useReportFlow({ reporterActorId: actorId });

  // ✅ post ••• menu state
  const [postMenu, setPostMenu] = useState(null);
  // postMenu = { postId, postActorId, isOwn, anchorRect } | null

  const openPostMenu = useCallback(
    ({ postId: pid, postActorId, anchorRect }) => {
      if (!pid || !anchorRect) return;
      setPostMenu({
        postId: pid,
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

  /* ============================================================
     LOAD POST
     ============================================================ */
  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      if (!postId) return;

      setLoadingPost(true);
      try {
        const data = await getPostById(postId);
        if (!cancelled) setPost(data);
      } catch (err) {
        console.error("[PostDetail] load post failed:", err);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    }

    loadPost();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  /* ============================================================
     STATES
     ============================================================ */
  if (loadingPost) {
    return (
      <div className="p-6 text-center text-neutral-400">
        Loading post…
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6 text-center text-neutral-500">
        Post not found
      </div>
    );
  }

  /* ============================================================
     RENDER (IMPORTANT PART)
     ============================================================ */
  return (
    /* 🔑 THIS IS THE SCROLL OWNER */
    <div
      className="
        h-full
        w-full
        overflow-y-auto
        touch-pan-y
      "
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl mx-auto pb-24"
      >
        {/* ================= POST ================= */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden mb-4">
          <PostHeader
            actor={post.actor.actorId}
            createdAt={post.created_at}
            postId={post.id}
            onOpenMenu={openPostMenu}
          />

          <div className="px-4 pb-3">
            <PostBody text={post.text} />
          </div>

          {post.media?.length > 0 && (
            <div className="px-0 pb-3">
              <MediaCarousel media={post.media} />
            </div>
          )}

          <div className="px-4 pb-3">
            <ReactionBar
              postId={post.id}
              commentCount={commentCount}
            />
          </div>
        </div>

        {/* ================= COMMENTS ================= */}
        <div className="bg-black/40 rounded-2xl border border-neutral-900">
          <div className="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-400">
            Sparks
          </div>

          <div className="px-2">
            {thread.loading && (
              <div className="py-6 text-center text-neutral-500 text-sm">
                Loading sparks…
              </div>
            )}

            {!thread.loading && thread.comments.length === 0 && (
              <div className="py-6 text-center text-neutral-500 text-sm">
                No sparks yet. Be the first.
              </div>
            )}

            <CommentList comments={thread.comments} />
          </div>

          {thread.actorId && identity && (
            <CommentInputView
              key={thread.actorId}
              actorId={thread.actorId}
              identity={identity}
              onSubmit={thread.addComment}
              disabled={thread.posting}
            />
          )}
        </div>
      </motion.div>

      {/* ✅ POST ••• MENU */}
      <PostActionsMenu
        open={!!postMenu}
        anchorRect={postMenu?.anchorRect}
        isOwn={!!postMenu?.isOwn}
        onClose={closePostMenu}
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
    </div>
  );
}
