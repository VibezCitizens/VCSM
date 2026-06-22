# BLACKWIDOW V2 Adversarial Review — state
## Feature: state | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| BW Version | BW2.5 V2 |
| Feature | state |
| App | VCSM |
| Reviewer | BLACKWIDOW V2 |
| Date | 2026-06-04 |
| Scanner Preflight | FRESH — 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Behavior Contract Status | PLACEHOLDER — all §9 invariants UNANCHORED |
| VENOM Open Findings | 9 (VEN-STATE-001 through VEN-STATE-009) |
| ELEKTRA Last Run | NEVER |

---

## 2. Scanner Preflight

- Scanner version: 1.1.0
- Maps generated: 2026-06-04T19:48:25.152Z (FRESH — ~7h old at time of run)
- Security paths attributed to `state` in scanner: **0** (feature has no security-path entries)
- Total platform security paths: 598
- Callgraph nodes in feature: **69**
- Callgraph edges in/out: **178**
- Write execution paths: **0** (no write DAL surfaces in state module — read-only DAL + engine writes)
- RPC execution paths: **0**

---

## 3. Scanner Inputs

| Map | Source | Status |
|---|---|---|
| security-path-map.json | apps/scanner/maps/ | FRESH |
| callgraph.json | apps/scanner/maps/ | FRESH |
| write-execution-map.json | apps/scanner/maps/ | FRESH |
| rpc-execution-map.json | apps/scanner/maps/ | FRESH |

Scanner returned 0 security paths attributed to this feature. All attack surface reconstruction was performed via source-code induction from callgraph nodes and direct file reads.

---

## 4. Attack Surface Inventory

### 4.1 Source Files Surveyed

| File | Layer | Purpose |
|---|---|---|
| `state/identity/controller/switchActor.controller.js` | controller | Actor switch orchestration |
| `state/identity/identity.controller.js` | module | Identity load/hydrate, self-heal |
| `state/identity/identityContext.jsx` | module | React context, switchActor, blocked-VPORT guard |
| `state/identity/identity.model.js` | model | toPublicIdentity, isBlockedVportIdentity, mapProfileActor, mapVportActor |
| `state/identity/identity.read.dal.js` | dal | Read-only DAL for actors, profiles, realms |
| `state/identity/identitySelfHeal.controller.js` | module | Self-heal bootstrap, finalize |
| `state/identity/identityResolutionSelfHeal.helper.js` | module | Self-heal finalize helper |
| `state/identity/useIdentityResolutionEffect.hook.js` | hook | Main resolution effect |
| `state/identity/useIdentitySync.js` | hook | localStorage sync on identity change |
| `state/identity/identityStorage.js` | module | localStorage read/write with scoped keys |
| `state/identity/identitySelectors.js` | module | Derived selectors (canCitizenBook, getProfilePath) |
| `state/identity/identitySelection.store.js` | module | Zustand store for active actor |
| `state/identity/identitySwitcher.jsx` | module | UI switcher component |
| `state/identity/queries/identityEngineQuery.js` | module | React Query wrapper, staleTime:120s |
| `state/identity/IdentityDebugger.jsx` | module | DEV-gated debug panel |
| `state/identity/identity.controller.inflight.js` | module | In-flight dedup map |
| `state/actors/assertActorId.js` | module | Runtime type assertion |
| `state/actors/actorStore.js` | barrel | Re-export from hydration |
| `state/actors/hydrateActors.js` | barrel | Re-export from hydration |
| `state/actors/useActorSummary.js` | barrel | Re-export from hydration |
| `state/actors/profileGateStore.js` | module | Invalidation signal store |
| `state/social/followRequestsStore.js` | module | Follow requests invalidation store |
| `engines/identity/src/controller/switchActiveActor.controller.js` | engine | Server-side ownership enforcement |
| `engines/identity/src/dal/actorLinks.write.dal.js` | engine DAL | platform.user_app_preferences write |

### 4.2 Entry Points (Hook/Controller Layer)

| Entry Point | Path | Exposure |
|---|---|---|
| `switchActor()` | `identityContext.jsx:68` | UI-accessible via context |
| `refreshAvailableActors()` | `identityContext.jsx:138` | UI-accessible via context |
| `useIdentityResolutionEffect` | `useIdentityResolutionEffect.hook.js:23` | Auto-fires on auth change |
| `useIdentitySync` | `useIdentitySync.js:8` | Auto-fires on identity change |
| `IdentitySwitcher` | `identitySwitcher.jsx:6` | Direct UI surface |

