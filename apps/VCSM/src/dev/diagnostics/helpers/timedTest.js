import { createResult } from "@/dev/diagnostics/helpers/testResult";
import { toDiagnosticsError } from "@/dev/diagnostics/helpers/supabaseAssert";

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function settleSuccess(payload) {
  if (payload && typeof payload === "object" && "skipped" in payload) {
    return {
      ok: false,
      skipped: Boolean(payload.skipped),
      data: payload.data ?? null,
      error: payload.error ?? null,
    };
  }

  return {
    ok: true,
    skipped: false,
    data: payload ?? null,
    error: null,
  };
}

export async function runTimedDiagnosticsTest({
  id,
  group,
  name,
  run,
  onTestUpdate,
  shared,
}) {
  onTestUpdate?.({ id, group, name, status: "running" });

  const started = nowMs();

  try {
    const payload = await run({ shared });
    const settled = settleSuccess(payload);

    const result = createResult({
      id,
      group,
      name,
      ok: settled.ok,
      skipped: settled.skipped,
      durationMs: nowMs() - started,
      data: settled.data,
      error: settled.error,
    });

    onTestUpdate?.({
      id,
      group,
      name,
      status: result.skipped ? "skipped" : result.ok ? "passed" : "failed",
      result,
    });

    return result;
  } catch (error) {
    const result = createResult({
      id,
      group,
      name,
      ok: false,
      skipped: false,
      durationMs: nowMs() - started,
      data: null,
      error: toDiagnosticsError(error),
    });

    onTestUpdate?.({ id, group, name, status: "failed", result });
    return result;
  }
}

export async function runDiagnosticsTests({
  group,
  tests,
  onTestUpdate,
  shared,
}) {
  const rows = [];

  for (const test of tests || []) {
    const row = await runTimedDiagnosticsTest({
      id: test.id,
      group,
      name: test.name,
      run: test.run,
      onTestUpdate,
      shared,
    });

    rows.push(row);
  }

  return rows;
}
