# Dashboard Module Behavior Contract — services

Status: PARTIAL

Module: services

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - SERVICES-SPIDER-001
  - SERVICES-RLS-001
  - SERVICES-ADDON-AUTH-001
  - SERVICES-ADDON-DAL-001
  - SERVICES-DELETE-HOOK-001
  - SERVICES-OWNERSHIP-PRIMITIVE-001
  - SERVICES-ACTING-AS-VPORT-001
  - SERVICES-LOCKSMITH-WARNINGS-001
- Security Review Status:
  - VENOM: COMPLETE at dashboard matrix level; current source has patched owner-mode read gating and primary service upsert ownership checks.
  - ELEKTRA: COMPLETE at dashboard matrix level; active dashboard source-to-sink path is delegated through profile service controllers/DALs.
  - BLACKWIDOW: COMPLETE at dashboard matrix level; non-owner is denied before `allowOwnerEditing=true`, but addon adapter debt remains open.

---

## 1. User Goal

The `services` dashboard module lets a VPORT owner manage which catalog services their VPORT offers. The owner can load a type-specific service catalog, toggle services on or off in a draft state, save changed enablement, and return to the dashboard.

Public/profile service rendering uses the same profile services view in viewer mode, where only enabled services are shown.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner actor | Open dashboard services, view owner-mode catalog, toggle service enablement, save changes. | Must pass dashboard `useVportOwnership` and controller `assertActorOwnsVportActorController` before owner-mode reads and writes. |
| Non-owner authenticated actor | No dashboard service management actions. | Dashboard returns `You can only manage services for your own vport.` before `allowOwnerEditing=true`. |
| Anonymous visitor | No dashboard service management actions. | Dashboard returns `Sign in required.` when identity is absent. |
| Public/profile viewer | View enabled service catalog in viewer mode. | Cannot see disabled/inactive owner catalog state and cannot save changes. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/services`
- No active `/dashboard/services` route was found in the protected route table.
- No active `/vport/:actorId/dashboard/services` legacy redirect was found in the protected route table.
- Module README/status files may still reference older service dashboard route shapes; current runtime source uses the actor route.

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/services/VportDashboardServicesScreen.jsx`
- Delegated adapter target: `apps/VCSM/src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx`
- Current dashboard screen performs route identity/ownership gating and desktop portal rendering, then delegates service behavior to the profile services view.

### Hooks

- Dashboard shell: `useIdentity`, `useVportOwnership`, `useDesktopBreakpoint`
- Delegated services view: `useVportServices`, `useUpsertVportServices`, `useLocksmithProfile`
- Dormant addon hooks found but not wired in the current dashboard owner panel: `useCreateOrUpdateVportServiceAddon`, `useDeleteVportServiceAddon`, `useReorderVportServiceAddon`

### Controllers

- No dashboard-local services controller exists.
- Active delegated controllers:
  - `getVportServicesController`
  - `upsertVportServicesController`
- Dormant/debt controllers found:
  - `createOrUpdateVportServiceAddonController`
  - `deleteVportServiceAddonController`
  - `reorderVportServiceAddonController`

### DALs

- `readVportTypeByActorId`
- `readVportServiceCatalogByType`
- `readVportServicesByActor`
- `readVportServiceAddonsByActor`
- `upsertVportServicesByActorDal`
- `resolveVportProfileId`
- `deleteVportServiceAddonDal`
- Locksmith provisioning path: `dalInsertLocksmithServiceDetailDefaults`

### RPCs

No RPC was found in the active dashboard services path.

### Edge Functions

No edge function was found in the active dashboard services path.

### Engine Dependencies

No direct engine import was found in the dashboard services card. The module depends on profile services adapters, VPORT service models, shared TTL cache, and the booking adapter ownership primitive.

### Ownership Gates

- Dashboard gate: `useVportOwnership(viewerActorId, actorId)`.
- Owner-mode read gate: `getVportServicesController` requires `callerActorId` when `asOwner=true` and calls `assertActorOwnsVportActorController`.
- Service enablement write gate: `upsertVportServicesController` requires `identityActorId` and calls `assertActorOwnsVportActorController`.
- Current service save hook passes `identity.actorId` directly as `identityActorId`. It does not resolve a user-kind owner actor from `availableActors` when acting as a VPORT; the shared ownership assertion rejects VPORT-kind request actors.
- DAL write scope: `upsertVportServicesByActorDal` resolves `profile_id` from target `actorId` before upsert.
- Addon delete controller has an ownership gate, but current hook does not pass `callerActorId`.
- Addon create/update and reorder controllers do not have application-layer ownership checks and rely on RLS; their imported DAL files for create/update/reorder are absent in the current services DAL folder.

---

## 4. Happy Paths

### HP-001

BEH-DASH-services-001

Preconditions:

- User is signed in.
- Route includes a valid VPORT actor ID.
- `useVportOwnership(viewerActorId, actorId)` resolves owner access.

Flow:

Owner opens dashboard services.
↓
`VportDashboardServicesScreen` waits for identity and ownership loading.
↓
Screen denies unauthenticated, invalid actor, and non-owner states.
↓
Screen renders `VportServicesView` with `allowOwnerEditing={true}`.
↓
`useVportServices` calls `getVportServicesController` with `asOwner=true` and `callerActorId`.
↓
Controller asserts actor ownership, resolves VPORT type if needed, reads catalog, actor services, and service addons.
↓
Model merges catalog rows and actor service rows.
↓
Owner panel renders grouped catalog services and draft state.

Expected Result:

Owner sees all active owner-mode catalog items, including disabled service state, grouped by category.

Data Changes:

None.

---

### HP-002

BEH-DASH-services-002

Preconditions:

- Owner sees the service owner panel.
- Catalog services are loaded.

Flow:

Owner clicks a service badge.
↓
`VportServicesOwnerCategorySection` calls `onToggleService({ key, enabled })`.
↓
`VportServicesView` updates local `draftEnabledMap`.
↓
Dirty state becomes true.
↓
Toolbar changes from `Saved` to `Save`.

Expected Result:

The selected service toggles in local draft state but does not write until Save.

Data Changes:

None.

---

### HP-003

BEH-DASH-services-003

Preconditions:

- Owner has dirty service enablement changes.
- `targetActorId` and resolved VPORT type are available.

Flow:

Owner selects Save.
↓
`VportServicesView.onSave` computes changed service keys.
↓
`useUpsertVportServices.mutate` passes identity actor ID, target actor ID, VPORT type, and changed items.
↓
`upsertVportServicesController` validates inputs and asserts actor ownership.
↓
Controller resolves catalog type, reads catalog, filters submitted keys to valid catalog entries, and builds payload rows.
↓
`upsertVportServicesByActorDal` resolves target profile ID and upserts rows into `vport.services`.
↓
On success, `VportServicesView` refetches owner-mode state.

Expected Result:

Changed services are persisted and draft state returns to synced.

Data Changes:

- Upsert into `vport.services`.

Current Caveat:

If the active identity is VPORT-kind, `useUpsertVportServices` passes that VPORT actor as the requester. `assertActorOwnsVportActorController` rejects VPORT-kind requesters, so save requires a user-kind owner identity in the current source.

---

### HP-004

BEH-DASH-services-004

Preconditions:

- VPORT type is locksmith.
- Owner saves enabled service rows.

Flow:

Primary service upsert succeeds.
↓
Controller filters enabled saved rows.
↓
For each enabled row, controller attempts `dalInsertLocksmithServiceDetailDefaults`.
↓
Provisioning failures are collected with `Promise.allSettled`.
↓
Controller returns `provisioningWarnings` when failures exist.

Expected Result:

Locksmith service detail defaults are provisioned when possible; failures are returned as structured warnings.

