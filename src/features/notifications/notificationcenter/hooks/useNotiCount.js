// src/features/notifications/notificationcenter/hooks/useNotiCount.js
import { useCallback, useEffect, useRef, useState } from 'react';
import supabase from '@/lib/supabaseClient'; // <-- default import (was { supabase })

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function useNotiCount({
  actorId,           // MUST be vc.actors.id (user or vport actor)
  scope = 'user',    // kept for signature compatibility
  pollMs = 60_000,
  debug = false,
} = {}) {
  const [count, setCount] = useState(0);
  const pollRef = useRef(null);
  const lastActorRef = useRef(null);

  const log = (...a) => debug && console.log('[useNotiCount]', ...a);

  const validActor = typeof actorId === 'string' && UUID_RX.test(actorId);

  const fetchCount = useCallback(async () => {
    if (!validActor) {
      log('skip fetch: invalid/empty actorId', actorId);
      setCount(0);
      return;
    }

    log('fetch start', { actorId, scope });
    const { count: c, error } = await supabase
      .schema('vc')
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_actor_id', actorId)
      .eq('is_seen', false);

    if (error) {
      log('fetch error', error);
      setCount(0);
      return;
    }
    log('fetch done ->', c ?? 0);
    setCount(c ?? 0);
  }, [actorId, validActor, scope]);

  useEffect(() => {
    // debounce initial mount if actorId is transitioning from null -> uuid
    if (!validActor) {
      log('effect: actor not ready; clear poll & set 0');
      if (pollRef.current) clearInterval(pollRef.current);
      setCount(0);
      return;
    }

    // avoid extra immediate fetch if same actorId
    const changed = lastActorRef.current !== actorId;
    lastActorRef.current = actorId;

    // always fetch once
    fetchCount();

    // listen for manual refresh events
    const onRefresh = () => fetchCount();
    window.addEventListener('noti:refresh', onRefresh);

    // poll
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchCount, pollMs);

    return () => {
      window.removeEventListener('noti:refresh', onRefresh);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [actorId, validActor, pollMs, fetchCount]);

  return count;
}
