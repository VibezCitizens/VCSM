# VENOM SECURITY AUDIT — Legal Fixes Verification
**Date:** 2026-05-10
**Scope:** `apps/VCSM/` — Legal/ToS system security fix round, post-delivery verification
**Auditor:** VENOM (read-only, no code modifications)
**Files audited:** 13 changed files + 3 staged DB migrations

---

## VERIFIED FIXES

---

```
VENOM VERIFIED ✓
- Fix: A — Fail-closed gate
- Location: apps/VCSM/src/features/legal/hooks/useLegalConsent.js (lines 37–46)
           apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx (lines 14–50)
- Status: Correctly implemented
- Notes: The catch block sets setRequiresConsent(true) and setGateError(err.message ??
  'Consent check failed'). It does NOT set requiresConsent to false. The cancelled flag
  prevents stale state updates from aborted effects. ConsentGateScreen short-circuits on
  gateError before rendering ANY consent UI or pass-through, showing a hard-blocked
  "Verification Unavailable" card with only a "Try Again" button. No route outlet
  is rendered. Fail-closed is fully enforced.
```

---

```
VENOM VERIFIED ✓
- Fix: B — Empty docs throws in session gate
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js (lines 159–163)
- Status: Correctly implemented
- Notes: resolveLegalGateForSession() throws an Error when activeDocs.length === 0.
  The hook's catch block then sets gateError + requiresConsent = true. Platform
  misconfiguration results in a blocked gate, not a pass-through. Correct.
```

---

```
VENOM VERIFIED ✓
- Fix: C — Synthetic age data removed
- Location: apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js
- Status: Correctly implemented
- Notes: syntheticAdultBirthdate() is fully absent. The comment at line 82 explicitly
  documents the intentional omission of birthdate/age/isAdult. No age synthesis code
  or writes exist anywhere in the join feature. recordSignupConsent is called at line 34
  with the real session userId, correctly swallowing errors (account creation must not
  be blocked by a consent recording failure). Import is from the adapter, not controller.
```

---

```
VENOM VERIFIED ✓
- Fix: D — accepted_at from DB not client
- Location: apps/VCSM/src/features/legal/dal/userConsents.write.dal.js (lines 30–44)
           zNOTFORPRODUCTION/_ACTIVE/planning/carnage_migrations/20260510_03_accepted_at_server_default.sql
- Status: Correctly implemented
- Notes: The DAL insert payload contains no accepted_at key. The column already has
  DEFAULT now() per the schema snapshot (line 19035 of full_schema.sql). Migration 03
  confirms and enforces this default. The trigger overwrites any client-supplied value
  with now(). The schema shows accepted_at is NOT NULL with DEFAULT now() — the column
  will always be populated by the database regardless of what the client sends.
```

---

```
VENOM VERIFIED ✓
- Fix: E — ip_address removed from client write
- Location: apps/VCSM/src/features/legal/dal/userConsents.write.dal.js
           apps/VCSM/src/features/legal/dal/getPublicIp.dal.js
- Status: Correctly implemented
- Notes: ip_address is absent from the insert payload in userConsents.write.dal.js.
  getPublicIp.dal.js is marked "NOT CALLED" with a comment explaining why client-side
  IP capture is unsuitable for legal evidence. A grep across the entire legal feature
  confirms getPublicIp is not imported anywhere. The ip_address column still exists in
  the schema (nullable inet) — correct for future server-side Edge Function population.
```

---

```
VENOM VERIFIED ✓
- Fix: F — Dead ToS/Privacy links fixed
- Location: apps/VCSM/src/features/join/screens/components/JoinSignupForm.jsx (lines 55–57)
- Status: Correctly implemented
- Notes: href="/legal/terms-of-service" and href="/legal/privacy-policy" are present.
  Both use target="_blank" rel="noopener noreferrer". No remaining /terms or /privacy
  short-links were found in the join feature.
```

---

