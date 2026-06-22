# ELEKTRA Precision Security Report — Restaurant Module (Menu Write Paths)

**Date:** 2026-05-28  
**Scanner:** ELEKTRA  
**Module:** restaurant  
**App:** apps/VCSM  
**Finding range:** ELEK-2026-05-28-050 – ELEK-2026-05-28-056  
**Prior BLACKWIDOW findings:** BW-REST-001 (MEDIUM — delete no pre-fetch), BW-REST-002 (MEDIUM — UUID legacy routes), BW-REST-003 (LOW — silent media failure)

---

## Scan Scope

Write controllers:
- `deleteVportActorMenuCategoryController`
- `deleteVportActorMenuItemController`
- `saveVportActorMenuCategoryController` (create + update)
- `saveVportActorMenuItemController` (create + update)
- `publishMenuUpdateAsPostController`

Write DALs:
- `deleteVportActorMenuCategory.dal.js`
- `deleteVportActorMenuItem.dal.js`
- `createVportActorMenuCategory.dal.js`
- `createVportActorMenuItem.dal.js`
- `updateVportActorMenuCategory.dal.js`
- `updateVportActorMenuItem.dal.js`
- `createVportMenuItemMedia.dal.js` (secondary — media tracking)

---

## Summary

| ID | Severity | Title | Status |
|---|---|---|---|
| ELEK-2026-05-28-050 | HIGH | `deleteVportActorMenuCategoryController` / `deleteVportActorMenuItemController` — no application-layer ownership check; delete is attempted directly via DAL with caller-supplied `actorId` | OPEN |
| ELEK-2026-05-28-051 | HIGH | `deleteVportActorMenuCategoryDAL` / `deleteVportActorMenuItemDAL` — `.eq('actor_id', actorId)` provides ownership scope but `menu_categories` and `menu_items` tables do not have a direct `actor_id` column (ownership is via `profiles.actor_id`); RLS behavior is unconfirmed | OPEN |
| ELEK-2026-05-28-052 | MEDIUM | `updateVportActorMenuCategoryDAL` / `updateVportActorMenuItemDAL` — UPDATE has no ownership scope in the DAL; `categoryId`/`itemId` are the only WHERE clause; patch can touch any row | OPEN |
| ELEK-2026-05-28-053 | LOW | `saveVportActorMenuCategoryController` update path — reads category to check `actor_id`, but `actor_id` is resolved via a join through `profiles` and could be null if the join fails silently | OPEN |
| ELEK-2026-05-28-054 | LOW | `saveVportActorMenuItemController` — `readVportActorMenuItemsDAL` is imported as `readVportActorMenuItemsDAL` but the DAL exports only `readVportActorMenuItemDAL` (singular) as default; the import resolves correctly via default import but the naming mismatch is a maintenance footgun | INFO |
| ELEK-2026-05-28-055 | INFO | `publishMenuUpdateAsPostController` — ownership correctly gated via `assertActorOwnsVportActorController` | CLEAN |
| ELEK-2026-05-28-056 | INFO | `createVportActorMenuCategoryDAL` / `createVportActorMenuItemDAL` — `profile_id` server-resolved from `actorId`; cannot be caller-injected | CLEAN |

---

## Finding Detail

---

### ELEK-2026-05-28-050

**Severity:** HIGH  
**Title:** Delete controllers apply no application-layer ownership check before calling the DAL

**Files:**
- `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller.js:14–38`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuItem.controller.js:14–38`

```js
// deleteVportActorMenuCategoryController
export async function deleteVportActorMenuCategoryController({ categoryId, actorId } = {}) {
  if (!categoryId) throw new Error("...");
  if (!actorId) throw new Error("...");
  await deleteVportActorMenuCategoryDAL({ categoryId, actorId });  // NO pre-fetch, NO ownership check
  return { ok: true, categoryId };
}
```

**Chain:**

```
[UI delete button] →
  hook (actorId from URL params, categoryId from UI state) →
  deleteVportActorMenuCategoryController({ categoryId, actorId }) →
  deleteVportActorMenuCategoryDAL({ categoryId, actorId }) →
  vportSchema.from('menu_categories').delete().eq('id', categoryId).eq('actor_id', actorId)
