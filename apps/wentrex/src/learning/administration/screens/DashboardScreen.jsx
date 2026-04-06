import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { createOrgMember } from "@/features/services/supabase/createOrgMember";
import TopBar from "@/learning/components/TopBar";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

// ─── Data Loading ────────────────────────────────────────────────────────────

// actorId is resolved by the identity engine — passed in from the component.
async function loadDashboard(actorId) {
  if (!actorId) return null;

  // Display email — cached session read, no network call
  const { data: { session } } = await supabase.auth.getSession();
  const userEmail = session?.user?.email ?? null;

  // Org memberships — RequireRole already ensures admin access
  const { data: allMemberships } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .select("organization_id, role, status")
    .eq("actor_id", actorId)
    .eq("status", "active");

  const membership = allMemberships?.[0] ?? null;

  let org = null;
  let realm = null;

  if (membership) {
    const { data: orgRow } = await supabase
      .schema("learning")
      .from("organizations")
      .select("id, name, slug, realm_id, is_active")
      .eq("id", membership.organization_id)
      .maybeSingle();

    org = orgRow;

    if (orgRow?.realm_id) {
      const { data: realmRow } = await supabase
        .schema("learning")
        .from("realms")
        .select("id, name, slug, is_active, primary_color")
        .eq("id", orgRow.realm_id)
        .maybeSingle();
      realm = realmRow;
    }
  }

  // Load counts in parallel
  const [courses, members, students, teachers, terms, parents] = await Promise.all([
    supabase.schema("learning").from("courses")
      .select("id, title, status, slug", { count: "exact", head: false })
      .eq("organization_id", org?.id ?? "00000000-0000-0000-0000-000000000000")
      .then(r => ({ rows: r.data ?? [], count: r.count ?? 0 })),
    supabase.schema("learning").from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org?.id ?? "00000000-0000-0000-0000-000000000000")
      .eq("status", "active")
      .then(r => ({ count: r.count ?? 0 })),
    supabase.schema("learning").from("actor_identities")
      .select("actor_id", { count: "exact", head: true })
      .eq("organization_id", org?.id ?? "00000000-0000-0000-0000-000000000000")
      .eq("is_school_managed", true)
      .then(r => ({ count: r.count ?? 0 })),
    supabase.schema("learning").from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org?.id ?? "00000000-0000-0000-0000-000000000000")
      .eq("role", "teacher").eq("status", "active")
      .then(r => ({ count: r.count ?? 0 })),
    supabase.schema("learning").from("course_terms")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org?.id ?? "00000000-0000-0000-0000-000000000000")
      .then(r => ({ count: r.count ?? 0 })),
    supabase.schema("learning").from("parent_student_links")
      .select("parent_actor_id", { count: "exact", head: false })
      .eq("organization_id", org?.id ?? "00000000-0000-0000-0000-000000000000")
      .then(r => {
        const unique = new Set((r.data ?? []).map(l => l.parent_actor_id));
        return { count: unique.size };
      }),
  ]);

  return {
    userEmail,
    realm,
    org,
    membership,
    stats: {
      totalCourses: courses.count,
      publishedCourses: courses.rows.filter(c => c.status === "published").length,
      draftCourses: courses.rows.filter(c => c.status === "draft").length,
      archivedCourses: courses.rows.filter(c => c.status === "archived").length,
      totalMembers: members.count,
      totalStudents: students.count,
      totalTeachers: teachers.count,
      totalTerms: terms.count,
      totalParents: parents.count,
    },
    courses: courses.rows,
  };
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>{label}</span>
      <strong style={{ fontSize: 32, lineHeight: 1.1, color: "#0f172a" }}>{value}</strong>
      {sub && <span style={{ fontSize: 12, color: MUTED }}>{sub}</span>}
    </div>
  );
}

function ModuleCard({ title, count, sub, actions = [], actionLabel, onOpen }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: 22, display: "flex", flexDirection: "column", gap: 14, minHeight: 220,
    }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{title}</h3>

      <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{sub}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {actions.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={action.onClick}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 12px", borderRadius: 10,
              border: `1px solid ${BORDER}`, background: "#fff",
              color: "#0f172a", fontSize: 13, fontWeight: 500,
              cursor: "pointer", textAlign: "left",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
          >
            {action.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpen}
        style={{
          marginTop: "auto", padding: "10px 16px", borderRadius: 10,
          border: "none", background: count > 0 ? PRIMARY : "#e2e8f0",
          color: count > 0 ? "#fff" : MUTED,
          fontSize: 14, fontWeight: 600, cursor: count > 0 ? "pointer" : "default",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          opacity: count > 0 ? 1 : 0.7,
        }}
      >
        <span>{count > 0 ? actionLabel : "No data yet"}</span>
        <span style={{ fontSize: 16 }}>→</span>
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    published: { bg: "#dcfce7", color: "#166534" },
    active: { bg: "#dcfce7", color: "#166534" },
    draft: { bg: "#fef9c3", color: "#854d0e" },
    archived: { bg: "#f1f5f9", color: "#64748b" },
  };
  const c = colors[status] ?? colors.draft;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    }}>
      {status ?? "—"}
    </span>
  );
}

function SectionHeader({ title, count, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
        {title} {count != null && <span style={{ color: MUTED, fontWeight: 400 }}>({count})</span>}
      </h2>
      {action && (
        <button onClick={onAction} style={{
          padding: "8px 18px", borderRadius: 10,
          border: "none", background: PRIMARY, color: "#fff",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          {action}
        </button>
      )}
    </div>
  );
}

function QuickAction({ label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "#fff",
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      padding: "20px 24px",
      textAlign: "left",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      transition: "border-color 0.15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{label}</span>
      <span style={{ fontSize: 13, color: MUTED }}>{sub}</span>
    </button>
  );
}

// ─── Enroll Staff Modal ──────────────────────────────────────────────────────

function EnrollStaffModal({ organizationId, onClose, onSuccess }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: `1px solid ${BORDER}`, fontSize: 14,
    background: "#fff", color: "#0f172a", boxSizing: "border-box",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!displayName.trim() || !email.trim()) return;

    setSaving(true);
    setFeedback(null);

    const res = await createOrgMember({
      organizationId,
      displayName: displayName.trim(),
      email: email.trim(),
      role,
    });

    setSaving(false);

    if (res.ok) {
      const msg = res.data?.createdNewUser && res.data?.generatedPassword
        ? `${displayName.trim()} enrolled as ${role}. Password: ${res.data.generatedPassword}`
        : `${displayName.trim()} enrolled as ${role}.`;
      setFeedback({ ok: true, message: msg });
      onSuccess?.();
      setTimeout(onClose, 3000);
    } else {
      setFeedback({ ok: false, message: res.error?.message ?? "Enrollment failed." });
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        role="dialog" aria-modal="true" aria-label="Enroll Staff"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Enroll Staff</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>Create a new account or enroll an existing user.</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Full Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Jane Smith" required style={inputStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required style={inputStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
              <option value="teacher">Teacher</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          {feedback && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, fontSize: 14, wordBreak: "break-all",
              background: feedback.ok ? "#dcfce7" : "#fef2f2",
              color: feedback.ok ? "#166534" : "#7f1d1d",
            }}>
              {feedback.message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}>
              {feedback?.ok ? "Done" : "Cancel"}
            </button>
            {!feedback?.ok && (
              <button type="submit" disabled={saving || !displayName.trim() || !email.trim()} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: saving ? MUTED : PRIMARY, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer",
              }}>
                {saving ? "Enrolling..." : "Enroll"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Visibility Field with Popover ───────────────────────────────────────────

function VisibilityField({ visibility, onChange, inputStyle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function dismiss() { setOpen(false); }
    document.addEventListener("scroll", dismiss, true);
    document.addEventListener("mousedown", (e) => {
      if (ref.current && !ref.current.contains(e.target)) dismiss();
    });
    return () => {
      document.removeEventListener("scroll", dismiss, true);
      document.removeEventListener("mousedown", dismiss);
    };
  }, [open]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }} ref={ref}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Visibility</label>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-label="What is visibility?"
          style={{
            width: 16, height: 16, borderRadius: 999,
            border: `1.5px solid #94a3b8`, background: "transparent",
            color: "#94a3b8", fontSize: 10, fontWeight: 700,
            display: "inline-grid", placeItems: "center",
            cursor: "pointer", lineHeight: 1, padding: 0,
          }}
        >
          ?
        </button>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: -6, left: "100%", marginLeft: 8,
          width: 260, background: "#0f172a", color: "#cbd5e1",
          borderRadius: 8, padding: "10px 14px", fontSize: 12,
          lineHeight: 1.55, zIndex: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div><strong style={{ color: "#fff" }}>Private</strong> — Only enrolled members.</div>
          <div><strong style={{ color: "#fff" }}>Organization</strong> — Anyone in the org can discover it.</div>
          <div><strong style={{ color: "#fff" }}>Public</strong> — Anyone on the platform.</div>
        </div>
      )}
      <select value={visibility} onChange={onChange} style={inputStyle}>
        <option value="private">Private</option>
        <option value="organization">Organization</option>
        <option value="public">Public</option>
      </select>
    </div>
  );
}

