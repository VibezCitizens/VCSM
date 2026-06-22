---
name: vcsm.identity.blackwidow.2026-06-05
description: BLACKWIDOW V2 adversarial review — VCSM identity feature (blue team re-run, post-BEHAVIOR.md)
metadata:
  type: adversarial-review
  command: BLACKWIDOW
  feature: identity
  scope: VCSM
  date: 2026-06-05
  trigger: Blue team chain — follows VENOM 2026-06-05; BEHAVIOR.md authored; first formal §9 invariant attack
  prior-run: 2026-06-04
---

# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-06-05
**Scope:** VCSM
**Source Scope:** apps/VCSM/src/features/identity/ + apps/VCSM/src/state/identity/
**Reviewer:** BLACKWIDOW
**Environment:** Static adversarial simulation — source trace + attack chain reconstruction
**Governance Status:** DRAFT → findings confirmed via [SOURCE_VERIFIED] source traces
**Trigger:** Blue team chain ordered. BEHAVIOR.md authored 2026-06-05 — first run with formal §9 invariants.

---

## VENOM Dependency Gate

```
BLACKWIDOW PREFLIGHT PASS

Upstream Report:
- VENOM: ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/05/Venom/2026-06-05_10-00_venom_identity-security-review.md
  Scope: VCSM
  Date: 2026-06-05
  Status: SUCCESS (COMPLETE — 5 open findings, 2 closed)
  Age: 0 days

Proceeding with BLACKWIDOW adversarial review.
```

---

## Behavior Contract Attack Summary

```
Behavior Contract Attack Summary
=================================
BEHAVIOR.md exists:                    YES
BEHAVIOR.md status:                    ACTIVE (authored 2026-06-05 by LOGAN)
§4 Failure Paths declared:             7
§4 Paths attack-verified:              6 / 7
§4 Paths unhandled (FAILURE_PATH_UNHANDLED): NONE confirmed — all handled (1 partial: revoked access path)
§9 Must Never Happen declared:         8
§9 Invariants attacked:               8 / 8 ← all attacked
§9 Result — BLOCKED:                   INVARIANT-4, INVARIANT-5 (current deployment), INVARIANT-6
§9 Result — BYPASSED (CRITICAL):       INVARIANT-3 [SOURCE_VERIFIED]
§9 Result — PARTIAL (incomplete app-layer guard):
                                       INVARIANT-1, INVARIANT-2, INVARIANT-7, INVARIANT-8
§9 Result — NOT ATTACKED (gap):        NONE
```

---

## Attack Surface Summary

**Scope:** VCSM identity feature + state/identity layer
**Entry points available to attacker:**
- `useIdentityOps()` hook → exposes `ensureVcsmPlatformBootstrap` + `refreshVcActorDirectory` directly
- `identityOps.adapter.js` → controller functions exported directly (boundary violation)
- `identityContext.jsx:switchActor()` → actor switch entry point
- Self-heal path: `useIdentityResolutionEffect` → triggered on null identity
- All identity resolution flows via `loadDefaultIdentityForUser`

**Write surfaces attacked:**
- `platform.provision_vcsm_identity` RPC (SECURITY DEFINER)
- `identity.refresh_actor_directory_row` RPC
- `platform.user_app_preferences` (via `engineSwitchActiveActor`)

---

## Simulated Threat Scenarios

| Scenario | Target | Attack Type | Result |
|---|---|---|---|
| A1 | Provision for victim actorId | Ownership bypass | PARTIAL |
| A2 | Revoked user self-heal | Session mutation + ownership bypass | PARTIAL |
| A3 | Null userId commit bypass | Identity commit guard bypass | BYPASSED |
| A4 | Cross-account actor switch | Ownership bypass | BLOCKED |
| A5 | Public surface UUID extraction | Data extraction | BLOCKED |
| A6 | Arbitrary directory refresh | Ownership bypass | PARTIAL |
| A7 | Hydration store poisoning via null userId | Chained exploit | PARTIAL |
| A8 | Actor switch stale cache race | Timing/race | BLOCKED |
| A9 | Adapter boundary inversion | Cross-feature abuse | PARTIAL |
| A10 | Self-heal for deleted actor | Unnecessary bootstrap | PARTIAL (non-security) |
| A11 | Null actorId TypeError in switch | Context fuzzing | PARTIAL (non-fatal) |

---

## Ownership Bypass Results

### A1: Provision-for-Arbitrary-ActorId

```
OWNERSHIP BYPASS ATTEMPT
Target: platform.provision_vcsm_identity RPC via ensureVcsmPlatformBootstrap
Attack vector: Authenticated user calls useIdentityOps().ensureVcsmPlatformBootstrap({
  userId: session.user.id,   ← attacker's own userId
  actorId: victimActorId     ← victim's vc.actors.id
})
Result: PARTIAL
Evidence:
  - ensureVcsmPlatformBootstrap.controller.js:31-33: only null guard for userId and actorId
  - No readActorOwnerUserDAL() call to verify actorId belongs to userId
  - identityOps.adapter.js:1 exports the controller function directly
  - useIdentityOps.js:4-6: returns ensureVcsmPlatformBootstrap without wrapping
  - DB RPC is SECURITY DEFINER — sole ownership backstop. Unverified from source.
Controller gate: ABSENT (app layer) / ASSUMED (DB layer)
Severity: HIGH (THOR BLOCKER — VENOM cross-ref: VEN-IDENTITY-002 partial, BW-IDENT-001)
```

