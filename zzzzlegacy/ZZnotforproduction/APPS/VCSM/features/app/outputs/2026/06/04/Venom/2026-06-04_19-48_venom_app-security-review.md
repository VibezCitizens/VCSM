---
name: vcsm.app.security.venom-v2
description: VENOM V2 security review — VCSM app shell
metadata:
  type: security-review
  owner: VENOM
  version: V2
  feature: app
  application: VCSM
  run-date: 2026-06-04
  run-time: "19:48"
  scanner-version: 1.1.0
  prior-status: COMPLETE (updated from prior run)
---

# VENOM V2 SECURITY REVIEW — app

**Feature:** app (VCSM application shell — router, auth provider, guards, layout, iOS bootstrap)
**Date:** 2026-06-04
**Run Time:** 19:48
**VENOM Version:** V2
**Application Scope:** VCSM
**Reviewer:** VENOM (automated + source-verified)

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | app |
| Application | VCSM |
| Review Date | 2026-06-04 |
| VENOM Version | V2 |
| Scanner Version | 1.1.0 |
| Source Directory | apps/VCSM/src/app/ |
| Source Present | YES — 36 files across guards, providers, routes, layout, platform/ios |
| Prior SECURITY.md | YES (prior run 2026-06-04, findings preserved and re-verified) |
| Output File | outputs/2026/06/04/Venom/2026-06-04_19-48_venom_app-security-review.md |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At               | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| rpc-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| edge-function-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| security-path-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-execution-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-execution-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| rpc-execution-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| edge-execution-map | 2026-06-04T19:48:25Z | FRESH | HIGH |

**Scanner data file:** /tmp/venom_features/app.json

Scanner reported: writeSurfaces: 0, rpcs: 0, securityPaths: 0, writeExecutionPaths: 0, rpcExecutionPaths: 0, edgeFunctions: 0, counts: all zero.

This is consistent with the ARCHITECT V2 report. The `app` module is a shell layer: it has no DAL, no Supabase write surfaces, and no RPCs. Security-sensitive surfaces are browser storage mutations (sessionStorage, localStorage) and client-side auth state management — outside the scanner's DB write surface scope but within VENOM's trust boundary mandate.

---

## 4. Security Surface Inventory

| Surface | Kind | Location | Risk Band |
|---|---|---|---|
| `sessionStorage: vc.auth.recovery` | Client-side recovery nonce | AuthProvider.jsx:44-57, setNewPassword.controller.js:47 | MEDIUM — self-exploitation only; documented limitation |
| `localStorage: actor_kind, actor_vport_id, actor_touch` | Identity hint cache (logout wipe) | AuthProvider.jsx:174-176 | LOW — cleared on logout; hint only, not authoritative |
| `sessionStorage: __vcsm_ios_dbg_logs` | Debug log persistence | iosProdDebugger.js:2 | LOW — dev-only enforced by IS_PROD flag |
| `localStorage: __vcsm_ios_dbg, __vcsm_dbg` | Debug toggle enable key | iosProdDebugger.js:1-2 | LOW — dev-only enforced by IS_PROD flag |
| `ProtectedRoute` auth+consent+email gate | Route guard | guards/ProtectedRoute.jsx | HIGH — failure here exposes all protected routes |
| `ProfileGatedOutlet` profile completeness gate | Route guard | guards/ProfileGatedOutlet.jsx | MEDIUM — delegates to CompleteProfileGate adapter |
| `OwnerOnlyDashboardGuard` actor ownership gate | Route guard | appRoutes.redirects.jsx:23-34 | HIGH — UI-only (controllers provide authoritative enforcement) |
| `BlockedVportGuard` VPORT status gate | Route guard | appRoutes.redirects.jsx:36-42 | MEDIUM — UI-only |
| `/dev/diagnostics`, `/dev/performance` routes | Protected dev route | app.routes.jsx:163-175 | MEDIUM — DEV-only via import.meta.env.DEV flag |
| `IOSDebugHUD` + `IOSProdRouteDebugger` | Debug UI components | platform/ios/ | LOW — DEV-only; no prod exposure verified |
| `supabase.auth.signOut({ scope: 'local' })` | Session termination | AuthProvider.jsx:198 | MEDIUM — local scope only; other device sessions persist |
| `resolveRealm()` realm ID resolution | Public route context | routes/index.jsx:121 | LOW — hardcoded fallback UUIDs are non-sensitive |
| `console.warn/error` in AuthProvider | Error logging | AuthProvider.jsx:84,154,201,208 | LOW — browser console only; no prod exfil path |
| `errorDescription` in URL param | Reflected error text | setNewPassword.controller.js:104 | LOW — dev only; prod returns fixed string |

**DB Write Surfaces:** NONE (scanner confirmed, source confirmed)
**RPCs:** NONE
**Edge Functions:** NONE
**Supabase Queries:** NONE (auth hydration only via supabase.auth.getSession — no table reads)

---

## 5. Scanner Signals

