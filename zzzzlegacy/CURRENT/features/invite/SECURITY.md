---
# invite — SECURITY.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

Security posture for the invite feature. Evidence drawn from VENOM, ELEKTRA, and
BLACKWIDOW audits across multiple sprints (2026-05-10 through 2026-05-28).
The standalone `features/invite/` module has NEVER been audited — all resolved findings
below are from the join/team-invite paths. See WARNING below.

---

## WARNING — Standalone Module Not Audited

The `features/invite/` source module (invite issuance, `/invite` route) has received
NO security audit of any kind. VENOM, ELEKTRA, and BLACKWIDOW are all NOT_STARTED
for this surface. It is currently released to production with zero security coverage.
VENOM + ELEKTRA must run before THOR can issue any release clearance.

---

## Command Coverage

| Command | Status | Scope Covered | Last Run |
|---|---|---|---|
| VENOM | PARTIAL | join path (joinInvite.dal.js), team card, external site (send-citizen-invite) | 2026-05-27 |
| ELEKTRA | PARTIAL | barber patch advisory, team card, external site, barber join/create-VPORT path | 2026-05-28 |
| BLACKWIDOW | PARTIAL | vport-dashboard-team-card retest | 2026-05-27 |
| SENTRY | PARTIAL | join-barbershop-route-registration (compliance only) | 2026-05-18 |
| THOR | BLOCKED | — | NEVER CLEARED |
| VENOM on features/invite/ standalone | NOT_STARTED | — | NEVER |
| ELEKTRA on features/invite/ standalone | NOT_STARTED | — | NEVER |
| BLACKWIDOW on features/invite/ standalone | NOT_STARTED | — | NEVER |

---

## Trust Boundary Architecture (Join/Acceptance Path)

```
Client
  ↓ /join/barbershop/:token (opaque UUID token — not actorId)
  ↓ useJoinBarbershop.js (hook — React state/lifecycle)
  ↓
  ┌──────────────────────────────────────────────────────────────┐
  │  joinBarbershopAccount.controller.js                         │
  │  joinBarbershopQr.controller.js                              │
  │  Key functions:                                              │
  │    signUpForBarbershopInvite → recordSignupConsent (MET)     │
  │    loginForInvite                                            │
  │    autoResumeInviteOnboarding → acceptJoinResourceDAL        │
  │      ⚠️ ELEK-2026-05-28-026: NO ownership assertion          │
  │    createBarberVportAndAccept → acceptJoinResourceDAL        │
  │      ⚠️ ELEK-2026-05-28-025: NO ownership assertion          │
  │    useExistingBarberVportAndAccept                           │
  │      ✓ assertActorOwnsVportActorController (CORRECT)         │
  └──────────────────────────────────────────────────────────────┘
  ↓
  ┌──────────────────────────────────────────────────────────────┐
  │  joinInvite.dal.js                                           │
  │  loadInviteForJoin, acceptJoinResourceDAL,                   │
  │  fetchJoinResourceByIdDAL                                    │
  │  F-12 RESOLVED: profile_id removed from RESOURCE_COLS        │
  └──────────────────────────────────────────────────────────────┘
  ↓ vport.resources table
```

```
Client
  ↓ Dashboard team card (barbershop → barber invite)
  ↓ vportTeam.controller.js / vportTeamInvite.controller.js
  ↓
  ┌──────────────────────────────────────────────────────────────┐
  │  sendTeamRequestController                                   │
  │  ✓ assertActorOwnsVportActorController (VD-09 RESOLVED)      │
  │                                                              │
  │  acceptTeamRequestController                                 │
  │  ✓ callerActorId ownership enforced (VD-02 RESOLVED)         │
  │                                                              │
  │  declineTeamRequestController                                │
  │  ✓ assertActorOwnsVportActorController on isInvitedBarber    │
  │    branch (ELEK-002 RESOLVED)                                │
  │                                                              │
  │  acceptBarbershopInviteController                            │
  │  ✓ Replay blocked — ELEK-001 atomic guard confirmed          │
  └──────────────────────────────────────────────────────────────┘
  ↓
  ┌──────────────────────────────────────────────────────────────┐
  │  vportTeamInvite.write.dal.js                                │
  │  acceptTeamInviteByActorDAL                                  │
  │  ✓ .eq("meta->>status", "pending_acceptance") atomic guard   │
  │                                                              │
  │  acceptTeamRequestDAL                                        │
  │  ⚠️ ELEK-TEAM-005: missing atomic state guard (LOW)          │
  └──────────────────────────────────────────────────────────────┘
```

---

## Write Surface Risk Assessment

