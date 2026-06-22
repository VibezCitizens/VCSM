# Dashboard Module Behavior Contract — settings

Status: ACTIVE

Module: settings

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - VENOM-SETTINGS-003
  - BW-SETTINGS-001
  - BW-SETTINGS-002
  - BW-SETTINGS-004
  - DEFER-DASH-004
  - DEFER-DASH-006
  - DEFER-DASH-008
  - DEFER-DASH-009
  - SETTINGS-DEAD-HOOK-001
- Patched Findings:
  - VENOM-SETTINGS-005
  - BW-SETTINGS-003
  - DEFER-DASH-005
  - DEFER-DASH-007
- Security Review Status:
  - VENOM: COMPLETE
  - ELEKTRA: COMPLETE
  - BLACKWIDOW: COMPLETE

Reason:
`settings` has a source-verified final-screen owner gate and controller-layer `actor_owners` gates for public details, TRAZE directory visibility, and business-card settings. The business-card settings controller now imports ownership through the booking adapter boundary, and the orphaned `settings/profile` public-details write DAL has been removed. Current source still exports the unused `useSaveVportPublicDetailsByActorId` hook, which calls the public-details controller directly and bypasses coordinator validation if a future consumer imports it. It remains THOR CAUTION because several active DALs still use legacy `owner_user_id` as a secondary gate, flyerBuilder has an overlapping public-details write path, the dead direct-save hook export needs removal or scanner proof, and hook-level SPIDER-MAN concurrency coverage is still pending.

---

## 1. User Goal

The `settings` dashboard module lets a VPORT owner edit externally visible VPORT business settings. It manages public business details, TRAZE directory visibility, public business-card display settings, dashboard tab overview, and a feature-flagged ads preview.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner actor | View settings, save public details, toggle TRAZE directory visibility, update public business-card display settings, view dashboard tab overview, and open dashboard/ads destinations. | Must pass `useVportOwnership` at screen level and `assertActorOwnsVportActorController` before controller writes. |
| Non-owner actor | No settings edit access. | Final screen blocks render with owner-only copy. |
| Unauthenticated viewer | No settings access. | Final screen renders sign-in requirement. |
| TRAZE/public consumers | Consume settings output through public details, directory visibility, and business-card settings. | Cannot mutate settings through this module. |
| FlyerBuilder module | Has an overlapping `profile_public_details` write concern tracked separately. | Not part of the dashboard settings trust chain; tracked under BW-SETTINGS-002 / DEFER-DASH-006. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/settings`

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/VportSettingsFinalScreen.jsx`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/VportSettingsScreen.jsx`

### Hooks

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/hooks/useSaveVportSettings.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/hooks/useSaveVportPublicDetailsByActorId.js`
- `apps/VCSM/src/features/settings/vports/hooks/useResolvedVportId.js`
- `apps/VCSM/src/features/settings/vports/hooks/useVportDirectoryVisibility.js`
- `apps/VCSM/src/features/settings/vports/hooks/useVportBusinessCardSettings.js`
- `apps/VCSM/src/features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter`
- `apps/VCSM/src/features/ads/adapters/hooks/useVportAds.adapter`

