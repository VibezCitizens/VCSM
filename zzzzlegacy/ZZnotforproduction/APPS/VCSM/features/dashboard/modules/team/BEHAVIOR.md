# Dashboard Module Behavior Contract — team

Status: ACTIVE

Module: team

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - TEAM-FIND-003
  - VENOM-TEAM-008
  - TEAM-PROFILE-READ-001
- Patched Findings:
  - TEAM-DAL-SCOPE-001
- Security Review Status:
  - VENOM: COMPLETE
  - ELEKTRA: COMPLETE
  - BLACKWIDOW: COMPLETE

Reason:
`team` has source-verified ownership gates for the primary owner management screen, linked member mutations, named staff mutations, and barber invite/request workflows. Direct update/delete DALs now receive profile or member-actor scope as defense-in-depth. Current source also routes the public barbershop profile team tab through the owner-gated `useVportTeam` hook, so customers/non-owners can receive a team load error instead of active linked barbers. It remains THOR CAUTION because `vport.resources` RLS is still marked `NEEDS_VERIFICATION`, DAL write functions remain direct table write surfaces, the public profile read behavior needs product/security decision, and SPIDER-MAN coverage is partial for owner access/member mutation paths.

---

## 1. User Goal

The `team` dashboard module lets a VPORT owner manage VPORT staff membership. It supports linked actor members, named staff records, role assignment, active/inactive state changes, removal, candidate search, barbershop-to-barber team requests, and a barber VPORT inbox for accepting or declining pending team requests.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner actor | View and manage team members for its own VPORT; add linked actors; update member roles; activate/deactivate members; remove members; send barber team requests. | Must pass `assertActorOwnsVportActorController` against the target VPORT actor before owner mutations. |
| Session user owning a barber VPORT | View pending team requests for that barber VPORT; accept or decline requests. | Must prove ownership of the barber VPORT through `actor_owners`; harvested resource ids are not enough. |
| Linked member actor | Appears as a team resource with `member_actor_id`; may receive invite/request flows. | Cannot be added as the same actor as the owner VPORT; cannot bypass owner management controls. |
| Named staff member | Appears as a `vport.resources` staff row without `member_actor_id`. | Has no platform actor permissions by itself. |
| Public/customer profile viewer | Current UI has a barbershop profile Team tab that attempts to list active linked barbers through `useVportTeam`. | Current controller requires owner access, so public/non-owner viewers can hit a load error instead of seeing the roster. |
| Non-owner actor | No team management access. | Team screen blocks with owner-only UI; controllers reject writes without ownership. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/team`
- `/actor/:actorId/dashboard/team-requests`

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/VportDashboardTeamScreen.jsx`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/BarberTeamRequestsScreen.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView.jsx`

### Hooks

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/hooks/useVportTeamAccess.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/hooks/useVportTeam.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/hooks/useBarberTeamRequests.js`

### Controllers

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/controller/vportTeamAccess.controller.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/controller/vportTeam.controller.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/controller/vportTeamInvite.controller.js`

### DALs

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/dal/vportTeam.read.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/dal/vportTeam.write.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.read.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.write.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportProfile.read.dal`

### RPCs

- No RPC is used by the current team module source.

### Edge Functions

- No dashboard team edge function was found in the module source path.

### Engine Dependencies

- Booking adapter ownership controller: `assertActorOwnsVportActorController`.
- Actor search adapter: `searchActorsAdapter`.
- Hydration engine: actor summary hydration for team members and request cards.
- Notifications adapter: `publishVcsmNotification` for team invite notifications.

### Ownership Gates

- `VportDashboardTeamScreen` uses `useVportOwnership` before rendering team management UI.
- `BarberTeamRequestsScreen` uses `useVportOwnership` before loading barber team requests.
- `VportBarberShopTeamView` currently imports `useVportTeam` through the VPORT dashboard adapter; `getTeamMembersController` now requires `callerActorId` and asserts ownership before reading team members.
- `getTeamAccessController`, linked member add/update/status/remove, named staff add, send request, legacy remove, accept request, decline request, pending request load, and barbershop invite accept all use `assertActorOwnsVportActorController` on their required owner path.

---

## 4. Happy Paths

