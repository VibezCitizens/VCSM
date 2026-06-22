# VCSM VPORT Delete Lifecycle

> **Version:** 1
> **Created:** 2026-04-20
> **Scope:** VPORT soft delete + hard delete — DB RPCs, DAL layer, two-step enforcement

---

## 1. Purpose

VPORTs are deleted in two explicit stages: soft delete (reversible) and hard delete (permanent). Hard delete requires soft delete to have been performed first. This two-step model gives owners a recoverable window before data is permanently purged.

---

## 2. Scope

**In scope:**
- `vport.soft_delete_vport(uuid)` RPC
- `vport.restore_vport(uuid)` RPC
- `vport.hard_delete_vport(uuid)` RPC
- DAL wiring in `account.write.dal.js` and `vport.core.dal.js`
- Two-step delete enforcement

**Out of scope:**
- UI confirmation flows (in `AccountTab.view.jsx` → `useAccountController`)
- Actor hard delete (the `vc.actors` row is never deleted — only voided)

---

## 3. Ownership

**Application Scope:** VCSM
**Code Roots:** `apps/VCSM/src/features/settings/account/`, `apps/VCSM/src/features/vport/`
**Schema:** `vport`, `vc`, `identity`, `platform`
**Identity anchor:** `vport.profiles.owner_user_id = auth.uid()`

---

## 4. Database Columns Added

`vport.profiles` has two new columns added in migration `20260420010000_vport_soft_delete_rpc.sql`:

| Column | Type | Notes |
|---|---|---|
| `deleted_at` | TIMESTAMPTZ DEFAULT NULL | Set on soft delete, cleared on restore |
| `deleted_by_actor_id` | UUID DEFAULT NULL | The vport actor that initiated the delete. Set on soft delete, cleared on restore |

Pre-existing columns relied on:

| Column | Behavior |
|---|---|
| `is_deleted` | boolean — already existed. Set to true on soft delete |
| `is_active` | boolean — already existed. Set to false on soft delete |

---

## 5. Pipeline 1: Soft Delete

### RPC — `vport.soft_delete_vport(p_vport_id uuid)`

Migration: `apps/VCSM/supabase/migrations/20260420010000_vport_soft_delete_rpc.sql`

```
1. auth.uid() → AUTH_REQUIRED if null
2. p_vport_id → INVALID_INPUT if null
3. UPDATE vport.profiles
   SET updated_at = now()
   WHERE id = p_vport_id AND owner_user_id = auth.uid() AND is_deleted = false
   RETURNING actor_id INTO v_actor_id
   → VPORT_NOT_FOUND_OR_UNAUTHORIZED if NOT FOUND
4. UPDATE vport.profiles SET
     is_deleted = true, is_active = false,
     deleted_at = now(), deleted_by_actor_id = actor_id (self-ref), updated_at = now()
   WHERE id = p_vport_id
5. RETURN jsonb { ok, vport_id, actor_id }
```

**Design note:** `UPDATE ... RETURNING actor_id INTO v_actor_id` is used instead of `SELECT INTO variable`. Supabase SQL editor rejects `SELECT INTO variable` syntax with `42P01: relation "v_actor_id" does not exist`. The RETURNING pattern is equivalent and executes correctly.

**Effect on public reads:** The existing RLS policy `USING (is_active = true AND is_deleted = false)` on `vport.profiles` immediately hides the vport from all public reads (profile pages, menu, reviews). No view changes needed.

**Actor chain:** NOT touched. `vc.actors.is_void` is NOT set. The `one_void_per_user` UNIQUE constraint `(user_id WHERE is_void=true)` on `vc.actor_owners` would block users who own multiple actors.

### RPC — `vport.restore_vport(p_vport_id uuid)`

Mirror of soft delete:

```
1. auth.uid() → AUTH_REQUIRED if null
2. p_vport_id → INVALID_INPUT if null
3. UPDATE vport.profiles SET updated_at = now()
   WHERE id = p_vport_id AND owner_user_id = auth.uid() AND is_deleted = true
   RETURNING actor_id INTO v_actor_id
   → VPORT_NOT_FOUND_OR_NOT_DELETED if NOT FOUND
4. UPDATE vport.profiles SET
     is_deleted = false, is_active = true,
     deleted_at = NULL, deleted_by_actor_id = NULL, updated_at = now()
   WHERE id = p_vport_id
5. RETURN jsonb { ok, vport_id, actor_id }
```

### Error codes

