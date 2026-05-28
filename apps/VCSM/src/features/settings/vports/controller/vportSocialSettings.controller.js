import assertActorOwnsVportActorController from '@/features/booking/controller/assertActorOwnsVportActor.controller'
import {
  dalGetActorSocialSettings,
  dalUpdateActorSocialSettings,
  invalidateActorSocialSettingsCache,
} from '@/features/social/privacy/dal/actorSocialSettings.dal'
import { invalidateActorSocialPublicPolicyCache } from '@/features/social/privacy/dal/actorSocialPublicPolicy.dal'

const ALLOWED_PATCH_KEYS = new Set([
  'account_visibility',
  'follow_policy',
  'follower_count_visibility',
  'follower_list_visibility',
  'following_list_visibility',
  'allow_business_followers',
  'allow_follow_notifications',
])

export async function ctrlGetVportSocialSettings({ vportActorId, callerActorId }) {
  if (!vportActorId)  throw new Error('ctrlGetVportSocialSettings: vportActorId required')
  if (!callerActorId) throw new Error('ctrlGetVportSocialSettings: callerActorId required')

  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId })

  return dalGetActorSocialSettings(vportActorId)
}

export async function ctrlUpdateVportSocialSettings({ vportActorId, patch, callerActorId }) {
  if (!vportActorId)  throw new Error('ctrlUpdateVportSocialSettings: vportActorId required')
  if (!callerActorId) throw new Error('ctrlUpdateVportSocialSettings: callerActorId required')
  if (!patch || typeof patch !== 'object' || Object.keys(patch).length === 0) {
    throw new Error('ctrlUpdateVportSocialSettings: patch required')
  }

  const invalidKeys = Object.keys(patch).filter((k) => !ALLOWED_PATCH_KEYS.has(k))
  if (invalidKeys.length > 0) {
    throw new Error(`ctrlUpdateVportSocialSettings: invalid patch keys: ${invalidKeys.join(', ')}`)
  }

  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId })

  const result = await dalUpdateActorSocialSettings({ actorId: vportActorId, patch })

  // Bust both caches — public policy RPC result depends on follow_policy,
  // account_visibility, and allow_business_followers.
  invalidateActorSocialSettingsCache(vportActorId)
  invalidateActorSocialPublicPolicyCache(vportActorId)

  return result
}
