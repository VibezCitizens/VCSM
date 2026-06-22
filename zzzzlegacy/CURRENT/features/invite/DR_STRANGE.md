---
# DR. STRANGE ENTRY — INVITE

**Category Key:** invite
**Type:** FEATURE
**CURRENT Path:** features/invite
**Source Path:** apps/VCSM/src/features/invite/
**Last Updated:** 2026-06-02
**Ticket:** TICKET-DRSTRANGE-BACKFILL-P1-0001
**Timestamp:** 2026-06-02T12:18:46

**Area:** Invite
---

## Feature

Coverage Score: 6/10. Active risks: BLOCK-INVITE-001 (THOR BLOCKER — createBarberVportAndAccept missing ownership assertion post-VPORT creation), BLOCK-INVITE-002 (THOR BLOCKER — standalone features/invite/ module zero audit coverage), BLOCK-INVITE-003 (DB-BLOCKED — O(n) user table fetch email enumeration oracle), BLOCK-INVITE-004 (wildcard CORS on all 5 edge functions), BLOCK-INVITE-005 (banned owner_user_id identity surface). Latest tickets: ELEK-2026-05-28-025, ELEK-2026-05-28-026. Recommended next: VENOM + ELEKTRA on standalone features/invite/ module.

## Status

ACTIVE — THOR BLOCKED
Security Tier: HIGH

## Governance Score

| Category | Score | Notes |
|---|---|---|
| Files Present | 6/10 | README (YES), CURRENT_STATUS (YES), SECURITY (YES), ARCHITECTURE (YES), OWNERSHIP (YES — lowercase ownership.md), TESTS (MISSING), PERFORMANCE (YES — lowercase performance.md), BLOCKERS (MISSING), DEFERRED (MISSING), HISTORY_INDEX (MISSING) |
| Security | PARTIAL | SECURITY.md present; standalone module NEVER audited |
| Architecture | PARTIAL | ARCHITECTURE.md present; standalone module NOT_AUDITED |
| Ownership | PARTIAL | ownership.md present (lowercase); IRONMAN not run on standalone module |
| Testing | 0% | SPIDER-MAN not run; zero test coverage confirmed |
| Performance | PARTIAL | performance.md present (stub only); KRAVEN not run on standalone module |
| **DR. STRANGE Readiness** | **6/10** | Based on files present; TESTS.md, BLOCKERS.md, DEFERRED.md, HISTORY_INDEX.md missing |

## Documentation Coverage

| File | Exists | Summary |
|---|---|---|
| README.md | YES | Present |
| CURRENT_STATUS.md | YES | Present |
| SECURITY.md | YES | Present |
| ARCHITECTURE.md | YES | Present |
| ownership.md | YES | Present (lowercase) |
| TESTS.md | MISSING | Run SPIDER-MAN |
| performance.md | YES | Present (stub only) |
| BLOCKERS.md | MISSING | Not created |
| DEFERRED.md | MISSING | Not created |
| HISTORY_INDEX.md | MISSING | Not created |

## Command Coverage

| Command | Status | Evidence Source |
|---|---|---|
| ARCHITECT | PARTIAL — standalone features/invite/ module NOT_AUDITED; join/dashboard paths partially mapped | CURRENT_STATUS.md |
| VENOM | PARTIAL — join path, team card, external site audited (2026-05-27); standalone features/invite/ module NOT RUN | SECURITY.md |
| ELEKTRA | PARTIAL — barber patch advisory, team card, external site, barber join/create-VPORT path audited (2026-05-28); standalone module NOT RUN | SECURITY.md |
| BLACKWIDOW | PARTIAL — vport-dashboard-team-card retest only (2026-05-27); standalone NOT RUN | SECURITY.md |
| SENTRY | PARTIAL — join-barbershop-route-registration compliance only (2026-05-18) | CURRENT_STATUS.md |
| IRONMAN | PARTIAL — dashboard-team-booking-ownership mapped (2026-05-18); standalone NOT covered | ownership.md |
| SPIDER-MAN | NOT RUN | No evidence found |
| KRAVEN | PARTIAL — barber-locksmith-barbershop-profile run (2026-06-01); invite classified low risk/one-shot | performance.md |
| THOR | BLOCKED — BLOCK-INVITE-001 (missing ownership gate) + BLOCK-INVITE-002 (zero audit on standalone module) | CURRENT_STATUS.md |
| CARNAGE | NOT RUN | No evidence found |
| DB | NOT RUN | No evidence found |
| HAWKEYE | NOT RUN | No evidence found |
| WATCHER | NOT RUN | No evidence found |
| FALCON | N/A | Not applicable |
| WINTER SOLDIER | NOT RUN | No evidence found |
| LOGAN | NOT RUN | No evidence found |
| WOLVERINE | NOT RUN | No evidence found |

