# BLACKWIDOW V2 — Adversarial Runtime Verification Report
# Feature: identity | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Type | BW2.9 Adversarial Runtime Verification |
| Feature | identity |
| App | VCSM |
| Run Date | 2026-06-04 |
| Analyst | BLACKWIDOW V2 |
| Scanner Version | 1.1.0 |
| Scanner Maps Generated | 2026-06-04T19:48:25.152Z (FRESH — ~7h old) |
| Behavior Contract Status | PLACEHOLDER — all §9 invariants UNANCHORED |
| Prior VENOM Findings (OPEN) | VEN-IDENTITY-001 through VEN-IDENTITY-005 |
| Prior ELEKTRA Findings (OPEN) | NONE (never run) |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Status | FRESH |
| Maps Timestamp | 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Identity Security Paths (scanner) | 8 (all VCSM-scoped; also 4 Wentrex paths excluded from this review) |
| Platform Security Paths (total) | 598 |
| Identity Callgraph Nodes | 184 |
| Identity Callgraph Edges | 311 |

---

## 3. Scanner Inputs Block

| Map | Status | Notes |
|---|---|---|
| security-path-map.json | READ | 8 identity paths extracted (VCSM only); all confidence: LOW |
| callgraph.json | READ | 184 nodes, 311 edges; 11 controller entries, 5 hook entries |
| write-execution-map.json | READ | 0 identity paths resolved (empty — all LOW confidence) |
| rpc-execution-map.json | READ | 0 identity paths resolved (empty — all LOW confidence) |

**Scanner confidence assessment:** ALL 8 security paths for identity are LOW confidence — scanner could not resolve source routes (no route-confirmed path exists for bootstrap/provisioning surfaces). These are PRIMARY ATTACK TARGETS per Rule BW-002.

---

## 4. Attack Surface Inventory

### 4.1 Write Surfaces (RPC)

| Surface | RPC | Schema | DAL File | Confidence |
|---|---|---|---|---|
| Provision VCSM Identity | platform.provision_vcsm_identity | platform | provision.rpc.dal.js | HIGH (write confirmed) / LOW (route unresolved) |
| Refresh Actor Directory | identity.refresh_actor_directory_row | identity | refreshActorDirectory.dal.js | HIGH (write confirmed) / LOW (route unresolved) |
| Set Active Actor Link | (direct update) | platform | actorLinks.write.dal.js (engine) | HIGH (write confirmed) / LOW (route unresolved) |
| Record Login | (direct update) | platform | state.write.dal.js (engine) | HIGH (write confirmed) |

### 4.2 Hook Entry Points (UI-accessible)

| Hook | Layer | File |
|---|---|---|
| useIdentityOps | hook | apps/VCSM/src/features/identity/hooks/useIdentityOps.js |
| useIdentityResolutionEffect (run) | hook | apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js |
| useIdentitySync | hook | apps/VCSM/src/state/identity/useIdentitySync.js |
| useActorConsistencyCheck | hook (debugger stub) | apps/VCSM/src/debuggers-stub/identity/useActorConsistencyCheck.js |

### 4.3 Controller Entry Points

| Controller | File |
|---|---|
| ensureVcsmPlatformBootstrap | features/identity/controller/ensureVcsmPlatformBootstrap.controller.js |
| switchActorController | state/identity/controller/switchActor.controller.js |
| bootstrapIdentitySelfHeal | state/identity/identitySelfHeal.controller.js |
| finalizeSelfHealedIdentity | state/identity/identitySelfHeal.controller.js |
| resolveAuthenticatedContext (engine) | engines/identity/src/controller/resolveAuthenticatedContext.controller.js |
| switchActiveActor (engine) | engines/identity/src/controller/switchActiveActor.controller.js |
| logoutCleanup (engine) | engines/identity/src/controller/logoutCleanup.controller.js |

### 4.4 DAL Write Surfaces

