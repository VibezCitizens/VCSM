# Dashboard Module Behavior Contract — designStudio

Status: REVIEWED

Module: designStudio

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - ELEK-2026-06-02-003
  - DESIGNSTUDIO-FLAG-001
  - DESIGNSTUDIO-PAGE-LIMIT-001
- Patched Findings:
  - ELEK-002
  - VEN-DASH-003
  - BLOCK-DASH-004
- Security Review Status:
  - VENOM: COMPLETE — PATCHED / CAUTION
  - ELEKTRA: COMPLETE — PATCHED / CAUTION
  - BLACKWIDOW: COMPLETE — RLS LIVE-VERIFIED / CAUTION

Reason:
Cross-owner `documentId` ownership verification is enforced in current source.
`vc.design_*` RLS was live-verified on 2026-06-04. Broader SPIDER-MAN coverage and
remaining LOW DB verification questions are still open. Current runtime access also depends on the parent flyer editor release flag, which defaults disabled unless `VITE_ENABLE_VPORT_FLYER_EDITOR` is enabled.

---

## 1. User Goal

A verified VPORT owner can create, edit, save, upload assets for, preview, and queue exports for a flyer canvas design associated with their own VPORT.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner | Open the desktop editor, load/create design document, edit scene, save page version, upload image assets, queue PNG/PDF exports, refresh export status, open public preview. | Must own the target VPORT actor. Must not operate on another VPORT owner's document. |
| Non-owner authenticated user | None for the owner editor. | Route UI denies access. Controller paths must deny access. |
| Anonymous user | None. | Route UI requires sign-in. Controller owner gate requires authenticated user. |
| Revoked owner | None after revocation. | Must not pass owner gate if ownership row is voided. Current `is_void` enforcement requires DB/schema verification. |
| Render worker | Not source-verified in this module. | Render jobs are queued, but no worker behavior was found in reviewed source. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/menu/flyer/edit` renders `VportActorMenuFlyerEditorScreen` only when `releaseFlags.vportFlyerEditor` is enabled. The flag defaults disabled.
- `/vport/:actorId/menu/flyer/edit` redirects through `VportToActorFlyerEditRedirect`; when `releaseFlags.vportFlyerEditor` is disabled, it redirects to `/feed`.
- `VportActorMenuFlyerEditorScreen` reads `actorId` from route params, requires identity, runs `useVportOwnership(viewerActorId, actorId)`, requires desktop, and renders `VportDesignStudioViewScreen`.
- The screen navigates back to `/actor/${actorId}/dashboard`.
- Preview navigates to `/actor/${actorId}/menu/flyer`.

### Screens

- `apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerEditorScreen.jsx`
- `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/screens/VportDesignStudioViewScreen.jsx`

### Hooks

- `useDesignStudio.js` orchestrates load, local scene state, save, create/delete page, upload asset, and export hook integration.
- `useDesignStudioSceneActions.js` owns local scene/node mutations.
- `useDesignStudioExports.js` queues exports and polls export status every 10 seconds.

### Controllers

- `designStudio.shared.controller.js`: `requireOwnerActorAccess(ownerActorId)`.
- `designStudio.load.controller.js`: `ctrlLoadDesignStudio`.
- `designStudio.pages.controller.js`: `ctrlSaveDesignPageScene`, `ctrlCreateDesignPage`, `ctrlDeleteDesignPage`.
- `designStudio.assetsExports.controller.js`: `ctrlUploadDesignAsset`, `ctrlQueueDesignExport`, `ctrlRefreshDesignExports`.
- `designStudio.controller.js`: barrel export for design studio controllers.

### DALs

- `designStudio.auth.dal.js`: reads authenticated Supabase user id.
- `designStudio.read.dal.js`: reads `vc.actor_owners` and design tables.
- `designStudio.write.dal.js`: inserts, updates, and deletes design tables.

### RPCs

None found in reviewed source or scanner maps.

### Edge Functions

None found in reviewed source or scanner maps.

### Engine Dependencies

No direct `engines/` dependency found.

Cross-feature dependencies:
- `@media` upload controller for design asset upload.
- `media.adapter.js` and `mediaAppId.adapter.js` for best-effort platform media asset record.

### Ownership Gates

- Route UI gate: `useVportOwnership(viewerActorId, actorId)`.
- Controller gate: `requireOwnerActorAccess(ownerActorId)` reads `supabase.auth.getUser()` and verifies a row in `vc.actor_owners`.
- Current source: caller-supplied `documentId` is bound to `ownerActorId` by `requireDesignDocumentOwnerAccess` before page/export/refresh controller paths continue.
- Current gap: `dalReadActorOwnerRow` does not filter `is_void`; DB/schema verification is still required.

---

## 4. Happy Paths

### HP-001 — Load Studio

BEH-DASH-designStudio-009

Preconditions:
Authenticated viewer owns the target VPORT actor, `releaseFlags.vportFlyerEditor` is enabled, and the editor opens on desktop.

Flow:
Route screen renders `VportDesignStudioViewScreen`. `useDesignStudio.loadStudio` calls `ctrlLoadDesignStudio`. Controller runs `requireOwnerActorAccess`, ensures a document exists, ensures a page/version exists, loads assets, loads exports, maps rows, and returns studio state.

Expected Result:
The canvas studio renders the document, active page, scene, assets, and export list.

Data Changes:
If missing, inserts `vc.design_documents`, `vc.design_pages`, `vc.design_page_versions`, updates `vc.design_pages.current_version_id`, and updates `vc.design_documents.updated_at`.

---

### HP-002 — Edit Scene Locally

BEH-DASH-designStudio-010

Preconditions:
Studio has loaded an active page and scene.

Flow:
Owner adds text, shape, or image nodes; edits page metadata; changes node style/geometry; reorders layers; deletes selected node.

Expected Result:
Scene state updates locally and dirty state becomes true.

Data Changes:
None until save/export save path runs.

---

### HP-003 — Save Current Page

BEH-DASH-designStudio-003

Preconditions:
Owner has loaded a document, active page, and scene.

Flow:
Owner clicks Save. Hook calls `ctrlSaveDesignPageScene({ ownerActorId, documentId, pageId, scene })`. Controller verifies owner access, verifies page exists and page belongs to `documentId`, normalizes scene content, inserts a page version, updates page current version, touches document, and returns mapped page/version.

Expected Result:
UI clears dirty state and shows saved scene version.

Data Changes:
Inserts `vc.design_page_versions`; updates `vc.design_pages`; updates `vc.design_documents.updated_at`.

---

### HP-004 — Upload Asset

BEH-DASH-designStudio-014

Preconditions:
Owner has selected an image file.

Flow:
Hook calls `ctrlUploadDesignAsset({ ownerActorId, file })`. Controller verifies owner access, uploads through media controller, inserts `vc.design_assets`, and attempts a non-fatal platform media asset record.

Expected Result:
Uploaded asset appears in the left asset rail.

Data Changes:
Uploads media; inserts `vc.design_assets`; may create platform media asset record.

---

### HP-005 — Queue Export

BEH-DASH-designStudio-006

Preconditions:
Owner has active page and saved or saveable scene.

Flow:
Owner clicks PNG or PDF. Export hook saves dirty page first if needed. Controller queues export using `ctrlQueueDesignExport`, normalizes format to `png` or `pdf`, inserts export row, inserts render job row, and updates UI queue state.

Expected Result:
Export queue displays a new PNG/PDF record and render job status.

Data Changes:
Inserts `vc.design_exports`; inserts `vc.design_render_jobs`.

---

### HP-006 — Refresh Exports

BEH-DASH-designStudio-007

Preconditions:
Studio has a loaded document.

Flow:
`useDesignStudioExports` polls every 10 seconds and calls `ctrlRefreshDesignExports({ ownerActorId, documentId })`. Controller verifies owner access, lists exports by document, lists render jobs by export IDs, and maps latest jobs.

Expected Result:
Export panel updates status and attempts.

Data Changes:
None.

---

### HP-007 — Delete Page

BEH-DASH-designStudio-005

Preconditions:
Document has more than one page and caller owns target VPORT actor. Current source sets `MAX_PAGES_PER_DOCUMENT = 1`, so this path is effectively dormant after normal initial load.

Flow:
Hook calls `ctrlDeleteDesignPage({ ownerActorId, documentId, pageId })`. Controller verifies owner access, requires more than one page, verifies target page is in document page list, deletes render jobs, exports, clears current version, deletes page versions, deletes page, and touches document.

Expected Result:
Page is removed locally and next available page becomes active.

Data Changes:
Deletes `vc.design_render_jobs`, `vc.design_exports`, `vc.design_page_versions`, and `vc.design_pages`; updates `vc.design_pages.current_version_id`; updates `vc.design_documents.updated_at`.

Current Source Note:
The hook blocks delete when page count is one or fewer, and create is blocked once one page exists. Multi-page delete behavior exists in controller/source but is not normally reachable through the current one-page UI state.

---

### HP-008 — Open Preview

BEH-DASH-designStudio-013

Preconditions:
Owner is in the editor.

Flow:
Owner clicks Preview. Route screen navigates to `/actor/${actorId}/menu/flyer`.

Expected Result:
Public preview route opens.

Data Changes:
None in reviewed designStudio source.

---

## 5. Failure Paths

### FP-001 — Missing Route Actor ID

BEH-DASH-designStudio-009

Trigger:
`actorId` route param is absent.

Expected System Behavior:
Route screen returns null.

Expected UI Behavior:
No editor is rendered.

Expected Logging:
None found in reviewed source.

---

### FP-002 — Missing Identity

BEH-DASH-designStudio-009

Trigger:
Viewer is not signed in.

Expected System Behavior:
Route does not render editor; controller gate would throw `Sign in required.` if reached.

Expected UI Behavior:
`Sign in required.` message renders.

Expected Logging:
None found in reviewed source.

---

### FP-003 — Non-owner Route Access

BEH-DASH-designStudio-001

Trigger:
Authenticated viewer does not own the target VPORT actor.

Expected System Behavior:
`useVportOwnership` returns non-owner state.

Expected UI Behavior:
`You can only edit flyers for your own vport.` message renders.

Expected Logging:
None found in reviewed source.

---

### FP-004 — Non-desktop Viewport

BEH-DASH-designStudio-009

Trigger:
Viewer is on non-desktop viewport.

Expected System Behavior:
Editor is not rendered.

Expected UI Behavior:
Desktop-only message renders.

Expected Logging:
None found in reviewed source.

---

### FP-005 — Missing Document ID On Save

BEH-DASH-designStudio-003

Trigger:
Save controller receives no `documentId`.

Expected System Behavior:
`ctrlSaveDesignPageScene` throws `Document id is required.`

Expected UI Behavior:
Hook sets save error message.

Expected Logging:
None found in reviewed source.

---

### FP-006 — Page Not Found

BEH-DASH-designStudio-003

Trigger:
Save/delete receives a page ID that does not resolve.

Expected System Behavior:
Controller throws `Page not found.`

Expected UI Behavior:
Hook sets failure message.

Expected Logging:
None found in reviewed source.

---

### FP-007 — Page Does Not Belong To Document

BEH-DASH-designStudio-003

Trigger:
Save receives `pageId` whose `document_id` does not match `documentId`.

Expected System Behavior:
Controller throws `Page does not belong to this document.`

Expected UI Behavior:
Hook sets failure message.

Expected Logging:
None found in reviewed source.

---

### FP-008 — Final Page Delete

BEH-DASH-designStudio-011

Trigger:
Delete is requested when document has one or fewer pages.

Expected System Behavior:
Hook/controller reject deletion.

Expected UI Behavior:
`At least one page is required.` error is shown.

Expected Logging:
None found in reviewed source.

---

### FP-009 — Export While Dirty Save Fails

BEH-DASH-designStudio-006

Trigger:
Export is requested while dirty, and the save step fails or returns no version ID.

Expected System Behavior:
Export is not queued.

Expected UI Behavior:
`Save failed. Resolve errors before exporting.` or save failure message is shown.

Expected Logging:
None found in reviewed source.

---

### FP-010 — Export Without Version

BEH-DASH-designStudio-006

Trigger:
Export is requested but no saved version exists.

Expected System Behavior:
Export is not queued.

Expected UI Behavior:
`Save the page before exporting.` is shown.

Expected Logging:
None found in reviewed source.

---

### FP-011 — Export Poll Failure

BEH-DASH-designStudio-007

Trigger:
Refresh export polling fails.

Expected System Behavior:
Polling error is ignored.

Expected UI Behavior:
Existing export state remains.

Expected Logging:
None found in reviewed source.

---

### FP-012 — Media Asset Record Failure

BEH-DASH-designStudio-014

Trigger:
Optional platform media asset record fails after successful upload/design asset insert.

Expected System Behavior:
Failure is non-fatal.

Expected UI Behavior:
Uploaded design asset still appears.

Expected Logging:
Development-only console warning.

---

### FP-013 — Cross-owner Document ID

BEH-DASH-designStudio-002

Trigger:
Caller supplies `ownerActorId` they own and `documentId` belonging to another VPORT.

Expected System Behavior:
Current source rejects through `requireDesignDocumentOwnerAccess` before affected page/export/refresh controller paths continue.

Expected UI Behavior:
Access error surfaces through hook error state.

Expected Logging:
No logging source found.

---

### FP-014 — Flyer Editor Feature Flag Disabled

BEH-DASH-designStudio-015

Trigger:
`releaseFlags.vportFlyerEditor` is disabled.

Expected System Behavior:
The `/actor/:actorId/menu/flyer/edit` route redirects to `/feed`, `/vport/:actorId/menu/flyer/edit` redirects to `/feed`, and the `flyer_edit` dashboard card is disabled by `isDashboardCardEnabled`.

Expected UI Behavior:
DesignStudio does not mount.

Expected Logging:
None found in reviewed source.

Finding Links:
DESIGNSTUDIO-FLAG-001.

---

### FP-015 — One-page Limit

BEH-DASH-designStudio-016

Trigger:
Owner tries to create another page after one page exists.

Expected System Behavior:
Hook rejects with `Only 1 page is available right now.` Controller independently rejects with `Only 1 page is allowed right now.` if reached.

Expected UI Behavior:
Error message is exposed through designStudio hook state.

Expected Logging:
None found in reviewed source.

Finding Links:
DESIGNSTUDIO-PAGE-LIMIT-001.

---

## 6. Security Rules

### SEC-001 — Owner Access Required

BEH-DASH-designStudio-009

Rule:
Only authenticated VPORT owners may use designStudio controller operations.

Enforcement Layer:
Route UI gate and `requireOwnerActorAccess(ownerActorId)`.

Current Status:
SOURCE VERIFIED — owner actor gate exists for load/upload and document owner gate is used for document-scoped page/export/refresh paths.

Finding Links:
VEN-DASH-003, ELEK-002.

---

### SEC-002 — Document Ownership Binding Required

BEH-DASH-designStudio-002

Rule:
Any operation using caller-supplied `documentId` must verify `design_documents.owner_actor_id === ownerActorId`.

Enforcement Layer:
Controller.

Current Status:
PATCHED — save/create/delete/export/refresh paths call `requireDesignDocumentOwnerAccess`.

Finding Links:
ELEK-002, VEN-DASH-003.

---

### SEC-003 — Page Must Belong To Document

BEH-DASH-designStudio-003

Rule:
Page writes must verify that `page.document_id === documentId`.

Enforcement Layer:
Controller.

Current Status:
SOURCE VERIFIED — save path checks page-to-document; delete path checks target page exists in document page list after document owner access passes.

Finding Links:
ELEK-002.

---

### SEC-004 — RLS Required On Design Tables

BEH-DASH-designStudio-012

Rule:
`vc.design_*` tables must have verified ownership-scoped RLS.

Enforcement Layer:
Database.

Current Status:
VERIFIED — live SQL confirmed RLS enabled and owner-scoped on all `vc.design_*` tables.

Finding Links:
BLOCK-DASH-004.

---

### SEC-005 — Revoked Owners Must Not Pass Gate

BEH-DASH-designStudio-008

Rule:
Voided ownership links must not authorize design studio access.

Enforcement Layer:
DAL / controller owner gate.

Current Status:
OPEN — `dalReadActorOwnerRow` does not filter `is_void`; DB schema verification required.

Finding Links:
ELEK-2026-06-02-003.

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-designStudio-001

Invariant:
A VPORT owner must never mutate another VPORT owner's design document.

Current Status:
PATCHED / SOURCE VERIFIED — document-scoped page/export/refresh controller paths call `requireDesignDocumentOwnerAccess`.

Related Findings:
ELEK-002, VEN-DASH-003, BLOCK-DASH-004.

Required Tests:
TESTREQ-DASH-designStudio-001 through TESTREQ-DASH-designStudio-005.

---

### MNH-002

BEH-DASH-designStudio-002

Invariant:
Caller-supplied `documentId` must never bypass ownership verification.

Current Status:
PATCHED / SOURCE VERIFIED.

Related Findings:
ELEK-002, VEN-DASH-003.

Required Tests:
TESTREQ-DASH-designStudio-001 through TESTREQ-DASH-designStudio-005.

---

### MNH-003

BEH-DASH-designStudio-003

Invariant:
A design page version must never be inserted unless the document belongs to `ownerActorId`.

Current Status:
PATCHED / SOURCE VERIFIED — document-to-owner and page-to-document checks are present in save path.

Related Findings:
ELEK-002, VEN-DASH-003.

Required Tests:
TESTREQ-DASH-designStudio-001.

---

### MNH-004

BEH-DASH-designStudio-004

Invariant:
A design page must never be created in a document not owned by `ownerActorId`.

Current Status:
PATCHED / SOURCE VERIFIED.

Related Findings:
ELEK-002, VEN-DASH-003.

Required Tests:
TESTREQ-DASH-designStudio-002.

---

### MNH-005

BEH-DASH-designStudio-005

Invariant:
A design page must never be deleted from a document not owned by `ownerActorId`.

Current Status:
PATCHED / SOURCE VERIFIED.

Related Findings:
ELEK-002, VEN-DASH-003.

Required Tests:
TESTREQ-DASH-designStudio-003.

---

### MNH-006

BEH-DASH-designStudio-006

Invariant:
A design export or render job must never be queued for a document not owned by `ownerActorId`.

Current Status:
PATCHED / SOURCE VERIFIED.

Related Findings:
ELEK-002, VEN-DASH-003.

Required Tests:
TESTREQ-DASH-designStudio-004.

---

### MNH-007

BEH-DASH-designStudio-007

Invariant:
Export refresh must never expose exports for a document not owned by `ownerActorId`.

Current Status:
PATCHED / SOURCE VERIFIED — export refresh calls `requireDesignDocumentOwnerAccess` before listing exports.

Related Findings:
ELEK-002.

Required Tests:
TESTREQ-DASH-designStudio-005.

---

### MNH-008

BEH-DASH-designStudio-008

Invariant:
A revoked owner row must never satisfy the design studio owner gate.

Current Status:
OPEN — DB/schema verification required.

Related Findings:
ELEK-2026-06-02-003.

Required Tests:
TESTREQ-DASH-designStudio-006.

---

### MNH-009

BEH-DASH-designStudio-009

Invariant:
A design document must never be created without authenticated owner access.

Current Status:
SOURCE_VERIFIED — owner gate runs before load creates missing document.

Related Findings:
None.

Required Tests:
TESTREQ-DASH-designStudio-007.

---

### MNH-010

BEH-DASH-designStudio-010

Invariant:
Invalid scene content must never be persisted without schema normalization.

Current Status:
SOURCE_VERIFIED.

Related Findings:
None.

Required Tests:
TESTREQ-DASH-designStudio-008.

---

### MNH-011

BEH-DASH-designStudio-011

Invariant:
The final remaining page must never be deleted.

Current Status:
SOURCE_VERIFIED.

Related Findings:
None.

Required Tests:
TESTREQ-DASH-designStudio-009.

---

### MNH-012

BEH-DASH-designStudio-012

Invariant:
Design writes must never rely solely on unverified `vc.design_*` RLS.

Current Status:
PATCHED — RLS is live-verified and app-layer document binding is present.

Related Findings:
BLOCK-DASH-004, ELEK-002, VEN-DASH-003.

Required Tests:
TESTREQ-DASH-designStudio-011.

---

### MNH-013

BEH-DASH-designStudio-013

Invariant:
Public preview navigation must never perform design table writes.

Current Status:
SOURCE_VERIFIED in reviewed designStudio source.

Related Findings:
None.

Required Tests:
TESTREQ-DASH-designStudio-013.

---

### MNH-014

BEH-DASH-designStudio-014

Invariant:
Asset upload must never write a `design_assets` row for an owner the caller does not own.

Current Status:
SOURCE_VERIFIED for owner gate; RLS live-verified at DB layer.

Related Findings:
BLOCK-DASH-004.

Required Tests:
TESTREQ-DASH-designStudio-010.

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vc.actor_owners` | Yes | No | No | No |
| `vc.design_documents` | Yes | Yes | Yes | No |
| `vc.design_pages` | Yes | Yes | Yes | Yes |
| `vc.design_page_versions` | Yes | Yes | No | Yes |
| `vc.design_assets` | Yes | Yes | No | No |
| `vc.design_exports` | Yes | Yes | No | Yes |
| `vc.design_render_jobs` | Yes | Yes | No | Yes |
| Media storage / media adapter | No | Upload side effect | No | No |

