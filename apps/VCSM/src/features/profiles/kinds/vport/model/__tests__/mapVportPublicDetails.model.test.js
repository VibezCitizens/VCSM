/**
 * Regression tests — mapVportPublicDetailsModel
 *
 * Architecture contract:
 * - actorId is the canonical public identity. It is the only ID on the public surface.
 * - profileId, vportId, _profileId must NOT be in the model output.
 * - isActive and isDeleted must NOT be in the model output.
 *   (Deleted/inactive VPORTs are filtered at the DAL query layer — they produce null raw input.)
 * - A null raw input must return null without throwing.
 */

import { describe, it, expect } from 'vitest'
import { mapVportPublicDetailsModel } from '../mapVportPublicDetails.model'

const RAW = {
  actor_id: 'actor-vport-111',
  kind: 'vport',
  name: 'Sharp Cuts',
  slug: 'sharp-cuts',
  bio: 'Premium cuts.',
  avatar_url: 'https://cdn.example.com/avatar.jpg',
  banner_url: null,
  // is_active and is_deleted intentionally absent — not selected by DAL
  city_id: 'city-nyc',
  website_url: null,
  email_public: null,
  phone_public: null,
  location_text: 'Downtown',
  address: '123 Main St',
  hours: null,
  price_tier: null,
  highlights: ['Walk-ins welcome'],
  languages: ['en'],
  payment_methods: ['cash', 'card'],
  social_links: { instagram: 'sharpcuts' },
  booking_url: null,
  logo_url: null,
  flyer_food_image_1: null,
  flyer_food_image_2: null,
  flyer_headline: null,
  flyer_subheadline: null,
  flyer_note: null,
  accent_color: '#7c3aed',
}

const VPORT_TYPE_ROW = { vport_type: 'barbershop' }

// ─── null guard ───────────────────────────────────────────────────────────────

describe('mapVportPublicDetailsModel — null guard', () => {
  it('returns null when raw is null', () => {
    expect(mapVportPublicDetailsModel(null, VPORT_TYPE_ROW)).toBeNull()
  })

  it('returns null when raw is undefined', () => {
    expect(mapVportPublicDetailsModel(undefined, VPORT_TYPE_ROW)).toBeNull()
  })

  it('returns null when raw is null and vportTypeRow is also null', () => {
    expect(mapVportPublicDetailsModel(null, null)).toBeNull()
  })
})

// ─── architecture contract: no internal IDs ───────────────────────────────────

describe('mapVportPublicDetailsModel — no internal IDs in output', () => {
  it('does NOT include profileId in the output', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result).not.toHaveProperty('profileId')
  })

  it('does NOT include vportId in the output', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result).not.toHaveProperty('vportId')
  })

  it('does NOT include _profileId in the output', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result).not.toHaveProperty('_profileId')
  })

  it('does NOT include vport_id in the output', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result).not.toHaveProperty('vport_id')
  })
})

// ─── architecture contract: no lifecycle/moderation flags ─────────────────────

describe('mapVportPublicDetailsModel — no lifecycle or moderation flags in output', () => {
  it('does NOT include isActive in the output', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result).not.toHaveProperty('isActive')
  })

  it('does NOT include isDeleted in the output', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result).not.toHaveProperty('isDeleted')
  })

  it('does NOT include is_active in the output', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result).not.toHaveProperty('is_active')
  })

  it('does NOT include is_deleted in the output', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result).not.toHaveProperty('is_deleted')
  })
})

// ─── canonical identity ───────────────────────────────────────────────────────

describe('mapVportPublicDetailsModel — actorId is the only identity on the surface', () => {
  it('exposes actorId from raw.actor_id', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result.actorId).toBe('actor-vport-111')
  })

  it('exposes kind from raw.kind', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result.kind).toBe('vport')
  })
})

// ─── public presentation fields ───────────────────────────────────────────────

describe('mapVportPublicDetailsModel — public presentation fields', () => {
  it('maps vportType from vportTypeRow', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result.vportType).toBe('barbershop')
  })

  it('vportType is null when vportTypeRow is null', () => {
    const result = mapVportPublicDetailsModel(RAW, null)
    expect(result.vportType).toBeNull()
  })

  it('maps name, slug, bio', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result.name).toBe('Sharp Cuts')
    expect(result.slug).toBe('sharp-cuts')
    expect(result.bio).toBe('Premium cuts.')
  })

  it('maps avatarUrl and bannerUrl', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.jpg')
    expect(result.bannerUrl).toBeNull()
  })

  it('highlights defaults to [] when raw.highlights is not an array', () => {
    const result = mapVportPublicDetailsModel({ ...RAW, highlights: null }, VPORT_TYPE_ROW)
    expect(result.highlights).toEqual([])
  })

  it('languages defaults to [] when raw.languages is not an array', () => {
    const result = mapVportPublicDetailsModel({ ...RAW, languages: undefined }, VPORT_TYPE_ROW)
    expect(result.languages).toEqual([])
  })

  it('paymentMethods defaults to [] when raw.payment_methods is not an array', () => {
    const result = mapVportPublicDetailsModel({ ...RAW, payment_methods: null }, VPORT_TYPE_ROW)
    expect(result.paymentMethods).toEqual([])
  })

  it('socialLinks defaults to {} when raw.social_links is null', () => {
    const result = mapVportPublicDetailsModel({ ...RAW, social_links: null }, VPORT_TYPE_ROW)
    expect(result.socialLinks).toEqual({})
  })

  it('maps accentColor', () => {
    const result = mapVportPublicDetailsModel(RAW, VPORT_TYPE_ROW)
    expect(result.accentColor).toBe('#7c3aed')
  })
})
