import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import TopBar from "@/learning/components/TopBar";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function RoleBadge({ role }) {
  const c = { teacher: { bg: "#dcfce7", color: "#166534" }, student: { bg: "#e0f2fe", color: "#0369a1" }, parent: { bg: "#fce7f3", color: "#9d174d" } }[role] ?? { bg: "#f1f5f9", color: MUTED };
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{role}</span>;
}

export default function CourseDetailScreen() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [actorId, setActorId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [profileMap, setProfileMap] = useState(new Map());

  // Assign modals
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const { data: actor } = await supabase.schema("learning").from("actors")
      .select("id, organization_id").eq("user_id", user.id).eq("is_active", true).maybeSingle();
    if (!actor) { navigate("/dashboard", { replace: true }); return; }
    setActorId(actor.id);

    const { data: courseRow } = await supabase.schema("learning").from("courses")
      .select("id, title, code, status, description, organization_id")
      .eq("id", courseId).maybeSingle();
    setCourse(courseRow);

    if (courseRow?.organization_id) {
      const { data: org } = await supabase.schema("learning").from("organizations")
        .select("name").eq("id", courseRow.organization_id).maybeSingle();
      setOrgName(org?.name ?? "");
    }

    // Load roster
    const { data: members } = await supabase.schema("learning").from("course_memberships")
      .select("id, actor_id, role, status, created_at")
      .eq("course_id", courseId).eq("status", "active")
      .order("role").order("created_at");

    const actorIds = (members ?? []).map(m => m.actor_id);
    const pm = new Map();
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase.schema("learning").from("actor_profiles")
        .select("actor_id, full_name, student_id, grade_level, section")
        .in("actor_id", actorIds);
      for (const p of profiles ?? []) pm.set(p.actor_id, p);

      // Fallback to public.profiles for staff without actor_profiles
      const missing = actorIds.filter(id => !pm.has(id));
      if (missing.length > 0) {
        const { data: actors } = await supabase.schema("learning").from("actors")
          .select("id, user_id").in("id", missing);
        const userIds = (actors ?? []).map(a => a.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: pubProfiles } = await supabase.from("profiles")
            .select("id, display_name, email").in("id", userIds);
          const userToActor = new Map((actors ?? []).map(a => [a.user_id, a.id]));
          for (const p of pubProfiles ?? []) {
            const aid = userToActor.get(p.id);
            if (aid && !pm.has(aid)) pm.set(aid, { actor_id: aid, full_name: p.display_name ?? p.email });
          }
        }
      }
    }
    setProfileMap(pm);
    setRoster(members ?? []);
    setLoading(false);
  }, [navigate, courseId]);

  useEffect(() => { load(); }, [load]);

  // Load available teachers (org members with teacher role not already in course)
  async function loadAvailableTeachers() {
    if (!course) return;
    const { data: orgMembers } = await supabase.schema("learning").from("organization_memberships")
      .select("actor_id, role").eq("organization_id", course.organization_id)
      .eq("status", "active").eq("role", "teacher");

    const existingTeacherIds = new Set(roster.filter(r => r.role === "teacher").map(r => r.actor_id));
    const available = (orgMembers ?? []).filter(m => !existingTeacherIds.has(m.actor_id));

    // Get names
    const ids = available.map(m => m.actor_id);
    if (ids.length > 0) {
      const { data: profiles } = await supabase.schema("learning").from("actor_profiles")
        .select("actor_id, full_name").in("actor_id", ids);
      const nameMap = new Map((profiles ?? []).map(p => [p.actor_id, p.full_name]));

      // Fallback
      const missing = ids.filter(id => !nameMap.has(id));
      if (missing.length > 0) {
        const { data: actors } = await supabase.schema("learning").from("actors")
          .select("id, user_id").in("id", missing);
        const uids = (actors ?? []).map(a => a.user_id).filter(Boolean);
        if (uids.length > 0) {
          const { data: pub } = await supabase.from("profiles").select("id, display_name, email").in("id", uids);
          const u2a = new Map((actors ?? []).map(a => [a.user_id, a.id]));
          for (const p of pub ?? []) {
            const aid = u2a.get(p.id);
            if (aid) nameMap.set(aid, p.display_name ?? p.email);
          }
        }
      }

      setAvailableTeachers(available.map(m => ({ ...m, name: nameMap.get(m.actor_id) ?? m.actor_id.slice(0, 8) })));
    } else {
      setAvailableTeachers([]);
    }
    setSelectedIds(new Set());
    setShowAssignTeacher(true);
  }

  // Load available students (school-managed, not already in course)
  async function loadAvailableStudents() {
    if (!course) return;
    const { data: identities } = await supabase.schema("learning").from("actor_identities")
      .select("actor_id").eq("organization_id", course.organization_id).eq("is_school_managed", true);

    const existingStudentIds = new Set(roster.filter(r => r.role === "student").map(r => r.actor_id));
    const available = (identities ?? []).filter(i => !existingStudentIds.has(i.actor_id));

    const ids = available.map(i => i.actor_id);
    if (ids.length > 0) {
      const { data: profiles } = await supabase.schema("learning").from("actor_profiles")
        .select("actor_id, full_name, student_id, grade_level").in("actor_id", ids);
      const pMap = new Map((profiles ?? []).map(p => [p.actor_id, p]));
      setAvailableStudents(available.map(i => ({ actor_id: i.actor_id, profile: pMap.get(i.actor_id) })));
    } else {
      setAvailableStudents([]);
    }
    setSelectedIds(new Set());
    setShowAddStudents(true);
  }

  async function assignTeacher(teacherActorId) {
    setSaving(true);
    await supabase.schema("learning").from("course_memberships").upsert({
      course_id: courseId,
      actor_id: teacherActorId,
      role: "teacher",
      status: "active",
      created_by_actor_id: actorId,
      organization_id: course?.organization_id,
    }, { onConflict: "course_id,actor_id,role", ignoreDuplicates: true });
    setSaving(false);
    setShowAssignTeacher(false);
    await load();
  }

  async function addStudents() {
    if (selectedIds.size === 0) return;
    setSaving(true);
    const rows = [...selectedIds].map(sid => ({
      course_id: courseId,
      actor_id: sid,
      role: "student",
      status: "active",
      created_by_actor_id: actorId,
      organization_id: course?.organization_id,
    }));
    await supabase.schema("learning").from("course_memberships").upsert(rows, {
      onConflict: "course_id,actor_id,role", ignoreDuplicates: true,
    });
    setSaving(false);
    setShowAddStudents(false);
    setSelectedIds(new Set());
    await load();
  }

  async function removeMember(membershipId) {
    await supabase.schema("learning").from("course_memberships")
      .update({ status: "removed" }).eq("id", membershipId);
    await load();
  }

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  const teachers = roster.filter(r => r.role === "teacher");
  const students = roster.filter(r => r.role === "student");
  const others = roster.filter(r => r.role !== "teacher" && r.role !== "student");

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName={orgName} subtitle={course?.title ?? "Course"} backTo="/courses" backLabel="Courses" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 64px", display: "flex", flexDirection: "column", gap: 24 }}>

        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Course Roster</span>
          <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{course?.title}</h1>
          {course?.code && <p style={{ margin: "4px 0 0", fontSize: 14, color: MUTED }}>{course.code}</p>}
        </div>

        {/* Teachers */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Teachers ({teachers.length})</h2>
            <button onClick={loadAvailableTeachers} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + Assign Teacher
            </button>
          </div>
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {teachers.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: MUTED }}>No teachers assigned.</div>
            ) : teachers.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 500, color: "#0f172a" }}>{profileMap.get(m.actor_id)?.full_name ?? m.actor_id.slice(0, 8)}</span>
                  <RoleBadge role="teacher" />
                </div>
                <button onClick={() => removeMember(m.id)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid #fecaca`, background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer" }}>Remove</button>
              </div>
            ))}
          </div>
        </section>

        {/* Students */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Students ({students.length})</h2>
            <button onClick={loadAvailableStudents} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + Add Students
            </button>
          </div>
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {students.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: MUTED }}>No students enrolled.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>ID</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Name</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Grade</th>
                  <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, color: MUTED }}></th>
                </tr></thead>
                <tbody>{students.map(m => {
                  const p = profileMap.get(m.actor_id);
                  return (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 600, color: PRIMARY }}>{p?.student_id ?? "—"}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>{p?.full_name ?? m.actor_id.slice(0, 8)}</td>
                      <td style={{ padding: "12px 16px", color: MUTED }}>{p?.grade_level ?? "—"}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button onClick={() => removeMember(m.id)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid #fecaca`, background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer" }}>Remove</button>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        </section>

        {/* Assign Teacher Modal — select then save */}
        {showAssignTeacher && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget) setShowAssignTeacher(false); }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Assign Teacher</h3>
                <button onClick={() => setShowAssignTeacher(false)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20 }}>✕</button>
              </div>
              {availableTeachers.length === 0 ? (
                <div style={{ color: MUTED, fontSize: 14 }}>No available teachers to assign.</div>
              ) : (
                <>
                  <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                    {availableTeachers.map(t => {
                      const isSelected = selectedIds.has(t.actor_id);
                      return (
                        <label key={t.actor_id} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                          borderBottom: `1px solid ${BORDER}`, cursor: "pointer", fontSize: 14,
                          background: isSelected ? "#eff6ff" : "#fff",
                        }}>
                          <input type="checkbox" checked={isSelected}
                            onChange={() => setSelectedIds(prev => {
                              const next = new Set(prev);
                              if (next.has(t.actor_id)) next.delete(t.actor_id); else next.add(t.actor_id);
                              return next;
                            })} style={{ width: 16, height: 16 }} />
                          <span style={{ fontWeight: 500, color: "#0f172a" }}>{t.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => setShowAssignTeacher(false)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                    <button
                      onClick={async () => {
                        setSaving(true);
                        for (const tid of selectedIds) await assignTeacher(tid);
                        setSelectedIds(new Set());
                        setSaving(false);
                      }}
                      disabled={saving || selectedIds.size === 0}
                      style={{
                        padding: "8px 18px", borderRadius: 8, border: "none",
                        background: selectedIds.size === 0 ? MUTED : PRIMARY, color: "#fff",
                        fontSize: 13, fontWeight: 600, cursor: selectedIds.size === 0 ? "default" : "pointer",
                      }}>
                      {saving ? "Saving..." : `Save (${selectedIds.size})`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Add Students Modal */}
        {showAddStudents && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget) setShowAddStudents(false); }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Students ({selectedIds.size} selected)</h3>
                <button onClick={() => setShowAddStudents(false)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20 }}>✕</button>
              </div>
              {availableStudents.length === 0 ? (
                <div style={{ color: MUTED, fontSize: 14 }}>No available students to add.</div>
              ) : (
                <>
                  <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                    {availableStudents.map(s => (
                      <label key={s.actor_id} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        borderBottom: `1px solid ${BORDER}`, cursor: "pointer", fontSize: 14,
                        background: selectedIds.has(s.actor_id) ? "#eff6ff" : "#fff",
                      }}>
                        <input type="checkbox" checked={selectedIds.has(s.actor_id)}
                          onChange={() => setSelectedIds(prev => {
                            const next = new Set(prev);
                            if (next.has(s.actor_id)) next.delete(s.actor_id); else next.add(s.actor_id);
                            return next;
                          })} style={{ width: 16, height: 16 }} />
                        <span style={{ fontFamily: "monospace", fontWeight: 600, color: PRIMARY, minWidth: 65 }}>{s.profile?.student_id ?? "—"}</span>
                        <span style={{ fontWeight: 500, color: "#0f172a" }}>{s.profile?.full_name ?? "—"}</span>
                        {s.profile?.grade_level && <span style={{ fontSize: 12, color: MUTED }}>{s.profile.grade_level}</span>}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => setShowAddStudents(false)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                    <button onClick={addStudents} disabled={saving || selectedIds.size === 0}
                      style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: selectedIds.size === 0 ? MUTED : PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {saving ? "Adding..." : `Add ${selectedIds.size} Student${selectedIds.size !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
