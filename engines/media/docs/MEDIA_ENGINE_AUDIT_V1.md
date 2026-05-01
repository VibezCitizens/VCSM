# Media Engine — MEDIA_ENGINE_AUDIT_V1

**Created:** 2026-04-30
**Status:** Production (V1 — initial implementation)
**App Scope:** BOTH APPS + ENGINE

---

## Engine Root

```
engines/media/
├── index.js                          — entry point, re-exports src/index.js
└── src/
    ├── index.js                      — public API surface
    ├── config.js                     — DI container (uploadFn, publicUrlFn)
    ├── config/
    │   ├── uploadLimits.js           — BYTES constants, BLOCKED_MIMES deny list
    │   └── uploadScopes.js           — 13 scope configs, getScopeConfig()
    ├── lib/
    │   ├── validateMediaFile.js      — single/batch file validation
    │   ├── classifyMediaFile.js      — image vs. video MIME classification
    │   ├── compressImage.js          — canvas-based compression, dimension reading
    │   └── buildMediaStorageKey.js   — UUID-based R2 key construction
    ├── dal/
    │   └── r2Upload.dal.js           — transport via injected uploadFn (NOT exported)
    ├── controller/
    │   └── uploadMedia.controller.js — 8-step upload pipeline
    ├── model/
    │   └── mediaUploadResult.model.js — MediaUploadResult shape + normalizer
    └── hooks/
        └── useMediaUpload.js         — React hook wrapping the controller
```

---

## Purpose

Centralized media upload engine for all image and video uploads across VCSM (and eventually Wentrex). Provides:

- Scope-based validation (MIME type, file size, file count)
- MIME type deny list (SVG, script types)
- Image compression via canvas API
- Collision-proof UUID-based R2 storage key generation
- Transport-agnostic via dependency injection
- Normalized result shape across all upload paths

---

## Scope

**Included:**
- File validation (MIME, size, count)
- Classification (image vs. video)
- Image compression
- Storage key construction
- Upload transport (via injected function)
- Result normalization

**Excluded:**
- Database writes (callers handle persistence)
- Auth/ownership enforcement (callers provide `ownerActorId`)
- File selection UI
- Preview management
- Multi-file batch orchestration (callers loop; engine handles one file at a time)

---

## Entry Points

### Public API (`engines/media/src/index.js`)

| Export | Type | Purpose |
|---|---|---|
| `configureMediaEngine(config)` | Function | DI setup — must be called once at app startup |
| `uploadMediaController({ file, scope, ownerActorId, opts })` | Async Function | Orchestrates single-file upload pipeline |
| `useMediaUpload({ scope, ownerActorId })` | React Hook | Wraps controller with React state (uploading, error) |
| `validateMediaFile(file, scope)` | Function | Returns `{ ok, error }` |
| `validateMediaFiles(files, scope)` | Function | Batch validation with count limit check |
| `classifyMediaFile(file)` | Function | Returns `{ mediaKind, error }` |
| `UPLOAD_SCOPES` | Object | All 13 scope config objects |
| `getScopeConfig(scope)` | Function | Throws on unknown scope |
| `BYTES` | Object | MB size constants |
| `BLOCKED_MIMES` | Array | Frozen deny list |

**NOT exported:** `dalUploadToR2`, `buildMediaStorageKey`, `compressImageForScope`, `getImageDimensions`

---

## Upload Pipeline (`uploadMedia.controller.js`)

```
1. Validate input guards (file, scope, ownerActorId present)
2. getScopeConfig(scope) — throws on unknown scope
3. validateMediaFile(file, scope) — BLOCKED_MIMES → allowedMimes → size
4. classifyMediaFile(file) — image | video | null
5. compressImageForScope(file, scope) — images only, if scope.compression set
6. Re-validate size after compression (compression bypass protection)
7. getImageDimensions(uploadFile) — best-effort, non-fatal
8. buildMediaStorageKey(prefix, ownerActorId, file, opts) — UUID-based
9. dalUploadToR2(file, storageKey) — calls injected uploadFn
10. normalizeMediaUploadResult(...) → MediaUploadResult
```

---

## Upload Scopes

| Scope | Prefix | Compression | Max Size | MIME |
|---|---|---|---|---|
| `vibe_post` | vibes | 1080px/0.8 | 50MB | image+video |
| `story_24drop` | stories | 1080px/0.8 | 50MB | image+video |
| `vdrop` | vdrops | 1080px/0.8 | 50MB | image+video |
| `user_avatar` | avatar-photos | 600px/0.7 | 5MB | image only |
| `user_banner` | avatar-banners | 1080px/0.8 | 5MB | image only |
| `vport_avatar` | vport-avatar-photos | none | 5MB | image only |
| `vport_banner` | vport-avatar-banners | 1080px/0.8 | 5MB | image only |
| `portfolio_media` | portfolio | 1080px/0.8 | 50MB | image+video |
| `menu_item_photo` | menu-items | 1080px/0.8 | 5MB | image only |
| `chat_attachment` | vox | 1600px/0.82 | 50MB | image+video |
| `design_asset` | design-assets | none | 10MB | image only |
| `wanders_card` | wanders | 1080px/0.8 | 5MB | image only |
| `vport_creation_avatar` | vport-avatar-photos | 600px/0.8 | 5MB | image only |

---

## Storage Key Format

```
{prefix}/{ownerActorId}/{extraPath/}{yyyy}/{mm}/{dd}/{uuid}.{ext}
```

- `uuid` = `crypto.randomUUID()` — UUID v4 grade, collision-proof
- `ext` derived from filename first, then MIME type — raw filename never trusted
- `ownerActorId` always in path for RLS-style auditing
- `extraPath` optional (e.g. `batch-{batchId}`, `cards`, `assets`, `flyer`)

