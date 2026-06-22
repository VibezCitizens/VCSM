# VPORT Tabs — Pending Full Audits

**Last Updated:** 2026-05-27

This file tracks tabs that require a full audit cycle (all 6 governance commands: VENOM, ARCHITECT, KRAVEN, SENTRY, SPIDER-MAN, LOGAN). Sorted by risk priority.

---

## Audit Queue — Priority Order

### 🔴 P0 — CRITICAL RISK

#### book tab

| Field | Value |
|---|---|
| Tab Key | `book` |
| Types | barber, barbershop, locksmith, beauty, health, trades, sports, animal |
| Risk | CRITICAL |
| VENOM | NOT_STARTED |
| ARCHITECT | NOT_STARTED |
| KRAVEN | NOT_STARTED |
| SENTRY | NOT_STARTED |
| SPIDER-MAN | NOT_STARTED |
| LOGAN | NOT_STARTED |

**Why P0:**
- Booking writes touch financial surfaces (Stripe integration)
- Ownership enforcement required before any booking mutation
- Barbershop variant uses a completely different view component (`VportBarberShopBookingView`) — two implementations of the same tab key, both need audit
- Team-aware scheduling in barbershop: booking routes depend on barber team membership — identity exposure risk
- Controller authorization path needs VENOM sign-off before release
- No regression tests currently cover booking tab flow

**Required audit sequence:** VENOM → ARCHITECT → KRAVEN → SENTRY → SPIDER-MAN → LOGAN

---

### 🔴 P1 — HIGH RISK

#### owner tab

| Field | Value |
|---|---|
| Tab Key | `owner` |
| Types | ALL (dynamically injected) |
| Risk | HIGH |
| Injection Mechanism | Runtime append by `VportProfileViewScreen` |
| VENOM | NOT_STARTED |
| ARCHITECT | NOT_STARTED |
| SENTRY | NOT_STARTED |
| SPIDER-MAN | NOT_STARTED |
| LOGAN | NOT_STARTED |

**Why P1:**
- The `owner` tab is injected at runtime — if `isOwner` resolves incorrectly (stale cache, race condition, acting-as confusion), a non-owner could see it
- `VportOwnerView` content needs VENOM review — what does it expose?
- No test covering the injection gate bypass scenario

---

#### team tab

| Field | Value |
|---|---|
| Tab Key | `team` |
| Types | barbershop only |
| Risk | HIGH |
| VENOM | NOT_STARTED |
| ARCHITECT | NOT_STARTED |
| KRAVEN | NOT_STARTED |
| SENTRY | NOT_STARTED |
| SPIDER-MAN | NOT_STARTED |
| LOGAN | NOT_STARTED |

**Why P1:**
- Team member list exposes barber identities (actorId, profile)
- Team membership affects booking routing — a removed barber should not remain bookable
- Team join/leave writes need ownership gate audit
- Barbershop team requests screen (`BarberTeamRequestsScreen`) is a separate dashboard screen — relationship to the public `team` tab needs ARCHITECT mapping

---

#### gas tab

| Field | Value |
|---|---|
| Tab Key | `gas` |
| Types | gas station |
| Risk | HIGH |
| Special Rule | Always first tab (reordered in model) |
| VENOM | NOT_STARTED |
| ARCHITECT | NOT_STARTED |
| KRAVEN | NOT_STARTED |
| SENTRY | NOT_STARTED |
| SPIDER-MAN | NOT_STARTED |
| LOGAN | NOT_STARTED |

**Why P1:**
- Owner writes fuel prices directly to public display — price manipulation attack surface
- `VportDashboardGasScreen` is the management surface; `VportGasPricesView` is the public read surface — relationship needs ARCHITECT mapping
- "Always first" reorder rule in model — logic needs test coverage
- No regression tests for gas price write path

---

### 🟡 P2 — MEDIUM RISK

#### menu tab

| Field | Value |
|---|---|
| Tab Key | `menu` |
| Types | restaurant, baker, chef, caterer, food |
| Risk | MEDIUM |
| Feature Flags | `vportPrintableFlyer` (true), `vportFlyerEditor` (false), `vportAdsPipeline` (false) |
| VENOM | NOT_STARTED |
| ARCHITECT | NOT_STARTED |
| KRAVEN | NOT_STARTED |
| SENTRY | NOT_STARTED |
| SPIDER-MAN | NOT_STARTED |
| LOGAN | NOT_STARTED |

