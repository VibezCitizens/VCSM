# Barber Vport Profile + Dashboard Spec

## 1. Purpose

The barber vport is a service-provider profile for individual barbers, hairstylists, and grooming professionals. It is the flagship vport type in VCSM — the most feature-complete, with booking, portfolio, services, and reviews all active. Users visit a barber profile to see their work, book an appointment, check prices, and read reviews.

## 2. Public Profile Goal

Help a visitor decide whether to book this barber. Within 10 seconds of landing, the visitor should understand:
- What style this barber specializes in
- What their work looks like (portfolio)
- Whether they can book now
- What other customers think (reviews)
- How much services cost

## 3. Core Identity Block

- **Display name:** Business or personal brand name (e.g., "Fade Kings", "Mike the Barber")
- **Username / handle:** `@fadekings` — used in URLs, mentions, shares
- **Avatar / logo:** Square with `rounded-2xl`. Typically the barber's face or shop logo. Must never be circular.
- **Banner:** Wide image — shop interior, chair setup, or branded graphic. Gradient fallback if none set.
- **Headline / short descriptor:** Vport type label ("Barber") shown below display name
- **Location summary:** City + neighborhood. Shown in About tab and optionally in header.
- **Contact / action buttons:**
  - Visitor: Message + Subscribe
  - Owner: QR code sharing
  - Booking CTA should be prominent (tab or inline)

## 4. Public Tabs

| Tab | Required | Purpose |
|-----|----------|---------|
| **Portfolio** | Yes | Showcase haircuts, styles, transformations. This is the landing tab — first impression. |
| **Book** | Yes | Booking calendar with available slots, service selection, duration. |
| **Services** | Yes | Service catalog with prices, durations, descriptions. Grouped by category. |
| **Reviews** | Yes | Customer reviews with dimension ratings (Service Quality, Cleanliness, Professionalism, Value). |
| **Content** | Yes | Owner-authored long-form pages. Barber-specific templates: "Service Guide" and "Booking Tips". Public visitors read published pages; owner can create, draft, and publish from manage view. Stored in `vport.content_pages`. |
| **About** | Yes | Hours, location, contact info, languages, payment methods, bio. |
| **Photos** | Optional | All media posts. Distinct from portfolio — raw feed of photo posts. |
| **Vibes** | Optional | Social feed posts (text, reactions, comments). |
| **Subscribers** | Optional | Public subscriber list. |

**Tab order:** Portfolio → Book → Services → Reviews → Content → About → Photos → Vibes → Subscribers

## 5. Main Content Modules

### Portfolio
- Grid of work samples derived from posts with images
- Transformation detection (before/after pairs)
- Tag-based filtering (fade, lineup, beard trim, etc.)
- Related services shown below portfolio items
- Empty state: "No work examples published yet" with link to Services tab

### Booking
- Calendar view with available dates
- Time slot selection per date
- Service selection (links to Services catalog)
- Duration and price shown per slot
- Owner view: manage availability rules and exceptions

### Services
- Catalog grouped by category (Haircuts, Beard, Grooming, etc.)
- Each service: name, description, price, duration
- Owner mode: toggle services on/off, edit pricing
- Visitor mode: read-only with "Book" CTA per service

### Reviews
- Dimension ratings: Service Quality (1.40 weight), Professionalism (1.20), Cleanliness (1.00), Value (1.00)
- Overall rating summary card with star visualization
- Guided compose form with dimension pills
- One active review per author (24h edit window, then card rotation)
- Author cards with snapshot data (works even for private actors)

### About
- Business hours (per-day schedule with timezone)
- Location (city, address, map link)
- Bio / description
- Languages spoken
- Payment methods accepted
- Contact: website, email, phone

### Gallery / Photos
- Grid of all photo posts
- Full-screen viewer with reactions (like, rose, comment)
- No upload UI in tab — photos come from post creation

## 6. Reviews Behavior

**What customers care about most:**
- Quality of the cut (did it match what they asked for?)
- Cleanliness of the shop and tools
- Professionalism (punctuality, communication, respect)
- Value for money

**Dimension weights (from DB seed):**
| Dimension | Weight | Sort |
|-----------|--------|------|
| Service Quality | 1.40 | 10 |
| Cleanliness | 1.00 | 20 |
| Professionalism | 1.20 | 30 |
| Value | 1.00 | 40 |

**Display priorities:**
- Overall average prominently displayed (large number + stars)
- Total review count shown
- Recent comments visible without scrolling
- Dimension breakdown useful for owner analytics (tab filters)

**History:** Old review cards preserved with `active_card = false`. New card created after 24h edit window expires. Revision history maintained by DB triggers.

**Trust:** Author snapshots ensure review cards always display author identity even if the author's profile becomes private or changes.

## 7. Dashboard Goal

Help the barber manage their daily operations: see upcoming bookings, track review scores, update their service catalog, and keep their portfolio fresh.

