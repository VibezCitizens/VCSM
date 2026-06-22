# MODULE ARCHITECTURE REPORT

**Module:** identity
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Identity Engine Wrapper
**Primary Root:** `apps/VCSM/src/features/identity/` + `apps/VCSM/src/state/identity/`
**Independence Status:** INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Provisions and manages the actor identity context for the entire VCSM application. Wraps the `@identity` engine with VCSM-specific resolver logic, handles actor directory refresh, and provides the platform bootstrap sequence. The global identity context lives in `state/identity/` and is separate from the feature wrapper in `features/identity/`.

**STRUCTURAL NOTE:** Identity is split across two roots: `features/identity/` (engine wrapper, setup, resolvers) and `state/identity/` (context, controller, DAL, model, selectors, storage). This split is intentional architecture (state belongs at app level) but creates conceptual fragmentation.

---

## ENTRY POINTS

- Not directly routed — identity is a platform concern
- `setup.js` called at app startup (main.jsx)
- `state/identity/identityContext.jsx` — React context provider wraps entire app
- `useIdentity()` — consumed by all authenticated features

---

## LAYER MAP

**features/identity/ (engine wrapper):**
DAL: `provision.rpc.dal.js`, `refreshActorDirectory.dal.js`
Controllers: `ensureVcsmPlatformBootstrap.controller.js`, `refreshActorDirectory.controller.js`
Hook: `useIdentityOps.js`
Resolvers: `resolvers/vcsmIdentity.resolver.js` — VCSM-specific app context resolver
Setup: `setup.js` — configures @identity engine
Adapter: `identity.adapter.js`

**state/identity/ (app-level identity context):**
DAL: `identity.read.dal.js` — reads auth session
Controller: `identity.controller.js`, `identity.controller.inflight.js` — session resolution
Controller: `controller/switchActor.controller.js` — actor switching
Helper: `identityResolutionSelfHeal.helper.js` — recovery logic
Controller: `identitySelfHeal.controller.js` — self-heal controller
Model: `identity.model.js` — identity domain shape
Store: `identitySelection.store.js` — Zustand store for selected actor
Storage: `identityStorage.js` — localStorage persistence layer
Selectors: `identitySelectors.js` — derived selectors from store
Hooks: `useIdentitySync.js`, `useIdentityResolutionEffect.hook.js`
Context: `identityContext.jsx` — React context provider
Switcher: `identitySwitcher.jsx` — actor/vport UI switcher
Debug: `IdentityDebugger.jsx`
Queries: `queries/identityEngineQuery.js`

**state/actors/ (related):**
- `actorStore.js` — re-export from @hydration
- `useActorSummary.js` — re-export from @hydration
- `hydrateActors.js` — re-export from @hydration
- `assertActorId.js` — validation helper
- `profileGateStore.js` — profile completion gate

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Identity context clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | identityContext.jsx wraps app | — |
| Controllers present/delegated | PASS | 5 controllers | — |
| DAL/repository present/delegated | PASS | 3 DAL files | — |
| Models/transformers present | PASS | identity.model.js | — |
| Hooks/view models present | PASS | useIdentitySync, useIdentityResolutionEffect | — |
| Screens/components present | PASS | identitySwitcher.jsx (inline UI) | — |
| Services/adapters present | PASS | identity.adapter.js | — |
| Database objects mapped | PARTIAL | vc.actors, vc.actor_owners, Supabase Auth | — |
| Authorization path mapped | PASS | Identity context is the auth gate | — |
| Cache/runtime behavior mapped | PARTIAL | identityStorage (localStorage), identitySelection.store (Zustand) | TTL on storage not confirmed |
| Error/loading/empty states mapped | PARTIAL | Self-heal logic present | Identity failure path not documented |
| Documentation linked | FAIL | No Logan doc (ARCHITECTURE.md covers identity surface rules) | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | @identity engine configured | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `@identity` engine | engine | identity → @identity | YES | Core identity engine |
| `auth` feature | feature | auth → identity | YES | Auth session feeds identity |
| `vc.actors` | database | identity reads | YES | Actor resolution |
| `vc.actor_owners` | database | identity reads | YES | Ownership mapping |
| Supabase Auth | external | identity reads | YES | Session token |
| `identitySelection.store` | state | identity → Zustand | YES | Selected actor persistence |
| `identityStorage` | state | identity → localStorage | YES | Persisted actor selection |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `actorId` | derived | identity | ALL features | Must never expose profileId/vportId |
| `kind` ('user'\|'vport') | derived | identity | ALL features | Must be the only discriminator |
| Session token | read | Supabase Auth | identity | Token refresh handling |
| Selected actor | cached | identitySelection.store | identitySwitcher | Persisted — stale risk on logout |
| Actor directory | cached | @identity engine | identity | refresh on bootstrap |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | Context provider at app root | — |
| Loading state | PARTIAL | Self-heal handles recovery | Initial resolution loading unclear |
| Empty state | PARTIAL | Profile gate for incomplete profiles | — |
| Error state | PARTIAL | Self-heal controller present | LOKI trace needed |
| Auth/owner gates | PASS | Identity context is the auth system | — |
| Cache behavior | PARTIAL | localStorage + Zustand store | Stale on logout needs verification |
| Runtime dependencies | PASS | @identity engine initialized at startup | — |
| Hot paths | CRITICAL | Identity resolves on every app load | Must be fastest path in app |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Split across features/ and state/ | Intentional but creates two roots for one concern | MEDIUM | IRONMAN |
| `identity.controller.inflight.js` | Purpose unclear from name alone | MEDIUM | IRONMAN |
| `identityResolutionSelfHeal.helper.js` vs `identitySelfHeal.controller.js` | Two files for self-heal — helper + controller | MEDIUM | SENTRY |
| `queries/identityEngineQuery.js` | Query file inside state/ | LOW | LOGAN |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ARCHITECTURE.md §1.3, §1.4 | PARTIAL |
| Ownership record | — | MISSING |
| Security audit | VENOM | MISSING |
| Runtime audit | LOKI | MISSING |
| Performance audit | KRAVEN | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | @identity | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| LOKI trace of identity resolution | HIGH | Identity is the critical path — any latency = blocked users | LOKI |
| Logan documentation (full identity flow) | HIGH | ARCHITECTURE.md covers surface rules but not implementation | LOGAN |
| Logout cache flush verification | HIGH | stale actor in localStorage after logout = security | VENOM |
| inflight controller documentation | MEDIUM | Purpose unclear without docs | IRONMAN |
| Self-heal helper vs controller deduplication | MEDIUM | Two files for same concern | SENTRY |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- LOKI (runtime: identity resolution hot path trace)
- VENOM (security: logout cache flush, localStorage persistence)
- LOGAN (documentation: full identity flow docs)
- KRAVEN (performance: identity resolution latency)
- IRONMAN (ownership: inflight controller purpose)
