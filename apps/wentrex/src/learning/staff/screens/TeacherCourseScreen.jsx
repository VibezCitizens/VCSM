import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";
import TopBar from "@/learning/components/TopBar";
import OverviewTab from "./tabs/OverviewTab";
import StudentsTab from "./tabs/StudentsTab";
import AssignmentsTab from "./tabs/AssignmentsTab";
import SubmissionsTab from "./tabs/SubmissionsTab";
import GradesTab from "./tabs/GradesTab";
import LessonsTab from "./tabs/LessonsTab";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

const TABS = ["Overview", "Students", "Assignments", "Submissions", "Grades", "Lessons"];

export default function TeacherCourseScreen() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { actorId, loading: identityLoading } = useWentrexActorId();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");

  // Data
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [profileMap, setProfileMap] = useState(new Map());

  const load = useCallback(async () => {
    if (!actorId) { navigate("/login", { replace: true }); return; }

    // Course
    const { data: courseRow } = await supabase.schema("learning").from("courses")
      .select("id, title, code, status, description, organization_id, created_at")
      .eq("id", courseId).maybeSingle();
    setCourse(courseRow);

    // All queries in parallel
    const [studentsRes, assignmentsRes, submissionsRes, gradesRes, modulesRes, lessonsRes] = await Promise.all([
      supabase.schema("learning").from("course_memberships")
        .select("actor_id, role, status, created_at")
        .eq("course_id", courseId).eq("role", "student").eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase.schema("learning").from("assignments")
        .select("id, title, points_possible, submission_type, due_at, is_published, created_at")
        .eq("course_id", courseId).order("created_at", { ascending: false }),
      supabase.schema("learning").from("submissions")
        .select("id, assignment_id, actor_id, status, attempt_no, submitted_at, submitted_text, submitted_url, is_late, created_at")
        .eq("course_id", courseId).order("submitted_at", { ascending: false }),
      supabase.schema("learning").from("grades")
        .select("id, submission_id, actor_id, score, feedback_text, graded_at")
        .in("submission_id",
          (await supabase.schema("learning").from("submissions").select("id").eq("course_id", courseId)).data?.map(s => s.id) ?? []
        ).order("graded_at", { ascending: false }),
      supabase.schema("learning").from("modules")
        .select("id, title, description, sort_order, is_published")
        .eq("course_id", courseId).order("sort_order"),
      supabase.schema("learning").from("lessons")
        .select("id, module_id, title, lesson_type, sort_order, is_published")
        .eq("course_id", courseId).order("sort_order"),
    ]);

    const studentRows = studentsRes.data ?? [];
    setStudents(studentRows);
    setAssignments(assignmentsRes.data ?? []);
    setSubmissions(submissionsRes.data ?? []);
    setGrades(gradesRes.data ?? []);
    setModules(modulesRes.data ?? []);
    setLessons(lessonsRes.data ?? []);

    // Hydrate profiles for students + submission actors
    const actorIds = new Set(studentRows.map(s => s.actor_id));
    for (const s of submissionsRes.data ?? []) if (s.actor_id) actorIds.add(s.actor_id);
    for (const g of gradesRes.data ?? []) if (g.actor_id) actorIds.add(g.actor_id);

    const pm = new Map();
    if (actorIds.size > 0) {
      const { data: profiles } = await supabase.schema("learning").from("actor_profiles")
        .select("actor_id, full_name, first_name, last_name, student_id, grade_level, section")
        .in("actor_id", [...actorIds]);
      for (const p of profiles ?? []) pm.set(p.actor_id, p);
    }
    setProfileMap(pm);

    // Attach profiles to students
    setStudents(studentRows.map(s => ({ ...s, profile: pm.get(s.actor_id) ?? null })));

    setLoading(false);
  }, [actorId, navigate, courseId]);

  useEffect(() => { if (!identityLoading) load(); }, [identityLoading, load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading course...</div>;

  const pendingCount = submissions.filter(s => s.status === "submitted" || s.status === "late").length;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar
        orgName={course?.title ?? "Course"}
        subtitle={course?.code ?? ""}
        backTo="/teacher"
        backLabel="Dashboard"
      />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 24px 64px" }}>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 0, borderBottom: `2px solid ${BORDER}`, marginBottom: 24,
          overflowX: "auto",
        }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "12px 20px", border: "none",
              borderBottom: tab === t ? `2px solid ${PRIMARY}` : "2px solid transparent",
              background: "transparent",
              color: tab === t ? PRIMARY : MUTED,
              fontWeight: tab === t ? 700 : 500,
              fontSize: 14, cursor: "pointer",
              marginBottom: -2, whiteSpace: "nowrap",
            }}>
              {t}
              {t === "Submissions" && pendingCount > 0 && (
                <span style={{
                  marginLeft: 6, padding: "1px 7px", borderRadius: 999,
                  fontSize: 11, fontWeight: 700,
                  background: "#dc2626", color: "#fff",
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "Overview" && (
          <OverviewTab
            course={course}
            studentCount={students.length}
            pendingCount={pendingCount}
            recentSubmissions={submissions.filter(s => s.status === "submitted" || s.status === "late").slice(0, 5)}
            navigate={setTab}
          />
        )}
        {tab === "Students" && <StudentsTab students={students} />}
        {tab === "Assignments" && <AssignmentsTab assignments={assignments} courseId={courseId} actorId={actorId} onReload={load} />}
        {tab === "Submissions" && <SubmissionsTab submissions={submissions} profileMap={profileMap} assignments={assignments} actorId={actorId} onReload={load} />}
        {tab === "Grades" && <GradesTab grades={grades} profileMap={profileMap} submissions={submissions} assignments={assignments} />}
        {tab === "Lessons" && <LessonsTab modules={modules} lessons={lessons} />}
      </div>
    </div>
  );
}
