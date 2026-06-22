# Security Posture — auth

Last Updated: 2026-06-07
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-AUTH-2026-005 / BW-AUTH-2026-001 / ELEK-AUTH-2026-003 (password reset fallback nonce — must remove before THOR); CONDITIONAL: BW-ONBOARD-001 blocks is_adult-gated features

---

## VENOM STATUS
VENOM Last Run: 2026-06-07
VENOM Status: COMPLETE

---

### Scope: Full module (2026-06-07)
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/07/Venom/2026-06-07_venom_auth-full-module-review.md

**Findings:** 0 CRITICAL | 1 HIGH | 3 MEDIUM | 1 LOW | §9 Cross-check: 5 invariants OPEN

| ID | Severity | Description | Status |
|---|---|---|---|
| VEN-AUTH-2026-001 | MEDIUM | upsertProfileShellDAL no app-layer session cross-check at DAL; sole caller safe but function unguarded | OPEN |
| VEN-AUTH-2026-002 | MEDIUM | PASSWORD_RECOVERY permit registration failure silently swallowed; delivery mechanism for INV-3 | OPEN |
| VEN-AUTH-2026-003 | MEDIUM | dalUpdateProfileDiscoverable ownership status unverified (source not read) | OPEN — ELEKTRA trace required |
| VEN-AUTH-2026-004 | LOW | generate_username RPC schema=null; may be public schema (anon-callable) | OPEN — DB audit |
| VEN-AUTH-2026-005 | HIGH | INV-3 VIOLATED — password reset fallback nonce path (carry-forward THOR BLOCKER) | OPEN — THOR BLOCKER |

§9 Invariant Status (11 total): 6 HOLD, 5 OPEN (INV-3 VIOLATED, INV-4 LATENT, INV-5 PARTIAL, INV-7 PARTIAL, INV-9 PARTIAL)

**THOR Release Blocker:** YES — VEN-AUTH-2026-005 (INV-3 VIOLATED)
**Recommendation:** CAUTION

---

### Scope: Onboarding sub-module (/onboarding screen — 2026-06-06)
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/modules/onboarding/outputs/2026/06/06/Venom/2026-06-06_03-54_venom_onboarding-screen.md

**Findings:** 0 CRITICAL | 0 HIGH | 4 MEDIUM | 2 LOW

| ID | Severity | Description | Status |
|---|---|---|---|
| VEN-ONBOARD-001 | MEDIUM | Cross-feature DAL import: onboarding.controller → initiation/dal/vibeInvites.dal (boundary violation) | PATCHED (Batch 2 — 2026-06-06) |
| VEN-ONBOARD-002 | MEDIUM | ensureProfileShell — no session cross-check; userId from caller | OPEN |
| VEN-ONBOARD-003 | MEDIUM | public.profiles INSERT/UPSERT RLS UNVERIFIED — DB-layer backstop unconfirmed | OPEN — DB audit |
| VEN-ONBOARD-004 | MEDIUM | No minimum age enforcement — any age accepted; is_adult computed but no floor | OPEN |
| VEN-ONBOARD-005 | LOW | sex field not validated at controller after normalization | OPEN |
| VEN-ONBOARD-006 | LOW | generate_username RPC — no rate limiting or enumeration protection visible | OPEN — DB audit |

**Resolved this run:**
- ONBOARDING-SEC-003 / ELEK-REG-001 (useAuthOnboarding.js portion): RESOLVED — isSafeAuthReturnPath confirmed present at hook:34
- ELEK-REG-002 (useAuthOnboarding.js :95/:145): RESOLVED — captureFrontendError replaces console.error

**THOR Release Blocker:** NO
**Recommendation:** CAUTION — 4 MEDIUM require resolution; no CRITICAL or HIGH; security sprint patches confirmed

---

### Scope: Register sub-module (/register — 2026-06-06)
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/Venom/2026-06-06_00-00_venom_auth-register.md

**Findings:** 0 CRITICAL | 1 HIGH | 3 MEDIUM | 4 LOW | 1 INFO

| ID | Severity | Description | Status |
|---|---|---|---|
| VEN-REG-001 | HIGH | navState.from forwarded to onboarding without path whitelist — open redirect risk | OPEN (useRegister.js portion; useAuthOnboarding.js RESOLVED) |
| VEN-REG-002 | MEDIUM | public.profiles UPSERT RLS unverified | OPEN — DB audit (re-escalated as VEN-ONBOARD-003) |
| VEN-REG-003 | MEDIUM | platform.user_consents INSERT RLS unverified | OPEN — DB audit |
| VEN-REG-004 | MEDIUM | console.error production info disclosure (useRegister.js:146) | OPEN |
| VEN-REG-005 | LOW (MITIGATED) | isWandersFlow client-controlled — userId match guard present, needs regression test | MITIGATED |
| VEN-REG-006 | LOW | Password complexity enforcement client-only | OPEN |
| VEN-REG-007 | LOW | Monitoring message field partial PII strip | OPEN |
| VEN-REG-008 | LOW | inviteCode attribution gap — UUID-validated but never persisted | OPEN |
| VEN-REG-009 | INFO | Wanders token injection architecture note (setSession pattern) | INFO |

