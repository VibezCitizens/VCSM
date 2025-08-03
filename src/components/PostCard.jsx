import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getOrCreateConversation } from '@/features/chat/utils/getOrCreateConversation';
import UserLink from '@/components/UserLink';
import CommentCard from '@/components/CommentCard';

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

export default function PostCard({ post, user = {}, onSubscriptionChange, onDelete }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // -- DEBUG: log on every render
  console.log('PostCard render:', { postId: post.id, currentUser });

  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [roseCount, setRoseCount] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useOnClickOutside(menuRef, () => setShowMenu(false));

  const vibrate = (ms = 25) => navigator.vibrate?.(ms);

  const renderTextWithHashtags = (text) =>
    text.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
        return (
          <Link key={i} to={`/tag/${tag}`} className="text-purple-400 hover:underline">
            {part}
          </Link>
        );
      }
      return part;
    });

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id, content, created_at, user_id, parent_id,
          profiles(id, display_name, username, photo_url)
        `)
        .eq('post_id', post.id)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
      console.log('fetched comments:', data);
    } catch (err) {
      console.error('fetchComments error:', err);
    }
  };

  const fetchReactions = async () => {
    try {
      if (!currentUser?.id) {
        console.log('skip fetchReactions: no currentUser.id');
        return;
      }
      const { data, error } = await supabase
        .from('post_reactions')
        .select('id, type, user_id')
        .eq('post_id', post.id);

      if (error) throw error;

      const likes = data.filter((r) => r.type === 'like');
      const dislikes = data.filter((r) => r.type === 'dislike');
      const roses = data.filter((r) => r.type === 'rose');

      setLikeCount(likes.length);
      setDislikeCount(dislikes.length);
      setRoseCount(roses.length);

      const userReact = data.find(
        (r) => r.user_id === currentUser.id && ['like', 'dislike'].includes(r.type)
      );
      setUserReaction(userReact?.type || null);

      console.log('fetched reactions:', { likes, dislikes, roses, userReact });
    } catch (err) {
      console.error('fetchReactions error:', err);
    }
  };

  const checkSubscription = async () => {
    try {
      if (!currentUser?.id || currentUser.id === user.id) {
        console.log('skip checkSubscription');
        return;
      }
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('followed_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsSubscribed(!!data);
      console.log('subscription status:', !!data);
    } catch (err) {
      console.error('checkSubscription error:', err);
    }
  };

  useEffect(() => {
    fetchReactions();
    fetchComments();
    checkSubscription();

    const reactionsSub = supabase
      .channel(`reactions-${post.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${post.id}` },
        fetchReactions
      )
      .subscribe();

    const commentsSub = supabase
      .channel(`comments-${post.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${post.id}` },
        fetchComments
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reactionsSub);
      supabase.removeChannel(commentsSub);
    };
  }, [post.id, currentUser?.id, user.id]);

  const handlePostComment = async () => {
    try {
      if (!replyText.trim() || !currentUser?.id) {
        console.log('skip handlePostComment');
        return;
      }
      const { error } = await supabase.from('post_comments').insert({
        post_id: post.id,
        user_id: currentUser.id,
        content: replyText.trim(),
      });
      if (error) throw error;
      setReplyText('');
      setShowComments(true);
      await fetchComments();
      console.log('comment posted');
    } catch (err) {
      console.error('handlePostComment error:', err);
    }
  };

  const handleReact = async (type) => {
    try {
      console.log('handleReact called:', { type, postId: post.id, currentUserId: currentUser?.id });
      vibrate();
      const uid = currentUser?.id;
      if (!uid) {
        console.log('handleReact early exit: no uid');
        return;
      }

      if (type === 'rose') {
        await supabase.from('post_reactions').insert({ post_id: post.id, user_id: uid, type });
        console.log('rose reaction inserted');
      } else {
        const { data: existingReactions, error: fetchError } = await supabase
          .from('post_reactions')
          .select('id, type')
          .eq('post_id', post.id)
          .eq('user_id', uid)
          .in('type', ['like', 'dislike'])
          .limit(1);

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const existing = existingReactions?.[0];
        if (existing) {
          if (existing.type === type) {
            await supabase.from('post_reactions').delete().eq('id', existing.id);
            console.log(`removed existing ${type}`);
          } else {
            await supabase.from('post_reactions').update({ type }).eq('id', existing.id);
            console.log(`updated reaction to ${type}`);
          }
        } else {
          await supabase.from('post_reactions').insert({ post_id: post.id, user_id: uid, type });
          console.log(`inserted new ${type}`);
        }
      }

      await fetchReactions();
    } catch (err) {
      console.error('handleReact error:', err);
    }
  };

  const handleDeletePost = async () => {
    try {
      if (currentUser?.id !== user.id) {
        console.log('skip delete: not author');
        return;
      }
      const { error } = await supabase.from('posts').update({ deleted: true }).eq('id', post.id);
      if (error) throw error;
      onDelete?.(post.id);
      console.log('post marked deleted');
    } catch (err) {
      console.error('handleDeletePost error:', err);
      alert('Failed to delete post');
    }
  };

  const handleToggleSubscribe = async () => {
    try {
      if (!currentUser?.id || currentUser.id === user.id) {
        console.log('skip toggleSubscribe');
        return;
      }
      if (isSubscribed) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('followed_id', user.id);
        console.log('unsubscribed');
      } else {
        await supabase.from('followers').insert({ follower_id: currentUser.id, followed_id: user.id });
        console.log('subscribed');
      }
      await checkSubscription();
      onSubscriptionChange?.();
    } catch (err) {
      console.error('handleToggleSubscribe error:', err);
    }
  };

  const handleMessage = async () => {
    try {
      if (!currentUser?.id || !user?.id || currentUser.id === user.id) {
        console.log('skip message: invalid users');
        return;
      }
      const convo = await getOrCreateConversation(user.id);
      if (convo?.id) {
        navigate(`/chat/${convo.id}`);
        console.log('navigated to convo', convo.id);
      } else {
        console.error('could not open/create conversation');
      }
    } catch (err) {
      console.error('handleMessage error:', err);
    }
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow mb-4 mx-2 relative">
      {/* Header: author + actions */}
      <div className="flex items-center justify-between mb-2">
        <UserLink
          user={user}
          avatarSize="w-9 h-9"
          avatarShape="rounded-md"
          textSize="text-sm"
          showTimestamp
          timestamp={formatPostTime(post.created_at)}
        />
        <div className="flex gap-2 items-center">
          {currentUser?.id !== user.id && (
            <>
              <button
                onClick={handleToggleSubscribe}
                className={`text-xs px-2 py-1 rounded ${
                  isSubscribed ? 'bg-purple-600' : 'bg-neutral-700'
                } text-white`}
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
            <button onClick={() => setShowMenu((p) => !p)}>⋯</button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded shadow p-2 z-50">
                {currentUser?.id === user.id ? (
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
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag, i) => (
            <Link
              key={i}
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
          className={`text-sm px-2 py-1 rounded ${
            userReaction === 'like' ? 'bg-purple-600' : 'bg-neutral-700'
          } text-white`}
        >
          👍 {likeCount}
        </button>
        <button
          onClick={() => handleReact('dislike')}
          className={`text-sm px-2 py-1 rounded ${
            userReaction === 'dislike' ? 'bg-red-600' : 'bg-neutral-700'
          } text-white`}
        >
          👎 {dislikeCount}
        </button>
        <button
          onClick={() => handleReact('rose')}
          className="text-sm px-2 py-1 rounded bg-neutral-700 text-white"
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
        {comments.length > 0 && (
          showComments ? (
            <button
              onClick={() => setShowComments(false)}
              className="text-xs text-purple-400"
            >
              Hide comments ({comments.length})
            </button>
          ) : (
            <button
              onClick={() => setShowComments(true)}
              className="text-xs text-purple-400"
            >
              View comments ({comments.length})
            </button>
          )
        )}
        {comments.length === 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-xs text-purple-400"
          >
            Be the first to comment!
          </button>
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
