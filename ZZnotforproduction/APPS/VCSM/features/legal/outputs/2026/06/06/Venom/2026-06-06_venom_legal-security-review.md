---
name: vcsm.legal.venom.2026-06-06
description: VENOM security review — VCSM:legal consent gate module
metadata:
  type: venom-output
  run-date: 2026-06-06
  scope: VCSM:legal — targeted, consent gate focus
  prior-run: 2026-06-04
  architect-report: ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/06/ARCHITECT/vcsm.legal.architecture.md
---

# VENOM SECURITY REVIEW — VCSM:legal

**Date:** 2026-06-06
**Prior Run:** 2026-06-04
**Trigger:** User-requested following ARCHITECT run on consent gate screen screenshot
**Application Scope:** VCSM
**Feature:** legal

---

## ARCHITECT GATE

```
VENOM ARCHITECT GATE PASS

Upstream Report:
- ARCHITECT: ZZnotforproduction/APPS/VCSM/features/legal/ARCHITECTURE.md
  Scope: VCSM:legal
  Date: 2026-06-06
  Status: SUCCESS
  Age: 0 days

Proceeding with VENOM analysis.
```

---

## Behavior Contract Status

```
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/legal/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER — no substantive contract written
§5 Security Rules declared: 0
§5 Rules verified in source: N/A
§5 Rules unenforced: N/A
§9 Must Never Happen declared: 0
§9 Invariants protected in source: N/A
§9 Invariants unprotected: N/A
```

BEHAVIOR.md is a PLACEHOLDER. Security posture cannot be fully anchored against declared invariants. All findings are marked UNANCHORED where applicable. See VEN-LEGAL-005.

---

## Step 1 — Review Target

```
VENOM TARGET
Feature: legal — consent gate module
Application Scope: VCSM
Reason for review: First post-ARCHITECT VENOM run; ARCHITECT flagged RLS unaudited, dead file, cache window
Primary trust boundary: Authenticated Citizen → platform.user_consents INSERT
Secondary boundary: DB-sourced content_url → browser navigation (open redirect surface)
```

---

## Step 2 — Security Surface

```
SECURITY SURFACE
Entry point: ProtectedRoute.jsx → ConsentGateScreen.jsx
Auth source: AuthProvider.jsx — Supabase session (user.id = auth.uid())
Authorization layer: useLegalConsent.js — fail-closed on error; exits early if !user?.id
Identity surface: user.id (auth.users UUID) — session-authoritative
Sensitive objects:
  - platform.user_consents (INSERT — compliance record)
  - platform.public_legal_documents_v (SELECT — read-only view)
  - content_url field (DB-controlled external URL passed to Link to=)
  - user_agent / locale (client-captured, stored in compliance record)
```

---

## Step 3 — Trust Boundary Trace

```
TRUST BOUNDARY TRACE

Chain A — Consent check
  Client (browser) → AuthProvider (session hydration) → useLegalConsent.js
    → resolveLegalGateForSession({ userId: user.id })
      → getActiveLegalDocuments() → dalGetActiveLegalDocuments()
          → platform.public_legal_documents_v [SELECT, anon/auth RLS assumed]
      → getCachedUserConsents({ userId, appId }) → dalGetUserConsents()
          → platform.user_consents [SELECT, RLS: UNVERIFIED]
      → buildConsentComplianceStatus() [pure — no DB, no side effects]
    → decision: ALLOW_ACCESS | REQUIRE_RECONSENT
  ConsentGateScreen rendered or Outlet rendered

Chain B — Consent acceptance
  Client (ConsentGateScreen) → acceptAll() → acceptRequiredConsents()
    → recordLegalAcceptance({ userId: user.id, userAppAccountId: null, ... })
      → dalRecordLegalAcceptance() → platform.user_consents [INSERT]
        RLS enforcement: UNVERIFIED — app trusts session userId; DB enforcement unknown
    → invalidateConsentCache(userId, appId) → consentCache evicted
    → next check reads fresh from DB

Chain C — Document link navigation
  ConsentGateScreen → getDocRoute(action)
    if (action.content_url) return action.content_url  ← DB-controlled value
    → Link to={content_url} target="_blank" [no rel="noopener noreferrer"]
      → Browser navigation to DB-supplied URL — UNVALIDATED
```

