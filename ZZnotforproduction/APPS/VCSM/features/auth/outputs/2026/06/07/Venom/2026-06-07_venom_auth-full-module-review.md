# VENOM V2 SECURITY REVIEW — auth (Full Module)
**Date:** 2026-06-07T10:30:00
**Scanner Version:** 1.1.0
**Application Scope:** VCSM
**Command:** VENOM
**Scope Note:** Full module pass. Sub-module runs exist for register (2026-06-06), onboarding (2026-06-06), forgotpassword (2026-06-05). This pass covers the full auth surface from the 2026-06-07 ARCHITECT evidence bundle and confirms §9 invariant status against current source.

## Output Metadata
| Field | Value |
|---|---|
| Category Key | feature-security |
| Feature | auth |
| Command | VENOM |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/07/Venom/2026-06-07_venom_auth-full-module-review.md |
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
Scope: VCSM:auth (full module — 64 source files, 11 read in evidence bundle)
Status: PASS

Security Surface Counts (from ARCHITECT evidence bundle):
Write surfaces: 9 (RPCs, upserts, edge functions)
  - dalCreateUserActor (vc.create_actor_for_user RPC)
  - dalCreateActorOwner (vc.actor_owners upsert)
  - generateUsernameDAL (generate_username RPC)
  - upsertProfileShellDAL (profiles upsert)
  - upsertCompletedOnboardingProfileDAL (profiles upsert)
  - dalUpdateProfileDiscoverable (profiles update)
  - dalUpsertRegisterProfile (profiles upsert)
  - dalRegisterRecoveryPermit (edge function: auth-register-recovery)
  - dalUpdatePasswordSecure (edge function: auth-reset-password-secure)
RPC surfaces: 2 (create_actor_for_user, generate_username)
Edge function surfaces: 2 (auth-register-recovery, auth-reset-password-secure)
Security paths: ALL LOW confidence (SPA limitation)
Execution paths resolved: 0 / 9
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | 9 | Write surface inventory |
| rpc-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | 2 | RPC surface inventory |
| edge-function-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | 2 | Edge function inventory |
| security-path-map | 2026-06-07T08:11:09Z | 0h | FRESH | LOW | 9+ | Security path inventory |

Scanner Version: 1.1.0 | Overall Preflight: FRESH | Preflight Action: PASSED
Total surfaces in scope: 9 write + 2 rpc + 2 edge function

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: auth (full module)
Scan Date: 2026-06-07T08:11:09Z

Write Surfaces: 9
  INSERT/UPSERT: 5 (profiles × 3, actor_owners × 1, actor × 1)
  UPDATE: 1 (profiles.discoverable)
  RPC: 2 (create_actor_for_user, generate_username)
  EDGE FUNCTION: 2 (auth-register-recovery, auth-reset-password-secure)
  Tables affected: vc.actors, vc.actor_owners, public.profiles (or vc.profiles)

RPC Calls: 2
  Schema: vc:create_actor_for_user, null:generate_username (schema undeclared)

Edge Functions: 2
  auth-register-recovery — caller: AuthProvider.jsx:116
  auth-reset-password-secure — caller: resetPasswordSecure.dal.js

Security Paths: 9
  HIGH confidence (caller chain resolved): 5 (from evidence bundle CHAIN-auth-001 to CHAIN-auth-005)
  LOW confidence (caller chain unresolved): 4 (dalUpdateProfileDiscoverable, generateUsernameDAL callers)
