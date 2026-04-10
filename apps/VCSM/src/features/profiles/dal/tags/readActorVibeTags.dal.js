import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'

const actorTagsCache = createTTLCache(120_000) // 2 minutes
const catalogCache = createTTLCache(300_000) // 5 minutes — catalog rarely changes

export async function readActorSelectedVibeTagKeysDAL(actorId) {
  if (!actorId) return []

  const cached = actorTagsCache.get(actorId)
  if (cached) return cached

  const { data, error } = await supabase
    .schema('vc')
    .from('vibe_actor_tags')
    .select('actor_id,vibe_tag_key,created_at,is_void')
    .eq('actor_id', actorId)
    .eq('is_void', false)

  if (error) throw error
  const result = data ?? []
  actorTagsCache.set(actorId, result)
  return result
}

export async function readVibeTagCatalogByKeysDAL(tagKeys) {
  const keys = Array.isArray(tagKeys) ? tagKeys.filter(Boolean) : []
  if (!keys.length) return []

  const cacheKey = keys.sort().join(',')
  const cached = catalogCache.get(cacheKey)
  if (cached) return cached

  const { data, error } = await supabase
    .schema('vc')
    .from('vibe_tags')
    .select('key,label,description,icon,category,sort_order,is_active')
    .in('key', keys)

  if (error) throw error
  const result = data ?? []
  catalogCache.set(cacheKey, result)
  return result
}

export function invalidateActorTagsCache(actorId) {
  actorTagsCache.invalidate(actorId)
}
