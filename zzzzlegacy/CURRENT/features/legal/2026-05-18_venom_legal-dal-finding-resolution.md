# VENOM — Legal DAL Finding Resolution Audit
**Date:** 2026-05-18
**Scope:** `apps/VCSM/src/features/legal/` — resolution status of all 9 findings from `2026-05-10_venom_terms-of-service-logic.md`
**Auditor:** VENOM (read-only — no files modified)
**Trigger:** CEREBRO classification pass on `vcsm.dal.legal.md` found stale AvengersAssemble claims about VENOM coverage and finding status
**Input:** Source files verified by direct read; no runtime query available

---

## Context

The AvengersAssemble run of 2026-05-11 recorded that:
- "Security report (April 13, 2026) predates the current gate implementation"
- "No VENOM analysis exists for this critical flow"
- "RLS enforcement status is not documented in the security report"

**All three claims are false.** The VENOM report `2026-05-10_venom_terms-of-service-logic.md` predates the AvengersAssemble by one day, covers the consent gate in full (9 findings), and documents RLS extensively. These stale claims must be corrected in the DAL document.

This audit verifies which of the 9 original VENOM findings are resolved, still open, or partially mitigated in the current codebase.

---

## Finding Resolution Status

### FINDING 1 — Gate Fails Open on Error
**Original Severity:** CRITICAL
**Location:** `useLegalConsent.js` lines 39–44 (original report)

**Current Code (`useLegalConsent.js`):**
```
} catch (err) {
  if (!cancelled) {
    setGateError(err.message ?? 'Consent check failed')
    setRequiresConsent(true)   // ← fails CLOSED
    setRequiredActions([])
  }
}
```
`ConsentGateScreen.jsx` renders a "Verification Unavailable" block with retry affordance when `gateError` is set. User is blocked, not admitted.

**Status: RESOLVED ✓**
The gate now fails CLOSED on any error. The recovery UI ("Try Again") is implemented. The original fail-open behavior is gone.

---

### FINDING 2 — syntheticAdultBirthdate Writes Fake is_adult to DB
**Original Severity:** CRITICAL
**Location:** `joinBarbershopAccount.controller.js` (original report)

**Verification:**
```
grep -rn "syntheticAdultBirthdate" apps/VCSM/src  → 0 results
```
The function `syntheticAdultBirthdate()` does not exist in any source file. The current `joinBarbershopAccount.controller.js` has no age/birthdate/is_adult operations in its signup flow.

**Status: RESOLVED ✓**
Synthetic age data write removed from codebase.

---

### FINDING 3 — No Tracked INSERT GRANT; No Immutability on user_consents
**Original Severity:** HIGH
**Location:** `platform.user_consents` RLS policies

**Verification:**
Migration `apps/VCSM/supabase/migrations/20260510030000_user_consents_immutability_and_grant.sql` exists in the production migrations folder. It includes:
- `GRANT INSERT ON platform.user_consents TO authenticated` ✓
- `CREATE POLICY user_consents_deny_update ... AS RESTRICTIVE ... USING (false)` ✓
- `CREATE POLICY user_consents_deny_delete ... AS RESTRICTIVE ... USING (false)` ✓
- `trg_prevent_consent_audit_mutation` trigger blocking mutation of `user_id`, `legal_document_id`, `accepted_at`, `accepted` ✓

**Status: RESOLVED ✓** (assuming migration has been applied to the live DB — cannot verify at runtime)
**Caveat:** Live DB application cannot be confirmed statically. The migration is tracked and in the production folder. If the DB was ever reset without replaying migrations, this may not be applied.

---

### FINDING 4 — IP/Locale/User-Agent Client-Supplied
**Original Severity:** HIGH
**Location:** `getPublicIp.dal.js`, `legalConsent.controller.js`

