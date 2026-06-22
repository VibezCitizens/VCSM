# Feature: social

**Status:** ACTIVE
**Security Tier:** MEDIUM
**Source:** `apps/VCSM/src/features/social/`
**Last audit sprint:** 2026-05-27 (TICKET-SUB-001 — subscriber/follow architecture review)

## What This Feature Does

The social feature manages the follow/subscribe graph between Citizens and VPORT actors, including follow requests for private accounts, follower/subscriber counts, notification routing for follow events, and actor privacy settings. It powers the VPORT subscriber display tab and the actor-global social graph used for feed visibility and profile display.

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| VENOM | COMPLETED | 2026-05-27 | `CURRENT/features/dashboard/evidence/2026-05-27_00-00_elektra_subscriber-follow-architecture.md` (via ELEKTRA) |
| ELEKTRA | COMPLETED | 2026-05-27 | `CURRENT/features/dashboard/evidence/2026-05-27_00-00_elektra_subscriber-follow-architecture.md` |
| SENTRY | COMPLETED | 2026-05-27 | `CURRENT/features/dashboard/evidence/2026-05-27_00-00_sentry_subscriber-follow-architecture.md` |
| FALCON | COMPLETED | 2026-05-27 | `CURRENT/features/dashboard/evidence/2026-05-27_00-00_falcon_subscriber-follow-architecture.md` |
| ARCHITECT | UNKNOWN | — | Not evidenced in audited source files |
| KRAVEN | UNKNOWN | — | Not evidenced in audited source files |
| SPIDER-MAN | UNKNOWN | — | Not evidenced in audited source files |
| BLACKWIDOW | PENDING | — | Referenced as follow-up in ELEKTRA findings; not yet confirmed |
| DB | PARTIAL | 2026-05-27 | DB queries run during TICKET-SUB-001 session; full DB audit not separate |
