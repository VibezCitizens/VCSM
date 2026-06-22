# Module: Composer / upload / media picker / compression

## PWA Source of Truth

**Routes:** `/upload`, composer entry points in feed/profile

**Screens/components:**
- `apps/VCSM/src/features/upload/*`
- `apps/VCSM/src/features/post/*`
- `apps/VCSM/src/shared/lib/compressImage*`

**Services/DAL:**
- `apps/VCSM/src/features/upload/controller/*`
- `apps/VCSM/src/features/media/controller/createMediaAsset.controller.js`
- `apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js`
- `apps/VCSM/src/features/upload/dal/updatePostMediaAssetId.write.dal.js`
- `apps/VCSM/cloudflare-worker-upload/*`

**Supabase schema/tables/RPCs:**
- `vc.posts`
- `vc.post_media`
- `platform.media_assets`
- `platform.apps`
- Cloudflare/R2 upload endpoint

**RLS expectations:** Post/media writes require authenticated actor; `platform.media_assets` `app_id` must be a UUID from `platform.apps` (not a string key); upload must not block post creation.

**Current PWA status:** Source of truth for upload endpoint contract, compression, `platform.media_assets` recording, and post media linking.

---

## Native Transfer Status

**Status:** `Risky`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Composer/CreatePostView.swift`
- `VCSMNativeApp/Features/Composer/CreatePostViewModel.swift`
- `VCSMNativeApp/Features/Composer/PostComposerText.swift`
- `VCSMNativeApp/Features/Composer/MentionSuggestionOverlay.swift`
- `VCSMNativeApp/Services/Composer/LivePostComposerService.swift`
- `VCSMNativeApp/Services/Cloudflare/CloudflareUploadService.swift`

---

## Native Behavior Currently Present

- Native has a `PhotosPicker`-based composer, media loading rules, compression/prep, mention suggestions, and post creation service.
- Native has a shared `CloudflareUploadService` used elsewhere.
- Composer uploads now use `CloudflareUploadService` and shared `R2KeyBuilder` storage keys.
- Composer now records best-effort `platform.media_assets` rows using a UUID from `platform.apps` and writes the resulting `media_asset_id` back to `vc.post_media`.

---

## Native Gaps

- Shared upload and `platform.media_assets` write-back are build-verified, but Cloudflare/Supabase runtime upload regression is not yet tested.
- Hash tags, mentions, upload failures, auth headers, and no-media post behavior not verified.

---

## Risk Notes

- `LivePostComposerService.swift:127-162` uses `CloudflareUploadService.upload` with `R2KeyBuilder`.
- `LivePostComposerService.swift:176-240` records best-effort `platform.media_assets` rows and writes back `vc.post_media.media_asset_id`.
- `SupabaseClient.swift:2083-2135` resolves UUID `app_id` from `platform.apps`, inserts `platform.media_assets`, and patches `vc.post_media`.

---

## Pending Transfer Checklist

- [x] Unify composer upload through `CloudflareUploadService` without rewriting composer UI.
- [x] Match PWA bearer/header and fallback upload contract.
- [x] Record `platform.media_assets` and backfill `vc.post_media.media_asset_id` like PWA.
- [ ] Test image compression, multi-image order, failed upload retry, and media-less posts.

---

## PWA → Native Transfer Log

### 2026-05-03 — P0 native transfer start

- Date: 2026-05-03
- Change type: Fix / Schema
- PWA files changed: none — transfer from existing PWA source of truth
- Routes affected: `/upload`, composer entry points
- Screens/components changed: none planned
- Services/DAL changed: `LivePostComposerService.swift`, `CloudflareUploadService.swift`, media insert/write-back methods in `SupabaseClient.swift`
- Behavior change: use shared Cloudflare upload service and record best-effort `platform.media_assets` rows with `vc.post_media.media_asset_id` write-back
- Supabase schema/RPC change: `platform.apps`, `platform.media_assets`, `vc.post_media.media_asset_id`
- RLS expectations changed: yes — `platform.media_assets.app_id` must use UUID from `platform.apps`
- Affected native modules: Composer, platform schema
- Priority: P0
- Native status: Risky — build verified
- Testing notes: `swift build --package-path native/VCSMNativeCore` passed; `xcodebuild -project native/VCSMNativeApp/VCSMNativeApp.xcodeproj -scheme VCSMNativeApp -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` passed. Runtime Cloudflare/upload/media asset regression not yet run.
- Notes: Media asset recording remains non-blocking after post/media creation.

---

- Date:
- Change type: Feature / Fix / Schema / UI / RLS
- PWA files changed:
- Routes affected:
- Screens/components changed:
- Services/DAL changed:
- Behavior change:
- Supabase schema/RPC change:
- RLS expectations changed:
- Affected native modules:
- Priority: P0 / P1 / P2
- Native status: Not started / Partial / Risky / Complete
- Testing notes:
- Notes:

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: `LivePostComposerService.swift`, `SupabaseClient.swift`
- Delta status: Risky — upload unification and media asset write-back are build-verified; runtime upload/media tests remain open
- Notes: P0 native transfer batch started and build-verified on May 3.

---

## Archived Notes

No archived notes yet.
