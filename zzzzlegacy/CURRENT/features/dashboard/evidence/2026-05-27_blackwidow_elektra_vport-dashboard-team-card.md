# BLACKWIDOW + ELEKTRA — VPORT Dashboard Team Card

**Date:** 2026-05-27
**Reviewer:** BLACKWIDOW (adversarial runtime) + ELEKTRA (source-to-sink patch advisory)
**Ticket:** TICKET-0003 — VPORT Dashboard Card Logan Inventory (Phase 3, Team follow-up)
**Trigger:** Post-VENOM adversarial validation and patch advisory for VPORT Dashboard Team card
**Input:** VENOM-TEAM-001 through VENOM-TEAM-008 (findings from prior VENOM pass)
**Findings:** 1 BYPASSED | 4 PARTIAL | 4 BLOCKED + 1 NEW finding (ESM name conflict)

---

## BLACKWIDOW TARGET

```
Feature:           VPORT Dashboard — Team Card
Application Scope: VCSM
Source path:       apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/
Primary gates:     useVportOwnership (screen), assertActorOwnsVportActorController (controllers)
Session identity:  identity.actorId via useIdentity()
RLS confirmed by:  CARNAGE audit 2026-05-27 (resources_insert/update/delete_owner, resources_select_public)
```

---

## CONFIRMED GATES (Pre-BLACKWIDOW baseline)

| Gate | Location | Verified By | Judgment |
|---|---|---|---|
| Screen ownership | `useVportOwnership(viewerActorId, actorId)` in both screens | Code read | VERIFIED — early return on non-owner before any content |
| `getTeamAccessController` | `vportTeamAccess.controller.js:53-56` | Code read | VERIFIED — `assertActorOwnsVportActorController` first operation |
| `addTeamMemberController` | `vportTeamAccess.controller.js:62-67` | Code read | VERIFIED — ownership gate before any DAL call |
| `updateTeamMemberRoleController` | `vportTeamAccess.controller.js:84-89` | Code read | VERIFIED — ownership gate + owner-remains invariant |
| `setTeamMemberStatusController` | `vportTeamAccess.controller.js:105-110` | Code read | VERIFIED — ownership gate + self-deactivation guard |
| `removeTeamMemberController` (ACCESS) | `vportTeamAccess.controller.js:130-135` | Code read | VERIFIED — ownership gate via passed `actorId` |
| `sendTeamRequestController` | `vportTeam.controller.js:81-84` | Code read | VERIFIED — ownership gate before INSERT |
| `acceptBarbershopInviteController` | `vportTeamInvite.controller.js:89-111` | Code read | VERIFIED — ELEK-001 state guard + assertActorOwnsVportActorController |
| `acceptTeamRequestController` | `vportTeamInvite.controller.js:13-29` | Code read | VERIFIED — status pre-check + assertActorOwnsVportActorController |
| `declineTeamRequestController` | `vportTeamInvite.controller.js:36-73` | Code read | VERIFIED — ELEK-002 dual-path ownership + viewerActorId guard |
| `getBarberTeamRequestsController` | `vportTeamInvite.controller.js:75-82` | Code read | VERIFIED — assertActorOwnsVportActorController before DAL |
| `assertActorOwnsVportActorController` | `booking/controller/assertActorOwnsVportActor.controller.js` | Code read | VERIFIED — user-kind guard + ELEK-004 kind check precedes self-shortcut; reads actor_owners |
| `vport.resources` INSERT RLS | `20260515020000_vport_resources_actor_rls_rebuild.sql` | CARNAGE | VERIFIED — resources_insert_owner via vc.actor_owners |
| `vport.resources` DELETE RLS | `20260515020000_vport_resources_actor_rls_rebuild.sql` | CARNAGE | VERIFIED — resources_delete_owner via vc.actor_owners |
| ELEK-001 atomic DAL guard | `vportTeamInvite.write.dal.js:80-92` | Code read | VERIFIED — `.eq("meta->>status", "pending_acceptance")` on UPDATE |
| ELEK-002 viewerActorId path | `vportTeamInvite.controller.js:36-73` | Code read | VERIFIED — ownership assertion on invited barber path |

---

## BLACKWIDOW ADVERSARIAL SCENARIOS

---

### BW-TEAM-001 — Non-Owner Reads Team Members via `getTeamMembersController`

**Corresponds to:** VENOM-TEAM-001

**Attack vector:** Direct call to exported `getTeamMembersController(targetActorId)` from `index.js`

**Preconditions:**
- Authenticated session (any Citizen account)
- Target VPORT `actorId` known (discoverable from public profile URLs)

**Source → Sink chain:**
```
Attacker imports getTeamMembersController from cards/team/index.js
→ getTeamMembersController(targetActorId)          [vportTeam.controller.js:23]
→ resolveProfileId(actorId)                         [no ownership check]
→ fetchTeamMembersByProfileId(profileId)            [vportTeam.read.dal.js:4]
→ vportSchema.from("resources").select(...)         [returns id, name, resource_type,
                                                      is_active, member_actor_id, sort_order, meta]
→ RLS resources_select_public                       [public read policy — allows return]
```

**Defense gate present/absent:**
- `getTeamMembersController`: ABSENT — only `if (!actorId) return []`
- RLS `resources_select_public`: PERMITS read (by design — public team display)
- Screen `useVportOwnership` gate: BYPASSED (attacker calls controller directly, not via screen)

**Data exposed:**
- Team member `name`, `is_active`, `member_actor_id`, `sort_order`
- `meta` field: `status` (pending_acceptance, linked, declined), `role` (owner, manager, staff), `requested_by_actor_id`, request/accept timestamps
- The `requested_by_actor_id` inside `meta` can reveal the barbershop owner's actorId

**Result:** **PARTIAL**

