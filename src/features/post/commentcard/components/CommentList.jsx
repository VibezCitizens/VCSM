// src/features/post/commentcard/components/CommentList.jsx

import React, { useMemo } from "react";
import CommentInputView from "@/features/post/commentcard/ui/CommentInput.view";
import CommentCardContainer from "@/features/post/commentcard/components/CommentCard.container";
import ReportedPostCover from "@/features/moderation/components/ReportThanksOverlay";

function CommentNode({
  comment,
  viewerActorId,
  onOpenMenu,
  coveredCommentIds,

  editingCommentId,
  editingInitialText,
  onCancelInlineEdit,
  onEditedSaved,

  depth,
  replyingToCommentId,
  onReplyStart,
  onReplyCancel,
  onReplySubmit,
  postingReply,

  // ✅ internal: if a ROOT spark above is covered, descendants should NOT render their own covers
  ancestorRootCovered = false,
}) {
  const isCovered = coveredCommentIds?.has?.(comment?.id);

  const hasReplies = Array.isArray(comment?.replies) && comment.replies.length > 0;

  const isRoot = depth === 0;
  const isReplyingHere = isRoot && replyingToCommentId === comment?.id;

  // ✅ root cover should be ONE overlay for the whole group (root + replies)
  const isRootCoveredHere = isRoot && isCovered;

  // ✅ if root is covered, all descendants should suppress their own covers
  const nextAncestorRootCovered = ancestorRootCovered || isRootCoveredHere;

  // ✅ per-card cover logic:
  // - if root group is covered (ancestorRootCovered), do NOT show individual covers on descendants
  // - if this comment is covered AND there is no ancestor root cover, show individual cover (reply-only case)
  const showCardCover = !!isCovered && !ancestorRootCovered && !isRootCoveredHere;

  return (
    <div className={depth === 0 ? "py-2" : "py-2 pl-6"}>
      {/* ✅ wrap ROOT group in relative so we can overlay ONE cover across root + replies */}
      <div className={isRoot ? "relative" : ""}>
        <CommentCardContainer
          rawComment={comment}
          viewerActorId={viewerActorId}
          onOpenMenu={onOpenMenu}
          onReplyStart={isRoot ? onReplyStart : undefined}
          editingCommentId={editingCommentId}
          editingInitialText={editingInitialText}
          onCancelInlineEdit={onCancelInlineEdit}
          onEditedSaved={onEditedSaved}
          // ✅ root cover is handled by group overlay below, not per-card
          covered={showCardCover}
          cover={
            showCardCover ? (
              <ReportedPostCover
                variant="comment"
                title="Reported"
                subtitle="Thanks — we’ll review it. This Spark is hidden for you."
              />
            ) : null
          }
        />

        {/* ✅ Inline reply input for ROOT sparks */}
        {isReplyingHere && (
          <div className="mt-2 ml-2 rounded-2xl border border-neutral-900 overflow-hidden">
            <CommentInputView
              actorId={viewerActorId}
              onSubmit={onReplySubmit}
              disabled={!!postingReply}
              autoFocus
              placeholder="Write a Spark..."
            />
            <div className="px-3 pb-3 bg-black/40 flex justify-end">
              <button
                type="button"
                onClick={onReplyCancel}
                className="text-xs text-neutral-400 hover:text-white transition"
                disabled={!!postingReply}
              >
                Cancel Spark
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {hasReplies ? (
          <div className="mt-2">
            {comment.replies.map((r) => (
              <CommentNode
                key={r.id}
                comment={r}
                viewerActorId={viewerActorId}
                onOpenMenu={onOpenMenu}
                coveredCommentIds={coveredCommentIds}
                editingCommentId={editingCommentId}
                editingInitialText={editingInitialText}
                onCancelInlineEdit={onCancelInlineEdit}
                onEditedSaved={onEditedSaved}
                depth={depth + 1}
                replyingToCommentId={replyingToCommentId}
                onReplyStart={onReplyStart}
                onReplyCancel={onReplyCancel}
                onReplySubmit={onReplySubmit}
                postingReply={postingReply}
                ancestorRootCovered={nextAncestorRootCovered} // ✅ suppress descendant covers when root is covered
              />
            ))}
          </div>
        ) : null}

        {/* ✅ ONE cover for the entire root group (root + replies) */}
        {isRootCoveredHere ? (
          <div
            className="absolute inset-0 z-20"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ReportedPostCover
              variant="comment"
              title="Reported"
              subtitle="Thanks — we’ll review it. This Spark is hidden for you."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CommentList({
  comments = [],
  viewerActorId,
  onOpenMenu,
  coveredCommentIds,

  editingCommentId,
  editingInitialText,
  onCancelInlineEdit,
  onEditedSaved,

  replyingToCommentId,
  onReplyStart,
  onReplyCancel,
  onReplySubmit,
  postingReply,
}) {
  const safeComments = useMemo(
    () => (Array.isArray(comments) ? comments : []),
    [comments]
  );

  return (
    <div className="w-full">
      {safeComments.map((c) => (
        <CommentNode
          key={c.id}
          comment={c}
          viewerActorId={viewerActorId}
          onOpenMenu={onOpenMenu}
          coveredCommentIds={coveredCommentIds}
          editingCommentId={editingCommentId}
          editingInitialText={editingInitialText}
          onCancelInlineEdit={onCancelInlineEdit}
          onEditedSaved={onEditedSaved}
          depth={0}
          replyingToCommentId={replyingToCommentId}
          onReplyStart={onReplyStart}
          onReplyCancel={onReplyCancel}
          onReplySubmit={onReplySubmit}
          postingReply={postingReply}
          ancestorRootCovered={false}
        />
      ))}
    </div>
  );
}
