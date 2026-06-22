# BEHAVIOR — reviews / review
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Behavior Inventory

| ID | Behavior | Source File | Status |
|----|----------|-------------|--------|
| BEH-REVIEWS-REVIEW-001 | Bootstrap reviews engine at app startup | setup.js | SOURCE_VERIFIED |
| BEH-REVIEWS-REVIEW-002 | Inject Supabase singleton into engine | setup.js | SOURCE_VERIFIED |
| BEH-REVIEWS-REVIEW-003 | Register actor ownership resolver (vc.actor_owners) | setup.js | SOURCE_VERIFIED |
| BEH-REVIEWS-REVIEW-004 | Verify actor ownership before review write (ownership pre-check) | setup.js | SOURCE_VERIFIED |

---

## BEH-REVIEWS-REVIEW-001 — Bootstrap reviews engine at app startup

**Source:** `apps/VCSM/src/features/reviews/setup.js`  
**Entry point:** `apps/VCSM/src/main.jsx` (called before ReactDOM.render)  
**Trigger:** App boot — single call, no route or user interaction required  

**Flow:**
```
main.jsx
  └── setupVcsmReviewsEngine()
        ├── Injects supabaseClient into @reviews engine config
        └── Registers ownership resolver (see BEH-003)
```

**Postcondition:** `engines/reviews` is fully configured and ready to accept review submissions from any call site in the app.

---

## BEH-REVIEWS-REVIEW-002 — Inject Supabase singleton into engine

**Source:** `apps/VCSM/src/features/reviews/setup.js`

The engine requires a Supabase client to be injected at configure-time rather than imported directly. This enforces the dependency direction:

```
engines/reviews  (no direct Supabase import)
    ↑
apps/VCSM/src/features/reviews/setup.js  (injects client)
    ↑
@/services/supabase/supabaseClient  (singleton)
```

The engine DAL uses the injected client for all DB calls against the `reviews` schema.

---

## BEH-REVIEWS-REVIEW-003 — Register actor ownership resolver

**Source:** `apps/VCSM/src/features/reviews/setup.js`

A resolver function is registered on the engine that checks whether the calling user owns the actor they are claiming to review on behalf of.

**Query:** `SELECT actor_id FROM vc.actor_owners WHERE actor_id = :actorId`  
**Table:** `vc.actor_owners`  
**RLS:** `actor_owners_read_own` (user_id = auth.uid())

This is the application-layer ownership pre-check. If the query returns no row, the resolver returns false and the engine rejects the operation before it reaches the DB.

---

## BEH-REVIEWS-REVIEW-004 — Actor ownership pre-check before review write

**Source:** `apps/VCSM/src/features/reviews/setup.js`

The ownership resolver registered in BEH-003 is invoked by the engine before any review write is allowed. This is a defense-in-depth check — the canonical enforcement point is the `reviews.upsert_neutral_review()` SECURITY DEFINER RPC, which also validates ownership at the DB level.

**REV-V-001 Fix:** Previous versions of this resolver queried `vc.actors` (actor existence check), not `vc.actor_owners` (ownership check). The fix was applied — the resolver now correctly verifies that `auth.uid()` owns the actor.

**Fix evidence:**
- Before: `SELECT id FROM vc.actors WHERE id = :actorId` — existence only, no ownership
- After: `SELECT actor_id FROM vc.actor_owners WHERE actor_id = :actorId` — RLS enforces ownership

---

## Entry Point Summary

| Entry Point | Trigger | Behavior |
|-------------|---------|----------|
| `main.jsx` calls `setupVcsmReviewsEngine()` | App boot | BEH-001 through BEH-004 |

No routes. No screens. No user-triggered behaviors at this module layer.

---

## Behaviors NOT in this module

All review submission, read, display, and update behaviors are in `engines/reviews`. This module only handles the one-time bootstrap.
