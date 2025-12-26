import { supabase } from '@/services/supabase/supabaseClient'

export async function dalGetActorPrivacy({ actorId }) {
  if (!actorId) return { isPrivate: false }

  const { data, error } = await supabase
  .schema ('vc')
    .from('actor_privacy_settings')
    .select('is_private')
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) {
    console.error('[dalGetActorPrivacy] error', error)
    // Phase-1 safe default: treat unknown as public
    return { isPrivate: false }
  }

  return { isPrivate: Boolean(data?.is_private) }
}