### 4.3 DAL Write Surfaces

| DAL | Table | Write Operation |
|---|---|---|
| `dalSetActiveActorLink` (engine) | `platform.user_app_preferences` | UPDATE active_actor_link_id |
| `dalSetActiveActorLink` (engine) | `platform.user_app_preferences` | UPDATE last_actor_link_id |
| `engineSwitchActiveActor` (engine, via finalizeSelfHeal) | `platform.user_app_preferences` | UPDATE active actor on self-heal |

All writes are in the engine layer (`engines/identity/`), not in the VCSM state module. The VCSM state module is read-oriented with localStorage as the only direct client-side write surface.

### 4.4 Scanner Signal Classification

- **HIGH confidence paths**: 0 (no scanner paths attributed)
- **LOW confidence paths**: 0
- **Source-inferred attack surfaces**: 5 (switchActor, refreshAvailableActors, identityResolutionEffect, useIdentitySync, IdentitySwitcher)

All attack surfaces reconstructed from direct source inspection. Scanner had no resolved entries for this feature.

---

## 5. Scanner Signals

```
NODES:  69
EDGES:  178
BY_LAYER: { barrel: 4, controller: 1, dal: 10, hook: 3, model: 5, module: 46 }
SECURITY_PATHS_ATTRIBUTED: 0
WRITE_PATHS: 0
RPC_PATHS: 0
```

The state module is anomalously absent from the security path scanner. As the platform's most critical security module (identity resolution, actor switching), this absence is itself a governance finding (see BW-STATE-001).

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**Attack**: Can an actor submit a mutation targeting another actor's resource ID?

**Source path traced**:
- `identityContext.jsx:68` switchActor(actorId) → `switchActorController({actorId, ctx})`
- `switchActor.controller.js:84` `ctx.availableActors.find((a) => a.actorId === actorId)` — if not found, returns `SWITCH_ABORT_LINK_NOT_FOUND`
- `switchActor.controller.js:127` `engineSwitchActiveActor({ userAppAccountId, actorLinkId: link.id })` → engine validates ownership
- `engines/identity/src/controller/switchActiveActor.controller.js:31` `if (row.user_app_account_id !== userAppAccountId) throw ACTOR_LINK_FORBIDDEN`

**Result**: **BLOCKED** — Double-layered. App layer validates actorId is in server-resolved `availableActors`. Engine layer enforces ownership via DB read (live, not cached). Both must pass.

**Provenance**: [SOURCE_VERIFIED] `switchActor.controller.js:84,127` and `engines/identity/.../switchActiveActor.controller.js:31-33`

---

### B. SESSION MUTATION (§5.2)

**Attack B1**: Is `viewerActorId` taken from session (trusted) or client payload?

**Source path traced**:
- `identityContext.jsx:72` `ctx = engineQuery.data ?? getIdentityEngineContext(identityDetails)`
- `identityEngineQuery.js:26` `resolveAuthenticatedContext({ appKey: "vcsm", ... })` — server call, session-bound
- `identity.controller.js:237-244` `_engineMeta` is set from engine response (server-sourced)
- `identity.model.js:11-24` `getIdentityEngineContext` reads `_engineMeta` from current identityDetails — server-set

**Result**: **BLOCKED** — All actor context is server-sourced. Client payload cannot inject a fake `actorId` into the switch path because `availableActors` is always resolved from an authenticated server context.

**Attack B2**: Can a stale or null `viewerActorId` bypass controller gates?

- If `user` is null: `identityDetails` is null (useEffect on `user?.id` clears it at line 112), `getIdentityEngineContext(null)` returns null, ctx is null → `SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT`
- If `identityDetails._engineMeta` is missing: `getIdentityEngineContext` returns null → same abort

**Result**: **BLOCKED**

**Provenance**: [SOURCE_VERIFIED] `identityContext.jsx:72`, `identity.controller.js:237-244`, `switchActor.controller.js:48-64`

---

### C. RUNTIME ABUSE (§5.3)

**Attack**: Can a non-owner actor type reach owner-only paths?

**Primary path**: `IdentitySwitcher.jsx:43-46` renders switch buttons for all owned actors. Each calls `switchActor(row.actor_id, 'IdentitySwitcher')`. The actor list comes from `loadOwnedActorChoices(user.id)` which calls `resolveAuthenticatedContext` — session-bound.

