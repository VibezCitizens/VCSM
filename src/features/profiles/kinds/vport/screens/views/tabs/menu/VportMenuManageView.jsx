// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuManageView.jsx

import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import VportActorMenuToolbar from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuToolbar";
import VportActorMenuManagePanel from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuManagePanel";

export function VportMenuManageView({ actorId, profile } = {}) {
  const navigate = useNavigate();
  const [includeInactive, setIncludeInactive] = useState(false);

  const effectiveActorId = useMemo(() => {
    return (
      actorId ??
      profile?.actorId ??
      profile?.actor_id ??
      profile?.id ??
      null
    );
  }, [actorId, profile]);

  const canRender = useMemo(() => !!effectiveActorId, [effectiveActorId]);

  const handleToggleIncludeInactive = useCallback((next) => {
    setIncludeInactive(!!next);
  }, []);

  const openQr = useCallback(() => {
    if (!effectiveActorId) return;
    navigate(`/vport/${effectiveActorId}/menu/qr`);
  }, [navigate, effectiveActorId]);

  if (!canRender) return null;

  const btn = {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Top bar: existing toolbar + QR button */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <VportActorMenuToolbar
            title="Manage Menu"
            subtitle="Create categories and items for your VPORT menu."
            includeInactive={includeInactive}
            onToggleIncludeInactive={handleToggleIncludeInactive}
          />
        </div>

        <div style={{ flexShrink: 0, display: "flex", gap: 8 }}>
          <button type="button" onClick={openQr} style={btn}>
            QR Code
          </button>
        </div>
      </div>

      <VportActorMenuManagePanel
        actorId={effectiveActorId}
        includeInactive={includeInactive}
        showHeader={false} // ✅ removes duplicate header
      />
    </div>
  );
}

export default VportMenuManageView;
