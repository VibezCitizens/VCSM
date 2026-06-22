# VENOM V2 Security Review — debug
**Review Date:** 2026-06-04
**Reviewer:** VENOM (automated security sheriff)
**Feature:** debug
**Application:** VCSM

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | VENOM-2026-06-04-DEBUG |
| Feature | debug |
| App | VCSM |
| Review Date | 2026-06-04 |
| Scanner Version | 1.1.0 |
| Preflight Status | ALL PASS |
| Behavior Contract | PLACEHOLDER (no §5 or §9 content) |
| Existing SECURITY.md | NOT FOUND |
| Total Findings | 4 |
| Severities | 0 CRITICAL, 2 HIGH, 2 MEDIUM |
| THOR Release Blocker | YES — VEN-DEBUG-001, VEN-DEBUG-002 |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At              | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

```json
{
  "writeSurfaces": [],
  "rpcs": [],
  "securityPaths": [],
  "writeExecutionPaths": [],
  "rpcExecutionPaths": [],
  "edgeFunctions": [],
  "counts": {
    "writes": 0,
    "rpcs": 0,
    "paths": 0,
    "edgeFunctions": 0
  }
}
```

**Interpretation:** The scanner reports zero write surfaces, zero RPCs, and zero edge functions for the debug feature. This is consistent with a client-side-only debug instrumentation layer. However, the debug ecosystem extends beyond `apps/VCSM/src/features/debug/` into sibling locations including `src/shared/lib/iosProdDebugger.js`, `src/app/platform/ios/IOSProdRouteDebugger.jsx`, `src/app/providers/AuthProvider.jsx`, and `src/app/routes/protected/app.routes.jsx`. These are examined below in source inspection.

---

## 4. Security Surface Inventory

| Surface | File | Type | Auth Required | Env Guard |
|---|---|---|---|---|
| LoginDebugPanel component | `src/features/debug/components/LoginDebugPanel.jsx` | PWA component | No (client-only) | `import.meta.env.DEV` runtime check |
| loginDebug.helpers.js | `src/features/debug/loginDebug.helpers.js` | Re-export shim | No (DEPRECATED) | None (build alias) |
| loginDebug.store.js | `src/features/debug/loginDebug.store.js` | Re-export shim | No (DEPRECATED) | None (build alias) |
| @debuggers alias (production) | `src/debuggers-stub/identity/index.js` | No-op stubs | N/A | mode=production alias |
| iosProdDebugger | `src/shared/lib/iosProdDebugger.js` | Client utility | No (localStorage key) | `IS_PROD` check on all export functions |
| IOSProdRouteDebugger | `src/app/platform/ios/IOSProdRouteDebugger.jsx` | PWA component | localStorage key | `import.meta.env.DEV` mount guard in RootLayout |
| ActorProfileProdDebugPanel | `src/features/profiles/screens/components/ActorProfileProdDebugPanel.jsx` | PWA component | localStorage `__vcsm_dbg` | `import.meta.env.DEV && debugMode` |
| ActorProfileDevProbe | `src/features/profiles/screens/components/ActorProfileDevProbe.jsx` | PWA component | None | `import.meta.env.DEV` |
| /dev/diagnostics route | `src/app/routes/protected/app.routes.jsx:163` | PWA route | Auth (ProtectedRoute) | `devDiagnosticsEnabled` = `import.meta.env.DEV` |
| /dev/performance route | `src/app/routes/protected/app.routes.jsx:171` | PWA route | Auth (ProtectedRoute) | `devDiagnosticsEnabled` = `import.meta.env.DEV` |
| AuthProvider debug logging | `src/app/providers/AuthProvider.jsx:90,106,123,166` | Telemetry | N/A | Routes through iosProdDebugger IS_PROD guard |
| setLoginDebugEnabled export | `src/features/debug/loginDebug.store.js:13` | Export alias | N/A | None |

---

## 5. Scanner Signals Block

**Scanner result:** Zero write surfaces, zero RPCs, zero edge functions, zero security paths.

**VENOM assessment:** Zero scanner signals is EXPECTED for a pure client-side debug feature. All findings below are derived from source file inspection, not scanner data. The scanner signals do not reduce review confidence.

**Source files inspected:**
- `apps/VCSM/src/features/debug/loginDebug.helpers.js` (lines 1–9)
- `apps/VCSM/src/features/debug/loginDebug.store.js` (lines 1–13)
- `apps/VCSM/src/features/debug/components/LoginDebugPanel.jsx` (lines 1–149)
- `apps/VCSM/src/debuggers-stub/identity/index.js` (lines 1–12)
- `apps/VCSM/src/shared/lib/iosProdDebugger.js` (lines 1–243)
- `apps/VCSM/src/app/platform/ios/IOSProdRouteDebugger.jsx` (lines 1–294)
- `apps/VCSM/src/app/providers/AuthProvider.jsx` (lines 1–180)
- `apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx` (lines 1–225)
- `apps/VCSM/src/features/profiles/screens/components/ActorProfileProdDebugPanel.jsx` (lines 1–51)
- `apps/VCSM/src/features/profiles/screens/components/ActorProfileDevProbe.jsx` (lines 1–99)
- `apps/VCSM/src/features/profiles/screens/hooks/useProfileRouteTelemetry.js` (lines 1–78)
- `apps/VCSM/src/app/routes/lazyApp.jsx` (lines 1–58)
- `apps/VCSM/src/app/routes/protected/app.routes.jsx` (lines 150–180)
- `apps/VCSM/src/App.jsx` (lines 1–29)
- `apps/VCSM/src/app/layout/RootLayout.jsx` (lines 1–105)
- `apps/VCSM/vite.config.js` (full)

---

## 6. Behavior Contract Status

**BEHAVIOR.md path:** `/Users/vcsm/Desktop/VCSM/ZZnotforproduction/APPS/VCSM/features/debug/BEHAVIOR.md`
**Status:** PLACEHOLDER — file exists but contains no operational specification.

```
Status: PLACEHOLDER
Notes:
- Behavior contract pending source review.
```

**§5 Security Rules:** NONE DEFINED (0 BEH IDs)
**§9 Must Never Happen:** NONE DEFINED (0 BEH IDs)

**Impact:** No behavior contract means there are no formal invariants to cross-check. All findings below are derived entirely from source inspection against platform-level security expectations. The missing contract itself is recorded as a finding (VEN-DEBUG-004).

---

## 7. Trust Boundary Findings

---

### VEN-DEBUG-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-DEBUG-001
- Location: apps/VCSM/src/features/debug/loginDebug.store.js:13
- Application Scope: VCSM
- Platform Surface: PWA — JavaScript module export
- Trust Boundary: Any code that imports loginDebug.store
- Boundary Violated: Semantic contract — a function named "setLoginDebugEnabled" exports a getter, not a setter
- Contract Violated: Module contract / VCSM naming conventions
- Current behavior: `setLoginDebugEnabled` is exported from loginDebug.store.js as an alias for
  `isIdentityDebugEnabled` (a getter that returns a boolean). LoginDebugPanel.jsx imports
  `setLoginDebugEnabled` and assigns it to a variable used to read debug state, not to enable/disable it.
  Any future caller expecting `setLoginDebugEnabled` to toggle debug mode will receive a getter
  that always returns `false` in production stubs, silently doing nothing when called.
- Risk: A developer calling `setLoginDebugEnabled(true)` expecting to activate debug mode will
  silently fail — no error, no effect, no indication of the broken contract. More critically,
  if a future code path attempts to disable debug logging via `setLoginDebugEnabled(false)` as
  a security hardening step, the call will be a no-op, leaving debug state enabled longer than
  intended.
- Severity: HIGH
- Exploitability: LOW
- Attack Preconditions: Developer or future code relies on the exported setter to control
  debug state; the underlying @debuggers/identity module must expose a real setter function
  that is intentionally skipped by this export alias.
- Blast Radius: Debug mode state cannot be programmatically disabled through this surface;
  audit trails and session snapshots may persist in-memory longer than intended in dev builds.
- Identity Leak Type: None direct; potential session data persistence risk in dev
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Broken API contracts in debug infrastructure create "invisible failures" —
  code that appears to disable debug mode does nothing, violating the principle of least
  privilege for debug data access.
- Recommended mitigation: Either (a) rename the export to `isLoginDebugEnabled` to match
  its actual semantics, or (b) wire it to the actual `addIdentityDebugEvent`/setter function
  if a toggle was intended. The file is marked DEPRECATED — the correct fix is to remove it
  entirely and have `LoginDebugPanel.jsx` import directly from `@debuggers/identity`.
- Rationale: Misnamed exports in security-adjacent code (debug enable/disable) violate the
  principle that the name of a control must accurately describe its effect.
- Follow-up command: SPIDER-MAN (regression: verify no callers depend on setter semantics)
- Provenance: SOURCE_VERIFIED — loginDebug.store.js:13, LoginDebugPanel.jsx:14
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Operations
```

---

### VEN-DEBUG-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-DEBUG-002
- Location: apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx:53
- Application Scope: VCSM
- Platform Surface: PWA — localStorage-activated debug panel
- Trust Boundary: Any authenticated user with access to browser DevTools
- Boundary Violated: Debug tooling activated by unauthenticated client-side state (localStorage key)
  with no server-side authorization check
- Contract Violated: VCSM debug access control — debug panels must never render for arbitrary users
- Current behavior: `ActorProfileScreen` reads `localStorage.getItem("__vcsm_dbg")` on every render
  and stores the result in `debugMode`. This value is passed to `useProfileRouteTelemetry` and
  conditionally renders `ActorProfileProdDebugPanel`. While the panel render is guarded by
  `import.meta.env.DEV && debugMode`, the `debugMode` boolean is ALSO unconditionally passed
  to `appendIOSProdDebugLog("profile_route_enter", { routeParam, debugMode })` — which itself is
  only guarded by `IS_PROD` and `isIOSProdDebuggerEnabled()`. The localStorage key name
  `__vcsm_dbg` is documented publicly in the component's JSX comment string
  (ActorProfileProdDebugPanel.jsx:22–23) and in IOSProdRouteDebugger.jsx:194, meaning any
  authenticated user who reads the minified source can activate the debug key.
- Risk: In a staging or preview environment where `import.meta.env.DEV` is `true` (e.g., a Vite
  preview build or a staging deploy that uses DEV mode), any authenticated user who sets
  `localStorage.setItem('__vcsm_dbg', '1')` in their browser will see the full profile route
  state panel, exposing: resolvedActorId, actorIdFromSlug, canonicalSlug, identity loading state,
  and internal routing diagnostics for ANY profile they navigate to — including profiles of
  other users.
- Severity: HIGH
- Exploitability: MEDIUM — requires DEV build environment and authenticated session;
  key name is embedded in source
- Attack Preconditions: Attacker must (1) have an authenticated session, (2) be on a DEV-mode
  build (staging/preview), (3) know the localStorage key (documented in source comments).
- Blast Radius: Exposes internal actor resolution state (actorId, slug, routing errors) for
  all profiles visited. In a staging environment this includes real user actor IDs.
- Identity Leak Type: Actor ID and routing state exposure across arbitrary profile views
- Cache Trust Type: None
- RLS Dependency: NONE — client-side only
- Why it matters: Debug panels activated by a client-controlled key (localStorage) with no
  server-side authz check represent a trust boundary violation. The key name is documented
  in source code comments, making it discoverable without reverse engineering.
- Recommended mitigation: (1) Remove `__vcsm_dbg` localStorage check entirely from
  `ActorProfileScreen` — the `ActorProfileProdDebugPanel` branches at lines 154–196 are
  dead code (the `import.meta.env.DEV` check always evaluates before the `debugMode` check,
  making the `debugMode` branch unreachable). (2) Remove the `debugMode` field from
  `useProfileRouteTelemetry` call. (3) Rename or remove `LEGACY_ENABLE_KEY = '__vcsm_dbg'`
  in iosProdDebugger.js after confirming no other consumers.
- Rationale: Dead code with a client-activatable debug key creates both a code clarity problem
  and a potential attack surface on non-production deployments. Eliminating the dead branch
  removes the surface entirely.
- Follow-up command: ELEKTRA (trace full __vcsm_dbg key usage across all call sites)
- Provenance: SOURCE_VERIFIED — ActorProfileScreen.jsx:53, ActorProfileProdDebugPanel.jsx:22–23,
  iosProdDebugger.js:2–3, IOSProdRouteDebugger.jsx:194
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-DEBUG-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-DEBUG-003
- Location: apps/VCSM/src/app/providers/AuthProvider.jsx:90,106,123,166
- Application Scope: VCSM
- Platform Surface: PWA — debug telemetry writes from auth provider
- Trust Boundary: Any session with iosProdDebugger enabled (localStorage key __vcsm_ios_dbg)
- Boundary Violated: Sensitive auth fields (userId, event type, session state) written to
  sessionStorage via debug telemetry without explicit data minimization
- Contract Violated: Principle of minimum necessary disclosure in debug logs
- Current behavior: AuthProvider calls `appendIOSProdDebugLog` with:
  - `auth_session_hydrated`: { hasSession, userId } — line 90
  - `auth_state_change`: { event, userId, hasSession } — line 106
  - `auth_password_recovery`: { userId } — line 123
  - `auth_logout_start`: { userId } — line 166
  All four calls occur without any DEV-environment guard. They rely solely on
  `appendIOSProdDebugLog`'s internal `IS_PROD` check and `isIOSProdDebuggerEnabled()`.
  If `IS_PROD` is `false` (non-production build) and the localStorage key is set,
  the userId (Supabase Auth UUID) and auth event type are written to `sessionStorage`
  under key `__vcsm_ios_dbg_logs` and dispatched as CustomEvents on `window`.
- Risk: (1) Auth user IDs logged to sessionStorage persist for the browser session tab
  lifetime and are accessible to any JavaScript running on the page (e.g., a compromised
  third-party script). (2) `PASSWORD_RECOVERY` events are specifically logged with userId,
  creating a timing oracle — an observer monitoring sessionStorage or window CustomEvents
  could detect when a password recovery flow is triggered and for which userId. (3) The
  `window.dispatchEvent(new CustomEvent(...))` call means any event listener registered
  on `window` can intercept auth state transitions in real time.
- Severity: MEDIUM
- Exploitability: LOW — requires non-production build environment, localStorage key set,
  and either XSS or malicious extension to intercept CustomEvents
- Attack Preconditions: (1) Non-production (staging/preview) deployment, (2) debug key
  active in browser, (3) XSS or privileged browser extension to read sessionStorage
  or intercept CustomEvents
- Blast Radius: Auth user ID (Supabase UUID) and auth lifecycle events (LOGIN, LOGOUT,
  PASSWORD_RECOVERY) exposed in client-side storage and via CustomEvents for the session
  duration
- Identity Leak Type: Auth user ID (userId) and auth event type exposure
- Cache Trust Type: sessionStorage — clears on tab close, but readable by all same-origin JS
- RLS Dependency: NONE
- Why it matters: Auth event telemetry including user IDs and recovery flow triggers
  should never be stored in sessionStorage, even in dev builds. The CustomEvent dispatch
  model creates a pub-sub channel for auth state that any in-page script can subscribe to.
- Recommended mitigation: (1) Add `if (!import.meta.env.DEV) return` guards before each
  `appendIOSProdDebugLog` call in AuthProvider, so auth telemetry is only collected in
  explicit dev builds, not staging. (2) Strip `userId` from telemetry payloads — log
  `hasUserId: !!userId` instead of the raw UUID. (3) Consider replacing window CustomEvent
  dispatch with a scoped in-memory event bus that does not expose auth events to
  arbitrary page-level scripts.
- Rationale: Defense in depth — even though `appendIOSProdDebugLog` has an IS_PROD guard,
  staging and preview builds are not production. Auth-adjacent telemetry must not log
  identity primitives at any tier.
- Follow-up command: ELEKTRA (audit full appendIOSProdDebugLog call inventory for PII payloads)
- Provenance: SOURCE_VERIFIED — AuthProvider.jsx:90,106,123,166; iosProdDebugger.js:221–242
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: Access Control, Software Development Security
```

---

### VEN-DEBUG-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-DEBUG-004
- Location: ZZnotforproduction/APPS/VCSM/features/debug/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: Engineering governance
- Boundary Violated: Missing formal security contract
- Contract Violated: VCSM feature governance — all features must have operational BEHAVIOR.md
  with §5 Security Rules and §9 Must Never Happen
- Current behavior: BEHAVIOR.md for the debug feature is a stub with "Status: PLACEHOLDER"
  and no §5 or §9 sections. No formal invariants exist for: which environments panels may
  render in, which data fields may appear in debug output, who may activate debug modes,
  and what must never be logged (e.g., tokens, raw user IDs).
- Risk: Without a written security contract, engineers adding new debug instrumentation
  have no authoritative reference for what is prohibited. This is how auth-adjacent PII
  (userId in AppProvider debug logs) accumulates without a clear violation signal.
- Severity: MEDIUM
- Exploitability: LOW (governance gap, not a direct exploit path)
- Attack Preconditions: N/A — this is a governance finding
- Blast Radius: All future debug instrumentation added to VCSM operates without a security
  contract, increasing the probability of additional findings similar to VEN-DEBUG-003
- Identity Leak Type: None direct
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Security contracts serve as the first line of defense against incremental
  drift in debug tooling. The debug feature touches auth state, actor IDs, session data,
  and routing internals — all of which require explicit "must never appear in logs" rules.
