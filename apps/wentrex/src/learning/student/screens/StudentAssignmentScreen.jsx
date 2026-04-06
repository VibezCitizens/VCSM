import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { uploadToCloudflare } from "@/services/cloudflare/uploadToCloudflare";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";
import TopBar from "@/learning/components/TopBar";
import YouTubeEmbed from "@/learning/components/YouTubeEmbed";
import { isYouTubeUrl } from "@/learning/lib/youtubeUtils";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function StatusBadge({ label, bg, color }) {
  return <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: bg, color }}>{label}</span>;
}

export default function StudentAssignmentScreen() {
  const navigate = useNavigate();
  const { courseId, assignmentId } = useParams();
  const { actorId, organizationId, loading: identityLoading } = useWentrexActorId();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [orgName, setOrgName] = useState("");

  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [resources, setResources] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [grade, setGrade] = useState(null);

  // Submission form
  const [submittedText, setSubmittedText] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [submittedFile, setSubmittedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileRef = useRef(null);

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

    // Parallel: assignment, course, resources, submission
    const [assignRes, courseRes, resourceRes, subRes] = await Promise.all([
      supabase.schema("learning").from("assignments")
        .select("id, course_id, title, description, points_possible, due_at, available_from, available_until, submission_type, attempt_limit, allow_late_submissions, is_published, created_at")
        .eq("id", assignmentId).maybeSingle(),
      supabase.schema("learning").from("courses")
        .select("id, title, code").eq("id", courseId).maybeSingle(),
      supabase.schema("learning").from("assignment_resources")
        .select("id, assignment_id, resource_type, resource_url, title, sort_order, created_at")
        .eq("assignment_id", assignmentId).order("sort_order"),
      supabase.schema("learning").from("submissions")
        .select("id, assignment_id, course_id, attempt_no, status, submitted_text, submitted_url, submitted_at, is_late, created_at, updated_at, actor_id")
        .eq("assignment_id", assignmentId).eq("actor_id", actorId)
        .order("attempt_no", { ascending: false }).limit(1).maybeSingle(),
    ]);

    setAssignment(assignRes.data);
    setCourse(courseRes.data);
    setResources(resourceRes.data ?? []);
    setSubmission(subRes.data);

    // Grade
    if (subRes.data?.id) {
      const { data: gradeRow } = await supabase.schema("learning").from("grades")
        .select("id, submission_id, score, feedback_text, feedback_private, graded_at, created_at")
        .eq("submission_id", subRes.data.id).maybeSingle();
      setGrade(gradeRow);
    }

    setLoading(false);
  }, [actorId, organizationId, navigate, courseId, assignmentId]);

  useEffect(() => { if (!identityLoading) load(); }, [identityLoading, load]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!submittedText.trim() && !submittedUrl.trim() && !submittedFile) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    let fileUrl = null;

    // Upload file if provided
    if (submittedFile) {
      setUploading(true);
      const ext = submittedFile.name.split(".").pop() || "bin";
      const key = `submissions/${actorId}/${assignmentId}/${Date.now()}.${ext}`;
      const { url, error: uploadErr } = await uploadToCloudflare(submittedFile, key);
      setUploading(false);

      if (uploadErr || !url) {
        setSubmitError(uploadErr || "File upload failed.");
        setSubmitting(false);
        return;
      }
      fileUrl = url;
    }

    // Use file URL as submitted_url if no other URL was provided
    const finalUrl = submittedUrl.trim() || fileUrl || null;

    const { error } = await supabase.schema("learning").from("submissions").insert({
      assignment_id: assignmentId,
      course_id: courseId,
      actor_id: actorId,
      attempt_no: (submission?.attempt_no ?? 0) + 1,
      status: "submitted",
      submitted_text: submittedText.trim() || null,
      submitted_url: finalUrl,
      submitted_at: new Date().toISOString(),
      organization_id: assignment?.organization_id ?? null,
    });

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitSuccess(true);
    setSubmittedFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setSubmitting(false);
    load();
  }

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;
  if (!assignment) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Assignment not found</div>;

  const isPastDue = assignment.due_at && new Date(assignment.due_at) < new Date();
  const isLocked = assignment.lock_at && new Date(assignment.lock_at) < new Date();
  const canSubmit = !isLocked && (!isPastDue || assignment.allow_late_submissions);
  const hasSubmitted = Boolean(submission);

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName={orgName} subtitle="Student Portal" userName={studentName} role="student" />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Back */}
        <button onClick={() => navigate(`/student/course/${courseId}`)}
          style={{ background: "none", border: "none", color: PRIMARY, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, textAlign: "left" }}>
          ← Back to {course?.title ?? "Course"}
        </button>

        {/* Assignment Header */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{assignment.title}</h1>
              <span style={{ fontSize: 13, color: MUTED }}>{course?.title} · {course?.code}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              {grade ? (
                <StatusBadge label={`Graded: ${grade.score}/${assignment.points_possible}`} bg="#dcfce7" color="#166534" />
              ) : hasSubmitted ? (
                <StatusBadge label="Submitted" bg="#dbeafe" color="#1e40af" />
              ) : isPastDue ? (
                <StatusBadge label="Missing" bg="#fef2f2" color="#991b1b" />
              ) : (
                <StatusBadge label="To Do" bg="#f1f5f9" color={MUTED} />
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>Points</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{assignment.points_possible}</div>
            </div>
            {assignment.due_at && (
              <div>
                <span style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>Due</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: isPastDue ? "#dc2626" : "#0f172a" }}>
                  {new Date(assignment.due_at).toLocaleString()}
                </div>
              </div>
            )}
            {assignment.submission_type && (
              <div>
                <span style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>Type</span>
                <div style={{ fontSize: 14, color: "#0f172a", textTransform: "capitalize" }}>{assignment.submission_type}</div>
              </div>
            )}
            {assignment.attempt_limit && (
              <div>
                <span style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>Attempts</span>
                <div style={{ fontSize: 14, color: "#0f172a" }}>{submission?.attempt_no ?? 0} / {assignment.attempt_limit}</div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        {assignment.instructions && (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Instructions</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{assignment.instructions}</p>
          </div>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Resources</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {resources.map(r => {
                const resourceUrl = r.public_url || r.url;
                const isYT = isYouTubeUrl(resourceUrl);

                if (isYT) {
                  return (
                    <div key={r.id} style={{ background: SURFACE, borderRadius: 10, padding: 12 }}>
                      {r.title && <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>{r.title}</div>}
                      <YouTubeEmbed url={resourceUrl} title={r.title} />
                    </div>
                  );
                }

                return (
                  <a key={r.id} href={resourceUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: SURFACE, borderRadius: 8, textDecoration: "none", color: PRIMARY, fontWeight: 600, fontSize: 14 }}>
                    {r.resource_type === "file" ? "📎" : "🔗"} {r.title || r.original_name || r.url}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Grade / Feedback */}
        {grade && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#166534" }}>Grade & Feedback</h3>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#166534", marginBottom: 8 }}>
              {grade.score} / {assignment.points_possible}
            </div>
            {grade.feedback_text && (
              <p style={{ margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{grade.feedback_text}</p>
            )}
            {grade.graded_at && (
              <span style={{ fontSize: 12, color: MUTED, marginTop: 8, display: "block" }}>
                Graded on {new Date(grade.graded_at).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Previous Submission */}
        {hasSubmitted && !grade && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#1e40af" }}>Your Submission</h3>
            {submission.submitted_text && (
              <p style={{ margin: "0 0 8px", fontSize: 14, color: "#334155", whiteSpace: "pre-wrap" }}>{submission.submitted_text}</p>
            )}
            {submission.submitted_url && (
              <a href={submission.submitted_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 14, color: PRIMARY, fontWeight: 600 }}>
                {submission.submitted_url}
              </a>
            )}
            <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
              Submitted {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : ""}
              {submission.is_late && <span style={{ color: "#dc2626", marginLeft: 8 }}>(Late)</span>}
            </div>
          </div>
        )}

        {/* Submit Work */}
        {canSubmit && !grade && (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              {hasSubmitted ? "Resubmit Work" : "Submit Work"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Your Answer / Text</label>
                <textarea value={submittedText} onChange={e => setSubmittedText(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={5}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: `1px solid ${BORDER}`, fontSize: 14, resize: "vertical",
                    background: "#fff", color: "#0f172a", boxSizing: "border-box", fontFamily: "inherit",
                  }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Link (optional)</label>
                <input type="url" value={submittedUrl} onChange={e => setSubmittedUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: `1px solid ${BORDER}`, fontSize: 14,
                    background: "#fff", color: "#0f172a", boxSizing: "border-box",
                  }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Upload File (optional)</label>
                <div style={{
                  border: `2px dashed ${BORDER}`, borderRadius: 10, padding: 16,
                  textAlign: "center", background: SURFACE, cursor: "pointer",
                }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" style={{ display: "none" }}
                    onChange={e => setSubmittedFile(e.target.files?.[0] ?? null)}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.zip"
                  />
                  {submittedFile ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 500 }}>{submittedFile.name}</span>
                      <span style={{ fontSize: 12, color: MUTED }}>({(submittedFile.size / 1024).toFixed(0)} KB)</span>
                      <button type="button" onClick={e => { e.stopPropagation(); setSubmittedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, fontWeight: 700, padding: "0 4px" }}>
                        x
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Click to choose a file</div>
                      <div style={{ fontSize: 12, color: MUTED }}>PDF, DOC, TXT, images, video, or ZIP</div>
                    </div>
                  )}
                </div>
                {uploading && <span style={{ fontSize: 12, color: PRIMARY }}>Uploading file...</span>}
              </div>

              {submitError && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#7f1d1d", fontSize: 13 }}>
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f0fdf4", color: "#166534", fontSize: 13 }}>
                  Submitted successfully!
                </div>
              )}

              <button type="submit" disabled={submitting || uploading || (!submittedText.trim() && !submittedUrl.trim() && !submittedFile)}
                style={{
                  padding: "12px", borderRadius: 10, border: "none",
                  background: (!submittedText.trim() && !submittedUrl.trim() && !submittedFile) ? MUTED : PRIMARY,
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: submitting ? "default" : "pointer", alignSelf: "flex-start",
                  paddingLeft: 28, paddingRight: 28,
                }}>
                {submitting ? "Submitting..." : hasSubmitted ? "Resubmit" : "Submit"}
              </button>
            </form>
          </div>
        )}

        {/* Locked message */}
        {isLocked && !grade && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: 20, textAlign: "center", color: "#991b1b", fontSize: 14 }}>
            This assignment is locked and can no longer accept submissions.
          </div>
        )}
      </div>
    </div>
  );
}
