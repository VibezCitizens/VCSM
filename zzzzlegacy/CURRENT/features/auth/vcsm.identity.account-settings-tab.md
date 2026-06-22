# VCSM Settings — Account Tab

> **Version:** 1
> **Created:** 2026-04-20
> **Scope:** Settings → Account tab UI, controller, hook — identity display, sign out, two-step VPORT delete, account deletion

---

## 1. Purpose

The Account tab in Settings is the destructive-action surface for the authenticated user. It handles:

- Displaying the current actor's identity (citizen or VPORT)
- Sign out
- Two-step VPORT deletion (soft → hard)
- Full account deletion

It is explicitly **not** for VPORT switching or management — that lives on the VPORTs tab.

---

## 2. Dual-Mode Design

The tab branches on `identity.kind`:

### Citizen mode (`kind === 'user'`)

- Shows the citizen identity card: `identity.displayName` + `identity.photoUrl` (hydration engine) + Sign out
- Danger zone (collapsible): one row per owned VPORT with delete controls + Delete Account at the bottom

### VPORT mode (`kind === 'vport'`)

- Shows only the currently active VPORT identity card: `identity.displayName`, `identity.username` (= slug), `identity.photoUrl`
- Danger zone (collapsible): only the active VPORT's delete controls
- The citizen identity and other VPORTs are not visible — separation of accounts

**Why:** When acting as a VPORT, exposing other VPORTs or the citizen identity creates confusion and duplication with the VPORTs tab.

---

## 3. Identity Data Source

All display fields come from the **hydration engine** via `useIdentity()`, surfaced through `useAccountController()`.

| Field shown | Source |
|---|---|
| Display name | `identity.displayName` |
| Avatar | `identity.photoUrl` |
| Slug (@handle) | `identity.username` |

**Never** use `user.email`, `user.user_metadata.full_name`, or `user.user_metadata.avatar_url` in this tab.

---

## 4. Architecture Layer

```
AccountTab.view.jsx
  └── useAccountController (hook)
        ├── useAuth            — user, logoutFromAuth
        ├── useIdentity        — identity, availableActors, switchActor
        └── account.controller.js
              ├── ctrlSoftDeleteVport({ vportId })   → dalDeleteMyVport (RPC: vport.soft_delete_vport)
              ├── ctrlHardDeleteVport({ vportId })   → dalHardDeleteVport (RPC: vport.hard_delete_vport)
              ├── ctrlRestoreVport({ vportId })      → vport.core.dal.restoreVport (RPC: vport.restore_vport)
              └── ctrlDeleteAccount()                → dalDeleteCitizenAccountFull → Edge Function

AccountTab.view.jsx
  └── useVportsList (hook)
        └── listMyVportsDAL    — id, name, slug, avatar_url, is_active, is_deleted, actor_id
```

---

## 5. Two-Step VPORT Delete Flow

VPORT deletion is enforced in two explicit steps at both DB and UI layers.

### Step 1 — Soft Delete

- Triggered by: "Delete…" button on a VPORT row where `is_deleted = false`
- Modal: warns this is step 1 of 2, deactivates the VPORT from public view
- On confirm: calls `softDeleteVport(vportId)` → `ctrlSoftDeleteVport` → `dalDeleteMyVport` → RPC `vport.soft_delete_vport`
- On success: updates the local list optimistically — sets `is_deleted: true` on that item
- The VPORT row now shows "Permanently delete" instead of "Delete…"

### Step 2 — Hard Delete

- Triggered by: "Delete permanently" button on a VPORT row where `is_deleted = true`
- Modal: severe warning — text confirmation (type VPORT name) required before confirm enables
- On confirm: calls `hardDeleteVport(vportId)` → `ctrlHardDeleteVport` → `dalHardDeleteVport` → RPC `vport.hard_delete_vport`
- On success: switches actor back to `profile` kind via `switchActor()` (or falls back to localStorage + `actor:changed` event), redirects to `/me`

### Restore

- Triggered by: "Restore" button on a VPORT row where `is_deleted = true`
- Modal: confirms the VPORT will become publicly visible again
- On confirm: calls `restoreVport(vportId)` → `ctrlRestoreVport` → `vport.core.dal.restoreVport` → RPC `vport.restore_vport`
- On success: updates local list (`is_deleted: false` on that item), closes modal

### DB enforcement

The RPC `vport.hard_delete_vport` requires `is_deleted = true` — the two-step flow is not just a UI convention. Calling hard delete without prior soft delete throws `VPORT_NOT_FOUND_OR_NOT_DELETED`.

See `vcsm.vport.delete-lifecycle.md` for full RPC + migration details.

---

## 6. State Model (useAccountController)

