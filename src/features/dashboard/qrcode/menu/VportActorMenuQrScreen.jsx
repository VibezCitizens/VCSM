
import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import VportActorMenuQrView from "@/features/dashboard/qrcode/menu/VportActorMenuQrView";

export function VportActorMenuQrScreen() {
  const params = useParams();
  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  if (!actorId) return null;

  return <VportActorMenuQrView actorId={actorId} />;
}

export default VportActorMenuQrScreen;
