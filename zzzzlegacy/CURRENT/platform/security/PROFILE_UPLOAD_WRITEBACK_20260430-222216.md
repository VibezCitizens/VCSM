# Profile Upload Media Asset Write-back
**Timestamp:** 2026-04-30 22:22:16  
**Scope:** VCSM — settings/profile upload pipeline  
**Migration:** Required — 3 missing columns

---

## Backup Location

`zNOTFORPRODUCTION/zcontract/doc/backups/profile-upload-writeback-20260430-222216/`

| Backup File | Original |
|---|---|
| `useProfileUploads.js.bak` | `apps/VCSM/src/features/settings/profile/hooks/useProfileUploads.js` |
| `vport.write.profileMedia.dal.js.bak` | `apps/VCSM/src/features/vport/dal/vport.write.profileMedia.dal.js` |

---

## Step 2 — Column Audit

| Column | Exists Before This Migration |
|---|---|
| `vport.profiles.avatar_media_asset_id` | ✅ (migration 20260430400000) |
| `vport.profiles.banner_media_asset_id` | ❌ MISSING |
| `public.profiles.photo_media_asset_id` | ❌ MISSING |
| `public.profiles.banner_media_asset_id` | ❌ MISSING |
| `vc.user_profiles` | Schema not present (user identity lives in `public.profiles`) |

---

## Migration Created

`apps/VCSM/supabase/migrations/20260430500000_profile_media_asset_writeback_columns.sql`

Adds:
- `public.profiles.photo_media_asset_id uuid REFERENCES platform.media_assets(id) ON DELETE SET NULL`
- `public.profiles.banner_media_asset_id uuid REFERENCES platform.media_assets(id) ON DELETE SET NULL`
- `vport.profiles.banner_media_asset_id uuid REFERENCES platform.media_assets(id) ON DELETE SET NULL`

Sparse indexes on all three new columns.

No new GRANTs required:
- `public.profiles` — table-level GRANT UPDATE exists in base schema (existing `profile.write.dal.js` already updates `photo_url`, `banner_url`)
- `vport.profiles` — `GRANT UPDATE` granted in migration 20260427060000

---

## Files Changed

| File | Status | Change |
|---|---|---|
| `supabase/migrations/20260430500000_profile_media_asset_writeback_columns.sql` | NEW | 3 missing columns + indexes |
| `src/features/settings/profile/dal/profileMediaAsset.write.dal.js` | NEW | `updateUserPhotoMediaAssetIdDAL`, `updateUserBannerMediaAssetIdDAL` |
| `src/features/vport/dal/vport.write.profileMedia.dal.js` | MODIFIED | Added `updateVportBannerMediaAssetIdDAL` |
| `src/features/settings/profile/controller/recordProfileMediaAsset.controller.js` | NEW | Orchestrates `createMediaAssetController` + scoped write-back |
| `src/features/settings/profile/hooks/useProfileUploads.js` | MODIFIED | Replaced `recordMediaAsset` fire-and-forget with `recordProfileMediaAssetController` |

---

## Upload Scopes — Full Status

| Scope | Upload | media_assets record | Domain write-back | Notes |
|---|---|---|---|---|
| `user_avatar` | ✅ | ✅ | ✅ **NOW WIRED** | `public.profiles.photo_media_asset_id` |
| `user_banner` | ✅ | ✅ | ✅ **NOW WIRED** | `public.profiles.banner_media_asset_id` |
| `vport_avatar` | ✅ | ✅ | ✅ **NOW WIRED** | `vport.profiles.avatar_media_asset_id` |
| `vport_banner` | ✅ | ✅ | ✅ **NOW WIRED** | `vport.profiles.banner_media_asset_id` |
| `vport_creation_avatar` | ✅ | ✅ | ✅ (prior session) | `vport.profiles.avatar_media_asset_id` via `submitCreateVport.controller.js` |
| `vibe_post` | ✅ | ✅ | ✅ (prior session) | `vc.post_media.media_asset_id` |
| `story_24drop` | ✅ | ✅ | ✅ (prior session) | `vc.post_media.media_asset_id` |
| `vdrop` | ✅ | ✅ | ✅ (prior session) | `vc.post_media.media_asset_id` |
| `chat_attachment` | ✅ | ✅ | ✅ (prior session) | `chat.message_attachments.media_asset_id` |
| `wanders_card` | ✅ | ✅ | ✅ (prior session) | `wanders.cards.media_asset_id` |
| `portfolio_media` | ✅ | ✅ | No profile row target (asset URL stored directly in portfolio table) | Intentionally no write-back |
| `menu_item_photo` | ✅ | ✅ | No profile row target (stored directly in menu_item_media) | Intentionally no write-back |
| `design_asset` | ✅ | ✅ | No dedicated FK column (flyer builder uses URL directly) | Intentionally no write-back |

---

## Architecture

```
useProfileUploads (hook)
  → uploadMediaController (@media engine)        ← upload to R2
  → recordProfileMediaAssetController (controller)  ← non-blocking .catch()
       → createMediaAssetController              ← insert into platform.media_assets
       → writeBack({ scope, subjectId, ... })    ← route to correct DAL
            user_avatar  → updateUserPhotoMediaAssetIdDAL  → public.profiles
            user_banner  → updateUserBannerMediaAssetIdDAL → public.profiles
            vport_avatar → updateVportAvatarMediaAssetIdDAL → vport.profiles
            vport_banner → updateVportBannerMediaAssetIdDAL → vport.profiles
```

---

## Step 8 — Verification SQL (read-only)

Run in Supabase dashboard after applying the migration and performing at least one upload of each type:

```sql
-- User profile write-back
SELECT id, photo_url, banner_url,
       photo_media_asset_id,
       banner_media_asset_id,
       updated_at
FROM public.profiles
WHERE photo_media_asset_id IS NOT NULL
   OR banner_media_asset_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;

-- Vport profile write-back
SELECT id, avatar_url, banner_url,
       avatar_media_asset_id,
       banner_media_asset_id,
       updated_at
FROM vport.profiles
WHERE avatar_media_asset_id IS NOT NULL
   OR banner_media_asset_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;

-- Latest media_assets rows (confirm inserts are arriving)
SELECT id, scope, media_role, owner_actor_id, public_url, storage_path, created_at
FROM platform.media_assets
ORDER BY created_at DESC
LIMIT 20;
```

---

## Build Validation

- `npm run build` → ✅ built in 5.74s, no errors
- `select("*")` grep → CLEAN
- Supabase imports in controllers → CLEAN
- DAL imports in hooks → CLEAN
- Relative imports (`from '../`) in new files → CLEAN
- All new/modified files under 300 lines → ✅
