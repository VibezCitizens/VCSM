# VENOM V2 SECURITY REVIEW — app
**Date:** 2026-06-07T10:30:00
**Scanner Version:** 1.1.0
**Application Scope:** VCSM
**Command:** VENOM

## Output Metadata
| Field | Value |
|---|---|
| Category Key | feature-security |
| Feature | app |
| Command | VENOM |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/app/outputs/2026/06/07/Venom/2026-06-07_venom_app-security-review.md |
| Timestamp | 2026-06-07T10:30:00 |

---

## 1. VENOM Scanner Preflight

```
VENOM ARCHITECT OUTPUT CHECK
==============================
ARCHITECT Output: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json
Generated At: 2026-06-07T08:11:09Z
Age: 0 days
Freshness: FRESH
Scope: VCSM:app (platform-area — included in multi-module pass)
Status: PASS

Security Surface Counts (from ARCHITECT evidence bundle):
Write surfaces: 0 (platform shell — delegates all writes to auth.adapter)
RPC surfaces: 0
Edge function surfaces: 1 (auth-register-recovery — called from AuthProvider)
Security paths: ALL LOW confidence (SPA limitation — all routes classified public)
Execution paths resolved: 0
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | 0 | Primary attack surface inventory |
| edge-function-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | 1 | Edge function surface (auth-register-recovery) |
| security-path-map | 2026-06-07T08:11:09Z | 0h | FRESH | LOW | all platform routes | Route security path inventory |
| route-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | all classified public | Route access classification |

Scanner Version: 1.1.0 | Overall Preflight: FRESH | Preflight Action: PASSED
Total surfaces in scope: 0 write + 0 rpc + 1 edge function

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: app (platform shell)
Scan Date: 2026-06-07T08:11:09Z

Write Surfaces: 0 (app shell delegates all writes to auth.adapter)
RPC Calls: 0
Edge Functions: 1 (auth-register-recovery — called from AuthProvider.jsx:116-129)

Security Paths: ALL LOW confidence (SPA limitation)
  Access=public per scanner: ALL (scanner cannot resolve React Router guards)
  Actual access pattern (verified): ProtectedRoute wraps all app routes
  Route map verified against source: YES (AuthProvider, ProtectedRoute, ProfileGatedOutlet read)

Execution Paths Resolved: 0 (SPA limitation)
```

---

## 4. Scanner Signals

| Signal | Source Map | Map Entry | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|---|
| Edge function auth-register-recovery from AuthProvider.jsx | edge-function-map | VCSM:app edgeFunctions | HIGH | YES — evidence-bundle.md CHAIN-app-001 confirms IIFE at AuthProvider.jsx:116-129; failure silently swallowed | [SOURCE_VERIFIED] | VEN-APP-2026-001 |
| logout() scope:'local' in AuthProvider.jsx:206 | security-path-map | VCSM:app | HIGH | YES — evidence-bundle.md Architecture State: documented LOKI AD-01/AD-02 | [SOURCE_VERIFIED] | VEN-APP-2026-002 (LOW — by design) |
| All routes classified public by scanner | route-map | ALL routes | LOW | Partial — verified ProtectedRoute wraps app routes from source | [SCANNER_LEAD] | ARCH-001 (carry-forward) |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/app/BEHAVIOR.md
BEHAVIOR.md exists: YES (file exists)
BEHAVIOR.md status: PLACEHOLDER
§5 Security Rules declared: 0
§5 Rules verified in source: 0 / 0
§9 Must Never Happen declared: 0
§9 Invariants protected in source: 0 / 0

