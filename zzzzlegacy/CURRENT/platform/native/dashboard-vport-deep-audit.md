# VPort Dashboard — Deep Audit & Native Transfer Reference

**Generated:** 2026-05-03
**Purpose:** AI-readable transfer document for native iOS implementation of the VPort Owner Dashboard.
**Source of truth:** `apps/VCSM/src/features/dashboard/`
**Architecture contract:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
**Module tracker:** `native-transfer/modules/dashboard-routes.md`

---

## 1. What the Dashboard Is

The VPort Dashboard is the owner-only management surface for a VCSM business actor. It is accessible only when `identity.actorId === routeActorId`. Every screen performs this guard before loading any data.

The dashboard has two parts:
1. **Home card grid** — `/actor/:actorId/dashboard` — shows navigation cards tailored by VPort type.
2. **Sub-screens** — each card navigates to a dedicated screen for that domain (reviews, leads, team, bookings, etc.).

---

## 2. PWA Route Map (13 routes)

| Route | Screen File | Description | Data Backed |
|---|---|---|---|
| `/actor/:actorId/dashboard` | `VportDashboardScreen.jsx` | Card grid home | Yes (profile hydration) |
| `/actor/:actorId/dashboard/reviews` | `VportDashboardReviewScreen.jsx` | Full reviews view | Yes (`reviews.*`) |
| `/actor/:actorId/dashboard/leads` | `VportDashboardLeadsScreen.jsx` | Contact leads manager | Yes (`vport.business_card_leads`) |
| `/actor/:actorId/dashboard/services` | `VportDashboardServicesScreen.jsx` | Service catalog manager | Yes (`vport.services`) |
| `/actor/:actorId/dashboard/calendar` | `VportDashboardCalendarScreen.jsx` | Weekly availability setup | Yes (`vport.availability_rules`) |
| `/actor/:actorId/dashboard/booking-history` | `VportDashboardBookingHistoryScreen.jsx` | Booking history tabs | Yes (`vport.bookings`) |
| `/actor/:actorId/dashboard/schedule` | `VportDashboardScheduleScreen.jsx` | Day-view staff schedule grid | Yes (`vport.bookings`) |
| `/actor/:actorId/dashboard/portfolio` | `VportDashboardPortfolioScreen.jsx` | Portfolio photo manager | Yes (`platform.media_assets`) |
| `/actor/:actorId/dashboard/team` | `VportDashboardTeamScreen.jsx` | Team member management | Yes (`vport.resources`) |
| `/actor/:actorId/dashboard/team-requests` | `BarberTeamRequestsScreen.jsx` | Pending team invites | Yes (`vport.resources` invites) |
| `/actor/:actorId/dashboard/gas` | `VportDashboardGasScreen.jsx` | Gas price management | Yes (`vport.gas_prices`) |
| `/actor/:actorId/dashboard/locksmith` | `VportDashboardLocksmithScreen.jsx` | Locksmith coverage areas | Yes (`vport.*`) |
| `/actor/:actorId/dashboard/exchange` | `VportDashboardExchangeScreen.jsx` | Exchange rate display | Yes (external rates) |

**Aliased routes** (same screens, `/vport/` prefix): `reviews`, `leads`, `exchange`, `calendar`, and base dashboard.

---

## 3. Dashboard Home — Card Grid System

### How It Works

The home screen builds a card grid from a config-driven model. The cards shown depend on the actor's VPort type. Each card has a title, body, and a navigation handler that routes to a sub-screen.

**Key files:**
- `screens/model/dashboardViewByVportType.model.js` — maps VPort type → preset view → card keys
- `screens/model/buildDashboardCards.model.js` — assembles final card objects with handlers
- `screens/VportDashboardScreen.jsx` — renders the grid

### Type Resolution Order
1. Exact type match in `TYPE_TO_VIEW` (barber, barbershop, locksmith, gas station, exchange)
2. Group match via `VPORT_TYPE_GROUPS` → `GROUP_TO_VIEW`
3. Fall back to `default` preset

### Normalization Rule
`normalizeVportType(type)` → `String(type).trim().toLowerCase().replace(/_/g, ' ')`

---

## 4. VPort Type Groups (All Types)

From `features/profiles/kinds/vport/config/vportTypes.config.js`:

| Group | Types |
|---|---|
| Arts, Media & Entertainment | artist, creator, dj, event planner, musician, photographer, public figure, videographer |
| Beauty & Wellness | barber, barbershop, esthetician, fitness instructor, hairstylist, makeup artist, massage therapist, nail technician, yoga instructor |
| Education & Care | babysitter, caregiver, counselor, elder care, nanny, teacher, therapist, tutor |
| Food, Hospitality & Events | baker, bartender, caterer, chef, cook, restaurant, server |
| Health & Medical | chiropractor, dentist, doctor, nurse, nutritionist |
| Home, Maintenance & Trades | carpenter, cleaning service, contractor, electrician, gardener, handyman, landscaper, locksmith, mechanic, painter, plumber |
| Professional & Business Services | accountant, bookkeeper, business, consultant, designer, developer, engineer, exchange, lawyer, marketer, notary, organization, real estate |
| Retail, Sales & Commerce | nonprofit, shop, vendor |
| Sports & Fitness | athlete, coach, trainer |
| Transport & Logistics | courier, delivery, driver, mover, rideshare, towing, truck driver |
| Gas & Fuel | gas station |
| Animal Care | dog walker, pet sitter |
| Other | other |

---

## 5. Dashboard Preset → Card Grid Mapping

### Exact Type Overrides

| VPort Type | Preset | Card Keys (in display order) |
|---|---|---|
| `barber` | barber | portfolio, calendar, booking_history, services, reviews, leads, reviews_qr, ads†, settings |
| `barbershop` | barbershop | team, portfolio, calendar, booking_history, services, reviews, leads, reviews_qr, ads†, settings |
| `locksmith` | locksmith | locksmith, portfolio, calendar, booking_history, services, reviews, leads, reviews_qr, ads†, settings |
| `gas station` | gas | gas, services, reviews, leads, reviews_qr, ads†, settings |
| `exchange` | exchange | exchange, services, reviews, leads, reviews_qr, ads†, settings |

### Group-Based Presets

| Preset | Groups | Card Keys (in display order) |
|---|---|---|
| default | Arts/Media, Retail, Professional, Other | qr, flyer‡, flyer_edit†, menu_preview, reviews, leads, reviews_qr, ads†, settings |
| service | Beauty (non-barber), Education, Health, Home-Trades (non-locksmith), Transport, Sports, Animals | portfolio, qr, services, reviews, leads, reviews_qr, ads†, settings |
| food | Food, Hospitality & Events | qr, flyer‡, flyer_edit†, menu_preview, services, reviews, leads, reviews_qr, ads†, settings |

†Disabled by default (requires env flag)
‡Enabled by default

### Release Flag Gate (current defaults)
| Card | Flag | Default |
|---|---|---|
| `flyer` | VITE_ENABLE_VPORT_PRINTABLE_FLYER | enabled |
| `flyer_edit` | VITE_ENABLE_VPORT_FLYER_EDITOR | **disabled** |
| `ads` | VITE_ENABLE_VPORT_ADS_PIPELINE | **disabled** |

Additional rule: `flyer` and `flyer_edit` cards are `locked=true` on non-desktop (mobile/PWA). They render but are visually locked and non-interactive.

---

## 6. Card Catalog — Full Spec

