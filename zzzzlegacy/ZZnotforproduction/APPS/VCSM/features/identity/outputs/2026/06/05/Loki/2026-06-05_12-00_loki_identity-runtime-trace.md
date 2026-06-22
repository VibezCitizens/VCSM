# LOKI Runtime Report — identity

**Application Scope:** VCSM
**Observed flow:** Login identity resolution + self-heal + actor switch + directory refresh
**Entry point:** IdentityProvider → useIdentityResolutionEffect (auth-path bootstrap)
**Environment:** Source-level trace (INFERRED — no live runtime instrumentation)
**TypeScript output allowed:** NO

---

## ARCHITECT Artifact Completeness Check

| Artifact | Required Content | Status | Result |
|---|---|---|---|
| `feature-map.md` | Module + layer inventory | MISSING as separate file — ARCHITECTURE.md + INDEX.md used (ARCHITECTURE-MD-FALLBACK, per chain precedent) | WARN — proceed |
| `database-read-map.md` | DAL read inventory and patterns | MISSING — INDEX.md write-surface-map available; read paths INFERRED from source | WARN — LOKI PARTIAL mode |

```
LOKI PARTIAL
Reason: ARCHITECT_ARTIFACT_INCOMPLETE
Artifact: database-read-map.md
Status: MISSING
Mode: Proceeding without DAL read baseline. Step 5 duplicate-read detection is INFERRED evidence only.
```

Module inventory from ARCHITECTURE.md + INDEX.md:
- Controllers: 2 (`ensureVcsmPlatformBootstrap`, `refreshActorDirectory` re-export)
- DAL files: 3 (`provision.rpc.dal.js`, `refreshActorDirectory.dal.js` × 2 exports)
- Hooks: 1 (`useIdentityOps.js`)
- Adapters: 2 (`identity.adapter.js`, `identityOps.adapter.js`)
- State: `identityContext.jsx`, `useIdentityResolutionEffect.hook.js`, `identitySelfHeal.controller.js`, `identity.controller.js`
- Routes: 0 (ARCHITECT EXPLICIT_NONE)
- Write surfaces: 2 RPCs (`platform.provision_vcsm_identity`, `identity.refresh_actor_directory_row`)

---

## LOKI TARGET

```
LOKI TARGET
Observed flow:    identity resolution — login path, self-heal path, actor switch, directory refresh
Application Scope: VCSM
Entry point:      IdentityProvider (identityContext.jsx) → useIdentityResolutionEffect
Reason for observation: Blue team chain runtime trace — observability governance review
ARCHITECT feature-map loaded: ZZnotforproduction/APPS/VCSM/features/identity/ARCHITECTURE.md (2026-06-04)
ARCHITECT database-read-map loaded: MISSING (LOKI PARTIAL — read paths INFERRED from source)
TypeScript output allowed: NO
```

---

## TRACE IDENTITY

```
TRACE IDENTITY
Trace ID:      LOKI-IDENT-2026-06-05
Route:         N/A — no route entry point; identity loads on every authenticated session
Screen:        All authenticated screens (identity runs at IdentityProvider level)
Session state class: authenticated (post-login, pre-identity-committed)
Timestamp:     2026-06-05T12:00:00Z
```

---

## RUNTIME SUMMARY

```
RUNTIME SUMMARY
Total duration:           INFERRED — happy path ~200–600ms; self-heal path ~400ms–1200ms+
Primary records returned: 1 identity record (actorId + kind + profile fields)
Total DB reads (happy path): 2–4 INFERRED (platform.user_app_actor_links + vc.actors + engine deps)
Total DB reads (self-heal path): 5–9 INFERRED (doubles initial reads + provision RPC + finalize writes)
Read Amplification Score: SELF-HEAL = 2.0×–2.5× vs happy path
Worst bottleneck:         Serial waterfall — all identity resolution steps await sequentially
Cache behavior summary:   Engine 120s result cache + React Query identity engine cache
                          Actor switch invalidates React Query only (engine cache NOT cleared)
                          Self-heal: zero cache benefit — both loadDefaultIdentityForUser calls are cache-misses
```

---

## EXECUTION FLOW MAP

### Flow A — Happy Path (existing user, platform rows present)

| Step | Operation | Caller | Duration | Mode |
|---|---|---|---|---|
| 1 | Effect fires on `[authLoading, user?.id]` | useIdentityResolutionEffect | ~0ms | SERIAL |
| 2 | `loadDefaultIdentityForUser({ userId, savedActorId, resolveAttempt: 'initial' })` | hook:58 | ~150–400ms | SERIAL |
| 2a | `resolveAuthenticatedContext({ appKey: 'vcsm' })` → `platform.user_app_actor_links` READ | identity.controller.js | ~80–200ms | SERIAL |
| 2b | `hydrateIdentityActor(actorRow)` → `vc.actors` READ | identity.controller.js | ~50–150ms | SERIAL |
| 2c | `_engineMeta` attached (userId, userAppAccountId, actorLinkId) | identity.controller.js | ~0ms | SYNC |
| 3 | Version stale check (`resolveVersionRef`) | hook:126 | ~0ms | SYNC |
| 4 | Cross-user guard check (`identityUserId`) | hook:152 | ~0ms | SYNC |
| 5 | `commitIdentity(nextDetails)` → `upsertActors` | identityContext.jsx:40 | ~5–20ms | SYNC |
| 6 | `queryClient.setQueryData` — seed RQ cache | hook:229 | ~0ms | SYNC |
| 7 | `setLoading(false)` | hook:223 | ~0ms | SYNC |

**Total estimated: ~200–600ms | Mode: SERIAL | DB reads: 2–4**

---

### Flow B — Self-Heal Path (new user or missing platform rows)

| Step | Operation | Caller | Duration | Mode |
|---|---|---|---|---|
| 1–2c | Same as Flow A steps 1–2c | hook | ~150–400ms | SERIAL |
| 3 | `loadDefaultIdentityForUser` returns null | hook:89 | — | — |
| 4 | `findSelfHealActorForUser(user.id)` → `readUserActorByProfileIdDAL` → `vc.actors WHERE profile_id=userId` READ | identitySelfHeal.controller.js:8 | ~50–150ms | SERIAL |
| 5 | `bootstrapIdentitySelfHeal({ userId, actorId })` → `dalProvisionVcsmIdentity` → `provision_vcsm_identity` RPC WRITE | identitySelfHeal.controller.js:13 | ~100–300ms | SERIAL |
| 6 | `loadDefaultIdentityForUser({ ..., resolveAttempt: 'retry_after_self_heal' })` — SECOND FULL CALL | hook:116 | ~150–400ms | SERIAL |
| 6a | `resolveAuthenticatedContext` → `platform.user_app_actor_links` READ (2nd time) | identity.controller.js | ~80–200ms | SERIAL |
| 6b | `hydrateIdentityActor` → `vc.actors` READ (2nd time) | identity.controller.js | ~50–150ms | SERIAL |
| 7 | `runFinalizeSelfHeal({ nextIdentity })` → `engineSwitchActiveActor` WRITE + `finalizeAccountState` WRITE | helper | ~100–250ms | SERIAL |
| 8 | `commitIdentity` | identityContext.jsx | ~5–20ms | SYNC |

**Total estimated: ~600ms–1600ms | Mode: SERIAL WATERFALL | DB reads: 5–9**
**Read amplification: ~2.0×–2.5× vs happy path — no caching benefit between calls**

---

### Flow C — Actor Switch

| Step | Operation | Caller | Duration | Mode |
|---|---|---|---|---|
| 1 | `switchActor(actorId)` called | identityContext.jsx:68 | — | — |
| 2 | `engineQuery.data ?? getIdentityEngineContext(identityDetails)` — ctx resolution | identityContext.jsx:72 | ~0ms (cache hit INFERRED) | SYNC |
| 3 | `switchActorController({ actorId, ctx })` | identityContext.jsx:74 | — | SERIAL |
| 3a | `ctx.availableActors.find(a => a.actorId === actorId)` — ownership gate | switchActor.controller.js:84 | ~0ms | SYNC |
| 3b | `engineSwitchActiveActor({ userAppAccountId, actorLinkId })` WRITE | switchActor.controller.js:127 | ~80–200ms | SERIAL |
| 3c | `loadIdentityForActorId(actorId)` READ (no _engineMeta attached) | switchActor.controller.js:151 | ~50–150ms | SERIAL |
| 4 | `saveIdentity(actorId, user?.id)` → localStorage | identityContext.jsx:90 | ~0ms | SYNC |
| 5 | `commitIdentity(result.nextIdentity)` → `upsertActors` | identityContext.jsx:91 | ~5ms | SYNC |
| 6 | `invalidateIdentityEngineQuery(queryClient, user?.id)` — RQ cache only | identityContext.jsx:92 | ~0ms | SYNC |
| 7 | `purgeChatMessageCache()` + `purgeNotificationCache()` | identityContext.jsx:93-94 | ~0ms | SYNC |

**Total estimated: ~150–400ms | Mode: SERIAL | DB reads: 2–3**
**⚠ Engine 120s internal cache NOT cleared — only RQ cache invalidated**

---

### Flow D — Directory Refresh (fire-and-forget)

| Step | Operation | Caller | Duration | Mode |
|---|---|---|---|---|
| 1 | `refreshVcActorDirectory(actorId)` called post-mutation | consuming feature | — | ASYNC (fire-and-forget) |
| 2 | `refreshActorDirectoryRow('vc', actorId)` | refreshActorDirectory.dal.js:59 | — | — |
| 3 | `supabase.rpc('refresh_actor_directory_row', ...)` WRITE | dal:31-37 | ~80–200ms | ASYNC |
| 4 | Return `{ ok: boolean }` — caller discards | — | ~0ms | SYNC |

**Total estimated: ~80–200ms | Mode: FIRE-AND-FORGET | Caller has zero visibility into result**

---

## DATABASE READ SUMMARY

| Table/View/RPC | Operation | Estimated Count (Happy) | Estimated Count (Self-Heal) | Notes |
|---|---|---|---|---|
| `platform.user_app_actor_links` | SELECT | 1 | 2 | Called in both loadDefaultIdentityForUser invocations during self-heal |
| `vc.actors` | SELECT | 1–2 | 2–4 | hydrateIdentityActor + findSelfHealActorForUser + second resolution |
| `platform.provision_vcsm_identity` | RPC WRITE | 0 | 1 | Only in self-heal path |
| `identity.refresh_actor_directory_row` | RPC WRITE | 0 | 1 | Only in finalizeSelfHeal via runFinalizeSelfHeal |
| `platform.user_app_state` / `platform.user_app_preferences` | READ (via engine resolver — INFERRED) | 1 each INFERRED | 2 each INFERRED | Engine resolver likely reads these; unconfirmed without engine source |

---

## DUPLICATE QUERY FINGERPRINTS

| Fingerprint | Count (Self-Heal) | Caller Chains | Impact |
|---|---|---|---|
| `platform.user_app_actor_links WHERE user_app_account_id=X AND actor_source='vc' AND status='active'` | 2 | hook:58 (initial) → hook:116 (retry_after_self_heal) | Unavoidable by design; but timing gap between calls is unmeasured |
| `vc.actors WHERE id=actorId` | 2 | hydrateIdentityActor (×2) | Same actor read twice; no cache between calls in self-heal path |

---

## TIMING BUDGET STATUS

| Runtime Area | Observed (INFERRED) | Budget | Status |
|---|---|---|---|
| Happy path total (login) | ~200–600ms | 1500ms (screen load) | PASS |
| Self-heal path total | ~600ms–1600ms | 1500ms | WARN (may exceed on slow connection) |
| Controller orchestration | ~150–400ms | 300ms | WARN (serial waterfall; exceeds on slow DB) |
| DAL total (happy path) | ~130–350ms | 500ms | PASS |
| Single DB read (worst) | ~80–200ms | 150ms | WARN (individual reads may exceed on cold start) |
| Actor switch | ~150–400ms | 300ms | PASS–WARN |
| Directory refresh | ~80–200ms | 150ms | PASS–WARN |

---

## CACHE OBSERVATIONS

```
CACHE OBSERVATION
Cache:    Engine internal result cache (120s TTL, in-memory)
Caller:   loadDefaultIdentityForUser → identity engine resolver
Status:   HIT on re-login within 120s; MISS on first login and after TTL
Evidence: VEN-IDENTITY-004 (VENOM); engine configureIdentityEngine sets 120s cache
Impact:   Self-heal path bypasses cache (initial call returns null; retry also MISS because rows were just created)
          Actor switch: engine cache NOT invalidated post-switch — risk of stale pre-switch ctx on next resolve

CACHE OBSERVATION
Cache:    React Query identity engine cache (identityEngineQueryKey)
Caller:   useIdentityEngineQuery + queryClient.setQueryData
Status:   HIT after first resolution; INVALIDATED on actor switch and refreshAvailableActors
Evidence: identityContext.jsx:229 (seed post-resolution), :92 (invalidate post-switch)
Impact:   Correctly invalidated on switch; but engine internal cache is NOT co-invalidated

CACHE OBSERVATION
Cache:    localStorage actorId (identityStorage.js)
Caller:   loadIdentity(user.id) read in useIdentityResolutionEffect; saveIdentity on switch
Status:   HIT on refresh; actorId persisted across page reloads
Evidence: identityStorage.js — stores actorId scoped by userId
Impact:   Safe — actorId only; no PII stored; correctly scoped to userId
```

---

## RENDER / HOOK CHURN

| Component/Hook | Render Count | Effect Count | Query Impact | Likely Trigger |
|---|---|---|---|---|
| `IdentityProvider` | N/A (provider) | 1 per `[authLoading, user?.id]` change | Full identity resolution on each fire | Auth state change, page refresh |
| `useIdentityResolutionEffect` | — | 1 per trigger | loadDefaultIdentityForUser → 2–4 DB reads | user?.id change; authLoading toggle |
| `switchActor` | — | Not an effect | 2–3 DB reads + 2 cache purges | Explicit user action |
| `blockedVport auto-switch` useEffect | — | 1 per blockedVport change | Triggers switchActor cascade | Vport blocked detection |

**Churn risk:** `blockedVport` auto-switch (identityContext.jsx:152–157) — if `isBlockedVportIdentity(identityDetails)` toggles rapidly, the auto-switch effect fires repeatedly, triggering a full switchActor chain per toggle. No debounce present.

---

## LOKI RUNTIME FINDINGS

---

```
LOKI RUNTIME FINDING
- Finding ID:           LOKI-IDENT-001
- Location:             apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js
                        apps/VCSM/src/features/identity/hooks/useIdentityOps.js
- Application Scope:    VCSM
- Runtime Risk Category: Observability gap — fire-and-forget with zero caller-site visibility
- Evidence Type:        INFERRED
- Observation Source:   Source trace (refreshActorDirectory.dal.js:59, identityContext.jsx)
- Confidence:           HIGH
- Current runtime behavior:
    refreshVcActorDirectory(actorId) is called fire-and-forget by consuming features after
    profile/vport mutations. The DAL logs failure via debugLoginError but returns { ok, error }.
    Callers discard the return value — the caller has zero runtime visibility into whether
    the directory refresh succeeded or failed.
- Runtime impact:
    actor_directory row may be silently stale after any profile or vport mutation. No user-visible
    signal, no metric, no alert. Incident reconstruction is impossible at the caller level.
- Read Amplification:   N/A (write surface)
- Timing impact:        80–200ms added to post-mutation flow; invisible to performance tracing
- Caller chain:         consuming feature → useIdentityOps() → refreshVcActorDirectory → DAL → RPC
- Cache status:         N/A (write; no cache involved)
- Severity:             HIGH
- Recommended handoff:  VENOM (ownership/auth design), LOKI (instrumentation advisory below)
- Rationale:
    Auth-critical operation (actor identity directory freshness) has no call-site observability.
    A silent failure leaves the platform in a degraded state with no observable signal.
    Relates to HW-IDENT-002 (HAWKEYE) and VEN-IDENTITY-007/BW-IDENT-007 (ownership gap).
```

---

```
LOKI RUNTIME FINDING
- Finding ID:           LOKI-IDENT-002
- Location:             apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js:58 + 116
- Application Scope:    VCSM
- Runtime Risk Category: Duplicate read — double resolution call in self-heal path
- Evidence Type:        INFERRED
- Observation Source:   Source trace (hook.js:58 initial + hook.js:116 retry_after_self_heal)
- Confidence:           HIGH
- Current runtime behavior:
    On self-heal path: loadDefaultIdentityForUser is called twice in the same effect run.
    First call (line 58) returns null → self-heal branch executes →
    Second call (line 116) resolves with the newly provisioned identity.
    Each call independently executes resolveAuthenticatedContext + hydrateIdentityActor.
    No caching between the two calls — both are full DB round-trips.
- Runtime impact:
    2× DB reads on every self-heal invocation (first-time users, misconfigured users,
    revoked-then-re-provisioned users per ELEK-001). On slow connections, total latency
    may exceed 1.5s for the self-heal path alone.
- Read Amplification:   2.0×–2.5× vs happy path
- Timing impact:        +150–400ms on top of already-serial waterfall
- Caller chain:         hook:58 (initial, null result) → hook:89 (self-heal branch) → hook:116 (retry)
- Cache status:         MISS for both calls (first: rows don't exist; second: just provisioned, no cache populated)
- Severity:             MEDIUM
- Recommended handoff:  KRAVEN (performance optimization — consider batching or passing bootstrap result)
- Rationale:
    By design — the retry is necessary because rows don't exist on the first call.
    However, total self-heal latency is uninstrumented. A future optimization could pass
    the newly provisioned userAppAccountId from bootstrapIdentitySelfHeal directly to
    the identity hydration step, avoiding the second full DB round-trip.
```

---

```
LOKI RUNTIME FINDING
- Finding ID:           LOKI-IDENT-003
- Location:             apps/VCSM/src/state/identity/identityContext.jsx:68–95 (switchActor)
                        apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js:227 (queryClient.setQueryData)
- Application Scope:    VCSM
- Runtime Risk Category: Cache bypass — engine internal cache NOT cleared on actor switch
- Evidence Type:        INFERRED
- Observation Source:   Source trace (identityContext.jsx:92 invalidateIdentityEngineQuery)
- Confidence:           MEDIUM
- Current runtime behavior:
    switchActor calls:
      invalidateIdentityEngineQuery(queryClient, user?.id)  ← React Query cache cleared ✅
    switchActor does NOT call:
      invalidateIdentityResultCache()  ← engine internal 120s cache NOT cleared ❌
    invalidateIdentityResultCache() is only called in refreshAvailableActors().
    The engine internal cache TTL is 120s. If any code path re-triggers
    loadDefaultIdentityForUser within 120s after a switch, the engine may return the
    pre-switch cached context.
- Runtime impact:
    MEDIUM: useIdentityResolutionEffect only fires on [authLoading, user?.id] changes —
    user?.id does not change on actor switch, so the resolution effect does not re-fire.
    The risk is narrow but real: if a page reload occurs within 120s of a switch, the
    engine cache returns the old context and the React Query seed (setQueryData) would
    overwrite with stale data.
- Read Amplification:   N/A (cache bypass — affects correctness, not amplification)
- Timing impact:        None direct — cached call is faster; correctness risk is the concern
- Caller chain:         switchActor → invalidateIdentityEngineQuery (RQ only) → engine cache stale
- Cache status:         STALE (engine internal) after actor switch
- Severity:             MEDIUM
- Recommended handoff:  VENOM (identity correctness), DEADPOOL (if stale actor is reported in prod)
- Rationale:
    Page reload within 120s of a switch restores old actor from engine cache.
    Unlikely but not impossible. Fix: call invalidateIdentityResultCache() in switchActor
    alongside invalidateIdentityEngineQuery.
```

---

```
LOKI RUNTIME FINDING
- Finding ID:           LOKI-IDENT-004
- Location:             apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js:87–123 (self-heal block)
- Application Scope:    VCSM
- Runtime Risk Category: Observability gap — self-heal phases unmeasured
- Evidence Type:        INFERRED
- Observation Source:   Source trace (hook.js:57 t0/resolveMs for initial; no timing for self-heal phases)
- Confidence:           HIGH
- Current runtime behavior:
    Initial loadDefaultIdentityForUser is timed (t0 / resolveMs at line 63).
    bootstrapIdentitySelfHeal call has no timing wrapper.
    Second loadDefaultIdentityForUser (retry_after_self_heal) has no timing wrapper.
    runFinalizeSelfHeal has no timing wrapper.
    Total self-heal path duration: unmeasured. SELF_HEAL_SUCCESS event logs no duration.
- Runtime impact:
    Impossible to attribute login latency on the self-heal path. If a new user
    consistently takes 1.5s+ to load due to self-heal overhead, there is no signal
    to detect or diagnose this in production.
- Timing impact:        +400ms–1200ms on self-heal path; entirely invisible to observability
- Caller chain:         hook:89 → bootstrapIdentitySelfHeal → loadDefaultIdentityForUser (retry)
- Cache status:         N/A
- Severity:             MEDIUM
- Recommended handoff:  LOGAN (update BEHAVIOR.md §4 timing contract), instrumentation advisory below
- Rationale:
    Auth-critical path latency is unmeasured. Instrumentation recommendation provided.
```

---

```
LOKI RUNTIME FINDING
- Finding ID:           LOKI-IDENT-005
- Location:             apps/VCSM/src/state/identity/identityContext.jsx:152–157 (blockedVport auto-switch)
- Application Scope:    VCSM
- Runtime Risk Category: Render loop risk — auto-switch effect with no debounce
- Evidence Type:        INFERRED
- Observation Source:   Source trace (identityContext.jsx:149 isBlockedVportIdentity check)
- Confidence:           LOW (hypothetical — requires rapid blockedVport toggle)
- Current runtime behavior:
    useEffect fires when blockedVport changes. It calls switchActor(citizenActor.actorId).
    switchActor is async and calls commitIdentity, which calls setIdentityDetails, which may
    change identityDetails, which may re-evaluate isBlockedVportIdentity.
    If isBlockedVportIdentity is non-deterministic or flickers (e.g., identityDetails briefly
    null during commit), the effect could re-fire, triggering another switchActor call.
    switchVersionRef provides a stale-check guard (mySwitchVersion vs current), which mitigates
    runaway loops — stale switch calls return early.
- Runtime impact:
    LOW under normal conditions (switchVersionRef guard prevents most cascade).
    Risk surfaces if isBlockedVportIdentity returns true on a partially-committed identity
    during a rapid switch cycle.
- Timing impact:        Potential extra switchActor calls; each ~150–400ms
- Caller chain:         useEffect([blockedVport]) → switchActor → commitIdentity → setIdentityDetails → re-evaluate blockedVport
- Cache status:         N/A
- Severity:             LOW
- Recommended handoff:  DEADPOOL (investigate if double-switch is observed in production)
- Rationale:
    switchVersionRef guard is the primary defense. Risk is LOW under observed code paths.
    Flag as WATCH for future refactors that modify commitIdentity timing.
```

---

```
LOKI RUNTIME FINDING
- Finding ID:           LOKI-IDENT-006
- Location:             apps/VCSM/src/features/identity/setup.js:20–45
- Application Scope:    VCSM
- Runtime Risk Category: Observability gap — engine setup failure unobservable
- Evidence Type:        INFERRED
- Observation Source:   Source trace (setup.js — no try/catch, no debug event for completion)
- Confidence:           HIGH
- Current runtime behavior:
    setupVcsmIdentityEngine() calls configureIdentityEngine() synchronously.
    No try/catch. No timing measurement. No debug event for setup completion or failure.
    If configureIdentityEngine throws, the error propagates uncaught from main.jsx.
- Runtime impact:
    Engine misconfiguration is silent until all identity resolution fails. No
    STARTUP_FAILED event, no timing signal. If this fails silently under a global error
    boundary, the root cause is invisible.
- Timing impact:        Unknown — sync call, but if configureIdentityEngine does async work, timing matters
- Severity:             LOW
- Recommended handoff:  Instrumentation advisory below
- Rationale:
    Auth bootstrap must be observable at startup. A try/catch + debug event provides
    minimum viable visibility. HAWKEYE HW-IDENT-005 cross-reference.
```

---

## OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Happy path login | STRONG — t0/resolveMs, IDENTITY_RESOLVED, LOGIN_FLOW_DONE | None major | LOW |
| Self-heal path | FUNCTIONAL — SELF_HEAL_START, SELF_HEAL_SUCCESS, SELF_HEAL_ERROR | Phase timing (bootstrap + retry duration), revoked-user detection signal | MEDIUM |
| Actor switch | FUNCTIONAL — identityContext debug events, SWITCH_REFRESH_RESTORE | Engine cache not invalidated (LOKI-003) | MEDIUM |
| Directory refresh (caller site) | BASIC — DAL logs failure | Call-site observability: ABSENT | HIGH |
| Engine startup | MINIMAL — no events | ENGINE_SETUP_COMPLETE, startup duration, error boundary | MEDIUM |
| Cross-user guard rejection | STRONG — IDENTITY_OWNERSHIP_MISMATCH event | — | LOW |
| Deleted account sentinel | STRONG — IDENTITY_DELETED_ACCOUNT event | No equivalent for revoked | MEDIUM |
| Version stale check | STRONG — IDENTITY_COMMIT_REJECTED_STALE | — | LOW |

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Self-heal total duration | SELF_HEAL_START/SUCCESS logged (no duration) | `selfHealDurationMs` in SELF_HEAL_SUCCESS payload | MEDIUM | Add `t0 = performance.now()` before bootstrapIdentitySelfHeal; log elapsed in SELF_HEAL_SUCCESS |
| Directory refresh call site | Failure logged in DAL only | `REFRESH_ACTOR_DIRECTORY_SUCCESS` event; caller-site log on failure | HIGH | Add result check at call site; log actorId + caller + ok status |
| Engine startup | No events | `ENGINE_SETUP_COMPLETE` + duration; `ENGINE_SETUP_FAILED` on throw | MEDIUM | Wrap configureIdentityEngine in try/catch; emit debug events |
| Revoked user detection | IDENTITY_RESOLVE_EMPTY + SELF_HEAL_START (misleading) | `IDENTITY_ACCESS_REVOKED` distinct event | HIGH | Add REVOKED_ACCOUNT_SENTINEL check (ELEK-001 patch) → logs distinct revoked event |
| Retry resolution (post-self-heal) | IDENTITY_RESOLVED emitted | No signal that this is a retry vs initial | LOW | Add `resolveAttempt` field to IDENTITY_RESOLVED payload (already available) |
| Actor switch cache invalidation | Not observable | `IDENTITY_ENGINE_CACHE_INVALIDATED` event | LOW | Log on invalidateIdentityEngineQuery call |

---

## AUDIT TRAIL WARNINGS

```
AUDIT TRAIL WARNING
Flow:                  platform.provision_vcsm_identity RPC call (self-heal path)
Missing audit evidence: No distinction between legitimate first-login bootstrap and
                        self-heal-triggered re-provision. A revoked user triggering
                        self-heal (ELEK-001) produces only SELF_HEAL_START/SUCCESS —
                        identical to a normal new-user self-heal. No audit signal captures
                        "provision called for user with pre-existing (revoked) access record."
Operational risk:       If revoked users re-provision via self-heal, the incident is
                        indistinguishable from normal bootstrap in any log or trace.
Recommended audit event: After ELEK-001 patch, emit AUTH_REVOKED_SELF_HEAL_BLOCKED event
                         when access status check fails in bootstrapIdentitySelfHeal.
                         Prior to patch, emit SELF_HEAL_PROVISION_FOR_EXISTING_USER warning
                         if provision RPC returns pre-existing account data.
```

```
AUDIT TRAIL WARNING
Flow:                  Actor switch (switchActor) — ownership gate
Missing audit evidence: switchActorController logs the switch attempt but not the
                        ownership gate result (availableActors check). If the gate fires
                        (linkNotFound=true), SWITCH_ABORT is returned but no separate
                        OWNERSHIP_GATE_REJECTED event is emitted.
Operational risk:       MEDIUM — ownership gate rejections are not auditable after the fact.
Recommended audit event: Add ACTOR_SWITCH_OWNERSHIP_GATE_REJECTED event when
                         linkNotFound=true in switchActorController, including actorId
                         (first 8 chars) and entryPoint.
```

---

## INSTRUMENTATION RECOMMENDATIONS

```
INSTRUMENTATION RECOMMENDATION
Location:     apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js:98–113 (self-heal block)
Purpose:      Measure total self-heal path duration
Suggested signal:
  const selfHealT0 = performance.now()
  await bootstrapIdentitySelfHeal({ userId: user.id, actorId: vcActor.actorId })
  // ... retry call
  const selfHealMs = Math.round(performance.now() - selfHealT0)
  // In SELF_HEAL_SUCCESS:
  debugLoginEvent('SELF_HEAL_SUCCESS', {
    phase: 'heal', status: 'success',
    payload: { userId: user.id, actorId: vcActor.actorId,
               userAppAccountId: healResult?.userAppAccountId ?? null,
               selfHealDurationMs: selfHealMs }
  })
Log level:    DEBUG
Production-safe: YES (no PII; actorId first-8-chars pattern already established)
Dev-only:     NO (useful in production for latency tracing)
Recommended owner: Platform team
```

```
INSTRUMENTATION RECOMMENDATION
Location:     apps/VCSM/src/features/identity/setup.js:20–45 (setupVcsmIdentityEngine)
Purpose:      Observe engine startup completion and failure
Suggested signal:
  export function setupVcsmIdentityEngine() {
    if (_configured) return
    _configured = true
    const t0 = performance.now()
    try {
      configureIdentityEngine({ ... })
      debugLoginEvent('ENGINE_SETUP_COMPLETE', {
        phase: 'startup', status: 'success',
        payload: { durationMs: Math.round(performance.now() - t0) }
      })
    } catch (err) {
      debugLoginError('ENGINE_SETUP_FAILED', err, { phase: 'startup' })
      throw err  // re-throw — startup failure is fatal
    }
  }
Log level:    DEBUG
Production-safe: YES
Dev-only:     NO
Recommended owner: Platform team
```

```
INSTRUMENTATION RECOMMENDATION
Location:     Any call site of refreshVcActorDirectory(actorId)
Purpose:      Caller-site visibility into fire-and-forget refresh failure
Suggested signal:
  // In calling controller/hook (example pattern):
  const refreshResult = await refreshVcActorDirectory(actorId)
  if (!refreshResult.ok) {
    debugLoginError('ACTOR_DIRECTORY_REFRESH_FAILED_AT_CALLER', refreshResult.error, {
      phase: 'identity',
      payload: { actorId: actorId?.slice(0, 8) ?? null, callerContext: 'profile_edit' }
    })
  }
Log level:    WARN on failure
Production-safe: YES (actorId first-8-chars)
Dev-only:     NO
Recommended owner: Feature teams consuming useIdentityOps
```