Impact if DB RPC does not enforce ownership: attacker creates a platform actor link associating victim's actorId with attacker's account. This would allow the attacker's account to potentially impersonate or interoperate with the victim's actor through the platform identity system.

---

### A4: Cross-Account Actor Switch

```
OWNERSHIP BYPASS ATTEMPT
Target: switchActorController — platform.user_app_preferences write
Attack vector: switchActorController({ actorId: foreignActorId, ctx: manipulatedCtx })
Result: BLOCKED
Evidence:
  - switchActorController.js:84: ctx.availableActors.find(a => a.actorId === actorId)
  - availableActors is derived from engine context scoped to user_app_account_id
  - Foreign actor not in availableActors → SWITCH_ABORT_LINK_NOT_FOUND at line 107
  - Even if ctx is manipulated client-side, engineSwitchActiveActor() validates at DB level
  - identityContext.jsx:69: null guard prevents null actorId reaching switchActorController
Controller gate: PRESENT (availableActors scope + engine DB enforcement)
Severity: INFO — protection confirmed
```

INVARIANT-4 confirmed BLOCKED. Engine-level `user_app_account_id` ownership is the real backstop. Client-side `availableActors` cache provides defense-in-depth (first gate), DB enforcement provides absolute protection (second gate).

---

## Session Mutation Results

### A2: Revoked User Self-Heal Bypass

```
SESSION MUTATION ATTEMPT
Target: ensureVcsmPlatformBootstrap via self-heal path
Attack vector: Revoked user attempts login →
  loadDefaultIdentityForUser returns null (no active platform rows / engine returns empty)
  → useIdentityResolutionEffect.hook.js:89 — !nextIdentity condition met
  → findSelfHealActorForUser(user.id) queries vc.actors WHERE profile_id=userId AND kind='user'
    (identity.read.dal.js:157-169 — no is_deleted filter, no access status filter)
  → bootstrapIdentitySelfHeal({ userId, actorId }) called at line 99
  → ensureVcsmPlatformBootstrap → dalProvisionVcsmIdentity → provision_vcsm_identity RPC
  → If RPC doesn't check platform.user_app_access.status: fresh rows provisioned
  → Second loadDefaultIdentityForUser succeeds → revoked user gains active identity
Result: PARTIAL
Evidence:
  - useIdentityResolutionEffect.hook.js:89-123 — no access status check before bootstrap
  - DELETED_ACCOUNT_SENTINEL (identity.controller.js:24): handles is_deleted=true ONLY
  - No REVOKED_ACCOUNT_SENTINEL equivalent exists
  - identitySelfHeal.controller.js:13-14: bootstrapIdentitySelfHeal calls ensureVcsmPlatformBootstrap directly
  - identity.read.dal.js:157-169: readUserActorByProfileIdDAL has no access status filter
Session binding: ABSENT (for revoked accounts) — DELETED is handled; REVOKED is not
Severity: HIGH (THOR BLOCKER — cross-confirmed VEN-IDENTITY-002, BW-IDENT-006)
```

**Self-heal: deleted vs revoked distinction:**

| Account State | sentinel returned | Self-heal triggered | Bootstrap called | Final result |
|---|---|---|---|---|
| `vc.actors.is_deleted = true` | DELETED_ACCOUNT_SENTINEL | NO (sentinel → logout) | NO | Correct — logout |
| `platform.user_app_access.status = revoked` | null (engine returns empty) | YES | YES | **BROKEN — re-provisions** |
| No platform rows (new user gap) | null | YES | YES | Correct — legitimate heal |

The null-returning case is indistinguishable between revoked access and legitimate missing rows. The self-heal can't know which scenario it's responding to without an explicit access status check.

---

## Runtime Abuse Results

### A3: Null UserId Identity Commit

```
RUNTIME ABUSE ATTEMPT
Target: Cross-user identity commit guard at useIdentityResolutionEffect.hook.js:152-153
Actor role used: Any authenticated session
Expected access: DENY (identity commit rejected when userId cannot be verified)
Result: ALLOWED — BYPASSED [SOURCE_VERIFIED]
Evidence:
  File: apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js
  Line 152: const identityUserId = nextIdentity._engineMeta?.userId ?? null;
  Line 153: if (identityUserId && identityUserId !== user.id) {
  Attack: Force _engineMeta.userId = null → identityUserId = null
  Evaluation: if (null && null !== user.id) → if (false) → guard SKIPPED
  Identity committed at line 222 with no ownership verification
Privilege gate: ABSENT when _engineMeta.userId is null
Severity: HIGH (THOR BLOCKER — §9 INVARIANT-3 BYPASSED)
```

**Exploit chain type:** Single-step exploit — one conditional null bypass.

**Path to _engineMeta.userId = null:**
- `identity.controller.js:238`: `userId: ctx.userId ?? null`
- If `resolveAuthenticatedContext` returns a context where `ctx.userId` is absent/null:
  - Engine has a network error partial response
  - Edge case in engine context assembly
  - Hydration-only path (non-engine resolve) — `_engineMeta` not set at all → `nextIdentity._engineMeta?.userId ?? null = null`
