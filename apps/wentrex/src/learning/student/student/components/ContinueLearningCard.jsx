import React from "react";

function Stat({ label, value }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

export function ContinueLearningCard({ course, onContinue }) {
  if (!course) return null;

  const summary = course.summary ?? {};
  const title = course.course?.title ?? course.title ?? "Untitled Course";
  const courseId = course.course?.id ?? course.id ?? null;

  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h3>

      <div style={{ marginBottom: 12 }}>
        <Stat label="Progress" value={`${summary.progressPercent ?? 0}%`} />
        <Stat label="Completed Lessons" value={summary.completedLessons ?? 0} />
        <Stat label="In Progress Lessons" value={summary.inProgressLessons ?? 0} />
        <Stat label="Remaining Lessons" value={summary.notStartedLessons ?? 0} />
        <Stat label="Assignments" value={summary.assignmentCount ?? 0} />
      </div>

      <button
        type="button"
        onClick={() => onContinue?.(course)}
        disabled={!courseId}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #222",
          background: "#222",
          color: "#fff",
          cursor: courseId ? "pointer" : "not-allowed",
        }}
      >
        Continue Learning
      </button>
    </div>
  );
}

export default ContinueLearningCard;