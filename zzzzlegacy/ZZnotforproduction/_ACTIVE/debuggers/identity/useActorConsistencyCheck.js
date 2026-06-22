// debuggers/identity/useActorConsistencyCheck.js
// ============================================================
// DEV-ONLY: Actor consistency check hook.
// Detects when a feature's local actorId diverges from the
// global resolved identity. Logs warnings to console.
// ============================================================

import { useEffect } from 'react'
import { useIdentity } from '@/features/identity/identityContext'

/**
 * Dev-only hook: checks that a feature's local actorId matches the global identity.
 * Call this in any screen/component that holds a local actorId derived from identity.
 *
 * @param {string} feature - Feature name (e.g. "feed", "booking", "reviews")
 * @param {string|null} localActorId - The actorId the feature is currently using
 * @param {string|null} [localActorKind] - Optional local actor kind
 */
export function useActorConsistencyCheck(feature, localActorId, localActorKind) {
  const { identity } = useIdentity()

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (!identity?.actorId || !localActorId) return

    const globalActorId = identity.actorId
    const globalKind = identity.kind ?? null
    const matched = String(globalActorId) === String(localActorId)

    if (!matched) {
      console.warn(
        `[ACTOR_MISMATCH] ${feature}: local=${localActorId?.slice(0, 8)} global=${globalActorId?.slice(0, 8)}`,
        {
          feature,
          globalActorId,
          localActorId,
          globalKind,
          localKind: localActorKind ?? null,
          matched,
        }
      )
    }
  }, [feature, localActorId, localActorKind, identity?.actorId, identity?.kind])
}