| Card Key | Title | Body | Handler | Route/Action |
|---|---|---|---|---|
| `qr` | Menu QR | Generate a branded QR code that opens your online menu instantly. | openQr | `/profile/:slug/menu/qr` or `/actor/:actorId/menu/qr` |
| `flyer` | Printable Flyer | Open a print-optimized flyer with your QR for your menu. | openFlyer | `/actor/:actorId/menu/flyer` (restaurant: `?variant=table`) |
| `flyer_edit` | Edit Flyer | Update headline, note, accent color, hours, and images. | openFlyerEditor | `/actor/:actorId/menu/flyer/edit` |
| `menu_preview` | Preview Online Menu | Preview how your online menu looks to customers. | openOnlineMenuPreview | `/profile/:slug/menu` or `/actor/:actorId/menu` |
| `exchange` | Exchange Rates | View official exchange rates and last updated time. | openExchangeRates | `/actor/:actorId/dashboard/exchange` |
| `team` | Team | Manage staff members, add barbers, and view team availability. | openTeam | `/actor/:actorId/dashboard/team` |
| `portfolio` | Portfolio | Add, edit, and organize your work showcase with photos and details. | openPortfolio | `/actor/:actorId/dashboard/portfolio` |
| `locksmith` | Locksmith Manager | Manage service areas, coverage, and locksmith-specific details. | openLocksmith | `/actor/:actorId/dashboard/locksmith` |
| `services` | Services | Manage your services and add-ons shown on your profile. | openServices | `/actor/:actorId/dashboard/services` |
| `reviews` | Reviews | View and manage your reviews and overall rating. | openReviews | `/actor/:actorId/dashboard/reviews` |
| `leads` | Leads | Review contact requests from directory visitors and follow up fast. | openLeads | `/actor/:actorId/dashboard/leads` |
| `reviews_qr` | Reviews QR | Share a QR code that lets customers scan directly to your reviews page. | openReviewsQr | `/profile/:slug/reviews/qr` or `/actor/:actorId/reviews/qr` |
| `booking_history` | Bookings | View and manage all appointments — pending, upcoming, and past. | openBookingHistory | `/actor/:actorId/dashboard/booking-history` |
| `calendar` | Calendar & Slots | Set weekly working hours and manage availability rules for booking. | openCalendar | `/actor/:actorId/dashboard/calendar` |
| `gas` | Gas Prices | Update official prices and review community suggestions. | openGasPrices | `/actor/:actorId/dashboard/gas` |
| `ads` | Ads Pipeline | Create, publish, pause, and preview VPORT ads from one place. | openAdsPipeline | `/ads/vport/:actorId` |
| `settings` | Settings | Edit public details, hours, highlights, and more. | openSettings | `/actor/:actorId/settings` |

---

## 7. Supabase Data Contracts Per Screen

### 7.1 Dashboard Home (`/dashboard`)
**Data fetched:**
- `vport.profiles` → `id, actor_id, name, slug, is_active, is_deleted` (via actorId)
- Hydrates avatar/banner from actor profile (via `useVportPublicDetails` adapter)

**Identity fields used:**
- `identity.actorId` — owner check
- `identity.vportType` — card grid selection (falls back to `publicDetails.vportType`)

**Owner guard:** `String(identity.actorId) === String(routeActorId)`

---

### 7.2 Leads (`/dashboard/leads`)
**Table:** `vport.business_card_leads`
**Explicit columns:** `id, vport_profile_id, actor_id, name, phone, email, message, source, created_at`

**Read:**
```sql
SELECT id, vport_profile_id, actor_id, name, phone, email, message, source, created_at
FROM vport.business_card_leads
WHERE vport_profile_id = :profileId
ORDER BY created_at DESC
LIMIT 100
```

**Domain model (normalized):**
```
Lead {
  id: string
  profileId: string        -- from vport_profile_id
  actorId: string
  name: string
  phone: string
  email: string
  message: string
  source: string           -- raw text, lowercase
  createdAt: string        -- ISO datetime
  isContacted: boolean     -- source.includes("contacted")
}
```

**Write operations:**
- `markContacted(leadId, profileId)` → writes updated `source` (appends "contacted")
- `deleteLead(leadId, profileId)` → delete row

**Resolution path:** `actorId` → `vport.profiles.id` → `vport_profile_id` for all queries
**Owner guard:** required before any load

---

### 7.3 Booking History (`/dashboard/booking-history`)
**Table:** `vport.bookings`
**Explicit columns:** `id, resource_id, service_id, customer_actor_id, status, source, starts_at, ends_at, timezone, service_label_snapshot, duration_minutes, customer_name, customer_note, created_by_actor_id, created_at, updated_at`

