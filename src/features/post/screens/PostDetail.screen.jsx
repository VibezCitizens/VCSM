// ============================================================
// PostDetail Screen
// ============================================================

import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

import { useIdentity } from "@/state/identity/identityContext";

// ✅ report flow
import useReportFlow from "@/features/moderation/hooks/useReportFlow";

// ✅ report modal
import ReportModal from "@/features/moderation/components/ReportModal";

// ✅ actions menu (reused for posts + comments)
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

// ✅ comment delete DAL (you already have this)
import { deleteComment } from "@/features/post/commentcard/dal/comments.dal";

// Data
import { getPostById } from "@/features/post/postcard/controller/getPostById.controller";

export default function PostDetailScreen() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const actorId = identity?.actorId ?? null;

  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);

  const commentCount = usePostCommentCount(postId);
  const thread = useCommentThread(postId);

  // ✅ report flow
  const reportFlow = useReportFlow({ reporterActorId: actorId });

  // ✅ Cover: hide the post after the user reports it
  const [reportedPostId, setReportedPostId] = useState(null);

  // ============================================================
  // ✅ POST ••• MENU STATE
  // ============================================================
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

  // ============================================================
  // ✅ COMMENT ••• MENU STATE (CENTRALIZED)
  // ============================================================
  const [commentMenu, setCommentMenu] = useState(null);
  // commentMenu = { commentId, commentActorId, isOwn, anchorRect } | null

  const openCommentMenu = useCallback(
    ({ commentId, commentActorId, anchorRect }) => {
      if (!commentId || !anchorRect) return;

      setCommentMenu({
        commentId,
        commentActorId: commentActorId ?? null,
        isOwn: (commentActorId ?? null) === (actorId ?? null),
        anchorRect,
      });
    },
    [actorId]
  );

  const closeCommentMenu = useCallback(() => {
    setCommentMenu(null);
  }, []);

  const handleReportComment = useCallback(() => {
    if (!actorId) return;
    if (!commentMenu?.commentId) return;

    reportFlow.start({
      objectType: "comment",
      objectId: commentMenu.commentId,
      postId,
      dedupeKey: `report:comment:${commentMenu.commentId}`,
      title: "Report comment",
      subtitle: "Tell us what’s wrong with this comment.",
    });

    closeCommentMenu();
  }, [actorId, commentMenu, reportFlow, closeCommentMenu, postId]);

  const handleDeleteComment = useCallback(async () => {
    if (!actorId) return;
    if (!commentMenu?.commentId) return;

    const okConfirm = window.confirm("Delete this comment?");
    if (!okConfirm) return;

    try {
      await deleteComment(commentMenu.commentId);
      await thread.reload?.();
      closeCommentMenu();
    } catch (err) {
      console.error("[PostDetail] delete comment failed:", err);
      window.alert("Failed to delete comment");
    }
  }, [actorId, commentMenu, thread, closeCommentMenu]);

  // ============================================================
  // ✅ INLINE EDIT STATE (CENTRALIZED, INSTA FEEL)
  // ============================================================
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingInitialText, setEditingInitialText] = useState("");

  const cancelInlineEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditingInitialText("");
  }, []);

  const handleEditComment = useCallback(() => {
    if (!commentMenu?.commentId) return;

    const target = thread.comments?.find((c) => c?.id === commentMenu.commentId);
    const initial = target?.content ?? "";

    setEditingCommentId(commentMenu.commentId);
    setEditingInitialText(initial);

    closeCommentMenu();
  }, [commentMenu, thread.comments, closeCommentMenu]);

  const handleEditedSaved = useCallback(async () => {
    await thread.reload?.();
    cancelInlineEdit();
  }, [thread, cancelInlineEdit]);

  // ============================================================
  // ✅ REPORT SUBMIT WRAPPER → COVER POST AFTER SUCCESS
  // ============================================================
  const handleReportSubmit = useCallback(
    async (payload) => {
      try {
        const res = await reportFlow.submit?.(payload);

        // If hook returns {ok:false}, don't cover
        if (res && res.ok === false) return;

        // Cover only when reporting a POST
        if (reportFlow.context?.objectType === "post") {
          setReportedPostId(reportFlow.context?.objectId ?? postId);
        }

        reportFlow.close?.();
      } catch (err) {
        // submit failed → keep modal open and let your hook show errors (if any)
        console.error("[PostDetail] report submit failed:", err);
      }
    },
    [reportFlow, postId]
  );

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
    return <div className="p-6 text-center text-neutral-400">Loading post…</div>;
  }

  if (!post) {
    return <div className="p-6 text-center text-neutral-500">Post not found</div>;
  }

  const isCovered = reportedPostId === postId;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="h-full w-full overflow-y-auto touch-pan-y relative">
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
            <ReactionBar postId={post.id} commentCount={commentCount} />
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

            <CommentList
              comments={thread.comments}
              viewerActorId={actorId}
              onOpenMenu={openCommentMenu} // ✅ centralized menu opener

              // ✅ inline edit control
              editingCommentId={editingCommentId}
              editingInitialText={editingInitialText}
              onCancelInlineEdit={cancelInlineEdit}
              onEditedSaved={handleEditedSaved}
            />
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

      {/* ✅ COMMENT ••• MENU (ONLY ONE MENU NOW) */}
      <PostActionsMenu
        open={!!commentMenu}
        anchorRect={commentMenu?.anchorRect}
        isOwn={!!commentMenu?.isOwn}
        onClose={closeCommentMenu}
        onEdit={handleEditComment}
        onDelete={handleDeleteComment}
        onReport={handleReportComment}
      />

      {/* ✅ REPORT MODAL (keep your code, just wrap submit) */}
      <ReportModal
        open={reportFlow.open}
        title={reportFlow.context?.title ?? "Report"}
        subtitle={reportFlow.context?.subtitle ?? null}
        loading={reportFlow.loading}
        onClose={reportFlow.close}
        onSubmit={handleReportSubmit}
      />

      {/* ✅ COVER AFTER REPORT (POST ONLY) */}
      {isCovered && (
        <div className="fixed inset-0 z-[999998] bg-black flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <div className="text-lg font-semibold text-white">Report sent</div>
            <div className="text-sm text-neutral-400 mt-2">
              You reported this post. It’s now hidden for you while we review it.
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl bg-white text-black py-2.5 font-semibold"
                onClick={() => navigate(-1)}
              >
                Go back
              </button>

              <button
                type="button"
                className="flex-1 rounded-xl border border-neutral-700 text-white py-2.5 font-semibold"
                onClick={() => setReportedPostId(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
