# KRAVEN Performance Audit — Terms of Service Acceptance & Enforcement
**Date:** 2026-05-10
**Scope:** `apps/VCSM/src/features/legal/` and related guards
**Auditor:** KRAVEN (analysis-only — no code modified)
**Input:** ARCHITECT report `2026-05-10_architect_terms-of-service-logic.md`

---

## Summary

The ToS enforcement pipeline has **two HIGH-impact issues** and **four MEDIUM-impact issues**. The most severe is a 3-second hard block imposed by a serial IP fetch (`api.ipify.org`) on every consent write path, including the signup and re-consent flows. The second most severe is that `LegalDocumentScreen` — and its two static JSX document bodies totaling ~34 KB source — are included in the **main bundle** for every user who will never view them. The remaining issues concern serial DB awaits, 90-second stale-gate exposure, and over-broad consent reads.

---

## Findings

---

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:113
- Application Scope: VCSM
- Current behavior: recordLegalAcceptance() calls `await getPublicIp()` before
  entering the document-writing loop. getPublicIp() calls api.ipify.org with a
  3-second AbortSignal timeout. The DB inserts for every accepted document are
  blocked behind this external HTTP round-trip. On a slow or restricted network
  the user waits the full 3-second timeout before a single consent row is written.
  This is in both the signup path (useRegister → recordSignupConsent) and the
  re-consent gate path (acceptAll → acceptRequiredConsents → recordLegalAcceptance).
- Detected pattern: Blocking external HTTP call serialized before critical DB writes
- Estimated impact: HIGH
- Root cause hypothesis: IP address is treated as a required precondition rather
  than metadata that can be attached asynchronously or fire-and-forget. The code
  already handles `null` from getPublicIp() gracefully, but forces a serial await
  regardless of the outcome.
- Recommended optimization: Move the IP fetch to a non-blocking parallel fetch.
  Start `getPublicIp()` concurrently with the DB inserts (or before them with
  Promise.race + a shorter timeout), then attach the resolved value in a follow-up
  UPDATE. Alternatively, cut the AbortSignal timeout from 3000ms to 800ms — the
  current 3s is excessive for metadata that falls back to null anyway. A fire-and-
  forget pattern (record consent immediately with ip_address: null, then PATCH with
  real IP once resolved) would also eliminate the block entirely.
- Expected improvement: Removes up to 3-second blocking delay from consent write
  path on all networks. On fast networks, ipify typically resolves in 100–300ms —
  parallelizing with DB insert would make this overlap near-zero.
```

---

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/app/routes/lazyPublic.jsx:13,
            apps/VCSM/src/features/legal/screens/LegalDocumentScreen.jsx:4-5
- Application Scope: VCSM
- Current behavior: `LegalDocumentScreen` is statically re-exported from
  lazyPublic.jsx (`export { default as LegalDocumentScreen } from ...`) without
  wrapping in `lazy()`. This makes it a synchronous import included in the main
  bundle. `LegalDocumentScreen` itself statically imports both
  `TermsOfServiceContent.jsx` (510 lines, ~22.8 KB source) and
  `PrivacyPolicyContent.jsx` (379 lines, ~11.8 KB source). Both static JSX bodies
  are therefore included in the initial JavaScript bundle for every page load,
  even though >99% of authenticated users will never visit `/legal/:docType` in a
  given session. Every user parses ~34.6 KB of JSX static content on cold start.
- Detected pattern: Static import of route-level component that should be lazy-split
- Estimated impact: HIGH
- Root cause hypothesis: An explicit comment in lazyPublic.jsx reads
  `// ── Legal (static — no lazy flash) ───`. The decision to opt out of lazy
  loading was made to prevent a loading flash on the public legal routes. However,
  this trades a visual artifact (a brief fallback) for a universal parse cost paid
  by every authenticated session, including the majority of users who will never
  open the legal document screen. The tradeoff is wrong in both directions.
