---
# ELEKTRA Security Report

**Date:** 2026-05-28
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — P1/P2 HIGH risk modules (settings + delete-lifecycle two-module sprint)
**Findings Summary:** 3 HIGH | 2 MEDIUM | 0 LOW | 0 INFO
**False Positives Rejected:** 2
**Suggested Patches:** 5

---

## Executive Summary

ELEKTRA traced all source→sink chains in the delete-lifecycle module: content page delete, menu category delete, menu item delete, service addon delete, and the account-level VPORT soft/hard/restore delete paths.

Three HIGH findings are confirmed. `deleteVportActorMenuCategoryController` and `deleteVportActorMenuItemController` are structurally identical: both accept an `actorId` from the caller with no `assertActorOwnsVportActorController` call at the controller layer, delegating ownership entirely to DB RLS. The comment in both files reads "Expected RLS: DB should only allow deleting categories/items the current user/actor owns" — which documents the gap explicitly. The DAL WHERE clause uses `.eq("actor_id", actorId)` where `actorId` is the caller-supplied value, not a server-session-anchored value. `deleteVportServiceAddonController` is the most severe: it carries no ownership check at any layer AND the DAL it imports (`deleteVportServiceAddon.dal`) does not exist in the codebase — the file is missing. The controller will throw a runtime import error, meaning the feature is broken, but the declared intent is that RLS is the sole gate.

Two MEDIUM findings are confirmed. `deleteVportContentPageDAL` deletes by `.eq("id", id)` alone with no `actor_id` or auth binding in the WHERE clause — the controller's pre-flight read + actor_id comparison is the only defense-in-depth layer, but it uses a separate read that is not atomic with the delete (TOCTOU window). The menu category and item DALs accept `actorId` from the caller — they add it to the WHERE clause (`.eq("actor_id", actorId)`), which is better than nothing but is still a caller-supplied value with no session anchor.

The account-level delete paths (`ctrlSoftDeleteVport`, `ctrlHardDeleteVport`, `ctrlRestoreVport`) are clean: all three delegate to SECURITY DEFINER RPCs that enforce ownership internally, and the controller layer validates `vportId` before calling the DAL. These were confirmed clean and are counted as two false positives rejected (see below).

---

## High Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-007
- Title:              deleteVportActorMenuCategoryController — no assertActorOwnsVportActorController; actorId accepted from caller; ownership delegated entirely to RLS
- Category:           Missing Authorization at Controller Layer
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller.js : lines 14–36
                      apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal.js : lines 3–24
- Source:             `actorId` parameter from useVportActorMenuCategoriesMutations hook (hook passes actorId from component context)
- Sink:               `vportSchema.from("menu_categories").delete().eq("id", categoryId).eq("actor_id", actorId)` — hard delete
- Trust Boundary:     Controller layer — no ownership verification present
- Impact:             Any authenticated user who can call deleteVportActorMenuCategoryController (via hook or direct import) may delete any menu category by supplying a targetActorId they do not own. The DAL adds `.eq("actor_id", actorId)` to the WHERE clause — but `actorId` comes from the caller's parameter, not from a server-session-bound actor_owners lookup. If the caller supplies an actorId they own (or any actorId if RLS is weak), the delete fires silently. A restaurant/gas station VPORT owner could delete all menu categories from a competitor VPORT by enumerating categoryIds (public menu data) and their target actorId (also public). The hook `useVportActorMenuCategoriesMutations` passes its own `actorId` prop — correct in normal UI flow but not enforced.
- Evidence:
    // deleteVportActorMenuCategory.controller.js lines 14–36 (full — no ownership check anywhere)
    export async function deleteVportActorMenuCategoryController({ categoryId, actorId } = {}) {
      if (!categoryId) { throw new Error("...categoryId required"); }
      if (!actorId) { throw new Error("...actorId required"); }
      // DAL throws on error — no destructuring of { error }
      await deleteVportActorMenuCategoryDAL({ categoryId, actorId });
      return { ok: true, categoryId };
    }
    // Controller comment: "Expected RLS: DB should only allow deleting categories the current user/actor owns."

    // deleteVportActorMenuCategory.dal.js lines 3–24
    const { error } = await vportSchema
      .from("menu_categories")
      .delete()
      .eq("id", categoryId)
      .eq("actor_id", actorId);   // ← actorId is the caller-supplied value, not session-bound
