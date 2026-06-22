# DR. STRANGE ENTRY — VPORT

**Category Key:** vport
**Type:** FEATURE
**CURRENT Path:** features/vport
**Source Path:** apps/VCSM/src/features/vport/
**Last Updated:** 2026-06-02
**Ticket:** TICKET-DRSTRANGE-BACKFILL-P1-0001
**Timestamp:** 2026-06-02T12:18:46

**Area:** VPort
---

## Feature

# Feature Index: vport

CURRENT Folder: zNOTFORPRODUCTION/CURRENT/features/vport
Source Path: apps/VCSM/src/features/vport/ + dashboard cards + profile kinds + public menu/QR + settings + subscribers + content pages + feed system posts

## Status

ACTIVE — multiple open security findings; release gates not fully cleared
Security Tier: HIGH

## Governance Score

| Category | Score | Notes |
|---|---|---|
| Files Present | 4/10 | README, CURRENT_STATUS, SECURITY, ARCHITECTURE present; OWNERSHIP, TESTS, PERFORMANCE, BLOCKERS, DEFERRED, HISTORY_INDEX missing |
| Security | COMPLETE | SECURITY.md present; 29 total findings (27 open) |
| Architecture | PARTIAL | ARCHITECTURE.md present; no consolidated boundary audit at feature root |
| Ownership | MISSING | OWNERSHIP.md missing |
| Testing | BLOCKED | TESTS.md missing; SPIDER-MAN blocked |
| Performance | MISSING | PERFORMANCE.md missing |
| **DR. STRANGE Readiness** | **4/10** | Based on files present |

## Documentation Coverage

| File | Exists | Summary |
|---|---|---|
| README.md | YES | Present |
| CURRENT_STATUS.md | YES | Present |
| SECURITY.md | YES | Present |
| ARCHITECTURE.md | YES | Present |
| OWNERSHIP.md | NO | MISSING — run IRONMAN |
| TESTS.md | NO | MISSING — run SPIDER-MAN |
| PERFORMANCE.md | NO | MISSING — run KRAVEN |
| BLOCKERS.md | NO | MISSING |
| DEFERRED.md | NO | MISSING |
| HISTORY_INDEX.md | NO | MISSING |

## Command Coverage

| Command | Status | Evidence Source |
|---|---|---|
| ARCHITECT | PARTIAL — extensive governance in _CANONICAL/logan/marvel/architect/VPORT/ (432 files); no full consolidated boundary audit at feature root level | CURRENT_STATUS + ARCHITECTURE.md |
| VENOM | COMPLETE — multiple passes (2026-05-10 to 2026-05-27): locksmith, dashboard, QR/menu/settings, feed DAL, profiles | SECURITY.md |
| ELEKTRA | COMPLETE — 2026-05-28: delete lifecycle, schedule card, exchange/profile | SECURITY.md |
| BLACKWIDOW | PARTIAL — 2026-05-23 (vport dashboard); 2026-05-27 (subscribers + content-pages + schedule/calendar) | SECURITY.md |
| SENTRY | COMPLETE — 2026-05-25, 2026-06-01: gas prices; barber/locksmith/barbershop gate | CURRENT_STATUS.md |
| IRONMAN | PARTIAL — various dashboard card ownership passes | CURRENT_STATUS.md |
| SPIDER-MAN | PARTIAL — BLOCKED: 7 CRITICAL + 7 HIGH missing regression tests; 17 CI tests intentionally failing (V-SUB-001/002/003) | CURRENT_STATUS.md |
| KRAVEN | PARTIAL — 2026-06-01 | CURRENT_STATUS.md |
| THOR | PARTIAL — 2026-05-28: content-pages + delete lifecycle gate; CAUTION status; locksmith NOT CLEARED | CURRENT_STATUS.md |
| CARNAGE | PARTIAL — multiple migration passes; content-pages RLS + delete cascade migrations pending | CURRENT_STATUS.md |
| DB | NOT RUN — no evidence found | |
| HAWKEYE | NOT RUN — no evidence found | |
| WATCHER | NOT RUN — no evidence found | |
| FALCON | NOT RUN — no evidence found | |
| WINTER SOLDIER | NOT RUN — no evidence found | |
| LOGAN | NOT RUN — no evidence found | |
| WOLVERINE | COMPLETE — TICKET-0004 (schedule), TICKET-0009 (settings security backfill) | CURRENT_STATUS.md |

