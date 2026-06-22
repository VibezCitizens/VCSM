---
name: vcsm.settings.behavior
description: Feature-level behavior contract for the VCSM settings feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P1
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — settings
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The settings feature is the authenticated citizen's control panel for account management, profile editing, privacy configuration, and VPORT lifecycle management.

It is a first-party VCSM citizen feature owned by the platform core team responsible for citizen identity and account lifecycle. The module spans both `user` and `vport` actor kinds and is the primary write surface for `vc.actor_privacy_settings`, `vport.profiles`, and the `delete-citizen-account` Edge Function.

The feature surfaces four tabs — Privacy, Profile, Account, and Vports — each backed by dedicated sub-feature layers (DAL, controller, hook, view). It also owns destructive operations such as soft/hard account deletion and VPORT soft-delete/restore/hard-delete, all gated behind ownership assertions from the booking adapter boundary.

Source: ARCHITECTURE.md (Purpose section), CURRENT_STATUS.md

---

## §2 Entry Points

- `/settings` — `SettingsScreen.jsx` (authenticated route, tab-based SPA shell)
  - `?tab=privacy` — `PrivacyTab.view.jsx`
  - `?tab=profile` — `ProfileTab` adapter (user or vport conditional)
  - `?tab=account` — `AccountTab.view.jsx`
  - `?tab=vports` — `VportsTab.view.jsx`
- Public adapter export: `useVportAccountOps` via `adapters/settings.adapter.js`

The `/settings` route is registered in the app router and navigated to programmatically. It does not appear in the static route scanner output — it is not statically declared in a route file readable by the scanner.

Source: ARCHITECTURE.md (Entry Points section), INDEX.md (Routes section)

---

## §3 User Flows

User flows are provable only at the hook entry point level from governance artifacts. Detailed interaction flows (form validation, confirmation dialogs, error messaging) are UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

### Provable hook-level flows (from ARCHITECTURE.md, VENOM output, BW output):

**Account Tab flows:**
- Citizen initiates account deletion: `useAccountController.deleteAccount` → `ctrlDeleteAccount` → `dalDeleteCitizenAccountFull` → `delete-citizen-account` Edge Function (irreversible)
- Citizen requests VPORT soft-delete from Account tab: `useAccountController.softDeleteVport` → `ctrlSoftDeleteVport` → `dalDeleteMyVport` → `soft_delete_vport` RPC
- Citizen requests VPORT restore from Account tab: `useAccountController.restoreVport` → `ctrlRestoreVport` → `dalRestoreVport` → `restore_vport` RPC
- Citizen requests VPORT hard-delete from Account tab: `useAccountController.hardDeleteVport` → `ctrlHardDeleteVport` (BROKEN — omits callerActorId, throws immediately per VEN-SETTINGS-003; this path is non-functional)

**Vports Tab flows:**
- Citizen restores a VPORT from Vports tab: `useVportsController.restoreVport` → `ctrlRestoreVport` (no callerActorId — ownership gap per BW-SETTINGS-006)
- Citizen hard-deletes a VPORT from Vports tab: `useVportsController.hardDeleteVport` → `ctrlHardDeleteVport` (callerActorId correctly supplied — this path works)
- Citizen publishes/unpublishes business card: `useVportsController.setBusinessCardPublished` → `setVportBusinessCardPublishStateDAL` → `set_business_card_publish_state` RPC
- Citizen updates business card settings: `useVportBusinessCardSettings.updateSettings` → `setVportBusinessCardSettingsDAL`
- Citizen toggles directory visibility: `useVportDirectoryVisibility.toggle` → `ctrlSetVportDirectoryVisible` → `setVportDirectoryVisibleDAL` + `syncDirectoryVisibleToPublicDetailsDAL` (secondary sync — non-blocking, drift risk)

**Privacy Tab flows:**
- Citizen toggles actor privacy (public/private): `useActorPrivacy.togglePrivacy` → `ctrlSetActorPrivacy` → `dalSetActorPrivacy` → upsert on `vc.actor_privacy_settings`; triggers `invalidateActorPrivacyCacheAdapter` and `invalidateActorBundleEntry`
- Citizen blocks an actor: `Blocks.controller.ctrlBlockActor` → `dalInsertBlock` → `moderation.block_actor` RPC
- Citizen unblocks an actor: `Blocks.controller.ctrlUnblockActor` → `dalDeleteBlockByTarget` → `moderation.unblock_actor` RPC

**Profile Tab flows:**
- Citizen saves profile edits: `useProfileController.saveProfile` → `saveProfileCore` → `updateProfile` (user mode or vport mode) → write to `profiles` table; hydration store force-mutated downstream

