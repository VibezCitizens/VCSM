# VCSM DAL — `upload`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/upload/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 8 |
| Exported functions | 10 |
| Tables accessed | 5 |
| RPCs called | 1 |
| Risk findings | 0 |

## DAL Files

### `findActorsByHandles.dal.js`

**Path:** `features/upload/dal/findActorsByHandles.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `filterValidActorIdsDAL` | `read` | `actors`, `profiles` |
| `findActorsByHandles` | `read` | `actors`, `profiles` |

### `findPostMentionsByPostIds.dal.js`

**Path:** `features/upload/dal/findPostMentionsByPostIds.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `findPostMentionsByPostIds` | `read` | `actors`, `profiles`, `post_mentions` |

### `insertPost.dal.js`

**Path:** `features/upload/dal/insertPost.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `insertPost` | `read` · `insert` | `posts` |

### `insertPostMedia.dal.js`

**Path:** `features/upload/dal/insertPostMedia.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `insertPostMedia` | `read` · `insert` | `post_media` |

### `insertPostMentions.dal.js`

**Path:** `features/upload/dal/insertPostMentions.dal.js`  
**Operations:** `insert`  

**Exported functions:**

| `insertPostMentions` | `insert` | `post_mentions` |

### `postAuthRollback.dal.js`

**Path:** `features/upload/dal/postAuthRollback.dal.js`  
**Operations:** `delete`  

**Exported functions:**

| `deletePostByIdDAL` | `delete` | `posts` |
| `getCurrentAuthUserDAL` | `delete` | `posts` |

### `searchMentionSuggestions.dal.js`

**Path:** `features/upload/dal/searchMentionSuggestions.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `searchMentionSuggestions` | `rpc` | —`search_actor_directory` |

### `updatePostMediaAssetId.write.dal.js`

**Path:** `features/upload/dal/updatePostMediaAssetId.write.dal.js`  
**Operations:** `update`  

**Exported functions:**

| `updatePostMediaAssetIdDAL` | `update` | `post_media` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actors` | READ | `filterValidActorIdsDAL`, `findActorsByHandles`, `findPostMentionsByPostIds` |
| `post_media` | INSERT, UPDATE | `insertPostMedia`, `updatePostMediaAssetIdDAL` |
| `post_mentions` | INSERT, READ | `findPostMentionsByPostIds`, `insertPostMentions` |
| `posts` | DELETE, INSERT | `deletePostByIdDAL`, `getCurrentAuthUserDAL`, `insertPost` |
| `profiles` | READ | `filterValidActorIdsDAL`, `findActorsByHandles`, `findPostMentionsByPostIds` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `search_actor_directory` | `searchMentionSuggestions` |

---

## Risk Findings

**DIAGNOSTICS-ONLY — `findPostMentionsByPostIds`:** The only caller of this function is `uploadFeature.group.js` (diagnostics harness). No production controller, hook, or screen imports it. It is reachable only via `DevDiagnosticsScreen` in dev. This is a dead code candidate.

**Architecture mismatch — `getCurrentAuthUserDAL` in `postAuthRollback.dal.js`:** This function calls `supabase.auth.getUser()` — it is an auth service accessor, not a rollback/delete operation. It does not belong in a file named `postAuthRollback.dal.js` alongside `deletePostByIdDAL`. The upload layer defines its own auth reader when an equivalent already exists in the auth DAL layer (`dalGetAuthSession` in `features/auth/dal/authSession.read.dal.js`). The function is live and used in `createPost.controller.js`, but it duplicates cross-feature auth access that should come through an approved adapter. Not a blocking issue but an architecture debt item.

**Two upload screens — intentional wrapper pattern, not legacy:** `UploadScreen.jsx` and `UploadScreenModern.jsx` are both live. `UploadScreen.jsx` is the route entry point (registered in router). `UploadScreenModern.jsx` is the UI composition layer imported by the entry screen. This follows the Final Screen / View Screen split correctly. Neither is dead.

