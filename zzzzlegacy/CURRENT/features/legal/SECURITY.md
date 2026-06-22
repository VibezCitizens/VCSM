# SECURITY — legal

**Last security audit:** VENOM 2026-05-10 (original); VENOM 2026-05-18 (resolution verification)
**Original findings:** 2 CRITICAL | 3 HIGH | 2 MEDIUM | 1 LOW (9 total)
**Current open findings:** 1 OPEN (F4 partial); 1 DORMANT (F6)

---

## Finding Status Summary

All original VENOM IDs use the implicit numbering from the 2026-05-10 report (FINDING 1 through FINDING 9). Resolution status verified by VENOM on 2026-05-18.

---

## RESOLVED Findings

### FINDING 1 — CRITICAL — RESOLVED
**Gate fails open on error**
- Location: `useLegalConsent.js`
- Original: catch block set `requiresConsent = false`, admitting users on any error
- Resolution (2026-05-18 verified): Gate now sets `requiresConsent = true` on error (fails closed); `ConsentGateScreen.jsx` renders "Verification Unavailable" block with retry

### FINDING 2 — CRITICAL — RESOLVED
**syntheticAdultBirthdate writes fake is_adult to DB**
- Location: `joinBarbershopAccount.controller.js`
- Original: `syntheticAdultBirthdate()` computed fake birthdate; wrote `is_adult: true` for all barbershop signups
- Resolution (2026-05-18 verified): Function does not exist in codebase; no age/birthdate/is_adult operations in signup flow

### FINDING 3 — HIGH — RESOLVED (migration tracked; live DB unconfirmed)
**No INSERT GRANT; no immutability on platform.user_consents**
- Migration: `20260510030000_user_consents_immutability_and_grant.sql` in production migrations folder
- Includes: GRANT INSERT, RESTRICTIVE UPDATE/DELETE deny policies, trigger blocking mutation of core consent fields
- Caveat: Static analysis cannot confirm migration applied to live DB

### FINDING 5 — MEDIUM — RESOLVED
**accepted_at set from client clock**
- Resolution (2026-05-18 verified): `accepted_at` excluded from insert payload; JSDoc confirms DB DEFAULT now() is used; returned server-authoritative timestamp

### FINDING 7 — HIGH — RESOLVED (migration tracked; live DB unconfirmed)
**Age attestation — no independent DB record**
- Migration: `20260510040000_age_verification_consent_type.sql` in production migrations
- Includes: `age_verification` consent type added to constraint; document seeded; ConsentGateScreen and LegalDocumentScreen wired

### FINDING 8 — MEDIUM — RESOLVED
**Empty active documents returns ALLOW_ACCESS**
- Resolution (2026-05-18 verified): `resolveLegalGateForSession` now throws when `activeDocs.length === 0`; caught by `useLegalConsent` → fails gate closed

### FINDING 9 — LOW — RESOLVED
**Consent cache keyed only by userId**
- Resolution (2026-05-18 verified): Cache key confirmed as `${userId}:${appId}` at `legalConsent.controller.js` line 38

---

## OPEN Findings

### FINDING 4 — HIGH — PARTIALLY MITIGATED / OPEN
**IP/locale/user_agent client-supplied**
- Location: `getPublicIp.dal.js`, `legalConsent.controller.js`
- ip_address: MITIGATED — `getPublicIp.dal.js` confirmed dead (zero importers); `dalRecordLegalAcceptance` JSDoc confirms ip_address intentionally omitted. No false IP data written.
- locale / user_agent: STILL CLIENT-SUPPLIED from `navigator.language` and `navigator.userAgent`. Informational only — no evidentiary use claimed.
- Open CARNAGE task: Server-side IP capture via Supabase Edge Function not yet implemented. Must ship before any regulatory audit or Edge Function activation.
- Release blocking: NO — ip_address omitted entirely; no false data; task not blocking current release

### FINDING 6 — HIGH (latent) — DORMANT / LOW RISK
**Barbershop route unregistered (latent)**
- Original: `/join/barbershop/:token` route not registered; pre-activation gap conditions identified
- Current (2026-05-18 verified): Route still unregistered (confirmed: zero results for `barbershop|JoinBarbershop` in routes). All three sub-issues pre-fixed: consent recording wired, synthetic age removed (F2), ToS/Privacy links corrected.
- Risk reduced from HIGH latent → LOW dormant. When route is wired, no consent/age/link gaps will fire.
- Remaining action: Route registration only — no code changes needed

---

## Performance Findings (KRAVEN 2026-05-10) — Status UNKNOWN

These findings were identified in the KRAVEN report. No resolution audit has been run for performance findings.

### KRAVEN FINDING 1 — HIGH — STATUS UNKNOWN
**Blocking IP fetch (api.ipify.org) serialized before consent writes**
- Location: `legalConsent.controller.js:113`
- Note: As of VENOM 2026-05-18, `getPublicIp.dal.js` has zero importers and `ip_address` is omitted from all writes. If this remains true, the blocking IP fetch may have been removed as part of the F4 mitigation. Resolution should be re-verified.
- Status: UNKNOWN — may be implicitly resolved by F4 ip_address omission

### KRAVEN FINDING 2 — HIGH — STATUS UNKNOWN
**LegalDocumentScreen not code-split — ~34.6 KB in main bundle**
- Location: `apps/VCSM/src/app/routes/lazyPublic.jsx:13`, `LegalDocumentScreen.jsx`
- Comment in lazyPublic.jsx: `// ── Legal (static — no lazy flash) ───` — explicit opt-out of lazy loading
- Impact: TermsOfServiceContent (~22.8 KB) + PrivacyPolicyContent (~11.8 KB) parsed on every cold start
- Status: UNKNOWN — no performance remediation audit found in source files

---

## Stale Claims Corrected (VENOM 2026-05-18)

The 2026-05-11 AvengersAssemble run made false claims about legal security coverage. These have been documented as stale in `2026-05-18_venom_legal-dal-finding-resolution.md` and should not be relied upon:
- "No VENOM analysis exists for this critical flow" — FALSE; full 9-finding report exists from 2026-05-10
- "Security report predates current gate implementation" — FALSE; VENOM report is 2026-05-10
- "RLS enforcement status not documented" — FALSE; documented in VENOM F3 and QA §2/§6
