import React, { useState } from "react";
import { usePlatformAdmins } from "@/learning/administration/hooks/admin/usePlatformAdmins";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminRow({ admin, isSaving, currentActorId, onRemove }) {
  const isSelf = admin.actorId === currentActorId;

  return (
    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
        {admin.actorId}
        {isSelf && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              fontWeight: 600,
              color: "#6b7280",
              fontFamily: "sans-serif",
            }}
          >
            (you)
          </span>
        )}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13, color: "#6b7280" }}>
        {formatDate(admin.createdAt)}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <button
          type="button"
          disabled={isSaving || isSelf}
          onClick={() => onRemove({ targetActorId: admin.actorId })}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #fca5a5",
            background: "#fff",
            color: isSelf ? "#9ca3af" : "#dc2626",
            cursor: isSaving || isSelf ? "not-allowed" : "pointer",
            fontSize: 13,
          }}
          title={isSelf ? "You cannot remove yourself" : undefined}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

function AddAdminForm({ isSaving, onAdd }) {
  const [targetActorId, setTargetActorId] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!targetActorId.trim()) return;
    onAdd({ targetActorId: targetActorId.trim() }).then((result) => {
      if (result?.ok) {
        setTargetActorId("");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <h4 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>
        Add Platform Admin
      </h4>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: 260 }}>
          <label
            style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}
          >
            Actor ID *
          </label>
          <input
            value={targetActorId}
            onChange={(e) => setTargetActorId(e.target.value)}
            placeholder="vc actor UUID"
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 14,
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSaving || !targetActorId.trim()}
          style={{
            padding: "8px 18px",
            borderRadius: 6,
            border: "none",
            background: isSaving || !targetActorId.trim() ? "#9ca3af" : "#1d4ed8",
            color: "#fff",
            cursor: isSaving || !targetActorId.trim() ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {isSaving ? "Saving..." : "Add Admin"}
        </button>
      </div>
    </form>
  );
}

export function LearningPlatformAdminsScreen({ supabase, user, actorId, onBack }) {
  const { data, error, isLoading, isSaving, reload, addAdmin, removeAdmin } =
    usePlatformAdmins({
      supabase,
      userId: user?.id ?? null,
      actorId,
      enabled: Boolean(supabase && actorId),
    });

  const admins = data?.admins ?? [];

  if (isLoading) {
    return <LearningLoadingState label="Loading platform admins..." variant="home" />;
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
          <h2 style={{ margin: "0 0 4px" }}>Platform Admins</h2>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            {data?.adminCount ?? 0} admin{data?.adminCount !== 1 ? "s" : ""}
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

      <AddAdminForm isSaving={isSaving} onAdd={addAdmin} />

      {admins.length === 0 ? (
        <div style={{ color: "#6b7280" }}>No platform admins found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th style={{ padding: "10px 12px" }}>Actor ID</th>
                <th style={{ padding: "10px 12px" }}>Added At</th>
                <th style={{ padding: "10px 12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <AdminRow
                  key={admin.actorId}
                  admin={admin}
                  isSaving={isSaving}
                  currentActorId={actorId}
                  onRemove={removeAdmin}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LearningPlatformAdminsScreen;