### Controllers

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/controller/settingsCoordinator.controller.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/controller/saveVportPublicDetailsByActorId.controller.js`
- `apps/VCSM/src/features/settings/vports/controller/vportDirectoryVisibility.controller.js`
- `apps/VCSM/src/features/settings/vports/controller/vportBusinessCardSettings.controller.js`

### DALs

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/dal/vportPublicDetails.write.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportProfile.read.dal`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportCities.read.dal`
- `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js`
- `apps/VCSM/src/features/settings/vports/dal/vports.write.dal.js`

### RPCs

- No RPC is used by the dashboard settings card write path.
- Related settings/vports publish-state DAL uses `vport.set_business_card_publish_state`, but that publish-state flow is outside this dashboard settings card screen.

### Edge Functions

- No dashboard settings edge function was found in the module source path.

### Engine Dependencies

- Booking ownership controller/adapter for `assertActorOwnsVportActorController`.
- Profiles adapter for public-details reads, cache invalidation, and dashboard tab metadata.
- Public business-card model for settings defaults and deep merge.
- Ads adapter for feature-flagged ads preview.
- TRAZE/public directory consumers depend on persisted visibility/public details.

### Ownership Gates

- Final screen: `useVportOwnership(viewerActorId, actorId)`.
- Public details write: `saveVportPublicDetailsByActorIdController` asserts caller owns target VPORT actor before profile read or write.
- Direct public-details hook: `useSaveVportPublicDetailsByActorId` also calls `saveVportPublicDetailsByActorIdController` with session actor id and cache invalidation, but it bypasses `settingsSaveCoordinator` validation and appears unused except for the module barrel export.
- TRAZE visibility read/write: `ctrlGetVportDirectoryState` and `ctrlSetVportDirectoryVisible` assert actor ownership.
- Business-card settings read/write: `ctrlGetVportBusinessCardSettings` and `ctrlSetVportBusinessCardSettings` assert actor ownership.
- DALs retain `owner_user_id = auth.uid()` checks as secondary or legacy gates.

---

## 4. Happy Paths

### HP-001

BEH-DASH-settings-001

Preconditions:

- Viewer is signed in.
- Viewer owns the target VPORT actor.

Flow:

Owner opens `/actor/:actorId/dashboard/settings`.
`VportSettingsFinalScreen` reads route `actorId`.
Final screen reads identity and calls `useVportOwnership`.
If owner, final screen renders `VportSettingsScreen`.
View screen loads public details, resolved VPORT profile id, directory state, business-card settings, dashboard tab metadata, and ads preview data.

Expected Result:

Owner sees VPORT settings cards and editable public details form.

Data Changes:

None.

---

### HP-002

BEH-DASH-settings-002

Preconditions:

- Owner screen is mounted.
- Public details data has loaded or normalized to a draft.

Flow:

Owner edits public details fields.
`useSaveVportSettings.onChange` updates local draft and clears saved/error state.
Owner saves.
Hook calls `settingsSaveCoordinator`.
Coordinator normalizes address and phone, validates partial/format errors, and delegates to `saveVportPublicDetailsByActorIdController`.
Controller asserts actor ownership, resolves profile id from actor id, maps payload to row, attempts non-blocking city resolution, and calls `upsertVportPublicDetailsDAL`.
Controller invalidates public details cache.
Hook updates `cityId`, marks saved, and opens saved toast.

Expected Result:

Public details are upserted and the UI shows saved state.

Data Changes:

- Upsert into `vport.profile_public_details`.

---

### HP-003

BEH-DASH-settings-003

Preconditions:

- Owner screen is mounted.
- Resolved VPORT profile id is available.
- Directory status is not `suspended`.

Flow:

Owner toggles TRAZE directory visibility.
`VportSettingsTrazeCard` calls `toggleDirectoryVisible`.
`useVportDirectoryVisibility` calls `ctrlSetVportDirectoryVisible`.
Controller asserts actor ownership, calls `setVportDirectoryVisibleDAL`, then attempts non-blocking sync to `profile_public_details`.

Expected Result:

Directory visibility updates in UI and authoritative `vport.profiles.directory_visible`.

Data Changes:

- Update `vport.profiles.directory_visible`.
- Best-effort update of `vport.profile_public_details.directory_visible`.

---

### HP-004

BEH-DASH-settings-004

Preconditions:

- Owner screen is mounted.
- Resolved VPORT profile id is available.

Flow:

Owner toggles business-card display options.
`VportSettingsBusinessCard` calls `updateCardSettings`.
`useVportBusinessCardSettings` deep-merges the patch with current raw settings.
Hook calls `ctrlSetVportBusinessCardSettings`.
Controller validates inputs, asserts actor ownership, and calls `setVportBusinessCardSettingsDAL`.

Expected Result:

Business-card display settings are updated and effective settings reflect the merged state.

Data Changes:

- Update `vport.profiles.business_card_settings`.

---

### HP-005

BEH-DASH-settings-005

Preconditions:

- Owner screen is mounted.

Flow:

View screen derives dashboard card metadata from VPORT type.
Owner reviews dashboard tab list and clicks Open Dashboard.

Expected Result:

Owner navigates back to `/actor/:actorId/dashboard`.

Data Changes:

None.

---

### HP-006

BEH-DASH-settings-006

Preconditions:

- `releaseFlags.vportAdsPipeline` is enabled.

Flow:

View screen renders `VportSettingsAdsPreview` with ads loaded by `useVportAds`.
Owner opens an ad preview.

Expected Result:

Owner navigates to `/ads/vport/:id`.

Data Changes:

None from this settings screen.

---

## 5. Failure Paths

### FP-001

BEH-DASH-settings-101

Trigger:

Route has no `actorId`.

Expected System Behavior:

Final screen returns null.

Expected UI Behavior:

No settings UI renders.

Expected Logging:

No required logging found in source.

---

### FP-002

BEH-DASH-settings-102

Trigger:

Viewer is unauthenticated.

Expected System Behavior:

Final screen blocks before view screen mount.

Expected UI Behavior:

Displays `Sign in required.`

Expected Logging:

No required logging found in source.

---

### FP-003

BEH-DASH-settings-103

Trigger:

Viewer is not owner of target VPORT actor.

Expected System Behavior:

Final screen blocks before view screen mount.

Expected UI Behavior:

Displays `You can only edit settings for your own vport.`

Expected Logging:

No required logging found in source.

---

### FP-004

BEH-DASH-settings-104

Trigger:

Save begins while `saving`, missing actor id, not owner, loading data, or no draft.

Expected System Behavior:

`useSaveVportSettings.onSave` returns without dispatching coordinator.

Expected UI Behavior:

No duplicate save is dispatched.

Expected Logging:

No required logging found in source.

---

### FP-005

BEH-DASH-settings-105

Trigger:

Address is partially started but incomplete.

Expected System Behavior:

`settingsSaveCoordinator` returns `{ ok: false, error: "Please enter full address." }` before controller call.

Expected UI Behavior:

Hook shows toast with validation message.

Expected Logging:

No required logging found in source.

---

### FP-006

BEH-DASH-settings-106

Trigger:

Address has invalid city, state, ZIP, or country format.

Expected System Behavior:

Coordinator returns a validation error before controller call.

Expected UI Behavior:

Hook shows toast with validation message.

Expected Logging:

No required logging found in source.

---

### FP-007

BEH-DASH-settings-107

Trigger:

Phone has non-empty normalized digits but not exactly 10 US digits.

Expected System Behavior:

Coordinator returns `Enter a valid 10-digit phone number.` before controller call.

Expected UI Behavior:

Hook shows toast with validation message.

Expected Logging:

No required logging found in source.

---

### FP-008

BEH-DASH-settings-108

Trigger:

Controller save call is missing `actorId` or `requestActorId`.

Expected System Behavior:

`saveVportPublicDetailsByActorIdController` throws required-field error.

Expected UI Behavior:

Hook stores error message.

Expected Logging:

No required logging found in source.

---

### FP-009

BEH-DASH-settings-109

Trigger:

Caller does not own target VPORT actor.

Expected System Behavior:

Ownership assertion rejects before settings DB read/write.

Expected UI Behavior:

Hook stores or surfaces thrown error.

Expected Logging:

No required logging found in source.

---

### FP-010

BEH-DASH-settings-110

Trigger:

City resolution fails during public-details save.

Expected System Behavior:

Controller catches city resolution failure, logs in DEV only, sets `city_id: null`, and continues save.

Expected UI Behavior:

Save can still succeed.

Expected Logging:

DEV-only warning in `saveVportPublicDetailsByActorIdController`.

---

### FP-011

BEH-DASH-settings-111

Trigger:

TRAZE directory status is `suspended`.

Expected System Behavior:

Toggle is disabled and controller is not called from UI.

Expected UI Behavior:

Displays suspension message.

Expected Logging:

No required logging found in source.

---

### FP-012

BEH-DASH-settings-112

Trigger:

Directory visibility secondary sync to public details fails after primary profile update.

Expected System Behavior:

Controller logs warning and returns primary update result.

Expected UI Behavior:

Toggle can still appear successful because `vport.profiles` is authoritative.

Expected Logging:

`console.warn` in `ctrlSetVportDirectoryVisible`.

---

## 6. Security Rules

### SEC-001

BEH-DASH-settings-201

Rule:

Only owners may mount dashboard settings view for a VPORT actor.

Enforcement Layer:

Final screen: `VportSettingsFinalScreen`.

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-002

BEH-DASH-settings-202

Rule:

Public-details save must assert actor ownership before resolving profile id or writing public details.

Enforcement Layer:

Controller: `saveVportPublicDetailsByActorIdController`.

Current Status:

SOURCE VERIFIED.

Finding Links:

None for settings trust chain.

---

### SEC-003

BEH-DASH-settings-203

Rule:

TRAZE directory visibility reads/writes must assert actor ownership.

Enforcement Layer:

Controller: `vportDirectoryVisibility.controller.js`.

Current Status:

SOURCE VERIFIED.

Finding Links:

VENOM-SETTINGS-003 / BW-SETTINGS-004 remain open because DALs still use legacy `owner_user_id` as secondary checks.

---

### SEC-004

BEH-DASH-settings-204

Rule:

Business-card settings reads/writes must assert actor ownership.

Enforcement Layer:

Controller: `vportBusinessCardSettings.controller.js`.

Current Status:

SOURCE VERIFIED.

Finding Links:

VENOM-SETTINGS-005 is PATCHED / SOURCE VERIFIED. `vportBusinessCardSettings.controller.js` now imports `assertActorOwnsVportActorController` from the canonical booking adapter boundary.

---

### SEC-005

BEH-DASH-settings-205

Rule:

Public-details upsert must use normalized payload and must not trust arbitrary profile id from UI.

Enforcement Layer:

Controller/model/DAL: actor id -> profile id resolution, `mapPayloadToRow`, `upsertVportPublicDetailsDAL`.

Current Status:

SOURCE VERIFIED.

Finding Links:

VENOM-SETTINGS-003.

---

### SEC-006

BEH-DASH-settings-206

Rule:

Validation failures must stop before controller/DAL writes.

Enforcement Layer:

Coordinator/model: `settingsSaveCoordinator`, `vportSettingsValidation.model.js`.

Current Status:

SOURCE VERIFIED and TEST COVERED.

Finding Links:

None.

---

### SEC-007

BEH-DASH-settings-207

Rule:

Double-submit must not create an exploitable cross-owner write or trust-boundary bypass.

Enforcement Layer:

Hook guard plus idempotent upsert semantics.

Current Status:

SOURCE VERIFIED / PARTIAL TEST COVERAGE.

Finding Links:

BW-SETTINGS-001, DEFER-DASH-008.

---

### SEC-008

BEH-DASH-settings-208

Rule:

Overlapping writes to `vport.profile_public_details` from other modules must not bypass the settings trust chain.

Enforcement Layer:

Cross-module governance.

Current Status:

OPEN outside settings card.

Finding Links:

BW-SETTINGS-002, DEFER-DASH-006.

---

### SEC-009

BEH-DASH-settings-209

Rule:

Orphaned or dead public-details write DALs must not be activated without coordinator/ownership gates.

Enforcement Layer:

Code ownership and scanner governance.

Current Status:

OPEN / currently unreachable per governance docs.

Finding Links:

BW-SETTINGS-003, DEFER-DASH-007.

---

### SEC-010

BEH-DASH-settings-210

Rule:

Public-details writes must pass through the settings coordinator when invoked from settings UI so address/phone validation remains part of the trust chain.

Enforcement Layer:

Hook/export boundary: `useSaveVportSettings`, `settingsSaveCoordinator`, `useSaveVportPublicDetailsByActorId`, `cards/settings/index.js`.

Current Status:

OPEN. Current screen uses `useSaveVportSettings` and coordinator validation, but `cards/settings/index.js` still exports unused `useSaveVportPublicDetailsByActorId`, which calls `saveVportPublicDetailsByActorIdController` directly. The controller still enforces ownership, but future consumers of this exported hook would bypass coordinator validation.

Finding Links:

SETTINGS-DEAD-HOOK-001.

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-settings-301

Invariant:

A non-owner must never mount the settings view screen for another VPORT.

Current Status:

SOURCE VERIFIED.

Related Findings:

None.

Required Tests:

TESTREQ-DASH-settings-001.

---

### MNH-002

BEH-DASH-settings-302

Invariant:

Public details must never be saved before actor ownership is verified.

Current Status:

SOURCE VERIFIED.

Related Findings:

None for settings trust chain.

Required Tests:

TESTREQ-DASH-settings-002.

---

### MNH-003

BEH-DASH-settings-303

Invariant:

Validation failures must never reach public-details controller or DAL.

Current Status:

SOURCE VERIFIED and TEST COVERED.

Related Findings:

None.

Required Tests:

Existing coordinator tests.

---

### MNH-004

BEH-DASH-settings-304

Invariant:

Business-card settings and TRAZE visibility toggles must never rely only on `owner_user_id` without actor-owner controller gates.

Current Status:

SOURCE VERIFIED.

Related Findings:

VENOM-SETTINGS-003, BW-SETTINGS-004.

Required Tests:

TESTREQ-DASH-settings-003.

---

### MNH-005

BEH-DASH-settings-305

Invariant:

Concurrent save/toggle spam must never bypass ownership or corrupt another actor's public settings.

Current Status:

SOURCE VERIFIED / PARTIAL TEST COVERAGE.

Related Findings:

BW-SETTINGS-001.

Required Tests:

TESTREQ-DASH-settings-004.

---

### MNH-006

BEH-DASH-settings-306

Invariant:

Other dashboard modules must never write overlapping settings-owned public details without equivalent ownership gates.

Current Status:

OPEN outside settings card.

Related Findings:

BW-SETTINGS-002.

Required Tests:

TESTREQ-DASH-settings-005.

---

### MNH-007

BEH-DASH-settings-307

Invariant:

Dead/orphaned public-details write DALs must never become reachable without settings coordinator governance.

Current Status:

PATCHED / SOURCE VERIFIED - orphaned DAL removed.

Related Findings:

BW-SETTINGS-003 patched by deleting `settings/profile/dal/vportPublicDetails.write.dal.js` and removing the dev diagnostics write probe.

Required Tests:

TESTREQ-DASH-settings-006.

---

### MNH-008

BEH-DASH-settings-308

Invariant:

An exported settings hook must never allow a future consumer to save public details without the settings coordinator validation path unless the bypass is explicitly approved and tested.

Current Status:

OPEN. `useSaveVportPublicDetailsByActorId` is currently unused by source search and scanner dead-export output, but remains exported from the settings card barrel.

Related Findings:

SETTINGS-DEAD-HOOK-001.

Required Tests:

TESTREQ-DASH-settings-008.

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.profile_public_details` | Yes: via public details adapter. | Yes: upsert on `profile_id` conflict. | Yes: public details fields and best-effort directory visibility sync. | No source-verified delete surface found. |
| `vport.profiles` | Yes: profile id resolution, directory state, business-card settings, dashboard detail inputs. | No. | Yes: `directory_visible`, `business_card_settings`. | No source-verified delete surface in dashboard settings card. |
| `vport.cities` / city resolution path | Yes/create behavior hidden behind `resolveVportCity`. | Possible through resolver dependency; non-blocking and not audited in this pass. | Not source-verified in this module pass. | No. |
| `vc.actor_owners` | Yes: ownership assertion. | No. | No. | No. |

