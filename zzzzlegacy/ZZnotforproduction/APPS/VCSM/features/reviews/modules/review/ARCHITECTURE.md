# ARCHITECTURE — reviews / review
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Classification

| Field | Value |
|-------|-------|
| Type | Engine Bootstrap Shim |
| Pattern | Injectable engine configuration |
| Data access | Read-only (vc.actor_owners ownership pre-check) |
| Write path | Delegated to engines/reviews via SECURITY DEFINER RPC |
| Layers | Bootstrap → Engine config → Ownership resolver |

---

## Layer Stack — Engine Bootstrap

```
apps/VCSM/src/main.jsx
  └── setupVcsmReviewsEngine()
        │   apps/VCSM/src/features/reviews/setup.js
        │
        ├── [INJECT] supabaseClient
        │     apps/VCSM/src/services/supabase/supabaseClient.js
        │
        └── [REGISTER] ownershipResolver
              └── vc.actor_owners
                    SELECT actor_id WHERE actor_id = :actorId
                    RLS: actor_owners_read_own (user_id = auth.uid())
```

---

## Layer Stack — Review Write Path (via engine, not this module)

```
[Call site in VCSM app]
  └── engines/reviews → controller → DAL
        └── reviews.upsert_neutral_review()   ← SECURITY DEFINER RPC
              ├── Ownership check (DB-level)
              └── reviews.reviews INSERT/UPDATE
```

This module does **not** own or implement the write path. It only registers the ownership resolver that the engine calls before initiating a write.

---

## Source File Map

| File | Layer | Exports | Lines |
|------|-------|---------|-------|
| `apps/VCSM/src/features/reviews/setup.js` | Bootstrap | `setupVcsmReviewsEngine()` | ~60 |

No controllers, no DAL, no hooks, no components, no models at this module level. All of those live in `engines/reviews`.

---

## Database

| Table | Schema | Operation | RLS Policy |
|-------|--------|-----------|-----------|
| `actor_owners` | `vc` | SELECT (ownership pre-check only) | `actor_owners_read_own` (user_id = auth.uid()) |

| RPC | Schema | Type | Called By |
|-----|--------|------|-----------|
| `upsert_neutral_review()` | `reviews` | SECURITY DEFINER | engines/reviews DAL (not this module) |

---

## External Dependencies

| Dependency | Type | Purpose |
|-----------|------|---------|
| `engines/reviews` | Engine | All review domain logic — controllers, DAL, models, services |
| `@/services/supabase/supabaseClient` | VCSM service | Supabase singleton client |
| `@supabase/supabase-js` | SDK | Underlying Supabase client (in services layer) |

---

## Dependency Direction

```
apps/VCSM/src/features/reviews/setup.js
    ├── imports: @/services/supabase/supabaseClient   (VCSM services)
    └── imports: engines/reviews                      (engine)

engines/reviews
    └── (no import of VCSM app code — engine is app-agnostic)
```

**Correct direction:** App → Engine. Engine does not import from app.

---

## Invariants

1. `setupVcsmReviewsEngine()` must be called before any review operation is attempted.
2. The ownership resolver must query `vc.actor_owners`, not `vc.actors`. (REV-V-001)
3. The engine is the single source of truth for review write logic — this module only configures it.
4. SECURITY DEFINER RPC provides DB-level enforcement independent of this application-layer check.

---

## Completeness

| Area | Status |
|------|--------|
| Bootstrap flow | COMPLETE |
| Ownership resolver | COMPLETE (REV-V-001 applied) |
| Write path | DELEGATED to engines/reviews |
| Tests | MISSING — no test coverage for setup.js |
| Barrel/index.js | PRESENT (entry via setup.js direct import) |