// EnrollParentModal removed — now at /link-parent screen

function _unused_EnrollParentModal({ organizationId, onClose, onSuccess }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [students, setStudents] = useState([]);
  const [studentActorId, setStudentActorId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: `1px solid ${BORDER}`, fontSize: 14,
    background: "#fff", color: "#0f172a", boxSizing: "border-box",
  };

  // Load courses
  useEffect(() => {
    if (!organizationId) return;
    supabase.schema("learning").from("courses")
      .select("id, title, status")
      .eq("organization_id", organizationId)
      .in("status", ["published", "active", "draft"])
      .order("title")
      .then(({ data }) => {
        const rows = data ?? [];
        setCourses(rows);
        if (rows.length > 0) setCourseId(rows[0].id);
        setLoadingCourses(false);
      });
  }, [organizationId]);

  // Load students when course changes
  useEffect(() => {
    if (!courseId) { setStudents([]); return; }
    setLoadingStudents(true);
    setStudentActorId("");
    supabase.schema("learning").from("course_memberships")
      .select("actor_id")
      .eq("course_id", courseId)
      .eq("role", "student")
      .eq("status", "active")
      .then(({ data }) => {
        const rows = data ?? [];
        setStudents(rows);
        if (rows.length > 0) setStudentActorId(rows[0].actor_id);
        setLoadingStudents(false);
      });
  }, [courseId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !courseId || !studentActorId) return;

    setSaving(true);
    setFeedback(null);

    const res = await createParent({
      organizationId,
      courseId,
      studentActorId,
      displayName: displayName.trim(),
      email: email.trim(),
    });

    setSaving(false);

    if (res.ok) {
      const msg = res.data?.createdNewUser && res.data?.generatedPassword
        ? `Parent enrolled. Password: ${res.data.generatedPassword}`
        : `Parent enrolled successfully.`;
      setFeedback({ ok: true, message: msg });
      onSuccess?.();
      setTimeout(onClose, 3000);
    } else {
      setFeedback({ ok: false, message: res.error?.message ?? "Enrollment failed." });
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        role="dialog" aria-modal="true" aria-label="Enroll Parent"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Enroll Parent</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>Create a parent account and link to a student.</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Parent Full Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Mary Smith" required style={inputStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Parent Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="parent@example.com" required style={inputStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Course</label>
            {loadingCourses ? (
              <div style={{ fontSize: 13, color: MUTED, padding: 8 }}>Loading courses...</div>
            ) : courses.length === 0 ? (
              <div style={{ fontSize: 13, color: MUTED, padding: 8 }}>No courses available.</div>
            ) : (
              <select value={courseId} onChange={e => setCourseId(e.target.value)} style={inputStyle}>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Student</label>
            {loadingStudents ? (
              <div style={{ fontSize: 13, color: MUTED, padding: 8 }}>Loading students...</div>
            ) : students.length === 0 ? (
              <div style={{ fontSize: 13, color: MUTED, padding: 8 }}>No students enrolled in this course.</div>
            ) : (
              <select value={studentActorId} onChange={e => setStudentActorId(e.target.value)} style={inputStyle}>
                {students.map(s => <option key={s.actor_id} value={s.actor_id}>{s.actor_id}</option>)}
              </select>
            )}
          </div>

          {feedback && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, fontSize: 14, wordBreak: "break-all",
              background: feedback.ok ? "#dcfce7" : "#fef2f2",
              color: feedback.ok ? "#166534" : "#7f1d1d",
            }}>
              {feedback.message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}>
              {feedback?.ok ? "Done" : "Cancel"}
            </button>
            {!feedback?.ok && (
              <button type="submit" disabled={saving || !displayName.trim() || !email.trim() || !courseId || !studentActorId} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: saving ? MUTED : PRIMARY, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer",
              }}>
                {saving ? "Enrolling..." : "Enroll Parent"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Course Modal ─────────────────────────────────────────────────────

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function CreateCourseModal({ organizationId, realmId, actorId, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("organization");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: `1px solid ${BORDER}`, fontSize: 14,
    background: "#fff", color: "#0f172a", boxSizing: "border-box",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setFeedback(null);

    const slug = `${slugify(title.trim())}-${Date.now().toString(36)}`;

    const { data: course, error: courseErr } = await supabase
      .schema("learning")
      .from("courses")
      .insert({
        organization_id: organizationId,
        realm_id: realmId,
        title: title.trim(),
        slug,
        code: code.trim() || null,
        description: description.trim() || null,
        visibility,
        status: "draft",
        created_by_actor_id: actorId,
      })
      .select("id, title, slug, status")
      .single();

    if (courseErr) {
      setSaving(false);
      setFeedback({ ok: false, message: courseErr.message ?? "Failed to create course." });
      return;
    }

    // Create default module (org-scoped)
    await supabase.schema("learning").from("modules").insert({
      course_id: course.id,
      title: "Getting Started",
      description: "",
      sort_order: 1,
      organization_id: organizationId,
    });

    setSaving(false);
    setFeedback({ ok: true, message: `"${course.title}" created as draft.` });
    onSuccess?.();
    setTimeout(onClose, 2000);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        role="dialog" aria-modal="true" aria-label="Create Course"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create Course</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>New courses start as draft.</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Introduction to Biology" required style={inputStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Course Code</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. BIO-101" style={inputStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief course description..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <VisibilityField visibility={visibility} onChange={e => setVisibility(e.target.value)} inputStyle={inputStyle} />

          {feedback && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, fontSize: 14,
              background: feedback.ok ? "#dcfce7" : "#fef2f2",
              color: feedback.ok ? "#166534" : "#7f1d1d",
            }}>
              {feedback.message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}>
              {feedback?.ok ? "Done" : "Cancel"}
            </button>
            {!feedback?.ok && (
              <button type="submit" disabled={saving || !title.trim()} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: saving ? MUTED : PRIMARY, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer",
              }}>
                {saving ? "Creating..." : "Create Course"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { actorId, loading: identityLoading } = useWentrexActorId();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnrollStaff, setShowEnrollStaff] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);

  const reload = useCallback(async () => {
    if (!actorId) { navigate("/login", { replace: true }); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await loadDashboard(actorId);
      if (!result) { navigate("/login", { replace: true }); return; }
      setData(result);
    } catch (err) {
      setError(err?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [actorId, navigate]);

  useEffect(() => {
    if (!identityLoading) reload();
  }, [identityLoading, reload]);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#b42318", marginBottom: 16 }}>{error}</p>
          <button onClick={reload} style={{ padding: "10px 24px", borderRadius: 10, border: `1px solid ${PRIMARY}`, background: PRIMARY, color: "#fff", cursor: "pointer" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { userEmail, realm, org, membership, stats, courses } = data;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar
        orgName={realm?.name ?? org?.name ?? "WENTREX"}
        subtitle={org?.name}
        userName={userEmail}
        role={membership?.role ?? "admin"}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Header */}
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>
            Administration Dashboard
          </span>
          <h1 style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            {org?.name ?? "Your Organization"}
          </h1>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          <StatCard label="Courses" value={stats.totalCourses} sub={`${stats.publishedCourses} published, ${stats.draftCourses} draft`} />
          <StatCard label="Staff Members" value={stats.totalMembers} />
          <StatCard label="Students" value={stats.totalStudents} />
          <StatCard label="Teachers" value={stats.totalTeachers} />
          <StatCard label="Terms" value={stats.totalTerms} />
        </div>

        {/* Quick Actions */}
        <section>
          <SectionHeader title="Quick Actions" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <QuickAction label="Setup Guide" sub="Step-by-step school setup handbook" onClick={() => navigate("/setup-guide")} />
            <QuickAction label="Create Course" sub="Set up a new course for this organization" onClick={() => setShowCreateCourse(true)} />
            <QuickAction label="Enroll Staff" sub="Add a teacher or staff member" onClick={() => setShowEnrollStaff(true)} />
            <QuickAction label="Register Student" sub="Create a school-managed student account" onClick={() => navigate("/register-student")} />
            <QuickAction label="Link Parent" sub="Link a parent to a student" onClick={() => navigate("/link-parent")} />
            <QuickAction label="Messages" sub="Open inbox and conversations" onClick={() => navigate("/messages")} />
          </div>
        </section>

        {/* Spaces */}
        <section>
          <SectionHeader title="Spaces" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <ModuleCard
              title="Courses"
              count={stats.totalCourses}
              sub={`${stats.publishedCourses} published, ${stats.draftCourses} draft`}
              actionLabel="View Courses"
              onOpen={() => navigate("/courses")}
            />
            <ModuleCard
              title="Staff & Teachers"
              count={stats.totalMembers}
              sub={`${stats.totalTeachers} teacher${stats.totalTeachers !== 1 ? "s" : ""}`}
              actionLabel="View Staff"
              onOpen={() => navigate("/staff")}
            />
            <ModuleCard
              title="Students"
              count={stats.totalStudents}
              sub="School-managed accounts"
              actionLabel="View Students"
              onOpen={() => navigate("/students")}
            />
            <ModuleCard
              title="Parents"
              count={stats.totalParents}
              sub="Linked guardians"
              actionLabel="View Parents"
              onOpen={() => navigate("/parents")}
            />
          </div>
        </section>

        {/* Courses Table */}
        <section>
          <SectionHeader title="Courses" count={stats.totalCourses} />
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {courses.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 14 }}>
                No courses yet. Create your first course to get started.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                    <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Title</th>
                    <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Code</th>
                    <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                      onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                    >
                      <td style={{ padding: "14px 20px", fontWeight: 500, color: "#0f172a" }}>{c.title}</td>
                      <td style={{ padding: "14px 20px", color: MUTED }}>{c.code ?? "—"}</td>
                      <td style={{ padding: "14px 20px" }}><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>

      {showEnrollStaff && org?.id && (
        <EnrollStaffModal
          organizationId={org.id}
          onClose={() => setShowEnrollStaff(false)}
          onSuccess={reload}
        />
      )}

      {showCreateCourse && org?.id && realm?.id && (
        <CreateCourseModal
          organizationId={org.id}
          realmId={realm.id}
          actorId={actor.id}
          onClose={() => setShowCreateCourse(false)}
          onSuccess={reload}
        />
      )}

    </div>
  );
}
