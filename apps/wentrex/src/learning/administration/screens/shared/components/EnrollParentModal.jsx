import { useState, useEffect } from "react";
import { createParent } from "@/features/services/supabase/createParent";

export default function EnrollParentModal({ supabase, organizations, onClose }) {
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [students, setStudents] = useState([]);
  const [studentActorId, setStudentActorId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Load courses when org changes
  useEffect(() => {
    if (!supabase || !orgId) { setCourses([]); return; }
    let cancelled = false;
    setLoadingCourses(true);
    setCourseId("");
    setStudents([]);
    setStudentActorId("");

    supabase
      .schema("learning")
      .from("courses")
      .select("id, title")
      .eq("organization_id", orgId)
      .in("status", ["published", "active"])
      .order("title")
      .then(({ data }) => {
        if (cancelled) return;
        const rows = data ?? [];
        setCourses(rows);
        if (rows.length > 0) setCourseId(rows[0].id);
        setLoadingCourses(false);
      });

    return () => { cancelled = true; };
  }, [supabase, orgId]);

  // Load students when course changes
  useEffect(() => {
    if (!supabase || !courseId) { setStudents([]); return; }
    let cancelled = false;
    setLoadingStudents(true);
    setStudentActorId("");

    supabase
      .schema("learning")
      .from("course_memberships")
      .select("actor_id, role, status")
      .eq("course_id", courseId)
      .eq("role", "student")
      .eq("status", "active")
      .order("created_at")
      .then(({ data }) => {
        if (cancelled) return;
        const rows = data ?? [];
        setStudents(rows);
        if (rows.length > 0) setStudentActorId(rows[0].actor_id);
        setLoadingStudents(false);
      });

    return () => { cancelled = true; };
  }, [supabase, courseId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!orgId || !courseId || !studentActorId || !displayName.trim() || !email.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const res = await createParent({
        organizationId: orgId,
        courseId,
        studentActorId,
        displayName: displayName.trim(),
        email: email.trim(),
      });

      if (res.ok) {
        const msg = res.data?.createdNewUser && res.data?.generatedPassword
          ? `${displayName.trim()} enrolled as parent. Password: ${res.data.generatedPassword}`
          : `${displayName.trim()} enrolled as parent.`;
        setFeedback({ ok: true, message: msg });
        setTimeout(onClose, 3000);
      } else {
        setFeedback({ ok: false, message: res.error?.message ?? "Enrollment failed." });
      }
    } catch (err) {
      setFeedback({ ok: false, message: err?.message ?? "Unexpected error." });
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--learning-border)",
    fontSize: 14,
    background: "var(--learning-surface)",
    color: "var(--learning-text)",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--learning-surface)",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Enroll Parent"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Enroll Parent</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--learning-muted-text)",
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {organizations.length > 1 && (
            <Field label="Organization">
              <select value={orgId} onChange={(e) => setOrgId(e.target.value)} style={inputStyle} required>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name ?? org.id}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Course">
            {loadingCourses ? (
              <div style={{ fontSize: 13, color: "var(--learning-muted-text)" }}>Loading courses...</div>
            ) : courses.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--learning-muted-text)" }}>No published courses found.</div>
            ) : (
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={inputStyle} required>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title ?? c.id}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Student">
            {loadingStudents ? (
              <div style={{ fontSize: 13, color: "var(--learning-muted-text)" }}>Loading students...</div>
            ) : students.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--learning-muted-text)" }}>No active students in this course.</div>
            ) : (
              <select value={studentActorId} onChange={(e) => setStudentActorId(e.target.value)} style={inputStyle} required>
                {students.map((s) => (
                  <option key={s.actor_id} value={s.actor_id}>{s.actor_id}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Parent Full Name">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Mary Smith"
              required
              style={inputStyle}
            />
          </Field>

          <Field label="Parent Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              required
              style={inputStyle}
            />
          </Field>

          {feedback && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: feedback.ok ? "#dcfce7" : "#fef2f2",
                color: feedback.ok ? "#166534" : "#7f1d1d",
                fontSize: 14,
                wordBreak: "break-all",
              }}
            >
              {feedback.message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="learning-button learning-button-secondary">
              {feedback?.ok ? "Done" : "Cancel"}
            </button>
            {!feedback?.ok && (
              <button
                type="submit"
                disabled={saving || !displayName.trim() || !email.trim() || !courseId || !studentActorId}
                className="learning-button learning-button-primary"
              >
                {saving ? "Enrolling..." : "Enroll Parent"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--learning-text)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
