// src/hooks/useNotifications.js
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/data/data';

/**
 * Simple notifications hook backed by the DAL.
 * - No realtime subscription (by request).
 * - Tolerates multiple DB schemas via notifications.js normalization.
 */
export function useNotifications(userId, { limit = 50 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const rows = await db.notifications.listForUser({ userId, limit });
      setNotifications(rows);
    } catch (err) {
      console.warn('[useNotifications] load error:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNotifications([]);
    if (userId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = async (id) => {
    if (!userId || !id) return;
    try {
      const ok = await db.notifications.markAsRead({ id, userId });
      if (ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.warn('[useNotifications] markAsRead error:', err);
    }
  };

  const markAllSeen = async () => {
    if (!userId) return;
    try {
      await db.notifications.markAllSeen({ userId });
      // We don't change the read state here (only "seen").
      // If you want a local effect, you could mark a separate flag.
    } catch (err) {
      console.warn('[useNotifications] markAllSeen error:', err);
    }
  };

  return { notifications, unreadCount, loading, reload: load, markAsRead, markAllSeen };
}

export default useNotifications;
