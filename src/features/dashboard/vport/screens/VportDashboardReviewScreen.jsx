// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\dashboard\vport\screens\VportDashboardReviewScreen.jsx
import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import VportReviewsView from "@/features/profiles/kinds/vport/screens/review/VportReviewsView";

/* ============================================================
   FINAL SCREEN: routing-level composition boundary
   - no DAL
   - no controllers
   - no fetching
   ============================================================ */

export default function VportDashboardReviewScreen({ targetActorId: targetActorIdProp }) {
  const params = useParams();

  const targetActorId = useMemo(() => {
    return targetActorIdProp ?? params?.actorId ?? null;
  }, [targetActorIdProp, params]);

  return (
    <div className="w-full">
      <VportReviewsView targetActorId={targetActorId} mode="owner" />
    </div>
  );
}