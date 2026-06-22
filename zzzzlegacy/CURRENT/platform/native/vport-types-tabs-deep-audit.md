# VPort Types & Tabs System — Deep Audit & Native Transfer Reference

**Generated:** 2026-05-04
**Purpose:** AI-readable transfer document for native iOS implementation of the VPort type classification system and tab layout engine.
**Source of truth:**
- `apps/VCSM/src/features/profiles/kinds/vport/config/vportTypes.config.js` — type groups
- `apps/VCSM/src/features/profiles/config/profileTabs.config.js` — tab catalog + layouts
- `apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js` — resolution engine
- `apps/VCSM/src/features/profiles/kinds/vport/config/reviewDimensions.config.js` — review dimensions per type
- `apps/VCSM/src/features/profiles/kinds/vport/model/mapVportPublicDetails.model.js` — public profile shape
**Related module:** `native-transfer/modules/public-vport-profile.md`

---

## 1. What This System Is

Every VPort actor has a type (e.g. "barber", "restaurant", "gas station"). The type determines:
1. Which tab layout the public profile shows.
2. Which dashboard card grid the owner sees.
3. Which review dimensions are used for rating calculation.
4. Which service catalog template is applied.

This is config-driven, not database-driven at the tab level. No DB query is needed to resolve the tab layout — the type string from the profile is matched against static lookup tables.

---

## 2. VPort Type → Supabase Storage

**Create VPort RPC:** `vport.create_vport`
```
p_primary_category_key: string  -- underscore format, e.g. "gas_station", "nail_technician"
```

**Conversion rule:** Display type → DB key:
```
"Gas Station" → "gas_station"
"Nail Technician" → "nail_technician"
"event planner" → "event_planner"
```
Pattern: `String(value).trim().toLowerCase().replace(/\s+/g, '_')`

**Read type from profile:**
- `vportTypeRow?.vport_type` — from `vport.categories` join via `readVportTypeDAL()`
- Tab resolution uses the display form (spaces, not underscores): `"gas station"`, `"nail technician"`

**Normalize for tab resolution:**
```
String(type).trim().toLowerCase().replace(/_/g, ' ')
```

---

## 3. Complete VPort Type Classification (55 types, 12 groups)

### 3.1 Arts, Media & Entertainment
Types: `artist`, `creator`, `dj`, `event planner`, `musician`, `photographer`, `public figure`, `videographer`
Tab layout: **VPORT_CREATIVE_TABS**
Review dimensions: Creativity, Quality, Communication, Timeliness, Value

### 3.2 Beauty & Wellness
Types: `barber`†, `barbershop`†, `esthetician`, `fitness instructor`, `hairstylist`, `makeup artist`, `massage therapist`, `nail technician`, `yoga instructor`
Tab layout: **VPORT_SERVICE_BOOK_TABS** (group default)
†Exact-type overrides: `barber` → VPORT_BARBER_TABS, `barbershop` → VPORT_BARBERSHOP_TABS
Review dimensions: Service, Results, Cleanliness, Professionalism, Value

### 3.3 Education & Care
Types: `babysitter`, `caregiver`, `counselor`, `elder care`, `nanny`, `teacher`, `therapist`, `tutor`
Tab layout: **VPORT_SERVICE_BOOK_TABS**
Review dimensions: Care Quality, Communication, Reliability, Professionalism, Value

### 3.4 Food, Hospitality & Events
Types: `baker`, `bartender`, `caterer`, `chef`, `cook`, `restaurant`, `server`
Tab layout: **VPORT_FOOD_TABS**
Review dimensions: Service, Food, Quality, Ambience, Value

### 3.5 Health & Medical
Types: `chiropractor`, `dentist`, `doctor`, `nurse`, `nutritionist`
Tab layout: **VPORT_HEALTH_TABS**
Review dimensions: Care Quality, Wait Time, Communication, Cleanliness, Overall Experience

### 3.6 Home, Maintenance & Trades
Types: `carpenter`, `cleaning service`, `contractor`, `electrician`, `gardener`, `handyman`, `landscaper`, `locksmith`†, `mechanic`, `painter`, `plumber`
Tab layout: **VPORT_TRADES_TABS** (group default)
†Exact-type override: `locksmith` → VPORT_BARBER_TABS
Review dimensions: Work Quality, Timeliness, Communication, Professionalism, Value

### 3.7 Professional & Business Services
Types: `accountant`, `bookkeeper`, `business`, `consultant`, `designer`, `developer`, `engineer`, `exchange`†, `lawyer`, `marketer`, `notary`, `organization`, `real estate`
Tab layout: **VPORT_SERVICE_TABS** (group default)
†Exact-type override: `exchange` → VPORT_RATES_TABS
Review dimensions: Expertise, Communication, Timeliness, Professionalism, Value

