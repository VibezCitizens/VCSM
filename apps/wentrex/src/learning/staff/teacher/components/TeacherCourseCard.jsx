import React from "react";

function Stat({ label, value }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

export function TeacherCourseCard({
  item,
  onOpen,
  actionLabel = "Open Course",
}) {
  if (!item) return null;

  const course = item.course ?? item;
  const membership = item.membership ?? {};
  const summary = item.summary ?? item.totals ?? {};

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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            {course.title ?? "Untitled Course"}
          </h3>

          <Stat label="Role" value={membership.role ?? item.role ?? "teacher"} />
          <Stat label="Status" value={membership.status ?? item.status ?? "-"} />
          <Stat
            label="Published"
            value={course.publishedAt ?? course.createdAt ?? "-"}
          />
        </div>

        <div style={{ minWidth: 220 }}>
          <Stat label="Lessons" value={summary.lessonCount ?? summary.lessons ?? 0} />
          <Stat
            label="Assignments"
            value={summary.assignmentCount ?? summary.assignments ?? 0}
          />
          <Stat
            label="Students"
            value={summary.studentCount ?? summary.students ?? 0}
          />
          <Stat
            label="Submissions"
            value={summary.submissionCount ?? summary.submissions ?? 0}
          />
        </div>
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
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export default TeacherCourseCard;