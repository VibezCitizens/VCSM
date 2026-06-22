# SENTRY RE-VERIFICATION — Profiles BLOCKING Fix

**Date:** 2026-05-23
**Application Scope:** VCSM
**Reviewer:** SENTRY
**Trigger:** Post-implementation re-verification of BLOCKING finding SF-001 resolved during CEREBRO profiles audit (2026-05-22)
**Source Audit:** `CURRENT/features/dashboard/evidence/sentry_profiles-architecture-2026-05-22.md`
**File Re-Verified:**
- `apps/VCSM/src/features/profiles/controller/post/getActorPosts.controller.js` (SF-001)

---

## SF-001 RE-VERIFICATION — Controller→Screens layer inversion

**Original finding:** `getActorPosts.controller.js` imported `PostModel` from `@/features/profiles/screens/views/tabs/post/models/post.model` — a controller depending downward on a screen-layer file, violating the mandated DAL → Model → Controller → Hook → Screen dependency chain.

**Fix applied:**
```js
// BEFORE (layer inversion — controller imports from screens):
import { PostModel } from "@/features/profiles/screens/views/tabs/post/models/post.model";

// AFTER (correct — controller imports from model layer):
import { buildCanonicalProfilePostModel as PostModel } from "@/features/profiles/model/postCanonical.model";
```

**Re-verification:**

| Contract Rule | Before | After | Status |
|---|---|---|---|
| Controller must NOT import from `screens/` | VIOLATED — imported from `screens/views/tabs/post/models/` | CLEAN — no import from `screens/` in this controller | ✅ CLOSED |
| Model imports must resolve to `model/` or `kinds/*/model/` paths | VIOLATED | CLEAN — `@/features/profiles/model/postCanonical.model` is at feature-root model layer | ✅ PASS |
| `PostModel` functionality preserved | N/A | CONFIRMED — `buildCanonicalProfilePostModel as PostModel` is the underlying implementation that the screens-layer wrapper was calling; no functional change | ✅ VERIFIED |
| `getActorPosts.controller.js` usage unchanged | N/A | `PostModel(row)` calls remain identical in controller body | ✅ PASS |

**Root cause confirmed:** `screens/views/tabs/post/models/post.model.js` was a one-line re-export wrapper:
```js
export function PostModel(row) {
  return buildCanonicalProfilePostModel(row);
}
```
The canonical implementation was already at the correct layer. The fix bypasses the re-export and imports from the source.

**SF-001 Status: CLOSED**
Layer inversion eliminated. Controller now correctly depends on model layer only. Architecture contract dependency direction is satisfied for this controller.

---

## LAYER MAP RE-VERIFICATION — `getActorPosts.controller.js`

| Import | Source Layer | Contract-Compliant | Status |
|---|---|---|---|
| `fetchPostsForActorDAL` | `dal/post/fetchPostsForActor.dal` | DAL layer | ✅ PASS |
| `buildCanonicalProfilePostModel as PostModel` | `model/postCanonical.model` | Model layer | ✅ PASS |
| `hydrateActorsFromRows` | `@/state/actors/hydrateActors` | Engine re-export | ✅ PASS |
| `useActorStore` | `@/state/actors/actorStore` | Engine re-export | ✅ PASS (Zustand store accessed outside React render — no hook call in controller) |

**Note:** `useActorStore.getState()` is accessed in the controller body (not called as a React hook). This is the correct Zustand pattern for accessing store state outside of React component trees. Not a violation.

---

## RESIDUAL SENTRY FINDINGS (unchanged)

These findings from the original audit were not addressed in this implementation phase. They remain non-blocking but open.

| Finding | Severity | Drift | Status | Notes |
|---|---|---|---|---|
| SF-002 — `checkActorOwnership` ownership in DAL | HIGH | MAJOR DRIFT | OPEN | Architectural debt |
| SF-003 — `fetchPostsForActor.dal.js` god method | HIGH | MAJOR DRIFT | OPEN | Major refactor; R-01 |
| SF-004 — Post data DALs owned by profiles | HIGH | MAJOR DRIFT | OPEN | Cross-feature boundary; R-02 |
| SF-005 — Re-export controller in screens layer | MEDIUM | MODERATE DRIFT | OPEN | R-12 |
| SF-006 — Adapter naming violations ×3 | MEDIUM | MODERATE DRIFT | OPEN | R-10 |

---

## ARCHITECTURE ALIGNMENT TABLE (post-fix)

| Area | Pre-Fix Status | Post-Fix Status |
|---|---|---|
| Layer dependency direction (`getActorPosts.controller.js`) | CONTRACT VIOLATION | ✅ CLEAN |
| `upsertVportServices` ownership gate | FAIL (SENTRY confirms VF-002 via SF context) | ✅ CLEAN (VENOM VF-002 fix applied) |
| DAL layer responsibility (`fetchPostsForActor`) | MAJOR DRIFT | OPEN (non-blocking) |
| Model layer placement (`PostModel`) | MAJOR DRIFT | ✅ CLEAN (import fixed) |
| Adapter naming violations | MODERATE DRIFT | OPEN (non-blocking) |

---

## SENTRY RE-VERIFICATION STATUS

**SF-001: CLOSED** ✅
**SF-002 through SF-006: OPEN** (non-blocking, pre-existing)

**Architecture contract compliance for changed files: PASS**
All imports in `getActorPosts.controller.js` now follow the correct layer dependency direction. The controller→screens violation is eliminated.
