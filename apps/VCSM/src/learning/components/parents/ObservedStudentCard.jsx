import React from "react";

function Item({ label, value }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

export function ObservedStudentCard({ item }) {
  if (!item) return null;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <h3>Student: {item.studentActorId}</h3>

      <div style={{ marginBottom: 8 }}>
        <Item label="Course" value={item.course?.title ?? item.courseId} />
        <Item label="Linked At" value={item.linkedAt ?? "-"} />
      </div>

      <div>
        <Item label="Lessons" value={item.progressSummary.lessonCount} />
        <Item label="Completed" value={item.progressSummary.completedLessons} />
        <Item label="In Progress" value={item.progressSummary.inProgressLessons} />
        <Item label="Not Started" value={item.progressSummary.notStartedLessons} />
        <Item label="Progress %" value={item.progressSummary.progressPercent} />
      </div>
    </div>
  );
}

export default ObservedStudentCard;