- Recommended optimization: Wrap `LegalDocumentScreen` in `lazy()` like every other
  public route in lazyPublic.jsx. If the no-flash requirement still applies, add a
  `<Suspense fallback={null}>` wrapper (invisible hold) specifically for the legal
  routes in the public route config — this is the correct place to control the
  fallback, not via opting out of code splitting. Separately, `TermsOfServiceContent`
  and `PrivacyPolicyContent` can themselves be lazy-loaded within `LegalDocumentScreen`
  if further splitting is desired.
- Expected improvement: Removes ~34.6 KB source (~10–15 KB gzipped estimated) of
  static legal JSX from the main bundle. Reduces parse time on initial load for all
  users who do not navigate to `/legal/:docType`.
```

---

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:115-130
- Application Scope: VCSM
- Current behavior: recordLegalAcceptance() writes consent rows in a sequential
  `for...of` loop with `await` on each `dalRecordLegalAcceptance()` call. For a
  standard VCSM signup or re-consent covering 2 document types (terms_of_service +
  privacy_policy), this means 2 serial round-trips to Supabase. Each Supabase insert
  round-trip on a cold connection is approximately 200–600ms. Serial execution means
  the total consent write time = sum(all inserts), not max(all inserts).
- Detected pattern: Serial awaits in a loop that could be parallelized
- Estimated impact: MEDIUM
- Root cause hypothesis: The loop was written for correctness and simplicity without
  consideration of parallelization. The inserts are fully independent — they share
  no keys and write distinct rows identified by (user_id, legal_document_id). There
  is no transactional dependency between them at the application level.
- Recommended optimization: Replace the sequential loop with `Promise.all()`:
  ```js
  const results = await Promise.all(
    documents.map((doc) => dalRecordLegalAcceptance({ ... }))
  )
  ```
  If atomicity is required (all-or-none), wrap in a Supabase RPC that inserts
  multiple rows in a single DB transaction instead of N round-trips.
- Expected improvement: For 2 documents, saves approximately 200–600ms per consent
  write. As the number of legal document types grows, the saving scales linearly.
```

---

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:174-193
            apps/VCSM/src/features/legal/hooks/useLegalConsent.js:20-53
- Application Scope: VCSM
- Current behavior: On every session restore where the user?.id changes (i.e., every
  cold app load), useLegalConsent fires its useEffect and calls
  resolveLegalGateForSession(). This function performs two DB reads in sequence:
  (1) getActiveLegalDocuments() → legalDocsCache → dalGetActiveLegalDocuments()
  (2) getCachedUserConsents() → consentCache → dalGetUserConsents()
  These two reads are fully independent — neither result depends on the other to
  begin — but they are executed with serial awaits:
    `const activeDocs = await getActiveLegalDocuments()`  [wait]
    `const consents = await getCachedUserConsents(...)`    [wait]
  On a cold cache (first load, or after TTL expiry), both queries hit the DB
  sequentially. The user sees `consentLoading = true` and the ProtectedRoute holds
  (`return null`) until both complete. This is a blocking render hold on the critical
  path to first screen.
- Detected pattern: Serial independent DB queries on session-restore critical path
- Estimated impact: MEDIUM
- Root cause hypothesis: The controller was written in a linear async style without
  identifying that the two data sources have no ordering dependency. The appId
  extracted from activeDocs is needed to call getCachedUserConsents, but the
  appId is also statically knowable (it is the VCSM app ID). Parallelization is
  possible if appId is resolved ahead of time or both queries are fired together
  with a known appId constant.
- Recommended optimization: Two approaches:
  (a) Fire both queries in parallel using Promise.all. This requires either knowing
      appId in advance (store it as a module constant after first fetch) or
      restructuring so getCachedUserConsents accepts an appKey and resolves appId
      internally.
  (b) Resolve appId once after the first successful docs fetch and store it as a
      module-level variable. Subsequent session restores within TTL will hit cache
      for docs (appId already known) and fire the consent query in parallel
      immediately.
  Either way, on a warm docs cache (99% of sessions after first load), approach (b)
  is already partially effective. The cold-cache case remains fully serial.