- Recommended mitigation: Write a complete BEHAVIOR.md for the debug feature including:
  §5 Security Rules: (1) No raw userId/actorId in any debug log payload in any environment;
  (2) Debug panels may only render when import.meta.env.DEV is true; (3) No localStorage-key-
  activated panels — all activation must go through the @debuggers module's own enable state;
  (4) iosProdDebugger may never log auth tokens or session objects.
  §9 Must Never Happen: (1) Debug output in production builds; (2) Auth userId written to
  sessionStorage; (3) Auth events dispatched as window CustomEvents when debugger is enabled.
- Rationale: A written contract makes future VENOM/ELEKTRA/BLACKWIDOW runs faster, gives
  SPIDER-MAN concrete invariants to test, and prevents the "invisible accumulation" of
  security debt in instrumentation code.
- Follow-up command: Logan (write the BEHAVIOR.md for the debug feature)
- Provenance: SOURCE_VERIFIED — BEHAVIOR.md file read directly
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Operations
```

---

## 8. Source Verification Summary

| File | Inspected | Key Findings |
|---|---|---|
| `features/debug/loginDebug.helpers.js` | YES | DEPRECATED re-export shim; no direct risk but adds staleness |
| `features/debug/loginDebug.store.js` | YES | Misnamed export `setLoginDebugEnabled` → VEN-DEBUG-001 |
| `features/debug/components/LoginDebugPanel.jsx` | YES | DEV guard present (`import.meta.env.DEV` line 49); safe in production |
| `src/debuggers-stub/identity/index.js` | YES | All stubs are no-ops; production alias correctly points here |
| `vite.config.js` | YES | @debuggers alias switches correctly on `mode === 'production'`; `drop: ['console','debugger']` in prod esbuild |
| `src/shared/lib/iosProdDebugger.js` | YES | `IS_PROD` guards on all exported functions; but no DEV guard at call sites → VEN-DEBUG-003 |
| `src/app/platform/ios/IOSProdRouteDebugger.jsx` | YES | Mounted only with `import.meta.env.DEV` in RootLayout; localStorage key documented in source |
| `src/features/profiles/screens/ActorProfileScreen.jsx` | YES | `__vcsm_dbg` localStorage read on every render; dead code `debugMode` branches → VEN-DEBUG-002 |
| `src/features/profiles/screens/components/ActorProfileProdDebugPanel.jsx` | YES | Guarded by `import.meta.env.DEV && debugMode`; dead code in production builds |
| `src/features/profiles/screens/components/ActorProfileDevProbe.jsx` | YES | `import.meta.env.DEV` guard on line 5; safe |
| `src/features/profiles/screens/hooks/useProfileRouteTelemetry.js` | YES | Passes `debugMode` to iosProdDebugger; logs resolvedActorId and identityActorId |
| `src/app/providers/AuthProvider.jsx` | YES | Auth telemetry with userId written to debug store without DEV guard → VEN-DEBUG-003 |
| `src/app/routes/protected/app.routes.jsx` | YES | `/dev/diagnostics` and `/dev/performance` gated by `devDiagnosticsEnabled` + `ProtectedRoute`; safe |
| `src/features/vport/components/CreateVportDebugPanel.jsx` | YES | `import.meta.env.DEV` guard present; safe |
| `src/features/social/friend/subscribe/components/SubscribeDebugPanel.jsx` | YES | `IS_DEV` guard on line 14; safe |

**VERIFIED SAFE surfaces:** LoginDebugPanel, debuggers-stub (production alias), CreateVportDebugPanel, SubscribeDebugPanel, ActorProfileDevProbe, /dev/diagnostics route, /dev/performance route, vite.config.js alias switching, esbuild console/debugger drop.

---

## 9. Confidence Summary

| Finding | Confidence | Basis |
|---|---|---|
| VEN-DEBUG-001 | HIGH | Direct source read of loginDebug.store.js:13 and LoginDebugPanel.jsx:14 |
| VEN-DEBUG-002 | HIGH | Direct source read of ActorProfileScreen.jsx:53, confirmed dead-code branches, key name documented in source |
| VEN-DEBUG-003 | HIGH | Direct source read of AuthProvider.jsx:90–166 and iosProdDebugger.js:222 |
| VEN-DEBUG-004 | HIGH | Direct read of BEHAVIOR.md confirming PLACEHOLDER status |

**Overall review confidence:** HIGH — all source files read directly; no scanner inference required.

---

## 10. THOR Impact

| Finding | Severity | THOR Block | Justification |
|---|---|---|---|
| VEN-DEBUG-001 | HIGH | YES | Broken setter export in debug infrastructure; any future code relying on it to disable debug silently fails |
| VEN-DEBUG-002 | HIGH | YES | Dead code with localStorage-activatable debug panel; key documented in source; identity state exposure on non-prod builds |
| VEN-DEBUG-003 | MEDIUM | NO | Staging-only risk with multiple preconditions; no direct production exposure |
| VEN-DEBUG-004 | MEDIUM | NO | Governance gap; no direct exploit path |

**THOR Release Status:** BLOCKED on VEN-DEBUG-001 and VEN-DEBUG-002. Both are code-level issues requiring source changes before a production release from this branch.

---

## 11. Required Follow-Up Commands

| Priority | Command | Reason |
|---|---|---|
| P1 | SPIDER-MAN | Verify no callers depend on `setLoginDebugEnabled` setter semantics before renaming/removing |
| P1 | ELEKTRA | Trace full `__vcsm_dbg` key usage across all call sites; trace full `appendIOSProdDebugLog` inventory for PII payloads |
| P2 | Logan | Write complete BEHAVIOR.md for debug feature including §5 and §9 sections |
| P3 | DEADPOOL | If VEN-DEBUG-003 is disputed, trace the full appendIOSProdDebugLog call path under staging build conditions |

---

## 12. Mitigation Plan Table

| Finding ID | Severity | THOR Block | File | Action | Complexity |
|---|---|---|---|---|---|
| VEN-DEBUG-001 | HIGH | YES | `src/features/debug/loginDebug.store.js:13` | Remove mis-named export alias `setLoginDebugEnabled`; update `LoginDebugPanel.jsx` to import directly from `@debuggers/identity` | LOW |
| VEN-DEBUG-001 | HIGH | YES | `src/features/debug/loginDebug.helpers.js` | Evaluate full removal of deprecated file (it exports no unique logic) | LOW |
| VEN-DEBUG-002 | HIGH | YES | `src/features/profiles/screens/ActorProfileScreen.jsx:53` | Remove `debugMode` localStorage read; remove dead `import.meta.env.DEV && debugMode` branches at lines 154–196 | LOW |
| VEN-DEBUG-002 | HIGH | YES | `src/features/profiles/screens/hooks/useProfileRouteTelemetry.js` | Remove `debugMode` parameter from hook signature and telemetry payload | LOW |
| VEN-DEBUG-002 | HIGH | YES | `src/shared/lib/iosProdDebugger.js:2` | Remove or rename `LEGACY_ENABLE_KEY = '__vcsm_dbg'` after confirming no remaining consumers | LOW |
| VEN-DEBUG-003 | MEDIUM | NO | `src/app/providers/AuthProvider.jsx:90,106,123,166` | Add `if (!import.meta.env.DEV) return` before each `appendIOSProdDebugLog` call; strip raw `userId` from payloads | LOW |
| VEN-DEBUG-004 | MEDIUM | NO | `ZZnotforproduction/APPS/VCSM/features/debug/BEHAVIOR.md` | Write complete BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen invariants | MEDIUM |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Coverage |
|---|---|---|
| Software Development Security | VEN-DEBUG-001, VEN-DEBUG-002, VEN-DEBUG-004 | Broken export contracts, dead code with client-activatable debug, missing security contract |
| Access Control | VEN-DEBUG-002, VEN-DEBUG-003 | Client-key-activated debug panels, auth telemetry with user identity |
| Security Operations | VEN-DEBUG-003, VEN-DEBUG-004 | Auth event telemetry in sessionStorage, governance gap |
| Identity and Access Management | VEN-DEBUG-003 | userId in debug logs; auth event CustomEvent dispatch |
| Asset Security | VEN-DEBUG-003 | sessionStorage persistence of auth user IDs |

---

*Report generated: 2026-06-04 | VENOM V2 | Feature: debug | App: VCSM*
