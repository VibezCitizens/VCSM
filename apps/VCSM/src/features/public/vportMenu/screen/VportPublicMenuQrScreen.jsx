import React, { useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import VportPublicMenuQrView from "@/features/public/vportMenu/view/VportPublicMenuQrView";
import { useActorCanonicalSlug } from "@/features/profiles/hooks/useActorCanonicalSlug";

export function VportPublicMenuQrScreen() {
  const params = useParams();
  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const { canonicalSlug, loading: slugLoading } = useActorCanonicalSlug(actorId);

  if (!actorId) return null;

  // Redirect to canonical slug URL once resolved
  if (!slugLoading && canonicalSlug) {
    return <Navigate to={`/profile/${canonicalSlug}/menu/qr`} replace />;
  }

  // Render QR view while slug is loading (no flash of empty)
  return <VportPublicMenuQrView actorId={actorId} />;
}

export default VportPublicMenuQrScreen;
