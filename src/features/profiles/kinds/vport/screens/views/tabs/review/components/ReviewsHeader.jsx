// src/features/profiles/kinds/vport/screens/views/tabs/review/components/ReviewsHeader.jsx
import React, { useMemo } from "react";
import { segWrap, segBtn, chip } from "../styles/reviewStyles";

function cleanTabLabel(label) {
  if (!label) return "";
  return String(label)
    .replace(/\breviews?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function ReviewsHeader({
  tab,
  setTab,
  tabLabel,
  displayCnt,
  displayAvg,
  isServiceTab,
  selectedServiceName,
  profile, // kept (no changes), in case you use it later
  dimensions = [],
  hasServices = true,
}) {
  // ✅ single source of truth: parent passes dimensions
  const dims = useMemo(() => {
    const merged = Array.isArray(dimensions) ? dimensions : [];
    return merged.filter((d) => d?.key && d.key !== "vibez");
  }, [dimensions]);

  const tabExists = useMemo(() => {
    if (tab === "overall") return true;
    if (tab === "services") return !!hasServices;
    return !!dims.find((d) => d?.key === tab);
  }, [tab, dims, hasServices]);

  const safeTab = tabExists ? tab : "overall";

  const activeTabLabel = useMemo(() => {
    if (safeTab === "overall") return "Overall";
    if (safeTab === "services") return "Catalog";
    const d = dims.find((x) => x?.key === safeTab);
    return cleanTabLabel(d?.label || tabLabel || "");
  }, [safeTab, dims, tabLabel]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Title + chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div className="text-lg font-semibold" style={{ letterSpacing: 0.2 }}>
            Vibez Reviews
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={chip()}>{activeTabLabel}</span>
            <span style={chip()}>
              {displayCnt} review{displayCnt === 1 ? "" : "s"}
            </span>
            {displayAvg != null ? <span style={chip()}>{displayAvg}★ avg</span> : null}
            {isServiceTab && selectedServiceName ? (
              <span style={chip()}>{selectedServiceName}</span>
            ) : null}
          </div>
        </div>

        <div className="text-sm text-neutral-400" style={{ lineHeight: "18px" }}>
          Rate categories. Overall is computed.
        </div>
      </div>

      {/* Segmented tabs */}
      <div style={{ display: "flex" }}>
        <div style={segWrap()}>
          <button
            type="button"
            style={segBtn(safeTab === "overall")}
            onClick={() => setTab?.("overall")}
          >
            Overall
          </button>

          {dims.map((d) => (
            <button
              key={d.key}
              type="button"
              style={segBtn(safeTab === d.key)}
              onClick={() => setTab?.(d.key)}
            >
              {cleanTabLabel(d.label)}
            </button>
          ))}

          {hasServices ? (
            <button
              type="button"
              style={segBtn(safeTab === "services")}
              onClick={() => setTab?.("services")}
            >
              Catalog
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
