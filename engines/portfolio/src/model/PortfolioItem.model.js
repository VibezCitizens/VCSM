// ============================================================
// Portfolio Engine — Portfolio Item Model
// ============================================================

/**
 * @param {Object} raw - vport_portfolio_items row or RPC result
 * @returns {import('../types/index.js').DomainPortfolioItem}
 */
export function PortfolioItemModel(raw) {
  if (!raw) return null
  return {
    id:               raw.id ?? raw.portfolio_item_id,
    actorId:          raw.actor_id,
    serviceId:        raw.service_id ?? null,
    title:            raw.title ?? '',
    description:      raw.description ?? '',
    portfolioKind:    raw.portfolio_kind ?? 'work',
    visibility:       raw.visibility ?? 'public',
    coverMediaId:     raw.cover_media_id ?? null,
    coverUrl:         raw.cover_url ?? null,
    isFeatured:       raw.is_featured ?? false,
    isPinned:         raw.is_pinned ?? false,
    isActive:         raw.is_active ?? true,
    isDeleted:        raw.is_deleted ?? false,
    sortOrder:        raw.sort_order ?? 0,
    sourcePostId:     raw.source_post_id ?? null,
    createdByActorId: raw.created_by_actor_id ?? null,
    publishedAt:      raw.published_at ?? null,
    createdAt:        raw.created_at,
    updatedAt:        raw.updated_at,
    deletedAt:        raw.deleted_at ?? null,
    mediaCount:       raw.media_count != null ? parseInt(raw.media_count, 10) : 0,
    media:            raw.media ?? [],
    tags:             raw.tags ?? [],
  }
}
