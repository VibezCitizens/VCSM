---
# DR. STRANGE ENTRY — SOCIAL

**Category Key:** social
**Type:** FEATURE
**CURRENT Path:** features/social
**Source Path:** apps/VCSM/src/features/social/
**Last Updated:** 2026-06-02
**Ticket:** TICKET-DRSTRANGE-BACKFILL-P1-0001
**Timestamp:** 2026-06-02T12:18:46

**Area:** Social
---

## Feature

Location: CURRENT/features/social
Source Path: apps/VCSM/src/features/social/
Coverage Score: 6/10
Missing: ARCHITECTURE.md, TESTS.md, BLOCKERS.md, DEFERRED.md

Active Risks: ELEK-2026-05-27-002 (HIGH OPEN), Privacy DAL split (MAJOR DRIFT), 3 DB unknowns, Phase 0 migration READY TO APPLY, 17 tests CI BLOCKED

## Status

ACTIVE
Security Tier: MEDIUM

## Governance Score

| Category | Score | Notes |
|---|---|---|
| Files Present | 6/10 | README, CURRENT_STATUS, SECURITY, OWNERSHIP, PERFORMANCE, HISTORY_INDEX present; ARCHITECTURE, TESTS, BLOCKERS, DEFERRED missing |
| Security | PARTIAL | SECURITY.md present; 2 HIGH OPEN findings |
| Architecture | PARTIAL | ARCHITECTURE.md missing; SENTRY MAJOR DRIFT documented |
| Ownership | PARTIAL | ownership.md present; owner TBD — IRONMAN not run |
| Testing | PARTIAL | 3 test files present; SPIDER-MAN formal pass not run |
| Performance | PARTIAL | performance.md present; KRAVEN not started |
| **DR. STRANGE Readiness** | **6/10** | Based on files present |

## Documentation Coverage

| File | Exists | Summary |
|---|---|---|
| README.md | YES | Present |
| CURRENT_STATUS.md | YES | Present |
| SECURITY.md | YES | Present |
| ARCHITECTURE.md | NO | MISSING — run ARCHITECT |
| ownership.md | YES | Present — owner TBD |
| TESTS.md | NO | MISSING — run SPIDER-MAN |
| performance.md | YES | Present |
| BLOCKERS.md | NO | MISSING |
| DEFERRED.md | NO | MISSING |
| HISTORY_INDEX.md | YES | Present — 5 entries |
| findings.md | YES | Present |

## Command Coverage

| Command | Status | Evidence Source |
|---|---|---|
| ARCHITECT | NOT RUN | No evidence found |
| VENOM | COMPLETE — 2026-05-27 (V-SUB-001 through V-SUB-008; V-SUB-001–007 resolved; V-SUB-008 OPEN HIGH) | 2026-05-27_00-00_sentry_subscriber-follow-architecture.md |
| ELEKTRA | COMPLETE — 2026-05-27 (2 HIGH, 2 MEDIUM, 2 LOW findings) | 2026-05-27_00-00_elektra_subscriber-follow-architecture.md |
| BLACKWIDOW | PARTIAL — 2026-05-27 (BW-SUB-003 OPEN HIGH; BW-SUB-004 resolved) | 2026-05-27_19-00_blackwidow_subscribers.md |
| SENTRY | COMPLETE — 2026-05-27 (MAJOR DRIFT: privacy DAL split + naming collision) | 2026-05-27_00-00_sentry_subscriber-follow-architecture.md |
| IRONMAN | NOT RUN | No evidence found |
| SPIDER-MAN | PARTIAL — 2026-05-27 (test file present: spiderman_vport-subscribers-tests.md; 17 tests intentionally failing in CI) | 2026-05-27_11-31_spiderman_vport-subscribers-tests.md |
| KRAVEN | NOT RUN | No evidence found |
| THOR | NOT RUN | No evidence found |
| CARNAGE | NOT RUN — V-SUB-008 migration sprint required | No evidence found |
| DB | PARTIAL — 2026-05-27 (count_subscribers + list_subscribers confirmed SECDEF; get_follower_count, actor_privacy_settings RLS, social_follow_requests RLS all UNKNOWN) | 2026-05-27_00-01_db_subscriber-follow-architecture.md |
| HAWKEYE | NOT RUN | No evidence found |
| WATCHER | NOT RUN | No evidence found |
| FALCON | COMPLETE — 2026-05-27 (BLOCKED — no native app; PWA blueprint documented) | 2026-05-27_00-00_falcon_subscriber-follow-architecture.md |
| WINTER SOLDIER | NOT RUN | No evidence found |
| LOGAN | NOT RUN | No evidence found |
| WOLVERINE | NOT RUN | No evidence found |

## THOR Eligibility

**THOR_BLOCKED**

Based on security evidence found in SECURITY.md.

## Security Status

