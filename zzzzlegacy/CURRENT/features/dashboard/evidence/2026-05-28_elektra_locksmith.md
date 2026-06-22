# ELEKTRA — Locksmith Module Precision Scan
**Date:** 2026-05-28  
**Agent:** ELEKTRA  
**Scope:** apps/VCSM — locksmith VPORT module  
**Files scanned:**
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/locksmith/useLocksmithOwner.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/locksmith/usePublishLocksmithPost.js`

---

## Summary

| ID | Title | Severity | Status |
|---|---|---|---|
| ELEK-2026-05-28-020 | `ctrlAddServiceArea` / `ctrlSaveServiceDetail` inject actor_id without `actor_owners` verification | HIGH | Open |
| ELEK-2026-05-28-021 | `useLocksmithOwner` calls `ctrlSavePortfolioDetail` with wrong arity — actorId silently omitted | HIGH | Open |
| ELEK-2026-05-28-022 | `locksmithPortfolioDetails` write DAL has no `actor_id` column — ownership check in controller uses profile_id not actor_owners | MEDIUM | Open |
| ELEK-2026-05-28-023 | `dalUpsertLocksmithServiceArea` is exported but never called via ownership-verified path; allows arbitrary actor_id injection | MEDIUM | Open |

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-020  
**Title:** Service area and service detail write paths trust client-supplied `actorId` — no `actor_owners` verification  
**Category:** Broken Object-Level Authorization (BOLA)  
**Severity:** HIGH  
**Status:** Open  
**Scope:** VCSM  
**Location:**
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js:23-44` (`ctrlAddServiceArea`)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js:73-95` (`ctrlSaveServiceDetail`)

**Source:** `actorId` parameter received from hook caller (UI layer)

**Sink:**
- `dalInsertLocksmithServiceArea({ actor_id: actorId, ... })` — writes directly to `locksmith_service_areas` with the caller-supplied actorId
- `dalUpsertLocksmithServiceDetail({ actor_id: actorId, ... })` — writes to `locksmith_service_details`

**Trust Boundary:** The `actorId` parameter is passed from `useLocksmithOwner` (hook layer) which receives it from component props. No ownership assertion via `assertActorOwnsVportActorController` or `actor_owners` table lookup occurs anywhere in the controller before writing.

**Impact:** Any authenticated actor who can call `ctrlAddServiceArea(victimActorId, area)` can insert service area records attributed to a VPORT they do not own. The locksmith_service_areas and locksmith_service_details tables would contain rows with a fraudulent `actor_id`, affecting the victim's locksmith profile data visible to customers.

**Evidence:**
```js
// locksmithOwner.controller.js:23-44
export async function ctrlAddServiceArea(actorId, area) {
  if (!actorId) throw new Error('[Locksmith] actorId required')
  return dalInsertLocksmithServiceArea({
    actor_id: actorId,   // <-- actorId injected from parameter, never verified as owned
    area_type: area.areaType ?? 'city',
    ...
  })
}

