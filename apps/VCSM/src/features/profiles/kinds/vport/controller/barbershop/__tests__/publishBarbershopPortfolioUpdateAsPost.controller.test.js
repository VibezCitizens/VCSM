/**
 * Regression tests — publishBarbershopPortfolioUpdateAsPost.controller
 *
 * Security invariant (ELEK-003):
 * publishBarbershopPortfolioUpdateAsPostController must require callerActorId
 * and assert ownership via assertSessionOwnsVportActorController before calling
 * createSystemPost.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/booking/adapters/booking.adapter', () => ({
  assertSessionOwnsVportActorController: vi.fn(),
}))

vi.mock('@/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal', () => ({
  resolveVportBarbershopNameDAL: vi.fn(),
  hasRecentBarbershopPortfolioPostDAL: vi.fn(),
}))

vi.mock('@/features/upload/adapters/posts.adapter', () => ({
  createSystemPost: vi.fn(),
}))

vi.mock('@/shared/utils/resolveRealm', () => ({
  PUBLIC_REALM_ID: 'realm-public-001',
}))

import { publishBarbershopPortfolioUpdateAsPostController } from '../publishBarbershopPortfolioUpdateAsPost.controller'
import { assertSessionOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'
import {
  resolveVportBarbershopNameDAL,
  hasRecentBarbershopPortfolioPostDAL,
} from '@/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal'
import { createSystemPost } from '@/features/upload/adapters/posts.adapter'

const ACTOR_ID = 'actor-vport-shop-111'
const CALLER_ACTOR_ID = 'actor-user-owner-222'

// ─── null guards ─────────────────────────────────────────────────────────────

describe('publishBarbershopPortfolioUpdateAsPostController — null guards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when callerActorId is missing', async () => {
    await expect(
      publishBarbershopPortfolioUpdateAsPostController({ actorId: ACTOR_ID })
    ).rejects.toThrow('publishBarbershopPortfolioUpdateAsPost: callerActorId required')
    expect(assertSessionOwnsVportActorController).not.toHaveBeenCalled()
    expect(createSystemPost).not.toHaveBeenCalled()
  })

  it('throws when actorId is missing', async () => {
    await expect(
      publishBarbershopPortfolioUpdateAsPostController({ callerActorId: CALLER_ACTOR_ID })
    ).rejects.toThrow('publishBarbershopPortfolioUpdateAsPost: actorId required')
    expect(createSystemPost).not.toHaveBeenCalled()
  })
})

// ─── ownership gate ───────────────────────────────────────────────────────────

describe('publishBarbershopPortfolioUpdateAsPostController — ownership gate blocks unauthorized caller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertSessionOwnsVportActorController.mockRejectedValue(
      new Error('Actor does not own this vport actor.')
    )
  })

  it('throws when ownership fails and does not call createSystemPost', async () => {
    await expect(
      publishBarbershopPortfolioUpdateAsPostController({
        actorId: ACTOR_ID,
        callerActorId: 'actor-attacker-999',
      })
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(createSystemPost).not.toHaveBeenCalled()
  })
})

// ─── legitimate owner publishes post ────────────────────────────────────────

describe('publishBarbershopPortfolioUpdateAsPostController — legitimate owner publishes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertSessionOwnsVportActorController.mockResolvedValue({ ok: true })
    hasRecentBarbershopPortfolioPostDAL.mockResolvedValue(false)
    resolveVportBarbershopNameDAL.mockResolvedValue('Sharp Cuts')
    createSystemPost.mockResolvedValue({ id: 'post-abc' })
  })

  it('calls createSystemPost when ownership passes', async () => {
    const result = await publishBarbershopPortfolioUpdateAsPostController({
      actorId: ACTOR_ID,
      callerActorId: CALLER_ACTOR_ID,
      portfolioTitle: 'Summer Fades',
      mediaUrl: 'https://cdn.example.com/img.jpg',
    })
    expect(assertSessionOwnsVportActorController).toHaveBeenCalledWith({
      targetActorId: ACTOR_ID,
    })
    expect(createSystemPost).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        post_type: 'barbershop_portfolio_update',
      })
    )
    expect(result).toMatchObject({ published: true, status: 'published', postId: 'post-abc' })
  })

  it('includes vportKind in payload when provided', async () => {
    await publishBarbershopPortfolioUpdateAsPostController({
      actorId: ACTOR_ID,
      callerActorId: CALLER_ACTOR_ID,
      portfolioTitle: 'Fade',
      vportKind: 'barber',
    })
    expect(createSystemPost).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ vportKind: 'barber' }),
      })
    )
  })

  it('sets vportKind to null in payload when omitted', async () => {
    await publishBarbershopPortfolioUpdateAsPostController({
      actorId: ACTOR_ID,
      callerActorId: CALLER_ACTOR_ID,
    })
    expect(createSystemPost).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ vportKind: null }),
      })
    )
  })

  it('returns throttled when dedup check fires', async () => {
    hasRecentBarbershopPortfolioPostDAL.mockResolvedValue(true)
    const result = await publishBarbershopPortfolioUpdateAsPostController({
      actorId: ACTOR_ID,
      callerActorId: CALLER_ACTOR_ID,
    })
    expect(result).toMatchObject({ published: false, status: 'skipped', reason: 'throttled' })
    expect(createSystemPost).not.toHaveBeenCalled()
  })
})