The current primary screen path (`VportDashboardTeamScreen.jsx`) does NOT call `getTeamMembersController` — it uses `useVportTeamAccess` → `getTeamAccessController` (which has ownership gate). However:
1. `useVportTeam.js` (still exported from `index.js`) calls `getTeamMembersController` unconditionally on mount
2. `getTeamMembersController` itself is exported from `index.js` and callable directly
3. Any caller importing from `cards/team` can invoke the unguarded read path

**Severity:** MEDIUM
**Exploitability:** LOW-MEDIUM — requires authenticated account and knowledge of target actorId (public); no screen bypass needed, only an import

---

### BW-TEAM-002 — Actor Search Uses Wrong `viewerActorId` — Session Privacy Bypass

**Corresponds to:** VENOM-TEAM-002

**Attack vector:** Use Add Team Member search while session user has block relationships

**Preconditions:**
- Authenticated owner of a VPORT
- Session user has blocked one or more Citizen actors (or been blocked by them)
- `searchActorsAdapter` uses `viewerActorId` for block/privacy filtering

**Source → Sink chain:**
```
User opens AddTeamMemberSheet, types query
→ searchCandidates(query)                           [useVportTeamAccess.js:84]
→ searchTeamCandidatesController({ query, viewerActorId: actorId })
                                                     [actorId = VPORT actor, NOT sessionActorId]
→ searchActorsAdapter({ query, limit:12, viewerActorId: <VPORT actorId> })
→ search filtered against VPORT's social graph      [NOT session user's block/privacy state]
→ Result: actors blocked by session user may appear; actors who blocked session user may appear
```

**Defense gate present/absent:**
- Authorization gate: PRESENT — `assertActorOwnsVportActorController` in `addTeamMemberController` prevents adding unauthorized members
- Privacy filter: WRONG IDENTITY — `viewerActorId` should be `sessionActorId` (user-kind), not `actorId` (VPORT-kind)
- The fix is surgical: line 85 of `useVportTeamAccess.js`

**Result:** **PARTIAL**

No privilege escalation. Blocked actors can appear as candidates in the search results because the search uses the VPORT actor's social context rather than the session user's. Adding them still requires confirmation and the controller gate would apply, but the session user can see actors they should not be able to surface via their account's privacy controls.

**Severity:** MEDIUM (privacy filter bypass)
**Exploitability:** LOW — requires the user to be an owner and have block relationships that differ from their VPORT's relationships; passive exposure only

---

### BW-TEAM-003 — Cross-VPORT resourceId Delete via `removeTeamMemberController` (Access Controller)

**Corresponds to:** VENOM-TEAM-004 (hard delete)

**Attack vector:** Owner of VPORT-A supplies a `resourceId` belonging to VPORT-B to `removeTeamMemberController`

**Preconditions:**
- Authenticated owner of VPORT-A
- Knowledge of a `resourceId` belonging to VPORT-B
- Direct call to `removeTeamMemberController` (exported from `index.js`)

**Source → Sink chain:**
```
Owner of VPORT-A calls removeTeamMemberController(actorId=VPORT-A, { resourceId=VPORT-B-resource }, callerActorId)
→ assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: VPORT-A })
  PASSES — caller owns VPORT-A
→ resolveProfileId(VPORT-A)
→ fetchTeamMembersByProfileId(profileId-A)
→ target = existing.find(r => r.id === VPORT-B-resource)
  → target is UNDEFINED (VPORT-B's resource is not in VPORT-A's member list)
→ Self-remove guard: target is undefined, guard skipped
→ Owner-remains guard: target is undefined, guard skipped
→ deleteTeamMemberByIdDAL(VPORT-B-resource)
  → vportSchema.from("resources").delete().eq("id", resourceId)
  → RLS resources_delete_owner: checks auth.uid() is owner of the resource's VPORT via actor_owners
  BLOCKED by RLS — attacker does not own VPORT-B
```

**Defense gate present/absent:**
- Controller cross-validation between `actorId` and `resourceId.owner_actor_id`: ABSENT
- RLS `resources_delete_owner`: PRESENT — blocks at DB layer
- Owner-remains guard: NOT TRIGGERED (target is undefined for cross-VPORT resource)

**Result:** **BLOCKED** — RLS `resources_delete_owner` rejects the delete at the DB layer.

However, the controller's absence of cross-validation between `actorId` and the resource's `owner_actor_id` is a defense-in-depth gap. If the RLS policy had a regression, no second gate would exist at the controller layer for this specific attack.

**Severity:** LOW (blocked by RLS; controller gap is depth-of-defense issue)
**Exploitability:** NONE under current RLS

---

### BW-TEAM-004a — Invite Accept Replay (`acceptBarbershopInviteController`)

**Corresponds to:** VENOM-TEAM-004 (audit trail), ELEK-001

**Attack vector:** Attacker replays a previously used invite token

**Preconditions:**
- Attacker has a previously used or accepted `token` (invite resource ID)
- Attacker owns or claims ownership of the target barber VPORT

**Source → Sink chain:**
```
Attacker calls acceptBarbershopInviteController(token, barberVportActorId, callerActorId)
→ fetchResourceByIdDAL(token)
→ resource.meta.status === "pending_acceptance"?
  NO (status is "linked" or "declined") → throw "invite is no longer available"
  BLOCKED at controller state guard (vportTeamInvite.controller.js:100)
```

**If status check somehow passes (controller race):**
```
→ assertActorOwnsVportActorController(...)
→ acceptTeamInviteByActorDAL(token, barberVportActorId, currentMeta)
  → UPDATE WHERE id = token AND "meta->>status" = "pending_acceptance"
  → ELEK-001: status is already "linked" — WHERE clause matches 0 rows → data is null
  → throw "invite is no longer available"
  BLOCKED at DAL atomic guard
```

**Result:** **BLOCKED** — Two-layer protection: controller pre-read status check + ELEK-001 DAL atomic state guard.

**Severity:** N/A — not exploitable under current implementation

---

### BW-TEAM-004b — Team Request Accept Replay Race (`acceptTeamRequestController`)