### 3.8 Retail, Sales & Commerce
Types: `nonprofit`, `shop`, `vendor`
Tab layout: **VPORT_RETAIL_TABS**
Review dimensions: Product Quality, Selection, Service, Pricing, Value

### 3.9 Sports & Fitness
Types: `athlete`, `coach`, `trainer`
Tab layout: **VPORT_SERVICE_BOOK_TABS**
Review dimensions: Coaching, Motivation, Facility, Professionalism, Value

### 3.10 Transport & Logistics
Types: `courier`, `delivery`, `driver`, `mover`, `rideshare`, `towing`, `truck driver`
Tab layout: **VPORT_SERVICE_TABS**
Review dimensions: Safety, Punctuality, Communication, Professionalism, Value

### 3.11 Gas & Fuel
Types: `gas station`
Tab layout: **VPORT_GAS_TABS** — gas tab sorted first (special-cased in resolver)
Review dimensions: Price, Fuel Quality, Service, Cleanliness, Value

### 3.12 Animal Care
Types: `dog walker`, `pet sitter`
Tab layout: **VPORT_SERVICE_BOOK_TABS**
Review dimensions: Care Quality, Reliability, Communication, Professionalism, Value

### 3.13 Other
Types: `other`
Tab layout: **VPORT_TABS** (global fallback)
Review dimensions: Service, Quality, Value, Professionalism, Overall Experience (default)

---

## 4. Tab Resolution Algorithm

The resolution function `getVportTabsByType(type)` follows this priority:

```
Step 1: normalize(type) → String(type).trim().toLowerCase().replace(/_/g, ' ')

Step 2: Check TYPE_TABS[normalized]
  - If match → use exact-type tab set
  - Special case: if type === "gas station" → gas tab moved first

Step 3: Else → resolveGroup(type) → look up group from VPORT_TYPE_GROUPS
  → use GROUP_TABS[group]

Step 4: Else → use GROUP_TABS["Other"] (VPORT_TABS fallback)

Step 5: Owner check (done in VportProfileViewScreen, not in model)
  - If isOwner → append { key: "owner", label: "Owner" } tab at end
  - If not owner → filter out any "owner" tab
```

**TYPE_TABS (exact type overrides):**
```
barber          → VPORT_BARBER_TABS
barbershop      → VPORT_BARBERSHOP_TABS
locksmith       → VPORT_BARBER_TABS    (same as barber — see §8 issues)
gas station     → VPORT_GAS_TABS
exchange        → VPORT_RATES_TABS
```

**GROUP_TABS (group defaults):**
```
Arts, Media & Entertainment         → VPORT_CREATIVE_TABS
Beauty & Wellness                   → VPORT_SERVICE_BOOK_TABS
Education & Care                    → VPORT_SERVICE_BOOK_TABS
Health & Medical                    → VPORT_HEALTH_TABS
Home, Maintenance & Trades          → VPORT_TRADES_TABS
Professional & Business Services    → VPORT_SERVICE_TABS
Retail, Sales & Commerce            → VPORT_RETAIL_TABS
Sports & Fitness                    → VPORT_SERVICE_BOOK_TABS
Transport & Logistics               → VPORT_SERVICE_TABS
Animal Care                         → VPORT_SERVICE_BOOK_TABS
Food, Hospitality & Events          → VPORT_FOOD_TABS
Other                               → VPORT_TABS
```

**Tab visibility gate (TAB_FLAGS):**
All tabs are currently enabled. Flags are a kill-switch mechanism only:
- `false` → tab hidden everywhere even if in a layout
- `true` or `undefined` → enabled (all current flags are `true`)

---

## 5. Tab Catalog — All Available Tabs

14 total tab types:

| Key | Label | Purpose | Visibility |
|---|---|---|---|
| `vibes` | Vibes | Actor post feed (social content) | Most presets |
| `photos` | Photos | Uploaded photo gallery | Most presets |
| `about` | About | Address, hours, phone, website, social links, highlights, payment methods, locksmith areas | Most presets |
| `subscribers` | Subscribers | Citizens following this VPort | Most presets |
| `reviews` | Reviews | Star ratings + dimension scores + review list | Most presets |
| `menu` | Menu | Food/restaurant category + item catalog | food preset only |
| `gas` | Gas | Live gas prices (official + community suggestions) | gas preset only |
| `services` | Services | Service catalog (what the business offers) | Most presets |
| `rates` | Rates | Exchange rates (FX type) | exchange type only |
| `portfolio` | Portfolio | Work portfolio — photos, media | creative, barber, barbershop, locksmith, service-book, trades |
| `book` | Book | Booking calendar — select service, date, confirm | barber, barbershop, locksmith, service-book, health, trades |
| `content` | Content | Owner-created custom content pages (text, links, media) | Most presets |
| `team` | Team | Team member list (barbershop only in tab form) | barbershop only |
| `owner` | Owner | Owner quick actions: Dashboard link, Settings link | Owner-only (injected dynamically) |

