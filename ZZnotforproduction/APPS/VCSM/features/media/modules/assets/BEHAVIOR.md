---
title: Assets Module — Behavior
status: STUB
feature: media
module: assets
source: architect-derived
created: 2026-06-05
---

# media / modules / assets — BEHAVIOR

## Confirmed Behaviors

### Engine Boot (setup.js)
- setup.js called at app boot — configureMediaEngine with Cloudflare R2 transport
- Registers VCSM-specific R2 credentials and upload handler into the media engine

### Create Media Asset
- Caller provides ownerActorId, createdByActorId, upload result, scope, owner_source
- createMediaAssetController: validates actorId presence (no session cross-check)
- mapUploadResultToMediaAsset → insertMediaAssetDAL → platform.media_assets INSERT
- Returns created media asset record

### Soft Delete Media Asset
- softDeleteMediaAssetController → softDeleteMediaAssetDAL
- platform.media_assets UPDATE: sets status='deleted', deleted_at=now(), deleted_by_actor_id
- RLS USING + WITH CHECK enforces ownership via vc.actor_owners
- {public} policy (media_assets_vc_owner_update) coexists — unrestricted column UPDATE (TICKET-PLATFORM-RLS-001)

### R2 Upload Path (via engine — cross-feature callers)
- Consuming features (dashboard/flyerEditor, wanders) call uploadMediaController / uploadFlyerImageCtrl
- THOR BLOCKER: flyerEditor path does not call requireOwnerActorAccess before R2 write
- THOR BLOCKER: wanders path passes userId (auth.users.id) not actorId as ownerActorId

## Must Never Happen

- R2 upload must not proceed without requireOwnerActorAccess verification
- userId must never be used in place of actorId in storage keys or media asset records
- platform.media_assets INSERT must not succeed for unauthorized actor identities

## TODO

- [ ] Confirm createMediaAssetController actorId validation — exact check performed
- [ ] Confirm SCOPE_MAP values in mediaAsset.model.js
- [ ] Confirm resolveAppId.read.dal.js — what is the App ID used for in media scoping?
