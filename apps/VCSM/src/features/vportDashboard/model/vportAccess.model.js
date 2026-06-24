/**
 * Pure helper: true when the active identity IS the target VPORT.
 *
 * Navigation/render gate only. The actor link is DB-verified by switchActiveActor
 * (link ownership, active status, is_switchable) before identity is committed —
 * so identity.kind is trustworthy without a second DB round-trip.
 *
 * Mutations must still verify through assertActorOwnsActorController.
 *
 * @param {{ kind: string, actorId: string } | null} identity
 * @param {string | null} targetActorId
 * @returns {boolean}
 */
export function isActiveVportActor(identity, targetActorId) {
  return Boolean(
    identity?.kind === "vport" &&
    identity?.actorId &&
    targetActorId &&
    identity.actorId === targetActorId
  );
}
