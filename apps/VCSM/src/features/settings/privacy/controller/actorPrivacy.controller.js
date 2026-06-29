import {
  dalGetActorPrivacy,
  dalSetActorPrivacy,
} from '@/features/settings/privacy/dal/visibility.dal'
import { invalidateActorPrivacyCacheAdapter } from '@/features/social/adapters/privacy/actorPrivacy.adapter'
import { invalidateActorBundleEntry } from '@/features/CentralFeed/adapters/feedCache.adapter'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'
import { readPrivacyActorOwnerLinkDAL } from '@/features/settings/privacy/dal/privacyActorOwnership.read.dal'

// V02-H1 (TICKET-PRIVACY-AUTHZ-SESSION-001): kind-agnostic session -> vc.actor_owners
// owner-bind on the TARGET actorId. The privacy target is the active identity actor
// and may be a USER or a VPORT, so neither kind-specific helper fits
// (assertActorOwnsActorController = user-only, assertSessionOwnsActorController =
// vport-only). Mirrors the block/moderation/social createPost-pattern owner-bind.
// This replaces the prior caller-equality shortcut (`callerActorId === actorId`),
// which performed zero authorization on the production path (both ids were
// caller-supplied). The DAL only reads vc.actor_owners; the decision is made here.
async function assertSessionOwnsPrivacyActor(actorId) {
  const sessionUser = await readCurrentAuthUser()
  if (
    !sessionUser ||
    !(await readPrivacyActorOwnerLinkDAL({ actorId, userId: sessionUser.id }))
  ) {
    throw new Error('Not authorized to change actor privacy.')
  }
}

export async function ctrlGetActorPrivacy(actorId) {
  if (!actorId) return false
  return dalGetActorPrivacy(actorId)
}

export async function ctrlSetActorPrivacy({ actorId, callerActorId, isPrivate, refreshActorFn }) {
  if (!actorId) throw new Error('Missing actorId')
  // callerActorId retained for API/signature compatibility only — it no longer
  // authorizes (both it and actorId were caller-supplied -> zero protection).
  if (!callerActorId) throw new Error('Missing callerActorId')
  // Authorization: the authenticated session must own the target actorId via
  // vc.actor_owners (kind-agnostic: user OR vport). Throws before any write.
  await assertSessionOwnsPrivacyActor(actorId)
  await dalSetActorPrivacy(actorId, Boolean(isPrivate))
  // Bust both caches so the new privacy state takes effect immediately
  invalidateActorPrivacyCacheAdapter(actorId)
  invalidateActorBundleEntry(actorId)
  refreshActorFn?.(actorId)
  return true
}