---

## Step 4 — Findings

---

### VEN-LEGAL-001 ← CARRY FORWARD FROM 2026-06-04 — STATUS: STILL OPEN

```
VENOM SECURITY FINDING
- Finding ID: VEN-LEGAL-001
- Location: apps/VCSM/src/features/legal/dal/userConsents.write.dal.js (dalRecordLegalAcceptance)
             apps/VCSM/src/features/legal/dal/userConsents.read.dal.js (dalGetUserConsents)
- Application Scope: VCSM
- Platform Surface: PWA, Supabase Table/View
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen → any other Citizen's consent record
- Contract Violated: Actor Ownership Contract
- Current behavior: dalRecordLegalAcceptance inserts into platform.user_consents using
  userId from the caller. App layer passes user.id from session (correct). However, the
  DAL function accepts any userId parameter — no session cross-check inside the function.
  More critically, RLS policy on platform.user_consents has never been audited. If RLS
  does not enforce INSERT WITH CHECK (user_id = auth.uid()), an attacker using the
  Supabase client API directly can write consent records for any user_id.
  Similarly dalGetUserConsents SELECT access scope is unconfirmed — without row-level
  isolation, users could read other users' consent records.
- Risk: Cross-user consent fabrication — attacker inserts consent record for victim's
  user_id, causing victim to be treated as compliant without seeing the legal documents.
  Also: attacker can potentially clear another user's consent obligation (or verify
  compliance status for arbitrary users via SELECT).
- Severity: HIGH
- Exploitability: HIGH
- Attack Preconditions:
  - Valid Supabase authenticated session (any user account)
  - Knowledge of target user's UUID (obtainable if user UUIDs are exposed elsewhere)
  - Knowledge of active legal_document_id and version strings (obtainable from
    platform.public_legal_documents_v which may be readable anonymously)
  - Direct Supabase client API call (bypasses app layer)
- Blast Radius: Multi-actor — any authenticated user could forge records for any target
- Identity Leak Type: Ownership inference
- Cache Trust Type: None (cache is invalidated after write)
- RLS Dependency: UNVERIFIED — no RLS audit has been performed on this table
- Why it matters: platform.user_consents is a legal compliance record. Cross-user
  fabrication means users could be recorded as consenting to terms they never read.
  The consent gate would pass silently for affected users on next session load.
  In a legal dispute, forged consent records create liability exposure.
- Recommended mitigation:
  1. DB: Add RLS policy: INSERT WITH CHECK (user_id = auth.uid()) on platform.user_consents
  2. DB: Add RLS policy: SELECT USING (user_id = auth.uid()) on platform.user_consents
  3. Controller: Add session cross-check inside recordLegalAcceptance — assert
     userId === currentAuthUid() before calling DAL
  4. DB: Delegate to DB command for RLS inspection and enforcement
- Rationale: The app layer alone is not sufficient for compliance-critical writes.
  Defense-in-depth requires DB-layer enforcement.
- Follow-up command: DB, Carnage
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Security and Risk Management
```

---

### VEN-LEGAL-002 ← CARRY FORWARD FROM 2026-06-04 — STATUS: STILL OPEN

