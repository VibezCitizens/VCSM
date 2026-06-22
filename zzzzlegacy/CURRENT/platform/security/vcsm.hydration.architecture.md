# MODULE ARCHITECTURE REPORT

**Module:** hydration
**Application Scope:** apps/VCSM
**Module Type:** Engine Wrapper Module — Actor Hydration Bridge
**Primary Root:** `apps/VCSM/src/features/hydration/`
**Independence Status:** DEPENDENT (delegates to @hydration engine)
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Wires the `@hydration` engine with VCSM-specific actor hydration logic. Provides `hydrateVcsmActor()` — the app-owned hydration resolver that maps Supabase actor rows into typed actor shells (user vs vport). Called by the engine during actor lookup cache misses. Also configures the engine's Supabase client binding.

---

## ENTRY POINTS

- None (no screens/routes) — this is an engine wire-up module
- `setup.js` must be called once before render via `setupVcsmHydration()`
- Consumed by: `@hydration` engine at runtime when actor cache misses

---

## LAYER MAP

**Engine wrapper:** `setup.js` — configures `@hydration` with `hydrateVcsmActor` + platform Supabase client

**Hydrator:** `vcsmActorHydrator.js` — VCSM actor hydration logic:
- Reads `vc.actors` via `readIdentityActorByIdDAL`
- Reads `vc.profiles` via `readProfileIdentityDAL`
- Reads actor privacy via `readActorPrivacyDAL`
- Reads vport identity via `readVportIdentityDAL`
- Reads actor owner user via `readActorOwnerUserDAL`
- Reads user actor by profile_id via `readUserActorByProfileIdDAL`
- Reads `vport.profile_actor_access` via inline Supabase call (not a DAL)
- Resolves `realmId` via `identity.controller.resolveRealmId`
- Maps via `mapProfileActor` and `mapVportActor` from `identity.model`

**No DAL of its own** — borrows DAL from `state/identity/`
**No controllers of its own** — calls identity controller function
**No hooks** — engine-level, not UI-level
**No adapter** — consumed only by the engine

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Actor hydration bridge clear | — |
| Controllers present | PARTIAL | Calls identity.controller but owns none | — |
| DAL present | PARTIAL | Borrows DAL from state/identity — no own DAL | Acceptable delegation |
| Models present | PARTIAL | Uses identity.model — no own model | Acceptable delegation |
| Hooks present | N/A | Engine-level, no UI | — |
| Screens present | N/A | No routes | — |
| Adapter present | N/A | Engine wrapper — no cross-feature adapter needed | — |
| Documentation | FAIL | No Logan doc | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Inline Supabase call in hydrator | `vcsmActorHydrator.js:65-72` — direct `supabaseClient.schema('vport').from('profile_actor_access')` | MEDIUM — bypasses DAL layer contract | SENTRY |
| N+1 owner resolution | `readActorOwnerUserDAL` then `readUserActorByProfileIdDAL` — sequential reads per vport hydration | MEDIUM — called on every cache miss | KRAVEN |
| `void actorSource; void appKey; void supabase;` | Engine contract params silenced — VCSM hydrates independently of engine DI | LOW — technical debt signal | IRONMAN |

---

## MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Extract inline Supabase call to DAL | MEDIUM | Direct DB access inside hydrator violates DAL-first rule | SENTRY |
| Logan documentation | HIGH | No canonical hydration bridge doc | LOGAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: inline Supabase call bypassing DAL)
- KRAVEN (performance: N+1 owner resolution on cache miss)
- LOGAN (documentation)
