# Hydration Engine — Ownership Record

_Domain:_ `engine`
_Engine:_ `hydration`
_Filename:_ `engine.hydration.owner.md`
_Created:_ 2026-05-11
_Trigger:_ Engine contract adapter violation audit — Cerebro decision gate

---

## 1. Purpose

The hydration engine provides shared actor-data resolution for all VCSM app surfaces. It owns:

- bulk actor summary fetching from the database (`getActorSummariesByIdsDAL`)
- actor store hydration via Zustand (`hydrateActorsByIds`, `hydrateActorsFromRows`)
- app-specific actor identity resolution via dependency injection (`hydrateActor`)
- normalization of raw DB rows into camelCase actor summary shapes
- extraction utilities for actor ID batching

The engine is consumed by `apps/VCSM` only. `apps/wentrex` maintains its own independent actor data access layer and does NOT consume this engine.

---

## 2. Application Scope

ENGINE (consumed by VCSM only — Wentrex is confirmed independent)

---

## 3. Code Roots

```
engines/hydration/
  index.js                          ← Public adapter (entry point)
  src/
    config.js                       ← DI registry (configureHydrationEngine, getHydrator)
    store.js                        ← Zustand actor store (useActorStore)
    hydrate.js                      ← Hydration pipeline (hydrateActorsByIds, hydrateActorsFromRows, hydrateAndReturnSummaries)
    dal.js                          ← DB access (getActorSummariesByIdsDAL)
    normalize.js                    ← Row normalization (normalizeActorSummary, normalizeActorSummaries)
    extract.js                      ← ID extraction utility (extractActorIdsForHydration)
    useActorSummary.js              ← Consumer hook
    controller/
      hydrateActor.controller.js    ← DI resolver (hydrateActor)
```

---

## 4. Core Layers

**DAL:** `src/dal.js` — `getActorSummariesByIdsDAL({ actorIds })` — bulk actor fetch from Supabase
**Model:** `src/normalize.js` — `normalizeActorSummary`, `normalizeActorSummaries` — row → domain shape
**Controller:** `src/controller/hydrateActor.controller.js` — `hydrateActor({ actorId, actorSource, appKey })` — DI resolver
**Service:** `src/hydrate.js` — `hydrateActorsByIds`, `hydrateActorsFromRows`, `hydrateAndReturnSummaries` — hydration pipeline
**Config:** `src/config.js` — `configureHydrationEngine`, `getHydrator`, `getHydrationConfig`, `getSupabaseClient`
**Store:** `src/store.js` — Zustand actor store, 5min TTL
**Hook:** `src/useActorSummary.js` — `useActorSummary(actorId)` — React consumer hook
**Utility:** `src/extract.js` — `extractActorIdsForHydration(rows)`

---

## 5. Engines Used

None — this IS an engine. It depends only on Supabase (via injected client) and Zustand (shared primitive).

---

## 6. Database / Schema Ownership

**Tables read:** `vc.actors` (actor summaries) — via `getActorSummariesByIdsDAL`
**Tables written:** None
**Views:** None
**RPCs:** None — queries `vc.actors` directly
**RLS policies:** Supabase managed — engine does not own RLS
**Migration owner:** CARNAGE (if schema changes to `vc.actors`)

---

## 7. Rule Ownership

**Actor ownership:** Not applicable — engine does not verify ownership, only fetches summaries
**Lifecycle:** Engine manages Zustand store TTL (5min) for actor summaries
**Authorization:** None — engine is read-only, no auth enforcement
**Native parity:** Indirect — consumers (booking, chat) are native-relevant

---

## 8. Contracts Touched

