// File: src/components/PostCard.jsx
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getOrCreateConversation } from '@/features/chat/utils/getOrCreateConversation';
import UserLink from '@/components/UserLink';
import CommentCard from '@/components/CommentCard';

// ✅ Helpers aligned to the rebuilt schema
import {
  fetchReactionState,   // -> { likeCount, dislikeCount, roseCount, myReaction }
  setReaction,          // setReaction(postId, 'like'|'dislike'|null)
  giveRoses,            // giveRoses(postId, qty)
  subscribePostCounters // subscribePostCounters(postId, patch => {likeCount?,dislikeCount?,roseCount?})
} from '@/lib/reactions';

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

// tiny logger helpers
const gstart = (label, extra = {}) =>
  console.groupCollapsed(`%c[PostCard] ${label}`, 'color:#a78bfa;font-weight:bold', extra);
const gend = () => console.groupEnd();
const logSupa = (label, { data, error, count } = {}) => {
  if (error) console.error('%c[PostCard]', 'color:#ef4444', `${label} -> ERROR`, error);
  else console.log('%c[PostCard]', 'color:#a78bfa', `${label} -> OK`, {
    rows: Array.isArray(data) ? data.length : data ? 1 : 0, count, data
  });
};

/* ------------------------------- component ------------------------------- */