---

## 9. Side Effects

Notifications:

- No notification side effect found in dashboard settings card source.

Analytics:

- No analytics side effect found in source.

Media:

- No media mutation found in dashboard settings card source.

Exports:

- No export side effect found in source.

Jobs:

- No background job enqueue found in source.

Cache:

- Public-details save calls `invalidateVportPublicDetails(actorId)`.
- Hooks update local React state after save/toggle actions.

Other:

- City resolution failure is non-blocking.
- Directory visibility sync from `vport.profiles` to `profile_public_details` is non-blocking.
- Toast lifecycle communicates save success and validation errors.

---

## 10. UI Outputs

Loading States:

- Final screen shows `SkeletonCardList` while identity/ownership loads.
- TRAZE and business-card cards show loading states while their hooks load.
- Public details form receives `loadingData`.

Success States:

- Public details save shows `Saved` toast.
- Directory toggle and business-card toggles update local state after successful writes.

Error States:

- Sign-in required.
- Owner-only settings error.
- Public-details save error string.
- Validation toast messages.
- Directory and business-card card error messages.

Empty States:

- Dashboard tab list can render from default VPORT type/card metadata.
- Ads preview is omitted unless feature flag is enabled.

Owner States:

- Owner can edit public details, toggle TRAZE visibility unless suspended, and update business-card display settings.

