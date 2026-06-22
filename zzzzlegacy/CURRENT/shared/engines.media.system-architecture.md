# Media Engine — System Architecture

## 1 Purpose

Centralized engine for all media uploads across VCSM (and future Wentrex integration). Provides scope-based validation, MIME deny listing, image compression, UUID-based storage key generation, and transport-agnostic upload via dependency injection. Eliminates duplicated upload logic and security gaps across feature modules.

---

## 2 Scope

**Included:**
- File validation (MIME type, size, file count per scope)
- MIME deny list (SVG, script types — cannot be bypassed per-scope)
- Media classification (image vs. video)
- Image compression (canvas API, configurable maxDim and quality per scope)
- Storage key construction (UUID-based, actor-scoped, date-partitioned)
- Upload transport via injected function
- Result normalization (single `MediaUploadResult` shape for all callers)

**Excluded:**
- Database writes — callers persist the returned `publicUrl` and `storageKey`
- Auth/ownership enforcement — callers provide `ownerActorId`
- File selection UI — features own picker + preview
- Batch orchestration — callers loop; engine handles one file at a time

---

## 3 Ownership

Application Scope: `BOTH APPS + ENGINE`

Code Root: `engines/media/`

VCSM Setup: `apps/VCSM/src/features/media/setup.js`

VCSM Alias: `@media` → `engines/media/index.js` (via `vite.config.js`)

---

## 4 Entry Points

### Engine Public API

| Export | Type | Used By |
|---|---|---|
| `configureMediaEngine({ uploadFn, publicUrlFn })` | Function | Host app startup |
| `uploadMediaController({ file, scope, ownerActorId, opts? })` | Async Function | Controllers, non-React hooks |
| `useMediaUpload({ scope, ownerActorId })` | React Hook | Feature hooks |
| `validateMediaFile(file, scope)` | Function | Optional pre-validation in UI |
| `validateMediaFiles(files, scope)` | Function | Optional batch pre-validation |
| `classifyMediaFile(file)` | Function | Optional classification |
| `getScopeConfig(scope)` | Function | Scope inspection |
| `UPLOAD_SCOPES`, `BYTES`, `BLOCKED_MIMES` | Constants | Config inspection |

### VCSM Feature Hooks (consume `useMediaUpload`)

| Hook | Scope | Location |
|---|---|---|
| `useMenuItemPhotoUpload` | `menu_item_photo` | `features/profiles/kinds/vport/screens/menu/hooks/` |
| `usePortfolioMediaUpload` | `portfolio_media` | `features/dashboard/vport/screens/components/portfolio/hooks/` |
| `useChatAttachmentUpload` | `chat_attachment` | `features/chat/conversation/hooks/conversation/` |

### VCSM Direct Controller Usage (consume `uploadMediaController`)

| File | Scope |
|---|---|
| `useProfileUploads.js` | `user_avatar`, `user_banner`, `vport_avatar`, `vport_banner` |
| `uploadMedia.js` | `vibe_post`, `story_24drop`, `vdrop` |
| `flyer.upload.dal.js` | `design_asset` |
| `designStudio.assetsExports.controller.js` | `design_asset` |
| `publishWandersFromBuilder.controller.js` | `wanders_card` |
| `cards.controller.js` | `wanders_card` |
| `CreateVportForm.jsx` | `vport_creation_avatar` |

---

## 5 Data Flow

```
Host App Startup
  → configureMediaEngine({ uploadFn, publicUrlFn })
  → stores functions in module-level _config

Upload Request (from any feature)
  → uploadMediaController({ file, scope, ownerActorId, opts })
    → getScopeConfig(scope)             [throws on unknown scope]
    → validateMediaFile(file, scope)    [BLOCKED_MIMES → allowedMimes → size]
    → classifyMediaFile(file)           [image | video | null]
    → compressImageForScope(file, scope) [images only, if scope.compression set]
    → re-validate size                  [prevents compression bypass]
    → getImageDimensions(file)          [best-effort, non-fatal]
    → buildMediaStorageKey(...)         [UUID-based, date-partitioned]
    → dalUploadToR2(file, key)          [calls injected uploadFn]
    → normalizeMediaUploadResult(...)
  → returns MediaUploadResult

React Context (via useMediaUpload)
  → wraps uploadMediaController
  → owns: uploading (boolean), error (Error|null), reset()
  → components receive { upload, uploading, error, reset }
```

