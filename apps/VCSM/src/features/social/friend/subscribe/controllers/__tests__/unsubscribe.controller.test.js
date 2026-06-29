/**
 * Regression tests — ctrlUnsubscribe (unsubscribe.controller)
 *
 * Security invariant (VENOM V-SUB-002 → V06B-M1):
 *   ctrlUnsubscribe must verify the authenticated SESSION owns followerActorId
 *   before executing any unfollow action. An attacker calling this with a victim's
 *   followerActorId would force-unfollow the victim and invalidate their feed cache
 *   (revoking access to private posts). The original caller-equality gate
 *   (assertingActorId === followerActorId) was vacuous on the live toggle path; the
 *   gate is now session-derived & kind-agnostic via readCurrentAuthUser() +
 *   readSocialActorOwnerLinkDAL (vc.actor_owners). DiD; durable boundary = RLS.
 *   assertingActorId is retained (vestigial) for API compatibility.
 *
 * Run: npx vitest run src/features/social/friend/subscribe/controllers/__tests__/unsubscribe.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/auth/adapters/authSession.adapter', () => ({ readCurrentAuthUser: vi.fn() }))
vi.mock('@/features/social/friend/request/dal/socialActorOwnership.read.dal', () => ({
  readSocialActorOwnerLinkDAL: vi.fn(),
}))
vi.mock('@/features/social/friend/request/dal/actorFollows.dal', () => ({
  dalDeactivateFollow: vi.fn(),
}))
vi.mock('@/features/social/friend/request/dal/followRequests.dal', () => ({
  dalUpdateRequestStatus: vi.fn(),
}))
vi.mock('@/features/social/friend/subscribe/dal/subscriberCount.dal', () => ({
  invalidateFollowerCount: vi.fn(),
}))
vi.mock('@/features/CentralFeed/adapters/feedCache.adapter', () => ({
  invalidateFeedFollowCache: vi.fn(),
}))

import { ctrlUnsubscribe } from '../unsubscribe.controller'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'
import { readSocialActorOwnerLinkDAL } from '@/features/social/friend/request/dal/socialActorOwnership.read.dal'
import { dalDeactivateFollow } from '@/features/social/friend/request/dal/actorFollows.dal'
import { dalUpdateRequestStatus } from '@/features/social/friend/request/dal/followRequests.dal'
import { invalidateFollowerCount } from '@/features/social/friend/subscribe/dal/subscriberCount.dal'
import { invalidateFeedFollowCache } from '@/features/CentralFeed/adapters/feedCache.adapter'

// ─── fixtures ─────────────────────────────────────────────────────────────────

const USER = 'user-session-111'
const FOLLOWER = 'actor-follower-aaa-111'
const FOLLOWED = 'actor-followed-bbb-222'

function grantSession() {
  readCurrentAuthUser.mockResolvedValue({ id: USER })
  readSocialActorOwnerLinkDAL.mockResolvedValue({ actor_id: FOLLOWER, is_void: false })
}
function setupSuccessfulWrites() {
  dalDeactivateFollow.mockResolvedValue(true)
  dalUpdateRequestStatus.mockResolvedValue(true)
}

// ─── guard: missing actor IDs (throws before the ownership gate) ────────────────

describe('ctrlUnsubscribe — guard: missing actor ids', () => {
  beforeEach(() => { vi.clearAllMocks(); grantSession() })

  it('throws when followerActorId is null', async () => {
    await expect(
      ctrlUnsubscribe({ followerActorId: null, followedActorId: FOLLOWED })
    ).rejects.toThrow('Missing actor ids')
  })

  it('throws when followedActorId is null', async () => {
    await expect(
      ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: null })
    ).rejects.toThrow('Missing actor ids')
  })

  it('throws when both are undefined', async () => {
    await expect(
      ctrlUnsubscribe({ followerActorId: undefined, followedActorId: undefined })
    ).rejects.toThrow('Missing actor ids')
  })

  it('does not call dalDeactivateFollow when ids are missing', async () => {
    await expect(
      ctrlUnsubscribe({ followerActorId: null, followedActorId: FOLLOWED })
    ).rejects.toThrow()
    expect(dalDeactivateFollow).not.toHaveBeenCalled()
  })

  it('does not call invalidateFeedFollowCache when ids are missing (privacy-critical gate)', async () => {
    await expect(
      ctrlUnsubscribe({ followerActorId: null, followedActorId: FOLLOWED })
    ).rejects.toThrow()
    expect(invalidateFeedFollowCache).not.toHaveBeenCalled()
  })
})

// ─── [V06B-M1] session-derived ownership gate ──────────────────────────────────
// Privacy blast radius: a spoofed ctrlUnsubscribe call with a victim's
// followerActorId must NOT bust the victim's feed cache. Ownership is now decided by
// the session (readCurrentAuthUser + readSocialActorOwnerLinkDAL), not a caller id.

describe('ctrlUnsubscribe — [V06B-M1] session-derived ownership gate', () => {
  beforeEach(() => { vi.clearAllMocks(); grantSession(); setupSuccessfulWrites() })

  it('throws when unauthenticated (no session user)', async () => {
    readCurrentAuthUser.mockResolvedValue(null)
    await expect(
      ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow('not authenticated')
  })

  it('throws when the session does not own followerActorId (spoofed unfollow)', async () => {
    readSocialActorOwnerLinkDAL.mockResolvedValue(null)
    await expect(
      ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow('actor not owned by session user')
  })

  it('does not call dalDeactivateFollow when ownership gate rejects', async () => {
    readSocialActorOwnerLinkDAL.mockResolvedValue(null)
    await expect(
      ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow()
    expect(dalDeactivateFollow).not.toHaveBeenCalled()
  })

  it('does not call dalUpdateRequestStatus when ownership gate rejects', async () => {
    readSocialActorOwnerLinkDAL.mockResolvedValue(null)
    await expect(
      ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow()
    expect(dalUpdateRequestStatus).not.toHaveBeenCalled()
  })

  it('does not call invalidateFeedFollowCache when ownership gate rejects (privacy-critical)', async () => {
    readSocialActorOwnerLinkDAL.mockResolvedValue(null)
    await expect(
      ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow()
    expect(invalidateFeedFollowCache).not.toHaveBeenCalled()
  })

  it('binds ownership on the follower actor (not the followed)', async () => {
    await ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: FOLLOWER, userId: USER })
  })

  it('proceeds when the session owns followerActorId (authentic caller)', async () => {
    const result = await ctrlUnsubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(result).toBe(true)
  })
})

// ─── successful unsubscribe flow ──────────────────────────────────────────────

describe('ctrlUnsubscribe — successful unsubscribe: DAL writes + cache bust', () => {
  beforeEach(() => { vi.clearAllMocks(); grantSession(); setupSuccessfulWrites() })

  it('calls dalDeactivateFollow with correct actor ids', async () => {
    await ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    expect(dalDeactivateFollow).toHaveBeenCalledWith({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
    })
  })

  it('calls dalUpdateRequestStatus with status: revoked', async () => {
    await ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    expect(dalUpdateRequestStatus).toHaveBeenCalledWith({
      requesterActorId: FOLLOWER,
      targetActorId: FOLLOWED,
      status: 'revoked',
    })
  })

  it('runs both DAL writes (deactivate + revoke) exactly once each', async () => {
    await ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    expect(dalDeactivateFollow).toHaveBeenCalledTimes(1)
    expect(dalUpdateRequestStatus).toHaveBeenCalledTimes(1)
  })

  it('calls invalidateFollowerCount for the followed actor', async () => {
    await ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    expect(invalidateFollowerCount).toHaveBeenCalledWith(FOLLOWED)
  })

  it('calls invalidateFeedFollowCache for the follower actor (revokes private post access)', async () => {
    await ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    expect(invalidateFeedFollowCache).toHaveBeenCalledWith(FOLLOWER)
  })

  it('returns true on success', async () => {
    const result = await ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    expect(result).toBe(true)
  })
})
