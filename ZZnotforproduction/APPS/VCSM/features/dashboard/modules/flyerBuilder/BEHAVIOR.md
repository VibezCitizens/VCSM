# Dashboard Module Behavior Contract — flyer-builder

Status: ACTIVE

Module: flyer-builder

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - ELEK-2026-06-02-004
  - FLYER-FLAG-001
- Patched Findings:
  - ELEK-001
  - ELEK-2026-06-04-001
  - VEN-DASH-002
  - ELEK-002
  - VEN-DASH-003
  - BLOCK-DASH-004
- Security Review Status:
  - VENOM: COMPLETE — PARENT SAVE PATCHED / NESTED PATCHED
  - ELEKTRA: COMPLETE — PARENT SAVE PATCHED / NESTED PATCHED
  - BLACKWIDOW: COMPLETE — designStudio RLS LIVE-VERIFIED / CAUTION

Reason:
Flyer public details save now derives `profileId` from verified `ownerActorId` before writing.
Nested designStudio now enforces cross-owner `documentId` ownership verification.
`vc.design_*` RLS was live-verified on 2026-06-04. Broader SPIDER-MAN route/UI/export coverage remains open. Current runtime behavior also depends on release flags: printable flyer defaults enabled, while the flyer editor defaults disabled unless `VITE_ENABLE_VPORT_FLYER_EDITOR` is enabled.

---

## 1. User Goal

