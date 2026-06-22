# CEREBRO — VENOM FIX PLAN
**Date:** 2026-05-11
**Source:** VENOM report `2026-05-11_venom_auth-login-trust-boundaries.md`
**Commanding:** Wolverine (FULL_WRITABLE execution authority)
**Scope:** apps/VCSM — auth feature
**Status:** DRAFT → REVIEW_PENDING

---

## Command Routing (Cerebro Registry)

| Finding | Command Authority | Reason |
|---|---|---|
| F1 — session in AuthContext | Wolverine | Source code change |
| F2 — profileId in ActorModel | Wolverine | Source code change + identity contract |
| F3 — globalThis singleton | Wolverine | Source code change |
| F4 — dalUpdateProfileDiscoverable | Wolverine + DB | Code change + RLS verification |
| F5 — actor_owners / profiles write | DB | RLS verification only — call chain is safe |
| F6 — error_description reflected | Wolverine | Source code change |
| F7 — hash-based recovery redirect | Wolverine | Source code change |
| F8 — authOps.controller bypass path | Wolverine | Source code refactor — ACTIVE caller chain |
| F9 — full auth response propagated | Wolverine | Source code change |
| F10 — vc.actors RLS | DB | Verification only — no code change |

---

## REVISED SEVERITY — Finding 8

**Upgraded from LOW → MEDIUM-HIGH**

`authOps.controller.js` is not unused. Active call chain:

```
useJoinBarbershop (join feature)
  → auth.adapter.js
  → useAuthOps.js
  → authOps.controller.js
  → onboarding.dal.js (DAL writes directly — bypasses onboarding.controller session checks)
```

`upsertCompletedOnboardingProfileDAL` is reached via this path **without** the session ownership verification that exists in `completeOnboardingController`. The join barbershop flow can write to `profiles` without verifying `userId === session.user.id`.

---

## EXECUTION PLAN — Wolverine Tasklist

---

### TASK 1 — Remove `profileId` from ActorModel
**Finding:** F2 (HIGH)
**Priority:** P1
**Files:** `apps/VCSM/src/features/auth/model/actor.model.js`
**Risk:** MEDIUM — consumers of ActorModel may be reading `profileId`; must grep callers first

**Pre-work:**
```bash
grep -rn "\.profileId\|actor\.profileId\|actorModel.*profileId" apps/VCSM/src --include="*.js" --include="*.jsx"
```

**Change:**
```js
export function ActorModel(row) {
  if (!row) return null
  return {
    id: row.id,
    kind: row.kind,
    isVoid: Boolean(row.is_void),
    // profileId removed — identity contract: only actorId + kind on public surfaces
  }
}
```

**Post-check:** Any caller that reads `actor.profileId` must be refactored to use `actor.id` or resolved before the model is applied.

---

### TASK 2 — Sanitize error_description in authCallback.controller
**Finding:** F6 (MEDIUM)
**Priority:** P1
**Files:** `apps/VCSM/src/features/auth/controllers/authCallback.controller.js`

**Change:** Replace attacker-controlled string with fixed message in production:
```js
const safeError = import.meta.env.DEV
  ? (errorDescription || 'Verification failed.')
  : 'Verification failed. Please try again or request a new link.'

if (error) {
  return { ok: false, session: null, isRecovery: false, error: safeError }
}
```

**Post-check:** Verify `AuthCallbackScreen` renders the error field correctly with fixed string.

---

### TASK 3 — Gate hash-based recovery redirect on verified session
**Finding:** F7 (MEDIUM)
**Priority:** P1
**Files:** `apps/VCSM/src/features/auth/controllers/authCallback.controller.js`

**Change:**
```js
if (hashType === 'recovery') {
  const session = await dalGetAuthSession()
  if (session) {
    return { ok: true, session, isRecovery: true, error: null }
  }
  return {
    ok: false,
    session: null,
    isRecovery: false,
    error: 'Reset link is invalid or has expired.',
  }
}
```

**Note:** `dalGetAuthSession` is already imported by this controller. No new imports needed.

