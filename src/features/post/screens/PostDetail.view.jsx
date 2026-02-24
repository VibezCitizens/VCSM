// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\screens\PostDetail.view.jsx

import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback, useRef } from "react";

import { useIdentity } from "@/state/identity/identityContext";

import ReportModal from "@/features/moderation/components/ReportModal";
import PostActionsMenu from "@/features/post/postcard/components/PostActionsMenu";

import PostHeader from "@/features/post/postcard/components/PostHeader";
import PostBody from "@/features/post/postcard/components/PostBody";
import MediaCarousel from "@/features/post/postcard/components/MediaCarousel";
import ReactionBar from "@/features/post/postcard/components/ReactionBar";

import { usePostCommentCount } from "@/features/post/commentcard/hooks/usePostCommentCount";
import CommentList from "@/features/post/commentcard/components/CommentList";
import CommentInputView from "@/features/post/commentcard/ui/CommentInput.view";

import useCommentThread from "@/features/post/commentcard/hooks/useCommentThread";
import useCommentCovers from "@/features/post/postcard/hooks/useCommentCovers";

import usePostDetailPost from "@/features/post/postcard/hooks/usePostDetailPost";
import usePostDetailMenus from "@/features/post/postcard/hooks/usePostDetailMenus";
import usePostDetailEditing from "@/features/post/postcard/hooks/usePostDetailEditing";
import usePostDetailReplying from "@/features/post/postcard/hooks/usePostDetailReplying";
import usePostDetailReporting from "@/features/post/postcard/hooks/usePostDetailReporting";

import { softDeletePostController } from "@/features/post/postcard/controller/deletePost.controller";
import ReportedObjectCover from "@/features/moderation/components/ReportedObjectCover";

import CommentReplyModal from "@/features/post/commentcard/components/CommentReplyModal";
import CommentComposeModal from "@/features/post/commentcard/components/CommentComposeModal";
import Spinner from "@/shared/components/Spinner";
import "@/features/post/styles/post-modern.css";

function detectIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIPhoneIPadIPod = /iPad|iPhone|iPod/.test(ua);

  const isIPadOS13Plus =
    /Macintosh/.test(ua) &&
    typeof document !== "undefined" &&
    "ontouchend" in document;

  return isIPhoneIPadIPod || isIPadOS13Plus;
}

