import { useEffect, useRef } from "react";
import { appendIOSProdDebugLog } from "@/shared/lib/iosProdDebugger";

export function useProfileRouteTelemetry({
  hasLoggedRenderRef,
  routeParam,
  debugMode,
  isSelf,
  actorIdForSelf,
  uuidFromParam,
  hasUuidInUrl,
  slugToResolve,
  slugResolveLoading,
  slugNotFound,
  slugResolveErrorCode,
  slugResolveErrorMessage,
  actorIdFromSlug,
  resolvedActorId,
  canonicalSlug,
  slugLoading,
  kindLoading,
  kind,
  identityLoading,
  identityActorId,
}) {
  const lastTraceRef = useRef("");

  useEffect(() => {
    hasLoggedRenderRef.current = false;
    appendIOSProdDebugLog("profile_route_enter", { routeParam, debugMode });
  }, [routeParam, debugMode]);

  useEffect(() => {
    const snapshot = {
      routeParam,
      isSelf,
      actorIdForSelf,
      uuidFromParam,
      hasUuidInUrl,
      slugToResolve,
      slugResolveLoading,
      slugNotFound,
      slugResolveErrorCode,
      slugResolveErrorMessage,
      actorIdFromSlug,
      resolvedActorId,
      canonicalSlug,
      slugLoading,
      kindLoading,
      kind,
      identityLoading,
      identityActorId,
    };
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastTraceRef.current) return;
    lastTraceRef.current = serialized;
    appendIOSProdDebugLog("profile_route_state", snapshot);
  }, [
    routeParam,
    isSelf,
    actorIdForSelf,
    uuidFromParam,
    hasUuidInUrl,
    slugToResolve,
    slugResolveLoading,
    slugNotFound,
    slugResolveErrorCode,
    slugResolveErrorMessage,
    actorIdFromSlug,
    resolvedActorId,
    canonicalSlug,
    slugLoading,
    kindLoading,
    kind,
    identityLoading,
    identityActorId,
  ]);
}
