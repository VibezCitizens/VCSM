# LOKI Runtime Report — Identity Resolution Trace
_Date:_ 2026-05-18
_Triggered by:_ CEREBRO pass — required next command after IRONMAN
_Boundary contract enforced:_ `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
_TypeScript output allowed:_ NO

---

## LOKI TARGET

```text
LOKI TARGET
Observed flow:   Identity resolution — normal auth, self-heal, context resolution, bootstrap (onboarding)
Application Scope: VCSM + ENGINE
Entry point:     useIdentityResolutionEffect (state/identity/identityContext.jsx via IdentityProvider)
                 + identityEngineQuery (state/identity/queries/identityEngineQuery.js)
                 + completeOnboardingController (features/auth/controllers/onboarding.controller.js)
Reason:          Post-fix verification of RISK-1 and RISK-2 adapter boundary fixes under runtime load;
                 IRONMAN recommended LOKI trace of self-heal and bootstrap flows
TypeScript output allowed: NO
Evidence basis:  INFERRED — static code analysis across all identity chain files.
                 No live runtime instrumentation was captured. All findings are static-trace derived.
```

---

## TRACE IDENTITY

```text
TRACE IDENTITY
Trace ID:         LOKI-IDENTITY-2026-05-18-001
Route:            Any authenticated route (IdentityProvider wraps the full app)
Screen:           N/A — provider-level; pre-render
Session state class: authenticated Citizen (primary flow)
Timestamp:        2026-05-18
```

---

## Files Traced

| File | Role in Chain |
|---|---|
| `state/identity/identityContext.jsx` | IdentityProvider — mounts `useIdentityResolutionEffect` |
| `state/identity/useIdentityResolutionEffect.hook.js` | Effect hook — orchestrates normal + self-heal resolve |
| `state/identity/identity.controller.js` | `loadDefaultIdentityForUser` + `_loadDefaultIdentityForUserInner` |
| `state/identity/identity.controller.inflight.js` | In-flight dedup Map + DEV resolve counter |
| `state/identity/identitySelfHeal.controller.js` | Self-heal bootstrap + finalize |
| `state/identity/identityResolutionSelfHeal.helper.js` | Finalizes state preference after self-heal |
| `state/identity/identity.read.dal.js` | `readIdentityActorByIdDAL`, `readUserActorByProfileIdDAL`, realm reads |
| `state/identity/queries/identityEngineQuery.js` | React Query wrapper for `resolveAuthenticatedContext` |
| `features/identity/setup.js` | DI wiring at app startup |
| `features/identity/resolvers/vcsmIdentity.resolver.js` | `createVcsmAppContextResolver` — actor link reader |
| `features/identity/dal/provision.rpc.dal.js` | `dalProvisionVcsmIdentity` — platform bootstrap RPC |
| `features/identity/dal/refreshActorDirectory.dal.js` | `refreshVcActorDirectory` — directory refresh RPC |
| `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` | Bootstrap controller |
| `engines/identity/src/controller/resolveAuthenticatedContext.controller.js` | 8-step engine resolution |
| `features/auth/controllers/onboarding.controller.js` | `completeOnboardingController` — onboarding bootstrap |

---

## RUNTIME SUMMARY

| Metric | Normal Auth (cold cache) | Normal Auth (warm cache) | Self-Heal Path | Bootstrap (onboarding) |
|---|---|---|---|---|
| Total DB reads | ~8–11 | 1 (auth only) | ~18–22 | ~6–8 (one-time) |
| RPC writes | 0 | 0 | 1 (provision + 1 finalize) | 2 (provision + refresh) |
| Primary records returned | 1 actor identity | 1 actor identity | 1 actor identity | 1 actor identity |
| Read Amplification Score | 8–11× | 1× | 18–22× | 6–8× |
| Cache behavior | cold miss → result cached 120s | engine cache hit | cache miss (new rows) | N/A (write path) |
| Worst bottleneck | Engine steps 1–4 (serial waterfall by necessity) | auth.getUser() only | second `resolveAuthenticatedContext` call | `provision_vcsm_identity` RPC (SECURITY DEFINER) |

**Read Amplification Guidance:** 0–2 = healthy · 2–5 = watch · 5–10 = high · 10+ = severe

Cold cache score of **8–11×** is in the HIGH range but is a one-per-120s event. The engine result cache makes the warm path score **1×** (HEALTHY). Self-heal is **SEVERE** but occurs at most once per new user.

---

## EXECUTION FLOW MAP — Normal Auth (Cold Cache)

| Step | Operation | Caller | DB Object | Mode | Notes |
|---|---|---|---|---|---|
| 1 | `resolveSessionUser()` | `resolveAuthenticatedContext` | `auth.users` (getUser) | SERIAL | Entry gate — stops if no session |
| 1a | Cache check `_resultCache` | `resolveAuthenticatedContext` | — | IN-MEMORY | HIT→ skip steps 2–8 (120s TTL) |
| 2 | `dalGetAppByKey()` | `resolveAuthenticatedContext` | `platform.apps` | SERIAL | Needs userId from step 1 |
| 3 | `resolveUserAppAccess()` | `resolveAuthenticatedContext` | `platform.user_app_access` | SERIAL | Needs app.id from step 2 |
| 4 | `resolveUserAppAccount()` | `resolveAuthenticatedContext` | `platform.v_user_app_context` (view) | SERIAL | Needs userId + appKey |
| 5a | `dalGetStateForAccount()` | `resolveAuthenticatedContext` | `platform.user_app_state` | PARALLEL with 5b | Needs uaaId from step 4 |
| 5b | `dalGetPreferencesForAccount()` | `resolveAuthenticatedContext` | `platform.user_app_preferences` | PARALLEL with 5a | Needs uaaId from step 4 |
| 6 | `appContextResolver()` (VCSM) | `resolveAuthenticatedContext` | `platform.user_app_actor_links` | SERIAL | Needs uaaId; reads all active VC links |
| 7 | `resolveActiveActor()` | `resolveAuthenticatedContext` | — | IN-MEMORY | Prefs/state/primary fallback — no DB |
| 8 | `_setCachedResult()` | `resolveAuthenticatedContext` | — | IN-MEMORY | Caches result for 120s |
| 9 | `readIdentityActorByIdDAL()` | `_loadDefaultIdentityForUserInner` | `vc.actors` | SERIAL | Needs actorId from engine result |
| 10 | `hydrateActor()` | `_loadDefaultIdentityForUserInner` | hydration engine (engine reads) | SERIAL | VCSM hydration engine — reads unknown externally |
| 11 | Seed React Query cache | `useIdentityResolutionEffect:229` | — | IN-MEMORY | `queryClient.setQueryData` — prevents identityEngineQuery redundant call |

**Serial steps 1–4 are unavoidable** — each step's result is required by the next. Steps 5a/5b are correctly parallelized. Step 6 depends on step 4 output.

---

## EXECUTION FLOW MAP — Self-Heal Path (Engine Returns Null)

| Step | Operation | Caller | DB Object | Mode | Notes |
|---|---|---|---|---|---|
| A1 | Normal auth steps 1–8 above | `useIdentityResolutionEffect` | (8 reads) | Mixed | Returns null — no platform rows |
| A2 | `readUserActorByProfileIdDAL(userId)` | `findSelfHealActorForUser` | `vc.actors` (profile_id filter) | SERIAL | Checks if vc actor exists before bootstrap |
| A3 | `dalProvisionVcsmIdentity({userId, actorId})` | `ensureVcsmPlatformBootstrap` | `platform.provision_vcsm_identity` RPC | SERIAL | SECURITY DEFINER — writes 6 tables atomically |
| A4 | `_resultCache` bust (implicit) | — | — | IN-MEMORY | Cache was empty (step A1 returned null); no explicit invalidation needed |
| A5 | Full engine re-run (steps 1–8) | `loadDefaultIdentityForUser` (retry) | (8 more reads) | Mixed | `resolveAttempt: 'retry_after_self_heal'` — different in-flight key |
| A6 | `readIdentityActorByIdDAL()` | `_loadDefaultIdentityForUserInner` | `vc.actors` | SERIAL | Second vc.actors read |
| A7 | `hydrateActor()` | `_loadDefaultIdentityForUserInner` | hydration engine | SERIAL | |
| A8 | `runFinalizeSelfHeal()` | `useIdentityResolutionEffect:122` | — | SERIAL | Calls `finalizeSelfHealedIdentity` |
| A9 | `engineSwitchActiveActor()` | `finalizeSelfHealedIdentity` | `platform.user_app_actor_links` (write) | SERIAL | Writes active actor preference |
| A10 | `finalizeAccountState()` | `finalizeSelfHealedIdentity` | `platform.user_app_state` (write) | SERIAL | Updates state finalization |

**Self-heal occurs at most once per new user.** It is a recovery path, not a hot path. Serial nature is acceptable.

---

## EXECUTION FLOW MAP — Directory Refresh (Post-Mutation)

| Step | Operation | Caller | DB Object | Mode | Notes |
|---|---|---|---|---|---|
| R1 | `refreshVcActorDirectory(actorId)` | vport.core.dal.js / profile / visibility | `identityOps.adapter.js` | Call | Via adapter (RISK-2 fix confirmed) |
| R2 | `refreshActorDirectoryRow('vc', actorId)` | `refreshVcActorDirectory` | — | SERIAL | Wrapper adds domain='vc' |
| R3 | `supabase.schema('identity').rpc('refresh_actor_directory_row')` | `refreshActorDirectoryRow` | `identity.actor_directory` | SERIAL | RPC write — graceful, never throws to caller |
| | _vport create:_ awaited before return | `vport.core.dal.js:101` | | AWAITED | Correct — link must exist before vport actor switch |
| | _vport update:_ fire-and-forget | `vport.core.dal.js:225` | | FIRE-FORGET | Correct — update doesn't need sync guarantee |

---

## DATABASE READ SUMMARY

| Table / View / RPC | Operation | Count (cold) | Count (warm) | Notes |
|---|---|---|---|---|
| `auth.users` | getUser() | 1 | 1 | Always checked — auth guard |
| `platform.apps` | SELECT | 1 | 0 (cache hit) | app key lookup |
| `platform.user_app_access` | SELECT | 1 | 0 (cache hit) | access gate |
| `platform.v_user_app_context` | SELECT (view) | 1 | 0 (cache hit) | account resolution |
| `platform.user_app_state` | SELECT | 1 | 0 (cache hit) | parallel with prefs |
| `platform.user_app_preferences` | SELECT | 1 | 0 (cache hit) | parallel with state |
| `platform.user_app_actor_links` | SELECT (12 cols) | 1 | 0 (cache hit) | multi-row, VCSM resolver |
| `vc.actors` | SELECT | 1 | 0 (cache hit) | active actor hydration |
| Hydration engine reads | SELECT (various) | unknown | 0 (cache hit) | Out of scope — hydration engine owns these |
| `platform.provision_vcsm_identity` | RPC (SECURITY DEFINER) | 0 (hot) / 1 (self-heal) | 0 | Writes 6 platform tables atomically |
| `identity.actor_directory` | RPC (refresh) | 0–1 per mutation | 0 | Post-mutation cache refresh |

---

## CACHE OBSERVATIONS

| Cache | Caller | TTL | Status | Evidence | Impact |
|---|---|---|---|---|---|
| `_resultCache` (engine in-memory) | `resolveAuthenticatedContext` | 120s (`_RESULT_TTL`) | HIT on warm path | `_getCachedResult` at engine entry | Reduces 8-step query chain to 1 auth check on re-navigations |
| React Query cache (`identityEngineQueryKey`) | `identityEngineQuery.js` | 120s (`staleTime`) | Seeded by `useIdentityResolutionEffect` | `queryClient.setQueryData` at line 229 | Prevents `identityEngineQuery` from firing a redundant `resolveAuthenticatedContext` call |
| In-flight dedup (`_identityInflight`) | `loadDefaultIdentityForUser` | Per-request (promise lifetime) | ACTIVE | `_identityInflight.get(inflightKey)` check | Concurrent calls with same `userId:resolveAttempt` share one promise — prevents thundering herd |

### Cache Drift Risk (LOW)

The engine result cache (`_resultCache`) and React Query cache (`identityEngineQueryKey`) are two independent caches for the same data (120s TTL each). If one is invalidated without the other:
- `invalidateIdentityResultCache()` busts the engine cache only
- `invalidateIdentityEngineQuery()` busts the React Query cache only

On actor switch, both must be invalidated together. Static analysis cannot confirm this co-invalidation always occurs. **INFERRED — requires LOKI live trace to confirm.**

---

## DUPLICATE QUERY FINGERPRINTS

No duplicate query fingerprints identified in the normal auth path.

**`vc.actors` is read twice in the self-heal path** — different filter keys, different projections:
- `readUserActorByProfileIdDAL(userId)` → `profile_id=userId, kind='user'` → selects `id` only
- `readIdentityActorByIdDAL(selectedActorId)` → `id=actorId` → selects 6 columns

These are NOT duplicates — they serve different purposes. The first finds the actor for the bootstrap. The second hydrates it post-bootstrap. **Not a concern.**

---

## TIMING BUDGET STATUS

_Note: All timing values are INFERRED from static analysis. No live measurements captured._

| Runtime Area | Observed | Budget | Status | Basis |
|---|---|---|---|---|
| Normal auth cold load | ~300–700ms | 1500ms | PASS (est) | 8 DB reads, steps 5a/5b parallel, engine cache saves repeats |
| Normal auth warm (cache hit) | ~20–50ms | 1500ms | PASS (est) | 1 auth.getUser only + in-memory cache |
| Self-heal path | ~600–1200ms | — | WATCH (est) | ~20 ops, 2x full engine run; one-time path |
| Bootstrap (onboarding) | ~400–800ms | — | PASS (est) | Write path, sequential by necessity, one-time |
| Directory refresh (awaited) | ~50–150ms | 150ms | PASS (est) | Single RPC, non-fatal |
| Directory refresh (fire-and-forget) | — | — | N/A | Fire-and-forget — does not block UI |
| Engine steps 1–4 (serial) | ~150–400ms | 300ms (controller) | WATCH (est) | 4 sequential round-trips; cannot be parallelized |
| React Query staleTime alignment | 120s === engine TTL | — | ALIGNED | Both caches expire together; design intent confirmed |

---

## RENDER / HOOK CHURN

| Component / Hook | Evidence | Risk |
|---|---|---|
| `useIdentityResolutionEffect` re-fires on `[authLoading, user?.id]` | INFERRED — fires on auth state change and initial mount | LOW — expected; in-flight dedup + cache prevents repeated DB calls |
| `identityEngineQuery` refires when `staleTime` expires (120s) | INFERRED | LOW — React Query cache seeding by effect prevents duplicate resolution |
| Multiple queries (`useActorLinksQuery`, `useUserAppStateQuery`, `useUserAppPreferencesQuery`) share same `queryKey` | OBSERVED in `identityEngineQuery.js:38-49` | NONE — all share `identityEngineQueryKey`; single fetch, multiple `select` transforms |

---

## LOKI RUNTIME FINDINGS

---

### LOKI RUNTIME FINDING — LF-01

```text
LOKI RUNTIME FINDING
Finding ID:           LF-01
Location:             engines/identity/src/controller/resolveAuthenticatedContext.controller.js
                      state/identity/queries/identityEngineQuery.js
