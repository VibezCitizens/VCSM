import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'

const settingsCache = createTTLCache(30_000)

const COLUMNS = [
  'account_visibility',
  'follow_policy',
  'follower_count_visibility',
  'follower_list_visibility',
  'following_list_visibility',
  'allow_business_followers',
  'allow_follow_notifications',
].join(', ')

// Owner read — RLS allows actor_id = auth.uid() only.
// VPORT actor settings must go through ctrlUpdateVportSocialSettings (actor_owners gate).
export async function dalGetActorSocialSettings(actorId) {
  if (!actorId) return null

  const cached = settingsCache.get(actorId)
  if (cached) return cached

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_social_settings')
    .select(COLUMNS)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error || !data) return null

  settingsCache.set(actorId, data)
  return data
}

// Owner write — RLS allows actor_id = auth.uid() only.
// patch must contain only valid actor_social_settings columns.
export async function dalUpdateActorSocialSettings({ actorId, patch }) {
  if (!actorId) throw new Error('dalUpdateActorSocialSettings: actorId required')
  if (!patch || typeof patch !== 'object' || Object.keys(patch).length === 0) {
    throw new Error('dalUpdateActorSocialSettings: patch required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_social_settings')
    .update(patch)
    .eq('actor_id', actorId)
    .select(COLUMNS)
    .maybeSingle()

  if (error) throw error

  if (data) settingsCache.set(actorId, data)
  return data
}

export function invalidateActorSocialSettingsCache(actorId) {
  if (!actorId) return
  settingsCache.invalidate(actorId)
}