```
VENOM VERIFIED ✓
- Fix: G — Consent write immutability (Migration 01)
- Location: zNOTFORPRODUCTION/_ACTIVE/planning/carnage_migrations/20260510_01_user_consents_immutability_and_grant.sql
- Status: Correctly implemented
- Notes: Two RESTRICTIVE deny policies for UPDATE and DELETE are correctly written.
  RESTRICTIVE policies override permissive policies even when a permissive policy
  would grant access — this is the correct policy type for a deny rule. The trigger
  guards user_id, legal_document_id, accepted_at, and accepted — the four audit-
  critical fields. The trigger fires BEFORE UPDATE FOR EACH ROW, correctly raising
  an exception for any mutation. The trigger catches service_role updates that bypass
  RLS but cannot bypass trigger logic. GRANT INSERT is also included.
```

---

```
VENOM VERIFIED ✓
- Fix: J — Cache key includes appId
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js (lines 48–55)
- Status: Correctly implemented
- Notes: Cache key is explicitly `${userId}:${appId}` (line 49). get() and set() both
  use this composite key. This prevents cross-app consent cache collisions.
```

---

```
VENOM VERIFIED ✓
- Fix: K — LegalDocumentScreen lazy-split
- Location: apps/VCSM/src/app/routes/lazyPublic.jsx (lines 13–15)
- Status: Correctly implemented
- Notes: Uses lazyWithLog() which wraps React.lazy() with a dynamic import. This is a
  true code-split, not a static re-export. The lazyWithLog wrapper logs the import
  failure to console.error before re-throwing, ensuring the error propagates to the
  Suspense boundary. The router wraps all routes in a top-level <Suspense> at
  apps/VCSM/src/app/routes/index.jsx (line 263).
```

---

```
VENOM VERIFIED ✓
- Fix: L — recordSignupConsent cross-feature access
- Location: apps/VCSM/src/features/legal/adapters/legal.adapter.js (line 6)
           apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js (line 4)
- Status: Correctly implemented
- Notes: legal.adapter.js re-exports recordSignupConsent from the controller. The join
  controller imports from @/features/legal/adapters/legal.adapter, NOT directly from
  the controller internals. The adapter boundary is respected.
```

---

## SECURITY FINDINGS

---

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js
  Function: invalidateConsentCache() (line 36–41) vs getCachedUserConsents() (line 49–55)
- Application Scope: VCSM
- Current behavior: The consent cache uses composite key `${userId}:${appId}` when
  storing entries (line 49: const cacheKey = `${userId}:${appId}`). However,
  invalidateConsentCache(userId) calls consentCache.invalidate(userId) — passing only
  the raw userId string, not the composite key. The ttlCache.invalidate() function does
  a Map.delete(key), which deletes by exact key match. Since the stored key is
  "abc123:def456" but the invalidation call deletes "abc123", the cache entry is
  NEVER removed after consent is accepted. The user's consent state remains stale in
  memory for up to 90 seconds after they successfully accept documents.
- Risk: After a user accepts consent (re-consent flow via acceptAll), the hook
  immediately calls setRequiresConsent(false) and clears the gate optimistically. But
  if the user navigates away and comes back within the 90-second window, the stale
  cache will be served again, causing the gate check to re-run against old data. In
  practice this manifests as the gate NOT re-appearing (because the hook sets state
  locally), but any server-side check consuming cached data will be stale. More
  critically: if a consent version bump is published, the invalidation after acceptance
  fails, meaning the new check after re-consent may still serve the pre-acceptance
  cache and appear to require re-consent again — causing a double-gate loop.
- Severity: MEDIUM
- Why it matters: Stale consent cache after write is a correctness defect that could
  loop users into the consent gate repeatedly after they already accepted, or serve
  stale compliance state to other code paths consuming the cache.
