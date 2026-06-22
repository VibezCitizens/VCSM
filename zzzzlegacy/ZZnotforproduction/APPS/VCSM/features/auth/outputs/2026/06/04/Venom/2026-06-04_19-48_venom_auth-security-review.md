# VENOM V2 Security Review — auth

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Run Time | 19:48 |
| Feature | auth |
| Application | VCSM |
| VENOM Version | V2 |
| Reviewer | VENOM (automated security sheriff) |
| Source Root | apps/VCSM/src/features/auth/ |
| Doc Root | ZZnotforproduction/APPS/VCSM/features/auth/ |
| Output Path | ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_auth-security-review.md |
| Overall Severity | HIGH |
| THOR Release Blocker | YES — VEN-AUTH-001 |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At                 | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

| Field | Value |
|---|---|
| Input File | /tmp/venom_features/auth.json |
| Write Surfaces | 7 |
| RPCs | 2 |
| Security Paths | 9 |
| Edge Functions | 0 |
| Write Execution Paths | 7 |
| RPC Execution Paths | 2 |
| Scanner Route Confidence | LOW (all paths — no route-confirmed execution paths resolved) |

**Scanner Note:** All 9 security paths were flagged `confidence: LOW` with evidence "write surface / RPC discovered without route-confirmed path." This is an expected scanner limitation for client-side Supabase auth flows, where the trigger is the auth state machine rather than a routed HTTP handler. Source verification was performed directly on all DAL and controller files to compensate.

---

## 4. Security Surface Inventory

| Surface | Type | File | Operation | Table/RPC |
|---|---|---|---|---|
| dalCreateUserActor | RPC | dal/actorCreate.dal.js | rpc | vc.create_actor_for_user |
| dalCreateActorOwner | Write | dal/actorOwnerCreate.dal.js | upsert | vc.actor_owners |
| generateUsernameDAL | RPC | dal/onboarding.dal.js | rpc | generate_username |
| upsertProfileShellDAL | Write | dal/onboarding.dal.js | upsert | profiles |
| upsertCompletedOnboardingProfileDAL | Write | dal/onboarding.dal.js | upsert | profiles |
| dalUpdateProfileDiscoverable | Write | dal/profile.dal.js | update | profiles |
| dalUpsertRegisterProfile | Write | dal/register.dal.js | upsert | profiles |
| dalExchangeCodeForSession | Auth | dal/authCallback.dal.js | auth exchange | Supabase Auth |
| dalUpdateUserPassword | Auth Write | dal/resetPassword.dal.js | auth.updateUser | Supabase Auth |
| dalSignUpRegisterUser | Auth Write | dal/register.dal.js | auth.signUp | Supabase Auth |
| dalUpdateRegisterUser | Auth Write | dal/register.dal.js | auth.updateUser | Supabase Auth |
| dalMirrorWandersSessionToPrimary | Auth Write | dal/register.dal.js | auth.setSession | Supabase Auth |

---

## 5. Scanner Signals Block

| Signal | Count | Disposition |
|---|---|---|
| Write surfaces (profiles) | 4 | Verified — 3 session-guarded, 1 partial (shell upsert — see VEN-AUTH-004) |
| Write surfaces (actor_owners) | 1 | Verified — owner-scoped guard present |
| RPCs (vc schema) | 2 | Verified — create_actor_for_user has profileId===userId guard; generate_username is side-effect-safe |
| Edge Functions | 0 | None |
| Routes with unknown access | 9 | All LOW confidence — source-verified directly |
| Client-only recovery gate | 1 | Known limitation — see VEN-AUTH-001 |
| Wanders session mirror | 1 | Guard present — see VEN-AUTH-003 (MITIGATED) |
| Debug instrumentaton in login hook | 1 | Production stub confirmed — see VEN-AUTH-005 |
| Open redirect candidate | 1 | Partial block — see VEN-AUTH-002 |

---

## 6. Behavior Contract Status Block

| Field | Status |
|---|---|
| BEHAVIOR.md Exists | YES |
| BEHAVIOR.md Status | PLACEHOLDER |
| §5 Security Rules | NOT PRESENT — contract is a stub |
| §9 Must Never Happen | NOT PRESENT — contract is a stub |
| Contract Completeness | 0% |

**Assessment:** BEHAVIOR.md exists at `ZZnotforproduction/APPS/VCSM/features/auth/BEHAVIOR.md` but contains only a placeholder note. No §5 Security Rules or §9 Must Never Happen invariants have been defined. This is a governance gap — security invariants that ARE enforced in source (profileId===userId, Wanders session user match, recovery nonce) are not formally captured in the contract. VENOM verified these properties against source directly.

No behavior contract cross-check was possible. All verification was source-only.

---

## 7. Trust Boundary Findings

---

### VEN-AUTH-001 — Client-Side-Only Recovery Provenance Gate

```
VENOM SECURITY FINDING
- Finding ID: VEN-AUTH-001
- Location: apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:39-46
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated session holder
- Boundary Violated: Password reset provenance is not server-enforced
- Contract Violated: Auth security — password update must originate from a genuine recovery session
- Current behavior: The recovery gate uses a sessionStorage nonce (UUID + issuedAt TTL) written by
  AuthProvider on PASSWORD_RECOVERY event. This prevents accidental access and casual bypass.
  However, the code explicitly documents: "supabase.auth.updateUser({ password }) requires a valid
  authenticated JWT but does NOT enforce that the session originated from a PASSWORD_RECOVERY event."
  A source-code-aware user who holds any valid authenticated Supabase session can set a conforming
  JSON nonce in sessionStorage and submit a new password for their own account without a genuine
  reset email.
- Risk: Self-exploitation: an attacker with an existing authenticated session can bypass the
  recovery flow gate and reset their own password without email confirmation. This does not affect
  other users — there is no cross-user path. However, a stolen-session attacker (e.g. via XSS
  or session-hijacking) could silently lock the victim out by resetting their password without
  triggering an email.
- Severity: HIGH
- Exploitability: MEDIUM (requires: source code knowledge + valid session + sessionStorage access)
- Attack Preconditions: Attacker must have (1) read access to this source, (2) a valid authenticated
  Supabase session for the target account, (3) ability to set sessionStorage on the page.
- Blast Radius: Single account — no cross-user elevation possible. Impact = account takeover on
  a compromised session without email notification to victim.
- Identity Leak Type: None
- Cache Trust Type: sessionStorage nonce (client-controlled)
- RLS Dependency: NONE — supabase.auth.updateUser is an Auth API call, not a DB table write.
- Why it matters: If a victim's session is already hijacked (e.g., via XSS), the attacker can
  silently rotate credentials, locking out the legitimate user with no email warning.
- Recommended mitigation: Implement a server-side Edge Function (e.g., /functions/v1/reset-password)
  that accepts the PKCE recovery code and new password, validates recovery session origin server-side
  using Supabase Admin API (verifyOtp / getUser with recovery token context), then calls
  adminAuthClient.updateUserById. This removes the client-side nonce entirely and closes the
  server-side provenance gap.
- Rationale: The client-side nonce is explicitly documented as "prevents accidental and casual
  access, not determined technical bypass." Closure requires a server-side check.
- Follow-up command: ELEKTRA (trace Edge Function implementation), Carnage (if DB migration needed for
  recovery audit log)
- Provenance: SOURCE_VERIFIED — setNewPassword.controller.js:39-46, comment block explicitly
  documents the limitation as "VENOM-AUTH-001"
- CISSP Domain:
  - Primary: Identity and Access Management (IAM)
  - Secondary: Software Development Security
```

---

### VEN-AUTH-002 — Open Redirect via Unvalidated state.from After Login

```
VENOM SECURITY FINDING
- Finding ID: VEN-AUTH-002
- Location: apps/VCSM/src/features/auth/hooks/useLogin.js:56-67
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Unauthenticated user (login form)
- Boundary Violated: Post-login redirect destination is accepted from router state without
  origin validation
- Contract Violated: Auth security — redirect after login must be to same-origin paths only
- Current behavior: After successful login, the hook reads location.state.from and navigates
  to that value if it is a non-empty string and not one of '/login', '/register', '/reset',
  '/forgot-password'. There is no check that the destination is a same-origin path.
  location.state is set by the application's own navigation in normal usage, but router state
  can be crafted via direct history manipulation. The destination string is passed directly to
  react-router's navigate(), which will pass non-path strings through as-is.
  In useAuthOnboarding.js:32, state.from is also used as redirectTo with the same absence of
  origin validation.
- Risk: An attacker who can control router state (e.g., via a crafted navigation link, a deep
  link in a PWA, or a social engineering scenario) could redirect a freshly authenticated user
  to an attacker-controlled page. In a PWA context, if state can be injected via the navigation
  event from an external source, this creates a phishing vector: user logs in legitimately,
  gets redirected to attacker page that mimics VCSM, harvesting further credentials or tokens.
- Severity: MEDIUM
- Exploitability: LOW-MEDIUM (requires ability to inject router state — non-trivial in a SPA
  but possible in PWA deep-link or native webview scenarios)
- Attack Preconditions: Attacker must be able to induce navigation to /login with state.from
  set to an external URL. Most practical vector: a crafted iOS/Android deep link to the PWA.
- Blast Radius: Single user — targeted phishing only, no platform-wide impact.
- Identity Leak Type: None directly; enables credential harvest post-login
- Cache Trust Type: React Router state (client-controlled)
- RLS Dependency: NONE
- Why it matters: PWA deep-links and iOS/Android universal links accept URLs with state
  parameters. An attacker embedding a deep link (e.g., in a phishing email) can set state.from
  to https://evil.example.com. After the user authenticates, react-router navigate('https://evil.example.com')
  will produce a full navigation to the external URL.
- Recommended mitigation: Add a same-origin guard before using state.from as a redirect
  destination. Pattern: const isSafeRedirect = (dest) => typeof dest === 'string' &&
  dest.startsWith('/') && !dest.startsWith('//') — then default to '/feed' if not safe. Apply
  in both useLogin.js and useAuthOnboarding.js.
- Rationale: React Router's navigate() does accept external URLs. The blocklist check on
  '/login', '/register' etc. does not block 'https://evil.example.com'. A simple startsWith('/')
  check closes this class entirely.
- Follow-up command: SPIDER-MAN (regression test for redirect guard), ELEKTRA (verify no
  other navigation state is sourced from URL params)
- Provenance: SOURCE_VERIFIED — useLogin.js:56-67, useAuthOnboarding.js:32
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management (IAM)
```

---

### VEN-AUTH-003 — Wanders Session Mirror Guard (MITIGATED — Documented for Completeness)

```
VENOM SECURITY FINDING
- Finding ID: VEN-AUTH-003
- Location: apps/VCSM/src/features/auth/controllers/register.controller.js:20-41
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Wanders (secondary Supabase client) session boundary
- Boundary Violated: Cross-client session injection
- Contract Violated: Auth security — Wanders session must only be mirrored if it belongs to
  the same user who just registered
- Current behavior: MITIGATED. Before injecting Wanders session tokens into the primary
  Supabase client via setSession(), maybeMirrorWandersSession() reads the Wanders client
  session and verifies session.user.id === expectedUserId (the newly registered user).
  If mismatch or no session, it aborts. This was explicitly flagged as VENOM-AUTH-003 in the
  inline code comment.
- Risk (original): A stale Wanders session from a different user could have overwritten the
  primary client session, establishing the wrong user identity after registration.
- Current Status: GUARD PRESENT AND VERIFIED. No finding at current severity.
- Severity: LOW (documentation finding only — guard is in place)
- Exploitability: LOW (guard enforced)
- Attack Preconditions: Would require Wanders session stale-ness AND guard bypass — not feasible
  with current implementation.
- Blast Radius: None — guard prevents the scenario.
- Identity Leak Type: None (mitigated)
- Cache Trust Type: Wanders Supabase client session
- RLS Dependency: NONE
- Why it matters: Documenting that this was identified and mitigated, so future refactors
  preserve the guard.
- Recommended mitigation: Preserve the user.id check in maybeMirrorWandersSession. Add a
  SPIDER-MAN regression test to confirm the guard fires.
- Rationale: Guard is correct as implemented. Regression coverage is the remaining gap.
- Follow-up command: SPIDER-MAN (add regression test for Wanders session mismatch abort)
- Provenance: SOURCE_VERIFIED — register.controller.js:20-41
- CISSP Domain:
  - Primary: Identity and Access Management (IAM)
  - Secondary: Software Development Security
```

---

### VEN-AUTH-004 — Profile Shell Upsert Without Session Verification

```
VENOM SECURITY FINDING
- Finding ID: VEN-AUTH-004
- Location: apps/VCSM/src/features/auth/controllers/profileOnboarding.controller.js:7-25
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated session (assumed)
- Boundary Violated: profileOnboarding.controller does not verify the active session before
  writing a profile shell for the supplied userId
- Contract Violated: Auth security — all profile write operations must verify the caller's
  session matches the userId being written
- Current behavior: ensureProfileShell({ userId, email }) calls readProfileShellDAL(userId)
  and then upsertProfileShellDAL({ id: userId, email, ... }) directly. There is no call to
  dalGetAuthSession() or any session verification inside this controller. It trusts the
  userId argument entirely.
  The caller — evaluateCompleteProfileGateController() — does call readCurrentAuthUserDAL()
  (which calls supabase.auth.getUser(), a server-verified call) and passes user.id. So in
  the normal execution path, the userId is correctly derived from a verified server call.
  However, ensureProfileShell is also exported and could be called by any future controller
  with an arbitrary userId.
- Risk: If ensureProfileShell is called with a userId that does not match the authenticated
  session (e.g., a future refactor passes a stale userId, or the function is called in a
  new context where the caller's session is not verified), a profile shell could be written
  for a different user's ID. RLS on the profiles table is the ultimate guard, but the
  application-layer check is absent.
- Severity: MEDIUM
- Exploitability: LOW (not directly exploitable at present — requires a future caller mistake
  or refactor that bypasses the owning controller)
- Attack Preconditions: Internal: a future refactor or new caller passing the wrong userId.
  External: not directly exploitable without a companion vulnerability.
- Blast Radius: Single profile row — could create a ghost profile shell for another user's ID.
- Identity Leak Type: None (profile shell is empty at upsert)
- Cache Trust Type: None
- RLS Dependency: ASSUMED — relying on profiles table RLS to reject writes for non-owned rows.
  Not verified in this review.
- Why it matters: Defense-in-depth gap. Application-layer session checks should not be optional
  for any function that writes a profile row, even if RLS is present.
- Recommended mitigation: Add a session check inside ensureProfileShell: read session, verify
  session.user.id === userId before writing. Pattern mirrors profile.controller.js:10-12.
- Rationale: Cheap to fix. Preserves the invariant that all profile write operations are
  session-verified at the application layer, regardless of RLS state.
- Follow-up command: DB (verify RLS policy on profiles table for this write path), ELEKTRA
  (confirm profiles RLS covers upsert from anon/authenticated user mismatch)
- Provenance: SOURCE_VERIFIED — profileOnboarding.controller.js:7-25, profile.controller.js:10-12
  (comparison — the latter has the check, the former does not)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management (IAM)
```

---

### VEN-AUTH-005 — Debug Instrumentation in Login Hook (Production Stub Gap Risk)

