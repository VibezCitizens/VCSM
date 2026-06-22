# MODULE ARCHITECTURE REPORT

**Module:** professional
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Professional User Workspace (Nurse / Enterprise)
**Primary Root:** `apps/VCSM/src/features/professional/`
**Independence Status:** FRAGMENTED
**Completeness Status:** INCOMPLETE

---

## PURPOSE

Owns gated professional user workspace: professional access gate screen, nurse workspace (housing notes, facility insights, work tabs), professional briefings feed, and enterprise workspace. Gated behind professional access verification. The module is organized into multiple disconnected sub-domains with no unified adapter or documentation.

---

## ENTRY POINTS

- `/professional` → `ProfessionalAccessScreen.jsx` (access gate)
- `/professional/nurse` → `NurseHomeScreen.jsx`
- `/professional/briefings` → `ProfessionalBriefingsScreen.jsx`

---

## LAYER MAP

**briefings/ sub-module:**
DAL: `professionalBriefings.read.dal.js`
Controller: `listProfessionalBriefings.controller.js`
Hook: `useProfessionalBriefings.js`
Model: `professionalBriefing.model.js`
Components: `BriefingsFilters.jsx`, `BriefingsList.jsx`, `BriefingsSummaryCards.jsx`
Screen: `ProfessionalBriefingsScreen.jsx`
View: `ProfessionalBriefingsScreenView.jsx`

**core/ sub-module:**
Config: `professionCatalog.config.js`
Storage: `professionalAccess.storage.js` — localStorage-backed access gating

**enterprise/ sub-module:**
Data: `enterprise/data/enterpriseSeed.data.js` — **HARD-CODED SEED DATA IN FEATURE**
Hook: `useEnterpriseWorkspace.js`
Model: `buildEnterpriseView.model.js`
UI: `EnterpriseWorkspace.jsx`, `enterprisePanels.jsx`, `enterpriseRows.jsx`

**professional-nurse/ sub-module:**
Config: `housing/config/housingCategories.config.js`
UI: AddFacilityInsightForm, AddForm, AddHousingExperienceForm, CitySelector, HousingCategoryBadge, HousingEmptyState, HousingNoteCard, HousingNotesList
Screens: `NurseHomeScreen.jsx`, `NurseHomeScreenView.jsx`, views/FacilityInsightsTabView, HousingTabView, NurseAddMenu, NurseWorkspaceTabs

**screens/ root:**
- `ProfessionalAccessScreen.jsx`

**Adapter:** NONE — **MISSING ADAPTER**

**No DAL for enterprise or nurse sub-modules** — **MISSING DAL LAYER**

**No controllers for enterprise or nurse sub-modules** — **MISSING CONTROLLER LAYER**

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Professional workspace — but sub-domains unclear | Enterprise seems different product |
| Owner defined | FAIL | No IRONMAN record | — |
| Entry points mapped | PASS | 3 screens | — |
| Controllers present | PARTIAL | briefings only | Enterprise/nurse missing controllers |
| DAL present | PARTIAL | briefings only | Enterprise/nurse missing DAL |
| Models present | PARTIAL | briefings + enterprise | Nurse missing model |
| Hooks present | PARTIAL | 2 hooks only | Enterprise/nurse limited |
| Screens present | PASS | 3+ screens | — |
| Adapter present | FAIL | None | Cannot be safely consumed cross-feature |
| Database objects mapped | FAIL | Not documented | Are enterprise/nurse DB-backed? |
| Authorization path mapped | FAIL | localStorage-based access gate | localStorage = bypassable |
| Documentation | FAIL | No Logan doc | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `enterpriseSeed.data.js` | Hard-coded data in production feature | HIGH | IRONMAN |
| `professionalAccess.storage.js` localStorage gate | Access gating in localStorage = bypassable | CRITICAL | VENOM |
| Enterprise sub-module without DAL | Enterprise data from seed file — not DB | HIGH | IRONMAN |
| Nurse sub-module without DAL/controllers | Nurse screens have no data layer | HIGH | IRONMAN |
| No unified adapter | Cannot be consumed safely | HIGH | IRONMAN |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Replace localStorage access gate | CRITICAL | localStorage is bypassable — access not enforced | VENOM |
| DAL + controller for enterprise/nurse | CRITICAL | These sub-modules have no data layer | IRONMAN |
| Remove enterpriseSeed.data.js | HIGH | Hard-coded data in production code | IRONMAN |
| Create professional.adapter.js | HIGH | No public API boundary | IRONMAN |
| Clarify enterprise vs nurse vs briefings scope | HIGH | These look like separate products | IRONMAN |
| Logan documentation | HIGH | No canonical professional docs | LOGAN |

---

## FINAL MODULE STATUS: INCOMPLETE

## RECOMMENDED HANDOFFS:
- VENOM (security: localStorage access gate)
- IRONMAN (ownership: enterprise seed data, missing DAL, adapter)
- CARNAGE (schema: professional briefings DB objects)
- LOGAN (documentation)
