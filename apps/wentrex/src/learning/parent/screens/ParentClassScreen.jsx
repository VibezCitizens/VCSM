import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import TopBar from "@/learning/components/TopBar";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

const TABS = ["Overview", "Assignments", "Grades"];

function StatusBadge({ status }) {
  const c = { submitted: { bg: "#fef9c3", color: "#854d0e" }, graded: { bg: "#dcfce7", color: "#166534" }, published: { bg: "#dcfce7", color: "#166534" }, draft: { bg: "#f1f5f9", color: MUTED }, late: { bg: "#fef2f2", color: "#7f1d1d" }, missing: { bg: "#fef2f2", color: "#7f1d1d" } }[status] ?? { bg: "#f1f5f9", color: MUTED };
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{status ?? "—"}</span>;
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 24px" }}>
      {title && <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h3>}
      {children}
    </div>
  );
}

export default function ParentClassScreen() {
  const navigate = useNavigate();
  const { studentActorId, courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [course, setCourse] = useState(null);
  const [student, setStudent] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);

  const load = useCallback(async () => {
    // Course
    const { data: courseRow } = await supabase.schema("learning").from("courses")
      .select("id, title, code, description, status, created_at")
      .eq("id", courseId).maybeSingle();
    setCourse(courseRow);

    // Student profile
    const { data: profile } = await supabase.schema("learning").from("actor_profiles")
      .select("actor_id, full_name, student_id, grade_level, section")
      .eq("actor_id", studentActorId).maybeSingle();
    setStudent(profile);

    // Teacher for this course
    const { data: teacherMem } = await supabase.schema("learning").from("course_memberships")
      .select("actor_id").eq("course_id", courseId).eq("role", "teacher").eq("status", "active").limit(1).maybeSingle();

    if (teacherMem?.actor_id) {
      const { data: teacherProfile } = await supabase.schema("learning").from("actor_profiles")
        .select("full_name, display_name").eq("actor_id", teacherMem.actor_id).maybeSingle();
      setTeacher(teacherProfile ? { full_name: teacherProfile.full_name ?? teacherProfile.display_name ?? "Teacher" } : null);
    }

    // Assignments — published only
    const { data: assignRows } = await supabase.schema("learning").from("assignments")
      .select("id, title, points_possible, due_at, is_published, submission_type")
      .eq("course_id", courseId).eq("is_published", true)
      .order("due_at", { ascending: false, nullsFirst: false });
    setAssignments(assignRows ?? []);

    // Submissions for this student
    const { data: subRows } = await supabase.schema("learning").from("submissions")
      .select("id, assignment_id, status, submitted_at, attempt_no")
      .eq("course_id", courseId).eq("actor_id", studentActorId)
      .order("submitted_at", { ascending: false });
    setSubmissions(subRows ?? []);

    // Grades
    const subIds = (subRows ?? []).map(s => s.id);
    if (subIds.length > 0) {
      const { data: gradeRows } = await supabase.schema("learning").from("grades")
        .select("id, submission_id, score, feedback_text, graded_at")
        .in("submission_id", subIds);
      setGrades(gradeRows ?? []);
    }

    // Modules + lessons
    const { data: modRows } = await supabase.schema("learning").from("modules")
      .select("id, title, sort_order, is_published")
      .eq("course_id", courseId).order("sort_order");
    setModules(modRows ?? []);

    const { data: lessonRows } = await supabase.schema("learning").from("lessons")
      .select("id, module_id, title, lesson_type, sort_order, is_published")
      .eq("course_id", courseId).order("sort_order");
    setLessons(lessonRows ?? []);

    setLoading(false);
  }, [courseId, studentActorId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading class...</div>;

  const gradeMap = new Map(grades.map(g => [g.submission_id, g]));
  const submissionMap = new Map(submissions.map(s => [s.assignment_id, s]));

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar
        orgName={course?.title ?? "Class"}
        subtitle={student?.full_name ?? ""}
        backTo={`/parent/student/${studentActorId}`}
        backLabel="Back"
      />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 24px 64px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Course header */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{course?.title}</h2>
              {course?.code && <div style={{ fontSize: 14, color: MUTED, marginBottom: 8 }}>{course.code}</div>}
              {course?.description && <p style={{ margin: "0 0 8px", fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{course.description}</p>}
            </div>
            <StatusBadge status={course?.status} />
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 13, color: MUTED, marginTop: 8 }}>
            {teacher && <span>Teacher: <strong style={{ color: "#0f172a" }}>{teacher.full_name}</strong></span>}
            <span>Student: <strong style={{ color: "#0f172a" }}>{student?.full_name}</strong></span>
            {student?.student_id && <span>ID: <strong style={{ fontFamily: "monospace", color: PRIMARY }}>{student.student_id}</strong></span>}
          </div>
        </Card>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${BORDER}` }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "12px 20px", border: "none",
              borderBottom: tab === t ? `2px solid ${PRIMARY}` : "2px solid transparent",
              background: "transparent", color: tab === t ? PRIMARY : MUTED,
              fontWeight: tab === t ? 700 : 500, fontSize: 14, cursor: "pointer", marginBottom: -2,
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "Overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <Card><div style={{ fontSize: 12, color: MUTED }}>Assignments</div><strong style={{ fontSize: 28 }}>{assignments.length}</strong></Card>
              <Card><div style={{ fontSize: 12, color: MUTED }}>Submitted</div><strong style={{ fontSize: 28 }}>{submissions.length}</strong></Card>
              <Card><div style={{ fontSize: 12, color: MUTED }}>Graded</div><strong style={{ fontSize: 28, color: "#166534" }}>{grades.length}</strong></Card>
              <Card><div style={{ fontSize: 12, color: MUTED }}>Modules</div><strong style={{ fontSize: 28 }}>{modules.length}</strong></Card>
            </div>

            {/* Course content overview */}
            {modules.length > 0 && (
              <Card title={`Course Content (${modules.length} modules, ${lessons.length} lessons)`}>
                {modules.map(m => {
                  const modLessons = lessons.filter(l => l.module_id === m.id);
                  return (
                    <div key={m.id} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{m.title}</div>
                      {modLessons.length === 0 ? (
                        <div style={{ fontSize: 13, color: MUTED, paddingLeft: 12 }}>No lessons</div>
                      ) : (
                        modLessons.sort((a, b) => a.sort_order - b.sort_order).map(l => (
                          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0 4px 12px", fontSize: 13 }}>
                            <span style={{ color: MUTED, width: 20, fontSize: 11, fontFamily: "monospace" }}>{l.sort_order}</span>
                            <span style={{ color: "#0f172a" }}>{l.title}</span>
                            <span style={{ color: MUTED, fontSize: 11 }}>{l.lesson_type}</span>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </Card>
            )}
          </div>
        )}

        {/* Assignments */}
        {tab === "Assignments" && (
          <Card>
            {assignments.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: MUTED }}>No assignments yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: MUTED }}>Assignment</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: MUTED }}>Points</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: MUTED }}>Due</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: MUTED }}>Status</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: MUTED }}>Score</th>
                </tr></thead>
                <tbody>{assignments.map(a => {
                  const sub = submissionMap.get(a.id);
                  const grade = sub ? gradeMap.get(sub.id) : null;
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "12px", fontWeight: 500, color: "#0f172a" }}>{a.title}</td>
                      <td style={{ padding: "12px", color: MUTED }}>{a.points_possible}</td>
                      <td style={{ padding: "12px", color: MUTED }}>{a.due_at ? new Date(a.due_at).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "12px" }}>{sub ? <StatusBadge status={grade ? "graded" : sub.status} /> : <span style={{ color: MUTED }}>Not submitted</span>}</td>
                      <td style={{ padding: "12px", fontWeight: 600, color: grade ? "#166534" : MUTED }}>{grade ? `${grade.score}/${a.points_possible}` : "—"}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </Card>
        )}

        {/* Grades */}
        {tab === "Grades" && (
          <Card>
            {grades.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: MUTED }}>No grades yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: MUTED }}>Assignment</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: MUTED }}>Score</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: MUTED }}>Feedback</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: MUTED }}>Graded</th>
                </tr></thead>
                <tbody>{grades.map(g => {
                  const sub = submissions.find(s => s.id === g.submission_id);
                  const assignment = sub ? assignments.find(a => a.id === sub.assignment_id) : null;
                  return (
                    <tr key={g.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "12px", fontWeight: 500, color: "#0f172a" }}>{assignment?.title ?? "—"}</td>
                      <td style={{ padding: "12px", fontWeight: 600, color: "#166534" }}>{g.score ?? "—"}{assignment ? `/${assignment.points_possible}` : ""}</td>
                      <td style={{ padding: "12px", color: MUTED, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.feedback_text || "—"}</td>
                      <td style={{ padding: "12px", color: MUTED }}>{g.graded_at ? new Date(g.graded_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
