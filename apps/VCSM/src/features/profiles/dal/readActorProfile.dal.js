// [SHARED_ACTOR_PRIMITIVE] — kind-aware polymorphic read (user vs vport profile tables)
import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'
import { getActorPrivacyAdapter } from '@/features/social/adapters/privacy/actorPrivacy.adapter'

const profileCache = createTTLCache(30_000) // 30 seconds

export async function readActorProfileDAL(actorId) {
  if (!actorId) return null

  const cached = profileCache.get(actorId)
  if (cached) return cached

  const { data: actor, error: actorError } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, kind, profile_id, vport_id')
    .eq('id', actorId)
    .maybeSingle()

  if (actorError) throw actorError
  if (!actor) return null

  const [privacyResult, profileFetch] = await Promise.all([
    getActorPrivacyAdapter({ actorId }),
    actor.kind === 'user' && actor.profile_id
      ? supabase
          .from('profiles')
          .select(
            'id, display_name, username, bio, photo_url, banner_url, ' +
            'discoverable, publish, created_at, updated_at, last_seen, ' +
            'follower_count, following_count'
          )
          .eq('id', actor.profile_id)
          .maybeSingle()
      : actor.kind === 'vport'
        ? supabase
            .schema('vport')
            .from('profiles')
            .select('id, name, slug, bio, avatar_url, banner_url, is_active')
            .eq('actor_id', actorId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
  ])

  if (profileFetch.error) throw profileFetch.error

  const isPrivate = privacyResult.isPrivate
  const p = profileFetch.data

  let result

  if (actor.kind === 'user') {
    result = {
      actor: { actorId: actor.id, kind: 'user' },
      profile: p
        ? {
            id: p.id,
            display_name: p.display_name,
            username: p.username,
            bio: p.bio,
            photo_url: p.photo_url,
            banner_url: p.banner_url,
            private: isPrivate,
            discoverable: p.discoverable,
            publish: p.publish,
            created_at: p.created_at,
            updated_at: p.updated_at,
            last_seen: p.last_seen,
            follower_count: p.follower_count,
            following_count: p.following_count,
          }
        : null,
      vport: null,
    }
  } else if (actor.kind === 'vport') {
    result = {
      actor: { actorId: actor.id, kind: 'vport' },
      profile: null,
      vport: p
        ? {
            id: p.id,
            name: p.name,
            slug: p.slug,
            bio: p.bio,
            avatar_url: p.avatar_url,
            banner_url: p.banner_url,
            is_active: p.is_active,
          }
        : null,
    }
  } else {
    result = {
      actor: { actorId: actor.id, kind: actor.kind },
      profile: null,
      vport: null,
    }
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
