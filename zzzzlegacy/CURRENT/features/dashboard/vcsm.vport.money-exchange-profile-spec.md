# Money Exchange Vport Profile + Dashboard Spec

## 1. Purpose

The money exchange vport is a financial service provider profile for currency exchange businesses, cambios, and FX operators. Users visit to check live rates, compare spreads, and assess trustworthiness before making a transaction. Speed, transparency, and trust are the core value drivers.

## 2. Public Profile Goal

Help a visitor decide whether to exchange money here. Within 5 seconds of landing, the visitor should know:
- Current buy/sell rates for their currency pair
- When rates were last updated
- Whether this exchange is trustworthy (reviews, verified signals)
- Where it's located and whether it's open now

## 3. Core Identity Block

- **Display name:** Business name (e.g., "FastFX Cambio", "GlobalChange")
- **Username / handle:** `@fastfx` — used in URLs, mentions, shares
- **Avatar / logo:** Square with `rounded-2xl`. Typically the business logo or storefront. Must never be circular.
- **Banner:** Storefront photo, branded graphic, or currency-themed imagery. Gradient fallback if none set.
- **Headline / short descriptor:** Vport type label ("Money Exchange") shown below display name
- **Location summary:** City + street address. Critical for walk-in exchanges.
- **Contact / action buttons:**
  - Visitor: Message + Subscribe
  - Owner: QR code sharing
  - Location/directions should be prominent

## 4. Public Tabs

| Tab | Required | Purpose |
|-----|----------|---------|
| **Rates** | Yes | Live exchange rate board. This is the landing tab — the primary reason users visit. |
| **Services** | Yes | Additional services (wire transfers, bill pay, money orders, etc.). |
| **Reviews** | Yes | Customer reviews with trust-focused dimensions (Rate Fairness, Speed, Trust, Service). |
| **About** | Yes | Hours, location, branches, contact, licenses, languages. |
| **Photos** | Optional | Storefront, interior, rate board photos. |
| **Vibes** | Optional | Social feed posts (rate alerts, promotions). |
| **Subscribers** | Optional | Public subscriber list. |

**Tab order:** Rates → Services → Reviews → About → Photos → Vibes → Subscribers

## 5. Main Content Modules

### Rates Board
- Currency pair list with buy/sell columns
- Color-coded: buy in emerald, sell in amber
- Per-pair last-updated timestamp
- Global last-updated timestamp at top
- Pair count displayed
- Rate type indicator (spot, retail, wholesale)
- Empty state: "No exchange pairs yet"

### Services
- Non-FX services: wire transfers, bill payments, money orders, check cashing
- Each service: name, fee structure, processing time
- Visitor mode: read-only
- Owner mode: toggle services, edit fees

### Reviews
- Dimension ratings: Rate Fairness (1.50 weight), Speed (1.10), Trust (1.40), Service (1.00)
- Trust is the dominant signal — customers need confidence
- Overall average prominently displayed
- Recent comments about transaction experiences

### About
- Business hours (per-day schedule, timezone)
- Location with address and map link
- Branch locations (if multiple)
- Accepted currencies list
- Licensing / regulatory info
- Languages spoken
- Contact: phone, email, website

## 6. Reviews Behavior

**What customers care about most:**
- Were the rates fair compared to market?
- Was the transaction fast?
- Did they feel safe and treated honestly?
- Was the service professional?

**Dimension weights (from DB seed):**
| Dimension | Weight | Sort |
|-----------|--------|------|
| Rate Fairness | 1.50 | 10 |
| Speed | 1.10 | 20 |
| Trust | 1.40 | 30 |
| Service | 1.00 | 40 |

**Display priorities:**
- Trust and Rate Fairness are the most important signals
- Overall average shown prominently
- Review count matters — more reviews = more credible
- Recent comments about specific transaction experiences are high value

**History:** Card rotation after 24h ensures fresh feedback. Old cards preserved for trend analysis.