| Surface | Write Type | Ownership Gate | Risk |
|---|---|---|---|
| invite/controller/ | AUTH_MUTATION | PARTIAL | HIGH |
| joinBarbershopAccount.controller.js | AUTH_MUTATION | PARTIAL — two functions missing ownership assertion | HIGH |
| sendTeamRequestController | AUTH_MUTATION | STRONG — assertActorOwnsVportActorController | RESOLVED |
| acceptTeamRequestController | AUTH_MUTATION | STRONG — callerActorId enforced | RESOLVED |
| declineTeamRequestController | AUTH_MUTATION | STRONG — assertActorOwnsVportActorController | RESOLVED |
| acceptJoinResourceDAL (via createBarberVportAndAccept) | AUTH_MUTATION | MISSING | HIGH OPEN |
| acceptJoinResourceDAL (via autoResumeInviteOnboarding) | AUTH_MUTATION | MISSING | MEDIUM OPEN |
| send-citizen-invite edge function | AUTH_MUTATION | PARTIAL — CORS wildcard, listUsers O(n) | HIGH OPEN |

---

## Findings

### RESOLVED

**F-06 | HIGH | RESOLVED**
- Surface: `acceptJoinResourceDAL` — invite acceptance path
- Finding: Wrote `member_actor_id` without caller ownership verification — any authenticated user with a valid token could link a resource to a VPORT they don't own.
- Resolution: `useExistingBarberVportAndAccept` now calls `assertActorOwnsVportActorController` before accepting.
- Evidence: `2026-05-10_00-00_venom_vcsm-full-deep-scan.md`

**F-12 | MEDIUM | RESOLVED**
- Surface: `joinInvite.dal.js` — `RESOURCE_COLS`
- Finding: `profile_id` returned in the public read path — internal identifier exposed at invite token distribution surface.
- Resolution: `profile_id` removed from `RESOURCE_COLS`.
- Evidence: `2026-05-10_00-00_venom_vcsm-full-deep-scan.md`

**VD-02 | CRITICAL | RESOLVED**
- Surface: `acceptTeamRequestController`, `declineTeamRequestController`
- Finding: No caller identity verification — any authenticated actor knowing a `resourceId` with `status = pending_acceptance` could accept or decline any team invite.
- Resolution: Controllers now require `callerActorId` and enforce ownership.
- Evidence: `2026-05-10_venom-robin_vport-dashboard.md`

**VD-09 | HIGH | RESOLVED**
- Surface: `sendTeamRequestController`
- Finding: No ownership check — any authenticated user knowing a barbershop `actorId` could send team invite requests as that barbershop.
- Resolution: `assertActorOwnsVportActorController` added as first parameter gate.
- Evidence: `2026-05-10_venom-robin_vport-dashboard.md`

**ELEK-001 | HIGH | RESOLVED**
- Surface: `acceptTeamInviteByActorDAL`
- Finding: Missing atomic DAL-level state guard — invited resource slot could be overwritten if already accepted.
- Resolution: `.eq("meta->>status", "pending_acceptance")` conditional UPDATE enforced at DAL.
- Evidence: `2026-05-14_00-00_venom_vcsm-full-deep-scan.md` (verified in `2026-05-27_05-42_elektra_barber-vport-patch-advisory.md` and `2026-05-27_blackwidow_elektra_vport-dashboard-team-card.md`)

**ELEK-002 | HIGH | RESOLVED**
- Surface: `declineTeamRequestController` — `isInvitedBarber` branch
- Finding: String equality `resource.member_actor_id` substituted for session-level ownership verification — bypassed ownership check.
- Resolution: `assertActorOwnsVportActorController` required on invited barber branch.
- Evidence: `2026-05-27_blackwidow_elektra_vport-dashboard-team-card.md`

**BW-TEAM-004a | N/A | RESOLVED/BLOCKED**
- Surface: `acceptBarbershopInviteController` — invite token replay
- Finding: Invite token replay attack scenario tested.
- Resolution: BLOCKED by ELEK-001 atomic DAL guard + controller status pre-check — two-layer protection confirmed.
- Evidence: `2026-05-27_blackwidow_elektra_vport-dashboard-team-card.md`

---

### OPEN

**ELEK-2026-05-28-025 | HIGH | OPEN — THOR BLOCKER**
- Surface: `createBarberVportAndAccept` (invite path)
- Finding: Calls `acceptJoinResourceDAL` without ownership assertion after VPORT creation — inconsistent with `useExistingBarberVportAndAccept` which correctly calls `assertActorOwnsVportActorController`.
- Resolution required: Add `assertActorOwnsVportActorController` before `acceptJoinResourceDAL` call.
- Evidence: `2026-05-28_elektra_barber.md`

**ELEK-2026-05-28-026 | MEDIUM | OPEN**
- Surface: `autoResumeInviteOnboarding` (invite path)
- Finding: Calls `acceptJoinResourceDAL` without ownership assertion after VPORT creation. Lower risk due to `pending_invite_token` metadata precondition but breaks ownership assertion consistency requirement.
- Resolution required: Add ownership assertion consistent with `useExistingBarberVportAndAccept`.
- Evidence: `2026-05-28_elektra_barber.md`