ELEKTRA 2026-05-27: 2 HIGH | 2 MEDIUM | 2 LOW. ELEK-001 (HIGH OPEN): list_subscribers/count_subscribers SECURITY DEFINER — private subscriber enumeration via direct REST. ELEK-002 (HIGH — BW-SUB-004 resolved 2026-05-29): ctrlSetActorPrivacy ownership gate added. ELEK-003 (MEDIUM OPEN): ctrlSubscribe no actor-kind guard — VPORT can follow Citizens. ELEK-004 (MEDIUM OPEN): raw actor UUID in notification sender routes. ELEK-005/006 LOW OPEN. VENOM: V-SUB-001–007 resolved; V-SUB-008 HIGH OPEN (vc.get_follower_count missing in live DB). BW-SUB-003 HIGH OPEN: actor-kind follow bypass — governance rule required before code enforcement.

## Architecture Status

No dedicated routes or screens. Social surfaces embedded in profiles, feed, notifications. 10 controllers (follow, unfollow, follow requests, privacy, subscriber reads), 7 DALs, 19 hooks, 2 models, 4 components. SENTRY MAJOR DRIFT: privacy DAL split — actorPrivacy.dal.js lives in social feature but belongs in dedicated privacy module. DAL naming collision: dalCountSubscribers exported from two files with conflicting RPC targets. ARCHITECT formal pass NOT RUN.

## Ownership Status

UNKNOWN — IRONMAN has not run. ownership.md states feature owner TBD. IRONMAN required before ARCHITECT audit can begin.

## Testing Status

PARTIAL — 3 test files present (followRequests.controller.test.js, follow.controller.test.js, unsubscribe.controller.test.js). 17 tests intentionally failing in CI for subscriber ownership gates (V-SUB-001/002/003) — will go green when gates added under vport feature. SPIDER-MAN formal coverage audit not yet run as a dedicated pass.

## Performance Status

KRAVEN NOT STARTED. performance.md notes subscriber queries are expected high-volume fan-out reads. Cache strategy must be designed before KRAVEN runs. Known gap: follow.controller.js does not call invalidateSubscriberCount after follow — VPORT subscriber count retains stale cache for up to 60 seconds post-follow.

## Open Blockers

- V-SUB-008 HIGH OPEN — vc.get_follower_count RPC missing in live DB; follower count always 0 for user-kind actors; CARNAGE sprint required
- BW-SUB-003 HIGH OPEN — VPORT actor-kind follow bypass; governance rule required before code can enforce
- ELEK-2026-05-27-001 HIGH OPEN — list_subscribers/count_subscribers SECURITY DEFINER enables private subscriber enumeration via direct REST; Phase 0 migration 20260527060000 must be applied
- ELEK-2026-05-27-003 MEDIUM OPEN — ctrlSubscribe no actor-kind guard; VPORT can follow Citizens and gain read access to private posts
- ELEK-2026-05-27-004 MEDIUM OPEN — raw actor UUID in notification sender routes; enables actor ID enumeration
- 3 DB unknowns blocking Phase 1 (vc.get_follower_count security context, vc.actor_privacy_settings RLS, vc.social_follow_requests RLS)
- 17 tests intentionally failing in CI (V-SUB-001/002/003 ownership gate tests)

## Deferred Items

- Phase 1-3 migration pipeline — pending Phase 0 application and DB verifications
- Privacy DAL split (MAJOR DRIFT — SENTRY) — no sprint assigned, requires ARCHITECT + IRONMAN + WOLVERINE sequencing
- ARCHITECT formal pass — not started
- IRONMAN ownership mapping — not started
- KRAVEN performance audit — cache strategy must be designed first
- Actor-kind guard on ctrlSubscribe (ELEK-003) — TICKET-SUB-005
- TESTS.md — not created
- BLOCKERS.md — not created
- DEFERRED.md — not created
- ARCHITECTURE.md — not created

## Latest Ticket

TICKET-SUB-008 (dalListOutgoingRequests controller wrapper), TICKET-SUB-006 (DAL naming collision), TICKET-SEC-VERIFY-001 (source verification pass 2026-05-30)

## Recommended Next Ticket

Open CARNAGE migration sprint for vc.get_follower_count RPC (V-SUB-008 HIGH) — follower count is broken for all user-kind actors. Then apply Phase 0 migration 20260527060000 (unblocks Phase 1/2/3 subscriber RPC pipeline). Then open TICKET for BW-SUB-003 governance rule definition (actor-kind follow restriction).

## Recommended Next Command

DB — verify vc.get_follower_count security context, vc.actor_privacy_settings RLS, vc.social_follow_requests RLS. These three DB unknowns are blocking Phase 1 RPC creation. After DB: open CARNAGE sprint for vc.get_follower_count RPC creation (V-SUB-008), apply Phase 0 migration 20260527060000, then BLACKWIDOW full adversarial pass.

## DR. STRANGE Read Order

1. DR_STRANGE.md (this file)
2. CURRENT_STATUS.md — present
3. SECURITY.md — present
4. findings.md — present
5. HISTORY_INDEX.md — present
6. ownership.md — present (owner TBD)
7. performance.md — present
8. ARCHITECTURE.md — MISSING — run ARCHITECT
9. TESTS.md — MISSING — run SPIDER-MAN
10. BLOCKERS.md — MISSING
11. DEFERRED.md — MISSING

