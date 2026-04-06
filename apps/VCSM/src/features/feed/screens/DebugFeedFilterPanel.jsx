import { useMemo } from "react";

export default function DebugFeedFilterPanel({ rows = [] }) {
  const isDev = import.meta.env.DEV;

  const sortedRows = useMemo(() => {
    const list = Array.isArray(rows) ? rows.slice() : [];
    return list.sort((a, b) => {
      const av = a?.visible === true ? 1 : 0;
      const bv = b?.visible === true ? 1 : 0;
      if (av !== bv) return av - bv; // hidden first
      return String(a?.post_id ?? "").localeCompare(String(b?.post_id ?? ""));
    });
  }, [rows]);

  if (!isDev || sortedRows.length === 0) return null;

  return (
    <div className="mt-3 mx-3 rounded-xl border border-cyan-500/40 bg-cyan-900/10 p-2">
      <div className="text-xs font-semibold text-cyan-300 mb-2">
        Feed Filter Debug
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="text-cyan-300/90">
            <tr>
              <th className="text-left pr-3 py-1">post_id</th>
              <th className="text-left pr-3 py-1">actor_id</th>
              <th className="text-left pr-3 py-1">kind</th>
              <th className="text-left pr-3 py-1">private</th>
              <th className="text-left pr-3 py-1">following</th>
              <th className="text-left pr-3 py-1">owner</th>
              <th className="text-left pr-3 py-1">visible</th>
              <th className="text-left pr-3 py-1 font-semibold">reason</th>
            </tr>
          </thead>

          <tbody className="text-cyan-100/90">
            {sortedRows.map((row) => (
              <tr key={row.post_id}>
                <td className="pr-3 py-1">{row.post_id}</td>
                <td className="pr-3 py-1">{row.actor_id}</td>
                <td className="pr-3 py-1">{row.actor_kind ?? "-"}</td>
                <td className="pr-3 py-1">{String(row.is_private)}</td>
                <td className="pr-3 py-1">{String(row.is_following)}</td>
                <td className="pr-3 py-1">{String(row.is_owner)}</td>
                <td className="pr-3 py-1">{String(row.visible)}</td>
                <td className="pr-3 py-1 font-semibold">{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

