import { useCallback, useMemo, useState } from "react";
import DiagnosticsPanel from "@/dev/diagnostics/ui/DiagnosticsPanel";
import {
  createDiagnosticsSharedContext,
  getDiagnosticsCatalog,
  runAllDiagnostics,
  runDiagnosticsGroup,
} from "@/dev/diagnostics/runAllDiagnostics";

function buildInitialRows(catalog) {
  const output = {};

  for (const group of catalog || []) {
    output[group.id] = (group.tests || []).map((test) => ({
      id: test.id,
      group: test.group,
      name: test.name,
      status: "idle",
      ok: false,
      skipped: false,
      durationMs: 0,
      data: null,
      error: null,
    }));
  }

  return output;
}

function resetRowsByGroups(catalog, previous, groupIds) {
  const groupIdSet = new Set(groupIds);
  const next = { ...previous };

  for (const group of catalog || []) {
    if (!groupIdSet.has(group.id)) continue;

    next[group.id] = (group.tests || []).map((test) => ({
      id: test.id,
      group: test.group,
      name: test.name,
      status: "idle",
      ok: false,
      skipped: false,
      durationMs: 0,
      data: null,
      error: null,
    }));
  }

  return next;
}

function applyTestUpdate(previous, update) {
  if (!update?.group || !update?.id) return previous;

  const groupRows = previous[update.group] || [];

  const updatedRows = groupRows.map((row) => {
    if (row.id !== update.id) {
      return row;
    }

    if (update.status === "running") {
      return {
        ...row,
        status: "running",
        ok: false,
        skipped: false,
        durationMs: 0,
        data: null,
        error: null,
      };
    }

    const result = update.result;
    if (!result) {
      return {
        ...row,
        status: update.status || row.status,
      };
    }

    return {
      ...row,
      status: result.skipped ? "skipped" : result.ok ? "passed" : "failed",
      ok: Boolean(result.ok),
      skipped: Boolean(result.skipped),
      durationMs: Number(result.durationMs) || 0,
      data: result.data ?? null,
      error: result.error ?? null,
    };
  });

  return {
    ...previous,
    [update.group]: updatedRows,
  };
}

function summarizeRows(rowsByGroup) {
  const rows = Object.values(rowsByGroup || {}).flat();

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.status === "passed") passed += 1;
    else if (row.status === "failed") failed += 1;
    else if (row.status === "skipped") skipped += 1;
  }

  return {
    total: rows.length,
    passed,
    failed,
    skipped,
  };
}

export default function DevDiagnosticsScreen() {
  const catalog = useMemo(() => getDiagnosticsCatalog(), []);

  const [rowsByGroup, setRowsByGroup] = useState(() => buildInitialRows(catalog));
  const [runningGroups, setRunningGroups] = useState({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [lastRunAt, setLastRunAt] = useState(null);

  const handleTestUpdate = useCallback((update) => {
    setRowsByGroup((prev) => applyTestUpdate(prev, update));
  }, []);

  const runGroup = useCallback(
    async (groupId) => {
      if (!groupId || isRunningAll || runningGroups[groupId]) return;

      setRowsByGroup((prev) => resetRowsByGroups(catalog, prev, [groupId]));
      setRunningGroups((prev) => ({ ...prev, [groupId]: true }));

      const shared = createDiagnosticsSharedContext();

      try {
        await runDiagnosticsGroup({
          groupId,
          shared,
          onTestUpdate: handleTestUpdate,
          onGroupUpdate: (groupUpdate) => {
            if (groupUpdate?.status === "running") {
              setRunningGroups((prev) => ({ ...prev, [groupUpdate.groupId]: true }));
            }
            if (groupUpdate?.status === "completed" || groupUpdate?.status === "failed") {
              setRunningGroups((prev) => ({ ...prev, [groupUpdate.groupId]: false }));
            }
          },
        });
      } finally {
        setRunningGroups((prev) => ({ ...prev, [groupId]: false }));
        setLastRunAt(new Date().toISOString());
      }
    },
    [catalog, handleTestUpdate, isRunningAll, runningGroups]
  );

  const runAll = useCallback(async () => {
    if (isRunningAll) return;

    const groupIds = catalog.map((group) => group.id);
    setRowsByGroup((prev) => resetRowsByGroups(catalog, prev, groupIds));

    const runningMap = Object.fromEntries(groupIds.map((groupId) => [groupId, true]));

    setIsRunningAll(true);
    setRunningGroups(runningMap);

    const shared = createDiagnosticsSharedContext();

    try {
      await runAllDiagnostics({
        shared,
        onTestUpdate: handleTestUpdate,
        onGroupUpdate: (groupUpdate) => {
          if (!groupUpdate?.groupId) return;

          if (groupUpdate.status === "running") {
            setRunningGroups((prev) => ({ ...prev, [groupUpdate.groupId]: true }));
          }

          if (groupUpdate.status === "completed" || groupUpdate.status === "failed") {
            setRunningGroups((prev) => ({ ...prev, [groupUpdate.groupId]: false }));
          }
        },
      });
    } finally {
      setIsRunningAll(false);
      setRunningGroups({});
      setLastRunAt(new Date().toISOString());
    }
  }, [catalog, handleTestUpdate, isRunningAll]);

  const summary = useMemo(() => summarizeRows(rowsByGroup), [rowsByGroup]);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 pb-28 text-slate-900 md:p-6">
      <DiagnosticsPanel
        catalog={catalog}
        rowsByGroup={rowsByGroup}
        summary={summary}
        isRunningAll={isRunningAll}
        runningGroups={runningGroups}
        onRunAll={runAll}
        onRunGroup={runGroup}
        lastRunAt={lastRunAt}
      />
    </div>
  );
}
