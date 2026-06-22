# Team — Ownership and Trust Boundaries

## Ownership Gate: `assertActorOwnsVportActorController`

All write paths call `assertActorOwnsVportActorController` before any DB mutation. This verifies the caller owns the target VPORT actor via the `actor_owners` table.

| Operation | Caller Param | Target Param | Verified Via |
|---|---|---|---|
| Add named staff | `callerActorId` | `actorId` (shop) | `actor_owners` |
| Send team request | `callerActorId` | `actorId` (shop) | `actor_owners` |
| Remove member (vportTeam.controller) | `callerActorId` | resolved VPORT actor (owner_actor_id or fallback DAL) | `actor_owners` |
| Get team access | `callerActorId` | `actorId` | `actor_owners` |
| Add linked actor | `callerActorId` | `actorId` | `actor_owners` |
| Update member role | `callerActorId` | `actorId` | `actor_owners` |
| Set member status | `callerActorId` | `actorId` | `actor_owners` |
| Remove member (vportTeamAccess.controller) | `callerActorId` | `actorId` | `actor_owners` |
| Accept team request | `callerActorId` | `resource.member_actor_id` (invited barber VPORT) | `actor_owners` |
| Decline — invited barber path | `viewerActorId` (session user) | `callerActorId` (barber VPORT) | `actor_owners` |
| Decline — shop owner path | `callerActorId` | resolved VPORT actor | `actor_owners` |
| Get barber pending requests | `callerActorId` | `barberVportActorId` | `actor_owners` |
| Accept barbershop invite | `callerActorId` | `barberVportActorId` | `actor_owners` |

---

## Owner Invariant Guard

`vportTeamAccess.controller.js` enforces a "last owner must remain" invariant:

- `updateTeamMemberRoleController` — blocks demoting the last active owner to a non-owner role
- `setTeamMemberStatusController` — blocks deactivating the last active owner
- `removeTeamMemberController` (access controller) — blocks removing the last active owner

---

## Self-Action Guards

- `setTeamMemberStatusController` — blocks deactivating your own record
- `removeTeamMemberController` (access controller) — blocks removing yourself
- `addTeamMemberController` (access controller) — blocks adding yourself as a member

---

## DB-Level RLS

**NEEDS_VERIFICATION** — `vport.resources` RLS policy has not been formally audited. Application-layer gates are the current enforcement layer. See TEAM-FIND-003.
