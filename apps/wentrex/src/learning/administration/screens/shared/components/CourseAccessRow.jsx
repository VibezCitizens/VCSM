import { ArrowRight } from "lucide-react";

export default function CourseAccessRow({ course, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(course)}
      className="learning-card"
      style={{
        width: "100%",
        textAlign: "left",
        padding: 18,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 6px" }}>{course.title ?? "Untitled Course"}</h3>
          <p style={{ margin: 0, color: "var(--learning-muted-text)" }}>
            {course.description ?? "No course description available."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="learning-badge">{course.role ?? "member"}</span>
          <span className="learning-badge">{course.status ?? "active"}</span>
        </div>
      </div>

      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "var(--learning-primary)",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Open course
        <ArrowRight size={16} />
      </span>
    </button>
  );
}
