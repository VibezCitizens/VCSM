import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import UserLink from '@/components/UserLink';
import { createPrivateConversation } from '@/utils/createPrivateConversation';

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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  const vibrate = (ms = 25) => navigator.vibrate?.(ms);

  useEffect(() => {
    const fetchReactions = async () => {
      const { data } = await supabase
        .from('post_reactions')
        .select('type, user_id')
        .eq('post_id', post.id);

      setLikeCount(data.filter(r => r.type === 'like').length);
      setDislikeCount(data.filter(r => r.type === 'dislike').length);
      setRoseCount(data.filter(r => r.type === 'rose').length);

      const mine = data.find(r => r.user_id === currentUser?.id && r.type !== 'rose');
      setUserReaction(mine?.type || null);
    };

    fetchReactions();

    const sub = supabase
      .channel(`reactions-${post.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${post.id}` }, fetchReactions)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [post.id, currentUser]);

  useEffect(() => {
    const loadComments = async () => {
      const { data } = await supabase
        .from('post_comments')
        .select('*, profiles:profiles!post_comments_user_id_fkey(display_name, photo_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      setComments(data || []);
    };

    loadComments();

    const sub = supabase
      .channel(`comments-${post.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${post.id}` }, loadComments)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [post.id]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentUser?.id || !user?.id || currentUser.id === user.id) return;

      const { data } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('followed_id', user.id)
        .maybeSingle();

      setIsSubscribed(!!data);
    };

    checkSubscription();
  }, [currentUser, user]);

  const handleReact = async (type) => {
    vibrate(20);
    if (!currentUser?.id) return;

    if (type === 'rose') {
      await supabase.from('post_reactions').insert({ post_id: post.id, user_id: currentUser.id, type });
      setRoseCount((prev) => prev + 1);
      return;
    }

    if (userReaction === type) {
      await supabase.from('post_reactions').delete().match({ post_id: post.id, user_id: currentUser.id, type });
      setUserReaction(null);
      if (type === 'like') setLikeCount((prev) => prev - 1);
      if (type === 'dislike') setDislikeCount((prev) => prev - 1);
    } else {
      if (userReaction) {
        await supabase.from('post_reactions').delete().match({ post_id: post.id, user_id: currentUser.id, type: userReaction });
        if (userReaction === 'like') setLikeCount((prev) => prev - 1);
        if (userReaction === 'dislike') setDislikeCount((prev) => prev - 1);
      }

      await supabase.from('post_reactions').upsert({ post_id: post.id, user_id: currentUser.id, type });
      setUserReaction(type);
      if (type === 'like') setLikeCount((prev) => prev + 1);
      if (type === 'dislike') setDislikeCount((prev) => prev + 1);

      if (type === 'like' && post.user_id !== currentUser.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: currentUser.id,
          type: 'like',
          post_id: post.id,
        });
      }
    }
  };

  const handleSubscribe = async () => {
    setSubscribeLoading(true);
    if (isSubscribed) {
      await supabase.from('followers').delete().match({ follower_id: currentUser.id, followed_id: user.id });
      setIsSubscribed(false);
    } else {
      await supabase.from('followers').insert({ follower_id: currentUser.id, followed_id: user.id });
      setIsSubscribed(true);

      if (currentUser.id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          actor_id: currentUser.id,
          type: 'follow',
        });
      }
    }
    setSubscribeLoading(false);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await supabase.from('post_comments').insert({
      post_id: post.id,
      user_id: currentUser.id,
      content: replyText.trim(),
    });
    setReplyText('');

    if (post.user_id !== currentUser.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        actor_id: currentUser.id,
        type: 'comment',
        post_id: post.id,
      });
    }
  };

  const handleMessage = async () => {
    if (!currentUser?.id || !user?.id || currentUser.id === user.id) return;
    try {
      const convoId = await createPrivateConversation(currentUser.id, user.id);
      navigate(`/chat/${convoId}`);
    } catch {
      alert('Could not start chat.');
    }
  };

  const mediaStyles = 'w-full rounded-lg border border-neutral-700 mb-3 max-h-72 object-cover';

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow-md mb-4 mx-4">
      <div className="flex items-center justify-between mb-2">
        <UserLink user={user} avatarSize="w-9 h-9" textSize="text-sm" />
        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.created_at))} ago</span>
      </div>

      {currentUser?.id !== user?.id && (
        <div className="flex gap-2 mb-2">
          <button onClick={handleSubscribe} disabled={subscribeLoading} className="px-3 py-1 text-sm rounded bg-purple-600 text-white">
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
          <button onClick={handleMessage} className="px-3 py-1 text-sm rounded bg-neutral-600 text-white">
            Message
          </button>
        </div>
      )}

      {post.text && <p className="text-white text-sm mb-3 whitespace-pre-wrap">{post.text}</p>}

      {post.media_type === 'image' && post.media_url && (
        <img
          src={post.media_url}
          alt="media"
          className={mediaStyles}
          onError={(e) => (e.target.style.display = 'none')}
        />
      )}

      {post.media_type === 'video' && post.media_url && (
        <video
          src={post.media_url}
          controls
          className={mediaStyles}
          onError={(e) => (e.target.style.display = 'none')}
        />
      )}

      <div className="flex flex-wrap gap-3 items-center mb-2">
        <button onClick={() => handleReact('like')} className="flex items-center gap-1 text-white text-sm">👍 {likeCount}</button>
        <button onClick={() => handleReact('dislike')} className="flex items-center gap-1 text-white text-sm">👎 {dislikeCount}</button>
        <button onClick={() => handleReact('rose')} className="flex items-center gap-1 text-white text-sm">🌹 {roseCount}</button>
        <button onClick={() => setShowComments(!showComments)} className="text-xs text-purple-300 underline ml-auto">
          {showComments ? 'Hide comments' : `View ${comments.length} comments`}
        </button>
      </div>

      {showComments && (
        <div className="space-y-2 mt-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 bg-neutral-900 border border-neutral-700 rounded p-2">
              <UserLink user={comment.profiles} avatarSize="w-6 h-6" textSize="text-sm" />
              <div>
                <p className="text-sm text-white">{comment.content}</p>
                <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.created_at))} ago</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Write a comment..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 text-sm px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-white"
            />
            <button onClick={handleReply} className="px-3 py-2 bg-purple-600 text-white rounded text-sm">Post</button>
          </div>
        </div>
      )}
    </div>
  );
}
