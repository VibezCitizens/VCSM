// src/hooks/useUnreadMessageTotal.js
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function useUnreadMessageTotal(userId, { intervalMs = 30000 } = {}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let timer;
    let alive = true;
    const tick = async () => {
      if (!userId) return;
      const { data, error } = await supabase.rpc('get_unread_message_total', { uid: userId });
      if (!alive) return;
      if (!error && typeof data === 'number') setCount(data);
    };
    tick(); // initial
    if (intervalMs) timer = setInterval(tick, intervalMs);
    return () => { alive = false; if (timer) clearInterval(timer); };
  }, [userId, intervalMs]);

  return count;
}