Public States:

- Persisted values affect public business cards, TRAZE directory visibility, QR landing pages, and public VPORT details consumers.

---

## 11. Acceptance Criteria

### AC-DASH-settings-001

Requirement:

Settings view renders only after owner verification.

Evidence:

`VportSettingsFinalScreen.jsx`

Status:

SOURCE VERIFIED.

---

### AC-DASH-settings-002

Requirement:

Public-details save validates draft before persistence and stops invalid address/phone payloads before controller writes.

Evidence:

`settingsCoordinator.controller.js`, `settingsCoordinator.controller.test.js`

Status:

SOURCE VERIFIED and TEST COVERED.

---

### AC-DASH-settings-003

Requirement:

Public-details save asserts actor ownership before profile read/upsert.

Evidence:

`saveVportPublicDetailsByActorId.controller.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-settings-004

Requirement:

TRAZE visibility and business-card settings use controller-layer actor-owner gates.

Evidence:

`vportDirectoryVisibility.controller.js`, `vportBusinessCardSettings.controller.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-settings-005

Requirement:

Settings public module boundary does not export controllers or DALs.

Evidence:

`CURRENT_STATUS.md` TICKET-0009; `cards/settings/index.js` should remain adapter-safe.

Status:

SOURCE/GOVERNANCE VERIFIED.

