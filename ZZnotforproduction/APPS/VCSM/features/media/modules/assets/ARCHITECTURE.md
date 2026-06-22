---
title: Assets Module — Architecture
status: STUB
feature: media
module: assets
source: architect-derived
created: 2026-06-05
---

# media / modules / assets — ARCHITECTURE

## Boot Configuration

```
app boot
  └── setup.js → configureMediaEngine(r2Transport, vcsmConfig)
        └── engines/media — registers R2 upload handler
```

## Create Asset Layer Stack

```
[consuming feature]
  └── media.adapter.js (public boundary)
        └── createMediaAssetController
              ├── actorId presence check (no session verify)
              ├── mapUploadResultToMediaAsset (model layer)
              └── insertMediaAssetDAL
                    └── platform.media_assets INSERT
                          └── RLS: INSERT policies present for some owner_source; vport/chat INCOMPLETE
```

## Soft Delete Layer Stack

```
[consuming feature]
  └── media.adapter.js
        └── softDeleteMediaAssetController
              └── softDeleteMediaAssetDAL
                    └── platform.media_assets UPDATE
                          ├── RLS USING: actor_owners ownership check ✓
                          ├── RLS WITH CHECK: status='deleted' only ✓
                          └── {public} media_assets_vc_owner_update policy coexists ← TICKET-PLATFORM-RLS-001
```

## R2 Upload Path (Cross-Feature — THOR BLOCKERS)

```
[dashboard/flyerEditor]
  └── uploadFlyerImageCtrl (flyerBuilder/controller/flyerEditor.controller.js)
        └── engines/media → R2 upload
              ← requireOwnerActorAccess NOT called  ← THOR BLOCKER

[wanders/core/controllers/cards.controller.js:228]
  └── uploadMediaController
        └── ownerActorId = user.id  ← auth.users UUID, not vc.actors.id  ← THOR BLOCKER
```

## Storage Key Format (R2 CDN)

```
R2 storage key: {scope}/{ownerActorId}/{filename}
                             ↑ actor UUID embedded in public CDN URL — BW-MEDIA-005
```

## TODO

- [ ] Confirm media.adapter.js full export list
- [ ] Confirm mediaAppId.adapter.js — is resolveVcsmAppId used for storage key namespacing?
- [ ] Trace requireOwnerActorAccess call sites — where is it called correctly vs missing?
