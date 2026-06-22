# SENTRY COMPLIANCE REPORT

**Date:** 2026-05-27
**Time:** 02:50
**Reviewer:** SENTRY
**Trigger:** Post-execution review — VPORT Exchange Rate Dashboard P1 fixes
**Application Scope:** VCSM

---

## Context

Post-execution review of two files changed during the ARCHITECT-identified P1 fixes for the VPORT Money Exchange dashboard exchange rate module.

Changes reviewed:
1. `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js`
   — Added `invalidateRatesCache()` import and call after successful upsert
2. `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx`
   — Removed duplicate `mapRawRateRowToDomain` (15 lines)
   — Added `mapVportRateRow` import from model layer
   — Fixed `actorId:null` persisted-rate swap

Architecture contract: `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
Boundary contract: `zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

## BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|:---:|:---:|:---:|---|
| apps/VCSM | YES | YES | NO | All changes stayed inside VCSM |
| apps/wentrex | NO | NO | NO | Not touched |
| apps/Traffic | NO | NO | NO | Not touched |
| engines | NO | NO | NO | Not touched |

---

## ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| Controller layer responsibility | ALIGNED | NONE | Ownership check → write → cache invalidation — correct sequencing |
| Cache invalidation placement | ALIGNED | NONE | Called post-success in controller, not in DAL body — acceptable pattern |
| Model function import in screen | MINOR DRIFT | MINOR DRIFT | `mapVportRateRow` imported directly from `profiles/kinds/` internals, bypassing adapter boundary |
| Cross-feature hook import (pre-existing) | MINOR DRIFT | MINOR DRIFT | `usePublishExchangeRatePost` was already imported directly — pre-existing, not introduced by this change |
| Duplicate model function removal | ALIGNED | NONE | Removal of `mapRawRateRowToDomain` is a correct improvement |
| actorId fix | ALIGNED | NONE | Spread `actorId` from screen context correctly fixes null — no schema change needed |
| Actor ownership enforcement | ALIGNED | NONE | `assertActorOwnsVportActorController` still fires before write, unchanged |
| Screen line count | ALIGNED | NONE | 263 lines — within 300-line limit |

---

## ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| Write path: identityActorId → assertActorOwnsVportActor → write | ALIGNED | NONE | Ownership enforced before write, unchanged by this fix |
| UI gate: isOwner from useVportOwnership | ALIGNED | NONE | Advisory UI gate — correct defense-in-depth pattern |
| actorId in optimistic state | ALIGNED | NONE | actorId comes from screen's useParams() + useIdentity() — not trusted from DB row |

---

## IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| actorId in domain rate object | ALIGNED | LOW | actorId is the approved public field; fix correctly injects it from context, not from DB row |
| profileId | ALIGNED | NONE | Stays internal to DAL/resolveVportProfileId — never surfaced to screen or component |
| mapVportRateRow output | ALIGNED | NONE | Returns: id, actorId, rateType, baseCurrency, quoteCurrency, buyRate, sellRate, meta, updatedAt, createdAt — no internal IDs exposed |

---

## ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| No engine changes | N/A | NONE | Neither file touches engines |

---

## NATIVE PARITY STATUS

| Native Area | Status | Drift | Notes |
|---|---|---|---|
| Not in scope | N/A | N/A | No native parity implications for this fix |

---

## SENTRY FINDINGS

---

### SENTRY FINDING — SF-001

- **Finding ID:** SF-001
- **Location:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx` line 19
- **Drift Level:** MINOR DRIFT
- **Severity:** LOW
- **Contract Violated:** Architecture Contract §5.2 Cross-Feature Boundary Rule, §5.4 Adapter Import Rule
- **Current behavior:**
  ```js
  import { mapVportRateRow } from "@/features/profiles/kinds/vport/model/rates/vportRates.model.js";
  ```
  Direct import from `features/profiles` internals into `features/dashboard` screen. No adapter wraps this model function for cross-feature use.
- **Expected behavior:**
  `mapVportRateRow` should be re-exported through `features/profiles/adapters/kinds/vport/` so the dashboard screen accesses it via the approved adapter boundary.
  ```js
  // Expected adapter file (does not exist yet):
  // features/profiles/adapters/kinds/vport/model/rates/vportRates.model.adapter.js
  export { mapVportRateRow } from "@/features/profiles/kinds/vport/model/rates/vportRates.model.js";

  // Screen import would then be:
  import { mapVportRateRow } from "@/features/profiles/adapters/kinds/vport/model/rates/vportRates.model.adapter";
  ```
- **Risk:** LOW — `mapVportRateRow` is a pure transform with no side effects, no auth, no DB access. The functional correctness of the fix is not compromised. The risk is solely architectural boundary erosion if the pattern propagates.
- **Recommended correction:** Create a model adapter re-export at `features/profiles/adapters/kinds/vport/model/rates/vportRates.model.adapter.js` and update the screen import. Priority: P3 (cleanup — not blocking).
- **Architectural rationale:** Architecture contract §5.4 states "Final Screens and View Screens must never import another feature's internal files." The adapter boundary exists so that features can refactor their internals without breaking consumers. This direct import couples the dashboard screen to the profiles model path.

---

### SENTRY FINDING — SF-002 (PRE-EXISTING, not introduced by this change)

- **Finding ID:** SF-002
- **Location:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx` line 18
- **Drift Level:** MINOR DRIFT
- **Severity:** LOW
- **Contract Violated:** Architecture Contract §5.2 Cross-Feature Boundary Rule
- **Current behavior:**
  ```js
  import { usePublishExchangeRatePost } from "@/features/profiles/kinds/vport/hooks/exchange/usePublishExchangeRatePost";
  ```
  Direct import of a hook from `features/profiles` internals. Pre-existing before this task.
- **Expected behavior:**
  Hook should be accessed via adapter at `features/profiles/adapters/kinds/vport/hooks/exchange/usePublishExchangeRatePost.adapter.js`.
- **Risk:** LOW — hook is scoped to `actorId` from screen context, no ownership bypass risk.
- **Recommended correction:** Create adapter wrapper alongside SF-001 fix.
- **Architectural rationale:** Same §5.4 rule as SF-001. Both direct imports should be wrapped together in one adapter pass.
- **Note:** SF-002 was **not introduced** by this task. Recorded here for completeness and to prevent the pattern from being treated as intentional precedent.

---

## FINAL SENTRY STATUS: **MINOR DRIFT**

Both findings are LOW severity, non-blocking, and relate to cross-feature adapter wrapping rather than ownership, security, or data exposure. The functional fixes are architecturally correct.

---

## FOLLOW-UP REQUIRED: **OPTIONAL**

| Finding | Priority | Action |
|---|---|---|
| SF-001 | P3 | Create `vportRates.model.adapter.js`, update screen import |
| SF-002 | P3 | Create `usePublishExchangeRatePost.adapter.js`, update screen import |

These two adapter files can be created in a single cleanup pass. Neither finding blocks release. Both should be resolved before the next architectural review of this module.

---

## SENTRY SIGN-OFF

| Reviewed File | Layer | Ownership Check | Cache Correctness | Identity Surface | Boundary | Final |
|---|---|---|---|---|---|---|
| `upsertVportRate.controller.js` | Controller | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ALIGNED |
| `VportDashboardExchangeScreen.jsx` | Screen (View) | ✅ PASS | ✅ PASS | ✅ PASS | ⚠️ SF-001 direct import | MINOR DRIFT |
