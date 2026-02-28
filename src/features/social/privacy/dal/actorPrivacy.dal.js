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
    // Privacy must fail closed. If we cannot read privacy state
    // (including RLS denial), treat as private.
    return { isPrivate: true }
  }

  return { isPrivate: Boolean(data?.is_private) }
}
