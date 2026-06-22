# VCSM Actor-First Remediation Plan
**Date:** 2026-06-06  
**Input:** ACTOR_OWNERSHIP_ARCHITECTURE_AUDIT_2026-06-06.md  
**Mission:** Move VCSM from `ACTOR_FIRST_PARTIAL` → `ACTOR_FIRST_CONFIRMED`  
**Constraint:** No breaking changes to production flows. No code written yet.

---

## 1. Executive Summary

### Current State: `ACTOR_FIRST_PARTIAL`

The identity engine is actor-first. The public routing surface is actor-first. The canonical ownership gate (`assertActorOwnsVportActor` → `vc.actor_owners`) is correctly implemented and used in booking write paths.

What is not completed:

| Gap | Location | Risk Class |
|---|---|---|
| `profile_actor_access` fallback in hydrator | vcsmActorHydrator.js:64–73 | SECURITY BLOCKER |
| `owner_user_id` authorization in settings DAL | vports.read.dal.js:111,134 | SECURITY BLOCKER |
| `actor_owners` ↔ `user_app_actor_links` can diverge on revocation | Engine arch | SECURITY BLOCKER |
| `ownerActorId` in public identity contract | identity.model.js:7 | CONTRACT VIOLATION |
| `listOwnerBookingResources` has no ownership gate | listOwnerBookingResources.controller.js | CONTRACT VIOLATION |
| `ownerUserId` exposed in VPORT profile model | profile.model.js:73 | CONTRACT VIOLATION |
| Post dual-writes `user_id` + `actor_id` | createPost.controller.js:73–74 | LEGACY MIGRATION |
| Feed viewer context routes through `profile_id` | getFeedViewerContext.controller.js:13–14 | ARCHITECTURE CLEANUP |
| `profile_actor_access` table still exists and is queried | DB schema | LEGACY MIGRATION |

### Target State: `ACTOR_FIRST_CONFIRMED`

```
1. Ownership has one path: vc.actor_owners. No fallbacks.
2. actor_owners revocation propagates to user_app_actor_links.
3. Settings DALs enforce ownership through actor_owners, not owner_user_id.
4. Public identity surface: { actorId, kind, realmId } only — no ownerActorId.
5. Controllers resolve ownership internally — no caller-supplied derived fields.
6. UI has no access to ownerUserId or ownerActorId through identity or model mappers.
```

---

## 2. Fix Dependency Graph

Read bottom-to-top. Each node must be complete before the nodes above it.

```
                        ACTOR_FIRST_CONFIRMED
                               │
              ┌────────────────┴────────────────┐
              │                                 │
   [BATCH 3] Remove ownerActorId          [BATCH 4] DB cleanup
   from toPublicIdentity()                     │
              │                      ┌──────────┴──────────┐
              │                      │                     │
   requires: ALL direct              backfill        drop profile_actor_access
   identity.ownerActorId             actor_owners    table (after hydrator fixed)
   consumers refactored              for orphaned
              │                      VPORTs
              │
   ┌──────────┴───────────────────────────────────┐
   │                                              │
[BATCH 2]                                  [BATCH 1] — safe first
resolveInboxActor refactored               ─────────────────────
to accept ownerActorId as param,           P0-A: Remove profile_actor_access
not read from identity directly            fallback in hydrator (fail closed)

   Also: listOwnerBookingResources          P0-C: Remove owner_user_id from
   gets ownership gate added                readVportBusinessCardSettingsDAL
                                            readVportDirectoryStateDAL

                                            P1-C: Remove ownerUserId from
                                            mapVportProfile()

                                            P2-B: Fix getFeedViewerContext to
                                            read adult flag from actor, not profile


INDEPENDENT (no prerequisites)
─────────────────────────────
P0-B: DB trigger — actor_owners.is_void → user_app_actor_links revocation
P2-A: Remove user_id dual-write from createPost (after confirming no readers)
P3:   Tests, docs, migration cleanup
```

---

## 3. Finding Classification

### Security Blockers

| ID | Finding | File | Line |
|---|---|---|---|
| SEC-01 | `profile_actor_access` fallback — active ownership bypass vector | `vcsmActorHydrator.js` | 64–73 |
| SEC-02 | `owner_user_id` enforcement in business card settings DAL — actor_owners bypass | `vports.read.dal.js` | 111 |
| SEC-03 | `owner_user_id` enforcement in directory state DAL — actor_owners bypass | `vports.read.dal.js` | 134 |
| SEC-04 | `actor_owners` revocation has no propagation to `user_app_actor_links` | Engine arch gap | — |

### Contract Violations

| ID | Finding | File | Line |
|---|---|---|---|
| CON-01 | `ownerActorId` in `toPublicIdentity()` — derived field in public contract | `identity.model.js` | 7 |
| CON-02 | `listOwnerBookingResourcesController` has no ownership gate — accepts ownerActorId from caller without verifying | `listOwnerBookingResources.controller.js` | 5–13 |
| CON-03 | `resolveInboxActor` reads `identity.ownerActorId` directly — contract dependency on public field | `resolveInboxActor.js` | 32, 48 |
| CON-04 | `ownerUserId` exposed in VPORT profile mapper | `profile.model.js` | 73 |

### Functional Bugs

| ID | Finding | File | Line |
|---|---|---|---|
| BUG-01 | `listOwnerBookingResources` is callable with any `ownerActorId` — no caller validation | `listOwnerBookingResources.controller.js` | 5 |
| BUG-02 | If a VPORT has no `actor_owners` row but has a `profile_actor_access` row, it silently gets an ownerActorId — incorrect behavior | `vcsmActorHydrator.js` | 64–73 |

### Architecture Cleanup

| ID | Finding | File | Line |
|---|---|---|---|
| ARC-01 | `getFeedViewerContext` routes adult flag check through `profile_id` FK | `getFeedViewerContext.controller.js` | 13–14 |
| ARC-02 | `assertActorOwnsVportActor` uses `requester.profile_id` as `user_id` in actor_owners query — profile still embedded in ownership resolution | `assertActorOwnsVportActor.controller.js` (both) | 17, 21 |
| ARC-03 | `ACTOR_COLUMNS` always selects `profile_id` and `vport_id` — FK proxies selected on all actor reads | `identity.read.dal.js` | 5 |

### Legacy Migration

| ID | Finding | File | Line |
|---|---|---|---|
| LEG-01 | Post dual-writes `user_id` + `actor_id` to posts table | `createPost.controller.js` | 73–74 |
| LEG-02 | `barberVport.read.dal.js` uses `owner_user_id` — explicitly documented as pre-provisioning path | `barberVport.read.dal.js` | 10, 26 |
| LEG-03 | `vport.profile_actor_access` table still exists and is queried | DB schema | — |
| LEG-04 | `vport.profiles.owner_user_id` column still exists and is referenced in live queries | DB schema | — |

---

## 4. Batch Plan

### Batch 1 — No Behavior Change (Safe Now)

**Principle:** These fixes change the implementation without changing observable behavior for any legitimate production flow. No ownership semantics change for any user who has correct data. They close bypass vectors.

| Fix ID | Action | Files Touched | Behavior Change |
|---|---|---|---|
| B1-1 | Remove `profile_actor_access` fallback block from hydrator. If `actor_owners` returns null, `ownerActorId` stays null. | `vcsmActorHydrator.js:64–73` | None for VPORTs with correct actor_owners rows. VPORTs with no actor_owners row will now correctly have `ownerActorId=null` instead of getting one from a legacy table. |
| B1-2 | Replace `owner_user_id=userId` filter in `readVportBusinessCardSettingsDAL` with an actor_owners JOIN | `vports.read.dal.js:101–120` | None for legitimate owners. Blocks access for any user whose `actor_owners` row was revoked but `owner_user_id` was not cleared. |
| B1-3 | Replace `owner_user_id=userId` filter in `readVportDirectoryStateDAL` with an actor_owners JOIN | `vports.read.dal.js:121–140` | Same as B1-2. |
| B1-4 | Remove `ownerUserId: row.owner_user_id ?? null` from `mapVportProfile()` | `profile.model.js:73` | Removes a field from the model. Must verify no consumer reads `profile.ownerUserId`. |
| B1-5 | Fix `getFeedViewerContext` adult gate — read `is_adult` from a direct actor-scoped query, not `profile_id → readProfileAdultFlagDAL` | `getFeedViewerContext.controller.js:13–14` | None. Logic unchanged, routing changed. |

**Requires before starting:**
- For B1-2 and B1-3: Confirm the replacement query shape (actor_owners JOIN to vport.profiles via actor_id). The vportId passed to these DALs must be the `vport.profiles.id`, and the actor_owners row has `actor_id` → `vc.actors.vport_id`. The JOIN is: `actor_owners WHERE actor_id IN (SELECT id FROM vc.actors WHERE vport_id = vportId) AND user_id = auth.uid()`.
- For B1-4: Search for all calls to `mapVportProfile()` and all accesses to `.ownerUserId` on the returned model before removing.

---

### Batch 2 — Controller Ownership Refactor

**Principle:** Ownership verification must happen inside the controller, not be trusted from the caller. No feature should break — the ownership check is already happening in most callers via `useVportOwnership` or `assertActorOwnsVportActor`. Adding the gate inside the controller is defense-in-depth.