- Recommended mitigation: Change invalidateConsentCache to accept both userId and appId,
  or to always call invalidateAll() when appId is unknown. The simplest fix:
    export function invalidateConsentCache(userId, appId) {
      if (userId && appId) {
        consentCache.invalidate(`${userId}:${appId}`)
      } else {
        consentCache.invalidateAll()
      }
    }
  Then update the recordLegalAcceptance call site to pass appId:
    invalidateConsentCache(userId, documents[0]?.app_id)
- Rationale: The cache key and invalidation key must match exactly or the cache is
  effectively write-once for the TTL duration.
- Follow-up command: /BUGSBUNNY to trace the stale cache double-gate loop scenario.
```

---

```
VENOM SECURITY FINDING
- Location: zNOTFORPRODUCTION/_ACTIVE/planning/carnage_migrations/20260510_02_age_verification_consent_type.sql
- Application Scope: VCSM
- Current behavior: Migration 02 updates the CHECK constraint on platform.user_consents
  to add 'age_verification' to the allowed consent_type values. However, it does NOT
  update the equivalent CHECK constraint on platform.legal_documents. The schema
  snapshot confirms legal_documents has:
    CONSTRAINT legal_documents_document_type_check CHECK (
      document_type = ANY (ARRAY['privacy_policy', 'terms_of_service',
                                 'marketing_email', 'location_consent'])
    )
  The migration then attempts to INSERT a row into platform.legal_documents with
  document_type = 'age_verification'. This INSERT will FAIL with a constraint
  violation because legal_documents_document_type_check does not include
  'age_verification'. Migration 02 will succeed on user_consents but then error
  on the seed INSERT, leaving the age verification document unseeded.
- Risk: Migration 02 as written will partially execute: the constraint on user_consents
  is updated successfully, but the seed document insert fails. The system ends up in a
  state where age_verification is a valid consent_type on the consents table but there
  is no corresponding active legal document to reference. Any code path that fetches
  activeDocs and attempts to record age_verification consent will fail with a foreign
  key violation (legal_document_id references a non-existent row).
- Severity: HIGH
- Why it matters: This is a migration that will fail in production mid-execution. It
  creates a split state that must be manually resolved before age verification consent
  recording can work at all.
- Recommended mitigation: Add a DROP/ADD constraint step for legal_documents before the
  seed INSERT:
    ALTER TABLE platform.legal_documents
      DROP CONSTRAINT IF EXISTS legal_documents_document_type_check;
    ALTER TABLE platform.legal_documents
      ADD CONSTRAINT legal_documents_document_type_check
      CHECK (document_type IN (
        'terms_of_service', 'privacy_policy', 'marketing_email',
        'location_consent', 'age_verification'
      ));
  This should precede the seed INSERT in migration 02.
- Rationale: Both tables (legal_documents and user_consents) enforce document_type via
  CHECK constraints. Adding a new type requires updating both constraints.
- Follow-up command: /Carnage to issue migration 02 revision.
```

---

```
VENOM SECURITY FINDING
- Location: zNOTFORPRODUCTION/_ACTIVE/planning/carnage_migrations/20260510_03_accepted_at_server_default.sql
  Function: platform.enforce_server_accepted_at() trigger
- Application Scope: VCSM
- Current behavior: The trigger rejects any INSERT where accepted_at deviates from
  server time by MORE THAN 10 seconds:
    IF NEW.accepted_at IS NOT NULL AND
       abs(extract(epoch FROM (NEW.accepted_at - now()))) > 10 THEN
      RAISE EXCEPTION ...
    END IF;
    NEW.accepted_at := now();
  The condition is strictly greater than 10 (> 10), meaning a value exactly 10 seconds
  from server time passes the check and is then overwritten with now(). This is the
  intended behavior. However, the trigger then unconditionally overwrites
  NEW.accepted_at := now() even when no accepted_at was supplied (i.e., when the
  column defaults to now()). This is safe and correct — the overwrite enforces server
  time regardless.
  The boundary edge case: the check passes (no exception) for values within 10 seconds
  inclusive, then still overwrites with now(). The "10 second window" is effectively
  a dead code path that only prevents writes with grossly misaligned clocks — any
  accepted value within 10s is overwritten anyway. The window boundary is therefore
  correct in outcome but the check is slightly misleading as a "rejection" since
  values within the window are accepted then overwritten, not truly "validated" as
  legitimate timestamps.