```
VENOM SECURITY FINDING
- Finding ID: VEN-LEGAL-002
- Location: apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx
            getDocRoute() → Link to={action.content_url} target="_blank"
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen → External (unvalidated) navigation
- Contract Violated: None listed — this is a UX trust boundary collapse
- Current behavior: getDocRoute() returns action.content_url directly if present.
  content_url is a DB column from platform.public_legal_documents_v — written by admins.
  This value is passed directly to React Router <Link to={...}> with target="_blank"
  and no rel="noopener noreferrer". React Router passes absolute URLs as native <a href>
  tags, so an arbitrary external URL would open in a new tab.
  Additionally, target="_blank" without rel="noopener noreferrer" allows the new tab
  to access window.opener — enabling tabnapping attacks.
- Risk:
  1. Open redirect: Admin (or DB access compromise) sets content_url to a phishing URL.
     Users at the consent gate — who are actively reading "legal documents" — would be
     redirected to an attacker-controlled site. High social engineering value because
     the gate instructs them to READ the document before accepting.
  2. Tabnapping: External tab opened with window.opener access can replace the parent
     window's location, redirecting the user to a phishing login page.
- Severity: HIGH (upgrade from MEDIUM — consent gate context amplifies impact)
- Exploitability: MEDIUM
- Attack Preconditions:
  - Admin account compromise OR direct DB write access to platform.legal_documents
  - User at consent gate (first login or version bump — both common events)
- Blast Radius: All authenticated users who hit the consent gate after a version bump
  (potentially all users during a forced re-consent event)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE (this is app-layer URL handling)
- Why it matters: The consent gate is a mandatory chokepoint — every authenticated user
  must pass through it. A malicious or compromised content_url here targets the entire
  user base at the highest-trust moment (they expect to be reading legal documents).
- Recommended mitigation:
  1. Validate content_url against an allowlist of approved origins in getDocRoute()
     (e.g., only allow relative paths or known company domains).
  2. If external URLs must be supported, open them via a redirect proxy that validates origin.
  3. Add rel="noopener noreferrer" to all target="_blank" Link elements in this screen.
  4. Consider a modal inline viewer instead of external navigation for legal documents.
- Rationale: DB-sourced URLs must never be passed to navigation without validation.
  Defense: allowlist origin validation before Link to= assignment.
- Follow-up command: ELEKTRA (patch), Wolverine (implementation)
- CISSP Domain:
  - Primary: Communication and Network Security
  - Secondary: Security Architecture and Engineering, Software Development Security
```

---

### VEN-LEGAL-003 ← CARRY FORWARD FROM 2026-06-04 — STATUS: STILL OPEN

```
VENOM SECURITY FINDING
- Finding ID: VEN-LEGAL-003
- Location: apps/VCSM/src/features/legal/dal/getPublicIp.dal.js
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: System Service (client-side external HTTP)
- Boundary Violated: Security-sensitive module should not contain live external API calls
- Contract Violated: None
- Current behavior: File exports getPublicIp() which makes a live HTTP request to
  https://api.ipify.org?format=json. File comment says "NOT CALLED". Grep confirms
  zero importers in the VCSM codebase. File is retained for reference.
- Risk:
  1. Accidental re-introduction: A future developer imports getPublicIp() to implement
     the deferred IP capture task, without knowing it was intentionally removed.
     Client-side IP is user-controlled and not server-authoritative — it would be
     stored as legal evidence for consent records, undermining compliance integrity.
  2. External dependency in security module: ip.ipify.org availability affects IP
     capture reliability if ever reintroduced.
  3. Dead code confusion: The file creates noise in a security-sensitive module.
- Severity: MEDIUM (unchanged)
- Exploitability: LOW (not currently callable from app)
- Attack Preconditions: Requires developer action to re-introduce
- Blast Radius: All consent records if reintroduced
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Dead security code in compliance modules is a maintenance trap.
  The comment is the only guard against accidental reuse — that's insufficient.
- Recommended mitigation:
  1. Delete getPublicIp.dal.js entirely from the codebase.
  2. When IP capture is implemented, write it as a server-side Edge Function
     (the intended approach per controller comment).
  3. Create the Carnage ticket for the Edge Function spec before deleting this file,
     so the intention is documented in the ticketing system.
- Rationale: Remove the risk surface entirely. The file's presence creates future risk
  with no current benefit.
- Follow-up command: Wolverine (delete task), Carnage (IP capture ticket)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security and Risk Management
```

---

### VEN-LEGAL-004 ← CARRY FORWARD FROM 2026-06-04 — STATUS: STILL OPEN

