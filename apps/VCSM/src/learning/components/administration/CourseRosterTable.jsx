import React from "react";

function Section({ title, items = [] }) {
  const renderLinkedValue = (item) => {
    if (item.role === "student") {
      const observerIds =
        item.linkedObservers?.map((link) => link.observerActorId) ?? [];

      return observerIds.length ? observerIds.join(", ") : "-";
    }

    if (["parent", "observer"].includes(item.role)) {
      const studentIds =
        item.linkedStudents?.map((link) => link.studentActorId) ?? [];

      return studentIds.length ? studentIds.join(", ") : "-";
    }

    return "-";
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ marginBottom: 8 }}>{title} ({items.length})</h3>

      {items.length === 0 && (
        <div style={{ opacity: 0.6 }}>No entries</div>
      )}

      {items.length > 0 && (
        <table width="100%" border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Actor ID</th>
              <th>Role</th>
              <th>Status</th>
              <th>Linked</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.actorId}</td>
                <td>{item.role}</td>
                <td>{item.status}</td>
                <td>{renderLinkedValue(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function CourseRosterTable({ roster }) {
  if (!roster) return null;

  return (
    <div>
      <Section title="Students" items={roster.students} />
      <Section title="Teachers" items={roster.teachers} />
      <Section title="Observers" items={roster.observers} />
      <Section title="Admins" items={roster.admins} />
      <Section title="Other" items={roster.other} />
    </div>
  );
}

export default CourseRosterTable;