- After switch: `loadIdentityForActorId(actorId)` in `switchActorController.js:151` — this calls `hydrateActor` which does NOT attach `_engineMeta`. So actor switch path hydrates identity WITHOUT engine meta → `_engineMeta` is absent → null userId bypass is reachable via switch hydration path.

**Critical amplification:** The switch path (`loadIdentityForActorId`) creates a hydrated identity without `_engineMeta`. The result is passed back via `switchActorController → identityContext.commitIdentity`. The null userId guard is in `useIdentityResolutionEffect`, NOT in the `switchActor` path — so the guard doesn't even apply to switch-hydrated identities. The switch path commits directly without any cross-user check at all.

This means the null userId guard has a structural gap: it only covers the `useIdentityResolutionEffect` path. The `switchActor` path in `identityContext.jsx:85-95` commits `result.nextIdentity` directly via `commitIdentity` with no cross-user guard.

**BW-IDENT-011 amplification finding flagged below.**

---

## Viewer Context Fuzz Results

### A11: Null actorId in switchActorController

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: switchActorController.js:44
Injected context: actorId = null
Expected result: ERROR (graceful rejection)
Actual result: TypeError at actorId.slice(0,8) if called directly
Context validation: WEAK — identityContext.jsx:69 provides null guard for callers through context;
  but switchActorController itself throws before any guard
Severity: LOW — non-fatal; TypeError caught by calling context; no security consequence
```

Guard status: The guard exists in `identityContext.jsx:69` (`if (!actorId) return { success: false ... }`). This prevents null reaching `switchActorController` through the normal path. If `switchActorController` is called directly with null, TypeError is thrown but caught. No security impact.

---

## RLS Verification Results

### A1-RLS: provision_vcsm_identity RPC ownership enforcement

```
RLS VERIFICATION ATTEMPT
Table / View / RPC: platform.provision_vcsm_identity (SECURITY DEFINER)
Attack vector: Call with userId=attacker, actorId=victim
RLS status: ASSUMED — RLS does not apply to SECURITY DEFINER functions
Result: PARTIAL — cannot verify from source whether RPC validates actorId ownership
Evidence: provision.rpc.dal.js:33-38 — passes p_user_id and p_actor_id to RPC without app-layer check
  DB RPC source requires DB command inspection
Severity: HIGH (route to DB for verification)
```

```
RLS VERIFICATION ATTEMPT
Table / View / RPC: identity.refresh_actor_directory_row
Attack vector: Call with arbitrary actorId
RLS status: ASSUMED — RPC may or may not enforce caller ownership
Result: PARTIAL — cannot verify from source
Evidence: refreshActorDirectory.dal.js:31-43 — passes actorId directly; no app ownership check
Severity: LOW (integrity only — directory is reconstructed, not authoritative data)
```

---

## Hydration Poisoning Results

### A7: Hydration Store Poisoning via Null UserId Chain

```
HYDRATION POISONING ATTEMPT
Target: useActorStore hydration store (upsertActors call in identityContext.jsx:46-57)
Injected state: Wrong actor identity committed via null userId bypass (BW-IDENT-002/A3)
Attack chain:
  1. _engineMeta.userId = null → null guard bypassed (A3)
  2. commitIdentity(wrongActorIdentity) called
  3. identityContext.jsx:46: useActorStore.getState().upsertActors([{actor_id: wrongActorId, ...}])
  4. Hydration store poisoned with wrong actor's display data
  5. Other components rendering from useActorStore get wrong actor data
Cache invalidation: ABSENT — no guard against poisoned upsert when identity commit guard fails
Result: PARTIAL — chained exploit; requires BW-IDENT-002 precondition
Evidence: identityContext.jsx:46-57 — upsertActors called inside commitIdentity with no secondary ownership check
Severity: HIGH (BW-IDENT-011 — NEW — chained from BW-IDENT-002; resolves when BW-IDENT-002 is patched)
```

---

## Cross-Feature Abuse Results

### A9: Adapter Boundary Inversion

```
CROSS-FEATURE ABUSE ATTEMPT
Source feature: Any external feature importing identity
Target feature internal: ensureVcsmPlatformBootstrap (controller function)
Attack vector: Any feature imports identityOps.adapter.js and calls ensureVcsmPlatformBootstrap
  directly with attacker-controlled userId and actorId
Result: PARTIAL
Evidence:
  identityOps.adapter.js:1-2:
    export { ensureVcsmPlatformBootstrap } from controller file
    export { refreshVcActorDirectory } from controller file
  ARCHITECTURE.md rule: "Adapters expose only: hooks, components, view screens.
    Adapters never export DAL functions, models, or controllers."
  Both exports are CONTROLLERS — boundary violation confirmed.
Adapter isolation: WEAK — controllers directly re-exported
Severity: MEDIUM (BW-IDENT-010 — NEW — boundary violation enabling A1 attack surface)
```

---

## URL Surface Results

### A5: Public Surface UUID Extraction

```
URL SURFACE TEST
Route / Link: getProfilePath() + toPublicIdentity() + identityStorage
UUID exposure:
  - toPublicIdentity() → returns {actorId, kind, ownerActorId} — actorId IS a UUID but this is
    the canonical identity surface (not a URL path segment)
  - getProfilePath() → returns '/profile/self' — PASS: no raw UUID in path
  - identityStorage: localStorage.setItem('vc.identity.actorId.{userId}', actorId)
    Key contains userId, value contains actorId — in localStorage, not URL
  - No URL construction with raw UUIDs found in identity feature source