### HP-001

BEH-DASH-team-001

Preconditions:

- Viewer is signed in.
- Viewer owns the target VPORT actor.

Flow:

Owner opens `/actor/:actorId/dashboard/team`.
`VportDashboardTeamScreen` reads route `actorId`.
`useVportOwnership` verifies ownership.
`useVportTeamAccess` calls `getTeamAccessController`.
Controller asserts actor ownership, resolves the VPORT profile, and reads team members by profile id.
Hook normalizes rows and hydrates linked actor summaries.

Expected Result:

Owner sees active, pending, inactive, and declined team member sections.

Data Changes:

None.

---

### HP-002

BEH-DASH-team-002

Preconditions:

- Viewer owns the target VPORT actor.
- Candidate actor exists and is not the same as the target VPORT actor.
- Requested role is `owner`, `manager`, or `staff`.

Flow:

Owner opens Add Team Member sheet.
Sheet calls `searchCandidates`.
`useVportTeamAccess` calls `searchTeamCandidatesController` with the session actor id as `viewerActorId`.
Owner selects a candidate and role.
Hook calls `addTeamMemberController`.
Controller asserts ownership, resolves profile id, checks duplicate active/pending membership, and calls `insertLinkedTeamMemberDAL`.

Expected Result:

Linked team member is inserted and appears in the local member list.

Data Changes:

- Insert into `vport.resources` with `resource_type: "staff"`, `is_active: true`, `member_actor_id`, and `meta.status: "linked"`.

---

### HP-003

BEH-DASH-team-003

Preconditions:

- Viewer owns the target VPORT actor.
- Named staff name is non-empty.

Flow:

Legacy/team hook calls named staff `addTeamMemberController`.
Controller validates caller, actor id, and name.
Controller asserts ownership and resolves profile id.
Controller calls `insertTeamMemberDAL`.

Expected Result:

Named staff resource is inserted.

Data Changes:

- Insert into `vport.resources` with `resource_type: "staff"` and no `member_actor_id`.

---

### HP-004

BEH-DASH-team-004

Preconditions:

- Viewer owns the target VPORT actor.
- Target team resource exists.
- Requested role is valid.
- If demoting an owner, at least one other active owner remains.

Flow:

Owner edits a member role.
`TeamMemberCard` calls `onUpdateRole`.
`useVportTeamAccess` calls `updateTeamMemberRoleController`.
Controller asserts ownership, resolves profile id, reads current team rows, validates target, checks last-owner invariant, and calls `updateTeamMemberRoleDAL`.

Expected Result:

Member role updates in the local list.

Data Changes:

- Update `vport.resources.meta.role`.

---

### HP-005

BEH-DASH-team-005

Preconditions:

- Viewer owns the target VPORT actor.
- Target team resource exists.
- Requested status is `active` or `inactive`.
- Target is not the owner acting on themselves.
- If deactivating an owner, at least one other active owner remains.

Flow:

Owner toggles member status.
`TeamMemberCard` calls `onSetStatus`.
`useVportTeamAccess` calls `setTeamMemberStatusController`.
Controller asserts ownership, resolves profile id, reads current team rows, validates target, applies self-action and last-owner guards, and calls `setTeamMemberActiveDAL`.

Expected Result:

Member status updates in the local list.

Data Changes:

- Update `vport.resources.is_active`.

---

### HP-006

BEH-DASH-team-006

Preconditions:

- Viewer owns the target VPORT actor.
- Target team resource exists.
- Target is not the owner acting on themselves.
- Removing target does not remove the last active owner.

Flow:

Owner clicks remove.
`ConfirmRemoveModal` confirms the action.
`useVportTeamAccess` calls `removeTeamMemberController`.
Controller asserts ownership, resolves profile id, reads current team rows, validates self-action and last-owner invariants, and calls `deleteTeamMemberByIdDAL`.

Expected Result:

Team member is removed from the local list.

Data Changes:

- Delete from `vport.resources` by resource id.

---

### HP-007

BEH-DASH-team-007

Preconditions:

- Viewer owns the barbershop VPORT actor.
- Barber VPORT actor is eligible and not already an active/pending member.

Flow:

Owner sends a team request.
`sendTeamRequestController` validates caller, target shop actor, barber actor, and barber name.
Controller asserts ownership of the shop VPORT.
Controller resolves profile id and checks existing team resources.
Controller calls `insertTeamRequestDAL`.
Controller publishes `team_invite` notification to the barber VPORT actor.

Expected Result:

Pending staff resource is created and invite notification is sent.

Data Changes:

- Insert into `vport.resources` with `is_active: false`, `member_actor_id`, and `meta.status: "pending_acceptance"`.

---

### HP-008

BEH-DASH-team-008

Preconditions:

- Viewer owns the barber VPORT actor.
- Pending request exists for that barber VPORT.

Flow:

Barber owner opens `/actor/:actorId/dashboard/team-requests`.
Screen verifies ownership.
`useBarberTeamRequests` calls `getBarberTeamRequestsController`.
Controller asserts ownership of the barber VPORT and reads pending requests.
User accepts.
Hook calls `acceptTeamRequestController`.
Controller validates pending state, asserts ownership of `resource.member_actor_id`, and calls `acceptTeamRequestDAL`.

Expected Result:

Request is accepted and removed from the pending list.

Data Changes:

- Update `vport.resources.is_active` to true.
- Update `vport.resources.meta.status` to `linked`.
- Set `meta.accepted_at`.

---

### HP-009

BEH-DASH-team-009

Preconditions:

- Viewer owns the barber VPORT actor or owns the inviting shop VPORT actor.
- Pending request exists.

Flow:

User declines a request.
`useBarberTeamRequests` calls `declineTeamRequestController` with barber VPORT actor id, resource id, and session viewer actor id.
Controller validates pending state.
If declining as the invited barber, controller verifies session user ownership of the barber VPORT.
Otherwise, controller resolves and verifies shop VPORT ownership.
Controller calls `declineTeamRequestDAL`.

Expected Result:

Request is declined and removed from the pending list.

Data Changes:

- Update `vport.resources.meta.status` to `declined`.
- Set `meta.declined_at`.

---

### HP-010

BEH-DASH-team-010

Preconditions:

- Viewer owns the barbershop VPORT actor.
- Active linked team members exist with `meta.status: "linked"`.

Flow:

Owner opens the barbershop profile Team tab.
`VportBarberShopTeamView` calls `useVportTeam`.
`useVportTeam` calls `getTeamMembersController` with the session actor id.
Controller asserts ownership, resolves profile id, and reads team members.
Profile view filters to active linked members.

Expected Result:

Owner sees the active linked barber roster with owner profile actions.

Data Changes:

- None.

Current Note:

This same source path is also rendered for public/customer profile viewers, but the controller currently requires owner access. Non-owner/public read behavior is therefore documented as a failure path until product/security decides whether public active linked barber roster reads are allowed.

---

## 5. Failure Paths

### FP-001

BEH-DASH-team-101

Trigger:

Team dashboard opened by a non-owner.

Expected System Behavior:

`useVportOwnership` returns non-owner state.

Expected UI Behavior:

Screen renders `You can only manage your own team.`

Expected Logging:

No required logging found in source.

---

### FP-002

BEH-DASH-team-102

Trigger:

Team requests screen opened by unauthenticated or non-owner viewer.

Expected System Behavior:

Screen does not pass a barber VPORT actor id to `useBarberTeamRequests`.

Expected UI Behavior:

Screen renders `Sign in required.`

Expected Logging:

No required logging found in source.

---

### FP-003

BEH-DASH-team-103

Trigger:

Controller call omits required caller actor id, target actor id, member actor id, role, name, or resource id.

Expected System Behavior:

Controller or DAL throws before mutation.

Expected UI Behavior:

Hook or component stores/displays the thrown error.

Expected Logging:

No required logging found in source.

---

### FP-004

BEH-DASH-team-104

Trigger:

Owner tries to add themselves as a linked team member.

Expected System Behavior:

`addTeamMemberController` rejects with `Cannot add yourself as a team member.`

Expected UI Behavior:

Add sheet displays add error.

Expected Logging:

No required logging found in source.

---

### FP-005

BEH-DASH-team-105

Trigger:

Owner tries to add a linked actor that is already active or pending.