## 8. Dashboard Sections

### Bookings Manager
- **Purpose:** View and manage upcoming appointments
- **Key actions:** Confirm, reschedule, cancel bookings
- **Key metrics:** Today's bookings, this week's count, no-show rate
- **Key editing surfaces:** Availability rules, exception dates, blocked times

### Services Editor
- **Purpose:** Manage the service catalog
- **Key actions:** Add/remove services, set prices, set durations, toggle visibility
- **Key metrics:** Most booked service, average service price
- **Key editing surfaces:** Service list with toggle, price/duration fields

### Reviews Dashboard
- **Purpose:** Monitor customer feedback
- **Key actions:** View reviews tab with owner filters (overall, per-dimension)
- **Key metrics:** Overall average, review count, dimension averages, trend
- **Key editing surfaces:** None (reviews are customer-owned)

### Portfolio Manager
- **Purpose:** Curate work showcase
- **Key actions:** Create posts with before/after photos, tag services
- **Key metrics:** Portfolio item count, most viewed
- **Key editing surfaces:** Post creation flow (not inline portfolio editing)
- **Feed-share:** Owner can optionally share a new portfolio item to the central feed at create time. Checkbox defaults unchecked. On create, triggers `barbershop_portfolio_update` system post. Non-blocking — portfolio creation succeeds regardless of feed publish outcome. See Section 13.

### Profile Settings
- **Purpose:** Update business information
- **Key actions:** Edit hours, location, contact, bio, avatar, banner
- **Key metrics:** Profile completeness
- **Key editing surfaces:** About fields, hours schedule, payment methods
- **Feed-share:** Owner can optionally share updated working hours to the central feed after saving. Checkbox defaults unchecked. On save, triggers `barbershop_hours_update` system post. Non-blocking — hours save succeeds regardless of feed publish outcome. See Section 13.

## 9. Owner Feed-Share System

Barbershop VPORT owners can optionally publish system posts to the central feed from two dashboard surfaces. Both use `post_type` values registered in `vc.posts`.

### 9.1 Hours Feed-Share (`barbershop_hours_update`)

**Trigger:** Owner saves Working Hours in the Calendar Settings dashboard (`VportDashboardCalendarScreen`).

**Checkbox label:** "Share these hours to my feed"  
**Checkbox default:** Unchecked  
**Checkbox visibility:** Owner only. Shown only when `identity.vportType` is `"barbershop"` or `"barber"`.  
**Checkbox reset:** Resets after each successful save.

**Post text format:**
```
Booking hours updated at {barbershopName}

Mon: 9:00 AM – 6:00 PM
Tue: 9:00 AM – 6:00 PM
…
```
If hours blocks are not available, falls back to: `Booking hours updated at {barbershopName}`.  
If `barbershopName` is null, uses `"this barbershop"` as fallback.

**Dedup:** 1-hour window per `actorId + post_type`. If a post of type `barbershop_hours_update` already exists for this actor within the window, returns `{ published: false, reason: "throttled" }` — hours save still succeeds.

**Realm:** Always public realm via `resolvePublicRealmIdDAL()`. Never reads viewer session `realmId`. Never posts to Void realm.

**Non-blocking:** Post publish failure does not affect hours save outcome.

### 9.2 Portfolio Feed-Share (`barbershop_portfolio_update`)

**Trigger:** Owner creates a new portfolio item in the Portfolio Manager dashboard (`VportDashboardPortfolioScreen`). Edit mode does not trigger.

**Checkbox label:** "Share this portfolio item to my feed"  
**Checkbox default:** Unchecked  
**Checkbox visibility:** Owner only, create mode only. Shown only when `vportType` is `"barbershop"` or `"barber"`.  
**Checkbox reset:** Resets on successful create and on cancel.

**Post text format:**
```
New portfolio work added by {barbershopName}

{portfolioTitle}
```
If `portfolioTitle` is null or empty, omits the second line.  
If `barbershopName` is null, uses `"this barbershop"` as fallback.

**Media:** If the owner uploaded photos, the first photo's public URL is passed as `media_url` to the post adapter, rendering as an image card in feed. No additional upload work is performed.

**Dedup:** 1-hour window per `actorId + post_type`. Item-level dedup is deferred — within one hour only one portfolio share post is allowed per actor.

**Realm:** Always public realm. See hours section above.

**Non-blocking:** Post publish failure does not affect portfolio item creation outcome.

### 9.3 Architecture Stack

```
Controller:  profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js
             profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js
DAL:         profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal.js
Hook:        profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js
             profiles/kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost.js
Adapter:     features/upload/adapters/posts.adapter.js (createSystemPost)
Realm:       features/feed/dal/resolvePublicRealm.dal.js (resolvePublicRealmIdDAL)
```

### 9.4 vportType Gate

