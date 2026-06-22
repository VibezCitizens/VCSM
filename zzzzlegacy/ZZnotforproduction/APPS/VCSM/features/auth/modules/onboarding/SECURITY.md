---
title: Onboarding Module — Security
status: SOURCE_VERIFIED
feature: auth
module: onboarding
source: VENOM V1 (2026-06-06) + ARCHITECT V1 (2026-06-06) + BLACKWIDOW V1 (2026-06-06) + ELEKTRA V1 (2026-06-06)
created: 2026-06-05
last-venom-run: 2026-06-06
last-blackwidow-run: 2026-06-06
last-elektra-run: 2026-06-06
highest-open-severity: NONE
thor-release-blocker: NO
---

# auth / modules / onboarding — SECURITY

## VENOM STATUS
VENOM Last Run: 2026-06-06
VENOM Status: COMPLETE
Report: features/auth/modules/onboarding/outputs/2026/06/06/Venom/2026-06-06_03-54_venom_onboarding-screen.md

**Findings:** 0 CRITICAL | 0 HIGH | 4 MEDIUM | 2 LOW

**THOR Release Blocker:** NO

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-06
BLACKWIDOW Status: COMPLETE
Report: features/auth/modules/onboarding/outputs/2026/06/06/BlackWidow/2026-06-06_04-30_blackwidow_onboarding-screen.md

**Findings:** 0 CRITICAL | 1 HIGH | 1 MEDIUM | 2 LOW | 1 UNRESOLVED

**THOR Release Blocker: NO** — BW-ONBOARD-001 patched (Batch 1 — 2026-06-06)

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-06
ELEKTRA Status: COMPLETE
Report: features/auth/modules/onboarding/outputs/2026/06/06/ELEKTRA/2026-06-06_05-00_elektra_onboarding-screen.md

**Findings:** 0 CRITICAL | 1 HIGH | 2 MEDIUM | 2 LOW | 1 INFO
**False Positives Rejected:** 2
**THOR Release Blocker:** NO — all ELEKTRA blockers resolved (ELEK-ONBOARD-001 patched; ELEK-ONBOARD-003 closed DB-verified)
**ELEKTRA Recommendation:** CLEAR for onboarding scope — all HIGH/MEDIUM findings patched or closed

**ELEKTRA Findings:**

| ID | Severity | Description | Status |
|---|---|---|---|
| ELEK-ONBOARD-001 | HIGH | is_adult bypass — false birthdate → age >= 18 written; no floor; trivially exploitable | PATCHED (Batch 1 — 2026-06-06) |
| ELEK-ONBOARD-002 | MEDIUM | Onboarding replay post-completion — profile + is_adult overwritable at any time | PATCHED (Batch 1 — 2026-06-06) |
| ELEK-ONBOARD-003 | MEDIUM | public.profiles upsert RLS ownership unverified — no WITH CHECK (id = auth.uid()) confirmed | CLOSED_DB_VERIFIED (2026-06-06) |
| ELEK-ONBOARD-004 | LOW | sex null bypass — controller does not check normalized.sex; one-line fix | PATCHED (Batch 1 — 2026-06-06) |
| ELEK-ONBOARD-005 | LOW | handleSave double-submit — no useRef atomic guard (same as ELEK-REG-005) | PATCHED (Batch 1 — 2026-06-06) |

**Key Closure (ELEKTRA-confirmed):**
- VEN-ONBOARD-002 — **CLOSED_SOURCE_VERIFIED** — ensureProfileShell sole caller (evaluateCompleteProfileGateController) uses supabase.auth.getUser() (server-verified). Caller chain fully traced. No patch required.

---

## Active Findings

| ID | Severity | Surface | ELEK Status | Status | THOR |
|---|---|---|---|---|---|
| ELEK-ONBOARD-001 | HIGH | is_adult bypass — false birthdate → age >= 18; no floor; full chain confirmed | CONFIRMED | PATCHED (Batch 1) | CONDITIONAL |
| ELEK-ONBOARD-002 | MEDIUM | Onboarding replay — /onboarding post-completion; profile + is_adult overwritable | CONFIRMED | PATCHED (Batch 1) | CONDITIONAL |
| ELEK-ONBOARD-003 | MEDIUM | public.profiles upsert RLS — WITH CHECK ownership unverified | DB AUDIT | CLOSED_DB_VERIFIED (2026-06-06) | — |
| VEN-ONBOARD-001 | MEDIUM | Cross-feature DAL import: onboarding.controller → initiation/dal/vibeInvites.dal | LOW RISK (architectural) | PATCHED (Batch 2 — 2026-06-06) | No |
| VEN-ONBOARD-006 | MEDIUM | generate_username RPC — anon-callable, SECURITY DEFINER, username oracle confirmed | CLOSED_DB_PATCHED (2026-06-06) — REVOKE PUBLIC/anon, GRANT authenticated | — |
| ELEK-ONBOARD-004 | LOW | sex null bypass — normalized.sex not checked in controller; one-line fix | CONFIRMED | PATCHED (Batch 1) | No |
| ELEK-ONBOARD-005 | LOW | handleSave double-submit — no useRef atomic guard | CONFIRMED | PATCHED (Batch 1) | No |
| BW-ONBOARD-003 | LOW | display_name stored content injection — React-safe; non-React sink confirmed: vport.public_actor_seo_v (VCSM-owned) | CLOSED_DB_PATCHED (2026-06-06) — profiles_display_name_length CHECK ≤ 100 added | — |

**Note: VEN-ONBOARD-004 → BW-ONBOARD-001 → ELEK-ONBOARD-001 (MEDIUM → HIGH → confirmed HIGH)**
**Note: VEN-ONBOARD-005 → BW-ONBOARD-??? → ELEK-ONBOARD-004 (LOW confirmed)**

## Resolved / Closed

| ID | Prior Status | Resolution |
|---|---|---|
| VEN-ONBOARD-002 | OPEN — MEDIUM — PARTIAL (caller chain unverified) | **CLOSED_SOURCE_VERIFIED** (2026-06-06 ELEKTRA) — sole caller evaluateCompleteProfileGateController uses supabase.auth.getUser() (server-verified). Full chain traced. |
| ONBOARDING-SEC-003 | OPEN — open redirect | **RESOLVED** — isSafeAuthReturnPath confirmed at useAuthOnboarding.js:34 (2026-06-06) |
| ELEK-REG-001 (useAuthOnboarding.js portion) | OPEN — HIGH | **RESOLVED** — isSafeAuthReturnPath confirmed (security sprint patch) |
| ELEK-REG-002 (useAuthOnboarding.js :95/:145) | OPEN — MEDIUM | **RESOLVED** — captureFrontendError replaces console.error in both catch paths |

## Confirmed Blocked Invariants

| Invariant | Evidence |
|---|---|
| Session pin — completeOnboardingController | controller:72 `userId !== user.id → reject` |
| profileId stripped from actor return | ActorModel omits profile_id |
| Actor owner-scope guard | createUserActor.controller:26 |
| bootstrapJoinOnboarding session pin | controller:172 throw on mismatch |
| Birthdate future-date rejection | computeAgeFromBirthdateModel returns null |

## Required Before Release

None — all HIGH and MEDIUM findings patched or closed. Two LOW findings remain open with no THOR blocker.

## Open Items

None — all findings resolved.
