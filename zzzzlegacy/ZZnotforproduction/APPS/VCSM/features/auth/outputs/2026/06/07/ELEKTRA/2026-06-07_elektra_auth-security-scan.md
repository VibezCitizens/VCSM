# ELEKTRA PRECISION SECURITY SCAN — auth (Full Module)
**Date:** 2026-06-07T11:30:00
**Scanner Version:** 1.1.0
**Application Scope:** VCSM
**Command:** ELEKTRA
**VENOM Gate:** PASS — 2026-06-07
**BLACKWIDOW Gate:** PASS — 2026-06-07

## Output Metadata
| Field | Value |
|---|---|
| Feature | auth |
| Command | ELEKTRA |
| Scope | VCSM:auth (full module) |
| VENOM Reference | 2026-06-07_venom_auth-full-module-review.md |
| BLACKWIDOW Reference | 2026-06-07_blackwidow_auth-adversarial-review.md |
| Timestamp | 2026-06-07T11:30:00 |

---

## Gate Status

```
ELEKTRA GATE CHECK
===================
ARCHITECT Gate: PASS (0 days old)
VENOM Gate: PASS (2026-06-07, COMPLETE)
BLACKWIDOW Gate: PASS (2026-06-07, COMPLETE)
Prior ELEKTRA runs: 2026-06-06 (onboarding), 2026-06-06 (register), 2026-06-05 (forgotpassword)
This pass: full module surface — focus on surfaces not covered by sub-module runs
```

---

## Scan Areas Activated

- Area 1: Actor Ownership / IDOR
- Area 2: Controller Input Trust
- Area 6: Auth and Session

---

## ELEK-AUTH-2026-001 — upsertProfileShellDAL: No Internal Session Cross-Check [MEDIUM]

**Finding ID:** ELEK-AUTH-2026-001
**Verifying:** VEN-AUTH-2026-001 / BW-AUTH-2026-002 (PARTIAL — latent risk confirmed)
**Severity:** MEDIUM
**Patch Type:** OWNERSHIP_GUARD (DAL layer)

**Source-to-Sink Chain:**
```
SOURCE: userId (caller-supplied parameter to upsertProfileShellDAL)
  ↓ Caller: evaluateCompleteProfileGateController
     → userId sourced from supabase.auth.getUser() (server-verified) [SAFE — current caller]
  ↓ upsertProfileShellDAL({ id: userId, email, createdAt, updatedAt })
     → dal/onboarding.dal.js:35
     → NO internal session check — accepts any `id`
SINK: supabase.from('profiles').upsert({ id }) — DB profiles table write

MISSING DEFENSE: internal session verification inside upsertProfileShellDAL
Current protection: relies entirely on caller being safe (single caller pattern)
Risk: any new caller could pass arbitrary userId
```

**Patch Advisory:**

In `apps/VCSM/src/features/auth/dal/onboarding.dal.js` (upsertProfileShellDAL):
```js
export async function upsertProfileShellDAL({ id, email, createdAt, updatedAt }) {
  // ADD: internal session verification
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('SESSION_REQUIRED');
  if (user.id !== id) throw new Error('OWNERSHIP_VIOLATION: session user must match profile id');

  // existing upsert logic
  return supabase.from('profiles').upsert({ id, email, created_at: createdAt, updated_at: updatedAt });
}
```

**Why this works:** Makes the function safe regardless of caller. The internal supabase.auth.getUser() call is a server-verified round-trip — tamper-evident. Any caller passing a foreign userId is blocked at the DAL layer.

**Note:** This adds one extra round-trip per call. The current sole caller (evaluateCompleteProfileGateController) already calls getUser() before this DAL — the DAL check is a defense-in-depth redundancy.

**CLOSES:** VEN-AUTH-2026-001, BW-AUTH-2026-002, INV-4 (moves from LATENT RISK to HOLDS)

---

## ELEK-AUTH-2026-002 — PASSWORD_RECOVERY Permit Fail: Silent Navigation [MEDIUM]

**Finding ID:** ELEK-AUTH-2026-002
**Verifying:** VEN-AUTH-2026-002 / BW-AUTH-2026-001 (BYPASSED — delivery mechanism for THOR BLOCKER)
**Severity:** MEDIUM
**Patch Type:** ERROR_HANDLING (auth provider layer)

**Source-to-Sink Chain:**
See ELEK-APP-2026-001 — same source file (AuthProvider.jsx:116-129). Full chain:
```
SOURCE: PASSWORD_RECOVERY auth event
  ↓ AuthProvider.jsx:116 IIFE → dalRegisterRecoveryPermit() → auth-register-recovery Edge Function
  ↓ [FAIL] Edge Function error caught → silently swallowed
  ↓ finally: navigate('/reset-password') — always executes
SINK: User at /reset-password without confirmed server-side permit
```

**Patch Advisory:** Identical to ELEK-APP-2026-001. Applying the ELEK-APP-2026-001 patch resolves this finding.

**Note:** This is the delivery mechanism for VEN-AUTH-2026-005 / INV-3 VIOLATED. Fixing this alone does not resolve the THOR blocker — the fallback nonce path in setNewPassword.controller.js also needs to be removed.

---

## ELEK-AUTH-2026-003 — THOR BLOCKER: Password Reset Fallback Nonce Path [HIGH]

**Finding ID:** ELEK-AUTH-2026-003
**Verifying:** VEN-AUTH-2026-005 / BW-AUTH-2026-001 (BYPASSED) / INV-3 VIOLATED
**Severity:** HIGH — THOR BLOCKER
**Patch Type:** REMOVE_FALLBACK (auth controller layer)

