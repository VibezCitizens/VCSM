# CONTRACT REVIEW REPORT

**Target:** VCSM:explore
**Application Scope:** apps/VCSM/src/features/explore
**Date:** 2026-06-05
**Ticket:** TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001
**Reviewer:** CONTRACT REVIEWER (Blue Team)

---

## Contracts Reviewed

- Architecture contract: `ZZnotforproduction/CONTRACTS/Architecture/ARCHITECTURE.md`
- Platform contract: `ZZnotforproduction/CONTRACTS/Platform/platformcontract.md`
- Engine contract: `ZZnotforproduction/CONTRACTS/ENGINE/enginecontract.md`
- App-level CLAUDE.md: `apps/VCSM/CLAUDE.md`
- ARCHITECT V2 report: `ZZnotforproduction/APPS/VCSM/features/explore/ARCHITECTURE.md`

---

## Files Reviewed

| File | Layer | Lines |
|---|---|---|
| `dal/search.dal.js` | DAL | 148 |
| `model/search.model.js` | Model | 235 |
| `controller/searchResults.controller.js` | Controller | 53 |
| `controller/searchTabs.controller.js` | Controller | 13 |
| `usecases/search.usecase.js` | Controller (misplaced) | 18 |
| `hooks/useSearchScreenController.js` | Hook | 145 |
| `screens/ExploreScreen.jsx` | Screen | — |
| `ui/SearchScreen.view.jsx` | View | — |
| `ui/PostCard.jsx` | Component | — |
| `ui/ActorSearchResultRow.jsx` | Component | — |
| `ui/FeaturedResultCard.jsx` | Component | — |
| `ui/ResultList.jsx` | Component | — |
| `ui/index.jsx` | Barrel | — |

---

## Critical Violations

**None.**

---

## High Violations

### RC-EXPLORE-H001 | HIGH | Layer Responsibility — DAL calls Model transform

**File:** `apps/VCSM/src/features/explore/dal/search.dal.js`
**Lines:** 2, 32

**Evidence:**
```
line 2:  import { normalizeActorRow } from '@/features/explore/model/search.model'
line 32: .map(normalizeActorRow)
```

**Contract violated:** Layer responsibility rule — DAL must return raw DB data. Models must be pure. The DAL layer is importing and invoking a Model-layer transformation function (`normalizeActorRow`).

**Impact:** The DAL is performing data normalization that belongs in the Model or Controller layer. This creates two problems:
1. Layer coupling: DAL now depends on Model — if normalizeActorRow signature changes, DAL breaks.
2. Double normalization: `ctrlSearchResults` calls `normalizeResult` on already-normalized DAL output, causing data loss (actorKind, avatarUrl, bannerUrl, bio, rank are stripped by the second pass — confirmed by LOKI). The double normalization is a direct consequence of normalization being in the wrong layer.

**Correct pattern:** `searchActors` DAL function should return raw Supabase rows. `ctrlSearchResults` or Model should call `normalizeActorRow` once on the raw rows.

---

### RC-EXPLORE-H002 | HIGH | Misplaced controller + wrong file naming (`usecases/search.usecase.js`)

**File:** `apps/VCSM/src/features/explore/usecases/search.usecase.js`
**Lines:** 1–18

**Evidence:**
```
3: import { searchDal } from '../dal/search.dal'
4: import { normalizeResult, dedupeByKindAndId } from '../model/search.model'
```

**Contracts violated:**
1. **File naming convention:** `.usecase.js` is not a recognized VCSM file extension. Controller-layer files must use `.controller.js`.
2. **Folder convention:** `usecases/` is not a defined layer folder. Valid folders are: `dal/`, `model/`, `controller/`, `hooks/`, `ui/`, `screens/`.
3. **Single responsibility:** `searchUsecase` duplicates `ctrlSearchTabs` logic (both dispatch to `searchDal` and normalize). Two controllers do the same job — one is dead code.
4. **Relative imports:** Uses `../dal/search.dal` and `../model/search.model` — all intra-feature imports must use `@/features/explore/` alias.

