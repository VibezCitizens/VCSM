// useUnreadBadge.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { getInboxUnreadBadgeCount } from '../controller/inboxUnread.controller';

export default function useUnreadBadge({ actorId, refreshMs = 20000, debug = false } = {}) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const aliveRef = useRef(true);

  const canQuery = useMemo(
    () => typeof actorId === 'string' && actorId.length >= 32,
    [actorId]
  );

  async function load() {
    if (!canQuery) {
      setCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const total = await getInboxUnreadBadgeCount(actorId);
      if (aliveRef.current) setCount(total);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    aliveRef.current = true;
    load();

    if (refreshMs > 0) {
      const t = setInterval(load, refreshMs);
      return () => clearInterval(t);
    }

    return () => {
      aliveRef.current = false;
    };
  }, [actorId, canQuery, refreshMs]);

  return { count, loading };
}
