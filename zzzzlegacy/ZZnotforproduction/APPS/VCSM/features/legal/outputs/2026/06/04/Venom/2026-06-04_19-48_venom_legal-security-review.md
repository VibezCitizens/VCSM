# VENOM V2 Security Review — legal

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | legal |
| App | VCSM |
| Reviewer | VENOM |
| Review Version | V2 |
| Date | 2026-06-04 |
| Time | 19:48 |
| Scanner Preflight | ALL PASS |
| Behavior Contract | PLACEHOLDER — no §5 or §9 rules defined |
| Existing SECURITY.md | NOT FOUND — created this run |
| Total Findings | 4 |
| Severity Breakdown | 0 CRITICAL, 1 HIGH, 2 MEDIUM, 1 LOW |
| THOR Release Blocker | YES — VEN-LEGAL-002 |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At                 | Age | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z    | <1h | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z    | <1h | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z    | <1h | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z    | <1h | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z    | <1h | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z    | <1h | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z    | <1h | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z    | <1h | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

```json
{
  "writeSurfaces": [
    {
      "operation": "insert",
      "schema": "platform",
      "table": "user_consents",
      "rpc": null,
      "functionName": null,
      "function": "dalRecordLegalAcceptance",
      "confidence": "HIGH",
      "owner": "VCSM:legal",
      "layer": "dal",
      "path": "apps/VCSM/src/features/legal/dal/userConsents.write.dal.js"
    }
  ],
  "rpcs": [],
  "securityPaths": [],
  "writeExecutionPaths": [],
  "rpcExecutionPaths": [],
  "edgeFunctions": [],
  "counts": { "writes": 1, "rpcs": 0, "paths": 0, "edgeFunctions": 0 }
}
```

---

## 4. Security Surface Inventory

| Surface | Type | Table/View | Layer | Confidence |
|---|---|---|---|---|
| dalRecordLegalAcceptance | INSERT | platform.user_consents | DAL | HIGH |
| dalGetUserConsents | SELECT | platform.user_consents | DAL | SCANNER_LEAD (read surface) |
| dalGetActiveLegalDocuments | SELECT | platform.public_legal_documents_v | DAL | SCANNER_LEAD (read surface) |
| dalGetLegalDocument | SELECT | platform.public_legal_documents_v | DAL | SCANNER_LEAD (read surface) |
| getPublicIp | External Fetch | api.ipify.org | DAL (inactive) | SOURCE_VERIFIED |
| ConsentGateScreen (getDocRoute) | UI Redirect | content_url from DB | Screen | SOURCE_VERIFIED |

**Additional surfaces discovered during source inspection (not in scanner output):**
- `recordSignupConsent` — exported via adapter, called by `useRegister` and `joinBarbershopAccount.controller.js`
- `acceptRequiredConsents` — called by `useLegalConsent` hook which runs inside `ProtectedRoute`
- `resolveLegalGateForSession` — gate evaluation, called by `useLegalConsent`

---

## 5. Scanner Signals Block

| Signal | Count | Notes |
|---|---|---|
| Write Surfaces | 1 | platform.user_consents INSERT |
| RPCs | 0 | None |
| Security Paths | 0 | No edge function paths found |
| Edge Functions | 0 | IP capture edge function not yet built (Carnage task) |
| Execution Paths | 0 | No automated path traces |

Scanner produced one write surface. Source inspection revealed 3 additional read surfaces plus an open redirect risk in screen layer and a dead-code external fetch file.

---

## 6. Behavior Contract Status Block

| Field | Status |
|---|---|
| BEHAVIOR.md | EXISTS |
| Contract Completeness | PLACEHOLDER — all sections missing |
| §5 Security Rules | NOT DEFINED (0 rules) |
| §9 Must Never Happen | NOT DEFINED (0 invariants) |
| Cross-check result | CANNOT VERIFY — no contract rules to check against |

**BEHAVIOR.md contents:** File exists at `/Users/vcsm/Desktop/VCSM/ZZnotforproduction/APPS/VCSM/features/legal/BEHAVIOR.md` but contains only a placeholder ("Status: PLACEHOLDER / Behavior contract pending source review"). No §5 Security Rules or §9 Must Never Happen invariants are present.

