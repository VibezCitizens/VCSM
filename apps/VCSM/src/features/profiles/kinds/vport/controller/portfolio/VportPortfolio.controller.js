import {
  listPortfolio as engineListPortfolio,
  getPortfolioItem as engineGetPortfolioItem,
} from '@portfolio'
import { createTTLCache } from '@/shared/lib/ttlCache'

const listCache = createTTLCache(60_000) // 60 seconds

export async function ctrlListPortfolio(actorId, { limit = 24, offset = 0 } = {}) {
  if (!actorId) throw new Error('[VportPortfolio] actorId is required')

  // Only cache first page (offset 0)
  const cacheKey = offset === 0 ? actorId : null
  if (cacheKey) {
    const cached = listCache.get(cacheKey)
    if (cached) return cached
  }

  const result = await engineListPortfolio({ actorId, limit, offset })
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
