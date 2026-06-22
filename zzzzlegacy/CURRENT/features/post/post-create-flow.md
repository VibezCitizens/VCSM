# Post Create Flow

Last Updated: 2026-05-09

## Entry Point

```
apps/VCSM/src/features/upload/screens/UploadScreen.jsx
```

`UploadScreen` is a thin routing shell. It instantiates `useUploadSubmit()` and passes `handleSubmit` down to `UploadScreenModern`. After submission it calls `navigate("/")` to redirect home.

---

## UI Layer

```
apps/VCSM/src/features/upload/screens/UploadScreenModern.jsx
```

Renders the full compose UI. Manages local state for:
- `caption` (string)
- `visibility` (string — currently not forwarded to controller)
- `mode` (string: `'post'` | `'24drop'` | `'vdrop'`)
- `locationText` (string)
- `mentionsResolved` (array of `{ handle, actorId, kind, displayName, avatarUrl }`)

Uses `useMediaSelection()` for file state. UI-only `mentions` are derived from `extractMentions(caption)` for chip display. Resolved mentions come from typeahead selection.

---

## Hook

```
apps/VCSM/src/features/upload/hooks/useUploadSubmit.js
```

Function: `useUploadSubmit()`

Steps on submit:
1. Reads `identity` from `useIdentity()`
2. If files selected → calls `uploadMedia(files, actorId, mode)` → returns `{ mediaUrls, mediaTypes, uploadResults }`
3. Calls `createPostController({ identity, input })` with all form data
4. If `uploadResults.length > 0` → calls `recordPostMediaController(...)` **non-blocking** (`.catch()` only)
5. Returns `{ actorId, tags, postId, postMediaIds }`

---

## Media Upload Step

```
apps/VCSM/src/features/upload/api/uploadMedia.js
```

Function: `uploadMedia(files, actorId, mode)`

- Determines scope: `vibe_post` | `story_24drop` | `vdrop`
- For `mode !== 'post'`: uploads first file only via `uploadMediaController`
- For `mode === 'post'` (Vibes): filters to images only, max 10, runs `Promise.all(images.map(uploadMediaController))`

```
engines/media/src/controller/uploadMedia.controller.js
```

Function: `uploadMediaController({ file, scope, ownerActorId, opts })`

Pipeline:
1. Validate MIME and size against scope config (`engines/media/src/config/uploadScopes.js`)
2. Classify: image or video
3. Compress image if scope has `compression` config (`engines/media/src/lib/compressImage.js`)
4. Re-validate size after compression
5. Read image dimensions (best-effort)
6. Build storage key via `buildMediaStorageKey(prefix, ownerActorId, file, opts)` → format: `{prefix}/{ownerActorId}/{extraPath/}{yyyy}/{mm}/{dd}/{uuid}.{ext}`
7. Upload via `dalUploadToR2(file, storageKey)` → calls injected `uploadFn`, returns `{ publicUrl }`
8. Return `MediaUploadResult` shape

Storage destination: **Cloudflare R2**, bucket name `post-media`, via injected `uploadFn` configured by the host app at engine setup time.

---

## Post Creation Step

```
apps/VCSM/src/features/upload/controllers/createPost.controller.js
```

Function: `createPostController({ identity, input })`

Steps:
1. Validates `identity.actorId`
2. Calls `getCurrentAuthUserDAL()` — confirms auth session exists
3. Extracts hashtags from caption via `extractHashtags(caption)`
4. Normalizes `mentionsResolved` from UI (preferred) OR `extractMentions(caption)` as fallback
5. Enforces max 10 photos for mode `'post'`
6. Resolves `realm_id` via `resolveRealm(identity.isVoid)`
7. Inserts post via `insertPost(row)` → `vc.posts` → returns `{ id }`
8. If media URLs → calls `insertPostMedia(postId, items)` → `vc.post_media` — on error: **rolls back** by calling `deletePostByIdDAL(postId)` and rethrows
9. Resolves mention actor IDs (UI-resolved preferred; falls back to `findActorsByHandles` → `public.profiles` + `vport.profiles`)
10. Inserts mentions via `insertPostMentions(postId, mentionedActorIds)` → `vc.post_mentions`
11. Publishes mention notifications via `publishVcsmNotificationBatch(...)` (fire-and-forget, no await)
12. Returns `{ actorId, tags, postId, postMediaIds }`

---

## Media Asset Registration (Non-Blocking)

```
apps/VCSM/src/features/upload/controller/recordPostMedia.controller.js
```

Called after `createPostController` returns, dispatched as `.catch()` only (non-blocking / non-critical).

Steps per uploaded file:
1. Resolves VCSM app UUID via `resolveVcsmAppIdDAL()` → `platform.apps`
2. Calls `createMediaAssetController(...)` → inserts to `platform.media_assets`
3. Updates `vc.post_media.media_asset_id` via `updatePostMediaAssetIdDAL`

---

## Actor vs VPORT Posting

Identity is resolved before the controller runs, in `useUploadSubmit` via `useIdentity()`.

The `identity.actorId` is passed directly to `createPostController`. The controller writes `actor_id: identity.actorId` to `vc.posts`. There is no branch in the controller for `kind === 'vport'` vs `kind === 'user'` — the actor system is purely `actorId`-based.

`realm_id` is set via `resolveRealm(identity.isVoid)`. The exact resolution logic lives in `shared/utils/resolveRealm`.

**Risk identified:** The controller does not validate that `identity.actorId` is owned by the current auth user. It relies on `getCurrentAuthUserDAL()` to confirm a session exists, but does not cross-check that the actor being posted as is actually owned by that user via `vc.actor_owners`. RLS on `vc.posts` (if configured) would be the enforcement layer.

---

## Post Creation Tables

| Table | Schema | Operation |
|---|---|---|
| `posts` | `vc` | INSERT — row with actor_id, realm_id, text, tags, media_url (first), media_type, location_text, post_type |
| `post_media` | `vc` | INSERT — one row per file: url, media_type, sort_order |
| `post_mentions` | `vc` | INSERT — one row per mentioned actor |
| `platform.media_assets` | `platform` | INSERT — one row per upload result (non-blocking) |
| `notification.*` | `notification` | INSERT — events, recipients, rendered (notification engine) |

---

## Post Creation Columns (vc.posts insert payload)

```js
{
  user_id: user.id,          // auth user UUID
  actor_id: identity.actorId,
  realm_id: resolveRealm(identity.isVoid),
  text: caption,
  title: null,
  media_url: firstUrl,       // first media URL (backward compat)
  media_type: firstType,     // 'image' | 'video' | 'text'
  post_type: input.mode,     // 'post' | '24drop' | 'vdrop'
  tags: extractHashtags(caption),
  created_at: new Date().toISOString(),
  location_text: input.locationText || null,
}
```

---

## Notification Events Published on Post Create

| Event | Trigger |
|---|---|
| `social.post.mention` | New post with resolved mention actor IDs |

No notification is published to followers on post creation (no "new post" fan-out notification).

---

## Duplicate Create DAL

`apps/VCSM/src/features/post/postcard/dal/post.write.dal.js` also contains a `createPostDAL({ actorId, text })` function. This is a **second, unrelated post creation path** that does NOT handle multi-media, locations, tags or the full form shape. It includes its own inline mention extraction and insertion. It is not called from the main upload flow. See dead code report for details.
