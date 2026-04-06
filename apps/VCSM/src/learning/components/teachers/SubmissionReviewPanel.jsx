import React from "react";

function Item({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

function renderBody(value) {
  if (!value) return <span style={{ color: "#777" }}>No content</span>;

  if (typeof value === "string") {
    return (
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          margin: 0,
          fontFamily: "inherit",
        }}
      >
        {value}
      </pre>
    );
  }

  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        margin: 0,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function SubmissionReviewPanel({
  item,
  emptyMessage = "Select a submission to review.",
}) {
  if (!item) {
    return (
      <div
        style={{
          border: "1px solid #d0d7de",
          borderRadius: 10,
          padding: 16,
          background: "#fff",
          color: "#666",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  const assignment = item.assignment ?? {};
  const submission = item.submission ?? item;
  const grade = item.grade ?? null;

  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>
        {assignment.title ?? "Submission Review"}
      </h3>

      <div style={{ marginBottom: 16 }}>
        <Item label="Submission ID" value={submission.id ?? "-"} />
        <Item label="Student Actor ID" value={submission.actorId ?? item.studentActorId ?? "-"} />
        <Item label="Status" value={submission.status ?? "-"} />
        <Item label="Submitted At" value={submission.submittedAt ?? submission.updatedAt ?? "-"} />
        <Item
          label="Assignment Points"
          value={assignment.pointsPossible ?? assignment.points_possible ?? "-"}
        />
        <Item label="Grade Score" value={grade?.score ?? "-"} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Submission Content</div>
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 12,
            background: "#fafafa",
          }}
        >
          {renderBody(
            submission.content ??
              submission.answerText ??
              submission.body ??
              submission.payload ??
              null,
          )}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Student Notes</div>
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 12,
            background: "#fafafa",
          }}
        >
          {renderBody(submission.notes ?? submission.comment ?? null)}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Current Feedback</div>
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 12,
            background: "#fafafa",
          }}
        >
          {renderBody(
            grade?.feedbackText ??
              grade?.feedback_text ??
              grade?.feedback ??
              null,
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionReviewPanel;