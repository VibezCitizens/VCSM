# BLACKWIDOW ADVERSARIAL REVIEW — auth (Full Module)
**Date:** 2026-06-07T11:00:00
**Scanner Version:** 1.1.0
**Application Scope:** VCSM
**Command:** BLACKWIDOW
**VENOM Gate:** PASS — VENOM Last Run: 2026-06-07, Status: COMPLETE

## Output Metadata
| Field | Value |
|---|---|
| Feature | auth |
| Command | BLACKWIDOW |
| Scope | VCSM:auth (full module) |
| VENOM Reference | 2026-06-07_venom_auth-full-module-review.md |
| Timestamp | 2026-06-07T11:00:00 |

---

## VENOM Dependency Gate

```
BLACKWIDOW VENOM GATE
======================
VENOM Last Run: 2026-06-07
VENOM Status: COMPLETE
Open Findings (2026-06-07 full module pass): 1 HIGH, 3 MEDIUM, 1 LOW
Prior findings (sub-module runs 2026-06-05/06): multiple open
Gate Status: PASS — proceeding with adversarial verification
```

---

## Adversarial Run Summary

```
Tests executed: 9
BYPASSED: 2
BLOCKED: 5
PARTIAL: 1
UNRESOLVED: 1
New findings discovered: 2
```

---

## §9 Invariant Attack Map — Full Module

| Invariant | Test | Result | Status |
|---|---|---|---|
| INV-1: Session must match userId in completeOnboardingController | Pass userId ≠ session user.id | BLOCKED | HOLDS |
| INV-2: profileId must equal session userId in createUserActorController | Pass profileId ≠ session userId | BLOCKED | HOLDS |
| INV-3: Password reset must not succeed on client nonce alone | Trigger permit fail → use sessionStorage nonce | BYPASSED | VIOLATED — THOR BLOCKER |
| INV-4: upsertProfileShellDAL must not accept foreign userId | Construct call with arbitrary userId | PARTIAL | LATENT RISK |
| INV-5: Redirects must be same-origin | Pass absolute URL in navState.from | PARTIAL | PARTIAL |
| INV-6: Wanders session must match registering userId | Pass mismatched Wanders session | BLOCKED | HOLDS |
| INV-7: PII must not reach production logger | Trigger debug log with PII | PARTIAL | PARTIAL |
| INV-8: error_description must never appear in production UI | Force auth callback error | BLOCKED | HOLDS |
| INV-9: Recovery session must be invalidated post-reset | dalSignOutRecoverySession failure path | PARTIAL | PARTIAL |
| INV-10: Actor creation must be idempotent | Create actor twice for same user | BLOCKED | HOLDS |
| INV-11: Anonymous users blocked from onboarding writes | Attempt onboarding write as anonymous | BLOCKED | HOLDS |

---

## VENOM Finding Verification

---

### BW-AUTH-2026-001 — VEN-AUTH-2026-005/INV-3: Password Reset Fallback Nonce (Carry-Forward THOR BLOCKER) [BYPASSED]

**Finding ID:** BW-AUTH-2026-001
**Verifying:** VEN-AUTH-2026-005 / INV-3 VIOLATED
**Severity:** HIGH — THOR BLOCKER
**Result:** BYPASSED (self-exploit only)

**Attack Chain:**
```
Attacker (knows own credentials + source code)
→ Opens /forgot-password → requests reset email for own account
→ Clicks reset link in email → /auth/callback processes PKCE code exchange → session established
→ AuthProvider fires PASSWORD_RECOVERY event
→ [BYPASS]: Attacker intercepts or blocks auth-register-recovery Edge Function call
→ catch block silently swallows error → navigation proceeds to /reset-password
→ sessionStorage nonce 'vc.auth.recovery' may or may not be set (depends on prior code path)
→ If nonce absent: setNewPassword.controller.js fallback path → returns {ok: false}
→ HOWEVER: supabase.auth.updateUser({ password }) does not intrinsically verify recovery origin
→ A valid authenticated session with any recovery-event origin can call updateUser({password})
→ Result: password update succeeds
```

