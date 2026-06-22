# Governance: KRAVEN — Performance Reviews

**Authority:** KRAVEN is the performance hunter and bottleneck analysis command.
**Last Updated:** 2026-05-27

## Responsibility

KRAVEN reviews VPORT tab performance for:
- DB read counts on cold/warm mount per tab
- N+1 query patterns (especially barbershop team + availability reads)
- Serial async chains that could be parallelized
- Cache efficiency — which tabs have no cache layer
- Duplicate table reads per request
- Controller fan-out complexity
- Payload size and hydration cost

## Tab Performance Priority

| Tab | Priority | Expected Risk | Notes |
|---|---|---|---|
| book (barbershop) | HIGH | HIGH | Team + availability fan-out |
| book (generic) | HIGH | MEDIUM | Availability reads |
| gas | HIGH | MEDIUM | No cache layer detected — possible DB per page load |
| team | MEDIUM | MEDIUM | Barber list reads |
| rates | COMPLETE | LOW | KRAVEN VERIFIED 2026-05-27 |
| menu | MEDIUM | MEDIUM | Menu item list reads |
| services | MEDIUM | LOW | Service list reads |
| reviews | MEDIUM | LOW | Reviews engine reads |
| portfolio | LOW | LOW | Media list reads |
| about | LOW | NONE | Expected 0 additional reads |
| subscribers | LOW | LOW | List reads |
| content | LOW | LOW | Feed slice reads |
| vibes | LOW | LOW | Feed slice reads |

## Reports Location

`governance/kraven/` — filename format: `YYYY-MM-DD_kraven_vport-tab-<tab-key>.md`

## Completed Reports

| Tab | Date | Status | Findings |
|---|---|---|---|
| rates | 2026-05-27 | VERIFIED | 3 LOW findings — DTAB-008, DTAB-009, KPF-003 |
