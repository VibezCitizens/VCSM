# VCSM — VPORT Access Block System

> **Version:** 1
> **Created:** 2026-04-20
> **Scope:** Identity-level block guard, route protection, restore screen, switch guard, public DAL filter

---

## 1. Purpose

When a VPORT is soft-deleted, voided, or inactive, the identity engine detects the blocked state and prevents the user from using that VPORT as their active actor. This system:

- Marks the identity context as `blockedVport = true` when the active actor is a VPORT in a blocked state
- Redirects all protected VPORT dashboard/settings routes to `/vport/restore`
- Blocks switching to a deleted VPORT with a toast notification
- Filters deleted VPORTs from public slug resolution
- Provides a restore screen at `/vport/restore` to recover a soft-deleted VPORT

---

## 2. What Triggers a Block

A VPORT is considered blocked when ALL of the following are true:
- `identity.kind === 'vport'` — the current actor is a VPORT
- AND any of:
  - `identity.isDeleted === true` — soft-deleted via `vport.soft_delete_vport`
  - `identity.isVoid === true` — actor has been voided (post hard-delete of another vport, or other void path)
  - `identity.isActive === false` — VPORT deactivated

---

## 3. Architecture

```
readVportIdentityDAL          — selects is_deleted from vport.profiles
  ↓
mapVportActor                 — maps isDeleted: vport?.is_deleted ?? false
  ↓
identityContext               — computes blockedVport boolean
  ↓
BlockedVportGuard (route)     — redirects /actor/:actorId/dashboard* and /actor/:actorId/settings
  ↓
RestoreVportScreen            — /vport/restore — shows reason, restore button, settings link
```

---

## 4. Identity Layer Changes

### `identity.read.dal.js` — `readVportIdentityDAL`

`is_deleted` added to the select:
```js
.select("id,owner_user_id,name,slug,avatar_url,bio,is_active,is_deleted,banner_url,created_at,updated_at")
```

### `identity.controller.js` — `mapVportActor`

`isDeleted` mapped:
```js
isDeleted: vport?.is_deleted ?? false,
```

### `identityContext.jsx` — `IdentityProvider`

`blockedVport` computed and exposed in context:
```js
const blockedVport =
  identity?.kind === 'vport' &&
  (identity?.isDeleted === true || identity?.isVoid === true || identity?.isActive === false)
```

Exposed as `{ ..., blockedVport }` in the context value.

---

## 5. Route Protection

### `BlockedVportGuard`

Inline component in `app.routes.jsx`:
```js
function BlockedVportGuard() {
  const { identity, loading, blockedVport } = useIdentity()
  if (loading) return null
  if (!identity) return <Navigate to="/feed" replace />
  if (blockedVport) return <Navigate to="/vport/restore" replace />
  return <Outlet />
}
```

Wraps all VPORT-owner routes:
- `/actor/:actorId/dashboard` and all sub-routes
- `/actor/:actorId/settings`

### `/vport/restore` route

Added to protected routes — does NOT go through `BlockedVportGuard` (to avoid redirect loop).

---

## 6. Restore Screen

**File:** `apps/VCSM/src/features/vport/screens/RestoreVportScreen.jsx`

Behavior:
1. Reads `identity` and `blockedVport` from context
2. If `!blockedVport && identity`, redirects to `/feed` (not actually blocked)
3. On mount, calls `ctrlResolveVportIdByActorId(identity.actorId)` to get the `vport.profiles.id`
4. Shows the block reason:
   - `isDeleted` → "This VPORT has been soft-deleted and is no longer publicly visible."
   - `isVoid` → "This VPORT has been voided."
   - `isActive === false` → "This VPORT is currently inactive."
5. Restore button (shown only when `isDeleted && vportId`):
   - Calls `ctrlRestoreVport({ vportId })`
   - Then `switchActor(identity.actorId, ...)` to refresh identity
   - Redirects to `/feed`
6. "Go to Account Settings" button → `/settings?tab=account`

---

## 7. Switch Guard

### `useVportSwitch.js`

`switchToVport` now checks `v.is_deleted` before resolving the actor ID:
```js
if (v.is_deleted) {
  onBlocked?.('This VPORT has been deactivated. Restore it from Settings → Account to continue.')
  return
}
```

`onBlocked` is an optional callback passed by the consumer.

### `useVportsController.js`

Wires the `onBlocked` callback:
```js
const [blockedMsg, setBlockedMsg] = useState(null)

const { switchToProfile, switchToVport } = useVportSwitch({
  ...
  onBlocked: (msg) => setBlockedMsg(msg),
})
```

