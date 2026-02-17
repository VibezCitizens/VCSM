// src/features/profiles/screens/ActorProfileScreen.jsx

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

  const { loading: kindLoading, kind } = useActorKind(
    shouldCheckKind ? routeActorId : null
  );

  if (identityLoading) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  if (!identity) {
    return <Navigate to="/login" replace />;
  }

  // self uses citizen experience for now
  if (routeActorId === "self") {
    const Screen = PROFILE_KIND_REGISTRY.user;
    return (
      <Screen
        viewerActorId={identity.actorId}
        profileActorId={identity.actorId}
      />
    );
  }

  // username route → redirect flow
  if (!UUID_REGEX.test(routeActorId)) {
    return <Navigate to={`/u/${routeActorId}`} replace />;
  }

  // kind still resolving
  if (kindLoading) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  const Screen = PROFILE_KIND_REGISTRY[kind] ?? PROFILE_KIND_REGISTRY.user;

  return (
    <Screen viewerActorId={identity.actorId} profileActorId={routeActorId} />
  );
}