---
*DR_STRANGE.md generated: 2026-06-02 | Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001 | Timestamp: 2026-06-02T05:30:00*
---

<!-- DRSTRANGE_COMMAND_MATRIX_START -->
## Command Coverage Matrix

Feature: social
Applicable Commands: 17
Coverage Score: 7.0 / 17
Coverage %: 41%
Last Refresh: 2026-06-02 (TICKET-DRSTRANGE-MATRIX-REFRESH-0001)

| Command | Status | Last Run | Evidence | Next Action |
|---|---|---|---|---|
| ARCHITECT | COMPLETE | 2026-06-02 | CURRENT/features/social/ARCHITECTURE.md | — |
| VENOM | COMPLETE | 2026-05-27 | CURRENT/features/social/SECURITY.md; HISTORY_INDEX: 2026-05-10 + 2026-05-27 | V-SUB-008 HIGH OPEN — run CARNAGE for vc.get_follower_count RPC |
| ELEKTRA | COMPLETE | 2026-05-27 | 2026-05-27_00-00_elektra_subscriber-follow-architecture.md | ELEK-001 HIGH + ELEK-002 HIGH OPEN — RELEASE BLOCKERS |
| BLACKWIDOW | PARTIAL | 2026-05-27 | 2026-05-27_19-00_blackwidow_subscribers.md | BW-SUB-003 HIGH OPEN — actor-kind follow bypass; governance rule required |
| SENTRY | COMPLETE | 2026-05-27 | 2026-05-27_00-00_sentry_subscriber-follow-architecture.md | MAJOR DRIFT: privacy DAL split — open sprint required |
| IRONMAN | NOT RUN | NEVER | ownership.md present but owner TBD; no formal IRONMAN pass | Run IRONMAN to assign owner and produce canonical OWNERSHIP.md |
| SPIDER-MAN | PARTIAL | 2026-05-27 | 2026-05-27_11-31_spiderman_vport-subscribers-tests.md | 17 tests CI-blocked; formal coverage audit not complete |
| KRAVEN | NOT RUN | NEVER | No evidence found | Run KRAVEN — cache strategy must be designed first |
| THOR | NOT RUN | NEVER | No evidence found | THOR_BLOCKED — ELEK-001/002 HIGH open; V-SUB-008 HIGH open |
| CARNAGE | NOT RUN | NEVER | V-SUB-008 migration sprint required | Run CARNAGE — vc.get_follower_count RPC creation + Phase 0 migration 20260527060000 |
| DB | PARTIAL | 2026-05-27 | 2026-05-27_00-01_db_subscriber-follow-architecture.md | vc.get_follower_count security context, vc.actor_privacy_settings RLS, vc.social_follow_requests RLS all UNKNOWN |
| HAWKEYE | NOT RUN | NEVER | No evidence found | Run HAWKEYE |
| WATCHER | NOT RUN | NEVER | No evidence found | Run WATCHER |
| FALCON | COMPLETE | 2026-05-27 | 2026-05-27_00-00_falcon_subscriber-follow-architecture.md | BLOCKED — no native app; PWA blueprint documented |
| WINTER SOLDIER | N/A | — | No Android app | — |
| LOGAN | NOT RUN | NEVER | No evidence found | Run LOGAN |
| WOLVERINE | NOT RUN | NEVER | No evidence found | Run WOLVERINE |
| DR. STRANGE | PARTIAL | 2026-06-02 | This matrix refresh run | Matrix updated; full re-run pending |

## Command Coverage Summary

| Metric | Value |
|---|---|
| Applicable Commands | 17 |
| Complete | 5 |
| Partial | 4 |
| Not Run | 8 |
| Blocked | 0 |
| Coverage % | 41% |

## THOR Eligibility

- THOR Status: THOR_BLOCKED
- Blocking Reasons: ELEK-2026-05-27-001 HIGH OPEN (RELEASE BLOCKER — list_subscribers/count_subscribers SECURITY DEFINER); ELEK-2026-05-27-002 HIGH OPEN (RELEASE BLOCKER — ctrlSetActorPrivacy no ownership gate); V-SUB-008 HIGH OPEN (vc.get_follower_count missing in live DB); BW-SUB-003 HIGH OPEN (actor-kind follow bypass); WOLVERINE NOT RUN
- Caution Items: ELEK-003 MEDIUM (ctrlSubscribe no actor-kind guard); ELEK-004 MEDIUM (raw UUID in notification routes); BW partial — formal full pass not complete; SPIDER-MAN partial — 17 tests CI-blocked; KRAVEN NOT RUN; 3 DB unknowns blocking Phase 1
- Required Before THOR: Apply Phase 0 migration 20260527060000; CARNAGE for vc.get_follower_count RPC; resolve ELEK-001/002; define BW-SUB-003 governance rule; WOLVERINE; IRONMAN
- Coverage %: 41%
- Last DR. STRANGE Refresh: 2026-06-02T00:00:00
- Category Key: social
<!-- DRSTRANGE_COMMAND_MATRIX_END -->
