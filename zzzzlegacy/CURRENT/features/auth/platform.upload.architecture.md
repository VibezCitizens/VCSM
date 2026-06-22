# Platform Upload Architecture

**Scope:** VCSM + Wentrex (FULL REPO)
**Last updated:** 2026-05-03
**Related docs:**
- `vcsm/upload/vcsm.upload.remote-consistency-map.md` — orphan risk / remote consistency
- `platform/vcsm.platform.cache-recommendations.md` — cache TTL patterns

---

## 1. Architecture Overview

All uploads across this monorepo use a **direct browser-to-Cloudflare-R2** pattern via a minimal Cloudflare Worker. There is no server-side upload proxy, no Supabase Storage, and no AWS S3.

```
React Component
  → optional client-side compression
  → FormData POST to https://upload.vibezcitizens.com
      → Cloudflare Worker (stateless)
          → env.R2_BUCKET.put(key, file)
          → returns { url: "https://cdn.vibezcitizens.com/{key}" }
  → DB write (Supabase) stores returned URL or R2 key
```

**Public CDN:** `https://cdn.vibezcitizens.com` — custom domain bound to the `post-media` R2 bucket. All stored objects are publicly readable with no auth requirement.

---

## 2. Core Modules

### Worker (Cloudflare Edge)

| App | Path |
|-----|------|
| VCSM | `apps/VCSM/cloudflare-worker-upload/worker.js` |
| Wentrex | `apps/wentrex/cloudflare-worker-upload/worker.js` |

**VCSM Worker — current (May 3, 2026):**
JWT authentication is enforced. Token is verified by calling `GET /auth/v1/user` on the Supabase auth API — algorithm-agnostic (works for HS256 and RS256). Actor ownership is verified via `GET /rest/v1/actor_owners` using the user's JWT and the anon key with `Accept-Profile: vc`. The `actorId` is derived from the R2 key's second path segment (`key.split('/')[1]`) — never from a client-supplied field. Server-side MIME deny list + allow list enforced. 100MB size cap enforced (two checks: Content-Length and file.size). CORS origin allowlist: `https://vibezcitizens.com`, `https://www.vibezcitizens.com`, and localhost dev origins (`localhost:5173`, `localhost:4173`, `127.0.0.1:5173`, `127.0.0.1:4173`). Requires env vars: `SUPABASE_URL` (in `[vars]`, must match project ref in `SUPABASE_ANON_KEY`) and `SUPABASE_ANON_KEY` (in `[vars]`).

```
POST https://upload.vibezcitizens.com
  → verifyToken() → GET /auth/v1/user → { ok, userId }
  → verifyActorOwnership() → GET /rest/v1/actor_owners → bool
  → validateMime(file.type)
  → validateKey(objectKey)
  → env.R2_BUCKET.put(objectKey, file.stream(), { httpMetadata: { contentType: safeMime } })
  → { url: "https://cdn.vibezcitizens.com/{key}" }
```

**Wentrex Worker — not reverified since April 19, 2026:**
Status at April 19: no auth enforcement, wildcard CORS origin. Not updated in the May 3 session. Assumed to still match the pre-auth state until a dedicated Wentrex worker audit is run.

### Upload Client (Duplicated)

| App | Path |
|-----|------|
| VCSM | `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js` |
| Wentrex | `apps/wentrex/src/features/services/cloudflare/uploadToCloudflare.js` |

**VCSM — current (May 3, 2026):** Hardcodes `UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com'` and `R2_PUBLIC = 'https://cdn.vibezcitizens.com'`. Always sends `Authorization: Bearer {token}` — `getUploadAuthHeaders()` calls `supabase.auth.getSession()` with a Wanders client fallback. The unauthenticated CORS retry fallback was **removed** on 2026-05-03. Upload failures now return `{ url: null, error }` with no retry.

**Wentrex — not reverified since April 19, 2026:** Status at April 19: identical logic to VCSM including unauthenticated CORS retry. Not updated in the May 3 session.

Exports:
- `uploadToCloudflare(file, key)` → `{ url, error }`
- `publicUrlForKey(key)` → `https://cdn.vibezcitizens.com/{key}`

### Key Builder (Duplicated)

