import React from "react";

function StatusPill({ tone, label }) {
  const stylesByTone = {
    success: {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    },
    warning: {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    },
    neutral: {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 700,
        ...stylesByTone[tone],
      }}
    >
      {label}
    </span>
  );
}

export function AdminEntryMembershipCard({ membership }) {
  const hasRealmRoute = Boolean(membership.realmSlug);

  return (
    <div
      style={{
        border: "1px solid #dbe3ec",
        borderRadius: 16,
        padding: 18,
        background: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#08111b" }}>
            {membership.organizationName}
          </div>
          <div style={{ fontSize: 13, color: "#5f6f82", marginTop: 4 }}>
            Role: {membership.role}
          </div>
        </div>

        <StatusPill
          tone={hasRealmRoute ? "success" : "warning"}
          label={hasRealmRoute ? "Workspace Ready" : "Setup Required"}
        />
      </div>

      <div style={{ display: "grid", gap: 6, fontSize: 14, color: "#324154" }}>
        <div>
          Organization slug: {membership.organizationSlug ?? "Not set"}
        </div>
        <div>
          Learning workspace: {membership.realmName ?? "Not configured"}
        </div>
        <div>
          Realm slug: {membership.realmSlug ?? "Not available yet"}
        </div>
      </div>
    </div>
  );
}

export default AdminEntryMembershipCard;
