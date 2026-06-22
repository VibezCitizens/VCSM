# ARCHITECTURE — Dashboard Module: flyerBuilder

**Last ARCHITECT Run:** 2026-06-05
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: flyerBuilder
Application Scope: VCSM
Module Type: dashboard top-level module
Primary Root: apps/VCSM/src/features/dashboard/flyerBuilder/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Provides VPORT owners with digital marketing tools: flyer creation, printable QR sheet generation, and access to the embedded DesignStudio canvas editor. The flyerBuilder module has two primary sub-flows: (1) the flyer editor flow — edit business profile details used on flyers (hours table, images) stored in `vport.profile_public_details`; (2) the designStudio sub-module — a full canvas editor for custom designs. Printable QR sheets (PrintableQrSheet, PrintableQrFlyerCard) are rendered for in-person marketing collateral.

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: `flyer.write.dal.js` — UPSERT vport.profile_public_details; designStudio write DAL
Ownership enforcement: actorId scoped in flyerEditor.controller.js; designStudio.auth.dal.js for design documents

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Screen: `screens/VportActorMenuFlyerEditorScreen.jsx` — flyer editor entry
- Screen: `screens/VportActorMenuFlyerScreen.jsx` — flyer view
- Screen: `screens/VportActorMenuFlyerView.jsx` — flyer display view
- DesignStudio nested: `designStudio/screens/VportDesignStudioViewScreen.jsx`
- Flyer routes: [SCANNER_LEAD — route registration in app.routes.jsx not confirmed in output; route file imports VportActorMenuFlyerEditorScreen]

---

## LAYER MAP

DAL:
- `dal/flyer.write.dal.js` — UPSERT vport.profile_public_details [SOURCE_VERIFIED]
- `designStudio/dal/*` — full designStudio DAL (see designStudio module) [SOURCE_VERIFIED]

Model:
- `model/printableQrSheet.model.js` — QR sheet data shape [SOURCE_VERIFIED]
- `model/vportActorMenuFlyerView.model.js` — flyer view data shape [SOURCE_VERIFIED]
- `designStudio/model/*` — designStudio models [SOURCE_VERIFIED]

Controller:
- `controller/flyerEditor.controller.js` — flyer edit + save [SOURCE_VERIFIED]
- `designStudio/controller/*` — designStudio controllers [SOURCE_VERIFIED]

Hook:
- `hooks/useFlyerEditor.js` — flyer editor state [SOURCE_VERIFIED]
- `designStudio/hooks/*` — designStudio hooks [SOURCE_VERIFIED]

Component:
- `components/FlyerBuilderShell.jsx` [SOURCE_VERIFIED]
- `components/FlyerEditorPanel.jsx` [SOURCE_VERIFIED]
- `components/FlyerHoursTable.jsx` [SOURCE_VERIFIED]
- `components/ImageDropzone.jsx` [SOURCE_VERIFIED]
- `components/flyerEditorPanel.styles.js` [SOURCE_VERIFIED]
- `components/printableQr/PrintableQrFlyerCard.jsx` [SOURCE_VERIFIED]
- `components/printableQr/PrintableQrSheet.jsx` [SOURCE_VERIFIED]
- `components/printableQr/printableQrSheet.base.styles.js` [SOURCE_VERIFIED]
- `components/printableQr/printableQrSheet.layout.styles.js` [SOURCE_VERIFIED]
- `components/printableQr/printableQrSheet.styles.js` [SOURCE_VERIFIED]
- `designStudio/components/*` — 17 designStudio components [SOURCE_VERIFIED]

Screen:
- `screens/VportActorMenuFlyerEditorScreen.jsx` [SOURCE_VERIFIED]
- `screens/VportActorMenuFlyerScreen.jsx` [SOURCE_VERIFIED]
- `screens/VportActorMenuFlyerView.jsx` [SOURCE_VERIFIED]
- `designStudio/screens/VportDesignStudioViewScreen.jsx` [SOURCE_VERIFIED]