| DB exception | DAL message |
|---|---|
| `AUTH_REQUIRED` | Not authenticated |
| `VPORT_NOT_FOUND_OR_UNAUTHORIZED` | Vport not found or not owned by you |
| `VPORT_NOT_FOUND_OR_NOT_DELETED` | Vport not found or not currently deleted |

### Grants

```sql
REVOKE EXECUTE ON FUNCTION vport.soft_delete_vport(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION vport.restore_vport(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vport.soft_delete_vport(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION vport.restore_vport(uuid) TO authenticated;
```

---

## 6. Pipeline 2: Hard Delete

### Precondition

`vport.profiles.is_deleted` must be `true` before hard delete is allowed. Attempting hard delete on a non-soft-deleted vport throws `VPORT_NOT_FOUND_OR_NOT_DELETED`.

### RPC — `vport.hard_delete_vport(p_vport_id uuid)`

Migration: `apps/VCSM/supabase/migrations/20260420020000_vport_hard_delete_rpc.sql`

```
1. auth.uid() → AUTH_REQUIRED if null
2. p_vport_id → INVALID_INPUT if null
3. UPDATE vport.profiles SET updated_at = now()
   WHERE id = p_vport_id AND owner_user_id = auth.uid() AND is_deleted = true
   RETURNING actor_id INTO v_actor_id
   → VPORT_NOT_FOUND_OR_NOT_DELETED if NOT FOUND
4. Deletion chain (11 phases, FK-safe order) — see below
5. UPDATE vc.actors SET is_void = true WHERE id = v_actor_id
6. DELETE FROM vport.profiles WHERE id = p_vport_id
7. RETURN jsonb { ok, vport_id, actor_id }
```

### Deletion chain (FK-safe order)

```
Phase 1: vport.fuel_price_submission_reviews (via submissions join)
         vport.fuel_price_submissions WHERE profile_id
         vport.fuel_price_history WHERE profile_id
         vport.fuel_prices WHERE profile_id

Phase 2: vport.bookings WHERE profile_id
         vport.content_pages WHERE profile_id

Phase 3: vport.locksmith_service_areas WHERE actor_id

Phase 4: vc.vport_station_contact_routes WHERE contact_actor_id  ← RESTRICT FK, must go first

Phase 5: vc.vport_actor_menu_item_media WHERE actor_id
         vc.vport_actor_menu_items WHERE actor_id
         vc.vport_actor_menu_categories WHERE actor_id

Phase 6: vc.vport_service_addons (via vport_services join)
         vc.vport_services WHERE actor_id
         vc.vport_rates WHERE actor_id

Phase 7: vc.vport_reviews WHERE target_actor_id
         vc.vport_station_price_settings WHERE target_actor_id
         vc.vport_station_amenities WHERE vport_id (= p_vport_id)

Phase 8: vc.vport_fuel_price_submission_reviews (via submissions join)
         vc.vport_fuel_price_submissions WHERE target_actor_id
         vc.vport_fuel_price_history WHERE target_actor_id
         vc.vport_fuel_prices WHERE target_actor_id

Phase 9: identity.actor_directory WHERE actor_id
         platform.user_app_actor_links WHERE actor_id
         vc.actor_onboarding_steps WHERE actor_id
         vc.actor_owners WHERE actor_id

Phase 10: UPDATE vc.actors SET is_void = true WHERE id = v_actor_id

Phase 11: DELETE vport.profiles WHERE id = p_vport_id
```

### Why the actor is voided, not deleted

`vc.post_comments.actor_id` is `NOT NULL` with a RESTRICT FK to `vc.actors`. `vc.messages.sender_actor_id` is also RESTRICT. Deleting the actor row would cascade-nuke or hard-block on posts, comments, messages, reactions, and follows. Voiding preserves all social content integrity — the actor row remains but is marked as no longer active. Any UI that renders actor-based content should check `is_void = true` and render a placeholder.

### Error codes

| DB exception | DAL message |
|---|---|
| `AUTH_REQUIRED` | Not authenticated |
| `VPORT_NOT_FOUND_OR_NOT_DELETED` | Vport must be soft-deleted before hard delete |

---

## 7. DAL Layer

### `account.write.dal.js`

`apps/VCSM/src/features/settings/account/dal/account.write.dal.js`

| Function | RPC | Notes |
|---|---|---|
| `dalDeleteMyVport(vportId)` | `vport.soft_delete_vport` | Uses `vportSchema` client |
| `dalRestoreVport(vportId)` | `vport.restore_vport` | Uses `vportSchema` client |
| `dalHardDeleteVport(vportId)` | `vport.hard_delete_vport` | Uses `vportSchema` client |
| `dalDeleteOwnedVportById` | direct UPDATE | **Deprecated** — does not set `deleted_at`, no actor chain logic |