This means every security property verified in this report was derived from source code inspection alone, not from a defined contract. The contract gap is itself a governance finding.

---

## 7. Trust Boundary Findings

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-LEGAL-001
- **Location:** `apps/VCSM/src/features/legal/dal/userConsents.write.dal.js:30-48` / `apps/VCSM/supabase/migrations/20260510030000_user_consents_immutability_and_grant.sql:11`
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table — platform.user_consents
- **Trust Boundary:** Authenticated PWA session
- **Boundary Violated:** Authenticated user can insert consent rows for any `user_id` — no DB-level WITH CHECK policy restricts the insert to `auth.uid()`
- **Contract Violated:** Consent records must be owned and scoped to the authenticated user; a user must not be able to fabricate consent records for another user's identity
- **Current behavior:** `dalRecordLegalAcceptance` accepts a `userId` parameter and inserts it as `user_id` in the DB. Migration `20260510030000` issues `GRANT INSERT ON platform.user_consents TO authenticated` with no accompanying INSERT RLS policy that asserts `WITH CHECK (user_id = auth.uid())`. Any authenticated user can call this DAL with an arbitrary `userId` and insert a consent row attributing that consent to any other user's account.
- **Risk:** Attacker could mark another user as consented (e.g., after account takeover or with a known UUID), or could fabricate consent records in bulk for user IDs they do not own. Could also be used to clear a revocation-based compliance hold by inserting a new consent row for a targeted victim.
- **Severity:** HIGH
- **Exploitability:** MEDIUM — requires an authenticated session and knowledge of target user UUIDs; UUIDs are not guessable but may be inferrable from other platform surfaces (profiles, social graph)
- **Attack Preconditions:** Valid Supabase session token; knowledge of target user's `auth.users.id`
- **Blast Radius:** Legal/compliance integrity across all user accounts; all consent types (ToS, Privacy Policy, Age Verification)
- **Identity Leak Type:** None (write-side impersonation, not read-side leak)
- **Cache Trust Type:** None
- **RLS Dependency:** REQUIRED but UNVERIFIED — INSERT GRANT exists; no INSERT WITH CHECK policy constraining `user_id = auth.uid()` found in any migration
- **Why it matters:** Consent records are legal audit artifacts. Fabricated consent nullifies their legal evidentiary value for GDPR, CCPA, and COPPA compliance. In a legal dispute, fabricated rows would undermine the platform's ability to demonstrate meaningful user consent.
- **Recommended mitigation:** Add an RLS INSERT policy: `CREATE POLICY user_consents_insert_own ON platform.user_consents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());` This enforces that even if a caller passes a different `userId`, the DB will reject it.
- **Rationale:** The existing immutability trigger (`trg_prevent_consent_audit_mutation`) and the deny-update/deny-delete policies are strong, but they only protect existing rows. The missing WITH CHECK on INSERT means a malicious authenticated caller can create fraudulent rows before the immutability trigger can protect them.
- **Follow-up command:** Carnage (migration), DB (live policy verification)
- **Provenance:** SOURCE_VERIFIED — confirmed by reading migration `20260510030000_user_consents_immutability_and_grant.sql` line 11 (GRANT INSERT, no WITH CHECK policy) and DAL `userConsents.write.dal.js` lines 30-48 (userId is caller-supplied parameter)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Legal, Risk and Compliance

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-LEGAL-002
- **Location:** `apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx:55-61` / `apps/VCSM/src/features/legal/engine/legalCompliance.engine.js:93`
- **Application Scope:** VCSM
- **Platform Surface:** PWA — React UI rendering
- **Trust Boundary:** Authenticated user viewing the consent gate
- **Boundary Violated:** `content_url` field sourced from DB is passed directly to React Router `<Link to={...}>` without validation, enabling open redirect to arbitrary external URLs
- **Contract Violated:** User-facing links in authentication/consent flows must be scoped to trusted destinations; DB-controlled values must not be rendered as navigation targets without sanitization
- **Current behavior:** `getDocRoute(action)` at `ConsentGateScreen.jsx:55-61` returns `action.content_url` directly if present. `content_url` is fetched from `platform.public_legal_documents_v` (a DB view) and threaded through the compliance engine into `requiredActions`. The React Router `<Link to={getDocRoute(action)}>` at lines 98, 123, 135 renders this value as the `to` prop. React Router's `<Link to>` accepts full URLs including `http://`, `https://`, and protocol-relative paths. A malicious or misconfigured `content_url` in the DB legal document record would redirect consenting users to arbitrary external destinations during the mandatory consent gate flow.
- **Risk:** Phishing vector during the highest-trust moment in the auth flow (the gate that blocks platform entry). An attacker who can write to `platform.legal_documents` (e.g., via a compromised admin credential or a SQL injection in a related surface) could redirect users to a credential-harvesting site. Even without an attacker: a misconfigured or typo'd URL in the DB could silently break the consent flow for all users.
- **Severity:** MEDIUM
- **Exploitability:** LOW — requires write access to `platform.legal_documents` (not available to regular authenticated users); however, the impact when exploited is severe due to the trust context
- **Attack Preconditions:** Write access to `platform.legal_documents.content_url` (admin or service role)
- **Blast Radius:** All users traversing the consent gate; entire platform onboarding funnel
- **Identity Leak Type:** None
- **Cache Trust Type:** DB value cached in `legalDocsCache` (60s TTL) — a malicious URL would persist for up to 60 seconds across sessions
- **RLS Dependency:** NONE (read-side display issue)
- **Why it matters:** The consent gate is the last line of defense before platform access. It is where users make trust decisions. Redirecting users from this screen to an attacker-controlled page is a textbook phishing attack with very high click-through likelihood.
- **Recommended mitigation:** Add a URL allowlist guard in `getDocRoute`: if `content_url` starts with `http://` or `https://`, validate it against an allowed domain list (e.g., only `vibezcitizens.com` and `storage.googleapis.com`). Fall back to the hardcoded internal route on mismatch. Alternatively, never use `content_url` as a navigation target — only use it as a fetch URL for document content, and always navigate to hardcoded internal routes (`/legal/...`).
- **Rationale:** React Router `<Link to>` will follow any URL. The trust context of the consent gate means users will click these links without suspicion. A validated allowlist at the rendering layer breaks the attack chain even if the DB is compromised.
- **Follow-up command:** ELEKTRA (precise patch), SPIDER-MAN (regression test for URL validation)
- **Provenance:** SOURCE_VERIFIED — confirmed by reading `ConsentGateScreen.jsx:55-61` and tracing `content_url` from `legalDocuments.read.dal.js:13` through `legalCompliance.engine.js:93` to the screen
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Communication and Network Security

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-LEGAL-003
- **Location:** `apps/VCSM/src/features/legal/dal/getPublicIp.dal.js:1-21`
- **Application Scope:** VCSM
- **Platform Surface:** PWA — dead code file retained in source tree
- **Trust Boundary:** Client-side execution context
- **Boundary Violated:** Client-controlled IP capture is architecturally unsafe for legal audit records; retaining the implementation creates risk of accidental re-activation
- **Contract Violated:** IP addresses in consent records must be server-authoritative (comment in the file itself acknowledges this); client-controlled fields must not feed legal audit tables
- **Current behavior:** `getPublicIp.dal.js` exports `getPublicIp()` which fetches from `https://api.ipify.org?format=json`. The file header explicitly marks it "NOT CALLED — this file is retained for reference only." The function is not imported anywhere in the current codebase. However, the file exists, is importable, and the comment states a Carnage edge function task is pending to replace it. Until the edge function is built, there is no server-side IP capture at all — meaning `user_consents.ip_address` is either NULL or absent from all current inserts.
- **Risk:** Two distinct risks: (1) The dead code file is one import away from re-activating client-controlled IP capture, which would poison consent audit records with client-manipulable values. A developer unfamiliar with the context could re-add the import. (2) The absence of any IP capture means consent records currently lack this audit field entirely, weakening the legal evidentiary chain.
- **Severity:** MEDIUM
- **Exploitability:** LOW — requires a developer mistake; not directly exploitable by an end user
- **Attack Preconditions:** Developer imports the function (mistake) or consent records are reviewed in a legal context where missing IP is a compliance gap
- **Blast Radius:** All consent records; legal compliance posture for GDPR Article 7 and CCPA consent documentation requirements
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Consent records without server-verified IP addresses have weaker legal standing. Many regulatory frameworks (GDPR, CCPA) require demonstrable proof of consent that includes metadata that cannot be fabricated by the consenting party.
- **Recommended mitigation:** Either delete `getPublicIp.dal.js` entirely (with a comment in git history about the pending edge function), or rename it `getPublicIp.DEAD.js` to make its status unambiguous. Separately, prioritize the Carnage edge function task to capture IP server-side and write it to `ip_address` on the consent row.
- **Rationale:** Dead code that is "one import away" from becoming active harmful code should be removed. The file's own header admits it should not be used. Removing it eliminates the risk at zero cost.
- **Follow-up command:** Carnage (edge function for server-side IP capture), DEADPOOL (root cause analysis on why this has not been built)
- **Provenance:** SOURCE_VERIFIED — confirmed by reading `getPublicIp.dal.js:1-21` and grepping all imports across the codebase (zero callers found)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Legal, Risk and Compliance

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-LEGAL-004
- **Location:** `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:131-146`
- **Application Scope:** VCSM
- **Platform Surface:** PWA — controller exported via adapter
- **Trust Boundary:** Authenticated user (signup or join flow)
- **Boundary Violated:** `recordSignupConsent({ userId })` accepts a raw `userId` parameter and does not verify that `userId === auth.uid()` before writing consent records on behalf of that user
- **Contract Violated:** Consent recording functions must be scoped to the authenticated caller's own identity; userId passed as a parameter should be cross-checked against the live session
- **Current behavior:** `recordSignupConsent` at `legalConsent.controller.js:131` takes a `{ userId }` parameter and calls `recordLegalAcceptance` which calls `dalRecordLegalAcceptance` which inserts `user_id: userId` into the DB. The controller does not call `supabase.auth.getUser()` or otherwise verify that `userId` matches the current session identity. In `useRegister.js:137-140`, `userId` comes from `result?.userId ?? null` — the result of `ctrlRegisterAccount`. In `joinBarbershopAccount.controller.js:36`, it comes from `session.user.id`. Both current callers appear to be passing the correct session user ID, but the controller's API contract allows any caller to pass an arbitrary UUID.
- **Risk:** If a future caller passes a different `userId` (developer mistake, confused deputy, or a refactored flow that caches a stale userId), consent records would be written for the wrong user. This is a lower-severity concern than VEN-LEGAL-001 (which is the DB-level gap) but represents a defense-in-depth failure at the application layer.
- **Severity:** LOW
- **Exploitability:** LOW — not directly exploitable by an end user; requires a code-level mistake or a new caller
- **Attack Preconditions:** Developer introduces a new caller that passes an incorrect `userId`; or a refactoring introduces stale identity state
- **Blast Radius:** Individual affected user's consent record; no platform-wide blast radius from a single call
- **Identity Leak Type:** None
- **Cache Trust Type:** None (no cache involved in this path)
- **RLS Dependency:** REQUIRED — the DB-level RLS INSERT policy (when added per VEN-LEGAL-001 mitigation) would be the backstop
- **Why it matters:** Defense in depth: when VEN-LEGAL-001 is fixed at the DB layer, this application-layer check provides a second line of defense that catches programming errors before they reach the DB.
- **Recommended mitigation:** Add a session identity cross-check at the controller level. Before inserting, call `supabase.auth.getUser()` and assert `userId === session.user.id`. Throw if mismatch. This converts a latent confused-deputy risk into a loud, catchable runtime error.
- **Rationale:** Application-layer identity checks should always complement DB-layer policies. The controller is the right place for this check — it keeps the DAL generic while adding the business rule at the correct abstraction level.
- **Follow-up command:** ELEKTRA (precise patch), SPIDER-MAN (regression test)
- **Provenance:** SOURCE_VERIFIED — confirmed by reading `legalConsent.controller.js:94-125` (no auth.getUser() call), `useRegister.js:137-140`, and `joinBarbershopAccount.controller.js:36`
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Identity and Access Management

