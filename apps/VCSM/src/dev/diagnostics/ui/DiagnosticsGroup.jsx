import DiagnosticsRow from "@/dev/diagnostics/ui/DiagnosticsRow";

function summarizeGroup(rows) {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let running = 0;
  let idle = 0;

  for (const row of rows || []) {
    const status = row?.status ?? "idle";
    if (status === "passed") passed += 1;
    else if (status === "failed") failed += 1;
    else if (status === "skipped") skipped += 1;
    else if (status === "running") running += 1;
    else idle += 1;
  }

  return {
    total: (rows || []).length,
    passed,
    failed,
    skipped,
    running,
    idle,
  };
}

export default function DiagnosticsGroup({
  group,
  rows,
  onRunGroup,
  isRunning,
  disabled,
}) {
  const summary = summarizeGroup(rows);

  return (
    <details className="rounded-md border-2 border-slate-300 bg-slate-100/95 p-3 text-slate-900 shadow-sm" open>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{group.label}</div>
          <div className="text-xs text-slate-700">
            total: {summary.total} | passed: {summary.passed} | failed: {summary.failed} | skipped: {summary.skipped}
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onRunGroup?.(group.id);
          }}
          disabled={Boolean(disabled || isRunning)}
          className="rounded border border-slate-400 bg-white px-3 py-1 text-xs font-medium text-slate-900 disabled:opacity-50"
        >
          {isRunning ? "Running..." : `Run ${group.label}`}
        </button>
      </summary>

      <div className="mt-3 space-y-2">
        {(rows || []).map((row) => (
          <DiagnosticsRow key={row.id} row={row} />
        ))}
      </div>
    </details>
  );
}
