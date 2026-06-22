---
title: Register Module — Security
status: CURRENT
feature: auth
module: register
source: ARCHITECT-V2-source-verified
last-architect-run: 2026-06-06
last-venom-run: 2026-06-06
---

# auth / modules / register — SECURITY

## THOR Status

CLEAN — All CAUTION findings resolved. VEN-REG-001 / ELEK-REG-001 patched in both useRegister.js and useAuthOnboarding.js (isSafeAuthReturnPath applied). DB findings VEN-REG-002/003 verified PASS. Console.error findings ELEK-REG-002 / VEN-REG-004 fully removed. Monitoring PII scrub VEN-REG-007 applied. Double-submit guard BW-REG-004 present. Remaining open items (VEN-REG-006 — password complexity config; FINDING-LOW-010 — citizenInviteCode stale closure; FINDING-INFO-009 — successMessage dead state) are LOW/INFO, non-blocking.

Last reviewed: 2026-06-06 — TICKET-SEC-REGISTER-FINAL-CLEANUP-001

---

## VENOM STATUS

**VENOM Last Run:** 2026-06-06
**Status:** COMPLETE
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/Venom/2026-06-06_00-00_venom_auth-register.md
**Findings:** 0 CRITICAL | 1 HIGH | 3 MEDIUM | 4 LOW | 1 INFO
**Recommendation:** CLEAN (as of 2026-06-06 TICKET-SEC-REGISTER-FINAL-CLEANUP-001)

| VENOM ID | Severity | Maps to ARCHITECT | Status |
|---|---|---|---|
| VEN-REG-001 | HIGH | FINDING-HIGH-001 | CLOSED — isSafeAuthReturnPath applied in useRegister.js:48 + useAuthOnboarding.js:33; SPIDER-MAN regression added |
| VEN-REG-002 | MEDIUM | FINDING-MED-005 | DB-PASS — public.profiles RLS UPSERT verified by owner 2026-06-06 |
| VEN-REG-003 | MEDIUM | FINDING-MED-004 | DB-PASS — platform.user_consents RLS INSERT verified by owner 2026-06-06 |
| VEN-REG-004 | MEDIUM | FINDING-MED-003 | CLOSED — console.error removed; captureFrontendError in place (useRegister + useAuthOnboarding) |
| VEN-REG-005 | LOW (MITIGATED) | FINDING-LOW-007 | CLOSED — guard confirmed; SPIDER-MAN regression added (register.controller.test.js) |
| VEN-REG-006 | LOW | FINDING-LOW-006 | OPEN — password complexity server enforcement; DB/config change required |
| VEN-REG-007 | LOW | FINDING-LOW-008 | CLOSED — scrubMessagePii() applied to message field in monitoringClient.js |
| VEN-REG-009 | INFO | — | INFO |

---

## Findings

### FINDING-HIGH-001 — navState.from Not Whitelist-Validated (Open Redirect Risk)

| Field | Value |
|---|---|
| ID | FINDING-HIGH-001 |
| Severity | HIGH |
| Surface | useRegister.js:53 → navState.from → navigate('/onboarding', state) |
| Evidence | [SOURCE_VERIFIED] useRegister.js:50-56 |
| Description | navState.from is derived from location.state.from with only a string type check. isSafeAuthReturnPath() is defined in authInputValidation.model.js but NOT called in useRegister. The unvalidated path is forwarded to /onboarding via navigate() location state. If the onboarding controller uses navState.from as a post-onboarding redirect destination without its own whitelist, an attacker who injects location.state.from can redirect the user after registration. |
| Status | CLOSED — isSafeAuthReturnPath() now applied at useRegister.js:48 and useAuthOnboarding.js:33. SPIDER-MAN regression: authInputValidation.redirect.test.js. |
| THOR | CLEAN |
| Fix Applied | 2026-06-06 — TICKET-SEC-REGISTER-FINAL-CLEANUP-001 |

---

### FINDING-MED-003 — console.error Leaks Consent Error to Browser Console

