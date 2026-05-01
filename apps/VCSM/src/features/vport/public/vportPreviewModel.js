// Pure transform — normalizes pre-fetched VPORT domain data into a flat PreviewModel.
// No React, no network, no Supabase. Safe for static / SEO pages.

export const ACCENT_BY_TYPE = {
  barber:          '#8b5cf6',
  barbershop:      '#7c3aed',
  hairstylist:     '#a855f7',
  'makeup artist': '#c084fc',
  'nail technician': '#e879f9',
  esthetician:     '#f0abfc',
  restaurant:      '#f59e0b',
  baker:           '#fbbf24',
  chef:            '#fcd34d',
  caterer:         '#f97316',
  cook:            '#fb923c',
  locksmith:       '#38bdf8',
  contractor:      '#60a5fa',
  handyman:        '#3b82f6',
  plumber:         '#2563eb',
  electrician:     '#1d4ed8',
  mechanic:        '#0284c7',
  'gas station':   '#4ade80',
  exchange:        '#34d399',
  'money exchange': '#34d399',
}

const DEFAULT_ACCENT = '#8b5cf6'

const TABS_BY_TYPE = {
  barber:          ['Portfolio', 'Services', 'Reviews', 'About'],
  barbershop:      ['Portfolio', 'Services', 'Reviews', 'About'],
  restaurant:      ['Menu', 'Reviews', 'Content', 'About'],
  locksmith:       ['Services', 'Reviews', 'About'],
  'gas station':   ['Fuel', 'Amenities', 'About'],
  exchange:        ['Rates', 'Reviews', 'About'],
  'money exchange': ['Rates', 'Reviews', 'About'],
}
const DEFAULT_TABS = ['Services', 'Reviews', 'About']

const CTA_BY_TYPE = {
  barber:          'Request appointment',
  barbershop:      'Request appointment',
  restaurant:      'Make a reservation',
  locksmith:       'Send request',
  'gas station':   'Get directions',
  exchange:        'Send inquiry',
  'money exchange': 'Send inquiry',
}
const DEFAULT_CTA = 'Send request'

// Canonical form: lowercase, dashes/underscores → spaces, trimmed
function normalizeType(raw) {
  return String(raw || '').toLowerCase().replace(/[-_]/g, ' ').trim()
}

function fmtCents(cents, code = 'USD') {
  if (cents == null) return null
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, minimumFractionDigits: 2 }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toFixed(2)}`
  }
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildMenuSection(menuCategories) {
  if (!menuCategories?.length) return null
  const items = menuCategories
    .flatMap((cat) =>
      (cat.items || []).map((item) => ({
        name: item.name,
        priceLabel: fmtCents(item.priceCents, item.currencyCode),
        category: cat.name,
      }))
    )
    .slice(0, 5)
  return items.length ? { type: 'menu', items } : null
}

function buildServicesSection(services) {
  if (!services?.length) return null
  const items = services
    .filter((s) => s.enabled !== false)
    .slice(0, 5)
    .map((s) => ({
      label: s.label || s.key,
      priceLabel: fmtCents(s.meta?.price_cents) ?? null,
      durationLabel: s.meta?.duration_minutes ? `${s.meta.duration_minutes} min` : null,
    }))
  return items.length ? { type: 'services', items } : null
}

function buildPortfolioSection(portfolio) {
  if (!portfolio?.length) return null
  const items = portfolio.slice(0, 4).map((p) => ({
    id: p.id,
    title: p.title ?? null,
    imageUrl: p.coverImage?.url ?? null,
    serviceLabel: p.serviceLabel ?? null,
  }))
  return items.length ? { type: 'portfolio', items } : null
}

function buildRatesSection(rates) {
  if (!rates?.length) return null
  const items = rates.slice(0, 4).map((r) => ({
    pair: `${r.baseCurrency}/${r.quoteCurrency}`,
    buyLabel: r.buyRate != null ? Number(r.buyRate).toFixed(4) : null,
    sellLabel: r.sellRate != null ? Number(r.sellRate).toFixed(4) : null,
  }))
  return items.length ? { type: 'rates', items } : null
}

function buildFuelSection(fuelPrices) {
  if (!fuelPrices?.length) return null
  const items = fuelPrices
    .filter((f) => f.isAvailable !== false && f.price != null)
    .map((f) => ({
      grade: String(f.fuelKey || '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      priceLabel: `$${Number(f.price).toFixed(2)}`,
      unit: f.unit || 'gal',
    }))
  return items.length ? { type: 'fuel', items } : null
}

function buildReviewsSection(reviews) {
  if (!reviews?.verifiedReviewCount) return null
  return {
    type: 'reviews',
    rating: reviews.officialOverallAvg ?? null,
    count: reviews.verifiedReviewCount,
  }
}

function buildAboutSection(bio) {
  return bio ? { type: 'about', text: bio } : null
}

function buildAmenitiesSection(amenities) {
  if (!amenities?.length) return null
  return { type: 'amenities', items: amenities.slice(0, 8).map(String) }
}

// ── Section order per type ────────────────────────────────────────────────────

function assembleSections(type, payload) {
  const { menuCategories, services, portfolio, rates, fuelPrices, amenities, reviews, bio } = payload
  const menu  = buildMenuSection(menuCategories)
  const svcs  = buildServicesSection(services)
  const port  = buildPortfolioSection(portfolio)
  const rts   = buildRatesSection(rates)
  const fuel  = buildFuelSection(fuelPrices)
  const rvws  = buildReviewsSection(reviews)
  const about = buildAboutSection(bio)
  const amen  = buildAmenitiesSection(amenities)

  const ORDER = {
    barber:          [port, svcs, rvws, about],
    barbershop:      [port, svcs, rvws, about],
    restaurant:      [menu, rvws, about],
    locksmith:       [svcs, rvws, about],
    'gas station':   [fuel, amen, about],
    exchange:        [rts, rvws, about],
    'money exchange': [rts, rvws, about],
  }

  const ordered = (ORDER[type] ?? [svcs, rvws, about]).filter(Boolean)
  return ordered.length ? ordered : [about].filter(Boolean)
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateVportPreview({
  profile,
  reviews,
  menuCategories,
  services,
  portfolio,
  rates,
  fuelPrices,
  amenities,
} = {}) {
  const type   = normalizeType(profile?.vportType)
  const accent = ACCENT_BY_TYPE[type] ?? DEFAULT_ACCENT
  const tabs   = TABS_BY_TYPE[type] ?? DEFAULT_TABS

  const sections = assembleSections(type, {
    menuCategories, services, portfolio, rates,
    fuelPrices, amenities, reviews,
    bio: profile?.bio,
  })

  return {
    vportType: type,
    accent,
    header: {
      name:         profile?.name        || 'My VPORT',
      handle:       profile?.slug        ? `@${profile.slug}` : null,
      avatarUrl:    profile?.avatarUrl   ?? null,
      bannerUrl:    profile?.bannerUrl   ?? null,
      bio:          profile?.bio         ?? null,
      locationText: profile?.locationText ?? null,
      rating:       reviews?.officialOverallAvg ?? null,
      reviewCount:  reviews?.verifiedReviewCount ?? 0,
    },
    tabs,
    activeTab: tabs[0] ?? 'About',
    sections,
    cta: {
      primary:     CTA_BY_TYPE[type] ?? DEFAULT_CTA,
      primaryPath: profile?.slug ? `/profile/${profile.slug}` : '/register?intent=vport',
      secondary:   'View VPORT',
    },
  }
}