Application Scope:    VCSM + ENGINE
Runtime Risk Category: Cache bypass (dual-cache drift risk)
Evidence Type:        INFERRED
Observation Source:   Static analysis — two caches for the same data with independent invalidation paths
Confidence:           MEDIUM

Current runtime behavior:
  Two separate 120s caches hold the resolved engine context:
  1. _resultCache (engine in-memory Map, keyed by userId:appKey)
  2. React Query cache (identityEngineQueryKey, staleTime=120s)

  On actor switch, both caches should be invalidated. Code paths observed:
  - invalidateIdentityResultCache() — busts engine cache only
  - invalidateIdentityEngineQuery() — busts React Query cache only
  It cannot be confirmed from static analysis that both are always called together.

Runtime impact:
  If only one cache is busted after actor switch, the stale cache returns the old actor
  on the next read. The consequences depend on which component reads which cache.

Read Amplification:  N/A (cache concern, not read amplification)
Timing impact:       LOW — caches expire together naturally at 120s
Caller chain:        actor switch → invalidateIdentityResultCache + invalidateIdentityEngineQuery
Cache status:        POTENTIAL DRIFT — two independent caches, requires co-invalidation
Severity:            LOW
Recommended handoff: DEADPOOL (verify co-invalidation on actor switch path)
Rationale:           Dual-cache pattern is safe if both are always invalidated together.
                     Cannot confirm from static analysis alone.
