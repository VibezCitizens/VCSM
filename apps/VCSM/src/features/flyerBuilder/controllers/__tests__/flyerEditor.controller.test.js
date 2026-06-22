/**
 * Regression tests — flyerEditor.controller
 *
 * ELEK-001 / VEN-DASH-002:
 * Flyer public details saves must derive profile_id from the verified VPORT
 * actor, not from a caller-supplied profileId.
 *
 * Run: npx vitest run src/features/flyerBuilder/controller/__tests__/flyerEditor.controller.test.js
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@media', () => ({
  uploadMediaController: vi.fn(),
}))

vi.mock('@/features/media/adapters/media.adapter', () => ({
  createMediaAssetController: vi.fn(),
}))

vi.mock('@/features/media/adapters/mediaAppId.adapter', () => ({
  resolveVcsmAppId: vi.fn(),
}))

vi.mock('@/features/flyerBuilder/designStudio/controllers/designStudio.shared.controller', () => ({
  requireOwnerActorAccess: vi.fn(),
}))

vi.mock('@/shared/lib/vport/resolveVportProfileId', () => ({
  resolveVportProfileId: vi.fn(),
}))

vi.mock('@/features/flyerBuilder/dal/flyer.write.dal', () => ({
  saveFlyerPublicDetails: vi.fn(),
}))

import { requireOwnerActorAccess } from '@/features/flyerBuilder/designStudio/controllers/designStudio.shared.controller'
import { resolveVportProfileId } from '@/shared/lib/vport/resolveVportProfileId'
import { saveFlyerPublicDetails } from '@/features/flyerBuilder/dal/flyer.write.dal'
import { saveFlyerPublicDetailsCtrl } from '../flyerEditor.controller'

const OWNER_ACTOR_ID = 'actor-vport-1'
const RESOLVED_PROFILE_ID = 'profile-owned-1'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('saveFlyerPublicDetailsCtrl', () => {
  it('requires ownerActorId before checking ownership or writing', async () => {
    await expect(
      saveFlyerPublicDetailsCtrl({ patch: {} })
    ).rejects.toThrow('ownerActorId is required')

    expect(requireOwnerActorAccess).not.toHaveBeenCalled()
    expect(resolveVportProfileId).not.toHaveBeenCalled()
    expect(saveFlyerPublicDetails).not.toHaveBeenCalled()
  })

  it('rejects non-owners before resolving profile or writing', async () => {
    requireOwnerActorAccess.mockRejectedValue(new Error('not owner'))

    await expect(
      saveFlyerPublicDetailsCtrl({ ownerActorId: OWNER_ACTOR_ID, patch: {} })
    ).rejects.toThrow('not owner')

    expect(requireOwnerActorAccess).toHaveBeenCalledWith(OWNER_ACTOR_ID)
    expect(resolveVportProfileId).not.toHaveBeenCalled()
    expect(saveFlyerPublicDetails).not.toHaveBeenCalled()
  })

  it('derives profileId from the verified owner actor before saving', async () => {
    const patch = { flyer_headline: 'Lunch menu' }
    const saved = { profile_id: RESOLVED_PROFILE_ID, flyer_headline: 'Lunch menu' }

    requireOwnerActorAccess.mockResolvedValue('user-1')
    resolveVportProfileId.mockResolvedValue(RESOLVED_PROFILE_ID)
    saveFlyerPublicDetails.mockResolvedValue(saved)

    const result = await saveFlyerPublicDetailsCtrl({
      ownerActorId: OWNER_ACTOR_ID,
      profileId: 'attacker-profile-id',
      patch,
    })

    expect(resolveVportProfileId).toHaveBeenCalledWith(OWNER_ACTOR_ID)
    expect(saveFlyerPublicDetails).toHaveBeenCalledWith({
      profileId: RESOLVED_PROFILE_ID,
      patch,
    })
    expect(saveFlyerPublicDetails).not.toHaveBeenCalledWith(
      expect.objectContaining({ profileId: 'attacker-profile-id' })
    )
    expect(result).toEqual(saved)
  })

  it('does not write when the verified actor has no VPORT profile', async () => {
    requireOwnerActorAccess.mockResolvedValue('user-1')
    resolveVportProfileId.mockResolvedValue(null)

    await expect(
      saveFlyerPublicDetailsCtrl({ ownerActorId: OWNER_ACTOR_ID, patch: {} })
    ).rejects.toThrow('VPORT profile not found.')

    expect(saveFlyerPublicDetails).not.toHaveBeenCalled()
  })
})