| Fix ID | Action | Files Touched | Behavior Change |
|---|---|---|---|
| B2-1 | Add ownership gate to `listOwnerBookingResourcesController`: accept `{requestActorId, ownerActorId}` (same pattern as `ensureOwnerBookingResourceController`) and call `assertActorOwnsVportActorController` before the DAL read | `listOwnerBookingResources.controller.js` | Adds a DB round-trip for the actor_owners check. Callers that did not already verify ownership will now fail if they don't have a valid `requestActorId`. |
| B2-2 | Refactor `resolveInboxActor.js` to accept `ownerActorId` as an explicit parameter, not read from `identity.ownerActorId`. The caller (notification hook) must pass it. | `resolveInboxActor.js` | No behavior change — the value is the same, just the source changes from implicit identity field to explicit parameter. This enables B3-1. |
| B2-3 | Update the notification hook(s) that call `resolveInboxActor` to derive `ownerActorId` explicitly before the call, not relying on `identity.ownerActorId` from context | Notification hooks calling `resolveInboxActor` | No behavior change. |

**Note on dashboard screens:** Dashboard screens like `VportDashboardBookingHistoryScreen` and `VportDashboardCalendarScreen` pass `params.actorId` as `ownerActorId` — this is the VPORT being viewed, sourced from the URL, not from `identity.ownerActorId`. This is architecturally acceptable. The field name `ownerActorId` is confusing (it means "the vport actor", not "the actor who owns the vport"), but the value is correct. These screens already verify ownership separately via `useVportOwnership`. No change needed to these screens in Batch 2.

---

### Batch 3 — Identity Contract Cleanup

**Principle:** After all direct `identity.ownerActorId` consumers have been refactored (Batch 2), the field can be removed from `toPublicIdentity()`.

| Fix ID | Action | Files Touched | Behavior Change |
|---|---|---|---|
| B3-1 | Remove `ownerActorId` from `toPublicIdentity()` | `identity.model.js:7` | Breaking for any consumer still reading `identity.ownerActorId` — must verify zero remaining consumers first |
| B3-2 | Audit the hydrator: `ownerActorId` is still derived internally and attached to `identityDetails` (private). Keep the internal derivation — it can stay on `identityDetails` as a private field used only by notification resolution. Only the public surface is the target. | `vcsmActorHydrator.js` | No change to hydration logic. |
| B3-3 | Remove `ownerActorId` from `mapVportActor()` output if it was added there (verify — currently it's added by the hydrator post-map, not by `mapVportActor` itself) | `identity.model.js` | N/A — verify current state first |

**Gate before B3-1:** Run the grep for `identity\.ownerActorId` and `\.ownerActorId\b` across all `src/` files. Zero results required before removing the field.

---

### Batch 4 — DB / Migration Cleanup

**Principle:** Schema changes. Never pushed by Claude. Owner deploys manually.

| Fix ID | Action | Migration Required | Notes |
|---|---|---|---|
| B4-1 | Backfill `vc.actor_owners` for any VPORT actors that are present in `user_app_actor_links` but missing a corresponding `actor_owners` row. This must run before B1-1 is deployed so that removing the fallback does not orphan legitimate VPORTs. | YES — write to `supabase/migrations/` | Query: INSERT INTO vc.actor_owners(actor_id, user_id, is_primary) SELECT a.id, p.owner_user_id, true FROM vc.actors a JOIN vport.profiles p ON p.id = a.vport_id WHERE a.kind='vport' AND p.owner_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = a.id) |
| B4-2 | Add DB-level sync: when `vc.actor_owners.is_void` is set to true, set corresponding `platform.user_app_actor_links.status='revoked'`. Implement as a trigger on `vc.actor_owners` AFTER UPDATE. | YES — write to `supabase/migrations/` | Trigger scope: only for the VCSM app actor links (filter by `actor_source='vc'`). Cross-schema trigger: vc → platform. |
| B4-3 | Drop `vport.profile_actor_access` table — after B1-1 is deployed and confirmed in production with no errors | YES — write to `supabase/migrations/` | Verify no other code queries this table before dropping. |
| B4-4 | Drop `vport.profiles.owner_user_id` column — after B1-2, B1-3 are deployed and confirmed, and all RLS policies referencing the column have been updated | YES — write to `supabase/migrations/` | Must audit all remaining RLS policies. Check CARNAGE note in assertActorOwnsVportActor.controller.js about `actor_can_manage_profile` legacy branch. |

**Migration sequence:** B4-1 MUST deploy before B1-1 goes to production.

---

### Batch 5 — Tests and Docs

| Fix ID | Action |
|---|---|
| B5-1 | Add regression test: hydrator with `actor_owners` returning null must produce `ownerActorId=null` (not fall back to profile_actor_access) |
| B5-2 | Add regression test: `listOwnerBookingResources` with mismatched `requestActorId` and `ownerActorId` must throw |
| B5-3 | Add regression test: `readVportBusinessCardSettingsDAL` — user without actor_owners row gets null, not the data |
| B5-4 | Add identity contract snapshot test: `toPublicIdentity()` returns only `{actorId, kind, realmId}` after Batch 3 |
| B5-5 | Update Logan documentation for identity contract shape post-Batch 3 |

