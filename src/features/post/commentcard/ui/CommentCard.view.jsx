// src/features/post/commentcard/ui/CommentCard.view.jsx

import { useCallback, useEffect, useMemo, useState } from "react";

import CommentHeader from "../components/cc/CommentHeader";
import CommentBody from "../components/cc/CommentBody";
import CommentActions from "../components/cc/CommentActions";

import { editCommentController } from "@/features/post/commentcard/controller/editComment.controller";
import { useIdentity } from "@/state/identity/identityContext";

export default function CommentCardView({
  comment,
  actor,

  liked = false,
  likeCount = 0,
  showReplies = false,

  canLike = false,
  canReply = false,
  canDelete = false,
  canReport = false,

  hasReplies = false,

  onLike,
  onReply,
  onToggleReplies,

  onOpenMenu,

  editingCommentId = null,
  editingInitialText = "",
  onCancelInlineEdit,
  onEditedSaved,

  covered = false,
  cover = null,
}) {
  const safeComment = comment ?? {};

  const { identity } = useIdentity();

  const isEditing = editingCommentId === safeComment.id;

  const [displayContent, setDisplayContent] = useState(safeComment.content ?? "");
  useEffect(() => {
    setDisplayContent(safeComment.content ?? "");
  }, [safeComment.content]);

  const [draft, setDraft] = useState(displayContent);

  useEffect(() => {
    if (!isEditing) return;
    setDraft(editingInitialText ?? displayContent ?? "");
  }, [isEditing, editingInitialText, displayContent]);

  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const canSave = useMemo(() => String(draft ?? "").trim().length > 0, [draft]);

  const cancelInlineEdit = useCallback(() => {
    setEditError(null);
    onCancelInlineEdit?.();
  }, [onCancelInlineEdit]);

  const saveInlineEdit = useCallback(async () => {
    if (!identity?.actorId) {
      setEditError(new Error("actorId required"));
      return;
    }
    if (!safeComment?.id) {
      setEditError(new Error("commentId required"));
      return;
    }

    setSaving(true);
    setEditError(null);

    const { ok, error, comment: updated } = await editCommentController({
      actorId: identity.actorId,
      commentId: safeComment.id,
      text: draft,
    });

    setSaving(false);

    if (!ok) {
      setEditError(error);
      return;
    }

    if (updated?.content != null) setDisplayContent(updated.content);
    else setDisplayContent(String(draft ?? "").trim());

    onEditedSaved?.();
  }, [identity?.actorId, safeComment.id, draft, onEditedSaved]);

  if (!comment) return null;

  return (
    <div
      className="
        w-full px-4 py-3
        rounded-xl
        bg-[#151125]/70
        border border-violet-300/15
        hover:bg-[#1a1430]/78
        transition
        relative overflow-hidden
      "
    >
      {covered ? (
        <div
          className="absolute inset-0 z-20"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {cover}
        </div>
      ) : null}

      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <CommentHeader
            actor={actor}
            createdAt={safeComment.createdAt}
            canDelete={canDelete}
            canReport={canReport}
            onOpenMenu={onOpenMenu}
            commentId={safeComment.id}
            commentActorId={safeComment.actorId}
          />

          <div className="mt-1">
            {!isEditing ? (
              <CommentBody content={displayContent} />
            ) : (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  className="w-full bg-[#130f20] text-slate-100 border border-violet-300/20 rounded p-2"
                />

                {editError && (
                  <p className="text-red-400 mt-2 text-sm">{editError.message}</p>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={saveInlineEdit}
                    disabled={saving || !canSave}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 rounded text-white disabled:opacity-60 shadow-[0_0_14px_rgba(196,124,255,0.35)]"
                  >
                    Save
                  </button>

                  <button
                    onClick={cancelInlineEdit}
                    disabled={saving}
                    className="border border-violet-300/25 px-4 py-2 rounded text-slate-100 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-2 pt-1 border-t border-violet-300/10">
            <CommentActions
              liked={liked}
              likeCount={likeCount}
              canLike={canLike}
              canReply={canReply}
              onLike={onLike}
              onReply={onReply}
            />
          </div>

          {hasReplies && (
            <button
              onClick={onToggleReplies}
              className="mt-2 text-xs text-slate-300 hover:text-slate-100 transition"
            >
              {showReplies ? "Hide replies" : "View replies"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
