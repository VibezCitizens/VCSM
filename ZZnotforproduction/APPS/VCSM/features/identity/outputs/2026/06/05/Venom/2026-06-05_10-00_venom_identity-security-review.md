---
name: vcsm.identity.venom.2026-06-05
description: VENOM V2 security review — VCSM identity feature (blue team re-run, post-BEHAVIOR.md authoring)
metadata:
  type: security-audit
  command: VENOM
  feature: identity
  scope: apps/VCSM/src/features/identity + apps/VCSM/src/state/identity
  date: 2026-06-05
  trigger: Blue team re-run — BEHAVIOR.md authored 2026-06-05 by LOGAN; first re-run since contract established
  prior-run: 2026-06-04
---

# VENOM V2 SECURITY REVIEW
**Feature:** identity
**Application Scope:** VCSM
**Date:** 2026-06-05
**Reviewer:** VENOM
**Trigger:** Full blue team run ordered post-BEHAVIOR.md authoring (LOGAN 2026-06-05); ELEKTRA has never run; prior VENOM was 2026-06-04

---

## Output Metadata

| Field | Value |
|---|---|
| Feature | identity |
| Command | VENOM V2 |
| Scanner Version | 1.1.0 (ARCHITECT outputs 2026-06-04 — within 3-day window) |
| Output Path | ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/05/Venom/2026-06-05_10-00_venom_identity-security-review.md |
| Timestamp | 2026-06-05T10:00:00 |

---

## 1. VENOM SCANNER PREFLIGHT

```
VENOM ARCHITECT OUTPUT CHECK
==============================
evidence-bundle.json:         MISSING — no JSON bundle artifact
ARCHITECTURE.md:              PRESENT — 2026-06-04T19:48:25Z (age: ~14h) — FRESH
INDEX.md:                     PRESENT — 2026-06-04T19:48:25Z — FRESH
architect-security-surface.json: MISSING — not produced by ARCHITECT run

Fallback Mode: ARCHITECTURE-MD-FALLBACK
  ARCHITECTURE.md used as authoritative architecture record in place of evidence-bundle.json
  Scanner inputs (feature-map, callgraph, write-surface-map, route-map, engine-candidates,
  dependency-map) all generated at 2026-06-04T19:48:25Z — within 3-day freshness window.
  Source verification performed directly on cited files.

Status: WARN (no JSON bundle) — proceeding with ARCHITECTURE-MD-FALLBACK
Preflight Action: CONTINUED — ARCHITECTURE.md and INDEX.md are current and authoritative
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Used For |
|---|---|---|---|---|---|
| ARCHITECTURE.md (feature-map) | 2026-06-04T19:48:25Z | ~14h | FRESH | HIGH | Controller/DAL/adapter inventory |
| ARCHITECTURE.md (callgraph) | 2026-06-04T19:48:25Z | ~14h | FRESH | HIGH | Call chain tracing |
| ARCHITECTURE.md (write-surface-map) | 2026-06-04T19:48:25Z | ~14h | FRESH | HIGH | Write surface inventory |
| ARCHITECTURE.md (route-map) | 2026-06-04T19:48:25Z | ~14h | FRESH | HIGH | No routes — identity is non-UI |
| ARCHITECTURE.md (engine-candidates) | 2026-06-04T19:48:25Z | ~14h | FRESH | MEDIUM | Engine dependency mapping |
| ARCHITECTURE.md (dependency-map) | 2026-06-04T19:48:25Z | ~14h | FRESH | HIGH | Cross-feature dependency verification |

```
Scanner Version: 1.1.0
Overall Preflight: ARCHITECTURE-MD-FALLBACK (WARN — no evidence-bundle.json)
Total write surfaces in scope: 2 RPC
Total security paths in scope: 2 (both HIGH confidence — resolved)
```

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: identity
Source Scope: apps/VCSM/src/features/identity/ + apps/VCSM/src/state/identity/
Total source files reviewed: 9 (feature) + 7 (state/identity)

Write Surfaces: 0 direct table writes
  INSERT: 0 | UPDATE: 0 | DELETE: 0 | UPSERT: 0

RPC Calls: 2
  platform: provision_vcsm_identity (SECURITY DEFINER)
  identity: refresh_actor_directory_row

Edge Functions: 0

Security Paths: 2 HIGH confidence + 1 additional (self-heal controller)
  Path 1: useIdentityResolutionEffect → ensureVcsmPlatformBootstrap → dalProvisionVcsmIdentity → platform.provision_vcsm_identity
  Path 2: refreshVcActorDirectory / refreshActorDirectoryRow → identity.refresh_actor_directory_row
  Path 3 (self-heal): useIdentityResolutionEffect → bootstrapIdentitySelfHeal → ensureVcsmPlatformBootstrap (triggered on null identity)

Execution Paths Resolved: 2 / 2 (+ self-heal path traced manually)
```

---

## 4. Scanner Signals

| Signal | Source | Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| RPC: platform.provision_vcsm_identity from provision.rpc.dal.js | ARCHITECTURE.md write-surface-map | HIGH | YES — dal line 34-38; controller line 37; no ownership pre-check at controller or adapter | [SOURCE_VERIFIED] | VEN-IDENTITY-002, VEN-IDENTITY-006 |
| RPC: identity.refresh_actor_directory_row from refreshActorDirectory.dal.js | ARCHITECTURE.md write-surface-map | HIGH | YES — dal line 31-43; no ownership check present | [SOURCE_VERIFIED] | VEN-IDENTITY-007 |
| Self-heal path: identitySelfHeal.controller.js | ARCHITECTURE.md callgraph | HIGH | YES — useIdentityResolutionEffect.hook.js:89-123; no revoked-status check | [SOURCE_VERIFIED] | VEN-IDENTITY-002 |
| Cross-user guard: useIdentityResolutionEffect.hook.js | ARCHITECTURE.md callgraph | HIGH | YES — line 152-153; `if (identityUserId && ...)` null bypass | [SOURCE_VERIFIED] | VEN-IDENTITY-003 |
| Sensitive fields in identity model | identity.model.js source read | HIGH | YES — mapProfileActor lines 47-49 include email, birthdate, age, sex, isAdult | [SOURCE_VERIFIED] | VEN-IDENTITY-006 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path:     ZZnotforproduction/APPS/VCSM/features/identity/BEHAVIOR.md
BEHAVIOR.md exists:   YES
BEHAVIOR.md status:   ACTIVE (authored by LOGAN 2026-06-05 — TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)

§5 Security Constraints declared: 8 (CONSTRAINT-1 through CONSTRAINT-8)
§5 Constraints verified in source: 4 PASS / 2 FAIL / 2 PARTIAL
§5 Constraints unenforced:
  - CONSTRAINT-1 (ownership pre-check) — FAIL: no actor ownership check at controller/adapter layer
  - CONSTRAINT-2 (revoked user re-provision) — FAIL: self-heal path does not check access status
  - CONSTRAINT-5 (refreshActorDirectoryRow ownership) — PARTIAL: deferred entirely to DB RPC

§9 Must Never Happen invariants declared: 8 (INVARIANT-1 through INVARIANT-8)
§9 Invariants protected in source: 5 PASS / 2 FAIL / 1 PARTIAL
§9 Invariants unprotected:
  - INVARIANT-2 (revoked user re-provisioned) — FAIL: self-heal bypass path open
  - INVARIANT-3 (null userId identity committed) — FAIL: null bypass at useIdentityResolutionEffect.hook.js:153
