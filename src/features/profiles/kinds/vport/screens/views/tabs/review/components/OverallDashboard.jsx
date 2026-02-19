// src/features/profiles/kinds/vport/screens/views/tabs/review/components/OverallDashboard.jsx
import React, { useMemo } from "react";

function Stars({ value = 0, size = 16 }) {
  const v = Number(value) || 0;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: size,
            color: n <= Math.round(v) ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.20)",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function OverallDashboard({
  dimensions = [],
  overallAvg = null,
  overallCount = 0,
  dimStats = {},
  recentComments = [],
}) {
  const avgText = useMemo(() => {
    const v = Number(overallAvg);
    if (!Number.isFinite(v) || v <= 0) return "0.0";
    return v.toFixed(1);
  }, [overallAvg]);

  const breakdown = useMemo(() => {
    const dims = Array.isArray(dimensions) ? dimensions : [];
    return dims.map((d) => {
      const s = dimStats?.[d.key] || null;
      const avg = Number(s?.avg);
      const count = Number(s?.count ?? 0) || 0;
      return {
        key: d.key,
        label: d.label,
        avg: Number.isFinite(avg) ? avg : 0,
        count,
      };
    });
  }, [dimensions, dimStats]);

  return (
    <div
      style={{
        marginTop: 16,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Overall Score */}
      <div
        style={{
          borderRadius: 22,
          padding: 20,
          background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.35))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 900 }}>{avgText}</div>
        <Stars value={Number(avgText)} size={18} />
        <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
          Based on {overallCount} review{overallCount === 1 ? "" : "s"}
        </div>
      </div>

      {/* Breakdown */}
      {breakdown.length > 0 ? (
        <div
          style={{
            borderRadius: 18,
            padding: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: "rgba(255,255,255,0.75)" }}>
            Breakdown
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {breakdown.map((b) => (
              <div
                key={b.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{b.label}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Stars value={b.avg} size={14} />
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>
                    {b.avg ? b.avg.toFixed(1) : "0.0"} ({b.count})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Top 3 Comments */}
      {Array.isArray(recentComments) && recentComments.length > 0 ? (
        <div
          style={{
            borderRadius: 18,
            padding: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: "rgba(255,255,255,0.75)" }}>
            Recent Comments
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentComments.slice(0, 3).map((r, idx) => (
              <div key={r?.id ?? idx} style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: "20px" }}>
                {r.body}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
