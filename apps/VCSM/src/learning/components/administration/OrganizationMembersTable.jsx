import React from "react";

export function OrganizationMembersTable({ members = [] }) {
  return (
    <div>
      <h3>Organization Members ({members.length})</h3>

      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Actor ID</th>
            <th>Org Role</th>
            <th>Status</th>
            <th>Student</th>
            <th>Teacher</th>
            <th>Observer</th>
            <th>Admin</th>
          </tr>
        </thead>

        <tbody>
          {members.map((member) => (
            <tr key={member.actorId}>
              <td>{member.actorId}</td>

              <td>{member.organizationMembership?.role ?? "-"}</td>
              <td>{member.organizationMembership?.status ?? "-"}</td>

              <td>{member.courseMembershipCounts.student}</td>
              <td>{member.courseMembershipCounts.teacher}</td>
              <td>{member.courseMembershipCounts.observer}</td>
              <td>{member.courseMembershipCounts.admin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrganizationMembersTable;