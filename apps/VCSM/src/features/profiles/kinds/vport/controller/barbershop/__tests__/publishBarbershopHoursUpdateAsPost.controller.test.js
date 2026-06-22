/**
 * Regression tests — publishBarbershopHoursUpdateAsPost.controller
 *
 * Security invariant (ELEK-004):
 * publishBarbershopHoursUpdateAsPostController must require callerActorId
 * and assert ownership via assertSessionOwnsVportActorController before calling
 * createSystemPost.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/booking/adapters/booking.adapter', () => ({
  assertSessionOwnsVportActorController: vi.fn(),
}))

vi.mock('@/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal', () => ({
  resolveVportBarbershopNameDAL: vi.fn(),
  hasRecentBarbershopHoursPostDAL: vi.fn(),
}))

vi.mock('@/features/upload/adapters/posts.adapter', () => ({
  createSystemPost: vi.fn(),
}))

vi.mock('@/shared/utils/resolveRealm', () => ({
  PUBLIC_REALM_ID: 'realm-public-001',
}))

import { publishBarbershopHoursUpdateAsPostController } from '../publishBarbershopHoursUpdateAsPost.controller'
import { assertSessionOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'
import {
  resolveVportBarbershopNameDAL,
  hasRecentBarbershopHoursPostDAL,
} from '@/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal'
import { createSystemPost } from '@/features/upload/adapters/posts.adapter'

const ACTOR_ID = 'actor-vport-shop-111'
const CALLER_ACTOR_ID = 'actor-user-owner-222'

const SAMPLE_BLOCKS = [
  { weekday: 1, startMinutes: 540, endMinutes: 1020 },
  { weekday: 3, startMinutes: 540, endMinutes: 1020 },
]

// ─── null guards ─────────────────────────────────────────────────────────────

describe('publishBarbershopHoursUpdateAsPostController — null guards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when callerActorId is missing', async () => {
    await expect(
      publishBarbershopHoursUpdateAsPostController({ actorId: ACTOR_ID, blocks: SAMPLE_BLOCKS })
    ).rejects.toThrow('publishBarbershopHoursUpdateAsPost: callerActorId required')
    expect(assertSessionOwnsVportActorController).not.toHaveBeenCalled()
    expect(createSystemPost).not.toHaveBeenCalled()
  })

  it('throws when actorId is missing', async () => {
    await expect(
      publishBarbershopHoursUpdateAsPostController({
        callerActorId: CALLER_ACTOR_ID,
        blocks: SAMPLE_BLOCKS,
      })
    ).rejects.toThrow('publishBarbershopHoursUpdateAsPost: actorId required')
    expect(createSystemPost).not.toHaveBeenCalled()
  })
})

// ─── ownership gate ───────────────────────────────────────────────────────────

describe('publishBarbershopHoursUpdateAsPostController — ownership gate blocks unauthorized caller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertSessionOwnsVportActorController.mockRejectedValue(
      new Error('Actor does not own this vport actor.')
    )
  })

  it('throws when ownership fails and does not call createSystemPost', async () => {
    await expect(
      publishBarbershopHoursUpdateAsPostController({
        actorId: ACTOR_ID,
        callerActorId: 'actor-attacker-999',
        blocks: SAMPLE_BLOCKS,
      })
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(createSystemPost).not.toHaveBeenCalled()
  })
})

// ─── legitimate owner publishes post ────────────────────────────────────────

describe('publishBarbershopHoursUpdateAsPostController — legitimate owner publishes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertSessionOwnsVportActorController.mockResolvedValue({ ok: true })
    hasRecentBarbershopHoursPostDAL.mockResolvedValue(false)
    resolveVportBarbershopNameDAL.mockResolvedValue('Sharp Cuts')
    createSystemPost.mockResolvedValue({ id: 'post-hours-abc' })
  })

  it('calls createSystemPost when ownership passes', async () => {
    const result = await publishBarbershopHoursUpdateAsPostController({
      actorId: ACTOR_ID,
      callerActorId: CALLER_ACTOR_ID,
      blocks: SAMPLE_BLOCKS,
    })
    expect(assertSessionOwnsVportActorController).toHaveBeenCalledWith({
      targetActorId: ACTOR_ID,
    })
    expect(createSystemPost).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        post_type: 'barbershop_hours_update',
      })
    )
    expect(result).toMatchObject({ published: true, status: 'published', postId: 'post-hours-abc' })
  })

  it('returns throttled when dedup check fires', async () => {
    hasRecentBarbershopHoursPostDAL.mockResolvedValue(true)
    const result = await publishBarbershopHoursUpdateAsPostController({
      actorId: ACTOR_ID,
      callerActorId: CALLER_ACTOR_ID,
      blocks: SAMPLE_BLOCKS,
    })
    expect(result).toMatchObject({ published: false, status: 'skipped', reason: 'throttled' })
    expect(createSystemPost).not.toHaveBeenCalled()
  })
})
