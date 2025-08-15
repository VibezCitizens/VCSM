// File: src/hooks/useNotifications.js
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetches and manages notifications for a given user with polling, focus refresh, and realtime.
 * @param {string} userId
 * @returns {{
 *   notifications: any[],
 *   unreadCount: number,
 *   markAsRead: (id: string) => Promise<void>,
 *   markAllAsRead: () => Promise<void>,
 *   refresh: () => Promise<void>
 * }}
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const fetching = useRef(false);

  const recomputeUnread = useCallback((rows) => {
    setUnreadCount(rows.reduce((acc, n) => acc + (n.read ? 0 : 1), 0));
  }, []);

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!userId || fetching.current) return;
    fetching.current = true;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        type,
        metadata,
        created_at,
        read,
        actor_id,
        source_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    fetching.current = false;

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data);
    recomputeUnread(data);
  }, [userId, recomputeUnread]);

  // Public refresh
  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchNotifications]);

  // Realtime subscription for this user's notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => {
            // Apply insert/update/delete locally
            if (payload.eventType === 'INSERT') {
              const next = [payload.new, ...prev];
              recomputeUnread(next);
              return next;
            }
            if (payload.eventType === 'UPDATE') {
              const next = prev.map((n) =>
                n.id === payload.new.id ? { ...n, ...payload.new } : n
              );
              recomputeUnread(next);
              return next;
            }
            if (payload.eventType === 'DELETE') {
              const next = prev.filter((n) => n.id !== payload.old.id);
              recomputeUnread(next);
              return next;
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.debug('[useNotifications] realtime status:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, recomputeUnread]);

  // Mark one notification as read
  const markAsRead = useCallback(async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification read:', error);
      return;
    }

    // update local state immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications for this user as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications read:', error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, markAsRead, markAllAsRead, refresh };
}
