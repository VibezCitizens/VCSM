# Module: Settings

## PWA Source of Truth

**Routes:** `/settings`, `/vport/restore`, `/actor/:actorId/settings`

**Screens/components:**
- `apps/VCSM/src/features/settings/account/*`
- `apps/VCSM/src/features/settings/profile/*`
- `apps/VCSM/src/features/settings/privacy/*`
- `apps/VCSM/src/features/settings/vports/*`

**Services/DAL:**
- `apps/VCSM/src/features/settings/*/dal/*`
- `apps/VCSM/src/features/vport/dal/vport.core.dal.js`
- `apps/VCSM/supabase/functions/delete-citizen-account/index.ts`

**Supabase schema/tables/RPCs:**
- `platform` user/app records
- `vc.actors`, `moderation.blocks`, `vc.actor_privacy_settings`
- `vport.profiles`
- vport soft/hard delete RPCs

**RLS expectations:** Settings writes must be owner/authenticated-only; account/VPORT delete must use backend RPCs, not raw table delete fallbacks.

**Current PWA status:** Source of truth for account, profile, privacy, VPORT management, restore, and delete flows.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Settings/SettingsView.swift`
- `VCSMNativeApp/Features/Settings/SettingsViewModel.swift`
- `VCSMNativeApp/Features/Settings/PrivacySettingsView.swift`
- `VCSMNativeApp/Features/Settings/VPortManagementView.swift`
- `VCSMNativeApp/Features/Settings/VPortRestoreScreen.swift`
- `VCSMNativeApp/Features/Settings/VPortManagementCards.swift`
- `VCSMNativeApp/Services/Settings/SettingsService.swift`
- `VCSMNativeApp/Services/Settings/LiveSettingsService.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseSettingsModels.swift`
- `VCSMNativeCore/Sources/VCSMNativeCore/OwnedVPort.swift`

---

## Native Behavior Currently Present

- Native settings, privacy, account/VPORT delete UI, VPORT switch/create/restore, profile editor, invite screen, and view model exist.
- VPORT delete is now a two-step flow: `soft_delete_vport` (deactivate) → `hard_delete_vport` (permanent). `restore_vport` reverses soft delete.
- Citizen account delete now routes through the `delete-citizen-account` Edge Function, which handles both app data RPC and auth user deletion server-side. `AUTH_DELETE_FAILED` partial success forces logout.
- `fetchOwnedVPorts` now selects `is_deleted` from `vport.profiles`; `OwnedVPort` model carries `isDeleted` flag.
- `VPortRestoreScreen` now uses `restore_vport` RPC instead of raw `PATCH vport.profiles`.
- Settings UI shows deactivated/active state per VPORT with appropriate actions (Deactivate / Restore / Delete Permanently).
- Hard delete confirmation requires typing the VPORT name.
- Privacy blocked-user reads now use the current `moderation.blocks` column set and do not request a block `id`.

---

## Native Gaps

- All three VPORT RPCs (`soft_delete_vport`, `restore_vport`, `hard_delete_vport`) are build-verified but runtime-untested.
- Edge Function `delete-citizen-account` call is build-verified but runtime-untested.
- Profile privacy, blocked users, follow requests, and VPORT switcher parity not runtime-tested.
- Settings profile writes confirmed to use `vport.profiles` (not legacy `vc.vports`).

---

## Risk Notes

- `LiveSettingsService.swift` now exposes `softDeleteVPort`, `restoreVPort`, `hardDeleteVPort`, `deleteCitizenAccount`.
- `SupabaseClient.swift` has `softDeleteVPort` → `vport.soft_delete_vport`, `restoreVPort` → `vport.restore_vport`, `hardDeleteVPort` → `vport.hard_delete_vport`, `deleteCitizenAccount` → Edge Function `/functions/v1/delete-citizen-account`.
- `deleteMyAccount` (direct RPC) is deprecated; `deleteMyVPort` renamed to `softDeleteVPort`.
- `SupabaseClient.swift` privacy block reads target `moderation.blocks` without `id`; `moderation.blocks` is keyed by actor/domain fields.

---

## Pending Transfer Checklist

- [x] Remove direct VPORT delete fallback after verifying RPC behavior.
- [x] Remove stale `blocks.id` select from blocked-user settings reads.
- [x] Verify profile settings use `vport.profiles` for VPORT identity/profile data.
- [x] Implement two-step VPORT delete (soft/restore/hard) per `prompts/DELETE_FEATURE_TRANSFER.md`.
- [x] Implement citizen account delete via Edge Function with `AUTH_DELETE_FAILED` handling.
- [x] Add `is_deleted` to `fetchOwnedVPorts` and `OwnedVPort` model.
- [x] Replace raw PATCH restore with `restore_vport` RPC in `VPortRestoreScreen`.
- [x] Update UI for two-step delete flow (deactivate → restore/delete permanently).
- [ ] Runtime test: VPORT soft delete → VPORT disappears from public views.
- [ ] Runtime test: VPORT restore → VPORT reappears.
- [ ] Runtime test: VPORT hard delete → actor voided, identity auto-switch.
- [ ] Runtime test: citizen account delete → forced logout.
- [ ] Regression test: privacy toggles, blocked users, follow requests, vport switch.

---

## PWA → Native Transfer Log

### 2026-05-03 — P0 native transfer start

- Date: 2026-05-03
- Change type: Fix / RLS
- PWA files changed: none — transfer from existing PWA source of truth
- Routes affected: `/settings`, `/vport/restore`
- Screens/components changed: none planned
- Services/DAL changed: `LiveSettingsService.swift`, scoped VPORT delete method in `SupabaseClient.swift`
- Behavior change: remove direct VPORT delete fallback after `delete_my_vport` RPC failure
- Supabase schema/RPC change: `delete_my_vport` RPC only; no direct `vc.vports` delete
- RLS expectations changed: yes — delete must stay behind backend RPC/owner checks
- Affected native modules: Settings, schema-vc, schema-vport
- Priority: P0
- Native status: Risky — build verified
- Testing notes: `swift build --package-path native/VCSMNativeCore` passed; `xcodebuild -project native/VCSMNativeApp/VCSMNativeApp.xcodeproj -scheme VCSMNativeApp -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` passed. Runtime settings/delete regression not yet run.
- Notes: Implementation now surfaces RPC failure rather than bypassing with a raw table delete.

### 2026-05-03 — Runtime schema alignment

- Date: 2026-05-03
- Change type: Fix / Schema
- PWA files changed: none — alignment to `_HISTORY/db/snapshots/schema_20260502b.sql`
- Routes affected: `/settings`
- Screens/components changed: none
- Services/DAL changed: `SupabaseClient.swift`
- Behavior change: privacy blocked-user reads no longer request `moderation.blocks.id`
- Supabase schema/RPC change: confirmed current `moderation.blocks` column set
- RLS expectations changed: no — owner scoped reads remain required
- Affected native modules: Settings, Moderation
- Priority: P0
- Native status: Risky — build verified
- Testing notes: iOS simulator `xcodebuild` passed; static scan found no stale `blocks.id` select. Runtime settings privacy regression not yet run.
- Notes: Addresses screenshot error `column blocks.id does not exist`.

### 2026-05-03 — Delete feature native transfer guide produced

- Date: 2026-05-03
- Change type: Documentation / Planning
- PWA files changed: none
- Routes affected: `/settings`, `/vport/restore`
- Screens/components changed: none
- Services/DAL changed: none — planning only
- Behavior change: n/a
- Supabase schema/RPC change: none — RPCs already deployed (`soft_delete_vport`, `restore_vport`, `hard_delete_vport`, `soft_delete_citizen_account`, Edge Function `delete-citizen-account`)
- RLS expectations changed: no
- Affected native modules: Settings
- Priority: P0
- Native status: Not started — guide produced, implementation pending
- Testing notes: none yet — see guide for full testing checklist
- Notes: Full native implementation guide written to `prompts/DELETE_FEATURE_TRANSFER.md`. Covers VPORT two-step delete (soft/restore/hard), Citizen Edge Function path, AUTH_DELETE_FAILED handling, native files to create/modify, and invariants.

### 2026-05-03 — Delete feature implementation (two-step VPORT + citizen Edge Function)

- Date: 2026-05-03
- Change type: Feature / UI
- PWA files changed: none
- Routes affected: `/settings`, `/vport/restore`
- Screens/components changed: `SettingsView.swift` (two-step delete UI), `VPortRestoreScreen.swift` (RPC restore), `VPortManagementCards.swift` (deactivated badge)
- Services/DAL changed: `SupabaseClient.swift` (added `softDeleteVPort`, `restoreVPort`, `hardDeleteVPort`, `deleteCitizenAccount`; deprecated `deleteMyAccount`), `SettingsService.swift` (protocol updated), `LiveSettingsService.swift` (4 new methods), `SupabaseSettingsModels.swift` (`isDeleted` field), `OwnedVPort.swift` (`isDeleted` property), `fetchOwnedVPorts` select includes `is_deleted`
- Behavior change: VPORT delete is now two-step (deactivate → restore or permanently delete). Hard delete requires typing VPORT name. Citizen delete routes through Edge Function with `AUTH_DELETE_FAILED` partial-success handling (forces logout). VPortRestoreScreen uses `restore_vport` RPC instead of raw PATCH.
- Supabase schema/RPC change: `vport.soft_delete_vport`, `vport.restore_vport`, `vport.hard_delete_vport` RPCs; Edge Function `delete-citizen-account`
- RLS expectations changed: yes — all deletes through backend RPCs/Edge Function only; no raw table writes
- Affected native modules: Settings, schema-vport
- Priority: P0
- Native status: Partial — build verified, runtime testing pending
- Testing notes: Xcode diagnostics zero issues on all files. Runtime testing checklist in `prompts/DELETE_FEATURE_TRANSFER.md`.
- Notes: Implements full spec from `DELETE_FEATURE_TRANSFER.md`. Old `deleteMyVPort` renamed to `softDeleteVPort`. Old `deleteMyAccount` deprecated.

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: `LiveSettingsService.swift`, `SupabaseClient.swift`
- Delta status: Risky — direct delete fallback removal is build-verified; settings runtime parity tests remain open
- Notes: P0 native transfer batch started and build-verified on May 3.

---

## Archived Notes

No archived notes yet.
