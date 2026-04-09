// ============================================================
// Reviews Engine — Author Card Model
// ============================================================

/**
 * @param {Object} raw - get_review_author_card RPC result or snapshot data
 * @returns {import('../types/index.js').DomainAuthorCard}
 */
export function AuthorCardModel(raw) {
  if (!raw) return null
  return {
    actorId:     raw.actor_id ?? raw.actorId ?? null,
    displayName: raw.display_name ?? raw.displayName ?? 'Anonymous',
    username:    raw.username ?? null,
    avatarUrl:   raw.avatar_url ?? raw.avatarUrl ?? null,
  }
}
