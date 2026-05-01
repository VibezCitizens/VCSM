import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";

import { useIdentity } from "@/features/identity/adapters/identity.adapter";

import PostHeader from "@/features/post/postcard/components/PostHeader";
import PostBody from "@/features/post/postcard/components/PostBody";
import MediaCarousel from "@/features/post/postcard/components/MediaCarousel";
import ReactionBar from "@/features/post/postcard/components/ReactionBar";

import { usePostCommentCount } from "@/features/post/commentcard/hooks/usePostCommentCount";
import useCommentThread from "@/features/post/commentcard/hooks/useCommentThread";
import useCommentCovers from "@/features/post/postcard/hooks/useCommentCovers";

import usePostDetailPost from "@/features/post/postcard/hooks/usePostDetailPost";
import usePostDetailMenus from "@/features/post/postcard/hooks/usePostDetailMenus";
import usePostDetailEditing from "@/features/post/postcard/hooks/usePostDetailEditing";
import usePostDetailReplying from "@/features/post/postcard/hooks/usePostDetailReplying";
import usePostDetailReporting from "@/features/post/postcard/hooks/usePostDetailReporting";
import { useDeletePostAction } from "@/features/post/postcard/hooks/useDeletePostAction";

import Spinner from "@/shared/components/Spinner";
import "@/features/post/styles/post-modern.css";
import "@/features/profiles/styles/profiles-modern.css";

import { detectIOS } from "@/features/post/screens/utils/detectIOS";
import { PostDetailSparksSection } from "@/features/post/screens/components/PostDetailSparksSection";
import { PostDetailModals } from "@/features/post/screens/components/PostDetailModals";

export default function PostDetailView() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const actorId = identity?.actorId ?? null;
  const deletePost = useDeletePostAction({ actorId });
  const confirmResolverRef = useRef(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    tone: "danger",
  });

  const closeConfirm = useCallback((accepted) => {
    const resolve = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setConfirmState((prev) => ({ ...prev, open: false }));
    if (typeof resolve === "function") resolve(Boolean(accepted));
  }, []);

  const requestConfirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({
        open: true,
        title: options.title ?? "Confirm",
        message: options.message ?? "Are you sure?",
        confirmLabel: options.confirmLabel ?? "Confirm",
        cancelLabel: options.cancelLabel ?? "Cancel",
        tone: options.tone ?? "danger",
      });
    });
  }, []);

  const commentCount = usePostCommentCount(postId);
  const thread = useCommentThread(postId);
  const { post, loadingPost } = usePostDetailPost(postId);

  const commentCovers = useCommentCovers({
    actorId,
    commentTree: thread.comments || [],
    propagateRootToReplies: true,
  });

  const editing = usePostDetailEditing({
    actorId,
    threadComments: thread.comments,
    onReload: thread.reload,
    confirmAction: requestConfirm,
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
      const okConfirm = await requestConfirm({
        title: "Delete Vibe",
        message: "Delete this Vibe?",
        confirmLabel: "Delete",
        tone: "danger",
      });
      if (!okConfirm) return;
      const res = await deletePost({ postId: pid });
      if (!res.ok) {
        window.alert(res.error?.message ?? "Failed to delete Vibe");
        return;
      }
      navigate(-1);
    },
    [actorId, navigate, deletePost, requestConfirm]
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

  const isIOS = useMemo(() => detectIOS(), []);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    return () => {
      const resolve = confirmResolverRef.current;
      confirmResolverRef.current = null;
      if (typeof resolve === "function") resolve(false);
    };
  }, []);

  const replyRef = useRef(null);
  const composeRef = useRef(null);

  const openReply = useCallback(
    (commentId) => {
      replying.startReply(commentId);
      if (!isIOS) return;
      setReplyModalOpen(true);
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

  if (loadingPost) {
    return (
      <div className="p-6">
        <Spinner label="Loading Vibes..." />
      </div>
    );
  }

  if (!post) {
    return <div className="p-6 text-center text-white/40">Vibes not found</div>;
  }

  const isCovered = String(reporting.reportedPostId ?? "") === String(postId ?? "");
  const coveredCommentIds = commentCovers.coveredIds;
  const locationText = String(post.location_text ?? post.locationText ?? "").trim();
  const postActorId = post.actorId ?? post.actor?.actorId ?? post.actor?.id ?? post.actor_id ?? null;
  const postActorRef = post.actor ?? postActorId;

  return (
    <div className="post-modern profiles-modern h-full w-full overflow-y-auto touch-auto relative">
      <div className="w-full max-w-2xl mx-auto pb-24">
        <div className="post-card profiles-card rounded-2xl overflow-hidden mb-4">
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

        <PostDetailSparksSection
          thread={thread}
          isIOS={isIOS}
          editing={editing}
          replying={replying}
          menus={menus}
          coveredCommentIds={coveredCommentIds}
          identity={identity}
          actorId={actorId}
          openCompose={openCompose}
          openReply={openReply}
        />
      </div>

      <PostDetailModals
        replyRef={replyRef}
        replyModalOpen={replyModalOpen}
        submitting={!!thread.posting}
        closeReplyModal={closeReplyModal}
        submitReplyFromModal={submitReplyFromModal}
        composeRef={composeRef}
        composeOpen={composeOpen}
        closeCompose={closeCompose}
        submitCompose={submitCompose}
        menus={menus}
        reporting={reporting}
        confirmState={confirmState}
        closeConfirm={closeConfirm}
        isCovered={isCovered}
        navigate={navigate}
      />
    </div>
  );
}
