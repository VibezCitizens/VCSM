import React, { useMemo } from "react";
import { useParams } from "react-router-dom";

import VportActorMenuPublicView from "@/features/profiles/kinds/vport/screens/views/VportActorMenuPublicView";

export function VportActorMenuPublicScreen() {
  const params = useParams();
  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  // minimal guard (screens can hard-guard)
  if (!actorId) return null;

  return <VportActorMenuPublicView actorId={actorId} />;
}

export default VportActorMenuPublicScreen;
