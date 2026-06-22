# Gas Station Vport Profile + Dashboard Spec

## 1. Purpose

The gas station vport is a fuel and convenience profile for gas stations, fuel depots, and service stations. Users visit to check current fuel prices, see what amenities are available, and confirm the station is open. Price is the primary driver — users compare prices across stations before choosing where to fill up.

## 2. Public Profile Goal

Help a visitor decide whether to fuel up here. Within 5 seconds of landing, the visitor should know:
- Current fuel prices by type
- When prices were last updated
- Whether the station is open now
- What amenities are available (car wash, air, convenience store, restrooms)

## 3. Core Identity Block

- **Display name:** Station name (e.g., "Shell Main Street", "QuickStop Fuel")
- **Username / handle:** `@shellmainst` — used in URLs, mentions, shares
- **Avatar / logo:** Square with `rounded-2xl`. Typically the station logo or brand mark. Must never be circular.
- **Banner:** Station exterior, fuel pump area, or branded graphic. Gradient fallback if none set.
- **Headline / short descriptor:** Vport type label ("Gas Station") shown below display name
- **Location summary:** City + street/highway. Critical — users choose stations by proximity.
- **Contact / action buttons:**
  - Visitor: Message + Subscribe
  - Owner: QR code sharing
  - Directions/map link should be prominent

## 4. Public Tabs

| Tab | Required | Purpose |
|-----|----------|---------|
| **Gas** | Yes | Current fuel prices by type. This is the landing tab — the only reason most users visit. |
| **Services** | Optional | Car wash, oil change, tire service, convenience store offerings. |
| **About** | Yes | Hours, location, amenities, contact, station details. |
| **Reviews** | Yes | Customer reviews with station-focused dimensions (Fuel Quality, Service, Cleanliness, Value). |
| **Photos** | Optional | Station photos, amenity photos. |
| **Vibes** | Optional | Social feed posts (price alerts, promotions). |
| **Subscribers** | Optional | Public subscriber list. |

**Tab order:** Gas → Services → Content → About → Reviews → Photos → Vibes → Subscribers

**Default tab behavior:** Gas is the primary landing tab. `VportProfileViewScreen` auto-advances to the first tab of `VPORT_GAS_TABS` once `publicDetails` resolves the vport type. The screen uses `autoAppliedFirstKeyRef` to track the last auto-applied first tab — when type-specific tabs load and the firstKey changes from the generic fallback, the tab advances to "gas" even if the user was temporarily on "about" (the generic fallback first tab). A manual tab selection (`userHasSelectedTabRef`) permanently disables auto-advance.

## 5. Main Content Modules

### Gas Prices
- Fuel type list: always shows standard 4 (Regular, Midgrade, Premium, Diesel) plus any extra fuel keys that have data (e.g. E85). The 4 defaults always render even if the station has only one DB row — preventing single-card display.
- Two-card layout per fuel type:
  - **Official card** — the station owner's authoritative price
  - **Last update card** — shows the most recent price value (community OR official), with timestamp as secondary text below. If a community suggestion is the most recent, it shows the community price number prominently and a "Community" badge.
- Last-updated timestamp shown as secondary text beneath the price value
- Community badge ("Community") or Official badge ("Official") on last update card
- Price submission button visible to all authenticated citizens (not just owners); hidden for the station owner on the public tab (they use the dashboard instead)
- Owner submitting via the public tab fast-tracks directly to official price (no review queue)
- Citizen submitting creates a pending `fuel_price_submissions` record visible immediately via optimistic update to `communitySuggestionByFuelKey`
- Empty state: "No fuel prices available"

### Services
- Non-fuel services: car wash, air pump, oil change, tire inflation, convenience store
- Each service: name, availability, price (if applicable)
- Amenity badges (restrooms, ATM, EV charging, food)
- Visitor mode: read-only
- Owner mode: toggle services