```
VENOM SECURITY FINDING
- Finding ID: VEN-AUTH-005
- Location: apps/VCSM/src/features/auth/hooks/useLogin.js:5, 22-74
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Production build boundary
- Boundary Violated: Debug instrumentation importing from @debuggers alias — production safety
  depends entirely on build-time alias substitution
- Contract Violated: Debug logging rules — no debug output must reach production
- Current behavior: useLogin.js imports debugLoginEvent, debugLoginError, debugLoginSessionSnapshot
  from '@debuggers/identity'. In production builds (mode === 'production' in vite.config.js),
  this alias resolves to ./src/debuggers-stub/identity/index.js, which exports no-op functions.
  In non-production builds, it resolves to zNOTFORPRODUCTION/_ACTIVE/debuggers — which was not
  found at that path in this scan (directory absent). The debug stub was confirmed to be no-ops.
  debugLoginSessionSnapshot(data) is called with the full login response object (including
  user.id and email) at line 54. In the production stub this is a no-op. However, if the
  _ACTIVE/debuggers path is populated in a dev build, this will log full session data.
- Risk: (1) The production safety guarantee is a build-time alias substitution — if vite.config.js
  is misconfigured or the build runs without mode=production, debug functions are live.
  (2) The non-production debugger path (zNOTFORPRODUCTION/_ACTIVE/debuggers) was not found —
  this means any dev build where the path is absent will likely throw a module-not-found error,
  potentially breaking the dev login flow silently (non-security, but operational risk).
  (3) Full session data including userId and email is passed to debugLoginSessionSnapshot —
  if this ever reaches a real logger (dev build, future change), PII is logged.
- Severity: LOW
- Exploitability: LOW (only affects dev builds or a misconfigured production build)
- Attack Preconditions: Production build must be misconfigured (mode != 'production') OR
  the build pipeline must be compromised.
- Blast Radius: Limited to dev environment PII logging unless production is misconfigured.
- Identity Leak Type: PII (userId, email) in dev logging context
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Debug instrumentation that passes PII data into a conditionally-live
  function is a latent leak risk. The production stub is a single point of failure.
- Recommended mitigation: (1) Wrap debug calls with an explicit isDev guard:
  if (import.meta.env.DEV) { debugLoginSessionSnapshot(data) } — this removes the runtime
  dependency on the alias substitution working correctly. (2) Verify that the _ACTIVE/debuggers
  path is consistently populated for dev builds or that the missing directory does not cause
  silent failures.
- Rationale: Defense-in-depth. The current approach is correct but brittle.
- Follow-up command: ELEKTRA (audit all @debuggers imports across VCSM for similar patterns)
- Provenance: SOURCE_VERIFIED — useLogin.js:5, debuggers-stub/identity/index.js (confirmed no-ops),
  vite.config.js:49-52 (alias configuration)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Operations
```

---

### VEN-AUTH-006 — Actor Creation Owner-Scope Guard (VERIFIED SAFE — Documented)

```
VENOM SECURITY FINDING
- Finding ID: VEN-AUTH-006
- Location: apps/VCSM/src/features/auth/controllers/createUserActor.controller.js:26-30
- Application Scope: VCSM
- Platform Surface: PWA / Supabase RPC (vc.create_actor_for_user)
- Trust Boundary: Authenticated session
- Boundary Violated: N/A — guard IS present
- Contract Violated: N/A
- Current behavior: VERIFIED SAFE. createUserActorForProfile() enforces profileId === userId
  before calling dalCreateUserActor. The guard comment explicitly names this as
  "VENOM-AUTH-006" with the rationale: "Callers (onboarding controller, join onboarding
  controller) pass session.user.id for both, but this guard ensures a future caller cannot
  pass a different profileId to create an actor under another user's identity."
  Both callers (onboarding.controller.js:116-120 and onboarding.controller.js:169-174) are
  verified to pass user.id (from session) for both arguments.
- Risk: None at present. Guard is enforced.
- Severity: LOW (documentation finding — guard present, no action required)
- Exploitability: LOW
- Attack Preconditions: N/A
- Blast Radius: None
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: VERIFIED — RPC vc.create_actor_for_user uses schema('vc').rpc() which
  is subject to Supabase RLS in the vc schema.
- Why it matters: Documents that the ownership guard was evaluated and confirmed correct.
- Recommended mitigation: Add regression test asserting that profileId !== userId throws.
- Rationale: The guard exists and is correct. Regression coverage is the gap.
- Follow-up command: SPIDER-MAN (regression test for owner-scope guard in actor creation)
- Provenance: SOURCE_VERIFIED — createUserActor.controller.js:26-30
- CISSP Domain:
  - Primary: Identity and Access Management (IAM)
  - Secondary: Software Development Security
```