Data Changes:

- Optional insert/upsert into `vport.locksmith_service_details`.

---

### HP-005

BEH-DASH-services-005

Preconditions:

- Services view is rendered in public/profile viewer mode with `allowOwnerEditing=false`.

Flow:

Viewer opens services profile tab.
↓
`useVportServices` calls controller with `asOwner=false`.
↓
Controller may use 60-second viewer cache.
↓
Controller reads active catalog and enabled actor services.
↓
Viewer panel renders enabled services only.

Expected Result:

Viewer sees public enabled services and cannot edit.

Data Changes:

None.

---

## 5. Failure Paths

### FP-001

BEH-DASH-services-101

Trigger:

Identity or ownership check is loading.

Expected System Behavior:

Dashboard does not render owner editor until loading completes.

Expected UI Behavior:

`SkeletonCardList` renders.

Expected Logging:

No logging found in source.

---

### FP-002

BEH-DASH-services-102

Trigger:

User is not signed in.

Expected System Behavior:

Dashboard denies access.

Expected UI Behavior:

`Sign in required.`

Expected Logging:

No logging found in source.

---

### FP-003

BEH-DASH-services-103

Trigger:

Route lacks actor ID.

Expected System Behavior:

Dashboard denies invalid target.

Expected UI Behavior:

`Invalid vport.`

Expected Logging:

No logging found in source.

---

### FP-004

BEH-DASH-services-104

Trigger:

Viewer is not the VPORT owner.

Expected System Behavior:

Dashboard does not pass `allowOwnerEditing=true`.

Expected UI Behavior:

`You can only manage services for your own vport.`

Expected Logging:

No logging found in source.

---

### FP-005

BEH-DASH-services-105

Trigger:

Owner-mode controller call lacks `callerActorId` or fails ownership assertion.

Expected System Behavior:

`getVportServicesController` throws before returning disabled/inactive owner-mode data.

Expected UI Behavior:

Services owner panel receives read error and renders error text.

Expected Logging:

No logging found in source.

---

### FP-006

BEH-DASH-services-106

Trigger:

Save is attempted without `targetActorId`, VPORT type, identity actor ID, or valid catalog keys.

Expected System Behavior:

Hook/controller throws required-field or `NO_VALID_SERVICE_KEYS_AFTER_CATALOG_FILTER` errors.

Expected UI Behavior:

Owner panel renders error from upsert hook.

Expected Logging:

No logging found in source for production; owner toolbar logs blocked Save reasons only in DEV.

---

### FP-007

BEH-DASH-services-107

Trigger:

Catalog read returns empty for a VPORT type.

Expected System Behavior:

Controller uses fallback catalog rows when available.

Expected UI Behavior:

Owner panel renders fallback services or empty state if no catalog/fallback exists.

Expected Logging:

No logging found in source.

---

### FP-008

BEH-DASH-services-108

Trigger:

Locksmith default detail provisioning fails after primary service upsert.

Expected System Behavior:

Controller returns `provisioningWarnings` instead of rolling back the service save.

Expected UI Behavior:

Current dashboard source does not surface provisioning warnings.

Expected Logging:

DEV-only console error exists for provisioning failures.

---

### FP-009

BEH-DASH-services-109

Trigger:

Dormant addon create/update/reorder hooks are invoked.

Expected System Behavior:

Current imports reference missing DAL files for create/update/reorder; those paths are expected to fail module resolution if reached.

Expected UI Behavior:

No current dashboard UI reaches these hooks because addon editing/reorder controls are not wired in `VportServicesView`.

Expected Logging:

No source-verified runtime logging.

---

### FP-010

BEH-DASH-services-110

Trigger:

Dormant addon delete hook is invoked.

Expected System Behavior:

`useDeleteVportServiceAddon` calls `deleteVportServiceAddonController` without `callerActorId`; controller throws `callerActorId is required`.

Expected UI Behavior:

No current dashboard UI reaches this hook.