---

## 5. Per-Finding Remediation Plans

---

### SEC-01 — profile_actor_access fallback in hydrator

**ID:** SEC-01  
**Classification:** Security Blocker  
**Current Risk:** A VPORT can acquire an `ownerActorId` from `vport.profile_actor_access` even if its `vc.actor_owners` row is void or missing. This means a user whose ownership was revoked in `actor_owners` but whose `profile_actor_access` row was not cleaned up can still hydrate as the owner of a VPORT.

**Files Affected:**
- [apps/VCSM/src/features/hydration/vcsmActorHydrator.js](apps/VCSM/src/features/hydration/vcsmActorHydrator.js) lines 64–73

**Exact code to remove:**
```javascript
if (!ownerActorId && vport?.id) {
  const { data: accessRow } = await supabaseClient
    .schema("vport")
    .from("profile_actor_access")
    .select("actor_id")
    .eq("profile_id", vport.id)
    .eq("is_primary", true)
    .maybeSingle();
  ownerActorId = accessRow?.actor_id ?? null;
}
```

**Safe Fix Direction:** Remove the entire fallback block. If `readActorOwnerUserDAL(actor.id)` returns null, `ownerActorId` stays null. The VPORT hydrates without an `ownerActorId`. Callers that require `ownerActorId` (e.g., `resolveInboxActor`) will see null and handle it gracefully (already has a null guard at line 32).

**Breaking Risk:** LOW — provided B4-1 (actor_owners backfill) runs in DB before this code change is deployed. If any legitimate VPORT has no `actor_owners` row, that must be resolved at the DB layer first.

**Prerequisite:** B4-1 (DB backfill migration) must be deployed first.

**DB Migration Required:** YES — B4-1 backfill must run before this code deploys.

**Tests Required:** Regression — hydrator produces `ownerActorId=null` for VPORT with no `actor_owners` row. Regression — hydrator produces correct `ownerActorId` for VPORT with valid `actor_owners` row.

---

### SEC-02 — owner_user_id in readVportBusinessCardSettingsDAL

**ID:** SEC-02  
**Classification:** Security Blocker  
**Current Risk:** `readVportBusinessCardSettingsDAL` enforces ownership via `owner_user_id = auth.uid()`. If a user's `actor_owners` link is revoked but `owner_user_id` is not cleared, they can still read business card settings.

**Files Affected:**
- [apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js](apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js) lines 101–120

**Current code (lines 107–115):**
```javascript
const { data, error } = await vportSchema
  .from("profiles")
  .select("id,business_card_settings")
  .eq("id", vportId)
  .eq("owner_user_id", userId)
  .maybeSingle();
```

**Safe Fix Direction:** Replace the `owner_user_id` filter with an `actor_owners`-based ownership check. The DAL should:
1. Get the calling user's `userId` from `auth.getUser()`
2. Find the `vc.actors` row where `vport_id = vportId` and `kind = 'vport'`
3. Verify there is a non-void `actor_owners` row for `(actor_id, user_id)`
4. If ownership confirmed, select the profile data (without the `owner_user_id` filter — RLS provides the row-level guard)

**Alternative (simpler):** Call the existing `assertActorOwnsVportActorController` from the DAL's controller layer before the DAL read. The controller `ctrlGetVportBusinessCardSettings` already calls this gate — the DAL's own `owner_user_id` filter is redundant defense. Remove it from the DAL and let the controller-level gate be the sole enforcer.

**Breaking Risk:** NONE for legitimate owners. The controller gate already runs before this DAL — removing the redundant filter from the DAL changes nothing for valid flows.

**DB Migration Required:** NO — code-only change.

**Tests Required:** Verify null return when actor_owners link is void (requires test with mocked actor_owners state).

---

### SEC-03 — owner_user_id in readVportDirectoryStateDAL

**ID:** SEC-03  
**Classification:** Security Blocker  
**Current Risk:** Same as SEC-02 but for `readVportDirectoryStateDAL`.

**Files Affected:**
- [apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js](apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js) lines 121–140

**Safe Fix Direction:** Identical to SEC-02. Remove `owner_user_id` filter; rely on controller-level ownership gate.

**Breaking Risk:** NONE for legitimate owners.

**DB Migration Required:** NO.

**Tests Required:** Same as SEC-02.

---

### SEC-04 — actor_owners ↔ user_app_actor_links divergence on revocation

**ID:** SEC-04  
**Classification:** Security Blocker  
**Current Risk:** When `vc.actor_owners.is_void` is set to true (ownership revoked), the corresponding `platform.user_app_actor_links` row remains `status='active'`. On the next identity resolution, the engine reads `user_app_actor_links` with `status='active'` (verified in `vcsmIdentity.resolver.js:39` and `actorLinks.read.dal.js:52`) and still includes the revoked actor in `availableActors`. The revoked user can still switch to the VPORT actor.

