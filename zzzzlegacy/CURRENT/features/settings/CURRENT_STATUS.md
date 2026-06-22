---
# settings — CURRENT_STATUS.md
# Last Updated: 2026-06-02
# Updated By: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

## Feature Status

| Field | Value |
|---|---|
| Status | ACTIVE — with deferred security debt |
| Security Tier | HIGH |
| Auth Surface | OWNER |
| Priority | P1 |
| Last Security Audit | ELEKTRA: 2026-05-28 / VENOM: 2026-05-27 / BLACKWIDOW: 2026-05-27 |
| Last Ownership Audit | IRONMAN: 2026-05-26 |
| Last Architecture Evidence | PARTIAL — architecture maps present; no persisted formal ARCHITECT output found |
| Last Test Audit | SPIDER-MAN: 2026-05-26 |
| Open Security Findings | 5 (ELEK-005, ELEK-006, ELEK-2026-05-28-002, ELEK-2026-05-28-004, VENOM-SETTINGS-004 + BW-SETTINGS-005) |
| Pending Migrations | 1 (TICKET-SUB-010-B — actor_social_settings RLS) |
| Open Tickets | TICKET-SUB-010-B (PENDING migration), TICKET-BOOKING-RPC-001 (indirect) |
| Recommended Next Command | SENTRY post-execution, then full VENOM+ELEKTRA pass post-migration |
| Last Updated | 2026-06-02 |

---

## Active Ticket State

| Ticket | Title | Status | Priority |
|---|---|---|---|
| TICKET-0004 | Dashboard Architecture Contract + Settings planning | RESOLVED | P0 |
| TICKET-0009 | Dashboard Settings Security Backfill (SETTINGS-ARCH-001 + SETTINGS-RISK-001) | RESOLVED | P1 |
| TICKET-SUB-010-B | vc.actor_social_settings RLS owner delegation migration | PENDING | P1 |
| TICKET-BOOKING-RPC-001 | Booking state-machine RPC migration | OPEN / DB-BLOCKED | P0 (indirect) |

---

## Known Blockers

1. TICKET-SUB-010-B PENDING — `actor_social_settings` owner-delegation RLS migration not yet applied. `ctrlUpdateVportSocialSettings` cannot be built until this migration lands.
2. ELEK-2026-05-28-002 DEFERRED — `ctrlSetActorPrivacy` accepts any `actorId` from caller with no server-side ownership verification. Actor privacy hijack possible. No sprint assigned.
3. ELEK-2026-05-28-004 DEFERRED — `dalSetActorPrivacy` has no `auth.getUser()` binding. RLS status on `vc.actor_privacy_settings` not confirmed. DB audit required.
4. ELEK-2026-05-28-005 OPEN — `dalDeleteOwnedVportById` deprecated DAL still exported and live. Uses legacy `owner_user_id`; omits cascade logic.
5. VENOM-SETTINGS-004 DEFERRED P2 — `listMyVportsDAL` still uses `owner_user_id`. Approved `actor_owners` rewrite documented; no sprint assigned.
6. BW-SETTINGS-005 OPEN — No optimistic locking on `upsertVportPublicDetailsDAL`. Replay attack post-session compromise possible.
7. Zero test coverage for all settings flows (hooks, validation model, controller ownership gates).

---

## Resolved Items (This Sprint)

| Item | Ticket | Date |
|---|---|---|
| VENOM-SETTINGS-001 — controller exported from settings index | TICKET-0009 | 2026-06-02 |
| VENOM-SETTINGS-002 — No RLS on profile_public_details | CARNAGE migration | 2026-05-27 |
| ELEK-2026-05-28-001 — ctrlSetVportBusinessCardPublishState missing ownership gate | TICKET-0009 pre-flight | 2026-06-02 |
| ELEK-2026-05-28-003 — syncDirectoryVisibleToPublicDetailsDAL table had no RLS | CARNAGE migration | 2026-05-27 |
| VENOM-SETTINGS-006 — identity.vportType client-side injection risk | BLACKWIDOW sprint | 2026-05-27 |
| settingsCoordinator.controller.js created | TICKET-0009 | 2026-06-02 |
| useSaveVportSettings.js validation moved to coordinator | TICKET-0009 | 2026-06-02 |

---

## Release Gate State

| Gate | Status | Command |
|---|---|---|
| Ownership gate | CLEAR (IRONMAN 2026-05-26) | THOR may release with caution |
| Write path ownership | CLEAR | IRONMAN confirmed |
| Privacy controller gate | MISSING (ELEK-002/004 deferred) | Separate sprint required |
| Account DAL cascade | OPEN (ELEK-005) | Deprecated DAL still live |
| actor_social_settings RLS | PENDING migration | TICKET-SUB-010-B |
| Test coverage | MISSING | SPIDER-MAN not re-run post-TICKET-0009 |
| Full VENOM/ELEKTRA post-implementation | PENDING | After TICKET-SUB-010-B migration |

---

## Recommended Next Action

1. Apply TICKET-SUB-010-B migration (`actor_social_settings` owner-delegation RLS) — unblocks social settings write path.
2. Run SENTRY post-execution review on TICKET-0009 changes.
3. Run scoped VENOM+ELEKTRA on settings after migration is applied.
4. Open dedicated sprint for ELEK-002/004 (ctrlSetActorPrivacy / dalSetActorPrivacy hardening).
5. Add test coverage for `vportSettingsValidation.model.js` and settings hooks (SPM-007).

## ARCHITECT Propagation Sync — 2026-06-02

No dedicated persisted settings ARCHITECT command output was found under `CURRENT/outputs`, HISTORY, or _HISTORY. Settings has architecture-map evidence (`ARCHITECTURE.md`, `vcsm.settings.architecture.md`, `vcsm.bottom-nav.settings.architecture.md`) and prior IRONMAN/VENOM/ELEKTRA/BLACKWIDOW coverage, but DR. STRANGE must treat ARCHITECT as PARTIAL until a formal settings ARCHITECT output exists.

---

## DR. STRANGE Summary

The settings feature is ACTIVE with a known security debt backlog. Two resolved tickets (TICKET-0004 and TICKET-0009) completed the coordinator pattern, ownership gate verification, and canonical RLS migration. Six open/deferred findings remain: two HIGH-severity privacy controller gaps (ELEK-002/004 deferred to a separate sprint), one deprecated DAL still live (ELEK-005), one legacy DAL read pattern (VENOM-SETTINGS-004 P2), one replay risk (BW-SETTINGS-005 low), and one pending DB migration (TICKET-SUB-010-B). IRONMAN confirmed ownership is CLEAR for VPORT write paths. THOR may release the current state with caution — the privacy hardening sprint is the next mandatory security gate.
---
