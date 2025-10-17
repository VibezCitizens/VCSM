// src/features/post/components/CommentCard.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import { formatDistanceToNow } from 'date-fns';
import UserLink from '@/components/UserLink';
import { db } from '@/data/data';
import { supabase } from '@/lib/supabaseClient';

// USER comment-like APIs
import {
  isCommentLiked as isCommentLikedUser,
  likeComment as likeCommentUser,
  unlikeComment as unlikeCommentUser,
} from '@/data/user/post/commentLikes';

// VPORT comment-like APIs
import {
  isCommentLiked as isCommentLikedVport,
  likeComment as likeCommentVport,
  unlikeComment as unlikeCommentVport,
} from '@/data/vport/vpost/commentLikes';

// Aggregate count helper (unchanged, still single source of truth)
import { getCommentLikeCounts } from '../lib/commentReactions';

const DEV = import.meta?.env?.DEV;
const logDebug = (...a) => {
  if (DEV) console.log('%c[CommentCard Debug]', 'color:#f97316', ...a);
};

export default function CommentCard({
  comment,
  postAuthorType = 'user', // 'user' | 'vport'
  postVportId = null,
  onDelete,
}) {
  const { user: currentUser } = useAuth();
  const { identity } = useIdentity();
  const isVportPost = postAuthorType === 'vport';

  // Was comment authored as VPORT?
  const isAsVport = useMemo(() => {
    const result = !!(
      comment?.as_vport === true ||
      comment?.vport ||
      comment?.actor_vport_id
    );
    logDebug(
      'isAsVport result:', result,
      '| as_vport:', comment?.as_vport,
      '| vport:', !!comment?.vport,
      '| actor_vport_id:', comment?.actor_vport_id
    );
    return result;
  }, [comment?.as_vport, comment?.vport, comment?.actor_vport_id]);

  // Viewer identity (user vs vport) — we’ll use it to pick which like/unlike path to call
  const viewerIsVport = useMemo(
    () => identity?.type === 'vport' && !!identity?.vportId,
    [identity?.type, identity?.vportId]
  );

  // Display author
  const authorForLink = useMemo(() => {
    if (isAsVport) {
      const v = comment?.vport ?? {};
      const id = v?.id || comment?.actor_vport_id || postVportId || 'vport';
      const author = {
        id,
        name: v?.name || 'VPORT',
        avatar_url: v?.avatar_url || '/avatar.jpg',
        type: 'vport',
        slug: v?.slug || undefined,
      };
      logDebug('Author Resolved as VPORT:', author.name, '(ID:', author.id, ')');
      return author;
    }
    const p = comment?.profiles ?? {};
    const author = {
      id: p?.id || comment?.user_id,
      display_name: p?.display_name,
      username: p?.username,
      avatar_url: p?.avatar_url || p?.photo_url || '/avatar.jpg',
      photo_url: p?.photo_url,
      type: 'user',
    };
    logDebug(
      'Author Resolved as USER:',
      author.display_name || author.username,
      '(ID:', author.id,
      '| Profile Data:', p
    );
    return author;
  }, [isAsVport, comment?.vport, comment?.actor_vport_id, comment?.profiles, comment?.user_id, postVportId]);

  const authorTypeForLink = isAsVport ? 'vport' : 'user';

  /* ---------------- State ---------------- */
  const [replies, setReplies] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment?.content || '');

  const [replyBusy, setReplyBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    setEditText(comment?.content || '');
  }, [comment?.content]);

  // Load likes (count + whether the current identity liked it)
  const loadLikes = useCallback(async () => {
    let cancelled = false;
    try {
      // Count
      const counts = await getCommentLikeCounts([comment.id]).catch(() => new Map());
      const total = counts.get(comment.id) || 0;

      // Did current actor like it?
      let viewerLiked = false;
      if (currentUser?.id) {
        if (viewerIsVport) {
          // viewer is a VPORT — check actor-aware liked
          viewerLiked = await isCommentLikedVport({
            commentId: comment.id,
            vportId: identity?.vportId,
          });
          logDebug('isCommentLiked (VPORT)', { commentId: comment.id, vportId: identity?.vportId, viewerLiked });
        } else {
          // viewer is a normal user
          viewerLiked = await isCommentLikedUser({ commentId: comment.id });
          logDebug('isCommentLiked (USER)', { commentId: comment.id, viewerLiked });
        }
      }

      if (!cancelled) {
        setLikeCount(total);
        setLiked(!!viewerLiked);
      }
    } catch (e) {
      logDebug('loadLikes error:', e?.message || e);
      if (!cancelled) {
        setLikeCount(0);
        setLiked(false);
      }
    }
    return () => { cancelled = true; };
  }, [comment.id, currentUser?.id, viewerIsVport, identity?.vportId]);

  useEffect(() => {
    let cancelled = false;

    const loadReplies = async () => {
      try {
        const data = await db.comments.listReplies(comment.id, currentUser?.id);
        if (!cancelled) setReplies(data || []);
      } catch (e) {
        logDebug('loadReplies error:', e?.message || e);
      }
    };

    loadReplies();
    loadLikes();

    return () => {
      cancelled = true;
    };
  }, [comment.id, currentUser?.id, loadLikes]);

  /* ------------ VPORT id for authZ (for edit/delete) ------------- */
  const commentVportId = useMemo(
    () => comment?.actor_vport_id ?? comment?.vport?.id ?? postVportId ?? null,
    [comment?.actor_vport_id, comment?.vport?.id, postVportId]
  );

  /* ------------ AuthZ ------------- */
  const canEditDelete = useMemo(() => {
    if (!currentUser?.id) return false;
    if (isAsVport) {
      return identity?.type === 'vport' && identity?.vportId === commentVportId;
    }
    return currentUser.id === comment?.user_id;
  }, [currentUser?.id, comment?.user_id, isAsVport, commentVportId, identity?.type, identity?.vportId]);

  /* ------------ Actions ------------- */

  // Reply (as user or vport; RLS handled by DAL)
  const handleReply = async () => {
    const text = (replyText || '').trim();
    if (!text || !currentUser || replyBusy) return;
    try {
      setReplyBusy(true);

      const canReplyAsVport = identity?.type === 'vport' && !!identity?.vportId;
      const replyVportId = canReplyAsVport ? identity.vportId : null;

      const resolvedPostId = comment?.post_id || null;
      if (!resolvedPostId) throw new Error('Missing post_id for reply.');

      logDebug(
        'Replying. Can reply as VPORT:', canReplyAsVport,
        '| Acting as VPORT:', !!canReplyAsVport,
        '| VPORT ID sent to DB:', replyVportId
      );

      const newReply = await db.comments.create({
        postId: resolvedPostId,
        userId: currentUser.id,
        content: text,
        parentId: comment.id,
        actingAsVport: !!canReplyAsVport,
        vportId: replyVportId,
      });

      setReplies((prev) => [...prev, newReply]);
      setReplyText('');
      setShowReplyInput(false);
    } catch (e) {
      alert(e?.message || 'Failed to reply.');
    } finally {
      setReplyBusy(false);
    }
  };

  // Like toggle using the correct path (user vs vport)
  const handleLike = async () => {
    if (!currentUser || likeBusy) return;
    setLikeBusy(true);
    try {
      if (viewerIsVport) {
        if (!identity?.vportId) throw new Error('Missing active vportId');
        if (liked) {
          await unlikeCommentVport({ commentId: comment.id, vportId: identity.vportId });
          logDebug('UNLIKE (VPORT)', { commentId: comment.id, vportId: identity.vportId });
        } else {
          await likeCommentVport({ commentId: comment.id, vportId: identity.vportId });
          logDebug('LIKE (VPORT)', { commentId: comment.id, vportId: identity.vportId });
        }
      } else {
        if (liked) {
          await unlikeCommentUser({ commentId: comment.id });
          logDebug('UNLIKE (USER)', { commentId: comment.id });
        } else {
          await likeCommentUser({ commentId: comment.id });
          logDebug('LIKE (USER)', { commentId: comment.id });
        }
      }

      // Re-fetch truth after action
      await loadLikes();
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
        authorType: isAsVport ? 'vport' : 'user',
        id: comment.id,
        userId: currentUser.id,
        actingAsVport: isAsVport,
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
        authorType: isAsVport ? 'vport' : 'user',
        id: comment.id,
        userId: currentUser.id,
        content: text,
        actingAsVport: isAsVport,
        vportId: commentVportId,
      });
      comment.content = text;
      setIsEditing(false);
    } catch (e) {
      alert(e?.message || 'Failed to edit comment.');
    } finally {
      setEditBusy(false);
    }
  };

  /* ------------ UI ------------- */
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
          <p className="mt-1 whitespace-pre-line">
            {comment?.content || ''}
          </p>
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
          <span>
            {createdAtSafe ? `${formatDistanceToNow(createdAtSafe)} ago` : ''}
          </span>

          <button
            onClick={handleLike}
            className={`hover:opacity-80 transition ${liked ? 'text-red-400' : ''} disabled:opacity-60`}
            disabled={!currentUser || likeBusy}
            title={
              liked
                ? (viewerIsVport ? 'Unlike as VPORT' : 'Unlike')
                : (viewerIsVport ? 'Like as VPORT' : 'Like')
            }
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
                onClick={() => setIsEditing(true)}
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
            placeholder={
              identity?.type === 'vport'
                ? 'Reply as VPORT…'
                : 'Write a reply...'
            }
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

      {replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2">
          {replies.map((r) => (
            <CommentCard
              key={r.id}
              comment={r}
              postAuthorType={postAuthorType}
              postVportId={postVportId}
              onDelete={(id) =>
                setReplies((prev) => prev.filter((x) => x.id !== id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
