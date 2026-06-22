# Feature Contract: identity

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 9 (scanner 2026-06-05)  
**Inbound imports:** 41  
**Outbound imports:** 0  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`identity` is the actor identity resolution layer for VCSM. It answers one question: **who is the currently authenticated actor?**

After a user authenticates via `auth/`, `identity` resolves the full actor record — profile ID, actor type, vport membership — and makes it available to the rest of the application.

`identity` is a **platform primitive**. It is consumed by 41 import sites across the feature layer. It produces nothing; it resolves.

---

## 2. Non-Goals

`identity` must not own:
- Authentication — that is `auth/`'s responsibility
- Actor search / lookup by slug or ID (beyond session resolution) — that is `actors/`'s responsibility
- Profile rendering — that is `profiles/`
- Identity configuration / settings — that is `settings/`

---

## 3. Public API / Adapter Boundary

**Known adapter:**
- `apps/VCSM/src/features/identity/setup.js` — engine DI configuration
- TODO: Confirm whether `identity/adapters/` exists with a named adapter file

The identity feature uses the injectable resolver pattern. It is wired at startup via `setup.js`, which injects the Supabase client and provides a resolver factory to the `@identity` engine.

**Note:** The architecture review notes that `chat` imports both `@identity` (engine alias) and `@/features/identity/` (feature adapter) — 16 times and 8 times respectively. This mixed consumption is a naming inconsistency to address in ARCH-NAMING-001.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| setup | `identity/setup.js` | Engine DI wiring — targeted for migration to `app/setup/` (ARCH-ENGINESETUP-001) |
| adapters | `identity/adapters/` | TODO: confirm adapter file names |

The architecture review lists 9 total files. With `setup.js` as 1 file, the remaining 8 files span adapters and supporting utilities.

---

## 5. Allowed Dependencies

**None confirmed by scanner (outbound count: 0).**

`identity` is a terminal feature in the dependency graph — it is consumed by all but imports from none. The engine resolver pattern means it accesses Supabase through the initialized-DAL pattern via `setup.js`, not via cross-feature imports.

---

## 6. Prohibited Dependencies

`identity` must not import from:
- Any feature in `apps/VCSM/src/features/` (confirmed — 0 outbound imports)
- `profiles/` — identity produces actor resolution, not profile data
- `auth/` — auth produces a session; identity consumes it, but via the engine pattern, not feature import

---

## 7. DAL / Controller Rules

`identity` uses the injectable resolver pattern, not the standard Controller/DAL split:

**Resolver rules (from `04-resolver-contract.md`):**
- May import Supabase and query it directly using the initialized-DAL pattern
- Must return injectable factory closures, not live data
- Must not be imported by components, hooks, screens, or controllers at runtime
- Must only be called via `setup.js` DI wiring at app startup

**No standard DAL or Controller layer exists in identity.** The engine handles data access; identity provides the adapter/resolver bridge.

---

## 8. Known Coupling

No cross-feature imports (outbound: 0).

The `actors/` feature has overlapping purpose with `identity/`. The architecture review notes unclear ownership boundaries:
- `identity` = session/auth-facing identity resolution
- `actors` = UI-facing actor data lookup

This boundary should be clarified in ARCH-STUBS-001 comments or a naming decision.

---

## 9. Risk Notes

**LOW.** Zero violations, zero outbound imports. High inbound count (41) is expected for a platform primitive.

The highest risk for identity is accidental coupling — if any feature begins importing from `identity/` internals rather than through the adapter surface, it would cascade across 41 import sites.

The mixed engine alias (`@identity` vs `@/features/identity/`) in chat should be standardized.

---

## 10. Migration Notes

`identity/setup.js` is targeted for migration to `apps/VCSM/src/app/setup/identity.setup.js` per ARCH-ENGINESETUP-001. This is a planning-only ticket — no files move until implementation ticket opens.

The identity feature folder after setup.js migration: evaluate whether remaining files (adapter stubs) should stay in `identity/` or merge with `actors/`.

---

## 11. Unknowns

- TODO: Confirm exact file list in `identity/adapters/`
- TODO: Confirm whether identity exports a named adapter file (e.g., `identity.adapter.js`)
- TODO: Clarify boundary between `identity/` and `actors/` — see ARCH-STUBS-001
- TODO: Confirm `@identity` engine alias resolution in vite config
