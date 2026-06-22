# VCSM Features Folder — Remediation Plan

Generated: 2026-04-09
Codebase: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features`
Status: All items verified against current codebase
Version: 2 — execution-ready

---

## 1. Executive Summary

The features folder is **partially fragmented**: the route-mounted runtime is mostly stable, but there are three proven runtime bugs, confirmed dead code, and one duplicate system with divergent keys.

**Verdict:** Fix three runtime bugs immediately (Phase 1), consolidate to one canonical tab registry (Phase 2), then clean up dead files (Phase 3). All phases are low-to-medium risk with small file scope.

---

## 2. Verified Must-Fix Items

### BUG 1: /chat/new route points to missing export

**Status:** CONFIRMED BROKEN
**Severity:** Critical — route crashes at runtime

**What happens:** Navigating to `/chat/new` triggers a runtime error. The lazy import chain fails because `NewConversationScreen` is not exported from `@/features/chat`.

**Evidence:**
- `app/routes/index.jsx` line 201–203: lazy imports `m.NewConversationScreen` from `@/features/chat`
- `features/chat/index.js` lines 11–15: only exports `InboxScreen` and `ConversationScreen`
- `NewConversationScreen` does not exist as a named export anywhere
- `StartConversationModal.jsx` exists but is a modal component, not a routable screen

**Impacted files:**
- `app/routes/index.jsx` (lazy import)
- `app/routes/protected/app.routes.jsx` line 172 (route definition)
- `features/chat/index.js` (missing export)

**Decision:** Create a dedicated routable wrapper screen `NewConversationScreen.jsx` in `features/chat/start/screens/` that renders `StartConversationModal` as a full-page view, then export it from `features/chat/index.js`. Do NOT re-export the modal directly — it was designed as a modal, not a page.

---

### BUG 2: Service review list calls ctrlListReviews with wrong argument shape

**Status:** CONFIRMED — contract mismatch
**Severity:** High — service reviews silently return wrong data

**What happens:** `VportServiceReviews.controller.js` line 52 passes `limit` as a plain number, but `ctrlListReviews` expects an object `{ limit, cursor }`. The limit is silently ignored (defaults to 25), and the return shape is also consumed incorrectly.

**Evidence:**
- `VportServiceReviews.controller.js` line 52: `const rows = await ctrlListReviews(targetActorId, limit)`
- `VportReviews.controller.js` line 179: `export async function ctrlListReviews(targetActorId, { limit = 25, cursor = null } = {})`
- Caller also treats result as array (`Array.isArray(rows)`) but `ctrlListReviews` returns `{ reviews, hasMore, nextCursor }`

**Decision:** Change line 52 to `const result = await ctrlListReviews(targetActorId, { limit })` and consume `result.reviews` instead of `rows`. Single-file fix.

---

### BUG 3: initialReviewTab intent is passed but silently dropped

**Status:** CONFIRMED — prop not consumed
**Severity:** Medium — user experience regression, no crash

**What happens:** When a user taps a food review CTA or similar deep link, the intent to open a specific review sub-tab is passed through two components but the final review screen ignores it.

**Evidence:**
- `VportProfileViewScreen.jsx` line 56: state `reviewsDefaultTab` created
- `VportProfileViewScreen.jsx` line 370: passes `initialReviewTab={reviewsDefaultTab}` and callback
- `tabs/VportReviewsView.jsx` lines 5–17: passes through correctly
- `review/VportReviewsView.jsx` lines 68–73: function signature does **NOT include** `initialReviewTab` or `onConsumedInitialTab`

**Decision:** Add `initialReviewTab` and `onConsumedInitialTab` to the review screen's destructured props. On mount, if `initialReviewTab` is set, apply it to the hook's tab state and call the consumed callback. Single-file fix.

---

## 3. Verified Structural Issues

### ISSUE: Duplicate tab-resolution logic with divergent subtype keys

**Status:** CONFIRMED — two implementations with conflicting type keys

**Files:**
| File | Path | Runtime Status |
|------|------|---------------|
| Legacy | `features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js` | **ACTIVE** — 3 production imports |
| Newer | `features/profiles/kinds/vport/vportTypeRegistry.js` | Diagnostics only — 1 dev import |

**Key Divergence:**
| Subtype | Legacy file | Newer file | DB constraint |
|---------|-------------|------------|---------------|
| Exchange | `exchange` | `"money exchange"` | `"money exchange"` |
| Barber | `barber` (explicit key) | (uses group fallback) | In "Beauty & Wellness" group |

**Decision:** `vportTypeRegistry.js` is the **canonical registry**. It has correct type keys matching the DB constraint and better documentation. Migrate all 3 production imports to use it, then delete the legacy file.

**Migration steps:**
1. Update `VportProfileKindScreen.jsx` import
2. Update `VportProfileViewScreen.jsx` import
3. Update `dashboardViewByVportType.model.js` import
4. Verify locksmith entry exists in the new registry (it was added to the legacy file)
5. Delete `features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js`

---

## 4. Verified Dead Code

### Legacy review DAL files — CONFIRMED DEAD

| File | Active Imports |
|------|---------------|
| `dal/review/vportReviews.read.dal.js` | **ZERO** |
| `dal/review/vportReviews.write.dal.js` | **ZERO** |
| `dal/review/vportReviewAuthors.read.dal.js` | **ZERO** |

**Note:** `dal/review/reviewTarget.read.dal.js` is still actively imported (3 call sites). Do NOT remove.

**Gate:** Re-verify zero imports with `grep` before deleting. Only delete after Phase 1 review fixes are verified working.

### Stale explore/notifications files — CONFIRMED ORPHANED

| File | Status | Safe to Delete |
|------|--------|---------------|
| `features/explore/ui/index.jsx` (191 bytes) | Stale route module | Yes |
| `features/notifications/screen/views/NotiViewPostScreen.jsx` (0 bytes) | Zero-byte orphan | Yes |
| `features/explore/model/search.model.js` (2.6 KB) | No active imports | Yes (verify first) |
| `features/explore/usecases/search.usecase.js` (526 bytes) | Broken — imports don't exist | Yes |

### Filter token drift

**File:** `features/explore/hooks/useSearchScreenController.js` line 5: `'Voxs'` should be `'vports'`.

---

## 5. Recommended Execution Phases

### Phase 1 — Runtime Safety (BLOCKS ALL OTHER PHASES)

| # | Task | Files | Risk |
|---|------|-------|------|
| 1a | Fix `/chat/new` — create wrapper screen + export | `chat/start/screens/NewConversationScreen.jsx` (new), `chat/index.js`, `app/routes/index.jsx` | Low |
| 1b | Fix service review argument contract | `VportServiceReviews.controller.js` | Low |
| 1c | Wire `initialReviewTab` end-to-end | `review/VportReviewsView.jsx` | Low |

**Gate:** All 3 must pass validation before proceeding to Phase 2.

### Phase 2 — Blueprint Consolidation

| # | Task | Files | Risk |
|---|------|-------|------|
| 2a | Migrate tab resolution to `vportTypeRegistry.js` | 3 import sites | Medium |
| 2b | Delete legacy `getVportTabsByType.model.js` | 1 file | Low (after 2a) |

**Gate:** Verify all vport types resolve correct tabs before deleting legacy file.

### Phase 3 — Legacy Cleanup

| # | Task | Files | Risk |
|---|------|-------|------|
| 3a | Re-verify zero imports on review DAL files, then delete | 3 files | Low |
| 3b | Delete orphaned explore/notification files | 4 files | Low |

**Gate:** `grep` verification before each deletion.

### Phase 4 — Naming / Contract Consistency

| # | Task | Files | Risk |
|---|------|-------|------|
| 4a | Fix `Voxs` → `vports` filter token | `useSearchScreenController.js` | Low |
| 4b | Align subtype naming in canonical registry | `vportTypeRegistry.js` | Medium |

### Phase 5 — Optional Structural Cleanup

Low-priority pruning of placeholder scaffolds. Defer indefinitely unless actively blocking.

---

## 6. Dependency Map

```
Phase 1 (runtime safety)
  ├── 1a: /chat/new fix ── no dependencies
  ├── 1b: service reviews fix ── no dependencies
  └── 1c: initialReviewTab fix ── no dependencies
  ALL THREE must pass validation before Phase 2 starts.