---

## 8. Source Verification Summary

| File | Read | Verdict |
|---|---|---|
| `dal/userConsents.write.dal.js` | YES | Caller-supplied userId, no auth check in DAL |
| `dal/userConsents.read.dal.js` | YES | Reads own rows via userId param; RLS SELECT policy status unconfirmed in migrations |
| `dal/legalDocuments.read.dal.js` | YES | Reads from view (public_legal_documents_v); content_url surfaced to UI |
| `dal/getPublicIp.dal.js` | YES | Dead code; not imported anywhere |
| `controllers/legalConsent.controller.js` | YES | No session identity verification before inserts |
| `controllers/legalDocument.controller.js` | YES | Thin pass-through; no auth needed (public docs) |
| `hooks/useLegalConsent.js` | YES | Reads user.id from useAuth(); fail-closed on error |
| `hooks/useLegalDocument.js` | YES | No auth required; public document read |
| `hooks/useSignupConsent.js` | YES | Re-exports recordSignupConsent; no session check |
| `adapters/legal.adapter.js` | YES | Exports recordSignupConsent directly (cross-feature callable without hook) |
| `engine/legalCompliance.engine.js` | YES | Pure comparison logic; no security concerns |
| `screens/ConsentGateScreen.jsx` | YES | content_url passed directly to Link to= without validation |
| `app/guards/ProtectedRoute.jsx` | YES | Consent gate properly blocks unauthenticated access |
| `migrations/20260510030000_user_consents_immutability_and_grant.sql` | YES | INSERT GRANT without WITH CHECK policy — CONFIRMED |
| `migrations/20260510040000_age_verification_consent_type.sql` | YES | Consent type CHECK constraints — VERIFIED SAFE |
| `migrations/20260510050000_accepted_at_server_default.sql` | YES | Server-authoritative timestamp enforcement — VERIFIED SAFE |
| `migrations/20260503052543_fix_missing_authenticated_grants.sql` | YES | SELECT GRANT on public_legal_documents_v view — VERIFIED SAFE |

