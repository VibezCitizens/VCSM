# ELEKTRA Security Report

**Date:** 2026-06-06
**Scope:** VCSM — features/legal — consent gate module
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — full chain (ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA)
**Findings Summary:** 3 HIGH | 2 MEDIUM | 2 LOW | 0 INFO
**False Positives Rejected:** 3
**Suggested Patches:** 7
**THOR Blockers:** ELEK-2026-06-06-001, ELEK-2026-06-06-002, ELEK-2026-06-06-003

---

## PREFLIGHT

```
ELEKTRA PREFLIGHT PASS

Upstream Reports:
- ARCHITECT: ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/06/ARCHITECT/vcsm.legal.architecture.md
- VENOM:     ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/06/Venom/2026-06-06_venom_legal-security-review.md
- BLACKWIDOW: ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/06/BlackWidow/2026-06-06_blackwidow_legal-adversarial-review.md

All three reports: Status COMPLETE, Date 2026-06-06, Scope legal/consent-gate. Freshness: PASS.
```

---

## SCAN TARGET

```
ELEKTRA SCAN TARGET
Feature:          legal — consent gate module
Application Scope: VCSM
Reason for scan:  Full chain run post-BLACKWIDOW; precision verification + patch advisory
Scan trigger:     MANUAL
Scan areas loaded: 01-actor-ownership-idor, 02-controller-input-trust, 03-supabase-rls,
                   06-auth-session, 07-url-redirect
```

---

## ENTRY POINT MAP

```
ENTRY POINT MAP

Route / API / Controller: ConsentGateScreen overlay (rendered by ProtectedRoute.jsx)
Input sources (user-controlled):
  - termsAccepted: useState (UI-only, no security impact)
  - onAccept() → acceptAll() → acceptRequiredConsents({ userId: user.id, ... })
  - No query params, URL params, or direct user string input on write paths

Trusted input boundary:
  - user.id derives from Supabase auth session via useAuth() — SESSION_DERIVED ✓
  - requiredActions derives from resolveLegalGateForSession() → DB view read → engine ✓
  - action.content_url derives from platform.public_legal_documents_v → DB-controlled ← RISK

Validation present at boundary:
  - content_url origin: ABSENT — DB value passed directly to Link.to=
  - userId at controller layer: ABSENT — no session cross-check before INSERT
  - consentType at write DAL: ABSENT — no enum validation before INSERT
```

---

## DATA FLOW TRACES

### Trace A — consent INSERT path (cross-user risk)

```
Source:     userId parameter in recordLegalAcceptance({ userId, ... })
            → apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:94

Validation at boundary:
            Hook layer (useLegalConsent.js:66): passes user.id from session ✓
            Adapter-exported recordSignupConsent (legalConsent.controller.js:131): accepts { userId }
            from caller with NO session cross-check ✗

Intermediate transforms:
            recordLegalAcceptance() → dalRecordLegalAcceptance({ userId, ... })

Sink:       platform.user_consents INSERT
            apps/VCSM/src/features/legal/dal/userConsents.write.dal.js:30-44
            .insert({ user_id: userId, ... })

Defense at sink: ABSENT — no RLS INSERT WITH CHECK confirmed; userId flows unvalidated from
                 adapter-exported path
```

### Trace B — content_url open redirect path

```
Source:     action.content_url from platform.public_legal_documents_v (DB-controlled)
            requiredActions prop → ConsentGateScreen

Validation at boundary:
            getDocRoute(action) at ConsentGateScreen.jsx:55-61
            Line 56: if (action.content_url) return action.content_url
            NO origin validation — DB value returned verbatim ✗

Intermediate transforms: None

Sink A:     <Link to={getDocRoute(action)} target="_blank"> line 98 — requiredActions map
Sink B:     <Link to={getDocRoute(tosAction)} target="_blank"> line 125 — ToS inline link
Sink C:     <Link to={getDocRoute(ppAction)} target="_blank"> line 135 — PP inline link

Defense at sink: ABSENT — no rel="noopener noreferrer" on any of the 3 Links;
                 no origin allowlist in getDocRoute()
```

### Trace C — consent flooding DoS path

```
Source:     Direct Supabase REST INSERT (bypasses app layer entirely)
            Enabled by: absent RLS INSERT WITH CHECK (Trace A) + no consent_type enum enforcement

Validation at boundary:
            Controller layer: consentType comes from activeDocs (trusted DB) on normal path
            Direct API path: no controller intercept — attacker inserts arbitrary consent_type rows
            directly via Supabase anon/auth client

Sink A:     platform.user_consents INSERT (arbitrary rows, attacker-controlled consent_type)
Sink B:     dalGetUserConsents() .limit(20) at userConsents.read.dal.js:27
            .order('accepted_at', { ascending: false }) — newest rows first

Defense at sink: WEAK
            .limit(20) returns top 20 rows by recency.
            After 20+ fake-type rows inserted, real required types (terms_of_service,
            privacy_policy, age_verification) are beyond the limit window.
            buildConsentComplianceStatus() sees no matching consents → gate blocks victim.
```

### Trace D — logout cache non-invalidation

```
Source:     Module-level TTL caches: legalDocsCache (60s), consentCache (90s)
            legalConsent.controller.js:10-11

Validation at boundary:
            AuthProvider.logout() (line 167) and logoutAllSessions() (line 218):
            clear identity state, localStorage, sessionStorage
            DO NOT call invalidateConsentCache() or invalidateLegalDocsCache()

Sink:       getCachedUserConsents() / getActiveLegalDocuments() serve stale data
            on next login within TTL window

Defense at sink: PARTIAL — 60s/90s TTL limits window; cache key is userId:appId so
                 different users don't share entries. Risk is re-login of same user or
                 admin-revoked docs not enforced immediately.
```

### Trace E — duplicate consent INSERT (no onConflict)

```
Source:     Double-submit (race condition, retry, concurrent calls)

Validation at boundary:
            dalRecordLegalAcceptance: no .onConflict() guard
            No UNIQUE constraint on (user_id, legal_document_id, consent_version) confirmed
            by static scan (no migration reference found)

Sink:       platform.user_consents — duplicate rows with different IDs

Defense at sink: PARTIAL — buildConsentComplianceStatus uses Set deduplication at engine layer
                (consent_type:consent_version key) so gate logic is unaffected.
                Audit log is polluted.
```

---

## HIGH FINDINGS

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-001
- Title:              Cross-user consent fabrication — no session identity assertion + missing RLS INSERT WITH CHECK
- Category:           IDOR/BOLA + Supabase RLS
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:94–125
                      apps/VCSM/src/features/legal/dal/userConsents.write.dal.js:30–44
                      apps/VCSM/src/features/legal/adapters/legal.adapter.js (recordSignupConsent export)
- Source:             userId parameter in recordLegalAcceptance() accepted from caller — no session bind
- Sink:               dalRecordLegalAcceptance() → platform.user_consents INSERT (user_id: userId)
- Trust Boundary:     recordLegalAcceptance() controller (line 94) — should assert session.user.id === userId
- Impact:             Any authenticated user can fabricate consent records for another user (user_id spoofing).
                      Attacker records consent on behalf of victim → victim's gate shows compliant when they
                      have not actually accepted policies. Or: attacker records bad state that blocks victim.
                      Affects compliance audit trail integrity.