| DAL Function | Target | Ownership Filter |
|---|---|---|
| dalProvisionVcsmIdentity | platform.provision_vcsm_identity RPC | RPC is SECURITY DEFINER — RLS enforced inside RPC |
| refreshActorDirectoryRow | identity.refresh_actor_directory_row RPC | No client-side ownership filter; RLS deferred to DB |
| dalSetActiveActorLink | platform.user_app_preferences UPDATE | Filtered by user_app_account_id (client-supplied) |

### 4.5 Callgraph: DAL Write Backwards Trace

```
useIdentityOps.js
  └─ ensureVcsmPlatformBootstrap.controller.js
       └─ dalProvisionVcsmIdentity (provision.rpc.dal.js)
            └─ platform.provision_vcsm_identity RPC

useIdentityResolutionEffect.hook.js [run]
  └─ bootstrapIdentitySelfHeal (identitySelfHeal.controller.js)
       └─ ensureVcsmPlatformBootstrap.controller.js
            └─ dalProvisionVcsmIdentity

  └─ finalizeSelfHealedIdentity (identitySelfHeal.controller.js)
       └─ engineSwitchActiveActor (switchActiveActor.controller.js [engine])
            └─ dalSetActiveActorLink (actorLinks.write.dal.js [engine])
                 └─ platform.user_app_preferences UPDATE

switchActorController (state/identity/controller/switchActor.controller.js)
  └─ engineSwitchActiveActor
       └─ dalSetActiveActorLink
            └─ platform.user_app_preferences UPDATE
```

---

## 5. Scanner Signals Block

- All 8 scanner security paths: confidence LOW (no source route resolved)
- Write surfaces: provision_vcsm_identity (HIGH confidence, LOW path), refresh_actor_directory_row (HIGH confidence, LOW path)
- Route resolution: NONE resolved for any identity path
- Scanner write-execution-map: 0 results — confirms write paths are not resolved to routes
- Scanner rpc-execution-map: 0 results — RPC paths not traced to entry routes
- VENOM cross-references: VEN-IDENTITY-002 (self-heal access bypass — directly relevant to bootstrap attack), VEN-IDENTITY-003 (null userId in _engineMeta), VEN-IDENTITY-004 (120s cache), VEN-IDENTITY-005 (cross-org Wentrex — out of scope for VCSM)

---

## 6. Adversarial Path Analysis

---

### 6.A — OWNERSHIP BYPASS

**Attack:** Can an actor submit a mutation with another actor's resource ID via identity operations?

**Target:** ensureVcsmPlatformBootstrap({ userId, actorId })

**Probe:** The controller accepts `userId` and `actorId` as parameters (lines 31-51, ensureVcsmPlatformBootstrap.controller.js). It validates presence (line 32: `if (!userId || !actorId)`). However, it does NOT verify that `actorId` belongs to `userId`. An attacker providing their own `userId` and a victim's `actorId` would reach the RPC call at line 37.

**Source verification:**
```
// ensureVcsmPlatformBootstrap.controller.js:31-37
export async function ensureVcsmPlatformBootstrap({ userId, actorId }) {
  if (!userId || !actorId) {
    return { ok: false, error: 'Missing userId or actorId' }
  }
  try {
    const userAppAccountId = await dalProvisionVcsmIdentity({ userId, actorId })
```

The `provision_vcsm_identity` RPC is defined as SECURITY DEFINER in the DB schema. The RPC is expected to enforce that `p_actor_id` is owned by `p_user_id` at the DB level. If the RPC does NOT perform this check internally, the ownership bypass is live.

**DB-level RPC verification status:** CANNOT VERIFY from source — RPC body not available in source files.

**Where is bootstrapIdentitySelfHeal called?**

