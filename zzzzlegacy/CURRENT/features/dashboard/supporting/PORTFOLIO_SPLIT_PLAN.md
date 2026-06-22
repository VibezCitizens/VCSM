# PORTFOLIO_SPLIT_PLAN

**Ticket:** TICKET-0004 / PORTFOLIO-ARCH-001
**Phase:** 3 — P1 Portfolio
**Produced:** 2026-06-02
**Status:** Planning only — no code changes

---

## Current State Assessment

### File Size Problem

| File | Lines | Classification |
|---|---|---|
| `PortfolioItemForm.jsx` | 292 | GOD COMPONENT — largest in codebase |
| `usePortfolioItemSubmit.js` | 155 | CONTROLLER IN HOOK |
| `usePortfolioMediaUpload.js` | 33 | misplaced (inside component subfolder) |
| `addPortfolioMediaWithRecord.controller.js` | 79 | scoped too narrowly (DAL write only) |

### Layer Violation

Both hooks live at `components/portfolio/hooks/` — inside the component directory.
Architecture contract: hooks are never owned by the component layer.

```
CURRENT (violation):
cards/portfolio/
  components/
    portfolio/
      hooks/                    ← WRONG LOCATION
        usePortfolioItemSubmit.js
        usePortfolioMediaUpload.js
      PortfolioItemForm.jsx

REQUIRED:
cards/portfolio/
  hooks/                        ← card-level hooks directory
    usePortfolioItemSubmit.js   (after reduction)
    usePortfolioMediaUpload.js
    usePortfolioFormState.js    (new)
  components/
    portfolio/
      PortfolioItemForm.jsx     (after split)
```

---

## 1. Responsibility Breakdown — PortfolioItemForm.jsx (292 lines)

### Current responsibilities inside the single file

| # | Responsibility | Lines (approx) | Target Layer |
|---|---|---|---|
| 1 | Kind selector (work, before_after, style_card, space) | ~30 | Component (PortfolioFormBase) |
| 2 | Title input (22 char max) + description input | ~25 | Component (PortfolioFormBase) |
| 3 | Tag management (add/remove, chip display) | ~30 | Component (PortfolioFormBase) |
| 4 | Locksmith-specific conditional fields (8 fields) | ~70 | Component (LocksmithPortfolioFields) |
| 5 | File picker + 3-column preview grid | ~45 | Component (PortfolioFileUploader) |
| 6 | Before/after media role labeling | ~20 | Component (PortfolioFileUploader) |
| 7 | Share-to-feed checkbox (barbershop + locksmith) | ~15 | Component (PortfolioShareToggle) |
| 8 | Form validation (title required, file required, etc.) | ~15 | Model (portfolioItem.validation.model) |
| 9 | Submission delegation to usePortfolioItemSubmit | ~20 | Hook call |
| 10 | Create vs edit mode conditional rendering | ~20 | Component (PortfolioFormBase) |

---

## 2. Validation

### Current State
Validation logic is scattered across the form component and the submission hook.
- Title length enforcement: inline in form (~22 char limit)
- Required fields check: inside `usePortfolioItemSubmit`
- Media requirement: inside submission hook

### Target State — `portfolioItem.validation.model.js` (new)

```javascript
// model/portfolioItem.validation.model.js

const TITLE_MAX = 22;
const ALLOWED_KINDS = ["work", "before_after", "style_card", "space"];

function validatePortfolioItemDraft(draft, files) {
  if (!draft.title?.trim()) return "Title is required";
  if (draft.title.length > TITLE_MAX) return `Title must be ${TITLE_MAX} chars or fewer`;
  if (!ALLOWED_KINDS.includes(draft.kind)) return "Invalid item kind";
  if (!files || files.length === 0) return "At least one image is required";
  return null; // valid
}

function validateLocksmithFields(draft) {
  // locksmith-specific required field checks
}
```

Validation is called by `submitPortfolioItem.controller.js`, not by the hook or component.

---

## 3. Upload

### Current State
`usePortfolioMediaUpload.js` wraps `useMediaUpload` with `portfolio_media` scope.
`usePortfolioItemSubmit.js` loops over files calling `addPortfolioMediaWithRecord` per file.
Upload is interleaved with submission orchestration — no clear upload stage boundary.

### Target State — `usePortfolioMediaUpload.js` (moved to card-level hooks/)

