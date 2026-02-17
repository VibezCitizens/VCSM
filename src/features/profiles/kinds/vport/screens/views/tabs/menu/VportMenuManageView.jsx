// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuManageView.jsx

import React, { useMemo, useState, useCallback } from "react";

import VportActorMenuToolbar from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuToolbar";
import VportActorMenuManagePanel from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuManagePanel";

/**
 * Screen/View: Vport Menu Manage tab (owner menu management)
 *
 * Props:
 * - actorId?: uuid
 * - profile?: object (legacy caller) containing id / actor_id
 */
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <VportActorMenuToolbar
        title="Menu"
        subtitle="Create categories and items for your VPORT menu."
        includeInactive={includeInactive}
        onToggleIncludeInactive={handleToggleIncludeInactive}
      />

      <VportActorMenuManagePanel
        actorId={effectiveActorId}
        includeInactive={includeInactive}
      />
    </div>
  );
}

export default VportMenuManageView;