Expected System Behavior:

Controller rejects with `This actor is already a team member.`

Expected UI Behavior:

Add sheet displays add error.

Expected Logging:

No required logging found in source.

---

### FP-006

BEH-DASH-team-106

Trigger:

Owner tries to demote, deactivate, or remove the last active owner.

Expected System Behavior:

Controller rejects through `assertOwnerRemains`.

Expected UI Behavior:

Role/status/remove error is shown in the card or modal.

Expected Logging:

No required logging found in source.

---

### FP-007

BEH-DASH-team-107

Trigger:

Owner tries to deactivate or remove their own linked member record.

Expected System Behavior:

Controller rejects with self-action guard.

Expected UI Behavior:

Role/status/remove error is shown in the card or modal.

Expected Logging:

No required logging found in source.

---

### FP-008

BEH-DASH-team-108

Trigger:

Accept or decline targets a missing request or a request whose `meta.status` is no longer `pending_acceptance`.

Expected System Behavior:

Invite controller rejects before DAL write.

Expected UI Behavior:

Requests screen displays work error.

Expected Logging:

No required logging found in source.

---

### FP-009

BEH-DASH-team-109

Trigger:

Invited barber decline path receives no `viewerActorId`, or session user does not own the barber VPORT.

Expected System Behavior:

`declineTeamRequestController` rejects before `declineTeamRequestDAL`.

Expected UI Behavior:

Requests screen displays work error.

Expected Logging:

No required logging found in source.

---

### FP-010

BEH-DASH-team-110

Trigger:

Candidate search adapter fails.

Expected System Behavior:

`AddTeamMemberSheet` catches the search error and clears results.

Expected UI Behavior:

Search result list is empty.

Expected Logging:

No required logging found in source.

---

### FP-011

BEH-DASH-team-111

Trigger:

Public/customer viewer opens the barbershop profile Team tab.

Expected System Behavior:

Current `VportBarberShopTeamView` calls `useVportTeam`, which calls `getTeamMembersController`. The controller requires `callerActorId` and owner access, so unauthenticated viewers fail with `getTeamMembersController: callerActorId required` and signed non-owners fail the ownership assertion.

Expected UI Behavior:

Profile Team tab renders the hook error instead of the customer roster, even though the component contains customer-facing `Book` and `View` actions for listed barbers.

Expected Logging:

No required logging found in source.

Finding Links:

TEAM-PROFILE-READ-001.

---

## 6. Security Rules

### SEC-001

BEH-DASH-team-201

Rule:

Only owners of a VPORT actor may render the team management screen.

Enforcement Layer:

Screen: `VportDashboardTeamScreen`

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-002

BEH-DASH-team-202

Rule:

Team member reads and mutations must assert ownership of the target VPORT actor before reading or writing team resources.

Enforcement Layer:

Controller: `getTeamAccessController`, `getTeamMembersController`, linked/named add, role update, status update, remove controllers.

Current Status:

SOURCE VERIFIED.

Finding Links:

Prior `ELEK-TEAM-003` appears patched in current source because `getTeamMembersController` now requires `callerActorId` and asserts ownership.

---

### SEC-003

BEH-DASH-team-203

Rule:

Last active owner must remain after role, status, and remove mutations.

Enforcement Layer:

Controller: `vportTeamAccess.controller.js`

Current Status:

SOURCE VERIFIED.

Finding Links:

Needs SPIDER-MAN tests.

---

### SEC-004

BEH-DASH-team-204

Rule:

Owner self-deactivation, self-removal, and self-add as linked team member must be blocked.

Enforcement Layer:

Controller: `vportTeamAccess.controller.js`

Current Status:

SOURCE VERIFIED.

Finding Links:

Needs SPIDER-MAN tests.

---

### SEC-005

BEH-DASH-team-205

Rule:

Invite accept/decline flows must validate pending state before writing.

Enforcement Layer:

Controller and DAL: `vportTeamInvite.controller.js`, `vportTeamInvite.write.dal.js`

Current Status:

SOURCE VERIFIED and partially TEST COVERED.

Finding Links:

ELEK-001 regression coverage exists for barbershop invite accept.

---

### SEC-006

BEH-DASH-team-206

