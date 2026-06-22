# SENTRY — Architecture Compliance & Boundary Enforcement
**Target Module:** reviews  
**Scope:** `apps/VCSM/src/features/reviews/` + `engines/reviews/`  
**Date:** 2026-05-23  
**Status:** REVIEW_PENDING  
**Triggered by:** CEREBRO run on `vcsm.reviews.architecture.md`

---

## Compliance Matrix

### VCSM Architecture Contract — Layer Boundaries

| Rule | Status | Evidence |
|---|---|---|
| DAL → Model → Controller → Hook → Screen build order | PASS | Engine owns all layers; VCSM contributes only `setup.js` |
| No cross-feature direct imports | PASS | `setup.js` imports from `@reviews` only — no other feature imports |
| All imports use `@/...` aliases | PASS | `setup.js:13-14` uses `@reviews` and `@/services/supabase/supabaseClient` |
| No `select('*')` in any DAL | PASS | All engine DAL files use explicit column lists — verified |
| File length < 300 lines | PASS | `setup.js`: 46 lines; all engine DAL files < 135 lines |
| No TypeScript files | PASS | All files are `.js` |
| Identity scoped to `actorId` + `kind` | PASS | Engine uses `authorActorId`/`targetActorId` throughout |
| Ownership via `actor_owners` | FAIL — BLOCKING | `isActorOwner` queries `vc.actors`, not `vc.actor_owners` |

---

### Engine Isolation Rules (engines/reviews/CLAUDE.md)

| Rule | Status | Evidence |
|---|---|---|
| No imports from `apps/VCSM/` | PASS | Verified — engine is fully self-contained |
| No imports from other engines | PASS | No cross-engine imports found |
| No imports from `shared/` | PASS | Verified |
| Queries only `reviews.*` schema | PASS | All DAL queries use `.schema('reviews')` |
| No app-specific logic in engine | PASS | DI pattern correct — `isActorOwner` injected, not baked in |
| Engine exposes only `adapters/index.js` | PASS | `index.js` re-exports from `src/adapters/index.js` |

---

### Boundary Contract — Actor Identity

| Rule | Status | Evidence |
|---|---|---|
| No `profileId` / `vportId` on public surfaces | PASS | Engine uses only `actorId` throughout |
| No `userId` as identity | PASS | Not used in any DAL or controller signature |
| Actor ownership via `actor_owners` | FAIL — BLOCKING | `isActorOwner` in `setup.js` queries `vc.actors` not `vc.actor_owners` |

---

### Screen Role Boundaries

Not applicable — reviews module has no screens, hooks, or components. All UI is owned by the engine.

---

## Compliance Findings

| ID | Rule | Status | Severity |
|---|---|---|---|
| S-01 | `isActorOwner` must verify via `actor_owners` | FAIL | BLOCKING |
| S-02 | `reviews.reviews` RLS not in tracked migrations | UNKNOWN | HIGH |
| S-03 | Logan documentation missing for reviews integration | FAIL | MEDIUM |
| S-04 | No module owner assigned | MISSING | LOW |

---

## Status: BLOCKED on S-01

Architecture compliance fails on the canonical identity rule: **Owner always means Actor Owner — verified through `actor_owners`.** The reviews `isActorOwner` implementation directly violates this rule.

**Required fix before compliance can pass:** Rewrite `isActorOwner` in `setup.js` to query `vc.actor_owners WHERE actor_id = ? AND user_id = auth.uid()`.
