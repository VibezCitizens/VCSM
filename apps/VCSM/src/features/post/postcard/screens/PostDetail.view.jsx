import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";

import { useIdentity } from "@/features/identity/adapters/identity.adapter";

import PostHeader from "@/features/post/postcard/components/PostHeader";
import PostBody from "@/features/post/postcard/components/PostBody";
import MediaCarousel from "@/features/post/postcard/components/MediaCarousel";
import ReactionBar from "@/features/post/postcard/components/ReactionBar";

import { usePostCommentCount, useCommentThread } from "@/features/post/commentcard/adapters/commentcard.adapter";
import useCommentCovers from "@/features/post/postcard/hooks/useCommentCovers";

import usePostDetailPost from "@/features/post/postcard/hooks/usePostDetailPost";
import usePostDetailMenus from "@/features/post/postcard/hooks/usePostDetailMenus";
import usePostDetailEditing from "@/features/post/postcard/hooks/usePostDetailEditing";
import usePostDetailReplying from "@/features/post/postcard/hooks/usePostDetailReplying";
import usePostDetailReporting from "@/features/post/postcard/hooks/usePostDetailReporting";
import { useDeletePostAction } from "@/features/post/postcard/hooks/useDeletePostAction";
import { useActorSummary } from "@/state/actors/useActorSummary";
import { FuelPricesPostModule } from "@/features/post/postcard/postModules/fuelPrices";
import { ExchangeRatesPostModule } from "@/features/post/postcard/postModules/exchangeRates";
import { MenuDropPostModule } from "@/features/post/postcard/postModules/menuDrop";
import { BarbershopPortfolioPostModule } from "@/features/post/postcard/postModules/barbershopPortfolio";
import { BarbershopHoursPostModule } from "@/features/post/postcard/postModules/barbershopHours";
import { LocksmithPortfolioPostModule } from "@/features/post/postcard/postModules/locksmithPortfolio";
import { LocksmithHoursPostModule } from "@/features/post/postcard/postModules/locksmithHours";
import { LocksmithServiceAreaPostModule } from "@/features/post/postcard/postModules/locksmithServiceArea";

import Spinner from "@/shared/components/Spinner";
import "@/features/post/styles/post-modern.css";
import "@/shared/styles/profiles-modern.css";

import { detectIOS } from "@/features/post/postcard/screens/utils/detectIOS";
import { PostDetailSparksSection } from "@/features/post/postcard/screens/components/PostDetailSparksSection";
import { PostDetailModals } from "@/features/post/postcard/screens/components/PostDetailModals";

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
  const { post, loadingPost } = usePostDetailPost(postId, actorId);
  const rawPostActorId = post?.actorId ?? post?.actor?.actorId ?? post?.actor?.id ?? post?.actor_id ?? null;
  const actorSummary = useActorSummary(rawPostActorId);

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

  const postType = post.post_type ?? "post";
  const isFuelPost = postType === "fuel_price_update";
  const isExchangePost = postType === "exchange_rate_update";
  const isMenuPost = postType === "menu_update";
  const isBarbershopPortfolioPost = postType === "barbershop_portfolio_update";
  const isBarbershopHoursPost = postType === "barbershop_hours_update";
  const isLocksmithPortfolioPost = postType === "locksmith_portfolio_update";
  const isLocksmithHoursPost = postType === "locksmith_hours_update";
  const isLocksmithServiceAreaPost = postType === "locksmith_service_area_update";
  const actorRoute = actorSummary?.route ?? null;
  const menuUrl = isMenuPost && actorRoute ? `${actorRoute}/menu` : null;

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
          {isFuelPost ? (
            <FuelPricesPostModule text={post.text} payload={post.payload ?? null} stationRoute={actorRoute} />
          ) : isExchangePost ? (
            <ExchangeRatesPostModule text={post.text} payload={post.payload ?? null} exchangeRoute={actorRoute} />
          ) : isMenuPost ? (
            <MenuDropPostModule text={post.text} payload={post.payload ?? null} media={post.media} menuUrl={menuUrl} />
          ) : isBarbershopPortfolioPost ? (
            <BarbershopPortfolioPostModule text={post.text} payload={post.payload ?? null} media={post.media} actorRoute={actorRoute} />
          ) : isBarbershopHoursPost ? (
            <BarbershopHoursPostModule text={post.text} payload={post.payload ?? null} actorRoute={actorRoute} />
          ) : isLocksmithPortfolioPost ? (
            <LocksmithPortfolioPostModule text={post.text} payload={post.payload ?? null} media={post.media} actorRoute={actorRoute} />
          ) : isLocksmithHoursPost ? (
            <LocksmithHoursPostModule text={post.text} payload={post.payload ?? null} actorRoute={actorRoute} />
          ) : isLocksmithServiceAreaPost ? (
            <LocksmithServiceAreaPostModule text={post.text} payload={post.payload ?? null} actorRoute={actorRoute} />
          ) : (
            <>
              <div className="px-4 pb-3">
                <PostBody text={post.text} mentionMap={post.mentionMap || {}} />
              </div>
              {post.media?.length > 0 && (
                <div className="px-0 pb-3">
                  <MediaCarousel media={post.media} />
                </div>
              )}
            </>
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
