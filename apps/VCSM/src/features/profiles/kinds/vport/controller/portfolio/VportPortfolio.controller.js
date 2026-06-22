import {
  listPortfolio as engineListPortfolio,
  getPortfolioItem as engineGetPortfolioItem,
} from '@portfolio'
import { createTTLCache } from '@/shared/lib/ttlCache'

const listCache = createTTLCache(60_000) // 60 seconds

export async function ctrlListPortfolio(actorId, { limit = 24, offset = 0, viewerIsOwner = false } = {}) {
  if (!actorId) throw new Error('[VportPortfolio] actorId is required')

  // Cache key includes context so owner and public reads never share a cache entry
  const cacheKey = offset === 0 ? `${actorId}:${viewerIsOwner ? 'owner' : 'public'}` : null
  if (cacheKey) {
    const cached = listCache.get(cacheKey)
    if (cached) return cached
  }

  const result = await engineListPortfolio({ actorId, limit, offset, viewerIsOwner })
  if (cacheKey) listCache.set(cacheKey, result)
  return result
}

export async function ctrlGetPortfolioItem(itemId, { includeBarberDetails = true, includeLocksmithDetails = true } = {}) {
  if (!itemId) throw new Error('[VportPortfolio] itemId is required')
  return engineGetPortfolioItem({ itemId, includeBarberDetails, includeLocksmithDetails })
}

export function invalidatePortfolioCache(actorId) {
  listCache.invalidate(actorId)
}