---

## 9. Side Effects

Notifications:
None found in reviewed source.

Analytics:
None found in reviewed source.

Media:
Image uploads use `uploadMediaController` with `scope: "design_asset"` and `ownerActorId`.

Exports:
PNG/PDF export requests insert `vc.design_exports` rows.

Jobs:
Export queue inserts `vc.design_render_jobs` rows with queued status and retry metadata.

Cache:
None found in reviewed source.

Other:
`createMediaAssetController` may record an additive platform media asset. Failure is non-fatal.

---

## 10. UI Outputs

Loading States:
- `Loading...` at route level during identity/ownership loading.
- `Loading design studio...` while initial studio data loads.

Success States:
- Canvas scene renders.
- Dirty state displays `Unsaved changes`.
- Saved state displays `All changes saved`.
- Assets appear in left rail.
- Export queue shows format, status, job status, and attempts.

Error States:
- `Sign in required.`
- `You can only edit flyers for your own vport.`
- `Desktop Only`
- Disabled flyer editor flag redirects to `/feed` before designStudio mounts.
- `Only 1 page is available right now.`
- Hook-provided save/load/create/delete/upload/export errors.

Empty States:
- Export panel shows `No exports requested yet.`
- Initial load creates missing document/page/version rather than rendering an empty editor.

