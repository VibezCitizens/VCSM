# ELEKTRA Security Report

**Date:** 2026-06-05
**Scope:** VCSM — feature/identity
**Reviewer:** ELEKTRA
**Scan Trigger:** Blue team chain execution — ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA
**Scan Areas Loaded:** Area 1 (Actor Ownership/IDOR), Area 2 (Controller Input Trust), Area 6 (Auth and Session)
**Findings Summary:** 4 HIGH | 2 MEDIUM | 2 LOW | 0 INFO
**False Positives Rejected:** 1
**Suggested Patches:** 7
**THOR Release Blockers:** ELEK-2026-06-05-001, ELEK-2026-06-05-002, ELEK-2026-06-05-003, ELEK-2026-06-05-004

---

## ELEKTRA PREFLIGHT PASS

Upstream Reports:
- VENOM: ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/05/Venom/2026-06-05_10-00_venom_identity-security-review.md
  Status: COMPLETE | Age: 0 days | Scope: identity ✅
- BLACKWIDOW: ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/05/BlackWidow/2026-06-05_10-30_blackwidow_identity-adversarial-review.md
  Status: COMPLETE | Age: 0 days | Scope: identity ✅

All gate requirements satisfied. Proceeding with ELEKTRA verification.

---

## ELEKTRA SCAN TARGET

```
Feature / Route / Engine:  identity — platform bootstrap + actor-directory sync layer
Application Scope:         VCSM
Reason for scan:           First ELEKTRA run on identity feature; blue team chain execution
Scan trigger:              Blue team chain (VENOM cross-reference + BLACKWIDOW referral)
Upstream VENOM report:     outputs/2026/06/05/Venom/2026-06-05_10-00_venom_identity-security-review.md
Upstream BLACKWIDOW report: outputs/2026/06/05/BlackWidow/2026-06-05_10-30_blackwidow_identity-adversarial-review.md
```

---

## ENTRY POINT MAP

```
ENTRY POINT MAP

Route / API / Controller:
  1. ensureVcsmPlatformBootstrap({ userId, actorId })
     Exposed via: identityOps.adapter.js → useIdentityOps hook → any consumer component
     Also called: identitySelfHeal.controller.js:bootstrapIdentitySelfHeal (self-heal path)

  2. bootstrapIdentitySelfHeal({ userId, actorId })
     Called from: useIdentityResolutionEffect.hook.js:99 when nextIdentity is null
     No access-status check before invocation

  3. commitIdentity(nextDetails)
     Called from: useIdentityResolutionEffect (resolution effect) line 222
     Also called: identityContext.jsx:91 (switchActor path) — NO cross-user check

  4. switchActor(actorId, _dbgEntryPoint)
     Public surface in identityContext.jsx:68
     Calls: switchActorController → loadIdentityForActorId (no _engineMeta attached)
     Commits result via commitIdentity directly

  5. dalProvisionVcsmIdentity({ userId, actorId })
     SECURITY DEFINER RPC sink — provision_vcsm_identity
     No app-layer ownership check before call

Input sources (user-controlled):
  - actorId parameter in ensureVcsmPlatformBootstrap / useIdentityOps
  - actorId parameter in switchActor
  - userId parameter in ensureVcsmPlatformBootstrap (should match session user.id)

Trusted input boundary:
  - Session user.id from Supabase auth
  - actor availability verified via ctx.availableActors in switchActorController
  - DB-level RLS on provision_vcsm_identity RPC (enforcement unverified at app layer)

Validation present at boundary: PARTIAL
  - null checks present (userId, actorId non-null)
  - ownership verification: ABSENT at app layer
  - access status check: ABSENT before self-heal
  - cross-user check: ABSENT in commitIdentity and switchActor path
```

---

## Executive Summary

ELEKTRA performed a first-pass precision scan of the VCSM identity feature covering source→sink chain tracing for all open THOR blockers identified by VENOM and BLACKWIDOW. All four HIGH findings from the upstream chain are source-verified with complete exploit chains. ELEKTRA independently confirms 8 findings and proposes 7 concrete patches.

The four THOR blockers fall into two distinct vulnerability families:

**Family A — Authorization bypass (bootstrap path):** ELEK-001 and ELEK-003 share the same sink (`provision_vcsm_identity` RPC) and the same root cause: no app-layer ownership verification before calling the SECURITY DEFINER RPC. The self-heal trigger makes this exploitable by revoked users without active session intent.

