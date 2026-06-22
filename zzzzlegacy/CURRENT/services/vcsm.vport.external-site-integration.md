# VCSM VPORT — External Site Integration Spec

**Last updated:** April 10, 2026

## 1. Purpose

Define how a standalone business website (e.g., Tripoint Lock & Keys, a barber shop site, a restaurant landing page) can consume its business data from a VCSM VPORT instead of maintaining a separate database.

The VPORT becomes the **single source of truth** for business identity, services, portfolio, reviews, booking, and contact info. The external site renders its own branded UI but pulls data from VCSM.

## 2. Architecture

```
┌──────────────────────────┐
│  External Business Site   │  (tripointlockandkeys.com)
│  - Own domain             │
│  - Own UI/design          │
│  - Own PWA                │
│  - NO own database        │
└───────────┬──────────────┘
            │
            │  Reads public VPORT data
            │  via Supabase anon client
            │
┌───────────▼──────────────┐
│  VCSM Supabase           │
│  ├─ vc.vports            │
│  ├─ vc.vport_public_details │
│  ├─ vc.vport_services    │
│  ├─ vc.vport_reviews     │
│  ├─ vc.vport_portfolio_items │
│  ├─ vport.bookings / vport.availability_* │
│  └─ RLS: public SELECT allowed │
└──────────────────────────┘
```

## 3. What the External Site Can Consume

### Business Identity

| Data | Table | Fields |
|---|---|---|
| Business name | `vc.vports` | `name`, `slug` |
| Logo / avatar | `vc.vports` | `avatar_url` |
| Banner image | `vc.vports` | `banner_url` |
| Bio / description | `vc.vports` | `bio` |
| Business type | `vc.vports` | `vport_type` (e.g., 'locksmith', 'barber', 'restaurant') |

### Contact & Location

| Data | Table | Fields |
|---|---|---|
| Public email | `vc.vport_public_details` | `email_public` |
| Public phone | `vc.vport_public_details` | `phone_public` |
| Address | `vc.vport_public_details` | `address` (jsonb), `location_text` |
| Coordinates | `vc.vport_public_details` | `lat`, `lng` |
| Hours | `vc.vport_public_details` | `hours` (jsonb) |
| Website URL | `vc.vport_public_details` | `website_url` |
| Social links | `vc.vport_public_details` | `social_links` (jsonb) |
| Payment methods | `vc.vport_public_details` | `payment_methods` (text[]) |

### Services

| Data | Table | Fields |
|---|---|---|
| Service list | `vc.vport_services` | `key`, `label`, `category`, `enabled` |
| Service details (locksmith) | `vc.vport_locksmith_service_details` | `job_type`, `property_type`, `lock_type`, etc. |
| Service areas (locksmith) | `vc.vport_locksmith_service_areas` | Coverage zones |

### Portfolio / Work Photos

| Data | Table | Fields |
|---|---|---|
| Portfolio items | `vc.vport_portfolio_items` | `title`, `description`, `portfolio_kind`, `cover_url` |
| Portfolio media | `vc.vport_portfolio_media` | `url`, `media_type`, `media_role` (before/after/result) |
| Barber details | `vc.vport_barber_portfolio_details` | `haircut_style`, `fade_type`, etc. |
| Locksmith details | `vc.vport_locksmith_portfolio_details` | `job_type`, `property_type`, `is_emergency_job`, etc. |

### Reviews

| Data | Table | Fields |
|---|---|---|
| Review list | `vc.vport_reviews` | `overall_rating`, `body`, `created_at`, `is_verified` |
| Review ratings | `vc.vport_review_ratings` | Per-dimension ratings |
| Review dimensions | `vc.vport_review_dimensions` | Dimension labels and weights per vport_type |

### Menu (Restaurant / Food)

| Data | Table | Fields |
|---|---|---|
| Menu categories | `vc.vport_actor_menu_categories` | `label`, `sort_order`, `is_active` |
| Menu items | `vc.vport_actor_menu_items` | `label`, `description`, `price_cents`, `currency_code`, `is_active` |

### Booking

| Data | Table | Fields |
|---|---|---|
| Availability rules | `vport.availability_rules` | Recurring schedule |
| Availability exceptions | `vport.availability_exceptions` | One-off overrides |
| Available slots | Computed from rules + exceptions + existing bookings |

### Pricing (Gas Station / Exchange)

| Data | Table | Fields |
|---|---|---|
| Fuel prices | `vc.vport_fuel_prices` | `fuel_key`, `price`, `currency_code`, `unit` |
| Exchange rates | `vc.vport_rates` | `base_currency`, `quote_currency`, `buy_rate`, `sell_rate` |

## 4. Integration Method

### Option A — Direct Supabase Client (Simplest)

The external site creates its own Supabase client pointing to the same VCSM project using the **anon key** (public, read-only). RLS policies on public VPORT tables allow SELECT for active vports.

```js
// External site — supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://YOUR_VCSM_SUPABASE_URL',
  'YOUR_VCSM_ANON_KEY'
)

// Fetch business profile
const { data } = await supabase
  .schema('vc')
  .from('vport_public_details')
  .select('*')
  .eq('vport_id', 'TRIPOINT_VPORT_ID')
  .single()

// Fetch services
const { data: services } = await supabase
  .schema('vc')
  .from('vport_services')
  .select('key, label, category, enabled')
  .eq('actor_id', 'TRIPOINT_ACTOR_ID')
  .eq('enabled', true)

// Fetch reviews
const { data: reviews } = await supabase
  .schema('vc')
  .from('vport_reviews')
  .select('overall_rating, body, created_at, is_verified')
  .eq('target_actor_id', 'TRIPOINT_ACTOR_ID')
  .eq('is_deleted', false)
  .order('created_at', { ascending: false })
  .limit(10)
```

**Pros:** Zero backend needed. Works today with existing RLS.
**Cons:** Exposes Supabase URL/anon key in client. Rate limited by Supabase plan.

### Option B — VCSM Public API (Recommended for Production)

Build thin Supabase Edge Functions that return VPORT data as clean JSON. External sites call these endpoints.

```
GET /v1/vport/{actorId}/profile
GET /v1/vport/{actorId}/services
GET /v1/vport/{actorId}/portfolio
GET /v1/vport/{actorId}/reviews
GET /v1/vport/{actorId}/menu
GET /v1/vport/{actorId}/availability?start=...&end=...
```

**Pros:** Clean API contract. Can add caching headers. Can rate-limit per domain. Doesn't expose Supabase directly.
**Cons:** Needs Edge Function development. Extra deployment.

### Option C — Embed VCSM Widgets (Future)

VCSM renders embeddable widgets (reviews carousel, booking form, portfolio grid) that external sites include via `<iframe>` or web component.

```html
<vcsm-reviews actor-id="..." theme="dark"></vcsm-reviews>
<vcsm-booking actor-id="..." service="lockout"></vcsm-booking>
```

**Pros:** Zero integration code. Consistent UX. Auto-updates.
**Cons:** Not built yet. Requires widget infrastructure.

## 5. Example: Tripoint Lock & Keys as VPORT Consumer

### What Tripoint Currently Has (Standalone)
- Landing page with hero, services grid, contact bar
- Lead capture form (stores in own DB)
- Review submission + display (stores in own DB)
- PWA with install prompt
- Separate Supabase project

### What Tripoint Would Get from VCSM VPORT
- Business identity from `vport_public_details` (name, phone, address, hours)
- Services from `vport_services` (lockout, rekey, lock change, etc.)
- Portfolio from `vport_portfolio_items` + media (before/after work photos)
- Reviews from `vport_reviews` (cross-platform reviews visible on VCSM AND tripoint site)
- Booking from `booking_availability_rules` (customers book directly)
- Locksmith-specific details from `vport_locksmith_service_details`

### What Tripoint Would Still Own
- Its own domain (tripointlockandkeys.com)
- Its own UI design / branding
- Its own PWA shell
- Its own SEO / meta tags
- Lead capture (could write to VCSM bookings OR own table)

### Migration Path
1. Create Tripoint as a locksmith VPORT on VCSM
2. Fill in services, portfolio, contact details, hours
3. Replace Tripoint's own DB reads with VCSM Supabase reads
4. Keep Tripoint's UI — just change the data source
5. Reviews written on Tripoint site → insert into `vc.vport_reviews` (requires auth or API)
6. Leads/bookings → insert into `vport.bookings` (requires auth or API)

## 6. RLS Compatibility

These tables have public SELECT policies:

| Table | Policy | Condition |
|---|---|---|
| `vc.vports` | `vports_public_read` | `is_active = true` |
| `vc.vport_public_details` | `vport_public_details_select_public` | Via active vport join |
| `vc.vport_services` | Public read when enabled | `enabled = true` |
| `vc.vport_reviews` | `vport_reviews_select_auth_not_deleted` | `is_deleted = false` (requires auth) |
| `vc.vport_portfolio_items` | Via RPC `get_vport_portfolio` | Active items only |

**Note:** Some tables require authentication (reviews, bookings). External sites would need either:
- A service role key (dangerous — never client-side)
- An Edge Function proxy (recommended)
- Anonymous auth session for read-only access

## 7. Write Operations (External → VCSM)

| Operation | Feasibility | Method |
|---|---|---|
| Submit review | Needs auth | Edge Function or VCSM login |
| Create booking | Needs auth | Edge Function with customer identity |
| Submit lead/inquiry | Possible | Edge Function (no auth needed) |
| Update business info | Owner only | Must use VCSM dashboard |

## 8. Benefits for Business Owners

1. **Single dashboard** — manage everything from VCSM, see it on their own site
2. **Cross-platform reviews** — reviews visible on VCSM app AND their website
3. **Consistent data** — hours, prices, services always in sync
4. **Portfolio showcase** — upload once, display everywhere
5. **Booking integration** — one calendar across all surfaces
6. **SEO** — own domain with own meta, but data from VCSM
7. **No duplicate database** — VCSM is the source of truth

## 9. Change Log

### 2026-04-10 09:30 AM
- Task: Document external site → VPORT data consumption pattern
- Summary: Created spec for how standalone business websites can consume VCSM VPORT data instead of maintaining separate databases. Documented 3 integration methods (direct Supabase, public API, widgets), all consumable data by category, RLS compatibility, write operation feasibility, and migration path using Tripoint Lock & Keys as reference example.
