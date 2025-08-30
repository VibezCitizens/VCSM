// src/hooks/useVportNotifications.js
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useVportNotifications(userId, limit = 50) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chanName = useMemo(() => (userId ? `vport_notifications:${userId}` : null), [userId]);
  const mounted = useRef(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from("vport_notifications")
          .select("id, recipient_user_id, vport_id, actor_id, kind, object_type, object_id, link_path, context, is_seen, is_read, created_at")
          .eq("recipient_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) throw error;
        if (!cancelled) {
          setItems(data || []);
          setUnread((data || []).filter((n) => !n.is_read).length);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    let ch;
    if (chanName) {
      ch = supabase
        .channel(chanName)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "vport_notifications", filter: `recipient_user_id=eq.${userId}` },
          (payload) => {
            const n = payload.new;
            setItems((prev) => [n, ...prev].slice(0, limit));
            setUnread((u) => u + (n.is_read ? 0 : 1));
          }
        )
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (ch) supabase.removeChannel(ch);
    };
  }, [userId, limit, chanName]);

  async function markAllRead() {
    if (!userId) return;
    const ids = items.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("vport_notifications")
      .update({ is_read: true, is_seen: true })
      .in("id", ids);
    if (error) throw error;
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true, is_seen: true } : n)));
    setUnread(0);
  }

  return { items, unread, loading, error, markAllRead };
}
