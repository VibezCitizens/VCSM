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

  const openDashboard = useCallback(() => {
    if (!effectiveActorId) return;
    navigate(`/vport/${effectiveActorId}/dashboard`);
  }, [navigate, effectiveActorId]);

  if (!canRender) return null;

  const dashboardBtn = {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    lineHeight: 1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Top row: just pills (no title/subtitle text) */}
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
            hideHeader={true} // ✅ hides "Manage Menu" + subtitle
            includeInactive={includeInactive}
            onToggleIncludeInactive={handleToggleIncludeInactive}
          />
        </div>

        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            paddingTop: 2,
          }}
        >
          <button type="button" onClick={openDashboard} style={dashboardBtn}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>▦</span>
            Dashboard
          </button>
        </div>
      </div>

      <VportActorMenuManagePanel
        actorId={effectiveActorId}
        includeInactive={includeInactive}
        showHeader={false}
      />
    </div>
  );
}

export default VportMenuManageView;
