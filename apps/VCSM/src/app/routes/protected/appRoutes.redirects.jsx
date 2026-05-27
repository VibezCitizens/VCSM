/* eslint-disable react-refresh/only-export-components */

import { Navigate, Outlet, useParams } from "react-router-dom";
import { useIdentity } from "@/state/identity/identityContext";
import { releaseFlags } from "@/shared/config/releaseFlags";

/**
 * Route-level UX gate for all /actor/:actorId/dashboard/* routes.
 * Verifies the URL actorId matches the session identity's actorId and
 * redirects non-owners to /feed before any screen or hook renders.
 *
 * PORT-V-006/008 — SECURITY SCOPE CLARIFICATION:
 * This guard is a UI convenience only. It is NOT the authoritative security
 * boundary. All mutation controllers independently verify actor ownership
 * via vc.actor_owners before performing any write operation. This guard
 * prevents rendering the dashboard UI for non-owners; controllers prevent
 * any write regardless of how a caller reaches a mutation path.
 *
 * actorId is read from useParams() (URL), NOT from the identity store —
 * this is intentional. The URL is the resource identifier; identity.actorId
 * is the caller. Mismatches are denied here at the route level.
 */
export function OwnerOnlyDashboardGuard() {
  const { actorId } = useParams()
  const { identity, identityLoading } = useIdentity()

  if (identityLoading) return null
  if (!identity) return <Navigate to="/feed" replace />
  if (!actorId || String(identity.actorId) !== String(actorId)) {
    return <Navigate to="/feed" replace />
  }

  return <Outlet />
}

export function BlockedVportGuard() {
  const { identity, loading, blockedVport } = useIdentity()
  if (loading) return null
  if (!identity) return <Navigate to="/feed" replace />
  if (blockedVport) return <Navigate to="/vport/restore" replace />
  return <Outlet />
}

export function VportToActorDashboardRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/dashboard`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function VportToActorSettingsRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/settings`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function VportToActorAdsRedirect() {
  const { actorId } = useParams();
  if (!releaseFlags.vportAdsPipeline) return <Navigate to="/feed" replace />;
  return actorId ? (
    <Navigate to={`/ads/vport/${actorId}`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function VportToActorFlyerEditRedirect() {
  const { actorId } = useParams();
  if (!releaseFlags.vportFlyerEditor) return <Navigate to="/feed" replace />;
  return actorId ? (
    <Navigate to={`/actor/${actorId}/menu/flyer/edit`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function VportToActorMenuQrRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/menu/qr`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function VportToActorMenuFlyerRedirect() {
  const { actorId } = useParams();
  if (!releaseFlags.vportPrintableFlyer) return <Navigate to="/feed" replace />;
  return actorId ? (
    <Navigate to={`/actor/${actorId}/menu/flyer`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function VportToActorDashboardReviewsRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/dashboard/reviews`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function VportToActorDashboardLeadsRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/dashboard/leads`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function VportToActorDashboardExchangeRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/dashboard/exchange`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function VportToActorDashboardCalendarRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/dashboard/calendar`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}
