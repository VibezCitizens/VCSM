# Feature: block

**Status:** ACTIVE
**Security Tier:** HIGH
**Source:** `apps/VCSM/src/features/block/`
**Last audit sprint:** 2026-05-14

## What This Feature Does

The block feature enforces social moderation across the platform — blocking and unblocking actors, filtering blocked actors from feed, profile views, and chat, and propagating block side effects to the follow/friend-rank graph. It is consumed by feed, chat, profile, and friend ranking surfaces.

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| VENOM | COMPLETE — 1 OPEN, 4 RESOLVED | 2026-05-11 | `CURRENT/features/dashboard/evidence/2026-05-11_venom_block-feature.md` |
| SENTRY | COMPLETE — ALL RESOLVED | 2026-05-11 | `CURRENT/features/dashboard/evidence/2026-05-11_sentry_block-dal.md` |
| LOKI | COMPLETE — 2 OPEN findings | 2026-05-14 | `CURRENT/features/dashboard/evidence/2026-05-14_loki_block-dal-status-read.md` |
| THOR | COMPLETE — CAUTION (PWA) / BLOCKED (iOS, Android) | 2026-05-14 | `CURRENT/features/dashboard/evidence/2026-05-14_thor_block-feature-governance.md` |
| KRAVEN | NOT_STARTED | — | — |
| IRONMAN | NOT_STARTED | — | — |
| CARNAGE | NOT_STARTED | — | — |