- Risk: Low-to-none in practice — the overwrite is unconditional, so any accepted_at
  that passes the check still ends up as now(). The risk is documentation confusion:
  a future developer may assume the trigger "validates" timestamps within 10s as
  correct when in fact all accepted_at values are discarded and replaced. If the
  trigger is ever modified to remove the unconditional overwrite (line
  NEW.accepted_at := now()), the 10s window becomes meaningful and a clock-skewed
  client could write a slightly-off timestamp.
- Severity: LOW (informational)
- Why it matters: The trigger is functionally correct. The concern is that the two-
  phase logic (check + overwrite) creates a dependency where correctness relies on
  both the check AND the overwrite being present. Removing the overwrite would
  silently degrade the guarantee.
- Recommended mitigation: Add a code comment in the trigger explaining that the
  check is a defense-in-depth guard against extreme clock manipulation, and that
  the overwrite is the primary enforcement mechanism. No SQL change is required.
- Rationale: Triggers should be self-documenting when two-phase logic could be
  misread by a future maintainer as redundant.
- Follow-up command: None required — informational only.
```

---

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/legal/hooks/useLegalConsent.js (lines 25–53)
           apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx (lines 41–46)
- Application Scope: VCSM
- Current behavior: retryConsent increments retryCount via setRetryCount, which
  triggers the useEffect dependency to re-run the check() function. The previous
  effect cleanup sets cancelled = true on the old closure, preventing its state
  updates from applying. This correctly handles stale state from a previous in-flight
  request — the old request's results are discarded. There is no debounce on
  retryConsent. A user who rapidly taps "Try Again" can fire multiple concurrent
  check() invocations. Each fires resolveLegalGateForSession in parallel, all
  hitting the same Supabase endpoint simultaneously. Because cancelled is set on
  each previous invocation before the new one starts, only the LAST response will
  apply state updates.
- Risk: Multiple concurrent consent check requests to Supabase per rapid tap. This
  is a minor DoS-at-the-user-level concern, not a security bypass — the fail-closed
  behavior ensures no premature gate opening. The gate remains blocked until a
  successful check completes. However, if the TTL cache is cold and multiple requests
  hit the DB simultaneously, it can produce unnecessary load.
- Severity: LOW (informational — no security bypass possible)
- Why it matters: The fail-closed guarantee holds. The only consequence is potential
  redundant DB reads during rapid retry. Not a gate bypass risk.
- Recommended mitigation: Add a short debounce (500ms) on retryConsent or disable
  the "Try Again" button while loading is true to prevent concurrent in-flight checks.
  This is a UX and efficiency concern, not a security critical fix.
- Rationale: The cancelled flag correctly prevents stale state from applying, so
  correctness is maintained. The concern is purely operational load.
- Follow-up command: None required at this severity.
```

---

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js
  Function: recordLegalAcceptance() — Promise.all pattern (lines 105–119)
- Application Scope: VCSM
- Current behavior: Promise.all is used to parallelize consent insert operations.
  If any single document insert fails (e.g., one of three documents throws a DAL
  error), Promise.all rejects immediately and the remaining inserts may or may not
  complete depending on Supabase connection timing. Some rows may be written to the
  DB while others are not. The caller (acceptAll in useLegalConsent) catches the
  rejection and sets setError(err.message), leaving requiresConsent = true.
  invalidateConsentCache is NOT called on partial failure.
- Risk: A user could end up in a partially-consented state in the database — some
  documents accepted, others not. The gate will correctly show re-consent on next
  check (since not all active docs are consented). However, the DB now contains
  partial records that cannot be updated (immutability policy from migration 01
  prevents UPDATE). The user can retry and the missing documents will be inserted as
  new rows. This is recoverable. The risk is that duplicate acceptance rows may
  accumulate for documents that succeeded on the first attempt if the user retries
  the full set. The compliance check reads the latest row per document type, so
  duplicates do not cause incorrect compliance status — only audit noise.