Owner States:
- Owner receives full design studio editor controls on desktop.

Public States:
- Public preview navigation exists, but public preview behavior is outside reviewed designStudio source.

---

## 11. Acceptance Criteria

### AC-DASH-designStudio-001

Requirement:
Owner can load existing design studio state.

Evidence:
`ctrlLoadDesignStudio` lists owner documents, pages, assets, and exports.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-designStudio-002

Requirement:
First owner load creates missing document, page, and initial version using owner-scoped data.

Evidence:
`ensureDocument` and `ensurePageAndVersion`.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-designStudio-003

Requirement:
Owner can edit scene nodes locally and save a normalized scene version.

Evidence:
`useDesignStudioSceneActions`, `ensureSceneContent`, `ctrlSaveDesignPageScene`.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-designStudio-004

Requirement:
Owner can upload an image asset and insert an owner-scoped design asset row.

Evidence:
`ctrlUploadDesignAsset`, `dalCreateDesignAsset`.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-designStudio-005

Requirement:
Owner can queue PNG/PDF export only for their own document.

Evidence:
`ctrlQueueDesignExport` calls `requireDesignDocumentOwnerAccess({ ownerActorId, documentId })` before inserting export or render job rows.

Status:
SOURCE VERIFIED / FOCUSED TEST COVERED.

