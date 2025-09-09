// src/hooks/useNotifications.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/data/data';

// tiny helper: batch-hydrate sender profiles by reactorId
async function hydrateSenders(rows) {
  if (!rows?.length) return rows;
  // collect ids that need hydration
  const missing = Array.from(
    new Set(rows.filter(r => !r.sender && r.reactorId).map(r => r.reactorId))
  );
  if (missing.length === 0) return rows;

  // If you have a batch API, use it here (e.g., db.profiles.users.getMany).
  // Fallback: Promise.all on getAuthor (handles user or vport ids).
  const map = new Map();
  await Promise.all(
    missing.map(async (rid) => {
      try {
        const prof = await db.profiles.getAuthor?.(rid); // expected in your data layer
        if (prof) map.set(rid, prof);
      } catch {
        // ignore — leave sender null if it fails
      }
    })
  );

  // merge back
  return rows.map(r => (r.sender || !r.reactorId || !map.has(r.reactorId)
    ? r
    : { ...r, sender: map.get(r.reactorId) }));
}

export function useNotifications(
  userId,
  { limit = 50, excludeTypes = [], refreshMs = 60_000 } = {}
) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const firstLoadRef = useRef(true);

  // Stable signature for options (arrays/objects become a stable string)
  const excludeKey = useMemo(() => {
    const arr = Array.isArray(excludeTypes) ? excludeTypes : [excludeTypes];
    return [...new Set(arr.filter(Boolean))].sort().join('|'); // e.g. "message|something"
  }, [excludeTypes]);

  const merge = useCallback(
    (prev, next) => {
      const exclude = new Set(excludeKey ? excludeKey.split('|') : []);
      const byId = new Map();
      for (const n of prev) byId.set(n.id, n);
      for (const n of next) {
        const ex = byId.get(n.id);
        byId.set(
          n.id,
          ex
            ? {
                ...ex,
                ...n,
                // preserve read/seen truthiness across merges
                read: Boolean(ex.read || n.read),
                seen: Boolean((ex.seen ?? false) || (n.seen ?? false)),
              }
            : { ...n, read: Boolean(n.read), seen: Boolean(n.seen) }
        );
      }
      return Array.from(byId.values())
        .filter(n => !exclude.has(n.type))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
    },
    [excludeKey, limit]
  );

  const fetchList = useCallback(
    async (soft = false) => {
      if (!userId) return;
      if (!soft) setLoading(true);
      try {
        const rows = await db.notifications.listForUser({ userId, limit: Math.max(limit, 200) });
        const rowsWithSender = await hydrateSenders(rows);
        setNotifications(prev =>
          firstLoadRef.current ? rowsWithSender : merge(prev, rowsWithSender)
        );
        firstLoadRef.current = false;
      } catch (err) {
        console.warn('[useNotifications] load error:', err);
        if (!soft) setNotifications([]);
      } finally {
        if (!soft) setLoading(false);
      }
    },
    [userId, limit, merge]
  );

  // Initial/hard load only when the *keys* truly change
  useEffect(() => {
    firstLoadRef.current = true;
    setNotifications([]);
    if (userId) fetchList(false);
  }, [userId, limit, excludeKey, fetchList]);

  // Background polling (soft update — no skeleton/flicker)
  useEffect(() => {
    if (!userId || !refreshMs) return;
    const t = setInterval(() => fetchList(true), refreshMs);
    return () => clearInterval(t);
  }, [userId, refreshMs, fetchList]);

  // counts
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );
  const unseenCount = useMemo(
    () => notifications.filter(n => !n.seen).length,
    [notifications]
  );

  const reload = useCallback(() => fetchList(true), [fetchList]);

  const markAsRead = useCallback(
    async (id) => {
      if (!userId || !id) return;
      try {
        const ok = await db.notifications.markAsRead({ id, userId });
        if (ok) {
          setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
          );
        }
      } catch (err) {
        console.warn('[useNotifications] markAsRead error:', err);
      }
    },
    [userId]
  );

  const markAllSeen = useCallback(async () => {
    if (!userId) return;
    try {
      await db.notifications.markAllSeen({ userId });
      // optimistic local update so badges clear immediately
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
    } catch (err) {
      console.warn('[useNotifications] markAllSeen error:', err);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    unseenCount,   // use this for the bell badge
    loading,
    reload,
    markAsRead,
    markAllSeen,
  };
}

export default useNotifications;
