---
# DR. STRANGE ENTRY — AUTH

**Category Key:** auth
**Type:** FEATURE
**CURRENT Path:** features/auth
**Source Path:** apps/VCSM/src/features/auth/
**Last Updated:** 2026-06-02
**Ticket:** TICKET-DRSTRANGE-BACKFILL-P0-0001
**Timestamp:** 2026-06-02T12:18:46

**Area:** Auth
---

## Feature

Documents the full auth feature governance state for VCSM — session lifecycle, actor provisioning, login/recovery surfaces, and identity trust boundaries from public /auth/* routes through Supabase-backed AuthProvider.

## Status

ACTIVE
Security Tier: CRITICAL

## Governance Score

| Category | Score | Notes |
|---|---|---|
| Files Present | 40% | 4 of 10 required governance files found (README, CURRENT_STATUS, SECURITY, HISTORY_INDEX) |
| Security | 30% | SECURITY.md exists with 3 passes documented; 21 findings OPEN including 3 HIGH P0 with no tickets |
| Architecture | 50% | ARCHITECTURE.md exists; ARCHITECT completed 2026-06-02; DB/RLS and ownership risks remain |
| Ownership | 0% | OWNERSHIP.md MISSING — IRONMAN has not run |
| Testing | 0% | TESTS.md MISSING — SPIDER-MAN has not run; 1 test file found in runtime index |
| Performance | 0% | PERFORMANCE.md MISSING — KRAVEN has not run against auth specifically |
| **DR. STRANGE Readiness** | **12%** | |

## Documentation Coverage

| File | Exists | Summary |
|---|---|---|
| README.md | ✓ | Exists — content not fully summarized in evidence |
| CURRENT_STATUS.md | ✓ | Last updated 2026-05-23; auth ACTIVE, CRITICAL security tier; VENOM and SENTRY COMPLETE; 3 HIGH P0 findings open with no tickets |
| SECURITY.md | ✓ | Three VENOM passes + one SENTRY pass; 21 open findings ranging HIGH P0 to MEDIUM P1; 5 DB RLS tasks unstarted |
| ARCHITECTURE.md | ✓ | Created by TICKET-ARCHITECT-PROPAGATION-SYNC-0001 from TICKET-AUTH-ARCHITECT-0001 |
| OWNERSHIP.md | ✗ | MISSING — IRONMAN has not run |
| TESTS.md | ✗ | MISSING — SPIDER-MAN has not run |
| PERFORMANCE.md | ✗ | MISSING — KRAVEN has not run against auth |
| BLOCKERS.md | ✗ | MISSING — blockers reconstructible only from CURRENT_STATUS.md and SECURITY.md |
| DEFERRED.md | ✗ | MISSING — no formal deferred registry; VENOM-AUTH-004/005/007/008 noted OPEN in source reports |
| HISTORY_INDEX.md | ✓ | Lists 4 audit source files; confirms no IRONMAN, CARNAGE, DB, LOKI, or SPIDER-MAN audit files exist as of 2026-06-02 |

## Command Coverage

| Command | Status | Evidence Source |
|---|---|---|
| ARCHITECT | COMPLETE | ARCHITECTURE.md, HISTORY_INDEX.md |
| VENOM | COMPLETE | 2026-05-11_venom_auth-login-trust-boundaries.md, 2026-05-14_venom_auth-login-full-surface.md, 2026-05-23_14-00_venom_login-recovery-surface.md |
| ELEKTRA | PARTIAL | 2026-05-28_elektra_barber.md |
| BLACKWIDOW | PARTIAL | 2026-05-23_blackwidow_login-screen.md |
| SENTRY | COMPLETE | 2026-05-11_sentry_auth-login-wolverine-fixes.md |
| IRONMAN | NOT RUN | none found |
| SPIDER-MAN | NOT RUN | none found |
| KRAVEN | NOT RUN | none found |
| THOR | NOT RUN | none found |
| CARNAGE | NOT RUN | none found |
| DB | NOT RUN | none found |
| HAWKEYE | NOT RUN | none found |
| WATCHER | NOT RUN | none found |
| FALCON | NOT RUN | none found |
| WINTER SOLDIER | NOT RUN | none found |
| LOGAN | NOT RUN | none found |
| WOLVERINE | COMPLETE | CURRENT_STATUS.md references Wolverine fixes; 2026-05-11_sentry_auth-login-wolverine-fixes.md |

## THOR Eligibility

**THOR_BLOCKED**

Three HIGH P0 findings remain unresolved and untracked (booking source bypass, dev diagnostics write exposure, client-controlled booking fields). THOR cannot be cleared while P0 security findings have no dedicated tickets and DB RLS verification has not started.

## Security Status

SECURITY.md documents three VENOM passes (2026-05-11, 2026-05-14, 2026-05-23) and one SENTRY pass. 21 findings are currently OPEN ranging from HIGH P0 (booking source bypass, dev diagnostics exposure, client-controlled booking data) to MEDIUM P1 (raw session tokens in AuthContext, assertActorOwnsVportActor self-check bypass, AuthProvider DAL bypass, T6-T35 identity gap, window.__sb exposure). Five DB RLS verification tasks remain unstarted for public.profiles, vc.actor_owners, vc.actors, vc.bookings, and diagnostics DAL reads.

## Architecture Status

ARCHITECTURE.md exists and records the completed 2026-06-02 ARCHITECT audit. Architecture is structurally complete: 14 controllers, 11 DALs, 9 hooks, 5 models, 9 screens covering the full session lifecycle from public /auth/* routes through actor provisioning. AuthProvider uses Supabase React Context; DAL layer provides canonical dalGetAuthSession(). DB/RLS verification and actor provisioning authority remain unresolved.

## Ownership Status

MISSING — no OWNERSHIP.md exists. IRONMAN has not run. Partial evidence from VENOM-2026-05-14-002 flags dev diagnostics screen ownership as unresolved (accessible to all authenticated users). No formal owner assignment documented.

## Testing Status

MISSING — no TESTS.md exists. SPIDER-MAN has not run. Runtime index identifies 1 test file (authCallback.controller.test.js). VENOM-2026-05-14-010 calls for a regression test covering hashType recovery gate — not yet created.

## Performance Status

MISSING — no PERFORMANCE.md exists. KRAVEN has not run against auth specifically. The T6-T35 identity gap (200-1500ms window) noted in VENOM-2026-05-14-007 is the only performance-relevant finding documented.

## Open Blockers

- Booking source bypass — unknown source values in createBookingController skip all authorization (HIGH P0, OPEN, no ticket)
- Dev diagnostics screen accessible to all authenticated users with real DB write capability — block/unblock, UPSERT to vc.actor_follows/vc.friend_ranks (HIGH P0, OPEN, no ticket)
- Client-controlled booking data — durationMinutes, serviceLabelSnapshot, internalNote, customerPhone, customerEmail trusted from caller without server-side validation (HIGH P0, OPEN, no ticket)
- Raw session tokens (access_token, refresh_token) exposed in AuthContext via useAuth() (HIGH P2, OPEN)
- ActorModel exposes profileId as public field — identity contract violation (HIGH P1, OPEN)
- DB RLS verification not started for public.profiles, vc.actor_owners, vc.actors, vc.bookings, diagnostics DAL reads

## Deferred Items

- VENOM-AUTH-004 — OPEN, lower priority, full detail in 2026-05-23 source report (not fully read)
- VENOM-AUTH-005 — OPEN, lower priority, full detail in 2026-05-23 source report (not fully read)
- VENOM-AUTH-007 — OPEN, lower priority, full detail in 2026-05-23 source report (not fully read)
- VENOM-AUTH-008 — OPEN, lower priority, full detail in 2026-05-23 source report (not fully read)

## Latest Ticket

ELEK-2026-05-28-026, ELEK-2026-05-28-027, ELEK-2026-05-28-028

## Recommended Next Ticket

TICKET-AUTH-P0-001 — Open a P0 ticket to resolve the three untracked HIGH blockers: (1) booking source bypass in createBookingController, (2) gate dev diagnostics screen to admin role, (3) harden client-controlled booking fields. These are the only P0 findings in the entire platform with no dedicated ticket.

## Recommended Next Command

DB — verify RLS on public.profiles (discoverable write), vc.actor_owners (insert policy), vc.actors (read policy), vc.bookings (ownership enforcement). This is the prerequisite to closing the P0 booking source bypass and actorOwnerCreate unguarded callers. Follow with CARNAGE for booking schema constraints.

## DR. STRANGE Read Order

1. DR_STRANGE.md (this file)
2. CURRENT_STATUS.md
3. SECURITY.md
4. HISTORY_INDEX.md
5. README.md
6. vcsm.runtime.authority-matrix.md
7. vcsm.identity.login-pipeline-trace.md
8. vcsm.dal.auth.md
9. 2026-05-23_14-00_venom_login-recovery-surface.md
10. 2026-05-14_venom_auth-login-full-surface.md
11. 2026-05-11_venom_auth-login-trust-boundaries.md
12. 2026-05-28_elektra_barber.md
13. 2026-05-23_blackwidow_login-screen.md

*Files marked MISSING above do not yet exist — DR. STRANGE will flag them as governance gaps.*

---
*DR_STRANGE.md generated: 2026-06-02 | Ticket: TICKET-DRSTRANGE-BACKFILL-P0-0001 | Timestamp: 2026-06-02T05:00:00*
---

<!-- DRSTRANGE_COMMAND_MATRIX_START -->
## Command Coverage Matrix

Feature: auth
Applicable Commands: 17
Coverage Score: 5.5 / 17
Coverage %: 32%
Last Refresh: 2026-06-02 (TICKET-DRSTRANGE-MATRIX-REFRESH-0001)

| Command | Status | Last Run | Evidence | Next Action |
|---|---|---|---|---|
| ARCHITECT | COMPLETE | 2026-06-02 | CURRENT/features/auth/ARCHITECTURE.md | — |
| VENOM | COMPLETE | 2026-05-23 | SECURITY.md — 3 passes: 2026-05-11, 2026-05-14, 2026-05-23 | — |
| ELEKTRA | PARTIAL | 2026-05-28 | features/auth evidence: 2026-05-28_elektra_barber.md | Run full auth-scoped ELEKTRA pass; barber pass covers partial auth surface only |
| BLACKWIDOW | PARTIAL | 2026-05-23 | features/auth evidence: 2026-05-23_blackwidow_login-screen.md (BW-LOGIN-001/-002/-003) | Full adversarial runtime pass not completed; run scoped auth BLACKWIDOW |
| SENTRY | COMPLETE | 2026-05-11 | features/auth evidence: 2026-05-11_sentry_auth-login-wolverine-fixes.md | — |
| IRONMAN | NOT RUN | NEVER | OWNERSHIP.md MISSING | Run IRONMAN to assign ownership; dev diagnostics owner unresolved (VENOM-2026-05-14-002) |
| SPIDER-MAN | NOT RUN | NEVER | TESTS.md MISSING | Run SPIDER-MAN; 1 test file found; hashType recovery regression test required (VENOM-2026-05-14-010) |
| KRAVEN | NOT RUN | NEVER | PERFORMANCE.md MISSING | Run KRAVEN; T6-T35 identity gap (200-1500ms) is only documented perf risk |
| THOR | NOT RUN | NEVER | No gate evidence found | THOR_BLOCKED — 3 HIGH P0 findings with no tickets must be resolved first |
| CARNAGE | NOT RUN | NEVER | No migration evidence found | Run CARNAGE after DB RLS verification; booking schema constraints needed |
| DB | NOT RUN | NEVER | RLS unverified for public.profiles, vc.actor_owners, vc.actors, vc.bookings | Run DB before CARNAGE; prerequisite to closing P0 booking source bypass |
| HAWKEYE | NOT RUN | NEVER | No endpoint audit evidence found | Schedule HAWKEYE for /auth/* route contract verification |
| WATCHER | NOT RUN | NEVER | No provenance evidence found | Run WATCHER after next significant change sprint |
| FALCON | NOT RUN | NEVER | No PWA/native parity evidence found | Schedule FALCON for auth flow parity review |
| WINTER SOLDIER | N/A | — | No Android app | — |
| LOGAN | NOT RUN | NEVER | README.md exists; no formal Logan audit | Run LOGAN; ActorModel docs and authOps.controller caller audit needed |
| WOLVERINE | COMPLETE | 2026-05-11 | CURRENT_STATUS.md + 2026-05-11_sentry_auth-login-wolverine-fixes.md | — |
| DR. STRANGE | PARTIAL | 2026-06-02 | This matrix refresh run | Matrix updated; full re-run pending |

## Command Coverage Summary

| Metric | Value |
|---|---|
| Applicable Commands | 17 |
| Complete | 4 |
| Partial | 3 |
| Not Run | 10 |
| Blocked | 0 |
| Coverage % | 32% |

## THOR Eligibility

- THOR Status: THOR_BLOCKED
- Blocking Reasons: 3 HIGH P0 findings open with no dedicated tickets (booking source bypass in createBookingController, dev diagnostics screen accessible to all authenticated users, client-controlled booking fields); DB RLS verification not started for public.profiles, vc.actor_owners, vc.actors, vc.bookings
- Caution Items: ELEKTRA and BLACKWIDOW are PARTIAL only; IRONMAN NOT RUN (dev diagnostics ownership unresolved); SPIDER-MAN NOT RUN (no regression test for hashType recovery gate)
- Required Before THOR: Open TICKET-AUTH-P0-001 for the 3 untracked HIGH P0 findings; run DB to verify RLS; resolve P0 findings; run IRONMAN and SPIDER-MAN
- Coverage %: 32%
- Last DR. STRANGE Refresh: 2026-06-02T00:00:00
- Category Key: auth
<!-- DRSTRANGE_COMMAND_MATRIX_END -->
