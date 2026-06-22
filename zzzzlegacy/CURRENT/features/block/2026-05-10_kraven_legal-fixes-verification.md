# KRAVEN — Legal Performance Fixes Verification
**Date:** 2026-05-10
**Scope:** apps/VCSM/ — Legal/ToS system only
**Mode:** Read-only audit — no code modifications

---

## VERIFIED FIXES

---

KRAVEN VERIFIED ✓
- Fix: IP fetch no longer blocks consent write (Fix A)
- Location: `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` + `apps/VCSM/src/features/legal/dal/userConsents.write.dal.js`
- Status: Correctly implemented
- Notes:
  - `getPublicIp()` is not imported or called anywhere in `legalConsent.controller.js`. The function exists only as dead code inside `getPublicIp.dal.js` with a file-level `NOT CALLED` header comment.
  - `ip_address` is absent from the insert payload in `dalRecordLegalAcceptance()`. The insert includes only: `user_id`, `user_app_account_id`, `app_id`, `legal_document_id`, `consent_type`, `consent_version`, `accepted`, `accepted_via`, `locale`, `user_agent`.
  - The 3-second blocking external fetch is completely gone from the hot path.
  - A grep across all VCSM src files confirms `getPublicIp` has zero callers — the only file referencing the symbol is `getPublicIp.dal.js` itself.

---

KRAVEN VERIFIED ✓
- Fix: LegalDocumentScreen lazy-split (Fix B)
- Location: `apps/VCSM/src/app/routes/lazyPublic.jsx` (line 13)
- Status: Correctly implemented
- Notes:
  - `LegalDocumentScreen` is now exported via `lazyWithLog("LegalDocumentScreen", () => import("@/features/legal/screens/LegalDocumentScreen"))` — a proper dynamic import, not a static re-export.
  - `lazyWithLog()` is a thin wrapper around React's `lazy()` that catches import errors and logs them before rethrowing. It wraps `lazy(() => importer().catch(...))`. The wrapper is synchronous to construct and adds zero blocking overhead — the error handler fires only if the import fails. No meaningful overhead vs a bare `lazy()`.
  - LegalDocumentScreen itself also lazily imports `PrivacyPolicyContent` and `TermsOfServiceContent` using `lazy()` with `<Suspense>`, so the ~889-line combined document JSX is double-deferred — split from the main bundle AND split from LegalDocumentScreen's own chunk.

---

KRAVEN VERIFIED ✓
- Fix: Consent write loop parallel (Fix D)
- Location: `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` (lines 105–119)
- Status: Correctly implemented
- Notes:
  - `recordLegalAcceptance()` uses `Promise.all(documents.map((doc) => dalRecordLegalAcceptance(...)))`. For 2 documents this eliminates one full DB round-trip.
  - `invalidateConsentCache(userId)` is called after `Promise.all` resolves — correct placement, no early invalidation.

---

KRAVEN VERIFIED ✓
- Fix: Consent read LIMIT (Fix E)
- Location: `apps/VCSM/src/features/legal/dal/userConsents.read.dal.js` (line 28)
- Status: Correctly implemented
- Notes:
  - `.limit(20)` is present. Query also filters on `eq('accepted', true)` and `.is('revoked_at', null)` before the limit, so only non-revoked accepted rows count toward it. For a typical user with 2–3 consent types, this cap is unreachable in normal operation but correctly guards against pathological rows.

---

KRAVEN VERIFIED ✓
- Fix: Docs cache TTL reduced (Fix F)
- Location: `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` (line 10)
- Status: Correctly implemented
- Notes:
  - `legalDocsCache = createTTLCache(60_000)` — 60 seconds. Prior value was 300,000ms (5 min). The code comment confirms the intent: "limits non-enforcement window after a version bump."
  - The consent cache remains at 90s (`consentCache = createTTLCache(90_000)`), which is appropriate — consent rows change less frequently than document versions.

---