**Impact:** Dead code confirmed by ARCHITECT (not imported by any active render tree path). Risk: if reactivated, it bypasses the security fixes in `ctrlSearchResults` (viewerActorId injection, actorId cache scoping).

**Correct pattern:** Delete `usecases/search.usecase.js` (dead code). If retained for future use, rename to `controller/searchExploreUsecase.controller.js` and replace relative imports with `@/` aliases.

---

## Medium Violations

### RC-EXPLORE-M001 | MEDIUM | Cross-feature CSS import bypasses adapter boundary

**File:** `apps/VCSM/src/features/explore/screens/ExploreScreen.jsx`
**Line:** 4

**Evidence:**
```
line 4: import '@/features/ui/modern/module-modern.css'
```

**Contract violated:** Cross-feature boundary rule — features may only import other features through adapters. Adapters must not export DAL, models, or controllers (CSS is not logic, but the boundary principle still applies). `features/ui/` is a separate feature whose internal paths must not be imported directly.

**Impact:** Style coupling between explore and features/ui. If `module-modern.css` is moved or renamed, ExploreScreen breaks without any adapter contract protecting it.

**Correct pattern:** If this CSS is platform-wide, it belongs in `shared/` or is loaded globally (e.g., in the app root). If explore-specific, it should be in `@/features/explore/styles/`.

---

### RC-EXPLORE-M002 | MEDIUM | Relative import in screen layer

**File:** `apps/VCSM/src/features/explore/screens/ExploreScreen.jsx`
**Line:** 3

**Evidence:**
```
line 3: import SearchScreen from '../ui/SearchScreen.view'
```

**Contract violated:** Import path rule — all cross-folder imports must use `@/` path aliases, not relative `../` paths.

**Correct pattern:** `import SearchScreen from '@/features/explore/ui/SearchScreen.view'`

---

### RC-EXPLORE-M003 | MEDIUM | Relative imports in misplaced usecase file

**File:** `apps/VCSM/src/features/explore/usecases/search.usecase.js`
**Lines:** 3–4

**Evidence:**
```
line 3: import { searchDal } from '../dal/search.dal'
line 4: import { normalizeResult, dedupeByKindAndId } from '../model/search.model'
```

**Contract violated:** Import path rule — all intra-feature imports must use `@/` aliases.
(Also noted in RC-EXPLORE-H002 — counted once for severity, listed here as a distinct compliance item.)

---

### RC-EXPLORE-M004 | MEDIUM | Adapter boundary — no formal adapter file

**Context:** `hooks/useSearchActor.js` functions as an informal cross-feature adapter shim (re-exports `useSearchScreenController`). No `.adapter.js` file exists in the explore feature root.

**Contract violated:** Adapter rule — cross-feature capabilities must be exposed through a formally named `*.adapter.js` file. Adapters never export DAL functions, models, or controllers — re-exporting a hook is permitted, but the file must be formally named.

**Evidence:**
- ARCHITECT V2: "No dedicated adapter file detected; useSearchActor.js is a 3-line shim"
- `useSearchActor.js` is imported directly by cross-feature consumers without an adapter contract

**Correct pattern:** Create `hooks/explore.adapter.js` that re-exports only the public hook surface. Rename `useSearchActor.js` to follow this convention or merge into the adapter file.

---

## Low Violations / Warnings

### RC-EXPLORE-W001 | LOW | Dead code modules not removed

**Files:**
- `ui/FilterTabs.jsx` — ARCHITECT confirmed: not imported anywhere
- `ui/CitizensRow.jsx` — ARCHITECT confirmed: behind hardcoded `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` flag — unreachable at runtime
- `ui/VportsRow.jsx` — same as CitizensRow
- `controller/searchTabs.controller.js` — not imported by active render tree
- `hooks/useSearchTabsActor.js` — not imported by SearchScreen.view.jsx