---

### AC-DASH-designStudio-006

Requirement:
Non-owner route access is denied.

Evidence:
`VportActorMenuFlyerEditorScreen` denies when `!isOwner`.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-designStudio-007

Requirement:
Non-owner controller access is denied.

Evidence:
`requireOwnerActorAccess(ownerActorId)`.

Status:
SOURCE VERIFIED. Actor ownership is checked, and document-scoped controller paths verify document ownership.

---

### AC-DASH-designStudio-008

Requirement:
Cross-owner `documentId` is rejected in save/create/delete/export/refresh paths.

Evidence:
`requireDesignDocumentOwnerAccess`, `designStudio.shared.controller.test.js`, `designStudio.documentOwner.controller.test.js`.

Status:
SOURCE VERIFIED / PARTIAL TEST COVERED. Shared helper plus create/export/refresh rejection are covered; direct save/delete controller-path tests remain missing.

---

### AC-DASH-designStudio-009

Requirement:
`vc.design_*` table RLS is verified by CARNAGE/DB.

Evidence:
BLOCK-DASH-004.

Status:
VERIFIED.

---

### AC-DASH-designStudio-010

Requirement:
Final page cannot be deleted.

Evidence:
Hook/controller reject deletion when page count is one or fewer.

Status:
SOURCE_VERIFIED.

