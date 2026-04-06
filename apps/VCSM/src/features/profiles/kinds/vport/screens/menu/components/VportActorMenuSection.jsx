// src/features/profiles/kinds/vport/ui/menu/VportActorMenuSection.jsx

import React, { useMemo } from "react";

import VportActorMenuManagePanel from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManagePanel";
import VportActorMenuPublicPanel from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuPublicPanel";

export function VportActorMenuSection({
  actorId,
  includeInactive = false,
  mode = "manage",
  className = "",
} = {}) {
  const canRender = useMemo(() => !!actorId, [actorId]);

  if (!canRender) return null;

  if (mode === "public") {
    return (
      <section
        className={className}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <VportActorMenuPublicPanel actorId={actorId} />
      </section>
    );
  }

  return (
    <section
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <VportActorMenuManagePanel
        actorId={actorId}
        includeInactive={includeInactive}
        showHeader={true}
      />
    </section>
  );
}

export default VportActorMenuSection;
