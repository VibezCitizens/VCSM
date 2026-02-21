// src/features/profiles/screens/ActorProfileScreen.jsx

import { useEffect, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useIdentity } from "@/state/identity/identityContext";

import { useActorKind } from "@/features/profiles/hooks/useActorKind";
import { PROFILE_KIND_REGISTRY } from "@/features/profiles/kinds/profileKindRegistry";

const UUID_REGEX = /^[0-9a-f-]{36}$/i;

export default function ActorProfileScreen() {
  const { actorId: routeActorId } = useParams();
  const { identity, identityLoading } = useIdentity();

  // ✅ ALWAYS call hook (stable hook order)
  // Only fetch kind for valid UUID route actor IDs (not "self" and not usernames)
  const shouldCheckKind =
    routeActorId &&
    routeActorId !== "self" &&
    UUID_REGEX.test(routeActorId);

  const actorIdForKind = shouldCheckKind ? routeActorId : null;

  const { loading: kindLoading, kind } = useActorKind(actorIdForKind);

  const resolvedKind = kind ?? "user";
  const isUuidRoute = useMemo(() => UUID_REGEX.test(routeActorId || ""), [routeActorId]);

  const debug = useMemo(() => {
    const registryKeys = Object.keys(PROFILE_KIND_REGISTRY || {});
    const selectedScreenKey = routeActorId === "self" ? "user" : resolvedKind;

    return {
      routeActorId: routeActorId ?? null,

      // identity source
      identityLoading: Boolean(identityLoading),
      hasIdentity: Boolean(identity),
      identityActorId: identity?.actorId ?? null,
      identityKind: identity?.kind ?? null,
      // legacy fields still present (you said yes)
      identityProfileId: identity?.profileId ?? null,
      identityVportId: identity?.vportId ?? null,

      // kind resolution source
      shouldCheckKind: Boolean(shouldCheckKind),
      actorIdForKind,
      kindLoading: Boolean(kindLoading),
      kindFromHook: kind ?? null,
      resolvedKind,

      // routing decisions
      isSelfRoute: routeActorId === "self",
      isUuidRoute,
      isUsernameRoute: Boolean(routeActorId) && routeActorId !== "self" && !isUuidRoute,

      // final screen selection
      registryKeys,
      selectedScreenKey,
      hasRegistryEntry: Boolean(PROFILE_KIND_REGISTRY?.[selectedScreenKey]),
      fallbackUsed: !PROFILE_KIND_REGISTRY?.[selectedScreenKey],
    };
  }, [
    routeActorId,
    identityLoading,
    identity,
    shouldCheckKind,
    actorIdForKind,
    kindLoading,
    kind,
    resolvedKind,
    isUuidRoute,
  ]);

  useEffect(() => {
    // One line, easy to filter in console
    // Shows EXACTLY where ActorProfileScreen got its inputs + what branch it took.
    // eslint-disable-next-line no-console
    console.log("[ACTOR PROFILE SCREEN DEBUG]", debug);
  }, [debug]);

  if (identityLoading) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  if (!identity) {
    return <Navigate to="/login" replace />;
  }

  // self uses citizen experience for now
  if (routeActorId === "self") {
    const Screen = PROFILE_KIND_REGISTRY.user;

    // eslint-disable-next-line no-console
    console.log("[ACTOR PROFILE SCREEN DEBUG][render:self]", {
      viewerActorId: identity.actorId,
      profileActorId: identity.actorId,
      Screen: "PROFILE_KIND_REGISTRY.user",
    });

    return (
      <Screen
        viewerActorId={identity.actorId}
        profileActorId={identity.actorId}
      />
    );
  }

  // username route → redirect flow
  if (!UUID_REGEX.test(routeActorId)) {
    // eslint-disable-next-line no-console
    console.log("[ACTOR PROFILE SCREEN DEBUG][redirect:username]", {
      from: routeActorId,
      to: `/u/${routeActorId}`,
    });

    return <Navigate to={`/u/${routeActorId}`} replace />;
  }

  // kind still resolving
  if (kindLoading) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  const Screen = PROFILE_KIND_REGISTRY[kind] ?? PROFILE_KIND_REGISTRY.user;

  // eslint-disable-next-line no-console
  console.log("[ACTOR PROFILE SCREEN DEBUG][render:uuid]", {
    viewerActorId: identity.actorId, // SOURCE: useIdentity()
    profileActorId: routeActorId, // SOURCE: useParams()
    kind, // SOURCE: useActorKind(routeActorId)
    Screen: PROFILE_KIND_REGISTRY[kind] ? `PROFILE_KIND_REGISTRY.${kind}` : "PROFILE_KIND_REGISTRY.user (fallback)",
  });

  return (
    <Screen viewerActorId={identity.actorId} profileActorId={routeActorId} />
  );
}