---

## 6. Complete Tab Layout Sets (12 presets)

All tabs are shown in display order.

### VPORT_TABS (global fallback — "Other" group)
`about, reviews, content, vibes, photos, subscribers`

### VPORT_SERVICE_TABS (Professional & Business, Transport)
`portfolio, services, reviews, content, about, vibes, photos, subscribers`

### VPORT_BARBER_TABS (barber, locksmith types)
`portfolio, book, services, reviews, content, about, photos, vibes, subscribers`

### VPORT_BARBERSHOP_TABS (barbershop type)
`portfolio, book, team, services, reviews, about, photos, vibes, content, subscribers`

### VPORT_FOOD_TABS (Food, Hospitality & Events group)
`menu, reviews, content, about, services, photos, vibes, subscribers`

### VPORT_GAS_TABS (gas station type — gas tab moved first by resolver)
`gas, services, content, about, reviews, photos, vibes, subscribers`

### VPORT_RATES_TABS (exchange type)
`rates, services, content, reviews, about, photos, vibes, subscribers`

### VPORT_CREATIVE_TABS (Arts, Media & Entertainment group)
`portfolio, vibes, content, reviews, services, about, photos, subscribers`

### VPORT_SERVICE_BOOK_TABS (Beauty non-barber, Education, Sports, Animal Care)
`portfolio, book, services, reviews, about, photos, vibes, subscribers`

### VPORT_HEALTH_TABS (Health & Medical group)
`book, services, reviews, about, photos, subscribers`

### VPORT_TRADES_TABS (Home, Maintenance & Trades group — non-locksmith)
`portfolio, services, book, reviews, about, photos, subscribers`

### VPORT_RETAIL_TABS (Retail, Sales & Commerce group)
`services, reviews, about, photos, vibes, subscribers`

---

## 7. Complete Type → Tab Layout Quick Reference