UUID exposure: ABSENT (in public URLs)
Slug enforcement: N/A — identity feature has no URL construction
Severity: INFO — CONFIRMED PROTECTED
```

INVARIANT-6 confirmed BLOCKED. BW-IDENT-008 status confirmed CLOSED.

---

## Auth Callback Replay Results

Not applicable to identity feature scope. Identity feature has no auth callback surface. Auth callbacks are handled by the `auth` feature. Outside this review scope.

---

## §9 Invariant Attack Map

| Attack Path | Attack Result | §9 Invariant | Status | SPIDER-MAN Required |
|---|---|---|---|---|
| Provision for victim actorId via useIdentityOps | PARTIAL — DB sole backstop | INVARIANT-1: never provision for unowned actorId | OPEN — BW-IDENT-001 | TESTREQ-IDENT-001 |
| Revoked user login → self-heal → bootstrap | PARTIAL — no app-layer revoked guard | INVARIANT-2: revoked user never re-provisioned | OPEN — BW-IDENT-006 | TESTREQ-IDENT-002 |
| Force null _engineMeta.userId → commit identity | BYPASSED [SOURCE_VERIFIED] | INVARIANT-3: null userId must be rejected | OPEN — BW-IDENT-002 | TESTREQ-IDENT-003 (MANDATORY) |
| Switch to foreign account's actor | BLOCKED — availableActors scope + DB | INVARIANT-4: actor switch never crosses account | CONFIRMED PROTECTED | TESTREQ-IDENT-004 |
| Instantiate engine in SSR context | BLOCKED (SPA-only; no SSR deployment) | INVARIANT-5: cache never in SSR context | OPEN (latent — no enforcement) | N/A currently |
| Extract raw IDs from toPublicIdentity / URLs | BLOCKED — actorId only; no path UUIDs | INVARIANT-6: no raw IDs in public surface | CONFIRMED PROTECTED | TESTREQ-IDENT-006 |
| refreshVcActorDirectory(arbitraryActorId) | PARTIAL — no app ownership check | INVARIANT-7: refreshVcActorDirectory needs ownership | OPEN — BW-IDENT-007 | TESTREQ-IDENT-007 |
| Call booking path with wrong actor kind | PARTIAL — kind gate is selector-only | INVARIANT-8: kind gates at controller level | OPEN — BW-IDENT-003 | TESTREQ-IDENT-008 |

---

## Successful Exploit Chains

### Chain 1 — BYPASSED: Null UserId Identity Commit (INVARIANT-3)

```
[SOURCE_VERIFIED]

Entry: Resolve identity through actor switch path (loadIdentityForActorId)
  ↓
switchActorController.js:151 — loadIdentityForActorId(actorId)
  ↓
identity.controller.js:61-67 — hydrateActor({ appKey, actorSource, actorId })
  NOTE: _engineMeta NOT attached in this path — no engine context
  ↓
identityContext.jsx:85-95 — result.nextIdentity committed via commitIdentity(result.nextIdentity)
  NOTE: commitIdentity called DIRECTLY — not through useIdentityResolutionEffect
  NOTE: the null userId guard at useIdentityResolutionEffect.hook.js:152 is NOT on this path
  ↓
commitIdentity(nextDetails) — no cross-user check in commitIdentity itself
  ↓
COMMITTED — no ownership verification for switch-hydrated identity

Exploit type: Single-step exploit (structural gap — guard is on wrong path)
Blast radius: Current session — wrong actor identity committed; hydration store poisoned
```

### Chain 2 — PARTIAL: Bootstrap for Unowned ActorId

```
Entry: Authenticated user calls useIdentityOps().ensureVcsmPlatformBootstrap({userId, actorId})
  ↓
hooks/useIdentityOps.js:4 — ensureVcsmPlatformBootstrap passed directly
  ↓
controller/ensureVcsmPlatformBootstrap.controller.js:32 — null check only (userId + actorId present)
  ↓
dal/provision.rpc.dal.js:29-43 — RPC called with attacker userId + victim actorId
  ↓
platform.provision_vcsm_identity — DB RPC sole backstop
  PARTIAL: cannot confirm from source whether RPC validates actorId ownership against userId