| Field | Value |
|---|---|
| ID | FINDING-MED-003 |
| Severity | MEDIUM |
| Surface | useRegister.js:146 |
| Evidence | [SOURCE_VERIFIED] |
| Description | console.error('[Register] Failed to record legal consent:', consentErr) is called unconditionally. consentErr may contain Supabase internal error details. No DEV guard. Violates project no-console rule. |
| Status | CLOSED — console.error removed from useRegister.js; captureFrontendError is the sole error path. useAuthOnboarding.js:95 + :146 also replaced (TICKET-SEC-REGISTER-CONSOLE-001). |
| THOR | CLEAN |
| Fix Applied | 2026-06-06 |

---

### FINDING-MED-004 — platform.user_consents userId Not Session-Verified at DAL

| Field | Value |
|---|---|
| ID | FINDING-MED-004 |
| Severity | MEDIUM |
| Surface | userConsents.write.dal.js:33 → platform.user_consents INSERT |
| Evidence | [SOURCE_VERIFIED] |
| Description | userId is derived from server-issued result.userId but the DAL does not verify userId === auth.uid() at write time. Severity depends on RLS policy on platform.user_consents — if RLS enforces user_id = auth.uid(), risk is low. RLS not confirmed. |
| Status | DB-PASS — platform.user_consents RLS INSERT verified by owner 2026-06-06. |
| THOR | CLEAN |

---

### FINDING-MED-005 — profiles Table RLS for Upsert Unverified

| Field | Value |
|---|---|
| ID | FINDING-MED-005 |
| Severity | MEDIUM |
| Surface | register.dal.js:48 → supabase.from('profiles').upsert(payload) |
| Evidence | [SOURCE_VERIFIED] — inherited BW-AUTH-002 |
| Description | No confirmed RLS policy for INSERT/UPSERT on public.profiles from any source read. If missing or misconfigured, a caller could upsert a profile shell for a foreign userId. |
| Status | DB-PASS — public.profiles RLS UPSERT verified by owner 2026-06-06. |
| THOR | CLEAN |

---

### FINDING-LOW-006 — Password Rules Client-Side Only

| Field | Value |
|---|---|
| ID | FINDING-LOW-006 |
| Severity | LOW |
| Surface | registerPasswordRules.model.js (client) + register.controller.js (no password check) |
| Evidence | [SOURCE_VERIFIED] |
| Description | Password complexity rules (8-72 chars, uppercase, lowercase, number) enforced in UI only. No controller-layer strength check. Supabase enforces its own minimum (unconfirmed for this project). A bypass client could submit a non-compliant password. |
| Status | OPEN — low risk |
| THOR | Not blocked |

---

### FINDING-LOW-007 — isWandersFlow Client-Controlled (MITIGATED)

| Field | Value |
|---|---|
| ID | FINDING-LOW-007 |
| Severity | LOW (MITIGATED) |
| Surface | useRegister.js:59 → isWandersFlow = Boolean(navState.wandersFlow) |
| Evidence | [SOURCE_VERIFIED] — guard at register.controller.js:29 |
| Description | isWandersFlow derived from client navigation state. Attacker could force Wanders client selection. userId match guard in maybeMirrorWandersSession() is the only backstop — if Wanders session userId !== registration userId, mirror aborts. |
| Status | CLOSED — guard confirmed source-verified; SPIDER-MAN regression added: register.controller.test.js — "Wanders session userId mismatch must throw" + "does not call dalMirrorWandersSessionToPrimary". |
| THOR | CLEAN |

---

### FINDING-LOW-008 — Monitoring message Field Not PII-Stripped

| Field | Value |
|---|---|
| ID | FINDING-LOW-008 |
| Severity | LOW |
| Surface | monitoringClient.js:43 → message field (raw error.message) |
| Evidence | [SOURCE_VERIFIED] |
| Description | stripPii() applied to tags and context but NOT to message field. Supabase error messages may include email addresses in some error conditions. |
| Status | CLOSED — scrubMessagePii() regex applied to message before payload assembly in monitoringClient.js. Emails in message text replaced with [email]. |
| THOR | CLEAN |
| Fix Applied | 2026-06-06 — TICKET-SEC-REGISTER-FINAL-CLEANUP-001 |