A verified VPORT owner can create owner-only marketing materials for their VPORT, including printable QR flyers and editable flyer public details. The `flyer-builder` module is sourced from the `flyerBuilder` folder and also contains the designStudio canvas editor as a nested first-class dashboard module.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner | View owner-only flyer/QR print layouts, print safe QR flyers, open flyer design editor, upload flyer images, save flyer public details, open nested designStudio. | Must own the target VPORT actor. Must not write flyer details to another VPORT profile. |
| Non-owner authenticated user | None for flyer owner surfaces. | Route UI denies flyer view/editor access. Controller paths must deny writes. |
| Anonymous user | None for owner flyer surfaces. | Flyer route requires sign-in. |
| Revoked owner | None after ownership revocation. | Nested designStudio owner gate requires `is_void` verification before final clearance. |
| Public visitor | No direct access in reviewed flyerBuilder owner routes. | Public preview route behavior is outside owner editor write path and must not expose raw UUID QR output. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/menu/flyer` renders `VportActorMenuFlyerScreen` only when `releaseFlags.vportPrintableFlyer` is enabled. The flag defaults enabled.
- `/actor/:actorId/menu/flyer/edit` renders `VportActorMenuFlyerEditorScreen` only when `releaseFlags.vportFlyerEditor` is enabled. The flag defaults disabled.
- `/vport/:actorId/menu/flyer` redirects through `VportToActorMenuFlyerRedirect`; when printable flyer is disabled, it redirects to `/feed`.
- `/vport/:actorId/menu/flyer/edit` redirects through `VportToActorFlyerEditRedirect`; when flyer editor is disabled, it redirects to `/feed`.

### Screens

- `apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerScreen.jsx`
- `apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx`
- `apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerEditorScreen.jsx`
- Nested module: `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/screens/VportDesignStudioViewScreen.jsx`

### Hooks

- `useFlyerEditor.js`: upload flyer image and save flyer public details.
- Nested designStudio hooks are covered by the `designStudio` behavior contract.

### Controllers

- `flyerEditor.controller.js`
  - `uploadFlyerImageCtrl`
  - `saveFlyerPublicDetailsCtrl`
- Nested designStudio controllers are covered by the `designStudio` behavior contract.

### DALs

- `flyer.write.dal.js`
  - `saveFlyerPublicDetails`
- Nested designStudio DALs are covered by the `designStudio` behavior contract.

### RPCs

None found in reviewed flyerBuilder source or scanner maps.

### Edge Functions

None found in reviewed flyerBuilder source or scanner maps.

### Engine Dependencies

No direct `engines/` dependency found.

Cross-feature dependencies:
- `@media` upload controller for flyer images.
- `media.adapter.js` and `mediaAppId.adapter.js` for non-fatal media asset record.
- `qrcode.adapter.js` for QR code/flyer rendering.
- `profiles.adapter.js` and VPORT public details adapter for flyer data display.

### Ownership Gates

- Route UI gate: `useVportOwnership(viewerActorId, actorId)`.
- Flyer save controller gate: `requireOwnerActorAccess(ownerActorId)`.
- Current source: `saveFlyerPublicDetailsCtrl` verifies `ownerActorId`, resolves the VPORT profile from that actor, and writes only the derived `profileId`.
- Nested designStudio gate and gaps are covered in `designStudio/BEHAVIOR.md`.

---

## 4. Happy Paths

### HP-001 — View Owner Flyer

BEH-DASH-flyerBuilder-001

Preconditions:
Authenticated viewer owns the target VPORT actor and `releaseFlags.vportPrintableFlyer` is enabled.

Flow:
`VportActorMenuFlyerScreen` reads `actorId`, checks identity, checks ownership, resolves flyer variant, and renders `VportActorMenuFlyerView`.

Expected Result:
Owner-only flyer view renders with classic, poster, or printable QR layout controls.

Data Changes:
None.

---

### HP-002 — Render Safe QR Flyer

BEH-DASH-flyerBuilder-002

Preconditions:
Owner flyer view has loaded dashboard details and canonical slug is QR-safe.

Flow:
`VportActorMenuFlyerView` loads public details, normalizes details, resolves canonical slug, builds menu URL, checks `isQrSafeSlug`, and renders Classic, Poster, or Printable QR components.

Expected Result:
Flyer renders only when QR target is safe. Print button is disabled until slug is safe.

Data Changes:
None.

---

### HP-003 — Print Flyer

BEH-DASH-flyerBuilder-003

Preconditions:
QR-safe flyer is rendered.

Flow:
Owner clicks Print. View calls `window.print()`.

Expected Result:
Browser print dialog opens for the current flyer or QR sheet layout.

Data Changes:
None.

---

### HP-004 — Open Flyer Editor / Design Studio

BEH-DASH-flyerBuilder-004

Preconditions:
Authenticated viewer owns the target VPORT actor, uses desktop viewport, and `releaseFlags.vportFlyerEditor` is enabled.

Flow:
Route config checks `releaseFlags.vportFlyerEditor`.
`VportActorMenuFlyerEditorScreen` checks identity and ownership, checks desktop breakpoint, renders portal editor, and mounts `VportDesignStudioViewScreen` with starter content.

Expected Result:
Owner sees the desktop canvas studio.

Data Changes:
Nested designStudio may create/load design document/page/version as covered by `designStudio/BEHAVIOR.md`.

---

### HP-005 — Upload Flyer Image

BEH-DASH-flyerBuilder-005

Preconditions:
Owner is editing flyer details and chooses an image file.

Flow:
`ImageDropzone` passes file to `FlyerEditorPanel`, hook calls `uploadFlyerImageCtrl({ bucket, vportId, file, kind })`, controller uploads through media controller with `scope: "design_asset"`, then best-effort creates media asset record.

Expected Result:
Returned public URL is placed into the selected draft field.

Data Changes:
Media upload side effect. Best-effort platform media asset record may be created.

---

### HP-006 — Save Flyer Public Details

BEH-DASH-flyerBuilder-006

Preconditions:
Owner has draft flyer public details and clicks Save.

Flow:
`useFlyerEditor.onSave` calls `saveFlyerPublicDetailsCtrl({ patch: draft, ownerActorId: vportId })`. Controller verifies `ownerActorId` through `requireOwnerActorAccess`, resolves the VPORT profile through `readVportProfileByActorIdDAL({ actorId: ownerActorId })`, derives `profileId`, and then calls the DAL. DAL upserts selected fields into `vport.profile_public_details` using the derived `profileId`.

Expected Result:
Public flyer/contact fields are saved and `onSaved` receives returned row.

Data Changes:
Upserts `vport.profile_public_details`.

Current Status:
SOURCE VERIFIED and FOCUSED TEST COVERED. The current controller ignores any caller-supplied `profileId` and writes only to the profile derived from the verified owner actor.

---

### HP-007 — Open Public Preview From Editor

BEH-DASH-flyerBuilder-007

Preconditions:
Owner is in editor.

Flow:
Editor screen navigates to `/actor/${actorId}/menu/flyer`.

Expected Result:
Owner flyer preview opens.

Data Changes:
None.

---

## 5. Failure Paths

### FP-001 — Missing Actor ID

BEH-DASH-flyerBuilder-001

Trigger:
Route `actorId` is absent.

Expected System Behavior:
Route screen returns null.

Expected UI Behavior:
No flyer view/editor is rendered.

Expected Logging:
None found.

---

### FP-002 — Identity Or Ownership Loading

BEH-DASH-flyerBuilder-001

Trigger:
Identity or ownership state is loading.

Expected System Behavior:
Route waits for identity/ownership result.

Expected UI Behavior:
Loading message renders.

Expected Logging:
None found.

---

### FP-003 — Anonymous Viewer

BEH-DASH-flyerBuilder-001

Trigger:
No authenticated identity.

Expected System Behavior:
Owner flyer surface is denied.

Expected UI Behavior:
Flyer view says `Sign in to view this flyer.` Editor says `Sign in required.`

Expected Logging:
None found.

---

### FP-004 — Non-owner Viewer

BEH-DASH-flyerBuilder-001

Trigger:
Authenticated viewer does not own target VPORT actor.

Expected System Behavior:
Owner flyer surface is denied.

Expected UI Behavior:
Flyer view says `You can only view flyers for your own vport.` Editor says `You can only edit flyers for your own vport.`

Expected Logging:
None found.

---

### FP-005 — Editor On Non-desktop

BEH-DASH-flyerBuilder-004

Trigger:
Owner opens editor on non-desktop viewport.

Expected System Behavior:
Design editor is not mounted.

Expected UI Behavior:
Desktop-only message renders.

Expected Logging:
None found.

---

### FP-006 — QR Slug Unsafe Or Not Ready

BEH-DASH-flyerBuilder-002

Trigger:
Canonical slug has not resolved or is not QR-safe.

Expected System Behavior:
QR flyer body and print action are gated.

Expected UI Behavior:
Shows `Preparing flyer...` and print button shows `Preparing...`.

Expected Logging:
None found.

---

### FP-007 — Missing Owner Actor Or Derived Profile On Save

BEH-DASH-flyerBuilder-006

Trigger:
`saveFlyerPublicDetailsCtrl` receives no `ownerActorId`, owner verification fails, or the verified owner actor does not resolve to a VPORT profile.

Expected System Behavior:
Controller throws before writing. Missing owner actor throws `ownerActorId is required`; missing derived VPORT profile throws `VPORT profile not found.`

Expected UI Behavior:
No explicit error handling in hook; saving state clears in `finally`.

Expected Logging:
None found.

---

### FP-008 — Cross-owner Profile ID

BEH-DASH-flyerBuilder-008

Trigger:
Caller owns `ownerActorId` A but supplies profile ID for VPORT B.

Expected System Behavior:
Current source ignores the caller-supplied `profileId`, derives the target profile from the verified `ownerActorId`, and writes only that derived profile row.

Expected UI Behavior:
Save succeeds for the verified owner actor's own derived profile, or fails if owner verification/profile resolution fails.

Expected Logging:
None found.

---

### FP-011 — Flyer Feature Flag Disabled

BEH-DASH-flyerBuilder-010

Trigger:
Printable flyer or flyer editor release flag is disabled.

Expected System Behavior:
`releaseFlags.vportPrintableFlyer` removes the public `/actor/:actorId/menu/flyer` route and causes `/vport/:actorId/menu/flyer` redirect to `/feed`. `releaseFlags.vportFlyerEditor` causes `/actor/:actorId/menu/flyer/edit` and `/vport/:actorId/menu/flyer/edit` to redirect to `/feed`.

Expected UI Behavior:
The related dashboard card is disabled by `isDashboardCardEnabled`; direct flagged routes do not render the flyer/editor experience.

Expected Logging:
None found.

Finding Links:
FLYER-FLAG-001.

---

### FP-009 — Upload Failure

BEH-DASH-flyerBuilder-005

Trigger:
Media upload fails.

Expected System Behavior:
Upload promise rejects and upload key clears in `finally`.

Expected UI Behavior:
No explicit error state in hook source.

Expected Logging:
None found.

---

### FP-010 — Media Asset Record Failure

BEH-DASH-flyerBuilder-005

Trigger:
Best-effort `createMediaAssetController` fails after upload.

Expected System Behavior:
Failure is non-fatal.

Expected UI Behavior:
Uploaded image URL can still be used.

Expected Logging:
Development-only console warning.

---

## 6. Security Rules

### SEC-001 — Owner Route Gate Required

BEH-DASH-flyerBuilder-001

Rule:
Flyer owner view and editor must only render for authenticated owners of the target VPORT actor.

Enforcement Layer:
Route UI via `useIdentity` and `useVportOwnership`.

Current Status:
SOURCE_VERIFIED.

Finding Links:
None.

---

### SEC-002 — QR Must Not Encode Unsafe UUID Route

BEH-DASH-flyerBuilder-002

Rule:
QR and print output must wait for a safe canonical slug and must not print unsafe raw UUID public-facing QR targets.

Enforcement Layer:
View/model via `isQrSafeSlug`.

Current Status:
SOURCE_VERIFIED.

Finding Links:
Prior VENOM comments in source reference V-004/V-005.

---

### SEC-003 — Flyer Save Requires Owner Gate

BEH-DASH-flyerBuilder-006

Rule:
Saving flyer public details must verify authenticated owner access before write.

Enforcement Layer:
Controller via `requireOwnerActorAccess(ownerActorId)`.

Current Status:
SOURCE VERIFIED and FOCUSED TEST COVERED.

Finding Links:
ELEK-001, VEN-DASH-002.

---

### SEC-004 — Profile ID Must Be Derived From Owner Actor

BEH-DASH-flyerBuilder-008

Rule:
Flyer public details write must derive `profileId` from verified `ownerActorId`; caller must not choose the write target.

Enforcement Layer:
Controller.

Current Status:
PATCHED / SOURCE VERIFIED / FOCUSED TEST COVERED — `saveFlyerPublicDetailsCtrl` derives `profileId` from `readVportProfileByActorIdDAL({ actorId: ownerActorId })` after `requireOwnerActorAccess(ownerActorId)`.

Finding Links:
ELEK-001, ELEK-2026-06-04-001, VEN-DASH-002.

---

### SEC-005 — Upload Must Be Owner-scoped

BEH-DASH-flyerBuilder-005

Rule:
Flyer image upload must associate uploaded media with the owner actor.

Enforcement Layer:
Controller/media adapter.

Current Status:
PARTIAL — upload uses `ownerActorId: vportId`; no explicit `requireOwnerActorAccess` in `uploadFlyerImageCtrl` source.

Finding Links:
ELEK-2026-06-02-004 is INFO for dead params; no exploit path reported.

---

### SEC-006 — Nested designStudio Security Must Pass

BEH-DASH-flyerBuilder-009

Rule:
The parent flyerBuilder module cannot be THOR-clear while nested designStudio remains blocked.

Enforcement Layer:
Governance / THOR.

Current Status:
PATCHED / INHERITED CAUTION — nested designStudio ownership and RLS fixes are applied/live-verified, but broader designStudio route/export coverage remains open.

Finding Links:
ELEK-002, VEN-DASH-003, BLOCK-DASH-004.

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-flyerBuilder-001

Invariant:
Non-owners must never access owner-only flyer view or editor.

Current Status:
SOURCE_VERIFIED at route UI layer.

Related Findings:
None.

Required Tests:
TESTREQ-DASH-flyerBuilder-001.

---

### MNH-002

BEH-DASH-flyerBuilder-002

Invariant:
Printable QR output must never encode an unsafe raw UUID public route.

Current Status:
SOURCE_VERIFIED.

Related Findings:
Prior VENOM V-004/V-005 comments in source.

Required Tests:
TESTREQ-DASH-flyerBuilder-002.

---

### MNH-003

BEH-DASH-flyerBuilder-003

Invariant:
Print action must never run before QR-safe slug is available.

Current Status:
SOURCE_VERIFIED.

Related Findings:
Prior VENOM V-004.

Required Tests:
TESTREQ-DASH-flyerBuilder-003.

---

### MNH-004

BEH-DASH-flyerBuilder-004

Invariant:
Desktop-only design editor must never mount for unsupported mobile editor viewport.

Current Status:
SOURCE_VERIFIED.

Related Findings:
None.

Required Tests:
TESTREQ-DASH-flyerBuilder-004.

---

### MNH-005

BEH-DASH-flyerBuilder-005

Invariant:
Flyer image upload must never associate uploaded media with a VPORT actor the caller does not own.

Current Status:
PARTIAL — ownerActorId is passed to upload; explicit owner gate absent in upload controller source.

Related Findings:
ELEK-2026-06-02-004 is INFO only.

Required Tests:
TESTREQ-DASH-flyerBuilder-005.

---

### MNH-006

BEH-DASH-flyerBuilder-006

Invariant:
Flyer public details must never be saved without authenticated owner access.

Current Status:
SOURCE_VERIFIED for owner gate.

Related Findings:
ELEK-001, VEN-DASH-002.

Required Tests:
TESTREQ-DASH-flyerBuilder-006.

---

### MNH-007

BEH-DASH-flyerBuilder-007

Invariant:
Opening public preview from editor must never mutate flyer or design data.

Current Status:
SOURCE_VERIFIED in reviewed source.

Related Findings:
None.

Required Tests:
TESTREQ-DASH-flyerBuilder-007.

---

### MNH-008

BEH-DASH-flyerBuilder-008

Invariant:
Caller-supplied `profileId` must never determine the target row for flyer public details writes.

Current Status:
PATCHED / SOURCE VERIFIED / FOCUSED TEST COVERED.

Related Findings:
ELEK-001, ELEK-2026-06-04-001, VEN-DASH-002.

Required Tests:
TESTREQ-DASH-flyerBuilder-008.

---

### MNH-009

BEH-DASH-flyerBuilder-009

Invariant:
Nested designStudio must never mutate cross-owner design documents.

Current Status:
PATCHED / INHERITED CAUTION in nested designStudio contract.

Related Findings:
ELEK-002, VEN-DASH-003, BLOCK-DASH-004.

Required Tests:
TESTREQ-DASH-designStudio-001 through TESTREQ-DASH-designStudio-005.

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| VPORT dashboard/public details adapter | Yes | No | No | No |
| `vport.profile_public_details` | No | Yes via upsert | Yes via upsert | No |
| Media storage / media adapter | No | Upload side effect | No | No |
| Platform media asset record | No | Best-effort insert via media adapter | No | No |
| `vc.design_documents` | Yes, nested | Yes, nested | Yes, nested | No |
| `vc.design_pages` | Yes, nested | Yes, nested | Yes, nested | Yes, nested |
| `vc.design_page_versions` | Yes, nested | Yes, nested | No | Yes, nested |
| `vc.design_assets` | Yes, nested | Yes, nested | No | No |
| `vc.design_exports` | Yes, nested | Yes, nested | No | Yes, nested |
| `vc.design_render_jobs` | Yes, nested | Yes, nested | No | Yes, nested |

---

## 9. Side Effects

Notifications:
None found in reviewed source.

Analytics:
None found in reviewed source.

Media:
Flyer image uploads use `uploadMediaController` with `scope: "design_asset"` and `ownerActorId: vportId`.

Exports:
Nested designStudio queues PNG/PDF exports.

Jobs:
Nested designStudio inserts render jobs for queued exports.

Cache:
None found in reviewed flyerBuilder source.

Other:
Flyer print calls `window.print()`. Media asset record failure is non-fatal and logs a dev-only warning.

---

## 10. UI Outputs

Loading States:
- Flyer view route shows loading while identity or ownership is loading.
- Flyer view body shows `Preparing flyer...` while QR-safe slug is unavailable.
- Editor route shows loading while identity or ownership is loading.

Success States:
- Classic flyer.
- Poster flyer.
- Printable QR sheet layouts: table, half, full, sticker.
- Uploaded image previews in dropzones.
- Save button changes to `Saving...` during save.

Error States:
- `Sign in to view this flyer.`
- `You can only view flyers for your own vport.`
- `Sign in required.`
- `You can only edit flyers for your own vport.`
- `Desktop Only`.
- Disabled printable/editor release flags prevent route rendering or redirect to `/feed`.

Empty States:
- QR unavailable if printable QR card receives no menu URL.
- Preparing flyer state until safe slug is ready.

Owner States:
- Owner can view, print, edit, preview, upload, and save.

Public States:
- Public preview navigation exists, but reviewed flyerBuilder owner routes require owner access.

---

## 11. Acceptance Criteria

### AC-DASH-flyerBuilder-001

Requirement:
Owner-only flyer view renders only for authenticated VPORT owners.

Evidence:
`VportActorMenuFlyerScreen` uses `useIdentity` and `useVportOwnership`.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-flyerBuilder-002

Requirement:
Printable QR output waits for a QR-safe slug before render/print.

Evidence:
`VportActorMenuFlyerView` uses `isQrSafeSlug(canonicalSlug)`.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-flyerBuilder-003

Requirement:
Owner can switch flyer variants and print.

Evidence:
`VportActorMenuFlyerView` supports classic, poster, table, half, full, and sticker variants.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-flyerBuilder-004

Requirement:
Owner-only editor opens only on desktop.

Evidence:
`VportActorMenuFlyerEditorScreen` checks ownership and `useDesktopBreakpoint`.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-flyerBuilder-005

Requirement:
Owner can upload flyer images and place returned URLs into draft fields.

Evidence:
`ImageDropzone`, `useFlyerEditor.uploadAndSet`, `uploadFlyerImageCtrl`.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-flyerBuilder-006

Requirement:
Flyer public details save must derive `profileId` from verified `ownerActorId`.

Evidence:
`flyerEditor.controller.js`, `flyerEditor.controller.test.js`.

Status:
SOURCE VERIFIED and TEST COVERED.

---

### AC-DASH-flyerBuilder-007

Requirement:
Nested designStudio must pass its own behavior/security gates.

Evidence:
`designStudio/BEHAVIOR.md`.

Status:
PATCHED / INHERITED CAUTION. Ownership and RLS are patched/live-verified, but broader designStudio coverage remains open.

---

### AC-DASH-flyerBuilder-008

Requirement:
Controller security paths have SPIDER-MAN regression tests.

Evidence:
`flyerEditor.controller.test.js`.

Status:
PARTIAL. Parent save profile binding tests exist; route/UI, QR print gating, and upload ownership tests remain missing.

---

### AC-DASH-flyerBuilder-009

Requirement:
Flyer route behavior must document and respect printable/editor release flags.

Evidence:
`releaseFlags.js`, `vportMenu.routes.jsx`, `protected/app.routes.jsx`, `appRoutes.redirects.jsx`, `buildDashboardCards.model.js`.

Status:
SOURCE VERIFIED / DOCUMENTED.

---

## 12. Test Requirements

### TESTREQ-DASH-flyerBuilder-001

Validates:
Non-owner cannot access flyer view/editor routes.

Type:
Route/security regression.

Status:
MISSING.

---

### TESTREQ-DASH-flyerBuilder-002

Validates:
QR output and print action remain gated until `isQrSafeSlug` passes.

Type:
UI/security regression.

Status:
MISSING.

---

### TESTREQ-DASH-flyerBuilder-003

Validates:
`window.print()` is only reachable when QR-safe output is available.

Type:
UI regression.

Status:
MISSING.

---

### TESTREQ-DASH-flyerBuilder-004

Validates:
Editor does not mount designStudio on non-desktop viewport.

Type:
UI regression.

Status:
MISSING.

---

### TESTREQ-DASH-flyerBuilder-005

Validates:
Flyer image upload is owner-scoped and does not honor caller-provided `kind` or `bucket` as routing authority.

Type:
Controller/security regression.

Status:
MISSING.

---

### TESTREQ-DASH-flyerBuilder-006

Validates:
`saveFlyerPublicDetailsCtrl` rejects unauthenticated/non-owner callers.

Type:
Controller/security regression.

Status:
COMPLETE — `flyerEditor.controller.test.js` verifies missing `ownerActorId`, non-owner rejection, profile derivation, and missing VPORT profile failure.

---

### TESTREQ-DASH-flyerBuilder-007

Validates:
Preview navigation does not perform flyer public details writes.

Type:
Route/UI regression.

Status:
MISSING.

---

### TESTREQ-DASH-flyerBuilder-008

Validates:
`saveFlyerPublicDetailsCtrl` derives profile ID from verified owner actor and rejects cross-owner profile ID writes.

Type:
Controller security regression.

Status:
COMPLETE — focused controller test proves caller-supplied `profileId` is ignored and derived profile ID is used.

---

### TESTREQ-DASH-flyerBuilder-009

Validates:
SPIDER-MAN covers nested designStudio security tests before parent flyerBuilder THOR clearance.

Type:
Governance/test coverage.

Status:
PARTIAL — focused nested designStudio ownership tests exist; broader route/export coverage remains open.

---

### TESTREQ-DASH-flyerBuilder-010

Validates:
Printable flyer and flyer editor release flags gate public routes, redirect routes, and dashboard card availability.

Type:
Route/config regression.

Status:
MISSING / TRACKED BY FLYER-FLAG-001.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| ELEK-001 / ELEK-2026-06-04-001 | HIGH | PATCHED / SOURCE VERIFIED | BEH-DASH-flyerBuilder-006, 008 |
| VEN-DASH-002 | HIGH | PATCHED / SOURCE VERIFIED | BEH-DASH-flyerBuilder-006, 008 |
| ELEK-2026-06-02-004 | INFO | OPEN / HYGIENE | BEH-DASH-flyerBuilder-005 |
| ELEK-002 / ELEK-2026-06-04-002 | HIGH | PATCHED / INHERITED FROM designStudio | BEH-DASH-flyerBuilder-009 |
| VEN-DASH-003 | HIGH | PATCHED / INHERITED FROM designStudio | BEH-DASH-flyerBuilder-009 |
| BLOCK-DASH-004 | P0 / CRITICAL RISK | RESOLVED / RLS LIVE VERIFIED | BEH-DASH-flyerBuilder-009 |
| FLYER-FLAG-001 | LOW / behavior coverage | OPEN | BEH-DASH-flyerBuilder-010, AC-DASH-flyerBuilder-009, TESTREQ-DASH-flyerBuilder-010 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| ELEK-001 / VEN-DASH-002 profileId binding patched | COMPLETE | NO |
| designStudio ELEK-002 / VEN-DASH-003 patched | PATCHED | NO |
| CARNAGE verifies `vc.design_*` RLS | VERIFIED | NO |
| SPIDER-MAN flyerBuilder controller/route tests added | PARTIAL — parent save controller covered; route/UI/upload tests missing | YES |
| SPIDER-MAN designStudio security tests added | PARTIAL — focused tests added | YES |
| BEHAVIOR.md exists | DRAFT | NO |
| THOR re-run after fixes | NOT_RUN_AFTER_FIXES | YES |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Owner-only flyer view | None found | MISSING_SOURCE |
| QR-safe print gating | None found | MISSING_SOURCE |
| Flyer editor | None found | MISSING_SOURCE |
| Flyer image upload | None found | MISSING_SOURCE |
| Flyer public details save | None found | MISSING_SOURCE |
| Nested designStudio | None found | MISSING_SOURCE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| None found | No direct `engines/` import in reviewed flyerBuilder source | SOURCE_VERIFIED |
| Media adapter | Upload flyer images and optionally create media asset records | SOURCE_VERIFIED |
| QR code dashboard adapter | Render QR code/flyer components | SOURCE_VERIFIED |
| Profiles adapters | Load public details and canonical slug for flyer output | SOURCE_VERIFIED |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-flyerBuilder-001 | Should `uploadFlyerImageCtrl` call `requireOwnerActorAccess` before media upload, matching save behavior? | OPEN |
| OQ-DASH-flyerBuilder-002 | Should `bucket` and `kind` be removed from `useFlyerEditor` / `uploadFlyerImageCtrl` signatures since controller ignores them? | OPEN |
| OQ-DASH-flyerBuilder-003 | Should flyer public details save remove `profileId` from all caller surfaces and derive it from `ownerActorId`? | RESOLVED — controller/hook caller surface patched |
| OQ-DASH-flyerBuilder-004 | Is owner-only flyer preview intentional long term, or should there be a separate public-safe printable route? | MISSING_SOURCE |
| OQ-DASH-flyerBuilder-005 | Does public preview read designStudio documents or only dashboard/public details? | MISSING_SOURCE |
| OQ-DASH-flyerBuilder-006 | Should parent flyerBuilder status remain blocked until all designStudio gates clear? | OPEN / THOR_BLOCKED |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | MEDIUM-HIGH | Yes |
| Actors / Roles | HIGH | Yes |
| Module Architecture | HIGH | Yes |
| Happy Paths | HIGH | Yes |
| Failure Paths | MEDIUM-HIGH | Yes |
| Security Rules | HIGH | Yes |
| Must Never Happen | HIGH | Yes |
| Data Changes | HIGH | Yes |
| Side Effects | HIGH | Yes |
| UI Outputs | HIGH | Yes |
| Acceptance Criteria | MEDIUM-HIGH | Yes |
| Test Requirements | MEDIUM-HIGH | Yes |
| Security Findings Linked | HIGH | Yes |
| THOR Release Gates | HIGH | Yes |
| Native / Alternate UI Parity | LOW | No |
| Engine Dependencies | HIGH | Yes |
| Open Questions | HIGH | Yes |

---

## 19. Command Sign-Off

ARCHITECT: REVIEWED — parent flyerBuilder source architecture mapped; nested designStudio is separately mapped.

VENOM: COMPLETE / PATCHED — VEN-DASH-002 parent save path patched; nested VEN-DASH-003 is patched in designStudio.

ELEKTRA: COMPLETE / PATCHED — ELEK-001 profileId binding gap patched; nested ELEK-002 is patched in designStudio.

BLACKWIDOW: COMPLETE / CAUTION — nested designStudio RLS is live-verified; broader route/export coverage remains open.

SPIDER-MAN: PARTIAL — focused flyerBuilder controller regression test passes; route tests and nested designStudio security tests still required.

PROFESSOR X: DRAFTED — behavior contract drafted from source, scanner, and existing findings.

THOR: CAUTION — parent and nested ownership/RLS patches are verified; CLEAR still requires broader SPIDER-MAN coverage and THOR re-run after fixes.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding ID | Handoff |
|---|---|---|---|
| VEN-CARD-001 (CRITICAL): uploadFlyerImageCtrl has no ownership check — must not ship | CRITICAL | VEN-CARD-001 | THOR BLOCKER |
| flyerBuilder routes not confirmed in scanner route-map | MEDIUM | ARCHITECT_VERIFIED | HAWKEYE |
| design_* tables have schema=None in write-surface-map — CARNAGE gap | MEDIUM | ARCHITECT_VERIFIED | CARNAGE |
| No adapter boundary for designStudio sub-module access | MEDIUM | ARCHITECT_VERIFIED | SENTRY |
| Cache invalidation after flyer publish undocumented at module level | MEDIUM | ARCHITECT_VERIFIED | LOKI |
| No native parity documentation | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: MISSING — SPIDER-MAN required.

Ownership enforcement: PARTIAL — flyerBuilder read/edit paths use dalReadAuthenticatedUserId (supabase.auth.getUser). Upload path (uploadFlyerImageCtrl) has NO ownership check per VEN-CARD-001 — THOR BLOCKED.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/flyerBuilder/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §8 (flyerBuilder: create/edit/publish), §11 (side effects: flyer publish)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md (VEN-CARD-001 CRITICAL THOR BLOCKER)
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_ACTIVE — Flyer creation/publish flow documented. VEN-CARD-001 CRITICAL THOR BLOCKER: upload has no ownership check. CARNAGE required for design_* schema. Regression coverage missing.
