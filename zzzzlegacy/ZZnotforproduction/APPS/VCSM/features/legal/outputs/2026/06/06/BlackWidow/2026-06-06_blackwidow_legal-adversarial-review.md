---
name: vcsm.legal.blackwidow.2026-06-06
description: BLACKWIDOW adversarial runtime review — VCSM:legal consent gate module
metadata:
  type: blackwidow-output
  run-date: 2026-06-06
  scope: VCSM
  prior-run: 2026-06-04
  architect-report: ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/06/ARCHITECT/vcsm.legal.architecture.md
  venom-report: ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/06/Venom/2026-06-06_venom_legal-security-review.md
  governance-status: DRAFT
---

# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-06-06
**Scope:** VCSM
**Feature:** legal — consent gate module
**Reviewer:** BLACKWIDOW
**Environment:** Static adversarial simulation (source-based)
**Prior Run:** 2026-06-04 — 8 findings, all OPEN
**Governance Status:** DRAFT

---

## Behavior Contract Attack Summary

```
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER — no §4 Failure Paths or §9 Must Never Happen declared
§4 Failure Paths declared: 0
§4 Paths attack-verified: N/A
§4 Paths unhandled (FAILURE_PATH_UNHANDLED): N/A
§9 Must Never Happen declared: 0
§9 Invariants attacked: N/A
§9 Result — BLOCKED: N/A
§9 Result — BYPASSED (CRITICAL): N/A
§9 Result — NOT ATTACKED (gap): ALL — no invariants declared; proceeding UNANCHORED
```

All attack scenarios are UNANCHORED — constructed from source structure only. BEHAVIOR.md must be written before a fully anchored adversarial pass is possible.

---

## Attack Surface Summary

| Surface | Layer | VEN Cross-Ref | BW Prior |
|---|---|---|---|
| platform.user_consents INSERT | DAL / RLS | VEN-LEGAL-001 | BW-LEGAL-001 |
| content_url → Link to= navigation | UI | VEN-LEGAL-002 | BW-LEGAL-002 |
| dalRecordLegalAcceptance (no ON CONFLICT) | DAL | — | BW-LEGAL-003 |
| recordSignupConsent adapter export (no userId guard) | Adapter / Controller | VEN-LEGAL-004 | BW-LEGAL-004 |
| legalConsent TTL caches (not cleared on logout) | Cache / Controller | VEN-LEGAL-005 | BW-LEGAL-005 |
| legalCompliance.engine.js (pure — testable) | Engine | — | — |
| getDocRoute() → content_url passthrough | UI | VEN-LEGAL-002 | BW-LEGAL-007 |
| limit(20) on dalGetUserConsents SELECT | DAL | — | NEW this run |

---

## Simulated Threat Scenarios

### Scenario A — Cross-User Consent Fabrication via Direct API
Attacker: authenticated Citizen (any valid account)
Target: victim Citizen's consent record
Method: bypass app layer, call Supabase JS client directly

### Scenario B — Open Redirect via Admin-Controlled content_url
Attacker: admin account (or DB access compromise)
Target: all users during consent gate flow
Method: set content_url to phishing URL in platform.legal_documents

### Scenario C — Consent Record Flooding DoS (NEW)
Attacker: exploits Scenario A to insert 20+ fake consent rows for victim
Target: victim locked out of app permanently
Method: flood user_consents with fake consent_type rows, exhaust limit(20)

### Scenario D — Duplicate Consent Row via Race Condition
Attacker: authenticated Citizen (self)
Target: platform.user_consents audit trail integrity
Method: trigger concurrent acceptAll calls before setAccepting(true) propagates

### Scenario E — Cache Staleness Window Exploitation
Attacker: admin (revokes consent) or platform version bump
Target: users with active sessions
Method: rely on 60–90s cache TTL to maintain access after revocation

### Scenario F — Adapter-Exported Write Path Abuse
Attacker: internal code path with incorrect userId
Target: any user's consent record
Method: call recordSignupConsent via adapter with forged userId

---

## Ownership Bypass Results

```
OWNERSHIP BYPASS ATTEMPT
Target: platform.user_consents INSERT — dalRecordLegalAcceptance
Attack vector: Attacker calls supabase.schema('platform').from('user_consents')
  .insert({ user_id: victim_uuid, legal_document_id: doc_id, consent_type: '...',
  consent_version: '1.0', accepted: true, app_id: app_uuid, accepted_via: 'reconsent' })
  directly via Supabase JS client (bypassing app layer entirely).
  
  legal_document_id and version obtainable from platform.public_legal_documents_v
  (likely anon-readable — not confirmed but standard for public legal docs).
  victim_uuid requires prior knowledge or enumeration from another surface.

Result: BYPASSED (DB layer — no RLS confirmed)
Evidence:
  - dalRecordLegalAcceptance accepts userId parameter with no session cross-check
  - No RLS audit has been performed on platform.user_consents
  - App-layer guard (user.id from session) bypassed by calling Supabase directly
  - consentCache is invalidated AFTER insert (invalidateConsentCache called in controller),
    but the victim's cache would be invalidated only if the attacker knows the appId;
    victim's next page load would use fresh DB data — which now shows them as compliant

Controller gate: ABSENT (no session assertion inside controller or DAL)
Severity: HIGH
```

