# ARCHITECTURE — Dashboard Module: team

**Last ARCHITECT Run:** 2026-06-05 (V2 — full source verification)
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: team
Application Scope: VCSM
Module Type: dashboard card module
Primary Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Manages VPORT team membership from the owner dashboard. Covers: listing team members, adding team members (linked via resources table), updating member roles (owner/manager/staff), activating/deactivating members, removing members, and handling barber join requests. Invite flow uses `vportTeamInvite.write/read.dal.js`. Role enumeration is locked to `VALID_ROLES = ["owner", "manager", "staff"]` in vportTeamAccess.controller.js.

Barbershop invite discovery (findEligibleBarbersController) performs a multi-step read: actor_follows → actors → actor_owners → VPORT actors → profile_categories — N+1 risk across 4–5 sequential DB calls.

Security hardening confirmed from prior sprint: ELEK-001 (atomic state guards on invite accept/decline), ELEK-002 (assertActorOwnsVportActorController for isInvitedBarber decline path), VPD-V-008 (callerActorId required on acceptBarbershopInviteController).

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: vportTeam.controller.js, vportTeamAccess.controller.js, vportTeamInvite.controller.js
Ownership enforcement: `assertActorOwnsVportActorController` via `booking.adapter` — confirmed in vportTeamAccess.controller.js source read

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Route: `/actor/:actorId/dashboard/team` → VportDashboardTeamScreen.jsx
- Route: `/actor/:actorId/dashboard/team-requests` → BarberTeamRequestsScreen.jsx
- Exported via: `index.js`

---

## LAYER MAP

DAL:
- `dal/vportTeam.read.dal.js` — fetchTeamMembersByProfileId (vportSchema), findEligibleBarberActorIdsDAL (CROSS-CLIENT: both vc + vportSchema) [SOURCE_VERIFIED]
- `dal/vportTeam.write.dal.js` — insertTeamMemberDAL, insertLinkedTeamMemberDAL, updateTeamMemberRoleDAL, setTeamMemberActiveDAL, deleteTeamMemberByIdDAL — all with profileId scope guard [SOURCE_VERIFIED]
- `dal/vportTeamInvite.read.dal.js` — fetchResourceByIdDAL, fetchPendingTeamRequestsForBarberDAL, fetchAllTeamRequestsForBarberDAL [SOURCE_VERIFIED]
- `dal/vportTeamInvite.write.dal.js` — insertTeamRequestDAL, acceptTeamRequestDAL, declineTeamRequestDAL, acceptTeamInviteByActorDAL, deleteTeamResourceDAL — ELEK-001 atomic state guards confirmed [SOURCE_VERIFIED]

CROSS-CLIENT NOTE: vportTeam.read.dal uses BOTH `vc` (vcClient — actor_follows, actors, actor_owners) AND `vportSchema` (vportClient — profile_categories, resources). [SOURCE_VERIFIED]
N+1 RISK: findEligibleBarberActorIdsDAL performs 4–5 sequential DB calls (Step 1: follows → Step 2: actors → Step 3a/3b: actor_owners → VPORTs → profile_categories). [SOURCE_VERIFIED]

Model: model/ directory exists but is EMPTY [SOURCE_VERIFIED via file inventory]

Controller:
- `controller/vportTeam.controller.js` — team CRUD coordination [SOURCE_VERIFIED]
- `controller/vportTeamAccess.controller.js` — role management, assertActorOwnsVportActorController [SOURCE_VERIFIED]
- `controller/vportTeamInvite.controller.js` — invite lifecycle [SOURCE_VERIFIED]

Hook:
- `hooks/useBarberTeamRequests.js` — passes viewerActorId to declineTeamRequestController (ELEK-002 confirmed) [SOURCE_VERIFIED]
- `hooks/useVportTeam.js` — uses @hydration engine, @/features/identity/adapters/identity.adapter [SOURCE_VERIFIED]
- `hooks/useVportTeamAccess.js` — uses @hydration engine, @/features/identity/adapters/identity.adapter [SOURCE_VERIFIED]

NOTE: Team hooks use `@/features/identity/adapters/identity.adapter` (correct adapter boundary); locksmith uses `@/state/identity/identityContext` directly (inconsistency across dashboard modules).

Component:
- `components/team/AddTeamMemberSheet.jsx` [SOURCE_VERIFIED]
- `components/team/ConfirmRemoveModal.jsx` [SOURCE_VERIFIED]
- `components/team/TeamMemberCards.jsx` [SOURCE_VERIFIED]