**Corresponds to:** VENOM-TEAM-004

**Attack vector:** Two concurrent requests both pass the pre-read status check before either write completes

**Source → Sink chain:**
```
Request A: reads resource → status "pending_acceptance" → passes check → calls acceptTeamRequestDAL(resourceId)
Request B (concurrent): reads resource → status "pending_acceptance" → passes check → calls acceptTeamRequestDAL(resourceId)
→ acceptTeamRequestDAL does NOT have `.eq("meta->>status", "pending_acceptance")` atomic guard
→ Both UPDATEs execute: both set is_active=true, meta.status="linked"
→ Outcome: two DB writes with identical result (idempotent effect)
```

**Result:** **PARTIAL** — No DAL-level atomic guard on `acceptTeamRequestDAL` (unlike `acceptTeamInviteByActorDAL` which has ELEK-001). Concurrent accepts produce identical outcomes (idempotent), but the race window exists and the missing guard is a hardening gap relative to the invite path.

**Severity:** LOW — idempotent outcome; no data corruption; hardening gap relative to acceptBarbershopInviteController

---

### BW-TEAM-005 — Legacy `owner_user_id` Surfaces Stale Eligible Barbers

**Corresponds to:** VENOM-TEAM-005

**Attack vector:** `findEligibleBarberActorIdsDAL` Step 3a uses `profiles.owner_user_id IN (userIds)` to resolve which barber VPORTs are owned by users who follow the barbershop

**Preconditions:**
- A user previously owned a barber VPORT (profiles.owner_user_id set)
- Ownership was transferred or user account was deactivated
- `profiles.owner_user_id` was not updated to reflect the change
- `actor_owners` table reflects the correct new owner

**Source → Sink chain:**
```
findEligibleBarberActorIdsDAL(barbershopActorId)
→ Step 3a: query profile_categories WHERE profile.owner_user_id IN (follower user IDs)
→ profiles.owner_user_id is stale (points to old user)
→ Returns actor_id of barber VPORT for old/stale owner
→ Appears as eligible team candidate even though they no longer control the VPORT
```

**Defense gate present/absent:**
- `sendTeamRequestController` sends to `barberVportActorId` returned by this path
- The invite is sent to the actor — if the actor no longer has an active owner, `acceptBarbershopInviteController` would fail the ownership check
- No privilege escalation; wrong actor receives invite notification

**Result:** **PARTIAL** — Stale data surfaces wrong candidates. The actual accept/decline path is still protected by ownership gates. Impact is data integrity (wrong notification sent) not authorization bypass.

**Severity:** LOW — wrong data, no authorization bypass

---

### BW-TEAM-006 — Identity Import Mismatch Creates Stale Actor Window

**Corresponds to:** VENOM-TEAM-006

**Attack vector:** During actor-switch, hooks using `@/state/identity/identityContext` directly may receive stale `actorId` for a brief window

**Files affected:**
- `BarberTeamRequestsScreen.jsx:4` — imports from `@/state/identity/identityContext`
- `useVportTeam.js:3` — imports from `@/state/identity/identityContext`
- `useVportTeamAccess.js:3` — imports from `@/state/identity/identityContext`

vs. correct path:
- `VportDashboardTeamScreen.jsx:4` — imports from `@/features/identity/adapters/identity.adapter`

**Source → Sink chain:**
```
User switches from Actor A (owns VPORT-X) to Actor B (no VPORT)
→ identityContext updates: actorId changes A → B
→ If adapter adds switching guard (returns null during transition):
  - VportDashboardTeamScreen gets null → triggers ownershipLoading guard → safe
  - BarberTeamRequestsScreen bypasses adapter → gets stale A during transition
→ useBarberTeamRequests fires with stale viewerActorId = A
→ getBarberTeamRequestsController(callerActorId=A, barberVportActorId)
→ assertActorOwnsVportActorController — reads actor_owners from DB with CURRENT state
→ If A still owns the VPORT in DB, passes; data from A's context returned to Actor B session
```

**Result:** **PARTIAL** — Dependent on whether the adapter applies a switching guard that the raw context does not. If the adapter is a transparent re-export, the inconsistency is cosmetic (architecture violation only). If the adapter guards the switching transition, the hooks bypass that protection. Impact is bounded to the switching user's own prior data.

**Severity:** LOW — bounded to switching user; no cross-user impact

---

### BW-TEAM-007 — `removeTeamMemberController` (OLD) Profile_id Fallback Ownership Resolution

**Corresponds to:** VENOM-TEAM-007

**Attack vector:** Call the OLD `removeTeamMemberController` from `vportTeam.controller.js` with a `resourceId` where `owner_actor_id` is null and `profile_id` maps to a VPORT the attacker owns via legacy path

**Current screen path:** `VportDashboardTeamScreen.jsx` → `useVportTeamAccess` → `vportTeamAccess.controller.js:removeTeamMemberController` (SAFE — no fallback)

**Old path:** `vportTeam.controller.js:removeTeamMemberController(callerActorId, resourceId)` (exported from `index.js`)

**Source → Sink chain:**
```
Attacker calls old removeTeamMemberController(callerActorId, targetResourceId)
→ fetchResourceByIdDAL(targetResourceId)
→ vportActorId = resource.owner_actor_id 
    ?? getVportActorIdByProfileIdDAL({ profileId: resource.profile_id })
                                                [legacy resolution path]
→ assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: vportActorId          [resolved via actor_owners canonical read]
  })
→ Even if profile_id mapping is stale, assertActorOwnsVportActorController
  reads actor_owners (canonical) — attacker must ACTUALLY own the resolved VPORT
→ If attacker owns the resolved VPORT: delete proceeds (but it's their own VPORT resource)
→ If attacker does not: THROWS "Actor does not own this vport actor."
```

