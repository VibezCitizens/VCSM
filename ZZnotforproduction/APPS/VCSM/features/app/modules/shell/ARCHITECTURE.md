---
title: Shell Module — Architecture
status: STUB
feature: app
module: shell
source: architect-derived
created: 2026-06-05
---

# app / modules / shell — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review.

## Layer Stack

```
main.jsx (Vite entry)
  └── App.jsx (root)
        ├── QueryClientProvider (React Query)
        ├── AuthProvider.jsx (Supabase session + identity storage)
        └── <Router>
              └── routes/index.jsx (route tree)
                    └── RootLayout.jsx (shell layout)
                          ├── useIdentity() → engines/identity (identity context)
                          ├── <Outlet /> (feature screens)
                          └── <BottomNavBar /> (shared/components/BottomNavBar.jsx)
```

## AuthProvider Internal Flow

```
AuthProvider
  ├── supabase.auth.onAuthStateChange(event, session)
  │     ├── SIGNED_IN → cache actor_kind, actor_vport_id, actor_touch to localStorage
  │     ├── SIGNED_OUT → clearAllIdentityStorage() → supabase.auth.signOut()
  │     └── PASSWORD_RECOVERY → sessionStorage.setItem('vc.auth.recovery', ...)
  └── Context: provides { session, user, loading } to consumers
```

## Key Dependencies

| Dependency | Source | Used For |
|---|---|---|
| supabaseClient | services/supabase/supabaseClient.js | Auth session management |
| engines/identity | engines/identity/ | Actor identity resolution in RootLayout |
| shared/components/BottomNavBar | shared/components/BottomNavBar.jsx | Navigation shell |
| queries/queryClient | queries/queryClient.js | React Query client instance |

## Module Boundaries

| Boundary | Status |
|---|---|
| Shell owns no business logic | CORRECT — delegates to feature adapters |
| Shell owns no DAL | CORRECT |
| Shell owns auth session listening | CORRECT |
| Shell owns identity context injection | CORRECT via RootLayout |

## TODO

- [ ] Confirm App.jsx provider composition order (exact nesting)
- [ ] Confirm RootLayout.jsx identity context mechanism (context vs Zustand)
- [ ] Trace clearAllIdentityStorage() — defined where? Which storage keys does it wipe?
