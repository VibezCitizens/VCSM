# Settings Screen Phase 1 Cleanup — Execution Summary

## Date: 2026-04-12
## Source: 12-22.md audit, Architecture Violations #1 and #2

---

## Fix 1 — Direct Supabase query in Profile.controller.core.js

**Problem:** `saveProfileCore()` contained inline `supabase.schema('vc').from('actors').select('id')...` queries (lines 56-59), violating the DAL -> Controller layer order.

**Changes:**
- **Created:** `apps/VCSM/src/features/settings/profile/dal/actorIdBySubject.read.dal.js`
  - `dalReadActorIdByProfileId(profileId)` — resolves actor ID from profile_id + kind=user
  - `dalReadActorIdByVportId(vportId)` — resolves actor ID from vport_id + kind=vport
- **Updated:** `apps/VCSM/src/features/settings/profile/controller/Profile.controller.core.js`
  - Removed `import { supabase }` from controller
  - Replaced inline queries with DAL function calls
  - Behavior preserved exactly (same queries, same null coalescing)

## Fix 2 — Cross-feature DAL import in useVportsList

**Problem:** `useVportsList` imported `listMyVports` from `@/features/vport/dal/vport.read.vportRecords.dal` — a cross-feature boundary violation.

**Changes:**
- **Updated:** `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js`
  - Added `listMyVportsDAL()` function that replicates the exact same query and return shape as the cross-feature `listMyVports` (queries `vc.vports` with actor join, returns full detail including slug, banner_url, bio, is_active)
  - Existing `readMyVports()` function untouched
- **Updated:** `apps/VCSM/src/features/settings/vports/hooks/useVportsList.js`
  - Changed import from `@/features/vport/dal/...` to local `@/features/settings/vports/dal/vports.read.dal`
  - Updated function call from `listMyVports()` to `listMyVportsDAL()`
  - No other changes to hook logic

## Verification Notes

- Both fixes are behavior-preserving (same queries, same return shapes)
- No UI changes
- No cross-feature imports remain in the changed files
- Controller no longer imports supabase directly
- Layer order maintained: DAL -> Controller (Fix 1), DAL -> Hook (Fix 2)
