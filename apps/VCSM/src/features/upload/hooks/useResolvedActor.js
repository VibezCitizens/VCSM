// src/features/upload/hooks/useResolvedActor.js
import { useActiveActorState } from "@/features/identity/adapters/identity.adapter";

export function useResolvedActor() {
  const { actorId, isVoid } = useActiveActorState();

  if (!actorId) {
    return {
      ready: false,
      actorId: null,
      isVoid: false,
    };
  }

  return {
    ready: true,
    actorId,
    isVoid,
  };
}