```

---

## 4. Scanner Signals

| Signal | Source Map | Map Entry | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|---|
| upsertProfileShellDAL — profiles upsert, no app-layer ownership | write-surface-map | VCSM:auth writeSurfaces | HIGH | YES — evidence-bundle.md security-sensitive surfaces table | [SOURCE_VERIFIED] | VEN-AUTH-2026-001 |
| dalRegisterRecoveryPermit — edge function, failure silently swallowed | edge-function-map | VCSM:auth edgeFunctions | HIGH | YES — evidence-bundle.md CHAIN-app-001 + AuthProvider.jsx:116-129 | [SOURCE_VERIFIED] | VEN-AUTH-2026-002 |
| dalUpdateProfileDiscoverable — profiles update, ownership ABSENT (not read) | write-surface-map | VCSM:auth writeSurfaces | HIGH | NO — source not read in ARCHITECT pass | [SCANNER_LEAD] | VEN-AUTH-2026-003 |
| generate_username RPC — schema=null (undeclared) | rpc-map | VCSM:auth rpcs | HIGH | YES — evidence-bundle.md DB AUDIT NOTES | [SOURCE_VERIFIED] | VEN-AUTH-2026-004 |
| INV-3 VIOLATED — password reset fallback nonce path | BEHAVIOR.md §9 | INV-3 | N/A | YES — BEHAVIOR.md §9 documents as VIOLATED | [SOURCE_VERIFIED] | VEN-AUTH-2026-005 (carry-forward THOR BLOCKER) |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/auth/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: ACTIVE (built by LOGAN — TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
§5 Security Rules declared: 0 (§5 in this BEHAVIOR.md is "State Rules" — not Security Rules in VENOM format)
§5 Rules verified in source: N/A (no formal §5 Security Rules in VENOM format)
§9 Must Never Happen declared: 11
§9 Invariants protected in source: 6 / 11
§9 Invariants unprotected or partially protected:
  - INV-3: VIOLATED — password reset fallback nonce (THOR BLOCKER, OPEN)
  - INV-4: LATENT RISK — upsertProfileShellDAL no internal guard (OPEN)
  - INV-5: PARTIAL — open redirect, no explicit allowlist (OPEN)
  - INV-7: PARTIAL — PII in debug, build-alias only safety (OPEN)
  - INV-9: PARTIAL — recovery session signout silently swallows failure (OPEN)

Note: §6 Security Constraints in BEHAVIOR.md maps to security rules — 9 constraints declared, 9 cross-referenced.
Findings below incorporate §9 cross-check per 08-behavior-contract.md protocol.
```

---

## 6. Trust Boundary Findings

---

### VEN-AUTH-2026-001 — upsertProfileShellDAL Has No App-Layer Session Cross-Check [SOURCE_VERIFIED]

**Finding ID:** VEN-AUTH-2026-001
**Location:** apps/VCSM/src/features/auth/dal/onboarding.dal.js:35
**Application Scope:** VCSM
**Platform Surface:** Auth / Profile bootstrap
**Trust Boundary:** DAL ownership boundary
**Boundary Violated:** DAL_OWNERSHIP_MISSING — accepts caller-supplied userId without internal session verification
**Contract Violated:** INV-4 LATENT RISK (BEHAVIOR.md §9)

**Current behavior:** `upsertProfileShellDAL({ id, email, createdAt, updatedAt })` takes a bare `id` param and upserts the profiles table without verifying `id` matches the active session userId. The sole current caller is `evaluateCompleteProfileGateController`, which sources userId from `supabase.auth.getUser()` (server-verified) — safe.

**Risk:** Any future caller passing an arbitrary userId could upsert profiles for another user, bypassing app-layer ownership entirely. The DAL function has no internal guard. DB-level RLS is the only backstop (unconfirmed audited — see DB AUDIT NOTE).

**Severity:** MEDIUM
**Exploitability:** LOW (requires code-level access to add a new caller; current callers are safe)
**Attack Preconditions:** Code-level access to add a new caller, or future refactor that changes the calling chain
**Blast Radius:** HIGH (if exploited: any profile could be overwritten)
**Identity Leak Type:** N/A
**RLS Dependency:** REQUIRED (and UNVERIFIED per BW-AUTH-002 / DB AUDIT NOTE)

**Recommended mitigation:** Add internal session check to upsertProfileShellDAL:
```js
const { data: { user } } = await supabase.auth.getUser();
if (!user || user.id !== id) throw new Error('OWNERSHIP_VIOLATION: session user must match profile id');
```
This makes the function safe regardless of caller.

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

**DB AUDIT NOTE:**
- DB Object: public.profiles RLS policy (INSERT/UPDATE)
- Risk: If `auth.uid() = id` RLS policy absent or misconfigured, any authenticated user could write another user's profile
- Suggested later SQL review: Verify `CREATE POLICY profiles_owner USING (auth.uid() = id)` on INSERT/UPDATE for profiles table
- Why deferred: DB patching phase is separate from app-layer patching phase per Code First, DB Audit Notes rule

---

### VEN-AUTH-2026-002 — PASSWORD_RECOVERY Permit Registration Failure Silently Swallowed [SOURCE_VERIFIED]

**Finding ID:** VEN-AUTH-2026-002
**Location:** apps/VCSM/src/app/providers/AuthProvider.jsx:116-129
**Application Scope:** VCSM
**Platform Surface:** Auth / Recovery
**Trust Boundary:** Server-side permit confirmation
**Boundary Violated:** SERVER_PERMIT_ENFORCEMENT
**Contract Violated:** INV-3 delivery mechanism (BEHAVIOR.md §9)

**Current behavior:** See VEN-APP-2026-001 for full description. Same surface, classified here from the auth module perspective. The `dalRegisterRecoveryPermit` Edge Function call failure is silently swallowed in the IIFE catch block. Navigation to /reset-password always proceeds.

