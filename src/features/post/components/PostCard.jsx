// src/features/posts/components/PostCard.jsx
/**
 * Post card: renders a post, reactions, and comments UI.
 * All database access goes through @/data/data (DAL).
 */
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import { db } from '@/data/data';
import { getOrCreateConversation } from '@/features/chat/utils/conversations';
import UserLink from '@/components/UserLink';
import CommentCard from './CommentCard';
import { isFollowing, followUser, unfollowUser } from '@/utils/socialfriends/social';
import { getCurrentActorId } from '@/lib/actors/actors';
import PostMedia from '@/features/post/ui/PostMedia';

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
const logErr = (...a) => { if (DEV) console.error('%c[PostCard]', 'color:#ef4444', ...a); };
const logDebug = (...a) => { if (DEV) console.log('%c[PostCard Debug]', 'color:#22c55e', ...a); };

/* ------------------------------- component ------------------------------- */
export default function PostCard({
  post,
  user = null,
  authorType: authorTypeProp, // optional override
  onSubscriptionChange,
  onDelete,
}) {
  const { user: currentUser } = useAuth();
  const { identity } = useIdentity();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Derived: when identity is VPORT, we ALWAYS act as VPORT.
  const willActAsVport = useMemo(
    () => identity?.type === 'vport' && !!identity?.vportId,
    [identity?.type, identity?.vportId]
  );
  const vportId = willActAsVport ? identity?.vportId : null;

  // DEBUG
  useEffect(() => {
    logDebug('Component Mounted. Post ID:', post?.id);
    logDebug('Current Identity:', identity, '| willActAsVport:', willActAsVport, '| vportId:', vportId);
  }, [post?.id, identity, willActAsVport, vportId]);

  // Prefer explicit authorType prop; otherwise infer from data attached by feed.
  const authorType = useMemo(() => {
    if (authorTypeProp) return authorTypeProp;
    // try to infer from presence of post.vport / actor_vport_id
    if (post?.vport || post?.vport_id || post?.actor_vport_id || post?.actor_kind === 'vport') {
      return 'vport';
    }
    return 'user';
  }, [authorTypeProp, post?.vport, post?.vport_id, post?.actor_vport_id, post?.actor_kind]);

  const authorId = useMemo(
    () => user?.id ?? post?.authorId ?? post?.user_id ?? null,
    [user?.id, post?.authorId, post?.user_id]
  );

  const postVportId = useMemo(
    () => post?.vport_id ?? post?.actor_vport_id ?? (authorType === 'vport' ? post?.authorId : null) ?? null,
    [post?.vport_id, post?.actor_vport_id, post?.authorId, authorType]
  );

  const canDelete = useMemo(() => {
    if (!post?.id) return false;
    if (authorType === 'user') {
      return currentUser?.id && authorId && currentUser.id === authorId;
    }
    if (authorType === 'vport') {
      if (willActAsVport && vportId && postVportId && vportId === postVportId) return true;
      const createdBy = post?.raw?.created_by || post?.created_by;
      if (createdBy && currentUser?.id && createdBy === currentUser.id) return true;
    }
    return false;
  }, [authorType, currentUser?.id, authorId, willActAsVport, vportId, postVportId, post?.id, post?.raw, post?.created_by]);

  const hasUserProp = (u) => !!(u && Object.keys(u).length);

  // Author (display)
  const author = useMemo(() => {
    if (authorType === 'vport') {
      const src = hasUserProp(user) ? user : post?.vport ?? {};
      return {
        id: postVportId || src?.id || post?.actor_vport_id || post?.authorId,
        name: src?.name ?? 'VPORT',
        avatar_url: src?.avatar_url ?? '/avatar.jpg',
        type: 'vport',
      };
    }
    const src = hasUserProp(user) ? user : post?.profiles ?? {};
    const finalAuthor = {
      id: authorId,
      name: src?.display_name || src?.username || undefined,
      display_name: src?.display_name ?? undefined,
      username: src?.username ?? undefined,
      email: src?.email ?? undefined,
      photo_url: src?.photo_url ?? src?.avatar_url ?? undefined,
      avatar_url: src?.avatar_url ?? src?.photo_url ?? undefined,
      type: 'user',
    };
    logDebug('Post Author:', finalAuthor.name, '(ID:', finalAuthor.id, ')');
    return finalAuthor;
  }, [authorType, user, authorId, postVportId, post?.profiles, post?.vport, post?.actor_vport_id, post?.authorId]);

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
    try {
      const list = await db.comments.listTopLevel({ authorType, postId: post.id });
      logDebug('Fetched comments count:', list.length);
      setComments(list);
    } catch (e) {
      logErr('fetchComments error', e);
    }
  }, [post?.id, authorType]);

  const fetchReactions = useCallback(async () => {
    if (!post?.id) return;
    try {
      const rows = await db.reactions.listForPost({ postId: post.id });
      setLikeCount(rows.filter(r => r.reaction === 'like').length);
      setDislikeCount(rows.filter(r => r.reaction === 'dislike').length);
      setRoseCount(authorType === 'user' ? await db.roses.count(post.id) : 0);

      const uid = currentUser?.id;
      if (!uid) { setUserReaction(null); return; }
      const myActorId = await getCurrentActorId({
        userId: uid,
        activeVportId: willActAsVport ? vportId : null,
      });
      logDebug('Actor ID for Reactions (User ID:', uid, 'willActAsVport:', willActAsVport, '):', myActorId);
      const mine = rows.find(r => r.actor_id === myActorId && (r.reaction === 'like' || r.reaction === 'dislike'));
      setUserReaction(mine?.reaction ?? null);
    } catch (e) {
      logErr('fetchReactions error', e);
    }
  }, [post?.id, authorType, currentUser?.id, willActAsVport, vportId]);

  const checkSubscription = useCallback(async () => {
    try {
      if (authorType !== 'user' || !currentUser?.id || !authorId || currentUser.id === authorId) {
        setIsSubscribed(false);
        return;
      }
      const following = await isFollowing(authorId);
      setIsSubscribed(!!following);
    } catch (e) {
      logErr('checkSubscription error', e);
    }
  }, [currentUser?.id, authorId, authorType]);

  const verifyAuthorExists = useCallback(async () => {
    if (authorType !== 'user') {
      setAuthorExists(true);
      return;
    }
    try {
      if (!authorId) {
        setAuthorExists(false);
        return;
      }
      const exists = await db.profiles.exists(authorId);
      setAuthorExists(Boolean(exists));
    } catch (e) {
      logErr('verifyAuthorExists error', e);
      setAuthorExists(false);
    }
  }, [authorId, authorType]);

  useEffect(() => {
    if (!post?.id) return;
    fetchReactions();
    fetchComments();
    checkSubscription();
    verifyAuthorExists();
  }, [post?.id, authorType, authorId, identity?.vportId, fetchReactions, fetchComments, checkSubscription, verifyAuthorExists]);

  /* -------------------------------- actions -------------------------------- */
  const handlePostComment = async () => {
    try {
      const uid = currentUser?.id;
      const text = replyText.trim();
      if (!uid || !text) return;

      logDebug('Posting Comment. User ID:', uid, '| willActAsVport:', willActAsVport, '| vportId:', vportId);

      const newRow = await db.comments.create({
        postId: post.id,
        userId: uid,
        content: text,
        parentId: null,
        actingAsVport: willActAsVport,
        vportId,
      });

      logDebug('Comment created successfully. Result:', newRow);

      setReplyText('');
      setShowComments(true);
      if (authorType === 'user' && newRow?.id) {
        setComments((prev) => [...prev, newRow]);
      } else {
        await fetchComments();
      }
    } catch (e) {
      logErr('handlePostComment error', e);
      alert(`Failed to comment: ${e?.message || e}`);
    }
  };

  // Route 👍/👎 through correct DAL
  const rApi = willActAsVport ? db.vport.post.reactions : db.reactions;

  const handleReact = async (kind) => {
    if (reactionBusy) return;
    try {
      setReactionBusy(true);
      vibrate();
      const uid = currentUser?.id;
      if (!uid) return;

      if (kind === 'rose') {
        if (authorType !== 'user') return; // roses are user→user only in your schema
        const actorId = await getCurrentActorId({
          userId: uid,
          activeVportId: willActAsVport ? vportId : null,
        });
        if (!actorId) throw new Error('No actor_id found for current user');
        await db.roses.give({
          postId: post.id,
          qty: 1,
          profileId: uid,
          actingAsVport: willActAsVport,
          vportId,
          actorId,
        });
        await fetchReactions();
        return;
      }

      if (userReaction === kind) {
        await rApi.clearForPost({
          postId: post.id,
          userId: uid,
          vportId: willActAsVport ? vportId : undefined,
          kind,
        });
      } else {
        await rApi.setForPost({
          postId: post.id,
          kind,
          userId: uid,
          vportId: willActAsVport ? vportId : undefined,
        });
      }

      await fetchReactions();
    } catch (e) {
      logErr('handleReact error', e);
      alert(`Failed to react: ${e?.message || e}`);
    } finally {
      setReactionBusy(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      if (!canDelete) return;
      if (authorType === 'user') {
        await db.posts.softDeleteUserPost(post.id);
      } else {
        await db.posts.hardDeleteVportPost(post.id);
      }
      onDelete?.(post.id);
    } catch (e) {
      logErr('handleDeletePost error', e);
      alert(`Failed to delete: ${e?.message || e}`);
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
      logErr('handleToggleSubscribe error', e);
      alert(`Failed to follow/unfollow: ${e?.message || e}`);
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = async () => {
    try {
      if (authorType !== 'user') return;
      const uid = currentUser?.id;
      if (!uid || !authorId || uid === authorId) return;
      const convo = await getOrCreateConversation(authorId);
      if (convo?.id) navigate(`/chat/${convo.id}`);
    } catch (e) {
      logErr('handleMessage error', e);
    }
  };

  /* ---------------------------------- UI ---------------------------------- */
  const textContent = authorType === 'vport' ? (post.text ?? post.body) : post.text;

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow mx-2 relative">
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
          {authorType === 'user' && currentUser?.id && authorId && authorExists && currentUser.id !== authorId && (
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
                  <button onClick={handleDeletePost} className="text-red-400">Remove</button>
                ) : (
                  <button className="text-yellow-400">Report</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {post.title && (
        <h3 className="text-white font-semibold text-base mb-1">{post.title}</h3>
      )}
      {textContent && (
        <p className="text-white text-sm mb-3 whitespace-pre-wrap break-words">
          {textContent.split(/(\s+)/).map((part, i) =>
            part.startsWith('#') ? (
              <Link
                key={`${part}-${i}`}
                to={`/tag/${part.slice(1).replace(/[^a-zA-Z0-9_]/g, '')}`}
                className="text-purple-400 hover:underline"
              >
                {part}
              </Link>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
      )}

      {/* Media */}
      <PostMedia mediaType={post.media_type} mediaUrl={post.media_url} alt={post.title || 'post media'} />

      {/* Tags */}
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
              ? (willActAsVport ? 'Comment as your VPORT…' : 'Comment (as you)…')
              : (willActAsVport ? 'Comment as your VPORT…' : 'Write a comment…')
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
                onDelete={(id) => setComments((prev) => prev.filter((x) => x.id !== id))}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
