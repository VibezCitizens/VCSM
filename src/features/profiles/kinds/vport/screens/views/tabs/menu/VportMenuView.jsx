// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuView.jsx

import React, { useMemo } from "react";

import { useIdentity } from "@/state/identity/identityContext";
import { useIsActorOwner } from "@/features/profiles/kinds/vport/hooks/menu/useIsActorOwner";

import VportMenuManageView from "@/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuManageView";
import VportActorMenuSection from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuSection";

/**
 * Smart Menu Tab
 * - Owner → full management
 * - Viewer → public read-only menu
 */
export default function VportMenuView({ profile } = {}) {
  const { identity } = useIdentity();

  const actorId = useMemo(() => {
    return profile?.actorId ?? profile?.actor_id ?? null;
  }, [profile]);

  const { isOwner, loading } = useIsActorOwner({
    actorId,
    viewerActorId: identity?.actorId,
  });

  if (!actorId) return null;
  if (loading) return null;

  // ✅ OWNER → full manage UI
  if (isOwner) {
    return <VportMenuManageView actorId={actorId} />;
  }

  // ✅ VIEWER → read-only public menu
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <VportActorMenuSection actorId={actorId} mode="public" />
    </div>
  );
}
