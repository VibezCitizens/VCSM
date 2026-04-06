export default function LessonContent({ lesson }) {
  if (!lesson) return null;

  const renderBody = () => {
    switch (lesson.lessonType) {
      case "video":
        if (!lesson.externalUrl && !lesson.fileUrl) {
          return (
            <p style={{ margin: 0, color: "#6b7280" }}>
              No video source available.
            </p>
          );
        }

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lesson.externalUrl && (
              <a
                href={lesson.externalUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--org-color, #000000)",
                  textDecoration: "underline",
                }}
              >
                Open video
              </a>
            )}

            {lesson.fileUrl && (
              <video
                controls
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#000000",
                }}
              >
                <source src={lesson.fileUrl} />
              </video>
            )}
          </div>
        );

      case "link":
        return lesson.externalUrl ? (
          <a
            href={lesson.externalUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "var(--org-color, #000000)",
              textDecoration: "underline",
              wordBreak: "break-word",
            }}
          >
            {lesson.externalUrl}
          </a>
        ) : (
          <p style={{ margin: 0, color: "#6b7280" }}>No link available.</p>
        );

      case "file":
        return lesson.fileUrl ? (
          <a
            href={lesson.fileUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "var(--org-color, #000000)",
              textDecoration: "underline",
              wordBreak: "break-word",
            }}
          >
            Open file
          </a>
        ) : (
          <p style={{ margin: 0, color: "#6b7280" }}>No file available.</p>
        );

      case "page":
      default:
        return (
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#111827",
              whiteSpace: "pre-wrap",
            }}
          >
            {lesson.body || "No lesson content available."}
          </div>
        );
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#ffffff",
        padding: 16,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: 20,
            fontWeight: 700,
            color: "#000000",
          }}
        >
          {lesson.title}
        </h2>

        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#6b7280",
            textTransform: "capitalize",
          }}
        >
          {lesson.lessonType}
        </p>
      </div>

      {renderBody()}
    </div>
  );
}