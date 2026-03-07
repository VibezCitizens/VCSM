import { supabase } from '@/services/supabase/supabaseClient'

export async function dalGetActorPrivacy({ actorId }) {
  if (!actorId) return { isPrivate: false }

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_privacy_settings')
    .select('is_private')
    .eq('actor_id', actorId)
    .maybeSingle()

  if (!error && data) {
    return { isPrivate: Boolean(data.is_private) }
  }

  if (error) {
    console.error('[dalGetActorPrivacy] actor_privacy_settings error', error)
    // Privacy must fail closed when the canonical table is unreadable.
    return { isPrivate: true }
  }

  // Retro-compat fallback:
  // Existing user profiles may still store privacy in public.profiles.private.
  const { data: actor, error: actorError } = await supabase
    .schema('vc')
    .from('actors')
    .select('kind,profile_id')
    .eq('id', actorId)
    .maybeSingle()

  if (actorError) {
    console.error('[dalGetActorPrivacy] actors lookup error', actorError)
    return { isPrivate: true }
  }

  if (actor?.kind !== 'user' || !actor?.profile_id) {
    // No legacy source for non-user actors.
    return { isPrivate: false }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('private')
    .eq('id', actor.profile_id)
    .maybeSingle()

  if (profileError) {
    console.error('[dalGetActorPrivacy] profiles fallback error', profileError)
    return { isPrivate: true }
  }

  return { isPrivate: Boolean(profile?.private) }
}