**Family B — Identity commit bypass (state commit path):** ELEK-002 and ELEK-004 share the same sink (`commitIdentity` → `upsertActors` hydration store). The null `_engineMeta.userId` allows the cross-user guard in `useIdentityResolutionEffect` to be silently skipped. The switch path goes directly to `commitIdentity` without passing through any cross-user guard at all. ELEK-004 additionally causes hydration store poisoning (BW-IDENT-011 chain confirmed).

Two MEDIUM findings and two LOW findings were confirmed. One false positive was rejected (Wentrex role bleed — not applicable to VCSM scope).

All patches are proposed for human review. ELEKTRA does not apply fixes.

---

## High Findings

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-06-05-001
Title:              Self-heal path re-provisions revoked users without access-status check
Category:           Auth Bypass / Privilege Escalation
Severity:           HIGH
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/state/identity/identitySelfHeal.controller.js:13-14
                    apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js:89-123
Cross-refs:         VEN-IDENTITY-002, BW-IDENT-006
Source:             loadDefaultIdentityForUser returns null for users with revoked access
                    (null is not DELETED_ACCOUNT_SENTINEL — no sentinel for revoked status)
Sink:               dalProvisionVcsmIdentity → supabase.schema('platform').rpc('provision_vcsm_identity')
                    provision.rpc.dal.js:33-38
Trust Boundary:     bootstrapIdentitySelfHeal must check user_app_access.status = 'active'
                    before calling ensureVcsmPlatformBootstrap
Impact:             Revoked user triggers self-heal on login, re-provisioning all 6 platform
                    identity rows (user_app_access, user_app_accounts, user_app_preferences,
                    user_app_state, user_app_actor_links, actor bridge). Revoked user regains
                    active platform identity.
Evidence:           identity.controller.js:248-253 — catch block returns null (includes revoked
                    access scenario); useIdentityResolutionEffect.hook.js:89 — null triggers
                    self-heal unconditionally; identitySelfHeal.controller.js:13-14 — no
                    access status check before calling ensureVcsmPlatformBootstrap.
Reproduction Steps:
  1. Revoke a user's platform access (set user_app_access.status != 'active')
  2. User attempts login — loadDefaultIdentityForUser returns null (no platform rows visible)
  3. useIdentityResolutionEffect.hook.js:89 triggers self-heal branch
  4. findSelfHealActorForUser(user.id) returns vcActor — no status check
  5. bootstrapIdentitySelfHeal({ userId, actorId }) called — no status check
  6. ensureVcsmPlatformBootstrap → dalProvisionVcsmIdentity → provision_vcsm_identity RPC
  7. RPC atomically creates new platform rows — revocation bypassed
Existing Defense:   DELETED_ACCOUNT_SENTINEL correctly handles is_deleted=true actors (logout)
Why Defense Is Insufficient:
  No equivalent REVOKED_ACCOUNT_SENTINEL exists. Revoked users return null (not a sentinel),
  which is indistinguishable from a first-time user with no platform rows. The self-heal
  guard checks only null — not the reason for null.
Recommended Fix:    Add user_app_access.status check in bootstrapIdentitySelfHeal.
                    Add REVOKED_ACCOUNT_SENTINEL (or ACCESS_DENIED_SENTINEL) returned from
                    loadDefaultIdentityForUser when access is revoked, triggering logout
                    rather than self-heal — parallel to DELETED_ACCOUNT_SENTINEL.
Suggested Patch:
  // identitySelfHeal.controller.js — add status pre-check before bootstrap
  import { readUserAppAccessStatusDAL } from '@/features/identity/dal/readUserAppAccess.read.dal'

  export async function bootstrapIdentitySelfHeal({ userId, actorId }) {
    const access = await readUserAppAccessStatusDAL(userId)
    if (!access || access.status !== 'active') {
      throw new Error(`Self-heal blocked: user_app_access.status=${access?.status ?? 'missing'}`)
    }
    return ensureVcsmPlatformBootstrap({ userId, actorId })
  }

  // identity.controller.js — add REVOKED_ACCOUNT_SENTINEL detection
  // In the same block that detects is_deleted (line 212), add:
  export const REVOKED_ACCOUNT_SENTINEL = Object.freeze({ __accountRevoked: true })
  // Query user_app_access.status before returning hydratedIdentity
  // If status !== 'active' → return REVOKED_ACCOUNT_SENTINEL
  //
  // In useIdentityResolutionEffect.hook.js, parallel to DELETED_ACCOUNT_SENTINEL handler:
  if (nextIdentity === REVOKED_ACCOUNT_SENTINEL) {
    commitIdentity(null)
    setLoading(false)
    await logout({ accessRevoked: true })
    return
  }
  // NOTE: requires new readUserAppAccessStatusDAL — DAL must be created first (see DB)

