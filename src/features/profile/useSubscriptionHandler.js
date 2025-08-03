// src/features/profile/useSubscriptionHandler.js
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

export default function useSubscriptionHandler(currentUserId, targetUserId) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    if (currentUserId && targetUserId && currentUserId !== targetUserId) {
      checkFollowStatus();
    }
  }, [currentUserId, targetUserId]);

  const checkFollowStatus = async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;

    try {
      const [{ data: following }, { data: followedBy }] = await Promise.all([
        supabase
          .from('followers')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('followed_id', targetUserId)
          .maybeSingle(),

        supabase
          .from('followers')
          .select('id')
          .eq('follower_id', targetUserId)
          .eq('followed_id', currentUserId)
          .maybeSingle(),
      ]);

      setIsFollowing(!!following);
      setIsFriend(!!following && !!followedBy);
    } catch (err) {
      console.error('Error checking relationship status:', err);
    }

    try {
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', targetUserId);

      if (!error && typeof count === 'number') {
        setSubscriberCount(count);
      }
    } catch (err) {
      console.error('Error counting subscribers:', err);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('followed_id', targetUserId);

        if (error) throw error;

        setIsFollowing(false);
        setIsFriend(false); // reset friend since this breaks mutual follow
        setSubscriberCount((prev) => Math.max(prev - 1, 0));
      } else {
        const { error } = await supabase.from('followers').insert([
          {
            follower_id: currentUserId,
            followed_id: targetUserId,
          },
        ]);

        if (error) throw error;

        setIsFollowing(true);
        setSubscriberCount((prev) => prev + 1);

        // Check again if mutual
        const { data: followedBack } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', targetUserId)
          .eq('followed_id', currentUserId)
          .maybeSingle();

        setIsFriend(!!followedBack);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update follow status.');
    }
  };

  return {
    isFollowing,
    isFriend,
    subscriberCount,
    handleToggleFollow,
    checkFollowStatus,
  };
}