In `useIdentityResolutionEffect.hook.js:99`, `bootstrapIdentitySelfHeal` is called with `userId: user.id` (from auth session, trusted) and `actorId: vcActor.actorId`, where `vcActor` comes from `findSelfHealActorForUser(user.id)` which calls `readUserActorByProfileIdDAL(userId)` (identity.read.dal.js:157-167) — this queries `vc.actors` with `.eq('profile_id', profileId).eq('kind', 'user')`. The profileId passed is `user.id` (auth UID), so the actor resolved is owned by the authenticated user. This path is BLOCKED.

However, `useIdentityOps` exposes `ensureVcsmPlatformBootstrap` directly to UI components via the adapter (identityOps.adapter.js:1), with no ownership guard at the adapter layer. Any component calling `useIdentityOps().ensureVcsmPlatformBootstrap({ userId, actorId })` can pass arbitrary values.

**Result:** PARTIAL — self-heal path is BLOCKED; direct adapter call has no ownership assertion pre-RPC. Blocked if DB RPC enforces ownership; BYPASSED if it does not.

**Finding:** BW-IDENT-001

---

### 6.B — SESSION MUTATION

**Attack:** Is viewerActorId taken from session (trusted) or from client payload (untrusted)?

**Target:** loadDefaultIdentityForUser, resolveAuthenticatedContext

**Probe:**

In `loadDefaultIdentityForUser` (identity.controller.js:80-98): `userId` is passed from `useIdentityResolutionEffect.hook.js:58-62` where it is sourced from `user.id` — which comes from `useAuth()` (Supabase auth session). This is TRUSTED.

In `resolveAuthenticatedContext` (engine controller:72-88): `userId = await resolveSessionUser()` reads from `supabase.auth.getUser()` (line 88 in session step). This is NOT taken from a client payload — it is resolved from the server-signed JWT.

For `switchActorController` (state/identity/controller/switchActor.controller.js:19-65): `actorId` is UI-supplied, but ownership is enforced at line 84 — the target actor must be in `ctx.availableActors` which is resolved from the authenticated engine context. `ctx.userAppAccountId` comes from the platform-resolved identity, not from client input.

**Stale/null userId bypass:** In identity.controller.js:152-159, there is a check: if `identityUserId && identityUserId !== user.id` — but this guard is CONDITIONAL on `identityUserId` being non-null. If `_engineMeta.userId` is null (VEN-IDENTITY-003), the guard is silently skipped, and a resolved identity could be committed for a different session user without rejection.

**Source verification:**
```
// useIdentityResolutionEffect.hook.js:151-160
if (nextIdentity) {
  const identityUserId = nextIdentity._engineMeta?.userId ?? null;
  if (identityUserId && identityUserId !== user.id) {
    // ...rejected
    commitIdentity(null);
    return;
  }
```

If `_engineMeta.userId` is null (e.g., engine returned null userId in context), the check at line 153 evaluates to `if (null && ...)` which is falsy — the mismatch check is SKIPPED. The identity is committed regardless.

**Result:** PARTIAL — trusted session sourcing is BLOCKED; null userId guard bypass is CONFIRMED (VEN-IDENTITY-003 cross-confirmed from adversarial angle)

**Finding:** BW-IDENT-002

---

### 6.C — RUNTIME ABUSE

**Attack:** Can a non-owner actor type reach owner-only paths?

**Target:** switchActorController, finalizeSelfHealedIdentity

**Probe for switchActorController:**

At line 84: `const link = ctx.availableActors.find((a) => a.actorId === actorId)` — the target actor must be in the authenticated account's available actors list. This enforces that the actor belongs to the current account. No actor-kind check (user vs vport) is performed on the switch target itself.

At line 39-40 of `switchActiveActor` (engine): validates `row.is_switchable` and `row.status === 'active'`. No kind-level restriction.

**Actor-kind access gates:** Checked in `identitySelectors.js:canCitizenBook` — `kind === 'user'` check for booking eligibility. This is a selector-level guard only, no controller enforcement.

`isBlockedVportIdentity` in identity.model.js:27-35 checks for deleted/void/inactive vport — but it is a model function, not called from any controller in scope. Whether callers enforce it is not determinable without reading all consuming components.

