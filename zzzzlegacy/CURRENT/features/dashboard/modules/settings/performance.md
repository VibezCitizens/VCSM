# Settings — Performance Notes

## DB Call Profile (per save operation)

1. `assertActorOwnsVportActorController` — reads `actor_owners` (1 hit)
2. `readVportProfileByActorIdDAL` — reads `vport.profiles` (1 hit)
3. `resolveVportCity` — reads or creates city record (1 hit; silently suppressed on failure)
4. `upsertVportPublicDetailsDAL` — upserts `vport.profile_public_details` (1 write)
5. `invalidateVportPublicDetails(actorId)` — in-memory cache bust (no DB hit)

Total: 3–4 DB operations per save.

## Screen Load DB Calls (View Screen mount)

- `useVportDashboardDetails(actorId)` — public details read (1 hit)
- `useResolvedVportId(actorId)` — resolves `vportId` once for both hooks (1 hit — **VPD-V-FIX-003**)
- `useVportDirectoryVisibility` — TRAZE visibility read (1 hit, uses resolved vportId)
- `useVportBusinessCardSettings` — card settings read (1 hit, uses resolved vportId)
- `useVportAds` — ads read (1 hit, behind feature flag)

Total on mount: 4–5 reads.

## VPD-V-FIX-003 Optimization

Before the fix, `useVportDirectoryVisibility` and `useVportBusinessCardSettings` each independently called `ctrlResolveVportIdByActorId` on mount — 2 extra DB hits per screen load. `useResolvedVportId` consolidates this to 1 hit shared by both hooks.

## Caching

`invalidateVportPublicDetails` busts the profile details cache after a successful save. KRAVEN review pending for the full settings load path.
