import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import TopBar from "@/learning/components/TopBar";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function StatusBadge({ status }) {
  const c = { published: { bg: "#dcfce7", color: "#166534" }, active: { bg: "#dcfce7", color: "#166534" }, draft: { bg: "#fef9c3", color: "#854d0e" } }[status] ?? { bg: "#f1f5f9", color: MUTED };
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{status ?? "—"}</span>;
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 12, color: MUTED }}>{label}</span>
      <strong style={{ fontSize: 28, color: "#0f172a" }}>{value}</strong>
      {sub && <span style={{ fontSize: 12, color: MUTED }}>{sub}</span>}
    </div>
  );
}

export default function StudentDashboardScreen() {
  const navigate = useNavigate();
  const { actorId, organizationId, loading: identityLoading } = useWentrexActorId();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [courses, setCourses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);

  const load = useCallback(async () => {
    if (!actorId) { navigate("/student-login", { replace: true }); return; }

    // Profile
    const { data: profile } = await supabase.schema("learning").from("actor_profiles")
      .select("full_name, student_id, grade_level").eq("actor_id", actorId).maybeSingle();
    setStudentName(profile?.full_name ?? "Student");

    // Org
    if (organizationId) {
      const { data: org } = await supabase.schema("learning").from("organizations")
        .select("name").eq("id", organizationId).maybeSingle();
      setOrgName(org?.name ?? "");
    }

    // Courses
    const { data: memberships } = await supabase.schema("learning").from("course_memberships")
      .select("course_id").eq("actor_id", actorId).eq("role", "student").eq("status", "active");

    const courseIds = (memberships ?? []).map(m => m.course_id);

    if (courseIds.length > 0) {
      const { data: courseRows } = await supabase.schema("learning").from("courses")
        .select("id, title, code, status").in("id", courseIds).order("title");
      setCourses(courseRows ?? []);

      // Upcoming assignments
      const { data: assignments } = await supabase.schema("learning").from("assignments")
        .select("id, course_id, title, due_at, points_possible")
        .in("course_id", courseIds).eq("is_published", true)
        .gte("due_at", new Date().toISOString())
        .order("due_at", { ascending: true }).limit(5);
      setUpcomingAssignments(assignments ?? []);
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => { if (!identityLoading) load(); }, [identityLoading, load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  const courseMap = new Map(courses.map(c => [c.id, c]));

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName={orgName} subtitle="Student Portal" userName={studentName} role="student" />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Student Dashboard</span>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            Welcome, {studentName}
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <StatCard label="My Courses" value={courses.length} />
          <StatCard label="Upcoming Due" value={upcomingAssignments.length} sub="Assignments this week" />
          <div onClick={() => navigate("/messages")}
            style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 22px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}>
            <span style={{ fontSize: 12, color: MUTED }}>Messages</span>
            <strong style={{ fontSize: 16, color: PRIMARY }}>Open Inbox →</strong>
          </div>
        </div>

        {/* My Courses */}
        <section>
          <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>My Courses</h2>
          {courses.length === 0 ? (
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📚</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>No courses yet</div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                You are not enrolled in any courses yet.<br />
                Your school administrator must enroll you in a class before your dashboard becomes available.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              {courses.map(c => (
                <div key={c.id} style={{
                  background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
                  padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
                }}
                  onClick={() => navigate(`/student/course/${c.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{c.title}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.code && <span style={{ fontSize: 13, color: MUTED }}>{c.code}</span>}
                  <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY, marginTop: "auto" }}>Open →</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Assignments */}
        {upcomingAssignments.length > 0 && (
          <section>
            <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Upcoming Assignments</h2>
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              {upcomingAssignments.map(a => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: MUTED }}>{courseMap.get(a.course_id)?.title ?? ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
                      Due {a.due_at ? new Date(a.due_at).toLocaleDateString() : "—"}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED }}>{a.points_possible} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
