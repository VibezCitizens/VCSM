function formatDuration(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "-";
  if (durationMs < 1000) return `${Math.round(durationMs)} ms`;
  return `${(durationMs / 1000).toFixed(2)} s`;
}

function statusStyle(status) {
  if (status === "passed") return "text-emerald-700";
  if (status === "failed") return "text-red-700";
  if (status === "running") return "text-blue-700";
  if (status === "skipped") return "text-amber-700";
  return "text-slate-500";
}

function toJson(value) {
  if (value == null) return "null";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function DiagnosticsRow({ row }) {
  const status = row?.status ?? "idle";
  const hasPayload = row?.data != null || row?.error != null;

  return (
    <div className="rounded-md border border-slate-300 bg-white p-3 text-slate-900 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium text-sm">{row?.name ?? "Unnamed test"}</div>
        <div className="flex items-center gap-4 text-xs">
          <span className={`${statusStyle(status)} font-semibold uppercase`}>{status}</span>
          <span className="text-slate-600">{formatDuration(row?.durationMs)}</span>
        </div>
      </div>

      {hasPayload ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-slate-700">Details</summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900">
{toJson({ data: row?.data ?? null, error: row?.error ?? null })}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
