---
title: Session Security Module — Architecture
status: STUB
feature: auth
module: session-security
source: architect-derived
created: 2026-06-06
---

# auth / modules / session-security — ARCHITECTURE

## Status

STUB. Derived from ARCHITECT-AUTH-DEEP-001 (2026-06-05).
Source: `outputs/2026/06/05/ARCHITECT/ARCHITECT-AUTH-DEEP-001.md`

---

## Supabase Main Client (FIXED — post 2026-06-05)

```
supabaseClient.js
  // Module-scoped singleton — intentionally NOT on globalThis (XSS protection)
  let _client = null

  getOrCreateClient()
    ├── if (_client) return _client    ← HMR-safe module-scoped guard
    ├── createClient(url, anon, {
    │     auth: {
    │       persistSession: true,          ← tokens written to localStorage
    │       autoRefreshToken: true,        ← automatic refresh enabled
    │       detectSessionInUrl: true,      ← PKCE/hash tokens consumed on init
    │       storageKey: 'sb-auth-main',   ← localStorage key for session JSON
    │     }
    │   })
    └── _client = client
                                           ← PREVIOUS: globalThis.__SB_CLIENT__ (CLOSED)
```

## Wanders Client (always safe)

```
wandersSupabaseClient.js
  let _wandersClient = null    ← module-scoped (never was on globalThis)
  getWandersSupabase()
    ├── getOrCreateWandersClientKey()    ← UUID from localStorage
    ├── storageKey = `sb-auth-wanders-${clientKey}`
    └── createClient(url, anon, {
          global: { fetch: withClientKeyFetch(clientKey) }
          auth: { storageKey }
        })
```

## Auth Session Lifecycle

```
AuthProvider.jsx (mounts once at app root)
  └── dalHydrateAuthSession()
        └── supabase.auth.getSession()       ← cached JWT, not server-verified
  └── dalSubscribeAuthStateChange()
        └── supabase.auth.onAuthStateChange  ← live subscription
              → sets user state on SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED
  └── logout(navState)
        ├── clearAllIdentityStorage()        ← localStorage wipe (ORDER CRITICAL)
        ├── supabase.auth.signOut()
        └── [catch: localStorage.removeItem('sb-auth-main')]   ← fallback (FIXED)
```

## Session Read Pattern

```
authSession.controller.js
  └── authSession.read.dal.js
        └── supabase.auth.getSession()    ← returns CACHED JWT
                                           ← NOT server-verified (see SECURITY.md SS-SEC-002)
```

## Token Storage

| Key | Storage | Value |
|---|---|---|
| `sb-auth-main` | localStorage | Supabase session JSON (access + refresh tokens) |
| `sb-auth-wanders-{uuid}` | localStorage | Wanders guest session JSON |
| `vc.auth.recovery` | sessionStorage | Recovery nonce (client-side only — see RECOVERY-SEC-001) |