**Result:** BLOCKED for cross-account actor switch; UNRESOLVED for vport kind-gate enforcement at consumer level (no controller-level guard found).

**Finding:** BW-IDENT-003

---

### 6.D — RLS VERIFICATION

**Attack:** For each DAL write surface, is there an ownership filter, or is RLS the only barrier?

**Target:** dalSetActiveActorLink, dalProvisionVcsmIdentity, refreshActorDirectoryRow

**dalSetActiveActorLink (actorLinks.write.dal.js:21-34):**
```
.update({ active_actor_link_id: actorLinkId, last_actor_link_id: actorLinkId })
.eq('user_app_account_id', userAppAccountId)
```
Client-supplied `userAppAccountId` is used as the WHERE filter. Upstream caller (switchActiveActor engine controller:31) validates that `row.user_app_account_id !== userAppAccountId` before calling. However, `userAppAccountId` is sourced from the client-side in-memory context cache (`ctx.userAppAccountId`). If the cache is poisoned or stale, a cross-account write could be attempted. RLS on `platform.user_app_preferences` must be the final backstop.

**dalProvisionVcsmIdentity (provision.rpc.dal.js:29-43):**
RPC is SECURITY DEFINER. Client passes `p_user_id` and `p_actor_id`. No client-side ownership check before RPC. DB must enforce p_user_id = auth.uid() inside RPC body.

**refreshActorDirectoryRow (refreshActorDirectory.dal.js:21-53):**
Passes `actorDomain` and `actorId` to RPC. No ownership check on actorId before calling. The RPC must enforce that the caller owns the actor. If the RPC does not check ownership, any authenticated user could refresh any actor's directory row — a low-severity data integrity issue (not a data disclosure issue, but could cause stale data or trigger denial-of-service on the directory cache).

**Result:** PARTIAL — ownership guards exist at controller layer for switch; provision and refresh are RPC-dependent with no client-side pre-validation of actor ownership.

**Finding:** BW-IDENT-004

---

### 6.E — VIEWER CONTEXT FUZZING

**Attack:** What happens if null/undefined viewerActorId is passed to each controller?

**ensureVcsmPlatformBootstrap({ userId: null, actorId: 'valid' }):**
Line 32: `if (!userId || !actorId)` → returns `{ ok: false, error: 'Missing userId or actorId' }`. BLOCKED.

**ensureVcsmPlatformBootstrap({ userId: 'valid', actorId: null }):**
Same check at line 32. BLOCKED.

**switchActorController({ actorId: null, ctx: validCtx }):**
Line 44: `dbg.event("SWITCH_START", { ..., message: \`Switch to ${actorId.slice(0, 8)}\` })` — if `actorId` is null or undefined, this throws a TypeError at `.slice(0, 8)` BEFORE the `ctx` validation at line 48. The error is caught by the outer try/catch at line 170, and `dbg.error` is logged. `nextIdentity` remains null. Returns `{ success: false }` — partially graceful. No identity commit occurs.

**loadDefaultIdentityForUser({ userId: null }):**
Line 88: `const inflightKey = \`${userId}:${resolveAttempt}\`` — null userId creates key `null:initial`. Line 95: `_loadDefaultIdentityForUserInner({ userId: null, ... })` is called. Line 111: `resolveAuthenticatedContext` is called → engine resolves session from `supabase.auth.getUser()`, not from the passed userId. The `userId` parameter is only used for logging/inflight dedup, NOT for authentication. The resolved userId comes from the JWT. Session-fuzz with null userId is effectively BLOCKED because session resolution is auth-token-based.

**resolveAuthenticatedContext with null appKey:**
Line 93-97: `userId = await resolveSessionUser()` — if session is valid, continues. Then `dalGetAppByKey({ appKey: null })` — this would query `platform.apps` with `app_key = null`, likely returning no row. Line 121: throws `{ code: 'APP_NOT_FOUND', ... }`. BLOCKED.

