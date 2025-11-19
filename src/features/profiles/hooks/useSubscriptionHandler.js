// src/features/profiles/hooks/useSubscriptionHandler.jsx
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

  if (error) return null;
  return data?.[0]?.id ?? null;
}

export default function useSubscriptionHandler(currentUserId, targetUserId) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);

  const [meActorId, setMeActorId] = useState(null);
  const [targetActorId, setTargetActorId] = useState(null);

  const safeIds =
    !!currentUserId &&
    !!targetUserId &&
    currentUserId !== targetUserId;

  const safeActors =
    !!meActorId &&
    !!targetActorId &&
    meActorId !== targetActorId;

  // Resolve actor IDs
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
      } catch {
        if (alive) {
          setMeActorId(null);
          setTargetActorId(null);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentUserId, targetUserId]);

  // Check follow + friend status only
  const checkFollowStatus = useCallback(async () => {
    if (!safeIds || !safeActors) {
      setIsFollowing(false);
      setIsFriend(false);
      return;
    }

    try {
      const [{ count: c1 }, { count: c2 }] = await Promise.all([
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

      const iFollow = (c1 ?? 0) > 0;
      const theyFollow = (c2 ?? 0) > 0;

      setIsFollowing(iFollow);
      setIsFriend(iFollow && theyFollow);
    } catch {}
  }, [safeIds, safeActors, meActorId, targetActorId]);

  const handleToggleFollow = useCallback(async () => {
    if (!safeIds || !safeActors) return;

    try {
      if (isFollowing) {
        await supabase
          .schema('vc')
          .from('actor_follows')
          .delete()
          .match({
            follower_actor_id: meActorId,
            followed_actor_id: targetActorId,
          });

        setIsFollowing(false);
        setIsFriend(false);
      } else {
        await supabase
          .schema('vc')
          .from('actor_follows')
          .upsert(
            {
              follower_actor_id: meActorId,
              followed_actor_id: targetActorId,
              is_active: true,
            },
            { onConflict: 'follower_actor_id,followed_actor_id' }
          );

        setIsFollowing(true);

        // re-check friend status
        const { count } = await supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id', { head: true, count: 'exact' })
          .eq('follower_actor_id', targetActorId)
          .eq('followed_actor_id', meActorId)
          .eq('is_active', true);

        setIsFriend((count ?? 0) > 0);
      }
    } catch {
      toast.error('Failed to update follow status.');
    }
  }, [safeIds, safeActors, isFollowing, meActorId, targetActorId]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  return {
    isFollowing,
    isFriend,
    handleToggleFollow,
    checkFollowStatus,
  };
}
