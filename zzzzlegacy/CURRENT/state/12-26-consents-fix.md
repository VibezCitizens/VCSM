# 12-26 — Fix platform.user_consents Duplication

**Date:** 2026-04-12
**App:** VCSM
**Task:** Eliminate redundant `platform.user_consents` reads (~64 per session, ~9717ms wasted)

---

## Audit Findings

### Call Chain

```
ProtectedRoute (guard) 
  -> useLegalConsent (hook)
    -> resolveLegalGateForSession (controller)
      -> dalGetActiveLegalDocuments (DAL) — was uncached at this call site
      -> dalGetUserConsents (DAL) — was completely uncached
```

### Root Causes

1. **`dalGetUserConsents` had zero caching.** Every call hit the database. The controller already had a `legalDocsCache` using `createTTLCache`, but no equivalent for consent rows.

2. **Three controller functions bypassed the legal docs cache.** `getUserConsentStatus()`, `resolveLegalGateForSession()`, and `recordSignupConsent()` all called `dalGetActiveLegalDocuments()` directly instead of the cached `getActiveLegalDocuments()` wrapper.

3. **Single mount point.** `useLegalConsent` is only mounted once (in `ProtectedRoute.jsx`), but React strict mode double-mounts + auth state transitions cause re-fires. The real multiplication comes from the uncached DAL being hit on every gate check.

### Callers of `dalGetUserConsents`

| Controller Function | Was Cached? |
|---|---|
| `getUserConsentStatus()` | No |
| `resolveLegalGateForSession()` | No |

### Write Paths That Need Cache Invalidation

| Function | Context |
|---|---|
| `recordLegalAcceptance()` | Accepts consent docs (used by signup + reconsent) |

---

## Fix Applied

**File:** `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js`

### Changes

1. **Added `consentCache`** — `createTTLCache(90_000)` (90 seconds), keyed by `userId`.

2. **Added `getCachedUserConsents()`** — Private function that wraps `dalGetUserConsents` with the cache. All read paths now route through this.

3. **Fixed legal docs cache bypass** — `getUserConsentStatus()`, `resolveLegalGateForSession()`, and `recordSignupConsent()` now call `getActiveLegalDocuments()` (cached) instead of `dalGetActiveLegalDocuments()` (direct DAL).

4. **Added `invalidateConsentCache(userId)`** — Exported for write paths. Called automatically inside `recordLegalAcceptance()` after successful inserts.

5. **No other files modified.** The hook, guard, DAL, and engine files are unchanged. The fix is entirely within the controller layer where caching belongs.

### Expected Impact

- `platform.user_consents` reads reduced from ~64 to 1 per 90-second window per user
- `platform.legal_documents` reads also reduced (were bypassing existing cache)
- ~9700ms of wasted DB time eliminated per session
- Write paths (signup, reconsent) properly invalidate the cache

---

## Files Touched

- `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` (modified)
- `planning/april/12/12-26-consents-fix.md` (created)
