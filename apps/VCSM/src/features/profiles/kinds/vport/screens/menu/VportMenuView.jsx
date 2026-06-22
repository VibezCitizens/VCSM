// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportMenuView.jsx

import React, { useMemo } from "react";

import { useVportProfileContext } from "@/features/profiles/kinds/vport/context/VportProfileContext";

import VportMenuManageView from "@/features/profiles/kinds/vport/screens/menu/VportMenuManageView";
import VportActorMenuSection from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuSection";

import MenuReviewCTA from "./components/MenuReviewCTA";

/**
 * Smart Menu Tab
 * - Owner: full management (authorization.canManage from VportProfileContext)
 * - Viewer: public read-only menu (+ Review Food CTA)
 */
export default function VportMenuView({ profile, onOpenFoodReview } = {}) {
  const { authorization } = useVportProfileContext();

  const actorId = useMemo(() => {
    return profile?.actorId ?? profile?.actor_id ?? null;
  }, [profile]);

  if (!actorId) return null;

  // OWNER â†’ full manage UI
  if (authorization.canManage) {
    return <VportMenuManageView actorId={actorId} />;
  }

  // VIEWER â†’ read-only public menu + CTA
  return (
    <div className="profiles-card rounded-2xl p-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Review Food CTA */}
      {typeof onOpenFoodReview === "function" ? (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <MenuReviewCTA onClick={onOpenFoodReview} label="Review Food" />
        </div>
      ) : null}

      <VportActorMenuSection actorId={actorId} mode="public" />
    </div>
  );
}

