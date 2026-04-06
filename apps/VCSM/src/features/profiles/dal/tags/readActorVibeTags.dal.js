import { supabase } from '@/services/supabase/supabaseClient'

export async function readActorSelectedVibeTagKeysDAL(actorId) {
  if (!actorId) return []

  const { data, error } = await supabase
    .schema('vc')
    .from('vibe_actor_tags')
    .select('actor_id,vibe_tag_key,created_at,is_void')
    .eq('actor_id', actorId)
    .eq('is_void', false)

  if (error) throw error
  return data ?? []
}

export async function readVibeTagCatalogByKeysDAL(tagKeys) {
  const keys = Array.isArray(tagKeys) ? tagKeys.filter(Boolean) : []
  if (!keys.length) return []

  const { data, error } = await supabase
    .schema('vc')
    .from('vibe_tags')
    .select('key,label,description,icon,category,sort_order,is_active')
    .in('key', keys)

  if (error) throw error
  return data ?? []
}
