---
title: Vports Module — API Surface
status: ACTIVE
feature: settings
module: vports
created: 2026-06-07
---

# settings / modules / vports — API

## Controllers

**Directory:** `apps/VCSM/src/features/settings/vports/controller/`

| Function | File | Ownership Gate | Notes |
|---|---|---|---|
| `ctrlSetVportBusinessCardPublishState` | `vportBusinessCard.controller.js` | `assertActorOwnsVportActorController` — SAFE | Requires `callerActorId` + `vportActorId` |
| `ctrlGetVportBusinessCardSettings` | `vportBusinessCardSettings.controller.js` | n/a — read | Read-only |
| `ctrlGetVportDirectoryState` | `vportDirectoryVisibility.controller.js` | `assertActorOwnsVportActorController` — SAFE | Requires `callerActorId` + `vportActorId` |
| `ctrlSetVportDirectoryVisible` | `vportDirectoryVisibility.controller.js` | `assertActorOwnsVportActorController` — SAFE | VPD-V-026: controller-layer gate + DAL defense-in-depth |
| `ctrlSoftDeleteVport` | `account.controller.js` (shared) | NONE — VPORTS-SEC-001 | |
| `ctrlRestoreVport` | `account.controller.js` (shared) | NONE — VPORTS-SEC-001 | |
| `getAuthedUserId` | `getAuthedUserId.controller.js` | n/a | Auth session read |
| `getProfileActorId` | `getProfileActorId.controller.js` | n/a | Profile actor resolution |
| `listMyVports` | `listMyVports.controller.js` | Session-bound at DAL | |
| `vportSocialSettings` | `vportSocialSettings.controller.js` | n/a | Social settings read/write |

---

## Hooks

| Hook | File | Purpose | Exported via Adapter |
|---|---|---|---|
| `useVportsController` | `hooks/useVportsController.js` | Main vports tab orchestration | NO |
| `useVportsList` | `hooks/useVportsList.js` | List owned VPORTs | NO |
| `useVportDirectoryVisibility` | `hooks/useVportDirectoryVisibility.js` | Directory toggle state | YES — `settings.adapter.js` |
| `useVportBusinessCardSettings` | `hooks/useVportBusinessCardSettings.js` | Business card publish state | YES — `settings.adapter.js` |
| `useResolvedVportId` | `hooks/useResolvedVportId.js` | Active VPORT ID resolution | YES — `settings.adapter.js` |
| `useVportSwitcher` | `hooks/useVportSwitcher.js` | VPORT switch UI state | NO |
| `useProfileActor` | `hooks/useProfileActor.js` | Profile actor context | NO |
| `useVportNotificationBadges` | `hooks/useVportNotificationBadges.js` | Notification badge counts per VPORT | NO |

### useVportsController — Key Returns

| Return | Notes |
|---|---|
| `items` | List of owned VPORTs |
| `restoreVport` | Calls `ctrlRestoreVport` with NO `callerActorId` — VPORTS-SEC-002 BYPASSED |
| `hardDeleteVport` | Correctly passes `callerActorId = identity?.actorId` — SAFE |
| `setBusinessCardPublished` | Correctly passes `callerActorId` + `vportActorId` — SAFE |
| `busyRestore`, `errRestore` | Restore async state |
| `busyHardDelete`, `errHardDelete` | Hard delete async state |
| `busyCardPublishId`, `errCardPublish` | Business card publish async state |

---

## DAL — Write Surfaces

**File:** `apps/VCSM/src/features/settings/vports/dal/vports.write.dal.js`

| Function | Operation | Target | Session Bound | Notes |
|---|---|---|---|---|
| `setVportBusinessCardPublishStateDAL` | RPC | `set_business_card_publish_state` | SECURITY DEFINER at DB | Safe — DB enforces ownership |
| `setVportBusinessCardSettingsDAL` | UPDATE | `vport.profiles` | `owner_user_id = auth.uid()` | SAFE |
| `setVportDirectoryVisibleDAL` | UPDATE | `vport.profiles` | `owner_user_id = auth.uid()` | SAFE — defense-in-depth |
| `syncDirectoryVisibleToPublicDetailsDAL` | UPDATE | `vport.profile_public_details` | n/a | Non-blocking secondary sync — VPD-V-FIX-002 |