Exploit type: Single-step exploit (missing ownership pre-check) — blocked at DB layer (assumed)
```

---

## Failed Exploit Chains (Defenses That Held)

### D1 — BLOCKED: Cross-Account Actor Switch
- Guard: `ctx.availableActors` scoped to account + `engineSwitchActiveActor` DB-level enforcement
- Confirmed at `switchActorController.js:84-108`

### D2 — BLOCKED: Raw UUID in Public URLs
- Guard: `toPublicIdentity()` returns actor-first surface only; `getProfilePath()` returns `/profile/self`

### D3 — BLOCKED: Deleted Account Bypass
- Guard: `DELETED_ACCOUNT_SENTINEL` at `identity.controller.js:212-219`; triggers logout before self-heal

### D4 — BLOCKED: Stale Identity Commit via Race
- Guard: `resolveVersionRef` monotonic counter at `useIdentityResolutionEffect.hook.js:37,126-135`

---

## BLACKWIDOW FINDINGS

---

### BW-IDENT-001 — HIGH — STILL OPEN — THOR BLOCKER [PARTIAL]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-001
Scenario: Provision-for-arbitrary-actorId attack
Target: ensureVcsmPlatformBootstrap via useIdentityOps() + identityOps.adapter.js
Application Scope: VCSM
Platform Surface: PWA + Supabase RPC (SECURITY DEFINER)
Attack Vector: Call ensureVcsmPlatformBootstrap({ userId: attacker.id, actorId: victim.actorId })
  from any component via useIdentityOps() hook or identityOps.adapter.js import
Exploit Chain Type: Single-step exploit (missing ownership pre-check at controller/adapter layer)
Governance Status: VERIFIED (confirmed via source trace — same finding as 2026-06-04)
Result: PARTIAL
Evidence:
  - ensureVcsmPlatformBootstrap.controller.js:31-33: only !userId || !actorId guard
  - identityOps.adapter.js:1: exports controller function directly (no wrapper)
  - useIdentityOps.js:5: returns ensureVcsmPlatformBootstrap without ownership wrapping
  - DB RPC provision_vcsm_identity: SECURITY DEFINER — sole ownership backstop (unverified)
Defense Gate: ABSENT (app layer) / ASSUMED (DB layer)
Blast Radius: Platform-wide — if DB RPC does not enforce ownership, attacker can link any actor to their account
Severity: HIGH
VENOM Finding Cross-Reference: VEN-IDENTITY-002 (self-heal aspect), VEN-IDENTITY-007 (refresh ownership)
Recommended Fix:
  1. Add readActorOwnerUserDAL(actorId) call in controller before RPC; verify owner userId matches session userId
  2. DB command: confirm provision_vcsm_identity checks vc.actor_owners or equivalent ownership proof
Layer to Fix: Controller + DB verification
Required Follow-up Command: DB (verify RPC ownership enforcement), SPIDER-MAN (TESTREQ-IDENT-001)
```

---

### BW-IDENT-002 — HIGH — STILL OPEN — THOR BLOCKER [BYPASSED SOURCE_VERIFIED]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-002
Scenario: Null _engineMeta.userId identity commit bypass
Target: Cross-user guard at useIdentityResolutionEffect.hook.js:152-153
  AND: structural gap — guard absent on switchActor path entirely
Application Scope: VCSM
Platform Surface: PWA
Attack Vector:
  Path 1 (engine): Force ctx.userId = null → _engineMeta.userId = null → null guard bypassed
  Path 2 (switch): switchActorController.loadIdentityForActorId does not attach _engineMeta
    → switchActor-hydrated identities have NO cross-user check at all
Exploit Chain Type: Single-step exploit (null bypass) / Structural gap (switch path)
Governance Status: CONFIRMED — BYPASSED [SOURCE_VERIFIED]
Result: BYPASSED
Evidence (Path 1):
  useIdentityResolutionEffect.hook.js:152: identityUserId = nextIdentity._engineMeta?.userId ?? null
  useIdentityResolutionEffect.hook.js:153: if (identityUserId && identityUserId !== user.id)
  → null evaluates to false → guard skipped → identity committed at line 222
Evidence (Path 2 — NEW discovery):
  switchActorController.js:151: nextIdentity = await loadIdentityForActorId(actorId)
  identity.controller.js:61-67: hydrateActor() — does NOT set _engineMeta on result
  identityContext.jsx:85-95: result.nextIdentity committed via commitIdentity() directly
  → commitIdentity has NO cross-user guard — guard is ONLY in useIdentityResolutionEffect
  → ALL actor switch commits bypass the cross-user check entirely
Defense Gate: ABSENT for switch path; WEAK (null bypass) for initial resolve path
Blast Radius: Current session (wrong actor committed) + hydration store (upsertActors poisoned)
Severity: HIGH
VENOM Finding Cross-Reference: VEN-IDENTITY-003
Recommended Fix:
  1. Move cross-user check into commitIdentity() itself — not only in useIdentityResolutionEffect
  2. Change guard to: if (!identityUserId || identityUserId !== user.id)
  3. For switch path: attach userId to switch-hydrated identity from session.user.id before commit
Layer to Fix: Controller (identityContext.jsx commitIdentity function)
Required Follow-up Command: SPIDER-MAN (TESTREQ-IDENT-003 — MANDATORY §9 INVARIANT-3)
```

---

### BW-IDENT-003 — MEDIUM — STILL OPEN [PARTIAL]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-003
Scenario: Actor-kind gate selector-only enforcement
Target: canCitizenBook and similar kind eligibility checks in consuming features
Application Scope: VCSM
Platform Surface: PWA
Attack Vector: VPORT-kind actor calls booking flow; kind check is only in selectors, not controllers
Exploit Chain Type: Single-step exploit (missing controller gate)
Governance Status: VERIFIED
Result: PARTIAL — kind gate absent at identity feature level; consuming features (booking) responsible
Evidence:
  - Identity feature exports actorKind in toPublicIdentity {actorId, kind} — exposed correctly
  - No controller-level kind enforcement found within identity feature itself (N/A — identity doesn't gate access)
  - Consuming feature responsibility: booking/controller must check kind before allowing booking
  - BW scope: identity feature correctly surfaces kind; enforcement gap is downstream
Defense Gate: ABSENT at identity controller level (N/A); consuming feature responsibility
Blast Radius: Booking feature — wrong-kind booking if consumer controller doesn't check
Severity: MEDIUM
VENOM Finding Cross-Reference: N/A (identity feature surfaces kind correctly)
Recommended Fix: Booking controller must verify actorKind === 'user' before allowing booking creation
Layer to Fix: Consuming feature controller (booking)
Required Follow-up Command: SPIDER-MAN (TESTREQ-IDENT-008)
```