**Result:** **PARTIAL** — The legacy `profile_id` fallback introduces a resolution ambiguity, but the final ownership check reads `actor_owners` (canonical). A stale `profiles.actor_id` → `actor_owners` mapping could theoretically resolve to a VPORT different from the one the resource belongs to, but the null guard prevents null-target attacks and the final gate is canonical.

**Severity:** LOW — null guard present; canonical ownership gate at final step

---

### BW-TEAM-NEW-001 — `index.js` Exports ALL DALs + Controllers — Module Boundary Violation

**New finding — not in VENOM findings list**

**Attack vector:** Any module importing from `cards/team/index.js` gets direct access to all DAL write functions, bypassing controller ownership gates entirely

**Evidence:**
```javascript
// cards/team/index.js (full content)
export * from "./dal/vportTeam.read.dal";
export * from "./dal/vportTeamInvite.read.dal";
export * from "./dal/vportTeam.write.dal";       // insertTeamMemberDAL, deleteTeamMemberByIdDAL, etc.
export * from "./dal/vportTeamInvite.write.dal";  // acceptTeamRequestDAL, declineTeamRequestDAL, etc.
export * from "./controller/vportTeam.controller";
export * from "./controller/vportTeamAccess.controller";
export * from "./controller/vportTeamInvite.controller";
```

**Architecture violation:** §5.3 Adapter Contract — "Adapters must never export: DAL, models, controllers"

**Exploitable exported DAL writes:**
- `insertTeamMemberDAL({ profileId, ownerActorId, name })` — no auth check in DAL; only RLS
- `insertLinkedTeamMemberDAL({ profileId, ownerActorId, memberActorId, name, role })` — no auth
- `deleteTeamMemberByIdDAL(resourceId)` — hard DELETE; only RLS
- `deleteTeamResourceDAL(resourceId)` — hard DELETE; only RLS
- `updateTeamMemberRoleDAL({ resourceId, meta, role })` — no ownership; only RLS
- `setTeamMemberActiveDAL({ resourceId, isActive })` — no ownership; only RLS
- `acceptTeamRequestDAL(resourceId, currentMeta)` — no ownership; no status guard
- `declineTeamRequestDAL(resourceId, currentMeta)` — no ownership; no status guard

**Source → Sink chain for highest-risk DAL bypass:**
```
Attacker imports deleteTeamMemberByIdDAL from cards/team/index.js
→ deleteTeamMemberByIdDAL(targetResourceId)
→ vportSchema.from("resources").delete().eq("id", targetResourceId)
→ RLS resources_delete_owner: checks auth.uid() owns the resource's VPORT via actor_owners
→ IF attacker owns target resource's VPORT: delete succeeds (no controller layer at all)
→ IF attacker does not own it: RLS blocks
```

For an attacker who is the VPORT owner, bypassing the controller layer means:
- `removeTeamMemberController` safety checks are skipped (owner-remains guard, self-remove guard)
- A VPORT owner could delete the last owner row or delete themselves without the guards firing
- Only the DB-level DELETE RLS applies — the application-level owner-remains invariant is unenforceable

**ESM Name Conflict — both controllers export `removeTeamMemberController`:**
```javascript
// vportTeam.controller.js:115 — signature: (callerActorId, resourceId)
export async function removeTeamMemberController(callerActorId, resourceId)

// vportTeamAccess.controller.js:130 — signature: (actorId, { resourceId }, callerActorId)
export async function removeTeamMemberController(actorId, { resourceId }, callerActorId)
```
`index.js` does `export * from` both. In ESM, two `export *` statements exporting the same name create an ambiguous re-export — the name is effectively not exported from the module, or the behavior is bundler-dependent. Callers importing `removeTeamMemberController` from `cards/team` may get either implementation or a `undefined` export.

**Result:** **BYPASSED** (architecture + defense-in-depth)

The controller-layer safety invariants (owner-remains, self-remove guard) are bypassable for the VPORT owner themselves via DAL direct access. External attackers are still blocked by RLS. The ESM name conflict creates non-deterministic behavior for any consumer importing `removeTeamMemberController` from the card boundary.

**Severity:** HIGH (architecture) / MEDIUM (security — owner-layer invariant bypass; external attackers blocked by RLS)

---

## BLACKWIDOW SCENARIO SUMMARY TABLE

| ID | VENOM Finding | Attack Vector | Gates Present | Result | Severity |
|---|---|---|---|---|---|
| BW-TEAM-001 | VENOM-TEAM-001 | Direct call to unguarded `getTeamMembersController` | RLS select_public (allows read) | PARTIAL | MEDIUM |
| BW-TEAM-002 | VENOM-TEAM-002 | Wrong `viewerActorId` in search bypasses privacy | No privacy gate for session user | PARTIAL | MEDIUM |
| BW-TEAM-003 | VENOM-TEAM-004 | Cross-VPORT resourceId delete | RLS delete_owner | BLOCKED | LOW |
| BW-TEAM-004a | ELEK-001 verified | Invite token replay | Controller status pre-check + ELEK-001 atomic guard | BLOCKED | N/A |
| BW-TEAM-004b | VENOM-TEAM-004 | Concurrent accept race on `acceptTeamRequestController` | Controller pre-check (no DAL atomic guard) | PARTIAL | LOW |
| BW-TEAM-005 | VENOM-TEAM-005 | Stale `owner_user_id` surfaces wrong eligible barbers | Final ownership gate is canonical | PARTIAL | LOW |
| BW-TEAM-006 | VENOM-TEAM-006 | Identity import mismatch stale actorId on switch | Controller reads DB (canonical) | PARTIAL | LOW |
| BW-TEAM-007 | VENOM-TEAM-007 | Old `removeTeamMemberController` profile_id fallback | Null guard + assertActorOwnsVportActorController | PARTIAL | LOW |
| BW-TEAM-NEW-001 | NEW | `index.js` DAL export — bypass controller safety invariants | RLS only (no controller layer) | BYPASSED | HIGH (arch) / MEDIUM (sec) |

