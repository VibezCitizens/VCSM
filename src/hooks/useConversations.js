import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/state/identityContext";

export default function useConversations() {
  const { identity, isVport } = useIdentity();
  const me = useMemo(() => identity?.userId || identity?.ownerId, [identity]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        if (!isVport) {
          // ✅ Regular user DM list (single RPC)
          const { data, error } = await supabase.rpc(
            "get_conversations_with_details",
            { current_user_id: me }
          );
          if (error) throw error;

          // normalize to a common shape
          const mapped = (data || []).map((r) => ({
            kind: "dm",
            id: r.id,
            created_at: r.created_at,
            is_muted: r.is_muted,
            other_user: r.other_user, // { id, display_name, photo_url }
          }));

          if (!cancelled) setRows(mapped);
        } else {
          // ✅ VPORT chats:
          // 1) get all conversation ids I'm a member of
          const { data: mems, error: mErr } = await supabase
            .from("vport_conversation_members")
            .select("conversation_id")
            .eq("user_id", me);
          if (mErr) throw mErr;

          const ids = (mems || []).map((m) => m.conversation_id);
          if (ids.length === 0) {
            if (!cancelled) setRows([]);
            return;
          }

          // 2) enrich each with partner + vport info via RPC
          //    (the function is SECURITY DEFINER and already filtered)
          const enriched = await Promise.all(
            ids.map(async (id) => {
              const { data, error } = await supabase.rpc("get_vport_chat_partner", {
                conv_id: id,
                requester: me,
              });
              if (error) throw error;
              // function returns:
              // conversation_id, id (user id), display_name, username, photo_url,
              // last_seen, is_online, vport_id, vport_name, vport_avatar
              return {
                kind: "vport",
                id: data?.conversation_id || id,
                created_at: data?.created_at || null, // may be null; not in function output
                other_user: {
                  id: data?.id,
                  display_name: data?.display_name,
                  username: data?.username,
                  photo_url: data?.photo_url,
                  last_seen: data?.last_seen,
                  is_online: data?.is_online,
                },
                vport: {
                  id: data?.vport_id,
                  name: data?.vport_name,
                  avatar_url: data?.vport_avatar,
                },
              };
            })
          );

          if (!cancelled) setRows(enriched);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me, isVport]);

  return { rows, loading, error: err, isVport };
}
