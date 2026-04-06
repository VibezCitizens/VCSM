export function buildTestId(group, key) {
  return `${group}.${key}`;
}

function cleanUndefined(input) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

export function createResult({
  id,
  group,
  name,
  ok,
  skipped = false,
  durationMs = 0,
  data = null,
  error = null,
}) {
  return cleanUndefined({
    id,
    group,
    name,
    ok: Boolean(ok),
    skipped: Boolean(skipped),
    durationMs: Math.max(0, Number(durationMs) || 0),
    data,
    error,
  });
}

export function summarizeResults(results) {
  const list = Array.isArray(results) ? results : [];

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of list) {
    if (row?.skipped) {
      skipped += 1;
      continue;
    }

    if (row?.ok) {
      passed += 1;
    } else {
      failed += 1;
    }
  }

  return {
    total: list.length,
    passed,
    failed,
    skipped,
  };
}

export function toStatus(result) {
  if (!result) return "idle";
  if (result.skipped) return "skipped";
  return result.ok ? "passed" : "failed";
}
