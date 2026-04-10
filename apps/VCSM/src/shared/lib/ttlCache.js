/**
 * Simple TTL cache factory.
 * Returns { get, set, invalidate, invalidateAll, has } for a keyed cache.
 *
 * Usage:
 *   const cache = createTTLCache(60_000) // 60 seconds
 *   const cached = cache.get('key')
 *   if (cached) return cached
 *   const data = await fetch(...)
 *   cache.set('key', data)
 */

export function createTTLCache(ttlMs = 60_000) {
  const store = new Map()

  return {
    get(key) {
      const entry = store.get(key)
      if (!entry) return null
      if (Date.now() - entry.at > ttlMs) {
        store.delete(key)
        return null
      }
      return entry.data
    },

    set(key, data) {
      store.set(key, { data, at: Date.now() })
    },

    invalidate(key) {
      store.delete(key)
    },

    invalidateAll() {
      store.clear()
    },

    has(key) {
      const entry = store.get(key)
      if (!entry) return false
      if (Date.now() - entry.at > ttlMs) {
        store.delete(key)
        return false
      }
      return true
    },
  }
}