| App | Path |
|-----|------|
| VCSM | `apps/VCSM/src/services/cloudflare/buildR2Key.js` |
| Wentrex | `apps/wentrex/src/features/services/cloudflare/buildR2Key.js` |

**These files are identical.** Should be consolidated into `platform/` or `shared/`.

```js
buildR2Key(prefix, ownerId, file, opts?)
// → "{prefix}/{ownerId}/{extraPath?}/{YYYY}/{MM}/{DD}/{timestamp}-{randomHex}.{ext}"
// timestamp: Math.floor(Date.now() / 1000) (seconds)
// randomHex: 6 chars from crypto.getRandomValues()
// ext: from MIME map, fallback from filename, fallback 'bin'
```

**Exception:** Chat image uploads (`useSendMessageActions.js`) build the key inline without calling `buildR2Key()`, producing: `vox/{conversationId}/{actorId}/{YYYY}/{MM}/{DD}/{ts}-{rand}.{ext}`.

---

## 3. Object Key / Prefix Registry

| Prefix | Owner ID | Feature |
|--------|---------|---------|
| `vibes` | actorId | Social posts (1–10 images) |
| `stories` | actorId | 24-drops (single item) |
| `vdrops` | actorId | Wanders/vdrops |
| `avatar-photos` | actorId | User profile avatar |
| `avatar-banners` | actorId | User profile banner |
| `vport-avatar-photos` | actorId | Vport profile avatar |
| `vport-avatar-banners` | actorId | Vport profile banner |
| `flyers` | vportId (DB row) | Flyer design assets |
| `vox` | conversationId | Chat image attachments |

**Note:** Avatar and vport avatar prefixes migrated to `actorId` on 2026-05-03 (`useProfileUploads` fix). `flyers` still uses `vportId` (not yet migrated).

**Batch grouping:** Post uploads group all images under `batch-{batchId}` where `batchId = Math.floor(Date.now() / 1000)`.

---

## 4. Upload Flow Inventory

### A. Social Post / Vibe Creation

- **Entry:** Post upload screen
- **Hook:** `useUploadSubmit()` → `apps/VCSM/src/features/upload/hooks/useUploadSubmit.js`
- **API:** `uploadMedia(files, actorId, mode)` → `apps/VCSM/src/features/upload/api/uploadMedia.js`
- **Modes:** `'post'` (1–10 images), `'24drop'` (single → `stories/`), `'vdrop'` (`vdrops/`)
- **Compression:** `compressIfNeeded()` — 1080px max, 0.8 quality JPEG
- **Storage:** `vibes/{actorId}/batch-{batchId}/{YYYY}/{MM}/{DD}/{ts}-{rand}.{ext}`
- **DB Write:** `insertPost()` + `insertPostMedia()` — `vc.posts` + `vc.post_media`
- **DB Read:** `readPostMediaMap(postIds)` (`apps/VCSM/src/features/feed/dal/feed.read.media.dal.js`) — 60s TTL cache
- **Controller:** `createPostController()` (`apps/VCSM/src/features/upload/controllers/createPostController.js`)
- **Legacy note:** `vc.posts.media_url` + `vc.posts.media_type` are written for backwards compat but all reads use `vc.post_media`

### B. User Profile Avatar / Banner

- **Hook:** `useProfileUploads({ mode: 'user', subjectId })` (`apps/VCSM/src/features/settings/profile/hooks/useProfileUploads.js`)
- **Validation:** Image MIME only; max 5MB
- **Compression:** 0.7MB max, 600px max (`browser-image-compression`)
- **Storage:** `avatar-photos/{actorId}/...` / `avatar-banners/{actorId}/...`
- **DB Write:** `profiles.photo_url` / `profiles.banner_url` via `saveProfile()` controller

### C. Vport Profile Avatar / Banner

- **Hook:** `useProfileUploads({ mode: 'vport', subjectId })` (same file as above)
- **Validation:** Image MIME only; max 5MB; no compression
- **Storage:** `vport-avatar-photos/{actorId}/...` / `vport-avatar-banners/{actorId}/...`
- **DB Write:** `vport.profiles.avatar_url` / `vport.profiles.banner_url`

