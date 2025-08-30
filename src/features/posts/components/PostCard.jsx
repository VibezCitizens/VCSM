// src/features/posts/components/PostCard.jsx
/**
 * @fileoverview Post card: renders a post, reactions, and comments UI.
 * @module features/posts/components/PostCard
 * @remarks All database access goes through @/data/db (no direct Supabase here).
 */

import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { db } from '@/data/data';
import { getOrCreateConversation } from '@/features/chat/utils/getOrCreateConversation';
import UserLink from '@/components/UserLink';
import CommentCard from './CommentCard';
import { useIdentity } from '@/state/identityContext';
import { isFollowing, followUser, unfollowUser } from '@/utils/social';

/* --------------------------------- utils --------------------------------- */

const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

function formatPostTime(iso) {
  const now = new Date();
  const postDate = new Date(iso);
  const diff = (now - postDate) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return postDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== postDate.getFullYear() ? 'numeric' : undefined,
  });
}

const vibrate = (ms = 25) => navigator.vibrate?.(ms);
const DEV = import.meta.env?.DEV;

const gstart = (label, extra = {}) => {
  if (DEV) console.groupCollapsed(`%c[PostCard] ${label}`, 'color:#a78bfa;font-weight:bold', extra);
};
const gend = () => { if (DEV) console.groupEnd(); };
const log = (...a) => { if (DEV) console.log('%c[PostCard]', 'color:#a78bfa', ...a); };
const err = (...a) => { if (DEV) console.error('%c[PostCard]', 'color:#ef4444', ...a); };

const renderTextWithHashtags = (text = '') =>
  text.split(/(\s+)/).map((part, i) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
      return (
        <Link key={`${part}-${i}`} to={`/tag/${tag}`} className="text-purple-400 hover:underline">
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });

/* ------------------------------- component ------------------------------- */

export default function PostCard({
  post,
  user = null,
  authorType = 'user',
  onSubscriptionChange,
  onDelete,
}) {
  const { user: currentUser } = useAuth();
  const { identity } = useIdentity(); // { type:'user'|'vport', vportId?, userId? }
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const authorId = useMemo(
    () => user?.id ?? post?.authorId ?? post?.user_id ?? null,
    [user?.id, post?.authorId, post?.user_id]
  );

  const postVportId = useMemo(
    () => post?.vport_id ?? (authorType === 'vport' ? post?.authorId : null) ?? null,
    [post?.vport_id, post?.authorId, authorType]
  );

  const canActAsVport = useMemo(
    () => identity?.type === 'vport' && !!identity?.vportId,
    [identity?.type, identity?.vportId]
  );

  const canDelete = useMemo(() => {
    if (!post?.id) return false;
    if (authorType === 'user') {
      return currentUser?.id && authorId && currentUser.id === authorId;
    }
    if (authorType === 'vport') {
      if (canActAsVport && identity.vportId && postVportId && identity.vportId === postVportId) {
        return true;
      }
      const createdBy = post?.raw?.created_by || post?.created_by;
      if (createdBy && currentUser?.id && createdBy === currentUser.id) return true;
    }
    return false;
  }, [
    authorType,
    currentUser?.id,
    authorId,
    canActAsVport,
    identity?.vportId,
    postVportId,
    post?.id,
    post?.raw,
    post?.created_by,
  ]);

  const hasUserProp = (u) => !!(u && Object.keys(u).length);

  const author = useMemo(() => {
    if (authorType === 'vport') {
      const src = hasUserProp(user) ? user : post?.vport ?? {};
      return {
        id: postVportId || src?.id || authorId,
        name: src?.name ?? 'VPORT',
        avatar_url: src?.avatar_url ?? undefined,
        type: 'vport',
      };
    }
    const src = hasUserProp(user) ? user : post?.profiles ?? {};
    return {
      id: authorId,
      display_name: src?.display_name ?? undefined,
      username: src?.username ?? undefined,
      email: src?.email ?? undefined,
      photo_url: src?.photo_url ?? undefined,
      type: 'user',
    };
  }, [authorType, user, authorId, postVportId, post?.profiles, post?.vport]);

  // state
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [roseCount, setRoseCount] = useState(0);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [authorExists, setAuthorExists] = useState(authorType !== 'user' ? true : false);

  useOnClickOutside(menuRef, () => setShowMenu(false));

  /* ----------------------------- data fetching ----------------------------- */

  const fetchComments = useCallback(async () => {
    if (!post?.id) return;
    gstart('fetchComments', { postId: post?.id, authorType });
    try {
      const list = await db.comments.listTopLevel({ authorType, postId: post.id });
      setComments(list);
    } catch (e) {
      err('fetchComments error', e);
    } finally {
      gend();
    }
  }, [post?.id, authorType]);

  const fetchReactions = useCallback(async () => {
    if (!post?.id) return;
    gstart('fetchReactions', { postId: post?.id, authorType, viewer: currentUser?.id, actor: identity?.vportId });

    try {
      const rows = await db.reactions.listForPost({ authorType, postId: post.id });
      const likes = rows.filter((r) => r.reaction === 'like').length;
      const dislikes = rows.filter((r) => r.reaction === 'dislike').length;
      setLikeCount(likes);
      setDislikeCount(dislikes);

      if (authorType === 'user') {
        setRoseCount(await db.roses.count(post.id));

        const uid = currentUser?.id;
        let mine = null;
        if (canActAsVport) {
          mine = rows.find(
            (r) =>
              r.as_vport === true &&
              r.actor_vport_id === identity.vportId &&
              (r.reaction === 'like' || r.reaction === 'dislike')
          );
        } else if (uid) {
          mine = rows.find(
            (r) =>
              r.as_vport === false &&
              r.user_id === uid &&
              (r.reaction === 'like' || r.reaction === 'dislike')
          );
        }
        setUserReaction(mine?.reaction ?? null);
      } else {
        setRoseCount(0);
        const uid = currentUser?.id;
        const mine = uid
          ? rows.find((r) => r.user_id === uid && (r.reaction === 'like' || r.reaction === 'dislike'))
          : null;
        setUserReaction(mine?.reaction ?? null);
      }
    } catch (e) {
      err('fetchReactions error', e);
    } finally {
      gend();
    }
  }, [post?.id, authorType, currentUser?.id, canActAsVport, identity?.vportId]);

  const checkSubscription = useCallback(async () => {
    try {
      if (authorType !== 'user' || !currentUser?.id || !authorId || currentUser.id === authorId) {
        setIsSubscribed(false);
        return;
      }
      const following = await isFollowing(authorId);
      setIsSubscribed(!!following);
    } catch (e) {
      err('checkSubscription error', e);
    }
  }, [currentUser?.id, authorId, authorType]);

  const verifyAuthorExists = useCallback(async () => {
    if (authorType !== 'user') {
      setAuthorExists(true);
      return;
    }
    gstart('verifyAuthorExists', { authorId, authorType });
    try {
      if (!authorId) {
        setAuthorExists(false);
        return;
      }
      const exists = await db.profiles.exists(authorId);
      setAuthorExists(Boolean(exists));
    } catch (e) {
      err('verifyAuthorExists error', e);
      setAuthorExists(false);
    } finally {
      gend();
    }
  }, [authorId, authorType]);

  useEffect(() => {
    if (!post?.id) return;
    gstart('mount/useEffect', { postId: post?.id, viewer: currentUser?.id, authorId, authorType });
    fetchReactions();
    fetchComments();
    checkSubscription();
    verifyAuthorExists();
    gend();
  }, [
    post?.id,
    authorType,
    authorId,
    currentUser?.id,
    identity?.vportId,
    fetchReactions,
    fetchComments,
    checkSubscription,
    verifyAuthorExists,
  ]);

  /* -------------------------------- actions -------------------------------- */

  const handlePostComment = async () => {
    gstart('handlePostComment', { authorType, canActAsVport, postVportId });
    try {
      const uid = currentUser?.id;
      const text = replyText.trim();
      if (!uid || !text) return;

      const newRow = await db.comments.create({
        authorType,
        postId: post.id,
        vportPostId: post.id,
        userId: uid,
        content: text,
        asVport: !!canActAsVport,
        actorVportId: canActAsVport ? identity.vportId : null,
      });

      setReplyText('');
      setShowComments(true);

      // Optimistic add for user posts (DAL returns full comment row). For vport posts, refetch.
      if (authorType === 'user' && newRow?.id) {
        setComments((prev) => [...prev, newRow]);
      } else {
        await fetchComments();
      }
    } catch (e) {
      err('handlePostComment error', e);
      alert(`Failed to comment: ${e?.message || e}`);
    } finally {
      gend();
    }
  };

  const handleReact = async (kind) => {
    if (reactionBusy) return;
    gstart('handleReact', { kind, authorType, canActAsVport, vportId: identity?.vportId });
    try {
      setReactionBusy(true);
      vibrate();
      const uid = currentUser?.id;
      if (!uid) return;

      if (kind === 'rose') {
        if (authorType !== 'user') return;
        await db.roses.give({ postId: post.id, fromUserId: uid, qty: 1 });
        await fetchReactions();
        return;
      }

      await db.reactions.setForPost({
        authorType,
        postId: post.id,
        kind,
        userId: uid,
        vportId: identity?.vportId,
        actingAsVport: canActAsVport,
      });

      await fetchReactions();
    } catch (e) {
      err('handleReact error', e);
      alert(`Failed to react: ${e?.message || e}`);
    } finally {
      setReactionBusy(false);
      gend();
    }
  };

  const handleDeletePost = async () => {
    gstart('handleDeletePost', { authorType, canDelete, postVportId });
    try {
      if (!canDelete) return;

      if (authorType === 'user') {
        await db.posts.softDeleteUserPost(post.id);
      } else {
        await db.posts.hardDeleteVportPost(post.id);
      }
      onDelete?.(post.id);
    } catch (e) {
      err('handleDeletePost error', e);
      alert(`Failed to delete: ${e?.message || e}`);
    } finally {
      gend();
    }
  };

  const handleToggleSubscribe = async () => {
    if (authorType !== 'user') return;
    const uid = currentUser?.id;
    if (!uid || !authorId || !authorExists || uid === authorId || followBusy) return;

    setFollowBusy(true);
    const prev = isSubscribed;
    try {
      setIsSubscribed(!prev);
      if (prev) await unfollowUser(authorId);
      else await followUser(authorId);
      const following = await isFollowing(authorId);
      setIsSubscribed(!!following);
      onSubscriptionChange?.();
    } catch (e) {
      setIsSubscribed(prev);
      err('handleToggleSubscribe error', e);
      alert(`Failed to follow/unfollow: ${e?.message || e}`);
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = async () => {
    gstart('handleMessage', { authorType });
    try {
      if (authorType !== 'user') return;
      const uid = currentUser?.id;
      if (!uid || !authorId || uid === authorId) return;
      const convo = await getOrCreateConversation(authorId);
      if (convo?.id) navigate(`/chat/${convo.id}`);
    } catch (e) {
      err('handleMessage error', e);
    } finally {
      gend();
    }
  };

  /* ---------------------------------- UI ---------------------------------- */

  const textContent = authorType === 'vport' ? post.body : post.text;

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow mb-4 mx-2 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <UserLink
          user={author}
          authorType={authorType === 'vport' ? 'vport' : 'user'}
          avatarSize="w-9 h-9"
          avatarShape="rounded-md"
          textSize="text-sm"
          showTimestamp
          timestamp={formatPostTime(post.created_at)}
        />
        <div className="flex gap-2 items-center">
          {authorType === 'user' &&
            currentUser?.id &&
            authorId &&
            authorExists &&
            currentUser.id !== authorId && (
              <>
                <button
                  onClick={handleToggleSubscribe}
                  disabled={followBusy}
                  className={`text-xs px-2 py-1 rounded ${isSubscribed ? 'bg-purple-600' : 'bg-neutral-700'} text-white disabled:opacity-60`}
                >
                  {followBusy ? '…' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
                <button
                  onClick={handleMessage}
                  className="text-xs px-2 py-1 rounded bg-neutral-700 text-white"
                >
                  Message
                </button>
              </>
            )}

          <div ref={menuRef} className="relative">
            <button onClick={() => setShowMenu((p) => !p)} aria-label="Post menu">⋯</button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded shadow p-2 z-50">
                {canDelete ? (
                  <button onClick={handleDeletePost} className="text-red-400">Delete Post</button>
                ) : (
                  <button className="text-yellow-400">Report Post</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {post.title && <h3 className="text-white font-semibold text-base mb-1">{post.title}</h3>}

      {textContent && (
        <p className="text-white text-sm mb-3 whitespace-pre-wrap">{renderTextWithHashtags(textContent)}</p>
      )}

      {post.media_type === 'image' && post.media_url && (
        <div className="w-full rounded-xl overflow-hidden mb-3">
          <img src={post.media_url} alt="post" className="w-full max-h-80 object-cover" />
        </div>
      )}

      {post.media_type === 'video' && post.media_url && (
        <video src={post.media_url} controls className="w-full max-h-80 rounded-xl mb-3" />
      )}

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag, i) => (
            <Link
              key={`${tag}-${i}`}
              to={`/tag/${tag}`}
              className="text-xs bg-neutral-700 text-purple-400 px-2 py-1 rounded-full hover:bg-neutral-600 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Reactions */}
      <div className="flex flex-wrap gap-3 items-center mb-2">
        <button
          onClick={() => handleReact('like')}
          aria-pressed={userReaction === 'like'}
          disabled={reactionBusy}
          className={`text-sm px-2 py-1 rounded ${userReaction === 'like' ? 'bg-purple-600' : 'bg-neutral-700'} text-white disabled:opacity-60`}
        >
          👍 {likeCount}
        </button>
        <button
          onClick={() => handleReact('dislike')}
          aria-pressed={userReaction === 'dislike'}
          disabled={reactionBusy}
          className={`text-sm px-2 py-1 rounded ${userReaction === 'dislike' ? 'bg-red-600' : 'bg-neutral-700'} text-white disabled:opacity-60`}
        >
          👎 {dislikeCount}
        </button>
        {authorType === 'user' && (
          <button
            onClick={() => handleReact('rose')}
            disabled={reactionBusy}
            className="text-sm px-2 py-1 rounded bg-neutral-700 text-white disabled:opacity-60"
          >
            🌹 {roseCount}
          </button>
        )}
      </div>

      {/* Quick comment input */}
      <div className="flex mt-2">
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="bg-neutral-900 text-white p-2 rounded-l w-full text-sm"
          placeholder={
            authorType === 'vport'
              ? canActAsVport
                ? 'Comment as your VPORT…'
                : 'Comment (as you)…'
              : canActAsVport
              ? 'Comment as your VPORT…'
              : 'Write a comment…'
          }
        />
        <button
          onClick={handlePostComment}
          disabled={!currentUser || !replyText.trim()}
          className="bg-purple-600 px-4 rounded-r text-sm text-white disabled:opacity-60"
        >
          Post
        </button>
      </div>

      {/* View/hide comments */}
      <div className="mt-2">
        {comments.length > 0 ? (
          showComments ? (
            <button onClick={() => setShowComments(false)} className="text-xs text-purple-400">
              Hide comments ({comments.length})
            </button>
          ) : (
            <button onClick={() => setShowComments(true)} className="text-xs text-purple-400">
              View comments ({comments.length})
            </button>
          )
        ) : (
          !showComments && (
            <button onClick={() => setShowComments(true)} className="text-xs text-purple-400">
              Be the first to comment!
            </button>
          )
        )}
      </div>

      {/* Render comments */}
      {showComments && (
        <div className="space-y-2 mt-2">
          {comments.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-2">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                postAuthorType={authorType}
                postVportId={postVportId}
                onDelete={(id) => setComments((prev) => prev.filter((x) => x.id !== id))} // ✅ optimistic remove
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