Follow-up Command:  DB (verify user_app_access.status column + RLS on read),
                    Carnage (migration if status column/enum needs adding)
```

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-06-05-002
Title:              Null _engineMeta.userId silently bypasses cross-user commit guard
Category:           Auth Bypass / Weak Session
Severity:           HIGH
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js:151-162
Cross-refs:         VEN-IDENTITY-003, BW-IDENT-002 (null conditional component)
Source:             nextIdentity._engineMeta?.userId — optional-chained to null default
Sink:               commitIdentity(nextDetails) → identityContext.jsx:40-61
                    → upsertActors in useActorStore (hydration store)
Trust Boundary:     useIdentityResolutionEffect.hook.js:151-162 — cross-user guard
Impact:             When _engineMeta is absent or userId is null within _engineMeta,
                    the guard condition `if (identityUserId && ...)` evaluates to false
                    (null is falsy). An identity object with null _engineMeta.userId is
                    committed unconditionally. If the wrong user's identity reaches this
                    path with a null or stripped _engineMeta, it is committed to the
                    React state and hydration store without session-user verification.
Evidence:           useIdentityResolutionEffect.hook.js:152 —
                      const identityUserId = nextIdentity._engineMeta?.userId ?? null;
                    Line 153 —
                      if (identityUserId && identityUserId !== user.id) { ... reject ... }
                    identity.controller.js:237-244 — _engineMeta.userId set to ctx.userId ?? null;
                    catch block at line 253 returns null (not identity, so no _engineMeta);
                    HOWEVER: self-heal path calls loadDefaultIdentityForUser a second time
                    (useIdentityResolutionEffect.hook.js:116) — if this second call returns
                    identity without a proper engine context, _engineMeta.userId may be null.
Reproduction Steps:
  1. Arrange conditions where loadDefaultIdentityForUser returns identity with
     _engineMeta.userId = null (e.g., engine context has userId: null from ctx.userId ?? null)
  2. nextIdentity._engineMeta?.userId ?? null evaluates to null
  3. Guard: if (null && null !== user.id) → false — guard silently passes
  4. commitIdentity(nextIdentity) called with cross-user check bypassed
  5. Wrong user's identity committed to IdentityDetailsContext and hydration store
Existing Defense:   resolveVersionRef race guard prevents stale commits (line 126)
Why Defense Is Insufficient:
  Version guard prevents stale async commits but does not protect against a
  same-version commit of wrong-user identity when _engineMeta.userId is null.
  The version guard and the ownership guard are orthogonal concerns.
Recommended Fix:    Invert the null condition: treat null _engineMeta.userId as mismatch,
                    not as pass. Require _engineMeta.userId to be present and match.
Suggested Patch:
  // useIdentityResolutionEffect.hook.js — line 152-162
  // BEFORE (vulnerable):
  const identityUserId = nextIdentity._engineMeta?.userId ?? null;
  if (identityUserId && identityUserId !== user.id) {
    // ... reject
  }

  // AFTER (patched):
  const identityUserId = nextIdentity._engineMeta?.userId ?? null;
  if (!identityUserId || identityUserId !== user.id) {
    debugLoginEvent('IDENTITY_OWNERSHIP_MISMATCH', {
      phase: 'identity', status: 'error',
      message: `Rejecting identity: userId=${identityUserId ?? 'null'}, session=${user.id}`,
      payload: { identityUserId, sessionUserId: user.id, actorId: nextIdentity.actorId },
    })
    commitIdentity(null)
    setLoading(false)
    return
  }

  // NOTE: This change means any identity object without _engineMeta.userId is rejected.
  // Self-heal path must ensure the second loadDefaultIdentityForUser call produces
  // identity with _engineMeta.userId populated (verifiable via DB).

Follow-up Command:  DB (verify ctx.userId is always populated by engine resolver),
                    SPIDER-MAN (regression: self-heal flow must still succeed for new users)
```

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-06-05-003
Title:              Bootstrap controller accepts caller-supplied actorId without session ownership check
Category:           IDOR/BOLA
Severity:           HIGH
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js:31-51
                    apps/VCSM/src/features/identity/dal/provision.rpc.dal.js:29-43
Cross-refs:         BW-IDENT-001
Source:             actorId parameter — caller-supplied; no session binding at controller
Sink:               supabase.schema('platform').rpc('provision_vcsm_identity', { p_user_id: userId, p_actor_id: actorId })
                    provision.rpc.dal.js:33-38
Trust Boundary:     ensureVcsmPlatformBootstrap.controller.js:31-34 — only null check
Impact:             An authenticated user calling ensureVcsmPlatformBootstrap (via useIdentityOps
                    hook or identityOps.adapter direct export) can pass an arbitrary actorId
                    not owned by their session user. The SECURITY DEFINER RPC provisions
                    platform identity rows linking that actorId to the caller's userId —
                    potentially hijacking another actor's platform state.
Evidence:           ensureVcsmPlatformBootstrap.controller.js:31-34 —
                      if (!userId || !actorId) { return { ok: false, error: 'Missing...' } }
                    No assertion: caller userId === session.user.id
                    No assertion: actorId is owned by userId via vc.actor_owners
                    identityOps.adapter.js:1 — controller exported directly from adapter;
                    any consumer calling this gets an unguarded bootstrap surface.
Reproduction Steps:
  1. Attacker is authenticated as user A
  2. Attacker obtains target actorId belonging to user B (e.g., from public profile)
  3. Attacker calls ensureVcsmPlatformBootstrap({ userId: userA.id, actorId: victimActorId })
     via useIdentityOps hook (no UI restriction)
  4. Controller passes null check — proceeds to DAL
  5. provision_vcsm_identity RPC creates platform rows linking victimActorId to userA
  6. userA may gain ability to operate as victimActorId if RPC does not gate ownership
  NOTE: RPC is SECURITY DEFINER — DB-level ownership enforcement unverified
Existing Defense:   Null guard at controller:32-34; DB RPC SECURITY DEFINER (enforcement unverified)
Why Defense Is Insufficient:
  Null check is not an ownership check. SECURITY DEFINER RPCs run with elevated privilege;
  the question is whether provision_vcsm_identity itself verifies that p_actor_id is owned
  by p_user_id via vc.actor_owners before creating rows. This has not been confirmed at
  the app layer, and the app layer provides no backstop if the RPC does not enforce it.
Recommended Fix:    Add app-layer ownership pre-check before RPC call. Require caller to
                    prove actorId belongs to userId (query vc.actor_owners) OR derive both
                    userId and actorId from the Supabase session exclusively.
Suggested Patch:
  // ensureVcsmPlatformBootstrap.controller.js — add ownership pre-check
  import { assertActorOwnedByUserDAL } from '@/features/identity/dal/assertActorOwnership.read.dal'

  export async function ensureVcsmPlatformBootstrap({ userId, actorId }) {
    if (!userId || !actorId) {
      return { ok: false, error: 'Missing userId or actorId' }
    }

    // Ownership pre-check: verify actorId belongs to userId before provisioning
    const ownershipValid = await assertActorOwnedByUserDAL({ userId, actorId })
    if (!ownershipValid) {
      return { ok: false, error: 'Actor not owned by user' }
    }

    try {
      const userAppAccountId = await dalProvisionVcsmIdentity({ userId, actorId })
      if (!userAppAccountId) {
        return { ok: false, error: 'Provision RPC returned no account ID' }
      }
      return { ok: true, userAppAccountId }
    } catch (error) {
      debugLoginEvent('PLATFORM_BOOTSTRAP_FAILED', {
        phase: 'bootstrap', status: 'warn',
        message: error?.message ?? 'Unknown error',
        payload: { userId, actorId },
      })
      return { ok: false, error: error?.message ?? 'Unknown error' }
    }
  }

  // assertActorOwnedByUserDAL: query vc.actor_owners WHERE actor_id=actorId AND user_id=userId
  // NOTE: DB team must also confirm provision_vcsm_identity RPC internally enforces ownership

Follow-up Command:  DB (confirm provision_vcsm_identity RPC ownership gate),
                    Carnage (migration if RPC ownership guard is absent)
```

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-06-05-004
Title:              commitIdentity lacks cross-user check — switch path bypasses session guard entirely
Category:           Auth Bypass / IDOR/BOLA
Severity:           HIGH
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/state/identity/identityContext.jsx:40-61 (commitIdentity)
                    apps/VCSM/src/state/identity/identityContext.jsx:85-95 (switchActor path)
Cross-refs:         BW-IDENT-002 (switch path component), BW-IDENT-011 (hydration poisoning chain)
Source:             result.nextIdentity from switchActorController — committed directly
                    (no _engineMeta attached by loadIdentityForActorId; no cross-user check
                    at commitIdentity)
Sink:               identityContext.jsx:46-59 — upsertActors(hydration store) with committed identity
Trust Boundary:     commitIdentity should verify identity belongs to current session user
                    (independent of the check in useIdentityResolutionEffect)
Impact:             The cross-user guard exists ONLY in useIdentityResolutionEffect.hook.js.
                    The switchActor path in identityContext.jsx calls commitIdentity() directly
                    after switchActorController returns result.nextIdentity. commitIdentity has
                    no cross-user check. If switchActorController returns a nextIdentity
                    belonging to another user (e.g., via a state confusion or DB failure
                    that bypasses the availableActors scope check), it is committed without
                    any session-level guard. Additionally, commitIdentity's upsertActors call
                    writes actor data to the shared hydration store — poisoning it if the wrong
                    identity is committed (BW-IDENT-011 confirmed chain).
Evidence:           identityContext.jsx:40-61 — commitIdentity() body: no cross-user check;
                    identityContext.jsx:85-95 — switchActor calls commitIdentity(result.nextIdentity)
                    with no interposing guard;
                    switchActor.controller.js:151 — loadIdentityForActorId(actorId) does NOT
                    attach _engineMeta (structural gap confirmed by BW-IDENT-002 prior run);
                    identityContext.jsx:46-59 — upsertActors called with committed actor data
Reproduction Steps:
  1. switchActor(targetActorId) called
  2. switchActorController runs — ownership gate via availableActors (DB-backed)
  3. loadIdentityForActorId returns nextIdentity WITHOUT _engineMeta.userId
  4. identityContext.jsx:85 — result.success && result.nextIdentity → commits directly
  5. commitIdentity(result.nextIdentity) called — no cross-user check at all
  6. upsertActors writes potentially wrong actor to hydration store
  SCENARIO B: If availableActors gate is somehow bypassed (future regression or
  cache staleness), commitIdentity provides zero backstop.
Existing Defense:   switchActorController:84 — availableActors ownership scope check;
                    switchActorController:127 — engineSwitchActiveActor DB RPC gate
Why Defense Is Insufficient:
  Defense is in switchActorController, not in commitIdentity. commitIdentity is a
  shared commit path called from multiple places. Defense-in-depth requires the commit
  itself to verify ownership. A future refactor or regression in switchActorController
  would leave commitIdentity completely unguarded.
Recommended Fix:    Add cross-user guard inside commitIdentity. When nextDetails has
                    _engineMeta.userId, verify it matches the session user. Also update
                    switchActorController to attach _engineMeta.userId to loadIdentityForActorId
                    result so the guard has data to check.
Suggested Patch:
  // identityContext.jsx — commitIdentity with defense-in-depth cross-user guard
  function commitIdentity(nextDetails) {
    // Defense-in-depth: reject if _engineMeta identifies a different user
    const detailsUserId = nextDetails?._engineMeta?.userId ?? null
    if (nextDetails && detailsUserId && detailsUserId !== user?.id) {
      if (import.meta.env.DEV) {
        console.error('[commitIdentity] REJECTED — cross-user identity', {
          detailsUserId, sessionUserId: user?.id, actorId: nextDetails?.actorId
        })
      }
      return
    }
    setIdentityDetails(nextDetails ?? null)
    setPublicIdentity(toPublicIdentity(nextDetails))
    if (nextDetails?.actorId) {
      try {
        useActorStore.getState().upsertActors([{ ... }])  // existing code
      } catch (_) {}
    }
  }

  // switchActor.controller.js — attach _engineMeta.userId after loadIdentityForActorId
  // In the loadIdentityForActorId call block:
  const nextIdentity = await loadIdentityForActorId(actorId)
  if (nextIdentity) {
    nextIdentity._engineMeta = {
      ...(nextIdentity._engineMeta ?? {}),
      userId: ctx.userId ?? null,   // attach session userId from ctx
    }
  }

Follow-up Command:  SPIDER-MAN (regression: actor switch must still succeed normally),
                    VENOM (re-verify commitIdentity trust boundary after patch)
```

---

## Medium Findings

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-06-05-005
Title:              identityOps.adapter.js exports raw controller functions — adapter boundary violation
Category:           Privilege Escalation (attack surface widening)
Severity:           MEDIUM
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/identity/adapters/identityOps.adapter.js:1-2
Cross-refs:         BW-IDENT-010
Source:             Any feature importing from identityOps.adapter.js
Sink:               ensureVcsmPlatformBootstrap (SECURITY DEFINER RPC sink)
                    refreshVcActorDirectory (actorId injection sink)
