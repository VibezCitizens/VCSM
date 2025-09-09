import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Counts VPORT DMs with new incoming *user* messages since the user's cut.
 */
export function useUnreadVportChatsCount(userId, vportId, { intervalMs = 60000 } = {}) {
  const [count, setCount] = useState(0);
  const timerRef = useRef(null);

  const load = async () => {
    if (!userId) { setCount(0); return; }
    try {
      // which VPORT convos am I a member of (as a person)?
      const { data: mems, error: mErr } = await supabase
        .from('vport_conversation_members')
        .select('conversation_id, cleared_before, archived_at')
        .eq('user_id', userId);
      if (mErr) throw mErr;

      const active = (mems || []).filter(m => !m.archived_at);
      if (!active.length) { setCount(0); return; }

      const convIds = active.map(m => m.conversation_id);
      const cutByConv = new Map(active.map(m => [m.conversation_id, m.cleared_before || null]));

      const { data: msgs, error: msgErr } = await supabase
        .from('vport_messages')
        .select('conversation_id, created_at, sender_user_id, sender_vport_id')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });
      if (msgErr) throw msgErr;

      const firstByConv = new Map();
      for (const m of msgs || []) {
        if (!firstByConv.has(m.conversation_id)) firstByConv.set(m.conversation_id, m);
      }

      let c = 0;
      for (const id of convIds) {
        const last = firstByConv.get(id);
        const cut = cutByConv.get(id);
        if (!last) continue;
        if (cut && new Date(last.created_at) <= new Date(cut)) continue;
        // count only incoming from *users* (skip messages sent by the VPORT itself)
        if (!last.sender_user_id) continue;
        if (last.sender_user_id === userId) continue;
        c++;
      }
      setCount(c);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    load();
    if (!intervalMs) return;
    timerRef.current = setInterval(load, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [userId, vportId, intervalMs]);

  return count;
}
