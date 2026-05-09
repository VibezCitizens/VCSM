function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TenantRow({ tenant, onOpen }) {
  return (
    <tr>
      <td>
        <div className="sa-tenant-name">{tenant.name}</div>
        <div className="sa-tenant-slug">/{tenant.slug}</div>
      </td>
      <td>
        <span className={`sa-badge ${tenant.isActive ? "active" : "inactive"}`}>
          {tenant.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td>{tenant.organizationCount}</td>
      <td>
        {tenant.activeCourses}
        <span style={{ color: "var(--sa-text-dim)" }}>
          {" "}
          / {tenant.totalCourses}
        </span>
      </td>
      <td style={{ color: "var(--sa-text-dim)", fontSize: 13 }}>
        {formatDate(tenant.createdAt)}
      </td>
      <td>
        <button
          type="button"
          className="sa-btn-open"
          onClick={() => onOpen(tenant)}
        >
          Open
        </button>
      </td>
    </tr>
  );
}
