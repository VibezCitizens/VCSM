import React from "react";

function Item({ label, value }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

export function StudentCourseCard({ item, onOpen }) {
  if (!item) return null;

  const course = item.course ?? {};
  const membership = item.membership ?? {};
  const summary = item.summary ?? {};

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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            {course.title ?? "Untitled Course"}
          </h3>
          <Item label="Status" value={membership.status ?? "-"} />
          <Item label="Role" value={membership.role ?? "student"} />
        </div>

        <div style={{ minWidth: 180 }}>
          <Item label="Progress" value={`${summary.progressPercent ?? 0}%`} />
          <Item label="Lessons" value={summary.lessonCount ?? 0} />
          <Item label="Assignments" value={summary.assignmentCount ?? 0} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Item label="Completed Lessons" value={summary.completedLessons ?? 0} />
        <Item label="In Progress Lessons" value={summary.inProgressLessons ?? 0} />
        <Item label="Not Started Lessons" value={summary.notStartedLessons ?? 0} />
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => onOpen?.(item)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222",
            background: "#222",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Open Course
        </button>
      </div>
    </div>
  );
}

export default StudentCourseCard;