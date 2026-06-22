# Feature Contract: booking

**Status:** CLEAN (architecture boundary); OPEN (security ticket)  
**Risk:** MEDIUM  
**Files:** 66 (scanner 2026-06-05)  
**Inbound imports:** 68  
**Outbound imports:** 4  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`booking` owns the booking state machine for VCSM. It handles:
- Creating bookings between a customer actor and a service provider vport
- Confirming bookings
- Cancelling bookings
- Reading booking records by actor or vport
- Dispatching booking lifecycle notifications

`booking` is the **most-consumed feature in the codebase** (68 inbound imports). It is a data and logic layer — it does not own booking UI. Booking UI lives in `profiles/kinds/vport/screens/booking/` (in-profile flow) and `wanderex/` (accommodation flow).

---

## 2. Non-Goals

`booking` must not own:
- Booking UI screens — those belong in the feature that surfaces them (`profiles/`, `wanderex/`)
- Payment processing — if/when added, this belongs in a dedicated `payments/` feature
- Calendar display — calendar UI belongs in `dashboard/vport/dashboard/cards/calendar/`
- Notification rendering — that is `notifications/`

---

## 3. Public API / Adapter Boundary

**Known adapter:**
- `apps/VCSM/src/features/booking/adapters/booking.adapter.js`

Confirmed consumers via scanner:
- `notifications/screen/hooks/useMyAppointments.js` → `booking/adapters/booking.adapter`
- `booking/setup.js` → `notifications/adapters/notifications.adapter` (outbound to notifications)
- `profiles/kinds/vport/screens/booking/` — consumes booking via adapters (confirmed by architecture review; some model imports are violations — see Section 8)

**Engine setup:**
- `booking/setup.js` — configures the booking engine at startup. Targeted for migration to `app/setup/` via ARCH-ENGINESETUP-001.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `booking/adapters/booking.adapter.js` | Primary public API |
| controllers | `booking/controller/` | State machine operations — create, confirm, cancel, read |
| dal | `booking/dal/` | Database access — booking records |
| hooks | `booking/hooks/` | UI orchestration hooks |
| model | `booking/model/` | Data transformation — `bookingCalendarDate.model`, `bookingCalendarAvailability.model`, `buildBookingPayload.model`, `bookingCalendar.model` |
| setup | `booking/setup.js` | Engine DI wiring |
| components | Empty — ARCH-CLEAN-001 targets removal |
| screens | Empty — ARCH-CLEAN-001 targets removal |

**Note:** `components/` and `screens/` folders are empty (confirmed in FEATURES_TICKET_PLAN.md). These are targeted for deletion in ARCH-CLEAN-001.

---

## 5. Allowed Dependencies

| Feature | Reason | Adapter? |
|---|---|---|
| `notifications` | Booking lifecycle events fire notifications | YES — through `notifications/adapters/notifications.adapter` |

Booking is a Layer 1 feature. It imports from Layer 0 primitives (identity, auth) as needed.

---

## 6. Prohibited Dependencies

`booking` must not import from:
- `profiles/` — profiles renders booking UI; booking must not know about profiles
- `wanderex/` — wanderex consumes booking; not the reverse
- `dashboard/` — dashboard cards visualize bookings; booking must not know about dashboard
- `social/`, `feed/`, `post/` — unrelated domains

---

## 7. DAL / Controller Rules

**DAL rules:**
- May query `vc.bookings`, `vc.booking_slots`, and related tables
- Must use explicit column projections (no `.select('*')`)
- Must not determine actor authorization — that is the controller's job
- May receive `actorId` or `vportId` as filter parameters from controllers
- Must not query `vc.actor_owners` to make authorization decisions

**Controller rules:**
- Own the state machine transitions: PENDING → CONFIRMED → CANCELLED
- Must verify actor authorization before any state transition
- Must call `notifications/adapters/notifications.adapter` for lifecycle events, not the notifications DAL directly
- Must not return raw database rows — return domain-safe booking objects

**TICKET-BOOKING-RPC-001 (open):**
The current booking INSERT/UPDATE is too broad — `customer_actor_id` can be injected by callers, and the status field is over-permissioned. The planned fix is typed state-machine RPCs that enforce the correct actor context and restrict status transitions. This is an active security ticket. Do not add new booking state transitions until this ticket is resolved.

---

## 8. Known Coupling

**Outbound (4 imports):**
- `notifications/` — via `notifications/adapters/notifications.adapter` in booking controllers and setup

**Inbound violations (not in booking itself, but booking is the target):**
- `profiles/kinds/vport/screens/booking/` imports directly from `booking/model/`:
  - `bookingCalendarDate.model` (4 import sites)
  - `bookingCalendarAvailability.model` (3 import sites)
  - `buildBookingPayload.model` (1 import site)
  - `bookingCalendar.model` (1 import site)

These 10 violations are in `profiles/`, not in `booking/` itself. However, they are recorded here because they affect booking's adapter surface design.

**Resolution options for profiles→booking model violations:**
1. Add all 4 models to `booking/adapters/` so profiles can import through the adapter
2. Move shared calendar types to `shared/types/bookingCalendar/` if they are truly generic

---

## 9. Risk Notes

**MEDIUM.** Booking is the most-consumed feature (68 inbound). Any change to booking's adapter surface or model shapes cascades to all 68 import sites.

Active security risk: TICKET-BOOKING-RPC-001 — `customer_actor_id` injection and status overpermission on live DB.

Structural note: booking UI split across `profiles/` and `wanderex/` is intentional but makes it harder to test booking end-to-end without navigating through profile or wanderex screens.

---

## 10. Migration Notes

**ARCH-CLEAN-001:** Remove empty `booking/components/` and `booking/screens/` folders.

**ARCH-ENGINESETUP-001:** Migrate `booking/setup.js` to `app/setup/booking.setup.js`. This requires verifying that `booking/setup.js` injects the notifications adapter correctly (ARCH-BIDIR-001 Pair 4 confirms it does — through adapter boundary).

**ARCH-VPORTPROFILE-001:** The profiles→booking model violations (10 imports) must be resolved before the vportProfile extraction. Decision: add models to `booking/adapters/` or move to `shared/types/`.

---

## 11. Unknowns

- TODO: Confirm complete list of booking model files (4 models confirmed by violation data)
- TODO: Confirm full booking adapter surface (`booking/adapters/booking.adapter.js` exports)
- TODO: Confirm whether `booking/setup.js` dependency on notifications adapter creates initialization order requirements (ARCH-ENGINESETUP-001 startup order analysis)
- TODO: Confirm all 3 outbound imports beyond notifications (scanner shows 4 total)