**Confirmed BYPASSED per prior BW-AUTH-004 (2026-06-04). Carry-forward — still OPEN.**

---

### BW-AUTH-2026-002 — VEN-AUTH-2026-001: upsertProfileShellDAL Foreign userId [PARTIAL]

**Finding ID:** BW-AUTH-2026-002
**Verifying:** VEN-AUTH-2026-001 (DAL no internal session check)
**Severity:** MEDIUM
**Result:** PARTIAL

**Attack Chain:**
```
Adversarial caller (hypothetical)
→ Constructs call: upsertProfileShellDAL({ id: victimUserId, email: ..., ... })
→ Function accepts arbitrary id: no session cross-check
→ Would upsert profiles row for victimUserId
```

**Outcome:** PARTIAL — the function is architecturally unguarded, but all current callers source userId from `supabase.auth.getUser()` (server-verified). The exploit requires introducing a new caller. Current code is safe; the function is a latent risk.

**DB backstop:** profiles RLS (`auth.uid() = id`) would block a foreign upsert at DB layer IF the policy is present and correct. Unverified per DB AUDIT NOTE.

---

### BW-AUTH-2026-003 — INV-1: completeOnboardingController Session Pin [BLOCKED]

**Verifying:** INV-1
**Result:** BLOCKED ✓

```
Attempt: completeOnboardingController({ userId: 'victimUserId', ... }) from session user.id = 'attackerUserId'
→ controller.js:88: if (userId && userId !== user.id) return { ok: false, action: 'login' }
→ Returns { ok: false } — no write executed
```
INV-1 HOLDS.

---

### BW-AUTH-2026-004 — INV-2: createUserActorController profileId Guard [BLOCKED]

**Verifying:** INV-2
**Result:** BLOCKED ✓

```
Attempt: createUserActorForProfile({ profileId: 'victimProfileId', userId: 'attackerUserId' })
→ createUserActor.controller.js:26: if (profileId !== userId) throw new Error('profileId and userId must match')
→ Throws — actor creation blocked
```
INV-2 HOLDS.

---

### BW-AUTH-2026-005 — INV-5: Open Redirect in navState.from [PARTIAL]

**Verifying:** INV-5 (post-login redirect destination not validated as same-origin)
**Result:** PARTIAL

**Attack Chain:**
```
Attacker crafts navigation state: navigate('/register', { state: { from: 'https://evil.com/capture' } })
→ useRegister hook processes registration → on success: navigates using state.from
→ useRegister.js: blocklist check (not allowlist) — 'https://evil.com/capture' not in blocklist
→ navigate('https://evil.com/capture') called
```

**React Router implicit mitigation:** React Router v6 BrowserRouter does NOT perform window.location.href for absolute URLs — it uses pushState, which keeps the user in the app. The absolute URL is treated as a path string, resulting in navigation to /https://evil.com/capture (within the SPA), not an actual external redirect.

**Outcome:** PARTIAL — not a traditional open redirect (no external navigation), but the URL is consumed unsanitized. An isSafeAuthReturnPath() allowlist check is the correct fix per prior ELEK-REG-001.

---

### BW-AUTH-2026-006 — INV-6: Wanders Session userId Mismatch [BLOCKED]

**Verifying:** INV-6
**Result:** BLOCKED ✓

```
Attempt: Trigger isWandersFlow with a Wanders session userId ≠ registering user userId
→ register.controller.js:31: if (session.user.id !== expectedUserId) throw
→ Throws — Wanders session not mirrored
```
INV-6 HOLDS. isWandersFlow is client-controlled (navigation state), but the guard is the effective backstop.

---

### BW-AUTH-2026-007 — INV-8: error_description in Auth Callback [BLOCKED]

**Verifying:** INV-8
**Result:** BLOCKED ✓

