# Calendar — Ownership and Trust Boundaries

## Ownership Gates

| Path | Gate | Layer |
|---|---|---|
| Screen render | `useVportOwnership(viewerActorId, actorId)` | `VportDashboardCalendarScreen` (screen-level, inline) |
| Availability read | Enforced by booking engine adapters | `engines/booking` |
| Availability write (save rules) | Enforced by booking engine adapters | `engines/booking` |
| Resource bootstrap | `requestActorId: viewerActorId` passed to `useEnsureOwnerBookingResource` | Screen; underlying controller ownership gate NEEDS_VERIFICATION |
| Feed post (barbershop/barber) | Enforced by `usePublishBarbershopHoursPost` | `vportProfiles.adapter` |
| Feed post (locksmith) | Enforced by `usePublishLocksmithPost` | `vportProfiles.adapter` |

## Screen Gate Behavior

`useVportOwnership` runs on every render. If `!isOwner` resolves to true, the screen renders an access-denied message and no booking engine hook fires. Non-owners cannot trigger the auto-bootstrap.

## Engine Delegation

This card does not implement its own ownership checks for availability operations. It relies entirely on the booking engine adapter's internal gates. Those gates are tracked in `modules/booking/` and `modules/availability/`.

## DB-Level RLS

Not applicable to this card directly — all DB access is delegated to the booking engine. See `modules/booking/` and `modules/availability/` for RLS coverage.
