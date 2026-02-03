// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\screens\PostDetail.view.jsx

import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

// ✅ Fullscreen thanks/cover UI
import ReportedObjectCover from "@/features/moderation/components/ReportedObjectCover";

export default function PostDetailView() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const actorId = identity?.actorId ?? null;

  const commentCount = usePostCommentCount(postId);
  const thread = useCommentThread(postId);

  // ✅ Post loading
  const { post, loadingPost } = usePostDetailPost(postId);

  // ✅ comment covers (server + local)
  const commentCovers = useCommentCovers({
    actorId,
    commentTree: thread.comments || [],
    propagateRootToReplies: true,
  });

  // ✅ editing orchestration
  const editing = usePostDetailEditing({
    threadComments: thread.comments,
    onReload: thread.reload,
  });

  // ✅ replying orchestration
  const replying = usePostDetailReplying({
    addReply: thread.addReply,
    posting: thread.posting,
  });

  // ✅ report orchestration (post cover + comment cover persistence)
  const reporting = usePostDetailReporting({
    actorId,
    postId,
    commentCovers,
  });

  // ✅ menus orchestration
  const menus = usePostDetailMenus({
    actorId,
    postId,
    thread,
    onReportPost: reporting.openReportPost,
    onReportComment: reporting.openReportComment,
    onEditComment: editing.startEditFromCommentId,
    onDeleteComment: editing.deleteCommentById,
  });

  if (loadingPost) {
    return <div className="p-6 text-center text-neutral-400">Loading Vibes…</div>;
  }

  if (!post) {
    return <div className="p-6 text-center text-neutral-500">Vibes not found</div>;
  }

  const isCovered = String(reporting.reportedPostId ?? "") === String(postId ?? "");
  const coveredCommentIds = commentCovers.coveredIds;

  // ✅ LOCATION normalize for Header
  const locationText = String(post.location_text ?? post.locationText ?? "").trim();


  // ✅ ACTOR normalize safely
  const postActorId = post.actorId ?? post.actor?.actorId ?? post.actor?.id ?? post.actor_id ?? null;

  return (
    <div className="h-full w-full overflow-y-auto touch-pan-y relative">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl mx-auto pb-24"
      >
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden mb-4">
          <PostHeader
            actor={postActorId}
            createdAt={post.created_at}
            locationText={locationText}
            postId={post.id}
            onOpenMenu={menus.openPostMenu}
          />

          <div className="px-4 pb-3">
            <PostBody
              text={post.text}
              mentionMap={post.mentionMap || {}}
            />
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
              onOpenMenu={menus.openCommentMenu}
              coveredCommentIds={coveredCommentIds}
              editingCommentId={editing.editingCommentId}
              editingInitialText={editing.editingInitialText}
              onCancelInlineEdit={editing.cancelInlineEdit}
              onEditedSaved={editing.onEditedSaved}
              replyingToCommentId={replying.replyingToCommentId}
              onReplyStart={replying.startReply}
              onReplyCancel={replying.cancelReply}
              onReplySubmit={replying.submitReply}
              postingReply={thread.posting}
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

      <PostActionsMenu
        open={!!menus.postMenu}
        anchorRect={menus.postMenu?.anchorRect}
        isOwn={!!menus.postMenu?.isOwn}
        onClose={menus.closePostMenu}
        onReport={menus.handleReportPostClick}
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
          const ctx = reporting.reportFlow.context;
          const objectType = ctx?.objectType ?? null;
          const objectId = ctx?.objectId ?? null;

          if (objectType === "post" && objectId) {
            // optimistic cover is handled in your reporting hook flow
          }

          try {
            await reporting.handleReportSubmit(payload);
          } catch (e) {
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