---

### AC-DASH-designStudio-011

Requirement:
Controller security paths have SPIDER-MAN regression tests.

Evidence:
`designStudio.shared.controller.test.js`, `designStudio.documentOwner.controller.test.js`; scanner traceability map still appears stale and only lists color picker component entries.

Status:
PARTIAL.

---

### AC-DASH-designStudio-012

Requirement:
DesignStudio route availability is gated by the flyer editor release flag.

Evidence:
`releaseFlags.js`, `protected/app.routes.jsx`, `appRoutes.redirects.jsx`, `buildDashboardCards.model.js`.

Status:
SOURCE VERIFIED / DOCUMENTED.

---

### AC-DASH-designStudio-013

Requirement:
One-page limit behavior is documented and tested before broader page management is considered complete.

Evidence:
`designStudio.pages.controller.js`, `useDesignStudio.js`.

Status:
SOURCE VERIFIED / TEST MISSING.

---

## 12. Test Requirements

### TESTREQ-DASH-designStudio-001

Validates:
`ctrlSaveDesignPageScene` rejects cross-owner `documentId`.

Type:
Controller security regression.

Status:
PARTIAL — shared `requireDesignDocumentOwnerAccess` rejects cross-owner document IDs and source calls it in save path, but direct save-controller rejection test is still missing.