## THOR Eligibility

**THOR_BLOCKED**

Based on security evidence found in SECURITY.md.

## Security Status

29 total findings (27 open, 13 resolved/accepted, 3 deferred). CRITICAL open: VD-01 (removeTeamMemberController — no ownership check), VD-02 (acceptTeamRequestController/declineTeamRequestController — no caller identity). HIGH open includes S-BLK-001 (locksmith 3 paths), ELEK-007/008 (menu delete), ELEK-009 (dual failure), VENOM-CONTENT-004 (DB-BLOCKED legacy RLS), VENOM-DELETE-002/003 (untracked RPCs + incomplete cascade), VD-03/04/05 (booking controllers). BEFORE RELEASE BLOCKER: S-BLK-001. THOR gate: CAUTION.

## Architecture Status

Full ARCHITECT governance exists at zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/ (432 files). No consolidated boundary audit at feature root level. Dashboard Architecture Contract created (TICKET-0004). Schedule + settings cards COMPLIANT post TICKET-0009. Locksmith write surface VIOLATION (S-BLK-001). Barbershop screens Final/View split violation (S-BLK-002). Locksmith controller model transforms inline in controller (S-BLK-003). Duplicate model utilities across locksmith + barbershop (S-BLK-004). Ownership primitive: assertActorOwnsVportActorController at apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js — used at 9+ call sites.

## Ownership Status

OWNERSHIP.md MISSING. Auth surface: OWNER. Ownership primitive: assertActorOwnsVportActorController (canonical, used at 9+ call sites). Three critical write paths on locksmith surface missing this gate (S-BLK-001). Menu delete controllers also missing gate (ELEK-007/008).

## Testing Status

TESTS.md MISSING. 0 tests found in base feature path. SPIDER-MAN BLOCKED — 7 CRITICAL + 7 HIGH missing regression tests flagged. 17 CI tests intentionally failing for subscriber ownership gates (V-SUB-001/002/003) pending controller fixes.

## Performance Status

PERFORMANCE.md MISSING. No performance evidence available in CURRENT governance files. KRAVEN ran partially 2026-06-01 but no performance findings documented in feature governance.

## Open Blockers

- S-BLK-001 — locksmith ctrlUpdateServiceArea/ctrlDeleteServiceArea/ctrlDeleteServiceDetail missing assertActorOwnsVportActorController — BEFORE RELEASE BLOCKER (HIGH, reconfirmed 2026-06-01)
- ELEK-009 — deleteVportServiceAddonController: dual failure — missing ownership gate AND referenced DAL file does not exist (runtime broken)
- V-SUB-001/002/003 — 17 tests intentionally failing in CI for ctrlSubscribe/ctrlUnsubscribe/ctrlListIncomingRequests
- TICKET-BOOKING-RPC-001 — customer_actor_id injection + status overpermission; DB-BLOCKED pending state-machine RPC migration
- VENOM-CONTENT-004 — former VPORT owners retain content_pages access via legacy RLS OR-merge; DB-BLOCKED pending CARNAGE migration
- SPIDER-MAN BLOCKED — 7 CRITICAL + 7 HIGH missing regression tests; VD-01 (removeTeamMemberController), VD-02 (acceptTeamRequestController/declineTeamRequestController) CRITICAL open with no tests

## Deferred Items

- VENOM-DELETE-002 — soft_delete_vport/hard_delete_vport/restore_vport RPCs not in tracked migrations (DR hazard)
- VENOM-DELETE-003 — incomplete hard_delete_vport cascade: vport.resources, portfolio_items, availability_exceptions, availability_rules, push_subscriptions orphaned
- Hardcoded PUBLIC_REALM_ID (2d6c267f-9c43-48e4-aa5e-e0a0274e9bc2) in gas price + menu system post controllers — must replace with resolvePublicRealmIdDAL() before Void Realm launch
- TICKET-FEED-CARDS-002 — add payload.vportKind discriminator for barbershop_portfolio_update (LOW)
- TICKET-PLATFORM-RLS-001 — platform.media_assets {public} policy cleanup (P1)
- VENOM-SETTINGS-004 — listMyVportsDAL uses owner_user_id instead of canonical actor_owners two-hop join (P2 CARNAGE rewrite)
- ELEK-002 — ctrlSetActorPrivacy: any actor can be forced private (deferred separate sprint)
- ELEK-004 — dalSetActorPrivacy: no auth.getUser() session binding (deferred separate sprint)

## Latest Ticket

TICKET-BOOKING-RPC-001 (OPEN/DB-BLOCKED), TICKET-PLATFORM-RLS-001 (OPEN), TICKET-FEED-CARDS-002 (OPEN LOW)

## Recommended Next Ticket

Open ticket for S-BLK-001 resolution — add assertActorOwnsVportActorController to ctrlUpdateServiceArea, ctrlDeleteServiceArea, ctrlDeleteServiceDetail in locksmithOwner.controller.js. Smallest, highest-impact action (BEFORE RELEASE BLOCKER). Then separate ticket for ELEK-009 (create missing DAL + ownership gate for deleteVportServiceAddonController) and V-SUB-001/002/003 (subscriber ownership gates to unblock 17 failing CI tests).

## Recommended Next Command

ARCHITECT — full OWNER surface boundary mapping across all VPORT sub-surfaces at feature root level. Then immediately resolve S-BLK-001 (add assertActorOwnsVportActorController to 3 locksmith write paths in locksmithOwner.controller.js — BEFORE RELEASE) and ELEK-009 (create missing DAL + add ownership gate to deleteVportServiceAddonController).

## DR. STRANGE Read Order

1. DR_STRANGE.md (this file)
2. CURRENT_STATUS.md - YES present
3. SECURITY.md - YES present
4. ARCHITECTURE.md - YES present
5. OWNERSHIP.md - MISSING
6. BLOCKERS.md - MISSING
7. DEFERRED.md - MISSING
8. HISTORY_INDEX.md - MISSING

---
*DR_STRANGE.md generated: 2026-06-02 | Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001 | Timestamp: 2026-06-02T05:30:00*

<!-- DRSTRANGE_COMMAND_MATRIX_START -->
## Command Coverage Matrix

Feature: vport
Applicable Commands: 17
Coverage Score: 9.0 / 17
Coverage %: 53%
Last Refresh: 2026-06-02 (TICKET-DRSTRANGE-MATRIX-REFRESH-0001)

