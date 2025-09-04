// src/hooks/useVportNotifications.js
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function countUnread(list) {
  return list.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0);
}

export function useVportNotifications(userId, limit = 50) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("vport_notifications")
        .select(`
          id,
          recipient_user_id,
          vport_id,
          actor_user_id,
          actor_vport_id,
          as_vport,
          kind,
          object_type,
          object_id,
          link_path,
          context,
          is_seen,
          is_read,
          created_at
        `)
        .eq("recipient_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const rows = data ?? [];
      setItems(rows);
      setUnread(countUnread(rows));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    if (!userId) return;
    refresh();
  }, [userId, limit, refresh]);

  async function markAllRead() {
    if (!userId) return;
    const ids = items.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) return;

    const { error } = await supabase
      .from("vport_notifications")
      .update({ is_read: true, is_seen: true })
      .in("id", ids)
      .eq("recipient_user_id", userId); // RLS scope

    if (error) throw error;

    setItems((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true, is_seen: true } : n))
    );
    setUnread(0);
  }

  async function markAsRead(id) {
    if (!id || !userId) return;

    const { error } = await supabase
      .from("vport_notifications")
      .update({ is_read: true, is_seen: true })
      .eq("id", id)
      .eq("recipient_user_id", userId); // RLS scope

    if (error) throw error;

    setItems((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, is_read: true, is_seen: true } : n
      );
      setUnread(countUnread(next));
      return next;
    });
  }

  return { items, unread, loading, error, refresh, markAllRead, markAsRead };
}
