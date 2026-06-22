// ============================================================
// Portfolio Engine — List Portfolio Controller
// ============================================================

import { dalGetProfileIdByActorId, dalListPortfolioItemsByProfileId } from '../dal/portfolioItems.read.dal.js'
import { dalListMediaByItemIds } from '../dal/portfolioMedia.read.dal.js'
import { dalListTagsByItemIds } from '../dal/portfolioTags.read.dal.js'
import { PortfolioItemModel } from '../model/PortfolioItem.model.js'
import { PortfolioMediaModel } from '../model/PortfolioMedia.model.js'

/**
 * List portfolio items for a vport actor (public read).
 * Enriches each item with media and tags.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {number} [params.limit=24]
 * @param {number} [params.offset=0]
 * @returns {Promise<import('../types/index.js').DomainPortfolioListResult>}
 */
export async function listPortfolio({ actorId, limit = 24, offset = 0, viewerIsOwner = false }) {
  if (!actorId) {
    throw new Error('[listPortfolio] actorId is required')
  }

  const profileId = await dalGetProfileIdByActorId({ actorId })
  if (!profileId) {
    return { items: [], hasMore: false }
  }

  const rows = await dalListPortfolioItemsByProfileId({ profileId, limit, offset, publicOnly: !viewerIsOwner })

  if (!rows.length) {
    return { items: [], hasMore: false }
  }

  const itemIds = rows.map((r) => r.id)

  const [mediaRows, tagRows] = await Promise.all([
    dalListMediaByItemIds({ itemIds }),
    dalListTagsByItemIds({ itemIds }),
  ])

  const mediaMap = new Map()
  for (const m of mediaRows) {
    if (!mediaMap.has(m.portfolio_item_id)) mediaMap.set(m.portfolio_item_id, [])
    mediaMap.get(m.portfolio_item_id).push(PortfolioMediaModel(m))
  }

  const tagMap = new Map()
  for (const t of tagRows) {
    if (!tagMap.has(t.portfolio_item_id)) tagMap.set(t.portfolio_item_id, [])
    tagMap.get(t.portfolio_item_id).push(t.tag)
  }

  const items = rows.map((row) => {
    const item = PortfolioItemModel(row)
    const media = mediaMap.get(item.id) ?? []
    const coverUrl = media.find((m) => m.mediaRole === 'cover')?.url ?? media[0]?.url ?? null
    return {
      ...item,
      coverUrl,
      media,
      tags: tagMap.get(item.id) ?? [],
    }
  })

  return {
    items,
    hasMore: rows.length >= limit,
  }
}