**`isSwitchable` enforcement gap** [SOURCE_VERIFIED]:
- `switchActor.controller.js:76` logs `isSwitchable` but does NOT block on it
- `switchActor.controller.js:118` logs `isSwitchable` in link match event — still no gate
- The engine (`switchActiveActor.controller.js:39-41`) DOES enforce it: throws `ACTOR_NOT_SWITCHABLE`
- App layer provides no pre-flight rejection; the engine catches it as an error in the `try/catch` at `switchActor.controller.js:126-143`
- The switch returns `{ success: false, code: "SWITCH_ABORT_PLATFORM_WRITE_FAILED" }` — correct behavior but no specific `ACTOR_NOT_SWITCHABLE` signal propagated to the UI

**Result**: **PARTIAL** — Enforcement is correct but defense-in-depth is incomplete. App layer should enforce `isSwitchable` pre-flight to avoid unnecessary engine write attempts and to return a typed error to callers.

**Finding**: BW-STATE-003

**Provenance**: [SOURCE_VERIFIED] `switchActor.controller.js:76,118` (no gate) and `engines/identity/.../switchActiveActor.controller.js:39-41` (enforced at engine)

---

### D. RLS VERIFICATION (§5.4)

**DAL write surfaces** (engine layer only):
- `dalSetActiveActorLink` (engine): `UPDATE platform.user_app_preferences WHERE user_app_account_id = :userAppAccountId`
  - Scoped by `userAppAccountId` in both the WHERE clause and the ownership check at `switchActiveActor.controller.js:31`
  - RLS on `platform.user_app_preferences`: INSERT is blocked (no INSERT policy), only SELECT and UPDATE are permitted — confirmed by `actorLinks.write.dal.js:14-16` comment

**Read DAL surfaces** (VCSM state module):
- `readIdentityActorByIdDAL` / `readIdentityActorsByIdsDAL`: reads `vc.actors` — subject to `can_view_actor` RLS
- `readActorPrivacyDAL` / `readActorPrivacyDiagnosticDAL`: reads `vc.actor_privacy_settings`
- `readProfileIdentityDAL`: reads `auth.profiles` (public schema supabase client)
- `readVportIdentityDAL`: reads `vport.profiles` — VEN-STATE-008 confirms `owner_user_id` fetched unnecessarily
- `readActorOwnerUserDAL`: reads `vc.actor_owners` — returns only `user_id`
- `readUserActorByProfileIdDAL`: reads `vc.actors` WHERE `profile_id = profileId` — used in self-heal

**Result**: **PARTIAL** — Write surface is clean. Read surfaces depend on DB-level RLS (not independently verified in this review). VEN-STATE-008 (data minimization on `owner_user_id`) is an open concern but not a bypass.

**Provenance**: [SOURCE_VERIFIED] `actorLinks.write.dal.js:21-34`, `switchActiveActor.controller.js:31-33`, `identity.read.dal.js` full file

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**Attack**: What happens if null/undefined `viewerActorId` is passed to each controller?

**switchActorController**:
- `switchActor.controller.js:44` `actorId.slice(0, 8)` — if actorId is null, this throws TypeError
- `identityContext.jsx:69` pre-checks `if (!actorId) return { success: false, code: "NO_ACTOR_ID" }` — null is caught at the call site BEFORE the controller is invoked

**loadDefaultIdentityForUser**:
- `identity.controller.js:88` `_identityInflight.get(`${userId}:${resolveAttempt}`)` — null userId produces key `null:initial`
- `identity.controller.js:110-115` `resolveAuthenticatedContext` called — server validates session, ignores the userId parameter (session-bound)
- In practice userId is always user?.id from auth state

**findSelfHealActorForUser**:
- `identitySelfHeal.controller.js:9` `readUserActorByProfileIdDAL(userId)` — passes userId as `profile_id` (VEN-STATE-003: this is semantically wrong but not exploitable without a matching row)
- Called only after `user?.id` is confirmed non-null in the hook

**Result**: **BLOCKED** at call sites — null actorId is blocked at identityContext before reaching controller.

**Provenance**: [SOURCE_VERIFIED] `identityContext.jsx:69`, `switchActor.controller.js:44`

---

### F. MUTATION REPLAY (§5.6)

**Attack**: Can a completed actor switch be re-triggered for a revoked actor?

