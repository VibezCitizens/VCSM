// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuView.jsx

import React, { useMemo } from "react";

import { useIdentity } from "@/state/identity/identityContext";

import VportMenuManageView from "@/features/profiles/kinds/vport/screens/menu/VportMenuManageView";
import VportActorMenuSection from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuSection";

import MenuReviewCTA from "./components/MenuReviewCTA";

/**
 * Smart Menu Tab
 * - Owner â†’ full management
 * - Viewer â†’ public read-only menu (+ Review Food CTA)
 */
export default function VportMenuView({ profile, onOpenFoodReview } = {}) {
  const { identity } = useIdentity();

  const actorId = useMemo(() => {
    return profile?.actorId ?? profile?.actor_id ?? null;
  }, [profile]);

  const isOwner = useMemo(() => {
    const viewerId = identity?.actorId ?? null;
    if (!viewerId || !actorId) return false;
    return String(viewerId) === String(actorId);
  }, [identity, actorId]);

  if (!actorId) return null;

  // âœ… OWNER â†’ full manage UI
  if (isOwner) {
    return <VportMenuManageView actorId={actorId} />;
  }

  // âœ… VIEWER â†’ read-only public menu + CTA
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <VportActorMenuSection actorId={actorId} mode="public" />

      {/* âœ… Review Food CTA */}
      {typeof onOpenFoodReview === "function" ? (
        <MenuReviewCTA onClick={onOpenFoodReview} label="Review Food" />
      ) : null}
    </div>
  );
}