### `vport.core.dal.js`

`apps/VCSM/src/features/vport/dal/vport.core.dal.js`

| Function | RPC |
|---|---|
| `softDeleteVport(vportId)` | `vport.soft_delete_vport` |
| `restoreVport(vportId)` | `vport.restore_vport` |
| `hardDeleteVport(vportId)` | `vport.hard_delete_vport` |

All three are exported on the default object.

---

## 8. Rules / Invariants

1. Hard delete requires `is_deleted = true` — the RPC enforces this at DB level
2. Soft delete clears the vport from all public reads immediately (RLS filter: `is_active = true AND is_deleted = false`)
3. `vc.actors` row is NEVER hard-deleted — only `is_void = true` is set
4. `deleted_by_actor_id` is set self-referentially (`= actor_id` from the same row) — not the owner's user actor
5. All three RPCs are `SECURITY DEFINER` — no escalation risk since ownership is checked via `owner_user_id = auth.uid()`
6. `dalDeleteOwnedVportById` is deprecated and must not be used in new code — it bypasses the RPC and does not set `deleted_at`

---

## 9. Failure Risks

1. **Supabase SELECT INTO quirk** — `SELECT actor_id INTO v_var FROM table WHERE ...` inside `SECURITY DEFINER` functions in Supabase SQL editor fails with `42P01: relation "v_var" does not exist`. Always use `UPDATE ... RETURNING col INTO v_var` for the precondition check.
2. **Missing soft delete** — Calling `hard_delete_vport` without soft deleting first will throw `VPORT_NOT_FOUND_OR_NOT_DELETED` — the UI must enforce the two-step flow explicitly.
3. **Actor still void after restore** — There is no restore path for `vc.actors.is_void`. If a vport is soft-deleted and then hard-deleted (void set), it cannot be restored. Restore is only valid on soft-deleted vports that have not been hard-deleted.
4. **Tables not covered** — `vport.resources`, `vport.portfolio_items`, `vport.availability_exceptions`, `vport.availability_rules` are not currently addressed in the hard delete chain. These tables may exist in the DB but their FK columns were unverified at implementation time. If these tables contain rows for the deleted vport, they will persist as orphaned rows until a follow-up migration handles them.

---

## 10. Files Map

| File | Role |
|---|---|
| `apps/VCSM/supabase/migrations/20260420010000_vport_soft_delete_rpc.sql` | Adds `deleted_at`, `deleted_by_actor_id` columns; creates soft delete + restore RPCs |
| `apps/VCSM/supabase/migrations/20260420020000_vport_hard_delete_rpc.sql` | Creates hard delete RPC with full deletion chain |
| `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` | Account settings DAL — `dalDeleteMyVport`, `dalRestoreVport`, `dalHardDeleteVport` |
| `apps/VCSM/src/features/vport/dal/vport.core.dal.js` | Core vport DAL — `softDeleteVport`, `restoreVport`, `hardDeleteVport` |
| `apps/VCSM/src/features/settings/account/controller/account.controller.js` | `ctrlSoftDeleteVport`, `ctrlHardDeleteVport`, `ctrlRestoreVport` |
| `apps/VCSM/src/features/settings/account/hooks/useAccountController.js` | `softDeleteVport`, `hardDeleteVport`, `restoreVport` — separate busy/error state per operation |
| `apps/VCSM/src/features/settings/account/ui/AccountTab.view.jsx` | Dual-mode view — `VportDangerRow` state-aware (active/deactivated); SoftDeleteModal, HardDeleteModal, RestoreModal |
| `apps/VCSM/src/features/settings/vports/hooks/useVportsController.js` | VPORTs tab controller — `restoreVport`, `hardDeleteVport`, `restoreTarget`, `hardDeleteTarget` |
| `apps/VCSM/src/features/settings/vports/ui/VportsTab.view.jsx` | VPORTs tab — "Deactivated VPORTs" section with Recover + Delete permanently actions + inline modals |

---

## 11. Change Log

### 2026-04-20 — Session 1

**Task:** VPORT soft delete + hard delete — migration RPCs + DAL wiring
**Summary:**
- Added `deleted_at`, `deleted_by_actor_id` to `vport.profiles`
- Created `vport.soft_delete_vport` and `vport.restore_vport` RPCs (SECURITY DEFINER)
- Created `vport.hard_delete_vport` RPC — 11-phase FK-safe deletion chain, voids actor instead of deleting
- Wired `dalDeleteMyVport`, `dalRestoreVport`, `dalHardDeleteVport` in `account.write.dal.js`
- Wired `softDeleteVport`, `restoreVport`, `hardDeleteVport` in `vport.core.dal.js`

