# Media Engine V2 — Portfolio + Menu Recording Manifest

**Timestamp:** 2026-04-30 20:00:00  
**Git Branch:** main

---

## Purpose

Wire `platform.media_assets` recording into the portfolio_media and menu_item_photo upload paths.

After each successful upload:
1. Create a `platform.media_assets` row
2. Write its `id` as `media_asset_id` to the domain media table

Schema columns confirmed live before implementation:
- `vport.portfolio_media.media_asset_id` (uuid)
- `vport.menu_item_media.media_asset_id` (uuid)

---

## Flows Wired

### Portfolio media
| Step | Location |
|---|---|
| Upload | `usePortfolioMediaUpload.js` → returns full `MediaUploadResult` (was: string) |
| Form | `PortfolioItemForm.jsx` → calls `addPortfolioMediaWithRecord` (was: `addMedia` directly) |
| Composite controller | `addPortfolioMediaWithRecord.controller.js` → calls `addMedia` → records → updates `media_asset_id` |
| Recording DAL | `portfolioMediaRecord.write.dal.js` → UPDATE `vport.portfolio_media SET media_asset_id = ?` |

### Menu item photo
| Step | Location |
|---|---|
| Upload | `VportActorMenuItemFormModal.jsx` → `uploadImageIfNeeded` returns `{ url, mediaUploadResult }` |
| Payload | `mediaUploadResult` added to payload passed to `onSave` |
| Hook | `useVportActorMenuItemsMutations` forwards payload transparently (no change needed) |
| Controller | `saveVportActorMenuItem.controller.js` → accepts `mediaUploadResult`, calls `recordMenuItemMedia` |
| Recording DAL | `createVportMenuItemMedia.dal.js` → INSERT into `vport.menu_item_media` with `media_asset_id` |

---

## Files Created

| File | Purpose |
|---|---|
| `apps/VCSM/src/features/dashboard/vport/dal/write/portfolioMediaRecord.write.dal.js` | UPDATE `vport.portfolio_media.media_asset_id` |
| `apps/VCSM/src/features/dashboard/vport/controller/addPortfolioMediaWithRecord.controller.js` | Wraps `addMedia` + recording + update (non-blocking) |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/createVportMenuItemMedia.dal.js` | INSERT into `vport.menu_item_media` with `media_asset_id` |

## Files Modified

| File | Change |
|---|---|
| `apps/VCSM/src/features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioMediaUpload.js` | Return full `MediaUploadResult` instead of just `publicUrl` |
| `apps/VCSM/src/features/dashboard/vport/screens/components/portfolio/PortfolioItemForm.jsx` | Use `uploadResult.publicUrl` as URL; call `addPortfolioMediaWithRecord` instead of `addMedia` |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal.jsx` | `uploadImageIfNeeded` returns `{ url, mediaUploadResult }`; adds `mediaUploadResult` to payload |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js` | Accept `mediaUploadResult`; call `recordMenuItemMedia` after item create/update |

## Files Backed Up

| File | Backup Location |
|---|---|
| `usePortfolioMediaUpload.js` | `zNOTFORPRODUCTION/zcontract/doc/backups/media-v2-portfolio-menu-20260430-200000/` |
| `PortfolioItemForm.jsx` | same |
| `VportActorMenuItemFormModal.jsx` | same |
| `saveVportActorMenuItem.controller.js` | same |

---

## Rules Enforced

- No Supabase import outside DAL layer
- No DAL import outside controller layer
- All recording is non-blocking (fire-and-forget IIFE with catch)
- DEV-only warnings on recording failure
- No existing return shapes changed
- No UI visual changes
- No schema changes (columns were already live)
- Engine `addMedia` call unchanged — composite controller wraps it

---

## Verification

Build: `cd apps/VCSM && npm run build` — PASSED (6.29s, 255 precache entries)
