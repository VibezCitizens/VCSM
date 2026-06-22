# VENOM Security Audit — VPORT Dashboard Team Card

**Date:** 2026-05-27
**Reviewer:** VENOM
**Ticket:** TICKET-0003 — VPORT Dashboard Card Logan Inventory (Phase 3, Step 1)
**Trigger:** First VENOM security documentation pass for newly documented team card module
**Findings:** 0 CRITICAL | 3 HIGH | 4 MEDIUM | 1 LOW

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Dashboard — Team Card
Application Scope: VCSM
Reason for review: Module documented 2026-05-27; marked SECURITY_REVIEW_PENDING; HIGH risk (multi-actor write paths, invite lifecycle, role mutations, hard deletes)
Primary trust boundary: assertActorOwnsVportActorController — application-layer gate on all write paths
```

---

## SECURITY SURFACE

```
Entry point:       VportDashboardTeamScreen.jsx / BarberTeamRequestsScreen.jsx
Auth source:       useIdentity() — identity context / identityContext (inconsistent — see VENOM-TEAM-006)
Authorization layer: assertActorOwnsVportActorController (write paths only)
Identity surface:  actorId + kind (correct); legacy owner_user_id in one DAL (VENOM-TEAM-005)
Sensitive objects: vport.resources (staff rows), meta.status (invite state), member names/actor IDs/roles
```

---

## TRUST BOUNDARY TRACE

```
Client input:       viewerActorId from identity context, actorId from route params
Validated at:       Controller layer (write paths only)
Identity resolved at: useIdentity() hook → identity context
Authorization enforced at: Controller layer via assertActorOwnsVportActorController
Data returned to:   VportDashboardTeamScreen (owner-gated screen) / BarberTeamRequestsScreen (owner-gated screen)
```

---

## PRE-AUDIT PATCHES VERIFIED

Both ELEKTRA patches from prior session confirmed correct in source and test suite:

- **ELEK-001 CONFIRMED** — `acceptTeamInviteByActorDAL` (`dal/vportTeamInvite.write.dal.js`): atomic DB-level state guard via `.eq("meta->>status", "pending_acceptance")`. Prevents replay of accepted or declined invites.
- **ELEK-002 CONFIRMED** — `declineTeamRequestController` (`controller/vportTeamInvite.controller.js`): dual-path ownership verification. Invited-barber path uses `assertActorOwnsVportActorController(viewerActorId, callerActorId)`; shop-owner path verifies against resolved VPORT actor. Test suite covers both paths and edge cases.

---

## VENOM SECURITY FINDING — VENOM-TEAM-001

```
Location: cards/team/controller/vportTeam.controller.js — getTeamMembersController
          cards/team/hooks/useVportTeam.js (calls ungated controller)
