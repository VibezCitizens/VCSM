# ELEKTRA Precision Security Report — Portfolio Module

**Date:** 2026-05-28  
**Scanner:** ELEKTRA  
**Module:** portfolio  
**App:** apps/VCSM  
**Finding range:** ELEK-2026-05-28-040 – ELEK-2026-05-28-044  
**Prior BLACKWIDOW finding confirmed:** BW-PORT-004 (CRITICAL)

---

## Scan Scope

Write paths covered:
- `createItem` / `updateItem` / `deleteItem` (portfolio engine)
- `addMedia` / `removeMedia` (portfolio engine)
- `ctrlSavePortfolioDetail` (locksmith sub-detail write)
- `addPortfolioMediaWithRecord` + `updatePortfolioMediaAssetIdDAL`
- `usePortfolioItemSubmit` (UI submit hook — the caller surface)

Read paths: not in scope (read-only; no ownership write risk).

---

## Summary

| ID | Severity | Title | Status |
|---|---|---|---|
| ELEK-2026-05-28-040 | MEDIUM | `ctrlSavePortfolioDetail` — profile-ID cross-check is correct logic but wrong ownership model | OPEN |
| ELEK-2026-05-28-041 | LOW | `updatePortfolioMediaAssetIdDAL` — `callerProfileId` is sourced from engine return value, not server-resolved from actorId | OPEN |
| ELEK-2026-05-28-042 | INFO | Engine `isActorOwner` injection: correct pattern but depends on client-side Supabase session | INFO |
| ELEK-2026-05-28-043 | INFO | `updateItem` / `deleteItem` — profile_id cross-check executes before `isActorOwner` — order gap | INFO |
| ELEK-2026-05-28-044 | INFO | Media upload actorId flows from hook prop, not session — no server-side re-validation in engine | INFO |

---

## Finding Detail

---

### ELEK-2026-05-28-040

**Severity:** MEDIUM  
**Title:** `ctrlSavePortfolioDetail` — profile_id cross-check uses server-fetched values (BW-PORT-004 confirmed remediated), but ownership model remains non-canonical  
**Prior finding status:** BW-PORT-004 (CRITICAL) described "both sides attacker-controlled." ELEKTRA confirms this was a false assessment of the original code, which has since been patched. The current code is analyzed here.

**Current code (post-patch):**

```
// locksmithOwner.controller.js:111–120
const [{ data: profileRow, error: profileErr }, { data: itemRow, error: itemErr }] = await Promise.all([
  vport.from('profiles').select('id').eq('actor_id', actorId).maybeSingle(),
  vport.from('portfolio_items').select('profile_id').eq('id', portfolioItemId).maybeSingle(),
])
const callerProfileId = profileRow?.id ?? null
const itemProfileId = itemRow?.profile_id ?? null
if (callerProfileId !== itemProfileId) throw new Error('[Locksmith] not authorized ...')
```

**Chain analysis:**

- Source: `actorId` is supplied by the caller (from the UI hook `usePortfolioItemSubmit`). It is not independently re-resolved from the authenticated session inside this controller.
- Trust boundary: The ownership check queries the DB for `profiles.id WHERE actor_id = actorId` and `portfolio_items.profile_id WHERE id = portfolioItemId`. Both server-side lookups mean neither `callerProfileId` nor `itemProfileId` is directly injected by the attacker.
- Gap: `actorId` itself (the lookup key) is still caller-supplied. An authenticated user who holds a valid session for actor A but supplies actor B's `actorId` will have the lookup return actor B's `profileId`. If actor B does not own `portfolioItemId`, the check catches it. However if the attacker supplies (actorId=B, portfolioItemId=B_item), the check passes even though the authenticated user is not actor B.
- The canonical VCSM ownership model requires verifying `actor_owners(actorId) WHERE user_id = auth.uid()`. This controller does not call `assertActorOwnsVportActorController` or query `actor_owners`. It uses profile_id cross-matching as a proxy, which is DB-correct for the supplied `actorId` but has no binding to the authenticated session.
- RLS status: The DB comment (`PORT-V-004`) suggests RLS is the downstream gate. The Supabase `vportClient` enforces RLS using the authenticated JWT. An attacker authenticated as user A cannot supply actor B's `actorId` and have the profile lookup resolve to actor B's profile if the RLS policy on `profiles` restricts reads to the caller's own rows. However if `profiles` is publicly readable (common for vport profiles), the lookup will resolve and the ownership check can be bypassed.

