# Evidence Bundle — ARCHITECT V2
## Module: dashboard/modules/team
**Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0
**Confidence:** HIGH

---

## Scope

Feature: dashboard
Module: team
Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/

---

## Source Files Read

| File | Layer | Lines |
|---|---|---|
| VportDashboardTeamScreen.jsx | screen | 1-227 |
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

Source files validated: 11
Source files not read (inventory only): 7 (BarberTeamRequestsScreen, 3 components, 2 tests, index)

---

## Layer Counts

| Layer | Count |
|---|---|
| screen | 2 |
| controller | 3 |
| dal | 4 |
| hook | 3 |
| component | 3 |
| model | 0 (model/ directory empty) |
| adapter | 0 local |
| tests | 2 |

---

## Routes

| Route | Access | Screen |
|---|---|---|
| /actor/:actorId/dashboard/team | PROTECTED | VportDashboardTeamScreen |
| /actor/:actorId/dashboard/team-requests | PROTECTED | BarberTeamRequestsScreen |

---

## Call Chains

| ID | Path | User-Controlled Params | Ownership Checked | Confidence |
|---|---|---|---|---|
| CHAIN-team-001 | VportDashboardTeamScreen → useVportTeamAccess → addTeamMemberController → insertLinkedTeamMemberDAL | memberActorId, role, displayName | YES (assertActorOwnsVportActorController) | HIGH |
| CHAIN-team-002 | VportDashboardTeamScreen → useVportTeamAccess → updateTeamMemberRoleController → updateTeamMemberRoleDAL | resourceId, role | YES (ownership assert + profileId scope) | HIGH |
| CHAIN-team-003 | VportDashboardTeamScreen → useVportTeamAccess → setTeamMemberStatusController → setTeamMemberActiveDAL | resourceId, status | YES (ownership assert + profileId scope) | HIGH |
| CHAIN-team-004 | VportDashboardTeamScreen → useVportTeamAccess → removeTeamMemberController → deleteTeamMemberByIdDAL | resourceId | YES (ownership assert + profileId scope) | HIGH |
| CHAIN-team-005 | useBarberTeamRequests → acceptTeamRequestController → acceptTeamRequestDAL | resourceId | YES (assertActorOwnsVportActorController + ELEK-001 atomic guard) | HIGH |
| CHAIN-team-006 | useBarberTeamRequests → declineTeamRequestController → declineTeamRequestDAL | resourceId, callerActorId | YES (ELEK-002 ownership assert on isInvitedBarber path) | HIGH |
| CHAIN-team-007 | acceptBarbershopInviteController → acceptTeamInviteByActorDAL | token, barberVportActorId, callerActorId | YES (VPD-V-008 callerActorId + ELEK-001 atomic guard) | HIGH |

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| insertTeamRequestDAL | dal/vportTeamInvite.write.dal.js | INSERT resources with member_actor_id | MEDIUM (ownership assert in controller) |
| acceptTeamRequestDAL | dal/vportTeamInvite.write.dal.js | UPDATE resources state | MEDIUM (ELEK-001 atomic guard confirmed) |
| acceptTeamInviteByActorDAL | dal/vportTeamInvite.write.dal.js | UPDATE resources with member_actor_id assignment | MEDIUM (ELEK-001 + VPD-V-008 confirmed) |
| declineTeamRequestDAL | dal/vportTeamInvite.write.dal.js | UPDATE resources state | MEDIUM (ELEK-002 confirmed) |
| readVportProfileByActorIdDAL (direct import) | controller/vportTeam.controller.js | Cross-module DAL import | MEDIUM (boundary violation — not data risk) |
| readVportProfileByActorIdDAL (direct import) | controller/vportTeamAccess.controller.js | Cross-module DAL import | MEDIUM (boundary violation) |

---

## Database Reads

