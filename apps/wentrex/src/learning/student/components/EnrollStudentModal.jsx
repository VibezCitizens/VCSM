import { useState, useEffect } from "react";

export default function EnrollStudentModal({ supabase, actorId, organizations, onClose, onSuccess }) {
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");
  const [courses, setCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Load published courses for the selected org
  useEffect(() => {
    if (!supabase || !orgId) { setCourses([]); return; }
    let cancelled = false;
    setLoadingCourses(true);
    setSelectedCourseIds(new Set());

    supabase
      .schema("learning")
      .from("courses")
      .select("id, title, slug, status")
      .eq("organization_id", orgId)
      .in("status", ["published", "active"])
      .order("title")
      .then(({ data }) => {
        if (cancelled) return;
        setCourses(data ?? []);
        setLoadingCourses(false);
      });

    return () => { cancelled = true; };
  }, [supabase, orgId]);

  function toggleCourse(courseId) {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedCourseIds.size === 0 || !actorId) return;

    setSaving(true);
    setFeedback(null);

    try {
      // Check existing memberships to prevent duplicates
      const { data: existing } = await supabase
        .schema("learning")
        .from("course_memberships")
        .select("course_id")
        .eq("actor_id", actorId)
        .eq("role", "student")
        .eq("status", "active")
        .in("course_id", [...selectedCourseIds]);

      const alreadyEnrolled = new Set((existing ?? []).map((r) => r.course_id));
      const toEnroll = [...selectedCourseIds].filter((id) => !alreadyEnrolled.has(id));

      if (toEnroll.length === 0) {
        setFeedback({ ok: false, message: "Student is already enrolled in all selected courses." });
        setSaving(false);
        return;
      }

      const rows = toEnroll.map((courseId) => ({
        course_id: courseId,
        actor_id: actorId,
        role: "student",
        status: "active",
        created_by_actor_id: actorId,
      }));

      const { error: insertError } = await supabase
        .schema("learning")
        .from("course_memberships")
        .insert(rows);

      if (insertError) {
        setFeedback({ ok: false, message: insertError.message ?? "Enrollment failed." });
        setSaving(false);
        return;
      }

      const skipped = alreadyEnrolled.size;
      const enrolled = toEnroll.length;
      const msg = skipped > 0
        ? `Enrolled in ${enrolled} course${enrolled !== 1 ? "s" : ""}. ${skipped} already enrolled.`
        : `Enrolled in ${enrolled} course${enrolled !== 1 ? "s" : ""}.`;

      setFeedback({ ok: true, message: msg });
      onSuccess?.();
      setTimeout(onClose, 1500);
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
        aria-label="Enroll Student"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Enroll Student</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--learning-muted-text)" }}>
              Assign this student to one or more active courses.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--learning-muted-text)", fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {organizations.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Organization</label>
              <select value={orgId} onChange={(e) => setOrgId(e.target.value)} style={inputStyle}>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name ?? org.id}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Courses ({selectedCourseIds.size} selected)
            </label>
            {loadingCourses ? (
              <div style={{ fontSize: 13, color: "var(--learning-muted-text)", padding: 8 }}>Loading courses...</div>
            ) : courses.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--learning-muted-text)", padding: 8 }}>No published courses available yet.</div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--learning-border)", borderRadius: 10, background: "var(--learning-surface)" }}>
                {courses.map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--learning-border, #eee)",
                      cursor: "pointer",
                      fontSize: 14,
                      background: selectedCourseIds.has(c.id) ? "var(--learning-muted, #f1f5f9)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.has(c.id)}
                      onChange={() => toggleCourse(c.id)}
                    />
                    <span>{c.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {feedback && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: feedback.ok ? "#dcfce7" : "#fef2f2",
              color: feedback.ok ? "#166534" : "#7f1d1d",
              fontSize: 14,
            }}>
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
                disabled={saving || selectedCourseIds.size === 0}
                className="learning-button learning-button-primary"
              >
                {saving ? "Enrolling..." : `Enroll in ${selectedCourseIds.size} Course${selectedCourseIds.size !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