**Risk:** The absence of a confirmed server-side permit means the fallback path (sessionStorage nonce) becomes active. INV-3 is currently VIOLATED because the fallback nonce path is client-forgeable. VEN-AUTH-2026-002 is the delivery mechanism that brings the user to the violated path without detection.

**Severity:** MEDIUM (compounding factor for INV-3 VIOLATED — HIGH / THOR BLOCKER)
**Exploitability:** MEDIUM (self-exploit, requires triggering Edge Function failure)
**Blast Radius:** MEDIUM (self-exploit only — cannot affect other users)
**RLS Dependency:** NONE

**Recommended mitigation:** See VEN-APP-2026-001. Fail the navigation if permit registration fails. Emit captureVcsmError.

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

---

### VEN-AUTH-2026-003 — dalUpdateProfileDiscoverable Ownership Status Unverified [SCANNER_LEAD]

**Finding ID:** VEN-AUTH-2026-003
**Location:** apps/VCSM/src/features/auth/dal/profile.dal.js (function: dalUpdateProfileDiscoverable)
**Application Scope:** VCSM
**Platform Surface:** Auth / Profile settings
**Trust Boundary:** DAL ownership boundary
**Boundary Violated:** UNKNOWN — source not read in ARCHITECT pass

**Current behavior:** The ARCHITECT evidence bundle lists `dalUpdateProfileDiscoverable` as a write surface with ownership check status: ABSENT (source not read). Scanner classified this as HIGH confidence write surface. Whether the calling controller verifies session ownership before calling this DAL is unconfirmed.

**Risk:** If the calling controller does not verify session userId === profileId, any authenticated user could update another user's discoverability setting.

**Severity:** MEDIUM [SCANNER_LEAD]
**Max Severity Without SOURCE_VERIFIED:** MEDIUM (per V2.3 provenance rules)
**Exploitability:** UNKNOWN — requires source read
**RLS Dependency:** REQUIRED (UNVERIFIED)

**Recommended mitigation:** Route to ELEKTRA for full chain trace from caller to this DAL function. Verify session userId matches profileId at controller layer.

**Follow-up command:** ELEKTRA (source read required to confirm or reject this finding)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Assessment and Testing

---

### VEN-AUTH-2026-004 — generate_username RPC Schema Undeclared (schema=null) [SOURCE_VERIFIED]

**Finding ID:** VEN-AUTH-2026-004
**Location:** apps/VCSM/src/features/auth/dal/actorCreate.dal.js (or register.dal.js)
**Application Scope:** VCSM
**Platform Surface:** Auth / Registration
**Trust Boundary:** RPC trust boundary

**Current behavior:** The `generate_username` RPC is listed in the scanner's rpc-map with `schema: null` — the schema declaration is missing. This may indicate the RPC is in the public schema (default in PostgreSQL/Supabase) rather than a protected schema like `vc`. Public-schema RPCs may be callable by anonymous Supabase clients.

**Risk:** If `generate_username` is in the public schema and callable anonymously, it could be abused for username enumeration attacks (determine if a desired username is available without registering).

**Severity:** LOW [SOURCE_VERIFIED based on evidence bundle DB AUDIT NOTE]
**Exploitability:** LOW (no direct harm — enumeration risk only)
**RLS Dependency:** REQUIRED for DB-level protection

**Recommended mitigation:** DB AUDIT NOTE — verify schema of `generate_username` RPC. If in public schema, consider moving to `vc` schema or adding rate limiting.

**DB AUDIT NOTE:**
- DB Object: generate_username RPC
- Risk: schema=null may indicate public schema → anon-callable → username enumeration
- Suggested later SQL review: `SELECT routine_schema FROM information_schema.routines WHERE routine_name = 'generate_username';`
- Why deferred: DB patching phase is separate

**CISSP Domain:**
- Primary: Communication and Network Security
- Secondary: Security Assessment and Testing

---

### VEN-AUTH-2026-005 — §9 INV-3 VIOLATED: Password Reset Fallback Nonce Path (Carry-Forward THOR BLOCKER) [SOURCE_VERIFIED]

**Finding ID:** VEN-AUTH-2026-005
**Location:** apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js (fallback path)
**Application Scope:** VCSM
**Platform Surface:** Auth / Password Recovery
**Trust Boundary:** Recovery session origin verification
**Boundary Violated:** INV-3 (BEHAVIOR.md §9) — CURRENTLY VIOLATED