**Files Affected:**
- Engine: `engines/identity/src/dal/actorLinks.read.dal.js` — reads `status='active'` without cross-checking `actor_owners.is_void`
- App: `apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js` — same
- DB: No trigger exists to sync these two tables

**Safe Fix Direction:** DB migration — add an `AFTER UPDATE` trigger on `vc.actor_owners`: when `is_void` is set to `true`, update `platform.user_app_actor_links SET status='revoked' WHERE actor_id = NEW.actor_id AND actor_source = 'vc'`. This is a cross-schema write (vc → platform) but PostgreSQL allows it within the same DB.

**Alternative (code path):** Add a sync step to the actor_owners void write path in application code. Wherever `actor_owners.is_void` is set, also call a function to revoke the corresponding actor links.

**Breaking Risk:** LOW — the trigger only fires on `is_void` being set to true, which should only happen during owner removal flows. No normal flows set `is_void=true`.

**DB Migration Required:** YES — trigger creation. Write to `supabase/migrations/`.

**Tests Required:** Integration test: set `actor_owners.is_void=true` → verify `user_app_actor_links.status` becomes `'revoked'` → verify actor no longer appears in `availableActors` on next identity load.

---

### CON-01 — ownerActorId in toPublicIdentity()

**ID:** CON-01  
**Classification:** Contract Violation  
**Current Risk:** Any component with access to `useIdentity()` can read `identity.ownerActorId`. This leaks a derived ownership field into the UI layer. It creates a dependency where the UI knows about ownership relationships that should be opaque.

**Files Affected:**
- [apps/VCSM/src/state/identity/identity.model.js](apps/VCSM/src/state/identity/identity.model.js) line 7

**All Known Direct Consumers of identity.ownerActorId:**

From source verification — the ONLY confirmed direct read of `identity.ownerActorId` is:
- `resolveInboxActor.js:32` — `if (!identity.ownerActorId)`
- `resolveInboxActor.js:48` — `myActorId: identity.ownerActorId`

Dashboard screens that pass `ownerActorId` to hooks/controllers get their value from `params.actorId` (URL), NOT from `identity.ownerActorId`. Example: `VportDashboardBookingHistoryScreen` line 10: `const targetActorId = params?.actorId ?? null` — this is then passed as `ownerActorId`. This is not a consumer of `identity.ownerActorId`.

**Safe Fix Direction:**
1. First, refactor `resolveInboxActor.js` (CON-03) to accept `ownerActorId` as an explicit parameter.
2. Then, run the grep for all remaining reads of `identity.ownerActorId` and `.ownerActorId` on the public identity object.
3. Only after zero consumers confirmed: remove `ownerActorId` from `toPublicIdentity()`.

**Breaking Risk:** HIGH if done before CON-03 is resolved. LOW after all consumers refactored.

**DB Migration Required:** NO.

**Tests Required:** Snapshot test: `toPublicIdentity()` output shape is `{actorId, kind, realmId}` only.

---

### CON-02 — listOwnerBookingResources has no ownership gate

**ID:** CON-02  
**Classification:** Contract Violation + Functional Bug  
**Current Risk:** `listOwnerBookingResourcesController` accepts `ownerActorId` from the caller and reads from the DAL without verifying that the calling session owns the specified VPORT actor.

**Current code:**
```javascript
export async function listOwnerBookingResourcesController({
  ownerActorId,
  includeInactive = false,
} = {}) {
  if (!ownerActorId) {
    throw new Error("listOwnerBookingResourcesController: ownerActorId is required");
  }
  const rows = await listBookingResourcesByOwnerActorIdDAL({ ownerActorId, includeInactive });
  return mapBookingResourceRows(rows);
}
```

**Note on callers:** All production callers currently pass an `ownerActorId` that was sourced from `params.actorId` (URL), and they separately verify ownership via `useVportOwnership`. So there is no actual unauthorized access happening today. But the controller is not self-defending — it trusts the caller.

**Files Affected:**
- [apps/VCSM/src/features/booking/controller/listOwnerBookingResources.controller.js](apps/VCSM/src/features/booking/controller/listOwnerBookingResources.controller.js)

**Safe Fix Direction:** Add `requestActorId` as a required parameter. Call `assertActorOwnsVportActorController({ requestActorId, targetActorId: ownerActorId })` before the DAL read. All callers must pass `requestActorId` (which is always `identity.actorId`).

**Breaking Risk:** MEDIUM — requires updating all callers (hooks that invoke this controller) to pass `requestActorId`. The hook `useOwnerBookingResources` must accept and forward `requestActorId`.

**DB Migration Required:** NO.

**Tests Required:** Test that calling with mismatched requestActorId throws ownership error.

---

