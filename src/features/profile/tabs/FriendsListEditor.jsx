import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableFriend from './components/SortableFriend';



export default function FriendsListEditor({ userId }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankedFriends = async () => {
      setLoading(true);
      try {
        // Get who I follow
        const { data: following } = await supabase
          .from('followers')
          .select('followed_id')
          .eq('follower_id', userId);

        // Get who follows me
        const { data: followers } = await supabase
          .from('followers')
          .select('follower_id')
          .eq('followed_id', userId);

        // Get mutual friend IDs
        const mutualIds = following
          .map(f => f.followed_id)
          .filter(id => followers.map(f => f.follower_id).includes(id));

        // Get existing ranks
        const { data: ranks } = await supabase
          .from('friend_ranks')
          .select('friend_id, rank')
          .eq('user_id', userId);

        const rankMap = {};
        ranks?.forEach(r => {
          rankMap[r.friend_id] = r.rank;
        });

        // Get profile data for mutual friends
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, photo_url')
          .in('id', mutualIds);

        // Sort by rank or fallback
        const sorted = [...profiles].sort((a, b) => {
          const rankA = rankMap[a.id] ?? 999;
          const rankB = rankMap[b.id] ?? 999;
          return rankA - rankB;
        });

        setFriends(sorted);
      } catch (err) {
        console.error('Failed to load friends', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankedFriends();
  }, [userId]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = friends.findIndex(f => f.id === active.id);
    const newIndex = friends.findIndex(f => f.id === over.id);
    const newFriends = arrayMove(friends, oldIndex, newIndex);
    setFriends(newFriends);

    // Limit to Top 20
    const updates = newFriends.slice(0, 20).map((f, index) => ({
      user_id: userId,
      friend_id: f.id,
      rank: index + 1,
    }));

    const { error } = await supabase
      .from('friend_ranks')
      .upsert(updates, { onConflict: ['user_id', 'friend_id'] });

    if (error) console.error('Failed to save rankings', error);
  };

  if (loading) {
    return <p className="text-center text-neutral-500">Loading friends...</p>;
  }

  return (
    <>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={friends.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {friends.map(friend => (
              <SortableFriend key={friend.id} friend={friend} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-xs text-center text-neutral-500 mt-3">
        Only your top 20 ranked friends will be saved.
      </p>
    </>
  );
}
