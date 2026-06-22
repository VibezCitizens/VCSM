# Type Preset — Locksmith

**Preset Name:** `VPORT_BARBER_TABS` (shared with barber)
**Applies To:** `locksmith` (type-level override)
**Priority:** HIGH — type-level override
**Last Updated:** 2026-05-27

---

## Tab Order

```
1. portfolio      ← LANDING TAB — job site photos
2. book           ← on-demand service booking (generic VportBookingView)
3. services       ← service list with pricing (emergency unlock, rekeying, etc.)
4. reviews        ← trust signal
5. content        ← social content
6. about          ← service area, hours, contact
7. photos         ← job photos
8. vibes          ← social feed
9. subscribers
(+owner — dynamically injected if isOwner)
```

---

## Design Intent

Locksmith profiles convert via trust and demonstrated work. Portfolio-first because visitors need to verify legitimacy (active locksmith scams exist). Book second for emergency call-out conversion.

---

## Shared Preset with Barber

Locksmith uses `VPORT_BARBER_TABS` — see `type-presets/barber.md` for the full preset definition. This is an intentional sharing of the portfolio-first, book-second pattern.

**Divergence risk:** If the locksmith booking flow needs emergency/location-based routing (vs appointment-based barber scheduling), this preset sharing may need to be broken. Flag for ARCHITECT review.

---

## Locksmith-Specific Dashboard

`VportDashboardLocksmithScreen` exists as a type-specific dashboard screen (service areas, hours for emergency response). This dashboard screen is separate from the public profile tabs.

---

## Key Risks

| Tab | Risk | Notes |
|---|---|---|
| `book` | HIGH | On-demand emergency booking — may have different urgency UX than barber |
| Preset sharing | MEDIUM | Locksmith divergence from barber preset not yet evaluated |

---

## Source

`features/profiles/kinds/vport/model/getVportTabsByType.model.js`

```js
// TYPE_TABS override:
locksmith: VPORT_BARBER_TABS
```

---

## Governance

| Command | Status | Notes |
|---|---|---|
| VENOM | NOT_STARTED | Booking path |
| ARCHITECT | NOT_STARTED | Evaluate locksmith preset sharing — should it be its own? |
| LOGAN | PARTIAL | This doc |