- Reproduction Steps:
    1. Authenticate as user A (owns actor-A)
    2. Import deleteVportActorMenuCategoryController directly
    3. Call with { categoryId: '<target-category-id>', actorId: '<actor-B-id>' }
    4. If RLS on vport.menu_categories allows DELETE where actor_id matches (without confirming session owns that actor_id), the category is deleted
    5. Actor B loses a menu category with no audit trail
    (Do not test on production)
- Existing Defense:     DAL WHERE clause `.eq("actor_id", actorId)` — provides partial protection if caller supplies a wrong actorId by accident; relies entirely on RLS for authorization
- Why Defense Is Insufficient: actorId in WHERE clause is caller-supplied. No server-session lookup. No assertActorOwnsVportActorController. Controller comment explicitly acknowledges RLS is the sole gate. RLS policy status on vport.menu_categories DELETE has not been audited (not confirmed by DB or CARNAGE).
- Recommended Fix:    Add `callerActorId` parameter to the controller. Call `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` before delegating to the DAL.
- Suggested Patch:
    // deleteVportActorMenuCategory.controller.js — add ownership gate

    import deleteVportActorMenuCategoryDAL from "@/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal";
    import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

    export async function deleteVportActorMenuCategoryController({ categoryId, actorId, callerActorId } = {}) {
      if (!categoryId) throw new Error("deleteVportActorMenuCategoryController: categoryId required");
      if (!actorId)    throw new Error("deleteVportActorMenuCategoryController: actorId required");
      if (!callerActorId) throw new Error("deleteVportActorMenuCategoryController: callerActorId required");

      await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });

      await deleteVportActorMenuCategoryDAL({ categoryId, actorId });
      return { ok: true, categoryId };
    }

    // Caller: useVportActorMenuCategoriesMutations must pass callerActorId = identity.actorId
- Follow-up Command:  DB — confirm RLS DELETE policy on vport.menu_categories; SPIDER-MAN — regression test cross-actor delete is rejected
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-008
- Title:              deleteVportActorMenuItemController — no assertActorOwnsVportActorController; actorId accepted from caller; same pattern as ELEK-007
- Category:           Missing Authorization at Controller Layer
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuItem.controller.js : lines 14–36
                      apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal.js : lines 3–24
- Source:             `actorId` parameter from useVportActorMenuItemsMutations hook
- Sink:               `vportSchema.from("menu_items").delete().eq("id", itemId).eq("actor_id", actorId)` — hard delete
- Trust Boundary:     Controller layer — no ownership verification present
- Impact:             Identical attack surface to ELEK-2026-05-28-007 but for menu items. An attacker who knows a target VPORT's actorId and any of its menu item IDs (returned by public menu reads) can delete the items. Menu item IDs are returned by the public QR menu read surface. A targeted competitor VPORT could have its entire menu destroyed with no audit trail.
- Evidence:
    // deleteVportActorMenuItem.controller.js lines 14–36 (full — no ownership check anywhere)
    export async function deleteVportActorMenuItemController({ itemId, actorId } = {}) {
      if (!itemId)   { throw new Error("...itemId required"); }
      if (!actorId)  { throw new Error("...actorId required"); }
      // DAL throws on error — no { error } destructuring
      await deleteVportActorMenuItemDAL({ itemId, actorId });
      return { ok: true, itemId };
    }
    // Controller comment: "Expected RLS: DB should only allow deleting items the current user/actor owns."

    // deleteVportActorMenuItem.dal.js lines 3–24
    const { error } = await vportSchema
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("actor_id", actorId);   // ← actorId is the caller-supplied value, not session-bound
- Reproduction Steps:
    1. Authenticate as user A (owns actor-A)
    2. Read public QR menu for VPORT-B — returns item IDs and actorId from the public menu read surface
    3. Import deleteVportActorMenuItemController directly
    4. Call with { itemId: '<item-from-VPORT-B>', actorId: '<actor-B-id>' }
    5. If RLS on vport.menu_items allows DELETE where actor_id matches without owning actor, item is deleted
    (Do not test on production)