```
VENOM SECURITY FINDING
- Finding ID: VEN-LEGAL-004
- Location: apps/VCSM/src/features/legal/adapters/legal.adapter.js (recordSignupConsent export)
             apps/VCSM/src/features/legal/controllers/legalConsent.controller.js (recordSignupConsent)
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Adapter contract — adapters must not export controller/DAL functions
- Contract Violated: Boundary Isolation Contract
- Current behavior: legal.adapter.js exports recordSignupConsent (a controller function
  that writes to platform.user_consents). The function accepts userId as a parameter
  from the caller, with no session cross-check inside the function. Any feature that
  imports from legal.adapter.js can call recordSignupConsent with any userId.
  Confirmed callers: useRegister.js (fresh registration — safe), joinBarbershopAccount
  controller (join flow — userId source not confirmed this run).
- Risk: An internal caller that receives a user-supplied or forged userId could write
  consent records for unintended users. As the adapter becomes more widely consumed,
  the attack surface grows.
- Severity: LOW (unchanged — internal callers only; insider threat vector)
- Exploitability: LOW
- Attack Preconditions: Requires internal code to pass incorrect userId
- Blast Radius: Single user (per-call)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED (relies on VEN-LEGAL-001 being resolved)
- Why it matters: The adapter boundary violation means this write path can be consumed
  by any feature without a security review. Compounded with VEN-LEGAL-001 (no RLS),
  this represents a consent write path with weak enforcement at every layer.
- Recommended mitigation:
  1. Remove recordSignupConsent from legal.adapter.js exports.
  2. If cross-feature access is required, create an approved RPC or Edge Function
     that reads the caller's session server-side rather than accepting userId.
  3. Until removed, add a session cross-check: assert userId === auth.uid() inside
     recordSignupConsent before the DAL write.
- Rationale: Controller functions that write compliance records must not be exposed
  as adapter exports. Resolves after VEN-LEGAL-001 (RLS) is fixed.
- Follow-up command: Wolverine, ELEKTRA
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management
```

---

### VEN-LEGAL-005 ← NEW THIS RUN

```
VENOM SECURITY FINDING
- Finding ID: VEN-LEGAL-005
- Location: apps/VCSM/src/app/providers/AuthProvider.jsx (logout / logoutAllSessions)
             apps/VCSM/src/features/legal/controllers/legalConsent.controller.js (consentCache)
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Security state must be cleared on session termination
- Contract Violated: None (gap — BEHAVIOR.md has no §9 invariants)
- Current behavior: AuthProvider.jsx logout() clears localStorage, identity storage,
  sessionStorage keys, and Supabase session. However, it does NOT call
  invalidateConsentCache() or invalidateLegalDocsCache(). The module-level TTL caches
  in legalConsent.controller.js (consentCache: 90s, legalDocsCache: 60s) survive
  across auth state changes.
  
  Impact analysis:
  - legalDocsCache is keyed by 'vcsm' (app-level) — shared across all users; safe
    across user switches since docs are not user-specific.
  - consentCache is keyed by ${userId}:${appId} — different per user; User B cannot
    inherit User A's cached consents. Safe for cross-user attacks.
  - CONCERN: Within a single user's session, if an admin revokes the user's consent
    records (sets accepted=false or adds revoked_at), the consentCache will serve the
    stale "compliant" result for up to 90 seconds. During that window, the user is
    admitted to the app despite revoked consent.
  - ADDITIONAL CONCERN: invalidateLegalDocsCache() is exported but NEVER called
    anywhere in the codebase (confirmed by grep). When admins push a document version
    bump, existing sessions will not see the new document requirement for up to 60
    seconds (docs cache) — the maximum non-enforcement window before re-consent is
    required.

- Risk: Consent revocation events (admin-triggered) are not immediately enforced —
  90-second window exists where a user with revoked consent continues to access the app.
  Policy version bumps have a 60-second non-enforcement window across all active sessions.
- Severity: MEDIUM
- Exploitability: LOW (requires admin-side action to trigger)
- Attack Preconditions: Admin revokes user's consent records OR pushes a policy version bump
- Blast Radius: Single actor (revocation) or all active sessions (version bump window)
- Identity Leak Type: None
- Cache Trust Type: Identity-sensitive (consent = access gate)
- RLS Dependency: NONE (this is an app-layer cache behavior)
- Why it matters: For a compliance gate protecting legal document consent, a 90-second
  revocation bypass window is a governance gap. In a scenario where consent must be
  revoked immediately (e.g., GDPR-required opt-out, legal hold, account suspension),
  the cache would delay enforcement.
- Recommended mitigation:
  1. Call invalidateConsentCache() and invalidateLegalDocsCache() inside logout() and
     logoutAllSessions() in AuthProvider.jsx.
  2. Subscribe to auth state changes (SIGNED_OUT event) in the controller and
     auto-invalidate caches on sign-out.
  3. Wire invalidateLegalDocsCache() to an admin-triggered mechanism (e.g., a realtime
     Supabase channel event on legal_documents version changes) so active sessions
     refresh immediately on version bumps.
  4. Reduce consentCache TTL from 90s to 30s as an interim measure.
- Rationale: Security-sensitive caches must be invalidated on logout. Policy version
  bumps must propagate immediately to active sessions, not on TTL expiry.
- Follow-up command: Wolverine, ELEKTRA
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Security Operations
```

