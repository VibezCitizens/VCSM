// src/hooks/useVportNotifications.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useVportNotifications(
  userId,
  { limit = 50, refreshMs = 60_000 } = {}
) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const firstLoadRef = useRef(true);

  const merge = useCallback(
    (prev, next) => {
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
                read: Boolean(ex.read || n.read),
                seen: Boolean((ex.seen ?? false) || (n.seen ?? false)),
              }
            : { ...n, read: Boolean(n.read), seen: Boolean(n.seen) }
        );
      }
      return Array.from(byId.values())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
    },
    [limit]
  );

  const fetchList = useCallback(
    async (soft = false) => {
      if (!userId) return; // no early return before hooks are declared; just skip work
      if (!soft) setLoading(true);
      try {
        const { data, error } = await supabase
          .from('vport_notifications')
          .select('*')
          .eq('recipient_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(Math.max(limit, 200));

        if (error) throw error;

        const normalized = (data || []).map((r) => ({
          id: r.id,
          type: r.kind || r.type || 'unknown',
          created_at: r.created_at,
          // normalize booleans
          read:
            typeof r.is_read === 'boolean'
              ? r.is_read
              : typeof r.read === 'boolean'
              ? r.read
              : false,
          seen:
            typeof r.is_seen === 'boolean'
              ? r.is_seen
              : typeof r.seen === 'boolean'
              ? r.seen
              : false,
        }));

        setRows((prev) => (firstLoadRef.current ? normalized : merge(prev, normalized)));
        firstLoadRef.current = false;
      } catch (e) {
        if (!soft) setRows([]);
        console.warn('[useVportNotifications] load error:', e);
      } finally {
        if (!soft) setLoading(false);
      }
    },
    [userId, limit, merge]
  );

  // initial load (keys change)
  useEffect(() => {
    firstLoadRef.current = true;
    setRows([]);
    if (userId) fetchList(false);
  }, [userId, limit, fetchList]);

  // background polling (soft)
  useEffect(() => {
    if (!userId || !refreshMs) return;
    const t = setInterval(() => fetchList(true), refreshMs);
    return () => clearInterval(t);
  }, [userId, refreshMs, fetchList]);

  const unread = useMemo(() => rows.filter((n) => !n.read).length, [rows]);
  const unseen = useMemo(() => rows.filter((n) => !n.seen).length, [rows]);

  const reload = useCallback(() => fetchList(true), [fetchList]);

  const markAsRead = useCallback(
    async (id) => {
      if (!userId || !id) return;
      try {
        await supabase
          .from('vport_notifications')
          .update({ is_read: true })
          .eq('id', id)
          .eq('recipient_user_id', userId);
        setRows((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      } catch (e) {
        console.warn('[useVportNotifications] markAsRead error:', e);
      }
    },
    [userId]
  );

  const markAllSeen = useCallback(async () => {
    if (!userId) return;
    try {
      await supabase
        .from('vport_notifications')
        .update({ is_seen: true })
        .eq('recipient_user_id', userId)
        .eq('is_seen', false);
      // optimistic local clear
      setRows((prev) => prev.map((n) => ({ ...n, seen: true })));
    } catch (e) {
      console.warn('[useVportNotifications] markAllSeen error:', e);
    }
  }, [userId]);

  return { notifications: rows, unread, unseen, loading, reload, markAsRead, markAllSeen };
}

export default useVportNotifications;
