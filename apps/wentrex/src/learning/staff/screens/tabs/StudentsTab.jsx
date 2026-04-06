import React, { useState } from "react";

const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

export default function StudentsTab({ students }) {
  const [search, setSearch] = useState("");

  const filtered = students.filter(s => {
    const name = (s.profile?.full_name ?? s.profile?.first_name ?? "").toLowerCase();
    const id = (s.profile?.student_id ?? "").toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || id.includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, color: MUTED }}>{filtered.length} student{filtered.length !== 1 ? "s" : ""}</span>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
          style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, width: 220 }} />
      </div>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: MUTED }}>No students found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Student ID</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Name</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Grade</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Section</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Enrolled</th>
            </tr></thead>
            <tbody>{filtered.map(s => (
              <tr key={s.actor_id} style={{ borderBottom: `1px solid ${BORDER}` }}
                onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
                onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f4a72", fontFamily: "monospace" }}>{s.profile?.student_id ?? "—"}</td>
                <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>{s.profile?.full_name ?? s.actor_id}</td>
                <td style={{ padding: "12px 16px", color: MUTED }}>{s.profile?.grade_level ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: MUTED }}>{s.profile?.section ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: MUTED }}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