Source: ARCHITECTURE.md (Module Data Contract), VENOM output §4 Scanner Signals, BW output §4.2 Hook Entry Points

### VPORT hard-delete state machine constraint (from ARCHITECTURE.md, BW output):
- Hard-delete requires prior soft-delete. The `hard_delete_vport` RPC enforces this — it returns `VPORT_NOT_FOUND_OR_NOT_DELETED` if the VPORT is not already soft-deleted. App layer relies entirely on this DB-level state machine gate.
- Restore of an already-active VPORT is blocked by the RPC (`restore_vport` returns `VPORT_NOT_FOUND_OR_NOT_DELETED` if not soft-deleted).

---

## §4 Business Rules

The following rules are derivable from governance artifacts. Each cites its source.

**BR-1:** VPORT hard-delete requires that the VPORT be soft-deleted first. The DB RPC enforces this sequencing.
Source: ARCHITECTURE.md (Module Data Contract), BW output §6.F Mutation Replay

**BR-2:** The `set_business_card_publish_state` RPC is a SECURITY DEFINER function at the DB layer and requires the actor to own the VPORT. Controller-layer ownership assertion is also present.
Source: ARCHITECTURE.md (Module Data Contract, Scanner Signals row for set_business_card_publish_state)

**BR-3:** Block actions include a controller-layer idempotency check. If the target actor is already blocked (existingBlockedIds), the block action returns `{ ok: true, changed: false }` without calling the RPC. Unblock has the same pattern.
Source: BW output §6.F Mutation Replay

**BR-4:** Privacy toggle (`vc.actor_privacy_settings`) is an upsert — idempotent by design.
Source: ARCHITECTURE.md (Module Data Contract), BW output §6.F

**BR-5:** The `delete-citizen-account` Edge Function holds the service role key and bypasses RLS by design. It is responsible for validating the JWT and extracting `auth.uid()`.
Source: INDEX.md (Security-Sensitive Surfaces), VENOM output VEN-SETTINGS-002

**BR-6:** Directory visibility changes trigger a secondary non-blocking write to `vport.profile_public_details` via `syncDirectoryVisibleToPublicDetailsDAL`. If this secondary write fails silently, `directory_visible` can diverge between `vport.profiles` and `vport.profile_public_details`.
Source: ARCHITECTURE.md (Module Completeness Matrix, Module Boundary Warnings — profile_public_details sync drift risk)

**BR-7:** Profile photo and banner uploads are handled via `profileMediaAsset.write.dal.js`, which internally resolves the session user ID (session-bound at DAL layer).
Source: VENOM output §4 Scanner Signals (VERIFIED_SAFE rows for photo/banner)

**BR-8:** The `assertActorOwnsVportActorController` function enforces that only `user`-kind actors (not VPORT-kind actors) can perform ownership-gated operations. VPORT-kind actors cannot act as requesters for ownership assertions.
Source: BW output §6.C Runtime Abuse

**BR-9:** After a privacy change, `invalidateActorPrivacyCacheAdapter` (social feature cache) and `invalidateActorBundleEntry` (feed feature cache) are called. Profile and VPORT settings writes do not trigger cache invalidations.
Source: ARCHITECTURE.md (Module Completeness Matrix — Cache behavior row, Module Boundary Warnings)

**BR-10:** `saveProfile.controller.js` uses `profileId` as a parameter, which conflicts with the VCSM architecture rule that domain entities must be scoped to `actorId`. This is a tracked soft rule violation.
Source: ARCHITECTURE.md (Module Boundary Warnings)

---

## §5 State Rules

The following state transitions are documentable from governance artifacts.

**VPORT Lifecycle State Machine (partial — DB-level gates confirmed, app-level gates partially absent):**

| From State | Action | To State | Gate | Source |
|---|---|---|---|---|
| ACTIVE | soft-delete | SOFT_DELETED | DB RPC `soft_delete_vport` (app-layer ownership gate ABSENT — BW-SETTINGS-001 THOR BLOCKER) | VENOM VEN-SETTINGS-001, BW-SETTINGS-001 |
| SOFT_DELETED | restore | ACTIVE | DB RPC `restore_vport` (app-layer ownership gate ABSENT — BW-SETTINGS-006 THOR BLOCKER) | BW-SETTINGS-006 |
| SOFT_DELETED | hard-delete | DELETED (irreversible) | DB RPC `hard_delete_vport` requires prior soft-delete; app-layer ownership gate present in ctrlHardDeleteVport | ARCHITECTURE.md, BW output §6.F |
| ACTIVE | hard-delete | (blocked) | RPC returns `VPORT_NOT_FOUND_OR_NOT_DELETED` | BW output §6.F |

