# Team — Performance Notes

## DB Call Profile

### Screen Load (getTeamMembersController)
1. `readVportProfileByActorIdDAL` — resolves profileId (1 hit)
2. `fetchTeamMembersByProfileId` — reads `vport.resources` filtered by `profile_id` + `resource_type = 'staff'` (1 hit)

Total: 2 DB operations per load.

### Add Linked Actor (addTeamMemberController — access controller)
1. `assertActorOwnsVportActorController` — `actor_owners` check (1 hit)
2. `readVportProfileByActorIdDAL` — resolves profileId (1 hit)
3. `fetchTeamMembersByProfileId` — duplicate check (1 hit)
4. `insertLinkedTeamMemberDAL` — insert (1 write)

Total: 4 DB operations per add.

### Find Eligible Barbers (findEligibleBarbersController)
1. `readVportProfileByActorIdDAL` (1 hit)
2. `findEligibleBarberActorIdsDAL` — 3–4 chained reads: `vc.actor_follows`, `vc.actors`, `vc.actor_owners`, `vport.profile_categories`
3. `fetchTeamMembersByProfileId` — parallel with step 2 (1 hit)
4. `hydrateAndReturnSummaries` — hydration engine (may batch, uses 5-min TTL cache)

Total: 6–8 DB operations. No caching observed on the eligible-barbers query itself.

### Send Team Request (sendTeamRequestController)
1. `assertActorOwnsVportActorController` (1 hit)
2. `readVportProfileByActorIdDAL` (1 hit)
3. `fetchTeamMembersByProfileId` — duplicate check (1 hit)
4. `insertTeamRequestDAL` (1 write)
5. `publishVcsmNotification` — notification dispatch (1 write, async)

Total: 4–5 DB operations.

---

## Caching

No TTL caching observed on any team read path. No KRAVEN audit completed for this module.

## Known Issues

`findEligibleBarbersController` is the most expensive operation — 6–8 DB calls for a barbershop with followers. May become a bottleneck at scale.
