# MODULE ARCHITECTURE REPORT

**Module:** vport
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — VPORT Creation & Core Ops
**Primary Root:** `apps/VCSM/src/features/vport/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns VPORT creation (multi-step form: profile + services), VPORT restore/recover, core VPORT operations (publish, unpublish), service catalog read, and VPORT preview/showcase UI. The VPORT profile rendering is handled by `profiles/` feature. VPORT dashboard is handled by `dashboard/`.

---

## ENTRY POINTS

- `/vport/create` → `CreateVportForm.jsx` (at feature root, not in screens/ — structural note)
- `/vport/restore` → `RestoreVportScreen.jsx`

---

## LAYER MAP

**DAL:** `readVportServiceCatalogByType.dal.js`, `vport.core.dal.js`, `vport.read.vportRecords.dal.js`, `vport.write.profileMedia.dal.js`

**Controllers:** `getVportServiceCatalog.controller.js`, `submitCreateVport.controller.js`, `vportCoreOps.controller.js`

**Hooks:** `useCreateVport.js`, `useRestoreVport.js`, `useVportCoreOps.js`, `useVportServiceCatalog.js`

**Model:** `createVportForm.model.js`, `vportServiceCatalog.model.js`

**Components (root vport/):**
- `CreateVportForm.jsx` — **at feature root, not in components/ or screens/** — structural violation
- `components/CreateVportDebugPanel.jsx`
- `components/CreateVportProfileTab.jsx`
- `components/CreateVportServicesTab.jsx`

**Screens:** `RestoreVportScreen.jsx`

**Public (preview showcase):**
- `public/VportPhonePreview.jsx`
- `public/VportPreviewCard.jsx`
- `public/VportPreviewShowcase.jsx`
- `public/vportCarousel.css`
- `public/vportPhonePreviewScreens.jsx`
- `public/vportPreviewData.js`
- `public/vportPreviewModel.js`

**Utils:** `utils/openDirections.js`

**Adapters:**
- `adapters/CreateVportForm.jsx.adapter.js` — `.jsx.adapter.js` naming violation
- `adapters/vport.public.adapter.js`

**Exports:** `vport.public.js`

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | VPORT creation clear | — |
| Controllers present | PASS | 3 controllers | — |
| DAL present | PASS | 4 DAL files | — |
| Hooks present | PASS | 4 hooks | — |
| Models present | PASS | 2 models | — |
| Screens present | PARTIAL | RestoreVportScreen only | CreateVportForm at root — violation |
| Adapter present | PARTIAL | 2 adapters but naming violation | `.jsx.adapter.js` |
| Documentation | FAIL | No Logan doc | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `CreateVportForm.jsx` at feature root | Should be in `screens/` or `components/` | HIGH — structural violation | SENTRY |
| `adapters/CreateVportForm.jsx.adapter.js` | `.jsx.adapter.js` naming violation | HIGH | LOGAN |
| `vportPreviewData.js` in public/ | Hard-coded mock preview data | MEDIUM | IRONMAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: CreateVportForm at root)
- LOGAN (naming: adapter naming violation)
- IRONMAN (ownership: preview data — mock or live?)
