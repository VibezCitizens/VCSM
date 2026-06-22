---
title: Account Module — Behavior
status: ACTIVE
feature: settings
module: account
source: source-verified
updated: 2026-06-07
---

# settings / modules / account — BEHAVIOR

## Purpose

The account module is the authenticated citizen's danger-zone control panel.
It owns account deletion, VPORT soft-delete/restore/hard-delete, and session management.

---

## Entry Points

| Component | Tab | Route |
|---|---|---|
| `AccountTab.view.jsx` | Account | `/settings?tab=account` |
| `useAccountController` | — | Loaded by AccountTab via lazy import |

---

## User Flows

### 1. Account Deletion

```
actor confirms delete
  → useAccountController.deleteAccount()
  → ctrlDeleteAccount()
  → dalDeleteCitizenAccountFull()
  → supabase.functions.invoke('delete-citizen-account')
```

**Gap:** No app-layer session pre-check before Edge Function invocation.
Edge Function holds service-role key and is responsible for its own JWT validation.
See ACCOUNT-SEC-001.

---

### 2. VPORT Soft Delete

```
actor taps soft-delete on their VPORT (Account tab)
  → useAccountController.softDeleteVport({ vportId })
  → ctrlSoftDeleteVport({ vportId })
  → account.write.dal → RPC soft_delete_vport
```

**Gap:** No app-layer ownership gate. Any authenticated actor who supplies a vportId
can call this path. RPC-level ownership is unverified from source.
See ACCOUNT-SEC-001 / VPORTS-SEC-001.

---

### 3. VPORT Restore (Account Tab)

```
actor taps restore on a soft-deleted VPORT (Account tab)
  → useAccountController.restoreVport({ vportId })
  → ctrlRestoreVport({ vportId })
  → account.write.dal → RPC restore_vport
```

**Gap:** No app-layer ownership gate. Same exposure as soft-delete.

---

### 4. VPORT Hard Delete (BROKEN)

```
actor taps hard-delete (Account tab)
  → useAccountController.hardDeleteVport({ vportId: targetVportId })
  → ctrlHardDeleteVport({ vportId, callerActorId: undefined })
  → throws Error('callerActorId is required')
```

**This flow is permanently non-functional from the Account tab.**
`useAccountController` calls `ctrlHardDeleteVport` without passing `callerActorId`.
The controller throws immediately. See ACCOUNT-SEC-002.

The Vports tab path (`useVportsController.hardDeleteVport`) correctly passes `callerActorId`
and is functional.

---

### 5. Session Management

```
actor taps logout
  → useAccountController.logout()
  → supabase.auth.signOut()

actor taps logout all sessions
  → useAccountController.logoutAllSessions()
  → session invalidation RPC or Edge Function
```

---

## Business Rules

1. Account deletion is irreversible. The Edge Function `delete-citizen-account` purges
   all account data. No soft-delete fallback exists.
2. VPORT soft-delete sets `is_deleted = true`. VPORT remains recoverable via restore.
3. VPORT hard-delete is only possible after a prior soft-delete. Requires `callerActorId`.
4. Hard-delete from the Account tab is broken (`callerActorId` never passed).
5. Soft-delete and restore have no app-layer ownership gate — exposed to IDVP bypass.

---

## State Machine (VPORT lifecycle from Account tab)

```
active → [soft-delete] → soft-deleted → [restore] → active
                      ↘ [hard-delete (BROKEN from Account tab)] → permanently deleted
```

---

## Must Never Happen (Invariants)

| # | Invariant | Violation Evidence |
|---|---|---|
| 1 | Actor must not delete another actor's account | ACCOUNT-SEC-001: no session pre-check |
| 2 | Actor must not soft-delete a VPORT they don't own | VPORTS-SEC-001: no ownership gate |
| 3 | Hard-delete must require `callerActorId` | ACCOUNT-SEC-002: missing in Account tab path |
| 4 | Hard-delete must require prior soft-delete | Enforced by RPC contract (unverified from source) |

---

## THOR Release Status

Not blocked by this module's own THOR findings. Parent THOR blockers (VPORTS-SEC-001,
VPORTS-SEC-002) are scoped to the vports module and block the full settings feature.