---

## SUCCESSFUL EXPLOIT CHAINS

### CHAIN-1 (MEDIUM): Team Data Enumeration via Unguarded Controller
```
Precondition: any authenticated session + target VPORT actorId (public)
Path: import getTeamMembersController from cards/team → call with targetActorId
Result: full team member list including meta (roles, pending state, requested_by_actor_id)
Blocked by: nothing (public RLS allows read)
```

### CHAIN-2 (MEDIUM): Session Privacy Bypass During Team Search
```
Precondition: VPORT owner with block relationships between user-identity and candidate
Path: open AddTeamMemberSheet → search → candidates filtered by VPORT's graph not user's
Result: blocked actors surface in search results
Blocked by: nothing (wrong identity, no filter)
```

### CHAIN-3 (MEDIUM): Owner-Remains Guard Bypass via DAL Direct Access
```
Precondition: VPORT owner; import deleteTeamMemberByIdDAL from index.js
Path: call deleteTeamMemberByIdDAL(lastOwnerResourceId)
Result: last owner row deleted; no owner-remains invariant check fires
Blocked by: RLS delete_owner allows (owner is deleting their own resource); application guard bypassed
```

---

## FAILED EXPLOIT CHAINS

| Chain | Reason Blocked |
|---|---|
| Non-owner deletes team resource | RLS resources_delete_owner rejects via actor_owners |
| Invite token replay | ELEK-001 atomic DAL guard + controller status pre-check |
| `declineTeamRequestController` string-equality bypass | ELEK-002: assertActorOwnsVportActorController required on invited barber path |
| Cross-VPORT resource delete | RLS blocks + controller ownership against passed `actorId` |
| VPORT-kind actor calling assertActorOwnsVportActorController | Kind gate rejects: "Only actor owners can manage this booking resource." |
| Null `owner_actor_id` exploitation in old removeTeamMemberController | Null guard throws before assertActorOwnsVportActorController |

---

## BLAST RADIUS SUMMARY

| Finding | Who Is Affected |
|---|---|
| BW-TEAM-001 | Any VPORT's team members enumerable by any authenticated user |
| BW-TEAM-002 | Session user's privacy controls bypassed during team search |
| BW-TEAM-003 | Single VPORT (BLOCKED) |
| BW-TEAM-004b | Single request resource (idempotent effect; low blast) |
| BW-TEAM-005 | VPORT's eligible barber list (wrong notifications; bounded) |
| BW-TEAM-006 | The switching user only |
| BW-TEAM-007 | Single team resource (bounded) |
| BW-TEAM-NEW-001 | Any VPORT whose owner bypasses controllers via direct DAL import |

---

## BLACKWIDOW FINAL SEVERITY TABLE

| Finding | Severity | Exploitability | Blocked? |
|---|---|---|---|
| BW-TEAM-NEW-001 (index.js DAL export) | HIGH (arch) / MEDIUM (sec) | MEDIUM | PARTIAL — RLS only |
| BW-TEAM-001 (unguarded getTeamMembersController) | MEDIUM | LOW-MEDIUM | PARTIAL |
| BW-TEAM-002 (wrong viewerActorId in search) | MEDIUM | LOW | PARTIAL |
| BW-TEAM-007 (profile_id fallback) | LOW | LOW | PARTIAL |
| BW-TEAM-004b (accept race, no DAL atomic guard) | LOW | LOW | PARTIAL |
| BW-TEAM-005 (legacy owner_user_id) | LOW | LOW | PARTIAL |
| BW-TEAM-006 (identity import mismatch) | LOW | LOW | PARTIAL |
| BW-TEAM-003 (cross-VPORT delete) | LOW | NONE | BLOCKED |
| BW-TEAM-004a (invite replay) | N/A | NONE | BLOCKED |

---

---

# ELEKTRA — SOURCE-TO-SINK PATCH ADVISORY

**Basis:** BLACKWIDOW scenario results + VENOM-TEAM findings
**Mode:** Advisory only — no code changes applied
**Patch queue ordered by risk**

---

## ELEK-TEAM-001 — Clean `index.js` Module Boundary (HIGH)

**Source:**
```
cards/team/index.js — lines 1–11
```

**Trust boundary violated:** Module boundary exports DAL functions and controllers — architecture contract §5.3

**Sink (highest-risk):**
```
deleteTeamMemberByIdDAL(resourceId)           → hard DELETE bypassing owner-remains guard
insertTeamMemberDAL(...)                      → INSERT bypassing all controller validation
acceptTeamRequestDAL / declineTeamRequestDAL  → state transitions bypassing status guards
```

**Impact:** VPORT owner can bypass application-layer invariants (owner-remains, self-remove guard, status pre-checks). External attackers blocked by RLS. ESM name conflict for `removeTeamMemberController`.

**Recommended surgical fix:**
```javascript
// cards/team/index.js — AFTER fix

// Hooks (public surface — allowed per §5.3)
export * from "./hooks/useVportTeam";
export * from "./hooks/useVportTeamAccess";
export * from "./hooks/useBarberTeamRequests";

// Components (public surface — allowed per §5.3)
export * from "./components/team/TeamMemberCards";
export * from "./components/team/AddTeamMemberSheet";
export * from "./components/team/ConfirmRemoveModal";

// Screens (public surface — allowed per §5.3)
export { VportDashboardTeamScreen, default } from "./VportDashboardTeamScreen";
export { default as BarberTeamRequestsScreen } from "./BarberTeamRequestsScreen";

// REMOVED: all DAL exports (lines 1–5)
// REMOVED: all controller exports (lines 7–10)
```

**Files touched:** `cards/team/index.js`

**Tests required (SPIDER-MAN):**
- Audit all callers of `cards/team` (or its adapter) to confirm none rely on DAL/controller direct imports
- `grep -r "from.*cards/team" apps/VCSM/src --include="*.js" --include="*.jsx"` to find consumers
- Verify no test mocks reference `cards/team/index.js` for DAL/controller imports

