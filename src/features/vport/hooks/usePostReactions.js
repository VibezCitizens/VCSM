import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LIKE, DISLIKE } from '@/features/vport/constants';

export function usePostReactions(posts, userId, onAuthRequired) {
  const [countsByPost, setCountsByPost] = React.useState({});
  const [myReactions, setMyReactions] = React.useState({});
  const [reacting, setReacting] = React.useState({});

  React.useEffect(() => {
    const ids = (posts || []).map(p => p.id);
    if (!ids.length) {
      setCountsByPost({});
      setMyReactions({});
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('vport_post_reactions')
          .select('post_id, user_id, reaction')
          .in('post_id', ids);

        if (error) throw error;

        const byPost = {};
        const mine = {};
        for (const row of data || []) {
          const pid = row.post_id;
          const reaction = row.reaction;
          if (!byPost[pid]) byPost[pid] = { [LIKE]: 0, [DISLIKE]: 0 };
          byPost[pid][reaction] = (byPost[pid][reaction] || 0) + 1;
          if (userId && row.user_id === userId) mine[pid] = reaction;
        }

        setCountsByPost(byPost);
        setMyReactions(mine);
      } catch (e) {
        console.error('[reactions] load error:', e);
        setCountsByPost({});
        setMyReactions({});
      }
    })();
  }, [posts, userId]);

  async function toggleReaction(postId, reaction) {
    if (!userId) {
      onAuthRequired?.();
      return;
    }
    setReacting(prev => ({ ...prev, [postId]: true }));

    // Optimistic update
    setCountsByPost(prev => {
      const cur = { [LIKE]: 0, [DISLIKE]: 0, ...(prev[postId] || {}) };
      const mine = myReactions[postId];

      // Decrement the count of the previous reaction
      if (mine) {
        cur[mine] = Math.max(0, cur[mine] - 1);
      }

      // If the new reaction is different from the previous one, increment its count
      if (mine !== reaction) {
        cur[reaction] = (cur[reaction] || 0) + 1;
      }
      return { ...prev, [postId]: cur };
    });

    setMyReactions(prev => ({ ...prev, [postId]: prev[postId] === reaction ? undefined : reaction }));

    try {
      const { data: existing, error: readErr } = await supabase
        .from('vport_post_reactions')
        .select('reaction')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (readErr) throw readErr;

      if (existing?.reaction === reaction) {
        // User is un-reacting
        await supabase.from('vport_post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
      } else {
        // User is adding a new reaction or changing it
        const payload = { post_id: postId, user_id: userId, reaction: reaction, updated_at: new Date().toISOString() };
        await supabase.from('vport_post_reactions')
          .upsert(payload, { onConflict: 'post_id,user_id' });
      }
    } catch (e) {
      console.error('[reactions] toggle failed:', e);
      // Revert optimistic update if the API call fails
      // This part would require a re-fetch or more complex state management
      // For simplicity, we'll just log the error.
    } finally {
      setReacting(prev => ({ ...prev, [postId]: false }));
    }
  }

  return { countsByPost, myReactions, reacting, toggleReaction };
}