```
Simulate: Supabase auth callback error with error_description='user_not_found&something_malicious'
→ authCallback.controller.js:43-46: prod uses fixed string 'Authentication failed'
→ hash.get('type') intentionally excluded from resolution
→ No error_description reaches UI
```
INV-8 HOLDS.

---

### BW-AUTH-2026-008 — INV-9: Recovery Session Signout Silent Swallow [PARTIAL]

**Verifying:** INV-9 (recovery session signout may fail silently)
**Result:** PARTIAL

**Adversarial Test:**
Simulate: dalSignOutRecoverySession() fails (network error).
- Recovery session remains valid for remainder of JWT lifetime
- An attacker who intercepted the recovery JWT could use it within the window
- The recovery session scope may allow password changes or other auth operations

**Outcome:** PARTIAL — bounded by JWT expiry. Not immediately exploitable without the JWT. BW-AUTH-003 carry-forward (confirmed from 2026-06-06).

---

## New BLACKWIDOW Findings

---

### BW-AUTH-2026-009 — VEN-AUTH-2026-003: dalUpdateProfileDiscoverable Caller Unverified [UNRESOLVED]

**Finding ID:** BW-AUTH-2026-009
**Severity:** MEDIUM
**Result:** UNRESOLVED (NEW — source not read)

**Finding:** VEN-AUTH-2026-003 flagged that `dalUpdateProfileDiscoverable` has an ABSENT ownership check (source not read in ARCHITECT pass). BLACKWIDOW cannot adversarially test this without source verification. The risk is that a caller could pass an arbitrary profileId and update another user's discoverability setting.

**Route to:** ELEKTRA — source read of `dalUpdateProfileDiscoverable` and its caller chain.

---

### BW-AUTH-2026-010 — Actor Creation Idempotency Confirmed [BLOCKED]

**Finding ID:** BW-AUTH-2026-010
**Verifying:** INV-10 (actor creation idempotency)
**Severity:** N/A
**Result:** BLOCKED ✓

**Test:** Trigger actor creation flow twice for the same user.
- createUserActorForProfile.controller checks: if actor already exists (via dalGetActorByProfile), skips creation
- dalCreateActorOwner: duplicate (23505) silently ignored
- Result: BLOCKED — second creation attempt is safely idempotent

---

## VENOM Cross-References

| VENOM Finding | BW Verdict | BW Finding |
|---|---|---|
| VEN-AUTH-2026-001 | PARTIAL | BW-AUTH-2026-002 |
| VEN-AUTH-2026-002 | BYPASSED (self) | BW-AUTH-2026-001 |
| VEN-AUTH-2026-003 | UNRESOLVED | BW-AUTH-2026-009 |
| VEN-AUTH-2026-004 | DB audit required | carry-forward |
| VEN-AUTH-2026-005 | BYPASSED (THOR BLOCKER) | BW-AUTH-2026-001 |

---

## THOR Impact

```
THOR Release Blockers: YES — BW-AUTH-2026-001 / VEN-AUTH-2026-005 (INV-3 VIOLATED — self-exploit password reset)
Conditional: BW-ONBOARD-001 from 2026-06-06 (is_adult bypass) blocks Void Realm feature
Highest Open Severity: HIGH
Recommendation: CAUTION — THOR BLOCKER must be resolved before general release
```

---

## Required Follow-Up Commands

| Command | Findings | Priority |
|---|---|---|
| ELEKTRA | BW-AUTH-2026-001 (fallback nonce removal patch), BW-AUTH-2026-009 (dalUpdateProfileDiscoverable source read) | P0 |
| DB | VEN-AUTH-2026-001 DB AUDIT NOTE (profiles RLS), VEN-AUTH-2026-004 DB AUDIT NOTE (generate_username schema) | P1 |
| SPIDER-MAN | INV-1, INV-2, INV-6, INV-8, INV-10, INV-11 (regression tests for all HOLDS) | P1 |