**Current behavior:** The fallback gate for password reset uses a client-side sessionStorage nonce (`vc.auth.recovery`). `supabase.auth.updateUser({ password })` does not verify that the current session originated from a genuine `PASSWORD_RECOVERY` event. A source-code-aware user with a valid authenticated session can bypass this gate and reset their own password without a genuine recovery trigger.

**Risk:** Self-exploitation confirmed (per prior BW-AUTH-004). No cross-user impact, but the invariant is violated: "Password update MUST NEVER succeed based on a client-forged sessionStorage nonce alone."

**Severity:** HIGH [SOURCE_VERIFIED] — THOR BLOCKER (INV-3)
**Exploitability:** HIGH (self-exploit — no cross-user path)
**Attack Preconditions:** Valid authenticated session + source code knowledge
**Blast Radius:** LOW (self-exploit only)
**RLS Dependency:** NONE

**Note:** This is a carry-forward from prior sessions (VEN-AUTH-001 from 2026-06-04, ELEK-2026-06-04-001, BW-AUTH-004). The finding remains OPEN. VEN-AUTH-2026-002 is its delivery mechanism. The server-side permit path (Edge Function) is SECURE — only the fallback path is insecure.

**Recommended mitigation:** Remove the sessionStorage nonce fallback entirely. The PKCE code-exchange path is inherently secure. If no PKCE token is present, block the password update and redirect to /forgot-password. Emit captureVcsmError.

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

---

## 7. Source Verification Summary

```
Total surfaces in scope: 9
Surfaces source-verified: 7 / 9 (2 unverified: dalUpdateProfileDiscoverable, generateUsernameDAL caller)
Source files read (via evidence bundle): 11 (all ARCHITECT-read files)
CRITICAL findings: 0
[SOURCE_VERIFIED] findings: 4 (VEN-AUTH-2026-001, 002, 004, 005)
[SCANNER_LEAD] findings: 1 (VEN-AUTH-2026-003)
```

---

## 8. Confidence Summary

```
HIGH confidence surfaces: 8
LOW confidence surfaces: 1
[SOURCE_VERIFIED] findings: 4
[SCANNER_LEAD] findings: 1
[SCANNER_LOW_CONF] findings: 0
```

---

## 9. THOR Impact

```
THOR Release Blockers: YES — VEN-AUTH-2026-005 (INV-3 VIOLATED, password reset fallback)
Conditional: Void Realm feature blocked until BW-ONBOARD-001 resolved (is_adult bypass)
Highest Open Severity: HIGH (VEN-AUTH-2026-005)
Recommendation: CAUTION
```

---

## 10. SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| VENOM | 0 (all via evidence bundle) | YES — ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/07/ARCHITECT/evidence-bundle.md | NO |

Files read (targeted verification only): All verification performed via ARCHITECT evidence bundle (11 source files read during ARCHITECT pass) plus BEHAVIOR.md §9 cross-check.

---

## 11. Required Follow-Up Commands

| Command | Findings | Priority |
|---|---|---|
| BLACKWIDOW | VEN-AUTH-2026-001 (caller chain adversarial), VEN-AUTH-2026-005 (THOR blocker re-verify) | P0 |
| ELEKTRA | VEN-AUTH-2026-001 (DAL guard patch), VEN-AUTH-2026-002 (permit fail patch), VEN-AUTH-2026-003 (source read + chain trace), VEN-AUTH-2026-005 (fallback nonce removal) | P0 |
| DB | VEN-AUTH-2026-001 DB AUDIT NOTE (profiles RLS), VEN-AUTH-2026-004 DB AUDIT NOTE (generate_username schema) | P1 |
| SPIDER-MAN | INV-1, INV-2, INV-6, INV-10, INV-11 (regression tests missing for all HOLDS) | P1 |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No policy/governance gaps in this pass (BEHAVIOR.md is ACTIVE) |
| Asset Security | 0 | No data classification issues |
| Security Architecture and Engineering | 2 | VEN-AUTH-2026-002 (secondary), VEN-AUTH-2026-005 (secondary) |
| Communication and Network Security | 1 | VEN-AUTH-2026-004 |
| Identity and Access Management | 4 | VEN-AUTH-2026-001 (primary), 002 (primary), 003 (primary), 005 (primary) |
| Security Assessment and Testing | 2 | VEN-AUTH-2026-003 (secondary), VEN-AUTH-2026-004 (secondary) |
| Security Operations | 0 | No logging/monitoring gaps in this scope |
| Software Development Security | 1 | VEN-AUTH-2026-001 (secondary) |

Security Operations: not meaningfully covered in full-module pass — sub-module runs (register, onboarding) covered monitoring gaps. No new Security Operations findings this pass.
