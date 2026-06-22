---
title: Session Security Module — Index
status: STUB
feature: auth
module: session-security
source: architect-derived
created: 2026-06-06
source-path: apps/VCSM/src/features/auth/
scanner-version: 1.1.0
---

# auth / modules / session-security

Supabase client singleton management, token storage, session persistence, logout chain, and multi-tab session behaviour. A CRITICAL finding (globalThis.__SB_CLIENT__ exposure) was discovered and CLOSED in a single session (2026-06-05).

## Module Summary

| Field | Value |
|---|---|
| Module | session-security |
| Feature | auth |
| Source Path | apps/VCSM/src/ |
| Primary Files | services/supabase/supabaseClient.js, app/providers/AuthProvider.jsx |
| Write Surfaces | localStorage (sb-auth-main), sessionStorage (vc.auth.recovery nonce), supabase.auth.signOut |
| Controllers | authSession.controller.js, authOps.controller.js |
| DAL Files | authSession.read.dal.js |
| Hooks | useAuthOps.js |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| services/supabase/supabaseClient.js | Service | Supabase main client singleton (module-scoped after fix) |
| services/supabase/wandersSupabaseClient.js | Service | Wanders guest client (module-scoped, always was safe) |
| app/providers/AuthProvider.jsx | Provider | Auth state subscription, logout, session hydration |
| dal/authSession.read.dal.js | DAL | getSession (cached), onAuthStateChange subscription |
| controllers/authSession.controller.js | Controller | Session read orchestration |
| controllers/authOps.controller.js | Controller | signOut, clearAllIdentityStorage |
| hooks/useAuthOps.js | Hook | Logout + session ops public surface |

## Security Summary

CRITICAL finding CLOSED by implementation return (2026-06-05).
Highest remaining open severity: see `modules/login/SECURITY.md` (LOGIN-SEC-003, LOW).
THOR Release Blocker: NO (for this module).

## Cross-References

- ARCHITECT deep scan: `outputs/2026/06/05/ARCHITECT/ARCHITECT-AUTH-DEEP-001.md`
- Implementation return (fixes applied): `outputs/2026/06/05/ARCHITECT/IMPLEMENTATION-AUTH-ARCH-001.md`
- Session read concern: `modules/login/SECURITY.md` (LOGIN-SEC-003)
- Recovery nonce gate concern: `modules/recovery/SECURITY.md` (RECOVERY-SEC-001 — THOR BLOCKER)
