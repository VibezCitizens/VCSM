// ============================================================
// Reviews Engine — Author Card Model
// ============================================================

/**
 * @param {Object} raw - snapshot columns from reviews.reviews row (author_*_snapshot fields)
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