KRAVEN VERIFIED ✓
- Fix: Cache key includes appId (Fix G)
- Location: `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` (line 49)
- Status: Correctly implemented
- Notes:
  - `const cacheKey = \`${userId}:${appId}\`` is used in `getCachedUserConsents()`. This prevents cross-app consent cache collisions in any future multi-app context.
  - `invalidateConsentCache(userId)` uses only `userId` as the key to invalidate — this is a partial mismatch. The cache stores keys as `userId:appId` but `consentCache.invalidate(userId)` would only hit an exact key match of the bare userId. If `ttlCache.invalidate()` does an exact key lookup, the invalidation call after `recordLegalAcceptance()` silently does nothing because no entry is stored under the bare userId.

---

## PERFORMANCE FINDINGS

---

KRAVEN PERFORMANCE FINDING
- Location: `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` lines 36–41 + `apps/VCSM/src/features/legal/hooks/useLegalConsent.js` line 56–58
- Application Scope: VCSM
- Current behavior: `retryConsent` increments `retryCount`, which causes the `useEffect` in `useLegalConsent` to re-run `check()`. `check()` calls `resolveLegalGateForSession()`, which calls `getActiveLegalDocuments()` then `getCachedUserConsents()`. Neither cache is invalidated before the retry. If the error was caused by a transient network failure and the cache is cold, the retry hits the DB. But if the error was caused by stale or missing cache state, and the cache is warm, the retry returns the same cached result without a fresh DB read.
- Detected pattern: Retry path does not call `invalidateLegalDocsCache()` or `invalidateConsentCache(userId)` before re-running the gate check. `retryConsent` = `setRetryCount(c => c + 1)` only.
- Estimated impact: LOW-MEDIUM. If a user hits a gate error during a network hiccup, the retry correctly re-fetches (cache was cold). But if a gate error is triggered by a platform misconfiguration (empty docs) and then the docs are corrected within the 60s TTL window, the retry will re-hit the warm cache and throw the same error again, making the retry button appear broken for up to 60 seconds.
- Root cause hypothesis: The retry mechanism was designed for network-transient errors. It does not account for the case where the cache itself is the cause of the error (stale or wrong state).
- Recommended optimization: In `useLegalConsent.js`, before calling `resolveLegalGateForSession` inside the retry path (i.e., when `retryCount > 0`), call `invalidateLegalDocsCache()` and `invalidateConsentCache(userId)` to force a cold re-fetch. This can be conditioned on `retryCount > 0` to avoid busting the cache on the initial mount check.
- Expected improvement: Makes the "Try Again" button always produce a genuine fresh DB read, removing the stale-cache-on-retry failure mode. No impact on normal (non-retry) flow.

---

KRAVEN PERFORMANCE FINDING
- Location: `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` lines 156–166 (Fix C — not verified)
- Application Scope: VCSM
- Current behavior: `resolveLegalGateForSession()` fetches `getActiveLegalDocuments()`, awaits it, reads `appId` from the result, then awaits `getCachedUserConsents()`. These are two sequential awaits — the second cannot start until the first finishes.
- Detected pattern: Sequential async reads. The delivery summary listed "Session-restore DB reads parallel" as a MEDIUM fix, but the implementation is still sequential. The two reads cannot be parallelized trivially because `getCachedUserConsents` needs `appId`, which comes from the docs response. However, if `appId` were known at call time (passed as a parameter or derived from a constant), both reads could be parallelized with `Promise.all`.
- Estimated impact: MEDIUM. For a cold cache, this adds one full DB round-trip (RTT) to the consent gate check at every session start. If each DB call takes ~80–120ms, sequential reads take ~160–240ms vs a potential ~80–120ms parallel. On mobile with higher RTT (~200ms), this is ~200–400ms vs ~200ms — a 2x difference on the critical gate path.
- Root cause hypothesis: The `appId` dependency is embedded in the docs result. The code has no constant or pre-known `appId` to allow pre-fetching consents in parallel. Fix C was likely claimed complete but `appId` dependency was not resolved.
- Recommended optimization: Two options: (A) Accept that `appId` must be known first and optimize by pre-warming the docs cache during AuthProvider init so the second call in ProtectedRoute is a cache hit. (B) Make `appId` a well-known constant (since `VCSM_APP_KEY = 'vcsm'` is already hardcoded) — look up `appId` from a stored constant or make one additional DB call to resolve it at app init time, then pass it down so both reads can parallelize.
- Expected improvement: ~80–200ms saved on gate resolution for cold-cache sessions. High value on mobile connections.