Application Scope: VCSM
```

**Current behavior:** `getTeamMembersController(actorId)` reads all staff resources for a given VPORT (`vport.resources` where `actor_id = actorId` and `resource_type = 'staff'`). No ownership check is performed before or after this read. Any authenticated caller who knows a target VPORT's `actorId` can invoke this controller through `useVportTeam` and receive full team member data: names, actor IDs, roles, invite statuses, and meta fields.

**Risk:** Unauthenticated team roster disclosure. An adversary with any authenticated account can enumerate team members across all VPORT actors — exposing staff identity, invite state, and role structure for arbitrary businesses.

**Severity:** HIGH

**Exploitability:** HIGH
**Attack Preconditions:**
- Authenticated Citizen account required
- Target VPORT actorId known (public — appears in profile URLs, feed posts, etc.)
- No ownership check required — controller accepts any actorId

**Blast Radius:** Multi-actor — any VPORT on the platform is affected. Staff names, actor IDs, and role assignments are readable across all teams.

**Why it matters:** Team membership is not a public datum. Competitor intel, personal identity of staff members, and role/status flags are internal business data. Exposing this to any authenticated caller violates the VCSM trust model.

**Recommended mitigation:**
1. Add `assertActorOwnsVportActorController(viewerActorId, actorId)` to `getTeamMembersController` before the DAL read.
2. Thread `viewerActorId` from the caller context (identity context session actor, not route-param `actorId`).
3. Or: enforce via RLS on `vport.resources` SELECT so DB rejects unauthenticated reads regardless of controller state.

**Rationale:** Write paths are protected but the read path has no equivalent gate. This is the most urgent fix in the team card.

**Follow-up command:** SPIDER-MAN (add test asserting non-owner cannot read team members)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Assessment and Testing, Software Development Security

---

## VENOM SECURITY FINDING — VENOM-TEAM-002

```
Location: cards/team/hooks/useVportTeamAccess.js — searchCandidates callback
Application Scope: VCSM
```

**Current behavior:**
```javascript
const searchCandidates = useCallback(async (query) => {
  return searchTeamCandidatesController({ query, viewerActorId: actorId });
}, [actorId]);
```
`actorId` here is the VPORT being managed (the subject of the team page), not the session user's actor ID. `searchTeamCandidatesController` receives this as `viewerActorId`, which it uses for permission checking. The session actor's identity (`sessionActorId` / `identity.actorId`) is never passed.

**Risk:** Incorrect identity threading. The search operation runs under the identity of the VPORT being viewed, not the authenticated user performing the action. If `searchTeamCandidatesController` adds an ownership gate in the future (or if one exists and was missed), it will evaluate against the wrong actor.

**Severity:** MEDIUM

**Exploitability:** MEDIUM
**Attack Preconditions:**
- Authenticated account required
- Must be on the team access management UI
- Current controller has no ownership gate on search, so direct exploit is limited — risk materializes if gate is added without fixing the caller

**Blast Radius:** Single actor — affects the team candidate search for any individual VPORT.

**Why it matters:** Identity threading bugs are silent architectural defects. One-line fix now prevents a class of bypass when the controller is hardened.

**Recommended mitigation:**
Change `viewerActorId: actorId` → `viewerActorId: sessionActorId` where `sessionActorId` is `identity?.actorId` from the identity hook.

**Rationale:** The session user, not the VPORT subject, is the actor performing the search. All permission checks must evaluate the session actor.

**Follow-up command:** ELEKTRA (surgical patch)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — VENOM-TEAM-003

```
Location: vport.resources (table) — all team card read + write paths
Application Scope: VCSM
```

**Current behavior:** All ownership enforcement for team reads and writes is at the application layer (`assertActorOwnsVportActorController`). No DB-level RLS audit has been performed on `vport.resources`. The table holds: staff resources, invite resources, role fields, meta status fields, and actor linkages — all sensitive team data.

**Risk:** Application-only enforcement. If application-layer gates are bypassed (misconfigured middleware, service-role client misuse, future refactor removing gates), all team data is accessible directly from the DB. No second enforcement layer exists.

**Severity:** HIGH (defense-in-depth gap)

**Exploitability:** MEDIUM
**Attack Preconditions:**
- Requires service-role client access or DB-layer bypass (not typical for normal user)
- If RLS is missing, any direct DB client call (service-role or anon with no policy) can read all resources

**Blast Radius:** Multi-actor — if RLS is absent, all `vport.resources` rows across all VPORTs are affected.

**Why it matters:** VCSM's security model relies on defense-in-depth: application gates + RLS. Having only one layer means a single application bug can expose all team data platform-wide.

**Recommended mitigation:**
1. Run CARNAGE to inspect `vport.resources` RLS policies.
2. Confirm: SELECT policy restricts reads to the resource's VPORT owner OR the linked member actor.
3. Confirm: INSERT/UPDATE/DELETE policies match application-layer ownership expectations.
4. Add policies if absent.

**Rationale:** RLS is the non-negotiable second line of defense for sensitive tables. Team membership data must be DB-protected.

**Follow-up command:** CARNAGE (RLS audit + policy creation for `vport.resources`)

**CISSP Domain:**
- Primary: Security Architecture and Engineering
- Secondary: Security and Risk Management

---

## VENOM SECURITY FINDING — VENOM-TEAM-004

```
Location: cards/team/dal/vportTeam.write.dal.js — deleteTeamMemberByIdDAL
          cards/team/dal/vportTeamInvite.write.dal.js — deleteTeamResourceDAL