**CARNAGE required:** No

**Rollback:** Revert `index.js` to full exports; low risk since RLS still protects DB

---

## ELEK-TEAM-002 — Fix `searchCandidates` Wrong `viewerActorId` (MEDIUM)

**Source:**
```
hooks/useVportTeamAccess.js — line 84-86
```

**Current code:**
```javascript
const searchCandidates = useCallback(async (query) => {
  return searchTeamCandidatesController({ query, viewerActorId: actorId });  // BUG
}, [actorId]);
```

**Trust boundary:** Session user's privacy/block state must apply to team candidate search results

**Sink:** `searchActorsAdapter({ query, limit: 12, viewerActorId: actorId })` — VPORT social graph used, not session user's

**Impact:** Session user's block relationships don't filter search; blocked actors may surface as candidates

**Recommended surgical fix:**
```javascript
const searchCandidates = useCallback(async (query) => {
  return searchTeamCandidatesController({ query, viewerActorId: sessionActorId });  // FIX
}, [sessionActorId]);
```

`sessionActorId` is already defined on line 32 of `useVportTeamAccess.js` (`identity?.actorId ?? null`).

**Files touched:** `hooks/useVportTeamAccess.js` — line 85 (value) + line 86 (dep array)

**Tests required (SPIDER-MAN):**
- Unit test: `searchCandidates` calls `searchTeamCandidatesController` with `viewerActorId: sessionActorId` (not `actorId`)
- Regression: confirm `actorId` is not inadvertently used after the change

**CARNAGE required:** No

**Rollback:** Single-line revert

---

## ELEK-TEAM-003 — Add Ownership Gate to `getTeamMembersController` (MEDIUM)

**Source:**
```
controller/vportTeam.controller.js — lines 23-27
```

**Current code:**
```javascript
export async function getTeamMembersController(actorId) {
  if (!actorId) return [];
  const profileId = await resolveProfileId(actorId);
  return fetchTeamMembersByProfileId(profileId);
}
```

**Trust boundary:** Unguarded team member read; callable by any authenticated user for any VPORT

**Sink:** `fetchTeamMembersByProfileId` → `vport.resources` SELECT (public RLS allows read)

**Impact:** Team member meta (roles, pending status, requested_by_actor_id) enumerable by any authenticated caller

**Recommended surgical fix:**
```javascript
export async function getTeamMembersController(actorId, callerActorId) {
  if (!actorId) return [];
  if (!callerActorId) throw new Error("getTeamMembersController: callerActorId required");
  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: actorId,
  });
  const profileId = await resolveProfileId(actorId);
  return fetchTeamMembersByProfileId(profileId);
}
```

**Secondary fix — `useVportTeam.js` call site:**
```javascript
// line 26: getTeamMembersController(actorId)  →  getTeamMembersController(actorId, callerActorId)
```

**Note:** Consider whether `useVportTeam` should be deprecated in favor of `useVportTeamAccess` (which already uses the correctly-gated `getTeamAccessController`). If deprecated, remove from `index.js` exports entirely rather than fixing it.

**Files touched:** `controller/vportTeam.controller.js`, `hooks/useVportTeam.js`

**Tests required (SPIDER-MAN):**
- `getTeamMembersController` throws when `callerActorId` is null
- `getTeamMembersController` calls `assertActorOwnsVportActorController` before profileId resolution
- Non-owner caller receives rejection

**CARNAGE required:** No

---

## ELEK-TEAM-004 — Fix Identity Import Inconsistency (MEDIUM)

**Source:**
```
BarberTeamRequestsScreen.jsx — line 4
hooks/useVportTeam.js — line 3
hooks/useVportTeamAccess.js — line 3
```

**Current (non-canonical):**
```javascript
import { useIdentity } from "@/state/identity/identityContext";
```

**Canonical (via adapter):**
```javascript
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
```

**Trust boundary:** Architecture contract §1.3 (identity surface) + §5.4 (adapter import rule)

**Impact:** If the adapter adds switching guards or normalization, these three files bypass those protections. During actor switch, stale `actorId` could briefly be used for controller calls before the new identity resolves.

**Recommended surgical fix:** Replace the import line in all three files. No behavioral change unless the adapter applies switching normalization.

**Files touched:** 3 files — 1-line change each

**Tests required (SPIDER-MAN):** None specific; verify no import resolution errors after change

**CARNAGE required:** No

---

## ELEK-TEAM-005 — Add DAL-Level Atomic Guard to `acceptTeamRequestDAL` (LOW)

**Source:**
```
dal/vportTeamInvite.write.dal.js — lines 32-50 (acceptTeamRequestDAL)
```

**Current code:**
```javascript
.update({ is_active: true, meta: { ...currentMeta, status: "linked", accepted_at: ... } })
.eq("id", resourceId)
.select(COLS)
.single();
```

**Gap:** No `.eq("meta->>status", "pending_acceptance")` guard (unlike `acceptTeamInviteByActorDAL` which has ELEK-001)

**Impact:** Concurrent accepts both succeed (idempotent outcome); consistency gap vs. the hardened invite path

**Recommended surgical fix:**
```javascript
.update({ is_active: true, meta: { ...(currentMeta || {}), status: "linked", accepted_at: new Date().toISOString() } })
.eq("id", resourceId)
.eq("meta->>status", "pending_acceptance")  // ADD — atomic state guard, matches ELEK-001 pattern
.select(COLS)
.maybeSingle();   // maybeSingle() — null if race lost

// Add null check:
if (!data) throw new Error("request is no longer available");
```

**Files touched:** `dal/vportTeamInvite.write.dal.js` — `acceptTeamRequestDAL` only

**Tests required (SPIDER-MAN):** Concurrent accept test (mirrors ELEK-001 test pattern in existing test file)

**CARNAGE required:** No

---