**Account Lifecycle:**
- Citizen account soft-delete (`soft_delete_citizen_account` RPC): no caller-supplied params; relies on DB auth context. Considered authenticated-only.
- Citizen account hard-delete (Edge Function): irreversible. No app-layer session pre-check (BW-SETTINGS-004).

**Privacy State:**
- `vc.actor_privacy_settings` upsert is idempotent. State is per-actor (`actor_id` field). Controls follow request flows and content visibility platform-wide.
Source: ARCHITECTURE.md (Module Data Contract), VENOM VEN-SETTINGS-005

**Block State:**
- Block/unblock is idempotent at controller layer when `existingBlockedIds` is provided. Block affects feed visibility and chat eligibility.
Source: BW output §6.F, ARCHITECTURE.md (Security-Sensitive Surfaces)

---

## §6 Security Constraints

From SECURITY.md and specialist outputs (VENOM 2026-06-04, BLACKWIDOW 2026-06-04):

**VENOM Findings as Constraints:**

CONSTRAINT: `ctrlSoftDeleteVport` and `ctrlRestoreVport` must assert that the caller owns the VPORT before invoking the DB RPC. Currently no app-layer gate exists on these paths.
Evidence: VEN-SETTINGS-001 (HIGH) — ctrlSoftDeleteVport and ctrlRestoreVport have no app-layer ownership gate

CONSTRAINT: The `delete-citizen-account` Edge Function must only be invoked after the app layer confirms a valid authenticated session exists.
Evidence: VEN-SETTINGS-002 (HIGH) — dalDeleteCitizenAccountFull invokes Edge Function without app-layer session pre-check

CONSTRAINT: `ctrlHardDeleteVport` when called from the Account tab must receive a valid `callerActorId`. The Account tab hook (`useAccountController.hardDeleteVport`) currently omits this argument, making the Account tab hard-delete path permanently non-functional.
Evidence: VEN-SETTINGS-003 (MEDIUM) — useAccountController calls ctrlHardDeleteVport without callerActorId — hard delete broken in Account tab

CONSTRAINT: The `p_blocker_actor_id` parameter passed to `moderation.block_actor` must be derived from the authenticated session, not accepted as a client-supplied value. The app-layer ownership check uses string equality only.
Evidence: VEN-SETTINGS-004 (HIGH) — blocks.dal.js passes client-supplied actorId as p_blocker_actor_id to moderation RPC

CONSTRAINT: `dalSetActorPrivacy` has no session bind at the DAL layer. The controller's `assertActorOwnsVportActorController` is the sole app-layer gate. The RLS policy on `vc.actor_privacy_settings` is unverified and must be present.
Evidence: VEN-SETTINGS-005 (MEDIUM) — dalSetActorPrivacy has no session bind at DAL layer — relies entirely on controller and RLS

CONSTRAINT: The user-mode branch of `profile.write.dal.js` has no session bind. It issues `.eq('id', subjectId)` with a caller-supplied subjectId. The RLS policy on `public.profiles` is the sole DB-side guard. Unlike the vport-mode branch (which session-binds at DAL), user-mode relies entirely on RLS.
Evidence: VEN-SETTINGS-006 (MEDIUM) — profile.write.dal.js user-mode update has no session bind — subjectId caller-supplied

**BLACKWIDOW Findings as Additional Constraints:**

CONSTRAINT: `ctrlRestoreVport` called from `useVportsController` (Vports tab) passes no `callerActorId`. The app layer imposes no ownership assertion on this path at all.
Evidence: BW-SETTINGS-006 (HIGH, BYPASSED) — useVportsController.restoreVport calls ctrlRestoreVport with no callerActorId — no ownership gate on Vports tab path

CONSTRAINT: The moderation.block_actor RPC must internally verify that the `p_blocker_actor_id` matches the authenticated session actor. This is unverifiable from source alone.
Evidence: BW-SETTINGS-007 (MEDIUM, UNRESOLVED) — moderation.block_actor / unblock_actor RPC auth.uid() binding unverifiable from source

CONSTRAINT: Block/unblock idempotency checks in the controller are conditional on `existingBlockedIds` being provided. The RPC (`block_actor` / `unblock_actor`) must independently handle duplicate block/unblock attempts.
Evidence: BW-SETTINGS-009 (LOW, PARTIAL) — Block/unblock idempotency checks conditional on existingBlockedIds; RPC must handle duplicates independently

CONSTRAINT: Hydration store force-mutation (`useActorStore.upsertActors({ force: true })`) occurs downstream of the profile write. If a foreign profile write were to succeed (RLS bypass), the hydration store for that actor could be poisoned.
Evidence: BW-SETTINGS-010 (MEDIUM, PARTIAL) — Hydration store force-mutation in saveProfileCore downstream of profile write; second-order risk if RLS fails

