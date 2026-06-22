---
title: Session Security Module — Behavior
status: STUB
feature: auth
module: session-security
source: architect-derived
created: 2026-06-06
---

# auth / modules / session-security — BEHAVIOR

## Status

STUB. Derived from ARCHITECT-AUTH-DEEP-001 (2026-06-05).

---

## Confirmed Behaviors

### Session Initialization

- AuthProvider mounts once at app root
- On mount: `dalHydrateAuthSession()` → `supabase.auth.getSession()` (cached JWT)
- On mount: `dalSubscribeAuthStateChange()` → `supabase.auth.onAuthStateChange` subscription established
- Auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED) update user context
- Subscription is cleaned up on unmount (`cancelled = true`, `unsubscribe()`)

### Token Persistence

- `persistSession: true` — session JSON written to localStorage under `sb-auth-main`
- `autoRefreshToken: true` — Supabase SDK refreshes access token automatically before expiry
- `detectSessionInUrl: true` — PKCE/hash tokens in URL are consumed on Supabase client init (auth callback flow)

### Logout

1. `clearAllIdentityStorage()` fires FIRST — wipes all identity-related localStorage keys
2. `supabase.auth.signOut()` called — server-side session invalidation
3. Catch block: `localStorage.removeItem('sb-auth-main')` as fallback if signOut throws
4. Navigate to /login or WelcomeScreen

**ORDER CRITICAL:** localStorage wipe must precede `signOut()`. If signOut fires first and throws, the session token could linger in localStorage without the wipe fallback.

### Singleton Safety (post-fix)

- `_client` is module-scoped — not accessible via `window.__SB_CLIENT__` (CLOSED 2026-06-05)
- HMR-safe: Vite hot-reload reuses same module reference during dev
- Multiple imports of supabaseClient.js always get the same `_client` instance

### Session Read Safety

- `supabase.auth.getSession()` returns a cached JWT — NOT server-verified
- Server-verified reads use `supabase.auth.getUser()` (requires network round-trip)
- Ownership checks using `getSession()` are vulnerable to stale token replay (low risk — see SS-SEC-002)

---

## Critical Invariants

1. `clearAllIdentityStorage()` MUST fire before `supabase.auth.signOut()` — order enforced in authOps.controller.js
2. `globalThis.__SB_CLIENT__` MUST NOT exist — removed; verify in code review after any supabaseClient.js change
3. `autoRefreshToken: true` MUST remain enabled — disabling causes session expiry without user awareness
