import React from "react";
import { CommentList, CommentInputView } from "@/features/post/commentcard/adapters/commentcard.adapter";

function CommentsSkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3 px-2 py-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`comment-skeleton:${i}`}
          className="rounded-2xl border border-white/6 px-3 py-3"
          style={{ background: 'var(--vc-card-bg)' }}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl" style={{ background: 'rgba(139,92,246,0.08)' }} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-28 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.1)' }} />
              <div className="h-2 w-20 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.07)' }} />
            </div>
          </div>
          <div className="mt-3 space-y-2 pl-[52px]">
            <div className="h-3 w-11/12 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.08)' }} />
            <div className="h-3 w-8/12 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.06)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PostDetailSparksSection({
  thread,
  isIOS,
  editing,
  replying,
  menus,
  coveredCommentIds,
  identity,
  actorId,
  openCompose,
  openReply,
}) {
  return (
    <div className="post-subcard profiles-card sparks-shell rounded-2xl border">
      <div className="sparks-header px-4 py-3 border-b border-white/8 text-sm" style={{ color: 'var(--vc-text-soft)' }}>
        Sparks
      </div>

      <div className="px-2">
        {thread.loading && (
          <CommentsSkeletonList count={4} />
        )}

        {!thread.loading && thread.comments.length === 0 && (
          <div className="py-6 text-center text-white/40 text-sm">
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
          replyingToCommentId={isIOS ? null : replying.replyingToCommentId}
          onReplyStart={openReply}
          onReplyCancel={isIOS ? undefined : replying.cancelReply}
          onReplySubmit={isIOS ? undefined : replying.submitReply}
          postingReply={thread.posting}
        />
      </div>

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
            <div className="px-3 py-3 border-t border-white/8 flex justify-end" style={{ background: 'var(--vc-surface)' }}>
              <button
                type="button"
                onClick={openCompose}
                disabled={thread.posting}
                className={
                  thread.posting
                    ? "bg-white/10 text-white/40 px-4 py-1.5 rounded-full text-sm cursor-not-allowed"
                    : "bg-[#8b5cf6] hover:bg-[#a78bfa] text-white px-4 py-1.5 rounded-full text-sm shadow-[0_0_14px_rgba(139,92,246,0.45)]"
                }
              >
                Spark
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
