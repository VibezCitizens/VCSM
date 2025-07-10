import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function VDropActions({ postId }) {
  const { user } = useAuth();
  const [like, setLike] = useState(false);
  const [dislike, setDislike] = useState(false);
  const [roses, setRoses] = useState(0);

  const loadReactions = async () => {
    const { data, error } = await supabase
      .from('post_reactions')
      .select('type, user_id')
      .eq('post_id', postId);

    if (error) return console.error('Error loading reactions:', error);

    const userLike = data.find(r => r.user_id === user?.id && r.type === 'like');
    const userDislike = data.find(r => r.user_id === user?.id && r.type === 'dislike');
    const totalRoses = data.filter(r => r.type === 'rose').length;

    setLike(!!userLike);
    setDislike(!!userDislike);
    setRoses(totalRoses);
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

    // Toggle current
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

  useEffect(() => {
    loadReactions();
  }, [postId]);

  return (
    <div className="flex flex-col items-center space-y-4 text-white text-xl">
      <button onClick={() => toggleReaction('like')} title="Like">
        <div className="text-2xl">{like ? '👍' : '👍'}</div>
      </button>
      <button onClick={() => toggleReaction('dislike')} title="Dislike">
        <div className="text-2xl">{dislike ? '👎' : '👎'}</div>
      </button>
      <button onClick={sendRose} title="Send a rose">
        <div className="text-2xl">🌹</div>
        <div className="text-sm">{roses}</div>
      </button>
    </div>
  );
}