---

### TASK 4 — Remove `session` from AuthContext value
**Finding:** F1 (HIGH)
**Priority:** P2
**Files:** `apps/VCSM/src/app/providers/AuthProvider.jsx`
**Risk:** MEDIUM — must grep all consumers of `session` from `useAuth()` first

**Pre-work:**
```bash
grep -rn "session.*useAuth\|useAuth.*session\|{ session\|, session }" apps/VCSM/src --include="*.js" --include="*.jsx"
```

**Change:** Remove `session` from context value:
```jsx
<AuthContext.Provider value={{ user, loading, logout }}>
```

Update context default:
```js
const AuthContext = createContext({
  user: null,
  loading: true,
  logout: async () => {},
})
```

**Post-check:** Any component destructuring `session` from `useAuth()` must be updated to use the Supabase client directly for token access, or the value must be sourced from a controlled function.

---

### TASK 5 — Refactor authOps.controller + useJoinBarbershop bypass path
**Finding:** F8 (MEDIUM-HIGH, revised)
**Priority:** P2
**Files:**
- `apps/VCSM/src/features/auth/controllers/authOps.controller.js`
- `apps/VCSM/src/features/auth/hooks/useAuthOps.js`
- `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js`
- `apps/VCSM/src/features/auth/adapters/auth.adapter.js`

**Problem:** `useJoinBarbershop` reaches `upsertCompletedOnboardingProfileDAL` without session verification. The `authOps.controller` provides no authorization layer.

**Required investigation before fix:**
Read `useJoinBarbershop.js` fully to understand exactly which authOps operations it uses and in what context. Determine whether the join flow should:
  A. Use the canonical `completeOnboardingController` (preferred), or
  B. Have its own session-verified path in a join-specific controller

**Fix direction:**
1. Remove `upsertCompletedOnboardingProfile` and `generateUsername` from `authOps.controller.js` — these belong in `onboarding.controller` only
2. Update `useJoinBarbershop` to call the canonical controller or a new session-verified join controller
3. If `readCurrentAuthUser` and `createUserActorForProfile` and `signInWithPassword` are the only remaining operations, assess whether `authOps.controller` is still needed or can be deleted

**Do not delete `auth.adapter.js`** — it is the approved cross-feature boundary. Update what it re-exports.

---

### TASK 6 — Move wanders singleton from globalThis to module scope
**Finding:** F3 (MEDIUM)
**Priority:** P3
**Files:** `apps/VCSM/src/features/wanders/services/wandersSupabaseClient.js`

**Change:** Replace `globalThis.__WANDERS_SB__` with module-scoped cache:
```js
// Module-scoped singleton — not accessible via window
let _cachedClient = null
let _cachedClientKey = null
let _cachedStorageKey = null

export function getWandersSupabase() {
  const clientKey = getOrCreateWandersClientKey()
  const storageKey = `sb-auth-wanders-${clientKey}`

  if (_cachedClient && _cachedClientKey === clientKey && _cachedStorageKey === storageKey) {
    return _cachedClient
  }

  // ... create client ...

  _cachedClient = client
  _cachedClientKey = clientKey
  _cachedStorageKey = storageKey
  return client
}
```

**Note:** HMR will still work — Vite replaces the module on hot reload, which resets module-level state. This is acceptable behavior (new client on HMR). The globalThis pattern was solving HMR persistence, but that same behavior is handled by the auth `storageKey` in localStorage.

---

### TASK 7 — Shape login.controller return to minimal fields
**Finding:** F9 (LOW)
**Priority:** P3
**Files:** `apps/VCSM/src/features/auth/controllers/login.controller.js`

**Pre-work:** Verify `useLogin.js` reads from the return value — currently uses `data.user.id` and `data.user.email`.

**Change:**
```js
export async function signInWithPassword({ email, password }) {
  const { data, error } = await dalSignInWithPassword({ email, password })
  if (error) throw error
  return {
    data: {
      user: {
        id: data?.user?.id ?? null,
        email: data?.user?.email ?? null,
      },
    },
    error: null,
  }
}
```

