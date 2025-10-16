// src/features/profile/hooks/useSubscriptionHandler.js
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

export default function useSubscriptionHandler(currentUserId, targetUserId) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  const safeIds = currentUserId && targetUserId && currentUserId !== targetUserId;

  const fetchSubscriberCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', targetUserId);

      if (error) throw error;
      if (typeof count === 'number') setSubscriberCount(count);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useSubscriptionHandler] count error', err);
    }
  }, [targetUserId]);

  const checkFollowStatus = useCallback(async () => {
    if (!safeIds) {
      setIsFollowing(false);
      setIsFriend(false);
      return;
    }
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

      const iFollow = !!following;
      const theyFollow = !!followedBy;

      setIsFollowing(iFollow);
      setIsFriend(iFollow && theyFollow);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useSubscriptionHandler] status error', err);
    }
  }, [safeIds, currentUserId, targetUserId]);

  const handleToggleFollow = useCallback(async () => {
    if (!safeIds) return;
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('followed_id', targetUserId);

        if (error) throw error;

        setIsFollowing(false);
        setIsFriend(false);
        setSubscriberCount((n) => Math.max(0, n - 1));
      } else {
        const { error } = await supabase.from('followers').insert({
          follower_id: currentUserId,
          followed_id: targetUserId,
        });
        if (error) throw error;

        setIsFollowing(true);
        setSubscriberCount((n) => n + 1);

        // re-check friend status
        const { data: followedBack } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', targetUserId)
          .eq('followed_id', currentUserId)
          .maybeSingle();
        setIsFriend(!!followedBack);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast.error('Failed to update follow status.');
    }
  }, [safeIds, isFollowing, currentUserId, targetUserId]);

  useEffect(() => {
    checkFollowStatus();
    fetchSubscriberCount();
  }, [checkFollowStatus, fetchSubscriberCount]);

  return {
    isFollowing,
    isFriend,
    subscriberCount,
    handleToggleFollow,
    checkFollowStatus,
  };
}
