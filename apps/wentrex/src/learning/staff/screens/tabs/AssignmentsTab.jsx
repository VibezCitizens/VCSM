import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function Badge({ label, color, bg }) {
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: bg, color }}>{label}</span>;
}

export default function AssignmentsTab({ assignments, courseId, onReload }) {
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(null);

  async function togglePublish(assignmentId, currentlyPublished) {
    setUpdating(assignmentId);
    await supabase.schema("learning").from("assignments")
      .update({ is_published: !currentlyPublished, updated_at: new Date().toISOString() })
      .eq("id", assignmentId);
    setUpdating(null);
    onReload?.();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, color: MUTED }}>{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</span>
        <button onClick={() => navigate(`/teacher/course/${courseId}/create-assignment`)} style={{
          padding: "8px 18px", borderRadius: 8, border: "none",
          background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          + Create Assignment
        </button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        {assignments.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: MUTED }}>No assignments yet. Create your first one.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Title</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Points</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Due</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Status</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Type</th>
              <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Actions</th>
            </tr></thead>
            <tbody>{assignments.map(a => (
              <tr key={a.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
                onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>{a.title}</td>
                <td style={{ padding: "12px 16px", color: MUTED }}>{a.points_possible}</td>
                <td style={{ padding: "12px 16px", color: MUTED }}>{a.due_at ? new Date(a.due_at).toLocaleDateString() : "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge label={a.is_published ? "Published" : "Draft"} color={a.is_published ? "#166534" : "#854d0e"} bg={a.is_published ? "#dcfce7" : "#fef9c3"} />
                </td>
                <td style={{ padding: "12px 16px", color: MUTED }}>{a.submission_type}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button
                    onClick={() => togglePublish(a.id, a.is_published)}
                    disabled={updating === a.id}
                    style={{
                      padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: "none",
                      background: a.is_published ? "#fef9c3" : "#dcfce7",
                      color: a.is_published ? "#854d0e" : "#166534",
                    }}>
                    {updating === a.id ? "..." : a.is_published ? "Unpublish" : "Publish"}
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
