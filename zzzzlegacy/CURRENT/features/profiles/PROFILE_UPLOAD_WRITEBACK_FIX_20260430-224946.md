# Profile Upload Write-back Fix
**Timestamp:** 2026-04-30 22:49:46
**Scope:** VCSM — settings/profile upload write-back

---

## Root Cause

Three compounding issues caused `media_asset_id` to never be written:

1. **`recordProfileMediaAssetController` had a silent early return** — `if (!ownerActorId) return null` with no log. If `identity.actorId` was null at call time, the entire chain exited invisibly.

2. **`createMediaAssetController` was called inside the controller**, where `userId` and `actorId` are not in scope. The controller had no way to distinguish null-actor from an actual failure, and no way to provide a fallback.

3. **`.catch()` errors were only logged via BugBunny** — invisible unless BugBunny dev mode was active. The failure was completely silent in normal dev usage.

---

## Fix Applied

**Restructure:** Pull `createMediaAssetController` up into `useProfileUploads.js` (the hook), where both `actorId` and `userId` are in scope. Make `recordProfileMediaAssetController` a pure write-back router.

### `useProfileUploads.js`

- Calls `createMediaAssetController` directly in each scope's async IIFE
- Guards `actorId` with an explicit `console.warn` (instead of silent skip)
- Logs upload result, media asset result, and write-back call at each step
- Calls `recordProfileMediaAssetController({ scope, mediaAssetId, profileId, vportProfileId })` with resolved IDs

### `recordProfileMediaAsset.controller.js`

- Removed `createMediaAssetController` import entirely
- Pure write-back router: receives `mediaAssetId` directly, routes to DAL by scope
- All branches log success or failure explicitly via `console.log` / `console.warn`
- Write-back DB failure is caught, logged, and non-fatal

---

## Scope-to-Column Mapping

| Scope | profileId param | vportProfileId param | Column written |
|---|---|---|---|
| `user_avatar` | `subjectId` (auth.uid()) | null | `public.profiles.photo_media_asset_id` |
| `user_banner` | `subjectId` (auth.uid()) | null | `public.profiles.banner_media_asset_id` |
| `vport_avatar` | null | `subjectId` (vport.profiles.id) | `vport.profiles.avatar_media_asset_id` |
| `vport_banner` | null | `subjectId` (vport.profiles.id) | `vport.profiles.banner_media_asset_id` |

---

## Backup

`zNOTFORPRODUCTION/zcontract/doc/backups/profile-upload-writeback-align-20260430-224946/`

---

## Files Changed

| File | Change |
|---|---|
| `src/features/settings/profile/hooks/useProfileUploads.js` | Restructured — calls `createMediaAssetController` + `recordProfileMediaAssetController` inline with full debug logging |
| `src/features/settings/profile/controller/recordProfileMediaAsset.controller.js` | Simplified to pure write-back router — no `createMediaAssetController`, accepts `mediaAssetId` directly |

---

## Contract Checks

| Check | Result |
|---|---|
| Hooks import DAL | CLEAN |
| `select("*")` | CLEAN |
| Supabase in controller | CLEAN |
| All files under 300 lines | ✅ (175 + 71) |
| Build | ✅ built in 5.38s, no errors |

---

## Debug Trace (what you'll see in DevTools console after this fix)

On user avatar save:
```
[useProfileUploads] upload done: { scope: 'user_avatar', publicUrl: '...', storageKey: '...', actorId: 'uuid...', subjectId: 'uuid...' }
[useProfileUploads] media asset created: { id: 'uuid...', scope: 'user_avatar' }
[recordProfileMediaAsset] write-back payload: { scope: 'user_avatar', mediaAssetId: 'uuid...', profileId: 'uuid...', vportProfileId: null }
[recordProfileMediaAsset] ✓ wrote user_avatar → public.profiles.photo_media_asset_id { profileId: 'uuid...', mediaAssetId: 'uuid...' }
```

If `actorId` is null:
```
[useProfileUploads] actorId is null for user_avatar — skipping media_assets record
```

If DB write fails:
```
[recordProfileMediaAsset] write-back DB error (non-fatal): <error message>
```

---

## Verification SQL

```sql
SELECT id, photo_media_asset_id, banner_media_asset_id, updated_at
FROM public.profiles
WHERE photo_media_asset_id IS NOT NULL
   OR banner_media_asset_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;

SELECT id, avatar_media_asset_id, banner_media_asset_id, updated_at
FROM vport.profiles
WHERE avatar_media_asset_id IS NOT NULL
   OR banner_media_asset_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;
```