**Component + View Screen MISSING — false positive:** The static scanner reported both as missing. The actual components live in `/ui/` subdirectory (13 component files: `PrimaryActionButton`, `SelectedThumbStrip`, `MediaPreview`, `UploadCard`, `LinkifiedMentions`, `SegmentedButton`, `TagChips`, `MentionTypeahead`, `MentionAutocompleteList`, `UploadHeader`, `ActorPill`, `CaptionCard`, `MentionChips`). Scanner searched for `*Component.jsx` and `*View.jsx` patterns and missed the `/ui/` folder. The feature is architecturally complete.

**`insertPost.dal.js` incomplete chain via `posts.adapter.js`:** The doc's chain ending at `usePortfolioItemSubmit.js` (no screen) is a static-scan limitation. `posts.adapter.js` is consumed by multiple vport publish controllers whose chains reach screens (`VportDashboardCalendarScreen.jsx`, `VportDashboardPortfolioScreen.jsx`, etc.). The chain is live — the terminal screens are in the vport dashboard feature.

---

## Pending Reviews

**DELETE CANDIDATE — `findPostMentionsByPostIds.dal.js` (requires IRONMAN confirmation):**
- Function: `findPostMentionsByPostIds`
- Evidence: 0 production callers. Only imported by `uploadFeature.group.js` (diagnostics harness)
- Safe to remove: the diagnostic harness entry should also be removed
- Risk: Negligible

**ARCHITECTURE DEBT — `getCurrentAuthUserDAL` in `postAuthRollback.dal.js`:**
- Not dead code — used in `createPost.controller.js`
- Should be migrated to import from `features/auth/dal/authSession.read.dal.js` instead
- Requires refactor decision by IRONMAN, not a deletion

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `findActorsByHandles.dal.js`

**Direct callers:**

- `uploadFeature.group.js` _Other_
- `createPost.controller.js` _Controller_

**Full call chain to screen:**

```
`findActorsByHandles.dal.js` → `createPost.controller.js` → `useUploadSubmit.js` → `UploadScreen.jsx`
```
```
`findActorsByHandles.dal.js` → `uploadFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `findPostMentionsByPostIds.dal.js`

**Direct callers:**

- `uploadFeature.group.js` _Other_

**Full call chain to screen:**

```
`findPostMentionsByPostIds.dal.js` → `uploadFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `insertPost.dal.js`

**Direct callers:**

- `uploadFeature.group.js` _Other_
- `posts.adapter.js` _Adapter_
- `createPost.controller.js` _Controller_

**Full call chain to screen:**

```
`insertPost.dal.js` → `posts.adapter.js` → `publishLocksmithPortfolioUpdateAsPost.controller.js` → `usePortfolioItemSubmit.js`
```
```
`insertPost.dal.js` → `createPost.controller.js` → `useUploadSubmit.js` → `UploadScreen.jsx`
```
```
`insertPost.dal.js` → `uploadFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```
```
`insertPost.dal.js` → `posts.adapter.js` → `publishBarbershopHoursUpdateAsPost.controller.js` → `usePublishBarbershopHoursPost.js` → `VportDashboardCalendarScreen.jsx`
```

### `insertPostMedia.dal.js`

**Direct callers:**

- `uploadFeature.group.js` _Other_
- `createPost.controller.js` _Controller_

**Full call chain to screen:**

```
`insertPostMedia.dal.js` → `createPost.controller.js` → `useUploadSubmit.js` → `UploadScreen.jsx`
```
```
`insertPostMedia.dal.js` → `uploadFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `insertPostMentions.dal.js`

**Direct callers:**

- `uploadFeature.group.js` _Other_
- `createPost.controller.js` _Controller_

**Full call chain to screen:**

```
`insertPostMentions.dal.js` → `createPost.controller.js` → `useUploadSubmit.js` → `UploadScreen.jsx`
```
```
`insertPostMentions.dal.js` → `uploadFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `postAuthRollback.dal.js`

**Direct callers:**

- `createPost.controller.js` _Controller_

**Full call chain to screen:**

```
`postAuthRollback.dal.js` → `createPost.controller.js` → `useUploadSubmit.js` → `UploadScreen.jsx`
```

### `searchMentionSuggestions.dal.js`

**Direct callers:**

- `uploadFeature.group.js` _Other_
- `searchMentionSuggestions.controller.js` _Controller_

**Full call chain to screen:**

```
`searchMentionSuggestions.dal.js` → `uploadFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```
```
`searchMentionSuggestions.dal.js` → `searchMentionSuggestions.controller.js` → `useMentionAutocomplete.js` → `CaptionCard.jsx` → `UploadScreenModern.jsx`
```

