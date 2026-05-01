import React, { useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import VportPublicMenuView from "@/features/public/vportMenu/view/VportPublicMenuView";
import { useActorCanonicalSlug } from "@/features/profiles/adapters/profiles.adapter";

export function VportPublicMenuScreen() {
  const params = useParams();
  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const { canonicalSlug, loading: slugLoading } = useActorCanonicalSlug(actorId);

  if (!actorId) return null;

  // Once slug resolves, redirect to the canonical URL — handles bookmarked actorId links
  if (!slugLoading && canonicalSlug) {
    return <Navigate to={`/profile/${canonicalSlug}/menu`} replace />;
  }

  // Render menu content while slug is loading (no flash of empty)
  return <VportPublicMenuView actorId={actorId} />;
}

export default VportPublicMenuScreen;
