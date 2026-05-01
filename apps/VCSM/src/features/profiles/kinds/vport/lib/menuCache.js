import { createTTLCache } from "@/shared/lib/ttlCache"

export const menuCache = createTTLCache(60_000)

export function invalidateMenuCache(actorId) {
  menuCache.invalidate(actorId)
}
