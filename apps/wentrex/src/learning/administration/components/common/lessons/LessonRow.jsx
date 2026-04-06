import ProgressPill from "@/learning/administration/components/common/lessons/ProgressPill";

export default function LessonRow({ lesson, progress, onOpen }) {
  const state = progress?.state ?? null;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(lesson)}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid var(--learning-border)",
        background: state === "completed" ? "#f0fdf4" : "var(--learning-surface)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--learning-text)" }}>
        {lesson.title ?? "Untitled Lesson"}
      </span>
      <ProgressPill state={state} />
    </button>
  );
}