| DAL | Function | Table | Schema | Caller |
|---|---|---|---|---|
| vportTeam.read.dal | fetchTeamMembersByProfileId | resources | vport | getTeamMembersController, getTeamAccessController |
| vportTeam.read.dal | findEligibleBarberActorIdsDAL | actor_follows, actors, actor_owners, profile_categories | vc + vport | findEligibleBarbersController |
| vportTeamInvite.read.dal | fetchResourceByIdDAL | resources | vport | vportTeamInvite.controller |
| vportTeamInvite.read.dal | fetchPendingTeamRequestsForBarberDAL | resources | vport | getBarberTeamRequestsController |
| vportProfile.read.dal (cross-module) | readVportProfileByActorIdDAL | profiles | vport | vportTeam.controller, vportTeamAccess.controller |

---

## Database Writes

| DAL | Function | Operation | Table | Guard |
|---|---|---|---|---|
| vportTeam.write.dal | insertTeamMemberDAL | INSERT | resources | profileId scope |
| vportTeam.write.dal | insertLinkedTeamMemberDAL | INSERT | resources | profileId scope + ownership assert |
| vportTeam.write.dal | updateTeamMemberRoleDAL | UPDATE | resources | profileId scope + ownership assert |
| vportTeam.write.dal | setTeamMemberActiveDAL | UPDATE | resources | profileId scope + ownership assert |
| vportTeam.write.dal | deleteTeamMemberByIdDAL | DELETE | resources | profileId scope + ownership assert |
| vportTeamInvite.write.dal | insertTeamRequestDAL | INSERT | resources | profileId scope + ownership assert |
| vportTeamInvite.write.dal | acceptTeamRequestDAL | UPDATE | resources | meta->>status + memberActorId (ELEK-001) |
| vportTeamInvite.write.dal | declineTeamRequestDAL | UPDATE | resources | meta->>status + profileId/memberActorId (ELEK-002) |
| vportTeamInvite.write.dal | acceptTeamInviteByActorDAL | UPDATE | resources | meta->>status + memberActorId + callerActorId (ELEK-001+VPD-V-008) |
| vportTeamInvite.write.dal | deleteTeamResourceDAL | DELETE | resources | profileId scope |

---

## Engine Usage

| Engine | Method | File |
|---|---|---|
| @hydration | hydrateActorsByIds | useVportTeam, useVportTeamAccess |
| booking adapter | assertActorOwnsVportActorController | vportTeam, vportTeamAccess, vportTeamInvite controllers |
| actors adapter | searchActorsAdapter | vportTeamAccess.controller |
| identity adapter | useIdentity() | useVportTeam, useVportTeamAccess, VportDashboardTeamScreen |

---

## N+1 Risk

findEligibleBarberActorIdsDAL (dal/vportTeam.read.dal.js):
- Step 1: SELECT actor_follows WHERE followed_actor_id = barbershopActorId
- Step 2: SELECT actors WHERE id IN (followerActorIds)
- Step 3a: SELECT actor_owners WHERE actor_id IN (userActorIds) → SELECT actor_owners WHERE user_id IN (userIds) → SELECT profile_categories WHERE actor_id IN (ownedVportActorIds)
- Step 3b: SELECT profile_categories WHERE actor_id IN (vportActorIds)
Total: 4-5 sequential DB calls per invocation.

---

## Behavior Contract Check (Area 9)

BEHAVIOR.md: MISSING
Check A: FINDING — controllers + DAL + hooks present, no BEHAVIOR.md (HIGH severity — P1 feature)
Check B: N/A
Check C: N/A
Check D: N/A

---

## Security Hardening Confirmations

| Finding | Status | Evidence |
|---|---|---|
| ELEK-001 (atomic state guard on invite accept) | CONFIRMED | acceptTeamInviteByActorDAL line 111: `.eq("meta->>status", "pending_acceptance")` |
| ELEK-001 (atomic state guard on request accept) | CONFIRMED | acceptTeamRequestDAL line 57: `.eq("meta->>status", "pending_acceptance")` |
| ELEK-002 (ownership on isInvitedBarber decline) | CONFIRMED | declineTeamRequestController lines 53-61: assertActorOwnsVportActorController called |
| VPD-V-008 (callerActorId required on invite accept) | CONFIRMED | acceptBarbershopInviteController line 103: callerActorId guard present |

---

## Provenance

Scanner maps consumed: feature-map, route-map, write-surface-map, callgraph, write-execution-map
Source files validated: 11
Confidence: HIGH