## THOR Eligibility

**THOR_BLOCKED**

BLOCK-INVITE-001: createBarberVportAndAccept calls acceptJoinResourceDAL without ownership assertion after VPORT creation — explicit THOR BLOCKER.
BLOCK-INVITE-002: Standalone features/invite/ module has never received a security audit — explicit THOR BLOCKER.

## Security Status

8 open findings: ELEK-2026-05-28-025 (HIGH — createBarberVportAndAccept missing assertActorOwnsVportActorController — THOR BLOCKER), ELEK-2026-05-28-026 (MEDIUM — autoResumeInviteOnboarding no ownership assertion), ELEK-2026-05-27-005 (HIGH DB-BLOCKED — O(n) listUsers() email enumeration oracle), ELEK-2026-05-27-006 (MEDIUM — raw PostgreSQL error message leak), ELEK-TEAM-005 (LOW — acceptTeamRequestDAL missing atomic state guard), WILDCARD-CORS (HIGH — all 5 edge functions), DEAD-IMPORT (LOW — useJoinBarbershop.js double import), standalone module ZERO AUDIT (CRITICAL GAP). 7 resolved: F-06, F-12, VD-02, VD-09, ELEK-001, ELEK-002, BW-TEAM-004a. TERMS-OF-SERVICE status unclear (conflicting evidence).

## Architecture Status

Four distinct surfaces: (1) Standalone issuance module — features/invite/ (invite.controller.js, invite.dal.js, useInvite.js, InviteScreen.jsx, InviteView.jsx, InviteView.styles.js) — recently refactored from auth-based to product-based invites, controller/DAL may be stale; (2) Join/acceptance path — features/join/ sharing joinInvite.dal.js; (3) Dashboard team invite — features/dashboard/vport/; (4) Edge function — supabase/functions/send-citizen-invite/. Known boundary issues: no public adapter on features/invite/, joinInvite.dal.js shared across feature boundaries, findEligibleBarberActorIdsDAL uses banned legacy profiles.owner_user_id identity surface. DB tables: vport.resources (primary invite state), vc.vibe_invites (citizen invites).

## Ownership Status

Feature owner: VPORT onboarding team. Source: apps/VCSM/src/features/invite/. VPORT Kinds: BARBERSHOP (primary). IRONMAN audit NOT YET RUN on standalone module — ownership map is PARTIAL. Dashboard team path partially mapped (2026-05-18).

## Testing Status

TESTS.md: MISSING. SPIDER-MAN: NEVER RUN. Tests count: 0 found in source inventory. Zero test coverage confirmed across all invite surfaces.

## Performance Status

KRAVEN status: NOT_STARTED on standalone invite module. KRAVEN ran on barber-locksmith-barbershop-profile (2026-06-01) and classified invite as low risk / one-shot operation. No N+1 analysis performed. performance.md file exists but contains only a stub. Invite issuance and acceptance are low-frequency operations — not expected to be a performance concern per KRAVEN preliminary assessment.

## Open Blockers

