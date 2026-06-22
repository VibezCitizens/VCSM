// [SHARED_ACTOR_PRIMITIVE] — serves both citizen and vport actor kinds
// Pure model check — no side effects, no I/O.
// Returns true when an actor's account is no longer publicly available.
// - isDeleted: explicit soft-delete on vc.actors or vport.profiles / public.profiles
// - isActive: Vport-only deactivation flag; false means removed from public access
export function isDeletedProfileActor({ isDeleted = null, isActive = null } = {}) {
  if (isDeleted === true) return true;
  if (isActive === false) return true;
  return false;
}