---

## §7 Error Handling

The following error states are documentable from governance artifacts:

**Documented error strings (from BW output source citations):**
- `VPORT_NOT_FOUND_OR_UNAUTHORIZED` — returned by `soft_delete_vport` RPC when the VPORT is not found or the caller is not authorized
- `VPORT_NOT_FOUND_OR_NOT_DELETED` — returned by `restore_vport` and `hard_delete_vport` RPCs when the VPORT is not in the expected state
- `ctrlHardDeleteVport: callerActorId is required` — thrown immediately by `ctrlHardDeleteVport` when no callerActorId is supplied (Account tab hard-delete always throws here — BW-SETTINGS-003 confirmed behavior)
- `Missing actorId` / `Missing callerActorId` — thrown by `ctrlSetActorPrivacy` on null inputs (BLOCKED per BW output §6.E)
- `ctrlBlockActor: caller does not own this actor` — thrown by `Blocks.controller.js` on ownership mismatch
- `ctrlGetVportDirectoryState: callerActorId required` — thrown by `vportDirectoryVisibility.controller.js` when identity not loaded
- `saveProfile: subjectId missing` — thrown by `profile.controller.js` on null subjectId
- `dalDeleteMyVport: vportId required` / `dalRestoreVport: vportId required` (null caught at DAL layer for soft-delete/restore controllers that lack controller-level null guards)

**Loading/busy state surface:**
- `SettingsScreen.jsx` uses Suspense fallback for tab loading
- Hooks expose `busy`, `busyRestore`, `busyHardDelete`, `errRestore`, `errHardDelete`, `errCardPublish` states
- Empty state: `VportsTab` handles empty VPORT array; per-tab empty states vary and are not uniformly documented

Source: BW output §6.E Viewer Context Fuzzing, ARCHITECTURE.md (Module Runtime Readiness)

**UNKNOWN:** Specific error UI rendering per tab, user-visible error message copy, retry behavior, and which error states surface to the UI vs. are silently swallowed. UNKNOWN — REQUIRES IMPLEMENTATION REVIEW

---

## §8 Cross-Feature Dependencies

**Engine dependencies (all approved per ARCHITECTURE.md):**

| Engine | Direction | Purpose |
|---|---|---|
| engines/booking | Inbound (adapter) | `assertActorOwnsVportActorController` — ownership assertion gate used in 3 controllers (account, actorPrivacy, vportDirectoryVisibility) |
| engines/identity | Inbound | `useIdentity()` — actor context and actor switching in `useVportsController.js` |
| engines/hydration | Inbound | Actor bundle hydration across queries |
| engines/profile | Inbound | Citizen profile reads |
| engines/media | Inbound | Profile photo and banner uploads |
| engines/notification | Inbound | VPORT notification badge hooks |
| engines/directory | Inbound | Actor directory lookups in Privacy tab |
| engines/qr | Inbound | QR modal in Vports tab |

**Cross-feature adapter dependencies (PARTIAL approval — noted as boundary warnings):**

| Feature | Direction | Purpose | Risk |
|---|---|---|---|
| features/social | Inbound (adapter) | `invalidateActorPrivacyCacheAdapter` — privacy cache bust after toggle | Cross-feature adapter import in controller layer |
| features/feed | Inbound (adapter) | `invalidateActorBundleEntry` — feed bundle cache bust after privacy toggle | Cross-feature adapter import in controller layer |
| features/booking | Inbound (adapter) | `assertActorOwnsVportActorController` — ownership assertion | Per ARCHITECTURE.md boundary warnings: ownership assertion arguably belongs in identity/actors engine, not the booking feature adapter |

Source: ARCHITECTURE.md (Module Dependency Graph, Module Boundary Warnings)

**Database write surfaces (17 confirmed):**

| Table / Function | Schema | Operation |
|---|---|---|
| delete-citizen-account | Edge Function | Hard account delete (irreversible) |
| soft_delete_citizen_account | RPC | Citizen account soft-delete |
| soft_delete_vport | RPC | VPORT soft-delete |
| restore_vport | RPC | VPORT restore |
| hard_delete_vport | RPC | VPORT hard-delete (requires prior soft-delete) |
| moderation.block_actor | RPC | Actor block |
| moderation.unblock_actor | RPC | Actor unblock |
| vc.actor_privacy_settings | upsert | Privacy flag per actor |
| vport.profiles (multiple) | update | VPORT profile data (business card, directory visibility, settings) |
| profiles (user mode) | update | Citizen profile (display_name, bio, photo, banner) |
| vport.profile_public_details | update | Directory visible sync (secondary non-blocking write) |
| set_business_card_publish_state | RPC | Business card publish state (SECURITY DEFINER) |