### About
- Business hours (24h stations marked clearly)
- Location with address, highway exit, and map link
- Station brand (Shell, BP, independent, etc.)
- Amenities checklist (restrooms, ATM, air pump, car wash, EV charging, food)
- Payment methods (cash, credit, fleet cards, mobile pay)
- Contact: phone, email

### Reviews
- Dimension ratings: Fuel Quality (1.20 weight), Service (1.00), Cleanliness (1.00), Value (1.20)
- Value dimension carries equal weight to fuel quality — price consciousness is high
- Cleanliness matters (restrooms, pump area, store)
- Overall average shown prominently

## 6. Reviews Behavior

**What customers care about most:**
- Is the fuel quality good? (no engine issues, proper octane)
- Is the station clean? (restrooms, pumps, store)
- Are the prices fair compared to nearby stations?
- Is the staff helpful?

**Dimension weights (from DB seed):**
| Dimension | Weight | Sort |
|-----------|--------|------|
| Fuel Quality | 1.20 | 10 |
| Service | 1.00 | 20 |
| Cleanliness | 1.00 | 30 |
| Value | 1.20 | 40 |

**Display priorities:**
- Value and Fuel Quality are co-dominant signals
- Cleanliness reviews drive repeat visits (especially for restrooms)
- Overall average shown with review count
- Recent comments about station condition are high value

**History:** Card rotation after 24h. Frequent visitors may review multiple times over weeks — each card captures a visit snapshot.

**Trust:** For gas stations, recency of reviews matters more than volume. A 2-week-old review about cleanliness is more useful than a 6-month-old one. Display timestamps prominently.

## 7. Dashboard Goal

Help the station operator keep fuel prices current, track cleanliness feedback, manage amenity listings, and respond to customer concerns. Price updates must be extremely fast — operators may update multiple times per day as wholesale prices change.

## 8. Dashboard Sections

### Gas Price Manager
- **Purpose:** Update fuel prices quickly
- **Key actions:** Edit price per fuel type, add/remove fuel types, mark unavailable fuels
- **Key metrics:** Last update time, price per type, days since last update
- **Key editing surfaces:** Price editor per fuel type, quick-update mode
- **Feed share:** When the owner saves a bulk price update via `BulkUpdateFuelPricesModal`, an optional "Share this update to my feed" checkbox is available. If checked, a post with `post_type = fuel_price_update` is published to the public feed listing the updated fuel prices and station name. The post is non-blocking (failure does not affect the price save). A 1-hour dedup window prevents repeat posts per station. Implemented via `publishFuelPriceUpdateAsPost.controller.js` → `createSystemPost` adapter → `resolvePublicRealmIdDAL` (canonical public realm, never viewer session realm).
- **Price unit preference:** A global station-level toggle selects whether all fuel prices are stored/displayed in **Liter** or **Gallon**. The unit is stored on every row in `vport.fuel_prices.unit`. The DB constraint is `fuel_prices_unit_check CHECK (unit IN ('liter', 'gallon'))`. The toggle uses optimistic local state (`localUnit`) — it updates immediately on click and reverts to the server value if the DB call returns `ok: false`, showing an error message inline. Implemented in `updateStationFuelUnit.controller.js` + `useUpdateStationFuelUnit.js`; wired in `VportDashboardGasScreen.jsx`.
- **Bulk update parallel execution:** `BulkUpdateFuelPricesModal` submits all fuel type updates simultaneously using `Promise.all` (submit phase) then `Promise.allSettled` (review/approve phase), rather than a sequential `for...of` loop. Validation for all rows runs first with no DB calls; if any row fails validation the submit is blocked before any network calls. The panel wrapper (`VportDashboardGasPanels.jsx`) does not refresh after each individual submission — it only refreshes once at the end, preventing one-by-one price flash in the UI.

### Reviews Dashboard
- **Purpose:** Monitor station quality and cleanliness
- **Key actions:** View reviews with dimension filters (Cleanliness, Value, etc.)
- **Key metrics:** Overall average, cleanliness average, value average, review count
- **Key editing surfaces:** None (reviews are customer-owned)