### `updatePostMediaAssetId.write.dal.js`

**Direct callers:**

- `recordPostMedia.controller.js` _Controller_

**Full call chain to screen:**

```
`updatePostMediaAssetId.write.dal.js` → `recordPostMedia.controller.js` → `useUploadSubmit.js` → `UploadScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `uploadTypes.model.js` |
| **Controller** | ✓ PRESENT | `recordPostMedia.controller.js`, `searchMentionSuggestions.controller.js`, `createPost.controller.js` |
| **Adapter** | ✓ PRESENT | `posts.adapter.js`, `LinkifiedMentions.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useMediaSelection.js`, `useMentionAutocomplete.js`, `useResolvedActor.js`, `useUploadSubmit.js` |
| **Component** | ✓ PRESENT | `PrimaryActionButton`, `SelectedThumbStrip`, `MediaPreview`, `UploadCard`, `LinkifiedMentions`, `SegmentedButton`, `TagChips`, `MentionTypeahead`, `MentionAutocompleteList`, `UploadHeader`, `ActorPill`, `CaptionCard`, `MentionChips` — in `/ui/` subdirectory |
| **View Screen** | ✓ PRESENT | `UploadScreenModern.jsx` (UI composition layer, imported by entry screen) |
| **Final Screen** | ✓ PRESENT | `UploadScreen.jsx`, `UploadScreenModern.jsx` |

### Model

_Pure transforms — no side effects, no DB access_

- `features/upload/model/uploadTypes.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/upload/controller/recordPostMedia.controller.js`
- `features/upload/controller/searchMentionSuggestions.controller.js`
- `features/upload/controllers/createPost.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/upload/adapters/posts.adapter.js`
- `features/upload/adapters/ui/LinkifiedMentions.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/upload/hooks/useMediaSelection.js`
- `features/upload/hooks/useMentionAutocomplete.js`
- `features/upload/hooks/useResolvedActor.js`
- `features/upload/hooks/useUploadSubmit.js`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/upload/screens/UploadScreen.jsx`
- `features/upload/screens/UploadScreenModern.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan

> ~~Component — not detected in static scan~~ — **corrected 2026-05-11**: 13 components exist in `/ui/` subdirectory. Scanner missed due to non-standard folder name.
> ~~View Screen — not detected in static scan~~ — **corrected 2026-05-11**: `UploadScreenModern.jsx` is the view composition layer, imported by `UploadScreen.jsx` (the route entry point).

---

## Dead Code Audit

_Audit Date:_ 2026-05-11
_Auditor:_ ARCHITECT static scan + live import grep
_Scope:_ 8 DAL files · 10 exported functions
_Method:_ Every exported function grepped with `-l` and `-n` flags across `apps/VCSM/src/`. Both upload screens read and traced to router. `postAuthRollback.dal.js` read in full. `/ui/` subdirectory inspected for component coverage.

### Function Status Table