Source: ARCHITECTURE.md (Module Data Contract), INDEX.md (Write Surface Map)

---

## §9 Must Never Happen — Security Invariants

Each invariant below is grounded in VENOM or BLACKWIDOW findings. UNRESOLVED invariants indicate that DB-level enforcement has not been verified.

INVARIANT-1: An authenticated citizen must never be able to soft-delete a VPORT they do not own.
Violated by: VEN-SETTINGS-001 (HIGH), BW-SETTINGS-001 (HIGH, BYPASSED) — `ctrlSoftDeleteVport` has no app-layer ownership gate; DB RPC is the only barrier; DB enforcement UNVERIFIED.

INVARIANT-2: An authenticated citizen must never be able to restore a VPORT they do not own.
Violated by: VEN-SETTINGS-001 (HIGH), BW-SETTINGS-006 (HIGH, BYPASSED) — `ctrlRestoreVport` has no app-layer ownership gate on either the Account tab or Vports tab call paths; DB RPC is the only barrier; DB enforcement UNVERIFIED.

INVARIANT-3: Account deletion must never proceed without a confirmed authenticated session at the app layer.
Violated by: VEN-SETTINGS-002 (HIGH), BW-SETTINGS-004 (MEDIUM, PARTIAL) — `dalDeleteCitizenAccountFull` invokes the Edge Function with no app-layer session pre-check; Edge Function is the sole auth enforcer.

INVARIANT-4: A citizen's profile must never be writable by another citizen.
Violated by: VEN-SETTINGS-006 (MEDIUM), BW-SETTINGS-003 (HIGH, PARTIAL) — user-mode `profile.write.dal.js` issues `.eq('id', subjectId)` with a caller-supplied subjectId and no session bind; RLS on `public.profiles` is the sole backstop; RLS enforcement UNVERIFIED.

INVARIANT-5: A block action must never be issued from an actor identity the caller does not own.
Violated by: VEN-SETTINGS-004 (HIGH) — `p_blocker_actor_id` is a caller-supplied parameter to `moderation.block_actor`; the app-layer check is string equality only; DB RPC auth binding is UNVERIFIED.

INVARIANT-6: A privacy state change must never be applied to an actor the caller does not own.
Violated by: VEN-SETTINGS-005 (MEDIUM), BW-SETTINGS-005 (MEDIUM, PARTIAL) — `dalSetActorPrivacy` has no session bind; controller ownership gate is the only app-layer enforcement; RLS on `vc.actor_privacy_settings` UNVERIFIED.

INVARIANT-7: The VPORT hard-delete path from the Account tab must never silently fail to enforce ownership. It currently always throws `callerActorId is required` before reaching the DB, rendering the Account tab hard-delete permanently non-functional.
Violated by: VEN-SETTINGS-003 (MEDIUM) — `useAccountController.hardDeleteVport` calls `ctrlHardDeleteVport` without `callerActorId`.

INVARIANT-8: Hydration store must never be force-mutated with data from a profile write that belonged to a different actor than the authenticated session.
Violated by: BW-SETTINGS-010 (MEDIUM, PARTIAL) — hydration store force-mutation is downstream of the profile write; second-order violation possible if RLS fails.

Source: SECURITY.md (VENOM STATUS, BLACKWIDOW STATUS), VENOM output (findings VEN-SETTINGS-001 through VEN-SETTINGS-007), BW output (findings BW-SETTINGS-001 through BW-SETTINGS-012)

---

## §10 Module Responsibilities

Four modules are documented. All module BEHAVIOR.md files are STUB status — behavioral specifics are UNKNOWN where not also covered by specialist findings.

### Module: Privacy (`settings/privacy/`)

**Responsibility:** Actor privacy controls — toggle public/private state, block/unblock actors, display pending follow requests and blocked users list.

**Write surfaces owned:**
- `vc.actor_privacy_settings` upsert via `dalSetActorPrivacy`
- `moderation.block_actor` RPC via `dalInsertBlock`
- `moderation.unblock_actor` RPC via `dalDeleteBlockByTarget`

**Key components per INDEX.md:** `BlockedUsersSimple.jsx`, `PendingFollowRequests.jsx`, `ProfilePrivacyToggle.jsx`, `useActorPrivacy.js`, `useMyBlocks.jsx`, `usePendingFollowRequestActions.js`

