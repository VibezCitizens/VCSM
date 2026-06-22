# Feature: post

**Status:** ACTIVE
**Security Tier:** MEDIUM
**Source:** `apps/VCSM/src/features/post/`, `apps/VCSM/src/features/upload/`
**Last audit sprint:** 2026-05-19

## What This Feature Does

The post feature handles creating, editing, soft-deleting, and reacting to posts, including system posts published on behalf of VPORT actors. It also covers mention autocomplete, post media recording, and the post write/read DAL boundary.

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| VENOM | COMPLETE — 2 OPEN FINDINGS | 2026-05-19 | `CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md` |
| SENTRY | COMPLETE — 1 OPEN FINDING | 2026-05-19 | `CURRENT/features/dashboard/evidence/sentry_post-dal-dal-boundary-2026-05-19.md` |
| review-contract | COMPLETE — 1 OPEN FINDING | 2026-05-19 | `CURRENT/features/dashboard/evidence/review-contract_post-dal-2026-05-19.md` |
| KRAVEN | NOT_STARTED | — | — |
| LOKI | NOT_STARTED | — | — |
| THOR | NOT_STARTED | — | — |
| IRONMAN | NOT_STARTED | — | — |
| CARNAGE | NOT_STARTED | — | — |
