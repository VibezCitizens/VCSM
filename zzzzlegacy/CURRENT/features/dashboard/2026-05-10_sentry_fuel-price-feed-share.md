# SENTRY Review — Fuel Price Feed Share
Date: 2026-05-10
Scope: apps/VCSM only
Feature: gas/publishFuelPriceUpdateAsPost

---

## Files Reviewed

### New Files

1. `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPricePost.read.dal.js`
2. `apps/VCSM/src/features/upload/adapters/posts.adapter.js`
3. `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js`

### Modified Files

4. `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/submitFuelPriceSuggestion.controller.js`
5. `apps/VCSM/src/features/profiles/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.js`
6. `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx`
7. `apps/VCSM/src/features/dashboard/vport/screens/components/VportDashboardGasPanels.jsx`
8. `apps/VCSM/src/features/profiles/kinds/vport/screens/gas/components/GasPricesPanel.jsx`
9. `apps/VCSM/src/features/profiles/kinds/vport/screens/gas/components/BulkUpdateFuelPricesModal.jsx`

---

## Contract Checks

| Check | Result |
|---|---|
| All imports use `@/...` paths | PASS |
| No `.select('*')` | PASS |
| No `console.log` | PASS |
| No `.ts` / `.tsx` files | PASS |
| All files under 300 lines | PASS (max 201 lines) |
| DAL files do not import React, models, controllers, hooks, or screens | PASS |
| Controllers do not import Supabase directly | PASS (corrected during review — `vportSchema` moved to DAL) |
| Controllers do not import React | PASS |
| Hooks do not import Supabase or DAL directly | PASS |
| Components do not call controllers directly | PASS |
| Screens do not import DAL or Supabase | PASS |
| Cross-feature access goes through adapter | PASS (`posts.adapter.js` is the boundary) |
| No relative `../../` imports | PASS |
| Build order: DAL → Controller → Hook → Component → Screen | PASS |
| Controller fan-out (max 5 collaborators) | PASS (3 collaborators in publish controller) |
| No engine changes | PASS |
| No Wentrex/Traffic references | PASS |
| Boundary contract: apps/VCSM only | PASS |

---

## File-by-File Review

### 1. `vportFuelPricePost.read.dal.js` — ALIGNED

- Layer: DAL
- Purpose: dedup check on `vc.posts` + station name lookup from `vport.profiles`
- Imports: `supabase`, `vportSchema` (both Supabase clients — valid for DAL layer)
- Explicit column selections: `"id"` and `"name"` — no star selects
- No business logic, no auth logic, no React
- Returns raw DB values only

### 2. `posts.adapter.js` — ALIGNED (with note)

- Layer: Adapter (cross-feature boundary)
- Purpose: programmatic post insertion for system-generated posts
- Imports: `supabase` (for `auth.getUser()`), `insertPost` (same-feature DAL)
- NOTE: `supabase.auth.getUser()` in an adapter is slightly unusual — auth lookup is typically a DAL concern. However, this is acceptable here because:
  - The adapter is the cross-feature boundary that must encapsulate auth + insert atomically
  - The gas controller has no business knowing about auth user IDs
  - The existing `postAuthRollback.dal.js` pattern uses the same auth call
  - The alternative (passing `userId` from the controller) would leak auth responsibility upward
- VERDICT: Acceptable — not a DAL contract violation since adapters are boundary coordinators, not pure DAL files

### 3. `publishFuelPriceUpdateAsPost.controller.js` — ALIGNED

- Layer: Controller
- Purpose: dedup check, station name resolution, post creation orchestration
- Imports: gas DAL functions, upload adapter — no Supabase directly
- No React, no UI state
- Fan-out: 3 collaborators (hasRecentFuelPricePostDAL, resolveVportStationNameDAL, createSystemPost) — within §4.3 limit of 5
- Cross-feature access via `posts.adapter.js` — correct pattern
- Returns domain result `{ published, reason?, postId? }` — not raw DB rows

### 4. `submitFuelPriceSuggestion.controller.js` — ALIGNED

- Gap fix: added `createVportFuelPriceHistoryDAL` call on the owner direct-update path
- Same-feature DAL import — no boundary violation
- Owner identity check preserved (`actorId !== targetActorId → not_owner`)
- History write follows upsert, throws on error — consistent with review controller pattern

### 5. `useSubmitFuelPriceSuggestion.js` — ALIGNED

- Layer: Hook
- Added `publishFeedPost` callback via `useCallback`
- Calls `publishFuelPriceUpdateAsPostController` — controller call from hook is correct pattern
- Owner guard: `if (!isOwner || !me?.actorId)` — hook enforces intent, not business logic
- No DAL imports, no Supabase access

### 6. `VportDashboardGasScreen.jsx` — ALIGNED

- Layer: Screen (Final Screen role — route + identity gate only)
- Added `publishFeedPost` to hook destructure
- Passes `onShareToFeed={publishFeedPost}` to panel — prop threading only
- No business logic added

### 7. `VportDashboardGasPanels.jsx` — ALIGNED

- Layer: Component
- Added `onShareToFeed = null` prop
- Passes it to `GasPricesPanel` — prop threading only
- No logic, no state

### 8. `GasPricesPanel.jsx` — ALIGNED

- Layer: Component
- Added `onShareToFeed = null` prop
- Passes `canShareToFeed={allowOwnerUpdate}` and `onShareToFeed={onShareToFeed}` to modal
- `allowOwnerUpdate` is the correct gate: it's already the flag that controls owner-specific UI in this panel

### 9. `BulkUpdateFuelPricesModal.jsx` — ALIGNED

- Layer: Component
- Added `shareToFeed` local state, `canShareToFeed` and `onShareToFeed` props
- Checkbox resets to `false` on every open via the existing `useEffect([open])`
- `updatedFuels` array accumulates `res.official` data from each successful owner update
- Feed share call is wrapped in `try/catch` — post failure never blocks modal close
- Guard: `shareToFeed && onShareToFeed && updatedFuels.length > 0` — all three required

---

## Issues Found and Resolved During Review

| Issue | Severity | Resolution |
|---|---|---|
| Controller imported `vportSchema` directly — DAL concern in controller layer | MAJOR | Moved station name DAL query (`resolveVportStationNameDAL`) into `vportFuelPricePost.read.dal.js`; controller removed the direct import |
| Duplicate `const` declarations introduced during edit | SYNTAX | Controller rewritten cleanly |

---

## Deferred Items (Not Regressions)

| Item | Reason Deferred |
|---|---|
| Review/approval path feed share (`reviewFuelPriceSuggestionController`) | Phase 2 scope — intentionally excluded from this slice |
| `vc.posts` index on `(actor_id, post_type, created_at DESC)` for dedup query | DB change requires explicit approval — dedup window is 1hr, low traffic, not a perf risk at current scale |
| Toast/notification on feed share success | No app-wide toast system exists; would require introducing one — deferred |
| `actor_privacy_settings` for vport actors | Pre-existing DB state concern — needs DB verification outside this code change |

---

## SENTRY Status: ALIGNED

All 9 files comply with the VCSM Architecture Contract after the in-review correction.

No drift remains in the final committed state.