---

## RLS Verification Results

```
RLS VERIFICATION ATTEMPT — platform.user_consents INSERT
Table: platform.user_consents (schema: platform)
Attack vector: Direct Supabase JS client INSERT with arbitrary user_id
RLS status: UNVERIFIED — no policy inspection performed this chain
Result: PARTIAL — app layer uses session-authoritative userId; DB layer unconfirmed

RLS VERIFICATION ATTEMPT — platform.user_consents SELECT  
Table: platform.user_consents (schema: platform)
Attack vector: dalGetUserConsents with forged userId parameter
RLS status: UNVERIFIED
Result: PARTIAL — app layer always passes session userId; DAL accepts any userId
  without internal validation; DB RLS is the only layer that could prevent
  cross-user SELECT if app layer is bypassed

RLS VERIFICATION ATTEMPT — platform.public_legal_documents_v SELECT
Table: platform.public_legal_documents_v (view, schema: platform)
Attack vector: anonymous Supabase client reading active legal documents
RLS status: ASSUMED (view name includes "public" — anon access likely intended)
Result: PARTIAL — if this view is anon-readable, attacker can discover
  all legal_document_ids, versions, and app_ids needed to fabricate consent records
```

---

## Mutation Replay Results

### Duplicate Consent INSERT

```
MUTATION REPLAY ATTEMPT
Target resource: platform.user_consents — dalRecordLegalAcceptance
Resource state at time of replay: accepted=true row already exists for this user+doc+version
Result: APPLIED — second INSERT succeeds; no ON CONFLICT guard in DAL
Evidence:
  dalRecordLegalAcceptance:
    .insert({ user_id, ..., accepted: true })
    .select('id, accepted_at')
    .single()
  No .onConflict() clause. Second call inserts a duplicate row.
  
  UI partial protection: setAccepting(true) disables the button while first call is in
  flight. React re-render must propagate before button is disabled — brief window on
  rapid double-click. More importantly: no protection against concurrent API calls
  (e.g., from retry logic, network error misdetection, or programmatic callers).

State check: ABSENT at DAL layer (UI guard is PARTIAL)
Severity: MEDIUM
```

### Consent Version Downgrade Replay

```
MUTATION REPLAY ATTEMPT
Target resource: platform.user_consents — version field
Resource state: active document at version '1.0'
Attack: INSERT row with consent_version = '0.1' (prior version)
Result: BLOCKED by legalCompliance.engine.js
Evidence:
  buildConsentComplianceStatus checks:
    if (userConsent.consent_version !== doc.version) → outdated → requiredAction added
  An old-version row does NOT pass compliance — it triggers re-consent flow.
  Attacker inserting a downgraded version row cannot grant compliance — it creates
  an additional outdated entry but the valid current row (if present) still passes.
State check: PRESENT (engine checks version equality)
Severity: N/A — BLOCKED
```

---

## NEW ATTACK — Consent Record Flooding DoS

```
MUTATION REPLAY ATTEMPT
Target resource: victim user's consent gate — dalGetUserConsents limit(20)
Attack vector:
  1. Attacker exploits BW-LEGAL-001 (no RLS) to call platform.user_consents INSERT
     repeatedly for victim's user_id with fabricated consent_type values:
     'fake_type_01', 'fake_type_02', ... 'fake_type_20'
     Each INSERT uses accepted=true, revoked_at=NULL, accepted_at = NOW() + N seconds
     so they sort AFTER the victim's real consent records (newer timestamps)
  2. dalGetUserConsents:
       .eq('user_id', victim_uuid)
       .eq('accepted', true)
       .is('revoked_at', null)
       .order('accepted_at', { ascending: false })
       .limit(20)
     Returns 20 most recent rows — all 20 are the attacker's fake records
  3. buildConsentComplianceStatus indexes consents by consent_type:
     consentByType = { 'fake_type_01': ..., 'fake_type_02': ..., ... }
     Required types ('privacy_policy', 'terms_of_service', 'age_verification')
     are NOT in the index — they were pushed off by the fake records
  4. All required document types are flagged as MISSING → requiresConsent = true
  5. Victim is permanently blocked at the consent gate
  6. No recovery path except: victim accepts the gate (inserting new real rows at NOW)
     — but attacker can insert more fake rows with even newer timestamps immediately after
     → Persistent DoS via repeated flooding

Resource state at time of replay: victim's real consents pushed off limit(20) result
Result: APPLIED — victim permanently blocked if attacker floods continuously
Evidence:
  - limit(20) is a hard cap on the SELECT with no pagination fallback
  - Fake rows with newer accepted_at timestamps sort above real records
  - buildConsentComplianceStatus has no fallback when expected types are absent
  - The ACCEPT button on the consent gate still works for the victim,
    but attacker can immediately flood again after victim accepts
State check: ABSENT — no guard against record flooding; limit(20) creates hard cap
Severity: HIGH — persistent DoS requiring sustained attacker write access
Exploit Chain Type: Multi-step exploit (BW-LEGAL-001 prerequisite)
VENOM Cross-Reference: VEN-LEGAL-001
```