**Files Changed:**
- `apps/VCSM/supabase/migrations/20260420010000_vport_soft_delete_rpc.sql` (NEW)
- `apps/VCSM/supabase/migrations/20260420020000_vport_hard_delete_rpc.sql` (NEW)
- `apps/VCSM/src/features/settings/account/dal/account.write.dal.js`
- `apps/VCSM/src/features/vport/dal/vport.core.dal.js`

### 2026-04-20 — Session 2

**Task:** Account settings UI rebuild — wire two-step delete into view layer, split controller operations
**Summary:**
- Replaced `ctrlDeleteVport` with `ctrlSoftDeleteVport({ vportId })` + `ctrlHardDeleteVport({ vportId })` in `account.controller.js`; removed deprecated `dalDeleteOwnedVportById` fallback
- Replaced `deleteVport()` with `softDeleteVport(id)` + `hardDeleteVport(id)` in `useAccountController`; separate `busySoft/errSoft` + `busyHard/errHard` states
- Rebuilt `AccountTab.view.jsx` — dual-mode: citizen sees all VPORTs with soft/hard delete; VPORT identity sees only itself
- `listMyVportsDAL` now selects `is_deleted` so view can branch on soft-delete state
- Two-step UX: `is_deleted = false` → soft delete modal ("step 1 of 2"); `is_deleted = true` → hard delete modal ("permanent, no recovery")
- `hardDeleteVport` redirects to `/me` after success and switches actor back to profile

**Files Changed:**
- `apps/VCSM/src/features/settings/account/controller/account.controller.js`
- `apps/VCSM/src/features/settings/account/hooks/useAccountController.js`
- `apps/VCSM/src/features/settings/account/ui/AccountTab.view.jsx`
- `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js` (added `is_deleted` to select)

### 2026-04-25 — Session 4 (current)

**Task A — VPORTs tab: "Deactivated VPORTs" section with Recover + Delete permanently**
**Summary:**
- `VportsTab.view.jsx` — splits `items` into `activeVports` (is_deleted false) and `deactivatedVports` (is_deleted true). Active VPORTs section unchanged. New amber-styled "Deactivated VPORTs" section below: grayscale avatar, name/slug, "Recover" (amber ghost) + "Delete" (danger red) buttons per row.
- Recover flow: `setRestoreTarget(v)` → modal with VPORT preview + explanation → `restoreVport(id)` → optimistic update (`is_deleted: false`) + `refreshAvailableActors()`.
- Delete permanently flow: `setHardDeleteTarget(v)` → modal with text confirmation (type VPORT name) → `hardDeleteVport(id)` → remove from list + `refreshAvailableActors()`.
- `useVportsController.js` — added `restoreTarget`, `setRestoreTarget`, `busyRestore`, `errRestore`, `restoreVport`; `hardDeleteTarget`, `setHardDeleteTarget`, `busyHardDelete`, `errHardDelete`, `hardDeleteVport`; imports `ctrlRestoreVport`, `ctrlHardDeleteVport` from account controller; exposes `refreshAvailableActors`.
- `vports.read.dal.js` fix: removed `business_card_published` from the SELECT query — column does not exist in `vport.profiles`, was causing HTTP 400 and making `items = []` (deactivated VPORTs not visible).

**Task B — Identity auto-switch safety net**
**Summary:**
- `identityContext.jsx` — added `useEffect` watching `blockedVport` (computed: `identity.kind === 'vport' && (isDeleted || isVoid || isActive === false)`). When true, finds the citizen actor in `availableActors` and calls `switchActor()` to auto-return to citizen mode. Fires once; after switch `blockedVport` becomes false — no loop. This is a systemic safety net for all routes not covered by `BlockedVportGuard`.

**Files Changed:**
- `apps/VCSM/src/features/settings/vports/ui/VportsTab.view.jsx`
- `apps/VCSM/src/features/settings/vports/hooks/useVportsController.js`
- `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js` (removed `business_card_published` from SELECT)
- `apps/VCSM/src/state/identity/identityContext.jsx`

Generated by: Claude

### 2026-04-20 — Session 3