### Verified Safe Surfaces

- `dalGetActiveLegalDocuments` / `dalGetLegalDocument`: Read from `platform.public_legal_documents_v` — public view, no user data, no auth required. SELECT grant confirmed in migration 20260503052543.
- `useLegalConsent.user.id`: Sourced from `useAuth()` which wraps Supabase session; not caller-supplied.
- `legalCompliance.engine.js`: Pure function, no DB access, no side effects.
- `ConsentGateScreen` gate error path: Correctly fails closed — blocks gate entry when compliance check errors.
- `ProtectedRoute`: Correctly orders auth check → email verify → consent check → outlet.
- Consent immutability triggers (`trg_prevent_consent_audit_mutation`, `trg_enforce_server_accepted_at`): Both verified present in migrations. Strong audit protection for existing rows.
- `console.log/warn/error` calls in hooks and controllers: All wrapped in `if (import.meta.env.DEV)` — no production log leakage.

---

## 9. Confidence Summary

| Finding | Confidence | Basis |
|---|---|---|
| VEN-LEGAL-001 (no INSERT WITH CHECK) | HIGH | Read migration 20260510030000 — GRANT INSERT present, no WITH CHECK policy in any migration file |
| VEN-LEGAL-002 (open redirect via content_url) | HIGH | Read ConsentGateScreen.jsx:55-61 and traced content_url source chain |
| VEN-LEGAL-003 (dead code IP capture) | HIGH | Read getPublicIp.dal.js:1-21; confirmed zero importers via grep |
| VEN-LEGAL-004 (no session cross-check in controller) | HIGH | Read legalConsent.controller.js:94-125 and all callers |

