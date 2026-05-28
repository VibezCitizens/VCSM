// src/features/profiles/kinds/vport/screens/gas/screens/VportGasPricesScreen.jsx

import React, { useMemo } from "react";
import { useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import { VportGasPricesView } from "@/features/dashboard/vport/dashboard/cards/gasprices/screens/VportGasPricesView";

export function VportGasPricesScreen({ actorId: actorIdProp }) {
  const params = useParams();
  const { identity } = useIdentity();

  const actorId = useMemo(() => {
    return actorIdProp ?? params?.actorId ?? null;
  }, [actorIdProp, params]);

  const viewerActorId = identity?.actorId ?? null;
  const { isOwner } = useVportOwnership(viewerActorId, actorId);

  if (!actorId) {
    return <div className="p-6 text-sm text-white/50">Invalid station.</div>;
  }

  return (
    <div className="p-6">
      <VportGasPricesView actorId={actorId} identity={identity} isOwner={isOwner} />
    </div>
  );
}

export default VportGasPricesScreen;
