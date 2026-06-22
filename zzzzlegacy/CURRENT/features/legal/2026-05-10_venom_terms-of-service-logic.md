# VENOM Security Audit — Terms of Service Acceptance & Enforcement Logic
**Date:** 2026-05-10
**Scope:** `apps/VCSM/src/features/legal/` + enforcement surface
**Auditor:** VENOM (read-only — no files modified)
**Input:** ARCHITECT report `2026-05-10_architect_terms-of-service-logic.md`

---

## Audit Summary

9 security findings across CRITICAL / HIGH / MEDIUM / LOW tiers. The highest-risk issues are the gate fail-open behavior on any DB/network error, the synthetic adult birthdate that writes `isAdult: true` to the DB without real verification, and the complete absence of RLS UPDATE/DELETE policies on `platform.user_consents`, which means any authenticated user can silently delete or modify their own consent rows at the database layer after the application has accepted them.

---

## Findings

---

### FINDING 1

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/legal/hooks/useLegalConsent.js (lines 39–44)
- Application Scope: VCSM
- Current behavior: When resolveLegalGateForSession() throws for any reason (DB
  error, network timeout, Supabase RLS rejection, or unhandled exception), the
  catch block sets requiresConsent = false and allows the app to proceed. The
  gate fails open. The user is admitted to all protected routes with no consent
  record checked.
- Risk: Any transient or persistent failure in the consent DB read path
  (Supabase outage, platform schema misconfiguration, RLS policy error, cold
  cache miss timeout) fully bypasses the ToS gate. An attacker who can trigger
  a Supabase error on the consent query path — even briefly — can enter the
  platform without a valid consent record for the current document version.
- Severity: CRITICAL
- Why it matters: The entire consent enforcement system has a single silent
  fallback that admits users. There is no circuit breaker, no "fail safe"
  mode, and no alerting on gate failures. The UI shows nothing to the user
  and no log is emitted to any monitoring surface. An exploitable DB error
  or an RLS misconfiguration on platform.user_consents becomes a full consent
  bypass.
- Recommended mitigation: On any unhandled error in resolveLegalGateForSession,
  default to requiresConsent = true (fail closed). Surface a recoverable error
  state in the gate UI: "We couldn't verify your consent status — please try
  again." Allow retry. Only admit the user after a successful compliance check.
  Log the failure to a server-side observability channel, not just console.error.
- Rationale: Legal consent gates must fail closed, not open. The risk of a
  user being blocked for 30 seconds due to a transient DB error is vastly lower
  than the legal and reputational risk of all users bypassing the ToS gate
  silently on any infrastructure blip.
- Follow-up command: /Carnage — add explicit error state to useLegalConsent
  that blocks the gate on error with a retry affordance.
```

---

### FINDING 2

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js
  (lines 7–11, 77–84)
- Application Scope: VCSM
- Current behavior: The join barbershop flow calls syntheticAdultBirthdate()
  to compute a birthdate exactly 18 years before today, then passes it to
  upsertCompletedOnboardingProfileDAL() with isAdult: true hard-coded. This
  writes a fake but plausible birthdate and is_adult = true directly to the
  vc.profiles (or equivalent) table in the DB without any real age
  verification. The ageConfirmed checkbox in JoinSignupForm.jsx is client-only
  validation; its value is discarded before the controller call (line 34 of
  JoinSignupForm.jsx explicitly excludes ageConfirmed from the onSubmit
  payload). There is no DB consent record for age attestation regardless.
- Risk: The system writes DB-level "is_adult = true" for every barbershop
  invite signup, regardless of the user's actual age. A 14-year-old who
  receives a barbershop invite link (which is public and non-expiring until
  used) can sign up and get an adult-flagged profile written to the database
  with a synthetically computed birthdate. This bypasses any downstream
  is_adult or birthdate-based access checks the platform applies.
- Severity: CRITICAL
- Why it matters: Writing fabricated adult attestation data to the database
  as part of the signup bootstrap — rather than from the user's actual
  attestation — creates a legal and regulatory exposure under COPPA, GDPR
  age gating, and platform ToS. If any feature gates on is_adult or checks
  birthdate, every barbershop join user has those gates pre-cleared with
  synthetic data. This is not a client-side validation bypass — it is an
  active server write of false age data for every user on this path.
- Recommended mitigation: Remove syntheticAdultBirthdate() entirely. If the
  barbershop join flow needs an onboarded profile, do not write age/birthdate
  fields during bootstrap. Allow the user's actual onboarding step to collect
  birthdate. If age gating is required at invite acceptance time, surface a
  real age verification step before account creation, and only write is_adult
  after the user attests. Never compute or insert a synthetic birthdate.
- Rationale: Fabricated database fields representing legal attestations are
  worse than missing fields — they actively misrepresent the user's status.
- Follow-up command: /Carnage — migrate profiles table to add constraint
  preventing is_adult write without a corresponding consent record; /Wolverine
  — redesign join flow onboarding to collect actual birthdate.
```

