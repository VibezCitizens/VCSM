// src/features/wanders/core/models/reply.model.js
// ============================================================================
// WANDERS MODEL — REPLY
// Contract: map DB row (snake_case) -> UI-safe camelCase object. No side effects.
// ============================================================================

export function toWandersReply(row) {
  if (!row) return null;

  return {
    id: row.id,
    cardId: row.card_id,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    isDeleted: !!row.is_deleted,

    authorActorId: row.author_actor_id ?? null,
    authorUserId: row.author_user_id ?? null,

    body: row.body ?? null,
    bodyCiphertext: row.body_ciphertext ?? null,
    bodyNonce: row.body_nonce ?? null,
    bodyAlg: row.body_alg ?? null,
  };
}
