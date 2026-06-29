/**
 * Regression tests — ctrlSetActorPrivacy (privacy-controller application-path retirement)
 *
 * TICKET-PRIVACY-AUTHZ-SESSION-001 (V02-H1). The prior `if (callerActorId !== actorId)`
 * caller-equality shortcut performed ZERO authorization on the production path (both ids
 * are caller-supplied and always equal). It is replaced by a kind-agnostic session ->
 * vc.actor_owners owner-bind on the TARGET actorId (works for USER and VPORT actors),
 * derived via the approved auth adapter + a feature-local actor_owners reader. callerActorId
 * no longer authorizes. Durable boundary remains actor_privacy_settings RLS (02-DB-1 /
 * 12B-DB-1, Phase 15) — this app gate is defense-in-depth only.
 *
 * Run: npx vitest run src/features/settings/privacy/controller/__tests__/actorPrivacy.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/settings/privacy/dal/visibility.dal', () => ({
  dalGetActorPrivacy: vi.fn(),
  dalSetActorPrivacy: vi.fn(),
}))
vi.mock('@/features/social/adapters/privacy/actorPrivacy.adapter', () => ({
  invalidateActorPrivacyCacheAdapter: vi.fn(),
}))
vi.mock('@/features/CentralFeed/adapters/feedCache.adapter', () => ({
  invalidateActorBundleEntry: vi.fn(),
}))
vi.mock('@/features/auth/adapters/authSession.adapter', () => ({
  readCurrentAuthUser: vi.fn(),
}))
vi.mock('@/features/settings/privacy/dal/privacyActorOwnership.read.dal', () => ({
  readPrivacyActorOwnerLinkDAL: vi.fn(),
}))

import { dalSetActorPrivacy } from '@/features/settings/privacy/dal/visibility.dal'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'
import { readPrivacyActorOwnerLinkDAL } from '@/features/settings/privacy/dal/privacyActorOwnership.read.dal'
import { ctrlSetActorPrivacy } from '@/features/settings/privacy/controller/actorPrivacy.controller'

beforeEach(() => {
  vi.clearAllMocks()
  dalSetActorPrivacy.mockResolvedValue(true)
})

describe('ctrlSetActorPrivacy — session ownership binding (V02-H1 retirement)', () => {
  it('owned USER actor: succeeds and writes via dalSetActorPrivacy', async () => {
    readCurrentAuthUser.mockResolvedValue({ id: 'user-1' })
    readPrivacyActorOwnerLinkDAL.mockResolvedValue({ actor_id: 'actor-user-1', is_void: false })

    const result = await ctrlSetActorPrivacy({
      actorId: 'actor-user-1',
      callerActorId: 'actor-user-1',
      isPrivate: true,
    })

    expect(result).toBe(true)
    expect(readPrivacyActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: 'actor-user-1', userId: 'user-1' })
    expect(dalSetActorPrivacy).toHaveBeenCalledWith('actor-user-1', true)
  })

  it('owned VPORT actor: succeeds and writes (kind-agnostic)', async () => {
    readCurrentAuthUser.mockResolvedValue({ id: 'user-1' })
    readPrivacyActorOwnerLinkDAL.mockResolvedValue({ actor_id: 'actor-vport-9', is_void: false })

    const result = await ctrlSetActorPrivacy({
      actorId: 'actor-vport-9',
      callerActorId: 'actor-vport-9',
      isPrivate: false,
    })

    expect(result).toBe(true)
    expect(readPrivacyActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: 'actor-vport-9', userId: 'user-1' })
    expect(dalSetActorPrivacy).toHaveBeenCalledWith('actor-vport-9', false)
  })

  it('foreign actor (no actor_owners link): rejects and does NOT write', async () => {
    readCurrentAuthUser.mockResolvedValue({ id: 'user-1' })
    readPrivacyActorOwnerLinkDAL.mockResolvedValue(null)

    await expect(
      ctrlSetActorPrivacy({ actorId: 'actor-victim', callerActorId: 'actor-victim', isPrivate: true })
    ).rejects.toThrow(/not authorized/i)

    expect(dalSetActorPrivacy).not.toHaveBeenCalled()
  })

  it('unauthenticated session: rejects before the ownership read and does NOT write', async () => {
    readCurrentAuthUser.mockResolvedValue(null)

    await expect(
      ctrlSetActorPrivacy({ actorId: 'actor-user-1', callerActorId: 'actor-user-1', isPrivate: true })
    ).rejects.toThrow(/not authorized/i)

    expect(readPrivacyActorOwnerLinkDAL).not.toHaveBeenCalled()
    expect(dalSetActorPrivacy).not.toHaveBeenCalled()
  })

  it('callerActorId spoofing (callerActorId === actorId === victim) does NOT bypass authz', async () => {
    // Attacker session does not own the victim actor. The old equality shortcut would
    // have skipped all authorization here; the new bind keys on the SESSION user id.
    readCurrentAuthUser.mockResolvedValue({ id: 'attacker-user' })
    readPrivacyActorOwnerLinkDAL.mockResolvedValue(null)

    await expect(
      ctrlSetActorPrivacy({ actorId: 'actor-victim', callerActorId: 'actor-victim', isPrivate: true })
    ).rejects.toThrow(/not authorized/i)

    // Ownership was checked against the session user, NOT the caller-supplied id.
    expect(readPrivacyActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: 'actor-victim', userId: 'attacker-user' })
    expect(dalSetActorPrivacy).not.toHaveBeenCalled()
  })
})