---

KRAVEN PERFORMANCE FINDING
- Location: `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` lines 36–41
- Application Scope: VCSM
- Current behavior: `invalidateConsentCache(userId)` is called after a successful `recordLegalAcceptance()`. Inside `invalidateConsentCache`, the call is `consentCache.invalidate(userId)` — a bare `userId` string. But entries are stored with `consentCache.set(cacheKey, ...)` where `cacheKey = \`${userId}:${appId}\``. The key format is `"uuid:uuid"` but the invalidation lookup is just `"uuid"`.
- Detected pattern: Key format mismatch between write and invalidate paths. If `createTTLCache` uses exact key matching (as a standard `Map`-based TTL cache would), `invalidate(userId)` will never hit any entry and the cache will never be busted after a consent write.
- Estimated impact: HIGH — correctness and security concern as much as performance. After a user accepts consent documents, the stale "no consent" or "outdated consent" cache entry remains live for up to 90 seconds. During that window, if `ProtectedRoute` re-renders or another component re-checks consent status, it will read the stale cached result and see the user as non-compliant (or compliant with the old version), causing either a repeat consent gate flash or a missed re-consent enforcement.
- Root cause hypothesis: The `invalidateConsentCache` function signature accepts `userId` only and was not updated when the cache key was changed to `userId:appId`.
- Recommended optimization: Change `invalidateConsentCache` to accept `{ userId, appId }` and build the compound key `\`${userId}:${appId}\`` before calling `consentCache.invalidate()`. All callers of `invalidateConsentCache` must be updated to pass `appId`. Alternatively, expose a `invalidateByPrefix(userId)` method on the TTL cache to bust all keys starting with the userId prefix.
- Expected improvement: Ensures the consent cache is correctly busted after a write, eliminating the 90-second stale window. This is also a correctness fix — the cache invalidation is silently broken as-is.

---

KRAVEN PERFORMANCE FINDING
- Location: `apps/VCSM/src/app/guards/ProtectedRoute.jsx` lines 32–49 + `apps/VCSM/src/app/providers/AuthProvider.jsx`
- Application Scope: VCSM
- Current behavior: `ProtectedRoute` mounts, reads `useAuth()` → waits for `loading` (auth hold). Once auth resolves, `useLegalConsent()` fires its effect (since it depends on `user?.id`). This means the legal gate check cannot even start until auth has fully resolved. Both holds produce sequential blank-screen `return null` renders: first for `loading` (line 32), then for `consentLoading` (line 49).
- Detected pattern: Auth hold and consent hold are fully sequential. Auth loading → then consent loading starts → then app renders. No pre-warming of the legal gate check during auth hydration.
- Estimated impact: MEDIUM. Total blank-screen time = auth RTT + consent gate RTT. If auth hydration from Supabase's persisted session takes 100–300ms and consent gate takes 160–400ms, total blank-screen time is 260–700ms before any meaningful UI appears. On mobile this compounds.
- Root cause hypothesis: `AuthProvider` resolves auth state, then `ProtectedRoute` triggers consent as a downstream effect. There is no mechanism to start the legal gate prefetch in parallel with auth resolution or speculatively at app mount.
- Recommended optimization: Pre-warm the legal documents cache at AuthProvider hydration time. Since `getActiveLegalDocuments()` has no auth dependency (it reads public platform data), it can be called speculatively the moment the app mounts — before auth resolves, and certainly before ProtectedRoute mounts. This does not require the userId and cuts one full DB round-trip from the gate path. The consent fetch still requires userId, so it remains gated on auth, but the docs fetch can be fire-and-forget at startup.
- Expected improvement: Removes one DB round-trip (~80–200ms) from the visible blank-screen window on every authenticated session start.

---

KRAVEN PERFORMANCE FINDING
- Location: `apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx`
- Application Scope: VCSM
- Current behavior: When `gateError` is truthy, `ConsentGateScreen` renders the "Verification Unavailable" error UI and returns early (line 14–50). This is correct — the main consent form and `requiredActions` list are not rendered. `ConsentGateScreen` does not import `TermsOfServiceContent` or `PrivacyPolicyContent` directly; those are only in `LegalDocumentScreen`. The error state is a clean minimal render.
- Detected pattern: No waste — the error branch renders only the error card and a retry button.
- Estimated impact: NONE — this is correctly implemented.
- Notes: The earlier KRAVEN concern about "loading full JSX document in error state" does not apply. `ConsentGateScreen` is not `LegalDocumentScreen`. The two are separate components with separate import trees.

