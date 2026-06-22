---
title: Register Module — Current Status
feature: auth
module: register
---

# auth / modules / register — CURRENT STATUS

## ARCHITECT

| Field | Value |
|---|---|
| Last Run | 2026-06-06 |
| Version | V2 |
| Status | COMPLETE |
| Source Files Read | 19 |
| Recommendation | CAUTION |
| Report | outputs/2026/06/06/ARCHITECT/ARCHITECT-V2-REGISTER.md |
| Evidence Bundle | outputs/2026/06/06/ARCHITECT/evidence-bundle.json |

### Architecture State (2026-06-06)

- Layer stack: FULLY TRACED (Screen → Hook → Controller → DAL → Supabase)
- Cross-feature: legal (consent), monitoring (error telemetry), wanders (dual-client mirror)
- Route guard: AuthPublicRoute confirmed (auth'd users → /feed)
- Post-registration branches: requiresEmailConfirm (→ /verify-email) or session active (→ /onboarding)
- Anonymous upgrade path: confirmed SOURCE_VERIFIED
- Stale JWT recovery: confirmed SOURCE_VERIFIED
- Wanders mirror: confirmed SOURCE_VERIFIED with userId match guard

### Findings Summary (2026-06-06)

| Severity | Count |
|---|---|
| HIGH | 1 |
| MEDIUM | 4 |
| LOW | 3 |
| INFO | 4 |

### THOR Eligibility

CAUTION — FINDING-HIGH-001 (navState.from no path whitelist) requires ELEKTRA downstream trace of onboarding redirect handling before clean gate.

## VENOM

| Field | Value |
|---|---|
| Last Run | 2026-06-06 |
| Status | COMPLETE |
| ARCHITECT Gate | SATISFIED (evidence-bundle.json 2026-06-06) |
| Findings | 0 CRITICAL / 1 HIGH / 3 MEDIUM / 4 LOW / 1 INFO |
| Recommendation | CAUTION |
| Report | outputs/2026/06/06/Venom/2026-06-06_00-00_venom_auth-register.md |

### Key Findings (2026-06-06)

- VEN-REG-001 (HIGH): navState.from forwarded to /onboarding without isSafeAuthReturnPath() check — fix is one line
- VEN-REG-002 (MEDIUM): public.profiles UPSERT RLS unverified — DB audit required
- VEN-REG-003 (MEDIUM): platform.user_consents INSERT RLS unverified — DB audit required
- VEN-REG-004 (MEDIUM): console.error production info disclosure — remove, captureFrontendError already present
- VEN-REG-005 (LOW MITIGATED): isWandersFlow client-controlled — userId match guard present
- VEN-REG-006 to VEN-REG-009: LOW/INFO — client password enforcement gap, monitoring PII partial strip, inviteCode gap, Wanders architecture note

### THOR Eligibility

CAUTION — pending ELEKTRA trace of VEN-REG-001 (onboarding redirect destination). No THOR blocker confirmed.

## ELEKTRA

| Field | Value |
|---|---|
| Last Run | 2026-06-06 |
| Status | COMPLETE |
| ARCHITECT Gate | SATISFIED (2026-06-06) |
| VENOM Gate | SATISFIED (2026-06-06) |
| BLACKWIDOW Gate | SATISFIED (2026-06-06) |
| Findings | 0 CRITICAL / 1 HIGH / 3 MEDIUM / 2 LOW / 1 INFO |
| False Positives Rejected | 2 |
| Recommendation | CAUTION |
| Report | outputs/2026/06/06/ELEKTRA/2026-06-06_00-00_elektra_auth-register.md |

### Key Findings (2026-06-06)

- ELEK-REG-001 (HIGH): navState.from full end-to-end chain CONFIRMED — useRegister.js:48 + useAuthOnboarding.js:32 both missing isSafeAuthReturnPath(); sink at useAuthOnboarding.js:143. UPGRADES VEN-REG-001 / BW-REG-001 from PARTIAL to CONFIRMED. Two patch points required.
- ELEK-REG-002 (MEDIUM): console.error disclosure EXPANDED — 3 instances total (useRegister.js:146 known; useAuthOnboarding.js:95 + :145 NEW, not in VENOM/BW)
- ELEK-REG-003 (MEDIUM): public.profiles RLS — authenticated client confirmed; DB audit required
- ELEK-REG-004 (MEDIUM): platform.user_consents RLS — authenticated client confirmed; DB audit required
- ELEK-REG-005 (LOW): double-submit useRef guard missing in handleRegister()
- ELEK-REG-006 (LOW): password complexity client-only — route to DB/config
- ELEK-REG-007 (INFO): monitoring message field PII strip incomplete
- FP-REG-001 REJECTED: external HTTP redirect via navigate() (React Router v6 SPA-internal)
- FP-REG-002 REJECTED: inviteCode reuse (attribution gap, not security exploit)

### THOR Eligibility

CAUTION — ELEK-REG-001 HIGH confirmed with two SIMPLE one-line patches available; ELEK-REG-003/004 require DB audit to confirm/downgrade. No CRITICAL findings. No THOR blocker.

## Documentation State

| File | Status | Last Updated |
|---|---|---|
| ARCHITECTURE.md | CURRENT | 2026-06-06 |
| BEHAVIOR.md | CURRENT | 2026-06-06 |
| SECURITY.md | CURRENT | 2026-06-06 |
| INDEX.md | CURRENT | 2026-06-06 |
| CURRENT_STATUS.md | CURRENT | 2026-06-06 |