---

### VEN-LEGAL-006 ← NEW THIS RUN

```
VENOM SECURITY FINDING
- Finding ID: VEN-LEGAL-006
- Location: apps/VCSM/src/features/legal/hooks/useLegalConsent.js:68
             apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:142
- Application Scope: VCSM
- Platform Surface: PWA, Supabase Table/View
- Trust Boundary: Authenticated Citizen
- Boundary Violated: None — design concern, not a trust crossing
- Contract Violated: None
- Current behavior: All consent records inserted via the re-consent gate (useLegalConsent
  acceptAll path) hardcode userAppAccountId = null. Similarly, recordSignupConsent
  hardcodes userAppAccountId = null. The field is stored in platform.user_consents as
  user_app_account_id.
  
  If platform.user_consents.user_app_account_id is a nullable FK with no constraint,
  this is safe. However:
  - If RLS policies or compliance reporting tools join on user_app_account_id to scope
    consent records, null values would be excluded from those queries.
  - If user_app_account_id is eventually made non-nullable (schema migration), all
    existing NULL records would need backfilling.
  - A user may have a valid user_app_account record by the time they hit the consent
    gate — the hardcoded null means the link is never established even when resolvable.

- Risk: Consent records are persistently orphaned from user_app_accounts, preventing
  accurate per-app-account compliance scoping in audit queries or reporting.
- Severity: LOW
- Exploitability: LOW (no attack vector — data quality gap)
- Attack Preconditions: N/A
- Blast Radius: All consent records
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Legal compliance records need accurate relational integrity for audit
  purposes. Orphaned null FKs in compliance tables are a data quality risk that
  compounds over time and becomes expensive to backfill.
- Recommended mitigation:
  1. Resolve whether user_app_account_id should be populated at consent time.
  2. If user_app_account is available at consent gate time, pass it through the chain
     instead of hardcoding null.
  3. Document the null intent explicitly in the DAL (add a comment explaining why null
     is acceptable if it is).
- Rationale: Compliance records must be accurate for audit and reporting. Silent null
  FKs in compliance tables create technical debt that grows with the user base.
- Follow-up command: Carnage (schema review), DB
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Security and Risk Management
```

---

### VENOM UNANCHORED FINDING — BEHAVIOR.md PLACEHOLDER

