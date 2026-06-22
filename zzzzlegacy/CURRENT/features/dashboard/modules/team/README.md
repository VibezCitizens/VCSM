# Module: Team Management

**VPORT Kinds:** ALL (BARBERSHOP primary use case; available to all VPORT kinds)
**Public/Owner:** OWNER only
**Routes:** `/actor/:actorId/dashboard/team` and `/actor/:actorId/dashboard/team-requests`
**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/`
**Governance status:** SECURITY_REVIEW_PENDING
**Last updated:** 2026-05-27

---

## What This Module Does

Manages team membership for a VPORT. Supports two staff models:

1. **Named staff** — unlinked entries (name-only records, no platform actor)
2. **Linked staff** — platform actors (barber VPORTs or user-kind actors) linked to the team via invitation or direct add

Covers: adding/removing team members, role assignment (owner/manager/staff), invite send/accept/decline lifecycle for barbershop–barber relationships, and the pending requests inbox for invited barbers.

---

## Source Inventory

### Screens
- `VportDashboardTeamScreen.jsx` — Owner dashboard team tab entry point
- `BarberTeamRequestsScreen.jsx` — Pending team request inbox for barber VPORTs

### Controllers
- `vportTeam.controller.js` — `getTeamMembersController`, `addTeamMemberController` (named staff), `findEligibleBarbersController`, `sendTeamRequestController`, `removeTeamMemberController`
- `vportTeamAccess.controller.js` — `getTeamAccessController`, `addTeamMemberController` (linked actor), `updateTeamMemberRoleController`, `setTeamMemberStatusController`, `removeTeamMemberController`, `searchTeamCandidatesController`
- `vportTeamInvite.controller.js` — `acceptTeamRequestController`, `declineTeamRequestController`, `getBarberTeamRequestsController`, `fetchBarbershopInviteController`, `acceptBarbershopInviteController`

### DAL — Reads
- `dal/vportTeam.read.dal.js` — `fetchTeamMembersByProfileId`, `findEligibleBarberActorIdsDAL`
- `dal/vportTeamInvite.read.dal.js` — `fetchResourceByIdDAL`, `fetchPendingTeamRequestsForBarberDAL`, `fetchAllTeamRequestsForBarberDAL`

### DAL — Writes
- `dal/vportTeam.write.dal.js` — `insertTeamMemberDAL`, `insertLinkedTeamMemberDAL`, `updateTeamMemberRoleDAL`, `setTeamMemberActiveDAL`, `deleteTeamMemberByIdDAL`
- `dal/vportTeamInvite.write.dal.js` — `insertTeamRequestDAL`, `acceptTeamRequestDAL`, `declineTeamRequestDAL`, `acceptTeamInviteByActorDAL`, `deleteTeamResourceDAL`

### Hooks
- `hooks/useVportTeam.js` — Team list management, member add/remove
- `hooks/useVportTeamAccess.js` — Linked actor team access management
- `hooks/useBarberTeamRequests.js` — Pending invite inbox for barber VPORTs

### Components
- `components/team/TeamMemberCards.jsx` — Team member list display
- `components/team/AddTeamMemberSheet.jsx` — Add member sheet (named + actor search)
- `components/team/ConfirmRemoveModal.jsx` — Confirm remove dialog

### Tests
- `__tests__/vportTeamInvite.controller.test.js`

---

## Database

- **Primary table:** `vport.resources` (`resource_type = 'staff'`)
- **Read dependencies:** `vc.actor_follows`, `vc.actors`, `vc.actor_owners`, `vport.profile_categories`, `vport.profiles`
- **Notification dispatch:** `publishVcsmNotification` — `kind: 'team_invite'` on invite send

---

## References

- Architecture doc: **PENDING** — `vcsm.vport-dashboard-team-card.architecture.md` (not yet created)
- Related: `modules/booking/` — booking engine
- Related: `modules/leads/` — leads dashboard
