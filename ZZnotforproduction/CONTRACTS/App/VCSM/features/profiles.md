# Feature Contract: profiles

**Status:** SPLIT_CANDIDATE + VIOLATIONS  
**Risk:** CRITICAL  
**Files:** 374 (scanner 2026-06-05)  
**Inbound imports:** 51  
**Outbound imports:** 110  
**Violations:** 18  
**Split candidate:** YES (largest feature; 2 distinct domains: actor profiles + vport-type profile views)

---

## 1. Purpose

`profiles` currently owns two structurally distinct domains:

**Domain A — Actor Profiles:**
- Actor profile screen, header, tabs
- Friends tab, photos tab, posts tab, tags tab
- Actor profile DAL, hooks, model
- Profile gate (privacy/block gating)
- Friend/subscriber management

**Domain B — Vport-Type Profile Views (`kinds/vport/` — 122 files):**
- All vport-type-specific profile screens: menu management (26 files), service catalog, portfolio, rate cards, barbershop team, gas price submission, content management
- In-profile booking flow (`screens/booking/`)
- Owner-facing stats
- Vport subscriber list

These two domains have different ownership, different consumers, and different evolution rates. They are co-located only because vport profile screens were built inside the actor profiles feature.

**Planned split:** Extract `kinds/vport/` (122 files) into a new `vportProfile/` feature (ARCH-VPORTPROFILE-001).

---

## 2. Non-Goals

`profiles` must not own (after split):
- Vport-type-specific profile screens — those move to `vportProfile/`
- Booking state machine — that is `booking/`
- Gas price UI — belongs in either `dashboard/cards/gasprices/` or a standalone `vportGasPrices/` feature
- Post rendering — that is `post/`
- Notification dispatch — that is `notifications/`

---

## 3. Public API / Adapter Boundary

**Confirmed adapters:**
- `profiles/adapters/profiles.adapter` — primary adapter, consumed by dashboard, settings, feed, social
- `profiles/adapters/ui/PrivateProfileGate.adapter` — consumed by `social/components/PrivateProfileNotice.jsx`
- `profiles/adapters/ui/actorProfileScreenDependencies.adapter.js` — consumed (imports ShareModal adapter from post)
- `profiles/adapters/kinds/vport/` — vport-type-specific adapter surface (18+ files), consumed by dashboard, wanderex, public
  - `vportProfiles.adapter` — consumed by dashboard locksmith/portfolio/calendar cards
  - `hooks/useVportPublicDetails.adapter` — consumed by dashboard flyerBuilder, settings card, main dashboard screen
  - `exchange.adapter`, rate/service/review screen adapters, gas hooks — consumed by dashboard
  - `ownership.adapter.js` — wraps `dashboard/vport/controller/checkVportOwnership.controller` (VIOLATION — points to dashboard internals)

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `profiles/adapters/` | Rich surface — profiles.adapter + kinds/vport/ subdirectory |
| adapters/kinds/vport | `profiles/adapters/kinds/vport/` | 8+ files — vport-type adapter bridge |
| hooks | `profiles/hooks/` | Actor profile hooks + vport kind hooks |
| controllers | `profiles/controller/` | Actor profile actions; vport-type controllers in `kinds/vport/controller/` |
| dal | `profiles/dal/` | Actor profile data access |
| model | `profiles/model/` | Actor profile shapes |
| screens | `profiles/screens/` | Actor profile screen views |
| styles | `profiles/styles/` | `profiles-modern.css` — MUST MOVE to `shared/styles/` |
| kinds/vport | `profiles/kinds/vport/` | 122 files — planned extraction target |
| kinds/vport/controller | `profiles/kinds/vport/controller/` | Vport-type controllers (barbershop, content, exchange, locksmith, etc.) |
| kinds/vport/dal | `profiles/kinds/vport/dal/` | Vport-type data access |
| kinds/vport/screens | `profiles/kinds/vport/screens/` | menu/ (26 files), booking/, portfolio/, services/, rates/, content/, barbershop/, owner/, review/ |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `social` | Profile gate, subscriber visibility — BIDIR SAFE (Pair 14, mostly) | YES — `profiles/dal/readActorProfile.dal.js` → `social/adapters/privacy/actorPrivacy.adapter`; `profiles/hooks/useProfileGate.js` → `social/adapters/friend/subscribe/hooks/useFollowStatus.adapter` |
| `notifications` | VportReviews controller fires notifications — BIDIR SAFE (Pair 11) | YES — `VportReviews.controller.js` → `notifications/adapters/notifications.adapter` |
| `post` | Actor profile tab shows posts — BIDIR SAFE (Pair 13) | YES — 14 imports from `post/adapters/` |
| `booking` | In-profile booking flow | YES (via booking adapter — some model violations present, see Section 8) |
| `dashboard` | Gas prices and ownership (BIDIR — violations present) | MIXED — 4 clean adapter imports + 7 violations |
| `media` | Profile media | Confirmed by outbound count |
| `upload` | Profile photo upload | Confirmed by outbound count |
| `block` | Profile gate | Confirmed by outbound count |
| `identity` | Active actor | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`profiles` must not import from:
- `booking/model/` directly — VIOLATION (10 imports — ARCH-BIDIR-PROFILES-001 after booking adapter additions)
- `dashboard/vport/dashboard/cards/gasprices/` internals — VIOLATION (7 gas prices violations)
- `dashboard/vport/controller/` directly — VIOLATION (ownership.adapter.js wraps it)
- `social/privacy/dal/actorSignalVisibility.dal` directly — VIOLATION (ARCH-BIDIR-SOCIAL-001)
- `feed/` — feed consumes profiles, not the reverse
- `settings/` directly (non-adapter imports)