| Function | DAL File | Imported By | Status |
|---|---|---|---|
| `filterValidActorIdsDAL` | `findActorsByHandles.dal.js` | `createPost.controller.js` | LIVE — mention safety validation |
| `findActorsByHandles` | `findActorsByHandles.dal.js` | `createPost.controller.js`, `uploadFeature.group.js` | LIVE + DIAGNOSTICS-SECONDARY |
| `findPostMentionsByPostIds` | `findPostMentionsByPostIds.dal.js` | `uploadFeature.group.js` only | **DIAGNOSTICS-ONLY — dead code candidate** |
| `insertPost` | `insertPost.dal.js` | `createPost.controller.js`, `posts.adapter.js`, `uploadFeature.group.js` | LIVE + DIAGNOSTICS-SECONDARY |
| `insertPostMedia` | `insertPostMedia.dal.js` | `createPost.controller.js`, `uploadFeature.group.js` | LIVE + DIAGNOSTICS-SECONDARY |
| `insertPostMentions` | `insertPostMentions.dal.js` | `createPost.controller.js`, `uploadFeature.group.js` | LIVE + DIAGNOSTICS-SECONDARY |
| `deletePostByIdDAL` | `postAuthRollback.dal.js` | `createPost.controller.js` | LIVE — rollback on media insert failure |
| `getCurrentAuthUserDAL` | `postAuthRollback.dal.js` | `createPost.controller.js` | LIVE — but architecturally misplaced |
| `searchMentionSuggestions` | `searchMentionSuggestions.dal.js` | `searchMentionSuggestions.controller.js`, `useMentionAutocomplete.js`, `uploadFeature.group.js` | LIVE + DIAGNOSTICS-SECONDARY |
| `updatePostMediaAssetIdDAL` | `updatePostMediaAssetId.write.dal.js` | `recordPostMedia.controller.js` | LIVE — post-upload media asset write |

### DAL File Inventory

| Status | Count |
|---|---|
| DAL files on disk | 8 |
| DAL files in doc | 8 |
| Undocumented DAL files on disk | 0 |
| Dead functions | 1 (`findPostMentionsByPostIds`) |
| Live functions | 9 |
| Architecturally misplaced functions | 1 (`getCurrentAuthUserDAL`) |

### Verdict by Classification

| Classification | Count | Items |
|---|---|---|
| LIVE | 7 | Core post-creation pipeline + mention validation + media write |
| LIVE + DIAGNOSTICS-SECONDARY | 5 | Functions that also appear in `uploadFeature.group.js` |
| DIAGNOSTICS-ONLY | 1 | `findPostMentionsByPostIds` — no production caller |
| ARCHITECTURALLY MISPLACED | 1 | `getCurrentAuthUserDAL` — live but belongs in auth layer |
| TRUE DEAD CODE | **1** | `findPostMentionsByPostIds` |

### Two Upload Screens

| Screen | Role | Status |
|---|---|---|
| `UploadScreen.jsx` | Route entry point — registered in router, identity gate | LIVE — active route |
| `UploadScreenModern.jsx` | UI composition layer — form, media selection, mention autocomplete | LIVE — imported by entry screen |

Both are active and intentional. `UploadScreen.jsx` wraps `UploadScreenModern.jsx`. Neither is legacy.

### `postAuthRollback.dal.js` Architecture Note

This file bundles two unrelated responsibilities:
- `deletePostByIdDAL` — correct for a rollback file (deletes orphaned post on media insert failure)
- `getCurrentAuthUserDAL` — reads Supabase Auth session; belongs in the auth DAL layer

`getCurrentAuthUserDAL` duplicates functionality available in `features/auth/dal/authSession.read.dal.js`. This is an upload-layer re-implementation of an auth concern. Not a blocking production risk, but violates the DAL single-responsibility principle and cross-feature access rule. IRONMAN should decide whether to migrate the import or formally document the local accessor as intentional.

### `insertPost.dal.js` Chain Correction

Doc listed the chain via `posts.adapter.js` → `publishLocksmithPortfolioUpdateAsPost.controller.js` → `usePortfolioItemSubmit.js` as incomplete (no screen). This is a static-scan limit. `posts.adapter.js` is consumed by multiple vport VPORT system-post controllers whose chains reach screens in the vport dashboard feature (`VportDashboardCalendarScreen.jsx`, `VportDashboardPortfolioScreen.jsx`, `VportDashboardExchangeScreen.jsx`). The chain is live.

---

## Native Parity Notes

