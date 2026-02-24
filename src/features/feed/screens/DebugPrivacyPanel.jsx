// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

// src/features/feed/screens/DebugPrivacyPanel.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from '@/services/supabase/supabaseClient'; //transfer

export default function DebugPrivacyPanel({ actorId, posts }) {
  const isDev = import.meta.env.DEV;

  const [rows, setRows] = useState([]);

  // Extract post ids for efficient querying
  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isDev) {
        setRows([]);
        return;
      }

      if (!actorId || postIds.length === 0) {
        setRows([]);
        return;
      }

      try {
        // 1) posts -> actor_id
        const { data: postActors, error: pErr } = await supabase
          .schema("vc")
          .from("posts")
          .select("id, actor_id")
          .in("id", postIds);

        if (pErr) throw pErr;

        const actorIds = [
          ...new Set(postActors.map((x) => x.actor_id).filter(Boolean)),
        ];

        // 2) actor metadata
        const { data: actors, error: aErr } = await supabase
          .schema("vc")
          .from("actors")
          .select("id, profile_id, vport_id")
          .in("id", actorIds);

        if (aErr) throw aErr;

        const actorMap = actors.reduce((m, a) => {
          m[a.id] = a;
          return m;
        }, {});

        // 3) profile privacy lookup
        const profileIds = actors
          .map((a) => a.profile_id)
          .filter(Boolean);

        const { data: userProfiles } = await supabase
          .schema("vc")
          .from("user_profiles")
          .select("id, private")
          .in("id", profileIds);

        const upMap = (userProfiles || []).reduce((m, r) => {
          m[r.id] = r;
          return m;
        }, {});

        // 4) All my actor ids (user or vport)
        const { data: mine } = await supabase
          .schema("vc")
          .from("actor_owners")
          .select("actor_id")
          .eq("user_id", actorId);

        const myActorIds = new Set((mine || []).map((r) => r.actor_id));

        // 5) Follow edges
        const { data: follows } = await supabase
          .schema("vc")
          .from("actor_follows")
          .select("follower_actor_id, followed_actor_id, is_active")
          .in("follower_actor_id", Array.from(myActorIds))
          .in("followed_actor_id", actorIds);

        const followSet = new Set(
          (follows || [])
            .filter((f) => f.is_active)
            .map((f) => `${f.follower_actor_id}->${f.followed_actor_id}`)
        );

        // Build results
        const enriched = postActors.map((pa) => {
          const a = actorMap[pa.actor_id];
          const isVport = !!a?.vport_id;
          const isOwner = isVport ? false : a?.profile_id === actorId;
          const isPublic = a?.profile_id
            ? upMap[a.profile_id]?.private === false
            : false;

          // following?
          let isFollower = false;
          if (a && !isVport) {
            for (const my of myActorIds) {
              if (followSet.has(`${my}->${a.id}`)) {
                isFollower = true;
                break;
              }
            }
          }

          const visibleByPolicy =
            isVport || isOwner || isPublic || isFollower;

          return {
            post_id: pa.id,
            actor_id: pa.actor_id,
            profile_id: a?.profile_id || null,
            vport_id: a?.vport_id || null,
            isVport,
            isOwner,
            isPublic,
            isFollower,
            visibleByPolicy,
          };
        });

        if (!cancelled) {
          setRows(enriched);
          console.groupCollapsed(
            "%c[Privacy Debug] Feed visibility breakdown",
            "color:#a78bfa"
          );
          enriched.forEach((r) => console.log(r));
          console.groupEnd();
        }
      } catch (e) {
        if (!cancelled) {
          setRows([{ error: e?.message || String(e) }]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorId, postIds, isDev]);

  if (!isDev || !rows.length) return null;

  return (
    <div className="mt-3 mx-3 rounded-xl border border-fuchsia-500/40 bg-fuchsia-900/10 p-2">
      <div className="text-xs font-semibold text-fuchsia-300 mb-2">
        Privacy Debug (actor-mode)
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="text-fuchsia-300/90">
            <tr>
              <th className="text-left pr-3 py-1">post_id</th>
              <th className="text-left pr-3 py-1">actor_id</th>
              <th className="text-left pr-3 py-1">profile_id</th>
              <th className="text-left pr-3 py-1">vport_id</th>
              <th className="text-left pr-3 py-1">isVport</th>
              <th className="text-left pr-3 py-1">isOwner</th>
              <th className="text-left pr-3 py-1">isPublic</th>
              <th className="text-left pr-3 py-1">isFollower</th>
              <th className="text-left pr-3 py-1 font-semibold">
                visibleByPolicy
              </th>
            </tr>
          </thead>

          <tbody className="text-fuchsia-100/90">
            {rows.map((r) => (
              <tr key={r.post_id}>
                <td className="pr-3 py-1">{r.post_id}</td>
                <td className="pr-3 py-1">{r.actor_id}</td>
                <td className="pr-3 py-1">{r.profile_id ?? "—"}</td>
                <td className="pr-3 py-1">{r.vport_id ?? "—"}</td>
                <td className="pr-3 py-1">{String(r.isVport)}</td>
                <td className="pr-3 py-1">{String(r.isOwner)}</td>
                <td className="pr-3 py-1">{String(r.isPublic)}</td>
                <td className="pr-3 py-1">{String(r.isFollower)}</td>
                <td className="pr-3 py-1 font-semibold">
                  {String(r.visibleByPolicy)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-fuchsia-300/80 mt-2">
        Open browser console for more tracing details.
      </p>
    </div>
  );
}
