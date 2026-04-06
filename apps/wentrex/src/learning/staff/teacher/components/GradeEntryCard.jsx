import React, { useMemo, useState } from "react";

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function safeValue(value, fallback = "") {
  return value === null || value === undefined ? fallback : value;
}

export function GradeEntryCard({
  submission,
  onSubmit,
  isSaving = false,
  maxScore = null,
  initialScore = "",
  initialFeedbackText = "",
  initialFeedbackPrivate = "",
  initialStatus = "graded",
  title = "Grade Submission",
}) {
  const [score, setScore] = useState(
    initialScore === null || initialScore === undefined ? "" : String(initialScore),
  );
  const [feedbackText, setFeedbackText] = useState(initialFeedbackText ?? "");
  const [feedbackPrivate, setFeedbackPrivate] = useState(initialFeedbackPrivate ?? "");
  const [status, setStatus] = useState(initialStatus ?? "graded");

  const submissionLabel = useMemo(() => {
    const studentActorId =
      submission?.studentActorId ??
      submission?.submission?.actorId ??
      submission?.actorId ??
      "-";

    const assignmentTitle =
      submission?.assignment?.title ??
      submission?.assignmentTitle ??
      submission?.title ??
      "Submission";

    return `${assignmentTitle} • ${studentActorId}`;
  }, [submission]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedScore =
      score === "" || score === null || score === undefined
        ? null
        : Number(score);

    await onSubmit?.({
      submissionId:
        submission?.submission?.id ??
        submission?.id ??
        null,
      score: normalizedScore,
      feedbackText,
      feedbackPrivate,
      rubricGrades: [],
      status,
    });
  };

  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h3>
      <div style={{ marginBottom: 16, color: "#555" }}>{submissionLabel}</div>

      <form onSubmit={handleSubmit}>
        <Field label={`Score${maxScore !== null ? ` / ${maxScore}` : ""}`}>
          <input
            type="number"
            step="0.01"
            value={safeValue(score)}
            onChange={(event) => setScore(event.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d0d7de",
            }}
          />
        </Field>

        <Field label="Public Feedback">
          <textarea
            value={feedbackText}
            onChange={(event) => setFeedbackText(event.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d0d7de",
              resize: "vertical",
            }}
          />
        </Field>

        <Field label="Private Feedback">
          <textarea
            value={feedbackPrivate}
            onChange={(event) => setFeedbackPrivate(event.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d0d7de",
              resize: "vertical",
            }}
          />
        </Field>

        <Field label="Status">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d0d7de",
            }}
          >
            <option value="graded">graded</option>
            <option value="returned">returned</option>
            <option value="submitted">submitted</option>
          </select>
        </Field>

        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222",
            background: isSaving ? "#666" : "#222",
            color: "#fff",
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        >
          {isSaving ? "Saving..." : "Save Grade"}
        </button>
      </form>
    </div>
  );
}

export default GradeEntryCard;