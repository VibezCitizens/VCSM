// src/features/wanders/models/wandersReply.model.js
// ============================================================================
// WANDERS MODEL — REPLY
// Contract: map DB row (snake_case) -> UI-safe camelCase object.
// No side effects.
// ============================================================================

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  const s = value.trim();
  if (!s) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * @param {any} row DB row from wanders.replies (optionally joined with card/author)
 */
export function toWandersReply(row) {
  if (!row) return null;

  // Support possible joins (some DALs return nested objects)
  const card = row.card ?? row.cards ?? null;
  const authorAnon = row.author_anon ?? row.anon ?? null;
  const authorActor = row.author_actor ?? row.actor ?? null;

  const metaRaw = row.meta ?? row.metadata ?? null;
  const meta = safeParseJson(metaRaw) ?? metaRaw ?? null;

  return {
    id: row.id ?? null,

    cardId: row.card_id ?? row.cardId ?? null,

    createdAt: row.created_at ?? row.createdAt ?? null,
    deletedAt: row.deleted_at ?? row.deletedAt ?? null,
    isDeleted: !!(row.is_deleted ?? row.isDeleted ?? false),

    authorActorId: row.author_actor_id ?? row.authorActorId ?? null,
    authorAnonId: row.author_anon_id ?? row.authorAnonId ?? null,

    body: row.body ?? null,
    bodyCiphertext: row.body_ciphertext ?? row.bodyCiphertext ?? null,
    bodyNonce: row.body_nonce ?? row.bodyNonce ?? null,
    bodyAlg: row.body_alg ?? row.bodyAlg ?? null,

    // optional extras if DAL joined them
    meta,

    card: card
      ? {
          id: card.id ?? null,
          publicId: card.public_id ?? card.publicId ?? null,
          templateKey: card.template_key ?? card.templateKey ?? null,
        }
      : null,

    authorAnon: authorAnon
      ? {
          id: authorAnon.id ?? null,
        }
      : null,

    authorActor: authorActor
      ? {
          id: authorActor.id ?? null,
        }
      : null,
  };
}

export default toWandersReply;
