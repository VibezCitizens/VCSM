# Feature: media

**Status:** ACTIVE
**Security Tier:** MEDIUM
**Source:** `apps/VCSM/src/features/media/`
**Last audit sprint:** 2026-05-19

## What This Feature Does

The media feature is a platform utility layer that manages all `platform.media_assets` writes for VCSM. It owns a single write controller (`createMediaAssetController`), two DAL files (write + app-id resolver), a model, and an adapter boundary. It has no UI of its own — all 10 consumer flows across the platform route through this controller. The app-id resolver uses a module-level cache (one DB query per browser session).

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| VENOM | COMPLETE — 2 findings OPEN at time of audit; status updated by THOR/DB | 2026-05-19 | `CURRENT/features/dashboard/evidence/2026-05-19_venom_media-dal-trust-boundary.md` |
| LOKI | COMPLETE — observability gaps noted, non-blocking | 2026-05-19 | `CURRENT/features/dashboard/evidence/2026-05-19_loki_media-dal-runtime-trace.md` |
| IRONMAN | COMPLETE — Ownership CLEAR | 2026-05-19 | `CURRENT/features/dashboard/evidence/2026-05-19_13-00_ironman_media-feature-ownership.md` |
| THOR | COMPLETE — RELEASE_READY | 2026-05-19 | `CURRENT/features/dashboard/evidence/2026-05-19_13-30_thor_media-dal-release-gate.md` |
| SENTRY | COMPLETE — VERIFIED, all 7 contract rules pass | 2026-05-19 | `CURRENT/features/dashboard/evidence/sentry_2026-05-19_media-dal-post-fix-compliance.md` |
| CARNAGE | PRESENT (via THOR signal inventory) | 2026-05-19 | `CURRENT/features/dashboard/evidence/` (referenced as `2026-05-19_12-30_carnage_media-assets-rls-and-schema.md`) |
| DB | PRESENT (via THOR signal inventory) | 2026-05-19 | `_ACTIVE/audits/` (referenced as `2026-05-19_12-00_db_media-assets-rls-audit.md`) |
| KRAVEN | PRESENT — inline AvengersAssemble 2026-05-11 | 2026-05-11 | Inline — no standalone report |
| ARCHITECT | PRESENT — CEREBRO pass, RISK-1 resolved | 2026-05-19 | Inline CEREBRO pass |
| FALCON | OUT OF SCOPE | N/A | DAL layer — no native surface |
| WINTERSOLDIER | OUT OF SCOPE | N/A | DAL layer — no native surface |
| BLACKWIDOW | OUT OF SCOPE | N/A | Not required for adapter import migration |
| SHIELD | PRESENT — inline AvengersAssemble 2026-05-11 | 2026-05-11 | Inline — no standalone report |
