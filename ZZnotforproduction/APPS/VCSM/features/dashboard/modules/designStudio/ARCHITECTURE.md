# ARCHITECTURE — Dashboard Module: designStudio

**Last ARCHITECT Run:** 2026-06-05
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: designStudio
Application Scope: VCSM
Module Type: dashboard sub-module (embedded in flyerBuilder)
Primary Root: apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/
Independence Status: DEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] A canvas-based document design editor embedded within the flyerBuilder feature. Provides a full design authoring environment: create/edit multi-page documents, manage canvas nodes (text, images, shapes), export designs as images/PDFs, manage document versioning, and handle asset uploads. The studio operates as a rich stateful editor with its own controller cluster, DAL, hooks, and components. Auth gating is handled by a dedicated `designStudio.auth.dal.js` that reads the authenticated Supabase user ID for ownership enforcement.

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: designStudio.write.dal.js — INSERT/UPDATE/DELETE on design_documents, design_pages, design_page_versions, design_assets, design_exports, design_render_jobs
Ownership enforcement: `dalReadAuthenticatedUserId()` via `designStudio.auth.dal.js` (reads Supabase auth.getUser())
Document ownership test confirmed: `designStudio.documentOwner.controller.test.js`

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Screen: `VportDesignStudioViewScreen.jsx` — full-screen design editor
- Entry via flyerBuilder module (no independent route in route-map)
- Exported via parent flyerBuilder barrel

---

## LAYER MAP

DAL:
- `dal/designStudio.auth.dal.js` — `dalReadAuthenticatedUserId()` via supabase.auth.getUser() [SOURCE_VERIFIED]
- `dal/designStudio.read.dal.js` — READ design_documents, design_pages, design_page_versions, design_assets [SOURCE_VERIFIED]
- `dal/designStudio.write.dal.js` — INSERT/UPDATE/DELETE design_documents, design_pages, design_page_versions, design_assets, design_exports, design_render_jobs [SOURCE_VERIFIED]

Model:
- `model/designStudioMapper.model.js` — maps DB records to studio state [SOURCE_VERIFIED]
- `model/designStudioScene.model.js` — scene/canvas state shape [SOURCE_VERIFIED]

Controller:
- `controller/designStudio.assetsExports.controller.js` — asset upload + export trigger [SOURCE_VERIFIED]
- `controller/designStudio.controller.js` — main orchestrator [SOURCE_VERIFIED]
- `controller/designStudio.load.controller.js` — document load flow [SOURCE_VERIFIED]
- `controller/designStudio.pages.controller.js` — page lifecycle (create/delete/reorder) [SOURCE_VERIFIED]
- `controller/designStudio.shared.controller.js` — shared utilities across controllers [SOURCE_VERIFIED]

Hook:
- `hooks/useDesignStudio.js` — main studio state hook [SOURCE_VERIFIED]
- `hooks/useDesignStudioExports.js` — export management hook [SOURCE_VERIFIED]
- `hooks/useDesignStudioSceneActions.js` — scene action dispatchers [SOURCE_VERIFIED]

Component:
- `components/DesignStudioCanvasStage.jsx` [SOURCE_VERIFIED]
- `components/DesignStudioExportsPanel.jsx` [SOURCE_VERIFIED]
- `components/DesignStudioPagesRail.jsx` [SOURCE_VERIFIED]
- `components/DesignStudioSidebarLeft.jsx` [SOURCE_VERIFIED]
- `components/DesignStudioSidebarRight.jsx` [SOURCE_VERIFIED]
- `components/DesignStudioTopBar.jsx` [SOURCE_VERIFIED]
- `components/canvasStage/CanvasNode.jsx` [SOURCE_VERIFIED]
- `components/canvasStage/CanvasRulers.jsx` [SOURCE_VERIFIED]
- `components/canvasStage/DesignStudioNodeBody.jsx` [SOURCE_VERIFIED]
- `components/canvasStage/canvasMath.js` [SOURCE_VERIFIED]
- `components/canvasStage/useCanvasInteraction.js` — canvas interaction hook [SOURCE_VERIFIED]
- `components/sidebarRight/DesignStudioInlineColorPicker.jsx` [SOURCE_VERIFIED]
- `components/sidebarRight/DesignStudioSidebarLayersSection.jsx` [SOURCE_VERIFIED]
- `components/sidebarRight/DesignStudioSidebarPageSection.jsx` [SOURCE_VERIFIED]
- `components/sidebarRight/DesignStudioSidebarSelectionSection.jsx` [SOURCE_VERIFIED]
- `components/sidebarRight/designStudioSidebarRight.styles.js` [SOURCE_VERIFIED]
- `components/topBar/DesignStudioTextColorPicker.jsx` [SOURCE_VERIFIED]