**Task:** VPORT access block — identity-level guard, route protection, restore screen, switch guard
**Summary:**
- `ctrlRestoreVport({ vportId })` added to `account.controller.js` — delegates to `vport.core.dal.restoreVport`
- `BlockedVportGuard` route component wraps all `/actor/:actorId/dashboard*` and `/actor/:actorId/settings` routes — redirects to `/vport/restore` when `blockedVport === true`
- `/vport/restore` route added — renders `RestoreVportScreen`
- `RestoreVportScreen` resolves `vportId` via `ctrlResolveVportIdByActorId`, shows block reason, calls `ctrlRestoreVport` then `switchActor` on success
- `resolveVportSlugDAL` now filters `is_deleted = false` — deleted VPORTs no longer resolve from public slugs
- `switchToVport` in `useVportSwitch` guards on `v.is_deleted` — blocked VPORTs cannot be switched to; `onBlocked` callback fires toast
- See `vcsm.identity.vport-access-block.md` for full system documentation

**Files Changed:**
- `apps/VCSM/src/features/settings/account/controller/account.controller.js`
- `apps/VCSM/src/features/vport/screens/RestoreVportScreen.jsx` (NEW)
- `apps/VCSM/src/app/routes/protected/app.routes.jsx`
- `apps/VCSM/src/app/routes/index.jsx`
- `apps/VCSM/src/features/settings/vports/hooks/useVportSwitcher.js`
- `apps/VCSM/src/features/settings/vports/hooks/useVportsController.js`
- `apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js`

Generated by: Batman

### 2026-05-10 — Session 5

**Task A — Feed visibility: fail-closed on missing vport.profiles row**
**Summary:**
- `feedRowVisibility.model.js` — changed VPORT block from fail-open to fail-closed. Previously: `vportEntry === null → visible`. Now: `vportEntry === null → { visible: false, reason: "missing_vport_profile" }`. Orphaned `vc.actors` rows with `kind: 'vport'` but no `vport.profiles` row are now hidden in the feed instead of rendering as visible posts.
- `feed.read.actorsBundle.dal.js` — changed VPORT data source from `vport.public_traze_profiles_v` (TRAZE directory view) to `vport.profiles` directly. Now selects `actor_id, name, slug, avatar_url, is_active, is_deleted`. Also added `.eq("is_deleted", false)` to `vc.actors` and `public.profiles` queries — deleted actors and profiles no longer populate the actor map.
- Privacy query scoped to `uncachedIds` only (was `uniqueActorIds` — queried all actors including cached ones).

**Task B — Profile route gate: UnavailableProfileGate**
**Summary:**
- `vportPublicDetails.read.dal.js` — added `is_deleted,` to SELECT. Previously missing, preventing the model from reflecting deletion state.
- `mapVportPublicDetails.model.js` — added `isDeleted: raw.is_deleted ?? false` to model output.
- NEW: `apps/VCSM/src/features/profiles/model/isDeletedProfileActor.model.js` — pure model helper. Returns `true` if `isDeleted === true` OR `isActive === false`.
- NEW: `apps/VCSM/src/features/profiles/ui/UnavailableProfileGate.jsx` — rose-toned gate UI component with i18n support (badge / title / subtitle). Matches `PrivateProfileGate` structure.
- NEW: `apps/VCSM/src/features/profiles/adapters/ui/UnavailableProfileGate.adapter.js` — cross-feature export adapter.
- `VportProfileViewScreen.jsx` — extended `isVportUnavailable` check to cover both `publicDetails === null` (no vport.profiles row) and `isDeletedProfileActor(...)`. Renders `UnavailableProfileGate` in either case.
- `resolveActorSlug.dal.js` — added `.eq('is_deleted', false)` to the `vc.actors` query in the username fallback path — deleted Citizen actors no longer resolve via slug.
- i18n: added `unavailableGate` keys to `apps/VCSM/src/i18n/en/profile.json` and `apps/VCSM/src/i18n/es/profile.json`.

**Files Changed:**
- `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js`
- `apps/VCSM/src/features/feed/model/feedRowVisibility.model.js`
- `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/model/mapVportPublicDetails.model.js`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`
- `apps/VCSM/src/features/profiles/dal/resolveActorSlug.dal.js`
- `apps/VCSM/src/features/profiles/model/isDeletedProfileActor.model.js` (NEW)
- `apps/VCSM/src/features/profiles/ui/UnavailableProfileGate.jsx` (NEW)
- `apps/VCSM/src/features/profiles/adapters/ui/UnavailableProfileGate.adapter.js` (NEW)
- `apps/VCSM/src/i18n/en/profile.json`
- `apps/VCSM/src/i18n/es/profile.json`

Generated by: Wolverine
