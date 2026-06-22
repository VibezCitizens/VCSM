# SENTRY Review — Menu Update Feed Share
Date: 2026-05-10
Scope: apps/VCSM only
Feature: menu/publishMenuUpdateAsPost

---

## Files Reviewed

### New Files

1. `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/vportMenuPost.read.dal.js`
2. `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js`
3. `apps/VCSM/src/features/profiles/kinds/vport/hooks/menu/usePublishMenuPost.js`

### Modified Files

4. `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManagePanel.jsx`
5. `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManageModals.jsx`
6. `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal.jsx`
7. `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryFormModal.jsx`
8. `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryFormBody.jsx`

---

## Contract Checks

| Check | Result |
|---|---|
| All imports use `@/...` paths | PASS |
| No `.select('*')` | PASS |
| No `console.log` | PASS |
| No `.ts` / `.tsx` files | PASS |
| All files under 300 lines | PASS (max 180 lines) |
| DAL files do not import React, models, controllers, hooks, or screens | PASS |
| Controllers do not import Supabase directly | PASS |
| Controllers do not import React | PASS |
| Hooks do not import Supabase or DAL directly | PASS (hook imports controller only) |
| Components do not call controllers directly | PASS |
| Screens do not import DAL or Supabase | PASS |
| Cross-feature access goes through adapter | PASS (`posts.adapter.js` is the boundary) |
| No relative `../../` imports | PASS |
| Build order: DAL → Controller → Hook → Component | PASS |
| Controller fan-out (max 5 collaborators) | PASS (3 collaborators: 2 DAL fns + 1 adapter) |
| No engine changes | PASS |
| No Wentrex/Traffic references | PASS |
| Boundary contract: apps/VCSM only | PASS |

---

## File-by-File Review

### 1. `vportMenuPost.read.dal.js` — ALIGNED

- Layer: DAL
- Purpose: dedup check on `vc.posts` + restaurant name lookup from `vport.profiles`
- Imports: `supabase`, `vportSchema` (both Supabase clients — valid for DAL layer)
- Explicit column selections: `"id"` and `"name"` — no star selects
- No business logic, no auth logic, no React
- Returns raw DB values only
- Mirrors fuel price DAL structure exactly — consistent pattern

### 2. `publishMenuUpdateAsPost.controller.js` — ALIGNED

- Layer: Controller
- Purpose: dedup check, restaurant name resolution, post text construction, post creation
- Imports: menu DAL functions (same-feature), upload adapter (cross-feature boundary) — no Supabase directly
- No React, no UI state
- Fan-out: 3 collaborators (`hasRecentMenuUpdatePostDAL`, `resolveVportRestaurantNameDAL`, `createSystemPost`) — within §4.3 limit of 5
- Cross-feature access via `posts.adapter.js` — correct pattern
- Returns domain result `{ published, reason?, postId? }` — not raw DB rows
- `buildPostText` helper handles 4 cases: item/category × added/updated — pure function, no side effects

### 3. `usePublishMenuPost.js` — ALIGNED

- Layer: Hook
- Purpose: thin wrapper exposing `publishMenuPost` callback from controller
- Imports: `useCallback` from React, controller — no DAL, no Supabase
- Guards with `!actorId` early return before calling controller
- Returns `{ publishMenuPost }` — minimal surface area

### 4. `VportActorMenuManagePanel.jsx` — ALIGNED

- Layer: Component (panel/orchestrator role within screens/menu/components/)
- Added `usePublishMenuPost({ actorId })` — hook call from component is correct pattern
- Passes `onShareToFeed={publishMenuPost}` to `VportActorMenuManageModals` — prop threading only
- No business logic added

### 5. `VportActorMenuManageModals.jsx` — ALIGNED

- Layer: Component (modal coordinator)
- Added `onShareToFeed = null` prop to destructure
- Forwards `onShareToFeed` to both `VportActorMenuCategoryFormModal` and `VportActorMenuItemFormModal` — prop threading only
- No logic, no state

### 6. `VportActorMenuItemFormModal.jsx` — ALIGNED

- Layer: Component
- Added `canShareToFeed = false`, `onShareToFeed = null` props
- Added `shareToFeed` state with reset in `useEffect([open])` — correct reset pattern
- `wrappedOnSave` intercepts after `onSave` resolves; only then attempts share in try/catch
- Feed share failure never surfaces as an error — non-blocking contract maintained
- Category name resolution uses the `categories` prop already available in scope (no DAL import)
- `onSave: wrappedOnSave` passed to `useMenuItemForm` — the hook sees the wrapper, not the original; this is safe because the wrapper calls the original first and propagates throws correctly
- Checkbox only rendered when `onShareToFeed` is non-null — no owner-check duplication needed; panel-level wiring provides the same gate as `allowOwnerUpdate` in gas panel

### 7. `VportActorMenuCategoryFormModal.jsx` — ALIGNED

- Layer: Component
- Added `onShareToFeed = null` prop and `shareToFeed` state
- `shareToFeed` reset added to existing `useEffect([open, category])` — correct
- Share call in `handleSubmit` after `await onSave(payload)` succeeds, before `handleClose()` — consistent with gas price modal pattern
- Share failure in nested try/catch — non-blocking, category save already committed at that point
- `showShareToFeed`, `shareToFeed`, `setShareToFeed` forwarded to `VportActorMenuCategoryFormBody` via props — correct delegation

### 8. `VportActorMenuCategoryFormBody.jsx` — ALIGNED

- Layer: Component
- Added three optional props: `showShareToFeed = false`, `shareToFeed = false`, `setShareToFeed = null`
- Checkbox only rendered when `showShareToFeed && setShareToFeed` — double guard prevents orphaned UI
- No logic change to existing fields or action buttons
- Additive change only — no regressions to existing call sites that don't pass share props

---

## Issues Found

None. No corrections required during review.

---

## Deferred Items (Not Regressions)

| Item | Reason Deferred |
|---|---|
| `actor_privacy_settings` rows for vport actors | Pre-existing DB state concern — needs DB verification before feature release; same as fuel price deferred item |
| `vc.posts` index on `(actor_id, post_type, created_at DESC)` for menu dedup query | Same deferred DB optimization as fuel price feature |
| Toast/notification on feed share success | No app-wide toast system; deferred for both fuel price and menu |
| `post_type = 'menu_update'` feed filtering audit | Verify no existing feed filters inadvertently suppress `menu_update` posts |

---

## SENTRY Status: ALIGNED

All 8 files comply with the VCSM Architecture Contract.

No drift in the final committed state.
