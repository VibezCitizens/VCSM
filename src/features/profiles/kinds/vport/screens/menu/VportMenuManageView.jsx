// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuManageView.jsx

import React, { useMemo, useState, useCallback } from "react";

import VportActorMenuToolbar from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuToolbar";
import VportActorMenuManagePanel from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManagePanel";

export function VportMenuManageView({ actorId, profile } = {}) {
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

  if (!canRender) return null;

  return (
    <div className="profiles-card rounded-2xl p-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            hideHeader={true} // hides "Manage Menu" + subtitle
            includeInactive={includeInactive}
            onToggleIncludeInactive={handleToggleIncludeInactive}
          />
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