Native Relevance: YES
Falcon Review: REQUIRED
Related Native Module: `upload` — post creation, media selection, mention autocomplete, and rollback are core user-facing flows.
Native Transfer Status: PENDING FALCON
Known Native Gaps: The two-screen pattern (`UploadScreen.jsx` wrapping `UploadScreenModern.jsx`) must be preserved in native. The 13 `/ui/` components not detected by the static scanner must be inventoried for native transfer. `getCurrentAuthUserDAL` being misplaced in the upload layer is a parity concern — native should source auth from the auth engine, not an upload-local accessor.
Winter Soldier Handoff: Not yet initiated.

---

## Command Evidence Registry

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.upload.md` (this doc) | Initial DAL map + dead code audit source | PRESENT |
| IRONMAN | — | **REQUIRED** — ownership decision: delete `findPostMentionsByPostIds`, migrate `getCurrentAuthUserDAL` | MISSING |
| VENOM | — | Trust boundary — post insert, auth read in upload layer, mention validation | MISSING |
| SENTRY | — | Architecture boundary — `getCurrentAuthUserDAL` cross-feature concern | MISSING |
| FALCON | — | Native parity for post creation, media upload, mention autocomplete | MISSING |
| LOKI | — | Runtime trace — rollback path (`deletePostByIdDAL`) trigger frequency | MISSING |
| KRAVEN | — | Performance — `searchMentionSuggestions` RPC on every keystroke | MISSING |
| CARNAGE | — | DB migration history for `posts`, `post_media`, `post_mentions` | MISSING |

---

## Change Log

### 2026-05-11

**Task:** Dead code audit of upload DAL layer — verify all 8 DAL files and 10 exported functions; investigate diagnostics-only functions, misplaced auth accessor, dual screens, and missing layer flags
**Application Scope:** VCSM
**Prompt:** User requested ARCHITECT dead code detection on `vcsm.dal.upload.md` (read-only), confirmed findings, then requested Logan update
**Code Status Before:** Risk Findings and Pending Reviews were empty placeholders. Component and View Screen marked MISSING in Architecture Pipeline. `getCurrentAuthUserDAL` unlabelled architecture concern. `findPostMentionsByPostIds` appeared to have a production caller (it does not — diagnostics only).
**Code Status After:** No code changes — audit only. Documentation updated.
**Files Changed:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.upload.md` (this file)
**Command Evidence:** ARCHITECT static scan + live import grep across `apps/VCSM/src/` + `postAuthRollback.dal.js` read + both upload screens read + `/ui/` subdirectory inspection
**Architecture Contracts Checked:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md
**Security / Runtime / DB Notes:** `getCurrentAuthUserDAL` in the upload layer re-implements auth session access that belongs in the auth DAL layer — potential divergence risk if auth behaviour changes. `filterValidActorIdsDAL` is a security-relevant function (prevents invalid actor ID injection in mentions) — must not be removed. VENOM review recommended for post insert + mention validation trust boundary.
**Validation:** 9 functions confirmed live. 1 confirmed diagnostics-only dead code (`findPostMentionsByPostIds`). 1 architecturally misplaced but live (`getCurrentAuthUserDAL`). Component layer (13 files) and View Screen confirmed present in `/ui/`. Both upload screens confirmed live and intentional.
**Documentation Truth Status:** VERIFIED
**Native Documentation Verification:** PENDING FALCON

---

## Layer Consumer Map

_Performed:_ 2026-05-11 · Method: ARCHITECT + Explore agent full import trace across `apps/VCSM/src/`  
_Question answered:_ Which models, controllers, hooks, and screens touch each DAL function?

---

### Full System Flow

