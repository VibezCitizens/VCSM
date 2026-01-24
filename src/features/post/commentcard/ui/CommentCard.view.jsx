// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\commentcard\ui\CommentCard.view.jsx

import { motion } from "framer-motion";
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
  onDelete,
  onToggleReplies,

  onReport,

  // ✅ from PostDetail (opens the centralized menu there)
  onOpenMenu,

  // ✅ centralized inline edit control (from PostDetail -> CommentList -> Container)
  editingCommentId = null,
  editingInitialText = "",
  onCancelInlineEdit,
  onEditedSaved,

  // ✅ ADD: cover support
  covered = false,
  cover = null,
}) {
  if (!comment) return null;

  const { identity } = useIdentity();

  const isEditing = editingCommentId === comment.id;

  // ✅ keep local displayed content so UI updates instantly after save
  const [displayContent, setDisplayContent] = useState(comment.content ?? "");
  useEffect(() => {
    setDisplayContent(comment.content ?? "");
  }, [comment.content]);

  // ✅ draft text (seed when entering edit mode)
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

    setSaving(true);
    setEditError(null);

    const { ok, error, comment: updated } = await editCommentController({
      actorId: identity.actorId,
      commentId: comment.id,
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
  }, [identity?.actorId, comment.id, draft, onEditedSaved]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="
        w-full px-4 py-3
        rounded-xl
        bg-neutral-900/35
        hover:bg-neutral-900/50
        transition
        relative overflow-hidden
      "
    >
      {/* ✅ COVER LAYER (anchors to this comment card now) */}
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
            createdAt={comment.createdAt}
            canDelete={canDelete}
            canReport={canReport}
            onOpenMenu={onOpenMenu} // ✅ centralized menu opener
            commentId={comment.id}
            commentActorId={comment.actorId}
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
                  className="w-full bg-neutral-900 text-white border border-neutral-700 rounded p-2"
                />

                {editError && (
                  <p className="text-red-400 mt-2 text-sm">{editError.message}</p>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={saveInlineEdit}
                    disabled={saving || !canSave}
                    className="bg-purple-600 px-4 py-2 rounded text-white disabled:opacity-60"
                  >
                    Save
                  </button>

                  <button
                    onClick={cancelInlineEdit}
                    disabled={saving}
                    className="border border-neutral-600 px-4 py-2 rounded text-white disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-2 pt-1 border-t border-neutral-800/60">
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
              className="mt-2 text-xs text-neutral-300 hover:text-white transition"
            >
              {showReplies ? "Hide replies" : "View replies"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
