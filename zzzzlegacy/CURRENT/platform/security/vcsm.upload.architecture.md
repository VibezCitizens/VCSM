# MODULE ARCHITECTURE REPORT

**Module:** upload
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Post Creation & Media Upload
**Primary Root:** `apps/VCSM/src/features/upload/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns the post creation flow: selecting media, writing captions, tagging mentions (@actor), inserting the post + media + mentions into the database, and uploading files to Cloudflare R2. Also owns mention autocomplete and media compression.

---

## ENTRY POINTS

- `/upload` → `UploadScreen.jsx` (legacy)
- `/upload/modern` → `UploadScreenModern.jsx` (active)

---

## LAYER MAP

**DAL:**
- `findActorsByHandles.dal.js`
- `findPostMentionsByPostIds.dal.js`
- `insertPost.dal.js`
- `insertPostMedia.dal.js`
- `insertPostMentions.dal.js`
- `postAuthRollback.dal.js`
- `searchMentionSuggestions.dal.js`
- `updatePostMediaAssetId.write.dal.js`

**Controller:**
- `controller/recordPostMedia.controller.js` (singular folder)
- `controller/searchMentionSuggestions.controller.js` (singular folder)
- `controllers/createPost.controller.js` (plural folder — DUAL FOLDER VIOLATION)

**Hook:**
- `useMediaSelection.js`
- `useMentionAutocomplete.js`
- `useResolvedActor.js`
- `useUploadSubmit.js`

**Model:**
- `uploadTypes.model.js`

**Lib:**
- `classifyFile.js`
- `compressIfNeeded.js`
- `extractHashtags.js`
- `extractMentions.js`

**API:**
- `api/uploadMedia.js` — Cloudflare R2 upload function

**UI Components:**
- `ActorPill.jsx`, `CaptionCard.jsx`, `LinkifiedMentions.jsx`, `MediaPreview.jsx`, `MentionAutocompleteList.jsx`, `MentionChips.jsx`, `MentionTypeahead.jsx`, `PrimaryActionButton.jsx`, `SegmentedButton.jsx`, `SelectedThumbStrip.jsx`, `TagChips.jsx`, `UploadCard.jsx`, `UploadHeader.jsx`

**Screens:** `UploadScreen.jsx`, `UploadScreenModern.jsx`

**Adapters:**
- `posts.adapter.js`
- `ui/LinkifiedMentions.adapter.js`

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Post creation ownership clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | UploadScreenModern (active) | Legacy UploadScreen unclear status |
| Controllers present/delegated | PARTIAL | 3 controllers across 2 folders | Dual folder naming violation |
| DAL/repository present/delegated | PASS | 8 DAL files | — |
| Models/transformers present | PASS | uploadTypes.model.js | — |
| Hooks/view models present | PASS | 4 hooks | — |
| Screens/components present | PASS | 2 screens + 13 UI components | — |
| Services/adapters present | PASS | 2 adapters | — |
| Database objects mapped | PARTIAL | vc.posts, vc.post_media, vc.post_mentions | — |
| Authorization path mapped | PARTIAL | Actor-based post insertion | No explicit ownership gate |
| Cache/runtime behavior mapped | FAIL | No cache documented | — |
| Error/loading/empty states mapped | PARTIAL | Some UI states | Error on upload failure unclear |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | No engine deps | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `media` feature | feature | upload → media | PARTIAL | Media asset creation |
| Cloudflare R2 | external | upload → R2 | YES | File storage via api/uploadMedia.js |
| `vc.posts` | database | upload writes | YES | — |
| `vc.post_media` | database | upload writes | YES | — |
| `vc.post_mentions` | database | upload writes | YES | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Dual controller folders | `controller/` (2 files) AND `controllers/` (1 file) | HIGH — naming violation | SENTRY |
| Legacy UploadScreen.jsx | `UploadScreen.jsx` alongside `UploadScreenModern.jsx` | MEDIUM — is legacy dead? | IRONMAN |
| `postAuthRollback.dal.js` | Rollback DAL — unclear if active | MEDIUM | IRONMAN |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Consolidate controller/ and controllers/ | HIGH | Contract violation | SENTRY |
| Confirm UploadScreen.jsx status (legacy/dead) | HIGH | Dead code candidate | IRONMAN |
| Error state on upload failure | HIGH | R2 upload can fail | IRONMAN |
| Logan documentation | HIGH | No canonical upload flow docs | LOGAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: dual controller folders)
- IRONMAN (ownership: legacy screen status)
- LOGAN (documentation)