**Documented behavioral specifics (from module BEHAVIOR.md stub + specialist findings):**
- Actor blocks another actor: `blocks.dal.js` passes client-supplied actorId as `p_blocker_actor_id` to moderation RPC
- Block/unblock uses string-equality `callerActorId` check, not `assertActorOwnsVportActorController`
- Actor sets privacy: `dalSetActorPrivacy` upsert with caller-supplied `actor_id`; no session bind at DAL
- Block action is idempotent when `existingBlockedIds` is supplied to the controller

**UNKNOWN:** Privacy tab UI interaction flows, follow request accept/deny behavior details, blocked users list pagination behavior.

Source: module BEHAVIOR.md (STUB), ARCHITECTURE.md, VENOM VEN-SETTINGS-004/005, BW-SETTINGS-002/005/007/009

---

### Module: Profile (`settings/profile/`)

**Responsibility:** Citizen and VPORT profile editing — display name, bio, avatar, banner, links. Adapts between user-mode and vport-mode profile write paths.

**Write surfaces owned:**
- `profiles` table updates (user mode): `updateProfile` user branch — no session bind at DAL, RLS sole backstop
- `vport.profiles` table updates (vport mode): `updateProfile` vport branch — session-bound at DAL via `owner_user_id`
- `profiles` table updates (media): `updateUserPhotoMediaAssetIdDAL`, `updateUserBannerMediaAssetIdDAL` — session-bound internally

**Key components per INDEX.md:** `useProfileController.js`, `useProfileUploads.js`, `UserProfileTab.jsx`, `VportProfileTab.jsx`, `ProfileTab.view.jsx`, `VportAboutDetails.view.jsx`

**Documented behavioral specifics (from module BEHAVIOR.md stub + specialist findings):**
- `saveProfileCore` → `profile.write.dal.js` → `subjectId` is caller-supplied (no session bind in user mode)
- Hydration store is force-mutated downstream of a successful profile write via `useActorStore.upsertActors({ force: true })`
- Vport-mode profile update: session-bound at DAL layer (`owner_user_id = auth.uid()` WHERE clause) — safe
- Photo/banner uploads: session-bound at DAL via `_getSessionUserId()` — safe

**UNKNOWN:** Profile form field structure, validation rules, profile editing UI interaction flows, unsaved changes handling.

Source: module BEHAVIOR.md (STUB), ARCHITECTURE.md, VENOM VEN-SETTINGS-006, BW-SETTINGS-003/010

---

### Module: Account (`settings/account/`)

**Responsibility:** Account lifecycle management — citizen account soft-delete, VPORT soft-delete/restore/hard-delete from the Account tab perspective.

**Write surfaces owned:**
- `delete-citizen-account` Edge Function via `dalDeleteCitizenAccountFull` — irreversible hard account delete
- `soft_delete_citizen_account` RPC via `dalSoftDeleteCitizenAccount`
- `soft_delete_vport` RPC via `dalDeleteMyVport` (Account tab path — no app-layer ownership gate)
- `restore_vport` RPC via `dalRestoreVport` (Account tab path — no app-layer ownership gate)
- `hard_delete_vport` RPC via `dalHardDeleteVport` (Account tab path — permanently non-functional due to missing callerActorId)

**Key components per INDEX.md:** `useAccountController.js`, `useVportAccountOps.js`, `AccountTab.view.jsx`, `VportsHardDeleteModal.jsx`, `VportsRecoverModal.jsx`

**Documented behavioral specifics (from module BEHAVIOR.md stub + specialist findings):**
- Account hard-delete invokes Edge Function with no app-layer session pre-check; Edge Function holds service role key; irreversible
- Account tab VPORT hard-delete is currently always non-functional — throws `ctrlHardDeleteVport: callerActorId is required` before reaching DB
- Account tab VPORT soft-delete and restore reach the DB RPC with no app-layer ownership gate

**UNKNOWN:** Account deletion confirmation flow UI, post-deletion navigation behavior, soft-delete vs hard-delete citizen account visual differentiation.

Source: module BEHAVIOR.md (STUB), ARCHITECTURE.md, VENOM VEN-SETTINGS-001/002/003, BW-SETTINGS-001/004/006

---

### Module: Vports (`settings/vports/`)

**Responsibility:** VPORT management hub from the Vports tab — business card publishing, directory visibility, QR code, VPORT lifecycle (soft-delete, restore, hard-delete from the Vports tab perspective).