| VPort Type | Preset | First Tab | Has Book | Has Menu | Has Gas | Has Rates | Has Portfolio | Has Team |
|---|---|---|---|---|---|---|---|---|
| artist | creative | portfolio | — | — | — | — | ✓ | — |
| creator | creative | portfolio | — | — | — | — | ✓ | — |
| dj | creative | portfolio | — | — | — | — | ✓ | — |
| event planner | creative | portfolio | — | — | — | — | ✓ | — |
| musician | creative | portfolio | — | — | — | — | ✓ | — |
| photographer | creative | portfolio | — | — | — | — | ✓ | — |
| public figure | creative | portfolio | — | — | — | — | ✓ | — |
| videographer | creative | portfolio | — | — | — | — | ✓ | — |
| **barber** | barber | portfolio | ✓ | — | — | — | ✓ | — |
| **barbershop** | barbershop | portfolio | ✓ | — | — | — | ✓ | ✓ |
| esthetician | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| fitness instructor | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| hairstylist | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| makeup artist | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| massage therapist | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| nail technician | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| yoga instructor | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| babysitter | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| caregiver | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| counselor | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| elder care | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| nanny | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| teacher | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| therapist | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| tutor | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| baker | food | menu | — | ✓ | — | — | — | — |
| bartender | food | menu | — | ✓ | — | — | — | — |
| caterer | food | menu | — | ✓ | — | — | — | — |
| chef | food | menu | — | ✓ | — | — | — | — |
| cook | food | menu | — | ✓ | — | — | — | — |
| restaurant | food | menu | — | ✓ | — | — | — | — |
| server | food | menu | — | ✓ | — | — | — | — |
| chiropractor | health | book | ✓ | — | — | — | — | — |
| dentist | health | book | ✓ | — | — | — | — | — |
| doctor | health | book | ✓ | — | — | — | — | — |
| nurse | health | book | ✓ | — | — | — | — | — |
| nutritionist | health | book | ✓ | — | — | — | — | — |
| carpenter | trades | portfolio | ✓ | — | — | — | ✓ | — |
| cleaning service | trades | portfolio | ✓ | — | — | — | ✓ | — |
| contractor | trades | portfolio | ✓ | — | — | — | ✓ | — |
| electrician | trades | portfolio | ✓ | — | — | — | ✓ | — |
| gardener | trades | portfolio | ✓ | — | — | — | ✓ | — |
| handyman | trades | portfolio | ✓ | — | — | — | ✓ | — |
| landscaper | trades | portfolio | ✓ | — | — | — | ✓ | — |
| **locksmith** | barber† | portfolio | ✓ | — | — | — | ✓ | — |
| mechanic | trades | portfolio | ✓ | — | — | — | ✓ | — |
| painter | trades | portfolio | ✓ | — | — | — | ✓ | — |
| plumber | trades | portfolio | ✓ | — | — | — | ✓ | — |
| accountant | service | portfolio | — | — | — | — | ✓ | — |
| bookkeeper | service | portfolio | — | — | — | — | ✓ | — |
| business | service | portfolio | — | — | — | — | ✓ | — |
| consultant | service | portfolio | — | — | — | — | ✓ | — |
| designer | service | portfolio | — | — | — | — | ✓ | — |
| developer | service | portfolio | — | — | — | — | ✓ | — |
| engineer | service | portfolio | — | — | — | — | ✓ | — |
| **exchange** | rates | rates | — | — | — | ✓ | — | — |
| lawyer | service | portfolio | — | — | — | — | ✓ | — |
| marketer | service | portfolio | — | — | — | — | ✓ | — |
| notary | service | portfolio | — | — | — | — | ✓ | — |
| organization | service | portfolio | — | — | — | — | ✓ | — |
| real estate | service | portfolio | — | — | — | — | ✓ | — |
| nonprofit | retail | services | — | — | — | — | — | — |
| shop | retail | services | — | — | — | — | — | — |
| vendor | retail | services | — | — | — | — | — | — |
| athlete | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| coach | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| trainer | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| courier | service | portfolio | — | — | — | — | ✓ | — |
| delivery | service | portfolio | — | — | — | — | ✓ | — |
| driver | service | portfolio | — | — | — | — | ✓ | — |
| mover | service | portfolio | — | — | — | — | ✓ | — |
| rideshare | service | portfolio | — | — | — | — | ✓ | — |
| towing | service | portfolio | — | — | — | — | ✓ | — |
| truck driver | service | portfolio | — | — | — | — | ✓ | — |
| **gas station** | gas | gas | — | — | ✓ | — | — | — |
| dog walker | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| pet sitter | service-book | portfolio | ✓ | — | — | — | ✓ | — |
| other | default | about | — | — | — | — | — | — |

†locksmith uses VPORT_BARBER_TABS (portfolio, book, services, reviews, content, about, photos, vibes, subscribers)

---

## 8. Data Contract Per Tab

### 8.1 `vibes` — Actor Post Feed
**Source:** `vc.posts` (via `useActorPosts`)
**Rendered by:** `ActorProfilePostsView`
**Data is real.** Standard social post query scoped to `profileActorId`.

### 8.2 `photos` — Photo Gallery
**Source:** `vc.post_media` or `platform.media_assets` (scoped to actor)
**Rendered by:** `ActorProfilePhotosView`
**Data is real.** Filtered to photo-type media from actor's posts.

### 8.3 `about` — Business Details
**Source:** `vport.profile_public_details` via `readVportPublicDetailsByActorId`
**Data is real.** All fields come from DB.

Fields exposed:
```
actorId, profileId, vportType,
name, slug, bio, avatarUrl, bannerUrl, isActive,
cityId, websiteUrl, emailPublic, phonePublic, locationText,
address (JSONB: {line1, line2, city, state, zip, country}),
hours (JSONB: {mon, tue, wed, thu, fri, sat, sun} each with open/close),
priceTier, highlights[], languages[], paymentMethods[],
socialLinks (JSONB), bookingUrl,
logoUrl, flyerFoodImage1, flyerFoodImage2,
flyerHeadline, flyerSubheadline, flyerNote, accentColor
```

**Locksmith-specific:** About tab additionally loads `locksmith.service_areas` via `useLocksmithProfile(actorId, type)` — shows coverage map/areas section.

### 8.4 `subscribers` — Follower List
**Source:** Social follow/subscribe table (actor-scoped)
**Hook:** `useSubscribers(actorId)`
**Data is real.** Shows Citizens following this VPort.

### 8.5 `reviews` — Ratings + Review List
**Source:** `reviews.*` schema
**Rendered by:** `VportReviewsView` → `VportReviewsTab`
**Data is real.** Pulls reviews, aggregate score, and dimension scores.
**Dimension config:** Per type/group from `reviewDimensions.config.js` (see §9)