```
busySoft / errSoft       — soft delete operation
busyHard / errHard       — hard delete operation
busyRestore / errRestore — restore operation
busyAccount / errAccount — citizen account delete operation
showConfirmAccount       — citizen delete modal open

vportId                  — resolved vport.profiles.id for the active actor (when kind = vport)
                           resolved via ctrlResolveVportIdByActorId(actorId) on mount

availableActors          — from useIdentity — used to find citizen actor for auto-switch after soft delete
switchActor              — from useIdentity — called after soft delete to return to citizen actor
```

**Modal state** (`softTarget`, `hardTarget`, `restoreTarget`, `dangerOpen`) lives in the view — not in the hook.

**Post-soft-delete actor switch:** After a VPORT soft delete while acting as that VPORT, `softDeleteVport` calls `switchActor(citizenActorId)` to return to citizen mode. Falls back to `_switchToProfile()` + `window.location.replace('/me')` if no citizen actor is found or if `switchActor` returns `{ success: false }`.

---

## 7. After Delete Redirect

### VPORT hard delete

Calls `_switchToProfile()` + `window.location.replace('/me')`:

```js
localStorage.setItem('actor_kind', 'profile')
localStorage.removeItem('actor_vport_id')
localStorage.setItem('actor_touch', String(Date.now()))
window.dispatchEvent(new CustomEvent('actor:changed', { detail: { kind: 'profile', id: null } }))
window.location.replace('/me')
```

### Citizen hard delete (deleteAccount)

1. `ctrlDeleteAccount()` → `dalDeleteCitizenAccountFull()` → Edge Function (app data + auth user deleted)
2. Clears localStorage actor keys (`actor_kind`, `actor_vport_id`, `actor_touch`)
3. `logoutFromAuth()` → `supabase.auth.signOut()` → navigates to `/login`

The auth session is invalid after step 1. `supabase.auth.signOut()` in step 3 just clears local tokens — it does not fail if the auth user no longer exists.

---

## 8. CSS Classes

Defined in `apps/VCSM/src/features/settings/styles/settings-modern.css`:

| Class | Use |
|---|---|
| `.settings-identity-card` | Citizen / VPORT identity card container |
| `.settings-section-label` | Uppercase section labels (e.g. "YOUR IDENTITY") |
| `.settings-danger-zone` | Collapsible danger zone outer wrapper |
| `.settings-danger-zone-header` | Clickable header row (toggle) |
| `.settings-danger-zone-body` | Expanded body padding |
| `.settings-danger-row` | Individual danger action row (VPORT or account) |
| `.settings-active-badge` | "Active" pill on the current VPORT |
| `.settings-status-badge--active` | "Live" badge (green) |
| `.settings-status-badge--inactive` | "Inactive" badge (muted) |

---

## 9. Files Map

| File | Role |
|---|---|
| `apps/VCSM/src/features/settings/account/ui/AccountTab.view.jsx` | View — dual-mode layout, `VportDangerRow` (state-aware), `SoftDeleteModal`, `HardDeleteModal`, `RestoreModal` |
| `apps/VCSM/src/features/settings/account/hooks/useAccountController.js` | Hook — `softDeleteVport` (returns bool), `hardDeleteVport`, `restoreVport`, `deleteAccount`; separate busy/error per operation |
| `apps/VCSM/src/features/settings/account/controller/account.controller.js` | `ctrlSoftDeleteVport`, `ctrlHardDeleteVport`, `ctrlRestoreVport`, `ctrlDeleteAccount` |
| `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` | `dalDeleteCitizenAccountFull` (Edge Function), `dalDeleteMyVport`, `dalHardDeleteVport`, `dalRestoreVport` |
| `apps/VCSM/supabase/functions/delete-citizen-account/index.ts` | Edge Function — app data + auth user deletion |
| `apps/VCSM/src/features/settings/vports/hooks/useVportsList.js` | Loads owned VPORTs including `is_deleted` state |
| `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js` | `listMyVportsDAL` — selects `is_deleted` |
| `apps/VCSM/src/features/settings/styles/settings-modern.css` | CSS tokens for settings UI |

---

## 10. Rules / Invariants

1. All display names and avatars must come from `identity.displayName` / `identity.photoUrl` — never from `user.email` or `user_metadata`
2. When `kind === 'vport'` the view renders only the active VPORT — never the citizen card or other VPORTs
3. Hard delete is never shown on a VPORT where `is_deleted = false`
4. Soft delete modal must explain this is step 1 of 2 — the user must understand hard delete follows separately
5. After hard delete, the actor must be switched back to `profile` before redirect
6. The danger zone is collapsed by default — destructive actions are not the first thing visible

---

