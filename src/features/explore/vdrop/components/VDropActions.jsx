import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Share2 } from 'lucide-react';

export default function VDropActions({ postId, mediaUrl, title }) {
  const { user } = useAuth();
  const [like, setLike] = useState(false);
  const [dislike, setDislike] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [roseCount, setRoseCount] = useState(0);

  const loadReactions = async () => {
    const { data, error } = await supabase
      .from('post_reactions')
      .select('type, user_id')
      .eq('post_id', postId);

    if (error) return console.error('Error loading reactions:', error);

    const userLike = data.find(r => r.user_id === user?.id && r.type === 'like');
    const userDislike = data.find(r => r.user_id === user?.id && r.type === 'dislike');

    setLike(!!userLike);
    setDislike(!!userDislike);
    setLikeCount(data.filter(r => r.type === 'like').length);
    setDislikeCount(data.filter(r => r.type === 'dislike').length);
    setRoseCount(data.filter(r => r.type === 'rose').length);
  };

  const toggleReaction = async (type) => {
    if (!user) return;

    const opposite = type === 'like' ? 'dislike' : 'like';

    // Remove opposite reaction
    await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('type', opposite);

    // Toggle current reaction
    const alreadyReacted = (type === 'like' ? like : dislike);
    if (alreadyReacted) {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('type', type);
    } else {
      await supabase
        .from('post_reactions')
        .insert({ post_id: postId, user_id: user.id, type });
    }

    loadReactions();
  };

  const sendRose = async () => {
    if (!user) return;

    await supabase
      .from('post_reactions')
      .insert({ post_id: postId, user_id: user.id, type: 'rose' });

    loadReactions();
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: title || 'Check this out!',
          text: 'Watch this on Vibez Citizens',
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard');
    }
  };

  useEffect(() => {
    loadReactions();
  }, [postId]);

  return (
    <div className="flex flex-col items-center space-y-5 text-white text-xl">
      {/* Like */}
      <button onClick={() => toggleReaction('like')} title="Like" className="flex flex-col items-center">
        <div className="text-2xl">{like ? '👍' : '👍'}</div>
        <span className="text-xs text-white">{likeCount}</span>
      </button>

      {/* Dislike */}
      <button onClick={() => toggleReaction('dislike')} title="Dislike" className="flex flex-col items-center">
        <div className="text-2xl">{dislike ? '👎' : '👎'}</div>
        <span className="text-xs text-white">{dislikeCount}</span>
      </button>

      {/* Rose */}
      <button onClick={sendRose} title="Send a rose" className="flex flex-col items-center">
        <div className="text-2xl">🌹</div>
        <span className="text-xs text-white">{roseCount}</span>
      </button>

      {/* Share */}
      <button onClick={handleShare} title="Share" className="flex flex-col items-center">
        <Share2 className="w-5 h-5" />
        <span className="text-xs text-white">Share</span>
      </button>
    </div>
  );
}
