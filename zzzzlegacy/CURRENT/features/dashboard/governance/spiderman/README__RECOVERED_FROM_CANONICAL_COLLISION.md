# Governance: SPIDER-MAN — Test Coverage Reviews

**Authority:** SPIDER-MAN is the regression safety net and test coverage commander.
**Last Updated:** 2026-05-27

## Responsibility

SPIDER-MAN reviews VPORT tab test coverage for:
- Controller write path regression tests (ownership enforcement, cache invalidation, error propagation)
- Hook-level tests (optimistic update, rollback on failure)
- Dedup throttle tests (for tabs with publish-as-post)
- Owner tab injection gate regression (non-owner cannot see owner tab)
- Feature flag kill switch regression (disabled tab truly unavailable)
- Tab preset resolution regression (correct tabs per type)
- Always-first rule regression (gas tab always lands first)
- Conditional component rendering regression (barbershop book vs generic book)

## Coverage Priority

| Tab | Priority | Coverage Status | Key Risk |
|---|---|---|---|
| book | CRITICAL | NOT_STARTED | Booking mutations, ownership before payment |
| owner | HIGH | NOT_STARTED | Injection gate bypass |
| team | HIGH | NOT_STARTED | Team join/leave ownership |
| gas | HIGH | NOT_STARTED | Price write ownership; always-first rule |
| rates | PARTIAL | PARTIAL | Controllers covered (26 tests); hook/view pending |
| menu | MEDIUM | NOT_STARTED | Menu write path |
| services | MEDIUM | NOT_STARTED | Service CRUD |
| reviews | MEDIUM | NOT_STARTED | Review submission identity |
| portfolio | MEDIUM | NOT_STARTED | Upload path |
| about | LOW | NOT_STARTED | No write path |

## Reports Location

`governance/spiderman/` — filename format: `YYYY-MM-DD_spiderman_vport-tab-<tab-key>.md`

## Completed Reports

| Tab | Date | Status | Tests Added |
|---|---|---|---|
| rates | 2026-05-27 | PARTIAL | 26 tests (2 controller files) — hook/view pending |