---

## CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Login / identity resolution | Partial — `resolveVersion` (monotonic int) tracks stale commits | No cross-session trace ID | Add `resolveSessionId = crypto.randomUUID()` at effect start for incident correlation |
| Self-heal | None beyond userId | Impossible to correlate multi-step self-heal in logs | Add `selfHealCorrelationId` field across SELF_HEAL_START/SUCCESS/ERROR events |
| Actor switch | `entryPoint` field present in controller | No switch traceId | Acceptable — entryPoint provides context |
| Directory refresh | None | Caller correlation impossible | Pass `callerContext` string to refreshVcActorDirectory |

---

## SENTRY MONITORING GAP REVIEW

| Flow | Location | Current Behavior | Auto-Captured? | Missing Signal | Severity | Recommendation |
|---|---|---|---|---|---|---|
| self-heal provision failure | identitySelfHeal.controller.js + hook:109 | `SELF_HEAL_ERROR` debug event | Possibly (if global error boundary catches) | Explicit Sentry capture | HIGH | `Sentry.captureException(healErr, { tags: { flow: 'self_heal', userId: user.id.slice(0,8) } })` |
| engine setup failure | setup.js | Uncaught throw | Possibly (global boundary) | Explicit Sentry capture + context | MEDIUM | Wrap in try/catch; capture before re-throw |
| directory refresh RPC failure | refreshActorDirectory.dal.js:39 | `debugLoginError` only | NO (debugLoginError is dev-only) | Sentry capture for production | HIGH | `Sentry.captureException(error, { tags: { flow: 'actor_directory_refresh', actorId: actorId?.slice(0,8) } })` |
| cross-user identity rejection | useIdentityResolutionEffect:154 | `IDENTITY_OWNERSHIP_MISMATCH` debug event | NO | Sentry security alert | CRITICAL | `Sentry.captureMessage('IDENTITY_OWNERSHIP_MISMATCH', 'error', ...)` — this is a security signal |

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LOKI-IDENT-001 | VENOM + HAWKEYE re-verify | Fire-and-forget refresh is a trust boundary gap (ownership + observability) |
| LOKI-IDENT-002 | KRAVEN | Self-heal double-read optimization: bootstrap result could feed hydration directly |
| LOKI-IDENT-003 | VENOM + DEADPOOL | Engine cache stale post-switch: correctness issue if page reload within 120s |
| LOKI-IDENT-004 | LOGAN | Update BEHAVIOR.md §4 with self-heal timing contract |
| LOKI-IDENT-005 | DEADPOOL | Auto-switch render loop: investigate if double-switch observed in production |
| LOKI-IDENT-006 | Platform team (instrumentation) | Engine startup observability: immediate low-cost fix |
| Audit trail — provision | VENOM + ELEK-001 patch | Post-patch: emit AUTH_REVOKED_SELF_HEAL_BLOCKED audit event |
| Audit trail — switch gate | Platform team | Add ACTOR_SWITCH_OWNERSHIP_GATE_REJECTED event |
| Sentry — cross-user rejection | SEC/Platform team | IDENTITY_OWNERSHIP_MISMATCH must reach Sentry — it is a security signal |
| Sentry — refresh failure | Feature teams | debugLoginError is dev-only; production needs Sentry for RPC failures |

---

## OBSERVABILITY MATURITY

**Identity feature observability maturity: FUNCTIONAL**

- Happy path login: STRONG (timed, fully instrumented)
- Error paths (deleted account, ownership mismatch, stale version): FUNCTIONAL
- Self-heal path: FUNCTIONAL (events present; timing and phase gaps)
- Directory refresh: BASIC (DAL logs failure; caller site completely dark)
- Engine startup: MINIMAL (no events at all)

To reach STRONG: add self-heal phase timing, caller-site refresh visibility, Sentry integration for security-relevant events (cross-user rejection, provision failure).

---

## FINAL LOKI STATUS: WATCH

Reason: No CRITICAL runtime failures detected. Auth-critical self-heal path is observable at the event level but unmeasured for duration. Directory refresh is the most significant observability gap — HIGH severity caller-site blindness. Engine cache stale post-switch is a correctness WATCH. No runaway loops, query storms, or N+1 patterns detected. Identity feature runtime is structurally sound for a no-UI, bootstrap-only module.

LOKI recommendation: CAUTION — address LOKI-IDENT-001 (refresh call-site observability) and Sentry gaps before THOR gate.