### CON-03 — resolveInboxActor reads identity.ownerActorId directly

**ID:** CON-03  
**Classification:** Contract Violation  
**Current Risk:** `resolveInboxActor.js` is the sole gatekeeper for notifications inbox actor resolution. It reads `identity.ownerActorId` directly from the public identity contract. This is the primary blocking dependency for CON-01.

**Current code (resolveInboxActor.js:13):**
```javascript
// Identity shape (LOCKED):
// {
//   kind: "user" | "vport",
//   actorId,
//   ownerActorId
// }
```

**Lines 32 and 48:** Direct reads of `identity.ownerActorId`.

**Files Affected:**
- [apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js](apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js)
- Notification hooks that call `resolveInboxActor(identity)` — must be updated to pass ownerActorId explicitly

**Safe Fix Direction:**
- Change `resolveInboxActor(identity)` signature to `resolveInboxActor({ actorId, kind, ownerActorId })` — accepting all three fields as explicit parameters.
- Update callers to pass `ownerActorId` explicitly. The value comes from `identityDetails.ownerActorId` (the private identityDetails object, not the public identity). This field can remain on `identityDetails` even after it is removed from `toPublicIdentity()`.
- Update the JSDoc comment in `resolveInboxActor.js` to remove the "LOCKED" identity shape contract.

**Breaking Risk:** LOW — only changes the calling convention, not the logic.

**DB Migration Required:** NO.

**Tests Required:** Test that `resolveInboxActor` with explicit `null` ownerActorId when kind='vport' returns `{targetActorId, myActorId: null}`.

---

### CON-04 — ownerUserId exposed in VPORT profile mapper

**ID:** CON-04  
**Classification:** Contract Violation  
**Current Risk:** `mapVportProfile()` in the settings profile model returns `ownerUserId: row.owner_user_id ?? null`. Any UI component that reads from this model can access `ownerUserId` directly.

**Files Affected:**
- [apps/VCSM/src/features/settings/profile/model/profile.model.js](apps/VCSM/src/features/settings/profile/model/profile.model.js) line 73

**Safe Fix Direction:** Remove `ownerUserId` from the returned object in `mapVportProfile()`. Before removing, search all consumers of the profile model for reads of `.ownerUserId`. If no consumers depend on it, remove it directly.

**Breaking Risk:** LOW — this is a read-only field in the model. If any UI component uses it, it would be obvious in the UI. Search: `rg "ownerUserId\|owner_user_id" apps/VCSM/src/features/settings/profile` before removing.

**DB Migration Required:** NO.

**Tests Required:** Snapshot test of `mapVportProfile()` output shape.

---

### ARC-01 — getFeedViewerContext routes through profile_id

**ID:** ARC-01  
**Classification:** Architecture Cleanup  
**Current Risk:** Low. This is a read-only operation. But it violates the actor-first principle — adult status should be an actor-level property, not a profile-level lookup.

**Files Affected:**
- [apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js](apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js) lines 10–15
- Associated DAL: `feed.read.viewerContext.dal.js`

**Current code:**
```javascript
const actor = await readViewerActorIdentityDAL({ actorId: viewerActorId });
if (actor?.vport_id) return true;
if (!actor?.profile_id) return null;
const profile = await readProfileAdultFlagDAL({ profileId: actor.profile_id });
return profile?.is_adult ?? null;
```

**Safe Fix Direction:** The `is_adult` flag is on `public.profiles`. The actor row has `profile_id`. The current code is: actor → profile_id → profiles.is_adult. This is the correct join — there is no actor-level `is_adult` field. The issue is cosmetic: the code is using the profile as a lookup, which is acceptable because `is_adult` is inherently a user-level attribute stored on profiles. The route is: actorId → actor.profile_id → profiles.is_adult. This cannot be fully removed until `is_adult` is migrated to an actor-level or user-level table. For now, the fix is to acknowledge this is an acceptable lookup (not a bypass) and document it, or move the lookup into the DAL layer so the controller does not see `profile_id`.

**Breaking Risk:** NONE.

**DB Migration Required:** NO — code-only cleanup.

---

### LEG-01 — Post dual-writes user_id + actor_id

**ID:** LEG-01  
**Classification:** Legacy Migration  
**Current Risk:** LOW. `user_id` is stored in the posts table alongside `actor_id`. This is backward-compatible data. No security risk — both fields belong to the same user. The issue is architectural redundancy.

**Files Affected:**
- [apps/VCSM/src/features/upload/controllers/createPost.controller.js](apps/VCSM/src/features/upload/controllers/createPost.controller.js) lines 73–74

**Safe Fix Direction:** Before removing `user_id` from the insert row, confirm: (1) no read queries filter posts by `user_id`, (2) no RLS policy on `vc.posts` uses `user_id`, (3) the `user_id` column can be dropped from the posts table. This requires a full audit of the posts table RLS and all read DALs. This is a P2 fix — safe to defer.