### 8.6 `menu` — Food/Restaurant Menu
**Source:** `vport.menu_categories` + `vport.menu_items`
**Controller:** `getVportPublicMenu.controller.js`
**DAL:** `readVportPublicMenu.rpc.dal.js` — uses `vport.public_menu_read_model_v` (public view)
**Data is real.**
**Owner actions:** Add/edit/delete categories and items when isOwner
**Visitor actions:** "Leave food review" → routes to reviews tab with "food" initial subtab

### 8.7 `gas` — Gas Prices
**Source:** Gas-specific tables in vport schema
**Hooks:** `useVportGasPrices`, `useSubmitFuelPriceSuggestion`, `useOwnerPendingSuggestions`
**Data is real.** Official prices (owner-set) + community suggestions.
Two panels: official prices display + pending suggestions for owner to approve/reject.

### 8.8 `services` — Service Catalog
**Source:** `vport.services`
**Hook:** `useVportServices` (via `VportServicesView`)
**Data is real.** Owner manages via dashboard services screen.

### 8.9 `rates` — Exchange Rates
**Source:** External FX rates API or `vport` schema FX table
**Hook:** `useVportRates` (via `VportRatesView`)
**Type:** `rateType="fx"` passed to VportRatesView
**Data is real.** Exchange type specific.

### 8.10 `portfolio` — Work Portfolio
**Source:** `platform.media_assets` + portfolio metadata table
**Hook:** `useVportPortfolio(actorId)`
**Data is real.** Portfolio items have photos, titles, descriptions.
**Owner actions:** Upload, edit, reorder, delete items (via dashboard portfolio screen)
**Visitor view:** Read-only gallery.

### 8.11 `book` — Booking
**Source:** `vport.resources`, `vport.bookings`, `vport.availability_rules`
**Variant A (barbershop):** `VportBarberShopBookingView` — multi-lane staff calendar
**Variant B (all other bookable types):** `VportBookingView` → split by isOwner:
  - isOwner → `VportOwnerBookingView` — month/day/agenda views + create booking
  - not owner → `VportPublicBookingFlow` — step-by-step: select service → select date → confirm
**Data is real.**

### 8.12 `content` — Custom Content Pages
**Source:** Content pages table (VportContentPage model)
**Variants:** `VportContentPublicView` (visitors) or `VportContentManageView` (owner)
**Data is real.** Owners create/edit custom content pages (articles, links, announcements).

### 8.13 `team` — Team Members
**Source:** `vport.resources` (staff type, meta.status=linked)
**Rendered by:** `VportBarberShopTeamView`
**Data is real.** Barbershop-only tab showing active barbers.

### 8.14 `owner` — Owner Quick Actions
**Source:** None (navigation only)
**Rendered by:** `VportOwnerView`
**Two buttons:** Dashboard link, Settings link
**Injected dynamically** — only shown to owner, not in static config

---

## 9. Review Dimensions Per Group/Type

| Group / Type | Dimensions |
|---|---|
| Food, Hospitality & Events | Service, Food, Quality, Ambience, Value |
| Beauty & Wellness (incl. barber) | Service, Results, Cleanliness, Professionalism, Value |
| Health & Medical | Care Quality, Wait Time, Communication, Cleanliness, Overall Experience |
| Home, Maintenance & Trades | Work Quality, Timeliness, Communication, Professionalism, Value |
| Professional & Business Services | Expertise, Communication, Timeliness, Professionalism, Value |
| Transport & Logistics | Safety, Punctuality, Communication, Professionalism, Value |
| Arts, Media & Entertainment | Creativity, Quality, Communication, Timeliness, Value |
| Education & Care | Care Quality, Communication, Reliability, Professionalism, Value |
| Retail, Sales & Commerce | Product Quality, Selection, Service, Pricing, Value |
| Sports & Fitness | Coaching, Motivation, Facility, Professionalism, Value |
| Gas & Fuel | Price, Fuel Quality, Service, Cleanliness, Value |
| Animal Care | Care Quality, Reliability, Communication, Professionalism, Value |
| Other (default) | Service, Quality, Value, Professionalism, Overall Experience |

**Exact type overrides** (take priority over group):
- `restaurant` → Food group dimensions
- `barber` → Beauty & Wellness dimensions
- `gas station` → Gas & Fuel dimensions

---

## 10. VPort Public Profile Shape

From `mapVportPublicDetailsModel()`:

```swift
struct VportPublicDetails {
  let actorId: String
  let profileId: String      -- vport.profiles.id (stable internal key)
  let kind: String           -- "vport"
  let vportType: String?     -- e.g. "barber", "gas station"

  // Identity
  let name: String?
  let slug: String?
  let bio: String?
  let avatarUrl: String?
  let bannerUrl: String?
  let isActive: Bool?

  // Contact & Location
  let cityId: String?
  let websiteUrl: String?
  let emailPublic: String?
  let phonePublic: String?
  let locationText: String?
  let address: Address?      // {line1, line2, city, state, zip, country}
  let bookingUrl: String?

  // Business Details
  let hours: WeeklyHours?    // {mon, tue, wed, thu, fri, sat, sun: {open, close}}
  let priceTier: String?
  let highlights: [String]
  let languages: [String]
  let paymentMethods: [String]
  let socialLinks: [String: String]

  // Flyer/Marketing
  let logoUrl: String?
  let flyerFoodImage1: String?
  let flyerFoodImage2: String?
  let flyerHeadline: String?
  let flyerSubheadline: String?
  let flyerNote: String?
  let accentColor: String?
}
```

---

## 11. VPort Profile View Screen Behavior

### Tab State
- Default tab: first tab in the resolved tab array
- Tab is set from URL `?tab=<key>` if present (one-shot, first load only)
- User selection is remembered for the session

### Owner Behavior
- Owner sees all standard tabs PLUS injected `owner` tab at end
- Barbershop owner: sees `VportBarberShopOwnerBand` action band above tabs
- Barbershop owner on `book` tab: full-screen calendar overlay replaces normal tab scroll
- Non-barbershop owner on `book` tab: sees `VportOwnerBookingView` (month/day/agenda views)
- Non-owner on `book` tab: sees `VportPublicBookingFlow` (3-step booking wizard)

### Block Status
- If viewer has blocked or is blocked by profile actor → redirect to `/feed`

### Private Profile
- If `gate.canView === false` → `PrivateProfileNotice` shown, no tabs rendered

### Slug / Handle resolution
- Profile loaded via `useVportProfileBySlug(routeSlug)` from `vport.profiles`
- Route: `/profile/:slug` — both numeric actorId and named slug are accepted
- vportType resolved from `publicDetails.vportType ?? profile.vport_type ?? profile.vportType ?? profile.category`

---

## 12. Issues Found in Current System

### Issue 1: Locksmith uses Barber tabs (logic mismatch)
**Problem:** `locksmith` maps to `VPORT_BARBER_TABS`. Barber tabs were designed for individual barbers. Locksmith is a different business model — it's a service trade, not a beauty appointment. Locksmith has special coverage-area data (rendered in About) and its own dashboard module.
**Impact:** Locksmith profile looks identical to barber profile in terms of tab order and context.
**Recommendation:** Create `VPORT_LOCKSMITH_TABS = [portfolio, services, book, reviews, about, photos, subscribers]` (no vibes, content moves out, closer to trades pattern). Or use VPORT_TRADES_TABS directly.

### Issue 2: `content` tab is in most presets but is contextually weak
**Problem:** "Content" is a custom page builder tab. Present in: barber, barbershop, gas, rates, creative, service, food, default. Not present in: health, trades, retail, service-book.
**Impact:** Most small businesses will never create custom content pages. The tab creates clutter for businesses with no content and reduces first-impression quality.
**Recommendation:** Move `content` to the end of each preset (after subscribers), or make it optional per type.

### Issue 3: `vibes` tab (social posts) position varies inconsistently
**Problem:** Vibes position in layouts: 4th in creative (after portfolio), 5th in barber (after content), 6th in food (after about), 3rd in gas, etc. No consistent placement logic.
**Impact:** Users switching between VPort profiles don't know where to find social posts.
**Recommendation:** Standardize: vibes always appears after the primary business tabs (reviews, services) but before utility tabs (about, subscribers).

### Issue 4: No `events` tab
**Problem:** Event planner, musicians, photographers, restaurants, and venues all benefit from an events listing. The type `event planner` exists but has no event-specific tab — it uses the same `portfolio, vibes, content, reviews, services, about, photos, subscribers` as other creative types.
**Impact:** Event-based businesses cannot list upcoming events on their profile.
**Recommendation:** This requires a backend events table. Do not add the tab until the backend exists. Note in the transfer doc as a future gap.

### Issue 5: `owner` tab — minimal utility
**Problem:** The `owner` tab only shows two buttons: "Dashboard" and "Settings". It's low-value as a full tab.
**Recommendation:** Keep it for now as a navigation shortcut. In native, it can be represented as an action menu or a banner button rather than a full tab.