- `ENGINE_CONTRACT.md` — this engine's adapter contract compliance is the primary subject of this ownership record
- `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — engine must not import apps; apps must use adapter
- `ARCHITECTURE.md` (VCSM) — apps may import from `@hydration`; engine functions may not be called from DAL layer

---

## 9. Documentation Links

**Logan docs:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.actors.md` — actors DAL doc references hydration engine
**Engine audits:** `engines/hydration/docs/` — check for latest `HYDRATION_ENGINE_AUDIT_VN.md`
**Ownership audit:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-11_ironman_engine-hydration-adapter-violation.md`

---

## 10. Runtime Ownership

**Entry points (VCSM consumers):**
- `apps/VCSM/src/state/identity/identity.controller.js` — `hydrateActor` (identity resolution — CRITICAL PATH)
- `apps/VCSM/src/features/booking/controller/listMyBookings.controller.js` — `getActorSummariesByIdsDAL` (booking actor lookup)
- `apps/VCSM/src/features/chat/setup.js` — `hydrateAndReturnSummaries` (chat DI injection)
- 42 VCSM files total import from `@hydration` (primarily `hydrateActorsByIds`, `hydrateActorsFromRows`, `useActorSummary`)

**Hot paths:**
- Identity resolution on login / actor switch (uses `hydrateActor`)
- Feed hydration (uses `hydrateActorsByIds`)
- Booking actor lookup (uses `getActorSummariesByIdsDAL` — ONLY active caller of the violating export)

**Known engine contract violations (see §15 Open Ownership Questions):**
- `index.js` exports `getActorSummariesByIdsDAL` — DAL exported from adapter (violation)
- `index.js` exports `hydrateActor` from `controller/` file — controller-origin function exported from adapter (borderline — see §15)

---

## 11. Responsibilities

- Own the canonical actor summary fetch path (`getActorSummariesByIdsDAL` → `vc.actors`)
- Own the Zustand actor store and its TTL lifecycle
- Own the DI-based app-specific actor hydration resolver (`hydrateActor`)
- Provide stable public API for all VCSM actor hydration consumers
- Remain app-agnostic — no VCSM or Wentrex business logic inside engine

---

## 12. Boundaries

- Must never import from `apps/VCSM` or `apps/wentrex`
- Must not contain routing, page layouts, or app-specific UI
- Must not own booking authorization, moderation, or review logic
- Must not expose DAL functions by name in the public adapter (`getActorSummariesByIdsDAL` must be wrapped)
- Must not expose controller files directly in the public adapter (unless re-classified as public functions)

---

## 13. Change Impact Rules

If `engines/hydration/index.js` changes:
- All 42 VCSM `@hydration` import sites must be checked
- `apps/VCSM/src/features/booking/controller/listMyBookings.controller.js` must be updated if `getActorSummariesByIdsDAL` is renamed
- `apps/VCSM/src/state/identity/identity.controller.js` must be checked if `hydrateActor` is moved or renamed
- A new engine audit version (`HYDRATION_ENGINE_AUDIT_VN.md`) must be created
- Logan actors DAL doc §9 Rule 1 must be updated to reference any new public function name

If `src/dal.js` changes:
- `listMyBookings.controller.js` is the only direct consumer in VCSM
- Wentrex is NOT affected — it has its own independent DAL

---

## 14. Release Gate Notes

- `hydrateActor` is on the IDENTITY CRITICAL PATH — any change to this export signature is a HIGH-severity release risk
- `getActorSummariesByIdsDAL` rename is LOW-risk — one active consumer (`listMyBookings.controller.js`)
- Engine contract violation (DAL export) is a governance finding, not a runtime failure — does not block current release but must be resolved before next engine audit

---

## 15. Open Ownership Questions

### OQ-1 — `getActorSummariesByIdsDAL` export name

**Status:** VIOLATION — engine contract forbids exporting DAL functions
**Active consumers:** 1 (`listMyBookings.controller.js`)
**Decision:** Wrap behind `fetchActorSummaries({ actorIds })` in `index.js`. Remove `getActorSummariesByIdsDAL` from public index. The underlying `src/dal.js` implementation is unchanged.
**Migration:** `listMyBookings.controller.js` updates import from `getActorSummariesByIdsDAL` to `fetchActorSummaries`.
**Pending:** Wolverine execution under ENGINE scope approval.

### OQ-2 — `hydrateActor` export from `controller/` file

**Status:** BORDERLINE — function originates from `src/controller/hydrateActor.controller.js`, which the engine contract says adapters must not export. However, `hydrateActor` is the engine's primary DI resolver — it IS a public function by nature, not a business-logic controller.
**Active consumers:** 1 (`apps/VCSM/src/state/identity/identity.controller.js`) — CRITICAL PATH
**Decision:** Keep export. Move `hydrateActor.controller.js` to `src/adapters/hydrateActor.js` to align the internal file location with its public nature, OR add an explicit adapter re-export wrapper. The public name `hydrateActor` is correct and should not change.
**Risk:** HIGH if renamed — identity resolution path would break.
**Pending:** File relocation is ENGINE scope — requires Wolverine + explicit scope approval.

### OQ-3 — `normalizeActorSummary` / `normalizeActorSummaries` exports

**Status:** BORDERLINE — exported from `src/normalize.js`. Engine contract says adapters must not export models. These are normalization utilities.
**Active VCSM app consumers:** NONE found via grep — these exports appear unused from the app layer.
**Decision:** Remove from public index. If any consumer is discovered post-removal, add back as a named utility export with documentation.
**Risk:** LOW — no confirmed callers.
**Pending:** Verify with grep before removal. Remove in same Wolverine pass as OQ-1.

### OQ-4 — `extractActorIdsForHydration` export

**Status:** BORDERLINE — model utility function. Currently only accessed via the actors feature shim (pending deletion per IRONMAN-F-02).
**Active VCSM app consumers:** 0 (shim has zero callers; shim is being deleted)
**Decision:** Remove from public index after shim deletion is confirmed.
**Risk:** LOW — no confirmed callers.
**Pending:** Confirm shim deletion then remove from public index in same Wolverine pass.

---

## 16. Wentrex Isolation Confirmation

**Status: CONFIRMED ISOLATED**

Wentrex does NOT import from `@hydration`. Wentrex has its own independent implementation:
- `apps/wentrex/src/features/actors/dal/getActorSummariesByIds.dal.js` — queries `learning.actor_profiles` table directly
- `apps/wentrex/src/features/communication/setup.js` — injects this local implementation into the chat engine

The hydration engine fix scope is **VCSM + ENGINE only**. Wentrex requires no changes.

---