Hook stays largely the same. Its location moves from `components/portfolio/hooks/` to `hooks/`.

The upload loop moves into `submitPortfolioItem.controller.js`:
```javascript
// controller: after item created/updated, loop files
for (const file of files) {
  await addPortfolioMediaWithRecordController({ file, itemId, callerProfileId, role });
}
```

The hook is no longer responsible for the upload loop — it provides the single-file upload
function that the controller invokes.

---

## 4. Submission

### Current State
`usePortfolioItemSubmit.js` (155 lines) owns:
1. Create vs update path branching
2. Upload loop (file iteration + addPortfolioMediaWithRecord calls)
3. Before/after media role assignment
4. Locksmith detail persistence (ctrlSavePortfolioDetail)
5. Optional feed publishing (publishLocksmithPortfolioUpdateAsPostController)
6. Error recovery and rollback
7. `identityActorId` vs `actorId` normalization

This is the full submission orchestration — it belongs in a controller, not a hook.

### Target State — `submitPortfolioItem.controller.js` (new)

```javascript
// controller/submitPortfolioItem.controller.js

async function submitPortfolioItemController({
  callerActorId,      // identity actor (person)
  targetActorId,      // vport actor (owner)
  callerProfileId,    // for media_asset ownership scoping
  draft,              // form draft { kind, title, description, tags }
  files,              // array of file objects
  locksmithDetails,   // null if not locksmith kind
  shareToFeed,        // boolean
  existingItemId,     // null if creating new
}) {
  // 1. Validate draft + files
  // 2. Create or update portfolio item (via @portfolio engine)
  // 3. Loop: upload each file + addPortfolioMediaWithRecord
  // 4. Assign before/after roles if kind === "before_after"
  // 5. If locksmithDetails: ctrlSavePortfolioDetail
  // 6. If shareToFeed: publishLocksmithPortfolioUpdateAsPostController
  // 7. Return { ok, item } or { ok: false, error }
}
```

`usePortfolioItemSubmit.js` becomes a thin React binding (~40 lines):
- Calls `submitPortfolioItemController`
- Manages `submitting`, `submitError` state
- Provides `submit(draft, files)` callback to form

---

## 5. Tag Management

### Current State
Tag add/remove logic and chip UI live inside `PortfolioItemForm.jsx`.

### Target State

**Component:** `PortfolioTagField.jsx` (new — ~40 lines)
- Renders existing tags as chips
- Add tag input
- Remove tag handler
- Props: `tags`, `onChange`

**No controller needed** — tags are pure form state managed in `usePortfolioFormState`.

---

## 6. Locksmith-Specific Fields

### Current State
~70 lines of conditional locksmith fields inside `PortfolioItemForm.jsx`:
- Job type selector
- Property type selector
- Lock type selector
- Hardware brand input
- Service mode selector
- Duration input
- Emergency flag toggle
- Security assessment flag toggle

These render only when `draft.kind === "locksmith_work"` or similar.

### Target State — `LocksmithPortfolioFields.jsx` (new — ~80 lines)

```jsx
// components/portfolio/LocksmithPortfolioFields.jsx
function LocksmithPortfolioFields({ draft, onChange }) {
  // all 8 locksmith-specific field inputs
  // Pure presentational — receives draft + onChange
}
```

`PortfolioFormBase` renders `<LocksmithPortfolioFields />` conditionally based on kind.
The locksmith fields have zero knowledge of submission — they are pure form inputs.

---

## 7. Preview Logic

### Current State
File preview grid (3-column layout) + before/after role labels live inside `PortfolioItemForm.jsx`.
Before/after role assignment (which file is "before" vs "after") is managed inline.

### Target State — `PortfolioFileUploader.jsx` (new — ~60 lines)

```jsx
// components/portfolio/PortfolioFileUploader.jsx
function PortfolioFileUploader({ files, kind, onChange }) {
  // File picker trigger
  // 3-column preview grid
  // Before/after label overlays (only when kind === "before_after")
  // Remove file handler
}
```

Props:
- `files` — current file list
- `kind` — "before_after" triggers role labels
- `onChange(files)` — calls up to `usePortfolioFormState`

---

## 8. Exact Split Plan — What Belongs Where

### Component Layer

