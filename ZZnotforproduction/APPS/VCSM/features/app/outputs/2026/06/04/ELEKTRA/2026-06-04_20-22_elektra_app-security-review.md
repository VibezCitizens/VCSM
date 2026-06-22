# ELEKTRA Security Report

**Date:** 2026-06-04
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — first ELEKTRA run on the `app` platform-area
**Scan Areas:** Area 1 (Actor Ownership / IDOR), Area 6 (Auth and Session), Area 7 (URL and Redirect)
**Findings Summary:** 0 HIGH | 2 MEDIUM | 3 LOW | 1 INFO
**False Positives Rejected:** 5
**Suggested Patches:** 6
**THOR Release Blocker:** NO

---

## Executive Summary

The `app` platform-area is the VCSM application shell: router tree, AuthProvider, route guards, and iOS bootstrap. It has zero DAL writes and zero controllers by scanner-confirmed design — all domain logic is delegated to feature adapters. This significantly limits the IDOR / BOLA attack surface within the module itself.

The primary security surfaces are:

1. **Recovery nonce gate** (`AuthProvider.jsx` + `setNewPassword.controller.js`) — client-side only, no server-side provenance check. Already identified by VENOM and BLACKWIDOW; ELEKTRA confirms the precise code-level chain and adds a new sub-finding (Math.random fallback in nonce generation).

2. **signOut scope** — Supabase `scope: 'local'` terminates only the current browser session; other device sessions remain valid until JWT expiry. Already identified by VENOM; confirmed by ELEKTRA.

3. **Console calls in production** — four `console.warn/error` calls in `AuthProvider.jsx` expose auth error details in browser DevTools. Already identified by VENOM; confirmed.

4. **OwnerOnlyDashboardGuard is UI-only** — explicitly documented in source; controllers are authoritative. Already identified by VENOM and BLACKWIDOW; ELEKTRA confirms the code evidence and downgrades from MEDIUM to LOW per ELEKTRA severity model (design-as-documented UI gate, not a broken auth path).

One **new finding** not present in prior VENOM/BLACKWIDOW reports:

- **ELEK-2026-06-04-002** — `Math.random()` fallback in recovery nonce generation (`AuthProvider.jsx:50–53`) is not cryptographically secure. Effectively dead code in modern browsers where `crypto.randomUUID` is universally available, but the fallback path weakens nonce entropy when triggered.

No HIGH findings. No cross-user exploit paths. THOR release blocker: NO.

---

## High Findings

None.

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-001
- Title:              Recovery nonce gate is client-side only — no server-side recovery provenance
- Category:           Weak JWT/Session
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/app/providers/AuthProvider.jsx:44–57
                      apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:55–149
- Source:             sessionStorage.getItem('vc.auth.recovery') — client-controlled storage
- Sink:               dalUpdateUserPassword(password) — Supabase auth.updateUser({ password })
                      (setNewPassword.controller.js:167–170 via updatePasswordController)
- Trust Boundary:     readRecoveryNonce() at setNewPassword.controller.js:55–71
                      validates JSON format and 30-min TTL but NOT server-side recovery provenance
- Impact:             A source-code-aware authenticated user who manually sets a conforming JSON
                      nonce { nonce: "<uuid>", issuedAt: <ms> } in sessionStorage under the key
                      'vc.auth.recovery' can reach and successfully submit updatePasswordController
                      without having received a recovery email. Impact: self-exploitation only —
                      no cross-user path exists. A valid Supabase JWT is still required.
- Evidence:           AuthProvider.jsx:29–37 (inline comment confirms limitation):
                        "A user who reads the source code can deduce the format and set a valid nonce."
                      setNewPassword.controller.js:36–44 (confirms same):
                        "A source-code-aware user who holds any valid authenticated session and sets
                         a structurally conforming nonce CAN reach and successfully submit the
                         password update form. Impact is self-exploitation only — no cross-user path."
                      PKCE path (code present in URL) bypasses the nonce check entirely and correctly
                      — a genuine Supabase-issued code is itself proof of recovery flow.
