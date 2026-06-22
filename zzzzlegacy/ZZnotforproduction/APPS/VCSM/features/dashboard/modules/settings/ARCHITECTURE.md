# ARCHITECTURE — Dashboard Module: settings

**Last ARCHITECT Run:** 2026-06-05
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: settings
Application Scope: VCSM
Module Type: dashboard card module
Primary Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Manages VPORT public-facing settings from the owner dashboard. Allows the VPORT owner to update business details, toggle feature cards, manage TRAZE discovery settings, view ads preview, and manage business card. Write path: `vportPublicDetails.write.dal.js` upserts `vport.profile_public_details`. The settings coordinator controller orchestrates validation and saving sequence. A regression test (`settingsSavingGuard.regression.test.js`) confirms that saving is properly guarded against unauthorized actors.

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: `saveVportPublicDetailsByActorId.controller.js` and `settingsCoordinator.controller.js`
Ownership enforcement: Actor ownership verified in saveVportPublicDetailsByActorId controller (actorId scoped write)

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Route: `/actor/:actorId/dashboard/settings` (inferred — no explicit route in route-map output; under `OwnerOnlyDashboardGuard` wrapper)
- Screens: VportSettingsScreen.jsx (entry), VportSettingsFinalScreen.jsx (composition)
- Exported via: `index.js`

---

## LAYER MAP

DAL:
- `dal/vportPublicDetails.write.dal.js` — UPSERT vport.profile_public_details [SOURCE_VERIFIED]

Model:
- `model/vportSettingsDraft.model.js` — draft state shape [SOURCE_VERIFIED]
- `model/vportSettingsValidation.model.js` — validation rules [SOURCE_VERIFIED]

Controller:
- `controller/saveVportPublicDetailsByActorId.controller.js` — single-actor write path [SOURCE_VERIFIED]
- `controller/settingsCoordinator.controller.js` — orchestrates validation + save sequence [SOURCE_VERIFIED]

Hook:
- `hooks/useSaveVportPublicDetailsByActorId.js` [SOURCE_VERIFIED]
- `hooks/useSaveVportSettings.js` [SOURCE_VERIFIED]

Component:
- `components/CardSettingToggleRow.jsx` [SOURCE_VERIFIED]
- `components/VportSettingsAdsPreview.jsx` [SOURCE_VERIFIED]
- `components/VportSettingsBusinessCard.jsx` [SOURCE_VERIFIED]
- `components/VportSettingsTrazeCard.jsx` [SOURCE_VERIFIED]

Screen:
- `VportSettingsScreen.jsx` [SOURCE_VERIFIED]
- `VportSettingsFinalScreen.jsx` [SOURCE_VERIFIED]
- `index.js` [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Public details update + card toggles + TRAZE settings | — |
| Owner defined | PASS | VCSM:dashboard | — |
| Entry points mapped | PARTIAL | Screens confirmed; route not in route-map output (may be under VportSettingsFinalScreen redirect) | [SCANNER_LEAD] |
| Controllers present/delegated | PASS | 2 controllers — individual + coordinator | — |
| DAL/repository present/delegated | PASS | vportPublicDetails.write.dal.js | — |
| Models/transformers present | PASS | Draft + validation models | — |
| Hooks/view models present | PASS | 2 hooks | — |
| Screens/components present | PASS | 2 screens + 4 components | — |
| Services/adapters present | FAIL | No adapter exposed | — |
| Database objects mapped | PASS | vport.profile_public_details — confirmed in write-surface-map | — |
| Authorization path mapped | PASS | actorId-scoped write; regression test confirms guard | — |
| Cache/runtime behavior mapped | FAIL | Not documented | — |
| Error/loading/empty states mapped | PARTIAL | settingsDraft model handles draft state; error surfaces unclear | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | PASS | settingsCoordinator.controller.test.js + settingsSavingGuard.regression.test.js | — |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | FAIL | No engine dependency documented | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| vport.profile_public_details | database | settings → vport schema | YES — owned table | UPSERT only |
| OwnerOnlyDashboardGuard | route | route wrapper | YES | Route-level auth |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vport.profile_public_details | write | VCSM:dashboard/settings | saveVportPublicDetailsByActorId | UPSERT confirmed |
| settings draft state | derived | vportSettingsDraft.model | hooks | Client-side only |
| TRAZE settings | write | vport.profile_public_details | VportSettingsTrazeCard | Part of profile_public_details |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PARTIAL | Screens exist; route not confirmed in route-map | SCANNER_LEAD |
| Loading state | PARTIAL | Hook manages; screen states not verified | — |
| Empty state | PARTIAL | settingsDraft initializes; empty state screen unclear | — |
| Error state | PARTIAL | Controller throws; UI error handling unclear | — |
| Auth/owner gates | PASS | actorId scoped + regression test confirms guard | — |
| Cache behavior | UNKNOWN | Not documented | — |
| Runtime dependencies | PASS | vportPublicDetails.write.dal only | — |
| Hot paths | PARTIAL | settingsCoordinator is hot on save | — |

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
| BEHAVIOR.md | HIGH | Settings coordinator logic and validation flow undocumented | LOGAN |
| Route confirmation | MEDIUM | Route not confirmed in route-map scan | HAWKEYE |
| Cache/runtime docs | MEDIUM | Settings save path undocumented | LOKI |
| Native parity | LOW | Not documented | Falcon |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Add BEHAVIOR.md | Settings logic and card toggle behavior undocumented | LOGAN |
| P2 | Confirm route in route-map | Route not visible in scanner output | HAWKEYE |
| P2 | Document cache/runtime | Save path not documented | LOKI |
| P3 | Native parity notes | Not documented | Falcon |

## RECOMMENDED HANDOFFS: LOGAN, HAWKEYE, LOKI
