/**
 * SPIDER-MAN — portfolioTags.write.dal
 *
 * VEN-PORT-005: dalReplacePortfolioTags must verify ownership of the parent
 * portfolio item before deleting or replacing tags. The portfolio_tags table
 * has no profile_id; ownership is enforced via a pre-check against portfolio_items.
 *
 * TICKET-PORT-TAGS-DAL-OWNERSHIP-HARDEN-0001
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ──────────────────────────────────────────────────────────────

const mockMaybeSingle = vi.fn()
const mockDelete      = vi.fn()
const mockEqChain     = vi.fn()

function buildQueryChain(terminal) {
  const chain = {
    select:      () => chain,
    eq:          () => chain,
    maybeSingle: terminal === 'maybeSingle' ? mockMaybeSingle : () => chain,
    delete:      terminal === 'delete'      ? () => ({ eq: () => mockDelete() }) : () => chain,
  }
  return chain
}

const mockFrom = vi.fn()
const mockSchema = vi.fn(() => ({ from: mockFrom }))
const mockSupabase = { schema: mockSchema }

vi.mock('../../config.js', () => ({
  getSupabaseClient: vi.fn(() => mockSupabase),
}))

vi.mock('../portfolioTags.write.dal.js', async (importOriginal) => {
  return importOriginal()
})

// ── Import after mocks ─────────────────────────────────────────────────────────

import { dalReplacePortfolioTags } from '../portfolioTags.write.dal.js'

// ── Helpers ────────────────────────────────────────────────────────────────────

const ITEM_ID    = 'item-111'
const PROFILE_ID = 'profile-222'
const TAGS       = ['cut', 'fade']

function setupOwnershipPass() {
  let callCount = 0
  mockFrom.mockImplementation((table) => {
    if (table === 'portfolio_items') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { id: ITEM_ID }, error: null }),
              }),
            }),
          }),
        }),
      }
    }
    if (table === 'portfolio_tags') {
      return {
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
        upsert: () => ({
          select: () => Promise.resolve({ data: TAGS.map((t) => ({ portfolio_item_id: ITEM_ID, tag: t })), error: null }),
        }),
      }
    }
    return {}
  })
}

function setupOwnershipFail() {
  mockFrom.mockImplementation((table) => {
    if (table === 'portfolio_items') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }
    }
    return {}
  })
}

function setupOwnershipError() {
  mockFrom.mockImplementation((table) => {
    if (table === 'portfolio_items') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: new Error('db error') }),
              }),
            }),
          }),
        }),
      }
    }
    return {}
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('dalReplacePortfolioTags — VEN-PORT-005 ownership gate', () => {

  it('throws immediately when callerProfileId is missing', async () => {
    await expect(
      dalReplacePortfolioTags({ itemId: ITEM_ID, tags: TAGS })
    ).rejects.toThrow('[dalReplacePortfolioTags] callerProfileId required')

    expect(mockSchema).not.toHaveBeenCalled()
  })

  it('throws when portfolio item is not found for the given callerProfileId', async () => {
    setupOwnershipFail()

    await expect(
      dalReplacePortfolioTags({ itemId: ITEM_ID, callerProfileId: 'wrong-profile', tags: TAGS })
    ).rejects.toThrow('[dalReplacePortfolioTags] item not found or not owned by caller')
  })

  it('throws when the ownership query itself errors', async () => {
    setupOwnershipError()

    await expect(
      dalReplacePortfolioTags({ itemId: ITEM_ID, callerProfileId: PROFILE_ID, tags: TAGS })
    ).rejects.toThrow('db error')
  })

  it('queries portfolio_items with id, profile_id, and is_deleted=false before touching tags', async () => {
    const eqCalls = []
    mockFrom.mockImplementation((table) => {
      if (table === 'portfolio_items') {
        const chain = {
          select: () => chain,
          eq: (col, val) => { eqCalls.push([col, val]); return chain },
          maybeSingle: () => Promise.resolve({ data: { id: ITEM_ID }, error: null }),
        }
        return chain
      }
      return {
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        upsert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      }
    })

    await dalReplacePortfolioTags({ itemId: ITEM_ID, callerProfileId: PROFILE_ID, tags: [] })

    expect(eqCalls).toEqual(
      expect.arrayContaining([
        ['id',         ITEM_ID],
        ['profile_id', PROFILE_ID],
        ['is_deleted', false],
      ])
    )
  })

  it('deletes and replaces tags only after ownership check passes', async () => {
    const callOrder = []

    mockFrom.mockImplementation((table) => {
      if (table === 'portfolio_items') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => {
                    callOrder.push('ownership_check')
                    return Promise.resolve({ data: { id: ITEM_ID }, error: null })
                  },
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'portfolio_tags') {
        return {
          delete: () => ({
            eq: () => {
              callOrder.push('tag_delete')
              return Promise.resolve({ error: null })
            },
          }),
          upsert: () => ({
            select: () => {
              callOrder.push('tag_insert')
              return Promise.resolve({ data: TAGS.map((t) => ({ portfolio_item_id: ITEM_ID, tag: t })), error: null })
            },
          }),
        }
      }
      return {}
    })

    await dalReplacePortfolioTags({ itemId: ITEM_ID, callerProfileId: PROFILE_ID, tags: TAGS })

    expect(callOrder[0]).toBe('ownership_check')
    expect(callOrder[1]).toBe('tag_delete')
    expect(callOrder[2]).toBe('tag_insert')
  })

  it('skips tag insert when tags array is empty but still deletes after ownership pass', async () => {
    const callOrder = []

    mockFrom.mockImplementation((table) => {
      if (table === 'portfolio_items') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => {
                    callOrder.push('ownership_check')
                    return Promise.resolve({ data: { id: ITEM_ID }, error: null })
                  },
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'portfolio_tags') {
        return {
          delete: () => ({
            eq: () => {
              callOrder.push('tag_delete')
              return Promise.resolve({ error: null })
            },
          }),
        }
      }
      return {}
    })

    const result = await dalReplacePortfolioTags({ itemId: ITEM_ID, callerProfileId: PROFILE_ID, tags: [] })

    expect(callOrder).toEqual(['ownership_check', 'tag_delete'])
    expect(result).toEqual([])
  })

})