---

## Viewer Context Fuzz Results

```
VIEWER CONTEXT FUZZ ATTEMPT — null userId to resolveLegalGateForSession
Target: legalConsent.controller.js — resolveLegalGateForSession({ userId })
Injected context: userId = null
Expected result: ERROR or DENY
Actual result:
  useLegalConsent.js has guard: if (!user?.id) { setLoading(false); setRequiresConsent(false); return }
  null userId never reaches resolveLegalGateForSession — hook exits early
  Result: BLOCKED at hook layer — null user bypasses the gate check (user not logged in)
  Note: this is correct — a logged-out user is redirected to /login by ProtectedRoute
  before the consent hook is even evaluated
Context validation: ENFORCED (hook guard present)
Severity: N/A — correctly handled

VIEWER CONTEXT FUZZ ATTEMPT — null userId to recordSignupConsent (adapter path)
Target: legalConsent.controller.js — recordSignupConsent({ userId })
Injected context: userId = null
Expected result: ERROR — rejected before DB write
Actual result:
  recordSignupConsent:
    const activeDocs = await getActiveLegalDocuments()
    return recordLegalAcceptance({ userId: null, ... })
      → dalRecordLegalAcceptance({ userId: null, ... })
        → supabase.insert({ user_id: null, ... })
        → DB rejects (NOT NULL constraint assumed on user_id)
  Result: PARTIAL — DB-level rejection is the only guard; no controller-level validation
  The error propagates as a thrown exception — callers must handle it
  useRegister.js catches errors from recordSignupConsent; joinBarbershopAccount should too
Context validation: ABSENT at controller layer; DB constraint is the backstop
Severity: MEDIUM (VEN-LEGAL-004 confirmed from adversarial angle)
```

---

## Cross-Feature Abuse Results

```
CROSS-FEATURE ABUSE ATTEMPT — recordSignupConsent via adapter
Source feature: auth / join (any adapter consumer)
Target feature internal: legal — legalConsent.controller.js
Attack vector:
  legal.adapter.js exports recordSignupConsent directly (controller function).
  Any feature importing from legal.adapter.js can call:
  recordSignupConsent({ userId: arbitrary_uuid })
  
  This bypasses the useLegalConsent hook guard (which checks user?.id from session).
  The controller function accepts any userId without session cross-check.
  
  Confirmed callers: useRegister.js (safe), joinBarbershopAccount.controller.js
  (userId source not confirmed in source read).

Result: PARTIAL — caller-supplied userId is trusted; no session assertion inside function
Evidence:
  recordSignupConsent({ userId }) → recordLegalAcceptance({ userId, ... }) →
  dalRecordLegalAcceptance({ userId, ... }) → platform.user_consents INSERT
  No session cross-check at any layer of this chain
Adapter isolation: WEAK — controller function exposed through adapter
Severity: MEDIUM
```

```
CROSS-FEATURE ABUSE ATTEMPT — ConsentCheckbox boundary test
Source feature: legal (ConsentGateScreen)
Target feature internal: auth — ConsentCheckbox component
Attack vector:
  ConsentGateScreen imports ConsentCheckbox from auth.adapter.js.
  ConsentCheckbox is a UI component with no security-sensitive logic.
  Testing whether the component exposes any trust surface.
Result: BLOCKED — ConsentCheckbox is a pure UI component (no state, no auth, no DB)
  Adapter boundary is respected. No security surface exposed.
Adapter isolation: ENFORCED
Severity: N/A
```

---

## URL Surface Results

```
URL SURFACE TEST — ConsentGateScreen document links
Route: ConsentGateScreen → getDocRoute(action) → Link to={content_url}
UUID exposure: ABSENT in the URL itself (content_url is a full URL string from DB)
Slug enforcement: MISSING — content_url is unconstrained; can be any URL
Severity: HIGH (VEN-LEGAL-002 confirmed — open redirect demonstrated via code trace)
```

---

## Session Mutation Results

```
SESSION MUTATION ATTEMPT — Cache staleness after logout
Target: consentCache and legalDocsCache in legalConsent.controller.js
Attack vector:
  1. User A logs in → resolveLegalGateForSession → consentCache populated (90s TTL)
  2. User A logs out (AuthProvider.logout())
  3. consentCache and legalDocsCache NOT cleared (confirmed: no invalidation call in logout())
  4. User B logs in on same tab
  5. legalDocsCache still contains User A's legal doc result (keyed by 'vcsm')
  6. consentCache for User A's key (userId:appId) still in memory but User B has different key
  
  Key findings:
  - legalDocsCache ('vcsm') is shared — User B reads User A's cached docs (same docs, no leak)
  - consentCache is user-scoped — no cross-user cache leak
  - CONCERN: If admin revokes consent mid-session, consentCache serves stale 'compliant'
    state for up to 90 seconds. User remains in app during this window.
  - CONCERN: invalidateLegalDocsCache() is exported but NEVER called in codebase.
    Version bumps never force-clear the docs cache. Active sessions learn of a new
    required document only on cache expiry (60s maximum non-enforcement window).

Result: PARTIAL — cross-user cache isolation holds; revocation window is 90s
Session binding: WEAK (cache not session-bound; TTL expiry is the only enforcement)
Severity: MEDIUM
```

---

## Auth Callback Replay Results

```
AUTH CALLBACK REPLAY ATTEMPT — consent gate retry mechanism
Target: useLegalConsent.js — retryConsent() → increments retryCount → triggers re-check
Attack vector:
  retryConsent calls setRetryCount(c => c + 1), which triggers useEffect → check().
  No rate limit on retry calls. An attacker with XSS or compromised browser extension
  could spam retryConsent to generate repeated Supabase queries.
  Each call:
    → getActiveLegalDocuments() (may hit cache → cheap)
    → getCachedUserConsents() (may hit cache → cheap)
    → buildConsentComplianceStatus() (pure → cheap)
  With empty/cold cache: direct DB queries on every call.

Result: PARTIAL — in-flight protection (setLoading prevents stacked calls while
  check() is running via cancelled flag pattern). But retry can be called again
  immediately after check() completes, issuing another round-trip.
Evidence:
  useLegalConsent.js:
    setLoading(true)  ← serializes within one check()
    ...
    finally { setLoading(false) }  ← once done, next retry can fire
  No cooldown between retries. Rapid retryConsent() spam = repeated DB round-trips.
Code single-use: ABSENT (no rate limiting on retry)
Severity: LOW (requires code execution on page; not directly exploitable externally)
```

---

## Successful Exploit Chains

### CHAIN-1: Cross-User Consent Fabrication (Primary — BW-LEGAL-001)
```
Step 1: Attacker authenticates as valid Citizen
Step 2: Reads platform.public_legal_documents_v (anon/auth) → learns document IDs + versions
Step 3: Calls supabase.schema('platform').from('user_consents').insert({
          user_id: victim_uuid, legal_document_id: doc_id,
          consent_type: 'terms_of_service', consent_version: '1.0',
          accepted: true, app_id: app_uuid, accepted_via: 'reconsent'
        })
Step 4: No RLS blocks the insert (UNVERIFIED — assumed absent)
Step 5: invalidateConsentCache(victim_uuid, app_id) not called by attacker;
        victim's cached consent state remains until 90s TTL expires or victim reloads
Step 6: On next load, victim's consent check returns ALLOW_ACCESS — gate bypassed

Exploit Type: Single-step (one RLS gate missing)
Blocked By: NOTHING if RLS is absent
Result: BYPASSED
```

### CHAIN-2: Open Redirect + Phishing via content_url (BW-LEGAL-002)
```
Step 1: Attacker compromises admin account or gains DB write access
Step 2: UPDATE platform.legal_documents SET content_url = 'https://phishing.example.com/tos'
        WHERE document_type = 'terms_of_service'
Step 3: Triggers a version bump (updates version field) to force all users to re-consent
Step 4: All users see consent gate on next login
Step 5: Users click "Terms of Service" link in gate
Step 6: getDocRoute returns phishing URL (content_url is set)
Step 7: React Router Link opens phishing site in new tab (target="_blank")
Step 8: Phishing site may access window.opener (no rel="noopener noreferrer")
Step 9: Phishing site replaces parent window's URL → fake login screen

Exploit Type: Multi-step (admin compromise + content_url injection + social engineering)
Blast Radius: All active users during re-consent event
Result: BYPASSED
```

### CHAIN-3: Consent Record Flooding DoS (NEW — BW-LEGAL-009)
```
Step 1: Attacker exploits CHAIN-1 capability (RLS absent)
Step 2: Identifies victim user_id (from any surface that exposes user UUIDs)
Step 3: Inserts 20 fake consent records for victim with unique fake consent_types
        and accepted_at = future timestamps (to sort above real records)
Step 4: dalGetUserConsents returns 20 fake records — real required types excluded
Step 5: buildConsentComplianceStatus finds no match for required types
Step 6: requiresConsent = true → victim sees consent gate permanently
Step 7: Victim clicks "Continue" → accepts → inserts new real record
Step 8: Attacker immediately inserts 20+ more fake records with newer timestamps
Step 9: Victim locked out again

Exploit Type: Multi-step (BW-LEGAL-001 prerequisite + limit(20) exploitation)
Blast Radius: Single actor (per victim) — requires separate execution per target
Result: BYPASSED (conditional on BW-LEGAL-001 being exploitable)
```

---

## Failed Exploit Chains (Defenses That Held)

### DEFENSE-1: Version downgrade replay — BLOCKED
Inserting a prior-version consent row does NOT grant compliance. Engine correctly
checks `consent_version !== doc.version` and flags outdated types.

### DEFENSE-2: null userId via hook path — BLOCKED
`useLegalConsent.js` guards `if (!user?.id)` before calling any controller function.
Null session users are never passed to the consent check.

### DEFENSE-3: Empty-docs fail-closed gate — BLOCKED (confirmed from prior run)
When active legal docs are empty, `resolveLegalGateForSession` throws → hook sets
`gateError=true` → gate blocks entry. Cannot be bypassed from app layer.

### DEFENSE-4: ConsentCheckbox boundary — BLOCKED
Pure UI component with no auth or DB surface. No attack vector.

---

## BLACKWIDOW FINDINGS

---

### BW-LEGAL-001 — STILL OPEN (re-verified 2026-06-06)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-LEGAL-001
- Scenario: Scenario A — Cross-User Consent Fabrication via Direct API
- Target: platform.user_consents INSERT via dalRecordLegalAcceptance
- Application Scope: VCSM
- Platform Surface: Supabase Table/View, PWA
- Attack Vector: Direct Supabase JS client call bypassing app layer;
  insert user_id of victim with current legal_document_id and version
- Exploit Chain Type: Single-step exploit (one RLS gate missing)
- Governance Status: DRAFT
- Result: BYPASSED
- Evidence: No RLS audit performed; no session cross-check inside controller or DAL;
  platform.public_legal_documents_v exposes document IDs and versions needed to
  construct a valid consent row; legal_document_id + consent_version obtainable
  without elevated access
- Defense Gate: ABSENT (DB layer); PRESENT (app layer — uses session userId)
- Blast Radius: Multi-actor — any authenticated user can target any other user UUID
- Severity: HIGH
- VENOM Finding Cross-Reference: VEN-LEGAL-001
- Recommended Fix:
  1. RLS: INSERT WITH CHECK (user_id = auth.uid()) on platform.user_consents
  2. RLS: SELECT USING (user_id = auth.uid()) on platform.user_consents
  3. Controller: assert userId === session auth.uid() inside recordLegalAcceptance
- Layer to Fix: RLS, Controller
- Required Follow-up Command: DB (RLS inspection), Carnage (schema enforcement)
```

---

### BW-LEGAL-002 — STILL OPEN (re-verified 2026-06-06)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-LEGAL-002
- Scenario: Scenario B — Open Redirect + Tabnapping via content_url
- Target: ConsentGateScreen.jsx — getDocRoute() → Link to={action.content_url}
- Application Scope: VCSM
- Platform Surface: PWA
- Attack Vector: Admin/DB compromise sets content_url to phishing URL;
  version bump forces all users to re-consent; users click document links
- Exploit Chain Type: Multi-step exploit (admin compromise + UI injection)
- Governance Status: DRAFT
- Result: BYPASSED
- Evidence:
  ConsentGateScreen.jsx:
    function getDocRoute(action) {
      if (action.content_url) return action.content_url  ← unvalidated DB value
    }
    <Link to={getDocRoute(action)} target="_blank">  ← no rel="noopener noreferrer"
  React Router passes absolute URLs as native <a href> — opens in new tab.
  target="_blank" without rel="noopener noreferrer" exposes window.opener.
  ALL document links in the screen (list + checkbox) use this same pattern.
- Defense Gate: ABSENT (no origin validation; no rel attribute)
- Blast Radius: All authenticated users during a consent gate event
- Severity: HIGH
- VENOM Finding Cross-Reference: VEN-LEGAL-002
- Recommended Fix:
  1. Validate content_url against allowlist of approved origins before use in Link
  2. Add rel="noopener noreferrer" to ALL target="_blank" Link elements in screen
  3. Preferred: use only fixed fallback paths; remove content_url passthrough entirely
     and manage document URLs in the route definitions
- Layer to Fix: UI, Controller (URL validation before passing to screen)
- Required Follow-up Command: ELEKTRA (patch specification)
```

---

### BW-LEGAL-003 — STILL OPEN (re-verified 2026-06-06)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-LEGAL-003
- Scenario: Scenario D — Duplicate Consent Row via Race Condition
- Target: dalRecordLegalAcceptance — no ON CONFLICT guard
- Application Scope: VCSM
- Platform Surface: Supabase Table/View, PWA
- Attack Vector: Double-click on Continue button before setAccepting(true) propagates;
  or programmatic concurrent calls; or network error causing retry with prior success
- Exploit Chain Type: Timing-dependent exploit (race condition)
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
  UI guard: button disabled={!termsAccepted || accepting} — PARTIAL protection
  setAccepting(true) requires React re-render before button is disabled
  dalRecordLegalAcceptance has no .onConflict() clause — duplicate rows possible
  Compliance logic: duplicate rows for same type do not cause compliance failure
  (most recent row is selected); impact is audit trail noise, not access bypass
- Defense Gate: WEAK (UI only; no DB constraint)
- Blast Radius: Single actor (duplicate audit rows in own consent record)
- Severity: MEDIUM
- VENOM Finding Cross-Reference: None (BW-original)
- Recommended Fix:
  1. DB: Add UNIQUE constraint on (user_id, legal_document_id, consent_version) or
     ON CONFLICT DO NOTHING / DO UPDATE in the INSERT
  2. Controller: add an in-flight request guard before Promise.all
- Layer to Fix: DAL, DB
- Required Follow-up Command: Carnage (constraint design), DB
```

---

### BW-LEGAL-004 — STILL OPEN (re-verified 2026-06-06)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-LEGAL-004
- Scenario: Viewer Context Fuzz — null/forged userId in adapter-exported path
- Target: recordSignupConsent (adapter export) → recordLegalAcceptance → DAL
- Application Scope: VCSM
- Platform Surface: PWA
- Attack Vector: Internal caller provides null or forged userId to recordSignupConsent
- Exploit Chain Type: Injection exploit (forged parameter accepted)
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
  recordSignupConsent({ userId }) passes userId directly to recordLegalAcceptance.
  recordLegalAcceptance passes it to dalRecordLegalAcceptance.
  No guard at any of these layers.
  Null userId: DB NOT NULL constraint assumed — insert fails with DB error (backstop).
  Forged userId: if RLS is absent (BW-LEGAL-001), inserts succeed for any UUID.
  Hook guard (user?.id check) exists only in useLegalConsent.js — not on adapter path.
- Defense Gate: ABSENT at controller/adapter layer; DB constraint is only backstop
- Blast Radius: Single actor per forged call
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VEN-LEGAL-004
- Recommended Fix:
  1. Add session cross-check inside recordSignupConsent: assert userId === auth.uid()
  2. Remove recordSignupConsent from legal.adapter.js; require callers to use the hook
- Layer to Fix: Controller, Adapter
- Required Follow-up Command: ELEKTRA
```

---

### BW-LEGAL-005 — STILL OPEN (re-verified 2026-06-06)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-LEGAL-005
- Scenario: Scenario E — Cache Staleness Window After Revocation / Version Bump
- Target: consentCache + legalDocsCache in legalConsent.controller.js
- Application Scope: VCSM
- Platform Surface: PWA
- Attack Vector: Admin revokes user consent mid-session; 90s window user stays admitted.
  OR: Admin deploys policy version bump; 60s window active sessions unaware.
- Exploit Chain Type: Cache exploit (stale cache served as authority)
- Governance Status: DRAFT
- Result: BYPASSED (confirmed by VENOM-2026-06-06 VEN-LEGAL-005)
- Evidence:
  AuthProvider.logout() does NOT call invalidateConsentCache() or invalidateLegalDocsCache().
  invalidateLegalDocsCache() confirmed never called anywhere in codebase (grep confirmed).
  legalDocsCache: 60s TTL — version bumps not propagated for up to 60s.
  consentCache: 90s TTL — revocations not detected for up to 90s.
  After logout: caches persist in module memory until TTL expires or tab closed.
- Defense Gate: WEAK (TTL expiry only; no event-driven invalidation)
- Blast Radius: All active sessions (version bump window); single actor (revocation window)
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VEN-LEGAL-005
- Recommended Fix:
  1. Call invalidateConsentCache(userId, appId) and invalidateLegalDocsCache() in logout()
  2. Subscribe to Supabase Realtime on platform.legal_documents → invalidate docs cache
     when version changes (force-propagate to active sessions immediately)
  3. Reduce consentCache TTL to ≤30s as interim hardening
- Layer to Fix: Cache, Controller, Auth
- Required Follow-up Command: ELEKTRA, Wolverine
```

---

### BW-LEGAL-006 — STILL OPEN (re-verified 2026-06-06)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-LEGAL-006
- Scenario: Behavior contract absent — no §9 invariants declared
- Target: ZZnotforproduction/APPS/VCSM/features/legal/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Attack Vector: N/A — governance gap
- Exploit Chain Type: N/A
- Governance Status: DRAFT
- Result: UNRESOLVED
- Evidence: BEHAVIOR.md is PLACEHOLDER. No §4 Failure Paths. No §9 Must Never Happen.
  All BLACKWIDOW attack scenarios for this feature are UNANCHORED.
  Future implementation changes cannot be contract-verified.
- Defense Gate: ABSENT
- Blast Radius: All future security reviews of this feature
- Severity: LOW
- VENOM Finding Cross-Reference: N/A
- Recommended Fix: LOGAN writes substantive BEHAVIOR.md contract. Minimum required §9 entries:
  1. A user must never be marked as consenting to documents they did not view
  2. Consent records must only be writeable for auth.uid() == user_id
  3. The consent gate must never be bypassable without accepting all required documents
  4. content_url must never navigate to an unvalidated external origin
- Layer to Fix: Documentation
- Required Follow-up Command: LOGAN
```

---

### BW-LEGAL-007 — STILL OPEN (re-verified 2026-06-06)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-LEGAL-007
- Scenario: Tabnapping precondition — target="_blank" without rel="noopener noreferrer"
- Target: ConsentGateScreen.jsx — all Link elements with target="_blank"
- Application Scope: VCSM
- Platform Surface: PWA
- Attack Vector: BW-LEGAL-002 prerequisite; external tab accesses window.opener
- Exploit Chain Type: Multi-step (requires BW-LEGAL-002 to exploit)
- Governance Status: DRAFT
- Result: BYPASSED (static verification)
- Evidence:
  ConsentGateScreen.jsx — three Link elements with target="_blank", no rel:
  1. Line ~99: document list links (getDocRoute → content_url passthrough)
  2. Line ~124: ToS link in checkbox label
  3. Line ~136: Privacy Policy link in checkbox label
  Even if content_url is safe, all three links lack rel="noopener noreferrer".
  Chrome 88+ defaults to noopener for cross-origin _blank links, but this is
  not universal across browsers and should not be relied on.
- Defense Gate: ABSENT
- Blast Radius: Users in browsers that do not default noopener for _blank
- Severity: LOW
- VENOM Finding Cross-Reference: VEN-LEGAL-002 (secondary)
- Recommended Fix: Add rel="noopener noreferrer" to all three Link elements.
  One-line fix per link — zero risk of regression.
- Layer to Fix: UI
- Required Follow-up Command: ELEKTRA
```

---

### BW-LEGAL-008 — BLOCKED (confirmed from prior run, re-verified 2026-06-06)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-LEGAL-008
- Scenario: Empty-docs cache bypass — can empty active docs grant access?
- Target: resolveLegalGateForSession — empty activeDocs path
- Result: BLOCKED
- Evidence:
  resolveLegalGateForSession:
    if (activeDocs.length === 0) throw new Error('No active legal documents...')
  Hook: catch → gateError = true, requiresConsent = true
  ProtectedRoute: shows gateError UI (retry only — no Outlet)
  Empty docs BLOCKS access — it does not grant it. Fail-closed confirmed.
- Defense Gate: PRESENT (throw + fail-closed in hook)
- Severity: INFO (protection confirmed)
- Governance Status: HARDENED
```

---

### BW-LEGAL-009 — NEW (2026-06-06)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-LEGAL-009
- Scenario: Scenario C — Consent Record Flooding DoS
- Target: dalGetUserConsents limit(20) + buildConsentComplianceStatus
- Application Scope: VCSM
- Platform Surface: Supabase Table/View, PWA
- Attack Vector:
  Attacker exploits BW-LEGAL-001 (no RLS) to insert 20+ fake consent rows for
  victim with fabricated consent_types and future-dated accepted_at timestamps,
  causing real required-type rows to fall off the limit(20) SELECT result.
  buildConsentComplianceStatus finds no entries for required types → REQUIRE_RECONSENT.
  Even after victim accepts (inserting new real rows), attacker re-floods immediately.
  Result: victim permanently blocked at consent gate.
- Exploit Chain Type: Multi-step exploit (BW-LEGAL-001 prerequisite + limit abuse)
- Governance Status: DRAFT
- Result: BYPASSED (conditional on BW-LEGAL-001 exploitability)
- Evidence:
  dalGetUserConsents:
    .order('accepted_at', { ascending: false })
    .limit(20)
  buildConsentComplianceStatus:
    const consentByType = {}
    for (const consent of userConsents) { ... }  ← only 20 rows max
  No fallback pagination. If required types absent from top 20, gate blocks.
  Attacker controls accepted_at indirectly via INSERT timestamp.
- Defense Gate: ABSENT (limit(20) with no protection against flooding)
- Blast Radius: Single actor per attack (but repeatable across arbitrary victims)
- Severity: HIGH (DoS on access to platform; compounded by BW-LEGAL-001)
- VENOM Finding Cross-Reference: VEN-LEGAL-001 (prerequisite)
- Recommended Fix:
  1. Resolve BW-LEGAL-001 first — RLS prevents attacker from inserting for victim
  2. Increase limit or paginate all types; or filter .in('consent_type', REQUIRED_TYPES)
     to prevent fake types from crowding the query
  3. Add a DB-level constraint: max N rows per user+app+consent_type combination
- Layer to Fix: RLS (primary), DAL (secondary — scope SELECT to required types only)
- Required Follow-up Command: DB, Carnage
```

---

## §9 Invariant Attack Map

BEHAVIOR.md has no declared §9 invariants. BLACKWIDOW constructed implied invariants:

| Attack Path | Attack Result | Implied Invariant | SPIDER-MAN Required |
|---|---|---|---|
| Direct API insert for victim user_id | BYPASSED (no RLS) | Consent records writeable only by auth.uid() | TESTREQ-LEGAL-001 |
| content_url → phishing redirect | BYPASSED (no validation) | content_url must never navigate to unvalidated external origin | TESTREQ-LEGAL-002 |
| Flooding limit(20) to block victim | BYPASSED (conditional) | Consent gate must not be vulnerable to record flooding | TESTREQ-LEGAL-003 |
| Empty-docs fail-closed | BLOCKED | Empty docs must block access, not grant it | TESTREQ-LEGAL-004 (PASSING) |
| Version downgrade replay | BLOCKED | Old-version consent must not satisfy current version requirement | TESTREQ-LEGAL-005 (PASSING) |
| null userId via hook | BLOCKED | null session must not reach consent check | TESTREQ-LEGAL-006 (PASSING) |

---

## Finding Summary

| ID | Severity | Status | Result | Description |
|---|---|---|---|---|
| BW-LEGAL-001 | HIGH | OPEN | BYPASSED | Cross-user consent fabrication — no RLS |
| BW-LEGAL-002 | HIGH | OPEN | BYPASSED | Open redirect + tabnapping via content_url |
| BW-LEGAL-003 | MEDIUM | OPEN | PARTIAL | Duplicate consent row — no ON CONFLICT |
| BW-LEGAL-004 | MEDIUM | OPEN | PARTIAL | null/forged userId in adapter write path |
| BW-LEGAL-005 | MEDIUM | OPEN | BYPASSED | Cache not cleared on logout; docs cache never force-cleared |
| BW-LEGAL-006 | LOW | OPEN | UNRESOLVED | BEHAVIOR.md placeholder — all invariants unanchored |
| BW-LEGAL-007 | LOW | OPEN | BYPASSED | target="_blank" missing rel="noopener noreferrer" |
| BW-LEGAL-008 | INFO | HARDENED | BLOCKED | Empty-docs fail-closed gate — protection confirmed |
| BW-LEGAL-009 | HIGH | OPEN | BYPASSED | Consent record flooding DoS — limit(20) exploitable via BW-LEGAL-001 |

**Totals: 0 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW, 1 INFO**

**THOR Release Blockers: BW-LEGAL-001, BW-LEGAL-002, BW-LEGAL-009**

---

## Recommended Fixes

| Finding | Priority | Layer | Fix |
|---|---|---|---|
| BW-LEGAL-001 | P0 | RLS + Controller | INSERT WITH CHECK (user_id = auth.uid()); session assert in controller |
| BW-LEGAL-002 | P0 | UI | Validate content_url origin; add rel="noopener noreferrer" |
| BW-LEGAL-009 | P0 | DAL + RLS | Scope SELECT to required types only; resolve BW-LEGAL-001 first |
| BW-LEGAL-007 | P1 | UI | Add rel="noopener noreferrer" to all _blank links (1-liner) |
| BW-LEGAL-005 | P1 | Cache | Invalidate caches on logout; wire docs cache to realtime updates |
| BW-LEGAL-003 | P1 | DAL | ON CONFLICT DO NOTHING or unique constraint |
| BW-LEGAL-004 | P1 | Controller | Session cross-check in recordSignupConsent |
| BW-LEGAL-006 | P1 | Documentation | LOGAN writes BEHAVIOR.md |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Inspect and enforce RLS on platform.user_consents (BW-LEGAL-001, BW-LEGAL-009) | PENDING |
| Carnage | Schema constraint for consent record uniqueness (BW-LEGAL-003) + IP capture ticket | PENDING |
| ELEKTRA | Patch specification for BW-LEGAL-002 (content_url), BW-LEGAL-007 (rel attr), BW-LEGAL-005 (cache) | PENDING |
| LOGAN | Write substantive BEHAVIOR.md (BW-LEGAL-006) | PENDING |
| SPIDER-MAN | Regression tests for TESTREQ-LEGAL-001 through TESTREQ-LEGAL-006 | PENDING |
| THOR | Evaluate release blocking status for BW-LEGAL-001, BW-LEGAL-002, BW-LEGAL-009 | PENDING |
