 import { useEffect, useRef, useState } from 'react';
 import { getUnreadTotal } from '@/data/user/chat/inbox';
 import { onUnreadDelta } from '@/features/chat/events/badge';

 const POLL_MS = 60000; // 60s

 export default function useUnreadBadge() {
   const [count, setCount] = useState(0);
   const timerRef = useRef(null);
   const mountedRef = useRef(false);

   const fetchCount = async () => {
     try {
       const n = await getUnreadTotal();              // -> rpc('unread_total')
       if (mountedRef.current) setCount(Number(n || 0));
     } catch {
       // ignore; retry later
     }
   };

   useEffect(() => {
     mountedRef.current = true;

     // initial load
     fetchCount();

    // instant local updates when other parts of the app change unread
    const off = onUnreadDelta((delta) => {
      if (!mountedRef.current) return;
      if (typeof delta === 'number' && !Number.isNaN(delta)) {
        setCount((c) => Math.max(0, c + delta));
      }
    });

     // focus/visibility refresh (no realtime dependency)
     const onFocus = () => fetchCount();
     const onVis = () => { if (!document.hidden) fetchCount(); };
     window.addEventListener('focus', onFocus);
     document.addEventListener('visibilitychange', onVis);

     // polling when visible
     timerRef.current = setInterval(() => {
       if (!document.hidden) fetchCount();
     }, POLL_MS);

     return () => {
       mountedRef.current = false;
       window.removeEventListener('focus', onFocus);
       document.removeEventListener('visibilitychange', onVis);
       if (timerRef.current) clearInterval(timerRef.current);
       timerRef.current = null;
      off?.();
     };
   }, []);

   return count;
 }