- Reproduction Steps: 1. Log in normally to obtain a valid Supabase JWT session.
                      2. Open browser DevTools → Application → Session Storage.
                      3. Set key 'vc.auth.recovery' to JSON: {"nonce":"<any-uuid>","issuedAt":<current-ms>}
                      4. Navigate to /reset-password.
                      5. The form resolves to 'ready' state (readRecoveryNonce() returns the nonce).
                      6. Submit a new password — updatePasswordController succeeds.
                      NOTE: Reproduction against own account only. No production exploitation.
- Existing Defense:   Nonce uses UUID format (not trivial boolean flag); 30-min TTL enforced;
                      nonce is cleared on SIGNED_IN, SIGNED_OUT, USER_UPDATED events.
- Why Defense Is Insufficient:
                      sessionStorage is writable by any JavaScript on the page (or directly via
                      DevTools). UUID format is predictable once the source is read. TTL can be
                      bypassed by setting issuedAt to Date.now(). No server-side check verifies
                      the session originated from a Supabase PASSWORD_RECOVERY event.
                      Supabase auth.updateUser({ password }) accepts any valid JWT regardless of
                      recovery provenance — this is a Supabase platform-level limitation.
- Recommended Fix:    Implement a server-side Edge Function that wraps updateUser:
                      1. Receives the new password and the current access_token.
                      2. Verifies the access_token is valid (Supabase JWT verification).
                      3. Checks the session's AMR claim for 'recovery' presence — OR maintains
                         a server-side one-time token tied to the recovery session issued at
                         PASSWORD_RECOVERY event time.
                      4. Only forwards to auth.admin.updateUserById if provenance check passes.
                      NOTE: Supabase v2 JWT AMR does not include method:'recovery' (confirmed at
                      setNewPassword.controller.js:18–30) — AMR-only detection is unreliable.
                      A server-issued nonce (Edge Function → sessionStorage at PASSWORD_RECOVERY)
                      is the pragmatic closure.
- Suggested Patch:    Server-side Edge Function approach (human review only, not auto-applied):

                      // supabase/functions/update-password/index.ts
                      import { createClient } from '@supabase/supabase-js'
                      Deno.serve(async (req) => {
                        const { password, recoveryToken } = await req.json()
                        // recoveryToken: a one-time server-issued token stored server-side
                        // on PASSWORD_RECOVERY event, keyed by user_id, with 30-min TTL
                        const authHeader = req.headers.get('Authorization')
                        const jwt = authHeader?.replace('Bearer ', '')
                        const { data: { user }, error } = await supabase.auth.getUser(jwt)
                        if (error || !user) return new Response('Unauthorized', { status: 401 })
                        const valid = await validateRecoveryToken(user.id, recoveryToken)
                        if (!valid) return new Response('Invalid recovery session', { status: 403 })
                        await supabase.auth.admin.updateUserById(user.id, { password })
                        await invalidateRecoveryToken(user.id)
                        return new Response('OK')
                      })

- Aligns With:        VEN-APP-001 (VENOM), BW-APP-001 (BLACKWIDOW)
- Severity Rationale: MEDIUM per ELEKTRA model — requires active authenticated session (non-trivial
                      precondition) and source code knowledge; self-exploitation only; no cross-user
                      impact. VENOM rated HIGH focusing on absence of server-side defense; ELEKTRA
                      applies self-exploitation-only impact as a severity modifier.
- Follow-up Command:  BLACKWIDOW (runtime validation), DB (Edge Function schema if server-side
                      nonce table is introduced)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-003
- Title:              signOut({ scope: 'local' }) — other device sessions remain valid until JWT expiry
- Category:           Weak JWT/Session
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/app/providers/AuthProvider.jsx:198
- Source:             User-initiated logout action
- Sink:               supabase.auth.signOut({ scope: 'local' }) — local session only
- Trust Boundary:     Client logout flow
- Impact:             On logout, only the current browser's session is terminated. Refresh tokens
                      on other devices remain valid until their natural expiry. If an attacker
                      has cloned a refresh token from another device, they retain persistent
                      access after the user believes they've logged out. Realistic in scenarios
                      involving compromised devices, session theft via XSS, or shared browsers.