All findings are SOURCE_VERIFIED. No findings are SCANNER_LEAD or SCANNER_LOW_CONF.

**Caveat on VEN-LEGAL-001:** The GRANT INSERT policy was confirmed absent across all tracked migrations. It is possible that an RLS INSERT WITH CHECK policy was applied directly via the Supabase SQL editor (untracked). The DB team must run `SELECT polname, polcmd FROM pg_policies WHERE schemaname = 'platform' AND tablename = 'user_consents';` to confirm live state.

---

## 10. THOR Impact

| THOR Gate | Impact |
|---|---|
| THOR Release Eligibility | BLOCKED by VEN-LEGAL-001 |
| Blocker Finding | VEN-LEGAL-001 — missing INSERT WITH CHECK RLS policy on platform.user_consents |
| Blocker Rationale | Any authenticated user can insert consent records attributing acceptance to any other user. This is a legal compliance integrity failure. Cannot release to production with this gap. |
| Non-blocker findings | VEN-LEGAL-002 (MEDIUM), VEN-LEGAL-003 (MEDIUM), VEN-LEGAL-004 (LOW) — should be addressed before release but do not independently block |
| Recommended THOR action | Hold release pending Carnage migration to add `user_consents_insert_own` WITH CHECK policy |

---

## 11. Required Follow-Up Commands