```

**Source:** `actorId` and `categoryId`/`itemId` are caller-supplied — derived from route params and UI state.

**Trust boundary gap:** The controller comment says "Expected RLS: DB should only allow deleting categories the current user/actor owns." This delegates all authorization to RLS alone. No application-layer pre-fetch of the category/item is performed to verify ownership before the DELETE is issued.

**Critical question:** Do `menu_categories` and `menu_items` have a direct `actor_id` column? Analysis of the DAL filters (`.eq('actor_id', actorId)`) suggests yes. But the `createVportActorMenuCategoryDAL` inserts `profile_id` (not `actor_id`) as the ownership column. The read DAL (`readVportActorMenuCategoriesDAL`) resolves `actor_id` via a JOIN on `profiles!inner(actor_id)`. This means `menu_categories` does NOT have a native `actor_id` column — `actor_id` is resolved via join in reads. If `menu_categories.actor_id` does not exist, the `.eq('actor_id', actorId)` filter in the DELETE DAL will be silently ignored by the Supabase JS client (it will generate a WHERE clause on a nonexistent column, which PostgREST may error on or ignore depending on policy).

**Impact chain:** If the `.eq('actor_id', actorId)` filter is a no-op (column does not exist on `menu_categories`), then the DELETE becomes scoped only to `.eq('id', categoryId)`. Any authenticated user who knows another VPORT's `categoryId` can delete it by supplying their own `actorId` (which passes the `!actorId` guard) and the victim's `categoryId`. This is a full cross-actor menu destruction vector.

**Missing defense:** 
1. No `assertActorOwnsVportActorController` call in either delete controller.
2. No pre-fetch of the category/item to confirm it belongs to `actorId` before DELETE.
3. Unclear whether `menu_categories` has a native `actor_id` column to make the DAL filter effective.

**Proposed patch (text only — do not apply):**

```js
// deleteVportActorMenuCategoryController — add before DAL call:
import { assertActorOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'

export async function deleteVportActorMenuCategoryController({
  categoryId,
  actorId,
  identityActorId,  // NEW PARAM — must come from session
} = {}) {
  if (!categoryId) throw new Error("...");
  if (!actorId) throw new Error("...");
  if (!identityActorId) throw new Error("deleteVportActorMenuCategoryController: identityActorId required");

  // Verify the authenticated user owns this VPORT actor
  await assertActorOwnsVportActorController({
    requestActorId: identityActorId,
    targetActorId: actorId,
  });

  // Pre-fetch category to confirm it belongs to actorId
  const existing = await readVportActorMenuCategoriesDAL({ categoryId });
  if (!existing) throw new Error('Category not found');
  if (existing.actor_id !== actorId) throw new Error('Not authorized to delete this category');

  await deleteVportActorMenuCategoryDAL({ categoryId, actorId });
  return { ok: true, categoryId };
}
```

Same pattern for `deleteVportActorMenuItemController`.

---

### ELEK-2026-05-28-051

**Severity:** HIGH  
**Title:** Delete DALs filter on `actor_id` column that likely does not exist natively on `menu_categories`/`menu_items` — ownership scope may be silently dropped

**Files:**
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal.js:14–18`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal.js:14–18`

```js
// deleteVportActorMenuCategoryDAL
const { error } = await vportSchema
  .from("menu_categories")
  .delete()
  .eq("id", categoryId)
  .eq("actor_id", actorId);  // ← actor_id column presence unconfirmed
```

**Evidence of column gap:**

- `createVportActorMenuCategoryDAL` inserts `{ profile_id, key, name, ... }` — no `actor_id` field.
- `readVportActorMenuCategoriesDAL` reads `"id,profile_id,key,name,description,sort_order,is_active,created_at,updated_at,profiles!inner(actor_id)"` and resolves `actor_id` via the `profiles` join.
- The CATEGORY_SELECT in the category create DAL is `"id,profile_id,key,name,..."` — no `actor_id`.

If PostgREST/Supabase receives `.eq('actor_id', value)` on a column that does not exist, behavior is implementation-dependent. PostgREST typically returns an error (HTTP 400 "column not found"), but this depends on schema caching and client configuration. If it silently drops the filter, the DELETE is scoped only to `id = categoryId`, allowing cross-actor deletion.

**Impact:** If the `actor_id` ownership filter is a no-op, any authenticated user with a valid session can delete any `menu_categories` or `menu_items` row by supplying its UUID. Combined with ELEK-2026-05-28-050 (no app-layer pre-check), this is a full IDOR delete chain.

**Dependency:** This finding compounds ELEK-2026-05-28-050. If RLS on `menu_categories`/`menu_items` correctly scopes DELETE to the row owner, both findings are mitigated at the DB layer. But "RLS as sole gate" for DELETE without an app-layer ownership check is not VCSM's canonical security model.

**Proposed patch (text only — do not apply):**

```js
// Option A: If menu_categories has profile_id (confirmed), scope DELETE via profile_id
// First resolve profileId server-side:
const profileId = await resolveVportProfileId(actorId);
if (!profileId) throw new Error('deleteVportActorMenuCategoryDAL: profile not found');

const { error } = await vportSchema
  .from("menu_categories")
  .delete()
  .eq("id", categoryId)
  .eq("profile_id", profileId);  // use confirmed column

// Option B: Remove actor_id filter from DAL and rely on app-layer pre-fetch in controller (ELEK-2026-05-28-050 patch)
```

---

### ELEK-2026-05-28-052

**Severity:** MEDIUM  
**Title:** `updateVportActorMenuCategoryDAL` / `updateVportActorMenuItemDAL` — UPDATE scoped only to `id`; no ownership column in WHERE clause

**Files:**
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuCategory.dal.js:17–27`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuItem.dal.js:15–24`

```js
// updateVportActorMenuCategoryDAL
const { data, error } = await vportSchema
  .from("menu_categories")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", categoryId)  // ← only WHERE clause; no profile_id or actor_id scoping
  .select(CATEGORY_SELECT)
  .maybeSingle();
```

**Chain:**

The UPDATE call has no `profile_id` or `actor_id` filter. The only ownership defense is the app-layer pre-fetch in `saveVportActorMenuCategoryController` (lines 36–44), which reads the category and checks `existing.actor_id !== actorId`. This check is correct but trusts `actorId` from the controller parameter without `actor_owners` session binding.

**Impact:** If an attacker bypasses or races the controller's pre-fetch check, or if the `existing.actor_id` value is null due to the `profiles!inner` join failing, the UPDATE will write to the row with no ownership filter in the DAL. Any row by `id` is writeable.

**Proposed patch (text only — do not apply):**

```js
// updateVportActorMenuCategoryDAL — add profile_id scope:
const profileId = await resolveVportProfileId(actorId);  // requires actorId param added to DAL signature
if (!profileId) throw new Error('updateVportActorMenuCategoryDAL: profile not found');

const { data, error } = await vportSchema
  .from("menu_categories")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", categoryId)
  .eq("profile_id", profileId)  // ADD ownership scope
  .select(CATEGORY_SELECT)
  .maybeSingle();
```

---

### ELEK-2026-05-28-053

**Severity:** LOW  
**Title:** `saveVportActorMenuCategoryController` update path — `actor_id` resolved via join could be null if join fails; null check before comparison is missing

**File:** `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuCategory.controller.js:36–45`

```js
const existing = await readVportActorMenuCategoriesDAL({ categoryId });
if (!existing) throw new Error("Category not found");
if (existing.actor_id !== actorId) throw new Error("Not allowed to modify this category");
```

**Chain:** `readVportActorMenuCategoriesDAL` resolves `actor_id` via `profiles!inner(actor_id)`. If the `profiles` record is deleted or the join fails, `existing.actor_id` will be `null`. The comparison `null !== actorId` evaluates to `true`, so the check would throw "Not allowed" — this is safe-fail behavior.

However if `actorId` is also `null` (not caught by the earlier `!actorId` check because the check only validates the controller-level param), then `null !== null` evaluates to `false`, allowing the update with no ownership verified. In practice the `!actorId` guard at line 27 catches a null `actorId`. LOW risk — defensive clarity could be improved.

**Proposed patch (text only — do not apply):**

```js
// After resolving existing:
if (!existing.actor_id) throw new Error('Category profile association missing — cannot verify ownership');
if (existing.actor_id !== actorId) throw new Error('Not allowed to modify this category');
```

---

### ELEK-2026-05-28-054

**Severity:** INFO  
**Title:** `readVportActorMenuItemsDAL` import name mismatch (plural) vs. actual DAL export (singular)

**File:** `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js:5`

```js
import readVportActorMenuItemsDAL from "@/features/profiles/kinds/vport/dal/menu/readVportActorMenuItems.dal";
```

The DAL exports `readVportActorMenuItemDAL` (singular) as `default`. The import alias `readVportActorMenuItemsDAL` (plural) works because it's a default import — the name is local. No runtime error. No security impact. INFO — naming inconsistency only.

---

### ELEK-2026-05-28-055

**Severity:** INFO  
**Title:** `publishMenuUpdateAsPostController` — ownership correctly gated via canonical model

**File:** `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js:33–36`

```js
await assertActorOwnsVportActorController({
  requestActorId: identityActorId,
  targetActorId: actorId,
});
```

`identityActorId` must be provided by the caller (the UI hook). BW-REST-001 noted the delete path has no pre-fetch — that concern applies to the delete controllers (ELEK-2026-05-28-050), not to the publish path. The publish path itself is correctly gated. CLEAN.

---

### ELEK-2026-05-28-056

**Severity:** INFO  
**Title:** Create DALs — `profile_id` server-resolved from `actorId`; cannot be caller-injected

**Files:** `createVportActorMenuCategory.dal.js:17`, `createVportActorMenuItem.dal.js:25`

```js
const profileId = await resolveVportProfileId(actorId);
```

Create operations resolve `profile_id` server-side. The attacker cannot supply an arbitrary `profile_id`. The only attack surface is supplying a forged `actorId` — caught by the `actor_owners` check if the caller controller implements it (which `saveVportActorMenuCategoryController` does not via `assertActorOwnsVportActorController` — but the `actor_id` pre-fetch check in the update path provides partial coverage for update; create path relies on the UI-level `isOwner` gate + RLS). CLEAN for injection; ownership gate coverage gap addressed in ELEK-2026-05-28-050/052.

---

## Restaurant Menu Write Path Summary

| Write path | App-layer ownership check | actor_owners gate | DAL WHERE scope | Assessment |
|---|---|---|---|---|
| `deleteVportActorMenuCategoryController` | NONE | NO | actor_id (column may not exist) | HIGH — ELEK-2026-05-28-050/051 |
| `deleteVportActorMenuItemController` | NONE | NO | actor_id (column may not exist) | HIGH — ELEK-2026-05-28-050/051 |
| `saveVportActorMenuCategoryController` (update) | profile_id cross-check via join | NO | id only | MEDIUM — ELEK-2026-05-28-052/053 |
| `saveVportActorMenuItemController` (update) | actor_id cross-check via join | NO | id only | MEDIUM — ELEK-2026-05-28-052 |
| `saveVportActorMenuCategoryController` (create) | none (RLS + UI gate) | NO | N/A | LOW — relies on RLS |
| `saveVportActorMenuItemController` (create) | none (RLS + UI gate) | NO | N/A | LOW — relies on RLS |
| `publishMenuUpdateAsPostController` | assertActorOwnsVportActorController | YES | N/A | CLEAN |

---

## BW-REST-001 Confirmation

BW-REST-001 (MEDIUM): "delete no pre-fetch." ELEKTRA confirms and escalates: the delete controllers have zero application-layer ownership verification. Combined with the unconfirmed `actor_id` column in the DELETE DAL (ELEK-2026-05-28-051), this is a HIGH risk chain. BW-REST-001 should be reclassified to HIGH pending schema confirmation.

---

## Recommendations

1. **ELEK-2026-05-28-050 + 051 (HIGH):** Add `assertActorOwnsVportActorController` + pre-fetch ownership check to both delete controllers. Confirm whether `menu_categories`/`menu_items` have a native `actor_id` column; if not, change DAL filter to `profile_id` (server-resolved).
2. **ELEK-2026-05-28-052 (MEDIUM):** Add `profile_id` ownership scope to both update DALs. This is defense-in-depth — the controller-level check is present but the DAL should not rely on it exclusively.
3. **ELEK-2026-05-28-053 (LOW):** Add explicit null check on `existing.actor_id` before ownership comparison in save controllers.
4. **Schema confirmation required:** Verify whether `menu_categories` and `menu_items` have a native `actor_id` column or only `profile_id`. The column schema determines whether ELEK-2026-05-28-051 is HIGH exploitable or HIGH theoretical.
