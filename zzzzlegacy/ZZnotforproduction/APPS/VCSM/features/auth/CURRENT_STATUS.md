---
name: vcsm.auth.current-status
description: VCSM auth current feature status — updated by ARCHITECT V2
metadata:
  type: status
---

# CURRENT STATUS — VCSM / features / auth

## ARCHITECT

**Last run:** 2026-06-04
**Scanner version:** 1.1.0
**Architecture state:** STABLE
**Independence status:** MOSTLY INDEPENDENT
**Final module status:** MOSTLY COMPLETE
**Spaghetti score:** WATCH
**Top gap:** BEHAVIOR.md is a placeholder stub — auth is a trust-critical module with no authored behavioral spec; test coverage is 1 file for 56 source files
**Recommended handoffs:** LOGAN, SPIDER-MAN, VENOM, ELEKTRA, HAWKEYE

---

## IRONMAN

**Last run:** 2026-06-06
**Scope:** VCSM:auth — Login Module (LoginScreen + all connected layers)
**Ownership Clarity:** PARTIAL
**Boundary Risk:** MEDIUM

| Finding | Severity | Description |
|---|---|---|
| IRM-LOGIN-001 | MEDIUM | iOS platform layer imported directly into auth screen (no adapter) |
| IRM-LOGIN-002 | MEDIUM | profiles.discoverable write owned by auth/login DAL (latent dual-ownership) |
| IRM-LOGIN-003 | LOW | canSubmit rule owned at screen layer, not in hook |
| IRM-LOGIN-004 | LOW | No LOKI evidence — runtime ownership inferred |

THOR: CAUTION — ownership PARTIAL (documentation gaps, security chain not run for login scope)

Report: `modules/login/outputs/2026/06/06/IRONMAN/2026-06-06_00-00_ironman_auth-login.md`
Ownership record: `modules/login/OWNERSHIP.md`

## LOKI

**Run date:** 2026-06-06
**Scope:** VCSM:auth — Login Module (LoginScreen → useLogin → login.controller → login.dal → post-auth chain)
**Evidence:** STATIC_ANALYSIS (source-code trace — no live instrumentation)
**Status:** WATCH

**Findings:**
| ID | Severity | Title |
|---|---|---|
| LOKI-LOGIN-001 | LOW | Duplicate getSession() — second call is cache HIT |
| LOKI-LOGIN-002 | MEDIUM | Serial post-auth waterfall (signIn → hydrate → discoverability) |
| LOKI-LOGIN-003 | LOW | Production timing signal missing — signinMs DEV-only |
| LOKI-LOGIN-004 | LOW | Cached JWT identity check in profile.controller (pre-existing ELEK-2026-06-04-005) |

**DB reads:** auth.users 1×, auth.sessions 2× (1 network + 1 cache HIT), profiles 1× read + 0–1× write
**Read Amplification:** LOW — no N+1, no fan-out
**Execution mode:** SERIAL throughout
**Hotspot:** supabase.auth.signInWithPassword (external network call, 300–2000ms)
**IRM-LOGIN-004 status:** CLOSED — runtime ownership now SOURCE_VERIFIED

**Report:** [2026-06-06_00-00_loki_auth-login.md](outputs/2026/06/06/Loki/2026-06-06_00-00_loki_auth-login.md)


---

## ARCHITECT — 2026-06-06

**Scan:** Targeted — auth/verify-email module (Areas 3, 6, 9)
**Date:** 2026-06-06
**Branch:** vport-booking-feed-security-updates
**Architecture state:** MOSTLY COMPLETE

**New module directory created:** modules/verify-email/
- ARCHITECTURE.md, INDEX.md, BEHAVIOR.md (stub), SECURITY.md

**Key findings:**
- FINDING-001: DUAL_CONTEXT_UNDOCUMENTED [MEDIUM] — screen renders in 2 contexts; not documented → LOGAN
- FINDING-002: COUNTDOWN_INTERRUPT_RISK [LOW] — 4s redirect fires regardless of resend state → WOLVERINE P3
- FINDING-003: EMAIL_STATE_LOSS_DEGRADED [LOW] — no message when email is null → WOLVERINE P3
- FINDING-004: VERIFY_EMAIL_MISCLASSIFIED_IN_RECOVERY [INFO] — miscategorized in recovery module → LOGAN

**THOR impact:** No new blockers. Inherited open blocker VEN-AUTH-001 unchanged.

**Handoffs:** LOGAN (BEHAVIOR.md), SPIDER-MAN (test coverage), WOLVERINE (P3 UX fixes)

## SPIDER-MAN — 2026-06-06

**Ticket:** TICKET-AUTH-LOGIN-SECURITY-001 Batch 1
**Target:** `apps/VCSM/src/features/auth/hooks/useLogin.js`
**Verdict:** PASS — 30/30 tests pass

**BEHAVIOR.md:** Updated STUB → DRAFT. Added BEH-LOGIN-SEC-001 through BEH-LOGIN-SEC-004, LOGIN-MNH-006.

**Testability exports added to useLogin.js:**
- `resolveCooldown` (function)
- `LOGIN_SAFE_ERROR` (const)

**Test file:** `apps/VCSM/src/features/auth/hooks/__tests__/useLogin.security.test.js`

**Suites:** resolveCooldown tiers (8), LOGIN_SAFE_ERROR safety (6), canSubmit gate (9), submittingRef guard (3), cooldown accumulation (4)

**Coverage gaps:** 5 DOM_REQUIRED gaps documented in TESTS.md — non-blocking, require jsdom infrastructure.

**Report:** `modules/login/outputs/2026/06/06/SPIDER-MAN/2026-06-06_spiderman_login-security-001.md`

---

## ARCHITECT — 2026-06-07

**Last run:** 2026-06-07T10:00:00Z
**Scanner version:** 1.1.0
**Architecture state:** STABLE
**Independence status:** MOSTLY INDEPENDENT
**Final module status:** MOSTLY COMPLETE
**Spaghetti score:** WATCH
**Critical findings:**
- ARCH-AUTH-001 [PASS]: createUserActorForProfile enforces profileId===userId (VENOM-AUTH-006) — VERIFIED
- ARCH-AUTH-002 [PASS]: Onboarding controllers verify session user matches passed userId — VERIFIED
- ARCH-AUTH-003 [PASS]: authCallback excludes hash type as recovery authority (BW-LOGIN-002) — VERIFIED
- ARCH-AUTH-004 [MEDIUM/HIGH]: upsertProfileShellDAL + upsertCompletedOnboardingProfileDAL + dalUpsertRegisterProfile — profiles upserts rely on RLS only; no app-layer owner filter at DAL
- ARCH-AUTH-005 [LOW]: DEV mode error messages expose error code (not raw description) — acceptable
- ARCH-AUTH-006 [INFO]: generate_username RPC schema=null (undeclared)
**DB AUDIT NOTES:** profiles table RLS must verify auth.uid()=id on INSERT/UPDATE
**BEHAVIOR.md status:** ACTIVE (last updated by LOGAN — TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence bundle:** outputs/2026/06/07/ARCHITECT/evidence-bundle.md
**Recommended handoffs:** VENOM (ARCH-AUTH-004 profiles RLS dependency), CARNAGE (DB audit), SPIDER-MAN (test coverage expansion)
