import { useIdentityDetailsDeprecated } from '@/features/identity/identityContext'

/**
 * Exposes actor-state fields that are present on internal identityDetails
 * but intentionally excluded from the public useIdentity() surface.
 *
 * Use this hook when you need:
 *   isAdult  — for feed/content age-gating
 *   isVoid   — for realm resolution in post creation and chat
 *   realmId  — for feed, chat, and learning realm scoping
 *
 * Do not use this hook for ownership or authorization checks.
 * Do not read ownerActorId from this hook — use a dedicated resolver.
 */
export function useActiveActorState() {
  const details = useIdentityDetailsDeprecated()

  if (!details?.actorId) {
    return {
      actorId: null,
      kind: null,
      isAdult: null,
      isVoid: false,
      isDeleted: false,
      realmId: null,
    }
  }

  return {
    actorId: details.actorId,
    kind: details.kind ?? null,
    isAdult: details.isAdult ?? null,
    isVoid: details.isVoid ?? false,
    isDeleted: details.isDeleted ?? false,
    realmId: details.realmId ?? null,
  }
}
