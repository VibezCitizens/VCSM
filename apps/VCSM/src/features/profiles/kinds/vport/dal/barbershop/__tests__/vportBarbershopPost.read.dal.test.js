/**
 * Regression tests — vportBarbershopPost.read.dal
 *
 * Security invariant (ELEK-008):
 * resolveVportBarbershopNameDAL must filter out soft-deleted profiles
 * by including .eq("is_deleted", false) in the query chain.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so the factory vars are available when vi.mock is hoisted
const { mockMaybeSingle, mockEq, mockSelect, mockFrom, mockQueryBuilder } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  const mockQueryBuilder = {
    from: mockFrom,
    select: mockSelect,
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
  }

  mockFrom.mockReturnValue(mockQueryBuilder)
  mockSelect.mockReturnValue(mockQueryBuilder)
  mockEq.mockReturnValue(mockQueryBuilder)

  return { mockMaybeSingle, mockEq, mockSelect, mockFrom, mockQueryBuilder }
})

vi.mock('@/services/supabase/vportClient', () => ({
  default: mockQueryBuilder,
}))

vi.mock('@/services/supabase/supabaseClient', () => ({
  supabase: {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

import { resolveVportBarbershopNameDAL } from '../vportBarbershopPost.read.dal'

const ACTOR_ID = 'actor-vport-shop-111'

describe('resolveVportBarbershopNameDAL — is_deleted filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue(mockQueryBuilder)
    mockSelect.mockReturnValue(mockQueryBuilder)
    mockEq.mockReturnValue(mockQueryBuilder)
    mockMaybeSingle.mockResolvedValue({ data: { name: 'Sharp Cuts' }, error: null })
  })

  it('calls .eq("is_deleted", false) in query chain', async () => {
    await resolveVportBarbershopNameDAL(ACTOR_ID)
    expect(mockEq).toHaveBeenCalledWith('is_deleted', false)
  })

  it('also filters by actor_id', async () => {
    await resolveVportBarbershopNameDAL(ACTOR_ID)
    expect(mockEq).toHaveBeenCalledWith('actor_id', ACTOR_ID)
  })

  it('returns barbershop name when not deleted', async () => {
    const result = await resolveVportBarbershopNameDAL(ACTOR_ID)
    expect(result).toBe('Sharp Cuts')
  })

  it('returns null when actorId is falsy', async () => {
    const result = await resolveVportBarbershopNameDAL(null)
    expect(result).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns null when profile is not found', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await resolveVportBarbershopNameDAL(ACTOR_ID)
    expect(result).toBeNull()
  })
})
