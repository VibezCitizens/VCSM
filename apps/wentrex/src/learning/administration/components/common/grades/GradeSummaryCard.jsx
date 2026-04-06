export default function GradeSummaryCard({ grade, pointsPossible }) {
  if (!grade) return null;

  const percent =
    pointsPossible > 0 ? Math.round((grade.score / pointsPossible) * 100) : null;

  return (
    <div
      className="learning-card"
      style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Grade</h3>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: "var(--learning-primary)" }}>
          {grade.score ?? "—"}
        </span>
        {pointsPossible != null ? (
          <span style={{ fontSize: 16, color: "var(--learning-muted-text)" }}>
            / {pointsPossible} pts
          </span>
        ) : null}
        {percent != null ? (
          <span
            style={{
              marginLeft: 8,
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              background: percent >= 70 ? "#dcfce7" : "#fef2f2",
              color: percent >= 70 ? "#166534" : "#7f1d1d",
            }}
          >
            {percent}%
          </span>
        ) : null}
      </div>

      {grade.gradedAt ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--learning-muted-text)" }}>
          Graded {new Date(grade.gradedAt).toLocaleDateString()}
        </p>
      ) : null}

      {grade.feedbackText ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--learning-border)",
            background: "var(--learning-muted)",
            fontSize: 14,
            color: "var(--learning-text)",
            lineHeight: 1.6,
          }}
        >
          {grade.feedbackText}
        </div>
      ) : null}
    </div>
  );
}
