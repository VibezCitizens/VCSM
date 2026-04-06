import DiagnosticsGroup from "@/dev/diagnostics/ui/DiagnosticsGroup";
import { useMemo, useRef } from "react";

function formatRunTime(timestamp) {
  if (!timestamp) return "Never";
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return String(timestamp);
  }
}

function toSafeDateStamp(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toISOString().replace(/[:.]/g, "-");
}

export default function DiagnosticsPanel({
  catalog,
  rowsByGroup,
  summary,
  isRunningAll,
  runningGroups,
  onRunAll,
  onRunGroup,
  lastRunAt,
}) {
  const panelRootRef = useRef(null);
  const groupRefs = useRef([]);
  const scrollContainerRef = useRef(null);

  const failingSectionIndexes = useMemo(() => {
    return (catalog || []).reduce((indexes, group, index) => {
      const hasFailure = (rowsByGroup?.[group.id] || []).some((row) => row?.status === "failed");
      if (hasFailure) indexes.push(index);
      return indexes;
    }, []);
  }, [catalog, rowsByGroup]);

  function setGroupRef(index, node) {
    groupRefs.current[index] = node;
  }

  function resolveScrollContainer() {
    if (scrollContainerRef.current && scrollContainerRef.current.isConnected) {
      return scrollContainerRef.current;
    }

    let node = panelRootRef.current?.parentElement ?? panelRootRef.current;

    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY;
      const canScrollY =
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        node.scrollHeight > node.clientHeight;

      if (canScrollY) {
        scrollContainerRef.current = node;
        return node;
      }

      node = node.parentElement;
    }

    scrollContainerRef.current = document.scrollingElement || document.documentElement;
    return scrollContainerRef.current;
  }

  function scrollToTop() {
    const scroller = resolveScrollContainer();
    if (!scroller) return;

    const isWindowScroller =
      scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body;

    if (isWindowScroller) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    scroller.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getCurrentSectionIndex() {
    const marker = Math.max(120, window.innerHeight * 0.3);
    const refs = groupRefs.current || [];

    let currentIndex = 0;

    for (let index = 0; index < refs.length; index += 1) {
      const node = refs[index];
      if (!node) continue;

      const top = node.getBoundingClientRect().top;
      if (top <= marker) {
        currentIndex = index;
      } else {
        break;
      }
    }

    return currentIndex;
  }

  function scrollToSectionIndex(index) {
    const node = groupRefs.current[index];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollSectionUp() {
    if (!catalog?.length) return;
    const currentIndex = getCurrentSectionIndex();
    const targetIndex = Math.max(0, currentIndex - 1);
    scrollToSectionIndex(targetIndex);
  }

  function scrollSectionDown() {
    if (!catalog?.length) return;
    const currentIndex = getCurrentSectionIndex();
    const targetIndex = Math.min((catalog?.length || 1) - 1, currentIndex + 1);
    scrollToSectionIndex(targetIndex);
  }

  function scrollToNextFailingSection() {
    if (!failingSectionIndexes.length) return;

    const currentIndex = getCurrentSectionIndex();
    const nextIndex = failingSectionIndexes.find((index) => index > currentIndex);
    const targetIndex = nextIndex ?? failingSectionIndexes[0];

    scrollToSectionIndex(targetIndex);
  }

  function buildGroupsPayload(filterStatuses) {
    return (catalog || [])
      .map((group) => {
        const tests = (rowsByGroup?.[group.id] ?? []).filter((row) =>
          Array.isArray(filterStatuses) && filterStatuses.length
            ? filterStatuses.includes(row.status)
            : true
        );

        return {
          id: group.id,
          label: group.label,
          tests,
        };
      })
      .filter((group) => group.tests.length > 0 || !filterStatuses?.length);
  }

  function downloadPayload(payload, filenamePrefix = "diagnostics") {
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filenamePrefix}-${toSafeDateStamp(lastRunAt)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  }

  function handleDownloadJson() {
    const payload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      lastRunAt: lastRunAt ?? null,
      summary,
      groups: buildGroupsPayload(),
    };

    downloadPayload(payload, "diagnostics");
  }

  function handleDownloadFailedSkippedJson() {
    const payload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      lastRunAt: lastRunAt ?? null,
      summary,
      groups: buildGroupsPayload(["failed", "skipped"]),
      filter: {
        includedStatuses: ["failed", "skipped"],
      },
    };

    downloadPayload(payload, "diagnostics-failed-skipped");
  }

  return (
    <div ref={panelRootRef} className="space-y-4">
      <div className="fixed left-2 top-1/2 z-40 -translate-y-1/2 space-y-2 md:left-4">
        <button
          type="button"
          onClick={scrollSectionDown}
          className="block min-w-[6.75rem] rounded border border-slate-500 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-900 shadow-sm md:min-w-[8rem] md:text-xs"
        >
          Section Down
        </button>
        <button
          type="button"
          onClick={scrollToNextFailingSection}
          disabled={!failingSectionIndexes.length}
          className="block min-w-[6.75rem] rounded border border-slate-500 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-900 shadow-sm disabled:opacity-50 md:min-w-[8rem] md:text-xs"
        >
          Next Failed
        </button>
      </div>

      <div className="fixed right-2 top-1/2 z-40 -translate-y-1/2 space-y-2 md:right-4">
        <button
          type="button"
          onClick={scrollToTop}
          className="block min-w-[6.75rem] rounded border border-slate-500 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-900 shadow-sm md:min-w-[8rem] md:text-xs"
        >
          Top
        </button>
        <button
          type="button"
          onClick={scrollSectionUp}
          className="block min-w-[6.75rem] rounded border border-slate-500 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-900 shadow-sm md:min-w-[8rem] md:text-xs"
        >
          Section Up
        </button>
      </div>

      <section className="rounded-md border-2 border-slate-300 bg-white/95 p-4 text-slate-900 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Developer Diagnostics</h1>
            <p className="text-sm text-slate-700">
              Last run: {formatRunTime(lastRunAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="rounded border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Download JSON
            </button>
            <button
              type="button"
              onClick={handleDownloadFailedSkippedJson}
              className="rounded border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Download Failed/Skipped JSON
            </button>

            <button
              type="button"
              onClick={onRunAll}
              disabled={Boolean(isRunningAll)}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isRunningAll ? "Running all tests..." : "Run all tests"}
            </button>
          </div>
        </div>

        <div className="mt-3 text-sm font-medium text-slate-800">
          <span className="mr-4">total: {summary.total}</span>
          <span className="mr-4">passed: {summary.passed}</span>
          <span className="mr-4">failed: {summary.failed}</span>
          <span>skipped: {summary.skipped}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(catalog || []).map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => onRunGroup?.(group.id)}
              disabled={Boolean(isRunningAll || runningGroups?.[group.id])}
              className="rounded border border-slate-400 bg-white px-3 py-1 text-xs font-medium text-slate-900 disabled:opacity-50"
            >
              {runningGroups?.[group.id] ? `Running ${group.label}...` : `Run ${group.label} tests`}
            </button>
          ))}
        </div>
      </section>

      {(catalog || []).map((group, index) => (
        <div key={group.id} ref={(node) => setGroupRef(index, node)}>
          <DiagnosticsGroup
            group={group}
            rows={rowsByGroup?.[group.id] ?? []}
            onRunGroup={onRunGroup}
            isRunning={Boolean(runningGroups?.[group.id])}
            disabled={Boolean(isRunningAll)}
          />
        </div>
      ))}
    </div>
  );
}