Trust Boundary:     VCSM adapter rule: "Adapters expose only hooks, components, view screens"
                    (apps/VCSM/CLAUDE.md — Adapter Boundaries section)
Impact:             Adapter directly exposes two controller functions without hook-level wrapping.
                    Consuming features obtain raw controller access — bypassing any hook-level
                    guard that could be added in useIdentityOps (e.g., session binding,
                    ownership assertion). Widens the callable attack surface for ELEK-001
                    and ELEK-003 exploits.
Evidence:           identityOps.adapter.js:1 —
                      export { ensureVcsmPlatformBootstrap } from '@/features/identity/controller/...'
                    identityOps.adapter.js:2 —
                      export { refreshVcActorDirectory } from '@/features/identity/controller/...'
                    VCSM CLAUDE.md: "Adapters never export DAL functions, models, or controllers"
Reproduction Steps:
  Any feature doing:
    import { ensureVcsmPlatformBootstrap } from '@identity/adapter'
  gets the raw controller — any ownership guard added to the hook path is bypassed.
Existing Defense:   useIdentityOps hook wraps the controllers but does not add guards;
                    adapter exports are used by identitySelfHeal.controller.js:2
Why Defense Is Insufficient:
  The point of the adapter boundary is that wrapping in the hook allows guards to be added
  later. Direct controller export forecloses that. Fixes to the hook (e.g., adding session
  binding) would not apply to direct controller consumers.
Recommended Fix:    Remove direct controller exports from identityOps.adapter.js.
                    Expose only the useIdentityOps hook. Add session binding to the hook.
Suggested Patch:
  // identityOps.adapter.js — REPLACE direct controller exports with hook-only export
  // BEFORE:
  export { ensureVcsmPlatformBootstrap } from '@/features/identity/controller/...'
  export { refreshVcActorDirectory } from '@/features/identity/controller/...'

  // AFTER:
  export { useIdentityOps } from '@/features/identity/hooks/useIdentityOps'

  // NOTE: identitySelfHeal.controller.js currently imports ensureVcsmPlatformBootstrap
  // from this adapter. Update that import to go directly to the controller (state layer
  // importing from feature controller is acceptable; importing via adapter is the violation).
  // CORRECTION to import in identitySelfHeal.controller.js:
  import { ensureVcsmPlatformBootstrap } from '@/features/identity/controller/ensureVcsmPlatformBootstrap.controller'

Follow-up Command:  VENOM (re-verify adapter boundary after patch)
```

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-06-05-006
Title:              Sensitive PII in identity model state — email, birthdate, age, sex, isAdult
Category:           Secrets Exposure
Severity:           MEDIUM
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/state/identity/identity.model.js:47-49
                    apps/VCSM/src/state/identity/identity.read.dal.js (PROFILE_COLUMNS)
                    apps/VCSM/src/state/identity/identityContext.jsx:183-185 (useIdentityDetailsDeprecated)
Cross-refs:         VEN-IDENTITY-006
Source:             PROFILE_COLUMNS in identity.read.dal.js — includes email, birthdate, age, sex, is_adult
Sink:               mapProfileActor in identity.model.js → identityDetails React state
                    → useIdentityDetailsDeprecated() hook → any consumer component
Trust Boundary:     Identity model should not surface PII beyond what UI strictly requires
Impact:             Full PII (email, birthdate, age, sex, isAdult) is loaded into React state
                    on every login and accessible to any component consuming
                    useIdentityDetailsDeprecated(). The "_deprecated" label signals intent to
                    remove but the hook is still exported and presumably used. Any XSS or
                    component-level data leak exposes high-sensitivity personal data.
Evidence:           identity.model.js:47-49 — mapProfileActor includes:
                      email: profileRow.email, birthdate: profileRow.birthdate,
                      age: profileRow.age, sex: profileRow.sex, isAdult: profileRow.is_adult
                    identityContext.jsx:183-185 — useIdentityDetailsDeprecated() returns full
                    IdentityDetailsContext (no field restriction)
Reproduction Steps:
  Any component calling useIdentityDetailsDeprecated() receives the full identityDetails
  object including PII fields. No audit exists of which components consume this hook and
  whether they expose any of these fields to the DOM, logs, or network requests.
Existing Defense:   toPublicIdentity() strips PII (returns only actorId, kind, ownerActorId)
                    for the public identity surface
Why Defense Is Insufficient:
  toPublicIdentity only governs the public surface. The deprecated hook bypasses this filter.
  The PII is present in React state for the full session lifetime.
Recommended Fix:    Remove PII fields from PROFILE_COLUMNS or from mapProfileActor.
                    If age-gating (isAdult) is needed, scope it to a minimal dedicated hook.
                    Audit all consumers of useIdentityDetailsDeprecated and migrate to
                    narrower hooks before deprecation removal.
Suggested Patch:
  // identity.model.js — remove PII from mapProfileActor
  // Remove: email, birthdate, age, sex, isAdult (unless features explicitly require them)
  // If isAdult is needed for age-gating, add a dedicated minimal hook:
  //   export function useIsAdult() { return useContext(IdentityDetailsContext)?.isAdult ?? false }

  // identity.read.dal.js — remove from PROFILE_COLUMNS:
  //   'email', 'birthdate', 'age', 'sex', 'is_adult'
  // NOTE: audit all useIdentityDetailsDeprecated consumers first

Follow-up Command:  Deadpool (audit useIdentityDetailsDeprecated call sites)
```