Expected Logging:

No source-verified runtime logging.

---

### FP-011

BEH-DASH-services-111

Trigger:

Owner opens services while the active identity is VPORT-kind and attempts to save service enablement.

Expected System Behavior:

`useUpsertVportServices` passes the active `identity.actorId` directly to `upsertVportServicesController`; `assertActorOwnsVportActorController` rejects VPORT-kind request actors with `Only actor owners can manage this booking resource.`

Expected UI Behavior:

Owner panel renders the save error from the upsert hook.

Expected Logging:

No source-verified runtime logging.

---

## 6. Security Rules

### SEC-001

BEH-DASH-services-201

Rule:

Dashboard must deny non-owners before enabling owner edit mode.

Enforcement Layer:

`VportDashboardServicesScreen` with `useVportOwnership`.

Current Status:

SOURCE VERIFIED.

Finding Links:

- SERVICES-SPIDER-001

---

### SEC-002

BEH-DASH-services-202

Rule:

Owner-mode service reads must verify actor ownership server-side before returning disabled services or inactive catalog entries.

Enforcement Layer:

`getVportServicesController` with `assertActorOwnsVportActorController`.

Current Status:

SOURCE VERIFIED as patched from historical `V-SVC-001`.

Finding Links:

- Historical V-SVC-001 — patched in current source.

---

### SEC-003

BEH-DASH-services-203

Rule:

Service enablement writes must require identity actor ID, target actor ID, VPORT type, valid catalog keys, and actor ownership.

Enforcement Layer:

`upsertVportServicesController`.

Current Status:

SOURCE VERIFIED.

Finding Links:

- SERVICES-OWNERSHIP-PRIMITIVE-001
- SERVICES-RLS-001

---

### SEC-004

BEH-DASH-services-204

Rule:

Service upsert DAL must scope writes to the target actor's resolved profile and must not accept caller-supplied `profile_id`.

Enforcement Layer:

`upsertVportServicesByActorDal` resolves profile ID from `actorId`.

Current Status:

SOURCE VERIFIED.

Finding Links:

- SERVICES-RLS-001

---

### SEC-005

BEH-DASH-services-205

Rule:

RLS on `vport.services`, `vport.service_addons`, and locksmith detail tables must independently enforce ownership.

Enforcement Layer:

Database RLS/policies.

Current Status:

OPEN. Venom evidence flags RLS posture as assumed/unverified.

Finding Links:

- SERVICES-RLS-001

---

### SEC-006

BEH-DASH-services-206

Rule:

Addon write controllers must have application-layer actor ownership checks and working DAL imports before being exposed in dashboard UI.

Enforcement Layer:

Addon controllers/hooks/DALs.

Current Status:

OPEN. Create/update and reorder controllers rely on RLS and import missing DAL files; delete controller requires caller ownership but the hook does not pass `callerActorId`.

Finding Links:

- SERVICES-ADDON-AUTH-001
- SERVICES-ADDON-DAL-001
- SERVICES-DELETE-HOOK-001

---

### SEC-007

BEH-DASH-services-207

Rule:

Security-critical actor ownership assertions should depend on a stable ownership primitive, not a fragile unrelated feature adapter.

Enforcement Layer:

Current service controllers import `assertActorOwnsVportActorController` from booking adapter.

Current Status:

OPEN architecture caution. Ownership check works in current source; dependency ownership remains fragile.

Finding Links:

- SERVICES-OWNERSHIP-PRIMITIVE-001
- Historical V-SVC-006

---

### SEC-008

BEH-DASH-services-208

Rule:

Service save requester identity must be a user-kind actor owner, or the hook must resolve the user-kind owner actor before calling the ownership assertion.

Enforcement Layer:

`useUpsertVportServices` and `upsertVportServicesController`.

Current Status:

OPEN. Controller ownership enforcement is strict and rejects VPORT-kind requesters; the hook currently passes `identity.actorId` directly and does not resolve `availableActors`.