---

### AC-DASH-settings-006

Requirement:

Legacy `owner_user_id` DAL checks are migrated or formally accepted as defense-in-depth only.

Evidence:

`vportPublicDetails.write.dal.js`, `settings/vports/dal/vports.read.dal.js`, `settings/vports/dal/vports.write.dal.js`

Status:

OPEN.

---

### AC-DASH-settings-007

Requirement:

Unused direct-save public-details hook is removed from the public settings barrel or proven unreachable by scanner and kept out of production-facing imports.

Evidence:

`useSaveVportPublicDetailsByActorId.js`, `cards/settings/index.js`, scanner dead-export output.

Status:

OPEN.

---

## 12. Test Requirements

### TESTREQ-DASH-settings-001

Validates:

Unauthenticated and non-owner viewers cannot mount settings view screen.

Type:

Screen/hook integration.

Status:

MISSING.

---

### TESTREQ-DASH-settings-002

Validates:

`saveVportPublicDetailsByActorIdController` requires `requestActorId`, asserts ownership before profile read/write, maps payload, handles city resolution failure, and invalidates cache.

Type:

Controller unit test.

Status:

MISSING.

---

### TESTREQ-DASH-settings-003

Validates:

Directory visibility and business-card settings controllers require caller actor id, target VPORT actor id, and reject unauthorized callers before DAL calls.