**Warning:** Dead code increases maintenance surface, creates confusion about what is active, and (for ctrlSearchTabs/useSearchTabsActor) represents bypass paths around security fixes if reactivated. File count is not a VCSM contract violation on its own, but dead modules that duplicate active-path security logic are a governance risk.

**Recommendation:** Delete all confirmed dead modules. ARCHITECT-confirmed dead = safe to remove.

---

## Contract Compliance Matrix

| Rule | Status | Finding |
|---|---|---|
| `@/` imports only — no `../` | PARTIAL | RC-EXPLORE-M002, RC-EXPLORE-M003 — 3 relative imports |
| Module build order (DAL→Model→Controller→Hook→Component) | PARTIAL | RC-EXPLORE-H001 — DAL imports from Model (build order coupling violation) |
| DAL must not enforce permissions | PASS | No permission checks in DAL |
| Models must be pure | PASS | model/search.model.js is pure (no side effects, no DB calls) |
| Controllers own business logic | WATCH | usecases/search.usecase.js misplaced — RC-EXPLORE-H002 |
| Hooks orchestrate data for components | PASS | useSearchScreenController orchestrates correctly |
| Components must remain UI-focused | PASS | No business logic in components |
| File size limit (300 lines) | PASS | All files within limit (largest: model 235 lines) |
| Single responsibility | PARTIAL | searchUsecase duplicates ctrlSearchTabs — RC-EXPLORE-H002 |
| Controller fan-out (max 5) | PASS | ctrlSearchResults: 4 external collaborators (searchDal, normalizeResult, dedupeByKindAndId, hydrateActorsByIds) |
| File naming conventions | PARTIAL | `.usecase.js` not a valid convention — RC-EXPLORE-H002 |
| Folder depth (max 3 below feature root) | PASS | Deepest: `ui/features/` = 2 levels |
| Cross-feature boundary via adapter | PARTIAL | RC-EXPLORE-M001 (CSS), RC-EXPLORE-M004 (no .adapter.js) |
| Dependency direction (app→engine→shared) | PASS | explore → hydration engine via approved import |
| Engine communication via adapter/domain events | PASS | hydrateActorsByIds imported correctly; identity RPC via DAL |
| Identity surface (actorId + kind, never profileId/vportId) | PASS | explore uses actorId correctly; no profileId or vportId references |
| Adapter must not export DAL/model/controller | PASS | useSearchActor shim re-exports only a hook |

---

## Overall Status: PARTIALLY COMPLIANT

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 4 |
| LOW / WARNING | 1 |

**Summary:**

The explore feature is architecturally sound in its dependency direction (no reversed app→engine violations, no identity contract violations, all files within size limits). The two HIGH findings represent concrete structural problems that cause real bugs:

- **RC-EXPLORE-H001** (DAL calls Model) is the root cause of the double-normalization data loss discovered by LOKI. Fixing the layer placement eliminates the bug at its source.
- **RC-EXPLORE-H002** (misplaced usecase file) represents dead code with naming convention violations and relative imports — low active risk but represents a governance failure and a latent security bypass path.

The MEDIUM findings are import discipline issues (relative paths, missing adapter file, cross-feature CSS) that do not cause runtime bugs today but violate the contracts that prevent coupling debt from accumulating.

**CONTRACT REVIEWER recommendation: CAUTION**

HIGH findings must be resolved. MEDIUM findings must be tracked. Feature is not architecturally blocked from THOR if HIGH findings are accepted as deferred technical debt with explicit tracking — but RC-EXPLORE-H001 (double normalization root cause) should be fixed before THOR because it causes data loss in the active search path.

---

*CONTRACT REVIEWER — Architecture Contract Compliance*
*Report persisted: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/REVIEW-CONTRACT/2026-06-05_review-contract_explore-architecture-compliance.md*
