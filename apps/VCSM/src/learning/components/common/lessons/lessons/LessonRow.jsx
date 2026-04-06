import ProgressPill from "@/learning/components/common/lessons/ProgressPill";

export default function LessonRow({ lesson, progress, onPress }) {
  if (!lesson) return null;

  const isClickable = typeof onPress === "function";

  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        width: "100%",
        padding: 14,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#ffffff",
        cursor: isClickable ? "pointer" : "default",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <h4
          style={{
            margin: "0 0 4px",
            fontSize: 15,
            fontWeight: 600,
            color: "#000000",
          }}
        >
          {lesson.title}
        </h4>

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

      <ProgressPill state={progress?.state} />
    </div>
  );

  if (!isClickable) {
    return content;
  }

  return (
    <button
      type="button"
      onClick={() => onPress(lesson)}
      style={{
        display: "block",
        width: "100%",
        padding: 0,
        margin: 0,
        border: "none",
        background: "transparent",
        textAlign: "left",
      }}
    >
      {content}
    </button>
  );
}