// locksmithOwner.controller.js:73-95
export async function ctrlSaveServiceDetail(actorId, serviceId, detail) {
  if (!actorId || !serviceId) throw new Error('[Locksmith] actorId and serviceId required')
  return dalUpsertLocksmithServiceDetail({
    service_id: serviceId,
    actor_id: actorId,   // <-- injected, never verified
    ...
  })
}
```

**Reproduction:**
1. Actor A (attacker) is authenticated with their own actorId.
2. Actor A obtains the actorId of Actor B's locksmith VPORT (publicly visible in profiles).
3. Actor A calls `ctrlAddServiceArea(victimActorId, { areaType: 'city', label: 'Fake City', ... })`.
4. The controller passes the check `if (!actorId)` and calls `dalInsertLocksmithServiceArea` with `actor_id = victimActorId`.
5. A row is inserted in `locksmith_service_areas` attributed to Actor B.

**Existing Defense:** DAL-level filter `actor_id = actorId` on update/delete operations. This prevents Actor A from updating or deleting Actor B's existing rows — but does not prevent inserting new rows attributed to Actor B.

**Why Insufficient:** Insert operations (`dalInsertLocksmithServiceArea`) accept any `actor_id` value with no prior ownership check. The controller layer contains only a null-guard, not an identity assertion. RLS policies may or may not enforce this at the DB layer (not confirmed in this scan).

**Recommended Fix:** Add `assertActorOwnsVportActorController` call at the top of both `ctrlAddServiceArea` and `ctrlSaveServiceDetail`, passing `identityActorId` (user-kind actor) and `actorId` (target vport actor). The hook must be updated to supply both parameters.

**Suggested Patch:**
```js
// locksmithOwner.controller.js — add import at top
import { assertActorOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'

// ctrlAddServiceArea — add ownership assertion before write
export async function ctrlAddServiceArea(identityActorId, actorId, area) {
  if (!identityActorId) throw new Error('[Locksmith] identityActorId required')
  if (!actorId) throw new Error('[Locksmith] actorId required')
  await assertActorOwnsVportActorController({
    requestActorId: identityActorId,
    targetActorId: actorId,
  })
  return dalInsertLocksmithServiceArea({ actor_id: actorId, ... })
}

// useLocksmithOwner.js — supply identityActorId from useIdentity
// const { identity } = useIdentity()
// const identityActorId = identity?.kind === 'user' ? identity.actorId : availableActors?.find(...)?.actorId
// addArea = (area) => wrap(() => ctrlAddServiceArea(identityActorId, actorId, area))
```

**Follow-up Command:** SPIDER-MAN regression test coverage required. VENOM re-verification after patch.

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-021  
**Title:** `useLocksmithOwner.savePortfolioDetail` calls `ctrlSavePortfolioDetail` with wrong arity — `actorId` silently dropped  
**Category:** Broken Object-Level Authorization — Parameter Mismatch  
**Severity:** HIGH  
**Status:** Open  
**Scope:** VCSM  
**Location:**
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/locksmith/useLocksmithOwner.js:41`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js:105`

**Source:** `actorId` (hook state, comes from component props) + `portfolioItemId` (caller-supplied)

**Sink:** `dalUpsertLocksmithPortfolioDetail` via `ctrlSavePortfolioDetail`

**Trust Boundary:** The ownership check in `ctrlSavePortfolioDetail` uses `actorId` to resolve `callerProfileId` from the `profiles` table, then compares against the portfolio item's `profile_id`. If `actorId` is undefined (silently dropped), the lookup returns null and the check at line 119 throws. However the arity mismatch means the function is called as `ctrlSavePortfolioDetail(portfolioItemId, detail)` — `actorId` gets `portfolioItemId` and `portfolioItemId` gets `detail`.

**Impact:** The ownership check in `ctrlSavePortfolioDetail` receives `portfolioItemId` as `actorId` and `detail` as `portfolioItemId`. The profile lookup `vport.from('profiles').select('id').eq('actor_id', actorId)` fires with the portfolio item UUID as the `actor_id`. This either returns null (profile not found → throws before write → the call is blocked) OR if a profile happened to have that UUID as actor_id (extremely unlikely but theoretically possible), the ownership comparison passes against the wrong identity. The net effect is that `savePortfolioDetail` from the hook is broken — it will always throw, meaning the portfolio detail write feature is non-functional via this hook path.

**Evidence:**
```js
// useLocksmithOwner.js:41 — WRONG: (portfolioItemId, detail), missing actorId as first arg
const savePortfolioDetail = useCallback(
  (portfolioItemId, detail) => wrap(() => ctrlSavePortfolioDetail(portfolioItemId, detail)),
  [wrap]
)

// locksmithOwner.controller.js:105 — expects (actorId, portfolioItemId, detail)
export async function ctrlSavePortfolioDetail(actorId, portfolioItemId, detail) {
  if (!actorId || !portfolioItemId) throw new Error('[Locksmith] actorId and portfolioItemId required')
  ...
  vport.from('profiles').select('id').eq('actor_id', actorId)  // actorId = portfolioItemId value
```

**Reproduction:**
1. Dashboard calls `savePortfolioDetail(somePortfolioItemId, detailObj)` via the hook.
2. Hook calls `ctrlSavePortfolioDetail(somePortfolioItemId, detailObj)` — `actorId` = `somePortfolioItemId`, `portfolioItemId` = `detailObj` (an object).
3. `dalUpsertLocksmithPortfolioDetail` receives `portfolioItemId = detailObj` (object, not UUID).
4. If the `portfolio_items` lookup with `portfolio_item_id = [object Object]` returns null → `itemProfileId` is null → controller throws "portfolio item or profile not found".
5. Portfolio detail save is permanently broken via hook.

**Existing Defense:** The ownership check in `ctrlSavePortfolioDetail` would incidentally block the write in most scenarios due to null returns.

**Why Insufficient:** Incidental defense through broken state is not a security control. The arity mismatch must be fixed to restore the intended ownership check. As written, a direct call to `ctrlSavePortfolioDetail` with correct args bypasses the hook entirely, and the hook itself is non-functional.

**Recommended Fix:** Fix the hook to pass `actorId` as the first argument:
```js
const savePortfolioDetail = useCallback(
  (portfolioItemId, detail) => wrap(() => ctrlSavePortfolioDetail(actorId, portfolioItemId, detail)),
  [actorId, wrap]
)
```

**Follow-up Command:** SPIDER-MAN — add regression test for `useLocksmithOwner.savePortfolioDetail` arity.

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-022  
**Title:** Portfolio detail ownership check uses `profile_id` comparison, not `actor_owners` — bypasses canonical ownership model  
**Category:** Broken Object-Level Authorization — Non-canonical ownership check  
**Severity:** MEDIUM  
**Status:** Open  
**Scope:** VCSM  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js:111-120`

**Source:** `actorId` + `portfolioItemId`

**Sink:** `dalUpsertLocksmithPortfolioDetail`

**Trust Boundary:** `ctrlSavePortfolioDetail` resolves ownership by comparing `profiles.id` (callerProfileId) against `portfolio_items.profile_id` (itemProfileId). This is not the canonical VCSM ownership model. The canonical model is `actor_owners` table. The `profiles` table `profile_id` can diverge from `actor_owners` ownership in delegation scenarios (e.g., if a user has multiple owner links).

**Impact:** An actor who has a profile in the `profiles` table linked to the same `profile_id` as a portfolio item but who does not actually own the VPORT via `actor_owners` could write portfolio detail for a portfolio item they do not own. The security guarantee is only as strong as the `profiles.profile_id` binding, which is weaker than `actor_owners`.

**Evidence:**
```js
// locksmithOwner.controller.js:111-120
const [{ data: profileRow, error: profileErr }, { data: itemRow, error: itemErr }] = await Promise.all([
  vport.from('profiles').select('id').eq('actor_id', actorId).maybeSingle(),
  vport.from('portfolio_items').select('profile_id').eq('id', portfolioItemId).maybeSingle(),
])
...
if (callerProfileId !== itemProfileId) throw new Error('[Locksmith] not authorized to save portfolio detail for this item')
```

**Reproduction:** Requires a scenario where a user's actorId maps to a profile with the same `profile_id` as a portfolio item belonging to a different VPORT. Edge case but architecturally inconsistent with canonical ownership.

**Existing Defense:** Profile ID comparison does provide a binding check. In the common case (one user, one profile), this is correct.

**Why Insufficient:** VCSM's canonical ownership model is `actor_owners`. Using `profile_id` comparison creates a shadow ownership model that may diverge under multi-actor or delegation scenarios. The BW-PORT-004 finding identified this pattern as a false remediation.

**Recommended Fix:** Replace the `profile_id` comparison with `assertActorOwnsVportActorController`. The portfolio item's owning VPORT's actorId must be resolved first, then the assertion runs against `actor_owners`.

**Suggested Patch:**
```js
// Replace the parallel profile/item lookup and profile_id comparison with:
import { assertActorOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'

// Resolve the portfolio item's vport actorId (via portfolio_items → profiles → actor_id)
const { data: itemRow } = await vport.from('portfolio_items')
  .select('profile_id, profile:profiles!profile_id(actor_id)')
  .eq('id', portfolioItemId)
  .maybeSingle()
if (!itemRow) throw new Error('[Locksmith] portfolio item not found')
const vportActorId = itemRow.profile?.actor_id ?? null
if (!vportActorId) throw new Error('[Locksmith] portfolio item has no owning actor')

await assertActorOwnsVportActorController({
  requestActorId: actorId,   // user-kind actor (identityActorId)
  targetActorId: vportActorId,
})
```

**Follow-up Command:** PORTFOLIO module ELEKTRA scan (cross-reference BW-PORT-004). SPIDER-MAN regression coverage.

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-023  
**Title:** `dalUpsertLocksmithServiceArea` exported but not used in ownership-verified controller — creates unauthorized upsert surface  
**Category:** Unused / Orphaned Write Surface  
**Severity:** MEDIUM  
**Status:** Open  
**Scope:** VCSM  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.write.dal.js:14-24`

**Source:** `dalUpsertLocksmithServiceArea` is exported from the write DAL

**Sink:** `locksmith_service_areas` upsert with `onConflict: 'id'`

**Trust Boundary:** The export makes this function available for direct import by any controller or module in the codebase. No caller in the ownership-verified controller (`locksmithOwner.controller.js`) uses it — only `dalInsertLocksmithServiceArea` and `dalUpdateLocksmithServiceArea` are called. The upsert function bypasses the insert/update separation that exists for safety.

**Impact:** Any future developer or an existing import they are unaware of can call `dalUpsertLocksmithServiceArea` directly with an arbitrary `actor_id`, overwriting existing service area records for any actor. The upsert uses `onConflict: 'id'` — if an attacker supplies a known area ID with a different `actor_id`, the `actor_id` column can be overwritten (depending on DB constraints).

**Evidence:**
```js
// locksmithServiceAreas.write.dal.js:14-24
export async function dalUpsertLocksmithServiceArea(row) {
  if (!row?.actor_id) throw new Error('actor_id required')
  const { data, error } = await vportSchema
    .from('locksmith_service_areas')
    .upsert(row, { onConflict: 'id' })  // <-- onConflict on 'id' only, actor_id can change on conflict
    .select(RETURN_COLUMNS)
  ...
}
```

**Reproduction:** Direct module import of `dalUpsertLocksmithServiceArea` from any controller with an arbitrary `actor_id` value would allow `actor_id` reassignment on an existing row if `id` matches.

**Existing Defense:** No current controller in the ownership-verified path calls this function. The null-guard `if (!row?.actor_id)` is minimal.

**Why Insufficient:** An orphaned export with upsert semantics is a latent attack surface. The `onConflict: 'id'` constraint does not prevent `actor_id` from being updated on conflict.

**Recommended Fix:** Either (a) remove `dalUpsertLocksmithServiceArea` if it has no legitimate caller, or (b) add `onConflict: 'id,actor_id'` constraint (requiring both match) and document the intended caller. If kept, the upsert should also have an `actor_id` filter in the `.match()` clause to prevent cross-actor overwrites.

**Follow-up Command:** Grep all imports of `dalUpsertLocksmithServiceArea` across `apps/VCSM/src/` to confirm zero callers, then remove.

---

## Non-Findings

### Publish-as-post controllers (hours, portfolio, service area)
All three publish controllers (`publishLocksmithHoursUpdateAsPost`, `publishLocksmithPortfolioUpdateAsPost`, `publishLocksmithServiceAreaUpdateAsPost`) correctly call `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })` before any write. The locksmith hours and portfolio controllers sanitize all input fields. The `usePublishLocksmithPost` hook correctly resolves `identityActorId` from the user-kind actor via `useIdentity`. No finding on publish paths.

### Delete and update paths for service areas
`dalDeleteLocksmithServiceArea` and `dalUpdateLocksmithServiceArea` both require `actor_id` as a WHERE clause filter — an actor cannot delete or update another actor's rows via these DAL calls. Correct.

### Portfolio detail ownership check — functional correctness  
The `ctrlSavePortfolioDetail` controller does perform a two-table ownership check (ELEK-2026-05-28-022 notes the model mismatch). However, the check does prevent the most common cross-actor write scenario. The issue is architectural non-conformance, not a complete bypass.

---

## Verdict

**2H / 2M / 0L**  
THOR release gate: **BLOCKED** on ELEK-2026-05-28-020 (service area and service detail writes have no `actor_owners` verification) and ELEK-2026-05-28-021 (hook arity bug makes portfolio detail save non-functional and ownership check unreachable).
