# ARCHITECTURE — Dashboard Module: qrcode

**Last ARCHITECT Run:** 2026-06-05 (V2 — full source verification)
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: qrcode
Application Scope: VCSM
Module Type: dashboard top-level module
Primary Root: apps/VCSM/src/features/dashboard/qrcode/
Independence Status: INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Provides QR code generation and flyer display components for VPORT marketing collateral. The module adapts a QR library via `qrcode.adapter.js` and exposes two flyer styles (ClassicFlyer, PosterFlyer) plus a base QrCard and QrCode component. No write path — read-only/derived module that generates visual QR representations from VPORT identity data. Consumed by flyerBuilder and other dashboard views.

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: NONE — display/generation module only
Ownership enforcement: N/A — no writes

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- No independent route — components consumed by flyerBuilder and dashboard views
- Exported via: `index.js`

---

## LAYER MAP

DAL: NONE [SOURCE_VERIFIED]
Model: NONE [SOURCE_VERIFIED]
Controller: NONE [SOURCE_VERIFIED]
Hook: NONE [SOURCE_VERIFIED]

Adapter:
- `adapters/qrcode.adapter.js` — PUBLIC BARREL / re-export adapter (not the library wrapper) [SOURCE_VERIFIED]
  Exports: QrCode, QrCard, ClassicFlyer, PosterFlyer — all cross-feature imports must route through this file
  NOTE: react-qr-code is wrapped directly in QrCode.jsx, not in the adapter

Component:
- `components/QrCard.jsx` [SOURCE_VERIFIED]
- `components/QrCode.jsx` [SOURCE_VERIFIED]
- `components/flyer/ClassicFlyer.jsx` [SOURCE_VERIFIED]
- `components/flyer/ClassicFlyer.styles.js` [SOURCE_VERIFIED]
- `components/flyer/PosterFlyer.jsx` [SOURCE_VERIFIED]
- `components/flyer/posterFlyer.styles.js` [SOURCE_VERIFIED]

Screen: NONE [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | QR generation + flyer templates | — |
| Owner defined | PASS | VCSM:dashboard | — |
| Entry points mapped | PASS | Consumed as library — no route needed | — |
| Controllers present/delegated | PASS | N/A — display-only module | — |
| DAL/repository present/delegated | PASS | N/A — no DB access | — |
| Models/transformers present | PARTIAL | No model; adapter defines shape | — |
| Hooks/view models present | PASS | N/A — component library module | — |
| Screens/components present | PASS | 6 components (QrCard, QrCode, 2 flyers, 2 styles) | — |
| Services/adapters present | PASS | qrcode.adapter.js | — |
| Database objects mapped | PASS | N/A — no database access | — |
| Authorization path mapped | PASS | N/A — no auth needed (display only) | — |
| Cache/runtime behavior mapped | PARTIAL | QR generation is synchronous/derived | — |
| Error/loading/empty states mapped | PASS | Empty guard confirmed: `if (!v.trim()) return null` in QrCode.jsx AND QrCard.jsx [SOURCE_VERIFIED] | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | PARTIAL | qrcode.spiderman.test.js | — |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | PASS | N/A — no engine dependency | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| react-qr-code (external) | external API | QrCode.jsx → react-qr-code | YES — dependency declared in package.json | Direct import in QrCode.jsx (qrcode.adapter is barrel, not wrapper) |
| flyerBuilder | feature | flyerBuilder → qrcode | YES — import from qrcode public barrel | Consumer |
| dashboard views | feature | multiple → qrcode | YES — import from qrcode public barrel | Consumer |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| QR code value | derived | caller-provided | QrCode component | Input validation needed |
| VPORT display data | derived | caller-provided | ClassicFlyer, PosterFlyer | Props from parent |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | Component library | — |
| Loading state | PARTIAL | QR generation synchronous | — |
| Empty state | PARTIAL | Empty QR value handling unclear | — |
| Error state | PARTIAL | Adapter error handling undocumented | — |
| Auth/owner gates | N/A | No auth needed | — |
| Cache behavior | N/A | Display module | — |
| Runtime dependencies | PASS | Only external QR library via adapter | — |
| Hot paths | LOW | QR generation is cheap | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | N/A — no write path | N/A |
| Runtime audit | N/A | N/A |
| Performance audit | N/A | N/A |
| Migration audit | N/A | N/A |
| Native transfer audit | — | MISSING |
| Engine audit | N/A | N/A |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md | MEDIUM | QR generation behavior undocumented | LOGAN |
| Adapter clarification doc | LOW | qrcode.adapter.js is a barrel, not a library wrapper — the distinction should be documented | LOGAN |
| Native parity | LOW | QR rendering may differ on iOS | Falcon |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P2 | Add BEHAVIOR.md | QR generation undocumented | LOGAN |
| P2 | Document QR value validation | Input validation unclear | IRONMAN |
| P3 | Native parity notes | iOS QR rendering | Falcon |

## RECOMMENDED HANDOFFS: LOGAN, IRONMAN
