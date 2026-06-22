# Media Engine V2 — App-Side Recording Layer Manifest

**Timestamp:** 2026-04-30 19:40:01  
**Git Branch:** main  
**Git Status (VCSM-relevant):** apps/VCSM modifications in progress (Traffic changes unrelated)

---

## Purpose

Build the `platform.media_assets` recording layer for VCSM.  
After a Media Engine upload succeeds, write a row to `platform.media_assets`.  
Additive only — no existing rows migrated, no existing URL fields removed, no UI changed.

---

## Files to Create

| File | Reason |
|---|---|
| `apps/VCSM/supabase/migrations/20260430300000_create_platform_media_assets.sql` | New table: `platform.media_assets` with schema, RLS, and grants. Required for any DAL write to succeed. |
| `apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js` | DAL — only layer that may import Supabase for this feature |
| `apps/VCSM/src/features/media/model/mediaAsset.model.js` | Pure mapper — MediaUploadResult + context → insert payload |
| `apps/VCSM/src/features/media/controller/createMediaAsset.controller.js` | Controller — validates, maps, inserts, returns domain result |

## Files to Modify

| File | Reason |
|---|---|
| `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js` | Wire `createMediaAssetController` after successful `dalCreateDesignAsset` call in `ctrlUploadDesignAsset` (design_asset scope, non-blocking try/catch) |

---

## Files Backed Up

| Backed-Up File | Backup Location |
|---|---|
| `designStudio.assetsExports.controller.js` | `zNOTFORPRODUCTION/zcontract/doc/backups/media-engine-v2-20260430-194001/` |

---

## Schema Note

`platform.media_assets` is a brand-new table in a brand-new schema. This is additive infrastructure, not a modification of any existing table or RLS policy. Existing `vc.*` tables are not altered.

---

## Wiring Scope

Only `design_asset` scope is wired in this iteration.  
All other upload entry points remain unwired until V2 is verified stable.

---

## Contract Rules Enforced

- DAL is the only file that imports `supabaseClient`
- Controller imports only DAL and model — no Supabase
- No `select('*')` anywhere
- All imports use `@/...` alias (no relative paths in new modules)
- Model is pure — no side effects, no I/O
