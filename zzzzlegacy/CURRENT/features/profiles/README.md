# Feature: profiles

**Status:** ACTIVE
**Security Tier:** HIGH
**Source:** `apps/VCSM/src/features/profiles/`
**Last audit sprint:** 2026-05-22 to 2026-05-23

## What This Feature Does

The profiles feature is the largest module in VCSM (416 files), managing public and owner-facing actor profile pages, VPORT type panels (barbershop, locksmith, auto), owner write paths (services, rates, gas prices, menus), profile privacy gating, post grid display, portfolio panels, and review panels. It owns 72 DAL files, 61 controller files, and 132 component files, and consumes the `@hydration`, `@reviews`, and `@portfolio` engines via adapters.

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| VENOM | COMPLETE — VF-001 and VF-002 CLOSED; VF-003, VF-004, VF-005 OPEN; VF-006 OPEN | 2026-05-22 | `CURRENT/features/dashboard/evidence/2026-05-22_venom_profiles-trust-boundaries.md` |
| SENTRY | COMPLETE — SF-001 CLOSED; SF-002, SF-003, SF-004, SF-005, SF-006 OPEN | 2026-05-22 to 2026-05-23 | `CURRENT/features/dashboard/evidence/sentry_profiles-architecture-2026-05-22.md` + `CURRENT/features/dashboard/evidence/2026-05-23_sentry_profiles-block-reverification.md` |
| CARNAGE | PRESENT — migration endorsed; staging PENDING | 2026-05-22 | `_ACTIVE/audits/migrations/2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md` |
| DB | PRESENT — DR-001 CRITICAL (pre-existing `vc.posts` INSERT RLS gap) | 2026-05-22 | `_ACTIVE/audits/db/snapshots/2026-05-22_db_profiles-rls-coverage-audit.md` |
| LOKI | PRESENT — serial waterfall and missing post cache OPEN (non-blocking) | 2026-05-22 | `CURRENT/features/dashboard/evidence/2026-05-22_loki_profiles-runtime-trace.md` |
| KRAVEN | COMPLETE — bottlenecks documented; non-blocking for this release | 2026-05-22 | `_ACTIVE/audits/performance/2026-05-22_kraven_profiles-hot-path-analysis.md` |
| IRONMAN | COMPLETE — ownership PARTIAL; gaps documented | 2026-05-22 | `CURRENT/features/dashboard/evidence/2026-05-22_ironman_profiles-feature-ownership.md` |
| THOR | PRESENT — conditional code release PASS; DB migration BLOCKED until staged | 2026-05-23 | `CURRENT/features/dashboard/evidence/2026-05-23_thor_profiles-cerebro-release-gate.md` |
| LOGAN | PRESENT — MAJOR DRIFT; missing owner doc; non-blocking | 2026-05-22 | `CURRENT/features/dashboard/evidence/logan_profiles-doc-audit-2026-05-22.md` |
| ARCHITECT | PRESENT — stale counts, naming violations; non-blocking | 2026-05-22 | `_ACTIVE/audits/architect/modules/vcsm.profiles.architect-audit-2026-05-22.md` |
| FALCON | OUT OF SCOPE | — | Source document declares native parity N/A for profiles |
| BLACKWIDOW | MISSING | — | Not run this audit cycle |
| SHIELD | NOT_STARTED | — | No report found |