**Breaking Risk:** MEDIUM without audit. Unknown until read path is fully checked.

**DB Migration Required:** Potentially YES — column drop from posts table (long-term).

---

### LEG-02 — barberVport.read.dal.js pre-provisioning path

**ID:** LEG-02  
**Classification:** Legacy Migration — Acceptable Use  
**Current Risk:** MEDIUM. The `owner_user_id` query here is documented as running before actor provisioning. This is a structural constraint: no actor exists yet, so actor-based ownership cannot be enforced. However, this creates a window where ownership is user-scoped rather than actor-scoped.

**Files Affected:**
- [apps/VCSM/src/features/join/dal/barberVport.read.dal.js](apps/VCSM/src/features/join/dal/barberVport.read.dal.js) lines 3–38

**Safe Fix Direction:** Add a guard in the callers of this DAL ensuring it is only ever called in the provisioning context (i.e., before `user_app_actor_links` row for the barber VPORT actor exists). Post-provisioning, any read of a barber VPORT must route through actor-based ownership. The DAL itself should be marked with a clear warning and a context guard parameter.

**Breaking Risk:** LOW — this is a provisioning-only path.

**DB Migration Required:** NO.

---

## 6. Do Not Touch List

The following files and fields must NOT be modified until the specified prerequisites are complete.

| File / Field | Reason Not To Touch Yet | Required Before Touching |
|---|---|---|
| `toPublicIdentity()` in `identity.model.js` — `ownerActorId` field | 326 occurrences reference `ownerActorId` across the codebase. Most come from `params.actorId`, not `identity.ownerActorId`, but full consumer map must be verified | CON-03 resolved + zero `identity.ownerActorId` direct reads confirmed by grep |
| `resolveInboxActor.js` JSDoc "LOCKED" identity shape | Contains `ownerActorId` in contract doc. Remove only after refactor is done and callers updated | CON-03 code refactored first |
| `vcsmActorHydrator.js` — ownerActorId derivation (the `readActorOwnerUserDAL` + `readUserActorByProfileIdDAL` chain) | `ownerActorId` still needs to be on `identityDetails` even after it is removed from the public contract. The hydrator must continue computing it internally. | Batch 3 complete (after it is no longer on toPublicIdentity, only on identityDetails) |
| `engines/booking/src/controller/assertActorOwnsVportActor.controller.js` — `profile_id` usage | This controller reads `requester.profile_id` from the actor row and uses it as the `user_id` in the `actor_owners` query. This is how the ownership link is stored — `actor_owners.user_id = profiles.id`. This is correct behavior, not a bug. Cannot remove until `actor_owners.user_id` column is renamed or the ownership resolution path changes. | P3 architectural change (long-term) |
| `ACTOR_COLUMNS` in `identity.read.dal.js` | `profile_id` and `vport_id` are FKs used in hydration (`actor.profile_id` → profile lookup, `actor.vport_id` → vport lookup). Cannot be removed from SELECT until hydration no longer needs these join keys. | Long-term actor model completion |
| `barberVport.read.dal.js` — both functions | Pre-provisioning path. Must stay until actor provisioning happens earlier in the join flow OR the join flow is redesigned. | Join flow architectural review |
| `vport.profiles.owner_user_id` DB column | Still referenced in RLS policies and in multiple migration files. Drop only after all code references removed and all RLS policies updated | B4-4 prerequisites complete |
| `vport.profile_actor_access` table | Do not drop until SEC-01 code change is deployed and confirmed stable in production with zero errors | B1-1 deployed + B4-3 timing confirmed |
| `user_id` column in posts table | Cannot drop until all post read queries confirmed to not filter by `user_id` | Full post read path audit |

---

## 7. First Implementation Batch (Batch 1 Detail)

This is the safest batch. All five fixes are surgical and have no behavior change for legitimate production flows.

**Prerequisite before starting Batch 1:**
- B4-1 (actor_owners backfill migration) must be written and queued for deployment. Code changes in B1-1 should go to production only AFTER the DB migration has run.
- Search `rg "ownerUserId\|\.ownerUserId" apps/VCSM/src` to confirm no consumers of the `ownerUserId` field from the profile model before removing it in B1-4.

---

### B1-1: Remove profile_actor_access fallback from vcsmActorHydrator.js

**File:** [apps/VCSM/src/features/hydration/vcsmActorHydrator.js](apps/VCSM/src/features/hydration/vcsmActorHydrator.js)

**Remove (lines 64–73):**
```javascript
if (!ownerActorId && vport?.id) {
  const { data: accessRow } = await supabaseClient
    .schema("vport")
    .from("profile_actor_access")
    .select("actor_id")
    .eq("profile_id", vport.id)
    .eq("is_primary", true)
    .maybeSingle();
  ownerActorId = accessRow?.actor_id ?? null;
}
```

