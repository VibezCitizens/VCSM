export default function CourseHero({ course }) {
  if (!course) return null;

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--learning-border)",
        background: "var(--learning-muted)",
      }}
    >
      {course.coverImageUrl ? (
        <img
          src={course.coverImageUrl}
          alt={course.title ?? "Course cover"}
          style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            height: 120,
            background: "linear-gradient(135deg, var(--learning-primary) 0%, #1a7ab8 100%)",
          }}
        />
      )}

      {course.description ? (
        <div style={{ padding: "16px 20px" }}>
          <p style={{ margin: 0, color: "var(--learning-muted-text)", lineHeight: 1.65, fontSize: 14 }}>
            {course.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}
