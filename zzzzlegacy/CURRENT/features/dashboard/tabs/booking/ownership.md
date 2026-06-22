# Tab: booking — Ownership

**Last Updated:** 2026-05-27

## VPORT Types

All types in: `VPORT_BARBER_TABS`, `VPORT_BARBERSHOP_TABS`, `VPORT_SERVICE_BOOK_TABS`, `VPORT_HEALTH_TABS`, `VPORT_TRADES_TABS`

Specific types include: barber, barbershop, locksmith, hairstylist, esthetician, makeup artist, massage therapist, nail technician, yoga instructor, fitness instructor, babysitter, caregiver, elder care, nanny, teacher, therapist, tutor, doctor, dentist, chiropractor, nurse, nutritionist, carpenter, cleaning service, contractor, electrician, gardener, handyman, landscaper, mechanic, painter, plumber, athlete, coach, trainer, dog walker, pet sitter

## Key Files

| Layer | File | Status |
|---|---|---|
| View (generic) | `features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx` | UNAUDITED |
| View (barbershop) | `features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx` | UNAUDITED |
| Dashboard (calendar) | `features/dashboard/vport/screens/VportDashboardCalendarScreen.jsx` | UNAUDITED |
| Dashboard (schedule) | `features/dashboard/vport/screens/VportDashboardScheduleScreen.jsx` | UNAUDITED |
| Dashboard (history) | `features/dashboard/vport/screens/VportDashboardBookingHistoryScreen.jsx` | UNAUDITED |
| Dashboard (team requests) | `features/dashboard/vport/screens/BarberTeamRequestsScreen.jsx` | UNAUDITED |
| Adapter (booking) | `features/profiles/adapters/kinds/vport/screens/booking/` | EXISTENCE UNVERIFIED |

## Engines Consumed

Likely consumes the `booking` engine (`engines/booking/`) — not confirmed. ARCHITECT audit required.