**Trust communication:**
- High review count + high trust dimension = strong credibility signal
- Author snapshots ensure reviewer identity is always visible
- Verified transaction reviews (future) will carry higher weight

## 7. Dashboard Goal

Help the exchange operator manage their rate board efficiently, track customer trust metrics, and keep business information current. Rate updates must be fast and frictionless — operators update rates multiple times per day.

## 8. Dashboard Sections

### Rates Manager
- **Purpose:** Update exchange rates quickly
- **Key actions:** Edit buy/sell per pair, add/remove pairs, bulk update
- **Key metrics:** Last update time, pair count, average spread
- **Key editing surfaces:** Rate editor cards per currency pair, quick-update mode
- **Feed share:** When the owner publishes a rate update and checks "Share to feed", a post with `post_type = exchange_rate_update` is published to the public feed showing the exchange name, currency pair, and buy/sell rates. The post is non-blocking (failure does not affect the rate save). A 1-hour dedup window prevents repeat posts per exchange. Implemented via `publishExchangeRateUpdateAsPost.controller.js` → `createSystemPost` adapter → `resolvePublicRealmIdDAL()` (canonical public realm, never viewer session realm). Files: `dal/exchange/vportExchangeRatePost.read.dal.js` (dedup + name lookup), `controller/exchange/publishExchangeRateUpdateAsPost.controller.js`, `hooks/exchange/usePublishExchangeRatePost.js`. Feed share toggle lives in `VportRateEditorCard.jsx`; share logic is wired in `VportDashboardExchangeScreen.jsx`.

### Reviews Dashboard
- **Purpose:** Monitor trust and service quality
- **Key actions:** View reviews with dimension filters
- **Key metrics:** Overall average, trust dimension average, rate fairness average, review count
- **Key editing surfaces:** None (reviews are customer-owned)

### Services Editor
- **Purpose:** Manage non-FX service offerings
- **Key actions:** Add/remove services, set fees
- **Key metrics:** Service count
- **Key editing surfaces:** Service toggle list, fee fields

### Profile Settings
- **Purpose:** Update business information
- **Key actions:** Edit hours, location, branches, licensing, contact, avatar, banner
- **Key metrics:** Profile completeness
- **Key editing surfaces:** About fields, hours schedule, branch list

## 9. Type-Specific Data Model Needs

Beyond the shared vport model, money exchange needs:
- **Rate board:** `vc.vport_rates` with rate_type, currency pairs, buy/sell values, per-pair timestamps
- **Currency pair configuration:** Supported currencies, pair ordering, display preferences
- **Review dimensions:** `reviews.review_dimensions` with exchange-specific keys (rate_fairness, speed, trust, service)
- **Branch locations:** Multiple location support (future)
- **Licensing metadata:** Regulatory compliance fields (future)

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

### Dedicated to Money Exchange
- Rates tab with live rate board (buy/sell columns, color coding, timestamps)
- Rate editor dashboard with quick-update mode
- Exchange-specific review dimensions (rate_fairness, speed, trust, service)
- Currency pair management
- No portfolio tab (not a visual portfolio business)
- No booking tab (walk-in transactions)

## 11. UX Priorities

1. **Rates as landing tab** — this is why users come. Rates must be instantly readable.
2. **Last-updated visibility** — stale rates destroy trust. Timestamp must be prominent.
3. **Trust signals** — review trust dimension should be visible near rates
4. **Location clarity** — walk-in business needs clear directions
5. **Fast rate updates** — owner must be able to update rates in under 30 seconds
6. **Mobile-first rate board** — most users check rates on phone while walking

## 12. Future Expansion

- **Rate alerts:** Push notifications when a pair crosses a threshold
- **Historical rate charts:** Show rate trends over time
- **Rate comparison:** Compare rates with nearby exchanges
- **Transactional reviews:** Reviews tied to completed exchanges (verified amounts)
- **Multi-branch rate boards:** Different rates per branch location
- **Calculator widget:** Quick conversion calculator on the rate board
- **Spread visualization:** Show margin vs mid-market rate
