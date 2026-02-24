import React from "react";

export default function DesignStudioExportsPanel({ exportsList, jobsByExportId }) {
  return (
    <section style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase", color: "rgba(255,255,255,0.78)" }}>
        Export Queue
      </div>

      <div style={{ marginTop: 8, display: "grid", gap: 8, maxHeight: 180, overflowY: "auto" }}>
        {(exportsList || []).slice(0, 12).map((item) => {
          const job = jobsByExportId?.[item.id] || null;
          return (
            <div
              key={item.id}
              style={{
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.06)",
                padding: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>{String(item.format || "PNG").toUpperCase()}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{item.status}</div>
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.58)" }}>
                Job: {job?.status || "pending"} | Attempts: {job?.attempts ?? 0}/{job?.maxAttempts ?? 0}
              </div>
            </div>
          );
        })}

        {!exportsList?.length ? (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.58)" }}>No exports requested yet.</div>
        ) : null}
      </div>
    </section>
  );
}
