/**
 * Regression tests — fetchVportPublicDetailsByActorId (vportPublicDetails.read.dal)
 *
 * Architecture contract:
 * - actorId is the canonical public identity — the only ID in the response.
 * - Internal DB IDs (vport_id, _profileId, profileId) must NOT appear in the response.
 * - Lifecycle/moderation flags (is_active, is_deleted) must NOT appear in the response.
 * - Deleted and inactive VPORTs must be filtered at query layer — they return null, not data.
 *
 * ELEK-003: vport_id and any internal profile UUID must not cross the public boundary.
 * ELEK-005: is_deleted and is_active must be enforced as query filters, not response fields.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so factory vars are available when vi.mock is hoisted
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

import { fetchVportPublicDetailsByActorId } from '@/features/profiles/kinds/vport/dal/vportPublicDetails.read.dal'

const ACTOR_ID = 'actor-vport-shop-111'

// Note: is_active is NOT in this mock row because it is not selected anymore.
// The query filters .eq("is_active", true) — active state is enforced, not returned.
const MOCK_PROFILE_ROW = {
  id: 'profile-uuid-internal-999',
  name: 'Sharp Cuts Barbershop',
  slug: 'sharp-cuts',
  bio: 'Premium cuts in downtown.',
  avatar_url: 'https://cdn.example.com/avatar.jpg',
  banner_url: null,
  public_details: {
    city_id: 'city-nyc',
    website_url: null,
    email_public: null,
    phone_public: null,
    location_text: 'Downtown',
    address: '123 Main St',
    hours: null,
    price_tier: null,
    highlights: [],
    languages: [],
    payment_methods: [],
    social_links: {},
    booking_url: null,
    logo_url: null,
    accent_color: null,
  },
}

// ─── null guard ───────────────────────────────────────────────────────────────

describe('fetchVportPublicDetailsByActorId — null guard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null immediately when actorId is null', async () => {
    const result = await fetchVportPublicDetailsByActorId(null)
    expect(result).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns null immediately when actorId is undefined', async () => {
    const result = await fetchVportPublicDetailsByActorId(undefined)
    expect(result).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

// ─── query filters at boundary ────────────────────────────────────────────────

describe('fetchVportPublicDetailsByActorId — query filters enforce deleted/inactive at boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue(mockQueryBuilder)
    mockSelect.mockReturnValue(mockQueryBuilder)
    mockEq.mockReturnValue(mockQueryBuilder)
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null })
  })

  it('applies .eq("is_deleted", false) in the query chain', async () => {
    await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(mockEq).toHaveBeenCalledWith('is_deleted', false)
  })

  it('applies .eq("is_active", true) in the query chain', async () => {
    await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(mockEq).toHaveBeenCalledWith('is_active', true)
  })

  it('applies .eq("actor_id", actorId) in the query chain', async () => {
    await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(mockEq).toHaveBeenCalledWith('actor_id', ACTOR_ID)
  })

  it('returns null when deleted VPORT is filtered (data === null from Supabase)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result).toBeNull()
  })

  it('returns null when inactive VPORT is filtered (data === null from Supabase)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result).toBeNull()
  })
})

// ─── architecture contract: no internal IDs in response ───────────────────────

describe('fetchVportPublicDetailsByActorId — no internal IDs cross the public boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue(mockQueryBuilder)
    mockSelect.mockReturnValue(mockQueryBuilder)
    mockEq.mockReturnValue(mockQueryBuilder)
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null })
  })

  it('does NOT expose vport_id in the returned object', async () => {
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result).not.toHaveProperty('vport_id')
  })

  it('does NOT expose _profileId in the returned object', async () => {
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result).not.toHaveProperty('_profileId')
  })

  it('does NOT expose profileId in the returned object', async () => {
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result).not.toHaveProperty('profileId')
  })
})

// ─── architecture contract: no lifecycle flags in response ────────────────────

describe('fetchVportPublicDetailsByActorId — lifecycle/moderation flags not in response', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue(mockQueryBuilder)
    mockSelect.mockReturnValue(mockQueryBuilder)
    mockEq.mockReturnValue(mockQueryBuilder)
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null })
  })

  it('does NOT include is_deleted in the returned object', async () => {
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result).not.toHaveProperty('is_deleted')
  })

  it('does NOT include is_active in the returned object', async () => {
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result).not.toHaveProperty('is_active')
  })
})

// ─── response shape ───────────────────────────────────────────────────────────

describe('fetchVportPublicDetailsByActorId — response shape', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue(mockQueryBuilder)
    mockSelect.mockReturnValue(mockQueryBuilder)
    mockEq.mockReturnValue(mockQueryBuilder)
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null })
  })

  it('returns actor_id and kind in response', async () => {
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result.actor_id).toBe(ACTOR_ID)
    expect(result.kind).toBe('vport')
  })

  it('returns name and slug from profile row', async () => {
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result.name).toBe('Sharp Cuts Barbershop')
    expect(result.slug).toBe('sharp-cuts')
  })

  it('returns null when profile row is absent', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await fetchVportPublicDetailsByActorId(ACTOR_ID)
    expect(result).toBeNull()
  })

  it('throws when Supabase returns an error', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('DB connection failed') })
    await expect(fetchVportPublicDetailsByActorId(ACTOR_ID)).rejects.toThrow('DB connection failed')
  })
})
