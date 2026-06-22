# Schedule — Performance Notes

## DB Call Profile (per `loadDayScheduleController` call)

All calls fire on every date navigation action (prev/next day, today, manual date jump):

1. `assertActorOwnsVportActorController` — reads `actor_owners` (1 hit)
2. `getVportProfileIdByActorDAL` — reads `vport.profiles` (1 hit)
3. `listVportResourcesByProfileIdDAL` — reads `vport.resources` filtered by `profile_id` (1 hit, parallel)
4. `listVportResourcesByOwnerActorIdDAL` — reads `vport.resources` filtered by `owner_actor_id` (1 hit, parallel with #3)
5. `listVportAvailabilityRulesByResourceIdsDAL` — reads `vport.availability_rules` for all merged resource IDs (1 hit)
6. `listVportBookingsForProfileDayDAL` — reads day range bookings for all merged resource IDs (1 hit)
7. `listVportServicesByProfileIdDAL` — reads `vport.services` (1 hit, catch-suppressed on error)

Total: 7 DB operations per date navigation.

## Actor Hydration

`hydrateActorsByIds` is called post-load for all resource `member_actor_id` values. Uses the shared hydration engine with a 5-minute TTL cache — hydration calls are cheap on subsequent navigations if actor data is cached.

## Navigation Pattern

No prefetching of adjacent dates. Each day navigation triggers a full controller re-call. For a VPORT with 10 staff members, this is still manageable per-call, but repeated rapid navigation may generate significant load.

## Known Issues

No KRAVEN audit performed. No caching on the schedule load path itself. DEFER-006 (fuel price cache) shows the project is aware of uncached mount patterns — a similar cache opportunity may exist here for `listVportServicesByProfileIdDAL`.