Note: All findings are UNANCHORED — no behavior contract to cross-check against.
```

---

## 6. Trust Boundary Findings

---

### VEN-APP-2026-001 — PASSWORD_RECOVERY Permit Registration Failure Silently Swallowed [SOURCE_VERIFIED]

**Finding ID:** VEN-APP-2026-001
**Location:** apps/VCSM/src/app/providers/AuthProvider.jsx:116-129
**Application Scope:** VCSM
**Platform Surface:** Auth Shell / Recovery Flow
**Trust Boundary:** Server-side recovery permit confirmation
**Boundary Violated:** SERVER_PERMIT_ENFORCEMENT — permit registration can fail without blocking navigation

**Current behavior:** When Supabase fires a `PASSWORD_RECOVERY` auth event, AuthProvider triggers an async IIFE that calls `dalRegisterRecoveryPermit()` (the `auth-register-recovery` Edge Function). If the Edge Function call fails (network error, service outage, timeout), the error is silently caught and navigation to `/reset-password` always proceeds in the `finally` block. The user arrives at the password reset screen without a confirmed server-side permit.

**Risk:** The password reset flow at `/reset-password` has two paths:
1. Server-side permitId validated by `auth-reset-password-secure` Edge Function (SECURE)
2. Fallback: client-side sessionStorage nonce (`vc.auth.recovery`) as recovery proof (INSECURE)

If the server-side permit registration silently fails, the fallback path becomes the active path. The sessionStorage nonce is client-forgeable. This is the delivery mechanism for the known VEN-AUTH-001 / INV-3 VIOLATED (THOR blocker): a source-code-aware user with a valid authenticated session can reach `supabase.auth.updateUser({ password })` via the fallback path without a genuine server-verified recovery session origin.

**Severity:** MEDIUM (compounding factor for HIGH VEN-AUTH-001 THOR BLOCKER)
**Exploitability:** MEDIUM (requires network failure or service outage to trigger silently; self-exploit)
**Attack Preconditions:** Authenticated session + network disruption during PASSWORD_RECOVERY event OR direct manipulation of IIFE timing
**Blast Radius:** MEDIUM (self-exploit only — cannot reset another user's password via this path)
**Identity Leak Type:** N/A
**Cache Trust Type:** sessionStorage nonce (forgeable)
**RLS Dependency:** NONE (app-layer logic)

**Why it matters:** The server-side permit is the stronger security backstop. Silent failure means its absence is invisible to monitoring, logging, or the user. This gap degrades defense-in-depth for the recovery flow.

**Recommended mitigation:**
In the `catch` block at AuthProvider.jsx:~124, set an error flag and conditionally navigate:
```js
catch (err) {
  captureVcsmError({ context: 'PASSWORD_RECOVERY_PERMIT', error: err });
  // Do NOT silently swallow — surface the failure
  setRecoveryPermitFailed(true);
  // Navigate but signal that permit is absent
  navigate('/reset-password?permit_failed=1', { replace: true });
}
```
Then in ResetPasswordScreen, reject the fallback path if `permit_failed=1` is present in query. Alternatively: remove the `finally` navigation and only navigate on success.

**Rationale:** The permit exists to establish a server-verified recovery context. If it cannot be established, the server-verified path is unavailable and only the insecure fallback remains. The system should surface this state rather than hide it.

**Follow-up command:** BLACKWIDOW (confirm silent fail bypass), ELEKTRA (full chain trace)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

---

### VEN-APP-2026-002 — logout() scope:'local' — Other Sessions Remain Valid [SOURCE_VERIFIED]

**Finding ID:** VEN-APP-2026-002
**Location:** apps/VCSM/src/app/providers/AuthProvider.jsx:206
**Application Scope:** VCSM
**Platform Surface:** Auth Shell / Logout
**Trust Boundary:** Session invalidation boundary

**Current behavior:** `supabase.auth.signOut({ scope: 'local' })` terminates only the current browser session. All other active sessions on other devices remain valid until natural JWT expiry.

**Risk:** Low — this is intentional per LOKI AD-01/AD-02 design decision. Prevents accidental global logout on multi-device workflows. If an account is compromised, a platform-wide logout requires a different mechanism.

**Severity:** LOW (by design — documented)
**Exploitability:** LOW (requires compromised account to matter)
**RLS Dependency:** NONE

**Recommended mitigation:** None required unless the threat model changes. Document in BEHAVIOR.md when authored. Consider adding a "Sign out all devices" option in settings.

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Operations

---

### VEN-APP-2026-003 — BEHAVIOR.md is PLACEHOLDER [SOURCE_VERIFIED]

**Finding ID:** VEN-APP-2026-003
**Location:** ZZnotforproduction/APPS/VCSM/features/app/BEHAVIOR.md
**Application Scope:** VCSM
**Platform Surface:** Governance
**Severity:** LOW
**Boundary Violated:** BEHAVIOR_CONTRACT_ABSENT

**Current behavior:** BEHAVIOR.md exists as a placeholder. No §5 Security Rules. No §9 Must Never Happen invariants. The app shell is the primary trust enforcement layer for all app routes — its missing behavior contract means no formal invariants govern ProtectedRoute behavior, consent gating, or recovery flow.

**Recommended mitigation:** Route to WOLVERINE. At minimum, declare §9 invariants:
- "ProtectedRoute MUST NEVER allow unauthenticated access to any /app/* route"
- "Password reset MUST NEVER proceed without server-verified recovery permit"
- "Logout MUST NEVER leave actor identity data in localStorage (clearAllIdentityStorage must complete before signOut)"

**CISSP Domain:**
- Primary: Security and Risk Management
- Secondary: Security Assessment and Testing

---

## 7. Source Verification Summary

```
Total surfaces in scope: 0 write + 1 edge function
Surfaces source-verified: 1 / 1
Source files read (via evidence bundle): 5
  - apps/VCSM/src/app/providers/AuthProvider.jsx — reason: PASSWORD_RECOVERY IIFE verification (VEN-APP-2026-001)
  - apps/VCSM/src/app/guards/ProtectedRoute.jsx — reason: gating chain verification
  - apps/VCSM/src/app/guards/ProfileGatedOutlet.jsx — reason: profile gate verification
  - apps/VCSM/src/app/routes/index.jsx — reason: route access classification
  - apps/VCSM/src/features/auth/adapters/auth.adapter.js — reason: auth surface delegation
