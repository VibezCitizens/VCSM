import React from "react";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";

export function SummaryTile({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export function DashboardLoadingState() {
  return <LearningLoadingState label="Loading dashboard..." variant="dashboard" />;
}

export function DashboardErrorState({ error, onRetry, debug }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Admin Dashboard</h2>
      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load admin dashboard"}
      </div>

      {debug ? (
        <div
          style={{
            marginBottom: 16,
            border: "1px solid #d0d7de",
            borderRadius: 12,
            background: "#fff",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#5f6f82",
              marginBottom: 10,
            }}
          >
            Debugger
          </div>

          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              lineHeight: 1.55,
              color: "#08111b",
            }}
          >
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #222",
          background: "#222",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}