**Scenario**: Actor link revoked between `availableActors` cache population (t=0) and `engineSwitchActiveActor` call (t=staleTime).

- The React Query engine cache has `staleTime: 120_000` — up to 2 minutes stale
- If an actor link is revoked during this window, the cached `availableActors` may still contain it
- `switchActorController:84` finds the actor in the stale cache and calls the engine
- `engines/identity/.../switchActiveActor.controller.js:25` `dalGetActorLinkById({ actorLinkId })` — **live DB read** (no cache)
- `switchActiveActor.controller.js:35-37` checks `row.status !== 'active'` → throws `ACTOR_LINK_INACTIVE`

**Result**: **BLOCKED** — The engine performs a live DB read for the actor link, bypassing the stale app-layer cache. A revoked actor cannot be switched to even within the stale window.

**Provenance**: [SOURCE_VERIFIED] `engines/identity/.../switchActiveActor.controller.js:25,35-37`, `identityEngineQuery.js:29` (staleTime)

---

### G. HYDRATION POISONING (§5.7)

**Attack**: Can actor summaries be poisoned or served stale?

**commitIdentity path**: `identityContext.jsx:46-59` calls `useActorStore.getState().upsertActors([...])` with fields derived from `identityDetails` (server-sourced via hydration engine). No client-injectable path to this upsert exists in the state module.

**setIdentity context method**: Exposed as `setIdentity: setIdentityCompat` in context value (line 166). Consumers in `useProfileController.js:86` and `useProfileUploads.js:56,86,124,159` call it with `prev => ({ ...prev, avatar: ..., banner: ... })` — patching URL fields only, never mutating `actorId`, `kind`, `_engineMeta`, or `availableActors`. These patches are post-upload confirmed URLs, not arbitrary client data.

**_engineMeta mutation**: No code path mutates `_engineMeta` after initial assignment in `identity.controller.js:237`. The `setIdentityCompat` functional updater spreads `prev` but consumers only set `avatar`/`banner` fields.

**Result**: **BLOCKED** — Actor store writes are server-sourced. setIdentity calls from feature hooks cannot corrupt identity security fields.

**Provenance**: [SOURCE_VERIFIED] `identityContext.jsx:46-59,63-66`, `useProfileController.js:86-90`, `useProfileUploads.js:56,86`

---

### H. URL SURFACE (§5.9)

**Attack**: Do notification linkPaths, share links, or deep links expose raw UUIDs?

**Checked**:
- `identitySelectors.js:26-27` `getProfilePath()` returns `/profile/self` — no UUID
- No notification construction found in the state module
- No share link construction in the state module
- `localStorage` key: `vc.identity.actorId.<userId>` — scoped by userId, not exposed in URLs

**Result**: **BLOCKED** — The state module does not construct any public URLs.

**Provenance**: [SOURCE_VERIFIED] `identitySelectors.js:26-27`

---

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

BEHAVIOR.md is PLACEHOLDER. §9 invariants are **UNANCHORED**. The following invariants were inferred from source code and attacked:

#### Inferred Invariant 1: Active identity must belong to the authenticated user

**Attack**: Craft a `nextIdentity` with `_engineMeta.userId` ≠ `user.id` to inject a cross-user actor.

**Source path**: `useIdentityResolutionEffect.hook.js:152-160`
```js
const identityUserId = nextIdentity._engineMeta?.userId ?? null;
if (identityUserId && identityUserId !== user.id) {
  // BLOCKS commit — returns null
  commitIdentity(null);
  setLoading(false);
  return;
}
```

**Result**: **BLOCKED** — Mismatch detected, null identity committed.

**Bypass gap identified**: The condition uses `identityUserId &&` — if `_engineMeta.userId` is null, the check is skipped. When does this happen? `loadIdentityForActorId` (called in `switchActorController:151`) calls `hydrateActor` directly without setting `_engineMeta`, so the switch result has no `_engineMeta`. However, this result is committed via `commitIdentity(result.nextIdentity)` in `identityContext.jsx:91` — **bypassing the ownership check in the hook**. The hook's ownership check only runs on the resolution effect path, not on the switch path.

**Is this exploitable?** The switch path has its own ownership validation (availableActors + engine). The hook's ownership check is specifically for the resolution path. The separate validations are intentional by design, not a bypass. No exploit chain identified.