---

### TESTREQ-DASH-designStudio-002

Validates:
`ctrlCreateDesignPage` rejects cross-owner `documentId`.

Type:
Controller security regression.

Status:
COMPLETE — `designStudio.documentOwner.controller.test.js` verifies create-page rejects before listing or inserting pages when document ownership fails.

---

### TESTREQ-DASH-designStudio-003

Validates:
`ctrlDeleteDesignPage` rejects cross-owner `documentId`.

Type:
Controller security regression.

Status:
PARTIAL — source calls `requireDesignDocumentOwnerAccess`, but direct delete-controller rejection test is still missing.

---

### TESTREQ-DASH-designStudio-004

Validates:
`ctrlQueueDesignExport` rejects cross-owner `documentId`.

Type:
Controller security regression.

Status:
COMPLETE — `designStudio.documentOwner.controller.test.js` verifies export queue rejects before inserting export rows when document ownership fails.

---

### TESTREQ-DASH-designStudio-005

Validates:
`ctrlRefreshDesignExports` rejects cross-owner `documentId`.

Type:
Controller security regression.

Status:
COMPLETE — `designStudio.documentOwner.controller.test.js` verifies export refresh rejects before reading export rows when document ownership fails.

---

### TESTREQ-DASH-designStudio-006

Validates:
Revoked `actor_owners.is_void = true` does not pass owner gate once schema is verified.