### D. Menu Item Image

- **Location:** Menu editor modal (`apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal.jsx`)
- **Key:** Built inline at call site (no shared builder)
- **Controller:** `saveVportActorMenuItemController()`
- **DB Write:** `vport.actor_menu_items.image_url`

### E. Flyer Design Asset

- **DAL:** `uploadFlyerImage({ vportId, file, kind })` (`apps/VCSM/src/features/dashboard/flyerBuilder/dal/flyer.upload.dal.js`)
- **Storage:** `buildR2Key('flyers', vportId, file, { extraPath: 'assets' })` → `flyers/{vportId}/assets/...`
- **No deletion/cleanup logic found**

### F. Chat Image Attachment

- **Hook:** `useSendMessageActions()` (`apps/VCSM/src/features/chat/conversation/hooks/conversation/useSendMessageActions.js`)
- **Validation:** `file.type.startsWith('image/')` — does NOT use `classifyFile()`
- **Compression:** 1600px max, 0.82 quality JPEG; iOS HEIC detection
- **Key (inline):** `vox/{conversationId}/{actorId}/{YYYY}/{MM}/{DD}/{ts}-{rand}.{ext}`
- **DB Write:** `chat.message_attachments` — stores both `public_url` (full URL) AND `storage_path` (R2 key)

### G. Wentrex Assignment Submission Files

- **Read DAL:** `listSubmissionFilesBySubmissionId.dal.js` — reads `storage_path` (R2 key, NOT full URL)
- **DB Schema:** `learning.submission_files(id, submission_id, storage_path, original_name, mime_type, size_bytes)`
- **GAP:** No write DAL or upload helper found. Caller must compose URL as `publicUrlForKey(storagePath)` on read.

### H. Vport Content Page Cover / Gallery

- **Status:** No upload entry point, helper, or controller found. Feature may be incomplete.

---

## 5. Bucket and CDN Strategy

| Property | Value |
|----------|-------|
| Provider | Cloudflare R2 |
| Bucket name | `post-media` |
| Wrangler binding | `R2_BUCKET` |
| Public CDN | `https://cdn.vibezcitizens.com` |
| Worker URL | `https://upload.vibezcitizens.com` |
| Access model | All objects publicly readable — no auth on read |
| Signed URLs | Not used anywhere |
| Private bucket | Does not exist |
| VCSM bucket | Same as Wentrex bucket — both apps share `post-media` |
| Traffic | No upload capability (static site) |

**Risk:** Submission files, private documents, and public social posts all land in the same public bucket. Security relies on object key obscurity (timestamp + 6-char random hex), not access control.

---

## 6. URL Storage Model

| Flow | Column | Stored As |
|------|--------|-----------|
| `vc.post_media.url` | Post media | Full URL (`https://cdn.vibezcitizens.com/...`) |
| `profiles.photo_url` | User avatar | Full URL |
| `profiles.banner_url` | User banner | Full URL |
| `vport.profiles.avatar_url` | Vport avatar | Full URL |
| `vport.profiles.banner_url` | Vport banner | Full URL |
| `vport.actor_menu_items.image_url` | Menu item | Full URL |
| `chat.message_attachments.public_url` | Chat image | Full URL |
| `chat.message_attachments.storage_path` | Chat image | R2 key |
| `learning.submission_files.storage_path` | Submission | R2 key only |

**Problem:** Full URL storage means the CDN domain is baked into every row. A CDN domain change requires a DB migration. The only exception is `submission_files` (key-only) — the correct long-term pattern, but currently inconsistent with everything else.

---

## 7. Validation Model

| Layer | What Is Checked |
|-------|----------------|
| `classifyFile.js` | MIME whitelist (images + videos); max 50MB |
| `useProfileUploads.js` | `file.type.startsWith('image/')`, max 5MB |
| `useSendMessageActions.js` | `file.type.startsWith('image/')` — no `classifyFile()` |
| VCSM Worker | JWT via Supabase `/auth/v1/user`, actor ownership via `vc.actor_owners`, MIME deny list + allow list, 100MB size cap (double-checked) |
| Wentrex Worker | Not reverified — assumed no server-side validation (April 19 state) |

**Compression:**

