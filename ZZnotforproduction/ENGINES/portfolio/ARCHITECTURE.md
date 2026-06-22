# ARCHITECTURE — engines/portfolio

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** COMPLETE — anomalies found
**Independence:** MOSTLY INDEPENDENT

---

## Engine Purpose

Vport portfolio management. Handles the full lifecycle of portfolio items: create, list, update, soft-delete, media attachment, tag management, and kind-specific detail fetch (barber, locksmith). Pure vport schema access — no RPCs, no external transport.

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/portfolio/`

## CLAUDE.md

PRESENT — explicit scope rules documented. vport schema tables listed. Layer rules defined.

## Public API Alias

`@portfolio` — consumed by VCSM (3 consumer files). Setup: `apps/VCSM/src/features/portfolio/setup.js`.

## Layer Structure

```
index.js                  — entry point → src/adapters/index.js
src/
  adapters/index.js       — 14 exported symbols (public API)
  config.js               — DI (supabaseClient req, isActorOwner req, debugReporter opt; no freeze guard)
  events.js               — 6 domain events
  types/index.js          — JSDoc typedefs
  controller/             — 8 controllers + 1 test (updateItem)
  dal/                    — 8 DAL files + 1 test (portfolioTags.write)
    barberDetails.read.dal.js       — VPORT kind-specific (ANOM-PORT-003)
    locksmithDetails.read.dal.js    — VPORT kind-specific (ANOM-PORT-003)
  model/                  — 4 pure row→domain transforms
  services/portfolioService.js — itemExists + resolveItem
```

Total: 29 files (only engine in sprint with existing tests)

## DB Access

vport schema exclusively:
- `portfolio_items` — READ + WRITE (soft-delete)
- `portfolio_media` — READ + WRITE (hard-delete — ANOM-PORT-001)
- `portfolio_tags` — READ + WRITE
- `barber_portfolio_details` — READ only (no write DAL)
- `locksmith_portfolio_details` — READ only (no write DAL)
- `profiles` — READ (actorId → profileId resolution)
- `portfolio_item_metrics` — DECLARED but no DAL (ANOM-PORT-005)
- `portfolio_item_services` — DECLARED but no DAL (ANOM-PORT-005)

## Security Controls

| Control | Status |
|---------|--------|
| isActorOwner DI before all writes | PASS |
| UPDATE/DELETE double guard (id + profile_id) | PASS |
| Media DELETE — RLS only, no app guard | ANOM-PORT-001 |
| isActorOwner RLS reliance (no explicit user_id filter) | ANOM-PORT-002 |
| Tag replace inline ownership check | PASS |

## Architecture Anomalies

| ID | Anomaly | Severity |
|----|---------|----------|
| ANOM-PORT-001 | Media hard delete relies solely on RLS | HIGH |
| ANOM-PORT-002 | isActorOwner relies on RLS with no explicit user_id filter | MEDIUM |
| ANOM-PORT-003 | Kind-specific DALs (barber, locksmith) baked into generic engine | LOW-MEDIUM |
| ANOM-PORT-004 | No DI freeze guard at engine config level | LOW |
| ANOM-PORT-005 | Two schema tables (metrics, services) declared but no DAL | LOW |

## Known Gaps

- BEHAVIOR.md: MISSING
- SECURITY.md: MISSING
- Partial test coverage (2 test files: updateItem controller + portfolioTags write DAL)

## Full Report

`ZZnotforproduction/ENGINES/portfolio/outputs/2026/06/05/ARCHITECT/engine.portfolio.architecture.md`
