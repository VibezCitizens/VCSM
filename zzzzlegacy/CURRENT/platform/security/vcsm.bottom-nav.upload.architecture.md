# BOTTOM NAV — UPLOAD (CREATE) BUTTON ARCHITECTURE MAP

**Generated:** 2026-05-11
**Button:** Upload / Create (Plus icon)
**Route:** `/upload` (programmatic navigate)
**Feature:** upload

---

## Button Definition

```jsx
<button
  aria-label={t('nav.newUpload')}
  onClick={() => navigate('/upload')}
  className="... gradient pill ..."
>
  <Plus size={22} />
</button>
```
- NOT a NavLink — uses `navigate('/upload')` directly
- Styled differently from other tabs: gradient purple/indigo/sky pill
- No badge

---

## Screen Chain

```
/upload → UploadScreenModern.jsx
```

**Screen:** `features/upload/screens/UploadScreenModern.jsx`
**Legacy Screen:** `features/upload/screens/UploadScreen.jsx` (status: possibly dead — IRONMAN audit pending)

---

## Primary Hooks

| Hook | File | Purpose | Calls |
|---|---|---|---|
| `useMediaSelection` | `upload/hooks/useMediaSelection.js` | File picker state, media array management | File API, classifyFile, compressIfNeeded |
| `useUploadSubmit` | `upload/hooks/useUploadSubmit.js` | Submission orchestration | createPost.controller, @media engine |
| `useMentionAutocomplete` | `upload/hooks/useMentionAutocomplete.js` | @mention typeahead | searchMentionSuggestions.controller |
| `useResolvedActor` | `upload/hooks/useResolvedActor.js` | Actor resolution for mentions | INFERRED |

---

## Primary Controllers

| Controller | File | Purpose | Calls |
|---|---|---|---|
| `createPost.controller.js` | `upload/controllers/createPost.controller.js` | Insert post record | `insertPost.dal.js` → `vc.posts` |
| `recordPostMedia.controller.js` | `upload/controller/recordPostMedia.controller.js` | Record media asset row | `createMediaAssetController` → `platform.media_assets` |
| `searchMentionSuggestions.controller.js` | `upload/controller/searchMentionSuggestions.controller.js` | Typeahead search | `searchMentionSuggestions.dal.js` |

---

## Primary DAL Reads / Writes

| DAL Method | File | Tables / Views / RPCs | Direction |
|---|---|---|---|
| `insertPost.dal.js` | `upload/dal/insertPost.dal.js` | `vc.posts` | WRITE |
| `insertPostMedia.dal.js` | `upload/dal/insertPostMedia.dal.js` | `vc.post_media` | WRITE |
| `insertPostMentions.dal.js` | `upload/dal/insertPostMentions.dal.js` | `vc.post_mentions` | WRITE |
| `findActorsByHandles.dal.js` | `upload/dal/findActorsByHandles.dal.js` | INFERRED: `vc.actors` + `profiles` | READ |
| `searchMentionSuggestions.dal.js` | `upload/dal/searchMentionSuggestions.dal.js` | INFERRED: `identity.actor_directory` | READ |
| `updatePostMediaAssetId.write.dal.js` | `upload/dal/updatePostMediaAssetId.write.dal.js` | `vc.posts` or `vc.post_media` | WRITE (post-upload update) |
| `postAuthRollback.dal.js` | `upload/dal/postAuthRollback.dal.js` | INFERRED: vc.posts delete | WRITE (rollback) |
| `mediaAssets.write.dal.js` (via media feature) | `media/dal/mediaAssets.write.dal.js` | `platform.media_assets` | WRITE |

---

## State Stores

| Store | Data Held |
|---|---|
| Local component state | caption, visibility, mode, locationText, submitting, mentionsResolved |
| useMediaSelection state | selected media files, preview URLs |

---

## Data Flow

```
User taps + button → navigate('/upload')
  → UploadScreenModern mounts
  → useMediaSelection() — initializes empty media array
  → User picks files (File API) → media.files updated
  → compressIfNeeded (FFmpeg WASM for video) — client-side processing
  → User types caption → useMentionAutocomplete → @handle typeahead
  → User taps submit:
    → useUploadSubmit fires
    → @media engine: uploadMedia(file) → Cloudflare R2 → returns publicUrl + storageKey
    → createPost.controller({ actorId, caption, media, mentions, ... })
      → insertPost.dal → vc.posts (INSERT)
      → insertPostMedia.dal → vc.post_media (INSERT per media item)
      → insertPostMentions.dal → vc.post_mentions (INSERT if mentions)
    → recordPostMedia.controller → createMediaAssetController
      → platform.media_assets (INSERT)
    → Feed cache invalidated (React Query)
    → navigate('/feed') [INFERRED]
```

---

## Security / Ownership Gates

- INFERRED: actorId from identity required — unauthenticated submission rejected
- `actorId` used as `ownerActorId` and `createdByActorId`
- `postAuthRollback.dal.js` suggests rollback capability on failed auth during post creation

---

## Loading / Error States

| State | Behavior |
|---|---|
| Submitting | `submitting=true` + `submitLockRef` prevent double-submit |
| Media processing | INFERRED: progress shown during FFmpeg WASM video compression |
| Upload error | INFERRED: error state in useUploadSubmit — exact UI not traced |
| Auth missing | INFERRED: redirect to /login |

---

## Spaghetti / Risk Flags

| Signal | Evidence | Risk | Handoff |
|---|---|---|---|
| `UploadScreen.jsx` legacy file exists | Both `UploadScreen.jsx` + `UploadScreenModern.jsx` in screens/ | HIGH — dead code risk | IRONMAN |
| Dual controller/ + controllers/ folders | `controller/recordPostMedia.controller.js` and `controllers/createPost.controller.js` | HIGH — architecture contract violation | SENTRY |
| Post-media atomicity risk | Post inserted first, then media — if media upload fails, post exists without media | HIGH — `postAuthRollback.dal.js` suggests this was known | VENOM |
| `extractMentions` in component | `useMemo(() => extractMentions(caption), [caption])` in UploadScreenModern | LOW — UI-only parse, not domain logic | — |

---

## Missing Pieces

- Legacy UploadScreen.jsx status unknown — confirm dead or remove
- Controller folder naming violation: `controller/` vs `controllers/` — consolidate
- Post-media atomicity: if media upload succeeds but `insertPost` fails, media is orphaned in R2
