# BLACKWIDOW V2 Adversarial Review — legal

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | legal |
| App | VCSM |
| Reviewer | BLACKWIDOW V2 |
| Review Version | BW2.5 V2 |
| Date | 2026-06-04 |
| Scanner Preflight | FRESH — 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Behavior Contract | PLACEHOLDER — all §9 invariants UNANCHORED |
| Existing VENOM Findings | 4 open (VEN-LEGAL-001 through 004) |
| Existing ELEKTRA Findings | 0 (ELEKTRA never run) |
| Total BW Findings | 8 |
| Severity Breakdown | 0 CRITICAL, 2 HIGH, 3 MEDIUM, 2 LOW, 1 INFO |
| THOR Release Blocker | YES — BW-LEGAL-001, BW-LEGAL-002 |

---

## 2. Scanner Preflight

```
BLACKWIDOW SCANNER PREFLIGHT
==============================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Maps Generated: 2026-06-04T19:48:25.152Z
Age at Review: ~7h
Freshness Window: 3 days

| Map                  | Generated At                  | Age | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z     | ~7h | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z     | ~7h | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z     | ~7h | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z     | ~7h | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z     | ~7h | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z     | ~7h | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z     | ~7h | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

```json
{
  "securityPaths": [
    {
      "route": "*",
      "feature": null,
      "access": "public",
      "controller": "legalConsent.controller.js#acceptRequiredConsents",
      "confidence": "MEDIUM",
      "writes": [{ "operation": "insert", "table": "platform.user_consents", "confidence": "HIGH" }]
    },
    {
      "route": "/onboarding",
      "feature": null,
      "access": "public",
      "controller": "legalConsent.controller.js#acceptRequiredConsents",
      "confidence": "MEDIUM",
      "writes": [{ "operation": "insert", "table": "platform.user_consents", "confidence": "HIGH" }]
    },
    {
      "route": "/welcome",
      "feature": null,
      "access": "public",
      "controller": "legalConsent.controller.js#acceptRequiredConsents",
      "confidence": "MEDIUM",
      "writes": [{ "operation": "insert", "table": "platform.user_consents", "confidence": "HIGH" }]
    }
  ],
  "writeSurfaces": 1,
  "rpcs": 0,
  "edgeFunctions": 0,
  "writeExecutionPaths": 0,
  "rpcExecutionPaths": 0,
  "callgraphNodes": 51,
  "callgraphEdges": 48
}
```

**Scanner Notes:**
- 6 security paths attributed to `legal` write surfaces (routes `*`, `/onboarding`, `/welcome`, `robots.txt`, `sitemap.xml`, `sitemaps/*`); all are MEDIUM confidence with null `feature` attribution — LOW confidence by Rule BW-002, treated as PRIMARY ATTACK TARGETS.
- All 6 paths resolve to the same controller+write pair. Routes `robots.txt`, `sitemap.xml`, `sitemaps/*` appear to be erroneous attributions from a scanner module-level reachability sweep; source verification confirmed `acceptRequiredConsents` is not callable from those routes.
- 0 write execution paths in write-execution-map; 0 RPC paths — source-only analysis required.

---

## 4. Attack Surface Inventory

### 4.1 DAL Write Surfaces

| Surface | Operation | Table | Layer | Confidence |
|---|---|---|---|---|
| `dalRecordLegalAcceptance` | INSERT | platform.user_consents | DAL | HIGH (scanner + source) |

### 4.2 Hook Entry Points (UI-Accessible)

| Hook | Entry Function | Triggers Write |
|---|---|---|
| `useLegalConsent` | `acceptAll()` | YES — calls `acceptRequiredConsents` |
| `useSignupConsent` | `recordSignupConsent()` | YES — calls `recordLegalAcceptance` |
| `useLegalDocument` | `useLegalDocument()` | NO — read only |

### 4.3 Controller Entry Points (Cross-Feature Callable)

| Controller | Function | Auth Check | Session Cross-Check |
|---|---|---|---|
| `legalConsent.controller.js` | `recordSignupConsent({ userId })` | NO | NO |
| `legalConsent.controller.js` | `recordLegalAcceptance({ userId, ... })` | NO | NO |
| `legalConsent.controller.js` | `acceptRequiredConsents({ userId, requiredActions })` | NO | NO |
| `legalConsent.controller.js` | `resolveLegalGateForSession({ userId })` | NO | NO |
| `legalDocument.controller.js` | `getLegalDocumentController(...)` | NO (public) | N/A |

### 4.4 Scanner Confidence Classification

| Path Category | Count | Confidence | BW Priority |
|---|---|---|---|
| Scanner security paths with null feature | 6 | LOW (null sourceRoute) | PRIMARY ATTACK TARGET |
| Write surfaces (scanner-confirmed) | 1 | HIGH | SECONDARY VERIFICATION |
| Write surfaces (source-only) | 3 | SCANNER_LEAD | PRIMARY |

### 4.5 Callgraph Path: Hook → Controller → DAL

```
useLegalConsent.acceptAll()
  → acceptRequiredConsents({ userId: user.id, requiredActions })
    → recordLegalAcceptance({ userId, documents, acceptedVia: 'reconsent' })
      → dalRecordLegalAcceptance({ user_id: userId, ... })
        → platform.user_consents INSERT

useSignupConsent.recordSignupConsent({ userId })
  → legalConsent.controller.recordSignupConsent({ userId })
    → recordLegalAcceptance({ userId, documents: activeDocs, acceptedVia: 'signup' })
      → dalRecordLegalAcceptance({ user_id: userId, ... })
        → platform.user_consents INSERT
```

---

## 5. Scanner Signals Block

| Signal | Count | Notes |
|---|---|---|
| Write surfaces | 1 | platform.user_consents INSERT |
| Security paths | 6 | All MEDIUM confidence, null feature attribution |
| RPCs | 0 | None |
| Edge Functions | 0 | IP capture edge function pending (Carnage task) |
| Callgraph nodes | 51 | 4 hook, 10 controller, 5 DAL, 22 screen |
| Callgraph edges | 48 | |

---

## 6. Adversarial Path Analysis

---

### Attack Category A — OWNERSHIP BYPASS

**Question:** Can an actor submit a mutation with another actor's resource ID?

**Attack Harness A1 — Cross-User Consent Fabrication:**

An authenticated attacker (User A) calls `dalRecordLegalAcceptance` or the adapter-exported `recordSignupConsent` with `userId = <victim_user_id>` (User B's auth.users.id). If `platform.user_consents` has no `INSERT WITH CHECK (user_id = auth.uid())` RLS policy, the DB will accept the row.

Source trace:
- `userConsents.write.dal.js:30-48` — `user_id: userId` inserted directly from parameter. No session lookup.
- `migrations/20260510030000:11` — `GRANT INSERT ON platform.user_consents TO authenticated` — no companion WITH CHECK policy in any migration file scanned.
- `legalConsent.controller.js:94-125` — `recordLegalAcceptance` takes caller-supplied `userId`, no `supabase.auth.getUser()` call.

**Result: BYPASSED (application layer) / UNRESOLVED (DB layer)**

Application layer: The controller has no ownership assertion. Any caller can pass any userId. The adapter exports `recordSignupConsent` for cross-feature use, meaning this is callable from outside the legal feature.

DB layer: The migration tree confirms `GRANT INSERT` without `WITH CHECK`. The live DB state is unverified (no DB snapshot available), but VEN-LEGAL-001 previously confirmed the missing policy. No remediation migration exists in the project's migration tree — VEN-LEGAL-001 remains OPEN.

**Provenance:** [SOURCE_VERIFIED] — `userConsents.write.dal.js:33` (`user_id: userId`), `migrations/20260510030000:11` (GRANT, no WITH CHECK)

**Cross-reference:** Confirms VEN-LEGAL-001. The BW adversarial execution confirms the bypass chain from adapter → controller → DAL → DB is unobstructed at the application layer.

---

### Attack Category B — SESSION MUTATION

**Question:** Is viewerActorId (or userId) taken from session or client payload?

**Attack Harness B1 — Caller-Supplied userId to Signup Controller:**

`recordSignupConsent({ userId })` is exported via `legal.adapter.js:6` and callable by any feature. The `userId` parameter is pure caller-supplied input. The controller at `legalConsent.controller.js:131-146` does not call `supabase.auth.getUser()` before writing.

Current callers:
- `useRegister.js:140` — passes `result?.userId ?? null` from `ctrlRegisterAccount`. The register controller returns the newly created user's ID from Supabase Auth — this is the session user at signup time. Currently correct.
- `joinBarbershopAccount.controller.js:36` — passes `session.user.id`. Session is validated before this point. Currently correct.

However: the function signature accepts arbitrary input. The fail-open path (no session cross-check) means a future caller or a developer passing a stale cached userId would silently insert under the wrong identity.

**Attack Harness B2 — Null userId Fuzzing:**

`recordSignupConsent({ userId: null })` — what happens?

Trace: `legalConsent.controller.js:131` → `recordLegalAcceptance({ userId: null, ... })` → `dalRecordLegalAcceptance({ user_id: null, ... })`. The Supabase insert would attempt to write `user_id: null` to the DB. The table likely has a NOT NULL constraint or FK to `auth.users.id`, so the insert would error at the DB layer. The controller does not validate `userId` presence before proceeding.

No input validation guard exists at `legalConsent.controller.js:131`. The `useRegister.js:138` null-check (`userId ?? null`) means null is passable.

**Result: PARTIAL** — Session-sourced userId in hook (safe for React path). Controller export surface lacks session cross-check. Null input would surface as a DB error rather than a graceful rejection.

**Provenance:** [SOURCE_VERIFIED] — `legalConsent.controller.js:131` (no auth.getUser() call), `useRegister.js:138` (null propagation), `legal.adapter.js:6` (direct export)

---

### Attack Category C — RUNTIME ABUSE

**Question:** Are privileged endpoints protected by actor kind check?

**Attack Harness C1 — Non-Owner Actor Reaching Consent Write:**

Legal consent writes are scoped to individual users, not to Vport actors. The controllers accept `userId` (a Supabase auth.users UUID), not `actorId`. There is no actor kind check because the feature operates at the user identity layer, not the actor layer.

Evaluation: This is architecturally intentional. Consent is per-user, and a Vport actor switching user would still use the underlying user's auth session. No actor-kind gate is needed here.

**Result: BLOCKED** — Consent operations correctly operate at the user-session layer. No privileged actor-kind bypass surface exists.

**Provenance:** [SOURCE_VERIFIED] — `legalConsent.controller.js` (no actorId parameter anywhere)

---

### Attack Category D — RLS VERIFICATION

**Question:** For each DAL write: is there an ownership filter in the query, or is RLS the only barrier?

**Attack Harness D1 — INSERT Without Ownership Filter:**

`dalRecordLegalAcceptance` at `userConsents.write.dal.js:30-48`:
- No `.eq('user_id', auth.uid())` in the query (INSERTs don't filter, they create rows).
- No `supabase.auth.getUser()` call before insert.
- The only protection is DB-layer RLS INSERT WITH CHECK policy.
- VEN-LEGAL-001 confirms: no such policy exists in the migration tree.

**Result: BYPASSED (RLS not present for INSERT)**

Tables with assumed but unverified RLS:
- `platform.user_consents` — UPDATE and DELETE policies confirmed present (deny both). INSERT WITH CHECK NOT present. SELECT policy status not verifiable from migrations (original CREATE TABLE not in migration tree).

**Provenance:** [SOURCE_VERIFIED] — `migrations/20260510030000:11-20` confirms only `user_consents_deny_update` and `user_consents_deny_delete` policies; no INSERT policy.

---

### Attack Category E — VIEWER CONTEXT FUZZING

**Question:** What happens if null/undefined userId is passed to controllers?

**Attack Harness E1 — Null userId to resolveLegalGateForSession:**

`resolveLegalGateForSession({ userId: null })` at `legalConsent.controller.js:157-179`:
- Calls `getCachedUserConsents({ userId: null, appId })`.
- Cache key becomes `null:<appId>`.
- Calls `dalGetUserConsents({ userId: null, appId })`.
- DAL query: `.eq('user_id', null)` — in Supabase/PostgREST, `.eq('col', null)` is equivalent to `IS NULL` which would return all rows with `user_id = null` (likely zero rows).
- `buildConsentComplianceStatus({ activeDocs, userConsents: [] })` — all docs are "missing", returns `isCompliant: false`, `requiredActions: [all docs]`.
- Controller returns `{ decision: 'REQUIRE_RECONSENT', requiredActions: [...] }`.
- Gate decision: `REQUIRE_RECONSENT` — blocks access.

**Result: BLOCKED** — Null userId causes a gate block (fail closed) rather than granting access. The hook guards against this at `useLegalConsent.js:19` (`if (!user?.id) { setLoading(false); setRequiresConsent(false); return }`). However, the null userId guard is in the hook, not the controller — the controller itself does not validate userId presence.

**Attack Harness E2 — Undefined userId to getCachedUserConsents:**

Cache key would be `undefined:<appId>`. TTL cache stores under that key. If a previous null/undefined check passed, the cache would store empty results under `undefined:<appId>`, and a later call for `userId: undefined` would find the cached empty result. Since empty consents cause `REQUIRE_RECONSENT`, this is fail-closed. No security bypass via undefined userId.

**Result: BLOCKED** — Fail-closed behavior confirmed for null/undefined userId paths.

**Provenance:** [SOURCE_VERIFIED] — `useLegalConsent.js:19` (null guard), `legalConsent.controller.js:157` (no guard), `legalCompliance.engine.js:19-21` (empty consents → not compliant)

---

### Attack Category F — MUTATION REPLAY

**Question:** Can a completed/cancelled operation be re-triggered?

**Attack Harness F1 — Duplicate Consent Insertion:**

An attacker or a race condition calls `dalRecordLegalAcceptance` twice for the same `userId + legal_document_id + consent_type + consent_version`. 

The write DAL at `userConsents.write.dal.js:30-48` performs a plain INSERT with no `ON CONFLICT DO NOTHING` clause. The migration tree does not reveal a unique constraint on `(user_id, legal_document_id)` or `(user_id, consent_type, consent_version)`.

Effect: Duplicate rows would be inserted. `dalGetUserConsents` reads with `.order('accepted_at', descending).limit(20)` and `buildConsentComplianceStatus` takes the most-recently-accepted row per type — so duplicate rows do not cause a compliance bypass. However, they do pollute the legal audit trail.

The 90-second TTL consent cache means concurrent calls within the TTL window would hit the cache on second call (after cache population), preventing double-insert in the normal flow. However, with cache invalidated (immediately post-acceptance), concurrent calls from two browser tabs or from a race in the `Promise.all` inside `recordLegalAcceptance` could produce duplicates.

**Result: PARTIAL** — No security bypass (compliance check is duplicate-tolerant). Audit trail pollution is a legal data integrity concern. No ON CONFLICT guard exists.

**Provenance:** [SOURCE_VERIFIED] — `userConsents.write.dal.js:30-44` (plain INSERT, no ON CONFLICT), `legalCompliance.engine.js:26-29` (takes latest row per type — duplicate-tolerant)

---

### Attack Category G — HYDRATION POISONING

**Question:** Does this feature interact with the hydration store?

Source inspection confirms: the legal feature does not import from or write to the bootstrap/hydration store (`bootstrap.store`, React Query actor caches). It uses its own module-level TTL caches (`legalDocsCache`, `consentCache`).

**Result: BLOCKED** — No hydration store interaction. Hydration poisoning is not applicable to this feature.

**Provenance:** [SOURCE_VERIFIED] — confirmed by grep: no `useBootstrapStore`, `queryClient`, or `hydratedForActorId` references in `apps/VCSM/src/features/legal/`

---

### Attack Category H — URL SURFACE

**Question:** Do notification linkPaths, share links, or deep links expose raw UUIDs or enable open redirect?

**Attack Harness H1 — content_url Open Redirect in ConsentGateScreen:**

`ConsentGateScreen.jsx:55-61`:
```javascript
function getDocRoute(action) {
  if (action.content_url) return action.content_url
  // ...
}
```

`action.content_url` originates from `platform.legal_documents.content_url` via the DB view `platform.public_legal_documents_v`, threaded through `legalCompliance.engine.js:93` (`content_url: doc.content_url`) into `requiredActions`. This value is passed directly to React Router `<Link to={getDocRoute(action)}>` at lines 98, 123, and 135.

React Router `<Link to="https://evil.com/phish">` with `target="_blank"` navigates the user to the external URL in a new tab. No URL allow-listing or schema validation exists in `getDocRoute`.

Additionally, all three `<Link>` instances at lines 99, 124, 136 use `target="_blank"` with no `rel="noopener noreferrer"`. This enables tab-napping: the opened page can access `window.opener` and redirect the originating consent gate tab to a phishing page.

The legalDocsCache (60s TTL) means a malicious `content_url` injected into the DB would be served to all users who hit the gate within the TTL window without re-querying the DB.

**Result: BYPASSED (open redirect + tabnapping)**

**Provenance:** [SOURCE_VERIFIED] — `ConsentGateScreen.jsx:55-61` (no validation), `ConsentGateScreen.jsx:99,124,136` (target="_blank", no rel attribute), `legalCompliance.engine.js:93` (content_url propagated), `legalDocuments.read.dal.js:13` (content_url selected from view)

**Cross-reference:** Confirms and extends VEN-LEGAL-002 with new finding (tabnapping via missing rel="noopener noreferrer"). The BW adversarial pass reveals VEN-LEGAL-002's blast radius includes a tabnapping vector not previously documented.

**Attack Harness H2 — Raw UUID Exposure in URLs:**

Legal documents are fetched by `documentType` and `version` (human-readable), not by UUID. `LegalDocumentScreen.jsx` uses `useParams({ docType })` mapped to a static `DOCUMENT_MAP` object. No UUID appears in any legal-feature URL surface.

**Result: BLOCKED** — No raw UUID exposure in legal feature URLs.

**Provenance:** [SOURCE_VERIFIED] — `LegalDocumentScreen.jsx:12-28` (DOCUMENT_MAP keys are human-readable)

---

### Attack Category I — §9 INVARIANT ATTACK

**BEHAVIOR.md Status: PLACEHOLDER**

Because BEHAVIOR.md contains no §9 Must Never Happen invariants, no anchored invariant attack harnesses can be executed. However, source-inferred invariants (derived from the compliance engine and controller design intent) were tested:

**Inferred Invariant 1 — "An unauthenticated user must never reach platform content by bypassing the consent gate."**

Attack: Manipulate `useLegalConsent` return to return `{ requiresConsent: false }` without a real DB check.

Source trace: `useLegalConsent.js:37-44` — the `check()` function sets `setRequiresConsent(true)` on ANY error (`catch (err)` → `setRequiresConsent(true)`). This is fail-closed. An attacker cannot cause a false `requiresConsent: false` by injecting an error.

**Result: BLOCKED** — Fail-closed gate design holds.

**Inferred Invariant 2 — "A user must not be admitted through the consent gate if active legal documents exist and no consent record is found."**

Attack: Trigger `buildConsentComplianceStatus` with `userConsents = []`.

Trace: `legalCompliance.engine.js:18-21` — if `activeDocs` is non-empty and `userConsents` is empty, the loop at line 37 finds no `userConsent` for each doc, pushes to `missingTypes` and `requiredActions`, and returns `isCompliant: false`.

**Result: BLOCKED** — Correct behavior confirmed.

**Inferred Invariant 3 — "A user must not be marked compliant when active documents exist but the DB is unreachable."**

Attack: Simulate DB error in `dalGetActiveLegalDocuments` or `dalGetUserConsents`.

Trace: `legalConsent.controller.js:157-179` — `getActiveLegalDocuments()` throws if the DB call returns an error (`legalDocuments.read.dal.js:32`, `if (error) throw error`). The controller propagates the throw. `useLegalConsent.js:37-44` catches and sets `setRequiresConsent(true)`. Gate is blocked.

Special case: `getActiveLegalDocuments()` at `legalConsent.controller.js:17-26` returns empty array on DB success with no rows (not an error). The controller at line 162-164 throws explicitly: `throw new Error('No active legal documents configured...')`. Hook catches, sets `requiresConsent: true`. Gate blocked.

**Result: BLOCKED** — Fail-closed on both DB error and empty-docs paths.

**Inferred Invariant 4 — "Consent records must be immutable after insertion."**

Attack: Attempt UPDATE on a consent row.

Trace: Migration `20260510030000:15-28` creates both `user_consents_deny_update` (RESTRICTIVE FOR UPDATE USING (false)) and `user_consents_deny_delete` (RESTRICTIVE FOR DELETE USING (false)). The immutability trigger `trg_prevent_consent_audit_mutation` additionally guards at the row level.

**Result: BLOCKED** — Dual protection (RLS + trigger) confirmed. No application-layer update path exists.

---

## 7. Exploitability Assessment

| Finding ID | Severity | Exploit Chain Type | Exploitability | Attack Path |
|---|---|---|---|---|
| BW-LEGAL-001 | HIGH | Single-step | MEDIUM | Authenticated caller passes arbitrary userId to exported recordSignupConsent → DB INSERT with no WITH CHECK |
| BW-LEGAL-002 | HIGH | Multi-step | LOW (requires DB write access) | Admin writes malicious content_url → All consenting users directed to external phishing URL + tabnapping |
| BW-LEGAL-003 | MEDIUM | Multi-step | LOW | Concurrent/dual-tab calls to recordLegalAcceptance → duplicate consent rows (no ON CONFLICT guard) |
| BW-LEGAL-004 | MEDIUM | Single-step | LOW | Null userId passed to controller → DB error surface exposed (no input validation gate) |
| BW-LEGAL-005 | MEDIUM | Cache | LOW | Consent cache not invalidated on logout → stale keyed entries survive up to 90s, but keyed by userId so no cross-user leak |
| BW-LEGAL-006 | LOW | Injection | INFO | Missing BEHAVIOR.md contract means invariants are unanchored — governance gap, not runtime |
| BW-LEGAL-007 | LOW | Single-step | LOW | target="_blank" links in ConsentGateScreen lack rel="noopener noreferrer" — enables tabnapping if content_url is external |
| BW-LEGAL-008 | INFO | N/A | N/A | legalDocsCache caches empty-result guard only for non-empty results; empty result is never cached — correct defense, but this guard is undocumented in behavior contract |

---

## 8. Full Finding Details

---

### BW-LEGAL-001 — Cross-User Consent Fabrication (No INSERT WITH CHECK RLS)

- **Severity:** HIGH
- **Result:** BYPASSED (application layer confirmed; DB layer UNRESOLVED — VEN-LEGAL-001 open)
- **Exploit Chain:** Single-step
- **Provenance:** [SOURCE_VERIFIED]

**Description:** The adapter exports `recordSignupConsent` directly (`legal.adapter.js:6`). The function chain `recordSignupConsent → recordLegalAcceptance → dalRecordLegalAcceptance` accepts a caller-supplied `userId` and passes it directly as `user_id` in the INSERT (`userConsents.write.dal.js:33`). No controller performs `supabase.auth.getUser()` before writing. No DB-level `INSERT WITH CHECK (user_id = auth.uid())` policy exists (confirmed absent from all scanned migrations; VEN-LEGAL-001 open). An authenticated attacker can fabricate consent records for any known user UUID.

**Attack Path:**
```
attacker.browser.console →
  import { recordSignupConsent } from '@/features/legal/adapters/legal.adapter'
  recordSignupConsent({ userId: '<victim-uuid>' })
    → dalRecordLegalAcceptance({ user_id: '<victim-uuid>', accepted: true, ... })
      → platform.user_consents INSERT succeeds (no WITH CHECK block)
```

**Source Citations:**
- `apps/VCSM/src/features/legal/adapters/legal.adapter.js:6` — direct export
- `apps/VCSM/src/features/legal/dal/userConsents.write.dal.js:33` — `user_id: userId`
- `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:131-146` — no auth.getUser()
- `apps/VCSM/supabase/migrations/20260510030000_user_consents_immutability_and_grant.sql:11` — GRANT INSERT, no WITH CHECK

**THOR Blocker:** YES — legal consent records are a legal compliance artifact.

**Cross-reference:** Extends VEN-LEGAL-001 and VEN-LEGAL-004 with confirmed adversarial path.

---

### BW-LEGAL-002 — Open Redirect + Tabnapping via DB-Controlled content_url

- **Severity:** HIGH
- **Result:** BYPASSED
- **Exploit Chain:** Multi-step
- **Provenance:** [SOURCE_VERIFIED]

**Description:** `ConsentGateScreen.jsx:55-61` passes `action.content_url` (DB-sourced) directly to React Router `<Link to={getDocRoute(action)}>` at lines 98, 123, and 135. All three `<Link>` instances use `target="_blank"` with no `rel="noopener noreferrer"` (`ConsentGateScreen.jsx:99,124,136`). An external `content_url` would:
1. Navigate users during the consent gate flow to an attacker-controlled domain (phishing in highest-trust context).
2. Allow the opened tab to call `window.opener.location = 'https://phish.com'`, redirecting the consent gate itself (tabnapping).

The `legalDocsCache` TTL of 60 seconds (`legalConsent.controller.js:10`) means a malicious URL persists across users within the cache window.

**Source Citations:**
- `apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx:55-61` — no URL validation
- `apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx:99` — `target="_blank"` (no rel)
- `apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx:124` — `target="_blank"` (no rel)
- `apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx:136` — `target="_blank"` (no rel)
- `apps/VCSM/src/features/legal/engine/legalCompliance.engine.js:93` — content_url propagated
- `apps/VCSM/src/features/legal/dal/legalDocuments.read.dal.js:13` — content_url selected

**THOR Blocker:** YES — affects all users traversing the mandatory consent gate.

**Cross-reference:** Extends VEN-LEGAL-002 with newly confirmed tabnapping vector.

---

### BW-LEGAL-003 — Duplicate Consent Row Insertion (No ON CONFLICT Guard)

- **Severity:** MEDIUM
- **Result:** PARTIAL (no security bypass; legal audit integrity gap)
- **Exploit Chain:** Replay
- **Provenance:** [SOURCE_VERIFIED]

**Description:** `dalRecordLegalAcceptance` at `userConsents.write.dal.js:30-44` performs a plain INSERT with no `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`. No unique constraint on `(user_id, consent_type, consent_version)` or `(user_id, legal_document_id)` is visible in the migration tree. Concurrent calls (dual tabs, `Promise.all` race, retry logic) can insert duplicate rows. `buildConsentComplianceStatus` takes the latest row per type, so the compliance check remains correct. However, duplicate rows pollute the legal audit trail, complicating GDPR/CCPA consent evidence retrieval.

**Source Citations:**
- `apps/VCSM/src/features/legal/dal/userConsents.write.dal.js:30-44` — plain INSERT
- `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:103-117` — Promise.all inserts in parallel per document
- `apps/VCSM/src/features/legal/engine/legalCompliance.engine.js:26-29` — takes latest row (duplicate-tolerant)

**THOR Blocker:** NO (no security bypass; governance concern).

---

### BW-LEGAL-004 — No Input Validation for userId in Controller Entry Points

- **Severity:** MEDIUM
- **Result:** PARTIAL (fail-closed on null; DB error surface exposed)
- **Exploit Chain:** Single-step
- **Provenance:** [SOURCE_VERIFIED]

**Description:** Controllers `recordSignupConsent`, `recordLegalAcceptance`, and `resolveLegalGateForSession` accept `userId` as a parameter with no presence or type validation before proceeding to DB operations. A null userId would propagate to the DAL, generating a DB error rather than a clean rejection. A caller passing `userId: undefined` receives a Supabase PostgREST error message surfaced to the UI (or caught by the hook's error handler). The controller API contract communicates no requirement for non-null userId, increasing future-caller confusion risk.

**Source Citations:**
- `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:131` — `recordSignupConsent({ userId })` no guard
- `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:157` — `resolveLegalGateForSession({ userId })` no guard
- `apps/VCSM/src/features/auth/hooks/useRegister.js:138` — `result?.userId ?? null` (null passable)

**THOR Blocker:** NO.

---

### BW-LEGAL-005 — Consent Cache Not Invalidated on User Logout

- **Severity:** MEDIUM
- **Result:** PARTIAL (no cross-user leak; stale consent data survives up to 90s after logout)
- **Exploit Chain:** Cache
- **Provenance:** [SOURCE_VERIFIED]

**Description:** `consentCache` (TTL: 90s, `legalConsent.controller.js:11`) and `legalDocsCache` (TTL: 60s, `legalConsent.controller.js:10`) are module-level singletons. Neither cache is invalidated during the logout flow (`AuthProvider.jsx:165-212`). `bootstrap.invalidate.js` provides `invalidateBootstrap()`, `purgeChatMessageCache()`, and `purgeNotificationCache()` but no legal cache invalidation. `invalidateConsentCache` and `invalidateLegalDocsCache` are defined but never called from the logout path.

The consent cache is keyed by `${userId}:${appId}` — so User A's cached consent data is not accessible to User B (no cross-user leak). However, User A's consent cache persists in the module-level Map for up to 90 seconds after logout, consuming memory and holding stale legal state. On a shared device where User B logs in immediately after User A, User B's useLegalConsent hook would trigger a fresh DB query (different cache key), so there is no functional security bypass.

The legalDocsCache is shared (same VCSM_APP_KEY for all users) — this is not a concern as it contains only public document metadata.

**Source Citations:**
- `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:10-11` — module-level caches
- `apps/VCSM/src/app/providers/AuthProvider.jsx:165-212` — logout, no legal cache call
- `apps/VCSM/src/bootstrap/bootstrap.invalidate.js` — no legal cache reference

**THOR Blocker:** NO (no cross-user leak; hygienic cleanup gap only).

---

### BW-LEGAL-006 — Missing BEHAVIOR.md Contract (Governance Gap)

- **Severity:** LOW
- **Result:** UNRESOLVED
- **Exploit Chain:** N/A
- **Provenance:** [SOURCE_VERIFIED]

**Description:** `BEHAVIOR.md` at `ZZnotforproduction/APPS/VCSM/features/legal/BEHAVIOR.md` is a PLACEHOLDER with no §4 Failure Paths, §5 Security Rules, or §9 Must Never Happen invariants. All security properties verified in this review are source-inferred, not contract-anchored. This means:
1. Future engineers have no authoritative specification for what this feature must never do.
2. THOR cannot perform contract-gated release checks against this feature.
3. BW §9 Invariant Attack Map cannot be executed with full coverage.

**Source Citations:**
- `ZZnotforproduction/APPS/VCSM/features/legal/BEHAVIOR.md:1-9` — PLACEHOLDER, no content

**THOR Blocker:** NO (governance gap; not a runtime security failure).

---

### BW-LEGAL-007 — target="_blank" Without rel="noopener noreferrer"

- **Severity:** LOW
- **Result:** BYPASSED (tabnapping enabled when content_url is external)
- **Exploit Chain:** Multi-step (requires BW-LEGAL-002 precondition)
- **Provenance:** [SOURCE_VERIFIED]

**Description:** All three `<Link target="_blank">` elements in `ConsentGateScreen.jsx` (lines 99, 124, 136) are missing `rel="noopener noreferrer"`. When `content_url` is an external URL (the BW-LEGAL-002 precondition), the opened page retains `window.opener` access to the consent gate tab. This enables the classic tabnapping attack: the attacker's page calls `window.opener.location = '<phishing_url>'` while the user reads the "document" in the new tab, then returns to a cloned VCSM login page. Even with same-origin content_url values (e.g., Supabase storage), `rel="noopener"` is a defense-in-depth best practice for any `target="_blank"` link.

**Source Citations:**
- `apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx:99` — `target="_blank"` (no rel)
- `apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx:124` — `target="_blank"` (no rel)
- `apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx:136` — `target="_blank"` (no rel)

**THOR Blocker:** NO as standalone; YES when combined with BW-LEGAL-002 precondition.

---

### BW-LEGAL-008 — Empty-Docs Cache Bypass Guard Undocumented (INFO)

- **Severity:** INFO
- **Result:** BLOCKED (correct behavior; documentation gap only)
- **Exploit Chain:** N/A
- **Provenance:** [SOURCE_VERIFIED]

**Description:** `getActiveLegalDocuments()` at `legalConsent.controller.js:17-26` only caches non-empty results: `if (docs.length > 0) { legalDocsCache.set(...) }`. This is the correct defense — an empty-docs response (which could indicate a DB failure or misconfiguration) is never cached, forcing each call to retry the DB. However, this behavior is undocumented in `BEHAVIOR.md`, creating a risk that a future refactoring removes the guard without recognizing its security significance.

**Source Citations:**
- `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:22-24` — conditional cache set

**THOR Blocker:** NO.

---

## 9. Source Verification Summary

| File | Read | Findings Supported |
|---|---|---|
| `controllers/legalConsent.controller.js` | YES | BW-001 (no auth.getUser), BW-004 (no userId guard), BW-005 (cache no logout clear), BW-008 (empty-docs guard) |
| `controllers/legalDocument.controller.js` | YES | No findings |
| `dal/userConsents.write.dal.js` | YES | BW-001 (userId param), BW-003 (no ON CONFLICT) |
| `dal/userConsents.read.dal.js` | YES | Category E (fail-closed on null userId) |
| `dal/legalDocuments.read.dal.js` | YES | BW-002 (content_url selected) |
| `dal/getPublicIp.dal.js` | YES | No new BW findings |
| `adapters/legal.adapter.js` | YES | BW-001 (recordSignupConsent direct export) |
| `hooks/useLegalConsent.js` | YES | Category E (null guard in hook), BW-005 |
| `hooks/useSignupConsent.js` | YES | BW-001 (re-exports without session check) |
| `hooks/useLegalDocument.js` | YES | No findings |
| `engine/legalCompliance.engine.js` | YES | BW-002 (content_url propagated), BW-003 (duplicate-tolerant) |
| `screens/ConsentGateScreen.jsx` | YES | BW-002 (no URL validation), BW-007 (no rel) |
| `screens/LegalDocumentScreen.jsx` | YES | No findings |
| `migrations/20260510030000_*` | YES | BW-001 (INSERT grant, no WITH CHECK) |
| `app/providers/AuthProvider.jsx` | YES | BW-005 (logout, no legal cache call) |
| `bootstrap/bootstrap.invalidate.js` | YES | BW-005 (no legal cache functions) |
| `auth/hooks/useRegister.js` | YES | BW-001 (userId source), BW-004 (null passable) |
| `join/controllers/joinBarbershopAccount.controller.js` | YES | BW-001 (recordSignupConsent caller) |
| `shared/lib/ttlCache.js` | YES | BW-005 (module-level singleton) |
| `ZZnotforproduction/.../BEHAVIOR.md` | YES | BW-006 (PLACEHOLDER) |
| `ZZnotforproduction/.../SECURITY.md` | YES | VEN findings cross-referenced |

---

## 10. Confidence Summary

| Finding | Confidence Level | Basis |
|---|---|---|
| BW-LEGAL-001 | HIGH | Source read + migration verified |
| BW-LEGAL-002 | HIGH | Source read + three line citations |
| BW-LEGAL-003 | HIGH | Source read confirmed |
| BW-LEGAL-004 | MEDIUM | Source read; DB error behavior inferred |
| BW-LEGAL-005 | HIGH | Source read + logout path traced |
| BW-LEGAL-006 | HIGH | BEHAVIOR.md read |
| BW-LEGAL-007 | HIGH | Source read; three line citations |
| BW-LEGAL-008 | HIGH | Source read |

Scanner Attribution Gaps:
- Security paths have `feature: null` — all 6 paths are LOW confidence per Rule BW-002.
- Write-execution-map: 0 entries for legal — source analysis required and performed.
- 0 RPCs; 0 edge functions — no RPC or edge function attack surface exists.

---

## 11. §9 Invariant Attack Map

| # | Source-Inferred Invariant | Attack Attempted | Result |
|---|---|---|---|
| I1 | Unauthenticated user cannot bypass consent gate | Manipulate useLegalConsent to return false requiresConsent | BLOCKED (fail-closed on error) |
| I2 | User with no consent records must not be admitted | Pass empty userConsents to buildConsentComplianceStatus | BLOCKED (returns isCompliant: false) |
| I3 | User must not be admitted when DB is unreachable | Simulate DB error in getActiveLegalDocuments | BLOCKED (throw propagated → gate blocked) |
| I4 | Consent records must be immutable after insert | Attempt UPDATE via application layer | BLOCKED (no update path; dual DB protection) |
| I5 | Consents must not reference non-existent document IDs | Pass fabricated legal_document_id via acceptRequiredConsents | UNRESOLVED (DB FK constraint likely blocks; not verified from migration tree) |

§9 invariant attack is INCOMPLETE due to PLACEHOLDER BEHAVIOR.md. All 5 invariants above are source-inferred. 0 formal §9 invariants were defined.

---

## 12. Behavior Contract Attack Summary

**Status:** PLACEHOLDER — all §9 invariants UNANCHORED.

**Implication:** The consent gate and consent write path have demonstrably correct fail-closed behavior (confirmed by adversarial testing), but without a written contract, these properties are not governed. Future engineering changes to the gate or cache logic could break the invariants without any contract violation being detectable.

**Recommendation:** Write BEHAVIOR.md §9 Must Never Happen to anchor the four BLOCKED invariants confirmed above. This is prerequisite for future BW reviews to yield full §9 coverage.

---

## 13. THOR Impact

| Finding | Severity | THOR Blocker | Rationale |
|---|---|---|---|
| BW-LEGAL-001 | HIGH | YES | Consent record fabrication undermines legal compliance proof chain |
| BW-LEGAL-002 | HIGH | YES | Phishing/tabnapping attack during mandatory consent gate |
| BW-LEGAL-003 | MEDIUM | NO | Audit trail pollution; no security bypass |
| BW-LEGAL-004 | MEDIUM | NO | Fail-closed behavior maintained; controller hygiene gap |
| BW-LEGAL-005 | MEDIUM | NO | Stale memory; no cross-user leak |
| BW-LEGAL-006 | LOW | NO | Governance gap |
| BW-LEGAL-007 | LOW | NO standalone | YES when combined with BW-LEGAL-002 precondition (same fix) |
| BW-LEGAL-008 | INFO | NO | Defense correctly implemented; documentation only |

**THOR Release Block Count:** 2 (BW-LEGAL-001, BW-LEGAL-002)

**Combined with existing VENOM blockers:** VEN-LEGAL-001 is the same root cause as BW-LEGAL-001. These should be resolved as a single fix (DB RLS INSERT WITH CHECK + controller auth.getUser() cross-check).

---

## 14. SPIDER-MAN Test Requirements

| Test | Priority | What to Verify |
|---|---|---|
| T-BW-001 | P0 | `dalRecordLegalAcceptance` with userId !== auth.uid() must throw after DB RLS policy is added |
| T-BW-002 | P0 | `recordSignupConsent({ userId: 'other-uuid' })` must be rejected at controller layer after cross-check is added |
| T-BW-003 | P1 | `getDocRoute(action)` with `content_url = 'https://evil.com'` must return internal fallback path, not the external URL |
| T-BW-004 | P1 | All `<Link target="_blank">` in ConsentGateScreen must have `rel="noopener noreferrer"` |
| T-BW-005 | P2 | `dalRecordLegalAcceptance` called twice with same userId+documentId must not insert duplicate rows (after ON CONFLICT guard added) |
| T-BW-006 | P2 | `recordSignupConsent({ userId: null })` must throw a validation error, not a DB error |
| T-BW-007 | P2 | Consent cache must be cleared on user logout (call invalidateConsentCache from logout path) |
| T-BW-008 | P3 | `buildConsentComplianceStatus` with empty userConsents must return isCompliant: false |

---

*Generated by BLACKWIDOW V2 — BW2.5 V2 Protocol*
*Feature: legal | App: VCSM | Date: 2026-06-04*
*Output: ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_legal-adversarial-review.md*
