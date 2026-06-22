# Module: Calendar

**VPORT Kinds:** ALL — primary use: any VPORT with a booking resource (BARBER, BARBERSHOP, LOCKSMITH)
**Public/Owner:** OWNER only
**Route:** `/actor/:actorId/dashboard/calendar` (or mounted as a dashboard tab)
**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/`
**Governance status:** SECURITY_REVIEW_PENDING
**Last updated:** 2026-05-27

---

## What This Module Does

Provides the VPORT owner's **weekly availability / working hours editor**. The owner sets working hour blocks (availability rules) per booking resource on a weekly drag-to-create grid. This is the **configuration** screen for availability rules.

Key behaviors:
- Loads the owner's booking resources via the booking engine
- Auto-bootstraps a booking resource if none exists on first visit
- Renders a weekly availability grid (`WeeklyAvailabilityGrid`) — owners drag to create/delete time blocks
- Supports multi-resource selection (`ResourceDropdown`) for VPORTs with multiple staff
- For BARBERSHOP and LOCKSMITH kinds: optionally publishes saved hours to the social feed

This card is the **configuration view**. The Schedule card is the **operational day-view** showing actual bookings.

---

## Source Inventory

### Screens
- `VportDashboardCalendarScreen.jsx` — Single screen file. Handles ownership gating inline and delegates all data operations to booking engine adapters. No separate Final Screen.

### Sub-Layers

This card has **no local controller, DAL, hook, or model sub-layers**. All business logic and data access is delegated to the booking engine via adapters:

| Adapter Hook | Source | Purpose |
|---|---|---|
| `useOwnerBookingResources` | `engines/booking` via adapter | Reads booking resources for the owner actor |
| `useBookingAvailability` | `engines/booking` via adapter | Reads availability rules for the selected resource |
| `useManageAvailability` | `engines/booking` via adapter | Write path for availability rule saves |
| `useEnsureOwnerBookingResource` | `engines/booking` via adapter | Creates a booking resource on first use |

### Components (shared — not in this card folder)
- `features/dashboard/vport/components/calendar/WeeklyAvailabilityGrid` — drag-to-create weekly grid
- `features/dashboard/vport/components/calendar/ResourceDropdown` — resource selector

### Cross-Feature Write Paths (kind-conditional)
- `usePublishBarbershopHoursPost` — `features/profiles/adapters/kinds/vport/vportProfiles.adapter` — publishes hours to feed (BARBERSHOP and BARBER kinds, if `shareToFeed` is enabled)
- `usePublishLocksmithPost` — `features/profiles/adapters/kinds/vport/vportProfiles.adapter` — publishes hours to feed (LOCKSMITH kind, if `shareToFeed` is enabled)

---

## Database

No direct Supabase calls in this card. All DB access goes through the booking engine adapters. See `modules/booking/` and `modules/availability/` for engine-level DB coverage.

---

## Architecture Notes

- The screen calls `useVportOwnership` for ownership gating but does not implement a separate Final Screen per the architecture contract's Final/View screen split requirement. See CALENDAR-FIND-001.
- Resource auto-bootstrap (`useEnsureOwnerBookingResource`) fires at most once per `actorId` mount via a `didBootstrap` ref guard — will not re-trigger on re-renders.
- The card is intentionally thin — all domain logic lives in the booking engine. This is appropriate for a configuration surface that wraps engine functionality.

---

## References

- Architecture doc: **PENDING** — `vcsm.vport-dashboard-calendar-card.architecture.md` (not yet created)
- Related: `modules/schedule/` — operational day-view (complement to this card)
- Related: `modules/availability/` — availability engine documentation
- Related: `modules/booking/` — booking engine documentation
