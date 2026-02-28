import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import VportPublicMenuView from "@/features/public/vportMenu/view/VportPublicMenuView";

export function VportPublicMenuScreen() {
  const params = useParams();
  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  if (!actorId) return null;
  return <VportPublicMenuView actorId={actorId} />;
}

export default VportPublicMenuScreen;