---

## Dependency Injection

Host apps inject transport at startup:

```js
// apps/VCSM/src/features/media/setup.js
import { configureMediaEngine } from '@media'
import { uploadToCloudflare, publicUrlForKey } from '@/services/cloudflare/uploadToCloudflare'

export function setupVcsmMediaEngine() {
  configureMediaEngine({ uploadFn: uploadToCloudflare, publicUrlFn: publicUrlForKey })
}
```

Called in `apps/VCSM/src/main.jsx` after `setupVcsmBookingEngine()`.

Alias: `apps/VCSM/vite.config.js` → `@media` → `engines/media/index.js`

---

## Result Shape (`MediaUploadResult`)

```js
{
  publicUrl:    string,    // CDN URL — store this in DB
  storageKey:   string,    // R2 object key — store for deletion/audit
  mediaKind:    'image' | 'video' | null,
  mimeType:     string,
  sizeBytes:    number | null,
  scope:        string,
  ownerActorId: string,
  width:        number | null,  // images only, best-effort
  height:       number | null,  // images only, best-effort
}
```

---

## BLOCKED_MIMES Deny List

```js
['image/svg+xml', 'text/html', 'text/javascript', 'application/javascript', 'application/xml', 'text/xml']
```

Checked BEFORE allowedMimes — cannot be bypassed even if a scope's allowedMimes is misconfigured.

---

## Security Properties

1. **MIME type deny list** — SVG and script types blocked at engine level regardless of scope
2. **Explicit allowedMimes per scope** — no implicit accept-all
3. **File size enforced per scope** — after compression, not just before
4. **Compression bypass protection** — if compression returns original (failure), size is re-validated
5. **UUID-based keys** — replaces `timestamp + randomHex(3)` (was ~16M combinations)
6. **Extension derived from MIME, not filename** — raw filename never trusted for ext
7. **DAL not exported** — transport layer cannot be called directly by app code

---

## Dependencies

- **Internal:** none (no Supabase, no app imports)
- **Host app:** injects `uploadFn` + `publicUrlFn` via `configureMediaEngine()`
- **Browser APIs:** `canvas`, `createImageBitmap`, `crypto.randomUUID()`

---

## Feature Hooks (VCSM)

Each migrated entry point gets a thin feature hook scoped to one upload context:

| Hook | Scope | File |
|---|---|---|
| `useMenuItemPhotoUpload` | `menu_item_photo` | `features/profiles/kinds/vport/screens/menu/hooks/` |
| `usePortfolioMediaUpload` | `portfolio_media` | `features/dashboard/vport/screens/components/portfolio/hooks/` |
| `useChatAttachmentUpload` | `chat_attachment` | `features/chat/conversation/hooks/conversation/` |

These hooks wrap `useMediaUpload` — components never import `@media` directly.

---

## VCSM Entry Points Migrated (V1)

All 8 upload entry points in `apps/VCSM` migrated to this engine:

| Entry Point | Scope | Pattern Before |
|---|---|---|
| `VportActorMenuItemFormModal.jsx` | `menu_item_photo` | Direct Cloudflare import in component |
| `PortfolioItemForm.jsx` | `portfolio_media` | Module-level upload function in component file |
| `useProfileUploads.js` | `user_avatar`, `user_banner`, `vport_avatar`, `vport_banner` | `browser-image-compression` + raw upload |
| `useSendMessageActions.js` | `chat_attachment` | ~50 lines of HEIC/iOS/compression helpers |
| `uploadMedia.js` | `vibe_post`, `story_24drop`, `vdrop` | Batch upload with inline key building |
| `flyer.upload.dal.js` | `design_asset` | DAL doing transport directly |
| `designStudio.assetsExports.controller.js` | `design_asset` | Controller calling transport + manual dimension reading |
| `publishWandersFromBuilder.controller.js` | `wanders_card` | Custom key builder + direct Cloudflare call |
| `cards.controller.js` | `wanders_card` | Duplicate of above (pre-existing) |
| `CreateVportForm.jsx` | `vport_creation_avatar` | Raw `fetch()` to custom HTTP upload endpoint |

---

## File Map

| File | Responsibility |
|---|---|
| `engines/media/index.js` | Entry point re-export |
| `engines/media/src/index.js` | Public API surface |
| `engines/media/src/config.js` | DI container |
| `engines/media/src/config/uploadLimits.js` | BYTES constants, BLOCKED_MIMES |
| `engines/media/src/config/uploadScopes.js` | 13 scope configs, getScopeConfig() |
| `engines/media/src/lib/validateMediaFile.js` | File validation |
| `engines/media/src/lib/classifyMediaFile.js` | MIME classification |
| `engines/media/src/lib/compressImage.js` | Canvas compression, dimension reading |
| `engines/media/src/lib/buildMediaStorageKey.js` | Key construction |
| `engines/media/src/dal/r2Upload.dal.js` | Transport (not exported) |
| `engines/media/src/controller/uploadMedia.controller.js` | Upload pipeline |
| `engines/media/src/model/mediaUploadResult.model.js` | Result normalization |
| `engines/media/src/hooks/useMediaUpload.js` | React hook |
| `apps/VCSM/src/features/media/setup.js` | VCSM DI setup |

---

## Related Logan Docs

Canonical System Doc:
`zNOTFORPRODUCTION/logan/engines/engines.media.system-architecture.md`

---

## Changes Since Previous Version

This is V1 — no previous version.

**Built in session:** 2026-04-30
**Reason:** Replace 10 fragmented upload entry points that each implemented their own key building, compression, and transport. Security gaps: no size limits, SVG allowed, timestamp+randomHex(3) keys, compression bypass possible.