```
UPLOAD FEATURE — PRIMARY PATH

Route /upload
  → UploadScreen.jsx               (Final Screen — route entry + identity gate)
    → UploadScreenModern.jsx       (View Screen — UI composition)
      → useUploadSubmit.js         (Hook — orchestrator)
          → createPost.controller.js
              → [DAL] insertPost
              → [DAL] insertPostMedia
              → [DAL] insertPostMentions
              → [DAL] findActorsByHandles
              → [DAL] filterValidActorIdsDAL
              → [DAL] deletePostByIdDAL        (rollback on failure)
              → [DAL] getCurrentAuthUserDAL    (auth verify pre-insert)
          → recordPostMedia.controller.js      (non-blocking — Promise.allSettled)
              → [DAL] updatePostMediaAssetIdDAL
      → useMentionAutocomplete.js  (Hook — real-time mention search)
          → searchMentionSuggestions.controller.js
              → [DAL] searchMentionSuggestions
          → CaptionCard.jsx → MentionTypeahead.jsx → MentionAutocompleteList.jsx → ActorPill.jsx

CROSS-FEATURE PATH — via posts.adapter.js

features/profiles/kinds/vport/controller/...  (8 publish controllers)
  → posts.adapter.js  (createSystemPost — the only cross-feature export)
      → [DAL] insertPost
```

---

### Per-Function Consumer Table

| DAL Function | Controller | Hook | Screen | Notes |
|---|---|---|---|---|
| `filterValidActorIdsDAL` | `createPost.controller.js` | `useUploadSubmit.js` | `UploadScreen.jsx` | Mention safety validation — prevents invalid actor ID injection |
| `findActorsByHandles` | `createPost.controller.js` | `useUploadSubmit.js` | `UploadScreen.jsx` | Also in `uploadFeature.group.js` (diagnostics only) |
| `findPostMentionsByPostIds` | _(none)_ | _(none)_ | _(none)_ | **DIAGNOSTICS-ONLY** — `uploadFeature.group.js` only |
| `insertPost` | `createPost.controller.js`, `posts.adapter.js` (8 vport controllers) | `useUploadSubmit.js`, `usePortfolioItemSubmit.js`, `usePublishBarbershopHoursPost.js`, others | `UploadScreen.jsx`, vport dashboard screens | Most-consumed DAL function in this feature |
| `insertPostMedia` | `createPost.controller.js` | `useUploadSubmit.js` | `UploadScreen.jsx` | Also in diagnostics group |
| `insertPostMentions` | `createPost.controller.js` | `useUploadSubmit.js` | `UploadScreen.jsx` | Also in diagnostics group |
| `deletePostByIdDAL` | `createPost.controller.js` | `useUploadSubmit.js` | `UploadScreen.jsx` | Rollback path — triggered on media insert failure |
| `getCurrentAuthUserDAL` | `createPost.controller.js` | `useUploadSubmit.js` | `UploadScreen.jsx` | Architecturally misplaced — belongs in auth DAL layer |
| `searchMentionSuggestions` | `searchMentionSuggestions.controller.js` | `useMentionAutocomplete.js` | `UploadScreenModern.jsx` | Also in diagnostics group; fires on every typeahead keystroke |
| `updatePostMediaAssetIdDAL` | `recordPostMedia.controller.js` | `useUploadSubmit.js` (non-blocking) | `UploadScreen.jsx` | Called via `Promise.allSettled` — non-blocking media asset writeback |

---

### Controllers

| Controller | DAL Functions Used | Hook Consumer |
|---|---|---|
| `createPost.controller.js` | `filterValidActorIdsDAL`, `findActorsByHandles`, `insertPost`, `insertPostMedia`, `insertPostMentions`, `deletePostByIdDAL`, `getCurrentAuthUserDAL` | `useUploadSubmit.js` |
| `searchMentionSuggestions.controller.js` | `searchMentionSuggestions` | `useMentionAutocomplete.js` |
| `recordPostMedia.controller.js` | `updatePostMediaAssetIdDAL` | `useUploadSubmit.js` (non-blocking) |

Cross-feature controllers that consume `insertPost` via `posts.adapter.js`:

| Controller | Path | Hook | Screen |
|---|---|---|---|
| `publishExchangeRateUpdateAsPostController` | `features/profiles/kinds/vport/controller/exchange/` | `usePublishExchangeRatePost` | vport dashboard |
| `publishFuelPriceUpdateAsPostController` | `features/profiles/kinds/vport/controller/gas/` | `useSubmitFuelPriceSuggestion` | vport dashboard |
| `publishLocksmithHoursUpdateAsPostController` | `features/profiles/kinds/vport/controller/locksmith/` | `usePublishLocksmithPost` | vport dashboard |
| `publishLocksmithServiceAreaUpdateAsPostController` | `features/profiles/kinds/vport/controller/locksmith/` | `usePublishLocksmithPost` | vport dashboard |
| `publishLocksmithPortfolioUpdateAsPostController` | `features/profiles/kinds/vport/controller/locksmith/` | `usePortfolioItemSubmit` | `VportDashboardPortfolioScreen` |
| `publishBarbershopHoursUpdateAsPostController` | `features/profiles/kinds/vport/controller/barbershop/` | `usePublishBarbershopHoursPost` | vport dashboard |
| `publishBarbershopPortfolioUpdateAsPostController` | `features/profiles/kinds/vport/controller/barbershop/` | _(traced via adapter)_ | vport dashboard |
| `publishMenuUpdateAsPostController` | `features/profiles/kinds/vport/controller/menu/` | _(traced via adapter)_ | vport dashboard |

---

### Hooks

| Hook | Controller Consumed | DAL Reached (indirect) | Screen |
|---|---|---|---|
| `useUploadSubmit.js` | `createPost.controller.js`, `recordPostMedia.controller.js` | `insertPost`, `insertPostMedia`, `insertPostMentions`, `filterValidActorIdsDAL`, `findActorsByHandles`, `deletePostByIdDAL`, `getCurrentAuthUserDAL`, `updatePostMediaAssetIdDAL` | `UploadScreen.jsx` |
| `useMentionAutocomplete.js` | `searchMentionSuggestions.controller.js` | `searchMentionSuggestions` | `UploadScreenModern.jsx` (via `CaptionCard.jsx`) |

---

### Models

| Model | File | Exports | Used By |
|---|---|---|---|
| `uploadTypes.model.js` | `features/upload/model/uploadTypes.model.js` | `MediaType` (TEXT, IMAGE, VIDEO), `Visibility` (PUBLIC, FOLLOWERS, PRIVATE) | UI components for form state — not directly imported by controllers or DAL |

Cross-feature model-adjacent imports used by upload controllers:

| Import | Source Feature | Used By | Purpose |
|---|---|---|---|
| `publishVcsmNotificationBatch` | `features/notifications` | `createPost.controller.js` | Post-insert notification dispatch |
| `ctrlGetBlockedActorSet` | `features/block` | `createPost.controller.js` | Block safety check before post creation |
| `createMediaAssetController` | `features/media` | `recordPostMedia.controller.js` | Media asset creation after upload |
| `resolveVcsmAppIdDAL` | `features/media` | `recordPostMedia.controller.js` | App ID resolution for media storage |

---

### Screens

| Screen | Role | DAL Functions Reached |
|---|---|---|
| `UploadScreen.jsx` | Final Screen — route entry, identity gate | All 9 production functions (via `useUploadSubmit`) |
| `UploadScreenModern.jsx` | View Screen — UI composition, form, mention autocomplete | `searchMentionSuggestions` (via `useMentionAutocomplete`) |
| `VportDashboardPortfolioScreen.jsx` | vport dashboard (cross-feature) | `insertPost` via `posts.adapter.js` |
| `VportDashboardCalendarScreen.jsx` | vport dashboard (cross-feature) | `insertPost` via `posts.adapter.js` |
| _(other vport dashboard screens)_ | vport dashboard (cross-feature) | `insertPost` via `posts.adapter.js` |

---

### Change Log Entry

### 2026-05-11 — Layer Consumer Map

