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
  const c = { published: { bg: "#dcfce7", color: "#166534" }, active: { bg: "#dcfce7", color: "#166534" }, draft: { bg: "#fef9c3", color: "#854d0e" }, archived: { bg: "#f1f5f9", color: MUTED } }[status] ?? { bg: "#f1f5f9", color: MUTED };
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{status ?? "—"}</span>;
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>{label}</span>
      <strong style={{ fontSize: 32, lineHeight: 1.1, color: accent ?? "#0f172a" }}>{value}</strong>
      {sub && <span style={{ fontSize: 12, color: MUTED }}>{sub}</span>}
    </div>
  );
}

function QuickAction({ label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: "16px 20px", textAlign: "left", cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 4,
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{label}</span>
      <span style={{ fontSize: 12, color: MUTED }}>{sub}</span>
    </button>
  );
}

export default function TeacherDashboardScreen() {
  const navigate = useNavigate();
  const { actorId, organizationId, loading: identityLoading } = useWentrexActorId();
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [userName, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [courses, setCourses] = useState([]);
  const [courseStats, setCourseStats] = useState({});
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, pendingSubmissions: 0, gradedToday: 0 });

  const load = useCallback(async () => {
    if (!actorId) { navigate("/login", { replace: true }); return; }

    // Display email — cached session read, no network call
    const { data: { session } } = await supabase.auth.getSession();
    const sessionEmail = session?.user?.email ?? "";
    const sessionUserId = session?.user?.id ?? null;
    setUserName(sessionEmail);

    if (organizationId) {
      const { data: org } = await supabase.schema("learning").from("organizations")
        .select("name").eq("id", organizationId).maybeSingle();
      setOrgName(org?.name ?? "");
    }

    // Get teacher name
    const { data: profile } = await supabase.schema("learning").from("actor_profiles")
      .select("full_name, display_name, first_name").eq("actor_id", actorId).maybeSingle();
    if (profile?.full_name || profile?.display_name || profile?.first_name) {
      setDisplayName(profile.display_name ?? profile.full_name ?? profile.first_name);
    } else {
      // Fallback to public.profiles
      const { data: pub } = await supabase.from("profiles")
        .select("display_name, username, email").eq("id", sessionUserId).maybeSingle();
      setDisplayName(pub?.display_name ?? pub?.username ?? sessionEmail.split("@")[0] ?? "");
    }

    // Get courses
    const { data: memberships } = await supabase.schema("learning").from("course_memberships")
      .select("course_id, role").eq("actor_id", actorId).eq("status", "active")
      .in("role", ["teacher", "instructor", "ta", "grader"]);

    const courseIds = (memberships ?? []).map(m => m.course_id);

    let courseRows = [];
    if (courseIds.length > 0) {
      const { data } = await supabase.schema("learning").from("courses")
        .select("id, title, code, slug, status, created_at").in("id", courseIds).order("title");
      courseRows = data ?? [];
    }

    setCourses(courseRows);
    const cIds = courseRows.map(c => c.id);

    // Per-course stats + aggregate
    let totalStudents = 0;
    let totalPending = 0;
    const perCourse = {};

    if (cIds.length > 0) {
      const { data: studentRows } = await supabase.schema("learning").from("course_memberships")
        .select("course_id, actor_id")
        .in("course_id", cIds).eq("role", "student").eq("status", "active");

      for (const r of studentRows ?? []) {
        perCourse[r.course_id] = perCourse[r.course_id] ?? { students: 0, pending: 0 };
        perCourse[r.course_id].students++;
        totalStudents++;
      }

      // Pending submissions per course
      const { data: pendingRows } = await supabase.schema("learning").from("submissions")
        .select("course_id").in("course_id", cIds).in("status", ["submitted", "late"]);
      for (const r of pendingRows ?? []) {
        perCourse[r.course_id] = perCourse[r.course_id] ?? { students: 0, pending: 0 };
        perCourse[r.course_id].pending++;
        totalPending++;
      }

      // Graded today
      const today = new Date().toISOString().split("T")[0];
      const { count: gradedCount } = await supabase.schema("learning").from("grades")
        .select("id", { count: "exact", head: true })
        .in("submission_id",
          (await supabase.schema("learning").from("submissions").select("id").in("course_id", cIds)).data?.map(s => s.id) ?? []
        )
        .gte("graded_at", today);

      // Recent submissions
      const { data: recentRows } = await supabase.schema("learning").from("submissions")
        .select("id, course_id, actor_id, status, submitted_at, created_at")
        .in("course_id", cIds).in("status", ["submitted", "late"])
        .order("submitted_at", { ascending: false }).limit(5);

      setRecentSubmissions(recentRows ?? []);

      setStats({
        totalCourses: courseRows.length,
        totalStudents,
        pendingSubmissions: totalPending,
        gradedToday: gradedCount ?? 0,
      });
    } else {
      setStats({ totalCourses: 0, totalStudents: 0, pendingSubmissions: 0, gradedToday: 0 });
    }

    setCourseStats(perCourse);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { if (!identityLoading) load(); }, [identityLoading, load]);

  if (loading) {
    return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading teacher dashboard...</div>;
  }

  const hasAttention = stats.pendingSubmissions > 0;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName={orgName} subtitle="Teacher Workspace" userName={userName} role="teacher" />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Teacher Dashboard</span>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            Welcome back{displayName ? `, ${displayName}` : ""}
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 15, color: MUTED }}>
            {stats.pendingSubmissions > 0
              ? `You have ${stats.pendingSubmissions} submission${stats.pendingSubmissions !== 1 ? "s" : ""} waiting for review.`
              : "All caught up. No submissions pending review."
            }
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          <StatCard label="My Courses" value={stats.totalCourses} />
          <StatCard label="Students" value={stats.totalStudents} sub="Across all courses" />
          <StatCard label="Pending Reviews" value={stats.pendingSubmissions} accent={stats.pendingSubmissions > 0 ? "#dc2626" : undefined} sub="Awaiting grade" />
          <StatCard label="Graded Today" value={stats.gradedToday} sub="Submissions reviewed" />
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <QuickAction label="Review Submissions" sub="Grade pending student work" onClick={() => {
            const first = courses.find(c => (courseStats[c.id]?.pending ?? 0) > 0);
            if (first) navigate(`/teacher/course/${first.id}`);
          }} />
          <QuickAction label="View Students" sub="See all enrolled students" onClick={() => {
            if (courses[0]) navigate(`/teacher/course/${courses[0].id}`);
          }} />
          <QuickAction label="Messages" sub="Open inbox and conversations" onClick={() => navigate("/messages")} />
        </div>

        {/* Needs Attention */}
        {hasAttention && (
          <div style={{
            background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 12,
            padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#854d0e" }}>
                Needs Attention
              </span>
              <span style={{ fontSize: 14, color: "#92400e", marginLeft: 8 }}>
                {stats.pendingSubmissions} submission{stats.pendingSubmissions !== 1 ? "s" : ""} awaiting your review
              </span>
            </div>
            <button
              onClick={() => {
                const first = courses.find(c => (courseStats[c.id]?.pending ?? 0) > 0);
                if (first) navigate(`/teacher/course/${first.id}`);
              }}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: "#92400e", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Review Now
            </button>
          </div>
        )}

        {/* My Courses */}
        <section>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            My Courses
          </h2>

          {courses.length === 0 ? (
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 40, textAlign: "center", color: MUTED }}>
              You are not assigned to any courses yet. Contact your administrator.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {courses.map(c => {
                const cs = courseStats[c.id] ?? { students: 0, pending: 0 };
                return (
                  <div key={c.id} style={{
                    background: "#fff", border: `1px solid ${cs.pending > 0 ? "#fde68a" : BORDER}`, borderRadius: 14,
                    padding: 22, display: "flex", flexDirection: "column", gap: 10,
                    cursor: "pointer",
                  }}
                    onClick={() => navigate(`/teacher/course/${c.id}`)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = cs.pending > 0 ? "#fde68a" : BORDER; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{c.title}</h3>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.code && <span style={{ fontSize: 13, color: MUTED }}>{c.code}</span>}

                    {/* Per-course stats */}
                    <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                      <span style={{ color: MUTED }}>{cs.students} student{cs.students !== 1 ? "s" : ""}</span>
                      {cs.pending > 0 && (
                        <span style={{ color: "#dc2626", fontWeight: 600 }}>{cs.pending} pending</span>
                      )}
                    </div>

                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                      <span style={{ fontSize: 12, color: MUTED }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>Open →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            Recent Activity
          </h2>
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {recentSubmissions.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: MUTED, fontSize: 14 }}>
                No recent submissions to review.
              </div>
            ) : (
              <div>
                {recentSubmissions.map(s => {
                  const courseName = courses.find(c => c.id === s.course_id)?.title ?? "Course";
                  return (
                    <div key={s.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 20px", borderBottom: `1px solid ${BORDER}`,
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>
                          New submission in {courseName}
                        </span>
                        <span style={{ fontSize: 12, color: MUTED }}>
                          {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "Just now"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <StatusBadge status={s.status} />
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/teacher/course/${s.course_id}`); }}
                          style={{
                            padding: "5px 12px", borderRadius: 6, border: `1px solid ${BORDER}`,
                            background: "#fff", color: PRIMARY, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
