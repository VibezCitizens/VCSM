// src/features/notifications/inbox/lib/resolveInboxActor.js

/**
 * resolveInboxActor(identity)
 *
 * Identity is already resolved upstream (SSOT).
 * This function only adapts identity → inbox semantics.
 *
 * Identity shape (LOCKED):
 * {
 *   kind: 'user' | 'vport',
 *   actorId,
 *   profileId,
 *   // vport only:
 *   vportId,
 *   ownerActorId
 * }
 */
export function resolveInboxActor(identity) {
  if (!identity || !identity.actorId || !identity.kind) {
    return {
      targetActorId: null,
      myActorId: null,
      myProfileId: null,
    }
  }

  /* ============================================================
     USER PERSONA
     ============================================================ */
  if (identity.kind === 'user') {
    return {
      targetActorId: identity.actorId,
      myActorId: identity.actorId,
      myProfileId: identity.profileId ?? null,
    }
  }

  /* ============================================================
     VPORT PERSONA
     ============================================================ */
  if (identity.kind === 'vport') {
    // 🚨 HARD REQUIREMENT — no silent degradation
    if (!identity.ownerActorId) {
      if (import.meta.env.DEV) {
        console.error(
          '[resolveInboxActor] INVALID vport identity: missing ownerActorId',
          identity
        )
      }

      // Fail closed — do NOT allow ambiguous block / permission logic
      return {
        targetActorId: identity.actorId,
        myActorId: null,
        myProfileId: identity.profileId ?? null,
      }
    }

    return {
      targetActorId: identity.actorId,          // vport inbox
      myActorId: identity.ownerActorId,          // owner actor (blocks, perms)
      myProfileId: identity.profileId ?? null,
    }
  }

  /* ============================================================
     FALLBACK (should never happen)
     ============================================================ */
  if (import.meta.env.DEV) {
    console.warn(
      '[resolveInboxActor] Unknown identity kind',
      identity
    )
  }

  return {
    targetActorId: null,
    myActorId: null,
    myProfileId: null,
  }
}