Type:

Controller unit test.

Status:

MISSING.

---

### TESTREQ-DASH-settings-004

Validates:

`useSaveVportSettings` hook-level saving guard prevents second save dispatch while `saving` is true.

Type:

Hook test with React testing library.

Status:

MISSING / TRACKED BY BW-SETTINGS-001.

---

### TESTREQ-DASH-settings-005

Validates:

No other dashboard module writes overlapping `profile_public_details` fields without an equivalent actor-owner controller gate.

Type:

Security path/scanner assertion.

Status:

MISSING / TRACKED BY BW-SETTINGS-002.

---

### TESTREQ-DASH-settings-006

Validates:

Orphaned `settings/profile/dal/vportPublicDetails.write.dal.js` remains unreachable or is removed.

Type:

Import graph/scanner assertion.

Status:

COVERED - source/import scan confirms the orphaned `settings/profile` public-details write DAL is removed and no source imports remain.

---

### TESTREQ-DASH-settings-007

Validates:

Coordinator address/phone validation and delegation behavior.

Type:

Controller unit test.

Status:

COMPLETE.

---

### TESTREQ-DASH-settings-008

Validates:

No production source imports `useSaveVportPublicDetailsByActorId`, and the settings card barrel does not expose a public-details save path that bypasses `settingsSaveCoordinator` validation.