**Impact:** An authenticated user who knows another VPORT's `actorId` and one of its `portfolioItemId` values can attach their locksmith-specific sub-detail to another actor's portfolio item, potentially corrupting that item's data.

**Missing defense:** `actorId` is never verified as "owned by the currently authenticated user" inside `ctrlSavePortfolioDetail`. Only `actor_owners` provides this guarantee.

**Proposed patch (text only — do not apply):**

```js
// At the top of ctrlSavePortfolioDetail, before the profile lookup:
import { assertActorOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'

// Then replace the current ownership check with:
await assertActorOwnsVportActorController({
  requestActorId: callerIdentityActorId, // must be passed as a new param from the session
  targetActorId: actorId,
})
// Then keep the itemProfileId cross-check as defense-in-depth only
```

The caller `usePortfolioItemSubmit` already has `identityActorId` derived from the session. It should be passed as a new parameter through `ctrlSavePortfolioDetail(actorId, portfolioItemId, detail, identityActorId)`.

---

### ELEK-2026-05-28-041

**Severity:** LOW  
**Title:** `updatePortfolioMediaAssetIdDAL` — `callerProfileId` sourced from engine return value `portfolioMedia.profileId`, not independently server-resolved from `actorId`

**Chain:**

```
usePortfolioItemSubmit (hook) →
  addPortfolioMediaWithRecord (controller) →
    addMedia (engine) → returns PortfolioMediaModel →
    updatePortfolioMediaAssetIdDAL({ callerProfileId: portfolioMedia.profileId })
```

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller.js:70`

```js
callerProfileId: portfolioMedia.profileId ?? portfolioMedia.profile_id,
```

**Analysis:** `portfolioMedia` is the return value from the engine's `addMedia()`, which resolves `callerProfileId` via `dalGetProfileIdByActorId({ actorId })` server-side. This is correct — the profileId is server-resolved, not caller-injected. However the pattern is fragile: the `callerProfileId` used to scope the subsequent UPDATE is derived from the result of the prior INSERT, not independently re-fetched. A race condition (though extremely unlikely in this context) or model mapping error (`portfolioMedia.profileId` being null/undefined) would cause the guard to become `undefined`, which depending on the DAL implementation could bypass the `.eq('profile_id', callerProfileId)` filter by passing `undefined` to the Supabase JS client.

**DAL:**
```js
// portfolioMediaRecord.write.dal.js:12–16
const { error } = await vport
  .from('portfolio_media')
  .update({ media_asset_id: mediaAssetId })
  .eq('id', portfolioMediaId)
  .eq('profile_id', callerProfileId)  // if undefined: Supabase JS drops this filter
```

**Impact:** If `callerProfileId` resolves to `null` or `undefined`, the UPDATE's ownership scope is dropped silently, allowing the media_asset_id to be written to any portfolioMedia row by id.

**Proposed patch (text only — do not apply):**

```js
// In updatePortfolioMediaAssetIdDAL, add:
if (!callerProfileId) throw new Error('updatePortfolioMediaAssetIdDAL: callerProfileId required')
```

---

### ELEK-2026-05-28-042

**Severity:** INFO  
**Title:** Engine `isActorOwner` injection is correct pattern; dependency on Supabase client session is expected behavior

**File:** `apps/VCSM/src/features/portfolio/setup.js:39–58`

The injected `isActorOwner` queries `vc.actor_owners` with `eq('actor_id', actorId)` and relies on RLS policy `actor_owners_read_own` (user_id = auth.uid()) to auto-scope results. This is the canonical ownership model. No exploit path found. No action required.

---

### ELEK-2026-05-28-043

**Severity:** INFO  
**Title:** `updateItem` / `deleteItem` engine — `isActorOwner` called after `profile_id` cross-check; ownership model partially inverted

**Files:** `engines/portfolio/src/controller/updateItem.controller.js:27–41`, `deleteItem.controller.js:24–40`

The engine checks `existing.profile_id !== callerProfileId` before calling `isActorOwner`. This means a non-owner will fail the profile_id check first rather than the actor_owners check. The ordering is inverted from best practice (actor_owners should be the primary gate). However, both checks are present and the combined behavior is correct. No exploit path — the item does not get modified. Recommend reordering for defense-in-depth clarity but no security impact.

---

### ELEK-2026-05-28-044

**Severity:** INFO  
**Title:** `usePortfolioItemSubmit` — `actorId` prop flows from parent component, not re-derived from session inside hook

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/components/portfolio/hooks/usePortfolioItemSubmit.js:18`

