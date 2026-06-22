# ARCHITECTURE — engines/reviews

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** COMPLETE — anomalies found
**Independence:** MOSTLY INDEPENDENT

---

## Engine Purpose

Actor review lifecycle management. Submit (upsert via SECURITY DEFINER RPC), list with pagination, soft-delete, dimension rating management, and aggregate stats retrieval. Pure reviews schema — no cross-schema queries.

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/reviews/`

## CLAUDE.md

PRESENT — explicit scope rules. reviews schema exclusively. No React hooks, no cross-schema queries.

## Public API Alias

`@reviews` — consumed by VCSM (2 consumer files). Setup: `apps/VCSM/src/features/reviews/setup.js`.

## Layer Structure

```
index.js                    — entry point → src/adapters/index.js
src/
  adapters/index.js         — 14 exported symbols (public API)
  config.js                 — DI (supabaseClient req, isActorOwner req, resolveActorCard opt; no freeze guard)
  events.js                 — 5 domain events (2 defined but never emitted — ANOM-REV-004)
  types/index.js            — JSDoc typedefs
  controller/               — 6 orchestration controllers
  dal/                      — 6 DAL files
    reviews.rpc.dal.js      — upsert_neutral_review (SECURITY DEFINER) + get_target_overall_stats
    reviews.write.dal.js    — dalInsertReview (POSSIBLY DEAD CODE — ANOM-REV-001)
  model/                    — 6 models; ReviewRevision.model.js unimplemented (ANOM-REV-002)
  services/                 — 3 service helpers
```

Total: 27 files

## Infrastructure

reviews schema exclusively — 4 tables, 2 RPCs. No React. No external transport. Cleanest engine in sprint.

## Key Architectural Patterns

- **Active card**: one review per author→target pair; enforced by upsert_neutral_review RPC
- **Snapshot columns**: author display data captured at write time; eliminates N+1 at read time
- **Two-layer ownership**: isActorOwner DI (app pre-check) + SECURITY DEFINER RPC (DB enforcement)
- **Cursor pagination**: review_activity_at timestamp cursor in listReviews

## DB Access

| Table | Ops |
|-------|-----|
| reviews.reviews | READ + WRITE (soft-delete) |
| reviews.review_dimensions | READ (form config) |
| reviews.review_dimension_ratings | READ + WRITE (upsert/delete) |
| reviews.review_revisions | NONE (unimplemented — ANOM-REV-002) |

RPCs: `upsert_neutral_review` (SECURITY DEFINER), `get_target_overall_stats`

## Security Controls

| Control | Status |
|---------|--------|
| isActorOwner DI pre-check | PASS |
| Self-review guard | PASS |
| SECURITY DEFINER RPC (second gate) | PASS |
| Rating range validation (1–5) | PASS |
| isActorOwner RLS reliance (REV-V-001 fix applied) | NOTE (acknowledged) |
| dalInsertReview bypasses active_card/snapshot logic | ANOM-REV-001 |

## Architecture Anomalies

| ID | Anomaly | Severity |
|----|---------|----------|
| ANOM-REV-001 | dalInsertReview potentially dead — bypasses SECURITY DEFINER RPC logic | MEDIUM |
| ANOM-REV-002 | ReviewRevision model + review_revisions table declared but no read DAL | LOW |
| ANOM-REV-003 | No DI freeze guard at engine config level | LOW |
| ANOM-REV-004 | REVIEW_UPDATED + STATS_REQUESTED events defined but never emitted | LOW |
| ANOM-REV-005 | resolveActorCard DI vestigial — VCSM does not inject it; snapshot used instead | LOW |

## Known Gaps

- BEHAVIOR.md: MISSING
- SECURITY.md: MISSING
- Zero tests

## Full Report

`ZZnotforproduction/ENGINES/reviews/outputs/2026/06/05/ARCHITECT/engine.reviews.architecture.md`
