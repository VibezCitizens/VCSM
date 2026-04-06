import { useNavigate } from "react-router-dom";
import LearningEmptyState from "@/learning/components/shared/LearningEmptyState";

export default function LearningHomeScreen({ courses = [] }) {
  const navigate = useNavigate();

  if (!courses.length) {
    return (
      <LearningEmptyState
        title="No courses yet"
        message="You are not enrolled in any courses."
      />
    );
  }

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h1 style={{ margin: 0 }}>Learning</h1>

      {courses.map((course) => (
        <button
          key={course.id}
          onClick={() =>
            navigate(`/learning/courses/${course.id}`)
          }
          style={{
            padding: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#fff",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <h3 style={{ margin: "0 0 6px" }}>{course.title}</h3>
          <p style={{ margin: 0, color: "#6b7280" }}>
            {course.description}
          </p>
        </button>
      ))}
    </div>
  );
}