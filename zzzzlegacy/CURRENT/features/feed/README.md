# Feature: feed

**Status:** ACTIVE
**Security Tier:** MEDIUM
**Source:** `apps/VCSM/src/features/feed/`
**Last audit sprint:** 2026-05-14

## What This Feature Does

The feed feature is the central content discovery system — it renders paginated, privacy-filtered, block-aware posts for authenticated citizens. It operates through a pipeline/query/DAL stack that batches up to 9 parallel DB reads per page load, with optional drain-loop behavior on initial load to fill visible content.

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| VENOM | COMPLETE — 3 OPEN, 4 PASS | 2026-05-14 | `CURRENT/features/dashboard/evidence/2026-05-14_venom_feed-dal-trust-boundaries.md` |
| SENTRY | COMPLETE — 6 OPEN VIOLATIONS | 2026-05-14 | `CURRENT/features/dashboard/evidence/sentry_feed-dal-architecture-2026-05-14.md` |
| KRAVEN | COMPLETE — 3 MODERATE, 1 PASS | 2026-05-14 | `_ACTIVE/audits/performance/kraven_feed-dal-query-cost-2026-05-14.md` |
| LOKI | COMPLETE — 3 MODERATE, 3 LOW | 2026-05-14 | `CURRENT/features/dashboard/evidence/loki_feed-dal-runtime-2026-05-14.md` |
| THOR | NOT_STARTED | — | — |
| IRONMAN | NOT_STARTED | — | — |
| CARNAGE | NOT_STARTED | — | — |