---

## 7. DAL / Controller Rules

**DAL rules for `profiles/dal/`:**
- Actor profile reads — may use `actorId` as filter parameter
- `readActorProfile.dal.js` confirmed to import `social/adapters/privacy/actorPrivacy.adapter` — CLEAN (through adapter)
- Must not query `vc.actor_owners` to make authorization decisions

**DAL rules for `profiles/kinds/vport/dal/`:**
- Contains `resolveVportProfileId.dal` — the function being violated by dashboard (8 imports without adapter)
- This function resolves a `vport.profiles.id` from an `actor_id` — a pure lookup, not an authorization decision
- After ARCH-BIDIR-PROFILES-001: must be exposed via `profiles/adapters/` so dashboard can use it through the adapter boundary

**Controller rules for `profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js`:**
- Currently imports `social/privacy/dal/actorSignalVisibility.dal` directly — VIOLATION
- This controller is responsible for the subscriber list with visibility gating
- After ARCH-BIDIR-SOCIAL-001: must import from `social/adapters/privacy/actorSignalVisibility.adapter.js`

---

## 8. Known Coupling

**18 confirmed violations:**

| From File | To | Rule | Ticket |
|---|---|---|---|
| `hooks/useAgendaCalendarValues.js` | `booking/model/bookingCalendarDate.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `hooks/useAgendaCalendarValues.js` | `booking/model/bookingCalendarAvailability.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `hooks/useVportBookingMutations.js` | `booking/model/bookingCalendarDate.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `hooks/useVportBookingView.js` | `booking/model/bookingCalendarAvailability.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `hooks/useVportBookingView.js` | `booking/model/bookingCalendarDate.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `hooks/useVportPublicBooking.js` | `booking/model/bookingCalendarAvailability.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `hooks/useVportPublicBooking.js` | `booking/model/bookingCalendarDate.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `hooks/useVportPublicBooking.js` | `booking/model/buildBookingPayload.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `view/BookingStepConfirm.jsx` | `booking/model/bookingCalendarDate.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `view/VportBookingView.jsx` | `booking/model/bookingCalendar.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | booking models to adapter |
| `gas/useOwnerPendingSuggestions.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/hooks/useOwnerPendingSuggestions` | GAS-PRICES-SPLIT | ARCH-BIDIR-GASPRICES-001 (BLOCKED) |
| `gas/useSubmitFuelPriceSuggestion.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/hooks/useSubmitFuelPriceSuggestion` | GAS-PRICES-SPLIT | ARCH-BIDIR-GASPRICES-001 (BLOCKED) |
| `gas/useVportGasPrices.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/hooks/useVportGasPrices` | GAS-PRICES-SPLIT | ARCH-BIDIR-GASPRICES-001 (BLOCKED) |
| `vport/ownership.adapter.js` | `dashboard/vport/controller/checkVportOwnership.controller` | GAS-PRICES-SPLIT | ARCH-BIDIR-GASPRICES-001 (BLOCKED) |
| `screens/components/VportProfileTabContent.jsx` | `dashboard/vport/dashboard/cards/gasprices/screens/VportGasPricesView` | GAS-PRICES-SPLIT | ARCH-BIDIR-GASPRICES-001 (BLOCKED) |
| `gas/components/GasPricesPanel.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/components/GasPricesPanel` | GAS-PRICES-SPLIT | ARCH-BIDIR-GASPRICES-001 (BLOCKED) |
| `gas/components/GasStates.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/components/GasStates` | GAS-PRICES-SPLIT | ARCH-BIDIR-GASPRICES-001 (BLOCKED) |
| `gas/components/OwnerPendingSuggestionsList.adapter.js` | dashboard `OwnerPendingSuggestionsList` | GAS-PRICES-SPLIT | ARCH-BIDIR-GASPRICES-001 (BLOCKED) |
| `subscribers/getSubscribers.controller.js` | `social/privacy/dal/actorSignalVisibility.dal` | `NO_CROSS_FEATURE_DAL` | ARCH-BIDIR-SOCIAL-001 |
| `subscribers/getSubscribers.controller.test.js` | `social/privacy/dal/actorSignalVisibility.dal` | `NO_CROSS_FEATURE_DAL` | ARCH-BIDIR-SOCIAL-001 |

