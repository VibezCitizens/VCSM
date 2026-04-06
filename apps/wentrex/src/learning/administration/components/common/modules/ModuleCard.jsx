import LessonRow from "@/learning/administration/components/common/lessons/LessonRow";

export default function ModuleCard({ module, lessons = [], progressByLessonId = {}, onOpenLesson }) {
  const completedCount = lessons.filter(
    (l) => progressByLessonId[l.id]?.state === "completed"
  ).length;

  return (
    <div
      style={{
        border: "1px solid var(--learning-border)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          background: "var(--learning-muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--learning-text)" }}>
            {module.title ?? "Untitled Module"}
          </h3>
          {module.description ? (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--learning-muted-text)" }}>
              {module.description}
            </p>
          ) : null}
        </div>
        <span style={{ fontSize: 12, color: "var(--learning-muted-text)", whiteSpace: "nowrap" }}>
          {completedCount}/{lessons.length} done
        </span>
      </div>

      {lessons.length > 0 ? (
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              progress={progressByLessonId[lesson.id] ?? null}
              onOpen={onOpenLesson}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: "12px 18px", fontSize: 13, color: "var(--learning-muted-text)" }}>
          No lessons in this module.
        </div>
      )}
    </div>
  );
}