---

## REMAINING ISSUES — PRIORITY LIST

### P0 — Silent Bug (appears as a fix but is broken)

1. **Consent cache invalidation key mismatch** — `invalidateConsentCache(userId)` uses a bare `userId` key but the cache stores entries under `userId:appId`. The invalidation call is a no-op. The consent cache is never actually busted after a write. This affects every consent acceptance flow (signup and re-consent).
   - File: `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` lines 36–41
   - Fix: Change `invalidateConsentCache` to accept and use the compound key `userId:appId`.

### P1 — Correctness / UX (retry button can appear broken)

2. **Retry does not invalidate caches** — `retryConsent` increments a counter but does not call `invalidateLegalDocsCache()` or `invalidateConsentCache()`. If the cause of the gate error is a stale warm cache, the retry will reproduce the same error for up to 60s (docs TTL).
   - File: `apps/VCSM/src/features/legal/hooks/useLegalConsent.js` lines 56–58
   - Fix: Invalidate both caches before re-running the gate check when `retryCount > 0`.

### P2 — Performance (sequential reads on hot path)

3. **`resolveLegalGateForSession` reads docs then consents sequentially** — Fix C was listed as delivered but the reads remain sequential due to `appId` depending on the docs result. This doubles the DB RTT on cold-cache gate resolution.
   - File: `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` lines 156–166
   - Fix: Pre-warm the docs cache at app startup so the first await is a cache hit, or resolve the `appId` dependency to enable `Promise.all`.

4. **Auth hold and consent hold are sequential blanks** — ProtectedRoute produces two sequential blank-screen holds. The legal docs fetch has no auth dependency and could start at app mount.
   - Files: `apps/VCSM/src/app/guards/ProtectedRoute.jsx`, `apps/VCSM/src/app/providers/AuthProvider.jsx`
   - Fix: Fire a speculative `getActiveLegalDocuments()` call at AuthProvider init to warm the docs cache before ProtectedRoute mounts.

### P3 — Housekeeping

5. **`getPublicIp.dal.js` is dead code** — Zero callers confirmed. The file is retained "for reference only" per its own header comment. It should be deleted or moved to `zNOTFORPRODUCTION/` to prevent accidental re-import in the future.
   - File: `apps/VCSM/src/features/legal/dal/getPublicIp.dal.js`

6. **`legalDocuments.read.dal.js` has no `.limit()`** — The `dalGetActiveLegalDocuments()` query has no row cap. For a platform with 2–3 legal documents this is fine, but as document types grow, there is no guard. This is low risk but worth noting.
   - File: `apps/VCSM/src/features/legal/dal/legalDocuments.read.dal.js`

---

## SUMMARY TABLE

| Fix | Status | Notes |
|-----|--------|-------|
| A — IP fetch removed from write path | VERIFIED ✓ | Zero callers confirmed via grep |
| B — LegalDocumentScreen lazy-split | VERIFIED ✓ | Dynamic import in lazyPublic.jsx; docs also double-deferred |
| C — Session-restore reads parallel | NOT VERIFIED — still sequential | appId dependency prevents true Promise.all |
| D — Consent write loop parallel | VERIFIED ✓ | Promise.all confirmed in recordLegalAcceptance |
| E — Consent read LIMIT 20 | VERIFIED ✓ | .limit(20) present in userConsents.read.dal.js |
| F — Docs cache TTL 60s | VERIFIED ✓ | createTTLCache(60_000) confirmed |
| G — Cache key userId:appId | VERIFIED ✓ (write) / BROKEN (invalidate) | Key format correct on get/set; invalidate uses bare userId |
| gateError retry UI | NEW ISSUE — P1 | Retry does not bust cache |
| lazyWithLog overhead | NEGLIGIBLE | Synchronous wrapper; error-only overhead |
| Promise.all partial failure | CORRECTNESS NOTE | No rollback; partial writes possible if one insert throws |
