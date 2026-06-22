# MODULE ARCHITECTURE REPORT

**Module:** wanderex
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Public Booking Directory & Lead Flow
**Primary Root:** `apps/VCSM/src/features/wanderex/`
**Independence Status:** DEPENDENT
**Completeness Status:** INCOMPLETE

---

## PURPOSE

Wanderex is a public-facing booking directory and lead capture flow. It provides: a directory of bookable VPORTs, individual VPORT profile pages (public), a multi-step booking flow (service selection → date/time → confirmation), and a submission flow. It is accessed without authentication and is a separate public acquisition surface from the main app.

---

## ENTRY POINTS

- `/x` → `WanderExHome.screen.jsx`
- `/x/directory` → `WanderExDirectory.screen.jsx`
- `/x/:slug` → `WanderExProfile.screen.jsx`
- `/x/:slug/book` → `WanderExBook.screen.jsx`

---

## LAYER MAP

**DAL:**
- `wanderexPublic.read.dal.js` — public VPORT data reads
- `wanderexPublicHelpers.read.dal.js` — helpers for public reads

**Model:**
- `wanderexAvailability.model.js` — availability slot computation
- `wanderexPublic.model.js` — public VPORT data shape

**Controller:** NONE — **MISSING CONTROLLER LAYER**

**Hook:**
- `useWanderExAnalytics.js`
- `useWanderExBookingFlow.js` — booking step machine (references model + DAL directly)
- `useWanderExBookingFlow.helpers.js` — helpers (not a hook — naming violation)
- `useWanderExBookingSubmit.js`
- `useWanderExDirectory.js`
- `useWanderExProfile.js`
- `useWanderExSeo.js`
- `useWanderExSubmit.js`

**Screen:**
- `WanderExBook.screen.jsx`
- `WanderExBookingSteps.jsx` (component inside screens/)
- `WanderExDirectory.screen.jsx`
- `WanderExHome.screen.jsx`
- `WanderExProfile.screen.jsx`
- `wanderexProfileScreen.model.js` (MODEL IN SCREENS FOLDER — layer violation)

**Components:**
- `WanderExBookingLaneCalendar.jsx`
- `WanderExHeroCard.jsx`
- `WanderExLeadActionModal.jsx`
- `WanderExTopNav.jsx`

**Adapter:** NONE — **MISSING ADAPTER**

**Store:** None
**Engine Consumers:** booking engine data (hooks pull availability via DAL directly)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Public booking directory clear | — |
| Owner defined | FAIL | No IRONMAN record, no clear ownership | — |
| Entry points mapped | PASS | 4 screens routed | — |
| Controllers present/delegated | FAIL | No controllers exist | Hooks access DAL directly |
| DAL/repository present/delegated | PARTIAL | 2 DAL files | No write DAL for booking submission |
| Models/transformers present | PARTIAL | 2 models, 1 in wrong folder | wanderexProfileScreen.model.js in screens/ |
| Hooks/view models present | PARTIAL | 8 hooks — some contain business logic | Business logic in hooks = violation |
| Screens/components present | PASS | 4 screens + 4 components | — |
| Services/adapters present | FAIL | No adapter | Cannot be safely imported by other features |
| Database objects mapped | FAIL | Not documented | — |
| Authorization path mapped | FAIL | Public — no auth, but no RLS assumption docs | — |
| Cache/runtime behavior mapped | FAIL | Not documented | — |
| Error/loading/empty states mapped | FAIL | Not confirmed | — |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | FAIL | Availability data accessed via DAL — no engine boundary | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `booking` feature | feature | wanderex → booking | NO — bypasses | Wanderex has own availability model |
| vport schema | database | wanderex reads | YES | Public VPORT data |
| booking tables | database | wanderex reads | PARTIAL | Availability data via custom DAL |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Public VPORT directory | read | wanderex | WanderExDirectory | Unauthenticated — RLS must protect |
| Public VPORT profile | read | wanderex | WanderExProfile | — |
| Availability calendar | derived | wanderex (own model) | WanderExBook | Duplicates booking engine logic |
| Booking submission | write | wanderex? | WanderExBook | CRITICAL: who owns the write? |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| No controller layer | Hooks call DAL directly | CRITICAL — architecture violation | SENTRY |
| Business logic in hooks | useWanderExBookingFlow contains multi-step state machine | HIGH | SENTRY |
| `wanderexProfileScreen.model.js` in screens/ | Model in screen folder | HIGH — layer violation | SENTRY |
| Duplicate availability model | `wanderexAvailability.model.js` duplicates booking engine | HIGH | IRONMAN |
| `useWanderExBookingFlow.helpers.js` not a hook | Helper file named like a hook | MEDIUM | LOGAN |
| No adapter | Module has no public boundary | HIGH | IRONMAN |
| `useWanderExSubmit.js` vs `useWanderExBookingSubmit.js` | Two submit hooks — overlap | HIGH | IRONMAN |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Controller layer | CRITICAL | Hooks access DAL directly = architecture violation | SENTRY |
| Adapter | CRITICAL | No public boundary defined | IRONMAN |
| Booking submission ownership | CRITICAL | Who owns the write? wanderex, booking, or dashboard? | IRONMAN |
| RLS documentation for public reads | HIGH | Unauthenticated surface — security critical | VENOM |
| Consolidate duplicate availability model | HIGH | wanderex duplicates booking engine availability logic | SENTRY |
| Logan documentation | HIGH | No canonical wanderex architecture | LOGAN |
| Remove model from screens/ | HIGH | Layer violation | SENTRY |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: `features/wanderex/hooks/useWanderExBookingFlow.js`
Module: wanderex
Current dependency: Hook imports directly from DAL + model (bypasses controller layer)
Expected boundary: Hook → Controller → DAL
Risk: CRITICAL — business logic scattered into hook
Suggested correction: Extract booking flow logic into controller(s)

**MODULE BOUNDARY WARNING**
Location: `features/wanderex/screens/wanderexProfileScreen.model.js`
Module: wanderex
Current dependency: Model inside screens/ folder
Expected boundary: Models in `model/` folder
Risk: HIGH
Suggested correction: Move to `model/wanderexProfile.model.js`

---

## FINAL MODULE STATUS: INCOMPLETE

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: missing controller layer, DAL-in-hook, model in screens)
- IRONMAN (ownership: booking submission, adapter creation, submit hook consolidation)
- VENOM (security: unauthenticated public reads RLS)
- LOGAN (documentation, naming violations)
- CARNAGE (schema: which tables wanderex reads/writes)