Screen:
- `VportDashboardTeamScreen.jsx` [SOURCE_VERIFIED]
- `BarberTeamRequestsScreen.jsx` [SOURCE_VERIFIED]
- `index.js` [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Team CRUD + invite + join requests | — |
| Owner defined | PASS | VCSM:dashboard | — |
| Entry points mapped | PASS | 2 routes confirmed | — |
| Controllers present/delegated | PASS | 3 controllers | — |
| DAL/repository present/delegated | PASS | 4 DAL files (read/write for team + invite) | — |
| Models/transformers present | FAIL | model/ directory exists but is EMPTY [SOURCE_VERIFIED] | MISSING |
| Hooks/view models present | PASS | 3 hooks | — |
| Screens/components present | PASS | 2 screens + 3 components | — |
| Services/adapters present | PARTIAL | actors.adapter used in vportTeamAccess | Not declared as module dependency |
| Database objects mapped | PASS | resources table (confirmed in write-surface-map — INSERT/UPDATE/DELETE) | — |
| Authorization path mapped | PASS | assertActorOwnsVportActorController in vportTeamAccess.controller | — |
| Cache/runtime behavior mapped | FAIL | Not documented | — |
| Error/loading/empty states mapped | PARTIAL | ConfirmRemoveModal handles confirm; error surfaces unclear | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | PASS | vportTeamAccess.controller.test.js + vportTeamInvite.controller.test.js | — |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | PASS | booking.adapter (assertActorOwnsVportActorController), actors.adapter (searchActorsAdapter), @hydration (hydrateActorsByIds) all confirmed [SOURCE_VERIFIED] | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| booking.adapter | engine | team → booking | YES — via adapter | assertActorOwnsVportActorController |
| actors.adapter | feature | team → actors | YES — via adapter | searchActorsAdapter in vportTeamAccess |
| vport/dal/read/vportProfile | feature-DAL | team → vport | RISK — direct cross-module DAL import | readVportProfileByActorIdDAL |
| resources table | database | team write | YES — owned scope | INSERT/UPDATE/DELETE confirmed |
| OwnerOnlyDashboardGuard | route | route wrapper | YES | Route-level auth |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| resources (team members) | read/write | VCSM:dashboard/team | team controllers | Full CRUD confirmed |
| resources (invites) | read/write | VCSM:dashboard/team | invite controllers | Invite lifecycle |
| profile_id | read | vport/dal/read/vportProfile | vportTeam.controller | Cross-module — direct DAL |
| VALID_ROLES | derived | vportTeamAccess.controller | role update controller | ["owner","manager","staff"] |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | /dashboard/team + /dashboard/team-requests | — |
| Loading state | PARTIAL | Hook-managed; unverified in screen | — |
| Empty state | PARTIAL | TeamMemberCards likely handles; unverified | — |
| Error state | PARTIAL | Controllers throw; UI error handling unclear | — |
| Auth/owner gates | PASS | assertActorOwnsVportActorController + route guard | — |
| Cache behavior | UNKNOWN | Not documented | — |
| Runtime dependencies | PASS | booking.adapter + actors.adapter | — |
| Hot paths | PARTIAL | fetchTeamMembersByProfileId is hot; invite pipeline is secondary | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | Prior (Dashboard Security Sprint 2026-05-29) | PARTIAL |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md | HIGH | VALID_ROLES, invite lifecycle, atomic guard behavior undocumented | LOGAN |
| Model layer (empty directory) | HIGH | model/ dir exists but is empty; VALID_ROLES should move to model | IRONMAN |
| Cross-module vport DAL import | HIGH | readVportProfileByActorIdDAL imported directly in 2 controllers | SENTRY |
| N+1 risk: findEligibleBarberActorIdsDAL | MEDIUM | 4–5 sequential DB calls per barber search — hot path | KRAVEN |
| Cache/runtime docs | MEDIUM | Team load is hot path; hydration pattern undocumented | LOKI |
| Cross-client DAL architecture | MEDIUM | vportTeam.read.dal uses both vc + vportSchema clients — undocumented pattern | CARNAGE |
| Native parity | LOW | Not documented | Falcon |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/controller/vportTeamAccess.controller.js
Module: team
Current dependency: `import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal"`
Expected boundary: Access through vport adapter or controller
Risk: MEDIUM — direct cross-module DAL import
Suggested correction: Expose `resolveVportProfileFromActor` from vport adapter

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## SECURITY HARDENING STATUS (SOURCE_VERIFIED)

| Fix | Controller | Status | Evidence |
|---|---|---|---|
| ELEK-001: Atomic state guard on acceptTeamInviteByActorDAL | vportTeamInvite.controller.js | CONFIRMED | `.eq("meta->>status", "pending_acceptance")` in DAL [line 111] |
| ELEK-001: Atomic state guard on acceptTeamRequestDAL | vportTeamInvite.controller.js | CONFIRMED | `.eq("meta->>status", "pending_acceptance")` in DAL [line 57] |
| ELEK-002: assertActorOwnsVportActorController on isInvitedBarber decline path | vportTeamInvite.controller.js | CONFIRMED | viewerActorId passed + ownership asserted [line 57-61] |
| VPD-V-008: callerActorId required on acceptBarbershopInviteController | vportTeamInvite.controller.js | CONFIRMED | callerActorId guard + ownership assert [lines 103-116] |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Add BEHAVIOR.md | Role constants, invite lifecycle, atomic guard behavior undocumented | LOGAN |
| P1 | Add model layer (populate empty model/ dir) | VALID_ROLES in controller; should be in model | IRONMAN |
| P1 | Fix cross-module vport DAL imports | readVportProfileByActorIdDAL imported directly in 2 controllers | SENTRY |
| P2 | Investigate N+1: findEligibleBarberActorIdsDAL | 4–5 sequential DB calls per search | KRAVEN |
| P2 | Document cache/runtime | Hydration + team load undocumented | LOKI |
| P2 | Document cross-client DAL pattern | vc + vportSchema in same DAL file | CARNAGE |
| P3 | Native parity notes | Not documented | Falcon |

## RECOMMENDED HANDOFFS: LOGAN, IRONMAN, SENTRY, KRAVEN, LOKI, CARNAGE
