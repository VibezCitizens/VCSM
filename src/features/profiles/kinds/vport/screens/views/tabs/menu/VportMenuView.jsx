// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuView.jsx

import React, { useMemo, useState, useCallback } from "react";

import VportActorMenuSection from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuSection";

/**
 * Screen/View: Vport Menu tab (owner management UI)
 *
 * Expects:
 * - `actorId` passed in from parent (the vport's actor id)
 * - No DAL here, only UI composition
 */
export function VportMenuView({ actorId } = {}) {
  const [includeInactive, setIncludeInactive] = useState(false);

  const canRender = useMemo(() => !!actorId, [actorId]);

  const handleToggleIncludeInactive = useCallback((next) => {
    setIncludeInactive(!!next);
  }, []);

  if (!canRender) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <VportActorMenuSection actorId={actorId} includeInactive={includeInactive} />
    </div>
  );
}

export default VportMenuView;