**Client-side tab filters:**
| Tab | Filter |
|---|---|
| All | no filter |
| Pending | `status === 'pending'` |
| Today | `starts_at` within today 00:00–23:59, `status !== 'cancelled'` |
| Upcoming | `starts_at >= tomorrow 00:00`, exclude: cancelled, completed, no_show |
| Past | `starts_at < today 00:00` |
| Cancelled | `status === 'cancelled'` |

**Actor hydration:** customer actor cards are hydrated from `identity.actor_directory` using `customer_actor_id`

**Resolution path:** `actorId` → `vport.resources` (owner's resources) → `resource_id` for booking queries

---

### 7.4 Schedule (`/dashboard/schedule`)
**Tables:** `vport.bookings`, `vport.resources`
**View:** Day-view grid with staff lanes. Each lane is a resource (staff member). Bookings appear as time blocks.
**Operations:** Create booking (owner-initiated), update booking status
**Native note:** PWA schedule screen intentionally maps to `OwnerDashboardCalendarViewScreen` in native — they share the same backing data.

---

### 7.5 Calendar (`/dashboard/calendar`)
**Table:** `vport.availability_rules`
**Purpose:** Weekly availability template (not bookings). Owner sets open/closed hours per day of week.
**Operations:** Read rules, create/update/delete rules per day

---

### 7.6 Team (`/dashboard/team`)
**Table:** `vport.resources`
**Scope:** Only for `barbershop` type. Other types see this card only if it is in their preset (currently only barbershop preset includes `team`).

**Domain shape:**
```
TeamMember {
  resourceId: string
  name: string
  meta: {
    status: 'linked' | 'pending' | 'declined'
  }
  isActive: boolean
  resourceType: 'staff'
}
```

**Operations:**
- List members → filter `resource_type = 'staff'`
- Add barber → `sendRequest(barberVportActorId)` → creates invite record
- Remove member → deletes resource row
- Active: `meta.status !== 'declined'`
- Declined: `meta.status === 'declined'`

**Barbershop-specific:** The "+ Add barber" button only renders when `identity.vportType === 'barbershop'`

---

### 7.7 Team Requests (`/dashboard/team-requests`)
**Table:** `vport.resources` (invites)
**Scope:** Barbershop barbers accepting/declining invitations from a shop.
**Hook:** `useBarberTeamRequests(actorId)`
**Controller:** `vportTeamInvite.controller.js`

---

### 7.8 Gas (`/dashboard/gas`)
**Two panels:**
1. **Official prices panel** — owner sets official fuel prices per fuel type
2. **Pending suggestions panel** — community-submitted price suggestions that owner approves or rejects

**Tables:** (resolved through gas-specific adapters in `profiles/kinds/vport/hooks/gas/`)
- `useVportGasPrices` — official + community prices
- `useOwnerPendingSuggestions` — pending community submissions

---

### 7.9 Portfolio (`/dashboard/portfolio`)
**Tables:** `platform.media_assets`, portfolio write table
**Operations:** Upload photo, set title/description, reorder, delete
**Upload path:** Cloudflare → records in `platform.media_assets` with `media_asset_id` back-reference

---

### 7.10 Reviews (`/dashboard/reviews`)
**Component:** Delegates to `VportReviewsView` adapter (shared with public profile)
**Data:** Same reviews data as public profile, but owner can see management actions

---

### 7.11 Settings (`/actor/:actorId/settings`, not under dashboard route)
**Accessed via settings card from dashboard**
**Fields editable:**
- name, tagline, bio, phone, website
- address (street, city, state, zip)
- hours (weekly schedule)
- highlights
- directory visibility toggle
- business card settings
- TRAZE card visibility (SEO/Traffic discovery)
- Ads preview

**Table:** `vport.profiles` + public details table
**Write:** `saveVportPublicDetailsByActorId.controller.js`

---

## 8. Quick Stats Hook

**Hook:** `useOwnerQuickStats(actorId)`
**Controller:** `vportOwnerStats.controller.js`

**What it computes:**
| Metric | Source | Logic |
|---|---|---|
| `todayCount` | `vport.bookings` | bookings where starts_at is today (00:00–23:59) |
| `upcomingCount` | `vport.bookings` | bookings where starts_at is tomorrow through +8 days |
| `activeBarbers` | `vport.resources` | resources where resource_type=staff, is_active≠false, meta.status=linked |

**Resolution path:** actorId → `vport.profiles.id` → profileId for all queries

**NOT implemented (analytics gap):**
- Views / impressions
- Searches
- Click-to-call
- Direction requests
- Saves / favorites
- Shares
- Conversion rate
- Revenue / earnings
- Traffic by source, location, time, or device

These metrics do not exist anywhere in the PWA codebase as of this audit date.

---

## 9. Owner Guard Pattern

All dashboard screens use this exact pattern:

```js
const isOwner = Boolean(actorId) && Boolean(identity?.actorId) && String(identity.actorId) === String(actorId)
```

Data loads only when `isOwner === true`. Passing `null` to data hooks when not owner is the standard pattern.

**Native must implement the same guard using:**
- `identity.actorId` (from session/actor context)
- `routeActorId` (from route params)
- Never use profileId or vportId for this check

---

## 10. Native Current Status (from dashboard-routes.md)

| Screen | Native Status |
|---|---|
| Dashboard home (card grid) | Present |
| Gas | Present |
| Reviews | Present |
| Services | Present |
| Exchange | Present |
| Calendar | Present |
| Portfolio | Present |
| Locksmith | Present |
| Booking history | Present |
| Owner settings | Present |
| Ads | Present (flag-gated) |
| Flyer / Design Studio | Present |
| Schedule | Present (maps to CalendarViewScreen) |
| **Leads** | **MISSING** |
| **Team** | **MISSING** |
| **Team-requests** | **MISSING** |

---

## 11. Native Gaps — Priority

| Priority | Gap | What's Needed |
|---|---|---|
| P1 | Leads screen | DAL: read `vport.business_card_leads`, model, controller (markContacted, delete), view |
| P1 | Team screen | DAL: read `vport.resources` (staff type), model, view with add/remove |
| P1 | Team-requests screen | DAL: read invite resources, accept/decline actions |
| P1 | Card grid type-awareness | Dashboard home must show correct cards per VPort type (use preset table in §5) |
| P2 | Analytics metrics | No data source exists yet — block until backend is built |

---

## 12. Dashboard Home — Native Card Grid Implementation Guide

The native home screen must replicate the config-driven card grid. Implementation approach:

### Step 1: Resolve VPort type
```
normalizedType = actorVportType.lowercased().trimmingCharacters(.whitespaces).replacingOccurrences(of: "_", with: " ")
```

### Step 2: Resolve preset
```
if TYPE_TO_VIEW[normalizedType] exists → use that preset
else → look up group from VPORT_TYPE_GROUPS → look up preset from GROUP_TO_VIEW
else → use "default" preset
```

### Step 3: Filter card keys by feature flags
```
filter out "flyer_edit" (disabled by default)
filter out "ads" (disabled by default)
filter out "flyer" on non-desktop (mobile: show but locked, or hide)
```

### Step 4: Render card grid
Each card: title, body, tap → navigate to corresponding route/screen

### Preset → card key arrays (copy exactly):

```
default:     ["qr", "flyer", "menu_preview", "reviews", "leads", "reviews_qr", "settings"]
             (flyer_edit and ads stripped due to flag defaults)

service:     ["portfolio", "qr", "services", "reviews", "leads", "reviews_qr", "settings"]

barber:      ["portfolio", "calendar", "booking_history", "services", "reviews", "leads", "reviews_qr", "settings"]

barbershop:  ["team", "portfolio", "calendar", "booking_history", "services", "reviews", "leads", "reviews_qr", "settings"]

locksmith:   ["locksmith", "portfolio", "calendar", "booking_history", "services", "reviews", "leads", "reviews_qr", "settings"]

food:        ["qr", "flyer", "menu_preview", "services", "reviews", "leads", "reviews_qr", "settings"]
             (flyer_edit stripped)

gas:         ["gas", "services", "reviews", "leads", "reviews_qr", "settings"]

exchange:    ["exchange", "services", "reviews", "leads", "reviews_qr", "settings"]
```

---

## 13. Leads Screen — Native Implementation Spec

### Data Contract

**Read query:**
```sql
SELECT id, vport_profile_id, actor_id, name, phone, email, message, source, created_at
FROM vport.business_card_leads
WHERE vport_profile_id = :profileId
ORDER BY created_at DESC
LIMIT 100
```

**profileId resolution:** actorId → `vport.profiles` → `id` (same pattern as other screens)

**Domain model:**
```swift
struct VportLead {
  let id: String
  let name: String
  let phone: String
  let email: String
  let message: String
  let source: String
  let createdAt: Date
  let isContacted: Bool  // source.lowercased().contains("contacted")
}
```

**Write: Mark contacted**
Update `source` field to append "contacted" indicator.

**Write: Delete**
Delete row by `id` where `vport_profile_id = :profileId` (owner-scoped).

### UI Spec
- Summary count card at top (shows total leads count)
- Per-lead card shows: name, phone/email, message preview (truncated), date, source label, status badge (New/Contacted)
- Actions: "Mark as contacted" (disabled if already contacted), "Delete"
- Empty state: "No leads yet."
- Error state: show error message (dev: raw error, prod: generic message)

---

## 14. Team Screen — Native Implementation Spec

### Scope
Only meaningful for `barbershop` type. Other types should not navigate here (card not shown in their preset).

### Data Contract

**Read:** `vport.resources` filtered to `resource_type = 'staff'`

**Domain model:**
```swift
struct TeamMember {
  let resourceId: String
  let name: String
  let status: TeamMemberStatus  // linked | pending | declined
  let isActive: Bool
}

enum TeamMemberStatus {
  case linked, pending, declined
}
```

**Active members:** `meta.status != "declined"`
**Declined members:** `meta.status == "declined"` (shown in separate section)

### Write operations
- Add barber: `vportTeamInvite.controller` → creates resource invite record
- Remove member: delete resource by `resourceId`

### UI Spec
- Member count label
- "+ Add barber" button (barbershop only)
- Active members list with name, status badge
- Declined section (collapsible or separate)
- Removing: shows loading state, error on failure

---

## 15. Architecture Rules for Native Implementation

Per `ARCHITECTURE.md`:

- Identity: use `actorId` and `kind` only. Never `profileId`, `vportId`, or raw `userId`.
- Ownership: `actor_owners` is the authoritative ownership model.
- Build order: DAL → Model → Controller → Service/Hook → View → Screen
- DAL: explicit column selects only. Never `select *`.
- Screens: no business logic. No DB access. Delegate to service/hook.
- Cross-feature access: through adapters only.
- Fail closed: RLS failures must not expose data. Safety/moderation checks fail closed.
- Do not use: `vc.booking_*` (use `vport.*`), `vc.user_blocks` (use `moderation.*`), `vc.reports` (use `moderation.*`)

---

## 16. What Native Must NOT Implement (Until Backend Exists)

The following routes exist in PWA as UI stubs only. They have no backing DB tables or DAL in the PWA. Do not implement native screens for these:

| PWA Route | Status | Action |
|---|---|---|
| Analytics dashboard | Not implemented | Wait for backend |
| Revenue/earnings | Not implemented | Wait for backend |
| Ads pipeline full UI | Flag-gated, no native equivalent yet | Wait for approval |

---

## 17. Files Changed Since Last Sync

No PWA dashboard files were changed in the 2026-05-03 session. This document is a deep read from the current state of the codebase. The module tracker (`dashboard-routes.md`) reflects the prior sync date of 2026-05-03.

---

## 18. Recommended Native Implementation Batch

Implement in this order:

1. **Dashboard home card grid type-awareness** — highest user impact; currently native may show wrong cards
2. **Leads screen** — full DAL + model + service + view (spec in §13)
3. **Team screen** — DAL + model + service + view (spec in §14)
4. **Team-requests screen** — lighter; same data layer as team

After each implementation:
- Update `dashboard-routes.md` Transfer History
- Update `NATIVE_COMMAND_CENTER.md` Changes table
- Update `ROADTRIP_INDEX.md` parity table if module status changes

---

*End of audit. This document is the authoritative native transfer reference for the VPort Dashboard as of 2026-05-03.*
