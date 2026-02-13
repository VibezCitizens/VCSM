// ============================================================================
// WANDERS SCREEN — SENT (Routing Boundary)
// Owns route parsing + identity resolution only.
// No hooks, no DAL, no controllers.
// ============================================================================

import React, { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";

import { resolveRealm } from "@/features/upload/model/resolveRealm";
import WandersSentView from "@/features/wanders/screens/view/WandersSent.view";

// ---------------------------------------------
// Helpers
// ---------------------------------------------

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

// ---------------------------------------------
// Screen
// ---------------------------------------------

export default function WandersSentScreen() {
  const params = useParams();
  const query = useQuery();

  // Route-derived public id
  const cardPublicId = useMemo(() => {
    return (params.cardPublicId || query.get("card") || "").trim();
  }, [params.cardPublicId, query]);

  // Realm resolution (identity-level decision only)
  const realmId = resolveRealm(false);

  // Base URL resolution (environment-level only)
  const baseUrl = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
      }
    } catch {
      // no-op
    }
    return "";
  }, []);

  // Screen delegates everything to the View
  return (
    <WandersSentView
      cardPublicId={cardPublicId}
      realmId={realmId}
      baseUrl={baseUrl}
    />
  );
}
