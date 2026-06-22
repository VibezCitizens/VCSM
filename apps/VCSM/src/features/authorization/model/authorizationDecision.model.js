// Pure shape normalizers for authorization decision outputs.
// No DB access. No business logic. No permission enforcement.
// Controllers own the decision; this model owns the shape.

/**
 * Self-ownership decision — user-kind actor managing its own resource.
 * No DB query was required; kind gate and self-check were sufficient.
 *
 * @returns {{ ok: true, mode: "self" }}
 */
export function buildSelfDecision() {
  return { ok: true, mode: "self" };
}

/**
 * DB-verified actor ownership decision.
 * An actor_owners row was found and validated.
 *
 * @param {object} ownerLink — raw row from actorOwners.read.dal
 * @returns {{ ok: true, mode: "actor_owner", ownerLink: object }}
 */
export function buildActorOwnerDecision(ownerLink) {
  return {
    ok: true,
    mode: "actor_owner",
    ownerLink: normalizeOwnerLink(ownerLink),
  };
}

/**
 * Session-verified ownership decision.
 * Ownership was confirmed via the Supabase auth session without a caller actor ID.
 *
 * @returns {{ ok: true, mode: "session" }}
 */
export function buildSessionDecision() {
  return { ok: true, mode: "session" };
}

/**
 * Normalize a raw actor_owners row into the canonical ownerLink shape.
 * Called by buildActorOwnerDecision — not consumed directly by callers.
 *
 * @param {object} row
 * @returns {{ actorId: string, userId: string, isPrimary: boolean, isVoid: boolean, createdAt: string|null }}
 */
export function normalizeOwnerLink(row) {
  return {
    actorId: row?.actor_id ?? null,
    userId: row?.user_id ?? null,
    isPrimary: row?.is_primary ?? false,
    isVoid: row?.is_void ?? false,
    createdAt: row?.created_at ?? null,
  };
}