**Result:** BLOCKED for most null inputs. Partial TypeError risk in switchActorController at line 44 when actorId is null (non-fatal — caught and returns failure). No identity commit occurs.

**Finding:** BW-IDENT-005 (LOW — TypeError on null actorId in switch, non-fatal, no security consequence)

---

### 6.F — MUTATION REPLAY

**Attack:** Can a completed/cancelled operation be re-triggered?

**Target:** provision_vcsm_identity (bootstrap), switchActiveActor

**provision_vcsm_identity:** The controller comment at line 7 states "Idempotent — safe to call on every login." The RPC is explicitly designed to be re-called. This is intentional, not a vulnerability.

**switchActiveActor (engine:24-53):** The engine controller reads the link and checks `row.status !== 'active'` (line 35). An inactive or revoked link cannot be switched to. Once a link is deactivated, repeat switch attempts are BLOCKED at the engine level.

**Bootstrap self-heal replay:** In `useIdentityResolutionEffect.hook.js:89-123`, the self-heal is only triggered when `!nextIdentity` (identity resolution returned null). If a revoked user has their access row updated to status='revoked', `resolveAuthenticatedContext` throws `ACCESS_DENIED` at engine step 3 (line 137-142). This throws an error, which causes `loadDefaultIdentityForUser` to return null (line 252: catch returns null). Then `findSelfHealActorForUser(user.id)` attempts to find an actor by profile_id, which could succeed. Then `bootstrapIdentitySelfHeal` is called — this calls the RPC which may or may not check access status internally.

**CRITICAL replay scenario:** Revoked user → engine returns null due to ACCESS_DENIED (thrown as error, caught, returns null) → self-heal triggers → provision_vcsm_identity RPC called → if RPC does not check user_app_access.status, access rows are re-provisioned for a revoked user.

This is VEN-IDENTITY-002 (VENOM found this path). Adversarial confirmation: the flow path is confirmed from source. Whether it is live depends on whether the RPC checks `platform.user_app_access.status` before upserting rows. This cannot be confirmed from source code alone.

**Result:** PARTIAL for replay; VEN-IDENTITY-002 adversarially cross-confirmed as PLAUSIBLE.

**Finding:** BW-IDENT-006

---

### 6.G — HYDRATION POISONING

**Attack:** Can actor summaries be poisoned or served stale?

**Target:** resolveAuthenticatedContext result cache, hydrateActor, identity.actor_directory

**Result cache TTL:** Engine controller line 36-47 shows a `_resultCache` Map with `_RESULT_TTL = 120_000` (120 seconds). Cache is keyed by `${userId}:${appKey}` (line 103). This is a module-level singleton in the identity engine.

**Poisoning vector:** If an attacker could execute code in the same JavaScript module scope and call `_setCachedResult` (not exported — internal function), they could inject a crafted context. However, this is not externally accessible. The function is NOT exported from the engine.

**Stale cache after actor switch:** `invalidateIdentityResultCache` is called in `switchActiveActor` (line 46) and `logoutCleanup` (line 24). On actor switch, the cache is busted by `invalidateIdentityResultCache()` with NO userId argument — this calls `_resultCache.clear()` (line 56: `else _resultCache.clear()`). This clears ALL entries, not just the current user's. This is aggressive but safe.

