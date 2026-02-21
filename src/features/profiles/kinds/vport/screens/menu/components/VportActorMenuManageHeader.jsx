// src/features/profiles/kinds/vport/ui/menu/VportActorMenuManageHeader.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

export function VportActorMenuManageHeader({
  actorId,
  loading = false,
  onRefresh,
  onAddCategory,
  savingCategory = false,
  deletingCategory = false,
} = {}) {
  const navigate = useNavigate();

  const canShowQr = !!actorId;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Manage Menu</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          Create categories and items. Customers will see only active entries.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {/* ✅ NEW: QR button */}
        <button
          type="button"
          onClick={() => {
            if (!actorId) return;
            navigate(`/vport/${actorId}/menu/qr`);
          }}
          disabled={!canShowQr}
          style={{ padding: "8px 12px", borderRadius: 12 }}
        >
          QR
        </button>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            style={{ padding: "8px 12px", borderRadius: 12 }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        ) : null}

        {onAddCategory ? (
          <button
            type="button"
            onClick={onAddCategory}
            disabled={!actorId || savingCategory || deletingCategory}
            style={{ padding: "8px 12px", borderRadius: 12 }}
          >
            Add category
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default VportActorMenuManageHeader;