```
MISSING_BEHAVIOR_CONTRACT [legal]

BEHAVIOR.md exists but is PLACEHOLDER. All §9 invariants that should protect the
consent gate are undeclared. This means:

1. VENOM cannot verify §9 invariants against source because none are declared.
2. Future engineering changes to the consent gate have no contract anchor.
3. Re-verification after patches cannot be anchored against declared behavior.

All findings in this run are marked UNANCHORED — they are grounded in source evidence
only, not in declared behavioral invariants.

Severity: HIGH (per Area 8 contract)
Action: WOLVERINE behavior intake required before next implementation ticket.
Owner: LOGAN
```

---

## Step 5 — Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-LEGAL-001 | Cross-user consent fabrication via unverified RLS | RLS, Controller | P0 | DB | DB, Carnage |
| VEN-LEGAL-002 | Open redirect + tabnapping via DB-controlled content_url | UI | P0 | App | ELEKTRA, Wolverine |
| VEN-LEGAL-003 | Dead file with external API call in security module | Documentation | P1 | App | Wolverine, Carnage |
| VEN-LEGAL-004 | Controller write function exported from adapter | Controller | P1 | App | Wolverine, ELEKTRA |
| VEN-LEGAL-005 | Consent cache not invalidated on logout; docs cache never force-cleared | Cache, Controller | P1 | App | Wolverine, ELEKTRA |
| VEN-LEGAL-006 | userAppAccountId hardcoded null in all consent writes | DAL, Controller | P2 | App | Carnage, DB |
| BEHAVIOR.md | No security invariants declared | Documentation | P1 | Documentation | LOGAN |

---

## CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 3 | VEN-LEGAL-001, VEN-LEGAL-003, VEN-LEGAL-006 (secondary) |
| Asset Security | 1 | VEN-LEGAL-006 |
| Security Architecture and Engineering | 3 | VEN-LEGAL-001, VEN-LEGAL-002, VEN-LEGAL-005 (secondary) |
| Communication and Network Security | 1 | VEN-LEGAL-002 |
| Identity and Access Management | 3 | VEN-LEGAL-001 (primary), VEN-LEGAL-004, VEN-LEGAL-005 |
| Security Assessment and Testing | 0 | Not directly covered — SPIDER-MAN is the test coverage command |
| Security Operations | 1 | VEN-LEGAL-005 (secondary) |
| Software Development Security | 2 | VEN-LEGAL-003, VEN-LEGAL-004 |

**Uncovered domains:**
- Security Assessment and Testing — out of scope for VENOM; route to SPIDER-MAN
- Security Operations (fully) — partially covered by VEN-LEGAL-005 cache finding; no logging/audit trail findings surfaced (no logging misuse found in source)

---

## Finding Summary

| ID | Severity | Status | Description |
|---|---|---|---|
| VEN-LEGAL-001 | HIGH | STILL OPEN | RLS on platform.user_consents UNVERIFIED — cross-user consent fabrication |
| VEN-LEGAL-002 | HIGH | STILL OPEN | DB-controlled content_url passed unvalidated to Link to= — open redirect + tabnapping |
| VEN-LEGAL-003 | MEDIUM | STILL OPEN | Dead file getPublicIp.dal.js — external API call risk of accidental reintroduction |
| VEN-LEGAL-004 | LOW | STILL OPEN | recordSignupConsent exported from adapter — write path without session cross-check |
| VEN-LEGAL-005 | MEDIUM | NEW | Consent + docs cache not invalidated on logout; legalDocsCache never explicitly cleared |
| VEN-LEGAL-006 | LOW | NEW | userAppAccountId hardcoded null in all consent writes — compliance record orphaning |

**Totals: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 2 LOW**

**THOR Release Blocker: YES — VEN-LEGAL-001, VEN-LEGAL-002**

---

## VENOM Recommendation

CAUTION — module is MOSTLY COMPLETE architecturally but has two THOR-blocking security issues.
Neither VEN-LEGAL-001 nor VEN-LEGAL-002 has been patched since 2026-06-04.

Next commands: DB (for RLS audit on platform.user_consents), ELEKTRA (for patch advisory on VEN-LEGAL-002 content_url validation and VEN-LEGAL-005 cache invalidation), LOGAN (for BEHAVIOR.md).
