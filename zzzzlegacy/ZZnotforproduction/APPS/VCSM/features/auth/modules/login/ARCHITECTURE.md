---
title: Login Module — Architecture
status: STUB
feature: auth
module: login
source: architect-derived
created: 2026-06-05
---

# auth / modules / login — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review.

## Login Layer Stack

```
LoginScreen.jsx
  └── useLogin.js
        └── login.controller.js
              └── login.dal.js → supabase.auth.signInWithPassword
                    → on success: redirect (state.from — OPEN REDIRECT RISK)
```

## Logout Layer Stack

```
[consuming feature / nav component]
  └── auth.adapter.js (public surface)
        └── useAuthOps.js
              └── authOps.controller.js
                    ├── clearAllIdentityStorage() (localStorage wipe)
                    └── supabase.auth.signOut
```

## Session Read Layer Stack

```
[any protected controller]
  └── authSession.controller.js
        └── authSession.read.dal.js → supabase.auth.getSession() (cached JWT)
```

Note: getSession() returns a cached JWT, not server-verified. getUser() is the server-verified alternative. All controllers using this DAL inherit this limitation (ELEK-2026-06-04-005).

## Public Adapter Surface

```
auth.adapter.js
  ├── useAuthOps (logout)
  └── [other auth adapter exports — UNVERIFIED full list]
```

## Platform Dependency Boundary

**Decision date:** 2026-06-06 | **Finding closed:** IRM-LOGIN-001

`LoginScreen.jsx` imports two items directly from `app/platform/ios/`:

```
import IosInstallPrompt from '@/app/platform/ios/components/IosInstallPrompt'
import { useIOSInstallVisibility } from '@/app/platform/ios/useIOSInstallVisibility'
```

This is an accepted platform-layer dependency, not a cross-feature UI import.

- `app/platform/ios/` is a platform capability layer, not a peer feature. The auth adapter boundary rule applies to feature-to-feature imports — platform services are consumed directly by screens that need them.
- Ownership of the prompt implementation remains with `app/platform/ios/`. The login module owns only the visibility decision: when to show and when to dismiss the prompt.
- No adapter is required. If `app/platform/ios/` restructures its exports, LoginScreen.jsx is the single update point.
- This pattern is consistent across other VCSM screens that consume platform capabilities directly.

**Boundary rule:** Login must not own or modify the iOS prompt implementation. It passes `open` and `onClose` only.

---

## Login-Phase Profile Side Effect

**Decision date:** 2026-06-06 | **Finding closed:** IRM-LOGIN-002

After a successful `signInWithPassword`, the login flow calls `ensureProfileDiscoverable(userId)` via `profile.controller.js`. This writes `profiles.discoverable = true` and `profiles.updated_at` if the field is not already set.

Ownership is explicitly **auth/login (login phase)** with the following constraints:

- `profile.controller.js` verifies `session.user.id === userId` before any write. The write is session-guarded — a mismatch returns early without touching the DB.
- `profile.dal.js` is scoped to two fields only: `discoverable` and `updated_at`. No other profile fields are accessible from this DAL.
- This DAL lives in `apps/VCSM/src/features/auth/dal/profile.dal.js` — inside the auth feature directory. It is not shared with any other feature.
- The operation is non-fatal: errors are swallowed by a try/catch in `useLogin.js`. A failed discoverability update must not block an authenticated user from reaching the app.

**If an identity or profile engine is extracted in the future:**
- `profile.controller.js` and `profile.dal.js` must be re-evaluated for migration to that engine.
- The login flow must consume the new engine via its adapter, not import directly.
- This ownership decision must be updated at that time.

---

## TODO

- [ ] Confirm full auth.adapter.js export list
- [ ] Confirm authOps.controller.js clearAllIdentityStorage call order (must precede signOut)
- [ ] Confirm authSession.controller.js consumers — which controllers call it?