Both features check: `["barbershop", "barber"].includes(String(identity?.vportType ?? "").toLowerCase())`

Both `"barbershop"` and `"barber"` are valid vport type keys. The service catalog alias `barbershop → barber` applies to the service catalog only and does not affect this gate.

## 10. Type-Specific Data Model Needs

Beyond the shared vport model, barber needs:
- **Services catalog:** `vc.vport_services` with category, price, duration, description
- **Booking infrastructure:** All booking tables are in the `vport` schema: `vport.resources`, `vport.bookings`, `vport.availability_rules`, `vport.availability_exceptions`, `vport.service_booking_profiles`. For barbers with org/location setup, also: `vport.organizations`, `vport.locations`. The legacy `vc.booking_*` names no longer exist in the live database.
- **Content pages:** `vport.content_pages` — owner-authored rich-text pages with publish/draft state. Barber-specific templates: "Service Guide" and "Booking Tips".
- **Review dimensions:** `reviews.review_dimensions` with barber-specific keys (service_quality, cleanliness, professionalism, value)
- **Portfolio metadata:** Transformation detection via post tags/keywords (before/after matching)
- **Service profiles:** Duration and pricing per bookable service

## 11. Shared vs Dedicated Logic

### Shared with all Vports
- Actor identity system (actorId, kind, displayName, username, avatar)
- Profile header (banner, avatar, name, bio, subscriber count)
- Privacy gating (private profile → PrivateProfileNotice)
- Block detection (blocked → redirect to feed)
- Reviews engine (submit, edit, delete, stats, dimensions)
- Photos tab (post-derived media grid)
- Vibes tab (social feed)
- Subscribers tab
- About tab structure
- Owner tab

### Dedicated to Barber
- Portfolio tab with transformation detection (before/after photos)
- Book tab with calendar/slot UI
- Services tab with category grouping and owner editing
- Barber-specific review dimensions (service_quality, cleanliness, professionalism, value)
- Service-to-portfolio matching via tag heuristics

## 12. UX Priorities

1. **Portfolio as landing tab** — first impression is visual. Work quality sells.
2. **Booking friction minimization** — from portfolio → book in 2 taps
3. **Trust through reviews** — dimension ratings give specific quality signals, not just a number
4. **Service transparency** — prices and durations visible before booking
5. **Mobile-first layout** — most barber customers browse on phone
6. **Before/after showcase** — transformations are the strongest selling tool for barbers

## 13. Future Expansion

- **Staff/team support:** The data model foundation is already in place — `vport.organizations`, `vport.locations`, `vport.resources`, and the booking engine's `any_available` / `primary_calendar` resolution modes already support multiple staff members under one vport. What is pending is the owner UI to create and manage the org/location/resource workspace. The data infrastructure is not a future item.
- **Transactional reviews:** Reviews tied to completed bookings (higher trust weight)
- **Loyalty tracking:** Repeat customer recognition
- **Style tags:** Searchable style categories (fade, taper, lineup, beard, braids)
- **Wait time estimation:** Real-time queue status for walk-in shops
- **Product recommendations:** Aftercare products linked to services

## Change Log

### 2026-05-10

Task: Add barbershop feed-share system documentation
Code Status Before: DRIFT — no documentation of barbershop_hours_update or barbershop_portfolio_update post types, no feed-share system section
Summary:
- Added Section 9 "Owner Feed-Share System" documenting both post types, checkbox behavior, text format, dedup rules, realm rules, non-blocking contract, architecture stack, and vportType gate.
- Updated Section 8 Portfolio Manager and Profile Settings bullets with feed-share cross-references.
- Renumbered old sections 9–12 to 10–13 to accommodate new section.
Post types added: barbershop_hours_update, barbershop_portfolio_update
Files Changed: zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.barber-profile-spec.md
Validation: Architecture stack file paths confirmed against discovered codebase structure.

### 2026-04-26

Task: Documentation drift resolution — code review + Logan sync
Code Status Before: DRIFT — Section 4 missing Content tab, Section 9 only listed legacy vc tables, Section 12 listed staff/team support as future when infrastructure was already built
Summary:
- Section 4: Added Content tab row (vport.content_pages, barber templates: Service Guide + Booking Tips). Updated tab order to include Content between Reviews and About.
- Section 9: Replaced single booking infrastructure bullet with dual-path description: legacy (vc.booking_*) and neutral (vport.organizations/locations/resources/bookings/availability_*).
- Section 12: Updated Staff/team support to reflect that the data model foundation exists; UI management is what remains.
Files Changed: zNOTFORPRODUCTION/logan/vports/vcsm.vport.barber-profile-spec.md
Validation: Tab order confirmed against profileTabs.config.js VPORT_BARBER_TABS array. Dual-path booking confirmed against engines/booking/src/controller/resolveBookingContext.controller.js. Content tab DB table confirmed as vport.content_pages via listVportContentPages.dal.js.