## ELEK-TEAM-006 — Migrate `findEligibleBarberActorIdsDAL` Step 3a from `owner_user_id` (LOW)

**Source:**
```
dal/vportTeam.read.dal.js — lines 48-68 (Step 3a)
```

**Current code:**
```javascript
const { data: barberProfiles } = await vportSchema
  .from("profile_categories")
  .select("profile:profiles!inner(actor_id, owner_user_id, is_active)")
  .eq("category_key", "barber")
  .eq("is_primary", true)
  .eq("profile.is_active", true)
  .in("profile.owner_user_id", userIds);  // ← legacy identity model
```

**Trust boundary:** Architecture contract §1.4 Owner Meaning Rule — ownership must use `actor_owners`, not `owner_user_id`

**Impact:** If `profiles.owner_user_id` is stale, wrong actors surface as eligible barber candidates; wrong notification sent

**Recommended fix direction:**
Replace Step 3a with an `actor_owners` lookup:
- Query `vc.actor_owners` for `actor_owners WHERE user_id IN (followerUserIds)`
- Get `actor_id` values from those rows
- Filter to barber VPORTs by joining `vport.profile_categories` on `actor_id`

**Files touched:** `dal/vportTeam.read.dal.js` — Step 3a only

**Tests required (SPIDER-MAN):** Unit test for correct barber resolution via actor_owners; stale owner_user_id scenario

**CARNAGE required:** No migration; DAL query change only

---

## ELEK-TEAM-007 — Resolve Duplicate `removeTeamMemberController` Export (LOW)

**Source:**
```
index.js — lines 7-10 (after ELEK-TEAM-001 removes DAL/controller exports, this resolves automatically)
```

**Current conflict:**
- `vportTeam.controller.js` exports `removeTeamMemberController(callerActorId, resourceId)`
- `vportTeamAccess.controller.js` exports `removeTeamMemberController(actorId, { resourceId }, callerActorId)`
- Both are re-exported via `export *` in `index.js`

**Impact:** ESM ambiguous re-export; bundler-dependent behavior; callers get inconsistent function signatures

**Recommended fix:** If ELEK-TEAM-001 is applied (remove all controller exports from `index.js`), this conflict is automatically resolved — neither is exported at the module boundary. Callers can only reach these through the hooks (which import from the correct controller file directly).

**Files touched:** Resolved by ELEK-TEAM-001

**Tests required:** None additional

**CARNAGE required:** No

---

## ELEKTRA PATCH QUEUE — ORDERED BY RISK

| ID | Finding | Risk | Files | CARNAGE? | SPIDER-MAN? |
|---|---|---|---|---|---|
| ELEK-TEAM-001 | index.js DAL + controller exports | HIGH/MEDIUM | `index.js` | No | Yes (caller audit) |
| ELEK-TEAM-002 | Wrong viewerActorId in searchCandidates | MEDIUM | `hooks/useVportTeamAccess.js` | No | Yes |
| ELEK-TEAM-003 | Add ownership gate to getTeamMembersController | MEDIUM | `controller/vportTeam.controller.js`, `hooks/useVportTeam.js` | No | Yes |
| ELEK-TEAM-004 | Fix identity import inconsistency | MEDIUM (arch) | 3 files, 1 line each | No | No |
| ELEK-TEAM-005 | Atomic state guard for acceptTeamRequestDAL | LOW | `dal/vportTeamInvite.write.dal.js` | No | Yes |
| ELEK-TEAM-006 | Migrate Step 3a from owner_user_id | LOW | `dal/vportTeam.read.dal.js` | No | Yes |
| ELEK-TEAM-007 | Duplicate removeTeamMemberController | LOW | Resolved by ELEK-TEAM-001 | No | No |

**Safest first implementation batch (no interdependencies):**
1. ELEK-TEAM-002 — surgical 2-line fix, zero risk, improves privacy correctness immediately
2. ELEK-TEAM-004 — 3 files, 1-line change each, cosmetic until adapter applies switching guards
3. ELEK-TEAM-001 — requires caller audit first (SPIDER-MAN); clean module boundary

**Second batch (after caller audit):**
4. ELEK-TEAM-003 — depends on ELEK-TEAM-001 (once callers are audited); may deprecate useVportTeam
5. ELEK-TEAM-005 — isolated DAL hardening; mirrors existing ELEK-001 pattern

**Third batch (architecture migration):**
6. ELEK-TEAM-006 — DAL query rewrite; requires understanding of actor_owners schema; ARCHITECT input recommended

---

---

# THOR GATE ASSESSMENT

**Branch:** `vport-booking-feed-security-updates`
**Assessment date:** 2026-05-27

## What Is Confirmed Secure

| Path | Confidence | Basis |
|---|---|---|
| Screen ownership gate (both screens) | HIGH | Code + useVportOwnership verified |
| All write mutations via screen path | HIGH | assertActorOwnsVportActorController on every mutation |
| Invite accept/decline (ELEK-001, ELEK-002) | HIGH | Controller + DAL atomic guard verified; test coverage |
| vport.resources RLS (insert/update/delete) | HIGH | CARNAGE migration audit verified |
| `getTeamAccessController` ownership | HIGH | Code read confirmed gate |

## Blockers — Must Fix Before Ship

| Blocker | Finding | Why Blocking |
|---|---|---|
| `index.js` exports DALs + controllers | BW-TEAM-NEW-001 / ELEK-TEAM-001 | Owner-level invariants (owner-remains, self-remove) bypassed via DAL direct access; ESM name conflict creates non-deterministic behavior at module boundary |

## Fixes Recommended Before Ship (Non-Blocking But High Value)

| Fix | Finding | Priority |
|---|---|---|
| Fix `searchCandidates` viewerActorId | BW-TEAM-002 / ELEK-TEAM-002 | MEDIUM — 2-line fix; low risk |
| Fix identity import inconsistency | BW-TEAM-006 / ELEK-TEAM-004 | MEDIUM — cosmetic but architecture contract compliance |