**Soft delete / restore / hard delete** — executed via `account.controller.js` DAL:
- `dalDeleteMyVport` → RPC `soft_delete_vport` (no app-layer ownership gate)
- `dalRestoreVport` → RPC `restore_vport` (no app-layer ownership gate)
- `dalHardDeleteVport` → RPC `hard_delete_vport` (callerActorId required)

---

## DAL — Read Surfaces

**File:** `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js`

| Function | Target | Session Bound | Notes |
|---|---|---|---|
| `listMyVportsDAL` | `vc.actor_owners → vc.actors → vport.profiles` | `auth.getUser()` | SAFE — session-bound chain |
| `readMyVports` | `vport.profiles` | `owner_user_id = auth.uid()` | Compact version |
| `readVportBusinessCardSettingsDAL` | `vport.profiles` | `owner_user_id = auth.uid()` | SAFE |
| `readVportDirectoryStateDAL` | `vport.profiles` | `owner_user_id = auth.uid()` | SAFE |

**Other read DAL files:**
- `actorOwners.read.dal.js` — Queries `vc.actor_owners` for ownership verification chain
- `auth.read.dal.js` — Session user read

All read DAL uses explicit column selects (no `select('*')`).

---

## Models

**File:** `apps/VCSM/src/features/settings/vports/model/vport.model.js`

Transforms raw `vport.profiles` row → canonical vport view object.

---

## Actor Identity

| Field | Source | Safety |
|---|---|---|
| `callerActorId` | `identity?.actorId` from `useVportsController` | SAFE when provided; MISSING for `restoreVport` — VPORTS-SEC-002 |
| `vportActorId` | Resolved per-operation from vport list | Required for ownership gate functions |
| `listMyVportsDAL` session bind | `supabase.auth.getUser()` → actor_owners chain | SAFE |

---

## Tables / RPCs / Edge Functions

| Name | Type | Access | Ownership | Notes |
|---|---|---|---|---|
| `vport.profiles` | table | read/write | `owner_user_id = auth.uid()` | Session-bound writes (except via soft_delete/restore RPCs) |
| `vport.profile_public_details` | table | write | n/a | Secondary non-blocking sync |
| `vc.actor_owners` | table | read | Session-bound | Ownership verification chain |
| `vc.actors` | table | read | Session-bound | Actor + kind resolution |
| `soft_delete_vport` | RPC | write | DB-level UNVERIFIED | No app-layer gate — VPORTS-SEC-001 |
| `restore_vport` | RPC | write | DB-level UNVERIFIED | No app-layer gate — VPORTS-SEC-001 |
| `hard_delete_vport` | RPC | write | callerActorId required | Requires prior soft-delete |
| `set_business_card_publish_state` | RPC | write | SECURITY DEFINER at DB | DB enforces ownership |

---

## Ownership Validation Path

| Operation | App-layer gate | DB-layer gate | Status |
|---|---|---|---|
| softDeleteVport | NONE | RPC-level (UNVERIFIED from source) | VPORTS-SEC-001 OPEN / THOR BLOCKER |
| restoreVport (Vports tab) | NONE (callerActorId missing) | RPC-level (UNVERIFIED from source) | VPORTS-SEC-002 OPEN / THOR BLOCKER |
| hardDeleteVport | callerActorId checked | RPC hard_delete_vport | SAFE |
| setVportDirectoryVisible | `assertActorOwnsVportActorController` | `owner_user_id = auth.uid()` | SAFE (VPD-V-026) |
| setVportBusinessCardPublishState | `assertActorOwnsVportActorController` | SECURITY DEFINER | SAFE |
| listMyVports | Session-bound chain | RLS | SAFE |

---

## Monitoring Behavior IDs

None assigned. Feature has 0 formal test files.

---

## Deferred Tickets

| Ticket | Description | THOR |
|---|---|---|
| VPORTS-SEC-001 | ctrlSoftDeleteVport/ctrlRestoreVport no ownership gate | BLOCKS RELEASE |
| VPORTS-SEC-002 | useVportsController.restoreVport missing callerActorId on Vports tab | BLOCKS RELEASE |