Phase 2 (consolidation)
  ├── 2a: migrate imports ── depends on Phase 1 verified
  └── 2b: delete legacy file ── depends on 2a verified
  Must complete before Phase 3 starts.

Phase 3 (cleanup)
  ├── 3a: delete review DALs ── depends on 1b verified + grep re-check
  └── 3b: delete orphans ── independent (can run anytime after Phase 1)

Phase 4 (naming)
  ├── 4a: Voxs fix ── independent
  └── 4b: subtype alignment ── depends on 2a (canonical registry in use)
```

---

## 7. Recommended Exact Execution Order

Execute in this exact order. Do not skip steps.

| Step | Action | Verify Before Next |
|------|--------|-------------------|
| 1 | Create `NewConversationScreen.jsx` wrapper in `chat/start/screens/` | — |
| 2 | Export `NewConversationScreen` from `chat/index.js` | — |
| 3 | Verify `/chat/new` loads without crash | Must pass |
| 4 | Fix `VportServiceReviews.controller.js` line 52: pass `{ limit }` object, consume `result.reviews` | — |
| 5 | Verify service review tab shows correct results with correct limit | Must pass |
| 6 | Add `initialReviewTab` + `onConsumedInitialTab` to `review/VportReviewsView.jsx` props, apply on mount | — |
| 7 | Verify review deep-link intent opens the correct sub-tab | Must pass |
| 8 | Update 3 import sites to use `vportTypeRegistry.js` instead of legacy file | — |
| 9 | Verify all vport types (barber, locksmith, gas station, exchange, restaurant, service) resolve correct tabs | Must pass |
| 10 | Delete `features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js` | — |
| 11 | Grep-verify zero imports on legacy review DAL files | Must show zero |
| 12 | Delete `vportReviews.read.dal.js`, `vportReviews.write.dal.js`, `vportReviewAuthors.read.dal.js` | — |
| 13 | Delete `explore/ui/index.jsx`, `notifications/screen/views/NotiViewPostScreen.jsx`, `explore/usecases/search.usecase.js`, `explore/model/search.model.js` | — |
| 14 | Fix `Voxs` → `vports` in `useSearchScreenController.js` | — |

---

## 8. Validation Checklist

Run after each phase. All must pass before proceeding.

### After Phase 1

- [ ] `/chat/new` loads without runtime crash
- [ ] `/chat/new` renders a usable new-conversation flow
- [ ] Service reviews tab on a vport profile shows reviews with correct pagination
- [ ] `ctrlListReviews` result consumed as `{ reviews, hasMore, nextCursor }`, not as raw array
- [ ] Review deep-link intent (e.g., from food menu CTA) opens the intended review sub-tab
- [ ] `onConsumedInitialTab` callback fires and resets the state

### After Phase 2

- [ ] Barber vport resolves `VPORT_BARBER_TABS`
- [ ] Locksmith vport resolves `VPORT_BARBER_TABS` (shared layout)
- [ ] Gas station vport resolves `VPORT_GAS_TABS` with gas tab first
- [ ] Exchange vport resolves `VPORT_RATES_TABS` (using `"money exchange"` key, not `"exchange"`)
- [ ] Restaurant vport resolves `VPORT_FOOD_TABS`
- [ ] Generic service vport resolves `VPORT_SERVICE_TABS`
- [ ] Legacy `getVportTabsByType.model.js` is deleted with zero remaining imports

### After Phase 3

- [ ] `grep -r "vportReviews.read.dal" src/` returns zero results
- [ ] `grep -r "vportReviews.write.dal" src/` returns zero results
- [ ] `grep -r "vportReviewAuthors.read.dal" src/` returns zero results
- [ ] `grep -r "explore/ui/index" src/` returns zero results
- [ ] `grep -r "search.usecase" src/` returns zero results
- [ ] App builds without errors
- [ ] No 404 on any active route

### After Phase 4

- [ ] Explore search filters work with consistent key naming
- [ ] No `'Voxs'` string remains in codebase

---

## 9. Files That Should NOT Be Touched First

Stable runtime foundations — do not modify until Phase 1–2 are verified:

- `main.jsx`
- `features/identity/setup.js`
- `features/hydration/setup.js`
- `features/chat/setup.js`
- `features/reviews/setup.js`
- `features/portfolio/setup.js`
- `features/feed/hooks/useFeed.js`
- `features/feed/pipeline/fetchFeedPage.pipeline.js`
- `features/profiles/kinds/vport/dal/menu/readVportPublicMenu.rpc.dal.js`

---

## 10. Suggested First Slice

**Target:** Fix `/chat/new` route/export mismatch (Step 1–3)

**Files involved:** `chat/start/screens/NewConversationScreen.jsx` (new), `chat/index.js`, `app/routes/index.jsx`

**Expected result:** `/chat/new` always resolves to a valid, working screen

**Why best first slice:** Smallest edit set, highest user impact (crash → working), fastest to validate, unblocks later chat consolidation.

---

## 11. Final Go / No-Go Recommendation

### GO NOW

| Item | Action | Risk |
|------|--------|------|
| `/chat/new` crash | Create wrapper screen + export | Low |
| Service review contract mismatch | Fix argument shape + result consumption | Low |
| Review deep-link intent dropped | Accept + apply prop in review screen | Low |

These are isolated, single-file fixes with zero blast radius. No reason to delay.

### GO AFTER PHASE 1 VERIFIED

| Item | Action | Risk |
|------|--------|------|
| Tab registry consolidation | Migrate 3 imports to canonical registry | Medium |
| Delete legacy registry | Remove after migration verified | Low |

### GO ONLY AFTER GREP VERIFICATION

| Item | Action | Gate |
|------|--------|------|
| Delete legacy review DALs | `grep` must show zero active imports | Must verify |
| Delete orphaned files | Confirm zero imports per file | Must verify |

### DO NOT DO YET

| Item | Reason |
|------|--------|
| Phase 5 structural cleanup | No user impact, wide surface, defer |
| `search.data.js` compatibility fields | Still consumed by active UI |
| Engine boot chain changes | Stable, no bugs, no reason to touch |
