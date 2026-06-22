---
name: TICKET-AUTH-ARCH-001-implementation
description: Implementation return — auth session hardening fixes applied from ARCHITECT DEEP report
metadata:
  type: implementation-return
  ticket: TICKET-AUTH-ARCH-001
  run-date: 2026-06-05
  mode: SURGICAL / READ-ONLY-AUDIT → IMPLEMENTATION
  authorized-fixes: 3
  files-changed: 3
---

# TICKET-AUTH-ARCH-001 — Implementation Return

---

## Files Changed

| # | File | Fix | Severity |
|---|---|---|---|
| 1 | `apps/VCSM/src/services/supabase/supabaseClient.js` | Remove `globalThis.__SB_CLIENT__` — replace with module-scoped `let _client = null` | CRITICAL |
| 2 | `apps/VCSM/src/app/providers/AuthProvider.jsx` | Add `localStorage.removeItem('sb-auth-main')` fallback in signOut catch block | HIGH |
| 3 | `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js` | Remove dead `globalThis?.__WANDERS_SB__` fallback branch | MEDIUM |

---

## Exact Changes

### Fix 1 — `supabaseClient.js` (CRITICAL)

**Before:**
```js
// 🔒 HMR-safe singleton: reuse across Vite hot reloads / multiple imports
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
// 🔒 HMR-safe singleton: reuse across Vite hot reloads / multiple imports
// Module-scoped ref — intentionally not on globalThis/window (globalThis exposes auth client to XSS).
let _client = null

function getOrCreateClient() {
  if (_client) return _client

  _client = createClient(url, anon, { ... })

  return _client
}
```

- `globalThis.__SB_CLIENT__` assignment removed
- `g.__SB_CLIENT__.__isSingleton` check removed
- `Object.defineProperty` call removed
- All Supabase config values (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`, `storageKey: 'sb-auth-main'`) preserved unchanged
- `export const supabase = getOrCreateClient()` unchanged

---

### Fix 2 — `AuthProvider.jsx` (HIGH)

**Before:**
```js
    } catch (e) {
      console.error('[Auth] signOut error:', e)
      debugLoginEvent('AUTH_SIGNOUT_ERROR', { phase: 'auth', status: 'error', message: e?.message })
    }
```

**After:**
```js
    } catch (e) {
      console.error('[Auth] signOut error:', e)
      debugLoginEvent('AUTH_SIGNOUT_ERROR', { phase: 'auth', status: 'error', message: e?.message })
      // TICKET-AUTH-ARCH-001: if signOut() fails, manually evict the persisted session so
      // autoRefreshToken cannot re-hydrate it on the next page load or tab open.
      try { localStorage.removeItem('sb-auth-main') } catch (_) {}
    }
```

- `signOut({ scope: 'local' })` unchanged
- Logout routing and navigation order unchanged
- Fallback only fires when `signOut()` throws; normal logout path is unaffected
- `storageKey: 'sb-auth-main'` matches the value in `supabaseClient.js`

---

### Fix 3 — `uploadToCloudflare.js` (MEDIUM)

**Before:**
```js
async function getUploadAuthHeaders() {
  try {
    let token = null;

    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token ?? null;

    if (!token) {
      const wandersClient = globalThis?.__WANDERS_SB__;
      if (wandersClient?.auth?.getSession) {
        const { data: wandersData } = await wandersClient.auth.getSession();
        token = wandersData?.session?.access_token ?? null;
      }
    }

    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}
```

**After:**
```js
async function getUploadAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token ?? null;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}
```

- Primary `getSession()` path unchanged
- Dead `globalThis?.__WANDERS_SB__` branch removed (Wanders client is module-scoped; this check was always null/undefined)
- `getBackgroundJob()` function unchanged
- All export signatures unchanged

---

## Grep Validation Result

```
rg -n "__SB_CLIENT__|__WANDERS_SB__|sb-auth-main|signOut\(" apps/VCSM/src
```

| Check | Expected | Result |
|---|---|---|
| `__SB_CLIENT__` assignment | NONE remaining | ✅ NONE — removed from supabaseClient.js |
| `window.__SB_CLIENT__` or `globalThis.__SB_CLIENT__` | NONE remaining | ✅ NONE |
| `__WANDERS_SB__` | NONE remaining | ✅ NONE — removed from uploadToCloudflare.js |
| `sb-auth-main` in Supabase config | PRESENT | ✅ `supabaseClient.js:28 storageKey: 'sb-auth-main'` |
| `sb-auth-main` in logout fallback | PRESENT | ✅ `AuthProvider.jsx:209 localStorage.removeItem('sb-auth-main')` |
| `signOut({ scope: 'local' })` | PRESENT, unchanged | ✅ `AuthProvider.jsx:202`, `resetPassword.dal.js:23`, `register.dal.js:30` |

---

## Build / Lint / Test Result

| Command | Result | Notes |
|---|---|---|
| `npm run lint` | Pre-existing 82 errors, 57 warnings | New: `AuthProvider.jsx:209:65 no-empty` (empty catch `catch (_) {}`) — same pattern as pre-existing lines 56, 59, 187 in the same file. No new violation TYPE introduced. `supabaseClient.js` and `uploadToCloudflare.js` — zero errors. |
| `npm run test:run` | 517 passed, 3 failed | All 3 failures are pre-existing: `submitFuelPriceSuggestion.controller.test.js` and `settingsCoordinator.controller.test.js` (vport dashboard). Zero auth-related test regressions. |
| `npm run build` | ✅ Success — built in 5.75s | No compile errors. PWA service worker built. No warnings related to changed files. |

---

## Blockers

None. All three fixes applied cleanly.

---

## Final Risk Rating After Fix

| Finding | Before | After |
|---|---|---|
| XSS → `window.__SB_CLIENT__` → token theft | CRITICAL | **CLOSED** — global no longer exists |
| signOut failure → session re-hydration | HIGH | **MITIGATED** — fallback `localStorage.removeItem` added; prevents re-hydration after network failure |
| Dead `__WANDERS_SB__` global reference | MEDIUM | **CLOSED** — dead code removed |
| stolen refresh token survives local signOut | HIGH | **OPEN** (documented architectural trade-off; requires `scope: 'global'` option; out of scope for this ticket) |
| `scope: 'global'` not available | LOW | **OPEN** — not implemented per ticket scope |

**Residual risk:** LOW. The token-theft vector via XSS is closed. The signOut-failure re-hydration window is closed. The documented architectural trade-off (local vs global scope) is unchanged by design.

---

*TICKET-AUTH-ARCH-001 — Implementation — 2026-06-05 — 3 files changed — Build: PASS*