**Provenance**: [SOURCE_VERIFIED] `useIdentityResolutionEffect.hook.js:152-160`, `identityContext.jsx:91`

---

#### Inferred Invariant 2: Blocked/deleted VPORT must not persist as active identity

**Attack**: Trigger a scenario where a blocked VPORT stays active by exhausting the auto-switch mechanism.

**Source path**:
```
identityContext.jsx:149-157
blockedVport = isBlockedVportIdentity(identityDetails)  // kind='vport' && (isDeleted||isVoid||isActive===false)
useEffect(() => {
  if (!blockedVport) return;
  const citizenActor = availableActors.find((a) => a.actorKind === "user");
  if (!citizenActor?.actorId) return;  // SILENT NO-OP IF NO USER ACTOR
  switchActor(citizenActor.actorId, "blocked_vport_auto_switch").catch(() => {});
}, [blockedVport]);
```

**Attack vector**: User account has ONLY a VPORT actor (no user/citizen actor). The blocked VPORT resolves as the active identity. `availableActors.find(a => a.actorKind === 'user')` returns undefined. The auto-switch is a silent no-op. The blocked VPORT identity persists.

**Result**: **BYPASSED (PARTIAL)** — The no-op produces the `blockedVport = true` state which IS propagated to route guards (`appRoutes.redirects.jsx:40`): `if (blockedVport) return <Navigate to="/vport/restore" replace />`. The user is redirected to `/vport/restore` which has its own recovery flow. The invariant that "blocked VPORT must not persist" is partially enforced by the route redirect, but the auto-switch mechanism itself fails silently.

**This is VEN-STATE-007 — CONFIRMED.**

**Provenance**: [SOURCE_VERIFIED] `identityContext.jsx:153-156`, `appRoutes.redirects.jsx:40`

---

#### Inferred Invariant 3: Deleted account must trigger logout, not self-heal

**Attack**: Inject a DELETED_ACCOUNT_SENTINEL through the resolution path to see if it can be bypassed or replayed.

**Source path**: `useIdentityResolutionEffect.hook.js:65-75`
```js
if (nextIdentity === DELETED_ACCOUNT_SENTINEL) {
  commitIdentity(null);
  setLoading(false);
  await logout({ accountDeleted: true });
  return;
}
```
`DELETED_ACCOUNT_SENTINEL` is a frozen singleton object (`Object.freeze({ __accountDeleted: true })`). Strict equality check means it cannot be spoofed by a lookalike object. Logout triggers `clearAllIdentityStorage()` and Supabase session invalidation.

**Result**: **BLOCKED**

**Provenance**: [SOURCE_VERIFIED] `identity.controller.js:24`, `useIdentityResolutionEffect.hook.js:65-75`

---

#### Inferred Invariant 4: Identity must never contain raw UUID in public URL surface

**Attack**: Check all URL construction paths in state module.

**Result**: **BLOCKED** — `getProfilePath` returns `/profile/self`. No other URL construction exists.

**Provenance**: [SOURCE_VERIFIED] `identitySelectors.js:26-27`

---

#### Additional Attack: localStorage Key Namespace Collision

**Attack**: Trigger `saveIdentity(actorId, undefined)` to write to unscoped global key, then read as a different user.

**Source path**:
- `identityStorage.js:6` `if (!userId) return KEY_PREFIX` (returns `'vc.identity.actorId'`)
- `identityContext.jsx:90` `saveIdentity(actorId, user?.id)` — user could theoretically be null in race
- However: `identityContext.jsx:69` guards `switchActor` with `if (!actorId) return`, but no user guard
- The engine ctx validation at `switchActorController:48` requires `ctx?.userAppAccountId` — if user is null, engineQuery.data is empty (query disabled for null userId, line 28 of identityEngineQuery.js), and `getIdentityEngineContext(null)` returns null → ctx is null → abort

**Result**: **BLOCKED** — The switch abort fires before `saveIdentity` is reached at line 90. The unscoped key race cannot be triggered because the controller aborts when ctx is null.

**Provenance**: [SOURCE_VERIFIED] `identityStorage.js:6`, `identityContext.jsx:69,90`, `switchActorController:48-64`

---

## 7. Exploitability Assessment

| Finding | Severity | Exploitability | Notes |
|---|---|---|---|
| BW-STATE-001 | HIGH | N/A | Governance: module absent from security scanner |
| BW-STATE-002 | HIGH | N/A | Governance: BEHAVIOR.md is PLACEHOLDER |
| BW-STATE-003 | MEDIUM | Low | `isSwitchable` not enforced at app layer; engine catches it |
| BW-STATE-004 | LOW | Very Low | `switchActor` has no null-user guard; blocked in practice by ctx abort |
| BW-STATE-005 | INFO | None | VEN-STATE-007 auto-switch no-op confirmed; route redirect mitigates |

No CRITICAL or confirmed BYPASSED exploit chains were identified. All high-priority attack vectors are blocked at either the app layer or the engine layer.

---

## 8. Source Verification Summary

All findings are [SOURCE_VERIFIED] — no finding relies solely on scanner signals.

| Finding | Primary Source | Line(s) |
|---|---|---|
| BW-STATE-001 | scanner/maps/security-path-map.json | No entries for feature |
| BW-STATE-002 | BEHAVIOR.md | Status: PLACEHOLDER |
| BW-STATE-003 | switchActor.controller.js | 76, 118 (no gate); engine:39-41 (enforced) |
| BW-STATE-004 | identityContext.jsx | 68-69, 90; identityStorage.js:6 |
| BW-STATE-005 | identityContext.jsx | 153-156; appRoutes.redirects.jsx:40 |

---

## 9. Confidence Summary

| Attack Category | Verdict | Confidence |
|---|---|---|
| A. Ownership Bypass | BLOCKED | HIGH — double-layered validation traced to engine |
| B. Session Mutation | BLOCKED | HIGH — all actorIds are server-sourced |
| C. Runtime Abuse (isSwitchable) | PARTIAL | HIGH — app skips, engine enforces |
| D. RLS Verification | PARTIAL | MEDIUM — engine write is clean; read RLS assumed (not DB-verified here) |
| E. Viewer Context Fuzzing | BLOCKED | HIGH — null actorId caught at call site |
| F. Mutation Replay | BLOCKED | HIGH — engine does live DB read |
| G. Hydration Poisoning | BLOCKED | HIGH — no client-injectable path to actor store |
| H. URL Surface | BLOCKED | HIGH — no UUID in URLs from state module |
| I. §9 Invariant 1 (user ownership) | BLOCKED | HIGH |
| I. §9 Invariant 2 (blocked VPORT) | PARTIAL | HIGH — VEN-STATE-007 confirmed, route redirect mitigates |
| I. §9 Invariant 3 (deleted account) | BLOCKED | HIGH — frozen sentinel, logout triggered |
| I. §9 Invariant 4 (URL surface) | BLOCKED | HIGH |

---

## 10. §9 Invariant Attack Map

| Inferred Invariant | Attack Designed | Result | Coverage |
|---|---|---|---|
| Identity belongs to authenticated user | Cross-user _engineMeta injection | BLOCKED | SOURCE_VERIFIED |
| Blocked VPORT auto-switch | No-user-actor scenario | PARTIAL (no-op mitigated by route redirect) | SOURCE_VERIFIED |
| Deleted account triggers logout, not self-heal | DELETED_ACCOUNT_SENTINEL bypass | BLOCKED | SOURCE_VERIFIED |
| No UUID in public URLs | URL surface scan | BLOCKED | SOURCE_VERIFIED |
| isSwitchable enforced before engine write | Skip app check, attempt non-switchable switch | PARTIAL | SOURCE_VERIFIED |
| localStorage key isolation per user | Null-userId race condition | BLOCKED | SOURCE_VERIFIED |

Note: All invariants are source-inferred because BEHAVIOR.md is PLACEHOLDER. No formal §9 section exists to attack. All invariants are UNANCHORED pending a real behavior contract.

---

## 11. Behavior Contract Attack Summary

- **BEHAVIOR.md status**: PLACEHOLDER
- **§4 Failure Paths extracted**: None — not defined
- **§9 Must Never Happen extracted**: None — not defined
- **Impact**: Zero formal invariants to anchor attacks against. All attacks were designed against source-inferred invariants. The identity module is the most security-sensitive module on the platform; an unanchored behavior contract leaves future reviewers and developers without a safety net.
- **Finding**: BW-STATE-002 (HIGH) — BEHAVIOR.md is PLACEHOLDER for the platform's identity module

---

## 12. THOR Impact

