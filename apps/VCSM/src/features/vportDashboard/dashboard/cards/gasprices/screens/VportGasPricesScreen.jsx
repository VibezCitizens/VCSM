// src/features/profiles/kinds/vport/screens/gas/screens/VportGasPricesScreen.jsx
//
// ============================================================================
//  FROZEN — FUTURE FEATURE — NOT WIRED INTO ROUTES (2026-06-08)
// ============================================================================
//  The public gas-station view (/actor/:actorId/gas) was unwired from the
//  router on 2026-06-08. This screen is parked as a future feature and is NOT
//  reachable in the running app today.
//
//  DO NOT RUN VENOM / BLACKWIDOW / ELEKTRA (or any Red/Blue Team pass) against
//  this file. It is frozen and excluded from all governance and security audits
//  until it is intentionally un-frozen and re-wired.
//
//  Do not migrate this screen to useVportDashboardContext(). It is a PUBLIC
//  route with no VportDashboardProvider in its tree — the context hook would
//  throw. It keeps its own useVportOwnership() path by design.
//
//  TO RE-ENABLE (reverse of the unwiring), re-add:
//    1. lazyApp.jsx         — export const VportGasPricesScreen = lazyWithLog(...)
//    2. routes/index.jsx     — import + pass VportGasPricesScreen into protectedAppRoutes
//    3. protected/app.routes.jsx — destructure param + route:
//         { path: "/actor/:actorId/gas", element: <VportGasPricesScreen /> }
/**
 * FROZEN SCREEN
 *
 * Route:
 *   /actor/:actorId/gas
 *
 * Status:
 *   Feature frozen pending future product review.
 *
 * Rationale:
 *   Standalone public gas station page is not part of the active VCSM
 *   navigation model. Current gas experience is delivered through:
 *     - Central Feed gas cards
 *     - Dashboard Gas module
 *
 * Do not expand, refactor, migrate, or integrate this screen without
 * explicit product approval.
 *
 * GOVERNANCE:
 *   DO NOT RUN VENOM
 *   DO NOT RUN BLACK WIDOW
 *   DO NOT RUN ELECTRA
 *
 * Owner review required before reactivation.
 */
// FROZEN FEATURE
// Former route: /actor/:actorId/gas
// Removed intentionally.
// See VportGasPricesScreen.jsx freeze notice before restoring.
// ============================================================================

import React, { useMemo } from "react";
import { useParams } from "react-router-dom";

import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useVportOwnership } from "@/features/vportDashboard/hooks/useVportOwnership";
import { VportGasPricesView } from "@/features/vportDashboard/dashboard/cards/gasprices/screens/VportGasPricesView";

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