export default function PostCard({ post, user = null, onSubscriptionChange, onDelete }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Author resolution
  const authorId = user?.id ?? post?.user_id ?? null;
  const author = user ?? {
    id: authorId,
    display_name: post?.profiles?.display_name ?? null,
    username: post?.profiles?.username ?? null,
    photo_url: post?.profiles?.photo_url ?? null,
  };

  // Reaction counters + my reaction (init with denorm counts when available)
  const [likeCount, setLikeCount] = useState(post?.like_count ?? 0);
  const [dislikeCount, setDislikeCount] = useState(post?.dislike_count ?? 0);
  const [roseCount, setRoseCount] = useState(post?.rose_count ?? 0);
  const [userReaction, setUserReaction] = useState(null); // 'like'|'dislike'|null

  // Comments
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState('');

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [authorExists, setAuthorExists] = useState(true);

  useOnClickOutside(menuRef, () => setShowMenu(false));

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

  /* ----------------------------- data fetching ----------------------------- */

  const fetchComments = async () => {
    gstart('fetchComments', { postId: post?.id });
    try {
      const res = await supabase
        .from('post_comments')
        .select(`
          id, content, created_at, user_id, parent_id,
          profiles!post_comments_user_id_fkey ( id, display_name, username, photo_url )
        `)
        .eq('post_id', post.id)
        .is('parent_id', null)
        .order('created_at', { ascending: true });
      logSupa('post_comments.select', res);
      if (res.error) throw res.error;
      setComments(res.data || []);
    } catch (e) {
      console.error('fetchComments error', e);
    } finally {
      gend();
    }
  };

  const fetchReactionSnapshot = async () => {
    gstart('fetchReactionSnapshot', { postId: post?.id, viewer: currentUser?.id });
    try {
      const s = await fetchReactionState(post.id);
      setLikeCount(s.likeCount ?? 0);
      setDislikeCount(s.dislikeCount ?? 0);
      setRoseCount(s.roseCount ?? 0);
      setUserReaction(s.myReaction ?? null);
    } catch (e) {
      console.error('fetchReactionSnapshot error', e);
    } finally {
      gend();
    }
  };

  const checkSubscription = async () => {
    gstart('checkSubscription', { viewer: currentUser?.id, authorId });
    try {
      if (!currentUser?.id || !authorId || currentUser.id === authorId) {
        setIsSubscribed(false);
        return;
      }
      const res = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('followed_id', authorId)
        .maybeSingle();
      logSupa('followers.select maybeSingle', res);
      if (res.error && res.error.code !== 'PGRST116') throw res.error;
      setIsSubscribed(Boolean(res.data));
    } catch (e) {
      console.error('checkSubscription error', e);
    } finally {
      gend();
    }
  };

  const verifyAuthorExists = async () => {
    gstart('verifyAuthorExists', { authorId });
    try {
      if (!authorId) {
        setAuthorExists(false);
        return;
      }
      const res = await supabase.from('profiles').select('id').eq('id', authorId).maybeSingle();
      logSupa('profiles.exists maybeSingle', res);
      setAuthorExists(Boolean(res.data));
    } catch (e) {
      console.error('verifyAuthorExists error', e);
      setAuthorExists(false);
    } finally {
      gend();
    }
  };

  useEffect(() => {
    gstart('mount/useEffect', { postId: post?.id, viewer: currentUser?.id, authorId });

    fetchReactionSnapshot();
    fetchComments();
    checkSubscription();
    verifyAuthorExists();

    // Realtime counters via triggers to posts.{like_count,dislike_count,rose_count}
    const unsubscribeCounters = subscribePostCounters(post.id, (patch) => {
      if (patch.likeCount !== undefined) setLikeCount(patch.likeCount);
      if (patch.dislikeCount !== undefined) setDislikeCount(patch.dislikeCount);
      if (patch.roseCount !== undefined) setRoseCount(patch.roseCount);
    });

    // Realtime comments
    const commentsSub = supabase
      .channel(`comments-${post.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${post.id}` },
        fetchComments
      )
      .subscribe();

    gend();

    return () => {
      unsubscribeCounters?.();
      supabase.removeChannel(commentsSub);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, currentUser?.id, authorId]);

  /* -------------------------------- actions -------------------------------- */

  const handlePostComment = async () => {
    gstart('handlePostComment');
    try {
      const uid = currentUser?.id;
      const text = replyText.trim();
      if (!uid || !text) return;

      const res = await supabase
        .from('post_comments')
        .insert({ post_id: post.id, user_id: uid, content: text })
        .select('*')
        .single();
      logSupa('post_comments.insert', res);
      if (res.error) throw res.error;

      setReplyText('');
      setShowComments(true);
      await fetchComments();
    } catch (e) {
      alert(`Failed to comment: ${e?.message || e}`);
    } finally {
      gend();
    }
  };

  const handleReact = async (type) => {
    gstart('handleReact', { type });
    try {
      vibrate();
      const uid = currentUser?.id;
      if (!uid) return;

      if (type === 'rose') {
        // 🌹 multi-rose: 1 per tap (server clamps 1..100 if you add quick buttons later)
        setRoseCount((c) => c + 1); // optimistic
        try {
          await giveRoses(post.id, 1);
        } catch (roseErr) {
          setRoseCount((c) => Math.max(0, c - 1));
          throw roseErr;
        }
      } else {
        // 👍/👎 single reaction per user (toggle or switch)
        const prev = userReaction; // 'like'|'dislike'|null
        const next =
          type === 'like' ? (prev === 'like' ? null : 'like') : (prev === 'dislike' ? null : 'dislike');

        // optimistic counters
        if (next === 'like') {
          if (prev === 'dislike') setDislikeCount((c) => Math.max(0, c - 1));
          if (prev !== 'like') setLikeCount((c) => c + 1);
        } else if (next === 'dislike') {
          if (prev === 'like') setLikeCount((c) => Math.max(0, c - 1));
          if (prev !== 'dislike') setDislikeCount((c) => c + 1);
        } else {
          if (prev === 'like') setLikeCount((c) => Math.max(0, c - 1));
          if (prev === 'dislike') setDislikeCount((c) => Math.max(0, c - 1));
        }
        setUserReaction(next);

        try {
          await setReaction(post.id, next); // RPC set_post_reaction
        } catch (tErr) {
          // reset from server truth on failure
          await fetchReactionSnapshot();
          throw tErr;
        }
      }

      // final sync with server state
      await fetchReactionSnapshot();
    } catch (e) {
      alert(`Failed to react: ${e?.message || e}`);
    } finally {
      gend();
    }
  };

  const handleDeletePost = async () => {
    gstart('handleDeletePost');
    try {
      if (!currentUser?.id || currentUser.id !== authorId) return;
      const res = await supabase.from('posts').update({ deleted: true }).eq('id', post.id).select('*').single();
      logSupa('posts.update deleted=true', res);
      if (res.error) throw res.error;
      onDelete?.(post.id);
    } catch (e) {
      alert(`Failed to delete: ${e?.message || e}`);
    } finally {
      gend();
    }
  };

  const handleToggleSubscribe = async () => {
    gstart('handleToggleSubscribe', { viewer: currentUser?.id, authorId, isSubscribed, authorExists });
    try {
      const uid = currentUser?.id;
      if (!uid || !authorId || !authorExists || uid === authorId) return;

      if (isSubscribed) {
        const del = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', uid)
          .eq('followed_id', authorId)
          .select('*');
        logSupa('followers.delete', del);
        if (del.error) throw del.error;
      } else {
        const ins = await supabase
          .from('followers')
          .insert({ follower_id: uid, followed_id: authorId })
          .select('*')
          .single();
        logSupa('followers.insert', ins);
        if (ins.error) throw ins.error;
      }

      await checkSubscription();
      onSubscriptionChange?.();
    } catch (e) {
      alert(`Failed to follow/unfollow: ${e?.message || e}`);
    } finally {
      gend();
    }
  };

  const handleMessage = async () => {
    gstart('handleMessage');
    try {
      const uid = currentUser?.id;
      if (!uid || !authorId || uid === authorId) return;
      const convo = await getOrCreateConversation(authorId);
      if (convo?.id) navigate(`/chat/${convo.id}`);
    } catch (e) {
      // no-op
    } finally {
      gend();
    }
  };

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow mb-4 mx-2 relative">
      {/* Header: author + actions */}
      <div className="flex items-center justify-between mb-2">
        <UserLink
          user={author}
          avatarSize="w-9 h-9"
          avatarShape="rounded-md"
          textSize="text-sm"
          showTimestamp
          timestamp={formatPostTime(post.created_at)}
        />
        <div className="flex gap-2 items-center">
          {currentUser?.id && authorId && authorExists && currentUser.id !== authorId && (
            <>
              <button
                onClick={handleToggleSubscribe}
                className={`text-xs px-2 py-1 rounded ${isSubscribed ? 'bg-purple-600' : 'bg-neutral-700'} text-white`}
              >
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
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
                {currentUser?.id === authorId ? (
                  <button onClick={handleDeletePost} className="text-red-400">
                    Delete Post
                  </button>
                ) : (
                  <button className="text-yellow-400">Report Post</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body: text, media, tags */}
      {post.text && (
        <p className="text-white text-sm mb-3 whitespace-pre-wrap">
          {renderTextWithHashtags(post.text)}
        </p>
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
          className={`text-sm px-2 py-1 rounded ${userReaction === 'like' ? 'bg-purple-600' : 'bg-neutral-700'} text-white`}
          aria-pressed={userReaction === 'like'}
        >
          👍 {likeCount}
        </button>
        <button
          onClick={() => handleReact('dislike')}
          className={`text-sm px-2 py-1 rounded ${userReaction === 'dislike' ? 'bg-red-600' : 'bg-neutral-700'} text-white`}
          aria-pressed={userReaction === 'dislike'}
        >
          👎 {dislikeCount}
        </button>
        <button
          onClick={() => handleReact('rose')}
          className="text-sm px-2 py-1 rounded bg-neutral-700 text-white"
          title="Send a rose"
        >
          🌹 {roseCount}
        </button>
      </div>

      {/* Quick comment input */}
      <div className="flex mt-2">
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="bg-neutral-900 text-white p-2 rounded-l w-full text-sm"
          placeholder="Write a comment..."
        />
        <button
          onClick={handlePostComment}
          className="bg-purple-600 px-4 rounded-r text-sm text-white"
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
            comments.map((c) => <CommentCard key={c.id} comment={c} />)
          )}
        </div>
      )}
    </div>
  );
}