Screen:
- `screens/VportDesignStudioViewScreen.jsx` [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Canvas-based document editor with full CRUD | — |
| Owner defined | PASS | VCSM:dashboard | — |
| Entry points mapped | PARTIAL | Screen present; independent route not confirmed | SCANNER_LEAD |
| Controllers present/delegated | PASS | 5 controllers covering load/page/asset/export/shared | — |
| DAL/repository present/delegated | PASS | 3 DALs — auth + read + write | — |
| Models/transformers present | PASS | 2 models — mapper + scene | — |
| Hooks/view models present | PASS | 3 hooks | — |
| Screens/components present | PASS | 1 screen + 17 components | — |
| Services/adapters present | FAIL | No explicit adapter | — |
| Database objects mapped | PASS | design_documents, design_pages, design_page_versions, design_assets, design_exports, design_render_jobs | Schema: None (write-surface-map shows schema=None) |
| Authorization path mapped | PASS | dalReadAuthenticatedUserId + documentOwner test | — |
| Cache/runtime behavior mapped | FAIL | Not documented | — |
| Error/loading/empty states mapped | PARTIAL | Components handle; not centrally documented | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | PASS | designStudio.documentOwner.controller.test.js + designStudio.shared.controller.test.js | — |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | FAIL | No engine dependency documented | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| supabase.auth | service | designStudio → supabase | YES — direct Supabase auth | Via auth DAL |
| flyerBuilder | parent feature | designStudio → flyerBuilder | YES — embedded sub-module | Entry via flyerBuilder |
| design_* tables | database | designStudio → design schema | YES — owned | Full CRUD confirmed |
| media/asset storage | service | designStudio → storage | SCANNER_LEAD — mechanism unclear | Asset uploads |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| design_documents | read/write | VCSM:dashboard/designStudio | load + write controllers | Full lifecycle — INSERT/UPDATE/DELETE |
| design_pages | read/write | VCSM:dashboard/designStudio | pages controller + write DAL | Full lifecycle |
| design_page_versions | read/write | VCSM:dashboard/designStudio | write DAL | Versioning |
| design_assets | read/write | VCSM:dashboard/designStudio | assetsExports controller | Asset management |
| design_exports | read/write | VCSM:dashboard/designStudio | assetsExports controller | Export records |
| design_render_jobs | read/write | VCSM:dashboard/designStudio | assetsExports controller | Render job queue |
| auth user ID | read | supabase.auth | designStudio.auth.dal | Document ownership check |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PARTIAL | Screen exists; route not confirmed independently | SCANNER_LEAD |
| Loading state | PARTIAL | useDesignStudio manages state | Not centrally verified |
| Empty state | PARTIAL | New document creation in load controller | — |
| Error state | PARTIAL | Controllers throw; UI handling unclear | — |
| Auth/owner gates | PASS | dalReadAuthenticatedUserId + documentOwner test confirmed | — |
| Cache behavior | UNKNOWN | Not documented | — |
| Runtime dependencies | PARTIAL | Supabase auth + storage | Storage mechanism undocumented |
| Hot paths | PARTIAL | Document save on every canvas action is potentially hot | KRAVEN |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | Prior (Dashboard Security Sprint 2026-05-29) | PARTIAL |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md | HIGH | Canvas editor behavior, document ownership, export flow undocumented | LOGAN |
| design_* table schema documentation | HIGH | Schema is None in write-surface-map — tables may be in non-default schema | CARNAGE |
| Asset storage mechanism | MEDIUM | Upload target undocumented | LOKI |
| Route confirmation | MEDIUM | DesignStudio entry point via flyerBuilder — route unclear | HAWKEYE |
| Performance review on canvas save | MEDIUM | High-frequency writes likely | KRAVEN |
| Native parity | LOW | Not documented | Falcon |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/dal/designStudio.write.dal.js
Module: designStudio
Current dependency: write-surface-map shows schema=None for all design tables
Expected boundary: All tables should have documented schema ownership
Risk: MEDIUM — design_* tables schema is unresolved in scanner; Carnage needs to verify ownership
Suggested correction: CARNAGE audit to confirm design_* table schema and RLS policies

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Add BEHAVIOR.md | Complex editor behavior undocumented | LOGAN |
| P1 | Confirm design_* table schema ownership | Schema=None in write-surface-map | CARNAGE |
| P2 | Document asset storage mechanism | Upload target undocumented | LOKI |
| P2 | Performance review on canvas writes | High-frequency save path | KRAVEN |
| P3 | Native parity notes | Complex canvas — parity assessment needed | Falcon |

## RECOMMENDED HANDOFFS: LOGAN, CARNAGE, LOKI, KRAVEN, HAWKEYE