**Note:** Preserve the `{ data, error }` shape since `useLogin` destructures it. Only strip token fields from the `data` payload.

---

### TASK 8 — Add controller-layer ownership assertion for dalUpdateProfileDiscoverable
**Finding:** F4 (MEDIUM)
**Priority:** P3
**Files:** `apps/VCSM/src/features/auth/controllers/profile.controller.js`

**Change:** Add session verification before the DAL write:
```js
import { dalGetAuthSession } from '@/features/auth/dal/authSession.read.dal'

export async function ensureProfileDiscoverable(userId) {
  const session = await dalGetAuthSession()
  if (!session?.user?.id || session.user.id !== userId) return

  const row = await dalGetProfileDiscoverable(userId)
  const profile = ProfileModel(row)
  if (!profile) return

  if (!profile.isDiscoverable) {
    await dalUpdateProfileDiscoverable({
      profileId: userId,
      discoverable: true,
      updatedAt: new Date().toISOString(),
    })
  }
}
```

**Dependency:** Requires DB to verify RLS on `profiles` write path in parallel.

---

## DB TASKS (parallel — not Wolverine)

These require DB command — read-only verification, no code changes.

| Task | Table | What to verify |
|---|---|---|
| DB-1 | `profiles` | RLS policy: `UPDATE` restricted to `auth.uid() = id` |
| DB-2 | `vc.actor_owners` | RLS policy: `INSERT` restricted to `user_id = auth.uid()` |
| DB-3 | `vc.actors` | RLS policy: `SELECT` — who can read actors by profile_id |
| DB-4 | `profiles` | RLS policy: `UPSERT` in register flow (auth.uid() = id enforced?) |

---

## EXECUTION ORDER

```
Phase 1 — Code changes, no dependencies (safe to run together)
  TASK 2  authCallback error_description fix
  TASK 3  hash-based recovery gate
  TASK 6  wanders globalThis → module scope
  TASK 7  login.controller return shape

Phase 2 — Requires caller audit before touching (run sequentially)
  TASK 1  ActorModel profileId removal (grep callers first)
  TASK 4  AuthContext session removal (grep consumers first)

Phase 3 — Requires full investigation
  TASK 5  authOps.controller / useJoinBarbershop bypass

Phase 4 — Depends on DB results
  TASK 8  profile.controller ownership assertion (wait for DB-1)

DB tasks run in parallel with all phases (read-only, no code risk)
```

---

## SENTRY TRIGGER

After all Wolverine tasks complete, run SENTRY with scope:
- `apps/VCSM/src/features/auth/model/actor.model.js`
- `apps/VCSM/src/app/providers/AuthProvider.jsx`
- `apps/VCSM/src/features/auth/controllers/authCallback.controller.js`
- `apps/VCSM/src/features/auth/controllers/profile.controller.js`
- `apps/VCSM/src/features/auth/controllers/login.controller.js`
- `apps/VCSM/src/features/wanders/services/wandersSupabaseClient.js`
- `apps/VCSM/src/features/auth/controllers/authOps.controller.js` (if modified or deleted)
- `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js` (if modified)

---

## RISKS AND DEPENDENCIES

| Risk | Impact | Mitigation |
|---|---|---|
| ActorModel profileId removal breaks callers | HIGH if any caller reads `actor.profileId` | Grep all consumers before changing |
| AuthContext session removal breaks consumers | HIGH if any component reads `session` from useAuth | Grep all `useAuth` destructures before changing |
| useJoinBarbershop refactor breaks join flow | HIGH — active user-facing feature | Full read of the hook before touching |
| Wanders HMR behavior changes after globalThis removal | LOW — acceptable client reset on hot reload | Test wanders auth flow in dev after change |

---

## TASK COUNT

```
Wolverine tasks:  8
DB tasks:         4
Total findings:   10 (all addressed)
Estimated phases: 4 sequential phases + parallel DB track
```
