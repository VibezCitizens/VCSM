/**
 * Regression tests — ctrlUnsubscribe (unsubscribe.controller)
 *
 * Security invariants (VENOM V-SUB-002 / SPIDER-MAN):
 *
 * V-SUB-002 (CRITICAL — ownership gate):
 *   ctrlUnsubscribe must verify that the session actor matches followerActorId
 *   before executing any unfollow action. An attacker calling this with a
 *   victim's followerActorId will force-unfollow the victim and immediately
 *   invalidate their feed cache — revoking access to private posts the victim
 *   legitimately follows. This is a privacy-critical write gate.
 *   ⚠️  Tests in the "[V-SUB-002 REGRESSION]" block WILL FAIL until
 *       assertingActorId ownership gate is added to ctrlUnsubscribe.
 *
 * Run: npx vitest run src/features/social/friend/subscribe/controllers/__tests__/unsubscribe.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

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
import { dalDeactivateFollow } from '@/features/social/friend/request/dal/actorFollows.dal'
import { dalUpdateRequestStatus } from '@/features/social/friend/request/dal/followRequests.dal'
import { invalidateFollowerCount } from '@/features/social/friend/subscribe/dal/subscriberCount.dal'
import { invalidateFeedFollowCache } from '@/features/CentralFeed/adapters/feedCache.adapter'

// ─── fixtures ─────────────────────────────────────────────────────────────────

const FOLLOWER = 'actor-follower-aaa-111'
const FOLLOWED = 'actor-followed-bbb-222'
const ATTACKER = 'actor-attacker-zzz-999'

function setupSuccessfulWrites() {
  dalDeactivateFollow.mockResolvedValue(true)
  dalUpdateRequestStatus.mockResolvedValue(true)
}

// ─── guard: missing actor IDs ─────────────────────────────────────────────────

describe('ctrlUnsubscribe — guard: missing actor ids', () => {
  beforeEach(() => { vi.clearAllMocks() })

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

// ─── [V-SUB-002 REGRESSION] ownership gate ───────────────────────────────────
// ⚠️  These tests WILL FAIL until assertingActorId is added to ctrlUnsubscribe.
//
// Privacy blast radius: a spoofed ctrlUnsubscribe call with victim's
// followerActorId causes invalidateFeedFollowCache(victim) to fire,
// immediately revoking victim's access to all private posts they follow.
//
// Tracking: VENOM V-SUB-002 / CRITICAL / BLOCKED 2026-05-27

describe('ctrlUnsubscribe — [V-SUB-002 REGRESSION] ownership gate: assertingActorId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSuccessfulWrites()
  })

  it('throws when assertingActorId is null (unauthenticated caller)', async () => {
    await expect(
      ctrlUnsubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: null,
      })
    ).rejects.toThrow('session actor does not match follower')
  })

  it('throws when assertingActorId is undefined (missing from call site)', async () => {
    await expect(
      ctrlUnsubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        // assertingActorId intentionally omitted
      })
    ).rejects.toThrow('session actor does not match follower')
  })

  it('throws when assertingActorId belongs to a different actor (spoofed unfollow)', async () => {
    await expect(
      ctrlUnsubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow('session actor does not match follower')
  })

  it('does not call dalDeactivateFollow when ownership gate rejects', async () => {
    await expect(
      ctrlUnsubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    expect(dalDeactivateFollow).not.toHaveBeenCalled()
  })

  it('does not call dalUpdateRequestStatus when ownership gate rejects', async () => {
    await expect(
      ctrlUnsubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    expect(dalUpdateRequestStatus).not.toHaveBeenCalled()
  })

  it('does not call invalidateFeedFollowCache when ownership gate rejects (privacy-critical)', async () => {
    await expect(
      ctrlUnsubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    // Privacy: victim's feed cache must not be busted by an attacker's spoofed call
    expect(invalidateFeedFollowCache).not.toHaveBeenCalled()
  })

  it('proceeds when assertingActorId matches followerActorId (authentic caller)', async () => {
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
  beforeEach(() => {
    vi.clearAllMocks()
    setupSuccessfulWrites()
  })

  it('calls dalDeactivateFollow with correct actor ids', async () => {
    await ctrlUnsubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(dalDeactivateFollow).toHaveBeenCalledWith({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
    })
  })

  it('calls dalUpdateRequestStatus with status: revoked', async () => {
    await ctrlUnsubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(dalUpdateRequestStatus).toHaveBeenCalledWith({
      requesterActorId: FOLLOWER,
      targetActorId: FOLLOWED,
      status: 'revoked',
    })
  })

  it('runs both DAL writes (deactivate + revoke) exactly once each', async () => {
    await ctrlUnsubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(dalDeactivateFollow).toHaveBeenCalledTimes(1)
    expect(dalUpdateRequestStatus).toHaveBeenCalledTimes(1)
  })

  it('calls invalidateFollowerCount for the followed actor', async () => {
    await ctrlUnsubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(invalidateFollowerCount).toHaveBeenCalledWith(FOLLOWED)
  })

  it('calls invalidateFeedFollowCache for the follower actor (revokes private post access)', async () => {
    await ctrlUnsubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(invalidateFeedFollowCache).toHaveBeenCalledWith(FOLLOWER)
  })

  it('returns true on success', async () => {
    const result = await ctrlUnsubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(result).toBe(true)
  })
})
