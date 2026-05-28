import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'

const policyCache = createTTLCache(30_000)
const pending = new Map()

// Fail-closed default — treat unknown actor as approval_required
const POLICY_CLOSED = {
  accountVisibility: 'public',
  followPolicy: 'approval_required',
  allowBusinessFollowers: true,
}

export async function dalGetActorSocialPublicPolicy(actorId) {
  if (!actorId) return POLICY_CLOSED

  const cached = policyCache.get(actorId)
  if (cached) return cached

  if (pending.has(actorId)) return pending.get(actorId)

  const promise = supabase
    .schema('vc')
    .rpc('get_actor_social_public_policy', { p_actor_id: actorId })
    .then(({ data, error }) => {
      pending.delete(actorId)

      if (error) {
        if (import.meta.env?.DEV) {
          console.error('[dalGetActorSocialPublicPolicy] error', error)
        }
        return POLICY_CLOSED
      }

      // RPC returns TABLE — data is an array in Supabase JS
      const row = Array.isArray(data) ? data[0] : data
      if (!row) return POLICY_CLOSED

      const result = {
        accountVisibility: row.account_visibility,
        followPolicy: row.follow_policy,
        allowBusinessFollowers: row.allow_business_followers,
      }
      policyCache.set(actorId, result)
      return result
    })
    .catch((err) => {
      pending.delete(actorId)
      throw err
    })

  pending.set(actorId, promise)
  return promise
}

export function invalidateActorSocialPublicPolicyCache(actorId) {
  if (!actorId) return
  policyCache.invalidate(actorId)
  pending.delete(actorId)
}
