// src/features/profiles/kinds/vport/ui/menu/VportActorMenuSection.jsx

import React, { useMemo } from "react";

import VportActorMenuManagePanel from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuManagePanel";

/**
 * UI Section: wraps the Vport Actor Menu management UI
 *
 * Contract:
 * - Pure composition wrapper
 * - No DAL / no Supabase
 *
 * Props:
 * - actorId: uuid (required)
 * - includeInactive: boolean
 */
export function VportActorMenuSection({
  actorId,
  includeInactive = false,
  className = "",
} = {}) {
  const canRender = useMemo(() => !!actorId, [actorId]);

  if (!canRender) return null;

  return (
    <section className={className} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <VportActorMenuManagePanel actorId={actorId} includeInactive={includeInactive} />
    </section>
  );
}

export default VportActorMenuSection;
