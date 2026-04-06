import React from "react";

function Stat({ label, value }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

function CourseProgressRow({ item }) {
  const course = item.course ?? {};
  const totals = item.totals ?? {};

  return (
    <tr>
      <td>{course.title ?? "Untitled Course"}</td>
      <td>{totals.lessons ?? 0}</td>
      <td>{totals.completedLessons ?? 0}</td>
      <td>{totals.inProgressLessons ?? 0}</td>
      <td>{totals.notStartedLessons ?? 0}</td>
      <td>{totals.assignments ?? 0}</td>
      <td>{totals.submittedAssignments ?? 0}</td>
      <td>{totals.gradedAssignments ?? 0}</td>
      <td>{totals.progressPercent ?? 0}%</td>
      <td>{totals.averageGradePercent ?? "-"}</td>
    </tr>
  );
}

export function StudentProgressCard({ data }) {
  if (!data) return null;

  const totals = data.totals ?? {};
  const courses = data.courses ?? [];
  const scope = data.scope ?? "all_courses";

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
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>
        {scope === "course" ? "Course Progress" : "Progress Summary"}
      </h3>

      <div style={{ marginBottom: 16 }}>
        <Stat label="Courses" value={totals.courses ?? (scope === "course" ? 1 : 0)} />
        <Stat label="Lessons" value={totals.lessons ?? 0} />
        <Stat label="Completed Lessons" value={totals.completedLessons ?? 0} />
        <Stat label="In Progress Lessons" value={totals.inProgressLessons ?? 0} />
        <Stat label="Not Started Lessons" value={totals.notStartedLessons ?? 0} />
        <Stat label="Assignments" value={totals.assignments ?? 0} />
        <Stat label="Submitted Assignments" value={totals.submittedAssignments ?? 0} />
        <Stat label="Graded Assignments" value={totals.gradedAssignments ?? 0} />
        <Stat label="Progress" value={`${totals.progressPercent ?? 0}%`} />
        <Stat label="Average Grade" value={totals.averageGradePercent ?? "-"} />
      </div>

      {courses.length > 0 && (
        <div>
          <h4 style={{ marginBottom: 10 }}>Course Breakdown</h4>
          <table width="100%" border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Course</th>
                <th>Lessons</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>Not Started</th>
                <th>Assignments</th>
                <th>Submitted</th>
                <th>Graded</th>
                <th>Progress</th>
                <th>Avg Grade</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((item) => (
                <CourseProgressRow
                  key={item.course?.id ?? `${item.course?.title ?? "course"}`}
                  item={item}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentProgressCard;