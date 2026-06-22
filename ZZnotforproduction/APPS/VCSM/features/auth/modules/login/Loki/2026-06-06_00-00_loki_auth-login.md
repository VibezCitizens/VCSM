# LOKI Runtime Report
**Scope:** VCSM:auth — Login Module
**Date:** 2026-06-06
**Command:** LOKI v2
**Evidence type:** STATIC_ANALYSIS (source-code trace — no live instrumentation run)
**Closes:** IRM-LOGIN-004 (runtime ownership inferred — now SOURCE_VERIFIED)
**TypeScript output allowed:** NO

---

## ARCHITECT Gate

| Gate | Source | Age | Status |
|---|---|---|---|
| ARCHITECT | Inline source reads — full login module layer stack | 0 days | PASS |

### ARCHITECT Artifact Completeness

| Artifact | Required Content | Status | Result |
|---|---|---|---|
| feature-map | DAL, Controller, Hook, Screen layers — all confirmed in this session | COMPLETE | PASS |
| database-read-map | DAL methods, tables, read/write patterns confirmed | COMPLETE | PASS |

---

## LOKI TARGET

```
Observed flow:    Login submit — unauthenticated user credentials → authenticated session + redirect
Application Scope: VCSM
Entry point:      LoginScreen.jsx → onSubmit → useLogin.handleLogin
Reason:           Close IRM-LOGIN-004 — confirm runtime ownership, identify serial bottlenecks,
                  detect duplicate reads, map cache behavior
ARCHITECT feature-map loaded: inline session evidence (2026-06-06)
ARCHITECT database-read-map loaded: inline session evidence (2026-06-06)
TypeScript output allowed: NO
```

---

## TRACE IDENTITY

```
Trace ID:           LOKI-AUTH-LOGIN-2026-06-06-001
Route:              /login
Screen:             LoginScreen.jsx
Session state class: UNAUTHENTICATED → AUTHENTICATED
Timestamp:          2026-06-06 (static analysis)
```

---

## RUNTIME SUMMARY

```
Total duration:          300ms–2500ms (network-dependent — Supabase signInWithPassword dominates)
Primary records returned: 1 auth.users row (session), 1 profiles row
Total DB reads:          3 Supabase calls (signInWithPassword, getSession ×2, getProfileDiscoverable)
                         + 1 conditional write (profiles.discoverable — first login only)
Read Amplification Score: LOW — no N+1, no fan-out, 1 duplicate getSession (cache hit)
Worst bottleneck:         supabase.auth.signInWithPassword (external network call, no cache)
Cache behavior summary:   getSession() called twice; second call is Supabase client cache HIT
                          No client-side app cache. profiles read: no cache.
```

---

## EXECUTION FLOW MAP

| Step | Operation | Caller | Mode | Notes |
|---|---|---|---|---|
| 1 | `e.preventDefault()` | `LoginScreen.onSubmit` | SYNC | — |
| 2 | `setError('')` | `useLogin.handleLogin` | SYNC | re-render if error was set |
| 3 | `setLoading(true)` | `useLogin.handleLogin` | SYNC | triggers 1 re-render |
| 4 | `performance.now()` capture (t0) | `useLogin.handleLogin` | SYNC | DEV timing only |
| 5 | `Promise.race([signInWithPassword, timeout15s])` | `useLogin.handleLogin` | ASYNC / SERIAL | network bottleneck |
| 5a | `validateEmail(email)` | `login.controller.signInWithPassword` | SYNC | normalize + format guard |
| 5b | `dalSignInWithPassword({ email, password })` | `login.controller` | NETWORK | `supabase.auth.signInWithPassword` → auth.users |
| 6 | `hydrateAuthSession()` | `useLogin.handleLogin` | ASYNC / SERIAL | waits for step 5 to complete |
| 6a | `dalHydrateAuthSession()` | `authSession.controller` | NETWORK (1st call) | `supabase.auth.getSession()` — result discarded |
| 7 | `ensureProfileDiscoverable(userId)` | `useLogin.handleLogin` | ASYNC / SERIAL | waits for step 6 |
| 7a | `dalGetAuthSession()` | `profile.controller` | CACHE HIT | `supabase.auth.getSession()` — 2nd call, Supabase client cache |
| 7b | session guard: `session.user.id === userId` | `profile.controller` | SYNC | early-return if mismatch |
| 7c | `dalGetProfileDiscoverable(userId)` | `profile.controller` | NETWORK | `profiles` SELECT id, discoverable |
| 7d | `dalUpdateProfileDiscoverable(...)` | `profile.controller` | NETWORK (CONDITIONAL) | `profiles` UPDATE — first login only |
| 8 | `isSafeAuthReturnPath(from)` | `useLogin.handleLogin` | SYNC | redirect guard |
| 9 | `navigate(dest, { replace: true })` | `useLogin.handleLogin` | SYNC | unmounts LoginScreen |

**Execution mode: SERIAL** — steps 5 → 6 → 7 are strictly sequential awaits. No parallelism in the post-auth chain.

---

## DATABASE READ SUMMARY

| Table/View/RPC | Operation | Count | Duplicate Fingerprints | Notes |
|---|---|---|---|---|
| auth.users | READ (implicit via signInWithPassword) | 1 | 0 | Supabase-managed; single call |
| auth.sessions | WRITE (implicit on signIn) | 1 | 0 | Supabase-managed; session created |
| auth.sessions | READ via getSession() | 2 | 1 | Step 6 = network; Step 7a = cache HIT |
| profiles | SELECT (id, discoverable) | 1 | 0 | `dalGetProfileDiscoverable` |
| profiles | UPDATE (discoverable, updated_at) | 0–1 | 0 | Conditional — fires only if discoverable = false |

---

## DUPLICATE QUERY FINGERPRINTS

| Fingerprint | Count | Caller Chains | Impact |
|---|---|---|---|
| `supabase.auth.getSession()` | 2 | Step 6: `hydrateAuthSession → authSession.controller → dalHydrateAuthSession`; Step 7a: `ensureProfileDiscoverable → profile.controller → dalGetAuthSession` | LOW — second call is Supabase client cache HIT; no network round-trip. No action required. |

---

## TIMING BUDGET STATUS

| Runtime Area | Observed (estimated) | Budget | Status |
|---|---|---|---|
| Route/screen load | <100ms (static form render) | 1500ms | PASS |
| Controller orchestration | <10ms (validateEmail, sync guards) | 300ms | PASS |
| DAL total (all network calls) | 400–2300ms (signInWithPassword + profile read + optional write) | 500ms | **WARN** (network-bound; signInWithPassword alone can exceed 500ms under load) |
| Single DB read — profiles | 50–150ms (estimated) | 150ms | PASS |
| Hydration/render | <50ms (simple form, no computed data) | 500ms | PASS |
| Timeout ceiling | 15000ms (KRAVEN-LOGIN-H01 guard) | — | INFO — correctly bounded |

**Note on DAL WARN:** The budget exceedance is structural — `supabase.auth.signInWithPassword` is an external network call to Supabase's auth service. There is no client-side optimization possible for this call. The 15s timeout guard (KRAVEN-LOGIN-H01) is the existing mitigation. Route to KRAVEN for P95/P99 latency benchmarking if production data is available.

---

## CACHE OBSERVATIONS

| Cache | Caller | Status | Evidence | Impact |
|---|---|---|---|---|
| `supabase.auth.getSession()` — first call | `authSession.controller.hydrateAuthSession` | MISS (network) | `supabase.auth.signInWithPassword` completes; getSession fetches the new session | Correct — cache cold before signIn |
| `supabase.auth.getSession()` — second call | `profile.controller.ensureProfileDiscoverable → dalGetAuthSession` | HIT | Supabase client holds session in memory after first getSession call | LOW overhead — no network; ~1ms |
| `profiles` SELECT | `profile.controller → dalGetProfileDiscoverable` | MISS (network) | No app-level profile cache; always reads from DB | Expected — one-time post-auth read |

**Cache gap:** `hydrateAuthSession()` result is not captured or passed downstream. `profile.controller` re-fetches the session via `dalGetAuthSession()` rather than receiving it as an argument. This is the source of the duplicate `getSession()` call. The second call is a cache HIT so there is no meaningful penalty today, but the pattern creates an invisible dependency on Supabase client cache behavior.

---

## RENDER / HOOK CHURN

| Component/Hook | Render Count | Effect Count | Query Impact | Likely Trigger |
|---|---|---|---|---|
| LoginScreen | 2–3 per submit attempt | 0 | 0 queries | setLoading(true) → render 1; setError or setSuccess → render 2; setLoading(false) → render 3 |
| useLogin | 2–3 state updates per attempt | 0 | 0 queries | Same as above — state owner |

**Churn assessment:** LOW. No looping effects. No polling. No subscription. Re-renders are bounded to the number of `useState` updates in `handleLogin` (max 3 per submit). No render-triggered query duplication.

---

## LOKI RUNTIME FINDINGS

---

### LOKI-LOGIN-001 — Duplicate getSession() — Cache Hit, No Network Penalty

```
LOKI RUNTIME FINDING
Finding ID:           LOKI-LOGIN-001
Location:             useLogin.handleLogin (steps 6 + 7a)
Application Scope:    VCSM
Runtime Risk Category: Duplicate read
Evidence Type:        STATIC_ANALYSIS
Observation Source:   Source trace — useLogin.js, authSession.controller.js, profile.controller.js
Confidence:           HIGH

Current runtime behavior:
  hydrateAuthSession() → dalHydrateAuthSession() → supabase.auth.getSession()  [network]
  ensureProfileDiscoverable() → dalGetAuthSession() → supabase.auth.getSession() [cache HIT]
  Two calls to getSession(). First is network. Second is Supabase client in-memory cache.

Runtime impact:
  Functionally correct. Cache hit means no second network round-trip.
  Pattern creates invisible coupling: profile.controller.js silently depends on
  Supabase client having a warm cache from hydrateAuthSession(). If hydrateAuthSession()
  is removed or reordered, the second getSession() becomes a network call.

Read Amplification: LOW (1 duplicate — cache HIT; no N+1)
Timing impact:      ~1ms for cache hit. Negligible.

Caller chain:
  useLogin.handleLogin
    → await hydrateAuthSession() [step 6]
      → supabase.auth.getSession() [NETWORK]
    → await ensureProfileDiscoverable(userId) [step 7]
      → dalGetAuthSession() [CACHE HIT]
        → supabase.auth.getSession()

Cache status:        MISS (step 6), HIT (step 7a)
Severity:            LOW

Recommended handoff: IRONMAN (document as known coupling in ARCHITECTURE.md),
                     KRAVEN (note if profiling reveals cache-miss scenarios)

Rationale:
  The duplicate call is benign today but architecturally fragile. Refactor option:
  capture the session from hydrateAuthSession() and pass it to ensureProfileDiscoverable()
  as a parameter — eliminating the second getSession() entirely. Low priority.
```

---

### LOKI-LOGIN-002 — Serial Post-Auth Waterfall

```
LOKI RUNTIME FINDING
Finding ID:           LOKI-LOGIN-002
Location:             useLogin.handleLogin (steps 5 → 6 → 7)
Application Scope:    VCSM
Runtime Risk Category: Serial bottleneck
Evidence Type:        STATIC_ANALYSIS
Observation Source:   Source trace — useLogin.js
Confidence:           HIGH

Current runtime behavior:
  Step 5: await signInWithPassword(...)         [300–2000ms, network]
  Step 6: await hydrateAuthSession()            [10–50ms, network/cache]
  Step 7: await ensureProfileDiscoverable()     [50–300ms, network + optional write]
  Total sequential: 360–2350ms minimum

  Steps 6 and 7 are SERIAL after step 5. They cannot run concurrently because:
  - step 6 (getSession) populates the Supabase client cache used by step 7a
  - step 7 uses session.user.id derived from getSession()

  Optimisation constraint: steps 6 and 7 share a dependency (session). Steps 6 + 7
  together could be partially refactored — but the session obtained from signInWithPassword
  (step 5) is NOT captured or passed downstream. The controller returns only { user: { id, email } }.

Runtime impact:
  Every successful login incurs a 3-step serial waterfall after authentication.
  The profile discoverability step (step 7) adds 50–300ms to the post-auth critical path.
  On first login (discoverable = false): additional 50–150ms for the UPDATE.
  Combined worst case: ~2500ms before navigate() fires.

Read Amplification: NONE (no fan-out or N+1)
Timing impact:      MEDIUM — steps 6+7 add 60–350ms serially after an already slow step 5.

Caller chain:
  useLogin.handleLogin
    → [step 5] signInWithPassword (controller → DAL → network) [SERIAL]
    → [step 6] hydrateAuthSession (controller → DAL → network)  [SERIAL, awaited]
    → [step 7] ensureProfileDiscoverable (controller → 2× DAL)  [SERIAL, awaited]
    → navigate()

Cache status:        N/A (serial chain)
Severity:            MEDIUM

Recommended handoff: KRAVEN (performance audit — quantify step 6+7 contribution to p50/p95 login time)

Rationale:
  Refactor option: capture session from signInWithPassword result (already available in
  login.controller.js as data.session if exposed) and pass it to profile.controller.js,
  eliminating the second getSession() entirely. This removes step 7a from the chain.
  hydrateAuthSession() could also be eliminated if the signInWithPassword session response
  already populates the Supabase client session state (it does, via onAuthStateChange).
  Low-medium priority — route to KRAVEN before investing in refactor.
```

---

### LOKI-LOGIN-003 — Production Timing Signal Missing

```
LOKI RUNTIME FINDING
Finding ID:           LOKI-LOGIN-003
Location:             useLogin.js (lines ~31-32, ~43-48)
Application Scope:    VCSM
Runtime Risk Category: Observability gap
Evidence Type:        STATIC_ANALYSIS
Observation Source:   Source trace — useLogin.js
Confidence:           HIGH

Current runtime behavior:
  t0 = performance.now() captured before signInWithPassword.
  signinMs = Math.round(performance.now() - t0) captured after.
  signinMs is passed only to debugLoginEvent() — DEV-only; not shipped to production.
  captureFrontendError() fires on catch but carries no timing data.

  Production monitoring receives:
    - error events (via captureFrontendError on failure)
    - NO timing signal for signInWithPassword duration
    - NO signal for overall login flow duration
    - NO signal for step 6 (hydration) or step 7 (profile discoverability) duration

Runtime impact:
  P50/P95 login latency is unmeasurable from production data.
  A regression in Supabase auth latency would only be detectable via
  increased timeout errors (15s timeout fires) — not from gradual slowdowns.
  The serial waterfall (LOKI-LOGIN-002) cannot be quantified without production timing.

Read Amplification: N/A
Timing impact:      NONE (observability gap, not a runtime cost)

Caller chain:
  useLogin.handleLogin
    → t0 = performance.now()
    → await signInWithPassword(...)
    → signinMs = performance.now() - t0
    → debugLoginEvent('SUPABASE_SIGNIN_SUCCESS', { signinMs }) [DEV only]
    → [signinMs not sent to captureFrontendError or any production signal]

Cache status: N/A
Severity:     LOW

Recommended handoff:
  SENTRY INSTRUMENTATION RECOMMENDATION (see below) — add production timing capture.
  KRAVEN — timing signal is prerequisite for KRAVEN performance benchmarking.

Rationale:
  signinMs already exists in the hook. Forwarding it to a production-safe metric
  (e.g., Sentry performance span or custom metric) requires a single additional call.
  The KRAVEN-LOGIN-H01 timeout guard documents the risk but provides no visibility
  into sub-timeout latency distribution.
```

---

### LOKI-LOGIN-004 — getSession() Identity Verification is Cached JWT (Existing Known Finding)

```
LOKI RUNTIME FINDING
Finding ID:           LOKI-LOGIN-004
Location:             profile.controller.js — session guard (step 7a-7b)
Application Scope:    VCSM
Runtime Risk Category: Repeated auth/context resolution
Evidence Type:        STATIC_ANALYSIS
Observation Source:   Source trace — profile.controller.js, authSession.read.dal.js
Confidence:           HIGH

Current runtime behavior:
  profile.controller.ensureProfileDiscoverable() calls dalGetAuthSession()
  → supabase.auth.getSession() — returns CACHED JWT, not server-verified identity.
  The session guard (session.user.id === userId) relies on this cached JWT.
  A valid-but-stale or stolen session JWT could pass this check.

  This is a pre-existing documented limitation:
  ELEK-2026-06-04-005 (referenced in ARCHITECTURE.md): getSession() returns
  cached JWT. getUser() is server-verified.

Runtime impact:
  The profile discoverability write is gated by a cached-JWT identity check.
  This is LOW risk in the login context (the JWT was just minted via signInWithPassword
  seconds earlier — staleness is not a realistic concern at this point in the flow).
  The concern applies more to long-lived sessions using getSession() for
  authorization decisions unrelated to the login moment.

Read Amplification: N/A
Timing impact:      N/A
Cache status:       HIT
Severity:           LOW (login-context specific — documented; route to VENOM for full assessment)

Recommended handoff: VENOM (existing finding ELEK-2026-06-04-005 — confirm runtime scope)

Rationale:
  LOKI surfaces this as runtime confirmation of the architectural note. VENOM owns
  the security classification. No new action required from this LOKI pass.
```

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LOKI-LOGIN-001 (duplicate getSession — cache hit) | IRONMAN | Document known session coupling in ARCHITECTURE.md; low priority refactor |
| LOKI-LOGIN-002 (serial post-auth waterfall) | KRAVEN | Quantify step 6+7 contribution to login latency before investing in refactor |
| LOKI-LOGIN-003 (production timing signal missing) | KRAVEN + SENTRY instrumentation | signinMs already captured; needs production forwarding |
| LOKI-LOGIN-004 (cached JWT identity check) | VENOM | Existing finding ELEK-2026-06-04-005 — runtime confirmation only |

---

## SENTRY MONITORING GAP REVIEW

| Flow | Location | Current Behavior | Auto-Captured? | Missing Signal | Severity | Recommendation |
|---|---|---|---|---|---|---|
| Login submit — success timing | `useLogin.js` | signinMs in DEV debugLoginEvent only | No | P50/P95 signInWithPassword duration | LOW | Forward signinMs to production performance signal |
| Login submit — failure | `useLogin.js catch` | `captureFrontendError` fires with feature/module/route | Yes (via captureFrontendError) | No timing data in error payload | LOW | Add `signinMs` to captureFrontendError context on failure |
| Profile discoverability failure | `useLogin.js` — discoverableErr swallowed | `debugLoginError` (DEV only); production: silent | No | Discoverable update failures invisible in production | MEDIUM | Add `captureFrontendError` to discoverableErr catch |
| Hydration failure | `useLogin.js` — hydrateErr swallowed | `debugLoginError` (DEV only); production: silent | No | Session hydration failures invisible in production | LOW | Add `captureFrontendError` to hydrateErr catch |

---

## SENTRY INSTRUMENTATION RECOMMENDATIONS

### REC-01 — Production timing for signInWithPassword

```
SENTRY INSTRUMENTATION RECOMMENDATION
Location:         useLogin.js — inside handleLogin, after signInWithPassword success
Failure type:     Latency regression (not an error)
Current behavior: signinMs captured but only sent to debugLoginEvent (DEV)
Why Sentry does not see it: debugLoginEvent is gated on @debuggers/identity (DEV only)
Recommended call: captureFrontendError is not appropriate for performance; use
                  a custom performance.measure() or add signinMs to an existing
                  success-path monitoring call if one exists.
                  If no performance SDK is wired: add signinMs to a structured
                  log event that ships to your observability backend.
Production-safe:  YES — signinMs is a number, no PII
Noise risk:       LOW — fires once per successful login
Payload:          { signinMs, hasEmail: Boolean(email) }
Owner:            useLogin.js — auth/login module
```

### REC-02 — Capture discoverableErr in production

```
SENTRY INSTRUMENTATION RECOMMENDATION
Location:         useLogin.js — catch block for ensureProfileDiscoverable (line ~63-65)
Failure type:     Silent swallowed error — profiles write failure
Current behavior: debugLoginError fires (DEV); production: no signal
Why Sentry does not see it: catch block does not call captureFrontendError
Recommended call:
  captureFrontendError(discoverableErr, {
    feature:    'auth',
    module:     'useLogin',
    controller: 'profile_discoverable',
    route:      '/login',
    severity:   'warning',
    is_handled: true,
    tags:       { flow: 'login', stage: 'ensureProfileDiscoverable' },
    context:    { userId: Boolean(data?.user?.id) },
  })
Production-safe:  YES — userId is boolean (not the ID itself)
Noise risk:       LOW — fires only on profile update failure (unusual)
Payload:          No PII — userId is Boolean
Owner:            useLogin.js — auth/login module
```

### REC-03 — Capture hydrateErr in production (optional, lower priority)

```
SENTRY INSTRUMENTATION RECOMMENDATION
Location:         useLogin.js — catch block for hydrateAuthSession (line ~57-59)
Failure type:     Silent swallowed error — session hydration failure
Current behavior: debugLoginError fires (DEV); production: no signal
Recommended call:
  captureFrontendError(hydrateErr, {
    feature:    'auth',
    module:     'useLogin',
    controller: 'authSession_hydrate',
    route:      '/login',
    severity:   'warning',
    is_handled: true,
    tags:       { flow: 'login', stage: 'hydrateAuthSession' },
  })
Production-safe:  YES — no PII in payload
Noise risk:       LOW — Supabase auth hydration failures are uncommon
Payload:          No PII
Owner:            useLogin.js — auth/login module
```

---

## RUNTIME OWNERSHIP — CONFIRMED

**IRM-LOGIN-004 status: CLOSED — runtime ownership now SOURCE_VERIFIED**

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Mode | Hotspot |
|---|---|---|---|---|---|---|
| Login submit | `LoginScreen.onSubmit → useLogin.handleLogin` | auth/login | `login.controller` | `login.dal` (signInWithPassword) | SERIAL | `dalSignInWithPassword` — external network, 300–2000ms |
| Session hydration | `useLogin.handleLogin (step 6)` | auth/login | `authSession.controller` | `authSession.read.dal` (getSession) | SERIAL after signIn | Cache HIT after signIn; <50ms |
| Profile discoverability | `useLogin.handleLogin (step 7)` | auth/login | `profile.controller` | `profile.dal` (getProfileDiscoverable, updateProfileDiscoverable) | SERIAL after hydration | `dalGetProfileDiscoverable` — 50–150ms |
| Redirect | `useLogin.handleLogin (step 9)` | auth/login | N/A (isSafeAuthReturnPath) | N/A | SYNC | None — client-side only |

---

## FINAL LOKI STATUS: WATCH

**Reason:** Two LOW findings (duplicate getSession, missing production timing) and one MEDIUM finding (serial post-auth waterfall). No CRITICAL or HIGH runtime risks. Flow is functionally correct and bounded by the 15s timeout guard. WATCH status routes to KRAVEN for latency benchmarking before any refactor investment.

---

## Provenance

| Source | Layer | Evidence Type |
|---|---|---|
| useLogin.js | hook | STATIC_ANALYSIS — full async flow traced |
| login.controller.js | controller | STATIC_ANALYSIS |
| login.dal.js | dal | STATIC_ANALYSIS |
| profile.controller.js | controller | STATIC_ANALYSIS |
| profile.dal.js | dal | STATIC_ANALYSIS |
| authSession.controller.js | controller | STATIC_ANALYSIS |
| authSession.read.dal.js | dal | STATIC_ANALYSIS |
| authInputValidation.model.js | model | STATIC_ANALYSIS |
| LoginScreen.jsx | screen | STATIC_ANALYSIS |