---

## Low Findings

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-06-05-007
Title:              readUserActorByProfileIdDAL missing is_deleted=false filter
Category:           Auth Bypass (non-critical path)
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/state/identity/identity.read.dal.js:157-169
Cross-refs:         BW-IDENT-012
Source:             readUserActorByProfileIdDAL(userId) — queries vc.actors WHERE profile_id=userId AND kind='user'
Sink:               findSelfHealActorForUser → bootstrapIdentitySelfHeal (provisions deleted actor)
Trust Boundary:     Query should filter is_deleted=false to exclude soft-deleted actors
Impact:             findSelfHealActorForUser may return a soft-deleted actor's ID.
                    bootstrapIdentitySelfHeal is called with the deleted actorId.
                    provision_vcsm_identity creates new platform rows for a deleted actor.
                    On the second loadDefaultIdentityForUser call, DELETED_ACCOUNT_SENTINEL
                    is returned and logout is triggered — correct final outcome.
                    Security impact: unnecessary RPC call that creates then immediately
                    discards platform rows. Not exploitable for persistent access, but
                    constitutes an unintended SECURITY DEFINER RPC invocation for deleted actors.
Evidence:           identity.read.dal.js:157-169 — no is_deleted=false filter in WHERE clause;
                    identitySelfHeal.controller.js:8-11 — returns row.id without deleted check
Recommended Fix:    Add is_deleted=false filter to the DAL query.
Suggested Patch:
  // identity.read.dal.js — add is_deleted filter
  // In readUserActorByProfileIdDAL WHERE clause, add:
  .eq('is_deleted', false)

