import { createResult, summarizeResults } from "@/dev/diagnostics/helpers/testResult";
import { GROUPS_PART1 } from "@/dev/diagnostics/diagnosticsGroups.part1";
import { GROUPS_PART2 } from "@/dev/diagnostics/diagnosticsGroups.part2";

const GROUPS = [...GROUPS_PART1, ...GROUPS_PART2];

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function groupLookup() {
  return new Map(GROUPS.map((group) => [group.id, group]));
}

function normalizeGroupIds(groupIds) {
  if (!Array.isArray(groupIds) || !groupIds.length) {
    return GROUPS.map((group) => group.id);
  }

  const known = new Set(GROUPS.map((group) => group.id));
  return groupIds.filter((groupId, index) => known.has(groupId) && groupIds.indexOf(groupId) === index);
}

function createGroupFailureResult({ groupId, groupLabel, error }) {
  return createResult({
    id: `${groupId}.__group__`,
    group: groupId,
    name: `${groupLabel} group runner failure`,
    ok: false,
    skipped: false,
    durationMs: 0,
    data: null,
    error: {
      name: error?.name ?? "Error",
      message: error?.message ?? "Group runner failed",
      code: error?.code ?? null,
      details: error?.details ?? null,
    },
  });
}

async function runOneGroup({ group, shared, onTestUpdate, onGroupUpdate }) {
  const started = nowMs();
  onGroupUpdate?.({ groupId: group.id, groupLabel: group.label, status: "running" });

  try {
    const results = await group.run({ onTestUpdate, shared });
    const rows = Array.isArray(results) ? results : [];

    const payload = {
      groupId: group.id,
      groupLabel: group.label,
      durationMs: nowMs() - started,
      results: rows,
      summary: summarizeResults(rows),
    };

    onGroupUpdate?.({
      groupId: group.id,
      groupLabel: group.label,
      status: "completed",
      ...payload,
    });

    return payload;
  } catch (error) {
    const failureRow = createGroupFailureResult({
      groupId: group.id,
      groupLabel: group.label,
      error,
    });

    const payload = {
      groupId: group.id,
      groupLabel: group.label,
      durationMs: nowMs() - started,
      results: [failureRow],
      summary: summarizeResults([failureRow]),
    };

    onTestUpdate?.({
      id: failureRow.id,
      group: group.id,
      name: failureRow.name,
      status: "failed",
      result: failureRow,
    });

    onGroupUpdate?.({
      groupId: group.id,
      groupLabel: group.label,
      status: "failed",
      ...payload,
    });

    return payload;
  }
}

export function createDiagnosticsSharedContext() {
  return {
    cache: {},
    meta: {
      startedAt: new Date().toISOString(),
    },
  };
}

export function getDiagnosticsGroups() {
  return GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
  }));
}

export function getDiagnosticsCatalog() {
  return GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    tests: group.getTests(),
  }));
}

export async function runDiagnosticsGroup({ groupId, shared, onTestUpdate, onGroupUpdate }) {
  const lookup = groupLookup();
  const group = lookup.get(groupId);

  if (!group) {
    throw new Error(`Unknown diagnostics group: ${groupId}`);
  }

  const sharedContext = shared ?? createDiagnosticsSharedContext();
  return runOneGroup({
    group,
    shared: sharedContext,
    onTestUpdate,
    onGroupUpdate,
  });
}

export async function runAllDiagnostics({ groupIds, shared, onTestUpdate, onGroupUpdate }) {
  const started = nowMs();
  const selectedIds = normalizeGroupIds(groupIds);
  const lookup = groupLookup();
  const sharedContext = shared ?? createDiagnosticsSharedContext();
  const groupRuns = [];

  for (const groupId of selectedIds) {
    const group = lookup.get(groupId);
    if (!group) continue;

    const run = await runOneGroup({
      group,
      shared: sharedContext,
      onTestUpdate,
      onGroupUpdate,
    });

    groupRuns.push(run);
  }

  const results = groupRuns.flatMap((groupRun) => groupRun.results || []);

  return {
    durationMs: nowMs() - started,
    groups: groupRuns,
    results,
    summary: summarizeResults(results),
  };
}