| Context | Library | Settings |
|---------|---------|----------|
| Vibes/posts | Canvas `toBlob()` | 1080px max, 0.8 quality |
| User avatar | `browser-image-compression` | 0.7MB max, 600px max |
| Chat images | Canvas `compressImageFile()` | 1600px max, 0.82 quality |

**What is absent (VCSM):**
- Duplicate detection (same file = two R2 objects)
- Orphan prevention (failed DB write = file stays in R2 forever)
- Cleanup on entity deletion (deleted post = files not removed from R2)
- Rate limiting on upload frequency
- Multi-part upload for large files (>100MB)

---

## 8. Known Issues and Technical Debt

### Duplication
1. `uploadToCloudflare.js` — identical in VCSM and Wentrex
2. `buildR2Key.js` — identical in VCSM and Wentrex
3. `UPLOAD_ENDPOINT` constant in `apps/VCSM/src/features/settings/constants.js` — duplicate of value in `uploadToCloudflare.js`

### Legacy
1. `vc.posts.media_url` + `vc.posts.media_type` — written on every post create for "backwards compat"; all active reads use `vc.post_media`; these columns should be dropped after confirming no consumers

### Inconsistencies
1. Chat key builder inline (bypasses `buildR2Key()`) — 3 key-building locations in total
2. ~~Avatar prefixes use `userId`/`vportId` (DB row IDs)~~ — **fixed 2026-05-03**: `useProfileUploads` now passes `actorId` for all avatar/banner uploads
3. Chat stores both `public_url` and `storage_path` — dual storage, keys never used on read
4. Submission files store key only; everything else stores full URL — no unified storage policy

### Incomplete
1. Wentrex submission file write path — read DAL exists, no upload helper or write DAL found
2. Vport content page cover/gallery — no upload flow found

---

## 9. Pre-Redesign Checklist

Before restructuring R2 or changing key patterns:

- [ ] Consolidate `uploadToCloudflare.js` + `buildR2Key.js` into `platform/` — remove duplicates from both apps
- [ ] Bring chat inline key builder into `buildR2Key()` as a named call — eliminate third key-building location
- [ ] Decide URL vs key storage policy: store full URLs everywhere (current, simple) OR store keys + compose on read (future-proof). Enforce one pattern across the entire codebase.
- [ ] Drop `vc.posts.media_url` + `vc.posts.media_type` legacy columns after verifying no consumers
- [x] Standardize avatar prefix owner IDs — use `actorId` consistently, not `userId`/`vportId` — **done 2026-05-03 (`useProfileUploads` fix; `flyers` prefix still uses vportId)**
- [ ] Implement a private R2 bucket for restricted content (submission files, private docs) — separate from public CDN
- [x] Add server-side validation to Worker (MIME, size) — **done 2026-05-03 (VCSM Worker only)**
- [ ] Trace and complete Wentrex submission file write path

---

## 10. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-19 | Initial document — full architecture review across VCSM + Wentrex | WOLVERINE |
| 2026-05-03 | VCSM Worker: replaced JWKS/RS256 JWT verification with Supabase `/auth/v1/user` delegation (HS256-compatible). Added actor ownership check via `vc.actor_owners`. Worker now enforces: MIME deny/allow list, 100MB size cap, explicit CORS origin (`vibezcitizens.com`). Requires `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars. CORS retry unauthenticated fallback removed from `uploadToCloudflare.js`. Workers (VCSM vs Wentrex) are no longer functionally identical. | WOLVERINE/LOGAN |
| 2026-05-03 | Upload pipeline debug — three blockers resolved: (1) Worker CORS allowlist expanded to include localhost dev origins (`5173`, `4173`). (2) `wrangler.toml` `SUPABASE_URL` typo fixed (`thppn` → `thppm`) — Worker was calling wrong Supabase project, causing 401 on all uploads. (3) `useProfileUploads`: `ownerActorId` changed from `userId`/`vportId` to `actorId` for all four upload types (`user_avatar`, `user_banner`, `vport_avatar`, `vport_banner`) — aligns key ownership with `vc.actor_owners` actor-based model. Upload pipeline verified end-to-end. | BUGSBUNNY/LOGAN |
