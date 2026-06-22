# SENTRY Architecture Compliance Report — Feed Pipeline Module

**Date:** 2026-06-05
**Scope:** VCSM:feed/modules/pipeline
**Reviewer:** SENTRY
**Environment:** Source-verified static analysis
**Contract Reference:** `apps/VCSM/CLAUDE.md` + `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`

**Result:** CONDITIONAL PASS — 4 concerns, 0 blocking violations
**THOR Gate Impact:** Non-blocking (concerns are documentation + low-severity code hygiene)

---

## Compliance Checklist

### A — Dependency Direction

| Check | Rule | Result | Evidence |
|---|---|---|---|
| A-1 | apps → engines → shared (never backwards) | PASS | `fetchFeedPage.pipeline.js:13` — `import { hydrateAndReturnSummaries } from "@hydration"` — app layer importing engine ✓ |
| A-2 | No cross-product imports (VCSM ↔ Wentrex ↔ Traffic) | PASS | All imports resolve within `@/features/feed/`, `@/shared/`, `@/services/`, or `@hydration` / `@debuggers` |
| A-3 | Engine imports go through correct path alias | PASS | `@hydration` resolves to `engines/hydration` — no relative `../../engines/` chains |
| A-4 | No import from apps/WT/ | PASS | Not present |

---

### B — Adapter Boundary Compliance

| Check | Rule | Result | Evidence |
|---|---|---|---|
| B-1 | Cross-feature imports through adapters only | PASS | `useCentralFeedActions.js` imports: useBlockActorAction from `@/features/block/adapters/...`, useFollowActorToggle from `@/features/social/adapters/...`, useHidePostForActor from `@/features/moderation/adapters/...`, useReportFlow from `@/features/moderation/adapters/...` — all through adapter paths |
| B-2 | feedCache adapter only exposes cache invalidation (not DAL functions) | PASS | `feedCache.adapter.js` re-exports only: `invalidateFeedBlockCache`, `invalidateFeedFollowCache`, `invalidateActorBundleEntry` — no DAL functions exported |
| B-3 | Pipeline DAL functions not exported through adapter | PASS | No DAL read functions in feedCache.adapter.js |
| B-4 | No direct import of another feature's internal model/controller/dal | PASS | No `@/features/block/dal/...` or similar internal paths found |

---

### C — DAL Compliance

| Check | Rule | Result | Evidence |
|---|---|---|---|
| C-1 | `select('*')` banned | PASS | grep over feed DAL files: 0 violations. All DALs use explicit column lists |
| C-2 | All DAL functions return typed data (not raw Supabase response) | PASS | All DALs unwrap `.data` and return domain types (Map, Set, array, object) |
| C-3 | DAL files do not import from model or hook layers | PASS | DAL imports: supabase client, shared utils (`isUuid`, `createTTLCache`) only |
| C-4 | vportSchema (separate Supabase client) contained to actorsBundle DAL | PASS | `vportSchema` import only in `feed.read.actorsBundle.dal.js` — not spread to other DALs |

---

### D — Build Order Compliance

| Check | Rule | Result | Evidence |
|---|---|---|---|
| D-1 | DAL → Model → Controller → Hook → Components | PASS | `fetchFeedPage.pipeline.js` imports DALs + models, not hooks. Hooks import pipeline and adapters. Build order respected. |
| D-2 | No hook importing DAL directly (must go through controller/pipeline) | PASS | `useFeed.js` and `useCentralFeed.js` import `fetchFeedPagePipeline` (pipeline layer), not DALs directly |
| D-3 | No model importing from DAL | PASS | All model files are pure functions with no imports from `feed/dal/` |

---

### E — File Size Contract

| Check | Rule | Result | Evidence |
|---|---|---|---|
| E-1 | Files over 300 lines must be split before adding code | CONCERN | `fetchFeedPage.pipeline.js`: 176 lines ✓ (under limit); `useFeed.js`: 277 lines ✓; `useCentralFeed.js`: 292 lines ✓; `feed.read.actorsBundle.dal.js`: 162 lines ✓; `useCentralFeedActions.js`: ~269 lines ✓. All under 300. |
| E-2 | No file at or near 300-line ceiling | NOTE | `useCentralFeed.js` at 292/300 — one feature addition would trigger split obligation |

---

### F — Module Isolation

| Check | Rule | Result | Evidence |
|---|---|---|---|
| F-1 | No imports from `apps/wentrex/` | PASS | Not present |
| F-2 | No imports from `apps/Traffic/` | PASS | Not present |
| F-3 | No imports from `apps/WT/` | PASS | Not present |
| F-4 | engines/ used only for hydration engine | PASS | Only `@hydration` (engines/hydration) and `@debuggers` (debug-only) used from non-feature paths |

---

## Compliance Concerns

### SENTRY-PIPE-001 — @debuggers/feed Unconditional Production Import

```
File: apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:22
Import: import { wrapDAL, recordStep } from "@debuggers/feed/feedProfiler"

Issue:
  The @debuggers import is unconditional — it executes at module load time in production.
  The USAGE of wrapDAL is conditional (import.meta.env.DEV ? wrapDAL(...) : rawDAL),
  but the import itself fires in all environments.
  @debuggers/feed/feedProfiler is included in the production bundle.

Impact:
  - Bundle size: debugger module included in production
  - Execution: no production side effects (wrapDAL never called in production)
  - Security: low (debuggers directory is never-ship-to-production per CLAUDE.md)

Rule:
  "Files That Must Never Ship to Production: debuggers/"

Severity: MEDIUM
THOR Impact: NON-BLOCKING (VEN-PIPE-010 already open)
Recommended fix: Dynamic import with DEV guard:
  const { wrapDAL, recordStep } = import.meta.env.DEV
    ? await import("@debuggers/feed/feedProfiler")
    : { wrapDAL: (_, __, fn) => fn, recordStep: () => {} }
  OR: Move all DEV wrapping to a separate feedProfiler.dev.js file imported conditionally.
```