**THOR Release Blocker:** NO
**Recommendation:** CAUTION — 1 HIGH requires ELEKTRA downstream trace; no CRITICAL; fix exists in codebase (isSafeAuthReturnPath() just not called in useRegister)

---

### Prior scope (2026-06-05 — ForgotPassword)
See report: ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/Venom/2026-06-05_00-00_venom_auth-forgotpassword.md
Findings: VENOM-FP-001 (MEDIUM) through VENOM-FP-007 (INFO) — all OPEN unless noted
---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07
ELEKTRA Status: COMPLETE (3 scopes)

---

### Scope: Full module (2026-06-07)
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/07/ELEKTRA/2026-06-07_elektra_auth-security-scan.md
**Gates:** ARCHITECT ✓ (2026-06-07) | VENOM ✓ (2026-06-07) | BLACKWIDOW ✓ (2026-06-07)

0 CRITICAL | 1 HIGH | 3 MEDIUM | 0 LOW
3 False Positives Rejected
THOR Release Blocker: YES — ELEK-AUTH-2026-003 (fallback nonce removal)

| Finding ID | Severity | Description | Patch Type | Status |
|---|---|---|---|---|
| ELEK-AUTH-2026-001 | MEDIUM | upsertProfileShellDAL: add internal session guard — supabase.auth.getUser() + user.id !== id check | OWNERSHIP_GUARD (DAL) | OPEN |
| ELEK-AUTH-2026-002 | MEDIUM | AuthProvider.jsx IIFE: permit fail silently swallowed — surface permitRegistered flag (duplicate of ELEK-APP-2026-001) | ERROR_HANDLING | OPEN |
| ELEK-AUTH-2026-003 | HIGH | setNewPassword.controller.js: remove sessionStorage nonce fallback; require server-verified permitId exclusively | REMOVE_FALLBACK (controller) | OPEN — THOR BLOCKER |
| ELEK-AUTH-2026-004 | MEDIUM | dalUpdateProfileDiscoverable: caller chain unverified — SCANNER_LEAD requiring source read | REQUIRES SOURCE READ | OPEN |

False Positives Rejected: FP-AUTH-001 (dalCreateActorOwner upsert — idempotent by design), FP-AUTH-002 (getSession() stale JWT — JWT is server-signed), FP-AUTH-003 (generate_username anon enumeration — no security impact)
Recommended patches: ELEK-AUTH-2026-003 (SIMPLE — remove fallback) + ELEK-AUTH-2026-002 (shared fix with ELEK-APP-2026-001)

---

### Scope: Onboarding sub-module (/onboarding screen — 2026-06-06)
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/modules/onboarding/outputs/2026/06/06/ELEKTRA/2026-06-06_05-00_elektra_onboarding-screen.md
**Gates:** ARCHITECT ✓ (2026-06-06) | VENOM ✓ (2026-06-06) | BLACKWIDOW ✓ (2026-06-06)

**Findings:** 0 CRITICAL | 1 HIGH | 2 MEDIUM | 2 LOW | 1 INFO
**False Positives Rejected:** 2
**THOR Release Blocker: CONDITIONAL** — ELEK-ONBOARD-001 blocks is_adult-gated content; ELEK-ONBOARD-003 requires DB audit
**Recommendation: CAUTION** — 3 simple patches resolve HIGH+MEDIUM; DB audit pending

| ID | Severity | Description | Patch Type | Status |
|---|---|---|---|---|
| ELEK-ONBOARD-001 | HIGH | is_adult bypass — false birthdate → is_adult=true; full chain confirmed | MIN_AGE_FLOOR (controller, SIMPLE) | PATCHED (Batch 1 — 2026-06-06) |
| ELEK-ONBOARD-002 | MEDIUM | Onboarding replay — /onboarding accessible post-completion; profile+is_adult overwritable | COMPLETION_GUARD (controller+hook, SIMPLE) | PATCHED (Batch 1 — 2026-06-06) |
| ELEK-ONBOARD-003 | MEDIUM | public.profiles upsert RLS — WITH CHECK ownership unverified | DB audit → RLS policy | CLOSED_DB_VERIFIED (2026-06-06) |
| ELEK-ONBOARD-004 | LOW | sex null bypass — normalized.sex not checked in controller; one-line fix | INPUT_SANITIZE (controller) | PATCHED (Batch 1 — 2026-06-06) |
| ELEK-ONBOARD-005 | LOW | handleSave double-submit — no useRef atomic guard | ATOMIC_REF_GUARD (hook) | PATCHED (Batch 1 — 2026-06-06) |

