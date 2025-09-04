// src/features/posts/components/CommentCard.jsx
/**
 * Renders a single comment (user or VPORT author) with reply / like / edit / delete.
 * Uses the centralized DAL in @/data.
 */
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import { formatDistanceToNow } from 'date-fns';
import UserLink from '@/components/UserLink';
import { db } from '@/data/data';

export default function CommentCard({
  comment,
  postAuthorType = 'user', // 'user' | 'vport'
  postVportId = null,
  onDelete,
}) {
  const { user: currentUser } = useAuth();
  const { identity } = useIdentity(); // { type:'user'|'vport', userId?, vportId?, ownerId? }
  const isVportPost = postAuthorType === 'vport';

  /* ---------- Author (avatar+name) displayed on the comment bubble ---------- */
  const isAsVport =
    comment?.as_vport === true && (comment?.vport?.id || comment?.actor_vport_id);

  const authorForLink = useMemo(() => {
    if (isAsVport) {
      return {
        id: comment?.vport?.id || comment?.actor_vport_id || postVportId || 'vport',
        name: comment?.vport?.name || 'VPORT',
        avatar_url: comment?.vport?.avatar_url || null,
      };
    }
    // user comment → DAL attached {profiles:{display_name, username, avatar_url, ...}}
    return comment?.profiles || null;
  }, [isAsVport, comment?.vport, comment?.actor_vport_id, comment?.profiles, postVportId]);

  const authorTypeForLink = isAsVport ? 'vport' : 'user';

  /* ---------------------- Local state for UX and controls ------------------- */
  const [replies, setReplies] = useState([]); // only for user posts (threaded)
  const [likeCount, setLikeCount] = useState(0); // only for user posts
  const [liked, setLiked] = useState(false); // only for user posts

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment?.content || '');

  // Busy flags
  const [replyBusy, setReplyBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    setEditText(comment?.content || '');
  }, [comment?.content]);

  /* -------------------------- Initial loads / effects ----------------------- */
  useEffect(() => {
    let cancelled = false;

    const loadRepliesForUserPost = async () => {
      try {
        const data = await db.comments.listReplies(comment.id);
        if (!cancelled) setReplies(data || []);
      } catch {
        /* noop */
      }
    };

    const loadLikesForUserPost = async () => {
      if (!currentUser?.id) {
        setLikeCount(0);
        setLiked(false);
        return;
      }
      try {
        const { count, likedByViewer } = await db.comments.likes.get({
          commentId: comment.id,
          viewerId: currentUser.id,
        });
        setLikeCount(count || 0);
        setLiked(!!likedByViewer);
      } catch {
        /* noop */
      }
    };

    if (!isVportPost) {
      loadRepliesForUserPost();
      loadLikesForUserPost();
    } else {
      setReplies([]);
      setLikeCount(0);
      setLiked(false);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment.id, currentUser?.id, isVportPost]);

  /* ------------ VPORT id used for auth (edit/delete when as_vport) ---------- */
  const commentVportId = useMemo(
    () => comment?.actor_vport_id ?? comment?.vport?.id ?? postVportId ?? null,
    [comment?.actor_vport_id, comment?.vport?.id, postVportId]
  );

  /* ---------------------------- AuthZ: who can edit/delete ------------------ */
  const canEditDelete = useMemo(() => {
    if (!currentUser?.id) return false;

    // When the comment was posted AS a VPORT, allow anyone currently acting
    // as that same VPORT to edit/delete.
    if (comment?.as_vport === true) {
      return identity?.type === 'vport' && identity?.vportId === commentVportId;
    }

    // Otherwise (normal user comment): only the author can edit/delete.
    return currentUser.id === comment?.user_id;
  }, [
    currentUser?.id,
    comment?.user_id,
    comment?.as_vport,
    commentVportId,
    identity?.type,
    identity?.vportId,
  ]);

  /* --------------------------------- Actions -------------------------------- */

  const handleReply = async () => {
    const text = (replyText || '').trim();
    if (!text || !currentUser || replyBusy) return;

    try {
      setReplyBusy(true);
      const canReplyAsVport = identity?.type === 'vport' && !!identity?.vportId;

      if (!isVportPost) {
        const postId = comment?.post_id;
        if (!postId) throw new Error('Missing post_id for reply.');

        const newReply = await db.comments.create({
          authorType: 'user',
          postId,
          parentId: comment.id,
          userId: currentUser.id,
          content: text,
          asVport: !!canReplyAsVport,
          actorVportId: canReplyAsVport ? identity.vportId : null,
        });

        setReplies((prev) => [...prev, newReply]);
        setReplyText('');
        setShowReplyInput(false);
      } else {
        // Not threaded in DB; this will add another top-level vport comment.
        const vportPostId = comment?.vport_post_id ?? postVportId ?? null;
        if (!vportPostId) throw new Error('Missing vport_post_id for reply.');

        await db.comments.create({
          authorType: 'vport',
          vportPostId,
          userId: currentUser.id,
          content: text,
          asVport: !!canReplyAsVport,
          actorVportId: canReplyAsVport ? identity.vportId : null,
        });

        setReplyText('');
        setShowReplyInput(false);
      }
    } catch (e) {
      alert(e?.message || 'Failed to reply.');
    } finally {
      setReplyBusy(false);
    }
  };

  const handleLike = async () => {
    if (isVportPost || !currentUser || likeBusy) return;

    try {
      setLikeBusy(true);
      await db.comments.likes.set({
        commentId: comment.id,
        userId: currentUser.id,
        like: !liked,
      });
      setLikeCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
      setLiked(!liked);
    } catch (e) {
      alert(e?.message || 'Failed to like comment.');
    } finally {
      setLikeBusy(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!currentUser || deleteBusy || !canEditDelete) return;

    try {
      setDeleteBusy(true);
      await db.comments.remove({
        authorType: isVportPost ? 'vport' : 'user',
        id: comment.id,
        userId: currentUser.id,
        actingAsVport: comment?.as_vport === true,
        vportId: commentVportId,
      });

      onDelete?.(comment.id);
    } catch (e) {
      alert(e?.message || 'Failed to delete comment.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleEditComment = async () => {
    const text = (editText || '').trim();
    if (!text || !currentUser || editBusy || !canEditDelete) return;

    try {
      setEditBusy(true);
      await db.comments.update({
        authorType: isVportPost ? 'vport' : 'user',
        id: comment.id,
        userId: currentUser.id,
        content: text,
        actingAsVport: comment?.as_vport === true,
        vportId: commentVportId,
      });
      comment.content = text; // optimistic
      setIsEditing(false);
    } catch (e) {
      alert(e?.message || 'Failed to edit comment.');
    } finally {
      setEditBusy(false);
    }
  };

  /* ----------------------------------- UI ---------------------------------- */
  const createdAtSafe = comment?.created_at ? new Date(comment.created_at) : null;

  return (
    <div className="ml-2 mt-2">
      <div className="bg-neutral-700 p-3 rounded-xl text-white text-sm">
        <div className="flex items-center justify-between">
          <UserLink
            user={authorForLink}
            authorType={authorTypeForLink}
            textSize="text-sm"
            avatarSize="w-6 h-6"
            avatarShape="rounded-md"
          />
        </div>

        {!isEditing ? (
          <p className="mt-1 whitespace-pre-line">{comment?.content || ''}</p>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="bg-neutral-800 text-white p-2 text-sm rounded-md border border-neutral-600 resize-none"
              rows={2}
              disabled={editBusy}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditComment}
                className="bg-purple-600 px-3 py-1 rounded-md text-sm hover:bg-purple-700 disabled:opacity-60"
                disabled={editBusy || !editText.trim()}
              >
                {editBusy ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment?.content || '');
                }}
                className="text-gray-400 hover:underline text-sm"
                disabled={editBusy}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400 flex gap-4 mt-2 items-center">
          <span>{createdAtSafe ? `${formatDistanceToNow(createdAtSafe)} ago` : ''}</span>

          {/* Likes are disabled on VPORT posts */}
          <button
            onClick={handleLike}
            className={`hover:opacity-80 transition ${liked ? 'text-red-400' : ''} disabled:opacity-60`}
            disabled={!currentUser || likeBusy || isVportPost}
            title={liked ? 'Unlike' : 'Like'}
          >
            ❤️ {likeCount}
          </button>

          <button
            onClick={() => setShowReplyInput((v) => !v)}
            className="hover:underline disabled:opacity-60"
            disabled={!currentUser || replyBusy}
          >
            Reply
          </button>

          {canEditDelete && !isEditing && (
            <>
              <button
                onClick={handleEditComment}
                className="text-yellow-400 hover:underline disabled:opacity-60"
                disabled={editBusy}
              >
                Edit
              </button>
              <button
                onClick={handleDeleteComment}
                className="text-red-400 hover:underline disabled:opacity-60"
                disabled={deleteBusy}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {showReplyInput && currentUser && (
        <div className="flex mt-2 ml-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="bg-neutral-800 text-white p-2 text-sm flex-1 rounded-l-md border border-neutral-600"
            placeholder={identity?.type === 'vport' ? 'Reply as VPORT…' : 'Write a reply...'}
            disabled={replyBusy}
          />
          <button
            onClick={handleReply}
            className="bg-purple-600 px-3 rounded-r-md text-sm hover:bg-purple-700 disabled:opacity-60"
            disabled={!replyText.trim() || replyBusy}
          >
            {replyBusy ? 'Posting…' : 'Post'}
          </button>
        </div>
      )}

      {/* Nested replies (only for user posts) */}
      {!isVportPost && replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2">
          {replies.map((r) => (
            <CommentCard
              key={r.id}
              comment={r}
              postAuthorType="user"
              onDelete={(id) => setReplies((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
