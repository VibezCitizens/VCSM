// src/features/post/postcard/hooks/useActorMode.js
import { useIdentity } from "@/state/identity/identityContext";

/**
 * Actor identity lifecycle hook
 * - NO domain meaning
 * - NO branching logic
 * - Facts only
 */
export function useActorMode() {
  const { identity, loading } = useIdentity();

  return {
    actorId: identity?.actorId ?? null,
    actorKind: identity?.kind ?? null,
    loading,
    identity,
  };
}

export default useActorMode;
