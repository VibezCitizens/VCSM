// ============================================================
// Portfolio Engine — Portfolio Media Model
// ============================================================

/**
 * @param {Object} raw - vport.portfolio_media row
 * @returns {import('../types/index.js').DomainPortfolioMedia}
 */
export function PortfolioMediaModel(raw) {
  if (!raw) return null
  return {
    id:              raw.id,
    portfolioItemId: raw.portfolio_item_id,
    profileId:       raw.profile_id,
    url:             raw.url,
    mediaType:       raw.media_type ?? 'image',
    mediaRole:       raw.media_role ?? 'result',
    altText:         raw.alt_text ?? '',
    width:           raw.width ?? null,
    height:          raw.height ?? null,
    durationSeconds: raw.duration_seconds ?? null,
    sortOrder:       raw.sort_order ?? 0,
    isActive:        raw.is_active ?? true,
    createdAt:       raw.created_at,
    updatedAt:       raw.updated_at,
  }
}