Application Scope: VCSM
```

**Current behavior:** Both DAL functions issue a hard `DELETE FROM vport.resources WHERE id = $1`. The row is permanently destroyed with no soft-delete flag, no `deleted_at` timestamp, and no audit record.

**Risk:**
1. No audit trail — impossible to investigate "who was removed when and by whom" after the fact.
2. Hard deletes are irreversible — accidental or adversarial removal cannot be undone.
3. If DB-level RLS is absent or insufficient (VENOM-TEAM-003), hard deletes by unauthorized callers destroy records permanently.

**Severity:** MEDIUM

**Exploitability:** MEDIUM
**Attack Preconditions:**
- Must bypass or compromise application-layer ownership gate
- Then delete is irreversible and leaves no trace

**Blast Radius:** Single actor — affects one team resource per call. Compounding: if VENOM-TEAM-001 and VENOM-TEAM-003 are also unresolved, blast radius grows.

**Why it matters:** Soft-delete is standard practice for business-critical records. Hard deletes on team membership destroy audit trails and invite history, which are needed for dispute resolution and compliance.

**Recommended mitigation:**
1. Add `deleted_at` + `deleted_by_actor_id` columns to `vport.resources`.
2. Replace `DELETE` with `UPDATE SET deleted_at = now(), deleted_by_actor_id = $actor`.
3. Add `WHERE deleted_at IS NULL` to all read queries.

**Rationale:** Reversibility and auditability are properties the system should not trade away. The fix is low-risk and follows standard VCSM patterns.

**Follow-up command:** CARNAGE (migration to add soft-delete columns)

**CISSP Domain:**
- Primary: Security Operations
- Secondary: Asset Security

---

## VENOM SECURITY FINDING — VENOM-TEAM-005

```
Location: cards/team/dal/vportTeam.read.dal.js — findEligibleBarberActorIdsDAL (Step 3a)
Application Scope: VCSM
```

**Current behavior:** `findEligibleBarberActorIdsDAL` resolves eligible barber actors for a barbershop invite by querying `vport.profile_categories` joined on `profiles.owner_user_id`. This is the legacy profile ownership model. The VCSM architecture contract explicitly bans use of `profileId`, `vportId`, and `owner_user_id` as identity authorities — all ownership must go through `actor_owners`.

**Risk:**
1. Architecture contract violation — banned identity surface in active use.
2. `profiles.owner_user_id` may diverge from `actor_owners` data over time (migration drift, edge cases during actor creation). The query returns candidates whose `owner_user_id` matches, but who may not have a valid `actor_owners` record linking them to the VPORT actor system.
3. Can surface phantom candidates (users with profile records but no actor identity) or miss valid candidates (actors migrated from legacy to actor model without profile linkage).

**Severity:** MEDIUM

**Exploitability:** LOW
**Attack Preconditions:**
- Requires data divergence between `profiles.owner_user_id` and `actor_owners`
- No direct exploit available — risk is data correctness and identity model drift

**Blast Radius:** Single actor — affects candidate search results for a specific barbershop.

**Why it matters:** Using a banned identity surface in a query that determines who can be invited to a team violates the identity contract and introduces potential data inconsistency. It also makes the system harder to audit.

**Recommended mitigation:**
Replace Step 3a's `profiles.owner_user_id` join with an `actor_owners` query. Resolve eligible barber actors by looking up `actor_owners` where the owner links to a BARBER-kind VPORT actor.

**Rationale:** `actor_owners` is the single source of truth for ownership. All identity resolution must use it.

**Follow-up command:** ARCHITECT (confirm actor_owners schema for BARBER actor resolution)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — VENOM-TEAM-006

```
Location: cards/team/VportDashboardTeamScreen.jsx — identity import
          cards/team/BarberTeamRequestsScreen.jsx — identity import
