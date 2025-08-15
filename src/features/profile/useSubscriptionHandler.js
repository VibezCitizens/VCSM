// src/features/profile/useSubscriptionHandler.js
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Follow/subscription handler
 * - Works for both viewing your own profile and others
 * - Uses authoritative COUNT from DB (no optimistic math)
 * - Subscribes to realtime INSERT/DELETE for live updates
 *
 * @param {string|undefined} currentUserId  auth.uid() of the viewer
 * @param {string|undefined} targetUserId   profile being viewed (followed_id)
 */
export default function useSubscriptionHandler(currentUserId, targetUserId) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [busy, setBusy] = useState(false);

  // ---- helpers -------------------------------------------------------------

  const fetchCount = useCallback(async () => {
    if (!targetUserId) {
      setSubscriberCount(0);
      return;
    }
    // Use a lightweight select + exact count; avoids heavy payloads and plays nice with RLS.
    const { count, error } = await supabase
      .from('followers')
      .select('id', { count: 'exact', head: false })
      .eq('followed_id', targetUserId);

    if (error) {
      if (import.meta.env.DEV) console.error('[followers count]', error);
      return;
    }
    setSubscriberCount(count ?? 0);
  }, [targetUserId]);

  const fetchIsFollowing = useCallback(async () => {
    // Only meaningful when looking at someone else’s profile
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setIsFollowing(false);
      setIsFriend(false);
      return;
    }

    const [{ data: following, error: err1 }, { data: followedBack, error: err2 }] = await Promise.all([
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

    if (err1 && import.meta.env.DEV) console.error('[isFollowing]', err1);
    if (err2 && import.meta.env.DEV) console.error('[followedBack]', err2);

    const followingBool = !!following;
    const mutualBool = followingBool && !!followedBack;

    setIsFollowing(followingBool);
    setIsFriend(mutualBool);
  }, [currentUserId, targetUserId]);

  // ---- effects -------------------------------------------------------------

  // Initial + on id changes: pull authoritative states
  useEffect(() => {
    fetchCount();
    fetchIsFollowing();
  }, [fetchCount, fetchIsFollowing]);

  // Realtime subscriber count for this profile
  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel(`followers:followed_id=${targetUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'followers', filter: `followed_id=eq.${targetUserId}` },
        fetchCount
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'followers', filter: `followed_id=eq.${targetUserId}` },
        fetchCount
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId, fetchCount]);

  // ---- actions -------------------------------------------------------------

  const handleToggleFollow = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    if (currentUserId === targetUserId) return; // no self-follow

    setBusy(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('followed_id', targetUserId);

        if (error) throw error;

        setIsFollowing(false);
        setIsFriend(false); // mutual broken
      } else {
        const { error } = await supabase.from('followers').insert([
          { follower_id: currentUserId, followed_id: targetUserId },
        ]);

        if (error) throw error;

        setIsFollowing(true);

        // Check mutual after insert
        const { data: followedBack } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', targetUserId)
          .eq('followed_id', currentUserId)
          .maybeSingle();
        setIsFriend(!!followedBack);
      }

      // Always refresh from source of truth (realtime will also update soon after)
      await fetchCount();
    } catch (err) {
      if (import.meta.env.DEV) console.error('[toggle follow]', err);
      toast.error('Failed to update follow status.');
    } finally {
      setBusy(false);
    }
  }, [currentUserId, targetUserId, isFollowing, fetchCount]);

  // ---- API -----------------------------------------------------------------

  return {
    isFollowing,
    isFriend,
    subscriberCount,
    busy,
    handleToggleFollow,
    checkFollowStatus: fetchIsFollowing,
    refreshCount: fetchCount,
  };
}