| Command | Status | Last Run | Evidence | Next Action |
|---|---|---|---|---|
| ARCHITECT | COMPLETE | 2026-06-02 | CURRENT/features/vport/ARCHITECTURE.md | — |
| VENOM | COMPLETE | 2026-05-27 | CURRENT/features/vport/SECURITY.md (multiple passes: locksmith, dashboard, QR/menu/settings, feed DAL, profiles) | — |
| ELEKTRA | COMPLETE | 2026-05-28 | CURRENT/features/vport/SECURITY.md (ELEK-007, ELEK-008, ELEK-009 findings) | Resolve ELEK-009 (missing DAL + ownership gate) |
| BLACKWIDOW | COMPLETE | 2026-05-27 | CURRENT/features/vport/SECURITY.md (BW- prefixed findings; dashboard 2026-05-23, subscribers + content-pages + schedule/calendar 2026-05-27) | Resolve BW-VPD-002, BW-VPD-005 (MEDIUM open) |
| SENTRY | COMPLETE | 2026-06-01 | CURRENT/features/vport/SECURITY.md + CURRENT_STATUS.md (gas prices 2026-05-25; barber/locksmith/barbershop gate 2026-06-01) | — |
| IRONMAN | PARTIAL | 2026-05-28 | CURRENT_STATUS.md (various dashboard card ownership passes) | Create OWNERSHIP.md; run full IRONMAN pass |
| SPIDER-MAN | BLOCKED | NEVER | CURRENT_STATUS.md (7 CRITICAL + 7 HIGH missing regression tests; 17 CI tests intentionally failing: V-SUB-001/002/003) | Resolve S-BLK-001 + VD-01/VD-02 first; then run SPIDER-MAN |
| KRAVEN | PARTIAL | 2026-06-01 | CURRENT_STATUS.md (partial run noted; no PERFORMANCE.md produced) | Run full KRAVEN pass; create PERFORMANCE.md |
| THOR | PARTIAL | 2026-05-28 | CURRENT_STATUS.md (content-pages + delete lifecycle CAUTION gate; locksmith NOT CLEARED) | Resolve S-BLK-001 + ELEK-009; clear locksmith surface before next THOR |
| CARNAGE | PARTIAL | 2026-05-28 | CURRENT_STATUS.md (multiple migration passes; content-pages RLS + delete cascade migrations pending) | Run CARNAGE for VENOM-CONTENT-004 + VENOM-DELETE-003 migrations |
| DB | NOT RUN | NEVER | No evidence found | Run DB review on booking + content_pages surfaces |
| HAWKEYE | NOT RUN | NEVER | No evidence found | Schedule HAWKEYE for VPORT API endpoint contract verification |
| WATCHER | NOT RUN | NEVER | No evidence found | Schedule WATCHER pass |
| FALCON | NOT RUN | NEVER | No evidence found | Schedule FALCON iOS parity check |
| WINTER SOLDIER | N/A | — | No Android app | — |
| LOGAN | NOT RUN | NEVER | No evidence found | Run LOGAN after OWNERSHIP.md and TESTS.md are created |
| WOLVERINE | COMPLETE | 2026-06-01 | CURRENT_STATUS.md (TICKET-0004 COMPLETE, TICKET-0009 COMPLETE) | — |
| DR. STRANGE | PARTIAL | 2026-06-02 | This matrix refresh run | Matrix updated; full re-run pending |

## Command Coverage Summary

| Metric | Value |
|---|---|
| Applicable Commands | 17 |
| Complete | 6 |
| Partial | 6 |
| Not Run | 5 |
| Blocked | 0 |
| Coverage % | 53% |

## THOR Eligibility

- THOR Status: THOR_BLOCKED
- Blocking Reasons: S-BLK-001 (locksmith write paths missing ownership gate — BEFORE RELEASE BLOCKER); VD-01/VD-02 CRITICAL open findings; ELEK-009 dual failure (missing DAL + missing ownership gate); SPIDER-MAN BLOCKED with 7 CRITICAL + 7 HIGH missing tests and 17 CI tests intentionally failing; TICKET-BOOKING-RPC-001 DB-BLOCKED
- Caution Items: CARNAGE migrations pending (VENOM-CONTENT-004, VENOM-DELETE-003); BW-VPD-002/BW-VPD-005 MEDIUM open findings; KRAVEN partial (no PERFORMANCE.md)
- Required Before THOR: Resolve S-BLK-001; resolve ELEK-009; resolve VD-01/VD-02; unblock SPIDER-MAN (add subscriber ownership gates V-SUB-001/002/003); execute CARNAGE migrations; run full SPIDER-MAN pass
- Coverage %: 53%
- Last DR. STRANGE Refresh: 2026-06-02T00:00:00
- Category Key: vport
<!-- DRSTRANGE_COMMAND_MATRIX_END -->
