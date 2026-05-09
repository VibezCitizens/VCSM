import React from "react";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ isActive }) {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: isActive ? "#dcfce7" : "#f3f4f6",
        color: isActive ? "#166534" : "#6b7280",
      }}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function TenantRow({ tenant, onOpen }) {
  return (
    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{tenant.name}</div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280", marginTop: 2 }}>
          /{tenant.slug}
        </div>
      </td>
      <td style={{ padding: "12px 14px" }}>
        <StatusBadge isActive={tenant.isActive} />
      </td>
      <td style={{ padding: "12px 14px", fontSize: 14, color: "#374151" }}>
        {tenant.organizationCount}
      </td>
      <td style={{ padding: "12px 14px", fontSize: 14, color: "#374151" }}>
        {tenant.activeCourses}{" "}
        <span style={{ color: "#9ca3af" }}>/ {tenant.totalCourses}</span>
      </td>
      <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>
        {formatDate(tenant.createdAt)}
      </td>
      <td style={{ padding: "12px 14px" }}>
        <button
          type="button"
          onClick={() => onOpen(tenant)}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid #0f4a72",
            background: "#0f4a72",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Open
        </button>
      </td>
    </tr>
  );
}

export default TenantRow;
