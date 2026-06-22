# INDEX — reviews / review
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Summary

| Field | Value |
|-------|-------|
| Module | review |
| Feature | reviews |
| Type | Engine Bootstrap Shim |
| Source Directory | apps/VCSM/src/features/reviews/ |
| Source Files | 1 |
| Screens | 0 |
| Routes | 0 |
| DB Tables | vc.actor_owners (read-only) |
| RPCs | reviews.upsert_neutral_review() (via engine) |
| Entry Point | main.jsx → setupVcsmReviewsEngine() |
| Called By | apps/VCSM/src/main.jsx (before render) |
| Delegates To | engines/reviews |
| Governance Status | SOURCE_VERIFIED |

---

## Purpose

This module is a **thin app-level shim** that bootstraps the `engines/reviews` engine into the VCSM app context.

It has no UI, no screens, no routes, and no business logic of its own. All review domain logic (controllers, DAL, models, services, RPC calls) lives in `engines/reviews`.

The module's sole responsibility is to call `setupVcsmReviewsEngine()` once during app startup, injecting:
1. The VCSM Supabase singleton client
2. An actor ownership verification resolver that checks `vc.actor_owners`

---

## Source File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `apps/VCSM/src/features/reviews/setup.js` | ~60 | Engine bootstrap — configures @reviews with Supabase + ownership check |

---

## Exported API

| Export | Type | Description |
|--------|------|-------------|
| `setupVcsmReviewsEngine()` | Function | Call once at boot; injects Supabase + ownership resolver into @reviews engine |

---

## Call Site

```
apps/VCSM/src/main.jsx
  └── setupVcsmReviewsEngine()   ← called before ReactDOM.render()
```

---

## Ownership Resolver

The engine bootstrap registers an actor ownership check:

- **Query:** `SELECT actor_id FROM vc.actor_owners WHERE actor_id = :actorId`
- **Table:** `vc.actor_owners` (not `vc.actors`)
- **RLS:** `actor_owners_read_own` — user_id = auth.uid()
- **Fix applied:** REV-V-001 — previous version incorrectly checked `vc.actors` (actor existence, not ownership)

---

## DB Enforcement

Write-path enforcement is delegated to the engine RPC:

- **RPC:** `reviews.upsert_neutral_review()`
- **Type:** SECURITY DEFINER
- **Ownership check:** Enforced at DB level inside the RPC — not at application layer

---

## Dependencies

| Dependency | Source | Purpose |
|-----------|--------|---------|
| `engines/reviews` | Engine | All review domain logic |
| `@/services/supabase/supabaseClient` | VCSM services | Supabase singleton injected into engine |
| `vc.actor_owners` | Database | Ownership pre-check resolver |

---

## Governance Files

| File | Status |
|------|--------|
| INDEX.md | SOURCE_VERIFIED |
| BEHAVIOR.md | SOURCE_VERIFIED |
| ARCHITECTURE.md | SOURCE_VERIFIED |
| SECURITY.md | SOURCE_VERIFIED |