```

---

## 6. Trust Boundary Findings

---

### VEN-IDENTITY-001 — CLOSED

**Status:** CLOSED (2026-06-05)
**Reason:** BEHAVIOR.md authored by LOGAN on 2026-06-05 with ACTIVE status. §5 security constraints (8) and §9 must-never invariants (8) are now formally documented. Prior finding was: "BEHAVIOR.md is a placeholder — zero security rules, zero must-never invariants." This is resolved. THOR BLOCKER status removed for this finding.

**Residual requirement to fully close:** SPIDER-MAN must write regression tests anchored to §9 invariants to fully anchor the behavior contract in code.

---

### VEN-IDENTITY-002 — HIGH — STILL OPEN — THOR BLOCKER [SOURCE_VERIFIED]

**Finding ID:** VEN-IDENTITY-002
**Location:** `apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js:89-123` (trigger) + `apps/VCSM/src/state/identity/identitySelfHeal.controller.js:13-14` (call)
**Application Scope:** VCSM
**Platform Surface:** PWA / Supabase RPC
**Trust Boundary:** Authenticated Citizen (including revoked)
**Boundary Violated:** Revoked Citizen → Active Citizen (access re-provisioned)
**Contract Violated:** Actor Ownership Contract / Platform Access Contract
**Current behavior:**
  When `loadDefaultIdentityForUser` returns null (including when the identity engine cannot resolve an identity due to revoked access or any engine error), the self-heal path is unconditionally triggered at line 89:
  ```
  if (!nextIdentity) {
    const vcActor = await findSelfHealActorForUser(user.id);
    if (vcActor?.actorId) {
      await bootstrapIdentitySelfHeal({ userId: user.id, actorId: vcActor.actorId });
    }
  }
  ```
  `bootstrapIdentitySelfHeal` calls `ensureVcsmPlatformBootstrap` which calls `platform.provision_vcsm_identity`. If the RPC does not check `platform.user_app_access.status` before upserting, a revoked user receives fresh provisioned access.
  
  NOTE: `DELETED_ACCOUNT_SENTINEL` is correctly handled at line 65-75 (triggers logout). No equivalent `REVOKED_ACCOUNT_SENTINEL` exists.

**Risk:** Revoked user bypasses platform access gate via self-heal bootstrap, receiving fresh platform identity rows
**Severity:** HIGH
**Exploitability:** MEDIUM — requires the engine/resolver to return null for the revoked user (depends on engine behavior on `user_app_access.status = 'revoked'`). If the engine returns no actor (rather than a specific error), null triggers self-heal.
**Attack Preconditions:**
  - User account has been set to revoked (`platform.user_app_access.status = 'revoked'`)
  - User attempts login — engine returns null identity (no active platform rows or throws)
  - User still has a `vc.actors` row (found by `findSelfHealActorForUser`)
  - `provision_vcsm_identity` RPC does NOT check access status before upserting
**Blast Radius:** Individual account (revoked user re-provisioned); potential platform-wide if pattern is exploited systematically
**Identity Leak Type:** Ownership inference
**Cache Trust Type:** Identity-sensitive
**RLS Dependency:** REQUIRED — DB RPC must enforce `user_app_access.status` check as sole backstop
**Why it matters:** Revoked users must remain revoked. The self-heal mechanism is designed for legitimate provisioning gaps (missing platform rows for valid users), not for recovering revoked access. The code cannot distinguish between these two cases without a server-side status check before calling bootstrap.
**§9 Violation:** INVARIANT-2 — "A revoked user must never have their platform access re-provisioned through the self-heal bootstrap path"
**Recommended mitigation:**
  1. **Primary fix (app layer):** Before calling `bootstrapIdentitySelfHeal`, read `platform.user_app_access.status` for the resolved `userId`. If status is `revoked`, do not call bootstrap — log and return null. Similar to DELETED_ACCOUNT_SENTINEL pattern, add an explicit REVOKED_ACCESS path.
  2. **DB backstop (required regardless):** Verify that `platform.provision_vcsm_identity` checks `user_app_access.status` before any upsert. Route to DB command for RPC source review.
**Rationale:** Defense-in-depth is required. App-layer check prevents the RPC call. DB-layer check prevents RPC abuse even if the app check is bypassed.
**Follow-up command:** DB (verify provision_vcsm_identity RPC access check), SPIDER-MAN (regression test for revoked user self-heal path)
**CISSP Domain:**
  - Primary: Identity and Access Management (IAM)
  - Secondary: Security Architecture and Engineering

---

### VEN-IDENTITY-003 — HIGH — STILL OPEN — THOR BLOCKER (UPGRADED from MEDIUM) [SOURCE_VERIFIED]

**Finding ID:** VEN-IDENTITY-003
**Location:** `apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js:152-153`
**Application Scope:** VCSM
**Platform Surface:** PWA
**Trust Boundary:** Authenticated Session
**Boundary Violated:** Session userId ↔ Identity userId binding
**Contract Violated:** Actor Ownership Contract
**Current behavior:**
  ```javascript
  const identityUserId = nextIdentity._engineMeta?.userId ?? null;
  if (identityUserId && identityUserId !== user.id) {  // ← null bypass
    commitIdentity(null);
    return;
  }
  ```
  When `_engineMeta.userId` is null (engine context does not include userId, or identity was resolved via non-engine hydration path), `identityUserId` evaluates to null. The condition `if (identityUserId && ...)` evaluates to `false` — the cross-user guard is silently skipped. The identity is committed without verifying session ownership.

  `_engineMeta.userId` is set from `ctx.userId ?? null` in `identity.controller.js:238`. If `ctx.userId` is null/undefined from the engine context, this path is open.

**Risk:** An identity belonging to a different user than the active session is committed without verification when `_engineMeta.userId` is null.
**Severity:** HIGH (UPGRADED from MEDIUM — now a declared §9 INVARIANT-3 violation per BEHAVIOR.md 2026-06-05)
**Exploitability:** LOW in normal flows (engine should always supply userId in ctx); MEDIUM in edge cases (non-engine hydration path, partial engine context, race conditions during re-auth)
**Attack Preconditions:**
  - `resolveAuthenticatedContext` returns a context where `ctx.userId` is null/undefined
  - Or: identity is loaded through a code path that does not attach `_engineMeta` (hydration-only path)
  - Session has a valid `user.id` but identity's `_engineMeta.userId` is absent
**Blast Radius:** Individual session — wrong-user identity committed silently
**Identity Leak Type:** Actor correlation (cross-user identity committed without verification)
**Cache Trust Type:** Identity-sensitive
**RLS Dependency:** NONE — this is an app-layer guard failure
**Why it matters:** This is the only app-layer cross-user ownership check on the identity commit path. If it is bypassed, an identity belonging to a different user is committed to the session. The correct behavior is to reject ANY identity commit where `_engineMeta.userId` cannot be positively confirmed as matching the current session user.
**§9 Violation:** INVARIANT-3 — "When `_engineMeta.userId` is null, the identity commit must be rejected, not silently accepted"
**Recommended mitigation:**
  Change line 153 from:
  ```javascript
  if (identityUserId && identityUserId !== user.id) {
  ```
  To:
  ```javascript
  if (!identityUserId || identityUserId !== user.id) {
  ```
  This rejects the commit when `identityUserId` is null (cannot verify ownership) AND when it mismatches. This converts a "reject only mismatch" guard to a "require positive match" guard.
**Rationale:** Any identity where ownership cannot be positively confirmed must be treated as untrusted. Fail-secure: reject on null, not accept on null.
**Follow-up command:** SPIDER-MAN (mandatory regression test for null userId commit rejection, anchored to §9 INVARIANT-3)
**CISSP Domain:**
  - Primary: Identity and Access Management (IAM)
  - Secondary: Software Development Security

---

### VEN-IDENTITY-004 — MEDIUM — STILL OPEN — UNCHANGED [SOURCE_VERIFIED]

**Finding ID:** VEN-IDENTITY-004
**Location:** `engines/identity` (engine-level cache) — referenced by `identity.controller.js:111` (`resolveAuthenticatedContext`)
**Application Scope:** VCSM
**Platform Surface:** PWA
**Trust Boundary:** Engine Cache
**Boundary Violated:** None (SPA context — safe as deployed); latent risk in SSR/edge
**Contract Violated:** None currently — BEHAVIOR.md §4 RULE-8 correctly documents this assumption
**Current behavior:** The identity engine maintains a 120s result cache keyed by `userId:appKey`. In SPA (browser) context, this is safe — each browser tab has its own process/memory, and tab close eliminates cross-session risk. If the engine is ever deployed in an SSR, edge function, or serverless context, the module-level cache would survive across requests, creating cross-user identity leakage risk.
**Risk:** Latent SSR cross-user identity leakage if engine is ever used outside SPA context.
**Severity:** MEDIUM
**Exploitability:** LOW — requires non-SPA deployment of the identity engine, which is not currently the case
**Attack Preconditions:**
  - Identity engine deployed in SSR or edge function context
  - Concurrent requests for different users share the same process
**Blast Radius:** Cross-session (if materialized) — potentially all users sharing a process
**Identity Leak Type:** Actor correlation (cross-session cache contamination)
**Cache Trust Type:** Identity-sensitive
**RLS Dependency:** NONE
**Why it matters:** Architectural constraint that must be documented and enforced before any SSR migration. BEHAVIOR.md §4 RULE-8 now documents this correctly. The risk is low as long as VCSM remains a SPA-only deployment.
**Recommended mitigation:**
  1. Add a runtime assertion in `setupVcsmIdentityEngine` that throws if executed in a non-browser context (e.g. `typeof window === 'undefined'`)
  2. Document in engine API that result cache is SPA-only
  3. If SSR is ever added, cache must be per-request (not module-level)
**Follow-up command:** ARCHITECT (if SSR deployment is ever planned)
**CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

### VEN-IDENTITY-005 — CLOSED (VCSM SCOPE)

**Status:** CLOSED FOR VCSM SCOPE (2026-06-05)
**Prior finding:** "Wentrex role resolution (organization_memberships, parent_student_links) not scoped to organizationId — cross-org role bleed possible."
**Source verification result:** `vcsmIdentity.resolver.js` returns `roleKeys: []` unconditionally. VCSM does not query `organization_memberships`, `parent_student_links`, or any role table. The resolver only reads `platform.user_app_actor_links` scoped to `userAppAccountId`. No cross-org role bleed path exists in VCSM.
**Scope of original finding:** Wentrex resolver (separate product). Finding should be tracked in Wentrex identity feature, not VCSM.
**Residual note:** Confirm with Wentrex that the resolver is organizationId-scoped.

---

### VEN-IDENTITY-006 — MEDIUM — NEW [SOURCE_VERIFIED]

**Finding ID:** VEN-IDENTITY-006
**Location:** `apps/VCSM/src/state/identity/identity.model.js:47-49` (mapProfileActor) + `identityContext.jsx:183-185` (useIdentityDetailsDeprecated)
**Application Scope:** VCSM
**Platform Surface:** PWA
**Trust Boundary:** Application State
**Boundary Violated:** Data Minimization — identity state scope
**Contract Violated:** None explicit; contradicts data minimization principle
**Current behavior:**
  `mapProfileActor` in `identity.model.js` includes sensitive personal data fields in the identity details object that is stored in React context state:
  ```javascript
  email:     profile?.email ?? null,
  birthdate: profile?.birthdate ?? null,
  age:       profile?.age ?? null,
  sex:       profile?.sex ?? null,
  isAdult:   profile?.is_adult ?? null,
  ```
  These fields are NOT exposed through `toPublicIdentity()` (which returns only `actorId`, `kind`, `ownerActorId`) or `useIdentityDisplayDeprecated()` (which returns display/visual fields only). However, they are stored in the `identityDetails` React state and are accessible via the exported `useIdentityDetailsDeprecated()` hook.
  
  `useIdentityDetailsDeprecated()` is currently only used internally within `identityContext.jsx`. It is exported and callable by any consumer who imports it.

**Risk:** Sensitive PII (email, birthdate, age, sex, biological sex category) stored in client-side React state unnecessarily. If any component calls `useIdentityDetailsDeprecated()`, or if the state is serialized/persisted, this data is at risk of leakage.
**Severity:** MEDIUM
**Exploitability:** LOW — requires import + use of the deprecated hook; the hook is named as deprecated; no current external consumer found
**Attack Preconditions:**
  - A developer imports and uses `useIdentityDetailsDeprecated()` from `identityContext`
  - Or: identity state is serialized for SSR hydration/persistence
**Blast Radius:** Individual user's PII; data minimization concern
**Identity Leak Type:** Private contact exposure (email); demographic data exposure (birthdate, age, sex)
**Cache Trust Type:** Identity-sensitive
**RLS Dependency:** NONE — app-layer state concern
**Why it matters:** Identity state should contain only what is needed to resolve the active actor and perform actor-level operations. Email, birthdate, and demographic fields belong in the profile feature, not in the identity engine state. Their presence in identity state creates a leakage vector via the deprecated hook.
**Recommended mitigation:**
  1. Remove `email`, `birthdate`, `age`, `sex`, `isAdult` from `mapProfileActor` in `identity.model.js`
  2. These fields should be read from the profile feature's own hook/context (e.g. `useProfileDetails`)
  3. If any current consumer of `useIdentityDetailsDeprecated()` depends on these fields, route them to the profile DAL/hook instead
  4. Long-term: remove or seal `useIdentityDetailsDeprecated()` export
**Follow-up command:** IRONMAN (model boundary responsibility), SPIDER-MAN (confirm no external consumers of deprecated hook after removal)
**CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering

---

### VEN-IDENTITY-007 — LOW — NEW [SOURCE_VERIFIED]

**Finding ID:** VEN-IDENTITY-007
**Location:** `apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js:21-61`
**Application Scope:** VCSM
**Platform Surface:** PWA / Supabase RPC
**Trust Boundary:** Authenticated Citizen / VPORT Owner
**Boundary Violated:** Actor Ownership — arbitrary actorId accepted with no client-side ownership check
**Contract Violated:** Actor Ownership Contract (partial — deferred to DB)
**Current behavior:**
  `refreshActorDirectoryRow(actorDomain, actorId)` and `refreshVcActorDirectory(actorId)` accept any actorId and pass it directly to `identity.refresh_actor_directory_row` RPC. No ownership check is performed at the DAL, controller, hook, or adapter layer:
  - `refreshActorDirectory.controller.js` — thin re-export, no guard
  - `identity.adapter.js` — re-exports `refreshVcActorDirectory` with no guard
  - `useIdentityOps()` — exposes `refreshVcActorDirectory` with no ownership check

  Any authenticated component can trigger a directory refresh for any actorId by calling `useIdentityOps().refreshVcActorDirectory(arbitraryActorId)`.

**Risk:** Authenticated attacker can trigger directory refresh for any actor's row (not just their own). Direct security impact is low (directory refresh is a read-reconstruction, not a write to authoritative data). Integrity impact: directory rows for other actors could be forced to refresh at high frequency (DoS-like pressure on the `refresh_actor_directory_row` RPC).
**Severity:** LOW (integrity only; no direct data exposure; no ownership data mutation)
**Exploitability:** HIGH — any authenticated user can call it with any actorId; no guard exists
**Attack Preconditions:**
  - Authenticated user account
  - Target actorId known (or guessable)
**Blast Radius:** Platform-wide directory integrity (forced refreshes for any actor); not a confidentiality risk
**Identity Leak Type:** None (directory reconstruction, not sensitive data read)
**Cache Trust Type:** None
**RLS Dependency:** REQUIRED — DB RPC must enforce that the caller is authorized to trigger a refresh for the target actor
**Why it matters:** Defense-in-depth principle requires ownership verification at the app layer, not solely at the DB layer. The current design relies entirely on the RPC to enforce ownership. If the RPC does not check caller identity vs. target actorId, the surface is fully open.
**Recommended mitigation:**
  1. In `refreshActorDirectory.controller.js` (or a new thin controller wrapper), add an ownership check: verify the calling actor is the owner or an authorized system actor before calling the DAL
  2. Alternatively, if ownership can only be verified server-side, document explicitly that the DB RPC is the sole ownership guard and verify with DB command
**Follow-up command:** DB (verify refresh_actor_directory_row RPC ownership check), SPIDER-MAN (regression test for unauthorized refresh attempt)
**CISSP Domain:**
  - Primary: Identity and Access Management (IAM)
  - Secondary: Security Architecture and Engineering

---

## 7. Source Verification Summary

```
Total surfaces in scope: 2 RPC + 1 self-heal path + 1 model path
Surfaces source-verified: 5 / 5

Source files read (targeted verification only):
- apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js — VEN-IDENTITY-002 trust boundary
- apps/VCSM/src/features/identity/dal/provision.rpc.dal.js — VEN-IDENTITY-002 RPC call verification
- apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js — VEN-IDENTITY-007 ownership check
- apps/VCSM/src/features/identity/adapters/identity.adapter.js — adapter exposure surface
- apps/VCSM/src/features/identity/adapters/identityOps.adapter.js — adapter exposure surface
- apps/VCSM/src/features/identity/hooks/useIdentityOps.js — VEN-IDENTITY-007 hook exposure
- apps/VCSM/src/features/identity/controller/refreshActorDirectory.controller.js — thin re-export, no guard
- apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js — VEN-IDENTITY-005 closure verification
- apps/VCSM/src/features/identity/setup.js — engine setup, _configured singleton
- apps/VCSM/src/state/identity/identitySelfHeal.controller.js — VEN-IDENTITY-002 self-heal path
- apps/VCSM/src/state/identity/identity.controller.js — VEN-IDENTITY-002/003 null return path
- apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js — VEN-IDENTITY-002/003 (primary finding sites)
- apps/VCSM/src/state/identity/identity.model.js — VEN-IDENTITY-006 sensitive fields
- apps/VCSM/src/state/identity/identityContext.jsx — toPublicIdentity call, deprecated hook export
- apps/VCSM/src/state/identity/identityStorage.js — localStorage actorId-only verification (PASS)
- apps/VCSM/src/state/identity/identityResolutionSelfHeal.helper.js — self-heal finalize path

CRITICAL findings: 0 — N/A
HIGH findings with [SOURCE_VERIFIED]: 2 / 2 ✓
```

---

## 8. Confidence Summary

```
HIGH confidence surfaces: 5
LOW confidence surfaces: 0
[SOURCE_VERIFIED] findings: 5
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
```

---

## 9. THOR Impact

```
THOR Release Blockers: VEN-IDENTITY-002, VEN-IDENTITY-003
Highest Open Severity: HIGH

Finding Summary (this run):
CRITICAL: 0
HIGH: 2 (VEN-IDENTITY-002, VEN-IDENTITY-003 — both THOR BLOCKERS)
MEDIUM: 2 (VEN-IDENTITY-004, VEN-IDENTITY-006)
LOW: 1 (VEN-IDENTITY-007)
CLOSED: 2 (VEN-IDENTITY-001, VEN-IDENTITY-005)

Changes from 2026-06-04 VENOM run:
- VEN-IDENTITY-001: CLOSED (BEHAVIOR.md authored)
- VEN-IDENTITY-003: UPGRADED HIGH (was MEDIUM — now §9 INVARIANT-3 violation per BEHAVIOR.md)
- VEN-IDENTITY-005: CLOSED FOR VCSM (Wentrex-scoped finding, not applicable to VCSM resolver)
- VEN-IDENTITY-006: NEW MEDIUM (sensitive PII in identity model state)
- VEN-IDENTITY-007: NEW LOW (refreshVcActorDirectory arbitrary actorId without ownership check)
```

---

## 10. SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| VENOM V2 | 16 | ARCHITECTURE-MD-FALLBACK (no evidence-bundle.json) | NO |

Files read: all targeted per Finding IDs above. No grep or find used to discover scope. ARCHITECTURE.md used as authoritative architecture record.

---

## 11. CISSP Domain Summary

| Domain | Findings |
|---|---|
| Identity and Access Management | VEN-IDENTITY-002, VEN-IDENTITY-003, VEN-IDENTITY-007 |
| Security Architecture and Engineering | VEN-IDENTITY-004, VEN-IDENTITY-006 |
| Software Development Security | VEN-IDENTITY-003, VEN-IDENTITY-006 |

**Uncovered CISSP domains (no relevant surfaces in this feature):**
- Communications and Network Security
- Asset Security
- Physical and Environmental Security
- Security and Risk Management
- Security Assessment and Testing
- Security Operations

---

## 12. Enhanced Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-IDENTITY-002 | Revoked user self-heal re-provision | Controller | P1 | App + DB | DB (RPC verify), SPIDER-MAN (regression) |
| VEN-IDENTITY-003 | Null userId guard bypass — §9 INVARIANT-3 | Controller | P1 | App | SPIDER-MAN (mandatory regression) |
| VEN-IDENTITY-004 | 120s cache SPA-only assumption | Engine | P3 | Engine | ARCHITECT (if SSR planned) |
| VEN-IDENTITY-006 | Sensitive PII in identity state | Model | P2 | App | IRONMAN (model boundary), SPIDER-MAN |
| VEN-IDENTITY-007 | refreshVcActorDirectory arbitrary actorId | Controller + RLS | P2 | App + DB | DB (verify RPC ownership), SPIDER-MAN |

---

## 13. Required Follow-Up Commands

- **BLACKWIDOW** — adversarial re-run: verify VEN-IDENTITY-002 and VEN-IDENTITY-003 exploit paths; probe VEN-IDENTITY-006 deprecated hook; probe VEN-IDENTITY-007 refresh DDoS surface
- **ELEKTRA** — has NEVER run on identity; source→sink chain tracing required for provisioning RPC, self-heal path, and identity model
- **DB** — verify `platform.provision_vcsm_identity` RPC checks `user_app_access.status` before upsert (VEN-IDENTITY-002 backstop); verify `identity.refresh_actor_directory_row` caller ownership check (VEN-IDENTITY-007)
- **SPIDER-MAN** — write regression tests for: (1) revoked user self-heal path, (2) null userId commit rejection (§9 INVARIANT-3), (3) unauthorized refreshVcActorDirectory call
- **WOLVERINE** — VEN-IDENTITY-002 and VEN-IDENTITY-003 require code changes; route to implementation tickets