**Verification:**
- `getPublicIp.dal.js` is intentionally dead — zero importers, zero callers.
- `ip_address` is excluded from the `dalRecordLegalAcceptance` insert. JSDoc confirms: "ip_address is intentionally omitted — must be captured server-side, not from the client."
- `locale` and `user_agent` are still client-supplied (`navigator.language`, `navigator.userAgent`) and passed to the insert as informational fields.
- Server-side IP capture via Supabase Edge Function: **OPEN CARNAGE TASK** — not yet implemented.

**Status: PARTIALLY MITIGATED**
- `ip_address`: MITIGATED — omitted from all writes. No false IP data in DB.
- `locale` / `user_agent`: STILL CLIENT-SUPPLIED — low evidentiary value, informational only.
- Carnage task for server-side IP: **OPEN**.

---

### FINDING 5 — accepted_at Set From Client Clock
**Original Severity:** MEDIUM
**Location:** `userConsents.write.dal.js` line 41 (original report)

**Current Code (`userConsents.write.dal.js`):**
The insert payload does not include `accepted_at`. JSDoc explicitly states:
> "accepted_at is intentionally omitted — DB DEFAULT now() provides server-authoritative time."

The `select('id, accepted_at')` at the end returns the DB-generated timestamp, not a client-supplied one.

**Status: RESOLVED ✓**
`accepted_at` is now DB-authoritative. Client clock manipulation cannot affect the consent timestamp.

---

### FINDING 6 — Barbershop Route Unregistered (Latent)
**Original Severity:** HIGH (latent — activates on route wiring)
**Location:** Routes/index.jsx, JoinSignupForm.jsx, joinBarbershopAccount.controller.js

**Verification (route registration):**
```
grep -rn "barbershop\|JoinBarbershop" apps/VCSM/src/app/routes  → 0 results
```
The `/join/barbershop/:token` route is **still not registered**. The feature remains dormant.

**Pre-fixes verified for when the route IS wired:**
- Consent recording: `signUpForBarbershopInvite` calls `recordSignupConsent` after account creation ✓
- Synthetic age: Removed (Finding 2 resolved) ✓
- Dead ToS/Privacy links: `JoinSignupForm.jsx` now uses `/legal/terms-of-service` and `/legal/privacy-policy` ✓

**Status: ROUTE STILL DORMANT — Pre-fixes complete**
The route remains unregistered. The three sub-issues that would have been activated are all pre-fixed. When the route is wired, no consent, age, or link gaps will fire based on current code state. The latent risk is now LOW (not HIGH) because all gap conditions are resolved.

**Remaining action before route can go live:** Route must be registered in a public route file. No code changes needed beyond the route registration itself.

---

### FINDING 7 — Age Attestation No Independent DB Record
**Original Severity:** HIGH
**Location:** `ConsentGateScreen.jsx`, `platform.user_consents` schema

**Verification:**
- Migration `20260510040000_age_verification_consent_type.sql` in production migrations:
  - Adds `age_verification` to `user_consents_consent_type_check` ✓
  - Seeds `age_verification` legal document for the VCSM app ✓
- `ConsentGateScreen.jsx` handles `age_verification` consent_type with `/legal/age-verification` routing ✓
- `recordSignupConsent` calls `getActiveLegalDocuments()` which returns ALL active documents including the age_verification document if seeded ✓
- `LegalDocumentScreen.jsx` renders `AgeVerificationContent.jsx` for `document_type = 'age_verification'` ✓

**Status: RESOLVED ✓** (assuming migrations applied and age_verification document is active in DB)
Age attestation is now a separate, independently auditable consent row.

---

### FINDING 8 — Empty Active Documents Returns ALLOW_ACCESS
**Original Severity:** MEDIUM
**Location:** `legalConsent.controller.js` lines 174–178 (original report)

**Current Code (`resolveLegalGateForSession`):**
```js
if (activeDocs.length === 0) {
  throw new Error('No active legal documents configured. Platform setup required.')
}
```
This throw is caught by `useLegalConsent` and results in `setGateError` + `setRequiresConsent(true)` — fails CLOSED.

**Status: RESOLVED ✓**
Empty docs now fails the gate closed with an error state, not a passthrough.

