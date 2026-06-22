# MODULE ARCHITECTURE REPORT

**Module:** engines/hydration
**Application Scope:** VCSM + ENGINE
**Module Type:** Shared Domain Engine — Actor Summary Cache & Hydration
**Primary Root:** /Users/vcsm/Desktop/VCSM/engines/hydration/
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The hydration engine is the canonical actor summary cache. It owns:
- Fetching actor summaries via a single RPC endpoint (vc.get_actor_summaries)
- Normalizing actor rows from any naming convention into a canonical shape
- Caching summaries in a Zustand store with 5-minute freshness tracking
- Exposing hydration functions for all features that need to display actor data

The engine is the single source of truth for all actor display data (display name, username, photo, vport fields) across the VCSM app.

---

## OWNERSHIP

**Engine Owner:** Platform team
**App Scope:** VCSM (confirmed: 10+ consumer files across features, state, and other engines)
**No CLAUDE.md found** — this engine has no scope rules document. This is itself a governance gap.

---

## ENTRY POINTS

**Primary export:** `engines/hydration/index.js` (9+ symbols directly exported)
**Adapter:** `engines/hydration/src/adapters/index.js` — only 2 exports: `configureHydrationEngine`, `hydrateActor`. Incomplete relative to main index.js.
**Alias:** `@hydration` (used in VCSM features)

**Exported symbols (index.js):**
- `configureHydrationEngine`, `getHydrationConfig`, `getHydrator`, `getSupabaseClient` (config)
- `useActorStore` (Zustand store — REACT framework in engine)
- `hydrateActorsFromRows`, `hydrateActorsByIds`, `hydrateAndReturnSummaries` (pipeline)
- `fetchActorSummaries` (DAL alias)
- `useActorSummary` (React hook — REACT framework in engine)
- `hydrateActor` (controller — delegates to app-registered hydrators)

---

## LAYER MAP

```
engines/hydration/
├── index.js               — primary export surface (9+ symbols)
└── src/
    ├── config.js          — DI (supabaseClient + hydrators registry, no freeze guard)
    ├── dal.js             — vc.get_actor_summaries RPC (single canonical read)
    ├── extract.js         — actor ID extraction from any row shape (20 field name patterns)
    ├── normalize.js       — canonical normalization (user vs vport display logic)
    ├── hydrate.js         — core pipeline (extract → skip fresh → fetch → normalize → upsert)
    ├── store.js           — Zustand actor store (5-min freshness, safe merge)
    ├── useActorSummary.js — React presentation hook (useMemo, store selector)
    └── adapters/
        └── index.js      — VESTIGIAL: only 2 exports vs 9+ in main index.js
    └── controller/
        └── hydrateActor.controller.js — delegates to app hydrators by appKey+actorSource
```

Total: 10 files (smallest engine in sprint)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|------|--------|----------|----------------|
| Purpose defined | PARTIAL | No CLAUDE.md; purpose derivable from code | CLAUDE.md MISSING |
| Owner defined | PARTIAL | VCSM consumers found; no governance document | — |
| Entry points mapped | ANOMALY | adapters/index.js has 2 exports; main index.js has 9+ | Adapter surface is incomplete/vestigial |
| Controllers present | PASS | hydrateActor.controller.js + pipeline in hydrate.js | — |
| DAL/repository present | PASS | dal.js, single RPC endpoint | console.warn if not configured |
| Models/transformers present | PASS | normalize.js, extract.js | — |
| Cache/runtime behavior mapped | PASS | Zustand store, 5-min freshness, safe merge | Process-scoped; not invalidated on actor mutations |
| Hooks/view models present | ANOMALY | useActorStore (Zustand), useActorSummary (React) in engine | Framework-specific code in engine (same as chat ANOM-CHAT-001) |
| Documentation linked | FAIL | No CLAUDE.md, no BEHAVIOR.md, no SECURITY.md | All governance artifacts MISSING |
| Tests/validation noted | PARTIAL | No test files found in engine directory | — |

---

## DEPENDENCY INJECTION

| Point | Required | Notes |
|-------|----------|-------|
| supabaseClient | REQUIRED | Needed for dal.js RPC call; console.warn if absent (not a throw) |
| hydrators | OPTIONAL | Per-app, per-actorSource function registry |
| debugReporter | NONE | Not present — no debug trace support in this engine |