```

---

### LOKI RUNTIME FINDING — LF-02

```text
LOKI RUNTIME FINDING
Finding ID:           LF-02
Location:             state/identity/identity.controller.js:267 (loadOwnedActorChoices)
Application Scope:    VCSM + ENGINE
Runtime Risk Category: Repeated auth/context resolution
Evidence Type:        INFERRED
Observation Source:   Static analysis — resolveAuthenticatedContext called without pre-resolved ctx
Confidence:           MEDIUM

Current runtime behavior:
  loadOwnedActorChoices() accepts an optional { ctx: preResolvedCtx } parameter.
  When called without pre-resolved ctx (ctx param absent or null), it calls
  resolveAuthenticatedContext({ appKey: 'vcsm', skipLoginRecord: true }) again.
  If the engine cache is warm, this is a cache hit and costs only 1 auth read.
  If the engine cache is cold (post-switch), this runs the full 8-step query.

Runtime impact:
  If the actor switcher calls loadOwnedActorChoices immediately after invalidating the
  engine cache (to show the available actor list), this triggers a full cold resolution.
  The actor switcher appears to use identityEngineQuery for available actors, which
  correctly passes pre-resolved ctx.

Read Amplification:  1× (warm) to 8–11× (cold)
Timing impact:       LOW (warm cache hit) to WATCH (cold post-switch)
Caller chain:        actor switcher → loadOwnedActorChoices → resolveAuthenticatedContext
Cache status:        ENGINE CACHE — HIT or MISS depending on call timing
Severity:            LOW
Recommended handoff: KRAVEN (monitor if actor switcher renders cold resolution on switch)
Rationale:           The pre-resolved ctx pattern exists precisely to avoid this. Callers
                     should always pass a pre-resolved ctx when available.
