export default function GradeSummaryCard({ grade, pointsPossible }) {
  if (!grade) return null;

  const hasScore =
    grade.score !== null &&
    grade.score !== undefined &&
    pointsPossible !== null &&
    pointsPossible !== undefined;

  const gradedDate = grade.gradedAt
    ? new Date(grade.gradedAt).toLocaleDateString()
    : null;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#ffffff",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px",
          fontSize: 16,
          fontWeight: 600,
          color: "#000000",
        }}
      >
        Grade Summary
      </h3>

      {hasScore && (
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 14,
            color: "#000000",
          }}
        >
          Score: <strong>{grade.score}</strong> / {pointsPossible}
        </p>
      )}

      {!hasScore && (
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          No score available yet.
        </p>
      )}

      {gradedDate && (
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          Graded on {gradedDate}
        </p>
      )}

      {grade.feedbackText && (
        <div style={{ marginTop: 12 }}>
          <h4
            style={{
              margin: "0 0 6px",
              fontSize: 14,
              fontWeight: 600,
              color: "#000000",
            }}
          >
            Feedback
          </h4>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.5,
              color: "#111827",
              whiteSpace: "pre-wrap",
            }}
          >
            {grade.feedbackText}
          </p>
        </div>
      )}
    </div>
  );
}