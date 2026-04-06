import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function StatusBadge({ status }) {
  const c = { published: { bg: "#dcfce7", color: "#166534" }, active: { bg: "#dcfce7", color: "#166534" }, draft: { bg: "#fef9c3", color: "#854d0e" }, archived: { bg: "#f1f5f9", color: MUTED } }[status] ?? { bg: "#f1f5f9", color: MUTED };
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{status ?? "—"}</span>;
}

export default function CoursesScreen() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }
    const { data: actor } = await supabase.schema("learning").from("actors").select("id").eq("user_id", user.id).eq("is_active", true).maybeSingle();
    if (!actor) { navigate("/dashboard", { replace: true }); return; }
    const { data: mem } = await supabase.schema("learning").from("organization_memberships").select("organization_id").eq("actor_id", actor.id).eq("status", "active").limit(1).maybeSingle();
    if (!mem) { navigate("/dashboard", { replace: true }); return; }
    const { data: org } = await supabase.schema("learning").from("organizations").select("id, name").eq("id", mem.organization_id).maybeSingle();
    setOrgName(org?.name ?? "");
    setOrgId(org?.id ?? null);
    const { data } = await supabase.schema("learning").from("courses").select("id, title, code, slug, status, visibility, created_at").eq("organization_id", org?.id).order("created_at", { ascending: false });
    const courseRows = data ?? [];

    // Fetch teacher assignments for all courses
    const courseIds = courseRows.map(c => c.id);
    if (courseIds.length > 0) {
      const { data: teacherMems } = await supabase.schema("learning").from("course_memberships")
        .select("course_id, actor_id").in("course_id", courseIds).eq("role", "teacher").eq("status", "active");

      const teacherActorIds = [...new Set((teacherMems ?? []).map(m => m.actor_id))];
      const profileMap = new Map();
      if (teacherActorIds.length > 0) {
        // Check actor_profiles first
        const { data: profiles } = await supabase.schema("learning").from("actor_profiles")
          .select("actor_id, full_name").in("actor_id", teacherActorIds);
        for (const p of profiles ?? []) if (p.full_name) profileMap.set(p.actor_id, p.full_name);

        // Fallback to public.profiles for any missing names
        const missing = teacherActorIds.filter(id => !profileMap.has(id));
        if (missing.length > 0) {
          const { data: actors } = await supabase.schema("learning").from("actors")
            .select("id, user_id").in("id", missing);
          const userIds = (actors ?? []).map(a => a.user_id).filter(Boolean);
          if (userIds.length > 0) {
            const { data: pubProfiles } = await supabase.from("profiles")
              .select("id, display_name").in("id", userIds);
            const userToName = new Map((pubProfiles ?? []).map(p => [p.id, p.display_name]));
            for (const a of actors ?? []) {
              if (!profileMap.has(a.id) && userToName.has(a.user_id)) {
                profileMap.set(a.id, userToName.get(a.user_id));
              }
            }
          }
        }
      }

      // Map course_id → teacher name(s)
      const courseTeacherMap = new Map();
      for (const m of teacherMems ?? []) {
        const name = profileMap.get(m.actor_id) ?? "Unknown";
        if (!courseTeacherMap.has(m.course_id)) courseTeacherMap.set(m.course_id, []);
        courseTeacherMap.get(m.course_id).push(name);
      }

      for (const c of courseRows) {
        c._teachers = courseTeacherMap.get(c.id) ?? [];
      }
    }

    setCourses(courseRows);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(courseId, currentStatus) {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    const update = { status: nextStatus, updated_at: new Date().toISOString() };
    if (nextStatus === "published") update.published_at = new Date().toISOString();

    setUpdating(courseId);
    await supabase.schema("learning").from("courses").update(update).eq("id", courseId);
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: nextStatus } : c));
    setUpdating(null);
  }

  async function archiveCourse(courseId) {
    setUpdating(courseId);
    await supabase.schema("learning").from("courses").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", courseId);
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: "archived" } : c));
    setUpdating(null);
  }

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 32px", background: "#fff", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: PRIMARY, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>L</div>
          <div><div style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>{orgName}</div><div style={{ fontSize: 12, color: MUTED }}>Courses</div></div>
        </div>
        <button onClick={() => navigate("/dashboard")} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer" }}>Dashboard</button>
      </nav>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div><span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Administration</span><h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Courses ({courses.length})</h1></div>
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          {courses.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: MUTED }}>No courses yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Title</th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Code</th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Teacher</th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Status</th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Created</th>
                <th style={{ textAlign: "right", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Actions</th>
              </tr></thead>
              <tbody>{courses.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
                  onClick={() => navigate(`/courses/${c.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }} onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                  <td style={{ padding: "14px 20px", fontWeight: 500, color: "#0f172a" }}>{c.title}</td>
                  <td style={{ padding: "14px 20px", color: MUTED }}>{c.code ?? "—"}</td>
                  <td style={{ padding: "14px 20px", color: c._teachers?.length ? "#0f172a" : MUTED, fontSize: 13 }}>
                    {c._teachers?.length ? c._teachers.join(", ") : "Not assigned"}
                  </td>
                  <td style={{ padding: "14px 20px" }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: "14px 20px", color: MUTED }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      {c.status !== "archived" && (
                        <button
                          onClick={() => toggleStatus(c.id, c.status)}
                          disabled={updating === c.id}
                          style={{
                            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: "none",
                            background: c.status === "published" ? "#fef9c3" : "#dcfce7",
                            color: c.status === "published" ? "#854d0e" : "#166534",
                          }}
                        >
                          {updating === c.id ? "..." : c.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                      )}
                      {c.status !== "archived" && (
                        <button
                          onClick={() => archiveCourse(c.id)}
                          disabled={updating === c.id}
                          style={{
                            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: `1px solid ${BORDER}`, background: "#fff", color: MUTED,
                          }}
                        >
                          Archive
                        </button>
                      )}
                      {c.status === "archived" && (
                        <button
                          onClick={() => toggleStatus(c.id, "archived")}
                          disabled={updating === c.id}
                          style={{
                            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: `1px solid ${BORDER}`, background: "#fff", color: PRIMARY,
                          }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