## Can Ship With Known Gaps (Post-Ship Backlog)

| Finding | Rationale | Post-Ship? |
|---|---|---|
| `getTeamMembersController` no ownership gate | Not used by primary screen path; old hook still exported; team data is public-read via RLS | YES — add gate to old controller or deprecate useVportTeam |
| `acceptTeamRequestDAL` no atomic guard | Controller pre-check provides partial protection; idempotent outcome if race occurs | YES — harden to match ELEK-001 pattern |
| `findEligibleBarberActorIdsDAL` legacy owner_user_id | No auth bypass; stale data only; requires actor_owners schema knowledge | YES — architecture migration |
| Soft-delete / audit trail for team resources | No active exploit; operational governance | YES — CARNAGE migration |

## THOR RELEASE VERDICT

```
STATUS:         CONDITIONAL SHIP
BLOCKER COUNT:  1 (ELEK-TEAM-001 — index.js module boundary cleanup)
RECOMMENDED:    Apply ELEK-TEAM-001 + ELEK-TEAM-002 + ELEK-TEAM-004 before merge
CONDITIONAL ON: index.js cleaned of DAL/controller exports
```

---

---

# TICKET-0003 UPDATE

## New Status

**Phase 3:** COMPLETE (all 5 security documentation passes complete)
**Phase 3 — Team card follow-up:** COMPLETE (BLACKWIDOW + ELEKTRA pass complete)
**Overall status:** SECURITY_FINDINGS_ACTIONABLE

## Confirmed Findings (Validated by BLACKWIDOW)

| ID | Original | BLACKWIDOW Result | Severity | Action |
|---|---|---|---|---|
| VENOM-TEAM-001 | getTeamMembersController no ownership gate | PARTIAL (screen path safe; old hook + index.js export expose unguarded path) | MEDIUM | ELEK-TEAM-003 |
| VENOM-TEAM-002 | Wrong viewerActorId in searchCandidates | PARTIAL (privacy filter bypass) | MEDIUM | ELEK-TEAM-002 |
| VENOM-TEAM-003 | vport.resources RLS unverified | RESOLVED by CARNAGE | — | Closed |
| VENOM-TEAM-004 | Hard delete, no audit trail | PARTIAL (BW-TEAM-003 BLOCKED; BW-TEAM-004b PARTIAL — no DAL atomic guard) | LOW | ELEK-TEAM-005 + CARNAGE backlog |
| VENOM-TEAM-005 | Legacy owner_user_id in eligible barbers | PARTIAL (wrong data, no auth bypass) | LOW | ELEK-TEAM-006 |
| VENOM-TEAM-006 | Inconsistent identity imports | PARTIAL (bounded to switching user) | LOW/MEDIUM | ELEK-TEAM-004 |
| VENOM-TEAM-007 | removeTeamMemberController profile_id fallback | PARTIAL (null guard + canonical final gate) | LOW | Document + monitor |
| VENOM-TEAM-008 | Test coverage gaps | CONFIRMED — no tests for access controller, getTeamMembersController, search | LOW | SPIDER-MAN |

## New Finding (Not in VENOM Findings)

| ID | Description | Severity | Action |
|---|---|---|---|
| BW-TEAM-NEW-001 | `index.js` exports ALL DALs + ALL controllers; ESM name conflict for removeTeamMemberController | HIGH (arch) / MEDIUM (sec) | ELEK-TEAM-001 (BLOCKER) |

## Rejected False Positives

| Original Concern | Disposition |
|---|---|
| VENOM-TEAM-003 (RLS unverified) | RESOLVED — CARNAGE confirmed 6 actor-based policies via migrations 20260515010000, 20260515020000, 20260527020000 |
| Invite replay via `acceptBarbershopInviteController` | BLOCKED — ELEK-001 + controller state guard; two-layer protection |
| VPORT-kind actor bypassing assertActorOwnsVportActorController | BLOCKED — ELEK-004 kind guard fires before self-shortcut; kind === "user" required |
| Non-owner delete via cross-VPORT resourceId | BLOCKED — RLS resources_delete_owner rejects at DB layer |

## Next Actions

**For ELEKTRA (code fixes — ordered):**
1. `ELEK-TEAM-001` — Clean `index.js` module boundary (BLOCKER for ship)
2. `ELEK-TEAM-002` — Fix `searchCandidates` viewerActorId (2-line fix)
3. `ELEK-TEAM-004` — Fix identity import inconsistency (3 files, 1-line each)
4. `ELEK-TEAM-003` — Add ownership gate to `getTeamMembersController`
5. `ELEK-TEAM-005` — Add atomic state guard to `acceptTeamRequestDAL`
6. `ELEK-TEAM-006` — Migrate Step 3a from `owner_user_id` to `actor_owners`

**For SPIDER-MAN (tests):**
- Caller audit: `grep -r "from.*cards/team"` to confirm no modules import DAL/controllers from card boundary
- `getTeamMembersController` ownership gate tests
- `getTeamAccessController` mutation tests (all 4 controllers in `vportTeamAccess.controller.js`)
- `searchTeamCandidatesController` viewerActorId correctness test
- `acceptTeamRequestDAL` concurrent accept test (mirrors ELEK-001 pattern)

**For CARNAGE (migrations — backlog):**
- `vport.resources` soft-delete columns: `deleted_at timestamptz`, `deleted_by_actor_id uuid`
- Remove legacy `owner_user_id` branch from `actor_can_manage_profile` / `actor_can_view_profile` DB functions (CARNAGE comment in `assertActorOwnsVportActor.controller.js:4`)

**For ARCHITECT (follow-up):**
- Evaluate deprecating `useVportTeam` + `vportTeam.controller.js` now that `useVportTeamAccess` provides the canonical owner-gated path
- Confirm `actor_owners` schema for ELEK-TEAM-006 migration
