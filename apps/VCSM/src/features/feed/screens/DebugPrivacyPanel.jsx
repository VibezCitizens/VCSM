// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

// src/features/feed/screens/DebugPrivacyPanel.jsx
import { useEffect, useMemo } from "react";
import { useDebugPrivacyRows } from "@/features/feed/hooks/useDebugPrivacyRows";

export default function DebugPrivacyPanel({ actorId, posts }) {
  const isDev = import.meta.env.DEV;

  // Extract post ids for efficient querying
  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const rows = useDebugPrivacyRows({
    actorId,
    postIds,
    enabled: isDev,
  });

  useEffect(() => {
    if (!isDev || !rows.length) return;
    console.groupCollapsed(
      "%c[Privacy Debug] Feed visibility breakdown",
      "color:#a78bfa"
    );
    rows.forEach((row) => console.log(row));
    console.groupEnd();
  }, [actorId, postIds, isDev, rows]);

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