---

### FINDING-LOW-010 — citizenInviteCode Stale Closure in handleRegister

| Field | Value |
|---|---|
| ID | FINDING-LOW-010 |
| Severity | LOW |
| Surface | useRegister.js:135 (use) / useRegister.js:177 (deps array) |
| Evidence | [SOURCE_VERIFIED] useRegister.js:40–44, 135, 177 |
| Description | `citizenInviteCode` is derived via `useMemo` from `location.search` and consumed inside `handleRegister` at line 135. It is absent from `handleRegister`'s `useCallback` dependency array (line 177). If query params change while the page is mounted, `handleRegister` holds the stale code from the initial render. In practice the URL does not change on this page, so real-world impact is minimal — but it is a hooks exhaustive-deps violation and a latent correctness risk. |
| Fix | Add `citizenInviteCode` to the `useCallback` dep array on line 177. |
| Status | OPEN |
| THOR | Not blocked |
| Found | 2026-06-06 — code review pass |

---

### FINDING-INFO-009 — successMessage Dead State

| Field | Value |
|---|---|
| ID | FINDING-INFO-009 |
| Severity | INFO |
| Surface | useRegister.js (successMessage state) + RegisterFormCard.jsx |
| Evidence | [SOURCE_VERIFIED] |
| Description | successMessage is never populated in any success path. On success the hook navigates immediately. The RegisterFormCard has a conditional success display that is never triggered. Dead UI state. |
| Status | INFO |
| THOR | N/A |

---

## Prior Findings (Inherited)

### REGISTER-SEC-002 — Actor Creation Owner-Scope (VERIFIED SAFE)

| Field | Value |
|---|---|
| Prior ID | REGISTER-SEC-002 / VEN-AUTH-006 |
| Severity | LOW — VERIFIED SAFE |
| Surface | actorCreate.dal.js → vc.create_actor_for_user RPC |
| Description | profileId must equal auth.uid() — enforced by RPC. Documented for regression. |
| Status | VERIFIED SAFE |

---

## Open Action Items

- [ ] VEN-REG-006: password complexity server enforcement — Supabase auth config / Edge Function (LOW, non-blocking)
- [ ] FINDING-LOW-010: add `citizenInviteCode` to `handleRegister` useCallback deps — useRegister.js:177 (LOW, hooks violation, non-blocking)
- [ ] FINDING-INFO-009: remove dead `successMessage` state from useRegister.js + dead success banner from RegisterFormCard.jsx (INFO, cleanup)
- [x] VEN-REG-001 / ELEK-REG-001: isSafeAuthReturnPath applied — useRegister.js:48 + useAuthOnboarding.js:33 (2026-06-06)
- [x] VEN-REG-002 / ELEK-REG-003: public.profiles RLS UPSERT — DB verified PASS (2026-06-06)
- [x] VEN-REG-003 / ELEK-REG-004: platform.user_consents RLS INSERT — DB verified PASS (2026-06-06)
- [x] VEN-REG-004 / ELEK-REG-002: console.error removed — useRegister.js + useAuthOnboarding.js (2026-06-06)
- [x] VEN-REG-007 / ELEK-REG-007: monitoring message PII scrub — scrubMessagePii() in monitoringClient.js (2026-06-06)
- [x] BW-REG-004 / ELEK-REG-005: double-submit guard — submittingRef in useRegister.js; regression added (2026-06-06)
- [x] VEN-REG-005: Wanders userId mismatch regression — register.controller.test.js (2026-06-06)
- [x] VEN-REG-008 / BW-REG-007: citizen invite attribution — TICKET-INVITE-ATTRIBUTION-001 implemented (2026-06-06)
