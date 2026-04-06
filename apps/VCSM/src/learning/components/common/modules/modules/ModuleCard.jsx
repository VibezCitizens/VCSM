import LessonRow from "@/learning/components/common/lessons/LessonRow";

export default function ModuleCard({
  module,
  lessons = [],
  progressByLessonId = {},
  onOpenLesson,
}) {
  if (!module) return null;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#ffffff",
        padding: 16,
      }}
    >
      <div style={{ marginBottom: lessons.length ? 16 : 0 }}>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: 18,
            fontWeight: 600,
            color: "#000000",
          }}
        >
          {module.title}
        </h3>

        {module.description ? (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.5,
              color: "#6b7280",
            }}
          >
            {module.description}
          </p>
        ) : null}
      </div>

      {lessons.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              progress={progressByLessonId?.[lesson.id] ?? null}
              onPress={onOpenLesson}
            />
          ))}
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          No lessons in this module yet.
        </p>
      )}
    </div>
  );
}