// src/features/profiles/kinds/vport/screens/VportActorMenuFlyerScreen.jsx

import React, { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import VportActorMenuFlyerView from "@/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView";


export function VportActorMenuFlyerScreen() {
  const params = useParams();
  const [searchParams] = useSearchParams();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  const variant = useMemo(() => {
    const v = (searchParams.get("variant") || "classic").toLowerCase();
    return v === "poster" ? "poster" : "classic";
  }, [searchParams]);

  if (!actorId) return null;

  return <VportActorMenuFlyerView actorId={actorId} variant={variant} />;
}

export default VportActorMenuFlyerScreen;