---

### BW-IDENT-004 — MEDIUM — STILL OPEN [PARTIAL]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-004
Scenario: refreshActorDirectoryRow arbitrary actorId without ownership check
Target: refreshActorDirectory.dal.js + refreshVcActorDirectory via useIdentityOps
Application Scope: VCSM
Platform Surface: PWA + Supabase RPC
Attack Vector: useIdentityOps().refreshVcActorDirectory(arbitraryActorId)
  — no ownership check at hook, adapter, controller, or DAL layer
Exploit Chain Type: Single-step exploit (missing ownership pre-check)
Governance Status: VERIFIED
Result: PARTIAL — app layer exposed; DB RPC is sole backstop
Evidence:
  refreshActorDirectory.dal.js:21 — accepts actorDomain and actorId without ownership check
  refreshActorDirectory.controller.js:1-6 — thin re-export, no guard added
  useIdentityOps.js:1 — imports refreshVcActorDirectory and exposes without ownership wrapper
  DB RPC: identity.refresh_actor_directory_row — ownership enforcement unverified
Defense Gate: ABSENT (app layer) / ASSUMED (DB layer)
Blast Radius: Platform directory integrity — any actor's directory row can be forced to refresh
Severity: MEDIUM
VENOM Finding Cross-Reference: VEN-IDENTITY-007
Recommended Fix: Add ownership check in controller before calling DAL
Layer to Fix: Controller
Required Follow-up Command: DB (verify RPC ownership enforcement)
```

---

### BW-IDENT-005 — LOW — STILL OPEN [PARTIAL — NON-FATAL]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-005
Scenario: Null actorId TypeError in switchActorController before guard
Target: switchActorController.js:44
Application Scope: VCSM
Platform Surface: PWA
Attack Vector: Call switchActorController({ actorId: null, ctx, ... }) directly
Exploit Chain Type: Context fuzzing
Governance Status: VERIFIED (non-fatal — TypeError caught)
Result: PARTIAL
Evidence:
  switchActorController.js:44: dbg.event("SWITCH_START", { message: `Switch to ${actorId.slice(0,8)}` })
  → TypeError if actorId is null; no null check before this line
  identityContext.jsx:69: if (!actorId) return { success: false, code: "NO_ACTOR_ID" }
  → Null guard exists in caller (identityContext); protects normal usage path
  → Direct call to switchActorController bypasses caller guard
Defense Gate: WEAK — guard in caller, not in controller itself
Blast Radius: None — TypeError caught; no security consequence; no state mutation
Severity: LOW
VENOM Finding Cross-Reference: N/A
Recommended Fix: Add null check at start of switchActorController before dbg.event call
Layer to Fix: Controller
Required Follow-up Command: None (low priority hardening)
```

---

### BW-IDENT-006 — HIGH — STILL OPEN — THOR BLOCKER [PARTIAL]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-006
Scenario: Revoked user self-heal bootstrap replay
Target: useIdentityResolutionEffect self-heal path + identitySelfHeal.controller
Application Scope: VCSM
Platform Surface: PWA + Supabase RPC
Attack Vector: Revoked user login attempt:
  1. loadDefaultIdentityForUser(userId) → engine returns null (no active actor for revoked account)
  2. useIdentityResolutionEffect.hook.js:89: !nextIdentity → self-heal triggered
  3. findSelfHealActorForUser(userId) → identity.read.dal.js:157: vc.actors WHERE profile_id=userId
     (no is_deleted filter, no access status check — finds the actor regardless of revoked status)
  4. bootstrapIdentitySelfHeal({ userId, actorId }) → ensureVcsmPlatformBootstrap → provision RPC
  5. If RPC does not check user_app_access.status: fresh platform rows provisioned → revoked user active
Exploit Chain Type: Multi-step exploit (unhandled sentinel case)
Governance Status: CONFIRMED (PARTIAL — DB is last backstop)
Result: PARTIAL
Evidence:
  useIdentityResolutionEffect.hook.js:65-75: DELETED_ACCOUNT_SENTINEL handled correctly → logout
  useIdentityResolutionEffect.hook.js:89-123: !nextIdentity path — null from engine and null from
    error catch are indistinguishable; REVOKED_ACCOUNT_SENTINEL does not exist
  identitySelfHeal.controller.js:8-10: findSelfHealActorForUser → readUserActorByProfileIdDAL
  identity.read.dal.js:157-169: no .eq('status', 'active') or access filter
Defense Gate: ABSENT for revoked accounts at app layer; DB RPC sole backstop
Blast Radius: Individual account — revoked user regains access
Severity: HIGH
VENOM Finding Cross-Reference: VEN-IDENTITY-002
Recommended Fix:
  1. Before calling bootstrapIdentitySelfHeal, check platform.user_app_access.status for the userId
  2. If status = 'revoked', return ACCESS_DENIED without calling bootstrap
  3. Add REVOKED_ACCOUNT_SENTINEL (parallel to DELETED_ACCOUNT_SENTINEL)