Note: Scanner reports 18 violations for profiles; cross-check with the list above yields 20 lines but some entries cover the same file+rule pair.

---

## 9. Risk Notes

**CRITICAL.** Profiles is the second-highest-violation feature (18) and the largest file count (374). It is the most-consuming feature in the codebase (110 outbound imports). Any change cascades widely.

The two violation clusters (profiles→booking and profiles→dashboard gas prices) are the primary blockers for ARCH-VPORTPROFILE-001. Neither cluster can be fixed without a design decision:
- Booking models: add to `booking/adapters/` or move to `shared/types/`
- Gas prices: Option A (standalone feature) or Option B (expose via dashboard adapters)

---

## 10. Migration Notes

**ARCH-VPORTPROFILE-001 (P1, SCOPE_EXPANDED):**
- Extract `profiles/kinds/vport/` (122 files) into `vportProfile/` feature
- Extract `profiles/adapters/kinds/vport/` (8+ files) into `vportProfile/adapters/`
- Blocked on: ARCH-DASH-001 gas prices decision + profiles→booking violation strategy
- Do not open implementation ticket until owner reviews and approves plan

**ARCH-BIDIR-PROFILES-001:** Add 4 adapter exports to `profiles/adapters/kinds/vport/`. Fixable now.

**ARCH-BIDIR-SOCIAL-001:** Add `social/adapters/privacy/actorSignalVisibility.adapter.js`. Update `getSubscribers.controller.js` and test. Fixable now.

**ARCH-BIDIR-CSS-001:** Move `profiles-modern.css` to `shared/styles/`. Fix 5 import sites (post ×2, notifications ×1, profiles self-imports ×unknown).

---

## 11. Unknowns

- TODO: Confirm complete actor-profile (non-vport) file count after `kinds/vport/` is extracted
- TODO: Confirm whether booking calendar types should go to `booking/adapters/` or `shared/types/`
- TODO: Confirm all consumers of `profiles/adapters/kinds/vport/` (critical for ARCH-VPORTPROFILE-001 migration)
- TODO: Confirm `profiles/kinds/vport/screens/booking/` classification — booking consumer or booking feature?
- TODO: Confirm how many files in `profiles/` self-import `profiles-modern.css`
