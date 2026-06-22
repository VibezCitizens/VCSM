# Type Preset — Service (Multiple Group Variants)

**Applies To:** Multiple groups with booking-oriented or service-catalog-oriented patterns
**Last Updated:** 2026-05-27

---

## Overview

There is no single "service" preset. Service-oriented VPORT types are split across three group presets depending on their specific conversion pattern:

| Preset | Groups | Key Differentiator |
|---|---|---|
| `VPORT_SERVICE_BOOK_TABS` | Beauty & Wellness, Education & Care, Sports & Fitness, Animal Care | Portfolio-first, booking prominent |
| `VPORT_SERVICE_TABS` | Professional & Business Services, Transport & Logistics | Portfolio-first, no booking |
| `VPORT_TRADES_TABS` | Home, Maintenance & Trades | Portfolio-first, booking at position 3 |
| `VPORT_HEALTH_TABS` | Health & Medical | Book-first, no portfolio |

---

## VPORT_SERVICE_BOOK_TABS

**Groups:** Beauty & Wellness, Education & Care, Sports & Fitness, Animal Care

```
1. portfolio      ← visual work showcase
2. book           ← appointment booking
3. services       ← service catalog with pricing
4. reviews
5. about
6. photos
7. vibes
8. subscribers
```

**Examples:** hairstylist, fitness instructor, yoga instructor, tutor, nanny, dog walker

---

## VPORT_SERVICE_TABS

**Groups:** Professional & Business Services, Transport & Logistics

```
1. portfolio      ← case studies / past work
2. services       ← service offering list
3. reviews
4. content
5. about
6. vibes
7. photos
8. subscribers
```

**Note:** No `book` tab — professional services (lawyers, accountants, consultants) use inquiry contact rather than appointment booking.

**Examples:** lawyer, accountant, consultant, designer, developer, real estate, courier, driver

---

## VPORT_TRADES_TABS

**Group:** Home, Maintenance & Trades

```
1. portfolio      ← job photos (before/after)
2. services       ← trade service list
3. book           ← on-demand service booking
4. reviews
5. about
6. photos
7. subscribers
```

**Note:** Booking is at position 3 (after services) because trades visitors evaluate service offerings before committing to a booking call.

**Examples:** plumber, electrician, contractor, handyman, painter, carpenter, landscaper

---

## VPORT_HEALTH_TABS

**Group:** Health & Medical

```
1. book           ← LANDING TAB — appointment booking is primary intent
2. services       ← treatment/service list
3. reviews
4. about
5. photos
6. subscribers
```

**Note:** Health types have booking as landing tab — medical appointment scheduling is the primary action. No portfolio (inappropriate for most medical contexts), no vibes (professional gravity).

**Examples:** doctor, dentist, chiropractor, therapist, nutritionist, nurse

---

## Key Risks

| Tab | Risk | Affects |
|---|---|---|
| `book` | CRITICAL | All presets with booking |
| `portfolio` | MEDIUM | SERVICE_BOOK, SERVICE, TRADES |

---

## Source

`features/profiles/kinds/vport/model/getVportTabsByType.model.js`

---

## Governance

| Command | Status | Notes |
|---|---|---|
| VENOM | NOT_STARTED | Focus on book tab across all service presets |
| ARCHITECT | NOT_STARTED | — |
| SENTRY | NOT_STARTED | — |
| SPIDER-MAN | NOT_STARTED | — |
| LOGAN | PARTIAL | This doc |