**Also remove** the `supabase as supabaseClient` import if it is only used by this block.

**Result:** `ownerActorId` is sourced exclusively from `readActorOwnerUserDAL` → `vc.actor_owners`. If no ownership row exists, `ownerActorId` is null.

**Deploy after:** B4-1 migration.

---

### B1-2: Replace owner_user_id in readVportBusinessCardSettingsDAL

**File:** [apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js](apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js)

**Current (lines 107–115):**
```javascript
const { data, error } = await vportSchema
  .from("profiles")
  .select("id,business_card_settings")
  .eq("id", vportId)
  .eq("owner_user_id", userId)
  .maybeSingle();
```

**Replacement direction:** Remove the `owner_user_id` filter. The controller (`ctrlGetVportBusinessCardSettings`) already calls `assertActorOwnsVportActorController` before reaching this DAL — the controller gate is the authority. The DAL's own `owner_user_id` filter is redundant and uses the wrong ownership model.

After removing the filter, the query becomes:
```javascript
const { data, error } = await vportSchema
  .from("profiles")
  .select("id,business_card_settings")
  .eq("id", vportId)
  .maybeSingle();
```

The RLS policy on `vport.profiles` governs what rows are visible at the DB layer. Since the controller has already asserted ownership, this DAL read is authorized by that gate.

**Note:** Verify the current RLS policy on `vport.profiles` SELECT allows the authenticated user to read rows they own (via actor_owners, not owner_user_id). If the RLS policy also uses `owner_user_id`, that must be updated in a migration.

---

### B1-3: Replace owner_user_id in readVportDirectoryStateDAL

**File:** [apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js](apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js)

Same approach as B1-2. Remove `.eq("owner_user_id", userId)` from lines 130–132. The controller layer owns the authorization gate.

---

### B1-4: Remove ownerUserId from mapVportProfile()

**File:** [apps/VCSM/src/features/settings/profile/model/profile.model.js](apps/VCSM/src/features/settings/profile/model/profile.model.js)

**Prerequisite grep:** `rg "\.ownerUserId\b" apps/VCSM/src` — must return zero results before removing.

**Remove line 73:**
```javascript
ownerUserId: row.owner_user_id ?? null,
```

**Also:** Remove `owner_user_id` from the SELECT clause in the DAL that feeds this mapper, if it is fetching the column only for this field.

---

### B1-5: Fix getFeedViewerContext adult gate

**File:** [apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js](apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js)

**Current (lines 10–15):**
```javascript
const actor = await readViewerActorIdentityDAL({ actorId: viewerActorId });
if (actor?.vport_id) return true;
if (!actor?.profile_id) return null;
const profile = await readProfileAdultFlagDAL({ profileId: actor.profile_id });
return profile?.is_adult ?? null;
```

**Safe Fix:** Move the `profile_id` lookup into the DAL layer so the controller never sees `profile_id`. Create (or use) a DAL function `readAdultFlagByActorIdDAL({ actorId })` that internally joins `vc.actors.profile_id` → `public.profiles.is_adult`. The controller then calls:
```javascript
const isAdult = await readAdultFlagByActorIdDAL({ actorId: viewerActorId });
return isAdult;
```

The profile_id FK still exists inside the DAL — this is acceptable since the controller no longer routes through it.

---

## 8. B4-1 Migration Specification (Required Before B1-1 Deploys)

**Migration name:** `YYYYMMDDHHMMSS_backfill_actor_owners_for_vport_actors.sql`

**Write to:** `supabase/migrations/`

**Purpose:** Ensure every VPORT actor that exists in `user_app_actor_links` has a corresponding `actor_owners` row. This allows SEC-01 code change to remove the `profile_actor_access` fallback without orphaning legitimate VPORTs.

**Logic:**
```sql
-- Backfill actor_owners for vport actors that have an owner_user_id on the profile
-- but no corresponding actor_owners row.
INSERT INTO vc.actor_owners (actor_id, user_id, is_primary, is_void, created_at)
SELECT
  a.id          AS actor_id,
  p.owner_user_id AS user_id,
  true          AS is_primary,
  false         AS is_void,
  now()         AS created_at
FROM vc.actors a
JOIN vport.profiles p ON p.id = a.vport_id
WHERE a.kind = 'vport'
  AND a.is_deleted = false
  AND a.is_void    = false
  AND p.owner_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM vc.actor_owners ao
    WHERE ao.actor_id = a.id
      AND ao.is_void = false
  )
ON CONFLICT (actor_id, user_id) DO NOTHING;
```

**Owner deploys this migration manually before B1-1 code is promoted to production.**

---

*Plan generated: 2026-06-06 | Source-verified | No code written | No speculative fixes*  
*Next action: Review plan → approve batches → begin Batch 1 implementation*