Style:
- `styles/vportActorMenuFlyerEditorScreen.styles.js` [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Flyer editor + QR printable + designStudio | — |
| Owner defined | PASS | VCSM:dashboard | — |
| Entry points mapped | PARTIAL | Screens confirmed; routes not in route-map output | SCANNER_LEAD |
| Controllers present/delegated | PASS | flyerEditor.controller + designStudio controllers | — |
| DAL/repository present/delegated | PASS | flyer.write.dal + designStudio DALs | — |
| Models/transformers present | PASS | 2 flyer models + designStudio models | — |
| Hooks/view models present | PASS | useFlyerEditor + designStudio hooks | — |
| Screens/components present | PASS | 3 flyer screens + 10 components + QR printables | — |
| Services/adapters present | FAIL | No explicit adapter exposed | — |
| Database objects mapped | PASS | vport.profile_public_details (UPSERT confirmed) + design_* tables | — |
| Authorization path mapped | PASS | actorId scoped in controller + designStudio.auth.dal | — |
| Cache/runtime behavior mapped | FAIL | Not documented | — |
| Error/loading/empty states mapped | PARTIAL | Components exist; not centrally documented | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | PASS | flyerEditor.controller.test.js + designStudio tests | — |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | FAIL | Not documented | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| vport.profile_public_details | database | flyerBuilder → vport schema | YES — owned | UPSERT confirmed |
| designStudio sub-module | feature | flyerBuilder → designStudio | YES — parent-child | Embedded sub-module |
| qrcode module | feature | flyerBuilder → qrcode | SCANNER_LEAD — flyer uses QR components | QrCode component likely imported |
| supabase.auth | service | via designStudio.auth.dal | YES — via DAL | Document ownership |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vport.profile_public_details | write | VCSM:dashboard/flyerBuilder | flyerEditor.controller | UPSERT confirmed — same table as settings module |
| design_* tables | read/write | VCSM:dashboard/designStudio | designStudio sub-module | Full CRUD |
| QR code data | derived | qrcode adapter | flyerBuilder components | QR generation mechanism |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PARTIAL | Screens exist; routes not in route-map output | SCANNER_LEAD |
| Loading state | PARTIAL | useFlyerEditor manages state | Not verified in screen |
| Empty state | PARTIAL | FlyerBuilderShell likely handles | Unverified |
| Error state | PARTIAL | Controller throws; screen handling unclear | — |
| Auth/owner gates | PASS | actorId scoped + designStudio auth | — |
| Cache behavior | UNKNOWN | Not documented | — |
| Runtime dependencies | PARTIAL | designStudio dependencies + storage | — |
| Hot paths | PARTIAL | flyerEditor save + designStudio canvas writes | KRAVEN |

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
| BEHAVIOR.md | HIGH | Flyer editor vs designStudio flows undocumented | LOGAN |
| Route confirmation | MEDIUM | Routes not in route-map scan output | HAWKEYE |
| Cache/runtime docs | MEDIUM | Editor hot path undocumented | LOKI |
| design_* schema ownership (via designStudio) | MEDIUM | Schema=None in write-surface-map | CARNAGE |
| Adapter exposure | MEDIUM | No flyerBuilder adapter | IRONMAN |
| Native parity | LOW | QR printable + canvas are complex for iOS | Falcon |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Add BEHAVIOR.md | Flyer vs designStudio flows undocumented | LOGAN |
| P2 | Confirm routes in route-map | Scanner did not surface flyer routes | HAWKEYE |
| P2 | Document cache/runtime | Editor hot path undocumented | LOKI |
| P2 | Add flyerBuilder adapter | No exported boundary for cross-feature use | IRONMAN |
| P3 | Native parity notes | Canvas + QR are complex for iOS | Falcon |

## RECOMMENDED HANDOFFS: LOGAN, HAWKEYE, LOKI, IRONMAN, CARNAGE