---

## 6 Source of Truth

| Concern | Owner |
|---|---|
| Upload scopes | `engines/media/src/config/uploadScopes.js` |
| MIME deny list | `engines/media/src/config/uploadLimits.js` |
| Transport | `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js` (injected) |
| Public URL derivation | `publicUrlForKey` in `uploadToCloudflare.js` (injected) |
| Storage key format | `engines/media/src/lib/buildMediaStorageKey.js` |

---

## 7 UI States

The engine itself has no UI. Feature hooks expose:

| State | Value | Meaning |
|---|---|---|
| `uploading` | `true` | Upload in progress |
| `uploading` | `false` | Idle or complete |
| `error` | `Error` | Upload failed (message surfaced to component) |
| `error` | `null` | No error |

Components decide how to render these states.

---

## 8 Dependencies

### Internal
- None — engine has no Supabase, no app imports, no routing

### Host App Injections
- `uploadFn: (file, key) => Promise<{ url: string|null, error: string|null }>`
- `publicUrlFn: (key: string) => string`

### Browser APIs
- `canvas` + `createImageBitmap` — image compression
- `crypto.randomUUID()` — storage key uniqueness

---

## 9 Rules / Invariants

1. `configureMediaEngine()` must be called before any upload. Engine throws if `uploadFn` is not set.
2. `dalUploadToR2` is never exported. App code cannot call the transport directly.
3. BLOCKED_MIMES deny list is checked before allowedMimes — cannot be overridden per scope.
4. Compression is applied only to images. Videos are uploaded as-is.
5. Size is re-validated after compression. A compression failure cannot silently bypass the size limit.
6. `ownerActorId` is always embedded in the storage key path for RLS-style auditing.
7. Feature hooks wrap `useMediaUpload`. Components never import from `@media` directly.
8. `uploadMediaController` handles exactly one file. Batch callers loop.

---

## 10 Failure Risks

| Risk | Location | Mitigation |
|---|---|---|
| `configureMediaEngine()` not called | `config.js` | Throws `[MediaEngine] uploadFn not configured` |
| Unknown scope name | `getScopeConfig()` | Throws `[MediaEngine] Unknown upload scope` |
| Compression returns original file | `compressImage.js` | Post-compress size re-validation enforces limit |
| Canvas unavailable (server-side render, test env) | `compressImage.js` | `try/catch` returns original file; size re-validated |
| `uploadFn` returns `{ error }` | `r2Upload.dal.js` | Throws with error message |
| `uploadFn` returns no URL | `r2Upload.dal.js` | Throws `[MediaEngine] Upload succeeded but returned no public URL` |
| `width`/`height` reading fails | `getImageDimensions()` | Non-fatal — `null` in result |

---

## 11 Debug Notes

- If uploads fail silently, check `configureMediaEngine()` was called before any upload attempt.
- If compression is not happening, confirm `scope.compression` is not `null` and the file is an image.
- If storage keys look unexpected, check the `extraPath` passed in `opts`.
- The engine never `console.log` in production. Errors surface as thrown `Error` objects.

---

## 12 Files Map

