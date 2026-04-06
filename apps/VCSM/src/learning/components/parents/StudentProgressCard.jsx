import React from "react";

function Item({ label, value }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

export function StudentProgressCard({ data }) {
  if (!data) return null;

  const { summary, modules = [] } = data;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <h3>Progress</h3>

      <div style={{ marginBottom: 12 }}>
        <Item label="Lessons" value={summary?.lessonCount ?? 0} />
        <Item label="Completed" value={summary?.completedLessons ?? 0} />
        <Item label="In Progress" value={summary?.inProgressLessons ?? 0} />
        <Item label="Not Started" value={summary?.notStartedLessons ?? 0} />
        <Item label="Progress %" value={summary?.progressPercent ?? 0} />
      </div>

      <h4>Modules</h4>

      {modules.length === 0 && <div>No modules</div>}

      {modules.map((module) => (
        <div
          key={module.id}
          style={{
            border: "1px solid #eee",
            padding: 10,
            borderRadius: 6,
            marginBottom: 8,
          }}
        >
          <strong>{module.title}</strong>

          <div style={{ fontSize: 14, marginTop: 4 }}>
            Lessons: {module.lessonCount} | Completed: {module.completedLessons} | %
            {module.progressPercent}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StudentProgressCard;