**Write surfaces owned:**
- `set_business_card_publish_state` RPC via `setVportBusinessCardPublishStateDAL` — SECURITY DEFINER at DB
- `vport.profiles` update via `setVportBusinessCardSettingsDAL` — session-bound at DAL
- `vport.profiles` update via `setVportDirectoryVisibleDAL` — session-bound at DAL
- `vport.profile_public_details` update via `syncDirectoryVisibleToPublicDetailsDAL` — secondary non-blocking write, drift risk
- `soft_delete_vport` RPC via `dalDeleteMyVport` (Vports tab path — ownership gate confirmed absent per BW-SETTINGS-001)
- `restore_vport` RPC via `dalRestoreVport` (Vports tab path — ownership gate confirmed absent, BW-SETTINGS-006 BYPASSED)
- `hard_delete_vport` RPC via `dalHardDeleteVport` (Vports tab path — ownership gate correctly present)

**Key components per INDEX.md:** `useVportsController.js`, `useVportsList.js`, `useVportSwitcher.js`, `useVportBusinessCardSettings.js`, `useVportDirectoryVisibility.js`, `VportsTab.view.jsx`, `VportsBusinessCardSection.jsx`, `VportsCreateModal.jsx`, `VportsQrModal.jsx`, `VportsUnpublishModal.jsx`

**Documented behavioral specifics (from module BEHAVIOR.md stub + specialist findings):**
- `ctrlSoftDeleteVport` and `ctrlRestoreVport` have no app-layer ownership gate on the Vports tab path
- `useVportsController.restoreVport` calls `ctrlRestoreVport` with no `callerActorId` — BYPASSED
- `useVportsController.hardDeleteVport` correctly passes `callerActorId` — this path is safe
- Business card and directory visibility writes are session-bound at DAL via `owner_user_id` WHERE clause — safe

**UNKNOWN:** VPORT switcher interaction flows, VPORT creation flow behavior, QR modal behavioral details, business card preview vs. published state logic.

Source: module BEHAVIOR.md (STUB), ARCHITECTURE.md, VENOM VEN-SETTINGS-001, BW-SETTINGS-001/006

---

## §11 Known Gaps

### UNKNOWN sections requiring implementation review:
1. Detailed UI interaction flows for all four tabs (form validation, navigation, confirmation dialogs)
2. Error message copy and user-visible error state rendering per tab
3. Empty state UI behavior per tab (not uniformly documented)
4. Retry behavior after failed writes
5. VPORT creation flow (`VportsCreateModal.jsx`) behavioral details
6. QR code modal behavioral details
7. VPORT switcher (`useVportSwitcher.js`) behavioral details
8. Pending follow request accept/deny behavioral details
9. Business card preview vs. published state visual distinction
10. Post-account-deletion navigation and logout behavior
11. Cache TTL documentation for `invalidateActorPrivacyCacheAdapter` and `invalidateActorBundleEntry`
12. Whether other settings writes (beyond privacy toggle) should also bust the actor bundle cache

### Missing governance artifacts:
- `OWNERSHIP.md` — MISSING (no formal ownership record per ARCHITECTURE.md)
- `TESTS.md` — MISSING (0 formal test files per INDEX.md and ARCHITECTURE.md)
- ELEKTRA has never been run on this feature (SECURITY.md: ELEKTRA Status: NOT RUN)
- Module BEHAVIOR.md files for privacy, profile, account, vports are all STUB status

### Open tickets relevant to settings:
- TICKET-VENOM-SETTINGS-0001 — VENOM findings VEN-SETTINGS-001 through VEN-SETTINGS-007 (all open)
- TICKET-BOOKING-RPC-001 — Replace broad booking INSERT/UPDATE with typed state-machine RPCs; related to `assertActorOwnsVportActorController` patterns
- TICKET-PLATFORM-RLS-001 — platform.media_assets {public} policy cleanup; adjacent RLS concern

### Unverified DB/RLS enforcement (deferred to DB command):
- `vc.actor_privacy_settings` — RLS UPDATE policy unverified
- `public.profiles` — RLS UPDATE policy on user-mode path unverified
- `moderation.block_actor` / `unblock_actor` RPC — auth.uid() binding unverified
- `soft_delete_vport` / `restore_vport` RPC — ownership enforcement unverified

### Placeholder items:
- ELEKTRA not run — no Edge Function source inspection for `delete-citizen-account` verify_jwt config
- Route not in static scanner route-map — route registration not confirmed

Source: ARCHITECTURE.md (Module Missing Pieces, Behavior Contract Consistency Check), CURRENT_STATUS.md, SECURITY.md

---

## §12 Validation Sources

All governance files read for this BEHAVIOR.md build:

| File | Key Facts Extracted |
|---|---|
| `ZZnotforproduction/APPS/VCSM/features/settings/CURRENT_STATUS.md` | Architecture state STABLE; MOSTLY INDEPENDENT; MOSTLY COMPLETE; spaghetti score WATCH; top gap is BEHAVIOR.md stub; recommended handoffs: LOGAN, SPIDER-MAN, VENOM, SENTRY, LOKI, IRONMAN |
| `ZZnotforproduction/APPS/VCSM/features/settings/SECURITY.md` | Highest open severity: HIGH; 3 THOR blockers (BW-SETTINGS-001, BW-SETTINGS-006, BW-SETTINGS-012); VENOM: 4 HIGH, 3 MEDIUM; BW: 3 HIGH, 4 MEDIUM, 2 LOW, 1 INFO; ELEKTRA: NOT RUN |
| `ZZnotforproduction/APPS/VCSM/features/settings/ARCHITECTURE.md` | Complete layer map (33 DAL, 28 controllers, 38 hooks, 38 components, 14 screens, 13 adapters, 4 barrels — 91 total); module dependency graph; data contract; runtime readiness matrix; spaghetti score; boundary warnings; build priority matrix |
| `ZZnotforproduction/APPS/VCSM/features/settings/INDEX.md` | Source inventory counts; write surface map (16 operations); security-sensitive surfaces identified; engine dependencies; 0 formal test files |
| `ZZnotforproduction/APPS/VCSM/features/settings/modules/privacy/BEHAVIOR.md` | STUB — source-inferred block/privacy behaviors, unverified invariants, open TODOs |
| `ZZnotforproduction/APPS/VCSM/features/settings/modules/profile/BEHAVIOR.md` | STUB — source-inferred profile write flow, hydration store concern, unverified invariants |
| `ZZnotforproduction/APPS/VCSM/features/settings/modules/account/BEHAVIOR.md` | STUB — source-inferred account/VPORT deletion flows, VEN-SETTINGS-003 documented behavior note |
| `ZZnotforproduction/APPS/VCSM/features/settings/modules/vports/BEHAVIOR.md` | STUB — source-inferred soft-delete/restore/hard-delete flows, BW-SETTINGS-001/006 ownership gap notes |
| `ZZnotforproduction/APPS/VCSM/features/settings/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_settings-security-review.md` | Full VENOM V2 report; 7 findings (VEN-SETTINGS-001 through VEN-SETTINGS-007); 24 security surfaces (all LOW confidence); 7 VERIFIED_SAFE surfaces identified; THOR impact section; mitigation plan |
| `ZZnotforproduction/APPS/VCSM/features/settings/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_settings-adversarial-review.md` | Full BW V2 adversarial review; 12 findings (BW-SETTINGS-001 through BW-SETTINGS-012); 2 BYPASSED (BW-001, BW-006); 5 source-inferred invariants (I-1 through I-5); 3 UNRESOLVED invariants; 3 THOR blockers |

**Files not found (secondary):**
- `OWNERSHIP.md` — does not exist
- `TESTS.md` — does not exist

---

## §13 THOR Release Status

**Exact text from SECURITY.md:**
> THOR Release Blocker: YES (BW-SETTINGS-001, BW-SETTINGS-006, BW-SETTINGS-012)

**THOR Status:** BLOCKED — settings feature is NOT cleared for release.

**Active THOR Blockers:**

| Blocker ID | Severity | Description | Result | Source |
|---|---|---|---|---|
| BW-SETTINGS-001 | HIGH | `ctrlSoftDeleteVport` and `ctrlRestoreVport` have no app-layer ownership gate — DAL RPCs reached unchecked | BYPASSED | BLACKWIDOW 2026-06-04 |
| BW-SETTINGS-006 | HIGH | `useVportsController.restoreVport` calls `ctrlRestoreVport` with no `callerActorId` — no ownership gate on Vports tab path | BYPASSED | BLACKWIDOW 2026-06-04 |
| BW-SETTINGS-012 | HIGH | BEHAVIOR.md PLACEHOLDER — 3 source-inferred §9 invariants UNRESOLVED (soft-delete isolation I-1, profile write isolation I-3, account delete session I-5) | UNRESOLVED | BLACKWIDOW 2026-06-04 |

**Note on BW-SETTINGS-012:** This BEHAVIOR.md authorship (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) directly addresses the PLACEHOLDER finding. BW-SETTINGS-012 should be re-evaluated by BLACKWIDOW after this BEHAVIOR.md is accepted. However BW-SETTINGS-001 and BW-SETTINGS-006 remain open independent of this documentation work and must be patched before THOR gate clearance can be issued.

**Recommendation from BW output:** "Do not issue THOR gate clearance for the settings feature until BW-SETTINGS-001 and BW-SETTINGS-006 are patched."

Source: SECURITY.md (THOR Release Blocker field), BW output §12 THOR Impact