Type:

Import graph/scanner assertion.

Status:

MISSING / TRACKED BY SETTINGS-DEAD-HOOK-001.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| VENOM-SETTINGS-003 | LOW | OPEN | BEH-DASH-settings-203, BEH-DASH-settings-304, AC-DASH-settings-006 |
| VENOM-SETTINGS-005 | INFO | PATCHED / SOURCE VERIFIED | BEH-DASH-settings-204 |
| BW-SETTINGS-001 | INFO / UX | OPEN | BEH-DASH-settings-207, BEH-DASH-settings-305, TESTREQ-DASH-settings-004 |
| BW-SETTINGS-002 | MEDIUM / cross-feature | OPEN | BEH-DASH-settings-208, BEH-DASH-settings-306, TESTREQ-DASH-settings-005 |
| BW-SETTINGS-003 | LOW | PATCHED / SOURCE VERIFIED | BEH-DASH-settings-209, BEH-DASH-settings-307, TESTREQ-DASH-settings-006 |
| BW-SETTINGS-004 | INFO | OPEN | BEH-DASH-settings-203, BEH-DASH-settings-304 |
| SETTINGS-DEAD-HOOK-001 | LOW / dead export | OPEN | BEH-DASH-settings-210, BEH-DASH-settings-308, AC-DASH-settings-007, TESTREQ-DASH-settings-008 |
| SETTINGS-ARCH-001 | Architecture | RESOLVED | BEH-DASH-settings-002, AC-DASH-settings-002 |
| VENOM-SETTINGS-001 | Architecture/security | RESOLVED | AC-DASH-settings-005 |
| VENOM-SETTINGS-002 | DB RLS | RESOLVED | BEH-DASH-settings-202 |
| VENOM-SETTINGS-004 | Legacy read DAL | RESOLVED IN SOURCE | AC-DASH-settings-006 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Final-screen owner gate. | SOURCE VERIFIED | No |
| Settings coordinator owns validation orchestration. | TEST COVERED | No |
| Public-details controller ownership gate. | SOURCE VERIFIED | No |
| TRAZE/business-card controller ownership gates. | SOURCE VERIFIED | No |
| Settings card public index exports no controllers/DALs. | GOVERNANCE VERIFIED | No |
| Legacy `owner_user_id` secondary DAL checks migrated or formally accepted. | OPEN | Yes for CLEAR |
| Orphaned public-details write DAL removed or proven unreachable by scanner. | COMPLETE | No |
| Direct-save public-details hook removed or proven unreachable. | OPEN | Yes for behavior approval |
| FlyerBuilder overlapping public-details write path remediated or isolated. | OPEN IN FLYERBUILDER | Yes for dashboard-wide CLEAR |
| Hook-level SPIDER-MAN concurrency test added. | MISSING | Yes for SPIDER-MAN COMPLETE |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Public details editing | Not source-verified in this pass. | OPEN QUESTION |
| TRAZE directory visibility toggle | Not source-verified in this pass. | OPEN QUESTION |
| Business-card settings toggles | Not source-verified in this pass. | OPEN QUESTION |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| Booking ownership controller/adapter | Actor-owner gate for settings writes. | ACTIVE |
| Profiles adapter | Public-details read/cache invalidation and dashboard tab metadata. | ACTIVE |
| Public business-card model | Defaults, section toggles, and deep merge for card settings. | ACTIVE |
| Ads adapter | Feature-flagged ads preview. | ACTIVE |
| TRAZE/external directory consumers | Consume directory visibility and public details. | DOWNSTREAM IMPACT |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-settings-001 | Should all remaining `owner_user_id` checks in settings DALs be migrated to actor-owner scoped DAL/RPC patterns? | OPEN |
| OQ-DASH-settings-002 | Should `vportBusinessCardSettings.controller.js` import ownership through the booking adapter rather than internal controller path? | RESOLVED — now imports through `@/features/booking/adapters/booking.adapter`. |
| OQ-DASH-settings-003 | Should `settings/profile/dal/vportPublicDetails.write.dal.js` be deleted as unreachable dead code? | RESOLVED — deleted; dev diagnostics write probe removed. |
| OQ-DASH-settings-004 | Should flyerBuilder public-details writes delegate through the settings coordinator? | OPEN |
| OQ-DASH-settings-005 | Should directory visibility sync failure be surfaced to observability instead of `console.warn` only? | OPEN |
| OQ-DASH-settings-006 | Which native or alternate UI must preserve settings parity? | OPEN |
| OQ-DASH-settings-007 | Should `useSaveVportPublicDetailsByActorId` be deleted or made private so all settings UI saves go through `settingsSaveCoordinator`? | OPEN |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | Yes |
| Actors / Roles | HIGH | Yes |
| Module Architecture | HIGH | Yes |
| Happy Paths | HIGH | Yes |
| Failure Paths | HIGH | Yes |
| Security Rules | HIGH | Yes |
| Must Never Happen | HIGH | Yes |
| Data Changes | HIGH | Yes |
| Side Effects | HIGH | Yes |
| UI Outputs | HIGH | Yes |
| Acceptance Criteria | HIGH | Yes |
| Test Requirements | HIGH | Yes |
| Security Findings Linked | HIGH | Yes |
| THOR Release Gates | HIGH | Yes |
| Native / Alternate UI Parity | LOW | Missing source |
| Engine Dependencies | HIGH | Yes |
| Open Questions | HIGH | Yes |
| Command Sign-Off | MEDIUM | Derived from dashboard matrix, source, and governance docs |