- Existing Defense:     DAL WHERE clause `.eq("actor_id", actorId)` — same partial defense as ELEK-007; relies entirely on RLS
- Why Defense Is Insufficient: actorId in WHERE clause is caller-supplied. No server-session lookup. No controller-layer ownership gate. RLS policy status on vport.menu_items DELETE not audited.
- Recommended Fix:    Add `callerActorId` parameter to the controller. Call `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` before delegating to the DAL.
- Suggested Patch:
    // deleteVportActorMenuItem.controller.js — add ownership gate

    import deleteVportActorMenuItemDAL from "@/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal";
    import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

    export async function deleteVportActorMenuItemController({ itemId, actorId, callerActorId } = {}) {
      if (!itemId)     throw new Error("deleteVportActorMenuItemController: itemId required");
      if (!actorId)    throw new Error("deleteVportActorMenuItemController: actorId required");
      if (!callerActorId) throw new Error("deleteVportActorMenuItemController: callerActorId required");

      await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });

      await deleteVportActorMenuItemDAL({ itemId, actorId });
      return { ok: true, itemId };
    }

    // Caller: useVportActorMenuItemsMutations must pass callerActorId = identity.actorId
- Follow-up Command:  DB — confirm RLS DELETE policy on vport.menu_items; SPIDER-MAN — regression test cross-actor delete is rejected
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-009
- Title:              deleteVportServiceAddonController — no ownership check at controller layer; DAL file is missing from codebase (runtime broken)
- Category:           Missing Authorization + Missing DAL Implementation
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/services/deleteVportServiceAddon.controller.js : lines 1–38
- Source:             `targetActorId` + `addonId` from useDeleteVportServiceAddon hook (hook's targetActorId comes from component prop)
- Sink:               `deleteVportServiceAddonDal({ actorId: targetActorId, addonId })` — import resolves to a non-existent file
- Trust Boundary:     Controller layer — no ownership verification; also: DAL does not exist
- Impact:             Two compounded issues. (1) Authorization: the controller comment states "No auth/ownership check here — Ownership enforced by RLS (DB is source of truth)" — this is an explicit ownership gap matching ELEK-007/008, with no callerActorId accepted and no assertActorOwnsVportActorController call. (2) Availability: the DAL file `apps/VCSM/src/features/profiles/kinds/vport/dal/services/deleteVportServiceAddon.dal` does not exist in the codebase. The import at line 3 (`import deleteVportServiceAddonDal from "...dal/services/deleteVportServiceAddon.dal"`) will fail at build time or produce a runtime module-not-found error. The feature is non-functional in its current state. Any user calling the delete addon flow receives an unhandled error. This is rated HIGH because the authorization design is structurally identical to the confirmed HIGH findings ELEK-007/008 and the feature is broken in production.
- Evidence:
    // deleteVportServiceAddon.controller.js (full content)
    import deleteVportServiceAddonDal from "@/features/profiles/kinds/vport/dal/services/deleteVportServiceAddon.dal";
    // ↑ File does not exist — confirmed by filesystem search (find returned no results)

    export default async function deleteVportServiceAddonController({ targetActorId, addonId } = {}) {
      if (!targetActorId) { throw new Error("...targetActorId is required"); }
      if (!addonId)       { throw new Error("...addonId is required"); }
      // RLS must allow delete only for owners of targetActorId   ← explicit comment documents the gap
      await deleteVportServiceAddonDal({ actorId: targetActorId, addonId });
      return { ok: true, addonId };
    }

    // Filesystem verification:
    // find /VCSM/apps/VCSM/src/features/profiles/kinds/vport/dal/services — returned 5 files
    // deleteVportServiceAddon.dal.js is NOT among them
- Reproduction Steps:
    1. Navigate to any service addon delete UI in a VPORT dashboard
    2. Trigger delete action — useDeleteVportServiceAddon hook calls deleteVportServiceAddonController
    3. Runtime import error fires (module not found) — feature is non-functional
    4. Authorization gap (no ownership check) would be active once DAL is implemented if not addressed
    (Do not test on production)
- Existing Defense:     None for authorization. Feature is non-functional due to missing DAL (inadvertent defense-by-unavailability).
- Why Defense Is Insufficient: Missing DAL is not a security control — it is a bug. Once the DAL is added, the authorization gap becomes exploitable. Must be addressed simultaneously.
- Recommended Fix:    (1) Create deleteVportServiceAddon.dal.js at the expected path. (2) Add `callerActorId` to the controller and call `assertActorOwnsVportActorController` before the DAL call. (3) The DAL should bind to auth.getUser() and include actor_id in the WHERE clause.
- Suggested Patch:
    // Step 1 — create: apps/VCSM/src/features/profiles/kinds/vport/dal/services/deleteVportServiceAddon.dal.js

    import { supabase } from "@/services/supabase/supabaseClient";
    import vportSchema from "@/services/supabase/vportClient";

    export async function deleteVportServiceAddonDal({ actorId, addonId } = {}) {
      if (!actorId) throw new Error("deleteVportServiceAddonDal: actorId required");
      if (!addonId) throw new Error("deleteVportServiceAddonDal: addonId required");

      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = auth?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { error } = await vportSchema
        .from("service_addons")
        .delete()
        .eq("id", addonId)
        .eq("actor_id", actorId);

      if (error) throw error;
      return { addonId };
    }

    export default deleteVportServiceAddonDal;

    // Step 2 — update controller to add callerActorId ownership gate (mirror ELEK-007 patch)
- Follow-up Command:  SPIDER-MAN — test DAL creation + ownership gate; DB — confirm RLS on vport.service_addons DELETE; confirm table name is correct (service_addons vs addons)
```

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-010
- Title:              deleteVportContentPageDAL — delete WHERE clause contains only id; no actor_id binding; TOCTOU window between pre-flight read and delete
- Category:           TOCTOU / Insufficient DAL-Layer Scoping
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/dal/content/deleteVportContentPage.dal.js : lines 5–15
                      apps/VCSM/src/features/profiles/kinds/vport/controller/content/deleteVportContentPage.controller.js : lines 12–18
- Source:             `id` parameter (content page id) passed from controller after pre-flight ownership check
- Sink:               `vportSchema.from("content_pages").delete().eq("id", id)` — hard delete, no actor_id or auth binding
- Trust Boundary:     DAL layer — DELETE scoped only to `id`; no owner binding
- Impact:             The controller performs a correct pre-flight: asserts actor ownership (line 12), reads the existing page (line 14), and checks `existing.actor_id !== actorId` (line 16). However, the DAL then deletes using only `.eq("id", id)` with no actor_id binding in the WHERE clause. Between the controller's pre-flight read and the DAL's delete call, a race condition (TOCTOU) exists: if the content page's actor_id is modified between the two calls (via a concurrent update), the controller check passes against the old actor_id while the DAL deletes a page that now belongs to a different actor. More directly: the DAL itself — if called with a forged `id` that bypasses controller validation — would delete any content page regardless of ownership. The sole defense is the controller pre-flight.
- Evidence:
    // deleteVportContentPage.dal.js (full content)
    export async function deleteVportContentPageDAL({ id } = {}) {
      if (!id) throw new Error("deleteVportContentPageDAL: id is required");
      const { error } = await vportSchema
        .from("content_pages")
        .delete()
        .eq("id", id);   // ← only id in WHERE clause; no actor_id, no auth.uid()
      if (error) throw error;
      return { id };
    }

    // Controller pre-flight (correct but non-atomic with DAL):
    // line 12: await assertActorOwnsVportActorController(...)
    // line 14: const existing = await readVportContentPageDAL({ id })
    // line 16: if (existing.actor_id !== actorId) throw new Error("Not allowed...")
    // line 18: return await deleteVportContentPageDAL({ id })   ← separate DB call
- Reproduction Steps:
    1. Attacker calls deleteVportContentPageDAL directly (bypassing controller) with a known content page id
    2. Delete fires with no ownership check — page is deleted
    (TOCTOU path is harder to reproduce reliably but the direct-call path is straightforward)
    (Do not test on production)
- Existing Defense:     Controller pre-flight read + actor_id comparison (lines 14–16); assertActorOwnsVportActorController at line 12
- Why Defense Is Insufficient: Controller-only defense. DAL is importable directly. No actor_id in the DELETE WHERE clause. This finding was previously noted in VENOM/BLACKWIDOW (ELEK-2026-05-27-003 referenced in content-pages governance matrix as ELEK-003). This report independently confirms the same chain.
- Recommended Fix:    Add `actor_id` to the DELETE WHERE clause in deleteVportContentPageDAL. The controller already verifies the id-to-actor_id mapping; the DAL should enforce it atomically: `.eq("id", id).eq("actor_id", actorId)`. Requires adding `actorId` parameter to the DAL function.
- Suggested Patch:
    // deleteVportContentPage.dal.js — add actor_id binding

    export async function deleteVportContentPageDAL({ id, actorId } = {}) {
      if (!id) throw new Error("deleteVportContentPageDAL: id is required");
      if (!actorId) throw new Error("deleteVportContentPageDAL: actorId is required");

      const { error } = await vportSchema
        .from("content_pages")
        .delete()
        .eq("id", id)
        .eq("actor_id", actorId);   // ← atomic ownership binding added

      if (error) throw error;
      return { id };
    }

    // Controller: pass actorId to deleteVportContentPageDAL call at line 18
- Follow-up Command:  SPIDER-MAN — regression test that direct DAL call with foreign id is rejected once actor_id binding is added
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-011
- Title:              deleteVportActorMenuCategoryDAL and deleteVportActorMenuItemDAL — actorId in WHERE clause is caller-supplied with no session anchor; no auth.getUser() in DAL
- Category:           Missing Session Binding at DAL Layer
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal.js : lines 3–24
                      apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal.js : lines 3–24
- Source:             `actorId` parameter — supplied by controller caller, which itself has no ownership check (ELEK-007/008)
- Sink:               `vportSchema.from("menu_categories").delete()...eq("actor_id", actorId)` and same for menu_items
- Trust Boundary:     DAL layer — no auth.getUser() call; actorId in WHERE derived from caller parameter
- Impact:             This finding documents the DAL-layer half of the authorization gap described in ELEK-007 and ELEK-008. Even if ELEK-007/008 are patched at the controller layer (adding assertActorOwnsVportActorController), the DALs do not independently bind to the authenticated session. Both DALs have no `auth.getUser()` call — they accept actorId from the caller and use it directly in the WHERE clause. This is the same pattern identified in ELEK-2026-05-28-004 (dalSetActorPrivacy). The DALs should serve as independent defense-in-depth even after the controller patches are applied.
- Evidence:
    // deleteVportActorMenuCategory.dal.js lines 14–22
    const { error } = await vportSchema
      .from("menu_categories")
      .delete()
      .eq("id", categoryId)
      .eq("actor_id", actorId);   // ← actorId from caller; no auth.getUser() anywhere in function

    // deleteVportActorMenuItem.dal.js lines 14–22
    const { error } = await vportSchema
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("actor_id", actorId);   // ← same pattern
- Reproduction Steps:
    1. Call deleteVportActorMenuCategoryDAL({ categoryId, actorId: '<target-actor>' }) directly
    2. actorId in WHERE clause restricts to that actor's categories — but actorId is attacker-chosen
    3. If the target actor_id is known and RLS is weak, DELETE fires against that actor's data
- Existing Defense:     actorId in WHERE clause provides partial scoping (attacker must know the actorId)
- Why Defense Is Insufficient: actorId is a public value (returned by public actor read surfaces). No auth.getUser() in DAL = no independent session binding. Once ELEK-007/008 controller patches are applied, these DALs still lack independent defense.
- Recommended Fix:    Add auth.getUser() to both DALs. Bind an actor_owners lookup before the DELETE: confirm the authenticated user owns the actorId used in the WHERE clause.
- Suggested Patch:
    // Shared pattern for both DALs — add at the top of each function:

    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    const userId = auth?.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { data: ownership, error: ownerError } = await supabase
      .schema('vc')
      .from('actor_owners')
      .select('actor_id')
      .eq('actor_id', actorId)
      .eq('user_id', userId)
      .maybeSingle()
    if (ownerError) throw ownerError
    if (!ownership) throw new Error('deleteVportActorMenu[Category|Item]DAL: actor not owned by authenticated user')
    // then proceed with DELETE
- Follow-up Command:  DB — confirm RLS DELETE policies on vport.menu_categories and vport.menu_items; SPIDER-MAN — regression tests after controller + DAL patches
```

---

## False Positives Rejected

| Candidate | Reason Rejected |
|---|---|
| `ctrlSoftDeleteVport` / `ctrlHardDeleteVport` / `ctrlRestoreVport` (account.controller.js) | All three delegate to SECURITY DEFINER RPCs (soft_delete_vport, hard_delete_vport, restore_vport). Each RPC validates ownership and enforces actor-chain cascade at DB layer. Controller validates vportId non-null before calling DAL. Error messages confirm auth and ownership failures are surfaced. Chain is complete and sound. Rejected as false positive. |
| `dalDeleteCitizenAccountFull` (account.write.dal.js) | Delegates to Edge Function `delete-citizen-account` via supabase.functions.invoke. No body or actorId in the POST — Edge Function is responsible for resolving the caller from the service-role JWT. Application layer has no ownership surface. No bypass available at the DAL level. Rejected as false positive — Edge Function audit is out of scope for this module scan. |

---

## Suggested Patch Queue

| Finding ID | File(s) | Type | Patch Complexity | Prerequisite |
|---|---|---|---|---|
| ELEK-2026-05-28-007 | deleteVportActorMenuCategory.controller.js | Add assertActorOwnsVportActorController + callerActorId param | LOW — 8-line change + hook caller update | None |
| ELEK-2026-05-28-008 | deleteVportActorMenuItem.controller.js | Add assertActorOwnsVportActorController + callerActorId param | LOW — 8-line change + hook caller update | None |
| ELEK-2026-05-28-009 (part 1) | dal/services/deleteVportServiceAddon.dal.js | Create missing DAL file with auth + actor_id binding | MEDIUM — new file, 25 lines | Confirm table name (service_addons) with DB |
| ELEK-2026-05-28-009 (part 2) | deleteVportServiceAddon.controller.js | Add callerActorId + assertActorOwnsVportActorController | LOW — 8-line change | Part 1 must complete first |
| ELEK-2026-05-28-010 | deleteVportContentPage.dal.js | Add actorId parameter + eq("actor_id", actorId) to WHERE | LOW — 5-line change + controller caller update | None |

---

## Required Follow-up Commands

| Command | Reason |
|---|---|
| DB | Confirm RLS DELETE policies on vport.menu_categories, vport.menu_items, vport.service_addons; confirm service_addons table name |
| DB | Confirm RLS policy on vport.content_pages DELETE (ELEK-010 scope) |
| SPIDER-MAN | Regression tests for ELEK-007/008 cross-actor delete rejection; ELEK-009 DAL import resolution; ELEK-010 actor_id binding on delete |
| CARNAGE | Confirm cascade coverage for menu categories/items during full VPORT soft-delete: are menu records deleted when parent VPORT is soft-deleted? Orphan risk if cascade is absent. |