- Expected improvement: On cold cache (first load per browser session), eliminates
  one full DB round-trip from the blocking render hold. Estimated 200–500ms saving
  on first-load time-to-first-screen.
```

---

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/legal/dal/userConsents.read.dal.js
- Application Scope: VCSM
- Current behavior: dalGetUserConsents() fetches ALL accepted, non-revoked consent
  rows for a user + app combination, ordered by accepted_at descending. For a user
  with a long account history or multiple re-consents (e.g., 5 version bumps over 2
  years = 10 rows), this returns the full history. The compliance engine then scans
  all rows to find the latest per consent_type. There is no LIMIT clause and no
  database-side deduplication — the full consent history is transferred over the
  wire on every cold read.
- Detected pattern: Overfetch — full history returned when only latest-per-type is needed
- Estimated impact: MEDIUM
- Root cause hypothesis: The query was written defensively to return everything and
  let the application layer deduplicate. This is correct for correctness but
  inefficient for performance. The compliance engine only needs the most recent
  accepted row per consent_type, not the full history.
- Recommended optimization: Add a LIMIT or use a window function via RPC to return
  only the latest row per (user_id, consent_type). Short-term: add `.limit(20)` as
  a practical cap since the number of distinct document types is bounded (currently
  2). Long-term: consider a DB view or RPC that returns one row per consent_type
  per user using DISTINCT ON (consent_type) ORDER BY accepted_at DESC.
- Expected improvement: Reduces wire transfer and DB scan cost on the consent read
  query. Minimal impact today (rows are few), but prevents silent accumulation of
  re-consent history growing the payload on every session restore over the
  platform's lifetime.
```

---

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:10
            apps/VCSM/src/shared/lib/ttlCache.js
- Application Scope: VCSM
- Current behavior: Both caches (legalDocsCache — 5min TTL, consentCache — 90s TTL)
  are module-level Map instances created once per JavaScript module evaluation.
  Because Vite bundles the controller as a singleton module in the browser, these
  caches survive re-renders and even React tree re-mounts — they live at JS module
  scope, not component scope. This is correct behavior.
  However, the 90-second consent cache creates a specific edge case on re-consent:
  after the user accepts required documents, invalidateConsentCache(userId) is called
  immediately, which clears the user's entry. The next gate check will re-read from
  DB and see the fresh acceptance — this is correct.
  The risk scenario is the inverse: a version bump in the DB while the user has
  an active session with warm docs cache (5-minute TTL). The docs cache serves stale
  document version data for up to 5 minutes after a version bump. During this
  window, the compliance engine compares user consents against the OLD document
  version and may incorrectly report the user as compliant when they should see the
  re-consent gate. This resolves on next cache expiry (up to 5 minutes later) but
  creates a window of non-enforcement on a version transition.
- Detected pattern: Module-level cache may serve stale document version on version bump
- Estimated impact: MEDIUM (legal/compliance risk, not just UX latency)
- Root cause hypothesis: The 5-minute docs cache TTL is reasonable for performance
  (legal docs truly change rarely) but there is no push invalidation. A version bump
  in Supabase has no mechanism to signal the client caches. Users with active
  sessions will continue to see compliant status for up to 5 minutes post-bump.
- Recommended optimization: Two mitigations:
  (a) Reduce docs cache TTL to 60 seconds. Legal doc changes are admin-only, rare
      events — 60s TTL still prevents per-route re-reads while limiting the
      enforcement window to 1 minute.
  (b) Add a Supabase Realtime subscription on `platform.legal_documents` that calls
      `invalidateLegalDocsCache()` when a new version is published. This provides
      near-instant invalidation for all active clients and removes the enforcement
      window entirely.
  Option (b) is significantly more robust and appropriate for a legal enforcement
  mechanism.
- Expected improvement: Closes up to 5-minute non-enforcement window after a ToS
  version bump. Realtime subscription approach reduces enforcement lag to
  sub-second.