export default function PostDetailView() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const actorId = identity?.actorId ?? null;

  const commentCount = usePostCommentCount(postId);
  const thread = useCommentThread(postId);

  const { post, loadingPost } = usePostDetailPost(postId);

  const commentCovers = useCommentCovers({
    actorId,
    commentTree: thread.comments || [],
    propagateRootToReplies: true,
  });

  const editing = usePostDetailEditing({
    threadComments: thread.comments,
    onReload: thread.reload,
  });

  const replying = usePostDetailReplying({
    addReply: thread.addReply,
    posting: thread.posting,
  });

  const reporting = usePostDetailReporting({
    actorId,
    postId,
    commentCovers,
  });

  // ============================================================
  // ✅ STABLE HANDLERS
  // ============================================================
  const handleEditPost = useCallback(
    (payload) => {
      const pid = payload?.postId ?? null;
      if (!pid) return;

      const initialText = post?.text ?? "";
      navigate(`/posts/${pid}/edit`, { state: { initialText } });
    },
    [navigate, post?.text]
  );

  const handleDeletePost = useCallback(
    async (payload) => {
      const pid = payload?.postId ?? null;
      if (!actorId) return;
      if (!pid) return;

      const okConfirm = window.confirm("Delete this Vibe?");
      if (!okConfirm) return;

      const res = await softDeletePostController({
        actorId,
        postId: pid,
      });

      if (!res.ok) {
        window.alert(res.error?.message ?? "Failed to delete Vibe");
        return;
      }

      navigate(-1);
    },
    [actorId, navigate]
  );

  const menus = usePostDetailMenus({
    actorId,
    postId,
    thread,
    onReportPost: reporting.openReportPost,
    onEditPost: handleEditPost,
    onDeletePost: handleDeletePost,
    onReportComment: reporting.openReportComment,
    onEditComment: editing.startEditFromCommentId,
    onDeleteComment: editing.deleteCommentById,
  });

  // ============================================================
  // ✅ iOS detection + modal state (ABOVE early returns)
  // ============================================================
  const isIOS = useMemo(() => detectIOS(), []);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  // ✅ refs for focus DURING tap gesture
  const replyRef = useRef(null);
  const composeRef = useRef(null);

  // ============================================================
  // ✅ Reply modal (iOS: open + keyboard immediately)
  // ============================================================
  const openReply = useCallback(
    (commentId) => {
      replying.startReply(commentId);

      if (!isIOS) return;

      // open modal
      setReplyModalOpen(true);

      // focus during same gesture (best effort for iOS keyboard)
      replyRef.current?.focus?.();
      queueMicrotask(() => replyRef.current?.focus?.());
      setTimeout(() => replyRef.current?.focus?.(), 0);
    },
    [replying, isIOS]
  );

  const closeReplyModal = useCallback(() => {
    setReplyModalOpen(false);
    replying.cancelReply();
  }, [replying]);

  const submitReplyFromModal = useCallback(
    (text) => {
      replying.submitReply(text);
      setReplyModalOpen(false);
    },
    [replying]
  );

  // ============================================================
  // ✅ Top-level compose modal (iOS: open + keyboard immediately)
  // ============================================================
  const openCompose = useCallback(() => {
    if (!isIOS) return;

    setComposeOpen(true);

    composeRef.current?.focus?.();
    queueMicrotask(() => composeRef.current?.focus?.());
    setTimeout(() => composeRef.current?.focus?.(), 0);
  }, [isIOS]);

  const closeCompose = useCallback(() => {
    setComposeOpen(false);
  }, []);

  const submitCompose = useCallback(
    (text) => {
      thread.addComment(text);
      setComposeOpen(false);
    },
    [thread]
  );

  // ============================================================
  // ✅ Early returns AFTER all hooks
  // ============================================================
  if (loadingPost) {
    return (
      <div className="p-6">
        <Spinner label="Loading Vibes..." />
      </div>
    );
  }

  if (!post) {
    return <div className="p-6 text-center text-neutral-500">Vibes not found</div>;
  }

  const isCovered =
    String(reporting.reportedPostId ?? "") === String(postId ?? "");
  const coveredCommentIds = commentCovers.coveredIds;

  const locationText = String(post.location_text ?? post.locationText ?? "").trim();

  const postActorId =
    post.actorId ?? post.actor?.actorId ?? post.actor?.id ?? post.actor_id ?? null;
  const postActorRef = post.actor ?? postActorId;

  return (
    <div className="post-modern h-full w-full overflow-y-auto touch-pan-y relative">
      <div className="w-full max-w-2xl mx-auto pb-24">
        <div className="post-card rounded-2xl overflow-hidden mb-4">
          <PostHeader
            actor={postActorRef}
            createdAt={post.created_at}
            locationText={locationText}
            postId={post.id}
            onOpenMenu={menus.openPostMenu}
          />

          <div className="px-4 pb-3">
            <PostBody text={post.text} mentionMap={post.mentionMap || {}} />
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

        <div className="post-subcard rounded-2xl border">
          <div className="px-4 py-3 border-b border-violet-300/10 text-sm text-slate-400">
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
              onOpenMenu={menus.openCommentMenu}
              coveredCommentIds={coveredCommentIds}
              editingCommentId={editing.editingCommentId}
              editingInitialText={editing.editingInitialText}
              onCancelInlineEdit={editing.cancelInlineEdit}
              onEditedSaved={editing.onEditedSaved}

              // ✅ desktop keeps inline reply; iOS uses modal
              replyingToCommentId={isIOS ? null : replying.replyingToCommentId}
              onReplyStart={openReply}
              onReplyCancel={isIOS ? undefined : replying.cancelReply}
              onReplySubmit={isIOS ? undefined : replying.submitReply}
              postingReply={thread.posting}
            />
          </div>

          {/* ✅ Bottom composer */}
          {thread.actorId && identity && (
            <>
              {!isIOS && (
                <CommentInputView
                  key={thread.actorId}
                  actorId={thread.actorId}
                  identity={identity}
                  onSubmit={thread.addComment}
                  disabled={thread.posting}
                />
              )}

              {isIOS && (
                <div className="px-3 py-3 border-t border-violet-300/10 bg-[#0f0c1a]/70 flex justify-end">
                  <button
                    type="button"
                    onClick={openCompose}
                    disabled={thread.posting}
                    className={
                      thread.posting
                        ? "bg-neutral-800 text-neutral-500 px-4 py-1.5 rounded-full text-sm cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white px-4 py-1.5 rounded-full text-sm shadow-[0_0_14px_rgba(196,124,255,0.45)]"
                    }
                  >
                    Spark
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ✅ iOS reply modal (with ref for focus) */}
      <CommentReplyModal
        ref={replyRef}
        open={replyModalOpen}
        submitting={!!thread.posting}
        onClose={closeReplyModal}
        onSubmit={submitReplyFromModal}
      />

      {/* ✅ iOS top-level compose modal (with ref for focus) */}
      <CommentComposeModal
        ref={composeRef}
        open={composeOpen}
        submitting={!!thread.posting}
        onClose={closeCompose}
        onSubmit={submitCompose}
      />

      <PostActionsMenu
        open={!!menus.postMenu}
        anchorRect={menus.postMenu?.anchorRect}
        isOwn={!!menus.postMenu?.isOwn}
        onClose={menus.closePostMenu}
        onReport={menus.handleReportPostClick}
        onEdit={menus.handleEditPostClick}
        onDelete={menus.handleDeletePostClick}
      />

      <PostActionsMenu
        open={!!menus.commentMenu}
        anchorRect={menus.commentMenu?.anchorRect}
        isOwn={!!menus.commentMenu?.isOwn}
        onClose={menus.closeCommentMenu}
        onEdit={menus.handleEditCommentClick}
        onDelete={menus.handleDeleteCommentClick}
        onReport={menus.handleReportCommentClick}
      />

      <ReportModal
  open={reporting.reportFlow.open}
  title={reporting.reportFlow.context?.title ?? "Report"}
  subtitle={reporting.reportFlow.context?.subtitle ?? null}
  loading={reporting.reportFlow.loading}
  onClose={reporting.reportFlow.close}
  onSubmit={async (payload) => {
    try {
      await reporting.handleReportSubmit(payload);
    } catch {
      reporting.clearReportedPost?.();
    }
  }}
/>


      <ReportedObjectCover
        open={isCovered}
        title="Report sent"
        subtitle="You reported this Vibe. It’s now hidden for you while we review it."
        primaryLabel="Back To Central Citizen"
        onPrimary={() => navigate(-1)}
        secondaryLabel="Close"
        onSecondary={reporting.clearReportedPost}
      />
    </div>
  );
}