- Severity: LOW (recoverable — gate correctly requires re-consent; schema allows
  multiple rows per user+document; compliance engine reads latest)
- Why it matters: Partial consent state creates audit records that show some documents
  accepted moments before others. In a legal dispute, this could complicate evidence.
  Also, if the immutability trigger were ever relaxed, duplicate rows become a
  correctness risk.
- Recommended mitigation: Consider wrapping the Promise.all in a DB-level transaction
  via a Supabase RPC or Edge Function so all inserts are atomic. As a short-term
  measure, document the partial-failure recovery behavior explicitly in the
  recordLegalAcceptance JSDoc.
- Rationale: Promise.all provides parallelism but not atomicity. Legal consent
  recording ideally should be all-or-nothing.
- Follow-up command: /Carnage to design a single-RPC atomic consent insert path.
```

---

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/app/routes/index.jsx (line 263)
           apps/VCSM/src/app/routes/lazyPublic.jsx (lazyWithLog wrapper)
- Application Scope: VCSM
- Current behavior: All lazy-loaded routes (including LegalDocumentScreen) are wrapped
  in a top-level <Suspense fallback={...}> in AppRoutes. When a lazy import fails
  (network error, chunk not found), lazyWithLog logs the error and re-throws it.
  React's Suspense does NOT catch thrown errors from lazy() — it only handles the
  Promise suspension protocol. A rejected lazy import throws an error that propagates
  up the component tree. There is no ErrorBoundary wrapping the Suspense or the
  router tree. A failed lazy import for LegalDocumentScreen (or any lazy screen)
  will crash the entire component tree with an unhandled React error, showing a
  blank screen in production.
- Risk: No gate bypass — a failed LegalDocumentScreen load cannot admit a user who
  has not consented. The ProtectedRoute gate runs before any protected lazy screens
  load. For public screens like LegalDocumentScreen, a crash means the user cannot
  read the Terms of Service document — which could constitute a UX failure for
  new signups trying to review the document before accepting. In regulated contexts,
  inability to display ToS could be a compliance concern.
- Severity: MEDIUM (no security bypass; UX/compliance concern for document
  accessibility)
- Why it matters: Users clicking "Terms of Service" or "Privacy Policy" links in
  the signup form during a bad network condition will see a blank crash screen instead
  of a helpful error message. This is also a regression risk if Vite chunk hashing
  changes during deployment.
- Recommended mitigation: Wrap the <Suspense> in AppRoutes with a React ErrorBoundary
  that renders a user-friendly "Page unavailable — try refreshing" fallback. A simple
  class-based ErrorBoundary or a library like react-error-boundary placed above the
  Suspense in index.jsx would suffice.
- Rationale: Suspense handles loading states; ErrorBoundary handles load failures.
  Both are needed for a complete lazy-loading strategy.
- Follow-up command: /Wolverine to add ErrorBoundary to AppRoutes.
```

---

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js
  Function: signUpForBarbershopInvite() (lines 33–38)
- Application Scope: VCSM
- Current behavior: When migration 02 has not yet been applied, the
  age_verification document does not exist in the database. recordSignupConsent()
  calls getActiveLegalDocuments() which fetches from the public_legal_documents_v
  view. If the age_verification document is absent, it simply will not appear in
  activeDocs. The consent recording will proceed for only the documents that do exist
  (ToS + Privacy Policy) — this is safe and correct for the pre-migration state. The
  empty-docs guard (activeDocs.length === 0) only triggers if ALL documents are absent.
  recordSignupConsent errors are swallowed via .catch(() => {}) with a comment
  explaining the self-heal path via ProtectedRoute.