### Services & Amenities Editor
- **Purpose:** Manage non-fuel offerings and amenity listings
- **Key actions:** Toggle amenities, add/edit services, set availability
- **Key metrics:** Amenity count, service count
- **Key editing surfaces:** Amenity checklist, service list

### Profile Settings
- **Purpose:** Update station information
- **Key actions:** Edit hours, location, brand, payment methods, contact
- **Key metrics:** Profile completeness
- **Key editing surfaces:** About fields, hours schedule, amenity flags

## 9. Type-Specific Data Model Needs

Beyond the shared vport model, gas station needs:
- **Fuel prices:** Price per fuel type, fuel type catalog, per-type timestamps, availability flags
- **Amenities:** Checklist of available amenities (restrooms, ATM, car wash, EV charging, air pump, food)
- **Review dimensions:** `reviews.review_dimensions` with gas-specific keys (fuel_quality, service, cleanliness, value)
- **Station metadata:** Brand affiliation, 24h flag, highway/exit info
- **Price history:** Historical price data for trend display (future)
- **Community price submissions:** Crowdsourced price updates with approval/rejection workflow

## 10. Shared vs Dedicated Logic

### Shared with all Vports
- Actor identity system
- Profile header (banner, avatar, name, bio, subscriber count)
- Privacy gating and block detection
- Reviews engine
- Photos and Vibes tabs
- Subscribers tab
- About tab structure
- Owner tab

### Dedicated to Gas Station
- Gas tab with fuel price board (unique to gas stations)
- Gas price manager dashboard (quick-update per fuel type)
- Gas-specific review dimensions (fuel_quality, service, cleanliness, value)
- Amenity checklist system
- Community price submission workflow
- No portfolio tab (not a visual showcase business)
- No booking tab (no appointments)
- No menu tab (not a food business)
- Gas tab always sorted first in tab order

## 11. UX Priorities

1. **Gas prices as landing tab** — this is the only reason most users visit. Prices must be instantly scannable.
2. **Last-updated timestamp** — stale prices are worse than no prices. Timestamp must be prominent and honest.
3. **Amenity discovery** — "Does this station have air/restrooms/car wash?" must be answerable without scrolling
4. **Location and directions** — users are en route. Map link and highway exit info are critical.
5. **Fast price updates** — owner must update all fuel prices in under 20 seconds
6. **Mobile-first price board** — users check prices on phone while driving (passenger) or planning route

## 12. Future Expansion

- **Price alerts:** Notify subscribers when prices drop below a threshold
- **Price comparison:** Show this station's prices vs nearby stations
- **Historical price charts:** Show price trends over weeks/months
- **EV charging details:** Charger types, speeds, availability, pricing
- **Community price reports:** Crowdsourced price verification with freshness scoring
- **Fuel quality testing:** Verified octane/cetane ratings (partner program)
- **Fleet card support:** Display accepted fleet card networks
- **Route integration:** "Add to route" for trip planning apps

---

## 13. Architecture Documentation

| Document | Path | Scope |
|---|---|---|
| Gas prices data + controller layer | `modules/vcsm.vport-gas-prices.architecture.md` | DAL, model, controllers, hooks, adapters — full data layer |
| Gas station card UI layer | `modules/vcsm.vport-gas-station-cards-individual.architecture.md` | Screen, panel, component, toggle bar — UI-only layer |
| Reviews + QR system | `modules/vcsm.vport-reviews-qr.architecture.md` | Reviews engine integration, QR code entry points, URL builders |
| Reviews dashboard | `modules/vcsm.vport-reviews-dashboard.architecture.md` | Owner dashboard view, review list, compose/edit/delete |

These ARCHITECT module reports are the canonical implementation reference for gas station vport internals. Read them before modifying any gas price or review flow.
- **Real-time pump availability:** Show how many pumps are free (IoT future)