Finding Links:

- SERVICES-ACTING-AS-VPORT-001
- SERVICES-OWNERSHIP-PRIMITIVE-001

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-services-301

Invariant:

A non-owner must never receive owner-mode service catalog data, including disabled services or inactive catalog entries.

Current Status:

SOURCE VERIFIED patched at controller layer; tests missing.

Related Findings:

- SERVICES-SPIDER-001

Required Tests:

- TESTREQ-DASH-services-001
- TESTREQ-DASH-services-002

---

### MNH-002

BEH-DASH-services-302

Invariant:

A non-owner must never enable, disable, create, update, reorder, or delete another actor's services or service addons.

Current Status:

PARTIAL. Active service enablement upsert is gated. Addon paths remain open/dormant debt.

Related Findings:

- SERVICES-ADDON-AUTH-001
- SERVICES-DELETE-HOOK-001
- SERVICES-RLS-001

Required Tests:

- TESTREQ-DASH-services-003
- TESTREQ-DASH-services-006

---

### MNH-003

BEH-DASH-services-303

Invariant:

Service saves must never persist keys that are absent from the type-specific service catalog or fallback catalog.

Current Status:

SOURCE VERIFIED.

Related Findings:

- SERVICES-SPIDER-001

Required Tests:

- TESTREQ-DASH-services-004

---

### MNH-004

BEH-DASH-services-304

Invariant:

Locksmith service detail provisioning failures must never be invisible to all user-facing or operational surfaces.

Current Status:

PARTIAL. Controller returns `provisioningWarnings`; current dashboard UI does not surface them.

Related Findings:

- SERVICES-LOCKSMITH-WARNINGS-001
- Historical V-SVC-009

Required Tests:

- TESTREQ-DASH-services-005

---

### MNH-005

BEH-DASH-services-305

Invariant:

Dormant addon hooks must never be exposed in UI until missing DAL imports and ownership parameters are fixed.

Current Status:

OPEN. No current dashboard UI reaches them, but source debt remains.

Related Findings:

- SERVICES-ADDON-DAL-001
- SERVICES-DELETE-HOOK-001

Required Tests:

- TESTREQ-DASH-services-006

---

### MNH-006

BEH-DASH-services-306

Invariant:

An owner acting through a VPORT identity must not see a saved-looking service state when the controller rejected the requester kind.

Current Status:

PARTIAL. Current source surfaces the thrown save error and does not mark save success, but no services test covers VPORT-kind active identity behavior.

Related Findings:

- SERVICES-ACTING-AS-VPORT-001

Required Tests:

