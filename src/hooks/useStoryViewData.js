import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useStoryViewData(storyId) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [viewers, setViewers] = useState([]);
  const [emojiCounts, setEmojiCounts] = useState({});
  const [storyOwnerId, setStoryOwnerId] = useState(null); // ✅ NEW

  useEffect(() => {
    if (!storyId) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('Auth error:', error?.message);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: storyOwner } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      const ownerId = storyOwner?.user_id;
      setStoryOwnerId(ownerId); // ✅ store for notification use

      const isOwner = ownerId === user.id;
      setIsOwner(isOwner);

      const [{ data: views = [] }, { data: viewEvents = [] }, { data: reactions = [] }] = await Promise.all([
        supabase
          .from('story_views')
          .select(`
            user_id,
            viewed_at,
            profiles:user_id (
              display_name,
              photo_url
            )
          `)
          .eq('story_id', storyId),

        supabase
          .from('story_view_events')
          .select('user_id')
          .eq('story_id', storyId),

        supabase
          .from('story_reactions')
          .select('user_id, emoji')
          .eq('story_id', storyId),
      ]);

      const uniqueUserIds = new Set(views.map((v) => v.user_id));
      setTotalViews(uniqueUserIds.size);

      const viewCountMap = {};
      for (const e of viewEvents) {
        if (e.user_id === ownerId) continue;
        viewCountMap[e.user_id] = (viewCountMap[e.user_id] || 0) + 1;
      }

      const emojiMap = {};
      const userReactionMap = {};
      for (const r of reactions) {
        emojiMap[r.emoji] = (emojiMap[r.emoji] || 0) + 1;
        userReactionMap[r.user_id] = r.emoji;
      }

      const map = new Map();
      for (const row of views) {
        if (row.user_id === ownerId) continue;
        if (!row.profiles) continue;

        map.set(row.user_id, {
          ...row.profiles,
          user_id: row.user_id,
          count: viewCountMap[row.user_id] || 1,
          reaction: userReactionMap[row.user_id] || null,
        });
      }

      setEmojiCounts(emojiMap);
      setViewers(Array.from(map.values()));
      setLoading(false);
    };

    fetchData();
  }, [storyId]);

  return {
    loading,
    isOwner,
    userId,
    storyOwnerId, // ✅ return it so Viewby can use
    totalViews,
    viewers,
    emojiCounts,
  };
}