**actor_directory refresh with arbitrary actorId:** `refreshVcActorDirectory(actorId)` (dal:59-61) can be called from `useIdentityOps()` with any actorId. There is no ownership guard at the hook level. A component could call `refreshVcActorDirectory(victimActorId)` and trigger a directory row refresh for another actor. This is a mild integrity concern (forcing a stale-to-fresh transition on another actor's directory entry), not a data disclosure issue.

**Identity hydration stores in-memory state only:** The hydration engine stores results in React Query / in-memory cache, not persisted storage. No cross-user cache poisoning is possible at the hydration level.

**Result:** BLOCKED for cache module-scope poisoning; PARTIAL for arbitrary actorId refresh.

**Finding:** BW-IDENT-007

---

### 6.H — URL SURFACE

**Attack:** Do identity notification links, share links, or deep links expose raw UUIDs?

**Target:** identitySelectors.js (getProfilePath), identity-related routing

**getProfilePath** (identitySelectors.js:26-27):
```
export const getProfilePath = (identity) =>
  identity?.actorId ? '/profile/self' : '/me';
```
Returns `/profile/self` — no actorId in path. BLOCKED.

**No notification construction found in identity feature:** The identity feature does not generate notification objects. No linkPath or share URL construction was found in any identity controller or hook.

**Actor switch deep link:** No URL construction found in switchActorController. Switch is purely in-memory state.

**identityStorage.js:** Stores `actorId` in localStorage under key `vc.identity.actorId.{userId}`. The userId key suffix is the auth.users.id (UUID). This is localStorage, not a public URL — not a disclosure vector.

**Result:** BLOCKED — no raw UUID exposure in public URLs found in identity feature.

**Finding:** INFO only — BW-IDENT-008

---

### 6.I — §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**BEHAVIOR.md status: PLACEHOLDER — no §9 Must Never Happen invariants are defined.**

Since no §9 invariants are anchored, adversarial probes are constructed from source-inferred invariants based on platform architecture rules and VEN findings:

**Inferred Invariant I-1: An actor must never be committed as identity for a different authenticated user.**

Attack: Race condition between two concurrent identity resolves (user A and user B share same browser tab via account switching without refresh). `resolveVersionRef` (useIdentityResolutionEffect.hook.js:37) and the stale-resolve guard at line 126-135 prevent stale commits within a single session lifecycle. However, the null-userId bypass (BW-IDENT-002) means: if engineMeta.userId is null, the final cross-user ownership check at line 153 is skipped. A race where the engine returns a context with userId=null for user B, while user A's session is active, could result in user B's actor being committed under user A's session.

**Result: BYPASSED (conditional)** — requires null engineMeta.userId condition (VEN-IDENTITY-003). Source: useIdentityResolutionEffect.hook.js:151-160.

**Inferred Invariant I-2: A revoked user must never be able to re-provision platform access.**

Attack: trigger self-heal after revocation (confirmed in BW-IDENT-006). Result: PARTIAL — depends on DB RPC enforcement. Cannot be confirmed BLOCKED from source alone.

**Inferred Invariant I-3: Actor switch must only succeed for actors owned by the current account.**

Attack: call switchActorController with a valid actorId that belongs to another account. Blocked at switchActorController:84 (must be in availableActors) and switchActiveActor engine:31 (user_app_account_id ownership check). Result: BLOCKED.

**Inferred Invariant I-4: profileId and vportId must never be exposed via useIdentity() public surface.**

Attack: trace what toPublicIdentity (identity.model.js:1-8) exports. Returns only `actorId`, `kind`, `ownerActorId`. No `profileId` or `vportId` fields. BLOCKED.

---

## 7. Exploitability Assessment

| ID | Severity | Attack | Exploitability | Chain |
|---|---|---|---|---|
| BW-IDENT-001 | HIGH | Bootstrap ownership bypass via direct adapter call | MEDIUM — requires direct API call from component; DB RPC may block | Single-step |
| BW-IDENT-002 | HIGH | Null userId skips cross-user ownership guard | LOW-MEDIUM — requires null engineMeta.userId race | Multi-step |
| BW-IDENT-003 | MEDIUM | No actor-kind gate enforcement at controller level for consumer surfaces | LOW — selector-only guards | Single-step |
| BW-IDENT-004 | MEDIUM | refreshActorDirectory accepts arbitrary actorId without ownership check | LOW — no data disclosure, directory integrity only | Single-step |
| BW-IDENT-005 | LOW | Null actorId TypeError in switchActorController (non-fatal) | LOW — no security consequence | Single-step |
| BW-IDENT-006 | HIGH | Self-heal replay path for revoked users (VEN-IDENTITY-002 cross-confirmed) | MEDIUM — depends on RPC enforcement | Multi-step |
| BW-IDENT-007 | LOW | Arbitrary actorId passed to refreshVcActorDirectory via useIdentityOps adapter | LOW — integrity only, no disclosure | Single-step |
| BW-IDENT-008 | INFO | No raw UUID exposure in public URL surfaces | N/A — BLOCKED | N/A |
| BW-IDENT-009 | HIGH | BEHAVIOR.md is PLACEHOLDER — zero invariants anchored (MISSING_BEHAVIOR_CONTRACT) | N/A — governance | N/A |

---

## 8. Source Verification Summary

All findings sourced from direct file reads. BYPASSED findings have source citations:

| Finding | File | Line(s) | Verification |
|---|---|---|---|
| BW-IDENT-001 | apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js | 31-37 | SOURCE_VERIFIED |
| BW-IDENT-001 | apps/VCSM/src/features/identity/adapters/identityOps.adapter.js | 1 | SOURCE_VERIFIED |
| BW-IDENT-002 | apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js | 151-160 | SOURCE_VERIFIED |
| BW-IDENT-003 | apps/VCSM/src/state/identity/identitySelectors.js | 9-12 | SOURCE_VERIFIED |
| BW-IDENT-004 | apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js | 21-53 | SOURCE_VERIFIED |
| BW-IDENT-005 | apps/VCSM/src/state/identity/controller/switchActor.controller.js | 44 | SOURCE_VERIFIED |
| BW-IDENT-006 | apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js | 89-123 | SOURCE_VERIFIED |
| BW-IDENT-006 | engines/identity/src/controller/resolveAuthenticatedContext.controller.js | 137-142 | SOURCE_VERIFIED |
| BW-IDENT-007 | apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js | 59-61 | SOURCE_VERIFIED |
| BW-IDENT-009 | ZZnotforproduction/APPS/VCSM/features/identity/BEHAVIOR.md | 1-9 | SOURCE_VERIFIED |

---

## 9. Confidence Summary

| Finding | Confidence | Basis |
|---|---|---|
| BW-IDENT-001 | MEDIUM | Source confirmed; DB RPC body not reviewable from source |
| BW-IDENT-002 | HIGH | Source confirmed; conditional null bypass fully traced |
| BW-IDENT-003 | MEDIUM | Source confirmed; consumer enforcement not fully traced |
| BW-IDENT-004 | HIGH | Source confirmed; no ownership guard present |
| BW-IDENT-005 | HIGH | Source confirmed; TypeError path is deterministic |
| BW-IDENT-006 | MEDIUM | Source chain confirmed; DB RPC body not reviewable |
| BW-IDENT-007 | HIGH | Source confirmed; no guard at adapter layer |
| BW-IDENT-008 | HIGH | Source confirmed; no UUID in URL surfaces |
| BW-IDENT-009 | HIGH | BEHAVIOR.md read directly; PLACEHOLDER status confirmed |

---

## 10. §9 Invariant Attack Map

| Inferred Invariant | Attack Designed | Result |
|---|---|---|
| I-1: Actor never committed for different user | Race + null engineMeta.userId | BYPASSED (conditional) — source: useIdentityResolutionEffect.hook.js:151-160 |
| I-2: Revoked user cannot re-provision | Self-heal replay | PARTIAL — DB RPC dependent |
| I-3: Actor switch only for owned actors | Cross-account switch attempt | BLOCKED — source: switchActor.controller.js:84, switchActiveActor.controller.js:31 |
| I-4: profileId/vportId not in public surface | Trace toPublicIdentity | BLOCKED — source: identity.model.js:1-8 |

Note: All invariants are INFERRED because BEHAVIOR.md is PLACEHOLDER. Any §9 invariant attack map against this feature is operating without formal invariant anchoring. This is itself a THOR BLOCKER per VEN-IDENTITY-001.

---

## 11. Behavior Contract Attack Summary

| §4 Failure Path | Found in Source | Comment |
|---|---|---|
| N/A — §4 not defined in BEHAVIOR.md | — | BEHAVIOR.md is PLACEHOLDER |

| §9 Must Never Happen | Source-Inferred Equivalent | Result |
|---|---|---|
| N/A — §9 not defined in BEHAVIOR.md | See Invariant Attack Map above | 1 BYPASSED (conditional), 1 PARTIAL, 2 BLOCKED |

**CRITICAL:** The absence of a BEHAVIOR.md contract means all adversarial findings are anchored to source-inferred rules only. The platform architecture rules (CLAUDE.md: "Ownership is verified through actor_owners only") provide secondary anchoring.

---

## 12. THOR Impact

| Finding | THOR Impact | Reason |
|---|---|---|
| BW-IDENT-001 (HIGH) | RELEASE BLOCKER | Direct adapter exposure of bootstrap without ownership pre-check; DB RPC enforcement unverifiable from source |
| BW-IDENT-002 (HIGH) | RELEASE BLOCKER | Null userId skips cross-user ownership guard — conditional cross-session identity commit possible |
| BW-IDENT-006 (HIGH) | RELEASE BLOCKER | Self-heal replay path cross-confirms VEN-IDENTITY-002; revoked user re-provisioning chain unresolved |
| BW-IDENT-009 (HIGH) | RELEASE BLOCKER | BEHAVIOR.md is PLACEHOLDER — already a THOR BLOCKER per VEN-IDENTITY-001 |
| BW-IDENT-003 (MEDIUM) | NON-BLOCKING | No controller-level kind gate; selector-only guards |
| BW-IDENT-004 (MEDIUM) | NON-BLOCKING | refreshActorDirectory integrity issue; no data disclosure |
| BW-IDENT-005 (LOW) | NON-BLOCKING | Non-fatal TypeError; no security consequence |
| BW-IDENT-007 (LOW) | NON-BLOCKING | Adapter-level actor refresh without ownership check; integrity only |

**Total THOR Release Blockers from BW pass:** 4 (BW-IDENT-001, BW-IDENT-002, BW-IDENT-006, BW-IDENT-009)
**Previously existing THOR blockers (VEN):** VEN-IDENTITY-001, VEN-IDENTITY-002

---

## 13. SPIDER-MAN Test Requirements

The following regression tests are required to close the THOR-blocking findings:

| Test | Finding | Description |
|---|---|---|
| identity.bootstrap.ownership.test | BW-IDENT-001 | Assert provision_vcsm_identity RPC rejects when p_actor_id is not owned by p_user_id (requires DB-level test or mocked RPC rejection) |
| identity.session.userId-null-guard.test | BW-IDENT-002 | Assert that commitIdentity is never called when _engineMeta.userId is null, regardless of sessionUserId match |
| identity.selfheal.revoked-access.test | BW-IDENT-006 | Assert bootstrap self-heal does NOT succeed for a user with access status='revoked' |
| identity.behavior-contract.invariant.test | BW-IDENT-009 | Placeholder — requires BEHAVIOR.md to be written before tests can be anchored to §9 invariants |
| identity.switch.cross-account.test | BW-IDENT-003 | Assert switchActorController rejects actorIds not in availableActors (regression guard) |
| identity.refresh.ownership.test | BW-IDENT-007 | Assert refreshActorDirectoryRow rejects or logs when actorId is not owned by caller |

---

*Report complete. BW V2 pass: 2026-06-04. 9 findings total: 0 CRITICAL, 4 HIGH, 2 MEDIUM, 2 LOW, 1 INFO.*