- TESTREQ-DASH-services-008

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.service_catalog` | Yes, type-specific catalog read. | No. | No. | No. |
| `vport.services` | Yes, actor services read. | Upsert via `upsertVportServicesByActorDal`. | Upsert via `upsertVportServicesByActorDal`. | No active dashboard delete path. |
| `vport.service_addons` | Yes, actor addon read. | Dormant create path references missing DAL. | Dormant update/reorder paths reference missing DALs. | Dormant delete path exists with DAL but hook lacks caller actor ID. |
| `vport.profiles` / actor profile resolution | Yes via `resolveVportProfileId` and VPORT type resolution. | No. | No. | No. |
| `vport.locksmith_service_details` | Read indirectly through `useLocksmithProfile` for display enrichment. | Optional default provisioning for newly enabled locksmith services. | Upsert/default provisioning helper may preserve existing edits. | No. |

---

## 9. Side Effects

Notifications:

- No notification side effect found.

Analytics:

- No analytics side effect found.

Media:

- No media side effect found.

Exports:

- No export side effect found.

Jobs:

- No job dispatch found.

Cache:

- `getVportServicesController` uses a 60-second TTL cache for viewer-mode reads only.
- Owner-mode reads bypass cache.
- `invalidateVportServices(actorId)` clears all service cache entries.

Other:

- Owner save refetches server state on success.
- Locksmith saves may provision default locksmith detail rows and return `provisioningWarnings`.
- DEV-only console warning exists when toolbar Save is blocked.

---

## 10. UI Outputs

Loading States:

- Dashboard identity/ownership loading renders `SkeletonCardList`.
- Services view loading renders `VportServicesSkeleton`.
- Owner panel loading renders `Loading services...`.

Success States:

- Owner sees grouped service badges, catalog count, category count, and draft state.
- Toolbar displays `Saved`, `Save`, or `Saving...` based on dirty/save state.

Error States:

- Dashboard sign-in, invalid VPORT, and non-owner denial messages.
- Owner panel error renders `String(error?.message ?? error)`.

Empty States:

- Owner panel renders `No services available` when catalog returns no services.

Owner States:

- Owner can toggle services and save changed enablement.

Public States:

- Viewer panel renders enabled public services only.

---

## 11. Acceptance Criteria

### AC-DASH-services-001

Requirement:

Dashboard services must deny unauthenticated users, missing actor IDs, and non-owners before owner editing is enabled.

Evidence:

`VportDashboardServicesScreen.jsx` checks identity loading, identity presence, actor ID, and `isOwner` before rendering `VportServicesView allowOwnerEditing={true}`.

Status:

DRAFT

---

### AC-DASH-services-002

Requirement:

Owner-mode reads must verify ownership in the controller, not only in the dashboard screen.

Evidence:

`getVportServicesController` requires `callerActorId` when `asOwner=true` and calls `assertActorOwnsVportActorController`.

Status:

DRAFT

---

### AC-DASH-services-003

Requirement:

Service save must validate catalog keys and ownership before upserting actor service rows.

Evidence:

`upsertVportServicesController` asserts ownership, reads catalog rows, filters submitted keys, throws when submitted keys all miss the catalog, and calls `upsertVportServicesByActorDal`.

Status:

DRAFT

---

### AC-DASH-services-004

Requirement:

Public/profile service rendering must not expose disabled services or inactive catalog rows.

Evidence:

Viewer mode calls `getVportServicesController` with `asOwner=false`; catalog and actor reads use active/enabled filters.

Status:

DRAFT

---

### AC-DASH-services-005

Requirement:

Addon editing paths must not be exposed until DAL imports and ownership parameters are corrected.

Evidence:

Current owner panel passes `onEditServiceMeta={null}`; addon hooks/controllers exist but are not wired and contain source debt.

Status:

DRAFT / OPEN

---

### AC-DASH-services-006

Requirement:

Service save behavior must be explicit for user-kind owner identity versus VPORT-kind active identity.

Evidence:

`useUpsertVportServices` reads `identity.actorId` only; `assertActorOwnsVportActorController` validates request actor kind and rejects non-user requesters.

Status:

DRAFT / OPEN

---

## 12. Test Requirements

### TESTREQ-DASH-services-001

Validates:

Dashboard route renders skeleton during identity/ownership loading and denies unauthenticated, invalid actor, and non-owner states.

Type:

SPIDER-MAN dashboard integration test.

Status:

MISSING

---

### TESTREQ-DASH-services-002

Validates:

Non-owner cannot force owner-mode read by calling service controller with `asOwner=true`.

Type:

Controller security unit test.

Status:

MISSING

---

### TESTREQ-DASH-services-003

Validates:

Non-owner cannot upsert another actor's service enablement.

Type:

Controller/DAL security unit test.

Status:

MISSING

---

### TESTREQ-DASH-services-004

Validates:

Invalid catalog keys are dropped and all-invalid save attempts throw `NO_VALID_SERVICE_KEYS_AFTER_CATALOG_FILTER`.

Type:

Controller unit test.

Status:

MISSING

---

### TESTREQ-DASH-services-005

Validates:

Locksmith detail provisioning failures return warnings and dashboard/observability surfaces them.

Type:

Controller/UI integration test.

Status:

MISSING

---

### TESTREQ-DASH-services-006

Validates:

Addon create/update/delete/reorder paths have working DAL imports, caller actor ownership checks, profile scoping, and UI remains disabled until they pass.

Type:

Controller/DAL/module resolution security test.

Status:

MISSING

---

### TESTREQ-DASH-services-007

Validates:

RLS on `vport.services`, `vport.service_addons`, and `vport.locksmith_service_details` independently enforces actor ownership.

Type:

DB/RLS security test.

Status:

MISSING

---

### TESTREQ-DASH-services-008

Validates:

Services save either resolves a user-kind owner actor when acting as a VPORT, or surfaces the VPORT-kind requester rejection without claiming save success.

Type:

Hook/controller integration test.

Status:

MISSING

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| SERVICES-SPIDER-001 | MEDIUM | OPEN | BEH-DASH-services-001 through BEH-DASH-services-005 |
| SERVICES-RLS-001 | HIGH | OPEN | BEH-DASH-services-203, BEH-DASH-services-204, BEH-DASH-services-205, BEH-DASH-services-302 |
| SERVICES-ADDON-AUTH-001 | HIGH | OPEN / DORMANT | BEH-DASH-services-206, BEH-DASH-services-302, BEH-DASH-services-305 |
| SERVICES-ADDON-DAL-001 | HIGH | OPEN / DORMANT | BEH-DASH-services-206, BEH-DASH-services-305 |
| SERVICES-DELETE-HOOK-001 | MEDIUM | OPEN / DORMANT | BEH-DASH-services-206, BEH-DASH-services-305 |
| SERVICES-OWNERSHIP-PRIMITIVE-001 | MEDIUM | OPEN | BEH-DASH-services-203, BEH-DASH-services-207 |
| SERVICES-ACTING-AS-VPORT-001 | MEDIUM | OPEN | BEH-DASH-services-208, BEH-DASH-services-306 |
| SERVICES-LOCKSMITH-WARNINGS-001 | MEDIUM | OPEN | BEH-DASH-services-304 |
| V-SVC-001 | HIGH | PATCHED IN CURRENT SOURCE | BEH-DASH-services-202, BEH-DASH-services-301 |
| V-SVC-006 | MEDIUM | OPEN | BEH-DASH-services-207 |
| V-SVC-009 | MEDIUM | PARTIAL / WARNING RETURNED, UI NOT SURFACED | BEH-DASH-services-304 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Dashboard module inventory classification | COMPLETE | No |
| VENOM coverage | COMPLETE | No |
| ELEKTRA coverage | COMPLETE | No |
| BLACKWIDOW coverage | COMPLETE | No |
| BEHAVIOR.md contract | DRAFT | No |
| Dashboard-local SPIDER-MAN tests | MISSING | Yes for CLEAR |
| Active service owner-mode read/upsert controller tests | MISSING | Yes for CLEAR |
| Acting-as-VPORT service save behavior | MISSING | Yes for CLEAR |
| RLS verification | MISSING | Yes for CLEAR |
| Dormant addon controller/DAL debt | OPEN | Yes before exposing addon UI |
| Locksmith provisioning warning UI/observability | OPEN | Yes for locksmith CLEAR |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Owner service catalog toggle/save | Not found in source. | MISSING SOURCE |
| Viewer public services list | Not found in source. | MISSING SOURCE |
| Addon editing/reorder | Not available in current dashboard UI. | NOT_APPLICABLE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| None directly imported by dashboard services card | Not applicable. | SOURCE VERIFIED |
| Profile services adapter | Delegates service catalog read/write UI. | SOURCE VERIFIED |
| Booking adapter ownership controller | Current actor-owner assertion primitive. | SOURCE VERIFIED / ARCHITECTURE CAUTION |
| Shared TTL cache | Viewer-mode services read cache. | SOURCE VERIFIED |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-services-001 | Should service addon create/update/reorder hooks be deleted, completed, or kept behind a clearly disabled feature flag? | OPEN |
| OQ-DASH-services-002 | Should `useDeleteVportServiceAddon` resolve and pass `callerActorId`, or should addon delete remain unavailable? | OPEN |
| OQ-DASH-services-003 | Should service ownership assertion move from booking adapter to a canonical actor ownership utility? | OPEN |
| OQ-DASH-services-004 | Should locksmith provisioning warnings be rendered in the owner panel after save? | OPEN |
| OQ-DASH-services-005 | Are RLS policies for `vport.services`, `vport.service_addons`, and `vport.locksmith_service_details` verified in tracked migrations and live DB? | OPEN |
| OQ-DASH-services-006 | Should `useUpsertVportServices` resolve the user-kind owner actor from available identity actors before saving, matching exchange behavior? | OPEN |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | Yes: dashboard screen, profile services view, module README/status. |
| Actors / Roles | HIGH | Yes: dashboard access checks and owner/viewer mode. |
| Module Architecture | HIGH | Yes: source paths, hooks, controllers, DALs. |
| Happy Paths | HIGH | Yes for active service toggle/save and viewer read paths. |
| Failure Paths | MEDIUM | Yes for active paths; dormant addon paths not runtime-tested. |
| Security Rules | HIGH | Yes for app source; RLS and acting-as-VPORT save behavior remain open. |
| Data Changes | HIGH | Yes: DAL/controller source. |
| Side Effects | HIGH | Yes: cache, refetch, locksmith provisioning. |
| UI Outputs | HIGH | Yes: dashboard and owner panel source. |
| Acceptance Criteria | HIGH | Yes: source mapped. |
| Test Requirements | HIGH | Yes: test search found no services dashboard/controller tests. |
| Native / Alternate UI Parity | LOW | No native source found. |
| Engine Dependencies | HIGH | Yes: no direct engine dependency found. |
| Open Questions | HIGH | Yes: derived from source and governance gaps. |

---

## 19. Command Sign-Off

ARCHITECT: PARTIAL — dashboard shell, adapter boundary, and active profile services path mapped.

VENOM: COMPLETE — dashboard matrix says complete; V-SVC-001 patched, addon/RLS/ownership primitive debt remains caution-gated.

ELEKTRA: COMPLETE — active source-to-sink path mapped from dashboard to profile controller/DAL.

BLACKWIDOW: COMPLETE — dashboard denies non-owner before editable mode; addon, RLS, and acting-as-VPORT save invariants still require tests.

SPIDER-MAN: NOT_RUN — no services dashboard/controller test files found by source search.

PROFESSOR X: DRAFT — behavior contract reverse-engineered from source.

THOR: CAUTION — not clear until tests, RLS verification, addon debt, acting-as-VPORT save behavior, and locksmith warning surfacing close.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding | Handoff |
|---|---|---|---|
| Services screen data source is UNKNOWN | CRITICAL | ARCHITECT_VERIFIED | IRONMAN |
| No controller, DAL, hook, or model in services card — pure shell | HIGH | ARCHITECT_VERIFIED | IRONMAN |
| vport/dal/read/vportServices.read.dal.js exists but delegation from this card is unconfirmed | HIGH | ARCHITECT_VERIFIED | IRONMAN |
| No tests | MEDIUM | ARCHITECT_VERIFIED | SPIDER-MAN |
| No native parity notes | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: MISSING — SPIDER-MAN required. Zero test files in services card module.

Ownership enforcement: No write surfaces in services card. Service catalog writes (if any) are UNKNOWN — delegation target not identified.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/services/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §5 (route: /actor/:actorId/dashboard/services), §7 (card reads: service catalog via engines/services adapter)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_PARTIAL — Services card is a stub. Feature BEHAVIOR.md lists engines/services adapter as data source, but card-level confirmation is UNKNOWN. IRONMAN required.
