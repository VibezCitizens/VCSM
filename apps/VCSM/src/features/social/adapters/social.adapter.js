export { useSocialFollowRequestOps } from '@/features/social/friend/request/hooks/useSocialFollowRequestOps'

// Social settings — exposed for cross-feature consumers (settings/vports controller).
// These are the only approved cross-feature access points for actor social settings.
export {
  dalGetActorSocialSettings,
  dalUpdateActorSocialSettings,
  invalidateActorSocialSettingsCache,
} from '@/features/social/privacy/dal/actorSocialSettings.dal'

export { invalidateActorSocialPublicPolicyCache } from '@/features/social/privacy/dal/actorSocialPublicPolicy.dal'