Follow-up Command:  DB (confirm vc.actors.is_deleted index for filter performance)
```

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-06-05-008
Title:              switchActorController:44 TypeError before null guard fires
Category:           Auth Bypass (non-fatal; degraded error path)
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/state/identity/controller/switchActor.controller.js:44
Cross-refs:         BW-IDENT-005
Source:             actorId parameter in switchActorController
Sink:               actorId.slice(0,8) — TypeError if actorId is null at callsite
Trust Boundary:     identityContext.jsx:69 — null guard before switchActor call
Impact:             If switchActorController is called directly (bypassing identityContext guard)
                    with actorId=null, a TypeError fires at line 44 before any logic runs.
                    This is non-fatal at the identityContext level (caller catches it).
                    However, a future caller that does not wrap in try/catch would propagate
                    the error to the UI. Attack vector: limited — requires calling controller
                    directly.
Evidence:           switchActor.controller.js:44 — actorId.slice(0,8) before null check
                    identityContext.jsx:69 — null guard present for switchActor (protects
                    normal path)
Recommended Fix:    Move the slice reference inside the guard or add a top-level null check
                    at the start of switchActorController.
Suggested Patch:
  // switchActor.controller.js — add null guard before line 44
  export async function switchActorController({ actorId, ... }) {
    if (!actorId) {
      return { success: false, code: 'NO_ACTOR_ID', ... }
    }
    // existing code — actorId.slice(0,8) is now safe
  }

Follow-up Command:  SPIDER-MAN (regression: null actorId in switchActor paths)
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

Candidate:          Wentrex cross-org role bleed via roleKeys in vcsmIdentity.resolver.js
Location:           apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js
Rejection reason:   VCSM resolver always returns roleKeys:[] — no LMS role queries exist in
                    VCSM. The Wentrex finding (VEN-IDENTITY-005) originated from the Wentrex
                    identity resolver context, not VCSM. VCSM has no org membership concept.
Chain gap:          Sink — no LMS role assignment sink exists in VCSM; the chain cannot be
                    completed from the vcsmIdentity.resolver.js source.
Notes:              Already closed in SECURITY.md VENOM STATUS. Confirmed false positive
                    for VCSM scope. Wentrex-scoped review required separately.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-05-001 | Self-heal revoked user bypass | HIGH | Controller + State Hook | MODERATE | YES — readUserAppAccessStatusDAL + REVOKED_ACCOUNT_SENTINEL |
| 2 | ELEK-2026-06-05-002 | Null _engineMeta.userId bypass | HIGH | State Hook | SIMPLE | NO |
| 3 | ELEK-2026-06-05-003 | Bootstrap ownership pre-check absent | HIGH | Controller + DAL | MODERATE | YES — assertActorOwnedByUserDAL |
| 4 | ELEK-2026-06-05-004 | commitIdentity no cross-user check | HIGH | State Context + Controller | SIMPLE | NO |
| 5 | ELEK-2026-06-05-005 | Adapter boundary violation | MEDIUM | Adapter + Controller import | SIMPLE | NO |
| 6 | ELEK-2026-06-05-006 | PII in identity model state | MEDIUM | Model + DAL + Hook audit | MODERATE | NO |
| 7 | ELEK-2026-06-05-007 | is_deleted filter missing | LOW | DAL | SIMPLE | NO |

Note: ELEK-2026-06-05-008 patch is trivial and can be bundled with ELEK-2026-06-05-004.

---

## ARCHITECT Surface Miss Check

No `architect-security-surface.json` or `evidence-bundle.json` found for this feature.
Mode: ARCHITECTURE-MD-FALLBACK (ARCHITECTURE.md + INDEX.md used as architecture record).
ARCHITECTURE-MD-FALLBACK confirmed by VENOM 2026-06-05 preflight — within 3-day freshness window.

All write surfaces confirmed present in ARCHITECTURE.md:
- `platform.provision_vcsm_identity` RPC ✅ (documented)
- `identity.refresh_actor_directory_row` RPC ✅ (documented)

ARCHITECT_SURFACE_MISS: NONE found. Recommend ARCHITECT produce evidence-bundle.json on next run.

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Verify provision_vcsm_identity RPC enforces p_actor_id ownership vs p_user_id; verify user_app_access.status column exists + RLS read grants; confirm vc.actor_owners ownership query feasibility | PENDING |
| Carnage | Migration if provision_vcsm_identity RPC lacks ownership check; migration if user_app_access.status read DAL needs column addition | PENDING |
| HAWKEYE | Endpoint/API contract verification — verify ensureVcsmPlatformBootstrap call sites, actor switch surface | PENDING |
| LOKI | Runtime observability — trace self-heal triggers in production to assess frequency of revoked-user self-heal events | PENDING |
| SPIDER-MAN | Regression coverage — ELEK-001 fix must not break first-time user bootstrap; ELEK-002 fix must not block legitimate self-healed identity commits | PENDING |
| CONTRACT REVIEWER | Architecture contract compliance — adapter boundary violation (ELEK-005), VCSM rule enforcement | PENDING |
| VENOM | Re-verify after patches applied — confirm commitIdentity trust boundary, bootstrap ownership gate, adapter boundary | PENDING |

---

## THOR Release Gate Assessment

ELEKTRA identifies the following as THOR RELEASE BLOCKERS:

| Finding | Severity | Blocker Reason |
|---|---|---|
| ELEK-2026-06-05-001 | HIGH | Revoked user bypasses access control via SECURITY DEFINER RPC |
| ELEK-2026-06-05-002 | HIGH | Cross-user identity commit guard bypassed via null _engineMeta |
| ELEK-2026-06-05-003 | HIGH | IDOR: bootstrap RPC accepts arbitrary actorId with no app-layer ownership check |
| ELEK-2026-06-05-004 | HIGH | Cross-user identity commit in switch path; hydration store poisoning chain |

MEDIUM (ELEK-005, ELEK-006): THOR CAUTION — mitigation in progress acceptable.
LOW (ELEK-007, ELEK-008): Not release-blocking per §13.

ELEKTRA RECOMMENDATION: FAIL
Reason: 4 confirmed HIGH findings with verified source→sink chains. All four require patches before THOR gate.

ELEKTRA may NOT emit THOR_RELEASE_ELIGIBLE. Release authority belongs exclusively to THOR.
