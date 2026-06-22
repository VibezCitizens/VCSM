# INDEX — VCSM / dashboard / modules / team

**Last ARCHITECT Run:** 2026-06-05
**Status:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001

---

## Source File Inventory

| File | Layer | Lines Read |
|---|---|---|
| VportDashboardTeamScreen.jsx | screen | 1-227 |
| BarberTeamRequestsScreen.jsx | screen | not read |
| controller/vportTeam.controller.js | controller | 1-138 |
| controller/vportTeamAccess.controller.js | controller | 1-157 |
| controller/vportTeamInvite.controller.js | controller | 1-121 |
| dal/vportTeam.read.dal.js | dal | 1-100 |
| dal/vportTeam.write.dal.js | dal | 1-79 |
| dal/vportTeamInvite.read.dal.js | dal | 1-45 |
| dal/vportTeamInvite.write.dal.js | dal | 1-131 |
| hooks/useBarberTeamRequests.js | hook | 1-70 |
| hooks/useVportTeam.js | hook | 1-73 |
| hooks/useVportTeamAccess.js | hook | 1-89 |
| components/team/AddTeamMemberSheet.jsx | component | not read |
| components/team/ConfirmRemoveModal.jsx | component | not read |
| components/team/TeamMemberCards.jsx | component | not read |
| model/ | (empty directory) | — |
| __tests__/vportTeamAccess.controller.test.js | test | not read |
| __tests__/vportTeamInvite.controller.test.js | test | not read |
| index.js | barrel | not read |

## Module Counts (SOURCE_VERIFIED)

| Layer | Count |
|---|---|
| screen | 2 |
| controller | 3 |
| dal | 4 (2 read, 2 write) |
| hook | 3 |
| component | 3 |
| model | 0 (model/ directory exists but is empty) |
| adapter | 0 local |
| tests | 2 |

## Routes

| Route | Access | Screen |
|---|---|---|
| /actor/:actorId/dashboard/team | PROTECTED (OwnerOnlyDashboardGuard + isOwner check) | VportDashboardTeamScreen |
| /actor/:actorId/dashboard/team-requests | PROTECTED (OwnerOnlyDashboardGuard) | BarberTeamRequestsScreen |

## Write Surfaces

| Table | Operation | Guard |
|---|---|---|
| resources (team member) | INSERT | profileId scope + assertActorOwnsVportActorController |
| resources (linked member) | INSERT | profileId scope + assertActorOwnsVportActorController |
| resources (team request) | INSERT | profileId scope + assertActorOwnsVportActorController |
| resources (role update) | UPDATE | profileId scope + assertActorOwnsVportActorController |
| resources (active status) | UPDATE | profileId scope + assertActorOwnsVportActorController |
| resources (accept request) | UPDATE | meta->>status + memberActorId (ELEK-001) |
| resources (decline request) | UPDATE | meta->>status + ownership assert (ELEK-002) |
| resources (accept invite) | UPDATE | meta->>status + memberActorId + callerActorId (ELEK-001, VPD-V-008) |
| resources (delete) | DELETE | profileId scope |

## Security Hardening (SOURCE_VERIFIED)

| Fix | Status |
|---|---|
| ELEK-001: atomic state guards on accept (request + invite) | CONFIRMED |
| ELEK-002: assertActorOwnsVportActorController on isInvitedBarber decline | CONFIRMED |
| VPD-V-008: callerActorId required on acceptBarbershopInviteController | CONFIRMED |

## Cross-Client DAL Architecture

vportTeam.read.dal.js uses BOTH:
- `vc` (vcClient): actor_follows, actors, actor_owners
- `vportSchema` (vportClient): profile_categories, resources

## N+1 Risk

findEligibleBarberActorIdsDAL performs 4-5 sequential DB calls.
Route to KRAVEN for investigation.

## Independence / Completeness

| Field | Value |
|---|---|
| Independence | MOSTLY INDEPENDENT |
| Completeness | MOSTLY COMPLETE |
| BEHAVIOR.md | MISSING |
| Security hardening | CONFIRMED (ELEK-001, ELEK-002, VPD-V-008) |
