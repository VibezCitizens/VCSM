import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'

const profileCache = createTTLCache(30_000) // 30 seconds

export async function readActorProfileDAL(actorId) {
  if (!actorId) return null

  const cached = profileCache.get(actorId)
  if (cached) return cached

  const [{ data, error }, { data: privacyData, error: privacyError }] =
    await Promise.all([
      supabase
        .schema('vc')
        .rpc('read_actor_profile', {
          p_actor_id: actorId,
        })
        .maybeSingle(),
      supabase
        .schema('vc')
        .from('actor_privacy_settings')
        .select('is_private')
        .eq('actor_id', actorId)
        .maybeSingle(),
    ])

  if (error) {
    console.error('[readActorProfileDAL] rpc error', error)
    throw error
  }

  if (!data) {
    return null
  }

  if (privacyError) {
    console.error('[readActorProfileDAL] actor privacy error', privacyError)
  }

  const isPrivate = privacyError
    ? true
    : (privacyData?.is_private ?? true)

  const result = {
    actor: {
      actorId: data.actor_id,
      kind: data.kind,
    },

    profile: data.kind === 'user'
      ? {
          id: data.profile_id,
          display_name: data.display_name,
          username: data.username,
          bio: data.bio,
          photo_url: data.photo_url,
          banner_url: data.banner_url,
          private: isPrivate,
          discoverable: data.discoverable,
          publish: data.publish,
          created_at: data.created_at,
          updated_at: data.updated_at,
          last_seen: data.last_seen,
          follower_count: data.follower_count,
          following_count: data.following_count,
        }
      : null,

    vport: data.kind === 'vport'
      ? {
          id: data.vport_id,
          name: data.vport_name,
          slug: data.vport_slug,
          bio: data.vport_bio,
          avatar_url: data.vport_avatar_url,
          banner_url: data.vport_banner_url,
          is_active: data.vport_is_active,
        }
      : null,
  }

  profileCache.set(actorId, result)
  return result
}

export function invalidateActorProfileCache(actorId) {
  if (actorId) {
    profileCache.invalidate(actorId)
  } else {
    profileCache.invalidateAll()
  }
}
