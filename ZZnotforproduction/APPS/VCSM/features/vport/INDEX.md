---
name: vcsm.vport.index
description: VCSM vport feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / vport

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 3 (fm) / 2 (cg) | submitCreateVport, vportCoreOps (thin re-export), getVportServiceCatalog |
| DAL files | 4 (fm) / 21 (cg) | vport.core.dal.js is primary; vport.read.vportRecords.dal.js duplicates listMyVports |
| Hooks | 4 (fm) / 5 (cg) | useCreateVport, useRestoreVport, useVportCoreOps, useVportServiceCatalog |
| Models | 2 (fm) / 6 (cg) | createVportForm.model.js, vportServiceCatalog.model.js |
| Screens | 1 (fm) / 3 (cg) | RestoreVportScreen.jsx; public/ folder contains VportPhonePreview, VportPreviewCard, VportPreviewShowcase |
| Components | 3 (fm/cg) | CreateVportDebugPanel.jsx, CreateVportProfileTab.jsx, CreateVportServicesTab.jsx |
| Adapters | 3 (fm) | vport.adapter.js (boundary), vport.public.adapter.js, CreateVportForm.jsx.adapter.js |
| Barrels | 15 (cg) | vport.public.js (deprecated migration barrel) + module index files |
| Tests | 0 | No test coverage detected by scanner |
| Routes | 0 | No route-map entries; RestoreVportScreen reached via navigation redirect only |
| Total source files | 29 | From scanner sourceFileCount |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | (vport schema) | — | createVport → create_vport |
| rpc | (vport schema) | — | softDeleteVport → soft_delete_vport |
| rpc | (vport schema) | — | hardDeleteVport → hard_delete_vport |
| rpc | (vport schema) | — | restoreVport → restore_vport |
| update | (vport schema) | profiles | updateVport — name, slug, avatar_url, banner_url, bio, is_active |
| update | (vport schema) | profiles | updateVportAvatarMediaAssetIdDAL — avatar_media_asset_id, avatar_url keyed by actor_id |
| update | (vport schema) | profiles | updateVportBannerMediaAssetIdDAL — banner_media_asset_id keyed by actor_id |

## Security-Sensitive Surfaces

- **create_vport RPC**: provisions a new actor identity; auth guard enforced via requireUser() + DB-level AUTH_REQUIRED check. Slug collision, duplicate VPORT type, and invalid category handled by error string matching on RPC response.
- **soft_delete_vport / hard_delete_vport / restore_vport RPCs**: ownership-scoped lifecycle mutations; DB enforces VPORT_NOT_FOUND_OR_UNAUTHORIZED. Hard delete requires prior soft-delete.
- **updateVportAvatarMediaAssetIdDAL / updateVportBannerMediaAssetIdDAL**: direct UPDATE on vport.profiles keyed by actor_id — no explicit RLS check in feature code; relies on vportClient schema-level policy. Flagged for VENOM audit.

## Engine Dependencies

- booking — createOrganizationLocationWorkspace bootstrapped for barbershop type on creation
- identity — refreshVcActorDirectory called after create and update to sync actor directory
- media — uploadMediaController, createMediaAssetController for avatar write-back after creation
- notification — scanner-detected; not directly observed in source scan
- profile — scanner-detected; not directly observed in source scan

## Routes

No routes in route-map for this feature. RestoreVportScreen is reachable only via internal navigation side-effect (identity state redirect). CreateVportForm is embedded as a component within other feature routes (settings, onboarding).

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — placeholder only, no real contract |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
