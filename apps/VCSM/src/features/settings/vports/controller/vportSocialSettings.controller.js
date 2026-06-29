import { assertSessionOwnsActorController } from '@/features/authorization/adapters/authorization.adapter'
import {
  dalGetActorSocialSettings,
  dalUpdateActorSocialSettings,
  invalidateActorSocialSettingsCache,
  invalidateActorSocialPublicPolicyCache,
} from '@/features/social/adapters/social.adapter'

// V12A-M2 (TICKET-SETTINGS-VPORT-CANONICAL-OWNERBIND-001): authorize the VPORT social
// settings read/update through the canonical session-derived ownership gate
// (assertSessionOwnsActorController), replacing the navigation-grade hybrid
// checkVportOwnershipController whose self-grant path (V03A-H2 lineage) accepted a
// caller-supplied actorId equality as proof of ownership. This delegated social write
// has NO owner_user_id DAL backstop, so the canonical session-derived gate is the only
// app-layer authority here; it never trusts caller-supplied ids. DiD only; durable
// boundary = social RLS (12A-DB-5, 06B-owned, Phase 15). callerActorId is retained
// (vestigial) for signature stability; ownership no longer depends on it.
const OWNERSHIP_DENIED_MESSAGE = 'Only owners or managers can manage this VPORT.'

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

  try {
    await assertSessionOwnsActorController({ targetActorId: vportActorId })
  } catch {
    throw new Error(OWNERSHIP_DENIED_MESSAGE)
  }

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

  try {
    await assertSessionOwnsActorController({ targetActorId: vportActorId })
  } catch {
    throw new Error(OWNERSHIP_DENIED_MESSAGE)
  }

  const result = await dalUpdateActorSocialSettings({ actorId: vportActorId, patch })

  // Bust both caches — public policy RPC result depends on follow_policy,
  // account_visibility, and allow_business_followers.
  invalidateActorSocialSettingsCache(vportActorId)
  invalidateActorSocialPublicPolicyCache(vportActorId)

  return result
}
