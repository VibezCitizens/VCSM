# Type Preset — Barber

**Preset Name:** `VPORT_BARBER_TABS`
**Applies To:** `barber`, `locksmith` (type-level override)
**Priority:** HIGH — type-level override, overrides group preset
**Last Updated:** 2026-05-27

---

## Tab Order

```
1. portfolio      ← LANDING TAB — work showcase is primary conversion signal
2. book           ← booking appointment (generic VportBookingView)
3. services       ← service menu with pricing
4. reviews        ← trust signal
5. content        ← social content
6. about          ← location, hours, contact
7. photos         ← work photos
8. vibes          ← social feed
9. subscribers
(+owner — dynamically injected if isOwner)
```

---

## Design Intent

Portfolio-first ordering because visiting a barber profile is a **visual trust evaluation**. The visitor wants to see haircut quality before booking. Book is second to minimize friction from portfolio → appointment.

Locksmith reuses this preset because locksmith profiles similarly lead with demonstrated work (job photos) before service catalog — same conversion pattern.

---

## Shared Preset Note

`locksmith` uses `VPORT_BARBER_TABS`. This means:
- Locksmiths get a `book` tab (for on-demand service requests)
- Locksmiths get a `portfolio` tab (job site photos)
- There is a locksmith-specific dashboard screen (`VportDashboardLocksmithScreen`) but the **public profile preset** is shared with barber

This sharing should be evaluated during the ARCHITECT audit of this preset — locksmith may eventually need its own type override if the booking flow diverges.

---

## Key Risks

| Tab | Risk | Notes |
|---|---|---|
| `book` | CRITICAL | Booking write path — VENOM required |
| `portfolio` | MEDIUM | Upload surface |

---

## Source

`features/profiles/kinds/vport/model/getVportTabsByType.model.js`

```js
const VPORT_BARBER_TABS = ['portfolio', 'book', 'services', 'reviews', 'content', 'about', 'photos', 'vibes', 'subscribers'];
// applied to: 'barber', 'locksmith'
```

---

## Governance

| Command | Status | Notes |
|---|---|---|
| VENOM | NOT_STARTED | Focus on `book` tab ownership + payment path |
| ARCHITECT | NOT_STARTED | Confirm locksmith sharing is intentional |
| SENTRY | NOT_STARTED | — |
| SPIDER-MAN | NOT_STARTED | Booking flow regression tests |
| LOGAN | PARTIAL | This doc |
