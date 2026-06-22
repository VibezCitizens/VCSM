# Feature: moderation

**Status:** ACTIVE
**Security Tier:** HIGH
**Source:** `apps/VCSM/src/features/moderation/`, `apps/VCSM/src/features/block/`
**Last audit sprint:** 2026-05-10 (multi-agent: ARCHITECT, VENOM, DB, KRAVEN; CARNAGE DB remediation plan)

## What This Feature Does

The moderation feature manages two independent systems sharing the `moderation.*` DB schema: System A handles user-facing report/hide/cover workflows for content flagging, and System B handles actor-to-actor safety relationships via the block graph. Both systems are actor-first — identity is always `actorId + domain`. Feed block enforcement is dual-layer: client-side TTL cache and DB-level RLS.

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| ARCHITECT | COMPLETED | 2026-05-10 | `_ACTIVE/audits/moderation/2026-05-10_00-00_moderation-system-review.md` (multi-agent) |
| VENOM | COMPLETED | 2026-05-10 | `_ACTIVE/audits/moderation/2026-05-10_00-00_moderation-system-review.md` §8 |
| KRAVEN | COMPLETED | 2026-05-10 | `_ACTIVE/audits/moderation/2026-05-10_00-00_moderation-system-review.md` §9 |
| DB | COMPLETED | 2026-05-10 | `_ACTIVE/audits/moderation/2026-05-10_00-00_moderation-system-review.md` §3–5 |
| CARNAGE | COMPLETED (plan only) | 2026-05-10 | `_ACTIVE/planning/moderation-db-remediation/2026-05-10_moderation-db-remediation-plan.md` |
| ELEKTRA | NOT_STARTED | — | No ELEKTRA report found in source files |
| SPIDER-MAN | NOT_STARTED | — | No test coverage audit found in source files |
| FALCON | NOT_STARTED | — | No FALCON report found in source files |
| SENTRY | NOT_STARTED | — | No SENTRY compliance report found in source files |