| Command | Reason | Priority |
|---|---|---|
| Carnage | Add `user_consents_insert_own` INSERT RLS WITH CHECK policy (VEN-LEGAL-001) | P0 — THOR Blocker |
| DB | Run live `pg_policies` query to confirm actual RLS state on platform.user_consents | P0 |
| ELEKTRA | Patch `getDocRoute` in ConsentGateScreen to validate content_url against allowlist (VEN-LEGAL-002) | P1 |
| Carnage | Build Edge Function for server-side IP capture; delete getPublicIp.dal.js (VEN-LEGAL-003) | P2 |
| ELEKTRA | Add session identity cross-check in recordSignupConsent / recordLegalAcceptance (VEN-LEGAL-004) | P2 |
| SPIDER-MAN | Add regression tests for consent write scoping; URL validation in ConsentGateScreen | P2 |
| Logan | Update BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen invariants | P3 |

---

## 12. MITIGATION PLAN

| ID | Severity | Description | Mitigation | Owner | Priority | Estimated Effort |
|---|---|---|---|---|---|---|
| VEN-LEGAL-001 | HIGH | No INSERT WITH CHECK RLS policy on user_consents | Carnage migration: `CREATE POLICY user_consents_insert_own ON platform.user_consents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())` | DB / Carnage | P0 | 30 min (migration + verify) |
| VEN-LEGAL-002 | MEDIUM | content_url from DB passed directly to Link to= (open redirect) | Add URL allowlist validation in `getDocRoute`; reject external URLs not matching trusted domains | ELEKTRA | P1 | 1 hour (patch + test) |
| VEN-LEGAL-003 | MEDIUM | Dead code client-IP fetch file retained; no server-side IP capture | Delete getPublicIp.dal.js; build Edge Function for server-side IP capture on consent write | Carnage | P2 | 2-4 hours (edge function) |
| VEN-LEGAL-004 | LOW | recordSignupConsent accepts caller-supplied userId without session verification | Add `supabase.auth.getUser()` identity assertion in controller before insert | ELEKTRA | P2 | 30 min |
| GOV-001 | GOVERNANCE | BEHAVIOR.md is a placeholder — no §5 or §9 rules | Write BEHAVIOR.md with actual security rules and invariants | Logan | P3 | 1 hour |

---

## 13. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---|---|
| Security and Risk Management | — | N/A for this feature |
| Asset Security | — | N/A |
| Security Architecture and Engineering | — | N/A |
| Communication and Network Security | VEN-LEGAL-002 | External URL redirect in consent gate |
| Identity and Access Management | VEN-LEGAL-001, VEN-LEGAL-004 | Missing RLS ownership enforcement; no session cross-check |
| Security Assessment and Testing | — | SPIDER-MAN follow-up recommended |
| Security Operations | — | N/A |
| Software Development Security | VEN-LEGAL-002, VEN-LEGAL-003, VEN-LEGAL-004 | Dead code risk; open redirect; controller identity gap |
| Legal, Risk and Compliance | VEN-LEGAL-001, VEN-LEGAL-003 | Fabricated consent records; missing IP audit field |

**Domain Coverage:** 4 of 8 CISSP domains touched by this feature's security surface.
