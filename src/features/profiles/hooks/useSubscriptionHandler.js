import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

async function actorIdForProfile(profileId) {
  if (!profileId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', profileId)
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data[0]?.id ? data[0].id : null;
}

export default function useSubscriptionHandler(currentUserId, targetUserId) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  const [meActorId, setMeActorId] = useState(null);
  const [targetActorId, setTargetActorId] = useState(null);

  const safeIds = !!currentUserId && !!targetUserId && currentUserId !== targetUserId;
  const safeActors = !!meActorId && !!targetActorId && meActorId !== targetActorId;

  // resolve actor ids once inputs change
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          actorIdForProfile(currentUserId),
          actorIdForProfile(targetUserId),
        ]);
        if (!alive) return;
        setMeActorId(a);
        setTargetActorId(b);
      } catch (e) {
        if (import.meta.env.DEV) console.error('[useSubscriptionHandler] actor resolve error', e);
        if (alive) {
          setMeActorId(null);
          setTargetActorId(null);
        }
      }
    })();
    return () => { alive = false; };
  }, [currentUserId, targetUserId]);

  const fetchSubscriberCount = useCallback(async () => {
    if (!targetActorId) return;
    try {
      const { count, error } = await supabase
        .schema('vc')
        .from('actor_follows')
        .select('followed_actor_id', { count: 'exact', head: true })
        .eq('followed_actor_id', targetActorId)
        .eq('is_active', true);

      if (error) throw error;
      setSubscriberCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useSubscriptionHandler] count error', err);
    }
  }, [targetActorId]);

  const checkFollowStatus = useCallback(async () => {
    if (!safeIds || !safeActors) {
      setIsFollowing(false);
      setIsFriend(false);
      return;
    }
    try {
      const [{ count: c1, error: e1 }, { count: c2, error: e2 }] = await Promise.all([
        supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id', { head: true, count: 'exact' })
          .eq('follower_actor_id', meActorId)
          .eq('followed_actor_id', targetActorId)
          .eq('is_active', true),
        supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id', { head: true, count: 'exact' })
          .eq('follower_actor_id', targetActorId)
          .eq('followed_actor_id', meActorId)
          .eq('is_active', true),
      ]);

      if (e1) throw e1;
      if (e2) throw e2;

      const iFollow = (c1 ?? 0) > 0;
      const theyFollow = (c2 ?? 0) > 0;

      setIsFollowing(iFollow);
      setIsFriend(iFollow && theyFollow);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useSubscriptionHandler] status error', err);
    }
  }, [safeIds, safeActors, meActorId, targetActorId]);

  const handleToggleFollow = useCallback(async () => {
    if (!safeIds || !safeActors) return;
    try {
      if (isFollowing) {
        const { error } = await supabase
          .schema('vc')
          .from('actor_follows')
          .delete()
          .match({ follower_actor_id: meActorId, followed_actor_id: targetActorId });

        if (error) throw error;

        setIsFollowing(false);
        setIsFriend(false);
        setSubscriberCount((n) => Math.max(0, n - 1));
      } else {
        const { error } = await supabase
          .schema('vc')
          .from('actor_follows')
          .upsert(
            { follower_actor_id: meActorId, followed_actor_id: targetActorId, is_active: true },
            { onConflict: 'follower_actor_id,followed_actor_id' }
          );
        if (error) throw error;

        setIsFollowing(true);
        setSubscriberCount((n) => n + 1);

        // re-check friend status
        const { count, error: e2 } = await supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id', { head: true, count: 'exact' })
          .eq('follower_actor_id', targetActorId)
          .eq('followed_actor_id', meActorId)
          .eq('is_active', true);
        if (!e2) setIsFriend((count ?? 0) > 0);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast.error('Failed to update follow status.');
    }
  }, [safeIds, safeActors, isFollowing, meActorId, targetActorId]);

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