| Finding | Severity | THOR Blocker? | Notes |
|---|---|---|---|
| BW-STATE-001 | HIGH | YES | Security scanner has no coverage of the identity state module |
| BW-STATE-002 | HIGH | YES | BEHAVIOR.md is PLACEHOLDER — invariants unanchored for most critical module |
| BW-STATE-003 | MEDIUM | NO | Defense-in-depth gap; engine enforces correctly |
| BW-STATE-004 | LOW | NO | No practical exploit path |
| BW-STATE-005 | INFO | NO | VEN-STATE-007 (existing VENOM finding) — confirmed, route redirect provides coverage |

**BLOCKED RELEASES**: BW-STATE-001 and BW-STATE-002 are THOR blockers.

The identity/state module represents the platform's most critical security boundary. Absence from the security scanner (BW-STATE-001) means this module will never appear in automated security path analysis. The PLACEHOLDER BEHAVIOR.md (BW-STATE-002) means no formal invariants exist to anchor regression testing or future security reviews.

---

## 13. SPIDER-MAN Test Requirements

The following tests are required to close the open findings:

### BW-STATE-001 (Scanner Coverage)
- Ensure security-path-map.json and callgraph.json correctly attribute `switchActor` and the resolution effect to the `state` feature
- Re-run scanner to confirm attribution

### BW-STATE-002 (Behavior Contract)
- Write BEHAVIOR.md §9 Must Never Happen section with at minimum:
  - Identity must belong to the authenticated user at commit time
  - Blocked/deleted VPORT must not persist as active identity (auto-switch or route redirect required)
  - Deleted account must trigger logout, not self-heal or retry
  - Actor switch must validate actor link is active and switchable
  - localStorage identity keys must be user-scoped

### BW-STATE-003 (isSwitchable Pre-flight)
- Test: attempt to call `switchActor` with a link where `isSwitchable = false`
  - Expected: should receive typed `ACTOR_NOT_SWITCHABLE` failure, not generic `SWITCH_ABORT_PLATFORM_WRITE_FAILED`
- Add pre-flight rejection in `switchActorController` for `!link.isSwitchable` to align with engine behavior

### BW-STATE-005 (Blocked VPORT No-Op)
- Test: actor with ONLY a blocked VPORT (no user actor) — assert identity never resolves to an operational state
- Test: blockedVport route redirect to `/vport/restore` fires correctly in this scenario
- Test: `/vport/restore` screen handles the no-citizen-actor case gracefully without infinite redirect

---

## Finding Registry

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-STATE-001 | HIGH | Identity state module absent from security path scanner — zero platform coverage for most critical module | UNRESOLVED | DRAFT |
| BW-STATE-002 | HIGH | BEHAVIOR.md is PLACEHOLDER — §9 invariants unanchored for platform's most critical security module | UNRESOLVED | DRAFT |
| BW-STATE-003 | MEDIUM | `isSwitchable` not enforced at app layer in `switchActorController` — relies solely on engine error propagation | PARTIAL | DRAFT |
| BW-STATE-004 | LOW | `switchActor` has no explicit null-user guard at entry — safe in practice because ctx abort fires first | BLOCKED | DRAFT |
| BW-STATE-005 | INFO | Blocked VPORT auto-switch silently no-ops when no user-kind actor exists — route redirect compensates (VEN-STATE-007 confirmed) | PARTIAL | DRAFT |

---

## Cross-Reference to Open VENOM Findings

| VENOM Finding | BW Attack Coverage | BW Result |
|---|---|---|
| VEN-STATE-001 | H (URL), G (hydration) | Not exploitable via BW attack surfaces |
| VEN-STATE-002 | B (session mutation) | BLOCKED — deprecated hooks don't accept client injection |
| VEN-STATE-003 | C (runtime abuse) | Self-heal uses userId as profileId — semantic error, not security bypass in practice |
| VEN-STATE-004 | I (§9 invariants) | Confirmed UNANCHORED |
| VEN-STATE-005 | Not in BW scope | DEV-gated, correct |
| VEN-STATE-006 | Not in BW scope | console.error without DEV gate |
| VEN-STATE-007 | I (invariant 2) | Confirmed — partial mitigation via route redirect |
| VEN-STATE-008 | D (RLS) | Data minimization — not a security bypass |
| VEN-STATE-009 | F (replay) | Engine live DB read mitigates stale cache |

---

*Report generated: 2026-06-04 | BLACKWIDOW V2 | BW2.5 | DRAFT governance status*
