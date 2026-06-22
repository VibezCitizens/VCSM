---
title: Shell Module — Behavior
status: STUB
feature: app
module: shell
source: architect-derived
created: 2026-06-05
---

# app / modules / shell — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### App Bootstrap
- main.jsx mounts React root; wraps with QueryClientProvider, AuthProvider, router
- App.jsx assembles top-level provider tree
- RootLayout.jsx mounts identity context via useIdentity(); renders navigation shell

### Auth Session Management (AuthProvider)
- Subscribes to Supabase onAuthStateChange
- On login: caches actor_kind, actor_vport_id, actor_touch to localStorage
- On logout: fires clearAllIdentityStorage() then Supabase signOut (ORDER IS CRITICAL — see SECURITY)
- On password recovery: sets sessionStorage vc.auth.recovery flag

### Identity Context Injection
- RootLayout.jsx injects resolved actor identity into React context
- Downstream features consume identity via context (not by re-fetching)

### Provider Composition Order (UNVERIFIED)
1. QueryClientProvider
2. AuthProvider
3. Router (BrowserRouter / createBrowserRouter)
4. RootLayout

## Critical Invariant

clearAllIdentityStorage() MUST fire before Supabase signOut. Inverted order leaves stale actor_kind/actor_vport_id/actor_touch in localStorage if signOut triggers a page unload before the wipe completes.

## TODO

- [ ] Confirm provider composition order in App.jsx
- [ ] Confirm AuthProvider session change handler — full event list (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, PASSWORD_RECOVERY)
- [ ] Confirm clearAllIdentityStorage() call site — inside AuthProvider SIGNED_OUT handler?
