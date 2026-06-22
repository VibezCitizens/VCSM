# Type Preset — Barbershop

**Preset Name:** `VPORT_BARBERSHOP_TABS`
**Applies To:** `barbershop` (type-level override — exclusive)
**Priority:** HIGH — type-level override, highest specificity
**Last Updated:** 2026-05-27

---

## Tab Order

```
1. portfolio      ← LANDING TAB — collective work showcase
2. book           ← barbershop-specific booking (VportBarberShopBookingView — different component from barber)
3. team           ← barber team member list
4. services       ← service catalog with pricing
5. reviews        ← trust signal
6. about          ← location, hours, contact
7. photos         ← shop photos
8. vibes          ← social feed
9. content        ← content feed
10. subscribers
(+owner — dynamically injected if isOwner; owner sees VportBarberShopOwnerBand above tabs)
```

---

## Design Intent

A barbershop is a **business with multiple barbers**. The team tab is critical — visitors want to pick their barber and book with them specifically. The book tab uses a completely different view component (`VportBarberShopBookingView`) that is team-aware: it allows selecting which barber to book with before choosing a time slot.

---

## Critical Distinction: Barbershop vs Barber

| Aspect | barber (individual) | barbershop (business) |
|---|---|---|
| Book tab component | `VportBookingView` | `VportBarberShopBookingView` |
| Team tab | NOT in preset | PRESENT (position 3) |
| Owner band | Not shown | `VportBarberShopOwnerBand` shown above tabs |
| Dashboard | Standard | Includes team management, team requests |
| Calendar screen | Standard | Team-aware (`VportDashboardCalendarScreen`) |

---

## Key Components

| Component | Purpose |
|---|---|
| `VportBarberShopBookingView` | Team-aware booking — select barber, then time slot |
| `VportBarberShopTeamView` | Public-facing team member list |
| `VportBarberShopOwnerBand` | Owner-only stats band above tabs (not a tab itself) |
| `BarberTeamRequestsScreen` | Dashboard — pending join requests from barbers |
| `VportDashboardTeamScreen` | Dashboard — team management |

---

## Key Risks

| Tab | Risk | Notes |
|---|---|---|
| `book` | CRITICAL | Team-aware booking — barber identity selection, booking ownership |
| `team` | HIGH | Barber identity exposure, team membership gates booking routing |
| `owner` | HIGH | isOwner injection + VportBarberShopOwnerBand conditional |

---

## Source

`features/profiles/kinds/vport/model/getVportTabsByType.model.js`

```js
const VPORT_BARBERSHOP_TABS = ['portfolio', 'book', 'team', 'services', 'reviews', 'about', 'photos', 'vibes', 'content', 'subscribers'];
// applied to: 'barbershop'
```

---

## Governance

| Command | Status | Notes |
|---|---|---|
| VENOM | NOT_STARTED | Focus: book tab ownership + team identity exposure + team join/leave gate |
| ARCHITECT | NOT_STARTED | Map `VportBarberShopBookingView` import chain; confirm adapter boundary |
| KRAVEN | NOT_STARTED | Team-aware booking has more DAL calls than generic booking |
| SENTRY | NOT_STARTED | Two booking view components for same tab key — layer compliance |
| SPIDER-MAN | NOT_STARTED | Team join regression, booking via team member regression |
| LOGAN | PARTIAL | This doc |