```

---

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/app/guards/ProtectedRoute.jsx:31, :48
            apps/VCSM/src/features/legal/hooks/useLegalConsent.js:15-16
- Application Scope: VCSM
- Current behavior: ProtectedRoute renders `null` (blank screen) at two sequential
  hold points before the user sees any content:
  (1) Auth loading hold: `if (loading) return null` — waits for AuthProvider session
      resolution
  (2) Consent loading hold: `if (consentLoading) return null` — waits for
      resolveLegalGateForSession() to complete, which includes the two DB reads
      described above
  These two loading states are not parallelized. useLegalConsent always starts its
  check after the parent ProtectedRoute renders (i.e., after auth has resolved).
  Only then does the DB consent pipeline begin. The user experiences two consecutive
  blank-screen holds in sequence: auth settle time + consent check time.
  On cold cache, the consent check adds an additional 400–1000ms of blank screen
  after auth has already resolved.
- Detected pattern: Sequential loading phases creating additive blank-screen time
- Estimated impact: MEDIUM
- Root cause hypothesis: The consent check is gated on `user?.id` being available
  (correct — you cannot check consent without knowing the user). However, the
  consent check's DB reads themselves are not started as early as possible.
  AuthProvider likely resolves the session before ProtectedRoute renders; the
  useLegalConsent effect fires after that render. There is an implicit rendering
  latency inserted between auth resolution and consent check start.
- Recommended optimization: Start the consent resolution concurrently in AuthProvider
  (or a session-level effect) as soon as `user.id` is known, rather than waiting
  for ProtectedRoute to mount. This means the consent check can be in-flight while
  the React tree renders down to ProtectedRoute. By the time ProtectedRoute checks
  `consentLoading`, it may already be resolved, reducing or eliminating the second
  blank-screen hold. The hook's anti-cancellation pattern (`let cancelled`) already
  handles unmount safety.
- Expected improvement: On warm consent cache: consent check resolves before
  ProtectedRoute checks it — second hold becomes zero. On cold cache: overlap
  between auth resolve and consent DB query eliminates sequential stacking,
  reducing first-screen delay by 200–800ms.
```

---

## Priority List

| Priority | Finding | Impact | File(s) |
|---|---|---|---|
| 1 | IP fetch (api.ipify.org) blocks consent write path with up to 3s serial wait | HIGH | `legalConsent.controller.js:113` |
| 2 | LegalDocumentScreen + ~34.6 KB of static legal JSX in main bundle (no lazy split) | HIGH | `lazyPublic.jsx:13`, `LegalDocumentScreen.jsx:4-5` |
| 3 | Two DB reads on session-restore gate check are serial — both hit cold cache on first load | MEDIUM | `legalConsent.controller.js:175-181` |
| 4 | Consent write loop is serial — N documents = N sequential DB round-trips | MEDIUM | `legalConsent.controller.js:115-130` |
| 5 | 5-minute docs cache creates non-enforcement window after a ToS version bump; no push invalidation | MEDIUM | `legalConsent.controller.js:9`, `ttlCache.js` |
| 6 | Two sequential blank-screen holds in ProtectedRoute (auth + consent) are additive | MEDIUM | `ProtectedRoute.jsx:31,48`, `useLegalConsent.js:15` |
| 7 | Consent read DAL fetches full history with no LIMIT — will grow silently over platform lifetime | MEDIUM | `userConsents.read.dal.js` |

---

## Notes on What Is Working Well

- Both caches (`legalDocsCache`, `consentCache`) are correctly scoped at module level — they are true singletons that survive re-renders and do not leak between component lifecycles.
- `invalidateConsentCache(userId)` is called immediately after every consent write — the write-then-invalidate pattern is correct and prevents stale reads post-acceptance.
- `getPublicIp()` correctly returns `null` on failure and does not propagate the error — the fallback is appropriate.
- `ConsentGateScreen` does NOT import `TermsOfServiceContent` or `PrivacyPolicyContent` — the gate UI itself is lightweight and this was correctly separated.
- The compliance engine (`legalCompliance.engine.js`) is pure and synchronous — zero performance cost after data is fetched.
- The `useLegalConsent` effect is keyed only on `user?.id` — it does not re-run on unrelated renders or route changes, which is the correct optimization.