---

## 19. Command Sign-Off

ARCHITECT: DRAFTED - final/view split, coordinator, controller, DAL, hook, and cross-feature settings dependencies mapped.

VENOM: COMPLETE WITH CAUTION - zero exploitable settings trust-chain paths in governance; adapter import cleanup is patched; legacy DAL checks and cross-feature overlap remain deferred.

ELEKTRA: COMPLETE WITH CAUTION - controller ownership gates are source-verified; adapter import cleanup and dead DAL removal are patched; legacy DAL patterns remain cleanup items.

BLACKWIDOW: COMPLETE WITH CAUTION - adversarial pass found zero exploitable settings trust-chain paths; dead-code concern is patched; cross-feature concern remains open.

SPIDER-MAN: PARTIAL - coordinator tests exist; hook-level concurrency and ownership-controller tests are missing.

PROFESSOR X: DRAFT READY FOR REVIEW.

THOR: CAUTION - not eligible for CLEAR until legacy DAL checks, direct-save hook export, cross-feature overlap, and missing tests are closed or formally accepted.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding ID | Handoff |
|---|---|---|---|
| Settings route (/actor/:actorId/settings) not confirmed in scanner route-map | MEDIUM | ARCHITECT_VERIFIED | HAWKEYE |
| Cache/runtime behavior after settings save (invalidateVportPublicDetails) undocumented at module level | MEDIUM | ARCHITECT_VERIFIED | LOKI |
| Dual ownership model inconsistency: vportPublicDetails DAL uses owner_user_id vs actor_owners in controller | MEDIUM | VEN-DASHBOARD-002 | VENOM |
| No native parity notes | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: 2 test files present (settingsCoordinator + settingsSavingGuard regression) — good coverage.

Ownership enforcement: [ARCHITECT_VERIFIED] actorId-scoped write in saveVportPublicDetailsByActorId.controller. settingsSavingGuard.regression.test.js confirms guard. VEN-DASHBOARD-002 notes DAL-level dual ownership model inconsistency — pending VENOM resolution.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/settings/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §8 (settings: UPSERT public details), §11 (side effect: invalidateVportPublicDetails)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md (VEN-DASHBOARD-001, VEN-DASHBOARD-002)
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_ACTIVE — Settings save flow documented. Regression test confirms save guard. Dual ownership model inconsistency (VEN-DASHBOARD-002) routes to VENOM for resolution.
