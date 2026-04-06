import React, { useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function StatusBadge({ status }) {
  const c = { submitted: { bg: "#fef9c3", color: "#854d0e" }, graded: { bg: "#dcfce7", color: "#166534" }, late: { bg: "#fef2f2", color: "#7f1d1d" }, draft: { bg: "#f1f5f9", color: MUTED }, returned: { bg: "#e0f2fe", color: "#0369a1" }, missing: { bg: "#fef2f2", color: "#7f1d1d" } }[status] ?? { bg: "#f1f5f9", color: MUTED };
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{status ?? "—"}</span>;
}

function ReviewPanel({ submission, profileMap, assignments, actorId, onClose, onGraded }) {
  const name = profileMap?.get(submission.actor_id)?.full_name ?? "Student";
  const assignment = assignments?.find(a => a.id === submission.assignment_id);

  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleGrade(e) {
    e.preventDefault();
    if (!score) return;
    setSaving(true);
    setError("");

    const { error: gradeErr } = await supabase.schema("learning").from("grades").insert({
      submission_id: submission.id,
      actor_id: submission.actor_id,
      score: parseFloat(score),
      feedback_text: feedback.trim() || null,
      graded_at: new Date().toISOString(),
      graded_by_actor_id: actorId,
    });

    if (gradeErr) {
      setError(gradeErr.message);
      setSaving(false);
      return;
    }

    // Update submission status to graded
    await supabase.schema("learning").from("submissions")
      .update({ status: "graded" }).eq("id", submission.id);

    setSuccess(true);
    setSaving(false);
    if (onGraded) onGraded();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "grid", placeItems: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflow: "auto", padding: 28,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Review Submission</h2>
            <span style={{ fontSize: 14, color: MUTED }}>{name}</span>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 22, cursor: "pointer",
            color: MUTED, padding: "0 4px", lineHeight: 1,
          }}>x</button>
        </div>

        {/* Assignment info */}
        {assignment && (
          <div style={{ background: SURFACE, borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{assignment.title}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
              {assignment.points_possible} pts
              {assignment.due_at && <> · Due {new Date(assignment.due_at).toLocaleDateString()}</>}
            </div>
          </div>
        )}

        {/* Submission details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: MUTED }}>
            <span>Attempt #{submission.attempt_no}</span>
            <span>Submitted {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "—"}</span>
            {submission.is_late && <span style={{ color: "#dc2626", fontWeight: 600 }}>Late</span>}
          </div>

          {submission.submitted_text && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Student's Answer</label>
              <div style={{
                background: SURFACE, borderRadius: 10, padding: 14,
                fontSize: 14, color: "#0f172a", lineHeight: 1.7, whiteSpace: "pre-wrap",
                border: `1px solid ${BORDER}`, maxHeight: 200, overflow: "auto",
              }}>
                {submission.submitted_text}
              </div>
            </div>
          )}

          {submission.submitted_url && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Attached Link / File</label>
              <a href={submission.submitted_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 14, color: PRIMARY, fontWeight: 600, wordBreak: "break-all" }}>
                {submission.submitted_url}
              </a>
            </div>
          )}

          {!submission.submitted_text && !submission.submitted_url && (
            <div style={{ color: MUTED, fontSize: 14, fontStyle: "italic" }}>No content submitted.</div>
          )}
        </div>

        {/* Grade form */}
        {success ? (
          <div style={{ padding: "14px 18px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: 14, fontWeight: 600 }}>
            Graded successfully! Score: {score}/{assignment?.points_possible ?? "—"}
          </div>
        ) : (
          <form onSubmit={handleGrade} style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Grade This Submission</h3>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                  Score {assignment ? `(out of ${assignment.points_possible})` : ""}
                </label>
                <input type="number" min="0" max={assignment?.points_possible ?? 1000} step="0.5"
                  value={score} onChange={e => setScore(e.target.value)}
                  placeholder="0" required
                  style={{
                    padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
                    fontSize: 15, fontWeight: 600, width: "100%", boxSizing: "border-box",
                  }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Feedback (optional)</label>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Great work! / Please review..."
                rows={3}
                style={{
                  padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
                  fontSize: 14, resize: "vertical", fontFamily: "inherit",
                  width: "100%", boxSizing: "border-box",
                }} />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#7f1d1d", fontSize: 13 }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={saving || !score}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: !score ? MUTED : PRIMARY, color: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer",
                }}>
                {saving ? "Saving..." : "Submit Grade"}
              </button>
              <button type="button" onClick={onClose}
                style={{
                  padding: "10px 24px", borderRadius: 10,
                  border: `1px solid ${BORDER}`, background: "#fff",
                  color: MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SubmissionsTab({ submissions, profileMap, assignments, actorId, onReload }) {
  const [selected, setSelected] = useState(null);
  const pending = submissions.filter(s => s.status === "submitted" || s.status === "late");
  const graded = submissions.filter(s => s.status === "graded" || s.status === "returned");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
        <span style={{ color: "#dc2626", fontWeight: 600 }}>{pending.length} pending</span>
        <span style={{ color: "#166534" }}>{graded.length} graded</span>
        <span style={{ color: MUTED }}>{submissions.length} total</span>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        {submissions.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: MUTED }}>No submissions yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Student</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Assignment</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Status</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Attempt</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Submitted</th>
            </tr></thead>
            <tbody>{submissions.map(s => {
              const name = profileMap?.get(s.actor_id)?.full_name ?? s.actor_id?.slice(0, 8);
              const assignmentTitle = assignments?.find(a => a.id === s.assignment_id)?.title ?? "";
              return (
                <tr key={s.id}
                  style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
                  onClick={() => setSelected(s)}
                  onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>{name}</td>
                  <td style={{ padding: "12px 16px", color: MUTED, fontSize: 13 }}>{assignmentTitle}</td>
                  <td style={{ padding: "12px 16px" }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: "12px 16px", color: MUTED }}>#{s.attempt_no}</td>
                  <td style={{ padding: "12px 16px", color: MUTED }}>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}</td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>

      {selected && (
        <ReviewPanel
          submission={selected}
          profileMap={profileMap}
          assignments={assignments}
          actorId={actorId}
          onClose={() => setSelected(null)}
          onGraded={() => { setSelected(null); if (onReload) onReload(); }}
        />
      )}
    </div>
  );
}