### Issue 6: `Gas & Fuel` group — only one type (`gas station`)
**Problem:** Only one type in this group. Creating a group for one type is over-engineering.
**Impact:** No real issue — works correctly. But if "fuel delivery" or "EV charging station" types are added, they need to be added to the `Gas & Fuel` group.

### Issue 7: `exchange` in `Professional & Business Services` group but has exact-type override
**Problem:** `exchange` sits in the Professional group but gets a special tab set (VPORT_RATES_TABS). This is correct behavior, but the group placement could confuse future developers who don't check TYPE_TABS first.
**Impact:** None in practice. Code is correct.

### Issue 8: Retail types (`nonprofit`, `shop`, `vendor`) have no booking, no portfolio
**Problem:** `shop` and `vendor` have no way to show bookable services or portfolio of products. VPORT_RETAIL_TABS only has: services, reviews, about, photos, vibes, subscribers.
**Impact:** For a vendor at a market or a boutique shop, there's no product showcase tab.
**Recommendation:** Consider adding `portfolio` (as a product showcase) to retail preset. Low priority for now.

### Issue 9: `Food` group includes types that shouldn't show a menu tab
**Problem:** `server`, `bartender`, and `cook` are individual worker types (not establishments). Showing a "Menu" tab for an individual bartender doesn't make sense — they don't own a menu.
**Impact:** Individual food workers who create VPorts see a Menu tab that will always be empty.
**Recommendation:** Add exact-type overrides for `server`, `bartender`, `cook` to use VPORT_SERVICE_BOOK_TABS instead of VPORT_FOOD_TABS. `restaurant`, `chef`, `baker`, `caterer` keep VPORT_FOOD_TABS.

---

## 13. Native Tab System Implementation Guide

### Step 1: Store the normalized VPort type
```swift
func normalizeVportType(_ type: String) -> String {
  return type.trimmingCharacters(in: .whitespaces)
    .lowercased()
    .replacingOccurrences(of: "_", with: " ")
}
```

### Step 2: Resolve tab set
```swift
func getTabsForVportType(_ type: String) -> [VportTab] {
  let t = normalizeVportType(type)
  
  // Exact type overrides
  switch t {
  case "barber", "locksmith":
    return VPORT_BARBER_TABS
  case "barbershop":
    return VPORT_BARBERSHOP_TABS
  case "gas station":
    return VPORT_GAS_TABS  // gas tab is already first in this set
  case "exchange":
    return VPORT_RATES_TABS
  default:
    break
  }
  
  // Group fallback
  let group = resolveGroup(for: t)
  return groupTabs[group] ?? VPORT_TABS
}
```

### Step 3: Inject owner tab (if owner)
```swift
func applyOwnerTab(_ tabs: [VportTab], isOwner: Bool) -> [VportTab] {
  guard isOwner else { return tabs.filter { $0.key != "owner" } }
  if tabs.contains(where: { $0.key == "owner" }) { return tabs }
  return tabs + [VportTab(key: "owner", label: "Owner")]
}
```

### Step 4: Tab rendering — book tab variant
```swift
// book tab renders differently by type AND owner status
if tab.key == "book" {
  if vportType == "barbershop" {
    return VportBarberShopBookingView(profile: profile, isOwner: isOwner)
  } else if isOwner {
    return VportOwnerBookingView(profile: profile)
  } else {
    return VportPublicBookingFlow(profile: profile)
  }
}
```

---

## 14. Swift Tab Enum (for native implementation)

```swift
enum VportTabKey: String {
  case vibes        = "vibes"
  case photos       = "photos"
  case about        = "about"
  case subscribers  = "subscribers"
  case reviews      = "reviews"
  case menu         = "menu"
  case gas          = "gas"
  case services     = "services"
  case rates        = "rates"
  case portfolio    = "portfolio"
  case book         = "book"
  case content      = "content"
  case team         = "team"
  case owner        = "owner"
}

struct VportTab: Identifiable, Equatable {
  let key: VportTabKey
  let label: String
  var id: String { key.rawValue }
}
```

---

## 15. Swift Tab Set Constants (copy these exactly)

