// src/hooks/useUnreadNotificationsCount.js
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function useUnreadNotificationsCount(userId, { intervalMs = 30000 } = {}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let timer;
    let alive = true;
    const tick = async () => {
      if (!userId) return;
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (!alive) return;
      if (!error && typeof count === 'number') setCount(count);
    };
    tick();
    if (intervalMs) timer = setInterval(tick, intervalMs);
    return () => { alive = false; if (timer) clearInterval(timer); };
  }, [userId, intervalMs]);

  return count;
}