Layer to Fix: Controller (identitySelfHeal.controller.js + useIdentityResolutionEffect)
Required Follow-up Command: DB (verify RPC access check), SPIDER-MAN (TESTREQ-IDENT-002)
```

---

### BW-IDENT-007 — LOW — STILL OPEN [PARTIAL]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-007
Scenario: Arbitrary actorId directory refresh via useIdentityOps hook
Target: refreshVcActorDirectory exposed via identity.adapter.js + useIdentityOps
Application Scope: VCSM
Platform Surface: PWA + Supabase RPC
Attack Vector: Component calls refreshVcActorDirectory(anyActorId) via useIdentityOps
Exploit Chain Type: Single-step exploit (missing ownership gate at all app layers)
Governance Status: VERIFIED
Result: PARTIAL — no app layer ownership gate; DB RPC sole backstop
Evidence:
  identity.adapter.js:4: exports refreshVcActorDirectory from identityOps.adapter.js
  identityOps.adapter.js:2: exports refreshVcActorDirectory from controller (raw re-export)
  hooks/useIdentityOps.js:1: imports and exposes via hook without ownership wrapper
Defense Gate: ABSENT (app layer)
Blast Radius: Platform-wide directory integrity (forced refreshes for any actor — DoS-like pressure)
Severity: LOW
VENOM Finding Cross-Reference: VEN-IDENTITY-007
Recommended Fix: Wrap in ownership check — verify actorId belongs to current session actor
Layer to Fix: Controller (add ownership verification before DAL call)
Required Follow-up Command: DB (verify RPC ownership), SPIDER-MAN (TESTREQ-IDENT-007)
```

---

### BW-IDENT-008 — INFO — CLOSED

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-008
Status: CLOSED — CONFIRMED PROTECTED
Result: BLOCKED

Evidence:
  toPublicIdentity() returns {actorId, kind, ownerActorId} — no profileId, vportId, userId
  getProfilePath() returns '/profile/self' — no UUID in path
  identityStorage.js: localStorage stores actorId only (not in public URL)
  No URL construction found in identity feature source
  
INVARIANT-6 confirmed protected.
```

---

### BW-IDENT-009 — INFO — CLOSED

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-009
Status: CLOSED — BEHAVIOR.md authored 2026-06-05 by LOGAN
Prior finding: "BEHAVIOR.md was PLACEHOLDER — zero §9 invariants anchored"
Current state: BEHAVIOR.md ACTIVE — 8 §5 constraints and 8 §9 invariants formally documented
Note: SPIDER-MAN regression tests still required to anchor §9 invariants in code
```

---

### BW-IDENT-010 — MEDIUM — NEW [SOURCE_VERIFIED]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-010
Scenario: Controller functions exported directly from adapter — boundary violation
Target: identityOps.adapter.js
Application Scope: VCSM
Platform Surface: PWA
Attack Vector: External feature imports identityOps.adapter.js and calls controller function directly
  with no ownership guard (enables A1 attack surface for any consumer)
Exploit Chain Type: Cross-feature abuse (adapter boundary inversion)
Governance Status: DRAFT — confirmed via source read
Result: PARTIAL
Evidence:
  identityOps.adapter.js:1: export { ensureVcsmPlatformBootstrap } from controller file
  identityOps.adapter.js:2: export { refreshVcActorDirectory } from controller file
  CLAUDE.md (VCSM app rules): "Adapters expose only: hooks, components, view screens.
    Adapters never export DAL functions, models, or controllers."
  Both exports are controller functions — boundary rule violated
Defense Gate: ABSENT — boundary violation enables direct controller access
Blast Radius: Any feature importing the adapter can call provisioning with arbitrary params
Severity: MEDIUM
VENOM Finding Cross-Reference: VEN-IDENTITY-002 (provisioning surface), VEN-IDENTITY-007 (refresh surface)
Recommended Fix: Wrap controller calls in hooks before export from adapter:
  export function useIdentityBootstrap() { return { ensureVcsmPlatformBootstrap } }
  (moves controller function behind a hook, keeping adapter boundary clean)
Layer to Fix: Adapter + Hook
Required Follow-up Command: WOLVERINE (architectural boundary fix), SPIDER-MAN
```

---

### BW-IDENT-011 — HIGH — NEW [PARTIAL — chained from BW-IDENT-002]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-011
Scenario: Hydration store poisoning via null userId identity commit (chain from BW-IDENT-002)
Target: useActorStore.upsertActors call in identityContext.jsx:46-57
Application Scope: VCSM
Platform Surface: PWA
Attack Vector: Chain:
  1. BW-IDENT-002 exploit succeeds (null userId or switch-path bypass)
  2. commitIdentity(wrongActorIdentity) called without cross-user check
  3. identityContext.jsx:46-57: useActorStore.getState().upsertActors([{
       actor_id: wrongActorId, kind, displayName, username, avatar, ...
     }])
  4. Hydration store now has wrong actor data keyed to wrong actorId
  5. Any component reading from useActorStore gets poisoned actor summary
Exploit Chain Type: Multi-step exploit (chained from BW-IDENT-002)
Governance Status: DRAFT — requires BW-IDENT-002 precondition
Result: PARTIAL — chained; resolves when BW-IDENT-002 is patched
Evidence:
  identityContext.jsx:46-57: upsertActors called inside commitIdentity with no secondary guard
  identityContext.jsx:40-61: commitIdentity has no cross-user check at all
Defense Gate: ABSENT for chained attack
Blast Radius: Session-wide — hydration store shows wrong actor data to all consuming components
Severity: HIGH (THOR BLOCKER when BW-IDENT-002 is exploited)
Note: This finding resolves automatically when BW-IDENT-002 cross-user guard is moved into commitIdentity
VENOM Finding Cross-Reference: VEN-IDENTITY-003
Recommended Fix: Move cross-user guard into commitIdentity(); confirm identity userId before upsertActors
Layer to Fix: Controller (identityContext.jsx commitIdentity)
Required Follow-up Command: Resolves with BW-IDENT-002 fix; SPIDER-MAN test covers both
```

