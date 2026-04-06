// src/features/profiles/kinds/vport/screens/gas/screens/VportGasPricesScreen.jsx

import React, { useMemo } from "react";
import { useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import { VportGasPricesView } from "@/features/profiles/kinds/vport/screens/gas/view/VportGasPricesView";

export function VportGasPricesScreen({ actorId: actorIdProp }) {
  const params = useParams();
  const { identity } = useIdentity();

  const actorId = useMemo(() => {
    return actorIdProp ?? params?.actorId ?? null;
  }, [actorIdProp, params]);

  if (!actorId) {
    return <div className="p-6 text-sm text-neutral-400">Invalid station.</div>;
  }

  return (
    <div className="p-6">
      <VportGasPricesView actorId={actorId} identity={identity} />
    </div>
  );
}

export default VportGasPricesScreen;