**ELEK-2026-05-27-005 | HIGH | OPEN (BLOCKED — DB-LEVEL CHANGE REQUIRED)**
- Surface: `send-citizen-invite` edge function
- Finding: Calls `adminClient.auth.admin.listUsers()` on every invite — O(n) full user table fetch, email enumeration oracle (response reveals USER_ALREADY_REGISTERED), rate amplification attack available to any authenticated actor.
- Resolution required: New SECURITY DEFINER RPC before feature ships at scale. DB-level change.
- Cross-reference: VENOM-EXTSITE-003 (same finding).
- Evidence: `2026-05-27_20-00_elektra_external-site.md`, `2026-05-27_18-30_venom_external-site.md`

**ELEK-2026-05-27-006 | MEDIUM | OPEN (CAUTION)**
- Surface: `send-citizen-invite` edge function
- Finding: Returns raw PostgreSQL error message on `vibe_invites` insert failure — leaks table names, column names, constraint names, FK references to callers.
- Resolution: Suppress `message` field, log server-side only.
- Cross-reference: VENOM-EXTSITE-005 (same finding).
- Evidence: `2026-05-27_20-00_elektra_external-site.md`, `2026-05-27_18-30_venom_external-site.md`

**ELEK-TEAM-005 | LOW | OPEN**
- Surface: `acceptTeamRequestDAL` (request/QR path)
- Finding: Lacks the atomic `.eq("meta->>status", "pending_acceptance")` guard present on `acceptTeamInviteByActorDAL` — concurrent accepts on the request path produce idempotent outcome but create a consistency gap vs the hardened invite path.
- Evidence: `2026-05-27_blackwidow_elektra_vport-dashboard-team-card.md`

**WILDCARD-CORS | HIGH | OPEN**
- Surface: `send-citizen-invite` edge function (and all five edge functions)
- Finding: `"Access-Control-Allow-Origin": "*"` — any origin can call write surfaces including invite.
- Resolution required: Restrict to known origin allowlist.
- Evidence: `2026-05-27_20-00_elektra_external-site.md`

**DEAD-IMPORT | LOW | OPEN**
- Surface: `useJoinBarbershop.js`
- Finding: Imports `loginForInvite` twice from the same module — second import is unused dead code.
- Evidence: `2026-05-18_loki_barbershop-join-route-trace.md`

**TERMS-OF-SERVICE | STATUS UNCLEAR**
- Surface: `signUpForBarbershopInvite` — invite signup path
- Finding: 2026-05-10 audit found `recordSignupConsent` not called on invite signup path. 2026-05-18 Sentry audit found `signUpForBarbershopInvite` calls `recordSignupConsent` after account creation — treated as MET.
- Status: CONFLICTING EVIDENCE — the 2026-05-18 Sentry audit is more recent and operationally verified. Treated as MET pending explicit SENTRY re-run to confirm.
- Evidence: `2026-05-10_architect_terms-of-service-logic.md` / `2026-05-18_loki_barbershop-join-route-trace.md`

**FEATURES/INVITE MODULE — NO AUDIT | CRITICAL GAP | OPEN**
- Surface: `apps/VCSM/src/features/invite/` — standalone issuance module
- Finding: This module has received ZERO security audit coverage. It is RELEASED to production with no VENOM, ELEKTRA, or BLACKWIDOW coverage.
- Resolution required: VENOM + ELEKTRA minimum before THOR clearance.
- Evidence: `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/DASHBOARD/modules/invite/audit-status.md`

---

## History Index

| Date | Command | Security Event |
|---|---|---|
| 2026-05-10 | VENOM | F-06 (HIGH) + F-12 (MEDIUM) found in joinInvite.dal.js / acceptJoinResourceDAL |
| 2026-05-10 | VENOM | VD-02 (CRITICAL) + VD-09 (HIGH) found in dashboard team invite controllers |
| 2026-05-10 | THOR | F-06 + F-12 remediation tracked in engine release readiness report |
| 2026-05-14 | ELEKTRA | ELEK-001 (HIGH) found — missing atomic DAL guard on acceptTeamInviteByActorDAL |
| 2026-05-18 | IRONMAN | Partial ownership — invite DAL/controller ownership mapped for team path |
| 2026-05-27 | VENOM | VENOM-EXTSITE-003/005 found in send-citizen-invite edge function |
| 2026-05-27 | ELEKTRA | ELEK-001 RESOLVED (barber-vport-patch-advisory retest); ELEK-002 RESOLVED; ELEK-TEAM-005 OPEN |
| 2026-05-27 | BLACKWIDOW | BW-TEAM-004a confirmed RESOLVED/BLOCKED; team card retest passed |
| 2026-05-27 | ELEKTRA | ELEK-2026-05-27-005/006 found in send-citizen-invite edge function |
| 2026-05-28 | ELEKTRA | ELEK-2026-05-28-025 (HIGH) + ELEK-2026-05-28-026 (MEDIUM) found — THOR BLOCKED |
