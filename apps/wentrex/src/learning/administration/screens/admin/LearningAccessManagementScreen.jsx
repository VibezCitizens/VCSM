import React from "react";
import { useLearningAccessManagement } from "@/learning/administration/hooks/admin/useLearningAccessManagement";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";
import { AccessRow, GrantForm } from "@/learning/administration/components/admin/AccessManagementParts";

export function LearningAccessManagementScreen({
  supabase,
  user,
  actorId,
  onBack,
}) {
  const { data, error, isLoading, isSaving, reload, grantAccess, revokeAccess } =
    useLearningAccessManagement({
      supabase,
      userId: user?.id ?? null,
      actorId,
      enabled: Boolean(supabase && actorId),
    });

  const accessRecords = data?.accessRecords ?? [];

  if (isLoading) {
    return <LearningLoadingState label="Loading access records..." variant="home" />;
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px" }}>Learning Access Management</h2>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            {data?.grantedCount ?? 0} granted &middot; {data?.revokedCount ?? 0} revoked
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={reload}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid #222",
              background: "#222",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#fef3f2",
            color: "#b42318",
            border: "1px solid #fecdca",
          }}
        >
          {error.message ?? error.code ?? "An error occurred"}
        </div>
      )}

      <GrantForm isSaving={isSaving} onGrant={grantAccess} />

      {accessRecords.length === 0 ? (
        <div style={{ color: "#6b7280" }}>No access records yet.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th style={{ padding: "10px 12px" }}>Actor ID</th>
                <th style={{ padding: "10px 12px" }}>Status</th>
                <th style={{ padding: "10px 12px" }}>Granted At</th>
                <th style={{ padding: "10px 12px" }}>Revoked At</th>
                <th style={{ padding: "10px 12px" }}>Notes</th>
                <th style={{ padding: "10px 12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {accessRecords.map((record) => (
                <AccessRow
                  key={record.actorId}
                  record={record}
                  isSaving={isSaving}
                  onGrant={grantAccess}
                  onRevoke={revokeAccess}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LearningAccessManagementScreen;