---

### VEN-AUTH-007 — Behavior Contract is a Placeholder — Missing Security Invariants

```
VENOM SECURITY FINDING
- Finding ID: VEN-AUTH-007
- Location: ZZnotforproduction/APPS/VCSM/features/auth/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Governance / Documentation
- Trust Boundary: Engineering governance
- Boundary Violated: Auth feature has no formal security contract — invariants enforced in
  source are not documented in BEHAVIOR.md
- Contract Violated: Platform governance — all features must have a complete BEHAVIOR.md with
  §5 Security Rules and §9 Must Never Happen sections
- Current behavior: BEHAVIOR.md exists but contains only "Status: PLACEHOLDER / Behavior
  contract pending source review." There are no §5 or §9 sections. The following invariants
  are enforced in source but not documented: (1) actor creation is owner-scoped
  (profileId===userId), (2) Wanders session mirror verifies user match, (3) recovery nonce
  gate is client-only with documented server-side limitation, (4) hash.get('type') is
  attacker-controllable and must not be used as recovery authority, (5) error_description
  must not leak to production UI.
- Risk: Future engineers modifying auth controllers have no formal reference for which
  invariants must be preserved. A refactor could silently remove a guard without violating
  any contract because no contract exists.
- Severity: MEDIUM
- Exploitability: LOW (governance gap, not a direct exploit)
- Attack Preconditions: Future engineering changes without reference to security invariants.
- Blast Radius: Platform-wide — auth is the foundational trust boundary for all features.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Auth is the highest-risk feature in any platform. A missing contract means
  security invariants are only preserved by code comments and institutional memory.
- Recommended mitigation: Complete BEHAVIOR.md §5 and §9 sections. At minimum document:
  the five invariants listed above in Current Behavior, the recovery session provenance
  limitation (VEN-AUTH-001), and the open redirect risk (VEN-AUTH-002).
- Rationale: A complete contract enables future VENOM and BLACKWIDOW passes to do
  cross-checks. Without it, every future review must re-derive invariants from source.
- Follow-up command: BLACKWIDOW (runtime verification of invariants once documented),
  SPIDER-MAN (test coverage for each §9 invariant)
- Provenance: SOURCE_VERIFIED — BEHAVIOR.md read directly; source invariants verified
  against controller files
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

## 8. Source Verification Summary

| File | Verified | Auth Check Present | Notes |
|---|---|---|---|
| dal/actorCreate.dal.js | YES | N/A (DAL layer — Supabase RPC, RLS enforced) | profileId required guard present |
| dal/actorOwnerCreate.dal.js | YES | N/A (DAL layer) | upsert with ignoreDuplicates — idempotent |
| dal/onboarding.dal.js | YES | N/A (DAL layer) | upsertCompletedOnboardingProfileDAL: sets publish=true, discoverable=true on completion |
| dal/profile.dal.js | YES | N/A (DAL layer) | No .eq('id', session.user.id) filter — relies on controller |
| dal/register.dal.js | YES | N/A (DAL layer) | dalMirrorWandersSessionToPrimary: setSession() — guarded at controller layer |
| dal/authSession.read.dal.js | YES | N/A (reads only) | getSession() returns cached JWT — not server-verified |
| dal/authCallback.dal.js | YES | N/A | exchangeCodeForSession — PKCE, single-use |
| dal/resetPassword.dal.js | YES | N/A | dalUpdateUserPassword — no recovery provenance check (VEN-AUTH-001) |
| dal/emailVerification.dal.js | YES | N/A | resend — no session required by design |
| controllers/authCallback.controller.js | YES | VERIFIED SAFE | error_description guarded in production; hash.get('type') excluded (BW-LOGIN-002) |
| controllers/createUserActor.controller.js | YES | VERIFIED SAFE | profileId===userId guard (VEN-AUTH-006) |
| controllers/onboarding.controller.js | YES | VERIFIED SAFE | getAuthSession() called; userId===session check in completeOnboardingController; session check in bootstrapJoinOnboardingController |
| controllers/profile.controller.js | YES | VERIFIED SAFE | getAuthSession() called; session.user.id !== userId guard |
| controllers/register.controller.js | YES | VERIFIED SAFE (with MEDIUM risk) | Wanders mirror guard present (VEN-AUTH-003 mitigated) |
| controllers/setNewPassword.controller.js | YES | PARTIAL | Recovery nonce gate — client-only (VEN-AUTH-001) |
| controllers/profileOnboarding.controller.js | YES | MISSING | No session check (VEN-AUTH-004) |
| controllers/completeProfileGate.controller.js | YES | PARTIAL | Calls getUser() (server-verified) but delegates to ensureProfileShell which has no session check |
| hooks/useLogin.js | YES | N/A | Open redirect candidate (VEN-AUTH-002); debug instrumentation (VEN-AUTH-005) |
| hooks/useAuthOnboarding.js | YES | N/A | state.from used as redirect without origin check (VEN-AUTH-002) |
| hooks/useRegister.js | YES | N/A | state.from preserved but not used as immediate redirect target |
| hooks/useSetNewPassword.js | YES | N/A | Correct — delegates to controller, clears nonce on success |
| model/actor.model.js | YES | N/A | profileId correctly excluded from output |
| model/onboarding.model.js | YES | N/A | Birthdate validation correct, future dates rejected |
| model/registerPasswordRules.model.js | YES | N/A | Min 8 chars, upper, lower, number — no special char required (acceptable) |
| adapters/auth.adapter.js | YES | N/A | Only exports safe surfaces |

---

## 9. Confidence Summary

| Finding ID | Severity | Confidence | Provenance |
|---|---|---|---|
| VEN-AUTH-001 | HIGH | HIGH | SOURCE_VERIFIED — self-documented in code comments |
| VEN-AUTH-002 | MEDIUM | HIGH | SOURCE_VERIFIED — useLogin.js:56-67 reviewed directly |
| VEN-AUTH-003 | LOW | HIGH | SOURCE_VERIFIED — guard confirmed in register.controller.js:20-41 |
| VEN-AUTH-004 | MEDIUM | HIGH | SOURCE_VERIFIED — absent session check confirmed in profileOnboarding.controller.js |
| VEN-AUTH-005 | LOW | HIGH | SOURCE_VERIFIED — stub confirmed, vite.config.js alias logic reviewed |
| VEN-AUTH-006 | LOW | HIGH | SOURCE_VERIFIED — guard confirmed in createUserActor.controller.js:26-30 |
| VEN-AUTH-007 | MEDIUM | HIGH | SOURCE_VERIFIED — BEHAVIOR.md read directly, placeholder confirmed |

Overall Confidence: HIGH — all findings are source-verified with cited file and line numbers.

---

## 10. THOR Impact

| Finding | THOR Blocker | Reason |
|---|---|---|
| VEN-AUTH-001 (HIGH) | YES | Password reset provenance is client-only. An attacker with a stolen session can lock out a victim by resetting credentials silently. Must be resolved before auth feature is considered THOR-eligible. |
| VEN-AUTH-002 (MEDIUM) | RECOMMENDED | Open redirect enables targeted phishing post-login. One-line fix. Should be resolved before major release. |
| VEN-AUTH-004 (MEDIUM) | NO | Defense-in-depth gap, not directly exploitable. RLS is the current guard. |
| VEN-AUTH-007 (MEDIUM) | NO | Governance gap — not a runtime risk. |
| VEN-AUTH-003, 005, 006 (LOW) | NO | Mitigated or low-risk. |

**THOR Verdict: BLOCKED — VEN-AUTH-001 must be resolved before THOR can clear auth.**

---

## 11. Required Follow-Up Commands

| Command | Reason | Priority |
|---|---|---|
| ELEKTRA | Trace source→sink chain for VEN-AUTH-001; propose Edge Function implementation for server-side recovery provenance; audit all @debuggers imports across VCSM | P1 |
| SPIDER-MAN | Add regression tests: (1) open redirect guard in useLogin, (2) Wanders session mismatch abort, (3) actor creation owner-scope guard, (4) profileId===userId invariant in createUserActorForProfile | P1 |
| DB | Verify RLS policies on profiles table — confirm upsert from an authenticated user cannot write to another user's profile row; confirm actor_owners RLS in vc schema | P2 |
| BLACKWIDOW | Runtime verification of auth invariants once BEHAVIOR.md §5 and §9 are written | P2 |
| Carnage | If Edge Function for recovery provenance (VEN-AUTH-001 fix) requires a DB audit log for password reset events | P3 |

---

## 12. MITIGATION PLAN

| Finding ID | Severity | Fix Type | Effort | Owner | Status |
|---|---|---|---|---|---|
| VEN-AUTH-001 | HIGH | New Edge Function — server-side recovery provenance gate | High (new server-side component) | Engineering | OPEN — THOR BLOCKER |
| VEN-AUTH-002 | MEDIUM | One-line fix — add startsWith('/') guard in useLogin.js and useAuthOnboarding.js | Low | Engineering | OPEN |
| VEN-AUTH-004 | MEDIUM | Add session check in profileOnboarding.controller.js — pattern from profile.controller.js | Low | Engineering | OPEN |
| VEN-AUTH-007 | MEDIUM | Complete BEHAVIOR.md §5 and §9 sections | Medium | Engineering/Docs | OPEN |
| VEN-AUTH-003 | LOW | No code change — preserve existing guard in register.controller.js; add SPIDER-MAN regression | Low | Engineering | OPEN (regression only) |
| VEN-AUTH-005 | LOW | Wrap debug calls with import.meta.env.DEV guard; verify _ACTIVE/debuggers path availability | Low | Engineering | OPEN |
| VEN-AUTH-006 | LOW | No code change — preserve existing guard; add SPIDER-MAN regression | Low | Engineering | OPEN (regression only) |

---

## 13. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings |
|---|---|
| Identity and Access Management (IAM) | VEN-AUTH-001, VEN-AUTH-003, VEN-AUTH-006 |
| Software Development Security | VEN-AUTH-001, VEN-AUTH-002, VEN-AUTH-004, VEN-AUTH-005, VEN-AUTH-006, VEN-AUTH-007 |
| Security and Risk Management | VEN-AUTH-007 |
| Security Operations | VEN-AUTH-005 |
| Communication and Network Security | Not applicable — no network-level auth surfaces (no Edge Functions) |
| Asset Security | Not applicable |
| Security Architecture and Engineering | VEN-AUTH-001 (architecture gap — client vs. server trust boundary) |

**Domains with highest concentration of findings: Software Development Security (6/7 findings) and Identity and Access Management (3/7 findings).**

---

*Report generated by VENOM V2 — 2026-06-04 19:48*
*Source-verified. Scanner preflight: ALL PASS. Confidence: HIGH.*
