// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuView.jsx

import React, { useMemo } from "react";

import { useIdentity } from "@/state/identity/identityContext";
import { useIsActorOwner } from "@/features/profiles/kinds/vport/hooks/menu/useIsActorOwner";

import VportMenuManageView from "@/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuManageView";
import VportActorMenuSection from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuSection";

import MenuReviewCTA from "./components/MenuReviewCTA";

/**
 * Smart Menu Tab
 * - Owner → full management
 * - Viewer → public read-only menu (+ Review Food CTA)
 */
export default function VportMenuView({ profile, onOpenFoodReview } = {}) {
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

  // ✅ VIEWER → read-only public menu + CTA
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <VportActorMenuSection actorId={actorId} mode="public" />

      {/* ✅ Review Food CTA */}
      {typeof onOpenFoodReview === "function" ? (
        <MenuReviewCTA onClick={onOpenFoodReview} label="Review Food" />
      ) : null}
    </div>
  );
}
