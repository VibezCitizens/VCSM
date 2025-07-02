import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import UserLink from '@/components/UserLink';
import CommentCard from '@/components/CommentCard';
import { getOrCreatePrivateConversation } from '@/lib/getOrCreatePrivateConversation';

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

export default function PostCard({ post, user = {} }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [roseCount, setRoseCount] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const menuRef = useRef(null);
  useOnClickOutside(menuRef, () => setShowMenu(false));

  const vibrate = (ms = 25) => navigator.vibrate?.(ms);

  const renderTextWithHashtags = (text) => {
    const parts = text.split(/(\s+)/).map((part, i) => {
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
    return parts;
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, profiles(*)')
      .eq('post_id', post.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (!error) setComments(data || []);
  };

  useEffect(() => {
    const fetchReactions = async () => {
      if (!currentUser?.id) return;
      const { data } = await supabase
        .from('post_reactions')
        .select('id, type, user_id')
        .eq('post_id', post.id);

      const likes = data.filter(r => r.type === 'like');
      const dislikes = data.filter(r => r.type === 'dislike');
      const roses = data.filter(r => r.type === 'rose');

      setLikeCount(likes.length);
      setDislikeCount(dislikes.length);
      setRoseCount(roses.length);

      const userReact = data.find(r => r.user_id === currentUser.id && ['like', 'dislike'].includes(r.type));
      setUserReaction(userReact?.type || null);
    };

    const checkSubscription = async () => {
      if (!currentUser?.id || currentUser.id === user.id) return;
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('followed_id', user.id)
        .single();
      if (!error) setIsSubscribed(!!data);
    };

    fetchReactions();
    fetchComments();
    checkSubscription();

    const reactionsSub = supabase
      .channel(`reactions-${post.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${post.id}` }, fetchReactions)
      .subscribe();

    const commentsSub = supabase
      .channel(`comments-${post.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${post.id}` }, fetchComments)
      .subscribe();

    return () => {
      supabase.removeChannel(reactionsSub);
      supabase.removeChannel(commentsSub);
    };
  }, [post.id, currentUser?.id, user.id]);

  const handlePostComment = async () => {
    if (!replyText.trim() || !currentUser?.id) return;
    await supabase.from('post_comments').insert({
      post_id: post.id,
      user_id: currentUser.id,
      content: replyText.trim(),
    });
    setReplyText('');
    setShowComments(true);
    await fetchComments();
  };

  const handleReact = async (type) => {
    vibrate();
    const uid = currentUser?.id;
    if (!uid) return;

    if (type === 'rose') {
      setRoseCount(prev => prev + 1);
      const { error } = await supabase.from('post_reactions').insert({ post_id: post.id, user_id: uid, type });
      if (error) setRoseCount(prev => prev - 1);
      return;
    }

    const { data: existing } = await supabase
      .from('post_reactions')
      .select('id, type')
      .eq('post_id', post.id)
      .eq('user_id', uid)
      .in('type', ['like', 'dislike']);

    if (existing.length > 0) {
      const match = existing[0];
      if (match.type === type) {
        setUserReaction(null);
        type === 'like' ? setLikeCount(c => Math.max(0, c - 1)) : setDislikeCount(c => Math.max(0, c - 1));
        await supabase.from('post_reactions').delete().eq('id', match.id);
      } else {
        setUserReaction(type);
        type === 'like' ? setLikeCount(c => c + 1) : setDislikeCount(c => c + 1);
        type === 'like' ? setDislikeCount(c => Math.max(0, c - 1)) : setLikeCount(c => Math.max(0, c - 1));
        await supabase.from('post_reactions').update({ type }).eq('id', match.id);
      }
    } else {
      setUserReaction(type);
      type === 'like' ? setLikeCount(c => c + 1) : setDislikeCount(c => c + 1);
      await supabase.from('post_reactions').insert({ post_id: post.id, user_id: uid, type });
    }
  };

  const handleDeletePost = async () => {
    if (currentUser?.id !== user.id) return;
    await supabase.from('posts').delete().eq('id', post.id);
    navigate('/home');
  };

  const handleToggleSubscribe = async () => {
    if (!currentUser?.id || !user?.id || currentUser.id === user.id) return;
    if (isSubscribed) {
      await supabase.from('followers').delete().eq('follower_id', currentUser.id).eq('followed_id', user.id);
      setIsSubscribed(false);
    } else {
      await supabase.from('followers').insert({ follower_id: currentUser.id, followed_id: user.id });
      setIsSubscribed(true);
    }
  };

  const handleMessage = async () => {
    if (!currentUser?.id || !user?.id || currentUser.id === user.id) return;
    const convo = await getOrCreatePrivateConversation(currentUser.id, user.id);
    if (convo) navigate(`/chat/${convo}`);
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow mb-4 mx-2 relative">
      <div className="flex items-center justify-between mb-2">
        <UserLink user={user} avatarSize="w-9 h-9 rounded-md" textSize="text-sm" />
        <div className="flex gap-2 items-center">
          {currentUser?.id !== user.id && (
            <>
              <button onClick={handleToggleSubscribe} className={`text-xs px-2 py-1 rounded ${isSubscribed ? 'bg-purple-600' : 'bg-neutral-700'} text-white`}>
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
              <button onClick={handleMessage} className="text-xs px-2 py-1 rounded bg-neutral-700 text-white">Message</button>
            </>
          )}
          <div ref={menuRef} className="relative">
            <button onClick={() => setShowMenu(p => !p)}>⋯</button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded shadow p-2 z-50">
                {currentUser?.id === user.id ? (
                  <button onClick={handleDeletePost} className="text-red-400">Delete Post</button>
                ) : (
                  <button className="text-yellow-400">Report Post</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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

      <div className="flex flex-wrap gap-3 items-center mb-2">
        <button onClick={() => handleReact('like')} className={`text-sm px-2 py-1 rounded ${userReaction === 'like' ? 'bg-blue-600' : 'bg-neutral-700'} text-white`}>
          👍 {likeCount}
        </button>
        <button onClick={() => handleReact('dislike')} className={`text-sm px-2 py-1 rounded ${userReaction === 'dislike' ? 'bg-red-600' : 'bg-neutral-700'} text-white`}>
          👎 {dislikeCount}
        </button>
        <button onClick={() => handleReact('rose')} className="text-sm px-2 py-1 rounded bg-neutral-700 text-white">
          🌹 {roseCount}
        </button>
      </div>

      <div className="flex mt-2">
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="bg-neutral-900 text-white p-2 rounded-l w-full text-sm"
          placeholder="Write a comment..."
        />
        <button onClick={handlePostComment} className="bg-purple-600 px-4 rounded-r text-sm">Post</button>
      </div>

      <div className="mt-2">
        {comments.length > 0 && (
          showComments ? (
            <button onClick={() => setShowComments(false)} className="text-xs text-purple-400">Hide comments ({comments.length})</button>
          ) : (
            <button onClick={() => setShowComments(true)} className="text-xs text-purple-400">View comments ({comments.length})</button>
          )
        )}
        {comments.length === 0 && !showComments && (
          <button onClick={() => setShowComments(true)} className="text-xs text-purple-400">Be the first to comment!</button>
        )}
      </div>

      {showComments && (
        <div className="space-y-2 mt-2">
          {comments.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-2">No comments yet.</p>
          ) : (
            comments.map(c => <CommentCard key={c.id} comment={c} />)
          )}
        </div>
      )}
    </div>
  );
}
