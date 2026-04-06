import { supabase } from '@/services/supabase/supabaseClient'

export async function dalGetActorPrivacy({ actorId }) {
  if (!actorId) return { isPrivate: true }

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_privacy_settings')
    .select('is_private')
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) {
    console.error('[dalGetActorPrivacy] actor_privacy_settings error', error)
    // Privacy must fail closed when the canonical table is unreadable.
    return { isPrivate: true }
  }

  if (data) {
    return { isPrivate: Boolean(data.is_private) }
  }

  // Canonical source only: vc.actor_privacy_settings.
  // Missing or invisible row must fail closed to avoid accidental public writes.
  return { isPrivate: true }
}
