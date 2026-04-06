export default function LessonContent({ lesson }) {
  if (!lesson) {
    return (
      <div style={{ color: "var(--learning-muted-text)", padding: 16 }}>
        No lesson content available.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ margin: "0 0 6px", fontSize: 26, color: "var(--learning-text)" }}>
          {lesson.title ?? "Untitled Lesson"}
        </h1>
        {lesson.lessonType ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--learning-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {lesson.lessonType}
          </span>
        ) : null}
      </div>

      {lesson.externalUrl ? (
        <a
          href={lesson.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid var(--learning-border)",
            background: "var(--learning-muted)",
            color: "var(--learning-primary)",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Open External Resource
        </a>
      ) : null}

      {lesson.fileUrl ? (
        <a
          href={lesson.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid var(--learning-border)",
            background: "var(--learning-muted)",
            color: "var(--learning-primary)",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Download File
        </a>
      ) : null}

      {lesson.body ? (
        <div
          style={{
            lineHeight: 1.7,
            color: "var(--learning-text)",
            fontSize: 15,
            whiteSpace: "pre-wrap",
          }}
        >
          {lesson.body}
        </div>
      ) : null}

      {!lesson.body && !lesson.externalUrl && !lesson.fileUrl ? (
        <div style={{ color: "var(--learning-muted-text)", fontStyle: "italic" }}>
          No content has been added to this lesson yet.
        </div>
      ) : null}
    </div>
  );
}
