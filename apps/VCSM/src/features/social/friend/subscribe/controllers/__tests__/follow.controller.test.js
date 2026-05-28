/**
 * Regression tests — ctrlSubscribe (follow.controller)
 *
 * Security invariants (VENOM V-SUB-001, V-SUB-005 / SPIDER-MAN):
 *
 * V-SUB-001 (CRITICAL — ownership gate):
 *   ctrlSubscribe must verify that the session actor matches followerActorId
 *   before executing any follow action. An actor must never be able to follow
 *   on behalf of another actor (spoofed follower).
 *   ⚠️  Tests in the "[V-SUB-001 REGRESSION]" block WILL FAIL until
 *       assertingActorId ownership gate is added to ctrlSubscribe.
 *
 * V-SUB-005 (MEDIUM — raw UUID in notification linkPath):
 *   publishVcsmNotification must not be called with linkPath containing the
 *   raw followerActorId UUID — it must use a handle/slug instead.
 *   ⚠️  Test in the "[V-SUB-005 REGRESSION]" block WILL FAIL until linkPath
 *       is changed to use a handle-based route.
 *
 * Run: npx vitest run src/features/social/friend/subscribe/controllers/__tests__/follow.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/social/friend/request/dal/actorFollows.dal', () => ({
  dalInsertFollow: vi.fn(),
}))

vi.mock('@/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller', () => ({
  ctrlGetFollowRelationshipState: vi.fn(),
}))

vi.mock('@/features/social/friend/request/controllers/followRequests.controller', () => ({
  ctrlSendFollowRequest: vi.fn(),
}))

vi.mock('@/features/notifications/adapters/notifications.adapter', () => ({
  publishVcsmNotification: vi.fn(),
}))

vi.mock('@/features/social/friend/subscribe/dal/subscriberCount.dal', () => ({
  invalidateFollowerCount: vi.fn(),
}))

vi.mock('@/features/feed/adapters/feedCache.adapter', () => ({
  invalidateFeedFollowCache: vi.fn(),
}))

vi.mock('@/features/block', () => ({
  ctrlGetBlockStatus: vi.fn(),
}))

import { ctrlSubscribe } from '../follow.controller'
import { dalInsertFollow } from '@/features/social/friend/request/dal/actorFollows.dal'
import { ctrlGetFollowRelationshipState } from '@/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller'
import { ctrlSendFollowRequest } from '@/features/social/friend/request/controllers/followRequests.controller'
import { publishVcsmNotification } from '@/features/notifications/adapters/notifications.adapter'
import { invalidateFollowerCount } from '@/features/social/friend/subscribe/dal/subscriberCount.dal'
import { invalidateFeedFollowCache } from '@/features/feed/adapters/feedCache.adapter'
import { ctrlGetBlockStatus } from '@/features/block'

// ─── fixtures ─────────────────────────────────────────────────────────────────

const FOLLOWER = 'actor-follower-aaa-111'
const FOLLOWED = 'actor-followed-bbb-222'
const ATTACKER = 'actor-attacker-zzz-999'

function setupPublicNotFollowing() {
  ctrlGetBlockStatus.mockResolvedValue({ isBlocked: false })
  ctrlGetFollowRelationshipState.mockResolvedValue({
    state: 'not_following',
    isPrivate: false,
    isFollowing: false,
    requestStatus: null,
  })
  dalInsertFollow.mockResolvedValue(true)
}

// ─── guard: missing actor IDs ─────────────────────────────────────────────────

describe('ctrlSubscribe — guard: missing actor ids', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when followerActorId is null', async () => {
    await expect(
      ctrlSubscribe({ followerActorId: null, followedActorId: FOLLOWED })
    ).rejects.toThrow('Missing actor ids')
  })

  it('throws when followedActorId is null', async () => {
    await expect(
      ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: null })
    ).rejects.toThrow('Missing actor ids')
  })

  it('throws when both are missing', async () => {
    await expect(
      ctrlSubscribe({ followerActorId: undefined, followedActorId: undefined })
    ).rejects.toThrow('Missing actor ids')
  })

  it('does not call ctrlGetBlockStatus when ids are missing', async () => {
    await expect(
      ctrlSubscribe({ followerActorId: null, followedActorId: FOLLOWED })
    ).rejects.toThrow()
    expect(ctrlGetBlockStatus).not.toHaveBeenCalled()
  })

  it('does not call dalInsertFollow when ids are missing', async () => {
    await expect(
      ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: null })
    ).rejects.toThrow()
    expect(dalInsertFollow).not.toHaveBeenCalled()
  })
})

// ─── guard: self-follow ───────────────────────────────────────────────────────

describe('ctrlSubscribe — guard: self-follow prevention', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when followerActorId === followedActorId', async () => {
    await expect(
      ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWER })
    ).rejects.toThrow('Cannot follow yourself')
  })

  it('does not call ctrlGetBlockStatus on self-follow attempt', async () => {
    await expect(
      ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWER })
    ).rejects.toThrow()
    expect(ctrlGetBlockStatus).not.toHaveBeenCalled()
  })
})

// ─── guard: blocked actor ─────────────────────────────────────────────────────
// Note: assertingActorId: FOLLOWER is required to pass the ownership gate (V-SUB-001)
// and reach the block check. Intent unchanged — tests that blocked actors are rejected.

describe('ctrlSubscribe — guard: blocked actor', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when isBlocked is true', async () => {
    ctrlGetBlockStatus.mockResolvedValue({ isBlocked: true })
    await expect(
      ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow('Cannot follow a blocked actor')
  })

  it('does not call ctrlGetFollowRelationshipState when blocked', async () => {
    ctrlGetBlockStatus.mockResolvedValue({ isBlocked: true })
    await expect(
      ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow()
    expect(ctrlGetFollowRelationshipState).not.toHaveBeenCalled()
  })

  it('does not call dalInsertFollow when blocked', async () => {
    ctrlGetBlockStatus.mockResolvedValue({ isBlocked: true })
    await expect(
      ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow()
    expect(dalInsertFollow).not.toHaveBeenCalled()
  })
})

// ─── [V-SUB-001 REGRESSION] ownership gate ───────────────────────────────────
// ⚠️  These tests WILL FAIL until assertingActorId is added to ctrlSubscribe.
// They define the required security contract: the session actor must match
// followerActorId before any follow action is executed.
// Tracking: VENOM V-SUB-001 / BLOCKED 2026-05-27

describe('ctrlSubscribe — [V-SUB-001 REGRESSION] ownership gate: assertingActorId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupPublicNotFollowing()
  })

  it('throws when assertingActorId is null (unauthenticated caller)', async () => {
    await expect(
      ctrlSubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: null,
      })
    ).rejects.toThrow('session actor does not match follower')
  })

  it('throws when assertingActorId is undefined (missing from call site)', async () => {
    await expect(
      ctrlSubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        // assertingActorId intentionally omitted
      })
    ).rejects.toThrow('session actor does not match follower')
  })

  it('throws when assertingActorId belongs to a different actor (spoofed follow)', async () => {
    await expect(
      ctrlSubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow('session actor does not match follower')
  })

  it('does not call dalInsertFollow when ownership gate rejects', async () => {
    await expect(
      ctrlSubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    expect(dalInsertFollow).not.toHaveBeenCalled()
  })

  it('does not call publishVcsmNotification when ownership gate rejects', async () => {
    await expect(
      ctrlSubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    expect(publishVcsmNotification).not.toHaveBeenCalled()
  })

  it('proceeds when assertingActorId matches followerActorId (authentic caller)', async () => {
    const result = await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(result.ok).toBe(true)
  })
})

// ─── already following short-circuit ─────────────────────────────────────────

describe('ctrlSubscribe — already following: short-circuit return', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ctrlGetBlockStatus.mockResolvedValue({ isBlocked: false })
    ctrlGetFollowRelationshipState.mockResolvedValue({
      state: 'following',
      isPrivate: false,
      isFollowing: true,
      requestStatus: null,
    })
  })

  it('returns ok:true, mode:follow, isFollowing:true without calling dalInsertFollow', async () => {
    const result = await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(result.ok).toBe(true)
    expect(result.isFollowing).toBe(true)
    expect(result.decision.route).toBe('already_following')
    expect(dalInsertFollow).not.toHaveBeenCalled()
  })

  it('does not call publishVcsmNotification when already following', async () => {
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(publishVcsmNotification).not.toHaveBeenCalled()
  })

  it('does not call invalidateFollowerCount when already following', async () => {
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(invalidateFollowerCount).not.toHaveBeenCalled()
  })
})

// ─── private account: follow request path ────────────────────────────────────

describe('ctrlSubscribe — private account: sends follow request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ctrlGetBlockStatus.mockResolvedValue({ isBlocked: false })
    ctrlGetFollowRelationshipState.mockResolvedValue({
      state: 'not_following',
      isPrivate: true,
      isFollowing: false,
      requestStatus: null,
    })
  })

  it('calls ctrlSendFollowRequest with correct actor ids', async () => {
    ctrlSendFollowRequest.mockResolvedValue('pending')
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(ctrlSendFollowRequest).toHaveBeenCalledWith({
      requesterActorId: FOLLOWER,
      targetActorId: FOLLOWED,
    })
  })

  it('returns mode:request, status:pending when request is queued', async () => {
    ctrlSendFollowRequest.mockResolvedValue('pending')
    const result = await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(result.mode).toBe('request')
    expect(result.status).toBe('pending')
    expect(result.isFollowing).toBe(false)
    expect(result.ok).toBe(true)
  })

  it('returns mode:request, status:following when request auto-accepted', async () => {
    ctrlSendFollowRequest.mockResolvedValue('accepted')
    const result = await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(result.mode).toBe('request')
    expect(result.status).toBe('following')
    expect(result.isFollowing).toBe(true)
  })

  it('does not call dalInsertFollow on private request path', async () => {
    ctrlSendFollowRequest.mockResolvedValue('pending')
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(dalInsertFollow).not.toHaveBeenCalled()
  })
})

// ─── public follow path ───────────────────────────────────────────────────────

describe('ctrlSubscribe — public follow path: DAL + cache + notification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupPublicNotFollowing()
  })

  it('calls dalInsertFollow with correct actor ids', async () => {
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(dalInsertFollow).toHaveBeenCalledWith({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
    })
  })

  it('returns ok:true, mode:follow, isFollowing:true', async () => {
    const result = await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(result.ok).toBe(true)
    expect(result.mode).toBe('follow')
    expect(result.isFollowing).toBe(true)
    expect(result.decision.route).toBe('public_follow')
  })

  it('calls invalidateFollowerCount for the followed actor', async () => {
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(invalidateFollowerCount).toHaveBeenCalledWith(FOLLOWED)
  })

  it('calls invalidateFeedFollowCache for the follower actor (private post visibility)', async () => {
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(invalidateFeedFollowCache).toHaveBeenCalledWith(FOLLOWER)
  })

  it('calls publishVcsmNotification exactly once after successful follow', async () => {
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    expect(publishVcsmNotification).toHaveBeenCalledTimes(1)
  })

  it('notification targets the followed actor as recipient', async () => {
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    const [notif] = publishVcsmNotification.mock.calls[0]
    expect(notif.recipientActorId).toBe(FOLLOWED)
    expect(notif.actorId).toBe(FOLLOWER)
    expect(notif.kind).toBe('follow')
  })

  it('propagates dalInsertFollow error and attaches followDecision context', async () => {
    dalInsertFollow.mockRejectedValue(new Error('db constraint violation'))
    await expect(
      ctrlSubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: FOLLOWER,
      })
    ).rejects.toThrow('db constraint violation')
  })

  it('does not call invalidateFollowerCount when dalInsertFollow throws', async () => {
    dalInsertFollow.mockRejectedValue(new Error('db error'))
    await expect(
      ctrlSubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: FOLLOWER,
      })
    ).rejects.toThrow()
    expect(invalidateFollowerCount).not.toHaveBeenCalled()
  })

  it('does not call publishVcsmNotification when dalInsertFollow throws', async () => {
    dalInsertFollow.mockRejectedValue(new Error('db error'))
    await expect(
      ctrlSubscribe({
        followerActorId: FOLLOWER,
        followedActorId: FOLLOWED,
        assertingActorId: FOLLOWER,
      })
    ).rejects.toThrow()
    expect(publishVcsmNotification).not.toHaveBeenCalled()
  })
})

// ─── [V-SUB-005 REGRESSION] raw UUID in notification linkPath ─────────────────
// ⚠️  This test WILL FAIL until linkPath is changed to use a handle-based route.
// Current code: linkPath: `/profile/${followerActorId}` (raw UUID)
// Required: linkPath must use a human-readable slug (e.g. /u/${handle})
// Tracking: VENOM V-SUB-005 / MEDIUM 2026-05-27

describe('ctrlSubscribe — [V-SUB-005 REGRESSION] notification linkPath must not expose raw UUID', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupPublicNotFollowing()
  })

  it('notification linkPath does not equal /profile/<followerActorId> (raw UUID exposure)', async () => {
    await ctrlSubscribe({
      followerActorId: FOLLOWER,
      followedActorId: FOLLOWED,
      assertingActorId: FOLLOWER,
    })
    const [notif] = publishVcsmNotification.mock.calls[0]
    // Asserts the FIXED behavior. After fix: linkPath must use handle, not raw UUID.
    expect(notif.linkPath).not.toBe(`/profile/${FOLLOWER}`)
  })
})