```

---

### LOKI RUNTIME FINDING — LF-03

```text
LOKI RUNTIME FINDING
Finding ID:           LF-03
Location:             Multiple files — see below
Application Scope:    VCSM + ENGINE
Runtime Risk Category: Logging — console.log in DEV-gated diagnostics
Evidence Type:        OBSERVED
Observation Source:   Direct code read
Confidence:           HIGH

Current runtime behavior:
  Several files use console.log / console.warn gated by import.meta.env.DEV.
  These include:

  a) state/identity/identity.controller.inflight.js:13
     console.log('[Identity] resolve count', { userId: userId?.slice(0, 8), resolveAttempt, count })
     — Tracks how many times resolveAuthenticatedContext is called per user per session

  b) state/identity/queries/identityEngineQuery.js:15
     console.log("[Query:identity-engine] resolve count", { userId, count })
     — Tracks React Query engine resolutions

  c) state/identity/useIdentityResolutionEffect.hook.js:139
     console.log("[IdentityApp] COMMIT_ATTEMPT", { ... })
     — Logs identity commit decision with actorId, kind, source

  d) state/identity/identity.controller.js:34,44,167,175,290
     console.warn for realm read failures, actor choices failure

  e) engines/identity/src/controller/resolveAuthenticatedContext.controller.js:79
     console.log('[IdentityEngine] step [status]') — every engine step

  All are DEV-only. None expose auth tokens, passwords, or raw session payloads.
  userId values are sliced to first 8 chars or omitted. actorId sliced at 8 chars.