### SENTRY-PIPE-002 — Dead Code in makeActorRoute VPORT Branch

```
File: apps/VCSM/src/features/feed/model/buildMentionMaps.model.js:5
Code: if (kind === "vport" && vportId) return `/vport/${vportId}`;

Issue:
  This branch is dead code. enrichMentionRows.model.js explicitly sets vport_id: null
  for ALL mention rows. vportId is always null when kind === "vport".
  The branch `if (kind === "vport" && vportId)` never evaluates to true.

Impact:
  - VPORT mentions always fall to the actorId UUID fallback (/profile/${actorId})
  - Raw UUID exposed in all VPORT mention routes (VEN-PIPE-004 / BW-PIPE-005)

Severity: MEDIUM (also tracked as VEN-PIPE-004)
THOR Impact: NON-BLOCKING (P2 — see ELEK-PIPE-007A)
Recommended fix: See ELEK-PIPE-007A patch proposal.
```

### SENTRY-PIPE-003 — Dual Hook Architecture (useFeed + useCentralFeed)

```
Files:
  apps/VCSM/src/features/feed/hooks/useFeed.js (legacy manual hook, 277 lines)
  apps/VCSM/src/features/feed/hooks/useCentralFeed.js (React Query wrapper, 292 lines)

Issue:
  Two hooks implement the same feed loading behavior:
  - useFeed.js: manual state management, request versioning, actor store upsert
  - useCentralFeed.js: React Query infinite query, staleTime, gcTime
  
  Both consume the same pipeline (fetchFeedPagePipeline) and both are actively used
  (no deprecation signal, no migration path documented).
  
  This creates two parallel maintenance surfaces and two divergent cache models:
  - useFeed.js: manual request versioning (requestVersionRef)
  - useCentralFeed.js: React Query staleTime + gcTime

  DRAIN_CAP constants differ: useFeed uses MAX_EMPTY_PAGES_PER_FETCH=3,
  fetchCentralFeedPage.js uses MAX_EMPTY_PAGES_PER_FETCH=2.

Impact:
  - Divergence risk: security fixes applied to one hook may not be reflected in the other
  - Testing surface: 2x test coverage needed for equivalent behavior
  - Architecture: clear violation of DRY at the architectural level

Severity: LOW (architecture concern — not a security or functional issue)
THOR Impact: NON-BLOCKING
Recommendation:
  Create ticket to deprecate useFeed.js in favor of useCentralFeed.js.
  Document which screens use which hook before migration.
  Migration is a separate ticket and out of scope for this bundle run.
```

### SENTRY-PIPE-004 — Windows Absolute Path Comment in Source File

```
File: apps/VCSM/src/features/feed/model/buildMentionMaps.model.js:1
Comment: // C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\model\buildMentionMaps.js

Issue:
  Developer machine path hardcoded as first line comment.
  Exposes developer machine username ("trest") and folder structure.

Impact:
  - Information disclosure (developer identity)
  - Not a security vulnerability — info is not served to clients
  - Violation of comment hygiene policy (comments must explain WHY, not WHAT or WHERE)

Severity: LOW (cosmetic)
THOR Impact: NON-BLOCKING
Recommended fix: Remove line 1 from buildMentionMaps.model.js.
```

---

## Summary

| Category | Checks Run | PASS | CONCERN | FAIL |
|---|---|---|---|---|
| Dependency Direction | 4 | 4 | 0 | 0 |
| Adapter Boundary | 4 | 4 | 0 | 0 |
| DAL Compliance | 4 | 4 | 0 | 0 |
| Build Order | 3 | 3 | 0 | 0 |
| File Size | 2 | 2 | 0 | 0 |
| Module Isolation | 4 | 4 | 0 | 0 |
| **Compliance Concerns** | 4 | — | **4** | 0 |
| **Total** | **25** | **21** | **4** | **0** |

**Verdict: CONDITIONAL PASS**

All architecture contract rules are followed. Four concerns noted — none are THOR blockers.
THOR gate for this module is blocked by SECURITY findings, not SENTRY findings.

---

## THOR Gate Impact

| Concern ID | Severity | THOR Blocking |
|---|---|---|
| SENTRY-PIPE-001 | MEDIUM | NO — informational (already tracked as VEN-PIPE-010) |
| SENTRY-PIPE-002 | MEDIUM | NO — informational (already tracked as VEN-PIPE-004) |
| SENTRY-PIPE-003 | LOW | NO — architecture recommendation |
| SENTRY-PIPE-004 | LOW | NO — cosmetic |

All 4 THOR blockers for this module come from SECURITY findings (BW-PIPE-001, BW-PIPE-002, VEN-PIPE-002, VEN-PIPE-003), not from SENTRY.

---

## Required Follow-up Commands

| Command | Reason |
|---|---|
| THOR | Release gate consuming SENTRY result (CONDITIONAL PASS) |
| ELEKTRA | SENTRY-PIPE-001 fix deferred to ELEK-PIPE-008 (DEV guard for console.log pattern) |