Rule:

Invited barber decline must verify session user ownership of the barber VPORT; string equality with `member_actor_id` is not enough.

Enforcement Layer:

Controller: `declineTeamRequestController`

Current Status:

SOURCE VERIFIED and TEST COVERED.

Finding Links:

ELEK-002 regression coverage exists.

---

### SEC-007

BEH-DASH-team-207

Rule:

Candidate search must use the session viewer actor id for privacy/block filtering.

Enforcement Layer:

Hook/controller: `useVportTeamAccess.searchCandidates`, `searchTeamCandidatesController`

Current Status:

SOURCE VERIFIED.

Finding Links:

Prior `ELEK-TEAM-002` appears patched in current source; needs SPIDER-MAN assertion.

---

### SEC-008

BEH-DASH-team-208

Rule:

`vport.resources` RLS for team resource reads/writes must be verified before THOR CLEAR.

Enforcement Layer:

Database RLS plus application controllers.

Current Status:

OPEN.

Finding Links:

TEAM-FIND-003.

---

### SEC-009

BEH-DASH-team-209

Rule:

If active linked barber roster reads are allowed on public profile pages, they must use a read-only path that returns only public-safe active linked rows and must not expose management/invite/pending/declined resource state.

Enforcement Layer:

Product/security decision plus read controller/DAL/RLS policy.

Current Status:

OPEN. Current source owner-gates the profile Team tab read path instead of exposing a public-safe roster read.

Finding Links:

TEAM-PROFILE-READ-001.

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-team-301

Invariant:

A non-owner must never manage another VPORT actor's team.

Current Status:

SOURCE VERIFIED.

Related Findings:

None.

Required Tests:

TESTREQ-DASH-team-001.

---

### MNH-002

BEH-DASH-team-302

Invariant:

The last active owner must never be demoted, deactivated, or removed.

Current Status:

SOURCE VERIFIED.

Related Findings:

VENOM-TEAM-008 test gap.

Required Tests:

TESTREQ-DASH-team-002.

---

### MNH-003

BEH-DASH-team-303

Invariant:

An owner must never deactivate or remove their own linked member record from the owner access controller.

Current Status:

SOURCE VERIFIED.

Related Findings:

VENOM-TEAM-008 test gap.

Required Tests:

TESTREQ-DASH-team-003.

---

### MNH-004

BEH-DASH-team-304

Invariant:

An invite/request must never be accepted or declined after it is no longer pending.

Current Status:

SOURCE VERIFIED and partially TEST COVERED.

Related Findings:

ELEK-001.

Required Tests:

TESTREQ-DASH-team-004.

---

### MNH-005

BEH-DASH-team-305

Invariant:

Notification-harvested actor/resource ids must never allow an attacker to decline a barber VPORT request.

Current Status:

SOURCE VERIFIED and TEST COVERED.

Related Findings:

ELEK-002.

Required Tests:

Existing invite controller regression tests.

---

### MNH-006

BEH-DASH-team-306

Invariant:

Direct DAL write surfaces must never be treated as the governed public module API.

Current Status:

PARTIAL. Current `index.js` exports hooks/components/screens only. Direct update/delete DALs now receive `profileId` or `memberActorId` scope, but DAL files remain direct write surfaces and scanner still classifies them as security paths.

Related Findings:

Prior `BW-TEAM-NEW-001`, write-surface map entries.

Required Tests:

TESTREQ-DASH-team-005.

---

### MNH-007

BEH-DASH-team-307

Invariant:

Public/customer profile roster reads must never expose pending, declined, inactive, named-staff-only, or management metadata rows.

Current Status:

MISSING DECISION. Current source avoids exposure by owner-gating the whole `useVportTeam` read, but that also blocks the customer-facing roster UI.

Related Findings:

TEAM-PROFILE-READ-001.

Required Tests:

TESTREQ-DASH-team-008.

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.resources` with `resource_type = "staff"` | Yes: list members, fetch resources, fetch pending/all barber requests. | Yes: named staff, linked members, pending team requests. | Yes: role metadata, active status, pending request accept/decline metadata, invite member binding. | Yes: member/resource removal. |
| `vport.profiles` | Yes: resolve VPORT profile by actor id and shop data for requests. | No. | No. | No. |
| `vport.profile_categories` | Yes: eligible barber VPORT discovery. | No. | No. | No. |
| `vc.actor_follows` | Yes: eligible barber discovery. | No. | No. | No. |
| `vc.actors` | Yes: actor kind checks during eligible barber discovery. | No. | No. | No. |
| `vc.actor_owners` | Yes: ownership assertions and eligible owned barber VPORT discovery. | No. | No. | No. |

---

## 9. Side Effects

Notifications:

- `sendTeamRequestController` publishes `team_invite` notifications to the invited barber VPORT actor.

Analytics:

- No analytics side effect found in source.

Media:

- No media mutation found in source.

Exports:

- No export side effect found in source.

Jobs:

- No background job enqueue found in source.

Cache:

- Hooks update local React state after successful mutations.
- Hydration calls warm actor summaries for linked members and request cards.

Other:

- `AddTeamMemberSheet` debounces candidate search by 320 ms.

---

## 10. UI Outputs

Loading States:

- Team screen shows `SkeletonCardList` during identity/ownership load and team member load.
- Requests screen shows `SkeletonCardList` during identity/ownership load and request load.
- Add sheet shows `Searching...` during candidate search.
- Buttons display `Adding...`, `Saving...`, `Removing...`, or disabled working states.

Success States:

- Linked member add appends the new normalized row.
- Role/status updates replace the local row.
- Remove filters the local member row out.
- Accept/decline filters the request out of the pending request list.

Error States:

- Non-owner team screen renders `You can only manage your own team.`
- Unauthenticated/non-owner request screen renders `Sign in required.`
- Team load, mutation, save, remove, and request work errors display in the screen, card, sheet, or modal.

Empty States:

- Team screen renders `No team members yet.`
- Team requests screen renders `No pending requests.`
- Add sheet renders no-result copy when search returns no candidates.

Owner States:

- Owner can open Add Member, edit eligible member roles/status, and remove members.
- Owner cannot edit self, pending, or declined rows through card `canEdit`.

Public States:

- No public team management UI found in source.
- Public/customer barbershop profile Team tab exists in `VportBarberShopTeamView`, but current data load uses owner-gated `useVportTeam`; unauthenticated and non-owner viewers can receive an error instead of the active linked roster.

---

## 11. Acceptance Criteria

### AC-DASH-team-001

Requirement:

Team management UI renders only for target VPORT owners.

Evidence:

`VportDashboardTeamScreen.jsx`

Status:

SOURCE VERIFIED.

---

### AC-DASH-team-002

Requirement:

Linked member add, role update, status update, and remove all assert owner access before mutation.

Evidence:

`vportTeamAccess.controller.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-team-003

Requirement:

Last active owner and self-action invariants are enforced for owner access mutations.

Evidence:

`vportTeamAccess.controller.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-team-004

Requirement:

Barber request accept/decline paths validate pending state and ownership before write.

Evidence:

`vportTeamInvite.controller.js`, `vportTeamInvite.controller.test.js`

Status:

SOURCE VERIFIED and PARTIAL TEST COVERED.

---

### AC-DASH-team-005

Requirement:

Candidate search uses the session viewer actor id, not the target VPORT actor id.

Evidence:

`useVportTeamAccess.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-team-006

Requirement:

`vport.resources` RLS policies for team reads/writes are formally verified.

Evidence:

`ownership.md`

Status:

OPEN.

---

### AC-DASH-team-007

Requirement:

Public/customer profile Team tab behavior is explicitly decided: either blocked intentionally with non-error empty/copy behavior, or allowed through a read-only public-safe active linked roster path.

Evidence:

`VportBarberShopTeamView.jsx`, `useVportTeam.js`, `vportTeam.controller.js`

Status:

OPEN.

---

## 12. Test Requirements

### TESTREQ-DASH-team-001

Validates:

Non-owner actors cannot render team management UI or load team members.

Type:

Screen/hook integration.

Status:

MISSING.

---

### TESTREQ-DASH-team-002

Validates:

Role, status, and remove controllers reject actions that would remove the last active owner.

Type:

Controller unit test.

Status:

MISSING.

---

