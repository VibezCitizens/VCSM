// File: src/hooks/useNotifications.js
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetches and manages notifications for a given user with polling and refresh-on-focus.
 * @param {string} userId
 * @returns {{ notifications: any[], unreadCount: number, markAsRead: (id: string) => Promise<void> }}
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('notifications')
      // explicitly pull metadata JSONB plus the fields you need
      .select(`
        id,
        type,
        metadata,
        created_at,
        read
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data);
    setUnreadCount(data.filter(n => !n.read).length);
  }, [userId]);

  // Initial fetch + polling every 30 seconds
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
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, markAsRead };
}
