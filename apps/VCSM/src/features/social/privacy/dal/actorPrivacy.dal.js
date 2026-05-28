import {
  dalGetActorSocialPublicPolicy,
  invalidateActorSocialPublicPolicyCache,
} from '@/features/social/privacy/dal/actorSocialPublicPolicy.dal'

// Thin wrapper — preserves the { isPrivate } contract for all existing callers.
// Source of truth has moved to vc.actor_social_settings via get_actor_social_public_policy RPC.
// follow_policy !== 'open' maps to isPrivate: true (approval_required or closed both gate follows).
export async function dalGetActorPrivacy({ actorId }) {
  if (!actorId) return { isPrivate: true }

  const policy = await dalGetActorSocialPublicPolicy(actorId)
  return { isPrivate: policy.followPolicy !== 'open' }
}

export function invalidateActorPrivacyCache(actorId) {
  invalidateActorSocialPublicPolicyCache(actorId)
}