## 11. Change Log

### 2026-04-20 — Full rebuild (current)

**Task:** Full Account tab rebuild — dual-mode view, hydration engine identity, two-step VPORT delete, citizen soft delete wiring
**Summary:**
- Rebuilt `AccountTab.view.jsx` from scratch — replaced flat layout with dual-mode (citizen / VPORT), collapsible danger zone, two-step delete UX
- Replaced `ctrlDeleteVport` in controller with `ctrlSoftDeleteVport` + `ctrlHardDeleteVport`
- `useAccountController` now exposes `softDeleteVport`, `hardDeleteVport`, `deleteAccount`, `identity`, `vportId`; separate busy/error states per operation
- Identity display moved to hydration engine (`identity.displayName`, `identity.photoUrl`) — removed all `user.email` and `user_metadata` reads from the view
- `listMyVportsDAL` updated to include `is_deleted` so view can branch on soft-delete state per VPORT row
- `deleteAccount` (citizen soft delete) clears localStorage actor keys (`actor_kind`, `actor_vport_id`, `actor_touch`) before calling `logoutFromAuth()` — ensures identity engine is clean on session end
- New CSS classes added to `settings-modern.css`: `.settings-identity-card`, `.settings-danger-zone`, `.settings-danger-zone-header`, `.settings-danger-zone-body`, `.settings-danger-row`, `.settings-active-badge`, `.settings-status-badge--active`, `.settings-status-badge--inactive`

**Files Changed:**
- `apps/VCSM/src/features/settings/account/ui/AccountTab.view.jsx` (full rewrite)
- `apps/VCSM/src/features/settings/account/hooks/useAccountController.js`
- `apps/VCSM/src/features/settings/account/controller/account.controller.js`
- `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js`
- `apps/VCSM/src/features/settings/styles/settings-modern.css` (new classes)

Generated by: Batman

### 2026-04-20 — Session 3

**Task:** VPORT access block — `ctrlRestoreVport` added to controller; restore screen wired
**Summary:**
- `ctrlRestoreVport({ vportId })` added to `account.controller.js` — used by `RestoreVportScreen` to reverse a soft delete
- `/vport/restore` route added — full restore flow when identity engine detects blocked VPORT
- Full access block system documented in `vcsm.identity.vport-access-block.md`

**Files Changed:**
- `apps/VCSM/src/features/settings/account/controller/account.controller.js`

Generated by: Batman

### 2026-04-25 — Session 4 (current)

**Task A — VPORT Danger Zone UI rebuild (Account tab)**
**Summary:**
- `AccountTab.view.jsx` — `VportDangerRow` is now state-aware: active VPORT shows amber "Deactivate…" button; soft-deleted VPORT shows "Deactivated" badge + "Restore" (ghost) + "Delete permanently" (danger red)
- `SoftDeleteModal` — amber confirm button, explains step is reversible
- `HardDeleteModal` — text confirmation input (user must type VPORT name) required before confirm enables
- `RestoreModal` — primary purple confirm, explains VPORT becomes publicly visible again
- `useAccountController` — `softDeleteVport` now returns `true`/`false` boolean; `busyRestore`/`errRestore` state + `restoreVport` function added; uses `availableActors` + `switchActor` from `useIdentity` to return to citizen actor after soft delete; falls back to `_switchToProfile()` + `window.location.replace('/me')` on `switchActor` failure

**Files Changed:**
- `apps/VCSM/src/features/settings/account/ui/AccountTab.view.jsx`
- `apps/VCSM/src/features/settings/account/hooks/useAccountController.js`

**Task B — Citizen hard delete via Edge Function**
**Summary:**
- `ctrlDeleteAccount()` now delegates to `dalDeleteCitizenAccountFull()` which calls the `delete-citizen-account` Edge Function instead of directly calling the soft delete RPC
- Edge Function: verifies JWT → calls `soft_delete_citizen_account()` RPC (app data) → calls `adminClient.auth.admin.deleteUser(user.id)` (auth user). Two-step ordering enforced: app delete must succeed before auth delete is attempted.
- `SUPABASE_SERVICE_ROLE_KEY` is auto-injected into the Edge Function by Supabase — not a manually set secret
- `dalSoftDeleteCitizenAccount()` remains in the DAL — used by the Edge Function server-side via anon client + JWT

**Files Changed:**
- `apps/VCSM/supabase/functions/delete-citizen-account/index.ts` (NEW)
- `apps/VCSM/supabase/functions/delete-citizen-account/deno.json` (NEW)
- `apps/VCSM/src/features/settings/account/dal/account.write.dal.js`
- `apps/VCSM/src/features/settings/account/controller/account.controller.js`

Generated by: Claude