### TESTREQ-DASH-team-003

Validates:

Owner self-add, self-deactivate, and self-remove guards.

Type:

Controller unit test.

Status:

MISSING.

---

### TESTREQ-DASH-team-004

Validates:

Accept/decline stale request and concurrent replay guards for all invite/request DAL paths.

Type:

Controller/DAL unit test.

Status:

PARTIAL.

---

### TESTREQ-DASH-team-005

Validates:

Team card boundary does not export DAL/controller direct write surfaces and no consumers import DAL/controllers through the module boundary.

Type:

Architecture/import test or scanner assertion.

Status:

PARTIAL. Current `index.js` exports hooks/components/screens only; direct update/delete DAL scope is source/test covered, but scanner write surfaces still require governance tracking.

---

### TESTREQ-DASH-team-006

Validates:

Candidate search calls `searchTeamCandidatesController` with session `viewerActorId`.

Type:

Hook/controller unit test.

Status:

MISSING.

---

### TESTREQ-DASH-team-007

Validates:

Invite accept/decline ownership gates block unauthorized callers and notification-harvested ids.

Type:

Controller unit test.

Status:

COMPLETE for covered invite controller cases.

---

### TESTREQ-DASH-team-008

Validates:

Barbershop profile Team tab behavior for unauthenticated, signed non-owner, and owner viewers. If public roster reads are allowed, tests must prove only active linked public-safe barber rows render and management/pending/declined/inactive rows stay hidden.

Type:

Profile view/controller integration.

Status:

MISSING.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| TEAM-FIND-003 | HIGH / DB verification | OPEN | BEH-DASH-team-208, AC-DASH-team-006 |
| VENOM-TEAM-008 | LOW / test coverage | OPEN | BEH-DASH-team-302, BEH-DASH-team-303, TESTREQ-DASH-team-001, TESTREQ-DASH-team-002, TESTREQ-DASH-team-003, TESTREQ-DASH-team-006 |
| TEAM-PROFILE-READ-001 | MEDIUM / behavior decision | OPEN | BEH-DASH-team-010, BEH-DASH-team-111, BEH-DASH-team-209, BEH-DASH-team-307, AC-DASH-team-007, TESTREQ-DASH-team-008 |
| ELEK-001 | Security regression | COVERED | BEH-DASH-team-205, BEH-DASH-team-304, TESTREQ-DASH-team-004 |
| ELEK-002 | Security regression | COVERED | BEH-DASH-team-206, BEH-DASH-team-305, TESTREQ-DASH-team-007 |
| Prior ELEK-TEAM-002 | MEDIUM | SOURCE APPEARS PATCHED | BEH-DASH-team-207, TESTREQ-DASH-team-006 |
| Prior ELEK-TEAM-003 | MEDIUM | SOURCE APPEARS PATCHED | BEH-DASH-team-202, TESTREQ-DASH-team-001 |
| TEAM-DAL-SCOPE-001 | Defense-in-depth | PATCHED / SOURCE VERIFIED | BEH-DASH-team-306, TESTREQ-DASH-team-005 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Team management screen owner gate. | SOURCE VERIFIED | No |
| Primary owner access controller gates linked member mutations. | SOURCE VERIFIED | No |
| Last-owner and self-action invariants. | SOURCE VERIFIED | Needs tests |
| Invite accept/decline ownership and state gates. | TEST COVERED FOR KEY CASES | No |
| Public/customer profile Team tab read behavior. | OPEN DECISION | Yes for behavior approval |
| `vport.resources` RLS verification for staff resources. | OPEN | Yes for CLEAR |
| SPIDER-MAN tests for owner access mutations and candidate search. | MISSING | Yes for SPIDER-MAN COMPLETE |
| Direct DAL write surfaces remain tracked as security paths. | PARTIAL — update/delete scope patched | Yes for clean THOR CLEAR |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Owner team management | Not source-verified in this pass. | OPEN QUESTION |
| Barber team requests inbox | Not source-verified in this pass. | OPEN QUESTION |
| Add member search and role assignment | Not source-verified in this pass. | OPEN QUESTION |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| Booking adapter ownership controller | Canonical actor-owner authorization gate. | ACTIVE |
| Hydration engine | Actor summary hydration for members and request cards. | ACTIVE |
| Actors adapter | Candidate search with viewer privacy context. | ACTIVE |
| Notifications adapter | Sends team invite notifications. | ACTIVE |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-team-001 | Has `vport.resources` RLS for staff resources been formally verified after TEAM-FIND-003? | OPEN |
| OQ-DASH-team-002 | Should direct DAL write functions gain profile/owner scoped parameters as defense-in-depth? | RESOLVED FOR UPDATE/DELETE — team member updates/deletes now require `profileId`; invite accept/decline paths scope by `memberActorId` or `profileId`. Inserts already receive `profileId`. |
| OQ-DASH-team-003 | Should named staff legacy hook/controller remain active or be folded into `useVportTeamAccess` governance? | OPEN |
| OQ-DASH-team-004 | Should team member removal be soft-delete/audit-tracked instead of hard delete? | OPEN |
| OQ-DASH-team-005 | Which native or alternate UI must maintain parity for team management? | OPEN |
| OQ-DASH-team-006 | Should public/customer barbershop profile Team tabs show active linked barber rosters, and if yes through what public-safe read policy/controller? | OPEN |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | Yes |
| Actors / Roles | HIGH | Yes |
| Module Architecture | HIGH | Yes |
| Happy Paths | HIGH | Yes |
| Failure Paths | HIGH | Yes |
| Security Rules | HIGH | Yes |
| Must Never Happen | HIGH | Yes |
| Data Changes | HIGH | Yes |
| Side Effects | HIGH | Yes |
| UI Outputs | HIGH | Yes |
| Acceptance Criteria | HIGH | Yes |
| Test Requirements | HIGH | Yes |
| Security Findings Linked | MEDIUM | Yes for current docs/source; some older finding ids are inferred as patched from source |
| THOR Release Gates | HIGH | Yes |
| Native / Alternate UI Parity | LOW | Missing source |
| Engine Dependencies | HIGH | Yes |
| Open Questions | HIGH | Yes |
| Command Sign-Off | MEDIUM | Derived from dashboard matrix and source review |

