// VERSION: 2025-11-10 (actor-scoped; vc schema; filtered; realtime; safe polling)

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function isUUID(x) {
  return typeof x === 'string' && x.length >= 32;
}

/**
 * useUnreadBadge({ actorId, refreshMs=20000, debug=false })
 * Sums vc.inbox_entries.unread_count for one actor (vc.actors.id).
 */
export default function useUnreadBadge(opts = {}) {
  const actorId = opts.actorId ?? null;
  const refreshMs = Number(opts.refreshMs ?? 20000);
  const debug = !!opts.debug;

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const aliveRef = useRef(true);
  const timerRef = useRef(null);

  const canQuery = useMemo(() => isUUID(actorId), [actorId]);

  async function load() {
    if (!canQuery) {
      if (aliveRef.current) {
        setCount(0);
        setLoading(false);
      }
      if (debug) console.log('[useUnreadBadge] skip: no actorId', { actorId });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema('vc')
        .from('inbox_entries')
        .select('unread_count')
        .eq('actor_id', actorId);

      if (error) throw error;

      const total = (data || []).reduce((sum, r) => sum + (r?.unread_count || 0), 0);
      if (aliveRef.current) setCount(total);
      if (debug) console.log('[useUnreadBadge] fetch ->', total, { rows: data?.length ?? 0 });
    } catch (e) {
      if (aliveRef.current) setCount(0);
      if (debug) console.warn('[useUnreadBadge] error', e);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    aliveRef.current = true;
    load();

    // Realtime scoped to this actor’s inbox rows
    let ch = null;
    if (canQuery) {
      ch = supabase
        .channel(`vc-inbox-badge-${actorId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'vc', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
          () => load()
        )
        .subscribe();
    }

    // Optional polling
    if (refreshMs > 0) {
      timerRef.current = setInterval(load, refreshMs);
    }

    // Manual refresh (you can dispatch window event 'chat:refresh')
    const onRefresh = () => load();
    window.addEventListener('chat:refresh', onRefresh);

    return () => {
      aliveRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      try { if (ch) supabase.removeChannel(ch); } catch {}
      window.removeEventListener('chat:refresh', onRefresh);
    };
  }, [actorId, canQuery, refreshMs]);

  return { count, loading };
}