- BLOCK-INVITE-001 (HIGH, THOR BLOCKER) — createBarberVportAndAccept calls acceptJoinResourceDAL without ownership assertion after VPORT creation. Fix: add assertActorOwnsVportActorController before acceptJoinResourceDAL.
- BLOCK-INVITE-002 (THOR BLOCKER) — Standalone features/invite/ module has NEVER received a security audit. Released to production with zero VENOM/ELEKTRA/BLACKWIDOW coverage.
- BLOCK-INVITE-003 (HIGH, DB-BLOCKED) — send-citizen-invite edge function calls adminClient.auth.admin.listUsers() O(n) full user table fetch — email enumeration oracle. Requires SECURITY DEFINER RPC (DB-level change).
- BLOCK-INVITE-004 (HIGH, OPEN) — Wildcard CORS on send-citizen-invite and all 5 edge functions — any origin can trigger invite write surfaces.
- BLOCK-INVITE-005 (ARCH VIOLATION) — findEligibleBarberActorIdsDAL queries via banned profiles.owner_user_id legacy identity surface. ARCHITECT/IRONMAN handoff pending.

## Deferred Items

- BLOCK-INVITE-003 — SECURITY DEFINER RPC for send-citizen-invite user lookup; deferred pending DB migration sprint.
- BLOCK-INVITE-005 — findEligibleBarberActorIdsDAL banned owner_user_id surface; deferred pending ARCHITECT/IRONMAN handoff. Not yet ticketed.

## Latest Ticket

ELEK-2026-05-28-025 and ELEK-2026-05-28-026 (2026-05-28 ELEKTRA barber audit). No formal TICKET-XXXX is assigned to the invite feature.

## Recommended Next Ticket

Open TICKET-INVITE-SECURITY-001 — scoped VENOM + ELEKTRA on apps/VCSM/src/features/invite/ standalone module: (1) run VENOM + ELEKTRA on standalone module, (2) resolve ELEK-2026-05-28-025 (createBarberVportAndAccept ownership gate), (3) resolve ELEK-2026-05-28-026 (autoResumeInviteOnboarding ownership assertion), (4) DB sprint for SECURITY DEFINER RPC for send-citizen-invite user lookup.

## Recommended Next Command

VENOM + ELEKTRA — scoped to apps/VCSM/src/features/invite/ standalone module. Mandatory before any THOR gate attempt. Prerequisite: resolve ELEK-2026-05-28-025 (add assertActorOwnsVportActorController to createBarberVportAndAccept) as the first action.

## DR. STRANGE Read Order

1. DR_STRANGE.md (this file)
2. CURRENT_STATUS.md — present
3. SECURITY.md — present
4. ARCHITECTURE.md — present
5. ownership.md — present (lowercase)
6. performance.md — present (stub only)
7. README.md — present
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. HISTORY_INDEX.md — MISSING
11. TESTS.md — MISSING

---
*DR_STRANGE.md generated: 2026-06-02 | Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001 | Timestamp: 2026-06-02T05:30:00*
---

<!-- DRSTRANGE_COMMAND_MATRIX_START -->
## Command Coverage Matrix

Feature: invite
Applicable Commands: 17
Coverage Score: 4.5 / 17
Coverage %: 26%
Last Refresh: 2026-06-02 (TICKET-DRSTRANGE-MATRIX-REFRESH-0001)

