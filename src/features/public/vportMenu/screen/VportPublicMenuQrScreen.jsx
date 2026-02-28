import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import VportPublicMenuQrView from "@/features/public/vportMenu/view/VportPublicMenuQrView";

export function VportPublicMenuQrScreen() {
  const params = useParams();
  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  if (!actorId) return null;
  return <VportPublicMenuQrView actorId={actorId} />;
}

export default VportPublicMenuQrScreen;