- Risk: None from migration ordering. The pre-migration state is handled correctly
  because the code iterates activeDocs dynamically. However, the blanket .catch(() => {})
  in the join controller discards ALL errors including non-migration errors (e.g.,
  Supabase outage, RLS denial, constraint violations). A consent recording failure
  that is not surfaced means the ProtectedRoute gate becomes the sole recovery
  mechanism — which is correct per the comment, but means a DB error during signup
  is silently swallowed with no observability.
- Severity: LOW (design decision documented in-code; gate self-heal is correct
  fallback; concern is observability only)
- Why it matters: Silent swallowing of consent recording errors during signup means
  no alert fires if the consent table becomes consistently unwritable (e.g., after
  a grant is revoked or a constraint violation is introduced). The first signal
  would be users hitting the gate on every login.
- Recommended mitigation: Add a DEV-only console.warn inside the catch to log the
  suppressed error for local debugging, consistent with the dev-only logging pattern
  used elsewhere in the legal system. Production behavior (swallow + self-heal) is
  correct.
- Rationale: The self-heal pattern is valid but should be observable in development.
- Follow-up command: None critical.
```

---

## SUMMARY TABLE

| Fix | Status | Severity if Issue | Notes |
|-----|--------|------------------|-------|
| A — Fail-closed gate | VERIFIED | — | Correctly blocks on error |
| B — Empty docs throws | VERIFIED | — | resolveLegalGateForSession throws; hook fails closed |
| C — Synthetic age removed | VERIFIED | — | Fully removed; recordSignupConsent correctly called |
| D — accepted_at from DB | VERIFIED | — | Not in insert payload; trigger overwrites unconditionally |
| E — ip_address removed | VERIFIED | — | Not in payload; getPublicIp not imported anywhere |
| F — Dead ToS links | VERIFIED | — | /legal/terms-of-service and /legal/privacy-policy correct |
| G — Consent immutability | VERIFIED | — | RESTRICTIVE policies + trigger correctly written |
| H — Age verification consent type | FINDING | HIGH | Migration 02 fails to update legal_documents CHECK constraint; seed INSERT will error |
| I — accepted_at trigger | FINDING | LOW | Trigger is functionally correct; informational note on two-phase logic |
| J — Cache key with appId | VERIFIED | — | Composite key used correctly in get/set |
| K — LegalDocumentScreen lazy-split | VERIFIED | — | True lazy() with dynamic import |
| L — recordSignupConsent adapter | VERIFIED | — | Adapter boundary respected |
| NEW — Cache invalidation key mismatch | FINDING | MEDIUM | invalidateConsentCache(userId) does not match composite key "userId:appId" |
| NEW — Retry race condition | FINDING | LOW | No debounce on retryConsent; concurrent requests possible but fail-closed holds |
| NEW — Promise.all partial consent | FINDING | LOW | Non-atomic inserts; partial state recoverable; creates audit noise |
| NEW — No ErrorBoundary for lazy routes | FINDING | MEDIUM | Crash on lazy import failure; no user-friendly error; ToS inaccessible during outage |
| NEW — Silent consent recording in join | FINDING | LOW | .catch(() => {}) swallows all errors with no DEV observability |

---

## CRITICAL ACTIONS REQUIRED (PRE-PRODUCTION)

1. **Migration 02 must be revised** — The `legal_documents_document_type_check` constraint on `platform.legal_documents` also excludes 'age_verification'. Without updating it, the seed INSERT in migration 02 will throw a constraint violation. Add a DROP/ADD constraint block for `platform.legal_documents` before the seed INSERT.

2. **Cache invalidation key mismatch must be fixed** — `invalidateConsentCache(userId)` passes only userId to `consentCache.invalidate()`, but cache entries are keyed as `userId:appId`. The invalidation is a no-op. This must be corrected before the consent re-consent flow can reliably clear state.

3. **ErrorBoundary should be added to AppRoutes** — A failed lazy import crashes the entire app tree with no recovery UI. This is particularly impactful for legal document screens that users need to read before accepting.
