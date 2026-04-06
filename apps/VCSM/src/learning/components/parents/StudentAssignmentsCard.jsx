import React from "react";

function Row({ item }) {
  return (
    <tr>
      <td>{item.assignment?.title ?? item.id}</td>
      <td>{item.state}</td>
      <td>{item.isOverdue ? "Yes" : "No"}</td>
      <td>{item.gradePercent ?? "-"}</td>
    </tr>
  );
}

export function StudentAssignmentsCard({ assignments = [], summary }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <h3>Assignments</h3>

      <div style={{ marginBottom: 12 }}>
        <div>Total: {summary?.totalAssignments ?? 0}</div>
        <div>Submitted: {summary?.submittedAssignments ?? 0}</div>
        <div>Graded: {summary?.gradedAssignments ?? 0}</div>
        <div>Overdue: {summary?.overdueAssignments ?? 0}</div>
        <div>Average Grade: {summary?.averageGradePercent ?? "-"}</div>
      </div>

      <table width="100%" border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Status</th>
            <th>Overdue</th>
            <th>Grade %</th>
          </tr>
        </thead>

        <tbody>
          {assignments.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentAssignmentsCard;