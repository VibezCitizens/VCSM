import React from "react";

const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

export default function GradesTab({ grades, profileMap, submissions, assignments }) {
  const subMap = new Map((submissions ?? []).map(s => [s.id, s]));
  const assignMap = new Map((assignments ?? []).map(a => [a.id, a]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <span style={{ fontSize: 14, color: MUTED }}>{grades.length} grade{grades.length !== 1 ? "s" : ""} recorded</span>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        {grades.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: MUTED }}>No grades recorded yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Student</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Assignment</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Score</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Submitted</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Graded</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Feedback</th>
            </tr></thead>
            <tbody>{grades.map(g => {
              const name = profileMap?.get(g.actor_id)?.full_name ?? g.actor_id?.slice(0, 8);
              const sub = subMap.get(g.submission_id);
              const assignment = sub ? assignMap.get(sub.assignment_id) : null;
              return (
                <tr key={g.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>{name}</td>
                  <td style={{ padding: "12px 16px", color: MUTED, fontSize: 13 }}>{assignment?.title ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#166534" }}>{g.score ?? "—"}{assignment ? `/${assignment.points_possible}` : ""}</td>
                  <td style={{ padding: "12px 16px", color: MUTED, fontSize: 13 }}>{sub?.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "—"}</td>
                  <td style={{ padding: "12px 16px", color: MUTED, fontSize: 13 }}>{g.graded_at ? new Date(g.graded_at).toLocaleString() : "—"}</td>
                  <td style={{ padding: "12px 16px", color: MUTED, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.feedback_text || "—"}</td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