- Evidence:           legalConsent.controller.js:94–99
                        export async function recordLegalAcceptance({
                          userId,
                          userAppAccountId,
                          documents,
                          acceptedVia,
                        }) {
                      — no session cross-check before proceeding to DAL
                      userConsents.write.dal.js:33: .insert({ user_id: userId, ... })
                      legal.adapter.js: exports recordSignupConsent (controller function) — violates adapter
                      contract (adapters must not export controllers)
- Reproduction Steps: 1. Authenticate as user A (any valid session)
                      2. Obtain victim user B's userId (from any public profile or API response)
                      3. Call recordSignupConsent({ userId: victimUserId }) directly via adapter import,
                         or POST to Supabase REST /platform/user_consents with user_id: victimUserId
                      4. If RLS INSERT WITH CHECK is absent: consent row created for victim
                      5. Victim's gate check returns ALLOW_ACCESS for policies they never reviewed
- Existing Defense:   Hook layer: useLegalConsent.js passes user.id from Supabase session (session-derived).
                      This protects the standard UI path only. Adapter-exported function bypasses hook.
- Why Defense Is Insufficient: recordSignupConsent is adapter-exported and callable from any
                                import context. No controller-layer session assertion. RLS
                                INSERT WITH CHECK unverified (VENOM-flagged, DB audit required).
- Recommended Fix:    Two-layer defense:
                      1. DB (primary): Add RLS INSERT WITH CHECK (auth.uid() = user_id) on
                         platform.user_consents
                      2. Controller (defense-in-depth): Add session identity assertion in
                         recordLegalAcceptance() before proceeding to DAL
- Suggested Patch:    [CONTROLLER LAYER — defense-in-depth]

                      In legalConsent.controller.js, add to recordLegalAcceptance() before Promise.all:

                      import { supabase } from '@/services/supabase/supabaseClient'

                      export async function recordLegalAcceptance({ userId, userAppAccountId, documents, acceptedVia }) {
                        // Session identity assertion — defense-in-depth (primary defense is RLS)
                        const { data: { user: sessionUser } } = await supabase.auth.getUser()
                        if (!sessionUser || sessionUser.id !== userId) {
                          throw new Error('[LegalConsent] Session identity mismatch')
                        }

                        // ... existing locale/userAgent + Promise.all
                      }

                      [DB LAYER — primary defense — requires Carnage migration]

                      ALTER POLICY ... ON platform.user_consents
                      FOR INSERT WITH CHECK (auth.uid() = user_id);

                      Route DB patch to: DB + Carnage
- Follow-up Command:  DB (RLS policy verification), Carnage (migration)
- Confirms:           VEN-LEGAL-001, BW-LEGAL-001
- THOR Blocker:       YES
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-002
- Title:              Open redirect + tabnapping via DB-controlled content_url
- Category:           Open Redirect
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx:55–61 (getDocRoute)
                      Line 98 (requiredActions map Link)
                      Line 125 (ToS inline Link)
                      Line 135 (Privacy Policy inline Link)
- Source:             action.content_url from platform.public_legal_documents_v (DB-controlled)
- Sink:               <Link to={getDocRoute(action)} target="_blank"> — opens DB-controlled URL
                      with no rel="noopener noreferrer"
- Trust Boundary:     getDocRoute() function at ConsentGateScreen.jsx:55 — where validation must occur
- Impact:             Two independent exploits:
                      A. Open redirect: if content_url is set to https://evil.com, clicking any policy
                         link opens an attacker-controlled page in a new tab. User believes they are
                         reading ToS/PP but are on a phishing page.
                      B. Tabnapping: opened page has access to window.opener and can navigate the
                         original /feed tab to a phishing URL while the user reads the policy.
                      Prerequisite: attacker controls a legal_documents row (admin account compromise
                      or SQL injection into legal_documents table). Risk level increases in shared-admin
                      environments.
- Evidence:           ConsentGateScreen.jsx:55-56
                        function getDocRoute(action) {
                          if (action.content_url) return action.content_url  // no validation
                        }
                      Line 98:  <Link to={getDocRoute(action)} target="_blank">
                      Line 125: <Link to={getDocRoute(tosAction)} target="_blank">
                      Line 135: <Link to={getDocRoute(ppAction)} target="_blank">
                      All three: no rel="noopener noreferrer"
- Reproduction Steps: A. Open redirect:
                        1. Set content_url = 'https://evil.com' on any active legal document in DB
                        2. Trigger ConsentGateScreen for any user
                        3. Click any policy link → navigates to evil.com in new tab
                      B. Tabnapping:
                        1. Any external URL opened via target="_blank" without rel=noopener
                        2. Opened page: window.opener.location.href = 'https://evil.com/fake-login'
                        3. Original /feed tab redirects to phishing page while user is on new tab
- Existing Defense:   Type-based fallback routes (privacy_policy → /legal/privacy-policy etc.)
                      activate when content_url is absent — protects the no-content_url case.
                      Does not protect when content_url is set.
- Why Defense Is Insufficient: content_url presence short-circuits all type-based routing.
                                No origin check, no allowlist. All 3 Links have target="_blank"
                                with no rel attribute — tabnapping is unconditional.
- Recommended Fix:    Two independent fixes (both required):
                      1. Origin allowlist in getDocRoute()
                      2. rel="noopener noreferrer" on all three <Link target="_blank"> elements
- Suggested Patch:    [PATCH A — URL origin allowlist in getDocRoute()]

                      // In ConsentGateScreen.jsx, replace getDocRoute():

                      const ALLOWED_LEGAL_ORIGINS = new Set([
                        window.location.origin,
                        'https://vibezcitizens.com',
                        'https://www.vibezcitizens.com',
                      ])

                      function getDocRoute(action) {
                        if (action.content_url) {
                          try {
                            const parsed = new URL(action.content_url, window.location.origin)
                            if (ALLOWED_LEGAL_ORIGINS.has(parsed.origin)) {
                              return action.content_url
                            }
                          } catch {
                            // invalid URL — fall through to type-based route
                          }
                        }
                        if (action.consent_type === 'privacy_policy') return '/legal/privacy-policy'
                        if (action.consent_type === 'terms_of_service') return '/legal/terms-of-service'
                        if (action.consent_type === 'age_verification') return '/legal/age-verification'
                        return '#'
                      }

                      [PATCH B — rel="noopener noreferrer" on all three Links]

                      Line 98:  <Link to={getDocRoute(action)} target="_blank" rel="noopener noreferrer">
                      Line 125: <Link to={getDocRoute(tosAction)} target="_blank" rel="noopener noreferrer">
                      Line 135: <Link to={getDocRoute(ppAction)} target="_blank" rel="noopener noreferrer">
- Follow-up Command:  BLACKWIDOW (re-verify Patch A blocks redirect + Patch B blocks tabnapping)
- Confirms:           VEN-LEGAL-002, BW-LEGAL-002, BW-LEGAL-007
- THOR Blocker:       YES
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-003
- Title:              Consent record flooding DoS — arbitrary INSERT + limit(20) read cap
- Category:           IDOR/BOLA + Supabase RLS
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/legal/dal/userConsents.read.dal.js:18-32
                      apps/VCSM/src/features/legal/dal/userConsents.write.dal.js:19-50
- Source:             Direct Supabase REST API INSERT on platform.user_consents (no RLS INSERT WITH CHECK)
- Sink A:             platform.user_consents INSERT — arbitrary consent_type rows accepted
- Sink B:             dalGetUserConsents() .limit(20) — newest 20 rows only; real types displaced
- Sink C:             buildConsentComplianceStatus() — evaluates displaced result set as non-compliant
- Trust Boundary:     Missing: no RLS INSERT WITH CHECK; no consent_type enum validation in DAL
- Impact:             Attacker floods victim's consent records with 20+ rows of fake/unused consent types.
                      dalGetUserConsents reads newest 20 rows — real required types (terms_of_service,
                      privacy_policy, age_verification) are pushed beyond offset 20.
                      buildConsentComplianceStatus finds no matching consents → requiresConsent=true.
                      Victim is permanently blocked at the ConsentGateScreen until records are
                      manually cleaned from DB. No self-recovery path for victim.
                      Multi-user DoS: attacker blocks many victims simultaneously.
- Evidence:           userConsents.read.dal.js:27: .limit(20)
                      userConsents.read.dal.js:26: .order('accepted_at', { ascending: false })
                      No .in('consent_type', [...]) filter scoping to required types.
                      Insert DAL: no consent_type enum validation at line 38: consentType parameter
                      flows directly to .insert({ consent_type: consentType })
- Reproduction Steps: 1. Authenticate as any user (requires only a valid Supabase session)
                      2. Obtain victim userId (public profile or API leak)
                      3. POST 20+ rows to platform.user_consents with:
                           user_id: victimUserId (if no INSERT WITH CHECK RLS)
                           consent_type: 'fake_001', 'fake_002', ... (arbitrary strings)
                           accepted_at: current timestamp (newest rows)
                      4. dalGetUserConsents for victim returns 20 fake rows (none matching required types)
                      5. buildConsentComplianceStatus: no terms_of_service/privacy_policy/age_verification found
                      6. useLegalConsent: requiresConsent=true → ConsentGateScreen blocks all app access
                      7. Re-consent attempt records new rows with real types — but attackers can immediately
                         flood again. Victim enters infinite block cycle.
                      Note: step 3 also works for self-DoS if attacker targets own account to test.
- Existing Defense:   PARTIAL — consentCache 90s TTL limits re-check frequency but does not prevent the attack.
                      buildConsentComplianceStatus Set-based dedup handles duplicate real rows but
                      cannot recover types that are off the limit.
- Why Defense Is Insufficient: .limit(20) is a hard cap with no type-scoping. Any INSERT without type
                                enforcement displaces real consent rows from the evaluation window.
                                Root cause is shared with ELEK-001: missing RLS INSERT WITH CHECK.
- Recommended Fix:    Three-layer defense:
                      1. DB (primary): RLS INSERT WITH CHECK (auth.uid() = user_id) blocks cross-user flooding
                      2. DAL read (immediate): Scope query to known required types
                      3. Controller write (defense-in-depth): Validate consentType against enum before INSERT
- Suggested Patch:    [PATCH A — DAL read: type-scope filter (immediate, no DB migration required)]

                      // In userConsents.read.dal.js, add .in() before .limit():

                      const REQUIRED_CONSENT_TYPES = ['terms_of_service', 'privacy_policy', 'age_verification']

                      export async function dalGetUserConsents({ userId, appId }) {
                        const { data, error } = await supabase
                          .schema('platform')
                          .from('user_consents')
                          .select(CONSENT_SELECT)
                          .eq('user_id', userId)
                          .eq('app_id', appId)
                          .in('consent_type', REQUIRED_CONSENT_TYPES)   // ← add this line
                          .eq('accepted', true)
                          .is('revoked_at', null)
                          .order('accepted_at', { ascending: false })
                          .limit(20)

                        if (error) throw error
                        return data ?? []
                      }

                      [PATCH B — Controller write: consent_type enum validation (defense-in-depth)]

                      // In legalConsent.controller.js, add before dalRecordLegalAcceptance call:

                      const VALID_CONSENT_TYPES = new Set(['terms_of_service', 'privacy_policy', 'age_verification'])

                      // In dalRecordLegalAcceptance mapping block:
                      documents.map((doc) => {
                        if (!VALID_CONSENT_TYPES.has(doc.document_type)) {
                          throw new Error(`[LegalConsent] Invalid consent_type: ${doc.document_type}`)
                        }
                        return dalRecordLegalAcceptance({ ... })
                      })

                      [PATCH C — DB RLS INSERT WITH CHECK — required, routes to Carnage]
                      See ELEK-2026-06-06-001 Patch DB layer.

- Follow-up Command:  DB (RLS verification), Carnage (migration for INSERT WITH CHECK)
- Confirms:           BW-LEGAL-009
- THOR Blocker:       YES
```

---

## MEDIUM FINDINGS

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-004
- Title:              Consent + legal docs cache not invalidated on logout — stale enforcement window
- Category:           Weak JWT/Session
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/app/providers/AuthProvider.jsx:167–215 (logout)
                      apps/VCSM/src/app/providers/AuthProvider.jsx:218–256 (logoutAllSessions)
                      apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:10–11 (caches)
- Source:             Module-level TTL caches persist across auth session lifecycle
- Sink:               getCachedUserConsents() / getActiveLegalDocuments() serve stale data after
                      user re-authenticates within the TTL window (consentCache: 90s, legalDocsCache: 60s)
- Trust Boundary:     AuthProvider.logout() — should clear compliance caches before navigate('/login')
- Impact:             If an admin revokes a legal document version (bumps version, forcing re-consent
                      for all users), the in-memory cache serves the old document set for up to 60s.
                      Users who re-login within 90s of logout may have their prior consent state
                      served from cache without a fresh DB check.
                      Secondary: invalidateLegalDocsCache() is never called anywhere in the codebase
                      (confirmed by grep during VENOM run) — doc version bumps rely entirely on TTL
                      expiry for cache refresh, with no explicit invalidation path.
- Evidence:           AuthProvider.jsx:167-215: logout() — 48 lines with no invalidateConsentCache()
                                                             or invalidateLegalDocsCache() calls
                      AuthProvider.jsx:218-256: logoutAllSessions() — same
                      legalConsent.controller.js:10-11:
                        const legalDocsCache = createTTLCache(60_000)
                        const consentCache = createTTLCache(90_000)
- Existing Defense:   TTL (60s docs, 90s consents) limits maximum window.
                      Cache is keyed by userId:appId — different users don't share entries.
- Why Defense Is Insufficient: TTL-only invalidation means revoked documents enforce with up to
                                60s delay. For a compliance-sensitive feature (legal consent gate),
                                any non-enforcement window on logout is a control gap.
                                invalidateLegalDocsCache() is exported but never called — the
                                explicit invalidation path exists but is wired to nothing.
- Recommended Fix:    Export cache invalidators from legal.adapter.js and call both in
                      logout() + logoutAllSessions() before navigate()
- Suggested Patch:    [STEP 1 — Expose via adapter (adapter boundary compliance)]

                      // In legal.adapter.js, add exports:
                      export { invalidateConsentCache, invalidateLegalDocsCache }
                        from '../controllers/legalConsent.controller'

                      [STEP 2 — Call on logout in AuthProvider.jsx]

                      // Add import (top of AuthProvider.jsx):
                      import { invalidateConsentCache, invalidateLegalDocsCache }
                        from '@/features/legal/adapters/legal.adapter'

                      // In logout() body, before navigate('/login', ...):
                      invalidateConsentCache()
                      invalidateLegalDocsCache()

                      // In logoutAllSessions() body, before navigate('/login', ...):
                      invalidateConsentCache()
                      invalidateLegalDocsCache()

- Follow-up Command:  VENOM (confirm cache lifecycle governance), SPIDER-MAN (test coverage)
- Confirms:           VEN-LEGAL-005, BW-LEGAL-005
- THOR Blocker:       CAUTION (enforcement gap, not direct exploit without re-login timing)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-005
- Title:              Duplicate consent rows — no onConflict guard and no UNIQUE constraint
- Category:           Supabase RLS (data integrity)
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/legal/dal/userConsents.write.dal.js:30–44
- Source:             Race condition or double-submit (double-click, retry, concurrent calls)
- Sink:               platform.user_consents — multiple rows with identical
                      (user_id, legal_document_id, consent_version) but different row IDs
- Trust Boundary:     dalRecordLegalAcceptance() — must be idempotent for compliance audit
- Impact:             Duplicate rows in platform.user_consents pollute the legal compliance audit log.
                      During audits, a user may appear to have consented multiple times to the
                      same document version — this is incorrect and can create ambiguity about the
                      authentic first-consent timestamp. Does not break gate logic (engine uses Set
                      dedup) but degrades audit integrity.
                      Concurrent calls from acceptAll() via Promise.all across documents do not
                      create duplicates for the same document (different legal_document_id per doc),
                      but a double-submit of the entire acceptAll() can create N duplicate rows.
- Evidence:           userConsents.write.dal.js:30-44: .insert({...}) — no .onConflict() clause
                      No UNIQUE constraint found on (user_id, legal_document_id, consent_version)
                      in reviewed migrations
- Existing Defense:   buildConsentComplianceStatus() uses Set keyed on consent_type:consent_version —
                      deduplicates at evaluation time. Gate logic unaffected.
                      useLegalConsent.js: setAccepting(true) during write prevents double-click in
                      standard UI — but does not protect against concurrent API calls.
- Why Defense Is Insufficient: setAccepting flag is UI-only. Programmatic calls or adapter-exported
                                paths are not protected. Compliance audit records are not idempotent.
- Recommended Fix:    Add UNIQUE constraint on (user_id, legal_document_id, consent_version) in DB,
                      then use upsert with onConflict: ignoreDuplicates in DAL
- Suggested Patch:    [DB LAYER — requires Carnage migration]

                      ALTER TABLE platform.user_consents
                        ADD CONSTRAINT uq_user_consent_version
                        UNIQUE (user_id, legal_document_id, consent_version);

                      [DAL LAYER — requires DB constraint above to work correctly]

                      // In userConsents.write.dal.js, replace .insert({...}) with:

                      const { data, error } = await supabase
                        .schema('platform')
                        .from('user_consents')
                        .upsert(
                          {
                            user_id: userId,
                            user_app_account_id: userAppAccountId ?? null,
                            app_id: appId,
                            legal_document_id: legalDocumentId,
                            consent_type: consentType,
                            consent_version: consentVersion,
                            accepted: true,
                            accepted_via: acceptedVia,
                            locale: locale ?? null,
                            user_agent: userAgent ?? null,
                          },
                          { onConflict: 'user_id,legal_document_id,consent_version', ignoreDuplicates: true }
                        )
                        .select('id, accepted_at')
                        .single()

- Follow-up Command:  Carnage (DB migration — UNIQUE constraint), DB (policy review)
- Confirms:           BW-LEGAL-003
- THOR Blocker:       CAUTION (audit integrity — not direct exploit)
```

---

## LOW FINDINGS

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-006
- Title:              recordSignupConsent adapter export — userId not cross-checked against session
- Category:           Auth Bypass (partial)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:131–146
                      apps/VCSM/src/features/legal/adapters/legal.adapter.js
- Source:             { userId } parameter in recordSignupConsent accepted from caller
- Sink:               Cascades to recordLegalAcceptance() → dalRecordLegalAcceptance() INSERT
- Trust Boundary:     Missing — no session assertion in recordSignupConsent()
- Impact:             Any caller that imports recordSignupConsent via the adapter can pass an
                      arbitrary userId. The cascade to INSERT is unguarded at controller layer.
                      Partially mitigated by ELEK-001 patch (session assertion in recordLegalAcceptance).
                      Independent concern: the function is exported from the adapter — adapters must
                      not export controllers or DAL functions (VCSM architecture rule).
- Evidence:           legalConsent.controller.js:131:
                        export async function recordSignupConsent({ userId }) {
                      legal.adapter.js: exports recordSignupConsent (controller function — violates adapter rule)
                      Callers: useRegister.js, joinBarbershopAccount.controller.js
- Existing Defense:   Callers in current codebase appear to use session-derived userId.
                      Hook-layer path (useLegalConsent.js:66) uses user.id from session.
- Why Defense Is Insufficient: Adapter-exported controller function bypasses all hook-layer
                                session binding. Low severity because current callers are
                                well-behaved; risk is future callers or direct import.
                                Also: adapter contract violation is an architecture defect
                                independent of the security concern.
- Recommended Fix:    1. Remove recordSignupConsent from adapter exports
                      2. Callers should use a hook that wraps the controller (or the hook layer)
                      3. Add session assertion as specified in ELEK-001 patch
- Suggested Patch:    // In legal.adapter.js, remove:
                      //   export { recordSignupConsent } from '../controllers/legalConsent.controller'

                      // Callers should import via a hook wrapper instead.
                      // Create hook: useSignupConsent() { userId = useAuth().user?.id; return { recordSignupConsent: () => controller(userId) } }

- Follow-up Command:  VENOM (adapter contract governance review)
- Confirms:           VEN-LEGAL-004, BW-LEGAL-004
- THOR Blocker:       NO (mitigated by ELEK-001 patch; low independent impact)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-007
- Title:              userAppAccountId hardcoded null — consent records orphaned from user_app_accounts
- Category:           Supabase RLS (data quality)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/legal/hooks/useLegalConsent.js:68
                      apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:141
- Source:             userAppAccountId: null hardcoded at all write sites
- Sink:               platform.user_consents.user_app_account_id = NULL for all records
- Trust Boundary:     N/A — data quality issue
- Impact:             Compliance audit records cannot be joined to user_app_accounts to determine
                      which app account made the consent. Forensic reconstruction of "who consented
                      under which app account" is impossible from consent records alone.
                      Not exploitable — no direct security impact. LOW severity for compliance
                      audit completeness.
- Evidence:           useLegalConsent.js:68: userAppAccountId: null
                      legalConsent.controller.js:141: userAppAccountId: null
                      legalConsent.controller.js:200: userAppAccountId: userAppAccountId ?? null
- Existing Defense:   user_id field correctly ties consent to auth.users. The FK to user_app_accounts
                      is nullable by design (field exists for future use).
- Recommended Fix:    Wire userAppAccountId from identity context in useLegalConsent.js.
                      Requires useIdentity() or equivalent to resolve current user_app_account_id.
- Suggested Patch:    // In useLegalConsent.js, resolve userAppAccountId from identity context:
                      // const { userAppAccountId } = useIdentity() or equivalent
                      // Pass to acceptRequiredConsents({ userId: user.id, userAppAccountId, ... })
- Follow-up Command:  Deadpool (identity resolution — verify userAppAccountId availability in hook context)
- Confirms:           VEN-LEGAL-006
- THOR Blocker:       NO
```

---

## FALSE POSITIVES REJECTED

---

```
FALSE POSITIVE REJECTED

- Candidate:          VEN-LEGAL-003 — getPublicIp.dal.js external API call security risk
- Location:           apps/VCSM/src/features/legal/dal/getPublicIp.dal.js
- Rejection reason:   Sink cannot be reached — file has zero importers confirmed by grep.
                      File comment states "NOT CALLED". No active call chain exists.
- Chain gap:          Source → Trust Boundary → Sink → Impact — broken at Source (no import path)
- Notes:              Dead code should be deleted (hygiene). Risk of accidental reintroduction
                      is real but requires a code change first. Downgraded to INFO-level
                      hygiene note: delete the file to permanently close this vector.
                      Route deletion to WOLVERINE.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:          BW-LEGAL-006 — BEHAVIOR.md placeholder creates unanchored attack scenarios
- Location:           ZZnotforproduction/APPS/VCSM/features/legal/BEHAVIOR.md
- Rejection reason:   A missing documentation contract is a governance gap, not a code-level
                      vulnerability. No exploit chain — impact is to security review quality,
                      not to runtime security posture.
- Chain gap:          No Source, Trust Boundary, or Sink in application code — documentation
                      absence cannot be exploited by an attacker.
- Notes:              Governance gap is real and should be remediated (BEHAVIOR.md §5 and §9
                      required for THOR). Route to LOGAN. Does not block ELEKTRA findings.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:          BW-LEGAL-008 — empty-docs fail-closed gate
- Location:           apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:162–164
                      apps/VCSM/src/features/legal/hooks/useLegalConsent.js:36–45
- Rejection reason:   Source-verified HARDENED. Empty activeDocs throws → hook catches →
                      gateError=true, requiresConsent=true → ConsentGateScreen renders error state.
                      Gate is fail-closed. No bypass path exists through empty docs.
- Chain gap:          Impact — attacker cannot gain access; failure results in blocking, not admission.
- Notes:              Confirmed correct behavior. Not a vulnerability.
```

---

## SUGGESTED PATCH QUEUE

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-06-001 | Cross-user consent fabrication — session assert | HIGH | Controller | SIMPLE | YES (RLS INSERT WITH CHECK) |
| 2 | ELEK-2026-06-06-002a | Open redirect — URL origin allowlist | HIGH | UI | SIMPLE | NO |
| 3 | ELEK-2026-06-06-002b | Tabnapping — rel="noopener noreferrer" | HIGH | UI | SIMPLE | NO |
| 4 | ELEK-2026-06-06-003a | Flooding DoS — type-scope read filter | HIGH | DAL | SIMPLE | NO |
| 5 | ELEK-2026-06-06-003b | Flooding DoS — consent_type enum validation | HIGH | Controller | SIMPLE | NO |
| 6 | ELEK-2026-06-06-004 | Cache invalidation on logout | MEDIUM | Controller + Auth | MODERATE | NO |
| 7 | ELEK-2026-06-06-005 | Duplicate consent — upsert + onConflict | MEDIUM | DAL | MODERATE | YES (UNIQUE constraint) |

**Patches 2, 3, 4 (UI and read DAL) are SIMPLE and require no DB changes — highest ROI for immediate shipment.**
**Patch 1 and DB layers (RLS) require Carnage migration and DB verification before deployment.**

---

## REQUIRED FOLLOW-UP COMMANDS

| Command | Reason | Status |
|---|---|---|
| DB | Verify/add RLS INSERT WITH CHECK on platform.user_consents | PENDING — blocks ELEK-001, ELEK-003 |
| Carnage | Migration: RLS INSERT WITH CHECK + UNIQUE constraint on user_consents | PENDING — required for ELEK-001 and ELEK-005 DB patches |
| VENOM | Confirm adapter contract violation (recordSignupConsent export) governance | PENDING — ELEK-006 |
| SPIDER-MAN | Test coverage: legalCompliance.engine.js (0 tests), consent write paths | PENDING |
| BLACKWIDOW | Re-verify after patches: Patch A (URL allowlist) + Patch B (rel=noopener) | PENDING — ELEK-002 |
| LOGAN | Write substantive BEHAVIOR.md §5 (security rules) and §9 (invariants) | PENDING — governance gate |
| THOR | Release gate evaluation after patch verification | PENDING — blocked by open HIGH findings |

---

## ELEKTRA THOR GATE ASSESSMENT

| Finding ID | Severity | THOR Blocker | Patch Available | Patch Layer |
|---|---|---|---|---|
| ELEK-2026-06-06-001 | HIGH | YES | YES (partial — controller) | Controller + DB (Carnage required) |
| ELEK-2026-06-06-002 | HIGH | YES | YES (full) | UI only — no DB change |
| ELEK-2026-06-06-003 | HIGH | YES | YES (partial — DAL filter) | DAL only — no DB change for Patch A |
| ELEK-2026-06-06-004 | MEDIUM | CAUTION | YES (full) | Controller + Auth |
| ELEK-2026-06-06-005 | MEDIUM | CAUTION | YES (partial) | DAL + DB (Carnage required) |
| ELEK-2026-06-06-006 | LOW | NO | YES | Controller/Adapter |
| ELEK-2026-06-06-007 | LOW | NO | YES | Hook |

**NOTE:** ELEK-002 and ELEK-003-Patch-A are both fully patchable at the application layer (no DB changes).
These two patches together close one HIGH finding and reduce the flooding DoS severity significantly.
Recommend shipping UI + DAL patches immediately and deferring DB-layer patches to a Carnage migration.

---

## UPSTREAM CLAIM RECONCILIATION

| Upstream ID | ELEKTRA Status | Notes |
|---|---|---|
| VEN-LEGAL-001 | CONFIRMED HIGH → ELEK-001 | Chain fully traced; session assert patch proposed |
| VEN-LEGAL-002 | CONFIRMED HIGH → ELEK-002 | All 3 Link sinks verified; both patches proposed |
| VEN-LEGAL-003 | DOWNGRADED → FALSE POSITIVE | Dead file — no import path; hygiene only |
| VEN-LEGAL-004 | CONFIRMED LOW → ELEK-006 | Lower severity: current callers well-behaved |
| VEN-LEGAL-005 | CONFIRMED MEDIUM → ELEK-004 | Cache invalidation gap in both logout paths |
| VEN-LEGAL-006 | CONFIRMED LOW → ELEK-007 | Data quality; not exploitable |
| BW-LEGAL-001 | CONFIRMED → ELEK-001 | Same chain as VEN-LEGAL-001; co-finding |
| BW-LEGAL-002 | CONFIRMED → ELEK-002 | Same chain as VEN-LEGAL-002; co-finding |
| BW-LEGAL-003 | CONFIRMED MEDIUM → ELEK-005 | Duplicate row; audit integrity |
| BW-LEGAL-004 | CONFIRMED LOW → ELEK-006 | Co-finding with VEN-LEGAL-004 |
| BW-LEGAL-005 | CONFIRMED → ELEK-004 | Co-finding with VEN-LEGAL-005 |
| BW-LEGAL-006 | DOWNGRADED → FALSE POSITIVE | Docs gap — not a code vulnerability |
| BW-LEGAL-007 | CONFIRMED → ELEK-002 | Merged into ELEK-002 (tabnapping = Patch B) |
| BW-LEGAL-008 | HARDENED → FALSE POSITIVE | Fail-closed confirmed source-verified |
| BW-LEGAL-009 | CONFIRMED HIGH → ELEK-003 | Full flooding chain traced and patch proposed |
