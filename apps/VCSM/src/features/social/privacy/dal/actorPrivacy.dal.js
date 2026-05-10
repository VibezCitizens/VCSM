import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'

// 30-second TTL — privacy rarely changes mid-session, and this eliminates
// the 3→1 duplicate reads per profile load identified in the perf audit.
const privacyCache = createTTLCache(30_000)

// In-flight dedup: concurrent callers for the same actorId share one DB round-trip.
const pending = new Map()

export async function dalGetActorPrivacy({ actorId }) {
  if (!actorId) return { isPrivate: true }

  const cached = privacyCache.get(actorId)
  if (cached) return cached

  if (pending.has(actorId)) return pending.get(actorId)

  const promise = supabase
    .schema('vc')
    .from('actor_privacy_settings')
    .select('is_private')
    .eq('actor_id', actorId)
    .maybeSingle()
    .then(({ data, error }) => {
      pending.delete(actorId)

      if (error) {
        console.error('[dalGetActorPrivacy] actor_privacy_settings error', error)
        return { isPrivate: true }
      }

      if (data) {
        const result = { isPrivate: Boolean(data.is_private) }
        privacyCache.set(actorId, result)
        return result
      }

      // Canonical source only: vc.actor_privacy_settings.
      // Missing or invisible row must fail closed to avoid accidental public writes.
      return { isPrivate: true }
    })
    .catch((err) => {
      pending.delete(actorId)
      throw err
    })

  pending.set(actorId, promise)
  return promise
}

/** Bust the privacy cache for a specific actor (call on write paths). */
export function invalidateActorPrivacyCache(actorId) {
  if (!actorId) return
  privacyCache.invalidate(actorId)
  pending.delete(actorId)
}
