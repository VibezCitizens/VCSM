// src/features/wanders/screens/WandersCreate.screen.jsx
// ============================================================================
// WANDERS SCREEN — CREATE (Routing)
// Contract: route + identity inputs -> choose experience.
// - no hooks for data/workflow
// - no controllers
// ============================================================================

import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

import WandersCreateView from "@/features/wanders/screens/view/WandersCreate.view.jsx";

export default function WandersCreateScreen({ realmId: realmIdProp, baseUrl: baseUrlProp }) {
  const location = useLocation();

  const realmId = useMemo(() => {
    return realmIdProp || location?.state?.realmId || null;
  }, [realmIdProp, location?.state?.realmId]);

  const baseUrl = useMemo(() => {
    if (baseUrlProp) return baseUrlProp;
    if (location?.state?.baseUrl) return location.state.baseUrl;
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {}
    return "";
  }, [baseUrlProp, location?.state?.baseUrl]);

  return <WandersCreateView realmId={realmId} baseUrl={baseUrl} />;
}
