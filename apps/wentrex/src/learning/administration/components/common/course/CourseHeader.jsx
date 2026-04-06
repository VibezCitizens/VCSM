export default function CourseHeader({ course, capabilities, onOpenContent, onOpenAssignments }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          {course.code ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--learning-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: 6,
              }}
            >
              {course.code}
            </span>
          ) : null}
          <h1 style={{ margin: 0, fontSize: 24, color: "var(--learning-text)" }}>
            {course.title ?? "Untitled Course"}
          </h1>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {onOpenContent ? (
            <button
              type="button"
              onClick={onOpenContent}
              className="learning-button learning-button-secondary"
            >
              Content
            </button>
          ) : null}
          {onOpenAssignments && capabilities?.canSubmitAssignments ? (
            <button
              type="button"
              onClick={onOpenAssignments}
              className="learning-button learning-button-primary"
            >
              Assignments
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