| New File | Purpose | Lines (est) |
|---|---|---|
| `PortfolioFormBase.jsx` | Kind selector, title, description, tags, submit button, create/edit mode | ~80 |
| `LocksmithPortfolioFields.jsx` | All 8 locksmith-specific conditional inputs | ~80 |
| `PortfolioFileUploader.jsx` | File picker, 3-column preview, before/after labels | ~60 |
| `PortfolioShareToggle.jsx` | Share-to-feed checkbox with conditional visibility | ~20 |

`PortfolioItemForm.jsx` becomes an orchestrator that composes these 4 components.
Estimated post-split size: ~80 lines (structure + composition only).

### Hook Layer (all moved to `cards/portfolio/hooks/`)

| New/Moved File | Purpose | Lines (est) |
|---|---|---|
| `usePortfolioFormState.js` (new) | Draft state, field onChange, tag add/remove | ~60 |
| `usePortfolioItemSubmit.js` (reduced) | React binding: calls controller, manages submitting/error | ~40 |
| `usePortfolioMediaUpload.js` (moved) | Thin upload wrapper — moved from components/hooks/ | ~33 |

### Controller Layer

| New File | Purpose | Lines (est) |
|---|---|---|
| `submitPortfolioItem.controller.js` (new) | Full submission orchestration: validate → create/update → upload loop → locksmith → feed | ~100 |

`addPortfolioMediaWithRecord.controller.js` (existing 79 lines) stays — it handles the
media record + asset tracking per file. `submitPortfolioItem.controller.js` calls it
in its upload loop.

### Model Layer

| New File | Purpose | Lines (est) |
|---|---|---|
| `portfolioItem.validation.model.js` (new) | Title max, required fields, kind allowlist, locksmith requirements | ~30 |

---

## 9. Dependency Flow After Split

```
VportDashboardPortfolioScreen
  └─ PortfolioItemForm (orchestrator, ~80 lines)
       ├─ [renders] PortfolioFormBase
       │    └─ PortfolioTagField
       ├─ [renders] LocksmithPortfolioFields (conditional on kind)
       ├─ [renders] PortfolioFileUploader
       ├─ [renders] PortfolioShareToggle (conditional on vportType)
       └─ [uses] usePortfolioFormState
            └─ [calls on submit] usePortfolioItemSubmit
                 └─ submitPortfolioItem.controller.js
                      ├─ portfolioItem.validation.model
                      ├─ createItem / updateItem (@portfolio)
                      ├─ addPortfolioMediaWithRecordController (loop per file)
                      ├─ ctrlSavePortfolioDetail (locksmith only)
                      └─ publishLocksmithPortfolioUpdateAsPostController (optional)
```

---

## 10. Risk Factors

### RF-001 — Adding New VPORT Kinds
Current: A new kind requiring conditional fields (like locksmith fields) must be added to
the 292-line god component.
After split: A new kind adds `NewKindPortfolioFields.jsx` + a conditional render in
`PortfolioFormBase`. No existing component is touched.

### RF-002 — Before/After Kind Complexity
The `before_after` kind has dual-file requirements and role labeling. This logic is currently
entangled with the general file upload flow. After split, `PortfolioFileUploader` owns this
entirely — the controller receives `role` metadata from the uploader's output.

### RF-003 — callerProfileId vs callerActorId Normalization
`usePortfolioItemSubmit` currently handles `identityActorId` vs `actorId` normalization.
The controller must receive both cleanly — screen passes `callerActorId` (identity) and
`targetActorId` (vport owner), and `callerProfileId` (for media asset ownership).
This mapping should be explicit in the controller signature, not inferred.

---

## Estimated Effort

| Task | Effort |
|---|---|
| `portfolioItem.validation.model.js` | 30 min |
| `PortfolioFormBase.jsx` | 1 hour |
| `LocksmithPortfolioFields.jsx` | 45 min |
| `PortfolioFileUploader.jsx` | 45 min |
| `PortfolioShareToggle.jsx` | 15 min |
| `usePortfolioFormState.js` | 45 min |
| Move `usePortfolioMediaUpload.js` + update imports | 20 min |
| `submitPortfolioItem.controller.js` | 1.5 hours |
| Reduce `usePortfolioItemSubmit.js` | 30 min |
| `PortfolioItemForm.jsx` orchestrator (post-split) | 45 min |
| **Total** | **~7 hours** |
