// C:\Users\vibez\OneDrive\Desktop\VCSM\src\features\notificationcenter\useFriendRequestCount.js
import { useEffect, useState } from 'react';
import { listMyFriendRequests } from '@/utils/social';

export function useFriendRequestCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await listMyFriendRequests();
        const c = items.filter(i => i.status === 'pending').length;
        if (mounted) setCount(c);
      } catch {
        if (mounted) setCount(0);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return [count, setCount];
}