**No freeze guard:** `configureHydrationEngine()` uses `mergeHydrators` for additive hydrator registration, but overwrites all other config fields. No protection against post-startup reconfiguration of supabaseClient.

**VCSM setup:** No `setupVcsmHydrationEngine()` file found — the engine is likely configured directly in VCSM's root setup (app entry point). How VCSM wires supabaseClient into this engine is unknown from engine code alone.

---

## HYDRATION PIPELINE

```
hydrateActorsFromRows(rows, { force })
│
├─ extractActorIdsForHydration(rows)        — resolves actor IDs from 20 field naming patterns
├─ store.getMissingOrStale(allIds)          — skips IDs fresh within 5-min window
├─ getActorSummariesByIdsDAL({ actorIds })  — vc.get_actor_summaries RPC (deduped IDs)
├─ normalizeActorSummaries(summaries)       — canonical shape (user vs vport display logic)
└─ store.upsertActors(normalized)           — safe merge (null never overwrites non-null)

hydrateAndReturnSummaries({ actorIds })     — fetches and returns data to caller
│                                           — used by: chat DI, notifications DI
├─ Checks store for fresh cache entries (5-min inline check)
├─ Fetches only stale/missing IDs via RPC
├─ Returns { rows: [...fresh, ...fetched], error }
```

---

## DB ACCESS

| Schema | Access | DAL File | Function |
|--------|--------|----------|---------|
| vc | READ (RPC) | dal.js | vc.get_actor_summaries (p_actor_ids: UUID[]) |

Single canonical data source. No direct table queries.

**Note:** dal.js queries via `supabase.schema('vc').rpc('get_actor_summaries', ...)` — the engine DOES access the vc schema. This is a departure from the pattern of other engines which keep app schemas in DI injectors. For a hydration engine, this is intentional (canonical actor data lives in vc schema).

---

## ZUSTAND STORE — RUNTIME BEHAVIOR

| Feature | Detail |
|---------|--------|
| Store type | Zustand (create()) — process-scoped singleton |
| Cache TTL | 5 minutes (STALE_AFTER_MS = 5 * 60 * 1000) |
| Safe merge | null from incoming never overwrites existing non-null value |
| Metadata fields | `_hydratedAt: Date.now()` — always overwritten |
| Field duplication | Both camelCase and snake_case stored (display_name + displayName, etc.) |
| Force refresh | `upsertActors(rows, { force: true })` overwrites all fields including nulls |
| getMissingOrStale | Used by hydrateActorsFromRows for freshness gate |

**Field duplication risk:** Store holds both camelCase and snake_case versions of each field (e.g., displayName AND display_name, photoUrl AND photo_url). This doubles storage footprint and creates a contract where callers may use either form. normalize.js and upsertActors both maintain both forms — intentional backward compatibility but technically debt.

---

## ARCHITECTURE ANOMALIES

### ANOM-HYDRATE-001: React Hooks and Zustand in Engine

**Location:** `engines/hydration/src/store.js` (Zustand), `engines/hydration/src/useActorSummary.js` (React useMemo)
**Exported via:** main `index.js`
**Finding:** Engine ships a Zustand store and a React hook. The store IS the caching layer — other engines (chat, notifications) call hydrateAndReturnSummaries which uses the store. This couples the hydration engine to the React + Zustand runtime. Any app not using Zustand cannot use this engine.
**Risk:** Medium — the store.js is the cache backbone. Moving it out would require refactoring hydrateActorsFromRows.
**VCSM pattern:** `apps/VCSM/src/state/actors/actorStore.js` imports `useActorStore` from `@hydration` directly — VCSM is using the engine's Zustand store as its canonical actor state layer.

### ANOM-HYDRATE-002: No CLAUDE.md

**Finding:** No `engines/hydration/CLAUDE.md` exists. The engine has no written scope rules, schema ownership declaration, or DI contract documentation.
**Risk:** Medium — scope and boundaries are derivable from code but not governed.

### ANOM-HYDRATE-003: Adapter Surface is Vestigial

**Location:** `engines/hydration/src/adapters/index.js` — only exports `configureHydrationEngine`, `hydrateActor`
**Finding:** Main `engines/hydration/index.js` exports 9+ symbols directly, bypassing the adapter pattern. The adapters folder doesn't serve its purpose (controlling the public surface).
**Risk:** Low — functional, but all other engines use adapters/index.js as the sole surface. This engine diverges from that pattern.

