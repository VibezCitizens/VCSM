---
title: Account Module — API Surface
status: ACTIVE
feature: settings
module: account
created: 2026-06-07
---

# settings / modules / account — API

## Controllers

**File:** `apps/VCSM/src/features/settings/account/controller/account.controller.js`

| Function | Signature | Notes |
|---|---|---|
| `ctrlResolveVportIdByActorId` | `(actorId) → vportId` | Reads vc.actors.vport_id |
| `ctrlDeleteAccount` | `() → void` | No app-layer session pre-check — ACCOUNT-SEC-001 |
| `ctrlSoftDeleteVport` | `({ vportId }) → void` | No app-layer ownership gate — VPORTS-SEC-001 |
| `ctrlHardDeleteVport` | `({ vportId, callerActorId }) → void` | Requires callerActorId; throws if missing |
| `ctrlRestoreVport` | `({ vportId }) → void` | No app-layer ownership gate — VPORTS-SEC-001 |

---

## Hooks

### useAccountController
**File:** `apps/VCSM/src/features/settings/account/hooks/useAccountController.js`

Main account tab orchestration hook.

**Returns:**

| Return | Type | Notes |
|---|---|---|
| `isVport` | boolean | Whether the current actor is a VPORT |
| `vportId` | string | Active VPORT ID |
| `identity` | object | From useIdentity() |
| `displayName` | string | Display name |
| `avatarUrl` | string | Avatar URL |
| `handle` | string | Actor handle |
| `user` | object | Supabase auth user |
| `deleteAccount` | fn | Calls ctrlDeleteAccount |
| `softDeleteVport` | fn | Calls ctrlSoftDeleteVport |
| `hardDeleteVport` | fn | BROKEN — calls ctrlHardDeleteVport with no callerActorId (ACCOUNT-SEC-002) |
| `restoreVport` | fn | Calls ctrlRestoreVport with no ownership gate |
| `logoutAllSessions` | fn | Session invalidation |
| `logout` | fn | Single session logout |
| `showConfirmAccount` / `setShowConfirmAccount` | bool/fn | Confirm dialog state |
| `busyAccount`, `errAccount` | bool/Error | Account delete async state |
| `busySoft`, `errSoft` | bool/Error | Soft delete async state |
| `busyHard`, `errHard` | bool/Error | Hard delete async state |
| `busyRestore`, `errRestore` | bool/Error | Restore async state |
| `busyLogoutAll`, `errLogoutAll` | bool/Error | Logout all async state |

### useVportAccountOps
**File:** `apps/VCSM/src/features/settings/account/hooks/useVportAccountOps.js`

**Exported via:** `adapters/settings.adapter.js`

External-facing hook — safe to import from other features via the adapter.

**Returns:**

| Return | Type | Notes |
|---|---|---|
| `resolveVportIdByActorId` | fn | = ctrlResolveVportIdByActorId |
| `restoreVport` | fn | = ctrlRestoreVport + useVportCoreOps injection |

---

## DAL — Write Surfaces

**File:** `apps/VCSM/src/features/settings/account/dal/account.write.dal.js`

| Function | Operation | Target | Notes |
|---|---|---|---|
| `dalDeleteCitizenAccountFull` | Edge Function invoke | `delete-citizen-account` | No app-layer session pre-check — ACCOUNT-SEC-001 |
| `dalSoftDeleteCitizenAccount` | RPC | `soft_delete_citizen_account` | |
| `dalDeleteMyVport` | RPC | `soft_delete_vport` | |
| `dalRestoreVport` | RPC | `restore_vport` | |
| `dalHardDeleteVport` | RPC | `hard_delete_vport` | |

---

## DAL — Read Surfaces

**File:** `apps/VCSM/src/features/settings/account/dal/account.read.dal.js`

| Function | Target | Notes |
|---|---|---|
| `dalReadVportIdByActorId(actorId)` | `vc.actors.vport_id` | |
| `dalReadActorIdByVportId(vportId)` | `vc.actors.id` | |

---

## Actor Identity

| Field | Source | Safety |
|---|---|---|
| `actorId` | `useIdentity()` via `useAccountController` | SAFE |
| `callerActorId` | NOT passed to `ctrlHardDeleteVport` — hardcoded missing | BUG (ACCOUNT-SEC-002) |
| `vportId` | Resolved via `ctrlResolveVportIdByActorId` | SAFE |

---

## Tables / RPCs / Edge Functions

| Name | Type | Access | Notes |
|---|---|---|---|
| `vc.actors` | table | read | vportId and actorId resolution |
| `soft_delete_citizen_account` | RPC | write | |
| `soft_delete_vport` | RPC | write | No app-layer ownership gate |
| `restore_vport` | RPC | write | No app-layer ownership gate |
| `hard_delete_vport` | RPC | write | App-layer callerActorId required |
| `delete-citizen-account` | Edge Function | write | Service-role key, irreversible |

---

## Ownership Validation Path

| Operation | App-layer gate | DB-layer gate | Status |
|---|---|---|---|
| deleteAccount | NONE | Edge Function JWT | ACCOUNT-SEC-001 OPEN |
| softDeleteVport | NONE | RPC-level (UNVERIFIED) | VPORTS-SEC-001 OPEN |
| restoreVport | NONE | RPC-level (UNVERIFIED) | VPORTS-SEC-001 OPEN |
| hardDeleteVport | callerActorId required (but MISSING in useAccountController call) | RPC | BUG |

---

## Monitoring Behavior IDs

None assigned. Feature has 0 formal test files and no captureVcsmError calls in account module.

---

## Deferred Tickets

| Ticket | Description |
|---|---|
| ACCOUNT-SEC-001 | Edge Function no app-layer session pre-check |
| ACCOUNT-SEC-002 | useAccountController → ctrlHardDeleteVport missing callerActorId (Account tab hard-delete broken) |