Runtime impact:
  Zero production impact — all gated. DEV diagnostic value is HIGH (resolve counters
  are the primary tool for detecting identity re-resolution churn).

  Per debug logging feedback contract: debug output must render on screen, not console.
  The identity debugger panel (state/identity/IdentityDebugger.jsx) handles
  debugLoginEvent/debugLoginError output. The console.log calls (a-d) bypass the panel.

Timing impact:       NONE in production. Negligible in DEV.
Cache status:        N/A
Severity:            LOW
Recommended handoff: LOGAN (add to RISK-10 open items — debug logging contract)
Rationale:           These console.log calls are resolve-count diagnostics and commit
                     decision logs — valuable for debugging identity churn. They should
                     be routed to the identity debugger panel for screen-renderable output.
                     Items (a) and (b) are resolve counters — especially valuable since they
                     reveal whether the engine is being called more than expected per session.
```

---

### LOKI RUNTIME FINDING — LF-04

```text
LOKI RUNTIME FINDING
Finding ID:           LF-04
Location:             state/identity/useIdentityResolutionEffect.hook.js:255-261
Application Scope:    VCSM
Runtime Risk Category: Runtime failure visibility
Evidence Type:        OBSERVED
Observation Source:   Direct code read — catch block
Confidence:           HIGH

Current runtime behavior:
  The outer try/catch in useIdentityResolutionEffect:
    catch (error) {
      console.error("[Identity] failed to hydrate default identity", error);
      if (!cancelled) { commitIdentity(null); setLoading(false); }
    }

  This catch block uses console.error (NOT gated by DEV) and commits null identity.
  The debugLoginError function is NOT called here — the error bypasses the identity
  debugger panel entirely.

Runtime impact:
  If identity resolution fails catastrophically (DB down, RPC error, unexpected exception),
  the only observable signal is:
  1. console.error (visible in browser devtools, NOT in identity debugger)
  2. The user sees a logged-out / empty identity state (commitIdentity(null))
  3. NO debugLoginError event emitted — no screen-renderable error trace

  This is the most critical error path in the identity system and it has the lowest
  observability coverage.

Timing impact:       N/A
Cache status:        N/A
Severity:            MEDIUM
Recommended handoff: DEADPOOL (add debugLoginError to this catch block + route to identity panel)
Rationale:           The outer catch is a last-resort safety net. If it fires, the user loses
                     identity silently from the UI perspective. Adding a debugLoginError call
                     would make this failure visible in the identity debugger panel, which is
                     critical for debugging production-adjacent issues in development.
```

---

### LOKI RUNTIME FINDING — LF-05

```text
LOKI RUNTIME FINDING
Finding ID:           LF-05
Location:             state/identity/identity.controller.js — all resolveAuthenticatedContext call sites
Application Scope:    VCSM + ENGINE
Runtime Risk Category: Repeated auth/context resolution
Evidence Type:        OBSERVED
Observation Source:   Direct code read — skipLoginRecord: true on all VCSM call sites
Confidence:           HIGH

Current runtime behavior:
  Every call to resolveAuthenticatedContext from VCSM uses skipLoginRecord: true:
  - _loadDefaultIdentityForUserInner:   skipLoginRecord: true
  - identityEngineQuery.js:             skipLoginRecord: true
  - loadOwnedActorChoices:              skipLoginRecord: true (implicit default)

  The engine's skipLoginRecord=true path skips dalRecordLogin(), which would write
  platform.user_app_state.last_login_at and .first_login_at.

  This means platform.user_app_state login timestamps are never updated by the VCSM
  frontend on session restore. The only write that creates this state is the
  provision_vcsm_identity RPC (SECURITY DEFINER) run during bootstrap.

Runtime impact:
  If last_login_at is used for session analytics, active user counts, or access
  decisions, these values will remain stale after the initial bootstrap.
  If provision_vcsm_identity sets last_login_at on first run, subsequent session
  restores will not update it.
  This may be intentional (avoid write noise on every page load) but it is undocumented.

Timing impact:       NONE — skipping a write is faster
Cache status:        N/A
Severity:            LOW
Recommended handoff: DB (verify if last_login_at / first_login_at are used anywhere;
                     document the intentional skip if confirmed)
Rationale:           The engine comment says skipLoginRecord is for "public-page bootstrap"
                     paths. VCSM's primary auth path uses it on all resolutions —
                     session-restore behavior, not just public bootstrap. Needs documentation
                     of whether login tracking is handled elsewhere (e.g. analytics hook).
```

---

### LOKI RUNTIME FINDING — LF-06

```text
LOKI RUNTIME FINDING
Finding ID:           LF-06
Location:             state/identity/useIdentityResolutionEffect.hook.js
                      state/identity/identity.controller.js
Application Scope:    VCSM + ENGINE
Runtime Risk Category: Serial bottleneck
Evidence Type:        INFERRED
Observation Source:   Static analysis of engine execution order in resolveAuthenticatedContext
Confidence:           HIGH

Current runtime behavior:
  The engine runs steps 1–4 in series (auth → app → access → account).
  This is a 4-hop serial waterfall of DB reads before any actor data is loaded.
  Steps 5a/5b (state + prefs) are parallelized via Promise.all — GOOD.
  Step 6 (actor links via VCSM resolver) must await step 4 for userAppAccountId.

  Estimated worst-case timing:
  Step 1: auth.getUser()           ~20–50ms
  Step 2: platform.apps            ~30–80ms
  Step 3: platform.user_app_access ~30–80ms
  Step 4: platform.v_user_app_context ~30–80ms
  Steps 5a+5b parallel: ~30–80ms
  Step 6: platform.user_app_actor_links ~30–80ms
  Steps 7–8: in-memory             ~1ms
  Hydration (vc.actors): ~30–80ms
  ──────────────────────────────────
  Total cold: ~200–530ms (PASS for 1500ms route load budget)

Runtime impact:
  The serial waterfall (steps 1–4) is architecturally necessary — each step depends
  on the previous result. The 120s engine cache means this path runs at most once
  per 2 minutes per user session. On first auth after cache expiry, the user may
  notice ~200–500ms delay before content renders.

Read Amplification:  8–11× (cold), 1× (warm)
Timing impact:       WATCH on cold cache (est. 200–530ms); HEALTHY on warm (est. 20–50ms)
Cache status:        HIT most of the time; MISS once per 120s
Severity:            LOW (cache makes warm path negligible)
Recommended handoff: KRAVEN (if live timing measurements exceed 500ms cold load budget)
Rationale:           The serial waterfall is unavoidable due to data dependencies.
                     The real mitigation is the engine cache — 120s TTL means this path
                     is only cold once per user per 2 minutes. If cache expiry causes
                     noticeable UI jank at the 120s mark, the TTL should be extended.
```

---

## OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Normal auth flow | STRONG | `console.log` resolve counters bypass identity panel | LOW |
| Self-heal flow | FUNCTIONAL | No correlation ID between initial fail and self-heal succeed | LOW |
| Bootstrap (onboarding) | FUNCTIONAL | `completeOnboardingController` has no structured logging | LOW |
| Outer catch block (catastrophic failure) | MINIMAL | `console.error` only — not routed to identity panel | MEDIUM |
| Engine step timing | BASIC | Per-step timing not exposed to app layer | LOW |
| Cache hit/miss | BASIC | `[IdentityEngine] CACHE_HIT` logged to console only (DEV) | LOW |
| Actor switch co-invalidation | UNKNOWN | Cannot confirm both caches busted together | LOW |
| Directory refresh caller tracking | MINIMAL | No logging in refreshActorDirectory.dal.js on success path | LOW |

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Identity resolution failure (outer catch) | console.error only | debugLoginError not called; identity panel blind | MEDIUM | Add `debugLoginError('IDENTITY_HYDRATION_FATAL', error, {...})` before commitIdentity(null) in outer catch |
| Engine resolve count | console.log in DEV | Not routed to screen-renderable panel | LOW | Route `_identityResolveCounts` output through `debugLoginEvent` |
| React Query engine resolve count | console.log in DEV | Not routed to screen-renderable panel | LOW | Route `_identityEngineQueryResolveCounts` through `debugLoginEvent` |
| Cache hit/miss | console.log DEV | Not visible outside devtools | LOW | Add `debugLoginEvent('ENGINE_CACHE_HIT', {...})` on cache hit (engine) |
| Actor switch co-invalidation | Not observed | Cannot confirm | LOW | Needs live runtime trace (LOKI next pass with instrumentation) |
| Directory refresh success | No log on success | Silent success — impossible to confirm in debug session | LOW | Add trace call on successful RPC return in `refreshActorDirectoryRow` |

---

## INSTRUMENTATION RECOMMENDATIONS

```text
INSTRUMENTATION RECOMMENDATION — IR-01
Location:       state/identity/useIdentityResolutionEffect.hook.js:255
Purpose:        Route catastrophic resolution failure to identity debugger panel
Suggested signal:
  catch (error) {
    debugLoginError('IDENTITY_HYDRATION_FATAL', error, {
      phase: 'identity', payload: { userId: user?.id ?? null }
    });
    if (!cancelled) { commitIdentity(null); setLoading(false); }
  }
Log level:      ERROR
Production-safe: YES (debugLoginError is dev-only via @debuggers/identity)
Dev-only:       YES (debug reporters are no-ops in production via Vite config)
Recommended owner: state/identity/ feature owner
```

```text
INSTRUMENTATION RECOMMENDATION — IR-02
Location:       state/identity/identity.controller.inflight.js:13
                state/identity/queries/identityEngineQuery.js:15
Purpose:        Route resolve-count diagnostics from console.log to screen-renderable panel
Suggested signal:
  Replace console.log('[Identity] resolve count', ...) with
  debugLoginEvent('ENGINE_RESOLVE_COUNT', { phase: 'engine', payload: { userId: ..., count, resolveAttempt } })
Log level:      INFO
Production-safe: YES
Dev-only:       YES
Recommended owner: state/identity/ feature owner
```

```text
INSTRUMENTATION RECOMMENDATION — IR-03
Location:       features/identity/dal/refreshActorDirectory.dal.js
Purpose:        Add success trace for director refresh (currently only warns on failure)
Suggested signal:
  On successful RPC return, call trace?.report?.() or add a DEV console.log
  to confirm the refresh completed — useful for debugging post-mutation state
