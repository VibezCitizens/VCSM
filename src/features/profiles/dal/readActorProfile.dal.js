import { supabase } from '@/services/supabase/supabaseClient'

export async function readActorProfileDAL(actorId) {
  if (!actorId) return null

  const { data, error } = await supabase
    .schema('vc')
    .rpc('read_actor_profile', {
      p_actor_id: actorId,
    })
    .maybeSingle()

  if (error) {
    console.error('[readActorProfileDAL] rpc error', error)
    throw error
  }

  if (!data) {
    throw new Error('Profile row missing')
  }

  return {
    actor: {
      actorId: data.actor_id,
      kind: data.kind,
    },

    // USER PROFILE (only for users)
    profile: data.kind === 'user'
      ? {
          id: data.profile_id,
          display_name: data.display_name,
          username: data.username,
          bio: data.bio,
          photo_url: data.photo_url,
          banner_url: data.banner_url,
          private: data.private,
          discoverable: data.discoverable,
          publish: data.publish,
          created_at: data.created_at,
          updated_at: data.updated_at,
          last_seen: data.last_seen,
          follower_count: data.follower_count,
          following_count: data.following_count,
        }
      : null,

    // 🔴 THIS IS WHAT YOU ARE CURRENTLY MISSING
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
}
