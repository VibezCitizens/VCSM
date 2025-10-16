// src/features/notifications/hooks/useNotiCount.js
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Returns the number of unseen notifications for the current user.
 * - Fetches count on mount
 * - Refreshes when you dispatch `window.dispatchEvent(new Event('noti:refresh'))`
 * - Optional 60s poll as fallback
 */
export default function useNotiCount() {
  const [count, setCount] = useState(0);
  const pollRef = useRef(null);

  async function fetchCount() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) {
      setCount(0);
      return;
    }

    const { count: c, error } = await supabase
      .schema('vc')
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('is_seen', false);

    if (!error) {
      setCount(c ?? 0);
    }
  }

  useEffect(() => {
    // initial fetch
    fetchCount();

    // listen for manual refresh events
    const handler = () => fetchCount();
    window.addEventListener('noti:refresh', handler);

    // optional fallback polling (every 60s)
    pollRef.current = setInterval(fetchCount, 60_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      window.removeEventListener('noti:refresh', handler);
    };
  }, []);

  return count;
}
