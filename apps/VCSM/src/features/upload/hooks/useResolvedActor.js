// src/features/upload/hooks/useResolvedActor.js
import { useIdentity } from "@/state/identity/identityContext";

export function useResolvedActor() {
  const { identity } = useIdentity();

  if (!identity || !identity.actorId) {
    return {
      ready: false,
      actorId: null,
      isVoid: false,
    };
  }

  return {
    ready: true,
    actorId: identity.actorId,
    isVoid: identity.isVoid,
  };
}