| Command | Status | Last Run | Evidence | Next Action |
|---|---|---|---|---|
| ARCHITECT | COMPLETE | 2026-06-02 | CURRENT/features/invite/ARCHITECTURE.md | — |
| VENOM | PARTIAL | 2026-05-27 | CURRENT/features/invite/SECURITY.md — join path, team card, external site covered; standalone features/invite/ NOT_STARTED | Run VENOM scoped to apps/VCSM/src/features/invite/ standalone module |
| ELEKTRA | PARTIAL | 2026-05-28 | CURRENT/features/invite/SECURITY.md — barber patch advisory, team card, external site, barber join/create-VPORT path covered; standalone NOT_STARTED | Run ELEKTRA scoped to apps/VCSM/src/features/invite/ standalone module |
| BLACKWIDOW | PARTIAL | 2026-05-27 | CURRENT/features/invite/SECURITY.md — vport-dashboard-team-card retest only; standalone NOT_STARTED | Run BLACKWIDOW scoped to standalone module after VENOM/ELEKTRA |
| SENTRY | PARTIAL | 2026-05-18 | CURRENT/features/invite/CURRENT_STATUS.md — join-barbershop-route-registration compliance only | Full route compliance audit needed for standalone invite route |
| IRONMAN | PARTIAL | 2026-05-18 | CURRENT/features/invite/ownership.md — dashboard team path partially mapped; standalone not covered | Run IRONMAN scoped to features/invite/ standalone module |
| SPIDER-MAN | NOT RUN | NEVER | No TESTS.md; zero test coverage confirmed across all invite surfaces | Run SPIDER-MAN; open TICKET-INVITE-SECURITY-001 |
| KRAVEN | PARTIAL | 2026-06-01 | CURRENT/features/invite/performance.md — stub only; classified low-risk by KRAVEN barber-locksmith run; no N+1 analysis performed | Confirm stub assessment with full KRAVEN pass on standalone module |
| THOR | BLOCKED | NEVER | CURRENT/features/invite/CURRENT_STATUS.md — BLOCK-INVITE-001 + BLOCK-INVITE-002 explicit THOR blockers | Resolve ELEK-2026-05-28-025, complete standalone module audit, then re-evaluate |
| CARNAGE | NOT RUN | NEVER | No evidence found — no migration blockers identified for invite issuance surface | Run when DB sprint opens |
| DB | NOT RUN | NEVER | No evidence found — BLOCK-INVITE-003 (DB-BLOCKED) requires SECURITY DEFINER RPC | DB sprint required for BLOCK-INVITE-003 (O(n) listUsers() enumeration oracle) |
| HAWKEYE | NOT RUN | NEVER | No evidence found | Run after VENOM/ELEKTRA confirm full endpoint surface |
| WATCHER | NOT RUN | NEVER | No evidence found | Run after primary security commands complete |
| FALCON | NOT RUN | NEVER | No evidence found — invite route mobile-accessible but iOS parity not audited | Run FALCON when iOS parity sprint opens |
| WINTER SOLDIER | N/A | — | No Android app | — |
| LOGAN | NOT RUN | NEVER | No evidence found — README.md present but no LOGAN documentation run recorded | Run LOGAN on invite module |
| WOLVERINE | NOT RUN | NEVER | No evidence found — no formal TICKET-XXXX assigned to invite feature | Open TICKET-INVITE-SECURITY-001 to establish Wolverine ticket thread |
| DR. STRANGE | PARTIAL | 2026-06-02 | This matrix refresh run | Matrix updated; full re-run pending |

## Command Coverage Summary

| Metric | Value |
|---|---|
| Applicable Commands | 17 |
| Complete | 1 |
| Partial | 7 |
| Not Run | 8 |
| Blocked | 1 |
| Coverage % | 26% |

## THOR Eligibility

- THOR Status: THOR_BLOCKED
- Blocking Reasons: BLOCK-INVITE-001 (ELEK-2026-05-28-025 — createBarberVportAndAccept missing ownership assertion post-VPORT creation, explicit THOR blocker); BLOCK-INVITE-002 (standalone features/invite/ module never audited — zero VENOM/ELEKTRA/BLACKWIDOW coverage on issuance surface, explicit THOR blocker); BLOCK-INVITE-003 (DB-BLOCKED — O(n) listUsers() email enumeration oracle on send-citizen-invite, requires SECURITY DEFINER RPC); WOLVERINE not run (no formal ticket thread)
- Caution Items: BLOCK-INVITE-004 (HIGH — wildcard CORS on all 5 edge functions, unresolved); BLOCK-INVITE-005 (ARCH VIOLATION — banned owner_user_id identity surface in findEligibleBarberActorIdsDAL); SPIDER-MAN not run (zero test coverage confirmed)
- Required Before THOR: Run VENOM + ELEKTRA scoped to apps/VCSM/src/features/invite/ standalone module; resolve ELEK-2026-05-28-025 (add assertActorOwnsVportActorController to createBarberVportAndAccept); resolve ELEK-2026-05-28-026 (add ownership assertion to autoResumeInviteOnboarding); DB sprint for SECURITY DEFINER RPC (BLOCK-INVITE-003); open formal WOLVERINE ticket TICKET-INVITE-SECURITY-001
- Coverage %: 26%
- Last DR. STRANGE Refresh: 2026-06-02T00:00:00
- Category Key: invite
<!-- DRSTRANGE_COMMAND_MATRIX_END -->
