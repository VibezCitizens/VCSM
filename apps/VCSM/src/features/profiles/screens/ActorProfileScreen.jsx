// src/features/profiles/screens/ActorProfileScreen.jsx

import { useParams, Navigate } from "react-router-dom";
import { useIdentity } from "@/state/identity/identityContext";
import { useActorConsistencyCheck } from "@debuggers/identity/useActorConsistencyCheck";

import { useActorKind } from "@/features/profiles/hooks/useActorKind";
import { useVportType } from "@/features/profiles/hooks/useVportType";
import { PROFILE_KIND_REGISTRY } from "@/features/profiles/kinds/profileKindRegistry";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import "@/features/profiles/styles/profiles-modern.css";

const UUID_REGEX = /^[0-9a-f-]{36}$/i;

export default function ActorProfileScreen() {
  const { actorId: routeActorId } = useParams();
  const { identity, identityLoading } = useIdentity();
  useActorConsistencyCheck('profile', identity?.actorId, identity?.kind);

  // ✅ ALWAYS call hook (stable hook order)
  // Only fetch kind for valid UUID route actor IDs (not "self" and not usernames)
  const shouldCheckKind =
    routeActorId &&
    routeActorId !== "self" &&
    UUID_REGEX.test(routeActorId);

  const actorIdForKind = shouldCheckKind ? routeActorId : null;

  const { loading: kindLoading, kind } = useActorKind(actorIdForKind);

  // Prefetch vportType in parallel with kind to eliminate the waterfall:
  // kind resolution -> vportType resolution -> profile view.
  // Both hooks fire simultaneously; VportProfileKindScreen receives the
  // already-resolved vportType via props instead of fetching it again.
  const { loading: vportTypeLoading, vportType: prefetchedVportType } =
    useVportType(actorIdForKind);

  if (identityLoading) {
    return <div className="profiles-modern px-4 py-6"><SkeletonCardList count={2} bodyHeight="h-48" /></div>;
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
        identity={identity}
      />
    );
  }

  // username route → redirect flow
  if (!UUID_REGEX.test(routeActorId)) {
    return <Navigate to={`/u/${routeActorId}`} replace />;
  }

  // kind still resolving
  if (kindLoading) {
    return <div className="profiles-modern px-4 py-6"><SkeletonCardList count={2} bodyHeight="h-48" /></div>;
  }

  const Screen = PROFILE_KIND_REGISTRY[kind] ?? PROFILE_KIND_REGISTRY.user;

  return (
    <Screen
      viewerActorId={identity.actorId}
      profileActorId={routeActorId}
      identity={identity}
      prefetchedVportType={prefetchedVportType}
      vportTypeLoading={vportTypeLoading}
    />
  );
}