**Key Closure:**
- VEN-ONBOARD-002 — **CLOSED_SOURCE_VERIFIED** — ensureProfileShell sole caller uses supabase.auth.getUser() (server-verified). Caller chain fully traced.

**False Positives Rejected:** 2
- FP-ONBOARD-001: getSession() stale JWT bypass — Supabase JWT is server-signed; tamper-evident; rejected
- FP-ONBOARD-002: display_name XSS in React — React auto-escapes; non-React sink unconfirmed in scope

---

### Scope: Register sub-module (/register — 2026-06-06)
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/ELEKTRA/2026-06-06_00-00_elektra_auth-register.md
**Gates:** ARCHITECT ✓ (2026-06-06) | VENOM ✓ (2026-06-06) | BLACKWIDOW ✓ (2026-06-06)

**Findings:** 0 CRITICAL | 1 HIGH | 3 MEDIUM | 2 LOW | 1 INFO
**False Positives Rejected:** 2

| ID | Severity | Description | Patch Type | Status |
|---|---|---|---|---|
| ELEK-REG-001 | HIGH | navState.from full end-to-end redirect chain confirmed — useRegister.js:48 + useAuthOnboarding.js:32 both lack isSafeAuthReturnPath(); sink at useAuthOnboarding.js:143 | INPUT_SANITIZE (2 files) | Open — advisory issued |
| ELEK-REG-002 | MEDIUM | console.error production disclosure — 3 instances (useRegister.js:146 + useAuthOnboarding.js:95 + :145); 2 new instances not in VENOM/BW | REMOVE + captureFrontendError | Open — advisory issued |
| ELEK-REG-003 | MEDIUM | public.profiles UPSERT RLS unverified — authenticated client confirmed, DB audit required | DB audit | Open — deferred to DB |
| ELEK-REG-004 | MEDIUM | platform.user_consents INSERT RLS unverified — authenticated client confirmed, DB audit required | DB audit | Open — deferred to DB |
| ELEK-REG-005 | LOW | Double-submit race — no useRef guard in handleRegister() | ATOMIC_REF_GUARD | Open — advisory issued |
| ELEK-REG-006 | LOW | Password complexity client-only — no server enforcement confirmed | Config/DB audit | Open — deferred to DB |
| ELEK-REG-007 | INFO | Monitoring message field partial PII strip — email patterns not scrubbed | INPUT_SANITIZE | Open — advisory issued |

**Cross-references:**
- ELEK-REG-001 UPGRADES VEN-REG-001 / BW-REG-001 from PARTIAL to FULL CHAIN CONFIRMED (2 fix points: useRegister.js + useAuthOnboarding.js)
- ELEK-REG-002 EXPANDS VEN-REG-004 / BW-REG-005 — two additional instances discovered in useAuthOnboarding.js (not in VENOM or BLACKWIDOW)
- FP-REG-001 REJECTED: external HTTP redirect via navigate() (React Router v6 does not perform window.location.href for absolute URLs in standard browser router)
- FP-REG-002 REJECTED: inviteCode reuse (no security impact — attribution-only)

**THOR Release Blocker:** NO
**Recommendation:** CAUTION — ELEK-REG-001 HIGH has two SIMPLE one-line patches; ELEK-REG-003/004 require DB audit to confirm/downgrade; core identity chain confirmed correct

**Prior scope (2026-06-05 — ForgotPassword):**
See report: ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/ELEKTRA/2026-06-05_00-00_elektra_auth-forgotpassword.md
Findings: ELEK-FP-001 through ELEK-FP-004 — all advisory issued

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07
BLACKWIDOW Status: COMPLETE (full module + 2 prior sub-module scopes)

---

### Scope: Full module (2026-06-07)
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_auth-adversarial-review.md

**Tests:** 9 executed | BYPASSED: 2 | BLOCKED: 5 | PARTIAL: 1 | UNRESOLVED: 1

| ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-AUTH-2026-001 | HIGH | INV-3 VIOLATED: password reset fallback nonce bypass confirmed — THOR BLOCKER | BYPASSED (self) | OPEN |
| BW-AUTH-2026-002 | MEDIUM | upsertProfileShellDAL foreign userId — current callers safe, function unguarded (INV-4 LATENT) | PARTIAL | OPEN |
| BW-AUTH-2026-009 | MEDIUM | dalUpdateProfileDiscoverable caller chain unverified — route to ELEKTRA | UNRESOLVED | OPEN |

§9 HOLDS confirmed (adversarial): INV-1, INV-2, INV-6, INV-8, INV-10, INV-11
§9 PARTIAL/BYPASSED: INV-3 (BYPASSED), INV-4 (PARTIAL), INV-5 (PARTIAL), INV-7 (PARTIAL), INV-9 (PARTIAL)

