import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import TopBar from "@/learning/components/TopBar";
import { uploadToCloudflare, publicUrlForKey } from "@/features/services/cloudflare/uploadToCloudflare";
import QuizBuilder, { createEmptyQuestion, calculateTotalPoints, validateQuiz } from "@/learning/staff/components/QuizBuilder";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${BORDER}`, fontSize: 14,
  background: "#fff", color: "#0f172a", boxSizing: "border-box",
};

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];
const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.ppt,.pptx,.txt";

function Field({ label, required, children, help }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      {children}
      {help && <span style={{ fontSize: 12, color: MUTED }}>{help}</span>}
    </div>
  );
}

function FieldRow({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}

function DateTimeField({ label, help, value, onChange }) {
  const datePart = value ? value.split("T")[0] : "";
  const timePart = value ? (value.split("T")[1] ?? "") : "";

  function handleDateChange(e) {
    const d = e.target.value;
    onChange(d ? `${d}T${timePart || "08:00"}` : "");
  }

  function handleTimeChange(e) {
    const t = e.target.value;
    onChange(datePart ? `${datePart}T${t || "08:00"}` : "");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{label}</label>
      <div style={{ display: "flex", gap: 0 }}>
        <input type="date" value={datePart} onChange={handleDateChange}
          style={{ ...inputStyle, borderRadius: "10px 0 0 10px", borderRight: "none", flex: 1.2 }} />
        <input type="time" value={timePart} onChange={handleTimeChange}
          style={{ ...inputStyle, borderRadius: "0 10px 10px 0", flex: 0.8 }} />
      </div>
      {help && <span style={{ fontSize: 12, color: MUTED }}>{help}</span>}
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function isValidUrl(str) {
  if (!str) return true;
  try { new URL(str); return true; } catch { return false; }
}

export default function CreateAssignmentScreen() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [actorId, setActorId] = useState(null);
  const [modules, setModules] = useState([]);

  // Form — assignment type
  const [assignmentType, setAssignmentType] = useState("regular");
  const [questions, setQuestions] = useState([]);

  // Form — assignment fields
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [points, setPoints] = useState("100");
  const [submissionType, setSubmissionType] = useState("text");
  const [dueAt, setDueAt] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [lockAt, setLockAt] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [attemptLimit, setAttemptLimit] = useState("");
  const [allowLate, setAllowLate] = useState(true);

  // Resources
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceUrlTitle, setResourceUrlTitle] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // Submit state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }

      const { data: actor } = await supabase.schema("learning").from("actors")
        .select("id").eq("user_id", user.id).eq("is_active", true).maybeSingle();
      if (actor) setActorId(actor.id);

      const { data: courseRow } = await supabase.schema("learning").from("courses")
        .select("id, title, code, organization_id").eq("id", courseId).maybeSingle();
      setCourse(courseRow);

      const { data: mods } = await supabase.schema("learning").from("modules")
        .select("id, title, sort_order").eq("course_id", courseId).order("sort_order");
      setModules(mods ?? []);

      setLoading(false);
    }
    init();
  }, [navigate, courseId]);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Unsupported file type. Accepted: PDF, Word, PowerPoint, TXT");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File too large. Maximum 50MB.");
      return;
    }
    setUploadError("");
    setAttachment(file);
  }

  function resetForm() {
    setAssignmentType("regular"); setQuestions([]);
    setTitle(""); setInstructions(""); setPoints("100"); setSubmissionType("text");
    setDueAt(""); setAvailableFrom(""); setLockAt(""); setModuleId("");
    setAttemptLimit(""); setAllowLate(true);
    setResourceUrl(""); setResourceUrlTitle(""); setAttachment(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    if (resourceUrl && !isValidUrl(resourceUrl)) { setError("Invalid URL format."); return; }

    // Validate quiz if quiz type
    if (assignmentType === "quiz") {
      const quizErrors = validateQuiz(questions);
      if (quizErrors.length > 0) {
        setError(quizErrors.join(" "));
        return;
      }
    }

    setSaving(true);
    setError("");

    const effectivePoints = assignmentType === "quiz" ? calculateTotalPoints(questions) : (parseFloat(points) || 100);

    // Step 1: Create the assignment (core fields only)
    const { data: assignment, error: assignErr } = await supabase.schema("learning").from("assignments").insert({
      course_id: courseId,
      title: title.trim(),
      instructions: instructions.trim(),
      points_possible: effectivePoints,
      submission_type: assignmentType === "quiz" ? "text" : submissionType,
      due_at: dueAt || null,
      available_from: availableFrom || null,
      lock_at: lockAt || null,
      module_id: moduleId || null,
      attempt_limit: attemptLimit ? parseInt(attemptLimit) : null,
      allow_late_submissions: allowLate,
      is_published: false,
      created_by_actor_id: actorId,
      organization_id: course?.organization_id ?? null,
    }).select("id, title").single();

    if (assignErr) {
      setSaving(false);
      setError(assignErr.message);
      return;
    }

    const assignmentId = assignment.id;
    const resourceErrors = [];
    let sortOrder = 0;

    // Step 2: Insert URL resource into assignment_resources (if provided)
    if (resourceUrl.trim()) {
      const { error: urlErr } = await supabase.schema("learning").from("assignment_resources").insert({
        assignment_id: assignmentId,
        resource_type: "url",
        title: resourceUrlTitle.trim() || null,
        url: resourceUrl.trim(),
        sort_order: sortOrder++,
      });
      if (urlErr) resourceErrors.push(`URL resource: ${urlErr.message}`);
    }

    // Step 3: Upload file to Cloudflare R2 and insert file resource (if provided)
    if (attachment) {
      setUploading(true);
      const ext = attachment.name.split(".").pop();
      const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageKey = `assignments/${course?.organization_id ?? "org"}/${courseId}/${assignmentId}/${Date.now()}-${safeName}`;

      const { url: publicUrl, error: uploadErrMsg } = await uploadToCloudflare(attachment, storageKey);

      setUploading(false);

      if (uploadErrMsg) {
        resourceErrors.push(`File upload: ${uploadErrMsg}`);
      } else {
        const { error: fileResErr } = await supabase.schema("learning").from("assignment_resources").insert({
          assignment_id: assignmentId,
          resource_type: "file",
          title: attachment.name,
          storage_key: storageKey,
          public_url: publicUrl ?? publicUrlForKey(storageKey),
          original_name: attachment.name,
          mime_type: attachment.type,
          size_bytes: attachment.size,
          sort_order: sortOrder++,
        });
        if (fileResErr) resourceErrors.push(`File resource: ${fileResErr.message}`);
      }
    }

    // Step 4: Save quiz questions and options (if quiz type)
    if (assignmentType === "quiz" && questions.length > 0) {
      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        const { data: questionRow, error: qErr } = await supabase.schema("learning")
          .from("assignment_questions").insert({
            assignment_id: assignmentId,
            question_text: q.text.trim(),
            question_type: q.type,
            points_possible: parseFloat(q.points) || 1,
            explanation: q.explanation?.trim() || "",
            sort_order: qi,
          }).select("id").single();

        if (qErr) {
          resourceErrors.push(`Question ${qi + 1}: ${qErr.message}`);
          continue;
        }

        // Insert options
        const optionRows = q.options.map((o, oi) => ({
          question_id: questionRow.id,
          option_text: o.text.trim(),
          is_correct: o.isCorrect,
          sort_order: oi,
        }));

        const { error: oErr } = await supabase.schema("learning")
          .from("assignment_question_options").insert(optionRows);

        if (oErr) resourceErrors.push(`Question ${qi + 1} options: ${oErr.message}`);
      }
    }

    setSaving(false);

    if (resourceErrors.length > 0) {
      setError(`Assignment created, but some parts failed: ${resourceErrors.join("; ")}`);
      setResult(assignment);
    } else {
      setResult(assignment);
    }
  }

  if (loading) {
    return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar
        orgName={course?.title ?? "Course"}
        subtitle="New Assignment"
        backTo={`/teacher/course/${courseId}`}
        backLabel="Back to Course"
      />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 64px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>
            {course?.title} {course?.code ? `/ ${course.code}` : ""}
          </span>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>Create Assignment</h1>
          <p style={{ margin: "8px 0 0", fontSize: 15, color: MUTED }}>New assignments start as drafts. Publish when ready for students.</p>
        </div>

        {/* Success */}
        {result && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#166534" }}>Assignment Created</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#166534" }}>
              <strong>{result.title}</strong> has been created as a draft. You can publish it from the Assignments tab.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => navigate(`/teacher/course/${courseId}`)} style={{ padding: "10px 22px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}>
                Back to Course
              </button>
              <button onClick={() => { setResult(null); resetForm(); }}
                style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: PRIMARY, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Create Another
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Assignment Type */}
            <SectionCard title="Assignment Type">
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { value: "regular", label: "Regular Assignment" },
                  { value: "quiz", label: "Quiz / Exam" },
                ].map(t => (
                  <button key={t.value} type="button" onClick={() => {
                    setAssignmentType(t.value);
                    if (t.value === "quiz" && questions.length === 0) setQuestions([createEmptyQuestion(0)]);
                  }}
                    style={{
                      flex: 1, padding: "14px 16px", borderRadius: 10,
                      border: `2px solid ${assignmentType === t.value ? PRIMARY : BORDER}`,
                      background: assignmentType === t.value ? "#eff6ff" : "#fff",
                      color: assignmentType === t.value ? PRIMARY : "#334155",
                      fontSize: 14, fontWeight: 600, cursor: "pointer",
                      textAlign: "center",
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* Assignment Details */}
            <SectionCard title="Assignment Details" subtitle="What students will see and submit.">
              <Field label="Title" required>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1 Reading Quiz" required style={inputStyle} />
              </Field>

              <Field label="Instructions" help="Describe what students need to do for this assignment.">
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Read chapter 1 and answer the following questions..." rows={5} style={{ ...inputStyle, resize: "vertical" }} />
              </Field>

              {assignmentType === "regular" && (
                <FieldRow>
                  <Field label="Points Possible">
                    <input type="number" value={points} onChange={e => setPoints(e.target.value)} min="0" style={inputStyle} />
                  </Field>
                  <Field label="Submission Type">
                    <select value={submissionType} onChange={e => setSubmissionType(e.target.value)} style={inputStyle}>
                      <option value="text">Text Entry</option>
                      <option value="file">File Upload</option>
                      <option value="url">URL / Link</option>
                      <option value="mixed">Mixed (Text + File)</option>
                    </select>
                  </Field>
                </FieldRow>
              )}
              {assignmentType === "quiz" && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: SURFACE, fontSize: 13, color: MUTED }}>
                  Total points: <strong style={{ color: "#0f172a" }}>{calculateTotalPoints(questions)}</strong> (auto-calculated from questions)
                </div>
              )}

              {modules.length > 0 && (
                <Field label="Module" help="Assign this to a course module.">
                  <select value={moduleId} onChange={e => setModuleId(e.target.value)} style={inputStyle}>
                    <option value="">No module</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </Field>
              )}
            </SectionCard>

            {/* Assignment Resources */}
            <SectionCard title="Assignment Resources" subtitle="Add a link or upload a document for students. Both are optional.">
              <Field label="Resource URL" help="Link to a YouTube video, Google Doc, website, or external resource.">
                <input type="url" value={resourceUrl} onChange={e => setResourceUrl(e.target.value)}
                  placeholder="https://example.com/resource" style={inputStyle} />
                {resourceUrl && !isValidUrl(resourceUrl) && (
                  <span style={{ fontSize: 12, color: "#dc2626" }}>Invalid URL format</span>
                )}
              </Field>

              {resourceUrl.trim() && isValidUrl(resourceUrl) && (
                <Field label="Resource Title" help="Optional label for the link (e.g. 'Watch this video').">
                  <input type="text" value={resourceUrlTitle} onChange={e => setResourceUrlTitle(e.target.value)}
                    placeholder="e.g. Chapter 1 Video Lecture" style={inputStyle} />
                </Field>
              )}

              <Field label="Upload Attachment" help="PDF, Word, PowerPoint, or TXT. Max 50MB.">
                <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileSelect} style={{ display: "none" }} />

                {attachment ? (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderRadius: 10, border: `1px solid ${BORDER}`, background: SURFACE,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>📄</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{attachment.name}</div>
                        <div style={{ fontSize: 12, color: MUTED }}>
                          {attachment.size < 1024 * 1024
                            ? `${(attachment.size / 1024).toFixed(0)} KB`
                            : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
                          }
                        </div>
                      </div>
                    </div>
                    <button type="button"
                      onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      style={{ padding: "5px 14px", borderRadius: 6, border: `1px solid #fecaca`, background: "#fff", color: "#dc2626", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "14px 20px", borderRadius: 10, border: `2px dashed ${BORDER}`,
                      background: "#fff", color: MUTED, fontSize: 14, cursor: "pointer",
                      width: "100%", textAlign: "center", transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}>
                    Click to select a file
                  </button>
                )}
                {uploadError && <span style={{ fontSize: 12, color: "#dc2626" }}>{uploadError}</span>}
                {uploading && <span style={{ fontSize: 13, color: PRIMARY, fontWeight: 500 }}>Uploading file...</span>}
              </Field>
            </SectionCard>

            {/* Quiz Builder */}
            {assignmentType === "quiz" && (
              <SectionCard title="Quiz Questions" subtitle={`Build your quiz. ${questions.length}/100 questions.`}>
                <QuizBuilder questions={questions} onChange={setQuestions} />
              </SectionCard>
            )}

            {/* Schedule */}
            <SectionCard title="Schedule" subtitle="When the assignment is available and due.">
              <FieldRow>
                <DateTimeField label="Available From" help="When students can see this assignment." value={availableFrom} onChange={setAvailableFrom} />
                <DateTimeField label="Due Date" value={dueAt} onChange={setDueAt} />
              </FieldRow>
              <FieldRow>
                <DateTimeField label="Lock Date" help="After this date, no more submissions." value={lockAt} onChange={setLockAt} />
                <Field label="Attempt Limit" help="Leave blank for unlimited.">
                  <input type="number" value={attemptLimit} onChange={e => setAttemptLimit(e.target.value)} min="1" placeholder="Unlimited" style={inputStyle} />
                </Field>
              </FieldRow>
            </SectionCard>

            {/* Submission Rules */}
            <SectionCard title="Submission Rules">
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={allowLate} onChange={e => setAllowLate(e.target.checked)} style={{ width: 16, height: 16 }} />
                Allow late submissions
              </label>
            </SectionCard>

            {/* Error */}
            {error && (
              <div style={{ padding: "12px 18px", borderRadius: 10, background: "#fef2f2", color: "#7f1d1d", fontSize: 14 }}>{error}</div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
              <button type="button" onClick={() => navigate(`/teacher/course/${courseId}`)}
                style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={!title.trim() || saving || (assignmentType === "quiz" && questions.length === 0)}
                style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: (!title.trim() || (assignmentType === "quiz" && questions.length === 0)) ? MUTED : PRIMARY, color: "#fff", fontSize: 15, fontWeight: 700, cursor: (!title.trim() || saving) ? "default" : "pointer" }}>
                {saving ? (uploading ? "Uploading..." : "Creating...") : assignmentType === "quiz" ? "Create Quiz" : "Create Assignment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