---

### FINDING 3

```
VENOM SECURITY FINDING
- Location: zNOTFORPRODUCTION/_HISTORY/db/snapshots/schema_20260502b.sql
  (lines 35167–35180); platform.user_consents RLS policies
- Application Scope: VCSM
- Current behavior: The platform.user_consents table has RLS enabled with two
  policies:
    user_consents_select_own: FOR SELECT USING (user_id = auth.uid())
    user_consents_insert_own: FOR INSERT WITH CHECK (user_id = auth.uid())
  There are NO UPDATE or DELETE policies. With RLS enabled and no permissive
  policy for UPDATE or DELETE, those operations are denied by default in
  Postgres — however, this creates an implicit behavior rather than an
  explicit "deny all" policy. More critically: there is no GRANT INSERT on
  platform.user_consents visible in tracked migrations beyond the view grant in
  20260503052543 (which only grants SELECT on the view, not INSERT on the
  table). The absence of a tracked INSERT GRANT on the base table means
  consent writes rely on untracked manual grants, which will be lost on a
  fresh deployment — silently breaking the consent recording path at runtime
  with no visible error to the user.
- Risk: (a) On a fresh deployment, consent inserts fail at the DB level
  because the INSERT grant on platform.user_consents may not exist. The
  application will throw, hit the error handler in useLegalConsent, and fail
  open (see Finding 1). (b) The lack of explicit DELETE and UPDATE deny
  policies means that if a super-user or admin grants a broader privilege
  (e.g., via a future migration error), users could delete their own consent
  rows or modify accepted_at timestamps, destroying the audit trail. There is
  no immutability guarantee on consent rows at the DB layer.
- Severity: HIGH
- Why it matters: Legal consent records must be immutable append-only. The
  absence of explicit deny policies for UPDATE and DELETE, and the reliance on
  untracked manual grants for INSERT, are both structural gaps in the consent
  integrity model.
- Recommended mitigation: Add a tracked migration that: (1) issues
  GRANT INSERT ON platform.user_consents TO authenticated; (2) adds explicit
  DENY (no-policy) or a WITH CHECK (FALSE) policy for UPDATE and DELETE to
  make the immutability constraint explicit and auditable; (3) optionally adds
  a DB trigger that prevents any UPDATE to accepted_at, user_id, or
  legal_document_id after insert.
- Rationale: Consent records are legal artifacts. Their immutability must be
  enforced at the database layer, not assumed from application behavior.
- Follow-up command: /Carnage — write migration to add INSERT grant and
  explicit immutability enforcement on platform.user_consents.
```

---

### FINDING 4

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/legal/dal/getPublicIp.dal.js (all lines);
  apps/VCSM/src/features/legal/controllers/legalConsent.controller.js
  (lines 111–113)
- Application Scope: VCSM
- Current behavior: The IP address recorded in the consent row is fetched
  client-side via a GET request to api.ipify.org from the user's browser.
  locale is taken from navigator.language and user_agent from
  navigator.userAgent. All three metadata fields are client-supplied and
  client-controlled.
- Risk: A user can manipulate all three values before consent is recorded:
  (a) IP: The fetch to api.ipify.org returns the IP the user's browser
  presents — a VPN, Tor exit node, or proxy trivially spoofs jurisdiction.
  More critically, the IP can be substituted client-side by intercepting
  the fetch (via service worker, proxy, or browser extension), returning
  any IP string, which gets stored verbatim in platform.user_consents.
  (b) user_agent and locale are read from navigator properties, which are
  freely settable in any programmatic browser context (Playwright, Puppeteer,
  fetch with custom headers, or DevTools override).
  These fields are stored as-is with no server-side validation. A consent row
  could contain ip_address = '192.168.1.1', user_agent = 'LegalBot/1.0',
  locale = 'zz-ZZ' — none of which reflect reality.
- Severity: HIGH
- Why it matters: In a legal dispute, IP address is the primary evidence of
  the user's jurisdiction and identity at the time of consent. If IP is
  client-supplied, it has no evidentiary value and may actively mislead. The
  ip_address column type is inet (PostgreSQL network type) which validates
  format but not authenticity — any valid IP string passes. For GDPR/CCPA
  compliance purposes, recording a user-supplied IP as if it were server-
  verified creates false assurance.
- Recommended mitigation: IP address must be captured server-side, not from
  the client. Options: (1) Use a Supabase Edge Function as the consent write
  endpoint — it receives the real request IP from the runtime context. (2) Use
  a PostgreSQL function that reads the IP from the connection context. Client-
  supplied locale and user_agent are lower-risk but should be validated against
  allowlists or stripped entirely. Mark ip_address in the schema as
  "server-resolved" and block client inserts from populating it directly.
- Rationale: Metadata that forms part of a legal consent record must be
  server-authoritative. Client-supplied metadata creates audit trail fraud
  risk.
- Follow-up command: /Carnage — design Edge Function consent write path that
  captures IP server-side.
```

---

### FINDING 5

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/legal/dal/userConsents.write.dal.js (line 41)
- Application Scope: VCSM
- Current behavior: accepted_at is set to new Date().toISOString() before the
  DB insert call. The value is therefore the client's local clock at the moment
  the insert is prepared — not the DB server time. The DB column has
  DEFAULT now(), but because the insert explicitly sets accepted_at, the
  DEFAULT is never used.
- Risk: A user can manipulate their system clock to set accepted_at to any
  past or future date before triggering consent. A consent row could be
  inserted with accepted_at = '2020-01-01T00:00:00Z', making it appear the
  user accepted terms before those terms were published. If the version
  compliance check ever uses accepted_at for temporal ordering (the
  legalCompliance.engine.js does use it to select the "latest" consent row
  per type), a backdated row with the current version could theoretically
  displace a newer valid row in the sort order — though the per-type dedup
  limits practical exploitability here. The primary concern is audit trail
  integrity: the recorded timestamp does not reflect server-authoritative time.
- Severity: MEDIUM
- Why it matters: Consent timestamps are legal evidence. A client-controlled
  timestamp can be manipulated to predate a policy publication date, which
  undermines the chronological validity of the consent record.
- Recommended mitigation: Remove accepted_at from the client insert payload
  entirely. Let the DB DEFAULT now() apply. If the column needs to be returned,
  use RETURNING accepted_at in the insert query. This ensures all accepted_at
  values are DB server time, which is authoritative and monotonic.
- Rationale: Server time is tamper-proof; client time is not.
- Follow-up command: /Carnage — migrate userConsents.write.dal.js to omit
  accepted_at from insert payload and rely on DB DEFAULT.
```

---

### FINDING 6

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/join/screens/components/JoinSignupForm.jsx
  (lines 53–57); apps/VCSM/src/features/join/controllers/
  joinBarbershopAccount.controller.js (entire file)
- Application Scope: VCSM
- Current behavior: The barbershop join path (/join/barbershop/:token) is
  registered as a public route. JoinBarbershopScreen is never imported or
  registered in apps/VCSM/src/app/routes/index.jsx or any route file. The
  route /join/barbershop/:token does not exist in the router tree. Any user
  navigating to this path will hit the wildcard catch-all:
    { path: "*", element: <Navigate to="/login" replace /> }
  Separately, the JoinSignupForm renders links to /terms and /privacy — bare
  paths with no route registration — which are 404s (React Router wildcard
  redirects to /login). A user who created an account via a barbershop invite
  link and receives a Supabase email confirmation redirect back to
  /join/barbershop/:token will land on /login instead, with no explanation.
- Risk: (a) The join flow is entirely dead as a route — no user can complete
  barbershop signup via the invite path at all. This means no consent gap from
  this path currently fires, but the invite infrastructure (joinInvite.dal,
  joinBarbershopAccount.controller) exists and can be activated by adding the
  route. When activated, no consent will be recorded (ARCHITECT Finding 1).
  (b) The /terms and /privacy links are dead regardless of the join route
  status — users who discover the JoinSignupForm cannot read the documents
  they are being asked to accept.
- Severity: HIGH (consent gap materializes the moment the route is wired)
- Why it matters: The barbershop join path is infrastructure-complete but
  route-dead. The moment a developer wires the route, a full signup path
  activates with no consent recording, synthetic age data, and dead ToS links.
  This is a latent HIGH risk that becomes CRITICAL on any future route
  registration.
- Recommended mitigation: Before wiring the /join/barbershop/:token route:
  (1) Call recordSignupConsent from signUpForBarbershopInvite with the new
  user's ID after account creation. (2) Replace /terms and /privacy links with
  /legal/terms-of-service and /legal/privacy-policy. (3) Remove
  syntheticAdultBirthdate() and require real age attestation. All three must
  be resolved before the route goes live.
- Rationale: Dead routes are not safe routes — they are armed routes. Any
  future wiring activates all three gaps simultaneously.
- Follow-up command: /Wolverine — gate join route activation on consent
  recording fix, dead link fix, and age verification fix.
```

---

### FINDING 7

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx (line 105);
  apps/VCSM/src/features/auth/components/RegisterFormCard.jsx
- Application Scope: VCSM
- Current behavior: The age attestation "I confirm I am at least 18 years old"
  is bundled into the ToS/Privacy Policy consent checkbox. There is no separate
  consent_type = 'age_verification' in platform.user_consents. The DB CHECK
  constraint only permits consent_type values: 'privacy_policy',
  'terms_of_service', 'marketing_email', 'location_consent'. No age
  attestation record can exist. Any user who checks the box has their ToS and
  Privacy Policy consent recorded, but there is zero DB evidence that they
  attested to being 18+. A user who lies about their age has no separate
  DB record to revoke, audit, or flag.
- Risk: If a regulatory or legal inquiry requires evidence that a specific
  user attested to being 18+ at a specific time, no such record exists. The
  platform cannot distinguish between a user who accepted ToS at 18+ and a
  minor who accepted the same checkbox. Any feature gated on adult status
  relies entirely on the UI checkbox with no DB audit trail. A minor who
  lies at signup gains full platform access with no separate age gate
  anywhere in the ProtectedRoute stack.
- Severity: HIGH
- Why it matters: COPPA (US), GDPR Article 8 (EU), and analogous laws in
  most jurisdictions require verifiable records of age consent for platforms
  accessible by minors. Bundling age attestation into the ToS checkbox
  provides no independent proof of the attestation event. The DB record
  proves ToS acceptance, not age attestation.
- Recommended mitigation: Add consent_type = 'age_verification' to the DB
  CHECK constraint. Record a separate consent row for age attestation at
  signup, distinct from ToS and Privacy Policy rows. Keep the checkbox UX
  unified if desired, but write three rows: terms_of_service,
  privacy_policy, and age_verification — each with their own
  legal_document_id pointing to an age gate document. This creates an
  independent, revocable, auditable age attestation record.
- Rationale: Legal attestations must be individually auditable. Bundling
  them makes each one non-independently revocable and non-provable.
- Follow-up command: /Carnage — add age_verification consent_type to schema
  and update consent recording path.
```

---

### FINDING 8

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js
  (lines 174–193); apps/VCSM/src/features/legal/engine/legalCompliance.engine.js
  (lines 18–77)
- Application Scope: VCSM
- Current behavior: resolveLegalGateForSession() fetches active documents from
  the 5-minute TTL cache. If activeDocs.length === 0 (either because the
  cache returned an empty array from a previous real-empty DB read, or because
  the DB has no active documents), the function immediately returns
  { decision: 'ALLOW_ACCESS', requiredActions: [] } with no consent check.
  The compliance engine (buildConsentComplianceStatus) also returns
  isCompliant: true when activeDocs is empty. There is no distinction between
  "no documents configured yet" and "documents exist but were not fetched."
- Risk: If platform.public_legal_documents_v returns zero rows (due to all
  documents being set is_active = false, a deployment error, or a DB migration
  that deactivates documents), every authenticated user is granted full
  platform access with no consent check whatsoever. The 5-minute cache means
  that once a "no documents" result is cached, all users who hit the cache
  within that window bypass the gate with no consent check. An attacker with
  the ability to deactivate legal documents (e.g., via a compromised admin
  account) could silently disable the consent gate for all users for up to
  5 minutes at a time.
- Severity: MEDIUM
- Why it matters: The consent gate should never grant access when it cannot
  verify compliance. "No documents found" should be treated as an
  indeterminate state, not a compliant state. The current design means the
  platform can be in a fully open-gate state without any application error
  or alert.
- Recommended mitigation: Add a minimum-documents assertion in
  resolveLegalGateForSession: if activeDocs.length === 0, fail closed (return
  REQUIRE_RECONSENT with an error state). Alternatively, cache the "no
  documents" result separately and treat it as an error condition with a short
  TTL (e.g., 10 seconds) to prevent open-gate caching. Surface a visible
  "service unavailable" state to the user rather than silently admitting them.
- Rationale: Empty document lists are more likely to indicate a configuration
  error than a deliberately document-free platform. Granting access on
  configuration error is fail-open behavior.
- Follow-up command: /Wolverine — add empty-docs guard to
  resolveLegalGateForSession.
```

---

### FINDING 9

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/legal/controllers/legalConsent.controller.js
  (lines 43–53); shared/lib/ttlCache.js
- Application Scope: VCSM
- Current behavior: The consent cache uses userId as the cache key with a
  90-second TTL. The cache is a module-level singleton (in-memory, per JS
  bundle execution context). It is invalidated via invalidateConsentCache(userId)
  after a consent write. However, the cache is keyed only by userId — not by
  userId + appId. The getCachedUserConsents call passes both userId and appId
  to the DAL, but the cache key discards appId. If the platform ever has
  multiple app IDs returning different consent sets for the same user, the
  cache will serve the first app's consent result for all subsequent app IDs
  within the 90-second window.
  Additionally: the 90-second TTL means that if a user accepts consent in one
  browser tab and opens a new tab within 90 seconds, the new tab's
  ProtectedRoute will serve a cached REQUIRE_RECONSENT result (stale pre-
  acceptance state) because the cache was invalidated in the first tab's
  module context but the second tab has its own module context with an
  independent cache. This is a cross-tab consistency issue rather than a
  security bypass, but it can result in the user being re-blocked for up to
  90 seconds after a legitimate consent acceptance.
- Risk: (a) Cache key collision across app IDs: low current risk (single app
  deployment), but a latent bug if multi-app support is added. (b) Cross-tab
  stale cache: a user who accepts consent is shown the consent gate again
  in a new tab for up to 90 seconds. The gate itself is benign (they can
  accept again), but re-accepting records a duplicate consent row. Over time
  this creates duplicate consent rows in the DB that may complicate audit
  queries. (c) More critically: the module-singleton cache means that in a
  server-side rendering or edge-function context, the cache would be shared
  across all users — though this is not a risk in the current Vite/SPA
  deployment model.
- Severity: LOW
- Why it matters: Cache key design should be reviewed before multi-app support
  is added. The cross-tab duplicate consent row issue is a data quality concern
  that can complicate legal audit trails.
- Recommended mitigation: Change the consent cache key to include appId:
  `${userId}:${appId}`. For cross-tab consistency, consider using
  BroadcastChannel or localStorage-based cache invalidation so that a consent
  acceptance in one tab propagates to others within the same browser session.
- Rationale: Cache key correctness is a precondition for cache correctness.
  Data quality in consent records is a legal concern.
- Follow-up command: /Wolverine — fix cache key to include appId.
```

---

## Summary Table

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| 1 | Gate fails open on any resolveLegalGateForSession error | CRITICAL | `useLegalConsent.js` lines 39–44 |
| 2 | syntheticAdultBirthdate writes fake is_adult = true to DB for every barbershop invite user | CRITICAL | `joinBarbershopAccount.controller.js` lines 7–84 |
| 3 | No tracked INSERT GRANT on platform.user_consents; no explicit immutability (UPDATE/DELETE) enforcement at DB layer | HIGH | Schema: `platform.user_consents` RLS policies |
| 4 | IP address, locale, and user_agent are all client-supplied — no server-side capture | HIGH | `getPublicIp.dal.js`, `legalConsent.controller.js` lines 111–113 |
| 5 | accepted_at set from client clock — client-manipulable timestamp in legal record | MEDIUM | `userConsents.write.dal.js` line 41 |
| 6 | Join barbershop route is unregistered (currently dead) but activates consent gap, synthetic age, and dead ToS links the moment it is wired | HIGH (latent) | `routes/index.jsx`, `JoinSignupForm.jsx`, `joinBarbershopAccount.controller.js` |
| 7 | Age attestation bundled into ToS checkbox with no independent DB record | HIGH | `ConsentGateScreen.jsx` line 105, `RegisterFormCard.jsx` |
| 8 | Empty active documents returns ALLOW_ACCESS — open gate on config error or document deactivation | MEDIUM | `legalConsent.controller.js` lines 174–178 |
| 9 | Consent cache keyed only by userId (not userId+appId); cross-tab invalidation not propagated | LOW | `legalConsent.controller.js` lines 43–53 |

---

## Answers to Specific Audit Questions

### 1. Consent bypass vectors

**Can an authenticated user skip the ProtectedRoute gate?**
No — all authenticated routes pass through `ProtectedRoute` as the parent element. There are no authenticated routes outside it in `routes/index.jsx`. The wildcard catch-all redirects to `/login`.

**Can the 90s TTL cache be exploited to access gated content after declining?**
No direct exploit, but edge case: if a user declines (closes the tab without clicking Continue), the cached result is `REQUIRE_RECONSENT`. If they reopen within 90s, the cache returns the same blocked state — that is safe behavior. The reverse is more relevant: a user who was compliant 90 seconds ago and a version bump lands in that window will continue to be served `ALLOW_ACCESS` from the cache for up to 90 seconds. This is acceptable given that version bumps are rare admin events.

**What happens if resolveLegalGateForSession throws?**
Gate fails open (CRITICAL — Finding 1). `requiresConsent` is set to `false` and `<Outlet />` renders.

### 2. Consent write integrity

**Does dalRecordLegalAcceptance verify the caller is the session user?**
Only via RLS: `user_consents_insert_own` enforces `user_id = auth.uid()`. The application-layer `userId` parameter passed to the DAL is not independently validated before the DB call — it relies entirely on RLS. If `userId` is passed as a different user's ID, the insert is blocked at the DB level by RLS. This is the correct pattern, but it relies on the RLS policy being present and correctly applied.

**Can an authenticated user write a consent row for a different userId?**
No — the `user_consents_insert_own` RLS policy enforces `user_id = auth.uid()`. Any insert where `userId !== auth.uid()` is rejected by Postgres.

**Is `accepted_at` client-supplied?**
Yes — client clock (MEDIUM — Finding 5). The DB has `DEFAULT now()` but the insert overrides it.

**Is IP address trusted from the client?**
Yes — fetched from `api.ipify.org` in the browser (HIGH — Finding 4). Spoofable.

**Is `user_agent` trusted from the client?**
Yes — `navigator.userAgent` (HIGH — Finding 4). Spoofable.

### 3. Barbershop join path gap

The route `/join/barbershop/:token` is **not registered in the router** — `JoinBarbershopScreen` is defined and has controller/hook/DAL support but is never imported into any route file. The wildcard redirects to `/login`. The consent gap is therefore currently inert, but is a latent HIGH severity (Finding 6) that activates fully when the route is wired.

### 4. Age verification gap

The "I am 18+" attestation has no independent DB record (HIGH — Finding 7). All platform features accessible after ProtectedRoute passes — including social feed, messaging, learning, service booking, Vport management — are accessible to minors who lie at signup. There is no secondary age gate at the feature level. The join path additionally writes a synthetic `is_adult = true` flag directly to the profile table (CRITICAL — Finding 2).

### 5. Version enforcement

A user cannot pin to an old version. The compliance engine uses `userConsent.consent_version !== doc.version` to trigger re-consent. Version is served from the DB (5-minute cache), not hardcoded. The client has no mechanism to influence which document version is compared against — it reads whatever `platform.public_legal_documents_v` returns. The only version-bypass risk is the 5-minute legal docs cache: if a version is bumped, users cached with the old version value get an extra ~5 minutes before the new check fires. Acceptable.

### 6. Consent data exposure

RLS policies are `user_consents_select_own` (`USING user_id = auth.uid()`) and `user_consents_insert_own` (`WITH CHECK user_id = auth.uid()`). A user can read only their own consent rows. They cannot read other users' IP addresses, user agents, or consent history. `platform.current_user_consents` view has `GRANT SELECT TO authenticated` — the view's own query filters by `user_id`, but PostgREST will pass the caller's filter context through the underlying RLS. This is safe for self-reads.

### 7. Dead route links

`/terms` and `/privacy` in `JoinSignupForm.jsx` hit the `*` wildcard and redirect to `/login`. These 404s do not reveal internal routing information — React Router's wildcard is a clean redirect with no routing metadata exposed. The only risk is UX: a user trying to read the ToS before accepting it in the join form lands on a login screen with no explanation. This is a compliance UX failure, not a security exposure.

### 8. `accepted_via` audit trail integrity

`accepted_via = 'reconsent'` for both the barbershop join path (after self-heal at ProtectedRoute) and the email-confirm deferred path is a data quality issue only. No authorization logic in the codebase branches on `accepted_via` — it is used solely for audit/analytics. The branching risk is future: if a future feature grants different access levels based on `accepted_via`, the mislabeled rows would cause authorization anomalies. No current exploitability.
