// src/features/profiles/kinds/vport/hooks/services/useVportServices.js

import { useCallback, useEffect, useMemo, useState } from "react";
import getVportServicesController from "@/features/profiles/kinds/vport/controller/services/getVportServices.controller";

function normalizeVportType(v) {
  const s = (v ?? "").toString().trim();
  return s || null;
}

export default function useVportServices({
  identityActorId = null, // kept for future use
  targetActorId = null,
  asOwner = false,
  vportType: vportTypeProp = null,
} = {}) {
  const vportType = useMemo(
    () => normalizeVportType(vportTypeProp),
    [vportTypeProp]
  );

  // DEBUG: prove hook input + computed value
  useEffect(() => {
    console.groupCollapsed("[useVportServices][DEBUG input]");
    console.debug({
      targetActorId: targetActorId ?? null,
      asOwner: Boolean(asOwner),
      identityActorId: identityActorId ?? null,
      vportTypeProp: vportTypeProp ?? null,
      vportTypeComputed: vportType ?? null,
      note:
        "If vportTypeComputed is 'vport', then some caller passed vportTypeProp='vport' into VportServicesView/useVportServices.",
    });
    console.groupEnd();
  }, [targetActorId, asOwner, identityActorId, vportTypeProp, vportType]);

  const [isLoading, setIsLoading] = useState(Boolean(targetActorId));
  const [error, setError] = useState(null);
  const [data, setData] = useState(() => ({
    vportType,
    mode: asOwner ? "owner" : "viewer",
    services: [],
    addons: { general: [], byParent: {} },
  }));

  const refetch = useCallback(async () => {
    if (!targetActorId) return;

    setError(null);
    setIsLoading(true);

    try {
      // DEBUG: prove what we send into controller
      console.groupCollapsed("[useVportServices][DEBUG controller call]");
      console.debug({
        targetActorId,
        vportType,
        asOwner: Boolean(asOwner),
      });
      console.groupEnd();

      const res = await getVportServicesController({
        targetActorId,
        vportType,
        asOwner: Boolean(asOwner),
      });

      setData({
        vportType: res?.vportType ?? vportType ?? null,
        mode: res?.mode ?? (asOwner ? "owner" : "viewer"),
        services: res?.services ?? [],
        addons: res?.addons ?? { general: [], byParent: {} },
      });
    } catch (e) {
      setData({
        vportType: vportType ?? null,
        mode: asOwner ? "owner" : "viewer",
        services: [],
        addons: { general: [], byParent: {} },
      });
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [targetActorId, asOwner, vportType, identityActorId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive) return;
      await refetch();
    })();

    return () => {
      alive = false;
    };
  }, [refetch]);

  return { isLoading, error, data, refetch };
}