CRITICAL findings: 0
[SOURCE_VERIFIED] findings: 3
```

---

## 8. Confidence Summary

```
HIGH confidence surfaces: 1 (edge function)
LOW confidence surfaces: 0
[SOURCE_VERIFIED] findings: 3
[SCANNER_LEAD] findings: 0
```

---

## 9. THOR Impact

```
THOR Release Blockers: NONE (VEN-APP-2026-001 is MEDIUM; compounding factor for VEN-AUTH-001 THOR blocker)
Note: VEN-AUTH-001 (password reset fallback) remains the THOR blocker — VEN-APP-2026-001 is the delivery mechanism
Highest Open Severity: MEDIUM
Recommendation: CAUTION
```

---

## 10. SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| VENOM | 0 (all via evidence bundle) | YES — ZZnotforproduction/APPS/VCSM/features/app/outputs/2026/06/07/ARCHITECT/evidence-bundle.md | NO |

---

## 11. Required Follow-Up Commands

| Command | Findings | Priority |
|---|---|---|
| BLACKWIDOW | VEN-APP-2026-001 (permit fail bypass simulation) | P1 |
| ELEKTRA | VEN-APP-2026-001 (AuthProvider.jsx:116-129 patch chain) | P1 |
| WOLVERINE | VEN-APP-2026-003 (BEHAVIOR.md intake) | P2 |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-APP-2026-003 |
| Asset Security | 0 | No data classification issues found |
| Security Architecture and Engineering | 1 | VEN-APP-2026-001 (secondary) |
| Communication and Network Security | 0 | No network surface issues |
| Identity and Access Management | 2 | VEN-APP-2026-001 (primary), VEN-APP-2026-002 (primary) |
| Security Assessment and Testing | 1 | VEN-APP-2026-003 (secondary) |
| Security Operations | 1 | VEN-APP-2026-002 (secondary) |
| Software Development Security | 0 | No unsafe coding patterns found in platform shell |

Communication and Network Security and Software Development Security: limited coverage in this scope — platform shell has no direct network calls or complex coding patterns beyond auth event handling.