Application Scope: VCSM
```

**Current behavior:**
- `VportDashboardTeamScreen.jsx` imports identity from `@/features/identity/adapters/identity.adapter`
- `BarberTeamRequestsScreen.jsx` imports identity from `@/state/identity/identityContext`

Two screens in the same card use different identity import paths.

**Risk:** Architecture inconsistency. If the identity context resolves identity differently through these two paths (e.g., session timing, re-render behavior, cached vs live), the two screens may see different actors at the same time. This is a latent bug surface, not a direct exploit.

**Severity:** LOW

**Exploitability:** LOW
**Attack Preconditions:**
- Requires identity resolution divergence between the two import paths
- No known exploit path currently

**Blast Radius:** Single screen — affects `BarberTeamRequestsScreen` only if paths diverge.

**Why it matters:** Architectural inconsistency is a signal. If one path is deprecated or wraps the other, the screens should agree on which one is canonical. Divergence here is a future maintenance trap.

**Recommended mitigation:**
Standardize both screens to use `@/features/identity/adapters/identity.adapter`. Confirm this is the canonical adapter for the identity feature. Remove the direct context import from `BarberTeamRequestsScreen`.

**Rationale:** Adapter boundaries enforce isolation. Both screens should consume identity through the same adapter.

**Follow-up command:** SENTRY (architecture compliance — adapter boundary enforcement)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — VENOM-TEAM-007

```
Location: cards/team/controller/vportTeam.controller.js — removeTeamMemberController (not in vportTeamAccess.controller.js)
Application Scope: VCSM
```

**Current behavior:** When `resource.owner_actor_id` is null (legacy resource with no actor linkage), `removeTeamMemberController` falls back to `getVportActorIdByProfileIdDAL(resource.profile_id)` to resolve the VPORT actor ID. If `getVportActorIdByProfileIdDAL` also returns null (no matching profile or null `profile_id`), `assertActorOwnsVportActorController` is called with `targetActorId: null`.

**Risk:** `assertActorOwnsVportActorController(viewerActorId, null)` — the ownership check runs against a null target. Depending on the implementation of `assertActorOwnsVportActorController`, a null target may: (a) throw and block the operation, (b) pass and allow the deletion to proceed without a valid ownership check.

**Severity:** MEDIUM

**Exploitability:** LOW
**Attack Preconditions:**
- Must have a `vport.resources` row where both `owner_actor_id` and `profile_id` are null (legacy data only)
- Cannot easily manufacture this condition from the UI
- But existing legacy rows may match this condition

**Blast Radius:** Single resource — one team resource per exploit. Scope is limited to legacy rows with null identity fields.

**Why it matters:** Null-target ownership checks are a class of security defect. The system should have an explicit guard for this case, not silent behavior. If `assertActorOwnsVportActorController` passes on null, any authenticated user could remove any legacy resource.

**Recommended mitigation:**
In `removeTeamMemberController`, add an explicit null check before calling `assertActorOwnsVportActorController`:
```javascript
if (!resolvedActorId) {
  throw new Error('Cannot verify ownership: resource has no actor linkage');
}
```
Also audit `assertActorOwnsVportActorController` to confirm it throws (not passes) when `targetActorId` is null.

**Rationale:** Defense: every ownership check must operate on a non-null target. Explicit early failure is safer than implicit null behavior.

**Follow-up command:** DEADPOOL (trace assertActorOwnsVportActorController null behavior)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

---

## VENOM SECURITY FINDING — VENOM-TEAM-008

```
Location: cards/team/__tests__/vportTeamInvite.controller.test.js
Application Scope: VCSM
```

**Current behavior:** The only test file for the team card covers invite controllers (`acceptTeamInviteByActorController`, `declineTeamRequestController`). These are well-tested with edge cases (ELEK-001/002 scenarios, concurrent replay, null actor guards). However, the following controller surfaces have ZERO test coverage:

Controllers with no tests:
- `addTeamMemberController` (vportTeamAccess.controller.js)
- `updateTeamMemberRoleController` (vportTeamAccess.controller.js)
- `setTeamMemberStatusController` (vportTeamAccess.controller.js)
- `removeTeamMemberController` (vportTeam.controller.js + vportTeamAccess.controller.js)
- `getTeamMembersController` (vportTeam.controller.js) — the ungated read path (VENOM-TEAM-001)
- `getTeamAccessController` (vportTeamAccess.controller.js)
- `sendTeamRequestController` (vportTeamAccess.controller.js)
- `findEligibleBarbersController` (vportTeamAccess.controller.js)

**Risk:** Critical write paths (add, update role, set status, remove) and the ungated read path have no regression coverage. A fix to VENOM-TEAM-001 (adding ownership gate to `getTeamMembersController`) would have no test validating the gate works correctly.

**Severity:** MEDIUM

**Exploitability:** N/A — coverage gap, not a runtime exploit path

**Blast Radius:** All team card operations — any regression in untested controllers would not be caught before production.

**Why it matters:** The invite paths are tested because ELEKTRA patches required it. The other paths have never had tests. Security hardening without test coverage is incomplete.

**Recommended mitigation:**
1. Add test file: `cards/team/__tests__/vportTeam.controller.test.js` covering `getTeamMembersController` (ownership gate) and `removeTeamMemberController` (including null actor fallback path).
2. Add test file: `cards/team/__tests__/vportTeamAccess.controller.test.js` covering all write controllers with: (a) owner success path, (b) non-owner rejection path.
3. Priority: `getTeamMembersController` test first (directly validates VENOM-TEAM-001 fix).

**Rationale:** Each security finding that gets fixed needs a regression test. The test gap is a multiplier on the impact of any future regression.

**Follow-up command:** SPIDER-MAN (test coverage plan for team card controllers)

**CISSP Domain:**
- Primary: Security Assessment and Testing
- Secondary: Software Development Security

---

## MITIGATION PLAN SUMMARY

| Finding | Severity | Layer to Fix | Follow-up |
|---|---|---|---|
| VENOM-TEAM-001 | HIGH | Controller (add ownership gate to read path) | SPIDER-MAN |
| VENOM-TEAM-002 | MEDIUM | Hook (fix identity threading) | ELEKTRA |
| VENOM-TEAM-003 | HIGH | DB/RLS (audit + add policies) | CARNAGE |
| VENOM-TEAM-004 | MEDIUM | DAL + DB (soft-delete migration) | CARNAGE |
| VENOM-TEAM-005 | MEDIUM | DAL (replace owner_user_id with actor_owners join) | ARCHITECT |
| VENOM-TEAM-006 | LOW | Hook/Screen (standardize identity import) | SENTRY |
| VENOM-TEAM-007 | MEDIUM | Controller (add null guard before ownership check) | DEADPOOL |
| VENOM-TEAM-008 | MEDIUM | Tests (add controller test files) | SPIDER-MAN |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VENOM-TEAM-003 (secondary) — RLS gap represents systemic risk |
| Asset Security | 1 | VENOM-TEAM-004 (secondary) — hard delete destroys audit record |
| Security Architecture and Engineering | 2 | VENOM-TEAM-003 (primary), VENOM-TEAM-007 (secondary) |
| Communication and Network Security | 0 | No public route or network surface in this card |
| Identity and Access Management | 6 | VENOM-TEAM-001 (primary), VENOM-TEAM-002 (primary), VENOM-TEAM-005 (primary), VENOM-TEAM-006 (primary), VENOM-TEAM-007 (primary) + VENOM-TEAM-003 (context) |
| Security Assessment and Testing | 2 | VENOM-TEAM-001 (secondary — no test), VENOM-TEAM-008 (primary) |
| Security Operations | 1 | VENOM-TEAM-004 (primary) — no audit trail on delete |
| Software Development Security | 6 | Secondary classification on VENOM-TEAM-001, 002, 004, 005, 006, 008 |

**Uncovered domains:**
- **Communication and Network Security** — out of scope for this card (no public endpoints, no network-facing surfaces)

**VENOM completion status:** COMPLETE — all findings classified, all CISSP domains assigned, summary table complete.

---

## ELEK PATCHES CONFIRMED

| Ref | Status | Evidence |
|---|---|---|
| ELEK-001 | VERIFIED | Source + test: `.eq("meta->>status", "pending_acceptance")` present in `acceptTeamInviteByActorDAL`; test suite covers replay and wrong-status paths |
| ELEK-002 | VERIFIED | Source + test: `declineTeamRequestController` dual-path confirmed; test covers notification-harvested ID bypass, null viewerActorId guard |