### ANOM-HYDRATE-004: console.warn in dal.js

**File:** `engines/hydration/src/dal.js`
**Issue:** Uses `console.warn('[hydration/dal] supabase client not configured')` instead of throwing. Silent failure — callers get `{ rows: [], error }` with no exception.
**Risk:** Low (soft failure). Violates no-console rule.

### ANOM-HYDRATE-005: Duplicate 5-Min TTL Check

**Location:** `src/store.js` (STALE_AFTER_MS) vs `src/hydrate.js` (hydrateAndReturnSummaries inline `5 * 60 * 1000` check)
**Finding:** Two separate TTL checks for the same 5-minute window. If TTL changes, both locations must be updated.

### ANOM-HYDRATE-006: No Setup File Found for VCSM DI

**Finding:** No `apps/VCSM/src/features/hydration/setup.js` file found. How VCSM wires `supabaseClient` into `configureHydrationEngine()` is unknown from this audit. Could be in app root entry point.

---

## APP CONSUMERS (VCSM)

| File | Engine Symbols Used |
|------|---------------------|
| state/actors/actorStore.js | useActorStore |
| state/actors/useActorSummary.js | useActorSummary |
| state/actors/hydrateActors.js | hydrateActorsFromRows, hydrateActorsByIds |
| features/chat/setup.js | hydrateAndReturnSummaries (chat DI getActorSummariesByIds) |
| features/notifications/setup.js | hydrateAndReturnSummaries (notifications DI resolveActorCard) |
| features/profiles/controller/getProfileView.controller.js | hydrateActorsFromRows |
| features/profiles/controller/friends/hydrateActorsIntoStore.controller.js | hydrateActorsFromRows |
| features/feed/hooks/useCentralFeed.js | hydrateActorsFromRows |
| features/explore/controller/searchResults.controller.js | hydrateActorsFromRows |
| features/settings/profile/controller/profile.controller.js | hydrateAndReturnSummaries |

---

## SECURITY SURFACE

| Surface | Risk | Note |
|---------|------|------|
| vc.get_actor_summaries RPC | LOW | Read-only; fetches public actor display data |
| Zustand store in engine | LOW | Client-side memory only; no sensitive data in actor summaries |
| No CLAUDE.md scope rules | MEDIUM | Schema boundaries not formally documented |
| No tests | LOW | Normalization logic could silently produce wrong display data |

---

## BEHAVIOR CONSISTENCY CHECK — engines/hydration

```
Behavior Consistency Check — engines/hydration
================================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → 10 source files, 5-min Zustand cache, RPC pipeline, actor normalization, no BEHAVIOR.md
  → No CLAUDE.md — scope rules entirely absent
  → Severity: P1 (hydration is consumed by chat, notifications, feeds, and profiles)

Check B (Behavior without source): SKIPPED — no BEHAVIOR.md
Check C, D: SKIPPED — no BEHAVIOR.md
```

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module: engines/hydration
Classification: PARTIALLY INDEPENDENT
Reason: Single DB access (vc.get_actor_summaries RPC) is clean.
  DI hydrators allow app-specific augmentation.
  No cross-engine imports inside engine itself.
Blocking anomalies:
  - Zustand + React in engine (ANOM-HYDRATE-001) — framework-specific runtime embedded
  - No CLAUDE.md (ANOM-HYDRATE-002) — governance gap
  - Adapter surface vestigial (ANOM-HYDRATE-003) — pattern divergence
  - No BEHAVIOR.md → Blue Team blocked
  - No SECURITY.md → VENOM blocked
  - No tests
```

---

## RECOMMENDED HANDOFFS

- **WOLVERINE** — Write CLAUDE.md; decide React/Zustand scope ruling (ANOM-HYDRATE-001); consolidate TTL constant (ANOM-HYDRATE-005); find VCSM DI setup (ANOM-HYDRATE-006)
- **LOGAN** — Write BEHAVIOR.md, SECURITY.md, CURRENT_STATUS.md
- **ELEKTRA** — DI freeze guard; console.warn in dal.js (use reporter or throw)
- **SPIDER-MAN** — normalizeActorSummary unit tests (user vs vport display logic); hydrateAndReturnSummaries cache tests
- **IRONMAN** — Own actor normalization contract; confirm VCSM-only scope vs future Wentrex hydration
