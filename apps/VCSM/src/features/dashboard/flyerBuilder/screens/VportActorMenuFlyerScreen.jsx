// src/features/profiles/kinds/vport/screens/VportActorMenuFlyerScreen.jsx

import React, { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import VportActorMenuFlyerView from "@/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView";

/**
 * Auth gate mirrors VportActorMenuFlyerEditorScreen — only the VPORT owner can
 * view and print their own flyer. Prevents unauthenticated visitors from
 * generating print materials for any VPORT (VENOM V-008).
 */
export function VportActorMenuFlyerScreen() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { identity, identityLoading } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId);

  const variant = useMemo(() => {
    const v = (searchParams.get("variant") || "classic").toLowerCase();
    if (v === "poster") return "poster";
    if (v === "sticker") return "sticker";
    if (v === "table") return "table";
    if (v === "half") return "half";
    if (v === "full") return "full";
    return "classic";
  }, [searchParams]);

  if (!actorId) return null;

  if (identityLoading || ownershipLoading) {
    return <div className="p-10 text-center text-white/50">Loading…</div>;
  }
  if (!identity) {
    return <div className="p-10 text-center text-white/50">Sign in to view this flyer.</div>;
  }
  if (!isOwner) {
    return <div className="p-10 text-center text-white/50">You can only view flyers for your own vport.</div>;
  }

  return <VportActorMenuFlyerView actorId={actorId} variant={variant} />;
}

export default VportActorMenuFlyerScreen;