Type:
Controller/DAL security regression.

Status:
BLOCKED_ON_DB_VERIFICATION.

---

### TESTREQ-DASH-designStudio-007

Validates:
Load creates missing document only after owner gate passes.

Type:
Controller behavior regression.

Status:
MISSING.

---

### TESTREQ-DASH-designStudio-008

Validates:
Save normalizes malformed scene content before insert.

Type:
Model/controller regression.

Status:
MISSING.

---

### TESTREQ-DASH-designStudio-009

Validates:
Delete rejects final remaining page.

Type:
Controller behavior regression.

Status:
MISSING.

---

### TESTREQ-DASH-designStudio-010

Validates:
Upload asset rejects non-owner and writes owner-scoped asset row.

Type:
Controller security regression.

Status:
MISSING.

---

### TESTREQ-DASH-designStudio-011

Validates:
CARNAGE/DB verifies RLS on all `vc.design_*` tables.

Type:
Database security verification.

Status:
VERIFIED.

---

### TESTREQ-DASH-designStudio-012

Validates:
Test traceability covers controller security paths, not only UI color picker components.

Type:
SPIDER-MAN coverage audit.

Status:
MISSING.

---

### TESTREQ-DASH-designStudio-013

Validates:
Preview navigation does not perform design table writes.

Type:
UI/route behavior regression.

Status:
MISSING.

---

### TESTREQ-DASH-designStudio-014

Validates:
Flyer editor release flag prevents designStudio route/card rendering when disabled.

Type:
Route/config regression.

Status:
MISSING / TRACKED BY DESIGNSTUDIO-FLAG-001.

---

### TESTREQ-DASH-designStudio-015

Validates:
One-page limit rejects add-page when one page exists and preserves final-page delete guard.

Type:
Hook/controller behavior regression.