```swift
// Global fallback — "other" type and anything unrecognized
let VPORT_TABS: [VportTab] = [
  VportTab(key: .about, label: "About"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .content, label: "Content"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Professional, Transport
let VPORT_SERVICE_TABS: [VportTab] = [
  VportTab(key: .portfolio, label: "Portfolio"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .content, label: "Content"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Barber individual + Locksmith
let VPORT_BARBER_TABS: [VportTab] = [
  VportTab(key: .portfolio, label: "Portfolio"),
  VportTab(key: .book, label: "Book"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .content, label: "Content"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Barbershop
let VPORT_BARBERSHOP_TABS: [VportTab] = [
  VportTab(key: .portfolio, label: "Portfolio"),
  VportTab(key: .book, label: "Book"),
  VportTab(key: .team, label: "Team"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .content, label: "Content"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Restaurant + Food group
let VPORT_FOOD_TABS: [VportTab] = [
  VportTab(key: .menu, label: "Menu"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .content, label: "Content"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Gas station — gas tab first
let VPORT_GAS_TABS: [VportTab] = [
  VportTab(key: .gas, label: "Gas"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .content, label: "Content"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Exchange / FX
let VPORT_RATES_TABS: [VportTab] = [
  VportTab(key: .rates, label: "Rates"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .content, label: "Content"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Artists, Creators, Photographers, etc.
let VPORT_CREATIVE_TABS: [VportTab] = [
  VportTab(key: .portfolio, label: "Portfolio"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .content, label: "Content"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Beauty (non-barber), Education, Sports, Animal Care
let VPORT_SERVICE_BOOK_TABS: [VportTab] = [
  VportTab(key: .portfolio, label: "Portfolio"),
  VportTab(key: .book, label: "Book"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Health & Medical
let VPORT_HEALTH_TABS: [VportTab] = [
  VportTab(key: .book, label: "Book"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Trades (non-locksmith)
let VPORT_TRADES_TABS: [VportTab] = [
  VportTab(key: .portfolio, label: "Portfolio"),
  VportTab(key: .services, label: "Services"),
  VportTab(key: .book, label: "Book"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .subscribers, label: "Subscribers"),
]

// Retail / Shop / Vendor
let VPORT_RETAIL_TABS: [VportTab] = [
  VportTab(key: .services, label: "Services"),
  VportTab(key: .reviews, label: "Reviews"),
  VportTab(key: .about, label: "About"),
  VportTab(key: .photos, label: "Photos"),
  VportTab(key: .vibes, label: "Vibes"),
  VportTab(key: .subscribers, label: "Subscribers"),
]
```

---

## 16. Native Implementation Status (from public-vport-profile.md)

| Feature | Status |
|---|---|
| Profile view with tabs | Present |
| Tab switching | Present |
| Vibes tab (posts) | Present |
| Photos tab | Present |
| About tab | Present |
| Reviews tab | Present |
| Services tab | Present |
| Book tab | Present |
| Menu tab | Present |
| Gas tab | Present |
| Rates tab | Present (exchange) |
| Portfolio tab | Present |
| Team tab | Disabled in PWA flags — not needed yet |
| Content tab | Disabled in PWA flags — not needed yet |
| Owner tab | Present (links to dashboard + settings) |
| VPort type-aware tab set | Present (per previous transfer) |
| Barbershop owner mode | Present |
| Block redirect | Present |
| Private profile gate | Present |

---

## 17. Native Gaps for This Module

| Gap | Priority | Notes |
|---|---|---|
| Verify locksmith gets correct tabs in native (currently uses barber tabs — is this intended?) | P2 | Code-correct but semantically weak |
| `team` tab | P2 | PWA tab flag currently `true` — tab exists in barbershop preset but may need runtime enable decision |
| `content` tab | P2 | Tab flag `true` — custom pages exist, just verify native renders them |
| Review dimension config per type | P1 | Review screen must use correct dimension weights per VPort type group |
| Events tab | None | Does not exist in PWA — do not implement |
| Promotions tab | None | Does not exist in PWA — do not implement |

---

## 18. What Does NOT Exist (Do Not Implement)

These tabs/features do not exist in the PWA codebase as of 2026-05-04:
- Events tab / events listing
- Promotions / deals tab
- Analytics tab on public profile
- Revenue / earnings display on public profile
- Saved / bookmark count on public profile
- Traffic source breakdown

Do not create native screens for these without first confirming PWA implementation exists.

---

## 19. Architecture Rules for Native

- Identity: `actorId` + `kind` only. Never `profileId`, `vportId`, or raw `userId`.
- Tab resolution is pure logic — no network call needed. Resolve in-memory from type string.
- VPort type from profile must be normalized before tab resolution (lowercase, spaces not underscores).
- Owner guard: `String(identity.actorId) == String(profileActorId)` OR ownership via `actor_owners`.
- Block check must happen before any profile data renders. Fail closed.
- Private profile gate must hide all tabs and show subscribe prompt if `canView === false`.
- DAL: explicit column selects only. Never `select *`.
- Public profile reads must use public-safe views or public RPCs. Never bypass with auth.uid() unless RLS guarantees it.

---

*End of audit. This document is the authoritative native transfer reference for the VPort type classification and tab system as of 2026-05-04.*