Returns `blockedMsg` and `clearBlockedMsg` for the view to render a toast.

---

## 8. Public DAL Filter

### `resolveVportSlugDAL` — `apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js`

Added `.eq('is_deleted', false)` to the `vport.profiles` query:
```js
.eq("is_deleted", false)
```

Deleted VPORTs no longer resolve from a public slug — returns `null` → 404.

---

## 9. Controller

### `account.controller.js`

`ctrlRestoreVport` added:
```js
export async function ctrlRestoreVport({ vportId }) {
  await restoreVport(vportId)
}
```

Delegates to `restoreVport` from `vport.core.dal.js` (which calls `vport.restore_vport` RPC).

---

## 10. Files Map

| File | Role |
|---|---|
| `apps/VCSM/src/state/identity/identity.read.dal.js` | Added `is_deleted` to `readVportIdentityDAL` select |
| `apps/VCSM/src/state/identity/identity.controller.js` | Added `isDeleted` to `mapVportActor` |
| `apps/VCSM/src/state/identity/identityContext.jsx` | `blockedVport` computed + exposed in context |
| `apps/VCSM/src/app/routes/protected/app.routes.jsx` | `BlockedVportGuard` component + `/vport/restore` route |
| `apps/VCSM/src/app/routes/index.jsx` | Lazy import for `RestoreVportScreen` |
| `apps/VCSM/src/features/vport/screens/RestoreVportScreen.jsx` | Restore screen — shows reason, restore action, settings link |
| `apps/VCSM/src/features/settings/account/controller/account.controller.js` | `ctrlRestoreVport({ vportId })` |
| `apps/VCSM/src/features/settings/vports/hooks/useVportSwitcher.js` | `onBlocked` callback + `is_deleted` guard in `switchToVport` |
| `apps/VCSM/src/features/settings/vports/hooks/useVportsController.js` | `blockedMsg` / `clearBlockedMsg` state |
| `apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js` | `.eq('is_deleted', false)` filter added |

---

## 11. Rules / Invariants

1. `blockedVport` must be computed from identity context fields, not from DB queries at the route level
2. `BlockedVportGuard` must not wrap `/vport/restore` itself — that would cause an infinite redirect loop
3. The restore button is only shown when `isDeleted === true` — voided VPORTs cannot be restored from this screen
4. `ctrlRestoreVport` calls the `vport.restore_vport` RPC which requires `is_deleted = true` — the RPC enforces this at DB level
5. After restore, `switchActor` must be called to refresh the identity context before navigating away

---

## 12. Change Log

### 2026-04-20 — v1 (current)

**Task:** VPORT access block — identity guard, route protection, restore screen, switch guard, public DAL filter
**Summary:**
- Added `is_deleted` to `readVportIdentityDAL` select and `isDeleted` to `mapVportActor`
- Added `blockedVport` computed field to identity context (blocked if `isDeleted`, `isVoid`, or `!isActive`)
- Added `BlockedVportGuard` wrapping all `/actor/:actorId/dashboard*` and `/actor/:actorId/settings` routes — redirects to `/vport/restore` when blocked
- Created `RestoreVportScreen` at `/vport/restore` — shows block reason, restore button for soft-deleted VPORTs, settings link
- Added `ctrlRestoreVport` to `account.controller.js`
- Added `is_deleted` guard to `switchToVport` — blocked VPORTs cannot be switched to; `onBlocked` callback triggers toast
- Added `.eq('is_deleted', false)` to `resolveVportSlugDAL` — deleted VPORTs do not resolve from public slugs
- Wired `blockedMsg`/`clearBlockedMsg` state in `useVportsController`

**Files Changed:**
- `apps/VCSM/src/state/identity/identity.read.dal.js`
- `apps/VCSM/src/state/identity/identity.controller.js`
- `apps/VCSM/src/state/identity/identityContext.jsx`
- `apps/VCSM/src/app/routes/protected/app.routes.jsx`
- `apps/VCSM/src/app/routes/index.jsx`
- `apps/VCSM/src/features/vport/screens/RestoreVportScreen.jsx` (NEW)
- `apps/VCSM/src/features/settings/account/controller/account.controller.js`
- `apps/VCSM/src/features/settings/vports/hooks/useVportSwitcher.js`
- `apps/VCSM/src/features/settings/vports/hooks/useVportsController.js`
- `apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js`

Generated by: Batman
