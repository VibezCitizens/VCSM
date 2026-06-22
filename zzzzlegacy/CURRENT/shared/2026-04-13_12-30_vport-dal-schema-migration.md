# Session Summary — vport-dal-schema-migration (2026-04-13)

## What was worked on

- **Full vport DAL schema migration sweep** — migrated all remaining frontend DAL files from `vc.vport_*` legacy tables to the new `vport.*`, `reviews.*`, and correct schema-prefixed RPC calls. Covered rates, services, service addons, service catalog, menu categories, menu items, all 5 gas DALs, and both review DALs.
- **Live DB verification via Supabase CLI** — used `supabase gen types --project-id` to confirm exact table names, column shapes, and RPC locations across `vport`, `reviews`, `moderation`, `identity`, `platform`, and `vc` schemas before migrating.
- **RPC audit** — audited all 20 RPC calls in the VCSM app against the live DB. Found 2 missing functions, 4 (already correct) schema prefixes confirmed, and 3 superseded RPCs. Wrote Logan doc at `zNOTFORPRODUCTION/logan/vcsm/runtime/vcsm.runtime.rpc-audit.md`.
- **vcsmActorHydrator ownerActorId fix** — added `vport.profile_actor_access` fallback to resolve `ownerActorId` when `vc.actor_owners` row is missing, fixing inbox `INVALID vport identity: missing ownerActorId` error.
- **Wolverine queue cleanup** — consolidated all remaining work into a clean DB pending list (7 items with SQL proposals) and code pending list in `.tp-ready.md`.

## Decisions made

- **No legacy fallbacks** — ownerActorId fallback via `vport.profiles.owner_user_id` was rejected. Proper fix uses `vport.profile_actor_access.actor_id` where `is_primary = true` (new schema path).
- **reviews.* schema for review tables** — `vc.vport_reviews` and `vc.vport_review_ratings` are gone. Reviews now live in the `reviews` engine schema (`reviews.reviews`, `reviews.review_dimension_ratings`). RPCs `get_vport_review_form_config` and `get_vport_official_stats` remain in `vc` schema.
- **dimension_key → dimension_id resolution in write DAL** — `reviews.review_dimension_ratings` uses `dimension_id` (UUID FK), not `dimension_key` (string). Write DAL now does a batch lookup from `reviews.review_dimensions` to resolve keys to IDs before upserting.
- **reviewsClient.js created** — new `supabase.schema('reviews')` client following the same pattern as `vportClient.js`.
- **target_actor_id stays for gas/reviews** — gas and review tables use `profile_id` (FK to `vport.profiles.id`) for the target vport, so `resolveProfileId` is required in all gas DALs.

## Files changed

- `apps/VCSM/src/features/hydration/vcsmActorHydrator.js`
- `apps/VCSM/src/services/supabase/reviewsClient.js` ← new
- `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportServicesByActor.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js`
- `apps/VCSM/src/features/booking/dal/readVportServicesByActor.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/listVportActorMenuCategories.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/createVportActorMenuCategory.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/readVportActorMenuCategories.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuCategory.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/listVportActorMenuItems.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/createVportActorMenuItem.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/readVportActorMenuItems.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuItem.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPrices.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPrices.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportStationPriceSettings.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPriceHistory.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPriceReviews.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js`
- `zNOTFORPRODUCTION/logan/vcsm/runtime/vcsm.runtime.rpc-audit.md` ← new
- `zNOTFORPRODUCTION/planning/april/13/13-05.md`
- `zNOTFORPRODUCTION/planning/.tp-ready.md`

## Problems solved

- **All `vc.vport_*` DAL references eliminated** — zero `from("vport_*")` calls remain in the vport DAL tree or booking DAL.
- **Gas table `target_actor_id` → `profile_id`** — all 5 gas DALs now resolve `profile_id` via `resolveProfileId(actorId)` before querying `vport.*` tables.
- **Review schema migration** — review read/write DALs migrated to `reviews.*` engine schema. `dimension_key`-to-`dimension_id` resolution handled inside the write DAL via batch lookup.
- **ownerActorId null for pre-migration vport actors** — hydrator now reads `vport.profile_actor_access` as fallback when `vc.actor_owners` row is missing.
- **RPC audit baseline established** — first complete audit of all RPC calls vs live DB. Previously unknown that `delete_my_account` and `delete_my_vport` functions are missing entirely.

## Open items

- **DB-1** — `vport.create_vport_for_actor`: add INSERT into `vport.profile_categories` (awaiting SQL approval)
- **DB-2** — `vport.create_vport_for_actor`: add `perform identity.refresh_actor_directory_row` call (awaiting SQL approval)
- **DB-3** — `identity.refresh_actor_directory_row`: fix vport source from `vc.vports` → `vport.profiles` (awaiting SQL approval)
- **DB-4** — `vport.profile_categories` INSERT RLS policy (awaiting SQL approval)
- **DB-5** — `vc.actor_owners` backfill SQL for pre-migration vport actors (awaiting approval to run)
- **DB-6** — `delete_my_account` function is missing from all schemas — account deletion broken
- **DB-7** — `delete_my_vport` function is missing — may be replaced by `dalDeleteOwnedVportById` (needs decision)
- Full SQL proposals for all 7 items are in `zNOTFORPRODUCTION/planning/.tp-ready.md`

## Context for next session

All frontend DAL files have been migrated from the old `vc.vport_*` schema to the new `vport.*`, `reviews.*`, and schema-prefixed clients — zero legacy table references remain in the vport DAL tree. The remaining work is entirely on the DB side: 7 SQL changes catalogued in `.tp-ready.md`, each needing explicit approval before execution. The most impactful are DB-1/DB-2 (vport creation flow not persisting category or refreshing directory) and DB-5 (actor_owners backfill). The RPC audit Logan doc at `zNOTFORPRODUCTION/logan/vcsm/runtime/vcsm.runtime.rpc-audit.md` is the reference for all RPC status going forward.
