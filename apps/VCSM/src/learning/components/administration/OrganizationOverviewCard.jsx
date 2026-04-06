import React from "react";

function Item({ label, value }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

export function OrganizationOverviewCard({ organization, summary }) {
  if (!organization) return null;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <h2>{organization.name}</h2>

      <div style={{ marginTop: 12 }}>
        <Item label="Total Courses" value={summary?.totalCourses ?? 0} />
        <Item label="Active Courses" value={summary?.activeCourses ?? 0} />
        <Item label="Draft Courses" value={summary?.draftCourses ?? 0} />
        <Item label="Archived Courses" value={summary?.archivedCourses ?? 0} />

        <hr />

        <Item label="Total Members" value={summary?.totalMembers ?? 0} />
        <Item label="Students" value={summary?.studentCount ?? 0} />
        <Item label="Teachers" value={summary?.teacherCount ?? 0} />
        <Item label="Parents" value={summary?.observerCount ?? 0} />
        <Item label="Admins" value={summary?.adminCount ?? 0} />
      </div>
    </div>
  );
}

export default OrganizationOverviewCard;
