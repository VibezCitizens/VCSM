---
name: vcsm.media.index
description: VCSM media feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / media

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 2 | createMediaAsset.controller.js, softDeleteMediaAsset.controller.js |
| DAL files | 5 | mediaAssets.write.dal.js, mediaAssets.softDelete.dal.js, resolveAppId.read.dal.js (+ 2 callgraph nodes from barrel resolution) |
| Hooks | 0 | None — no view state; feature is service-layer only |
| Models | 2 | mediaAsset.model.js — mapUploadResultToMediaAsset, mapMediaAssetRow, SCOPE_MAP |
| Screens | 0 | None — no routes |
| Components | 0 | None — no UI |
| Adapters | 1 | media.adapter.js (public boundary); mediaAppId.adapter.js (resolveVcsmAppId passthrough) |
| Barrels | 3 | Detected in callgraph scan; media.adapter.js is the primary re-export barrel |
| Tests | 0 | No test files detected |
| Routes | 0 | No routes registered in route-map |
| Total source files | 9 | setup.js + 2 adapters + 2 controllers + 3 DAL + 1 model |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| update | platform | media_assets | softDeleteMediaAssetDAL — sets status='deleted', deleted_at, deleted_by_actor_id |
| insert | platform | media_assets | insertMediaAssetDAL — full row insert with explicit column list |

## Security-Sensitive Surfaces

- **platform.media_assets INSERT** (`insertMediaAssetDAL`): High sensitivity. Writes media ownership records to the platform schema. App-layer validates actorId presence but no DB-layer RLS WITH CHECK enforces row ownership on INSERT. Relies on the caller supplying a valid `ownerActorId`.
- **platform.media_assets UPDATE** (`softDeleteMediaAssetDAL`): Moderate risk mitigated. RLS USING + WITH CHECK policy enforces authenticated user owns the actor via `vc.actor_owners`, and WITH CHECK restricts to `status='deleted'` only. A known coexisting `{public}` policy (`media_assets_vc_owner_update`) grants unrestricted column UPDATE to the public role — deferred cleanup per Phase 6 migration plan (documented in DAL source).

## Engine Dependencies

- `@media` — shared media engine (engines/media). VCSM injects Cloudflare R2 transport via `configureMediaEngine` in setup.js.
- `notification` — listed in scanner engine-candidates but not found in any source file. Likely a scanner artifact from a transitive reference in a consumer feature. Flag for ARCHITECT verification.

## Routes

No routes in route-map for this feature. The media feature is a service-layer module with no UI entry points.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — but content is PLACEHOLDER (no real contract authored) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