Log level:      DEBUG
Production-safe: YES
Dev-only:       YES
Recommended owner: features/identity/ feature owner
```

---

## AUDIT TRAIL WARNINGS

```text
AUDIT TRAIL WARNING — AT-01
Flow:           Platform identity provisioning (provision_vcsm_identity SECURITY DEFINER)
Missing audit evidence:
  The SECURITY DEFINER RPC runs with elevated privileges and writes 6 platform rows atomically.
  No audit trail event is emitted after the RPC completes successfully. There is no durable log
  of when a user was provisioned, from what path, or how many times.
Operational risk:
  If a user reports identity provisioning failure, there is no way to reconstruct
  whether provision_vcsm_identity was called, when, or what it returned.
Recommended audit event:
  debugLoginEvent('PLATFORM_BOOTSTRAP_COMPLETE', { phase: 'bootstrap', status: 'success',
  payload: { userId, actorId, userAppAccountId } }) after ensureVcsmPlatformBootstrap returns ok:true
```

```text
AUDIT TRAIL WARNING — AT-02
Flow:           Identity self-heal (bootstrapIdentitySelfHeal)
Missing audit evidence:
  The self-heal path has good event coverage via debugLoginEvent (SELF_HEAL_START, SELF_HEAL_SUCCESS).
  However, there is no durable record of:
  - how many users have gone through self-heal in production
  - whether self-heal was triggered by a missing bootstrap (normal) vs an error (regression)
Operational risk: MEDIUM — self-heal masks bootstrap failures; silent production failures possible
Recommended audit event:
  Vision analytics event: 'identity_self_heal_triggered' with { userId_hash, trigger_reason } for
  production tracking (screen-safe — no PII)
```

---

## CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Normal auth resolution | Partial — `resolveAttempt` string only | LOW | No traceId linking auth session → engine → hydration |
| Self-heal flow | None — events are standalone | LOW | Add a self-heal correlationId to link SELF_HEAL_START → SELF_HEAL_SUCCESS → FINALIZE |
| Bootstrap (onboarding) | None | LOW | Not needed — one-time write path |
| Directory refresh | None | LOW | Fire-and-forget pattern means correlation is optional |

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LF-01 (dual cache drift) | DEADPOOL | Verify actor switch co-invalidates both caches |
| LF-02 (loadOwnedActorChoices cold resolution) | KRAVEN | Monitor if actor switcher triggers cold re-resolution |
| LF-03 (console.log bypass) | LOGAN | Add to RISK-10 open items per debug logging contract |
| LF-04 (outer catch no panel routing) | DEADPOOL | Highest priority — catastrophic failure path is blind |
| LF-05 (skipLoginRecord on all paths) | DB | Verify last_login_at usage and document intentional skip |
| LF-06 (serial waterfall) | KRAVEN | Monitor cold-cache timing; extend TTL if 120s expiry causes jank |
| AT-01 (no provision audit trail) | VENOM | Security DEFINER audit trail |
| AT-02 (self-heal production tracking) | VISION | Analytics event for self-heal rate monitoring |
| IR-01 (outer catch instrumentation) | DEADPOOL | Add debugLoginError to outer catch |
| IR-02 (resolve count panel routing) | Feature owner | Route console.log to identity panel |

---

## OBSERVABILITY MATURITY

**FUNCTIONAL** → approaching **STRONG**

The identity flows have well-structured event coverage via `debugLoginEvent` / `debugLoginError` / `debugLoginIdentitySnapshot`. Performance timing is captured (`performance.now()` at engine entry, `resolveMs` logged). Resolve-count diagnostics exist in the in-flight controller and engine query. The identity debugger panel is correctly wired via `@debuggers/identity`.

Gaps preventing STRONG:
1. Outer catch block routes to `console.error` instead of identity panel (LF-04)
2. Resolve-count diagnostics go to `console.log` instead of panel (LF-03)
3. No self-heal correlation ID
4. No success trace for directory refresh (silent on success)

---

## FINAL LOKI STATUS

**WATCH**

No CRITICAL or HIGH severity runtime findings. All identity flows are structurally sound:
- RISK-1 and RISK-2 adapter boundary fixes are confirmed operative at runtime level
- Three-layer dedup system (in-flight + engine cache + React Query) prevents read churn
- Self-heal path correctly handles new-user bootstrap
- Serial waterfall is unavoidable and well-cached
- Directory refresh correctly awaits on vport create, fire-and-forget on update

Primary concerns are observability gaps (LF-04 is the most actionable — outer catch needs `debugLoginError`) and dual-cache co-invalidation (LF-01 requires live trace to confirm). No release-blocking findings.
