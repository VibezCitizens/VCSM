---
title: Assets Module — Index
status: STUB
feature: media
module: assets
source: architect+venom+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/media/
scanner-version: 1.1.0
---

# media / modules / assets

Platform media asset service layer — Cloudflare R2 upload wiring, platform.media_assets INSERT/soft-delete. No screens. **THOR BLOCKERS: R2 upload without ownership check (cross-feature), userId passed as actorId in R2 storage key (cross-feature), {public} UPDATE policy on media_assets (TICKET-PLATFORM-RLS-001 deferred).**

## Module Summary

| Field | Value |
|---|---|
| Module | assets |
| Feature | media |
| Source Path | apps/VCSM/src/features/media/ |
| Screens | 0 (service layer) |
| Routes | 0 |
| Write Surfaces | platform.media_assets INSERT, platform.media_assets UPDATE (soft-delete), Cloudflare R2 (via engine) |
| Controllers | 2 (createMediaAsset, softDeleteMediaAsset) |
| DAL Files | 3 (mediaAssets.write, mediaAssets.softDelete, resolveAppId.read) |
| Models | 1 (mediaAsset.model — mapUploadResultToMediaAsset, mapMediaAssetRow, SCOPE_MAP) |
| Adapters | 2 (media.adapter, mediaAppId.adapter) |
| Engine Delegation | engines/media (Cloudflare R2 transport configured in setup.js) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| setup.js | Bootstrap | configureMediaEngine with Cloudflare R2 transport; called at app boot |
| adapters/media.adapter.js | Adapter | Public boundary — primary re-export barrel |
| adapters/mediaAppId.adapter.js | Adapter | resolveVcsmAppId passthrough |
| controller/createMediaAsset.controller.js | Controller | Validates actorId presence (no session verify); calls insertMediaAssetDAL |
| controller/softDeleteMediaAsset.controller.js | Controller | Soft-delete orchestration |
| dal/mediaAssets.write.dal.js | DAL | platform.media_assets INSERT (explicit column list) |
| dal/mediaAssets.softDelete.dal.js | DAL | platform.media_assets UPDATE — sets status='deleted', deleted_at, deleted_by_actor_id |
| dal/resolveAppId.read.dal.js | DAL | App ID resolution for media scoping |
| model/mediaAsset.model.js | Model | mapUploadResultToMediaAsset, mapMediaAssetRow, SCOPE_MAP |

## Write Surface Map

| Operation | Schema | Table | Guard |
|---|---|---|---|
| INSERT | platform | media_assets | actorId presence check (no session verify — BW-MEDIA-003); INSERT RLS incomplete for vport/chat owner_source |
| UPDATE | platform | media_assets | RLS USING + WITH CHECK (actor_owners); {public} policy coexists (TICKET-PLATFORM-RLS-001) |
| R2 upload | Cloudflare R2 | — | requireOwnerActorAccess NOT called in flyerEditor path (THOR BLOCKER) |

## Security Flags

- **THOR BLOCKER** HIGH: VEN-MEDIA-003 / BW-MEDIA-001 — uploadFlyerImageCtrl in dashboard/flyerEditor.controller.js uploads to R2 without calling requireOwnerActorAccess; any authenticated user can write to any VPORT's R2 storage namespace; adversarially confirmed BYPASSED
- **THOR BLOCKER** HIGH: VEN-MEDIA-004 / BW-MEDIA-002 — wanders controllers pass auth.users.id (userId) as ownerActorId to uploadMediaController; identity namespace violation in R2 storage key; adversarially confirmed BYPASSED
- MEDIUM (open ticket): VEN-MEDIA-001 — {public} role media_assets_vc_owner_update policy coexists on live DB; unrestricted column UPDATE; deferred Phase 6 cleanup (TICKET-PLATFORM-RLS-001)
- MEDIUM: VEN-MEDIA-002 / BW-MEDIA-004 — INSERT RLS policies incomplete for vport/chat owner_source
- MEDIUM: BW-MEDIA-003 — createMediaAssetController accepts caller-supplied ownerActorId/createdByActorId without session cross-check; DB RLS is sole ownership guard
- MEDIUM: BW-MEDIA-005 — ownerActorId (actor UUID) embedded in public R2 CDN URLs via storage key format; violates no-raw-IDs policy
- LOW: BW-MEDIA-006 — no uniqueness guard on storage_key in insertMediaAssetDAL; duplicate media_assets records possible for same R2 object

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm flyerEditor.controller.js call site — confirm requireOwnerActorAccess is absent
- [ ] Confirm wanders cards.controller.js:228 — confirm userId vs actorId mismatch
- [ ] Confirm platform.media_assets INSERT RLS — which owner_source values have WITH CHECK policies?
- [ ] Add storage_key unique constraint or conflict guard in insertMediaAssetDAL
- [ ] Read TICKET-PLATFORM-RLS-001 — {public} policy cleanup timeline