The hook accepts `actorId` as a prop. The portfolio dashboard screen is protected by `useVportOwnership` at the screen level (confirmed by exchange and menu screens following the same pattern). If the ownership gate at the screen level is correct, this is low risk. No direct exploit chain traced end-to-end within this module scope. INFO only.

---

## BW-PORT-004 Chain Re-assessment

**Prior claim (BW-PORT-004 CRITICAL):** `callerProfileId === itemProfileId` — both sides are attacker-controlled.

**ELEKTRA finding:** The current code at `locksmithOwner.controller.js:111–120` does NOT have attacker-controlled values on both sides. `callerProfileId` is resolved from the DB via `profiles.id WHERE actor_id = actorId` (server lookup), and `itemProfileId` is resolved from the DB via `portfolio_items.profile_id WHERE id = portfolioItemId` (server lookup). Neither is directly injected from the request payload.

**However, the gap remains at the session-binding level (ELEK-2026-05-28-040):** `actorId` itself is not verified as owned by `auth.uid()` inside this controller. The profile lookup is server-side but anchored to a caller-supplied actorId that has no session binding. This downgrades the prior CRITICAL finding to MEDIUM for the current codebase state. The canonical fix (assertActorOwnsVportActorController) is still required.

**Revised severity: MEDIUM** (was CRITICAL under prior false-remediation state; now patched but incomplete — session-binding missing).

---

## Engine Write Path Summary

| Write path | Ownership model | actor_owners check | Session binding | Assessment |
|---|---|---|---|---|
| `createItem` | `isActorOwner(actorId)` via injected fn | YES — queries actor_owners w/ RLS | YES (session via supabase.auth) | CLEAN |
| `updateItem` | profile_id cross-check + `isActorOwner` | YES | YES | CLEAN (order inverted — INFO only) |
| `deleteItem` | profile_id cross-check + `isActorOwner` | YES | YES | CLEAN (order inverted — INFO only) |
| `addMedia` | profile_id cross-check + `isActorOwner` | YES | YES | CLEAN |
| `removeMedia` | profile_id cross-check + `isActorOwner` | YES | YES | CLEAN |
| `ctrlSavePortfolioDetail` | profile_id cross-check only (no actor_owners call) | NO — missing | NO session binding | MEDIUM — ELEK-2026-05-28-040 |

---

## Recommendations

1. **ELEK-2026-05-28-040 (MEDIUM):** Add `assertActorOwnsVportActorController` call at the top of `ctrlSavePortfolioDetail`. Pass `identityActorId` from the calling hook. This is the canonical VCSM ownership model.
2. **ELEK-2026-05-28-041 (LOW):** Add `!callerProfileId` guard at the start of `updatePortfolioMediaAssetIdDAL` to prevent silent filter bypass.
3. **ELEK-2026-05-28-043 (INFO):** Reorder `updateItem`/`deleteItem` engine to call `isActorOwner` before the profile_id cross-check — canonical gate first.
4. **BW-PORT-004:** Reclassify from CRITICAL to MEDIUM. Original code was patched (profile_id is no longer directly caller-injected). Session-binding gap remains and requires patch per ELEK-2026-05-28-040.
