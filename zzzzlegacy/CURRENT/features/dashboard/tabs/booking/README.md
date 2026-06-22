# Tab: booking (key: `book`)

**Key:** `book`
**Label:** Book
**Feature Flag:** `TAB_FLAGS.BOOK`
**VPORT Types:** barber, barbershop, locksmith — and group presets: Beauty & Wellness, Education & Care, Health & Medical, Home/Maintenance/Trades, Sports & Fitness, Animal Care
**Landing Tab:** YES for Health & Medical preset (`VPORT_HEALTH_TABS`)
**Last Updated:** 2026-05-27

## Purpose

Allows visitors to book appointments or request services from a VPORT. The booking tab has **two separate view components** depending on the VPORT type — this is the only tab in the system with a conditional content split on the same key.

## View Components

| Condition | Component | Path |
|---|---|---|
| `vportType === 'barbershop'` | `VportBarberShopBookingView` | `screens/barbershop/VportBarberShopBookingView.jsx` |
| all other types | `VportBookingView` | `screens/booking/view/VportBookingView.jsx` |

## Conditional Logic (VportProfileTabContent.jsx)

```js
{tab === "book" && vportType === "barbershop" && (
  <VportBarberShopBookingView profile={profile} isOwner={isOwner} />
)}
{tab === "book" && vportType !== "barbershop" && (
  <VportBookingView profile={profile} isOwner={isOwner} />
)}
```

## Management Surfaces

| Screen | Route | Types |
|---|---|---|
| `VportDashboardCalendarScreen` | `/actor/:actorId/dashboard/calendar` | All types |
| `VportDashboardScheduleScreen` | `/actor/:actorId/dashboard/schedule` | All types |
| `VportDashboardBookingHistoryScreen` | `/actor/:actorId/dashboard/booking-history` | All types |
| `BarberTeamRequestsScreen` | `/actor/:actorId/dashboard/team-requests` | barbershop only |

## Risk Level: CRITICAL — Highest-risk unaudited tab
Booking involves payment surfaces (Stripe), ownership enforcement, team routing, and calendar availability writes. No governance audit has been run on this tab.
