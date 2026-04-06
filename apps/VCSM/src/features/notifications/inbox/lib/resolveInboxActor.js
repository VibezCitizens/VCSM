// src/features/notifications/inbox/lib/resolveInboxActor.js

/**
 * resolveInboxActor(identity)
 *
 * Identity is already resolved upstream (SSOT).
 * This function only adapts identity -> inbox semantics.
 *
 * Identity shape (LOCKED):
 * {
 *   kind: "user" | "vport",
 *   actorId,
 *   ownerActorId
 * }
 */
export function resolveInboxActor(identity) {
  if (!identity || !identity.actorId || !identity.kind) {
    return {
      targetActorId: null,
      myActorId: null,
    };
  }

  if (identity.kind === "user") {
    return {
      targetActorId: identity.actorId,
      myActorId: identity.actorId,
    };
  }

  if (identity.kind === "vport") {
    if (!identity.ownerActorId) {
      if (import.meta.env.DEV) {
        console.error(
          "[resolveInboxActor] INVALID vport identity: missing ownerActorId",
          identity
        );
      }

      return {
        targetActorId: identity.actorId,
        myActorId: null,
      };
    }

    return {
      targetActorId: identity.actorId,
      myActorId: identity.ownerActorId,
    };
  }

  if (import.meta.env.DEV) {
    console.warn("[resolveInboxActor] Unknown identity kind", identity);
  }

  return {
    targetActorId: null,
    myActorId: null,
  };
}
