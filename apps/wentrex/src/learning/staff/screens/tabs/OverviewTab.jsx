import React from "react";

const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const PRIMARY = "#0f4a72";

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 12, color: MUTED }}>{label}</span>
      <strong style={{ fontSize: 28, color: accent ?? "#0f172a" }}>{value}</strong>
    </div>
  );
}

export default function OverviewTab({ course, studentCount, pendingCount, recentSubmissions, navigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Course info */}
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{course?.title}</h3>
        {course?.code && <div style={{ fontSize: 14, color: MUTED, marginBottom: 8 }}>{course.code}</div>}
        {course?.description && <p style={{ margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{course.description}</p>}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <StatCard label="Students" value={studentCount} />
        <StatCard label="Pending Reviews" value={pendingCount} accent={pendingCount > 0 ? "#dc2626" : undefined} />
        <StatCard label="Status" value={course?.status ?? "—"} />
      </div>

      {/* Recent activity */}
      <div>
        <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600 }}>Recent Activity</h4>
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
          {recentSubmissions.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: MUTED, fontSize: 14 }}>No recent activity.</div>
          ) : (
            recentSubmissions.slice(0, 5).map(s => (
              <div key={s.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ color: "#0f172a" }}>Submission received</span>
                <span style={{ color: MUTED }}>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