**Why P2:**
- QR-accessed public menu — public surface with no auth
- Flyer pipeline generates shareable/printable documents — content injection risk
- `vportFlyerEditor` flag is `false` — feature is deployed but off. Gate needs VENOM verification.
- Flyer + QR code system was previously security-hardened (see `vport-booking-feed-security-updates` branch)
- Needs LOGAN doc (currently missing canonical menu tab doc)

---

#### services tab

| Field | Value |
|---|---|
| Tab Key | `services` |
| Types | Most service types |
| Risk | MEDIUM |
| VENOM | NOT_STARTED |
| SENTRY | NOT_STARTED |
| SPIDER-MAN | NOT_STARTED |
| LOGAN | NOT_STARTED |

**Why P2:**
- Owner writes service catalog — CRUD operations need ownership check coverage
- Cross-feature adapter for services needs SENTRY review
- Adapter path: `features/profiles/adapters/kinds/vport/screens/services/` — confirm wired correctly

---

#### reviews tab

| Field | Value |
|---|---|
| Tab Key | `reviews` |
| Types | ALL |
| Risk | MEDIUM |
| VENOM | NOT_STARTED |
| SENTRY | NOT_STARTED |
| SPIDER-MAN | NOT_STARTED |
| LOGAN | NOT_STARTED |

**Why P2:**
- Review submission is a write path — actorId of reviewer must be authenticated identity
- Two review view files detected: `views/tabs/VportReviewsView.jsx` and `review/VportReviewsView.jsx` — possible duplicate (needs ARCHITECT audit)
- Review engine integration via adapter — adapter completeness unverified

---

#### portfolio tab

| Field | Value |
|---|---|
| Tab Key | `portfolio` |
| Types | barber, barbershop, locksmith, creative, trades, professional |
| Risk | MEDIUM |
| VENOM | NOT_STARTED |
| ARCHITECT | NOT_STARTED |
| SENTRY | NOT_STARTED |
| SPIDER-MAN | NOT_STARTED |
| LOGAN | NOT_STARTED |

**Why P2:**
- Upload surface — media handling and association to actorId
- `VportDashboardPortfolioScreen` is the management surface
- `TAB_FLAGS.PORTFOLIO` feature-flagged — gate implementation needs verification

---

#### about tab

| Field | Value |
|---|---|
| Tab Key | `about` |
| Types | ALL |
| Risk | LOW |
| ARCHITECT | NOT_STARTED |
| LOGAN | NOT_STARTED |

**Why P2:**
- Present in every single preset — universal coverage makes it high-visibility
- About tab content includes location, hours, contact — PII-adjacent fields
- Relatively low security risk but high documentation priority due to universality

---

### 🟢 P3 — LOW RISK

The following tabs are lower priority. Full audits should be scheduled after P0-P2 complete.

| Tab | Risk | Primary Concern | Blocker For |
|---|---|---|---|
| `content` | LOW | Feed slice within profile; read-heavy | None |
| `subscribers` | LOW | Identity list; read-only | None |
| `photos` | LOW | Read-heavy; upload handled by upload pipeline | None |
| `vibes` | LOW | Social feed slice; read-heavy | None |

---

### ⚫ P4 — NOT STARTED / PLANNED

| Tab | Status | Notes |
|---|---|---|
| `contact` | NOT_STARTED | Not implemented. No view component, not in any preset. Planned feature. |
| `gallery` | NOT_STARTED | Not implemented. Potential rename/alias for `photos`. Requires design decision first. |

---

## Audit Completion Tracker

| Tab | VENOM | ARCHITECT | KRAVEN | SENTRY | SPIDER-MAN | LOGAN | COMPLETE |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| book | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| owner | ○ | ○ | — | ○ | ○ | ○ | ✗ |
| team | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| gas | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| menu | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| services | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| reviews | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| portfolio | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| about | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| **rates** | ◑ | ◑ | ● | ◑ | ◑ | ● | ✗ |
| content | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| subscribers | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| photos | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| vibes | ○ | ○ | ○ | ○ | ○ | ○ | ✗ |
| contact | — | — | — | — | — | — | ✗ |
| gallery | — | — | — | — | — | — | ✗ |

○ = NOT_STARTED · ◑ = PARTIAL · ● = COMPLETE/VERIFIED