---

## 19. Command Sign-Off

ARCHITECT: DRAFTED - module routes, screens, hooks, controllers, DALs, and write surfaces mapped.

VENOM: COMPLETE WITH CAUTION - update/delete write scopes are patched; direct write surfaces and RLS verification remain governance items.

ELEKTRA: COMPLETE WITH CAUTION - current source shows prior ownership/search issues and direct update/delete write scopes patched; broader SPIDER-MAN assertions still needed.

BLACKWIDOW: COMPLETE WITH CAUTION - ownership gates, scoped update/delete DAL calls, and last-owner invariants are source-verified; database policy verification remains open.

SPIDER-MAN: PARTIAL - invite controller tests exist; owner access mutation and candidate search tests are missing.

PROFESSOR X: DRAFT READY FOR REVIEW.

THOR: CAUTION - not eligible for CLEAR until RLS verification, public profile Team tab behavior, and missing tests are closed.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding ID | Handoff |
|---|---|---|---|
| VALID_ROLES constant defined in controller, not in model layer — enforcement inconsistency risk | HIGH | ARCHITECT_VERIFIED | IRONMAN |
| team module imports vport profile DAL directly instead of using adapter | HIGH | ARCHITECT_VERIFIED | SENTRY |
| No dedicated model layer — role validation logic scattered across controller | MEDIUM | ARCHITECT_VERIFIED | IRONMAN |
| Team membership query scope and RLS policies undocumented | MEDIUM | ARCHITECT_VERIFIED | VENOM |
| No native parity documentation for team card | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: MISSING — SPIDER-MAN required.

Ownership enforcement: [ARCHITECT_VERIFIED] assertActorOwnsVportActorController confirmed in vportTeamAccess.controller.js. Role assignment guarded by VALID_ROLES at controller level — model-layer gap routes to IRONMAN.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/team/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §8 (team: manage team members)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md (VEN-DASHBOARD-001 guard chain)
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_ACTIVE — Team role management documented. VALID_ROLES model-layer gap and cross-module DAL boundary violations route to IRONMAN and SENTRY. Regression coverage missing.
