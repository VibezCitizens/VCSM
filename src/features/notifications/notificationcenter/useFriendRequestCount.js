// src/features/notificationcenter/useFriendRequestCount.js
import { useEffect, useState } from 'react';
import { listMyFriendRequests } from '@/utils/socialfriends/social';

export function useFriendRequestCount() {
  const [count, setCount] = useState(0);

  async function refresh() {
    try {
      const items = await listMyFriendRequests();
      const c = items.filter(i => i.status === 'pending').length;
      setCount(c);
    } catch {
      setCount(0);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) await refresh(); })();

    const onFocus = () => refresh();
    const onVis = () => { if (!document.hidden) refresh(); };
    const onChanged = () => refresh();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('friendreq:changed', onChanged);
    window.addEventListener('noti:refresh', onChanged);

    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('friendreq:changed', onChanged);
      window.removeEventListener('noti:refresh', onChanged);
    };
  }, []);

  return [count, setCount];
}
