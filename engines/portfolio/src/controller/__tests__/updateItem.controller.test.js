/**
 * SPIDER-MAN — updateItem.controller
 *
 * VEN-PORT-005: updateItem must pass callerProfileId into dalReplacePortfolioTags
 * so the DAL-level ownership gate can verify the item before tag mutation.
 *
 * TICKET-PORT-TAGS-DAL-OWNERSHIP-HARDEN-0001
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../config.js', () => ({
  isActorOwner: vi.fn(),
}))

vi.mock('../../dal/portfolioItems.read.dal.js', () => ({
  dalGetPortfolioItemById:    vi.fn(),
  dalGetProfileIdByActorId:   vi.fn(),
}))

vi.mock('../../dal/portfolioItems.write.dal.js', () => ({
  dalUpdatePortfolioItem: vi.fn(),
}))

vi.mock('../../dal/portfolioTags.write.dal.js', () => ({
  dalReplacePortfolioTags: vi.fn(),
}))

vi.mock('../../model/PortfolioItem.model.js', () => ({
  PortfolioItemModel: vi.fn((row) => ({ ...row, mapped: true })),
}))

vi.mock('../../events.js', () => ({
  emit:   vi.fn(),
  EVENTS: { ITEM_UPDATED: 'item.updated' },
}))

import { updateItem } from '../updateItem.controller.js'
import { isActorOwner } from '../../config.js'
import { dalGetPortfolioItemById, dalGetProfileIdByActorId } from '../../dal/portfolioItems.read.dal.js'
import { dalUpdatePortfolioItem } from '../../dal/portfolioItems.write.dal.js'
import { dalReplacePortfolioTags } from '../../dal/portfolioTags.write.dal.js'

const ITEM_ID    = 'item-abc'
const ACTOR_ID   = 'actor-xyz'
const PROFILE_ID = 'profile-999'

beforeEach(() => {
  vi.clearAllMocks()
  dalGetPortfolioItemById.mockResolvedValue({ id: ITEM_ID, profile_id: PROFILE_ID })
  dalGetProfileIdByActorId.mockResolvedValue(PROFILE_ID)
  isActorOwner.mockResolvedValue(true)
  dalUpdatePortfolioItem.mockResolvedValue({ id: ITEM_ID, profile_id: PROFILE_ID })
  dalReplacePortfolioTags.mockResolvedValue([])
})

describe('updateItem — callerProfileId forwarded to dalReplacePortfolioTags', () => {

  it('passes callerProfileId to dalReplacePortfolioTags when tags are provided', async () => {
    await updateItem({ itemId: ITEM_ID, actorId: ACTOR_ID, updates: {}, tags: ['fade', 'cut'] })

    expect(dalReplacePortfolioTags).toHaveBeenCalledWith({
      itemId:          ITEM_ID,
      callerProfileId: PROFILE_ID,
      tags:            ['fade', 'cut'],
    })
  })

  it('does not call dalReplacePortfolioTags when tags is undefined', async () => {
    await updateItem({ itemId: ITEM_ID, actorId: ACTOR_ID, updates: {} })

    expect(dalReplacePortfolioTags).not.toHaveBeenCalled()
  })

  it('calls dalReplacePortfolioTags with empty array when tags is empty', async () => {
    await updateItem({ itemId: ITEM_ID, actorId: ACTOR_ID, updates: {}, tags: [] })

    expect(dalReplacePortfolioTags).toHaveBeenCalledWith({
      itemId:          ITEM_ID,
      callerProfileId: PROFILE_ID,
      tags:            [],
    })
  })

  it('rejects before dalReplacePortfolioTags when caller does not own the item', async () => {
    dalGetProfileIdByActorId.mockResolvedValue('other-profile')

    await expect(
      updateItem({ itemId: ITEM_ID, actorId: ACTOR_ID, updates: {}, tags: ['fade'] })
    ).rejects.toThrow('not authorized to update this item')

    expect(dalReplacePortfolioTags).not.toHaveBeenCalled()
  })

  it('rejects before dalReplacePortfolioTags when isActorOwner returns false', async () => {
    isActorOwner.mockResolvedValue(false)

    await expect(
      updateItem({ itemId: ITEM_ID, actorId: ACTOR_ID, updates: {}, tags: ['fade'] })
    ).rejects.toThrow('not authorized as this actor')

    expect(dalReplacePortfolioTags).not.toHaveBeenCalled()
  })

})
