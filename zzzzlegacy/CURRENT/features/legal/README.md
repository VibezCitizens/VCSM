# Feature: legal

**Status:** ACTIVE
**Security Tier:** HIGH
**Source:** `apps/VCSM/src/features/legal/`
**Last audit sprint:** 2026-05-18 (VENOM finding resolution verification); original sprint 2026-05-10

## What This Feature Does

The legal feature enforces the consent gate for all authenticated VCSM sessions, managing Terms of Service, Privacy Policy, and Age Verification consent records. It gates access to the platform until all required active legal documents have been accepted, fails closed on error, writes immutable consent rows with DB-authoritative timestamps, and handles re-consent when document versions change.

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| VENOM | COMPLETED | 2026-05-10 | `CURRENT/features/dashboard/evidence/2026-05-10_venom_terms-of-service-logic.md` |
| VENOM (resolution audit) | COMPLETED | 2026-05-18 | `CURRENT/features/dashboard/evidence/2026-05-18_venom_legal-dal-finding-resolution.md` |
| KRAVEN | COMPLETED | 2026-05-10 | `_ACTIVE/audits/performance/2026-05-10_kraven_terms-of-service-logic.md` |
| SENTRY | COMPLETED | 2026-05-10 | `CURRENT/features/dashboard/evidence/2026-05-10_sentry_vport-system-post-realm-hardening.md` (scope: VPORT system posts, not legal gate directly; ALIGNED verdict) |
| ARCHITECT | UNKNOWN | — | Referenced as input to VENOM/KRAVEN reports but no separate architect report found |
| ELEKTRA | NOT_STARTED | — | Not evidenced in source files |
| SPIDER-MAN | NOT_STARTED | — | Not evidenced in source files |
| FALCON | NOT_STARTED | — | Not evidenced in source files |