| File | Responsibility |
|---|---|
| `engines/media/index.js` | Entry point re-export |
| `engines/media/src/index.js` | Public API surface (what apps see) |
| `engines/media/src/config.js` | DI container — `configureMediaEngine()`, `getUploadFn()`, `getPublicUrlFn()` |
| `engines/media/src/config/uploadLimits.js` | `BYTES` size constants, `BLOCKED_MIMES` deny list |
| `engines/media/src/config/uploadScopes.js` | 13 scope configs, `getScopeConfig()` |
| `engines/media/src/lib/validateMediaFile.js` | Single and batch file validation |
| `engines/media/src/lib/classifyMediaFile.js` | MIME-based image/video classification |
| `engines/media/src/lib/compressImage.js` | Canvas compression, `getImageDimensions()` |
| `engines/media/src/lib/buildMediaStorageKey.js` | UUID-based storage key builder |
| `engines/media/src/dal/r2Upload.dal.js` | Upload transport (not exported — internal only) |
| `engines/media/src/controller/uploadMedia.controller.js` | 8-step upload pipeline |
| `engines/media/src/model/mediaUploadResult.model.js` | `MediaUploadResult` typedef + normalizer |
| `engines/media/src/hooks/useMediaUpload.js` | React hook wrapper |
| `apps/VCSM/src/features/media/setup.js` | VCSM DI setup (called in `main.jsx`) |

---

## Audit References

Latest Engine Audit:
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/MEDIA_ENGINE_AUDIT_V1.md`

Previous Engine Audit: none (V1 — initial implementation)

---

## 13 Change Log

### 2026-05-19 — CEREBRO Governance Pass

Task: Full governance audit of `vcsm.dal.media.md` (CEREBRO chain: ARCHITECT → VENOM → LOKI → SENTRY → LOGAN → review-contract → DB → Carnage → IRONMAN → THOR). Engine was read but not modified.

Findings affecting this engine:

- RISK-1 resolved: 9 VCSM external controllers were importing `resolveVcsmAppIdDAL` directly from `@/features/media/dal/resolveAppId.read.dal`. Adapter `mediaAppId.adapter.js` + barrel `media.adapter.js` enforced. No engine change required.
- LOKI gap: `resolveVcsmAppIdDAL` had zero DEV instrumentation. Fixed in VCSM app (not engine) — cache hit/miss logging added behind `import.meta.env?.DEV`.
- Carnage Plan B: soft-delete UPDATE policy added to `platform.media_assets`. New DAL (`mediaAssets.softDelete.dal.js`) and controller (`softDeleteMediaAsset.controller.js`) created in VCSM app. Engine is unaffected — it has no DB writes.
- ENGINE Logan gap noted by THOR was a false alarm — this document existed and is current.
- IRONMAN ownership established: `vcsm.media.owner.md` created 2026-05-19.
- THOR release gate: FINAL DECISION: READY (2026-05-19).

VCSM media feature governance doc: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.media.md`
VCSM media ownership record: `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.media.owner.md`

### 2026-04-30 18:00–22:00

Task: Build Media Engine v1 and migrate all VCSM upload entry points

Code Status Before: 10 upload entry points across `apps/VCSM` each implementing independent key building, compression, validation, and transport. Security gaps: no size limits on several paths, SVG not blocked, `timestamp + randomHex(3)` keys (~16M combinations), compression bypass possible, raw `fetch()` to custom HTTP endpoint in one component.

Summary: Built `engines/media/` from scratch with 13 files. DI pattern mirrors `engines/chat/`. All 8 VCSM entry points migrated. Security gaps closed across all paths. Three feature hooks created. Build verified after each migration.

Files Changed:
- Created: `engines/media/` (13 files)
- Created: `apps/VCSM/src/features/media/setup.js`
- Modified: `apps/VCSM/vite.config.js` (added `@media` alias)
- Modified: `apps/VCSM/src/main.jsx` (added `setupVcsmMediaEngine()`)
- Migrated: 10 feature files across 8 entry points (see engine audit for full list)
- Created: `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/hooks/useMenuItemPhotoUpload.js`
- Created: `apps/VCSM/src/features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioMediaUpload.js`
- Created: `apps/VCSM/src/features/chat/conversation/hooks/conversation/useChatAttachmentUpload.js`

Validation: Build passed clean after each of the 8 migrations.