Scanner reported zero write surfaces, zero RPCs, zero edge functions, and zero security paths for the `app` feature. This is a TRUE ZERO — the app module is correctly architected as a composition shell with no database access.

Security-relevant surfaces identified by VENOM source inspection (not in scanner scope):

- SESSION_STORAGE write: `vc.auth.recovery` nonce (recovery flow gate)
- LOCAL_STORAGE write/delete: `actor_kind`, `actor_vport_id`, `actor_touch` (identity hint cache, logout wipe)
- SESSION_STORAGE write: `__vcsm_ios_dbg_logs` (dev debug logs, IS_PROD guarded)
- LOCAL_STORAGE read: `__vcsm_ios_dbg`, `__vcsm_dbg` (debug toggle, IS_PROD guarded)
- `appendIOSProdDebugLog` called in AuthProvider, ProtectedRoute, RootLayout — logs auth events including `userId` when debug is enabled

All browser storage writes verified as either: (a) dev-only with IS_PROD guard, or (b) acknowledged client-side security limitation (recovery nonce — VENOM-AUTH-001, carried forward).

---

## 6. Behavior Contract Status

| Field | Status |
|---|---|
| BEHAVIOR.md present | YES — PLACEHOLDER only |
| BEHAVIOR.md status | NOT A REAL SPEC |
| §5 Security Rules | NONE DECLARED (placeholder has no sections) |
| §9 Must Never Happen | NONE DECLARED (placeholder has no sections) |
| BEH IDs in §5 | 0 |
| BEH IDs in §9 | 0 |

**BEHAVIOR.md is a PLACEHOLDER.** No formal security rules or invariants have been declared. This means VENOM cannot perform a behavior contract cross-check. This is a governance finding (LOW severity — does not create an exploitable gap, but means no formal security invariant tracking exists for this module).

Source-level security invariants observed (not formally declared):

- Auth gate: unauthenticated users redirected to /login (enforced in ProtectedRoute.jsx:33)
- Email verification gate: unverified users shown VerifyEmailRequiredScreen (enforced in ProtectedRoute.jsx:41)
- Legal consent gate: users without consent shown ConsentGateScreen (enforced in ProtectedRoute.jsx:50)
- Profile completeness gate: users without complete profile gated by CompleteProfileGate (enforced in ProfileGatedOutlet.jsx via adapter)
- Owner dashboard gate: actorId URL param must match identity.actorId (enforced in OwnerOnlyDashboardGuard — UI only)
- Dev routes: /dev/diagnostics and /dev/performance render null component in production (enforced in lazyApp.jsx + app.routes.jsx via import.meta.env.DEV)
- Debug components: IOSDebugHUD and IOSProdRouteDebugger rendered only in DEV (enforced in RootLayout.jsx:101-102)
- Debug logging: appendIOSProdDebugLog is a no-op in production (enforced in iosProdDebugger.js:5,222)
- Debugger functions: @debuggers alias resolves to no-op stubs in production (enforced in vite.config.js:50-52)

---

## 7. Trust Boundary Findings

---

### VENOM SECURITY FINDING

```
- Finding ID: VEN-APP-001
- Location: apps/VCSM/src/app/providers/AuthProvider.jsx:44-57 + src/features/auth/controllers/setNewPassword.controller.js:47-71
- Application Scope: VCSM
- Platform Surface: PWA / Client-Side Browser Storage
- Trust Boundary: Supabase auth session (server-issued JWT) vs. sessionStorage (client-writable)
- Boundary Violated: Recovery session provenance gate is client-enforced only — no server-side recovery origin check
- Contract Violated: Implicit security contract that password reset requires a genuine recovery session
- Current behavior: AuthProvider writes a UUID nonce + issuedAt timestamp to sessionStorage on PASSWORD_RECOVERY event. setNewPassword.controller.js reads and validates this nonce (TTL: 30 minutes). A user who knows the key name (vc.auth.recovery) and the JSON schema { nonce: string, issuedAt: number } can manually set a conforming nonce and pass the gate while holding any valid authenticated session. supabase.auth.updateUser({ password }) requires only a valid JWT — no recovery session provenance is enforced by Supabase's updateUser endpoint.
- Risk: A source-code-aware authenticated user can update their own password without a genuine password-reset flow. Impact is self-exploitation only — no cross-user path exists. The gate prevents accidental and casual access but not a determined technical attacker.
- Severity: HIGH
- Exploitability: LOW (requires: valid authenticated session, source code knowledge, ability to run JS in the page context — i.e., self-targeted XSS or direct devtools access)
- Attack Preconditions: Valid authenticated Supabase session; knowledge of vc.auth.recovery key name and JSON schema; ability to execute JS on the page (own browser devtools)
- Blast Radius: Self only — attacker can reset their own password without the recovery link flow. No cross-user impact. No privilege escalation.
- Identity Leak Type: None
- Cache Trust Type: Client-side sessionStorage trust — nonce is writable by any JS on the page
- RLS Dependency: NONE — this is a Supabase auth API call (updateUser), not a table write
- Why it matters: If an XSS vulnerability exists elsewhere in the app, an attacker with code execution could forge a recovery nonce and force a password change for the target user if they hold an active session (e.g., XSS in a shared device scenario). Primary risk channel is low, but the absence of server-side provenance verification means the nonce gate has no true security value against a determined attacker.
- Recommended mitigation: Introduce a server-side Edge Function that wraps updateUser and validates recovery session provenance before forwarding the call. Supabase auth-js v2.50.0 does not expose AMR method:'recovery' in JWT claims — the Edge Function must maintain its own short-lived server-side nonce tied to the user's recovery session. Client-side nonce remains as a UX gate to prevent accidental access.
- Rationale: The current mitigation is correctly documented as "raises the barrier, not a security control." Closure requires a server-side authority that Supabase's current client SDK cannot provide.
- Follow-up command: ELEKTRA (trace the server-side mitigation path: AuthProvider → setNewPassword.controller.js → dalUpdateUserPassword → supabase.auth.updateUser), Carnage (assess Edge Function scaffolding for updateUser proxy)
- Provenance: SOURCE_VERIFIED — cited file + line numbers read directly
- CISSP Domain:
  - Primary: Identity and Access Management (IAM)
  - Secondary: Software Development Security, Application Security
```