**Source-to-Sink Chain:**
```
SOURCE: Authenticated user session (with or without genuine PASSWORD_RECOVERY origin)
  ↓ /reset-password route → ResetPasswordScreen
  ↓ setNewPassword.controller.js — checks RECOVERY_FLAG_KEY in sessionStorage
  ↓ FALLBACK: if RECOVERY_FLAG_KEY absent or expired → returns { ok: false }
     BUT: supabase.auth.updateUser({ password }) does not intrinsically require
     the session to have originated from a PASSWORD_RECOVERY event
  ↓ A valid authenticated session can call supabase.auth.updateUser({ password }) directly
SINK: Password updated without verified recovery session origin

MISSING DEFENSE: Server-side verification that the session originated from PASSWORD_RECOVERY
The server-side permit (auth-register-recovery Edge Function) IS the correct backstop
```

**Patch Advisory (REMOVE FALLBACK):**

In `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js`:
```js
// Current:
export async function setNewPasswordController({ password }) {
  const nonce = sessionStorage.getItem(RECOVERY_FLAG_KEY);
  if (!nonce) return { ok: false, error: 'RECOVERY_SESSION_EXPIRED' };
  
  // Then calls: supabase.auth.updateUser({ password })
  // Problem: nonce is client-side only; supabase.auth.updateUser doesn't verify recovery origin

// Patched: use the server-verified permitId path exclusively
export async function setNewPasswordController({ password, permitId }) {
  // permitId must come from server-side permit registration (auth-register-recovery)
  if (!permitId) return { ok: false, error: 'PERMIT_REQUIRED: use the forgot-password flow' };
  
  // Call auth-reset-password-secure Edge Function (which validates permitId server-side)
  return dalUpdatePasswordSecure({ permitId, password });
  
  // NEVER call supabase.auth.updateUser({ password }) directly from this controller
}
```

Remove the sessionStorage nonce fallback entirely. The `auth-reset-password-secure` Edge Function already validates the permitId server-side — this is the correct and secure path.

**Why this works:** The server-side permit is generated by Supabase during a genuine PASSWORD_RECOVERY event (JWT-signed). The `auth-reset-password-secure` Edge Function validates the permitId matches a DB-stored permit for the current user. Client-side state cannot forge this.

**CLOSES:** VEN-AUTH-2026-005, INV-3 (VIOLATED → HOLDS when patched)
**UNBLOCKS:** THOR release gate

---

## ELEK-AUTH-2026-004 — dalUpdateProfileDiscoverable: Caller Chain Verification [MEDIUM]

**Finding ID:** ELEK-AUTH-2026-004
**Verifying:** VEN-AUTH-2026-003 / BW-AUTH-2026-009 (UNRESOLVED)
**Severity:** MEDIUM [SCANNER_LEAD — source not read]
**Patch Type:** REQUIRES SOURCE READ before advisory

**Source-to-Sink Chain (partial):**
```
SOURCE: discoverability preference (user toggle)
  ↓ [CALLER UNKNOWN — source not read]
  ↓ dalUpdateProfileDiscoverable(profileId, isDiscoverable)
SINK: supabase.from('profiles').update({ is_discoverable }) WHERE id = profileId
```

**Status:** [SCANNER_LEAD] — `dalUpdateProfileDiscoverable` and its callers were not read in the ARCHITECT pass. Cannot complete the chain without source verification.

**Advisory:** Read `apps/VCSM/src/features/auth/dal/profile.dal.js` (dalUpdateProfileDiscoverable) and its callers to verify:
1. The caller derives `profileId` from the authenticated session (not from a client parameter)
2. The caller checks session userId === profileId before calling the DAL
3. OR the DAL itself verifies session ownership (preferred pattern per ELEK-AUTH-2026-001)

If the caller passes unchecked profileId: patch with same OWNERSHIP_GUARD pattern as ELEK-AUTH-2026-001.

**Max severity without SOURCE_VERIFIED:** MEDIUM (per V2.3 provenance rules).

---

## False Positives Rejected

**FP-AUTH-001:** dalCreateActorOwner upsert (actor_owners) — REJECTED. Actor is just created in the same flow; idempotent by design. The ownership record is established immediately after actor creation. No ownership gap.

**FP-AUTH-002:** getSession() vs getUser() for ownership guards — REJECTED as CRITICAL in this pass. The Supabase JWT is server-signed and tamper-evident. For ownership-check purposes, the JWT sub claim is reliable. Only write operations (like profile upsert) benefit from the extra getUser() round-trip. Low-value operations like session reads can use getSession(). Retained as LOW per prior ELEK-2026-06-04-005.

**FP-AUTH-003:** generate_username RPC anon-callable — REJECTED as HIGH. Username enumeration via repeated RPC calls has no exploitable security impact on platform data. Rated LOW per VEN-AUTH-2026-004. DB audit will confirm schema placement.

---

## THOR Release Gate Assessment

```
THOR Release Blockers: YES — ELEK-AUTH-2026-003 (INV-3 VIOLATED, fallback nonce path must be removed)
Conditional: BW-ONBOARD-001 from 2026-06-06 (is_adult bypass — PATCHED in Batch 1, but regression test missing)
Required patches before THOR:
  1. ELEK-AUTH-2026-003 (SIMPLE — remove fallback nonce, use dalUpdatePasswordSecure exclusively)
  2. ELEK-APP-2026-001 / ELEK-AUTH-2026-002 (SIMPLE — surface permit failure in IIFE)
Recommendation: CAUTION — THOR gate requires 3 simple patches (2 one-line changes + 1 function removal)
Highest Open Severity: HIGH
```

---

## Output Summary

```
CRITICAL: 0
HIGH: 1 (ELEK-AUTH-2026-003 — THOR BLOCKER, fallback nonce removal)
MEDIUM: 3 (ELEK-AUTH-2026-001, 002, 004)
LOW: 0
False Positives Rejected: 3
```
