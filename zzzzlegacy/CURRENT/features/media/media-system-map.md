# Media System Map

Last Updated: 2026-05-09

## Overview

Media upload for posts is a two-phase system:
1. **Upload to R2** — files go to Cloudflare R2 via `engines/media`
2. **Record metadata** — upload results are recorded in `platform.media_assets` and linked to `vc.post_media` rows (non-blocking, post-creation)

---

## Upload Flow (Phase 1)

### Entry Point

```
apps/VCSM/src/features/upload/api/uploadMedia.js
```

Function: `uploadMedia(files, actorId, mode)`

Scope mapping:
- `mode === 'post'` → scope `'vibe_post'`
- `mode === '24drop'` → scope `'story_24drop'`
- `mode === 'vdrop'` → scope `'vdrop'`

For `mode === 'post'` (Vibes): filters input to images only (file type starts with `image/`), runs `Promise.all` across all images (up to 10). For other modes: first file only.

### Engine Upload Controller

```
engines/media/src/controller/uploadMedia.controller.js
```

Function: `uploadMediaController({ file, scope, ownerActorId, opts })`

Pipeline:
1. `getScopeConfig(scope)` — reads scope rules from `uploadScopes.js`
2. `validateMediaFile(file, scope)` — checks MIME whitelist and size limit
3. `classifyMediaFile(file)` — returns `{ mediaKind: 'image' | 'video' }`
4. `compressImageForScope(file, scope)` — compress if scope has `compression` config (skipped for video)
5. Re-validate size after compression
6. `getImageDimensions(uploadFile)` — best-effort, non-fatal
7. `buildMediaStorageKey(prefix, ownerActorId, file, opts)` — collision-proof UUID path
8. `dalUploadToR2(uploadFile, storageKey)` — calls injected `uploadFn`
9. `normalizeMediaUploadResult(...)` — returns `MediaUploadResult`

### Storage Destination

- Provider: **Cloudflare R2**
- Bucket: `post-media` (confirmed in `mediaAsset.model.js` SCOPE_MAP and `insertMediaAssetDAL`)
- Storage key format: `{prefix}/{ownerActorId}/{extraPath/}{yyyy}/{mm}/{dd}/{uuid}.{ext}`
- `uploadFn` is injected via engine configuration — the actual HTTP transport is not defined within the engine itself

### Upload Scope Configs (post-relevant)

| Scope | Prefix | Max Size | Compression | Max Files |
|---|---|---|---|---|
| `vibe_post` | `vibes` | 50MB | maxDim 1080, quality 0.8 | 10 |
| `story_24drop` | `stories` | 50MB | maxDim 1080, quality 0.8 | 10 |
| `vdrop` | `vdrops` | 50MB | maxDim 1080, quality 0.8 | 10 |

---

## Database Recording (Phase 2)

### vc.post_media

```
apps/VCSM/src/features/upload/dal/insertPostMedia.dal.js
```

Called synchronously during `createPostController`. Inserts one row per uploaded file.

Columns: `post_id, url, media_type, sort_order`

Returns `[{ id, sort_order }]` ordered by sort_order.

### platform.media_assets

```
apps/VCSM/src/features/upload/controller/recordPostMedia.controller.js
apps/VCSM/src/features/media/controller/createMediaAsset.controller.js
apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js
```

Called **non-blocking** after `createPostController` returns. Dispatched with `.catch()` only — failures are logged but do not affect the post creation result from the user's perspective.

Steps:
1. `resolveVcsmAppIdDAL()` — looks up VCSM app UUID from `platform.apps` (cached after first call)
2. `createMediaAssetController(...)` → `mapUploadResultToMediaAsset(...)` → `insertMediaAssetDAL(row)` → writes to `platform.media_assets`
3. `updatePostMediaAssetIdDAL({ postMediaId, mediaAssetId })` → updates `vc.post_media.media_asset_id`

### platform.media_assets Key Columns

```
app_id, owner_source, owner_actor_id, scope_domain, scope_type, scope_id,
media_kind, media_role, mime_type, size_bytes, width, height, duration_ms,
storage_provider, bucket, storage_key, public_url, variants, meta, status,
created_by_actor_id
```

For post media:
- `owner_source = 'vc'`
- `scope_domain = 'vc'`
- `scope_type = 'post_media'`
- `scope_id = postId`
- `storage_provider = 'cloudflare_r2'`
- `bucket = 'post-media'`
- `status = 'uploaded'`
- `media_role = 'original'`

---

## Media Reading (Feed Pipeline)

```
apps/VCSM/src/features/feed/dal/feed.read.media.dal.js
```

Function: `readPostMediaMap(postIds)`

- Batches all post IDs in one query to `vc.post_media`
- Columns: `post_id, url, media_type, sort_order`
- Orders by `sort_order ASC`
- Returns `Map<postId, [{url, media_type, sort_order}]>`
- TTL cache: 60s per `post_id`

Fallback in `normalizeFeedRows.model.js`: if `vc.post_media` returns nothing for a post, falls back to the legacy `media_url` / `media_type` columns on `vc.posts`.

---

## Media Reading (Post Detail)

```
apps/VCSM/src/features/post/postcard/dal/post.read.dal.js → fetchPostByIdDAL
```

Fetches `post_media` as a nested join:
```js
post_media (url, media_type, sort_order)
```

Ordered by `sort_order ASC` via `foreignTable: 'post_media'`.

---

## Orphan Risk

**Risk: `platform.media_assets` rows can be orphaned if `vc.post_media` update fails.**

The `recordPostMediaController` uses `Promise.allSettled` — individual record failures are caught and logged, but do not block. If `insertMediaAssetDAL` succeeds but `updatePostMediaAssetIdDAL` fails, the `platform.media_assets` row exists but `vc.post_media.media_asset_id` remains null. No cleanup or retry is implemented.

**Risk: `vc.post_media` rows can be orphaned if post rollback occurs.**

The `createPostController` rolls back the `vc.posts` row if `insertPostMedia` fails (calls `deletePostByIdDAL`). However, the rollback does not cascade to `platform.media_assets` records that may have been partially created if the non-blocking `recordPostMediaController` had already been dispatched (which it is dispatched only after createPostController returns successfully, so this is not an issue in practice).

**Risk: Uploaded R2 files are never cleaned up on rollback.**

The `createPostController` deletes the `vc.posts` row on media insert failure, but the files already uploaded to R2 are not deleted. There is no orphan cleanup mechanism for R2 objects.

---

## Media Ordering

`vc.post_media` has a `sort_order` column. The feed pipeline preserves sort_order (reads ordered by `sort_order ASC`). The `MediaCarousel.jsx` component renders media in the array order received. The upload controller preserves input order: `sort_order: idx`.

---

## Cleanup / Deletion

When a post is soft-deleted (`softDeletePostDAL`), `vc.posts.deleted_at` is set. The feed pipeline filters `is("deleted_at", null)`. However, `vc.post_media` rows are NOT deleted or flagged — they remain with valid URLs pointing to R2. No garbage collection mechanism was found.