---

### VENOM SECURITY FINDING

```
- Finding ID: VEN-APP-002
- Location: apps/VCSM/src/app/routes/public/auth.routes.jsx:44-64
- Application Scope: VCSM
- Platform Surface: PWA / React Router v6 route tree
- Trust Boundary: Authenticated session user vs. /reset-password route access
- Boundary Violated: /reset-password is deliberately excluded from AuthPublicRoute; a fully authenticated user who navigates directly is admitted to the route
- Contract Violated: Expectation that auth routes are inaccessible to authenticated users
- Current behavior: /reset-password is NOT wrapped in AuthPublicRoute (which would redirect user !== null to /feed). The route renders ResetPasswordScreen directly. Access control is delegated to resolveRecoverySessionController: without a valid recovery nonce, the controller returns { ok: false, error: null }, the form stays in a waiting/loading state, and a 15-second timeout fires rendering an invalid-link error card. A logged-in user who navigates here directly sees a spinner for 15 seconds, then an error card — no form is rendered.
- Risk: The page renders and executes client-side code for 15 seconds before showing an error. While no password change is possible (the form never reaches 'ready' without a valid nonce), the user experience is poor and could confuse users. The admission of authenticated users into this route is intentional and documented — the risk is limited to UX degradation, not security bypass.
- Severity: MEDIUM
- Exploitability: LOW — no exploitable path exists; form submission is blocked by controller gate
- Attack Preconditions: Valid authenticated session; direct navigation to /reset-password
- Blast Radius: UI rendering only — no write path is reachable without nonce
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: If the 15-second timeout or controller gate has a regression, authenticated users could reach the password update form. The current gate chain is correct but relies on correct behavior of resolveRecoverySessionController for security correctness.
- Recommended mitigation: Add a secondary guard in ResetPasswordScreen or its hook: check both the nonce AND that the current session's auth_method matches expected recovery patterns. Additionally, consider reducing the 15-second timeout to 3-5 seconds for better UX without weakening security. Document the intentional exclusion in BEHAVIOR.md once written.
- Rationale: The current design is correct (wrapping with AuthPublicRoute would break legitimate PKCE recovery flows). The finding is a hardening recommendation to make the secondary gate more explicit and reduce exposure window.
- Follow-up command: ELEKTRA (verify the full resolveRecoverySessionController execution path for regression risk), SPIDER-MAN (add regression test: authenticated user navigating to /reset-password must never see a submittable form)
- Provenance: SOURCE_VERIFIED — cited file + line read directly; behavior confirmed in setNewPassword.controller.js
- CISSP Domain:
  - Primary: Identity and Access Management (IAM)
  - Secondary: Software Development Security
```

---

### VENOM SECURITY FINDING

```
- Finding ID: VEN-APP-003
- Location: apps/VCSM/src/app/providers/AuthProvider.jsx:198
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Auth SDK
- Trust Boundary: Logged-in user session vs. concurrent device/browser sessions
- Boundary Violated: Logout uses scope:'local' — only the current browser session is terminated; other device sessions remain valid
- Contract Violated: User expectation that logout invalidates all active sessions
- Current behavior: supabase.auth.signOut({ scope: 'local' }) terminates the local Supabase session and removes the local JWT. Other sessions on other devices or browsers with the same user account remain active. The Supabase refresh token on other devices is not revoked.
- Risk: If a user logs out on a compromised or shared device, their session on other devices (including any attacker-controlled device that obtained a valid session token) remains valid. This is a known Supabase design pattern but must be flagged: the implicit user expectation of "logout = all sessions terminated" is not met.
- Severity: MEDIUM
- Exploitability: MEDIUM — requires attacker to have previously obtained a valid session token (e.g., via device theft, session hijacking, or XSS token exfil)
- Attack Preconditions: Attacker possesses a valid session token obtained before the user logged out; user logged out on a different device/browser
- Blast Radius: Account access persistence — attacker retains session access after victim logs out locally
- Identity Leak Type: Session token persistence across devices
- Cache Trust Type: Supabase JWT trust — token remains valid until natural expiry
- RLS Dependency: REQUIRED — RLS policies enforce per-JWT claims; a persisted valid JWT on another device continues to satisfy RLS
- Why it matters: In a shared device or account-compromise scenario, local logout is insufficient to stop a session-level attacker. The Supabase JWT will expire naturally (default: 1 hour for access token), but the refresh token allows session renewal.
- Recommended mitigation: Provide a "Sign out of all devices" option (supabase.auth.signOut() without scope, or with scope:'global') in account settings. The local logout behavior is correct for normal UX (speed, optimistic navigation). The global signout option should be surfaced in the Settings/Security section. Document this distinction in BEHAVIOR.md.
- Rationale: This is a standard Supabase trade-off. The current implementation is consistent with most PWA patterns. The finding is a hardening recommendation — not a critical bug — but must be tracked so a "sign out everywhere" control is not overlooked.
- Follow-up command: SPIDER-MAN (test: logout on device A; verify device B session still active before natural expiry), ELEKTRA (assess global signout flow feasibility)
- Provenance: SOURCE_VERIFIED — cited file + line read directly
- CISSP Domain:
  - Primary: Identity and Access Management (IAM)
  - Secondary: Access Control
```

---

### VENOM SECURITY FINDING

```
- Finding ID: VEN-APP-004
- Location: apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx:23-34
- Application Scope: VCSM
- Platform Surface: PWA / React Router v6 route guard
- Trust Boundary: URL actorId param vs. session identity.actorId
- Boundary Violated: OwnerOnlyDashboardGuard is a UI-only gate — no server-side enforcement at the route layer
- Contract Violated: Defense-in-depth: UI gates should be accompanied by server-side enforcement
- Current behavior: OwnerOnlyDashboardGuard reads identity.actorId from identityContext and compares it to the URL :actorId param. Mismatches redirect to /feed. The guard itself is documented as "UI convenience only" with a note that mutation controllers independently verify actor ownership via vc.actor_owners. Source comment (PORT-V-006/008) explicitly acknowledges this distinction.
- Risk: The guard is a correct first layer. The security claim depends entirely on mutation controllers performing ownership verification via vc.actor_owners. If any dashboard controller lacks a server-side ownership check, the guard is the only barrier. VENOM cannot verify the controller-layer enforcement without reviewing each dashboard feature controller (out of scope for this app-level review).
- Severity: MEDIUM
- Exploitability: LOW — requires a regression in a controller-layer ownership check; the guard itself is correct and well-documented
- Attack Preconditions: A logged-in user who knows another actor's actorId; a regression in a dashboard controller's ownership check; ability to bypass the UI guard (e.g., by constructing a direct API call)
- Blast Radius: Scope of affected dashboard controller's write operation — per-feature
- Identity Leak Type: Actor ownership assertion from client-side identity context
- Cache Trust Type: Identity context (identityContext) — loaded from Supabase session, not directly manipulable by JS without a valid session
- RLS Dependency: REQUIRED — server-side RLS and controller-layer ownership checks must be the authoritative enforcement layer
- Why it matters: The guard's documentation is correct and the design is sound. This finding flags the dependency: any dashboard feature where a controller does NOT call vc.actor_owners verification creates an exploitable gap that the UI guard alone cannot close.
- Recommended mitigation: SPIDER-MAN/VENOM audit of each dashboard card controller (gas, reviews, leads, services, exchange, calendar, portfolio, locksmith, booking-history, team, schedule, settings) to verify server-side ownership enforcement. The app-shell guard itself requires no change.
- Rationale: This is a dependency tracking finding. The guard is correct. The risk lives in the controller layer of dashboard feature modules, not in the app shell.
- Follow-up command: VENOM (per-dashboard-card controller ownership audit), SPIDER-MAN (regression tests for each dashboard write path)
- Provenance: SOURCE_VERIFIED — cited file + line read directly; PORT-V-006/008 comment confirmed
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VENOM SECURITY FINDING

```
- Finding ID: VEN-APP-005
- Location: apps/VCSM/src/app/providers/AuthProvider.jsx:82-99 (auth_session_hydrated log includes userId + email)
- Application Scope: VCSM
- Platform Surface: PWA / Client-Side Debug Logging
- Trust Boundary: Authenticated session data vs. client-side debug log persistence (sessionStorage)
- Boundary Violated: Auth event logs including userId and email are persisted to sessionStorage when debug is enabled; a malicious extension or XSS payload could exfiltrate this data
- Contract Violated: PII minimization — userId and email should not be written to persistent browser storage in any flow
- Current behavior: appendIOSProdDebugLog is a no-op in production (IS_PROD guard confirmed in iosProdDebugger.js:5,222). In development and when the debug toggle (__vcsm_ios_dbg) is set in localStorage, auth events including userId and email (from SESSION_HYDRATE_DONE payload) are logged to sessionStorage under __vcsm_ios_dbg_logs. The email field is written at AuthProvider.jsx:98: email: nextSession?.user?.email ?? null.
- Risk: In development environments, a browser extension, XSS, or devtools script can read __vcsm_ios_dbg_logs from sessionStorage and extract the authenticated user's email and userId. Production: not applicable (IS_PROD blocks all writes). Development: acceptable for internal development use, but logged PII should be minimized.
- Severity: LOW
- Exploitability: LOW — dev-only; requires debug mode enabled AND attacker access to the browser context
- Attack Preconditions: Development environment; debug toggle enabled; attacker access to devtools or XSS execution context
- Blast Radius: userId + email of the authenticated user in the development session
- Identity Leak Type: PII in debug log (userId, email) — dev-only
- Cache Trust Type: sessionStorage (IS_PROD guarded)
- RLS Dependency: NONE
- Why it matters: Email should not appear in any client-side debug log, even in development. A future regression that accidentally enables the logger in production (e.g., a bad IS_PROD check) could exfiltrate user emails.
- Recommended mitigation: Remove the email field from the SESSION_HYDRATE_DONE debug log payload in AuthProvider.jsx:98. userId alone is sufficient for debugging purposes. Audit all other appendIOSProdDebugLog calls for email inclusion.
- Rationale: Defense-in-depth and PII minimization. The production guard is correct but removing PII from the log payload eliminates the risk even if the guard fails.
- Follow-up command: ELEKTRA (audit all appendIOSProdDebugLog call sites for PII in payload)
- Provenance: SOURCE_VERIFIED — cited file + line read directly (AuthProvider.jsx:98)
- CISSP Domain:
  - Primary: Information Security Governance and Risk Management
  - Secondary: Software Development Security
```

---

### VENOM SECURITY FINDING

```
- Finding ID: VEN-APP-006
- Location: apps/VCSM/src/app/providers/AuthProvider.jsx:84,154,201,208
- Application Scope: VCSM
- Platform Surface: PWA / Browser Console
- Trust Boundary: Internal error information vs. browser console visibility
- Boundary Violated: console.warn / console.error calls are not gated by import.meta.env.DEV — they fire in production
- Contract Violated: VCSM logging rules (memory: "No console.log; debug output must render on screen and be dev-only")
- Current behavior: Four console.warn/error calls in AuthProvider.jsx fire in production: (1) [Auth] getSession error (line 84), (2) [Auth] init error (line 154), (3) [Auth] signOut error (line 201), (4) [Auth] channel cleanup skipped (line 208). These write internal error messages and stack traces to the browser console in production builds.
- Risk: Browser console output is visible to any user who opens DevTools. Internal error messages reveal implementation details (function names, error shapes from Supabase, auth flow stages). In a XSS scenario, console output can be intercepted via console override. Error messages from Supabase auth can leak JWT state, session data, or internal error codes.
- Severity: LOW
- Exploitability: LOW — requires DevTools access (same user) or XSS console override (active attacker)
- Attack Preconditions: User opens DevTools OR attacker achieves XSS code execution
- Blast Radius: Internal auth error messages and implementation details; no credentials or tokens logged
- Identity Leak Type: Auth flow implementation details (no PII confirmed in these specific calls)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Violates the project's no-console-log rule. Error details assist an attacker in understanding the auth flow, timing, and error conditions — useful for targeted attacks.
- Recommended mitigation: Wrap all four console calls in import.meta.env.DEV guards. Route production errors through captureMonitoringError (already used in RouteErrorBoundary.jsx:23) for silent telemetry. Exception: console.error('[Auth] signOut error:') and channel cleanup may retain a minimal production log without auth state data.
- Rationale: Aligns with project logging rules and eliminates console-based information leakage in production.
- Follow-up command: ELEKTRA (sweep all app/ source files for unguarded console calls)
- Provenance: SOURCE_VERIFIED — cited file + line numbers confirmed by grep
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Information Security Governance and Risk Management
```

---

### VENOM SECURITY FINDING

```
- Finding ID: VEN-APP-007
- Location: apps/VCSM/src/app/providers/AuthProvider.jsx:174-176
- Application Scope: VCSM
- Platform Surface: PWA / Client-Side localStorage
- Trust Boundary: Supabase session (authoritative) vs. localStorage actor hint cache (client-writable)
- Boundary Violated: actor_kind and actor_vport_id are written to localStorage during identity resolution (confirmed by INDEX.md) and cleared on logout — but the write path exists elsewhere (identity state); removal on logout is the app shell's responsibility only
- Contract Violated: Logout must clear all identity state to prevent stale actor context after session end
- Current behavior: AuthProvider.logout() explicitly removes actor_kind and actor_vport_id from localStorage and sets actor_touch to the current timestamp (line 174-176). This is a best-effort wipe on the current device/session. The identity state engine may also write these keys during normal operation. The logout wipe sequence is: setUser/setSession null → localStorage removes → clearAllIdentityStorage() → supabase.auth.signOut({ scope: 'local' }).
- Risk: Race condition if clearAllIdentityStorage() runs after the localStorage removes but before supabase.auth.signOut completes, a brief window exists where Supabase still has a valid session but local identity state is null. This is the optimistic logout pattern — intended for UX speed. The risk is UI flicker, not a security bypass. The real security question is whether any identity key besides the three explicitly removed persists in localStorage post-logout. clearAllIdentityStorage() is the authoritative cleanup function — its completeness is not verifiable from this module alone.
- Severity: LOW
- Exploitability: LOW — requires access to localStorage after logout (same device) and knowledge of key names
- Attack Preconditions: Physical or logical access to the device after logout; knowledge of identity localStorage keys
- Blast Radius: Stale actor identity hints in localStorage (not authoritative — identity engine re-hydrates from Supabase session on next login)
- Identity Leak Type: Actor kind and actor ID hints in localStorage — not directly exploitable without a valid Supabase session
- Cache Trust Type: localStorage identity hint cache
- RLS Dependency: NONE — localStorage values are client-side only; RLS enforces via JWT, not localStorage
- Why it matters: If clearAllIdentityStorage() has gaps, stale identity data could persist and influence actor resolution on the next login (e.g., wrong actor context briefly before hydration). Not a security bypass, but a correctness risk.
- Recommended mitigation: Audit clearAllIdentityStorage() to confirm it covers all localStorage keys written by the identity engine, including actor_kind, actor_vport_id, actor_touch, and any additional identity keys. Ensure the three explicit removes in AuthProvider.logout() are redundant (belt-and-suspenders), not the primary cleanup.
- Rationale: Defense-in-depth for logout completeness. The current implementation appears correct but the completeness guarantee lives in identityStorage.js, not the app shell.
- Follow-up command: ELEKTRA (audit clearAllIdentityStorage and all identity localStorage key writes)
- Provenance: SOURCE_VERIFIED — cited file + line read directly
- CISSP Domain:
  - Primary: Identity and Access Management (IAM)
  - Secondary: Access Control
```

---

### VENOM SECURITY FINDING (GOVERNANCE)

```
- Finding ID: VEN-APP-008
- Location: apps/VCSM/src/app/ (entire module)
- Application Scope: VCSM
- Platform Surface: Governance / Behavior Contract
- Trust Boundary: N/A — governance finding
- Boundary Violated: No formal behavior contract exists; security rules cannot be verified against a declared invariant set
- Contract Violated: BEHAVIOR.md is required per platform governance; §5 Security Rules and §9 Must Never Happen invariants are mandatory
- Current behavior: BEHAVIOR.md is a PLACEHOLDER containing only "Status: PLACEHOLDER / Feature: app / Behavior contract pending source review." No §5 Security Rules, no §9 Must Never Happen, no auth flow specification, no guard chain specification, no consent gate specification, no iOS bootstrap specification.
- Risk: Security rules cannot be tracked, verified, or regression-tested against a formal contract. Future engineers have no declared invariants to preserve. Any change to auth guard logic, consent gate, or recovery flow has no contract baseline to validate against.
- Severity: LOW
- Exploitability: N/A — governance gap, not exploitable
- Attack Preconditions: N/A
- Blast Radius: Governance — all security review and regression testing for this module lacks a contract baseline
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Without §5 Security Rules, there is no formal list of invariants VENOM can check. Without §9 Must Never Happen, regressions in auth guard behavior (e.g., ProtectedRoute bypassed) have no formal baseline to detect. This is the most impactful governance gap in the app module.
- Recommended mitigation: LOGAN must write the full BEHAVIOR.md for the app module covering: auth session hydration contract, recovery flow contract, route guard chain (ProtectedRoute → ProfileGatedOutlet → OwnerOnlyDashboardGuard), consent gate contract, iOS bootstrap contract, and logout sequence contract.
- Rationale: Behavior contracts are required governance. The app module is security-critical (it is the only auth layer) and must have a formal spec.
- Follow-up command: LOGAN (write BEHAVIOR.md for app module)
- Provenance: SOURCE_VERIFIED — BEHAVIOR.md read directly; confirmed PLACEHOLDER status
- CISSP Domain:
  - Primary: Information Security Governance and Risk Management
  - Secondary: Software Development Security
```

---

## 8. Source Verification Summary

| File | Read | Key Security Observations |
|---|---|---|
| apps/VCSM/src/app/providers/AuthProvider.jsx | YES | Recovery nonce (VEN-APP-001); local signout (VEN-APP-003); console calls in production (VEN-APP-006); PII in debug log (VEN-APP-005); actor localStorage wipe (VEN-APP-007) |
| apps/VCSM/src/app/guards/ProtectedRoute.jsx | YES | Auth + email verification + consent gate chain — VERIFIED_SAFE (no bypass found) |
| apps/VCSM/src/app/guards/ProfileGatedOutlet.jsx | YES | Delegates to CompleteProfileGate adapter — VERIFIED_SAFE |
| apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx | YES | Redirects authenticated users to /feed — VERIFIED_SAFE |
| apps/VCSM/src/app/routes/public/auth.routes.jsx | YES | /reset-password excluded from AuthPublicRoute (VEN-APP-002 — intentional, documented) |
| apps/VCSM/src/app/routes/index.jsx | YES | Route assembly; no security bypass found |
| apps/VCSM/src/app/routes/protected/app.routes.jsx | YES | Dev routes gated by import.meta.env.DEV — VERIFIED_SAFE in prod |
| apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx | YES | OwnerOnlyDashboardGuard — UI-only gate (VEN-APP-004); BlockedVportGuard — UI-only |
| apps/VCSM/src/app/routes/lazyApp.jsx | YES | DevDiagnosticsScreen / PerfDashboardScreen resolve to null in production — VERIFIED_SAFE |
| apps/VCSM/src/app/layout/RootLayout.jsx | YES | IOSDebugHUD / IOSProdRouteDebugger DEV-only (line 101-102) — VERIFIED_SAFE |
| apps/VCSM/src/app/platform/ios/IOSDebugHUD.jsx | YES | DEV + isIOS check at line 90 — no production exposure — VERIFIED_SAFE |
| apps/VCSM/src/app/platform/ios/IOSProdRouteDebugger.jsx | YES | isIOSProdDebuggerEnabled() returns false in production — VERIFIED_SAFE |
| apps/VCSM/src/app/platform/ios/ios.env.js | YES | navigator.userAgent check — no security surface |
| apps/VCSM/src/shared/lib/iosProdDebugger.js | YES | IS_PROD guard on all functions — VERIFIED_SAFE; appendIOSProdDebugLog no-op in prod |
| apps/VCSM/src/debuggers-stub/identity/index.js | YES | All exports are no-ops — VERIFIED_SAFE production stubs |
| apps/VCSM/src/debuggers-stub/cycle.js | YES | All exports are no-ops — VERIFIED_SAFE production stubs |
| apps/VCSM/vite.config.js (excerpt) | YES | @debuggers alias resolves to stubs in production mode — VERIFIED_SAFE |
| apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js | YES | Recovery nonce read/validate logic (VEN-APP-001); errorDescription dev-only (LOW) |
| apps/VCSM/src/features/auth/dal/authSession.read.dal.js | YES | supabase.auth.getSession — no dangerous params; VERIFIED_SAFE |
| apps/VCSM/src/features/auth/model/emailVerification.model.js | YES | email_confirmed_at boolean check — VERIFIED_SAFE |
| apps/VCSM/src/app/routes/RouteErrorBoundary.jsx | YES | console.error DEV-gated (line 20-22) — VERIFIED_SAFE; captureMonitoringError in prod |
| apps/VCSM/src/shared/utils/resolveRealm.js | YES | Realm ID resolution — fallback UUIDs in env vars, not secrets — LOW risk |

**Source files NOT found / NOT applicable:**
- apps/VCSM/src/features/app/ — NO_SOURCE_DIR (correct — the module lives at apps/VCSM/src/app/, not src/features/app/)

---

## 9. Confidence Summary

| Dimension | Level | Notes |
|---|---|---|
| Scanner data confidence | HIGH | All 8 maps FRESH (<1h); zero surfaces reported — consistent with shell architecture |
| Source read coverage | HIGH | 22 key files read; all significant security surfaces traced |
| Write surface verification | HIGH | Zero DB writes confirmed from both scanner and source; browser storage writes identified and classified |
| Auth gate chain verification | HIGH | ProtectedRoute, ProfileGatedOutlet, OwnerOnlyDashboardGuard, BlockedVportGuard all read |
| Recovery flow verification | HIGH | AuthProvider + setNewPassword.controller.js both read; nonce mechanism fully traced |
| Debug surface verification | HIGH | iosProdDebugger, IOSDebugHUD, IOSProdRouteDebugger, debuggers-stub, vite.config.js all read |
| Behavior contract cross-check | NOT POSSIBLE | BEHAVIOR.md is a PLACEHOLDER — no §5 or §9 declared |
| Overall VENOM confidence | HIGH | All major trust boundaries inspected from source |

---

## 10. THOR Impact

| Finding ID | Severity | THOR Blocker | Rationale |
|---|---|---|---|
| VEN-APP-001 | HIGH | NO | Self-exploitation only; no cross-user path; documented limitation; product team aware |
| VEN-APP-002 | MEDIUM | NO | Intentional design; controller gate prevents any write bypass |
| VEN-APP-003 | MEDIUM | NO | Standard Supabase local-scope signout pattern; UX trade-off, not a blocking bug |
| VEN-APP-004 | MEDIUM | NO | UI guard is correct; risk is in controller layer (separate audit scope) |
| VEN-APP-005 | LOW | NO | Dev-only; PII in debug log is hardening recommendation |
| VEN-APP-006 | LOW | NO | Console calls violate project rules; requires fix but not release-blocking |
| VEN-APP-007 | LOW | NO | Logout completeness — best-effort wipe; not a security bypass |
| VEN-APP-008 | LOW | NO | Governance gap; BEHAVIOR.md needed but no exploitable consequence |

**THOR Release Blocker: NO**

No findings rise to the level of a THOR release blocker. VEN-APP-001 (HIGH) is an acknowledged pre-existing limitation with a documented bypass caveat and self-exploitation-only impact. The auth gate chain (ProtectedRoute + email verification + consent gate) is VERIFIED_SAFE.

---

## 11. Required Follow-Up Commands

| Finding | Command | Reason |
|---|---|---|
| VEN-APP-001 | ELEKTRA | Trace the full setNewPassword → updateUser chain; assess Edge Function proxy feasibility |
| VEN-APP-001 | Carnage | Assess Edge Function scaffolding for server-side updateUser proxy with recovery provenance check |
| VEN-APP-002 | ELEKTRA | Verify resolveRecoverySessionController execution path for regression risk |
| VEN-APP-002 | SPIDER-MAN | Regression test: authenticated user navigating to /reset-password must never see a submittable form |
| VEN-APP-003 | SPIDER-MAN | Test: logout on device A; verify device B session still active before natural expiry |
| VEN-APP-003 | ELEKTRA | Assess global signout flow feasibility |
| VEN-APP-004 | VENOM | Per-dashboard-card controller ownership audit (each card controller must have actor_owners check) |
| VEN-APP-004 | SPIDER-MAN | Regression tests for each dashboard write path |
| VEN-APP-005 | ELEKTRA | Audit all appendIOSProdDebugLog call sites for PII in payload |
| VEN-APP-006 | ELEKTRA | Sweep all app/ source files for unguarded console calls |
| VEN-APP-007 | ELEKTRA | Audit clearAllIdentityStorage and all identity localStorage key writes |
| VEN-APP-008 | LOGAN | Write formal BEHAVIOR.md for app module |

---

## 12. Mitigation Plan

| Finding ID | Severity | Status | Effort | Owner | Action |
|---|---|---|---|---|---|
| VEN-APP-001 | HIGH | OPEN | HIGH | Platform team | Introduce server-side Edge Function wrapping updateUser with recovery provenance check; maintain client nonce as UX gate only |
| VEN-APP-002 | MEDIUM | OPEN | LOW | Platform team | Reduce timeout from 15s to 3-5s; document /reset-password exclusion in BEHAVIOR.md; add regression test via SPIDER-MAN |
| VEN-APP-003 | MEDIUM | OPEN | LOW | Platform team | Add "Sign out of all devices" option (supabase.auth.signOut scope:'global') in Settings/Security |
| VEN-APP-004 | MEDIUM | OPEN | HIGH | Per-feature teams | VENOM audit of each dashboard card controller for actor_owners ownership verification |
| VEN-APP-005 | LOW | OPEN | LOW | Platform team | Remove email field from SESSION_HYDRATE_DONE debug log payload (AuthProvider.jsx:98) |
| VEN-APP-006 | LOW | OPEN | LOW | Platform team | Wrap four console.warn/error calls in import.meta.env.DEV guards; route prod errors to captureMonitoringError |
| VEN-APP-007 | LOW | OPEN | LOW | Platform team | Audit clearAllIdentityStorage() for completeness; confirm actor_kind, actor_vport_id, actor_touch are covered |
| VEN-APP-008 | LOW | OPEN | MEDIUM | LOGAN | Write full BEHAVIOR.md for app module covering auth flow, guard chain, consent gate, recovery flow, iOS bootstrap |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Coverage |
|---|---|---|
| Identity and Access Management (IAM) | VEN-APP-001, VEN-APP-003, VEN-APP-007 | 3 findings — recovery session provenance, session scope on logout, identity hint cache |
| Access Control | VEN-APP-003, VEN-APP-004 | 2 findings — session persistence, UI-only dashboard guard |
| Software Development Security | VEN-APP-001, VEN-APP-002, VEN-APP-004, VEN-APP-005, VEN-APP-006 | 5 findings — client-side gate, dev exposure, console leakage, PII in logs |
| Information Security Governance and Risk Management | VEN-APP-005, VEN-APP-006, VEN-APP-008 | 3 findings — PII minimization, console rules, behavior contract gap |
| Security Architecture and Engineering | VEN-APP-001, VEN-APP-004 | 2 findings — trust boundary design, defense-in-depth |

**CISSP Domains NOT applicable to this module:**
- Cryptography (no custom crypto; Supabase handles JWT signing)
- Communications and Network Security (no networking code in app shell)
- Security Operations (no ops surface)
- Security Assessment and Testing (covered by SPIDER-MAN follow-ups)

---

*VENOM V2 review complete. 8 findings total: 0 CRITICAL, 1 HIGH, 3 MEDIUM, 4 LOW. THOR release blocker: NO.*