---

### FINDING 9 — Consent Cache Keyed Only by userId
**Original Severity:** LOW
**Location:** `legalConsent.controller.js` (consent cache)

**Current Code:**
```js
const cacheKey = `${userId}:${appId}`
```
Verified at line 38 of `legalConsent.controller.js`. The invalidation function also accepts `userId` + `appId` pair.

**Status: RESOLVED ✓**

---

## Finding Resolution Summary

| # | Finding | Original Severity | Current Status |
|---|---------|-------------------|----------------|
| 1 | Gate fails open on error | CRITICAL | RESOLVED ✓ |
| 2 | syntheticAdultBirthdate writes fake is_adult | CRITICAL | RESOLVED ✓ |
| 3 | No INSERT GRANT; no immutability | HIGH | RESOLVED (tracked migration) ✓ |
| 4 | IP/locale/user_agent client-supplied | HIGH | PARTIAL — ip omitted; locale/UA still client |
| 5 | accepted_at from client clock | MEDIUM | RESOLVED ✓ |
| 6 | Barbershop route unregistered (latent) | HIGH (latent) | DORMANT — route still dead; all sub-fixes complete |
| 7 | Age attestation no DB record | HIGH | RESOLVED (migration + code) ✓ |
| 8 | Empty docs returns ALLOW_ACCESS | MEDIUM | RESOLVED ✓ |
| 9 | Cache key collision (userId only) | LOW | RESOLVED ✓ |

**Resolved:** 7 of 9 findings
**Open:** 1 (F4 — server-side IP Carnage task)
**Dormant/Low:** 1 (F6 — route still unregistered; risk reduced from HIGH latent to LOW dormant)

---

## Stale Claims in vcsm.dal.legal.md — Corrections Required

The following claims in the AvengersAssemble 2026-05-11 section of `vcsm.dal.legal.md` are false and must be corrected by LOGAN:

| Location in DAL Doc | Stale Claim | Truth |
|---|---|---|
| AvengersAssemble § VENOM | "Security report (April 13, 2026) predates the current gate implementation" | VENOM report is dated 2026-05-10 |
| AvengersAssemble § VENOM | "No VENOM analysis exists for this critical flow" | Full 9-finding VENOM report covers the consent gate |
| AvengersAssemble § VENOM | "RLS enforcement status is not documented in the security report" | RLS documented in VENOM F3 and QA §2/§6 |
| Cross-System Contradictions | "Consent gate is a high-coverage security surface with no VENOM review" | VENOM reviewed it with 9 findings |
| Documentation Truth Review | "`vcsm-security-report.md` — GAP — No coverage of consent gate security surface" | Coverage exists in VENOM report |
| Proposed Updates | "vcsm-security-report.md — Create `.v2.md` adding VENOM gap note" | MOOT — VENOM coverage exists |
| Codex Fix Pass | "Consent gate lacks targeted VENOM security review — DEFERRED" | VENOM done 2026-05-10 |

---

## Open Items Post-Resolution

| Item | Severity | Owner | Notes |
|---|---|---|---|
| Server-side IP capture via Edge Function | MEDIUM | CARNAGE | `ip_address` safely omitted for now; task must ship before Edge Function activates |
| Barbershop route registration | LOW (dormant) | Wolverine | Route dead; all consent/age/link pre-fixes complete; wiring is safe |
| locale / user_agent still client-supplied | LOW | Informational | No evidentiary use claimed; no blocking concern |

---

## Verdict

**CONSENT GATE: SECURITY-SOUND** — The critical fail-open, synthetic age write, immutability gap, and timestamp manipulation vectors are all resolved. The consent system fails closed on error, records all three attestation types (ToS, Privacy, Age), uses DB-authoritative timestamps, and has immutable audit rows at the DB layer.

**REMAINING OPEN:** Server-side IP capture is the only substantive open security item. It is not release-blocking given that `ip_address` is omitted entirely (no false data, no audit trail claim for IP currently). It becomes important before any regulatory audit of consent records.