Task: ARCHITECT full layer consumer trace — which models, controllers, hooks, and screens touch each upload DAL function  
Application Scope: VCSM  
Code Reviewed: All 8 DAL files + `posts.adapter.js` + `createPost.controller.js` + `searchMentionSuggestions.controller.js` + `recordPostMedia.controller.js` + both upload screens + all 8 cross-feature vport publish controllers  
Files Changed: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.upload.md` (this file)  

Key findings:
- `createPost.controller.js` is the primary hub — it uses 7 of 10 DAL functions
- `posts.adapter.js` exposes `insertPost` to 8 cross-feature vport publish controllers
- `updatePostMediaAssetIdDAL` is called non-blocking (Promise.allSettled) — not on the critical path
- `uploadTypes.model.js` is UI-only (enums/constants) — not imported by DAL or controllers
- `findPostMentionsByPostIds` confirmed DIAGNOSTICS-ONLY — 0 production callers  
Documentation Truth Status: VERIFIED

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/upload/hooks/useMentionAutocomplete.js` | Previously DEV-gated the mention autocomplete search failure warning during the post/upload overlap pass. |
| `apps/VCSM/src/features/upload/lib/compressIfNeeded.js` | Previously DEV-gated the image compression fallback warning during the post/upload overlap pass. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.upload.md` | Appended this fix-pass record only; no prior audit content was removed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| `findPostMentionsByPostIds.dal.js` diagnostics-only dead code candidate | DEFERRED | Verified only diagnostics caller. No deletion was performed under the no-delete instruction. |
| `getCurrentAuthUserDAL` architecturally misplaced in `postAuthRollback.dal.js` | DEFERRED | Verified it calls `supabase.auth.getUser()` and is live in `createPost.controller.js`. Existing auth DAL helpers use `getSession()`, not exact `getUser()` behavior, so no silent migration was made. |
| Two upload screens | VERIFIED LIVE | `UploadScreen.jsx` is the route entry and imports `UploadScreenModern.jsx` as the UI composition layer. |
| Component/View scanner false positive | VERIFIED | Current disk scan confirms `/ui/` components and both upload screens exist. |
| `insertPost.dal.js` cross-feature chain via `posts.adapter.js` | VERIFIED LIVE | Current search confirms `posts.adapter.js` is used by vport publish controllers. No consolidation needed. |
| Upload warning logs | DONE | Current-pass source changes already DEV-gated `useMentionAutocomplete` and `compressIfNeeded`; behavior unchanged. |

### Verification
- Commands/searches run:
  - `wc -l zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.upload.md`
  - `sed -n '1,280p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.upload.md`
  - `sed -n '281,620p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.upload.md`
  - `sed -n '1,80p' apps/VCSM/src/features/upload/dal/postAuthRollback.dal.js`
  - `sed -n '1,120p' apps/VCSM/src/features/auth/dal/authSession.read.dal.js`
  - `sed -n '1,160p' apps/VCSM/src/features/auth/adapters/auth.adapter.js`
  - `rg -n "findPostMentionsByPostIds|getCurrentAuthUserDAL|postAuthRollback|dalGetAuthSession|authSession\\.read\\.dal|resolveVcsmAppIdDAL|resolveVcsmAppId" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `find apps/VCSM/src/features/upload -type f \\( -name '*.js' -o -name '*.jsx' \\) | sort`
- Production callers checked:
  - `findPostMentionsByPostIds`: diagnostics-only in `dev/diagnostics/groups/uploadFeature.group.js`.
  - `getCurrentAuthUserDAL`: live in `features/upload/controllers/createPost.controller.js`.
  - `dalGetAuthSession`: auth DAL helper exists but returns session, not the exact user shape returned by `getCurrentAuthUserDAL`.
  - `posts.adapter.js`: live cross-feature surface for vport publish controllers.
- Remaining risks:
  - `findPostMentionsByPostIds.dal.js` deletion remains pending IRONMAN.
  - `getCurrentAuthUserDAL` migration remains pending IRONMAN/SENTRY because an exact `getUser()` adapter path was not present.
  - VENOM/FALCON/SENTRY upload reviews remain pending as documented.
  - No new source changes were made during this upload-doc pass; build was not rerun after this append-only documentation pass. The previous social build passed.

### Status
PARTIAL