---

### BW-IDENT-012 — LOW — NEW [NON-SECURITY]

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-IDENT-012
Scenario: Self-heal calls provision_vcsm_identity for soft-deleted actors before DELETED_ACCOUNT_SENTINEL
Target: readUserActorByProfileIdDAL — no is_deleted filter
Application Scope: VCSM
Platform Surface: PWA + Supabase RPC
Attack Vector: Deleted user attempts login:
  1. Engine returns DELETED_ACCOUNT_SENTINEL for deleted actor — logout triggered (correct)
  2. BUT: if engine returns null first (path where actorRow.is_deleted causes actor read null):
     → self-heal finds actor via readUserActorByProfileIdDAL (no is_deleted filter)
     → provision_vcsm_identity called unnecessarily for deleted actor
     → Second resolve then hits DELETED_ACCOUNT_SENTINEL → logout (correct final result)
Result: PARTIAL — final result correct (logout); unnecessary bootstrap RPC call made
Evidence:
  identity.read.dal.js:157-169: .eq('kind', 'user') filter but NO .eq('is_deleted', false)
  identity.controller.js:65-75: DELETED_ACCOUNT_SENTINEL → logout (prevents wrong commit)
  identitySelfHeal.controller.js:8-10: findSelfHealActorForUser — uses the unfiltered DAL
Defense Gate: PRESENT for final security outcome; ABSENT for preventing unnecessary RPC
Blast Radius: None — only extra RPC call; correct behavior preserved
Severity: LOW (non-security; performance/hardening concern)
Recommended Fix: Add .eq('is_deleted', false) to readUserActorByProfileIdDAL
Layer to Fix: DAL
Required Follow-up Command: None (hardening)
```

---

## Recommended Fixes Priority

| Finding | Severity | THOR Blocker | Priority Fix | Layer |
|---|---|---|---|---|
| BW-IDENT-002 | HIGH | YES | Move cross-user guard into commitIdentity(); fix null bypass; add userId to switch-hydrated identity | Controller |
| BW-IDENT-006 | HIGH | YES | Add REVOKED_ACCOUNT_SENTINEL path; check user_app_access.status before self-heal bootstrap | Controller |
| BW-IDENT-001 | HIGH | YES | Add readActorOwnerUserDAL ownership check in ensureVcsmPlatformBootstrap before RPC | Controller + DB |
| BW-IDENT-011 | HIGH | CHAINED | Resolves with BW-IDENT-002 fix | Controller |
| BW-IDENT-010 | MEDIUM | NO | Wrap controller exports in hooks; fix adapter boundary | Adapter + Hook |
| BW-IDENT-003 | MEDIUM | NO | Enforce kind gate at booking controller (consuming feature) | Controller (booking) |
| BW-IDENT-004 | MEDIUM | NO | Add ownership check in refreshActorDirectory controller | Controller |
| BW-IDENT-005 | LOW | NO | Add null guard before actorId.slice() in switchActorController | Controller |
| BW-IDENT-007 | LOW | NO | Add ownership wrapper in refreshVcActorDirectory hook | Controller/Hook |
| BW-IDENT-012 | LOW | NO | Add is_deleted=false filter to readUserActorByProfileIdDAL | DAL |

---

## Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| ELEKTRA | Has NEVER run on identity; needs source→sink chain tracing for provisioning + self-heal paths | P1 |
| SPIDER-MAN | MANDATORY regression tests for §9 invariants, especially INVARIANT-3 (BW-IDENT-002) and INVARIANT-2 (BW-IDENT-006) | P1 |
| DB | Verify provision_vcsm_identity RPC enforces actorId ownership; verify refresh_actor_directory_row ownership | P1 |
| WOLVERINE | Implement fixes for BW-IDENT-001, BW-IDENT-002, BW-IDENT-006 (P0 THOR blockers) | P1 |
| HAWKEYE | Verify all endpoint contracts for identity adapter surface | P2 |
| LOKI | Runtime observability for self-heal path — confirm revoked access is observable | P2 |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Trust boundary cross-reference — COMPLETE (2026-06-05) | DONE |
| ELEKTRA | Precision patch advisor — has never run on identity | PENDING |
| LOKI | Runtime telemetry for self-heal and commit paths | PENDING |
| THOR | Release gate evaluation | BLOCKED — open THOR blockers remain |