**THOR Release Blocker:** YES — BW-AUTH-2026-001 / VEN-AUTH-2026-005

---

### Prior Scope: Onboarding sub-module (2026-06-06)

---

### Scope: Onboarding sub-module (/onboarding screen — 2026-06-06)
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/modules/onboarding/outputs/2026/06/06/BlackWidow/2026-06-06_04-30_blackwidow_onboarding-screen.md

**Findings:** 0 CRITICAL | 1 HIGH | 1 MEDIUM | 2 LOW | 1 UNRESOLVED

| ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-ONBOARD-001 | HIGH | is_adult forgery via false birthdate — age >= 18 written without floor; any user can set is_adult=true | BYPASSED | OPEN |
| BW-ONBOARD-002 | MEDIUM | Onboarding replay — /onboarding re-accessible post-completion; is_adult and profile overwritable | BYPASSED | OPEN |
| BW-ONBOARD-003 | LOW | display_name stored content injection — React-side blocked; non-React output paths at risk | PARTIAL | OPEN |
| BW-ONBOARD-004 | LOW | handleSave double-submit narrow race — no useRef guard | PARTIAL | OPEN |
| VEN-ONBOARD-003 | MEDIUM | profiles RLS UNRESOLVED — DB audit required | UNRESOLVED | OPEN — DB audit |

**Invariants tested — 5 BLOCKED, 1 BYPASSED, 1 PARTIAL:**
- Session pin (completeOnboardingController:72): BLOCKED ✓
- Actor foreign profileId (createUserActor:26): BLOCKED ✓
- bootstrapJoin session pin (controller:172): BLOCKED ✓
- Redirect injection (isSafeAuthReturnPath): BLOCKED ✓
- Future birthdate rejection: BLOCKED ✓
- is_adult gate (false birthdate): BYPASSED — BW-ONBOARD-001
- ensureProfileShell caller chain: PARTIAL — authCallback caller unverified

**THOR Release Blocker: CONDITIONAL** — BW-ONBOARD-001 (HIGH) blocks any release enabling is_adult-gated content

---

### Scope: Register sub-module (/register — 2026-06-06)
**Report:** ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/BlackWidow/2026-06-06_00-00_blackwidow_auth-register.md

**Findings:** 0 CRITICAL | 1 HIGH | 2 MEDIUM | 4 LOW | 1 INFO

| ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-REG-001 | HIGH | navState.from state injection — path forwarded to /onboarding without whitelist | PARTIAL | OPEN |
| BW-REG-002 | LOW (MITIGATED) | Wanders session userId mismatch → token injection attempt | BLOCKED | MITIGATED |
| BW-REG-003 | INFO | Authenticated user re-registration bypass attempt | BLOCKED | CLOSED |
| BW-REG-004 | LOW | Double-submit race — narrow window before loading state propagates | PARTIAL | OPEN |
| BW-REG-005 | MEDIUM | console.error production disclosure — Supabase error details in DevTools | BYPASSED | OPEN |
| BW-REG-006 | LOW | Password complexity client bypass via direct Supabase SDK call | PARTIAL | OPEN |
| BW-REG-007 | LOW | inviteCode unlimited reuse — never consumed server-side | PARTIAL | OPEN |
| BW-REG-008 | MEDIUM | BEHAVIOR.md missing §4 Failure Paths and §9 Must Never Happen sections | GOVERNANCE | OPEN |

**VENOM Cross-References:**
- VEN-REG-001 (HIGH): PARTIAL confirmed — navState.from injection accepted; downstream trace required (ELEKTRA)
- VEN-REG-004 (MEDIUM): BYPASSED confirmed — console.error fires unconditionally in production
- VEN-REG-005 (LOW MITIGATED): BLOCKED confirmed — Wanders userId guard fires before setSession()
- VEN-REG-006 (LOW): PARTIAL confirmed — UI password rules bypassed via direct Supabase SDK call
- VEN-REG-008 (LOW): PARTIAL confirmed — same invite code usable unlimited times

**New BLACKWIDOW findings (not in VENOM):**
- BW-REG-004: double-submit narrow race window in handleRegister() (LOW)
- BW-REG-008: BEHAVIOR.md §4/§9 governance gap (MEDIUM)

**THOR Release Blocker:** NO
**Recommendation:** CAUTION — BW-REG-001 PARTIAL (pending ELEKTRA trace); BW-REG-005 BYPASSED (one-line fix); core identity chain held under adversarial simulation

**Prior scope (2026-06-05 — ForgotPassword):**
See report: ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/BlackWidow/2026-06-05_00-00_blackwidow_auth-forgotpassword.md
Findings: BW-FP-001 through BW-FP-005 — all OPEN unless individually noted