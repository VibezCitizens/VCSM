import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import TopBar from "@/learning/components/TopBar";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";
import SchoolAccountCard from "@/learning/components/SchoolAccountCard";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

const TABS = ["Overview", "Courses", "Assignments", "Grades", "Settings"];

function StatusBadge({ status }) {
  const c = { submitted: { bg: "#fef9c3", color: "#854d0e" }, graded: { bg: "#dcfce7", color: "#166534" }, draft: { bg: "#f1f5f9", color: MUTED }, late: { bg: "#fef2f2", color: "#7f1d1d" }, returned: { bg: "#e0f2fe", color: "#0369a1" }, missing: { bg: "#fef2f2", color: "#7f1d1d" } }[status] ?? { bg: "#f1f5f9", color: MUTED };
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{status ?? "—"}</span>;
}

export default function ParentStudentScreen() {
  const navigate = useNavigate();
  const { studentActorId } = useParams();
  const { actorId: parentActorId, loading: identityLoading } = useWentrexActorId();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [student, setStudent] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [parentProfile, setParentProfile] = useState(null);
  const [parentIdentity, setParentIdentity] = useState(null);
  const [parentLink, setParentLink] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);

  const load = useCallback(async () => {
    // Student profile (extended fields)
    const { data: profile } = await supabase.schema("learning").from("actor_profiles")
      .select("actor_id, full_name, first_name, middle_name, last_name, second_last_name, preferred_name, student_id, grade_level, section, sex, date_of_birth, guardian_phone, relationship_to_student, enrollment_status")
      .eq("actor_id", studentActorId).maybeSingle();
    setStudent(profile);

    // Identity (login info)
    const { data: identityRow } = await supabase.schema("learning").from("actor_identities")
      .select("actor_id, login_id, synthetic_email, parent_email, parent_name, is_school_managed, must_change_password")
      .eq("actor_id", studentActorId).maybeSingle();
    setIdentity(identityRow);

    // Parent link + parent profile/identity for current user
    if (parentActorId) {
      const [linkRes, parentProfileRes, parentIdentityRes] = await Promise.all([
        supabase.schema("learning").from("parent_student_links")
          .select("id, relationship, is_primary, created_at")
          .eq("parent_actor_id", parentActorId).eq("student_actor_id", studentActorId).maybeSingle(),
        supabase.schema("learning").from("actor_profiles")
          .select("actor_id, full_name, display_name, guardian_phone")
          .eq("actor_id", parentActorId).maybeSingle(),
        supabase.schema("learning").from("actor_identities")
          .select("actor_id, login_id, synthetic_email")
          .eq("actor_id", parentActorId).maybeSingle(),
      ]);
      setParentLink(linkRes.data);
      setParentProfile(parentProfileRes.data);
      setParentIdentity(parentIdentityRes.data);

      // [BUGSBUNNY] Dev-only probe — remove after root cause confirmed
      if (import.meta.env.DEV) {
        console.group('[BUGSBUNNY ParentStudentScreen] Guardian data trace');
        console.log('parentActorId:', parentActorId);
        console.log('studentActorId:', studentActorId);
        console.log('parentLink:', linkRes.data);
        console.log('parentProfile:', parentProfileRes.data);
        console.log('parentIdentity:', parentIdentityRes.data);
        console.log('studentIdentity:', identityRow);
        console.log('studentProfile:', profile);
        console.groupEnd();
      }
    }

    // Course enrollments
    const { data: memberships } = await supabase.schema("learning").from("course_memberships")
      .select("course_id").eq("actor_id", studentActorId).eq("role", "student").eq("status", "active");
    const courseIds = (memberships ?? []).map(m => m.course_id);

    if (courseIds.length > 0) {
      const { data: courseRows } = await supabase.schema("learning").from("courses")
        .select("id, title, code, status").in("id", courseIds).order("title");
      setCourses(courseRows ?? []);

      // Assignments across courses
      const { data: assignmentRows } = await supabase.schema("learning").from("assignments")
        .select("id, course_id, title, points_possible, due_at, is_published")
        .in("course_id", courseIds).eq("is_published", true).order("due_at", { ascending: false, nullsFirst: false });
      setAssignments(assignmentRows ?? []);

      // Submissions
      const { data: subRows } = await supabase.schema("learning").from("submissions")
        .select("id, assignment_id, course_id, status, submitted_at, attempt_no")
        .eq("actor_id", studentActorId).in("course_id", courseIds)
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
    }

    setLoading(false);
  }, [parentActorId, studentActorId]);

  useEffect(() => { if (!identityLoading) load(); }, [identityLoading, load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  const gradeMap = new Map(grades.map(g => [g.submission_id, g]));
  const courseMap = new Map(courses.map(c => [c.id, c]));

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar
        orgName={student?.full_name ?? "Student"}
        subtitle={student?.student_id ? `ID: ${student.student_id}` : ""}
        backTo="/parent"
        backLabel="Back"
      />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 64px" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${BORDER}`, marginBottom: 24 }}>
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
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700 }}>{student?.full_name}</h3>
              <div style={{ display: "flex", gap: 20, fontSize: 14, color: MUTED }}>
                {student?.student_id && <span>ID: <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>{student.student_id}</strong></span>}
                {student?.grade_level && <span>Grade: <strong style={{ color: "#0f172a" }}>{student.grade_level}</strong></span>}
                {student?.section && <span>Section: <strong style={{ color: "#0f172a" }}>{student.section}</strong></span>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: MUTED }}>Courses</div>
                <strong style={{ fontSize: 28, color: "#0f172a" }}>{courses.length}</strong>
              </div>
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: MUTED }}>Assignments</div>
                <strong style={{ fontSize: 28, color: "#0f172a" }}>{assignments.length}</strong>
              </div>
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: MUTED }}>Submitted</div>
                <strong style={{ fontSize: 28, color: "#0f172a" }}>{submissions.length}</strong>
              </div>
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: MUTED }}>Graded</div>
                <strong style={{ fontSize: 28, color: "#166534" }}>{grades.length}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Courses */}
        {tab === "Courses" && (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {courses.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: MUTED }}>Not enrolled in any courses.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Course</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Code</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Status</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}></th>
                </tr></thead>
                <tbody>{courses.map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
                    onClick={() => navigate(`/parent/student/${studentActorId}/course/${c.id}`)}
                    onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>{c.title}</td>
                    <td style={{ padding: "12px 16px", color: MUTED }}>{c.code ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: "12px 16px", color: PRIMARY, fontWeight: 600, fontSize: 13 }}>View →</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}

        {/* Assignments */}
        {tab === "Assignments" && (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {assignments.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: MUTED }}>No assignments yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Assignment</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Course</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Points</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Due</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Submitted</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Status</th>
                </tr></thead>
                <tbody>{assignments.map(a => {
                  const sub = submissions.find(s => s.assignment_id === a.id);
                  const grade = sub ? gradeMap.get(sub.id) : null;
                  const courseName = courseMap.get(a.course_id)?.title ?? "";
                  const status = grade ? "graded" : sub ? sub.status : "not submitted";
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>{a.title}</td>
                      <td style={{ padding: "12px 16px", color: MUTED, fontSize: 13 }}>{courseName}</td>
                      <td style={{ padding: "12px 16px", color: MUTED }}>{a.points_possible}</td>
                      <td style={{ padding: "12px 16px", color: MUTED }}>{a.due_at ? new Date(a.due_at).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "12px 16px", color: MUTED, fontSize: 13 }}>{sub?.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {grade ? (
                          <span style={{ fontWeight: 600, color: "#166534" }}>{grade.score}/{a.points_possible}</span>
                        ) : (
                          <StatusBadge status={status} />
                        )}
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        )}

        {/* Grades */}
        {tab === "Grades" && (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {grades.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: MUTED }}>No grades yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Assignment</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Score</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Feedback</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Graded</th>
                </tr></thead>
                <tbody>{grades.map(g => {
                  const sub = submissions.find(s => s.id === g.submission_id);
                  const assignment = sub ? assignments.find(a => a.id === sub.assignment_id) : null;
                  return (
                    <tr key={g.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>{assignment?.title ?? "—"}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#166534" }}>{g.score ?? "—"}{assignment ? `/${assignment.points_possible}` : ""}</td>
                      <td style={{ padding: "12px 16px", color: MUTED, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.feedback_text || "—"}</td>
                      <td style={{ padding: "12px 16px", color: MUTED }}>{g.graded_at ? new Date(g.graded_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        )}

        {/* Settings */}
        {tab === "Settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Student Profile */}
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Student Profile</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
                <div><span style={{ color: MUTED }}>Full Name</span><div style={{ fontWeight: 500, color: "#0f172a", marginTop: 2 }}>{student?.full_name ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Student ID</span><div style={{ fontWeight: 600, color: PRIMARY, fontFamily: "monospace", marginTop: 2 }}>{student?.student_id ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>First Name</span><div style={{ marginTop: 2 }}>{student?.first_name ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Middle Name</span><div style={{ marginTop: 2 }}>{student?.middle_name ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Last Name</span><div style={{ marginTop: 2 }}>{student?.last_name ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Second Last Name</span><div style={{ marginTop: 2 }}>{student?.second_last_name ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Preferred Name</span><div style={{ marginTop: 2 }}>{student?.preferred_name ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Sex</span><div style={{ marginTop: 2 }}>{student?.sex ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Date of Birth</span><div style={{ marginTop: 2 }}>{student?.date_of_birth ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Grade Level</span><div style={{ marginTop: 2 }}>{student?.grade_level ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Section</span><div style={{ marginTop: 2 }}>{student?.section ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Enrollment Status</span><div style={{ marginTop: 2 }}>{student?.enrollment_status ?? "active"}</div></div>
              </div>
            </div>

            {/* School Account — uses shared component with password reset */}
            <SchoolAccountCard
              identity={identity}
              actorId={studentActorId}
              studentName={student?.full_name}
              canResetPassword={false}
              canParentReset={true}
              onRefresh={load}
            />

            {/* Guardian Contact — reads from parent's own profile, not student's actor_identities */}
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Guardian Contact</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
                <div><span style={{ color: MUTED }}>Guardian Name</span><div style={{ marginTop: 2 }}>{parentProfile?.full_name ?? parentProfile?.display_name ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Guardian Email</span><div style={{ marginTop: 2 }}>{parentIdentity?.synthetic_email ?? parentIdentity?.login_id ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Guardian Phone</span><div style={{ marginTop: 2 }}>{parentProfile?.guardian_phone ?? student?.guardian_phone ?? "—"}</div></div>
                <div><span style={{ color: MUTED }}>Relationship</span><div style={{ marginTop: 2 }}>{parentLink?.relationship ?? student?.relationship_to_student ?? "—"}</div></div>
              </div>
            </div>

            {/* Parent Link Info */}
            {parentLink && (
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Your Link to This Student</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
                  <div><span style={{ color: MUTED }}>Relationship</span><div style={{ marginTop: 2 }}>{parentLink.relationship}</div></div>
                  <div><span style={{ color: MUTED }}>Primary Contact</span><div style={{ marginTop: 2, fontWeight: 600, color: parentLink.is_primary ? "#166534" : MUTED }}>{parentLink.is_primary ? "Yes" : "No"}</div></div>
                  <div><span style={{ color: MUTED }}>Linked Since</span><div style={{ marginTop: 2 }}>{parentLink.created_at ? new Date(parentLink.created_at).toLocaleDateString() : "—"}</div></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
