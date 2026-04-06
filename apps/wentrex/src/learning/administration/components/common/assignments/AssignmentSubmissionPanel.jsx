import { useState } from "react";

export default function AssignmentSubmissionPanel({
  assignment,
  submission,
  capabilities,
  onSaveDraft,
  onSubmit,
}) {
  const [text, setText] = useState(submission?.submittedText ?? "");
  const [url, setUrl] = useState(submission?.submittedUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSubmitted = submission?.status === "submitted" || submission?.status === "graded";
  const canSubmit = capabilities?.canSubmitAssignments && !isSubmitted;
  const type = assignment?.submissionType ?? "text";

  async function handleSaveDraft() {
    setSaving(true);
    try {
      await onSaveDraft?.({ text, url });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit?.({ text, url });
    } finally {
      setSubmitting(false);
    }
  }

  if (!canSubmit && !isSubmitted) return null;

  return (
    <div
      className="learning-card"
      style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}
    >
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
        {isSubmitted ? "Your Submission" : "Submit Assignment"}
      </h3>

      {isSubmitted ? (
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: "#dcfce7",
              color: "#166534",
            }}
          >
            {submission.status === "graded" ? "Graded" : "Submitted"}
          </span>
          {submission.submittedAt ? (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--learning-muted-text)" }}>
              Submitted {new Date(submission.submittedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {(type === "text" || type === "text_and_url") ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--learning-text)" }}>
                Response
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--learning-border)",
                  fontSize: 14,
                  resize: "vertical",
                  background: "var(--learning-surface)",
                  color: "var(--learning-text)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ) : null}

          {(type === "url" || type === "text_and_url") ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--learning-text)" }}>
                Link
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--learning-border)",
                  fontSize: 14,
                  background: "var(--learning-surface)",
                  color: "var(--learning-text)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="learning-button learning-button-secondary"
            >
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="learning-button learning-button-primary"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
