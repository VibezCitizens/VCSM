// src/features/profiles/screens/ActorProfileScreen.jsx
// ─────────────────────────────────────────────────────────────
// Entry point for all /profile/:actorId routes.
//
// URL formats handled:
//   "self"                    → viewer's own profile — redirects to canonical
//   {vport-slug}              → canonical vport URL   e.g. "tyba-restaurant"
//   {username}                → canonical user URL    e.g. "architect"
//   bare UUID                 → legacy: redirect to canonical
//   {uuid}-{suffix}           → legacy: redirect to canonical
//
// Resolution flow:
//   "self"         → identity.actorId known → fetch canonical slug → redirect
//   UUID in param  → actorId known          → fetch canonical slug → redirect
//   No UUID        → resolveActorBySlug(param) → actorId → render
//
// Strict rule: every route must resolve through one of the three paths above.
// State handoff from redirects is NOT used to bypass slug resolution.
// ─────────────────────────────────────────────────────────────

import { useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

import { useActorKind } from "@/features/profiles/hooks/useActorKind";
import { useVportType } from "@/features/profiles/hooks/useVportType";
import { useActorCanonicalSlug } from "@/features/profiles/hooks/useActorCanonicalSlug";
import { useActorSlugRedirect } from "@/features/profiles/hooks/useActorSlugRedirect";
import { useResolveActorBySlug } from "@/features/profiles/hooks/useResolveActorBySlug";
import { useVportProfileBySlug } from "@/features/profiles/kinds/vport/hooks/useVportProfileBySlug";

import { PROFILE_KIND_REGISTRY } from "@/features/profiles/kinds/profileKindRegistry";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { extractActorIdFromSlug } from "@/shared/lib/actorSlug";
import { appendIOSProdDebugLog } from "@/shared/lib/iosProdDebugger";
import "@/features/profiles/styles/profiles-modern.css";

import { ActorProfileDevProbe } from "@/features/profiles/screens/components/ActorProfileDevProbe";
import { ActorProfileProdDebugPanel } from "@/features/profiles/screens/components/ActorProfileProdDebugPanel";
import { useProfileRouteTelemetry } from "@/features/profiles/screens/hooks/useProfileRouteTelemetry";

const SKELETON = (
  <div className="profiles-modern px-4 py-6">
    <SkeletonCardList count={2} bodyHeight="h-48" />
  </div>
);

export default function ActorProfileScreen() {
  const { actorId: routeParam } = useParams();
  const { identity, identityLoading } = useIdentity();
  const hasLoggedRenderRef = useRef(false);

  const debugMode = typeof localStorage !== "undefined" && !!localStorage.getItem("__vcsm_dbg");

  const isSelf = routeParam === "self";
  const actorIdForSelf = isSelf ? (identity?.actorId ?? null) : null;

  const uuidFromParam = isSelf ? null : extractActorIdFromSlug(routeParam);
  const hasUuidInUrl = uuidFromParam !== null;

  const slugToResolve = isSelf || hasUuidInUrl ? null : routeParam;

  const {
    actorId: actorIdFromSlug,
    loading: slugResolveLoading,
    notFound: slugNotFound,
    error: slugResolveError,
  } = useResolveActorBySlug(slugToResolve);

  const resolvedActorId = actorIdForSelf ?? uuidFromParam ?? actorIdFromSlug ?? null;

  const { canonicalSlug, loading: slugLoading } = useActorCanonicalSlug(resolvedActorId);

  useActorSlugRedirect(routeParam, canonicalSlug, resolvedActorId);

  const { loading: kindLoading, kind } = useActorKind(resolvedActorId);
  const { loading: vportTypeLoading, vportType: prefetchedVportType } = useVportType(resolvedActorId);

  const vportProfile = useVportProfileBySlug(!isSelf ? routeParam : null);

  const slugResolveErrorCode = slugResolveError?.code ?? null;
  const slugResolveErrorMessage = slugResolveError?.message ?? null;

  useProfileRouteTelemetry({
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
    identityActorId: identity?.actorId ?? null,
  });

  const probe = (
    <ActorProfileDevProbe
      routeParam={routeParam}
      isSelf={isSelf}
      actorIdForSelf={actorIdForSelf}
      uuidFromParam={uuidFromParam}
      hasUuidInUrl={hasUuidInUrl}
      slugToResolve={slugToResolve}
      actorIdFromSlug={actorIdFromSlug}
      resolvedActorId={resolvedActorId}
      canonicalSlug={canonicalSlug}
      slugLoading={slugLoading}
      slugResolveLoading={slugResolveLoading}
      slugNotFound={slugNotFound}
      kindLoading={kindLoading}
      kind={kind}
      rqIsLoading={vportProfile.isLoading}
      rqActorId={vportProfile.actorId}
      rqProfileId={vportProfile.profileId}
      rqName={vportProfile.name}
      rqCanonicalSlug={vportProfile.canonicalSlug}
      rqError={vportProfile.error ? (vportProfile.error?.message ?? String(vportProfile.error)) : null}
    />
  );

  if (identityLoading) return <>{probe}{SKELETON}</>;
  if (!identity) {
    appendIOSProdDebugLog("profile_route_redirect_login", { reason: "identity_missing", routeParam });
    return <Navigate to="/login" replace />;
  }

  if (slugResolveLoading) return <>{probe}{SKELETON}</>;

  if (slugResolveError && !hasUuidInUrl && !isSelf) {
    appendIOSProdDebugLog("profile_route_slug_resolve_error_gate", {
      routeParam, slugToResolve, code: slugResolveErrorCode,
      message: slugResolveErrorMessage, hasUuidInUrl, isSelf,
    });
    if (import.meta.env.DEV) return <>{probe}{SKELETON}</>;
    if (debugMode) {
      return <ActorProfileProdDebugPanel routeParam={routeParam} isSelf={isSelf}
        hasUuidInUrl={hasUuidInUrl} uuidFromParam={uuidFromParam} slugToResolve={slugToResolve}
        slugResolveLoading={slugResolveLoading} actorIdFromSlug={actorIdFromSlug}
        slugNotFound={slugNotFound} resolvedActorId={resolvedActorId}
        canonicalSlug={canonicalSlug} slugLoading={slugLoading} />;
    }
    return (
      <div className="profiles-modern px-4 py-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/80">
          We could not load this profile right now. Please try again in a moment.
        </div>
      </div>
    );
  }

  if (slugNotFound && !hasUuidInUrl) {
    appendIOSProdDebugLog("profile_route_redirect_feed", {
      reason: "slug_not_found", routeParam, slugToResolve, hasUuidInUrl, slugNotFound, resolvedActorId,
    });
    if (import.meta.env.DEV) return <>{probe}{SKELETON}</>;
    if (debugMode) return <ActorProfileProdDebugPanel routeParam={routeParam} isSelf={isSelf}
      hasUuidInUrl={hasUuidInUrl} uuidFromParam={uuidFromParam} slugToResolve={slugToResolve}
      slugResolveLoading={slugResolveLoading} actorIdFromSlug={actorIdFromSlug}
      slugNotFound={slugNotFound} resolvedActorId={resolvedActorId}
      canonicalSlug={canonicalSlug} slugLoading={slugLoading} />;
    return <Navigate to="/feed" replace />;
  }

  if (slugLoading) return <>{probe}{SKELETON}</>;

  if (!canonicalSlug) {
    appendIOSProdDebugLog("profile_route_redirect_feed", {
      reason: "missing_canonical_slug", routeParam, resolvedActorId, slugLoading, slugResolveLoading,
    });
    if (import.meta.env.DEV) return <>{probe}{SKELETON}</>;
    if (debugMode) return <ActorProfileProdDebugPanel routeParam={routeParam} isSelf={isSelf}
      hasUuidInUrl={hasUuidInUrl} uuidFromParam={uuidFromParam} slugToResolve={slugToResolve}
      slugResolveLoading={slugResolveLoading} actorIdFromSlug={actorIdFromSlug}
      slugNotFound={slugNotFound} resolvedActorId={resolvedActorId}
      canonicalSlug={canonicalSlug} slugLoading={slugLoading} />;
    return <Navigate to="/feed" replace />;
  }

  if (routeParam !== canonicalSlug) {
    appendIOSProdDebugLog("profile_route_wait_canonical_redirect", { routeParam, canonicalSlug, resolvedActorId });
    return <>{probe}{SKELETON}</>;
  }

  if (kindLoading) return <>{probe}{SKELETON}</>;

  const Screen = PROFILE_KIND_REGISTRY[kind] ?? PROFILE_KIND_REGISTRY.user;
  if (!hasLoggedRenderRef.current) {
    hasLoggedRenderRef.current = true;
    appendIOSProdDebugLog("profile_route_render_screen", {
      routeParam, canonicalSlug, resolvedActorId, kind, viewerActorId: identity?.actorId ?? null,
    });
  }

  return (
    <>
      {probe}
      <Screen
        viewerActorId={identity.actorId}
        profileActorId={resolvedActorId}
        identity={identity}
        prefetchedVportType={prefetchedVportType}
        vportTypeLoading={vportTypeLoading}
      />
    </>
  );
}
