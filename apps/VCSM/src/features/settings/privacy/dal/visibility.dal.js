// src/features/settings/privacy/dal/visibility.dal.js

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * DAL: Actor privacy visibility (SSOT)
 *
 * Table:
 * - vc.actor_privacy_settings
 *
 * Rules:
 * - actor_id is authoritative
 * - row may not exist (default = public)
 */

// --------------------------------------------------
// READ
// --------------------------------------------------
export async function dalGetActorPrivacy(actorId) {
  if (!actorId) throw new Error('Missing actorId')

  const { data, error } = await supabase
    .schema ('vc')
    .from('actor_privacy_settings')
    .select('is_private')
    .eq('actor_id', actorId)
    .single()

  // row missing = public
  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data?.is_private ?? false
}

// --------------------------------------------------
// WRITE (UPSERT)
// --------------------------------------------------
export async function dalSetActorPrivacy(actorId, isPrivate) {
  if (!actorId) throw new Error('Missing actorId')

  const { error } = await supabase
  .schema ('vc')
    .from('actor_privacy_settings')
    .upsert(
      {
        actor_id: actorId,
        is_private: isPrivate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'actor_id' }
    )

  if (error) throw error
  return true
}
