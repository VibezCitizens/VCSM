# Feature: notifications

**Status:** ACTIVE
**Security Tier:** MEDIUM
**Source:** `apps/VCSM/src/features/notifications/`
**Last audit sprint:** 2026-05-19

## What This Feature Does

The notifications feature manages the notification inbox, badge count polling, follow-request rendering, and the publish adapter surface that all other features use to send notifications. It consumes the `@notifications` engine (engine-owned DAL for all `notification.*` schema tables) and enforces a bidirectional block filter on all inbox reads.

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| VENOM | COMPLETE — no blocking findings; RISK-6 layer violation OPEN (dead code) | 2026-05-19 | `CURRENT/features/dashboard/evidence/venom_notifications-dal_2026-05-19.md` |
| LOKI | COMPLETE — 2 open LOW findings (LF-1, LF-2) | 2026-05-19 | `CURRENT/features/dashboard/evidence/loki_notifications-dal_2026-05-19.md` |
| IRONMAN | COMPLETE — ownership PARTIAL; publish ACL gap OPEN | 2026-05-19 | `CURRENT/features/dashboard/evidence/2026-05-19_ironman_notifications.md` |
| KRAVEN | COMPLETE — KF-1 serial publish loop OPEN | 2026-05-19 | `_ACTIVE/audits/performance/2026-05-19_kraven_notifications-dal.md` |
| SENTRY | REVIEW_PENDING — 6 dead files pending deletion approval; RISK-9 layer violation OPEN | 2026-05-19 | `CURRENT/features/dashboard/evidence/sentry_notifications-dal_2026-05-19.md` |
| THOR | NOT_STARTED | — | No release report found |
| BLACKWIDOW | NOT_STARTED | — | No report found |
| CARNAGE | NOT_STARTED | — | No report found (RLS ownership for notification.* tables undocumented) |
| DB | NOT_STARTED | — | No report found; 5 undocumented tables flagged by LOKI (LF-2) |
| FALCON | MISSING | — | No FALCON review; native ownership unassigned per IRONMAN |
| ARCHITECT | NOT_STARTED | — | No report found |
| CEREBRO | COMPLETE (trigger) | 2026-05-19 | Triggered all 2026-05-19 audit passes |
