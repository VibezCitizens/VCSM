import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import TopBar from "@/learning/components/TopBar";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

const TABS = ["Assignments", "Lessons", "Grades"];

function StatusBadge({ label, bg, color }) {
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: bg, color }}>{label}</span>;
}

export default function StudentCourseScreen() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { actorId, organizationId, loading: identityLoading } = useWentrexActorId();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Assignments");
  const [studentName, setStudentName] = useState("");
  const [orgName, setOrgName] = useState("");

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);

  const load = useCallback(async () => {
    if (!actorId) { navigate("/student-login", { replace: true }); return; }

    const { data: profile } = await supabase.schema("learning").from("actor_profiles")
      .select("full_name").eq("actor_id", actorId).maybeSingle();
    setStudentName(profile?.full_name ?? "Student");

    if (organizationId) {
      const { data: org } = await supabase.schema("learning").from("organizations")
        .select("name").eq("id", organizationId).maybeSingle();
      setOrgName(org?.name ?? "");
    }

    // Course
    const { data: courseRow } = await supabase.schema("learning").from("courses")
      .select("id, title, code, status, description").eq("id", courseId).maybeSingle();
    setCourse(courseRow);

    // Parallel fetches
    const [assignRes, subRes, modRes, lessonRes] = await Promise.all([
      supabase.schema("learning").from("assignments")
        .select("id, title, points_possible, due_at, is_published")
        .eq("course_id", courseId).eq("is_published", true)
        .order("due_at", { ascending: true }),
      supabase.schema("learning").from("submissions")
        .select("id, assignment_id, status, attempt_no, submitted_at")
        .eq("course_id", courseId).eq("actor_id", actorId)
        .order("submitted_at", { ascending: false }),
      supabase.schema("learning").from("modules")
        .select("id, title, description, sort_order, is_published")
        .eq("course_id", courseId).eq("is_published", true)
        .order("sort_order"),
      supabase.schema("learning").from("lessons")
        .select("id, module_id, title, lesson_type, sort_order, is_published")
        .eq("course_id", courseId).eq("is_published", true)
        .order("sort_order"),
    ]);

    setAssignments(assignRes.data ?? []);
    setSubmissions(subRes.data ?? []);
    setModules(modRes.data ?? []);
    setLessons(lessonRes.data ?? []);

    // Grades for this student's submissions
    const subIds = (subRes.data ?? []).map(s => s.id);
    if (subIds.length > 0) {
      const { data: gradeRows } = await supabase.schema("learning").from("grades")
        .select("id, submission_id, score, feedback_text, graded_at")
        .in("submission_id", subIds);
      setGrades(gradeRows ?? []);
    }

    setLoading(false);
  }, [actorId, organizationId, navigate, courseId]);

  useEffect(() => { if (!identityLoading) load(); }, [identityLoading, load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;
  if (!course) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Course not found</div>;

  const submissionMap = new Map();
  for (const s of submissions) {
    if (!submissionMap.has(s.assignment_id)) submissionMap.set(s.assignment_id, s);
  }
  const gradeMap = new Map(grades.map(g => [g.submission_id, g]));

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar
        orgName={orgName}
        subtitle="Student Portal"
        userName={studentName}
        role="student"
        onBack={() => navigate("/student")}
      />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div>
          <button onClick={() => navigate("/student")}
            style={{ background: "none", border: "none", color: PRIMARY, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}>
            ← Back to Dashboard
          </button>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{course.title}</h1>
          {course.code && <span style={{ fontSize: 14, color: MUTED }}>{course.code}</span>}
          {course.description && <p style={{ margin: "8px 0 0", fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{course.description}</p>}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${BORDER}` }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: "10px 20px", border: "none", background: "none",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                color: tab === t ? PRIMARY : MUTED,
                borderBottom: tab === t ? `2px solid ${PRIMARY}` : "2px solid transparent",
                marginBottom: -2,
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Assignments Tab */}
        {tab === "Assignments" && (
          <section>
            {assignments.length === 0 ? (
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, textAlign: "center", color: MUTED }}>
                No assignments yet.
              </div>
            ) : (
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
                {assignments.map(a => {
                  const sub = submissionMap.get(a.id);
                  const grade = sub ? gradeMap.get(sub.id) : null;
                  const isPastDue = a.due_at && new Date(a.due_at) < new Date();
                  return (
                    <div key={a.id} onClick={() => navigate(`/student/course/${courseId}/assignment/${a.id}`)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>{a.title}</span>
                        <span style={{ fontSize: 12, color: MUTED }}>
                          {a.points_possible} pts
                          {a.due_at && <> · Due {new Date(a.due_at).toLocaleDateString()}</>}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {grade ? (
                          <StatusBadge label={`${grade.score}/${a.points_possible}`} bg="#dcfce7" color="#166534" />
                        ) : sub ? (
                          <StatusBadge label="Submitted" bg="#dbeafe" color="#1e40af" />
                        ) : isPastDue ? (
                          <StatusBadge label="Missing" bg="#fef2f2" color="#991b1b" />
                        ) : (
                          <StatusBadge label="To Do" bg="#f1f5f9" color={MUTED} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Lessons Tab */}
        {tab === "Lessons" && (
          <section>
            {modules.length === 0 && lessons.length === 0 ? (
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, textAlign: "center", color: MUTED }}>
                No lessons available yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {modules.map(m => {
                  const moduleLessons = lessons.filter(l => l.module_id === m.id);
                  return (
                    <div key={m.id} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
                      <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: `1px solid ${BORDER}` }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{m.title}</h3>
                        {m.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>{m.description}</p>}
                      </div>
                      {moduleLessons.length === 0 ? (
                        <div style={{ padding: "12px 20px", color: MUTED, fontSize: 13 }}>No lessons in this module.</div>
                      ) : (
                        moduleLessons.map(l => (
                          <div key={l.id} style={{ padding: "10px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 14, color: "#0f172a" }}>{l.title}</span>
                            <span style={{ fontSize: 12, color: MUTED, textTransform: "capitalize" }}>{l.lesson_type ?? "lesson"}</span>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Grades Tab */}
        {tab === "Grades" && (
          <section>
            {assignments.length === 0 ? (
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, textAlign: "center", color: MUTED }}>
                No graded work yet.
              </div>
            ) : (
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 20px", background: "#f8fafc", borderBottom: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, color: MUTED }}>
                  <span>Assignment</span>
                  <span>Status</span>
                  <span>Score</span>
                  <span>Feedback</span>
                </div>
                {assignments.map(a => {
                  const sub = submissionMap.get(a.id);
                  const grade = sub ? gradeMap.get(sub.id) : null;
                  return (
                    <div key={a.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{a.title}</span>
                      <span>
                        {grade ? (
                          <StatusBadge label="Graded" bg="#dcfce7" color="#166534" />
                        ) : sub ? (
                          <StatusBadge label="Submitted" bg="#dbeafe" color="#1e40af" />
                        ) : (
                          <StatusBadge label="—" bg="#f1f5f9" color={MUTED} />
                        )}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: grade ? "#166534" : MUTED }}>
                        {grade ? `${grade.score}/${a.points_possible}` : "—"}
                      </span>
                      <span style={{ fontSize: 13, color: MUTED }}>
                        {grade?.feedback_text ? grade.feedback_text.slice(0, 40) + (grade.feedback_text.length > 40 ? "..." : "") : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