Status:
MISSING / TRACKED BY DESIGNSTUDIO-PAGE-LIMIT-001.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| ELEK-002 / ELEK-2026-06-04-002 | HIGH | PATCHED / SOURCE VERIFIED | BEH-DASH-designStudio-001, 002, 003, 004, 005, 006, 007, 012 |
| VEN-DASH-003 | HIGH | PATCHED / SOURCE VERIFIED | BEH-DASH-designStudio-001, 002, 003, 004, 005, 006, 012 |
| BLOCK-DASH-004 | P0 / CRITICAL RISK | RESOLVED / RLS LIVE VERIFIED | BEH-DASH-designStudio-001, 002, 012 |
| ELEK-2026-06-02-003 | LOW | OPEN / DB_VERIFICATION_REQUIRED | BEH-DASH-designStudio-008 |
| DESIGNSTUDIO-FLAG-001 | LOW / behavior coverage | OPEN | BEH-DASH-designStudio-015, AC-DASH-designStudio-012, TESTREQ-DASH-designStudio-014 |
| DESIGNSTUDIO-PAGE-LIMIT-001 | LOW / behavior coverage | OPEN | BEH-DASH-designStudio-005, BEH-DASH-designStudio-016, AC-DASH-designStudio-013, TESTREQ-DASH-designStudio-015 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| CARNAGE verifies `vc.design_*` RLS | VERIFIED | NO |
| ELEK-002 document ownership patch applied | PATCHED | NO |
| VEN-DASH-003 closed | PATCHED | NO |
| SPIDER-MAN controller security tests added | PARTIAL — focused tests added | YES |
| Release flag and one-page current behavior covered by route/hook tests | MISSING | YES for behavior approval coverage |
| BEHAVIOR.md exists | REVIEWED | NO |
| THOR re-run after fixes | NOT_RUN_AFTER_FIXES | YES |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Owner-only design editor | None found | MISSING_SOURCE |
| Document ownership binding | None found | MISSING_SOURCE |
| Scene editing and save | None found | MISSING_SOURCE |
| Asset upload | None found | MISSING_SOURCE |
| PNG/PDF export queue | None found | MISSING_SOURCE |
| Public preview navigation | None found | MISSING_SOURCE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| None found | No direct `engines/` import in reviewed designStudio source | SOURCE_VERIFIED |
| Media adapter | Upload design assets and best-effort media asset record | SOURCE_VERIFIED |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-designStudio-001 | Is RLS enabled and ownership-scoped on all `vc.design_*` tables? | ANSWERED — VERIFIED 2026-06-04 |
| OQ-DASH-designStudio-002 | Does `vc.actor_owners` currently have an `is_void` column that should be filtered in designStudio ownership DAL? | DB_VERIFICATION_REQUIRED |
| OQ-DASH-designStudio-003 | Should `ctrlRefreshDesignExports` be patched as read-path hardening alongside write paths? | RESOLVED — current source calls `requireDesignDocumentOwnerAccess` before export reads. |
| OQ-DASH-designStudio-004 | Is public preview expected to read the design document or a separate flyer/public data source? | MISSING_SOURCE |
| OQ-DASH-designStudio-005 | Is one-page-only design studio temporary or intentional? | MISSING_SOURCE |
| OQ-DASH-designStudio-006 | Is there a render worker implementation for queued `design_render_jobs` outside this module? | MISSING_SOURCE |
| OQ-DASH-designStudio-007 | Should designStudio have a dedicated category key instead of parent `dashboard`? | OPEN |
| OQ-DASH-designStudio-008 | Should the flyer editor release flag default disabled state be treated as product-intentional or temporary rollout behavior? | OPEN |

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

ARCHITECT: REVIEWED — source architecture mapped; designStudio is Tier 1 security-critical module.

VENOM: CAUTION — VEN-DASH-003 patched; documentId is bound to ownerActorId in page/export controller paths.

ELEKTRA: CAUTION — ELEK-002 patched; focused source-to-sink regression tests pass.

BLACKWIDOW: CAUTION — `vc.design_*` RLS live-verified; broader SPIDER-MAN coverage still required.

SPIDER-MAN: PARTIAL — focused controller security regression coverage exists; broader route/export/render coverage still required.

PROFESSOR X: REVIEWED — behavior contract drafted from source, scanner, and existing findings.

THOR: CAUTION — RLS and ownership patches are verified; CLEAR still requires broader SPIDER-MAN coverage and THOR re-run after fixes.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding ID | Handoff |
|---|---|---|---|
| design_* tables (design_studio_assets, design_studio_pages) have schema=None in write-surface-map | HIGH | ARCHITECT_VERIFIED | CARNAGE |
| Asset storage bucket (design-studio-assets) undocumented — RLS policy unknown | HIGH | ARCHITECT_VERIFIED | VENOM |
| designStudio routes not confirmed in scanner route-map (nested under flyerBuilder) | MEDIUM | ARCHITECT_VERIFIED | HAWKEYE |
| No adapter boundary between flyerBuilder and designStudio — sub-module directly imports parent DAL | MEDIUM | ARCHITECT_VERIFIED | SENTRY |
| Page export/import behavior UNKNOWN from governance artifacts alone | MEDIUM | ARCHITECT_VERIFIED | Engineering |
| No native parity documentation | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: MISSING — SPIDER-MAN required.

Ownership enforcement: [ARCHITECT_VERIFIED] dalReadAuthenticatedUserId (supabase.auth.getUser) confirmed in designStudio.auth.dal.js. No actor_owners check — auth-only scope verification pending VENOM.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/designStudio/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §8 (designStudio: canvas editing sub-module)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md (VEN-CARD-001 applies to parent flyerBuilder)
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_REVIEWED — Canvas/asset management flow documented. CARNAGE required for design_* schema. Storage bucket RLS unknown — VENOM required. Regression coverage missing.
