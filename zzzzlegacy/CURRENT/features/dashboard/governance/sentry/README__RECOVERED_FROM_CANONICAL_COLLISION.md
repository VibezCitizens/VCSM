# Governance: SENTRY — Architecture Compliance Reviews

**Authority:** SENTRY is the architecture compliance and boundary enforcement commander.
**Last Updated:** 2026-05-27

## Responsibility

SENTRY reviews VPORT tab architecture compliance for:
- Layer responsibility alignment (view/hook/controller/DAL separation)
- Actor ownership placement — ownership checks in controller layer, not UI
- Identity surface compliance — no raw UUIDs in public surfaces
- Engine isolation — engines not importing app-specific logic
- Adapter boundary enforcement — cross-feature imports via adapters only
- Cache architecture discipline — cache ownership, invalidation placement

## Drift Classification Per Tab

| Tab | Expected Drift | Reason |
|---|---|---|
| rates | MINOR DRIFT | SF-001, SF-002 — P3 direct imports in screen |
| book | UNVERIFIED | Two-component split may blur layer responsibilities |
| team | UNVERIFIED | Team identity in public view — ownership architecture? |
| gas | UNVERIFIED | Price write controller — ownership layer verified? |
| others | NOT_STARTED | — |

## SENTRY Release Gate

SENTRY must find no CONTRACT VIOLATION or MAJOR DRIFT for THOR to approve a tab's release. MINOR DRIFT is accepted if P3 deferred items have a mitigation plan.

## Reports Location

`governance/sentry/` — filename format: `YYYY-MM-DD_sentry_vport-tab-<tab-key>.md`

## Completed Reports

| Tab | Date | Status | Finding |
|---|---|---|---|
| rates | 2026-05-27 | MINOR DRIFT | SF-001, SF-002 — deferred P3 |
