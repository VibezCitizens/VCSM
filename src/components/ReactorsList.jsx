// src/components/ReactorsList.jsx
import { useEffect, useMemo, useRef, useState } from "react";

export default function ReactorsList({ supabase, postId, open, onClose, anchorRef }) {
  const panelRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose?.();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose, anchorRef]);

  // Load reactors on open
  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // Prefer RPC if present
        const { data: rpc, error: rpcErr } = await supabase.rpc("post_reactors_list", { p_post_id: postId });

        if (!rpcErr && Array.isArray(rpc)) {
          if (!cancelled) {
            setRows(
              rpc.map(r => ({
                actor_id: r.actor_id,
                profile_id: r.profile_id,
                kind: r.kind ?? null,
                display_name: r.display_name ?? "Unknown user",
                username: r.username ?? null,
                photo_url: r.photo_url || "/avatar.jpg",
                reaction: r.reaction ?? r.type,
                qty: r.qty ?? 1,
                created_at: r.reacted_at ?? r.created_at,
              }))
            );
          }
        } else {
          // Fallback: join in client (requires SELECT on vc.post_reactions, vc.actors, public.profiles)
          const { data: reactions, error: rErr } = await supabase
            .schema("vc")
            .from("post_reactions")
            .select("actor_id,type,qty,created_at")
            .eq("post_id", postId)
            .order("created_at", { ascending: false });
          if (rErr) throw rErr;

          if (!reactions?.length) {
            if (!cancelled) setRows([]);
            return;
          }

          const actorIds = [...new Set(reactions.map(r => r.actor_id).filter(Boolean))];

          const { data: actors, error: aErr } = await supabase
            .schema("vc")
            .from("actors")
            .select("id,profile_id,kind")
            .in("id", actorIds);
          if (aErr) throw aErr;

          const profileIds = [...new Set(actors.map(a => a.profile_id).filter(Boolean))];

          const { data: profiles, error: pErr } = await supabase
            .from("profiles")
            .select("id,display_name,username,photo_url")
            .in("id", profileIds);
          if (pErr) throw pErr;

          const aById = new Map(actors.map(a => [a.id, a]));
          const pById = new Map(profiles.map(p => [p.id, p]));

          const joined = reactions.map(r => {
            const a = aById.get(r.actor_id);
            const p = a ? pById.get(a.profile_id) : null;
            return {
              actor_id: r.actor_id,
              profile_id: a?.profile_id ?? null,
              kind: a?.kind ?? null,
              display_name: p?.display_name ?? "Unknown user",
              username: p?.username ?? null,
              photo_url: p?.photo_url || "/avatar.jpg",
              reaction: r.type,
              qty: r.qty ?? 1,
              created_at: r.created_at,
            };
          });

          if (!cancelled) setRows(joined);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, postId, supabase]);

  // Group by user like your screenshot: “al papy — 3 roses”
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = r.profile_id || r.actor_id;
      if (!map.has(key)) {
        map.set(key, {
          profile_id: r.profile_id,
          actor_id: r.actor_id,
          display_name: r.display_name,
          username: r.username,
          photo_url: r.photo_url,
          like: 0, dislike: 0, rose: 0,
          last_at: r.created_at ? new Date(r.created_at).getTime() : 0,
        });
      }
      const o = map.get(key);
      if (r.reaction === "like") o.like += r.qty;
      else if (r.reaction === "dislike") o.dislike += r.qty;
      else if (r.reaction === "rose") o.rose += r.qty;
      const ts = r.created_at ? new Date(r.created_at).getTime() : 0;
      if (ts > o.last_at) o.last_at = ts;
    }
    return [...map.values()].sort((a,b) => b.last_at - a.last_at);
  }, [rows]);

  // Position under the pill
  const style = useMemo(() => {
    if (!anchorRef?.current) return {};
    const rect = anchorRef.current.getBoundingClientRect();
    const top = rect.bottom + 8 + window.scrollY;
    const left = rect.left + window.scrollX;
    const width = Math.min(560, Math.max(320, rect.width));
    return { top: `${top}px`, left: `${left}px`, width: `${width}px` };
  }, [anchorRef, open]);

  if (!open) return null;

  return (
    <div className="fixed z-50" style={style} ref={panelRef}>
      <div className="rounded-2xl bg-neutral-900 text-white shadow-2xl border border-neutral-800 overflow-hidden">
        <header className="px-4 py-2 flex items-center justify-between border-b border-neutral-800">
          <div className="font-medium">Reactions</div>
          <button onClick={onClose} className="text-sm opacity-80 hover:opacity-100">Close</button>
        </header>

        {loading && <div className="px-4 py-6 text-sm opacity-80">Loading…</div>}
        {!loading && err && <div className="px-4 py-6 text-sm text-red-400">{err}</div>}
        {!loading && !err && grouped.length === 0 && (
          <div className="px-4 py-6 text-sm opacity-70">No reactions yet.</div>
        )}

        {!loading && !err && grouped.length > 0 && (
          <ul className="p-2 space-y-1">
            {grouped.map(g => (
              <li key={g.actor_id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-neutral-800">
                <img
                  src={g.photo_url || "/avatar.jpg"}
                  alt={g.display_name || "avatar"}
                  className="w-9 h-9 rounded-full object-cover border border-neutral-700"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <span className="font-medium">{g.display_name}</span>
                    {g.username ? <span className="ml-2 opacity-80">@{g.username}</span> : null}
                  </div>
                  <div className="text-xs opacity-80">
                    {g.rose ? `${g.rose} ${g.rose === 1 ? "rose" : "roses"}` : ""}
                    {g.like ? `${g.rose ? " · " : ""}${g.like} like${g.like === 1 ? "" : "s"}` : ""}
                    {g.dislike ? `${(g.rose || g.like) ? " · " : ""}${g.dislike} dislike${g.dislike === 1 ? "" : "s"}` : ""}
                  </div>
                </div>
                {(g.rose || g.like || g.dislike) ? <span className="text-lg">🌹</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