- Evidence:           AuthProvider.jsx:197–199:
                        try {
                          await supabase.auth.signOut({ scope: 'local' })
                        }
                      scope: 'local' is explicit — 'global' or 'others' was not chosen.
- Reproduction Steps: 1. Log in to VCSM on Device A and Device B.
                      2. Log out on Device B (triggers signOut({ scope: 'local' })).
                      3. Device A session remains active — navigating to /feed succeeds.
- Existing Defense:   Supabase JWT has a finite TTL (default 1 hour); after expiry, the refresh
                      token cycle governs persistence. Local state and localStorage identity keys
                      are cleared immediately.
- Why Defense Is Insufficient:
                      The refresh token on other devices continues to function after local logout.
                      An attacker who obtained a refresh token (e.g., from XSS) retains it.
- Recommended Fix:    Consider signOut({ scope: 'global' }) if the UX tradeoff is acceptable
                      (logs out all devices simultaneously). Alternatively, use scope: 'others'
                      to revoke other sessions while preserving the current one, called on
                      sensitive actions (password change, profile security settings update).
                      For routine logout: document the accepted risk and gate via security settings.
- Suggested Patch:    Option A — Global logout (revokes all sessions):
                        await supabase.auth.signOut({ scope: 'global' })
                      Option B — Revoke others on password change only (setNewPassword.controller.js):
                        // After updatePasswordController succeeds:
                        await supabase.auth.signOut({ scope: 'others' })
                      NOTE: Option B is lower UX cost and closes the highest-risk scenario
                      (session remains after password reset).

- Aligns With:        VEN-APP-003 (VENOM)
- Follow-up Command:  BLACKWIDOW (runtime validation)
```

---

## Low Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-002
- Title:              Math.random() fallback in recovery nonce generation — not cryptographically secure
- Category:           Weak JWT/Session
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/app/providers/AuthProvider.jsx:50–53
- Source:             _setRecoveryFlag() — called on PASSWORD_RECOVERY auth event
- Sink:               sessionStorage.setItem(RECOVERY_FLAG_KEY, JSON.stringify({ nonce, issuedAt }))
                      → read by readRecoveryNonce() in setNewPassword.controller.js:55–71
- Trust Boundary:     readRecoveryNonce() validates JSON structure and TTL but not nonce entropy
- Impact:             If Math.random() fallback is triggered (absent crypto.randomUUID), the nonce
                      is predictable by an attacker who can observe approximate page load timing
                      and the Math.random() state. In practice: crypto.randomUUID is available in
                      all browsers that can run this SPA. The fallback is dead code at runtime.
                      Risk is theoretical — cannot be demonstrated against modern browsers.
- Evidence:           AuthProvider.jsx:50–53:
                        nonce: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
                          ? crypto.randomUUID()
                          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
                      Math.random() is not cryptographically seeded. Date.now() is guessable to
                      within a few milliseconds by an observer. Combined entropy is insufficient
                      for a security nonce.
- Reproduction Steps: No realistic reproduction in modern browsers — crypto.randomUUID is always
                      present. To test: stub crypto.randomUUID = undefined and trigger a
                      PASSWORD_RECOVERY event; observe the generated nonce is predictable.
- Existing Defense:   Primary path uses crypto.randomUUID() — cryptographically secure. Fallback
                      is only reached in environments without crypto.randomUUID support (none in
                      target browser set).
- Why Defense Is Insufficient:
                      The fallback exists in the codebase and would activate in any environment
                      where crypto.randomUUID is polyfilled away or unavailable. readRecoveryNonce()
                      performs no entropy check — any string passes the typeof nonce === 'string'
                      validation.
- Recommended Fix:    Remove the Math.random() fallback. If a fallback is required, use
                      crypto.getRandomValues() which has broader browser support than
                      crypto.randomUUID and produces cryptographically secure output.
- Suggested Patch:    Replace AuthProvider.jsx:49–53 with:
                        nonce: (() => {
                          if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                            return crypto.randomUUID()
                          }
                          if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
                            const bytes = new Uint8Array(16)
                            crypto.getRandomValues(bytes)
                            return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
                          }
                          // crypto unavailable — do not set a nonce (return null; caller handles)
                          return null
                        })(),
                      If nonce is null, _setRecoveryFlag() should skip the setItem call entirely
                      rather than storing a structurally invalid (null) nonce.

- NEW: Not previously identified by VENOM or BLACKWIDOW.
- Follow-up Command:  None — LOW / dead code in practice
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-004
- Title:              console.error / console.warn in production auth paths
- Category:           Secrets Exposure (auth error detail disclosure)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/app/providers/AuthProvider.jsx:87, 154, 201, 207
- Source:             Supabase auth errors (getSession, init, signOut, channel cleanup)
- Sink:               console.warn / console.error — browser DevTools visible in production
- Trust Boundary:     No guard — errors flow unconditionally to console in all builds
- Impact:             Auth error messages (getSession failures, signOut errors) are visible in
                      browser DevTools in production builds. An attacker on a shared or compromised
                      device can inspect the console for auth error details. Low severity —
                      no secrets are logged, only error objects and messages.
- Evidence:           AuthProvider.jsx:87:  console.warn('[Auth] getSession error:', error)
                      AuthProvider.jsx:154: console.error('[Auth] init error:', e)
                      AuthProvider.jsx:201: console.error('[Auth] signOut error:', e)
                      AuthProvider.jsx:207: console.warn('[Auth] channel cleanup skipped:', e)
                      None of the four calls are guarded by IS_PROD or import.meta.env.DEV.
- Existing Defense:   Project has a no-console rule enforced via ESLint (per VCSM CLAUDE.md).
                      These calls violate that rule and likely survive only because auth error
                      paths are rarely triggered during linting passes.
- Why Defense Is Insufficient:
                      The ESLint rule is not enforced at runtime — the console calls fire in
                      production whenever the guarded error paths trigger.
- Recommended Fix:    Replace all four console calls with a dev-only logger or remove entirely.
                      The debugLoginEvent() pattern used elsewhere in the same file is the
                      correct replacement — it is IS_PROD guarded.
- Suggested Patch:    Replace each console call with the existing debugLoginEvent pattern:
                        // Before (line 87):
                        if (error) console.warn('[Auth] getSession error:', error)
                        // After:
                        if (error) debugLoginEvent('SESSION_HYDRATE_ERROR', {
                          phase: 'session', status: 'warn', message: error?.message })

                        // Before (line 154):
                        console.error('[Auth] init error:', e)
                        // After:
                        debugLoginEvent('AUTH_INIT_ERROR', {
                          phase: 'auth', status: 'error', message: e?.message })

                        // Before (line 201):
                        console.error('[Auth] signOut error:', e)
                        // After:
                        debugLoginEvent('AUTH_SIGNOUT_ERROR', {
                          phase: 'auth', status: 'error', message: e?.message })

                        // Before (line 207):
                        console.warn('[Auth] channel cleanup skipped:', e)
                        // After:
                        debugLoginEvent('AUTH_CHANNEL_CLEANUP_WARN', {
                          phase: 'auth', status: 'warn', message: e?.message })

- Aligns With:        VEN-APP-006 (VENOM)
- Follow-up Command:  None — LOW / hygiene
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-006
- Title:              OwnerOnlyDashboardGuard is UI-only — no actor kind check, controllers are authoritative
- Category:           IDOR/BOLA (UI gate gap)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx:23–34
- Source:             URL :actorId param (useParams())
- Sink:               React <Outlet /> rendering dashboard routes — no data mutation in this guard
- Trust Boundary:     String comparison: identity.actorId !== actorId (URL param)
- Impact:             The guard verifies that the URL :actorId matches the session identity's actorId
                      but does NOT verify actor kind ('user' vs 'vport'). A 'user' kind actor with
                      a matching actorId could render dashboard screens intended for a 'vport' kind
                      actor. However: (a) actorId is globally unique across all actor kinds —
                      a user and a vport cannot share the same actorId; (b) the guard is explicitly
                      documented as UI-only per PORT-V-006/008; (c) all mutation controllers
                      independently verify actor ownership via vc.actor_owners before write.
                      No cross-actor mutation path exists through this guard gap alone.
- Evidence:           appRoutes.redirects.jsx:28–33:
                        if (!actorId || String(identity.actorId) !== String(actorId)) {
                          return <Navigate to="/feed" replace />
                        }
                      No actor kind check in the guard.
                      Source comment (line 21–22):
                        "PORT-V-006/008 — SECURITY SCOPE CLARIFICATION: This guard is a UI
                         convenience only. It is NOT the authoritative security boundary."
- Existing Defense:   URL :actorId vs identity.actorId comparison prevents cross-actor navigation.
                      Controllers verify vc.actor_owners for all writes (per PORT-V-006/008).
                      actorId is globally unique — kind collision is impossible.
- Why Defense Is Insufficient:
                      No kind discrimination means a 'user' actor matching the actorId could
                      render a 'vport' dashboard UI. If any dashboard screen has kind-dependent
                      behavior that is gated only by this guard (not by its own controller),
                      that screen would render in an unexpected state. The gap requires a
                      dashboard screen to not perform its own kind check — possible if a new
                      screen is added without following the PORT-V-006/008 pattern.
- Recommended Fix:    Add actor kind guard alongside actorId comparison. The kind check adds a
                      second defense layer for any future dashboard screen that may omit its own.
- Suggested Patch:    appRoutes.redirects.jsx, OwnerOnlyDashboardGuard, after the actorId check:
                        // Existing:
                        if (!actorId || String(identity.actorId) !== String(actorId)) {
                          return <Navigate to="/feed" replace />
                        }
                        // Add after:
                        // Guard also verifies caller is a vport actor — dashboard is vport-only.
                        if (identity.kind !== 'vport') {
                          return <Navigate to="/feed" replace />
                        }

- Aligns With:        VEN-APP-004 (VENOM), BW-APP-002 (BLACKWIDOW)
- Severity Rationale: LOW per ELEKTRA model — no direct exploit path when actorId is globally unique
                      and controllers are authoritative. Downgraded from MEDIUM (VENOM/BW) because
                      ELEKTRA confirmed the actorId uniqueness invariant makes kind collision impossible.
- Follow-up Command:  None — LOW / hardening
```

---

## Info Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-005
- Title:              Raw actorId UUID exposed in protected route URL paths
- Category:           IDOR/BOLA (URL exposure — authenticated routes only)
- Severity:           INFO
- Status:             Accepted (pre-existing platform pattern)
- Scope:              VCSM
- Location:           apps/VCSM/src/app/routes/protected/app.routes.jsx:155, 182, 184, 186, 189, 205–218
- Source:             URL `:actorId` path parameter — user visible in browser address bar
- Sink:               Internal navigation — all behind ProtectedRoute (requires valid session)
- Trust Boundary:     ProtectedRoute (auth + consent + email verification)
- Impact:             Authenticated users can see their own actorId UUID in the browser address bar
                      when navigating to dashboard, profile, gas prices, flyer editor routes.
                      UUID exposure enables enumeration of valid actorIds if the URL is shared.
                      Dashboard URLs (/actor/:actorId/dashboard/*) and the /profile/:actorId route
                      are the primary surfaces.
                      Mitigation: all routes are behind ProtectedRoute; public routes use slugs
                      (/u/:username, /v/:slug for public vport menus).
- Evidence:           app.routes.jsx:182: { path: "/profile/:actorId" }
                      app.routes.jsx:205: { path: "/actor/:actorId/dashboard" }
                      app.routes.jsx:154–158: { path: "/ads/vport/:actorId" }
                      Public routes use slug-based URLs: /u/:username (app.routes.jsx:180)
- Existing Defense:   Public-facing routes use human-readable slugs. All actorId-in-URL routes
                      are protected (require authentication). Platform policy restricts UUIDs
                      in public URLs; this is an authenticated-internal pattern.
- Why This Is Accepted:
                      BW-APP-006 classifies this as INFO/BLOCKED (accepted platform pattern).
                      Dashboard URLs are internal navigation only — not shared as QR codes,
                      notifications, or public share links. The /profile/:actorId path exists
                      alongside /u/:username for username-based navigation.
- Recommended Fix:    Long-term: migrate /profile/:actorId to redirect to /u/:username when a
                      username exists. Audit notification deep links and share-link generation
                      separately to ensure they use slug-based URLs (out of app-shell scope).
- Suggested Patch:    No immediate action — INFO. For long-term migration:
                        // app.routes.jsx:182 — replace:
                        { path: "/profile/:actorId", element: <ActorProfileScreen /> }
                        // with a redirect-based approach that resolves to /u/:username

- Aligns With:        BW-APP-006 (BLACKWIDOW — BLOCKED/INFO)
- Follow-up Command:  None for app shell — HAWKEYE for notification deep link audit
```

---

## False Positives Rejected

---

```
FALSE POSITIVE REJECTED

- Candidate:          errorDescription from URL ?error_description= param rendered in UI
- Location:           apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:104
- Rejection reason:   Production path hardcodes error message — attacker-controlled value never
                      reaches production UI. DEV path renders the string but React escapes HTML
                      output; no XSS chain is possible. DEV-only rendering of attacker content
                      is not a production security finding.
- Chain gap:          Impact — no exploit path in production; React output encoding prevents
                      HTML injection in DEV.
- Notes:              Noted in source with // BW-LOGIN-003. INFO-level hygiene concern only.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:          VportToActor redirect components passing :actorId from useParams() into Navigate to=
- Location:           apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx:44–135
- Rejection reason:   React Router's <Navigate to=...> is always same-origin and uses the HTML5
                      history API. No external URL can be constructed via a path template. The
                      :actorId is forwarded to an internal path (/actor/:actorId/...) — no open
                      redirect to an external domain is possible.
- Chain gap:          Sink — Navigate is not an HTTP redirect; javascript: scheme is rejected by
                      react-router's Link resolution. Path traversal via actorId would resolve to
                      an unknown route and hit the * wildcard (→ /feed), not an exploit.
- Notes:              actorId in the redirect target is the same UUID already present in the
                      original URL — no new information exposure.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:          AuthPublicRoute redirect to /feed — potential open redirect
- Location:           apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx:18
- Rejection reason:   Redirect destination is hardcoded to '/feed'. No query param, hash param,
                      or user-controlled value influences the destination.
- Chain gap:          Source — no user-controlled input enters the redirect decision.
- Notes:              None.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:          ProtectedRoute redirect to /login — potential open redirect
- Location:           apps/VCSM/src/app/guards/ProtectedRoute.jsx:38
- Rejection reason:   Redirect destination is hardcoded to '/login'. No user-controlled input
                      influences the destination.
- Chain gap:          Source — no user-controlled input.
- Notes:              None.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:          OwnerOnlyDashboardGuard reads actorId from URL params — potential IDOR
- Location:           apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx:23–34
- Rejection reason:   URL :actorId is the resource identifier (by design). The comparison is
                      identity.actorId (session-derived from useIdentity()) vs. URL param.
                      This is the correct pattern — the caller's session identity is compared
                      against the resource ID in the URL. Mismatches are denied. No mutation
                      occurs in the guard itself. An IDOR exploit would require bypassing the
                      actorId mismatch check, which is not possible via URL manipulation —
                      the identity.actorId comes from the session, not the URL.
- Chain gap:          Sink — the guard renders an Outlet on match, not a write operation.
                      Mutation authority is delegated to controllers per PORT-V-006/008.
- Notes:              The kind-check gap is documented as a real (LOW) finding in ELEK-2026-06-04-006.
                      The false positive here is the IDOR claim specifically — route rendering
                      without write access is not IDOR.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-04-001 | Recovery nonce — no server-side provenance check | MEDIUM | Edge Function / Controller | COMPLEX | YES (optional: one-time token table) |
| 2 | ELEK-2026-06-04-003 | signOut local scope — other sessions persist | MEDIUM | Controller (AuthProvider) | SIMPLE | NO |
| 3 | ELEK-2026-06-04-002 | Math.random() fallback in nonce generation | LOW | Controller (AuthProvider) | SIMPLE | NO |
| 4 | ELEK-2026-06-04-004 | console.error/warn in production auth paths | LOW | Controller (AuthProvider) | SIMPLE | NO |
| 5 | ELEK-2026-06-04-006 | OwnerOnlyDashboardGuard — no actor kind check | LOW | Router (appRoutes.redirects.jsx) | SIMPLE | NO |
| 6 | ELEK-2026-06-04-005 | Raw actorId in protected route URLs | INFO | Router | MODERATE | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime validation of ELEK-001 (recovery nonce bypass) and ELEK-003 (session persistence after logout) | PENDING |
| DB | Edge Function design review if server-side recovery nonce table is introduced for ELEK-001 patch | PENDING |
| Carnage | DB migration planning if ELEK-001 server-side nonce table is introduced | PENDING |
| Thor | Evaluate MEDIUM findings for release gate consideration (no current THOR blockers) | PENDING |
| SPIDER-MAN | Auth provider and guard tests remain at zero — security regressions are invisible | PENDING |

---

## THOR Release Gate Status

ELEKTRA MEDIUM findings are **not release blockers** per THOR integration rules (no HIGH, no IDOR with confirmed exploit path, no RLS gap on actor-scoped writes, no secrets exposure).

ELEK-2026-06-04-001 (MEDIUM) is self-exploitation only — THOR CAUTION acceptable.
ELEK-2026-06-04-003 (MEDIUM) is a Supabase platform behavior — no immediate code fix required for release.

**THOR Release Blocker from this ELEKTRA run: NO**

---

## Data Flow Traces

### Trace 1: Recovery nonce bypass chain

```
Source: sessionStorage — user-writable via DevTools or JS
  ↓ attacker sets key 'vc.auth.recovery' = '{"nonce":"any-uuid","issuedAt":Date.now()}'
Trust Boundary: readRecoveryNonce() — validates JSON structure + TTL (insufficient: no entropy check, no server-side provenance)
  ↓ returns parsed nonce object
Intermediate: resolveRecoverySessionController() returns { ok: true, session }
  ↓ controller returns ready state
Sink: dalUpdateUserPassword(password) → supabase.auth.updateUser({ password })
  ↓ Supabase accepts any valid JWT regardless of session origin
Impact: Own password updated without PASSWORD_RECOVERY event. Self-exploitation.
Missing Defense: server-side recovery provenance check
```

### Trace 2: signOut scope gap

```
Source: user triggers logout()
  ↓ AuthProvider.jsx:165
Trust Boundary: logout() — performs local state clear, localStorage clear, navigate('/login')
  ↓
Sink: supabase.auth.signOut({ scope: 'local' }) — terminates only current browser session
  ↓
Impact: Refresh tokens on other devices remain valid.
Missing Defense: scope: 'global' or scope: 'others' on password change
```

### Trace 3: OwnerOnlyDashboardGuard kind gap

```
Source: URL :actorId param (user-navigated)
  ↓ useParams() → actorId
Trust Boundary: String comparison identity.actorId !== actorId
  ↓ PASS if IDs match (no kind check)
Sink: <Outlet /> renders dashboard screen
  ↓ dashboard screen renders for matching actorId regardless of kind
Impact: 'user' kind actor with matching actorId could render 'vport' dashboard UI
Missing Defense: actor kind == 'vport' assertion
Note: Exploit requires actorId collision across kinds (impossible — actorId is globally unique)
```
