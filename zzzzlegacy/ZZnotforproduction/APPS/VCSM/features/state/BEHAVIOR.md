---
name: vcsm.state.behavior
description: Feature-level behavior contract for the VCSM state feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P1
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — state
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The `state` module is the global runtime state layer for the VCSM application. It is the foundational boot-time path responsible for identity resolution, actor switching, realm resolution, and cross-feature signal stores (profile gate, follow requests).

**Core responsibilities (Evidence: ARCHITECTURE.md §PURPOSE):**
- Resolve the active identity for every authenticated user: session → engine → actor → hydration
- Bridge the shared `identity` and `hydration` engines to the VCSM domain
- Expose the public `useIdentity()` hook surface consumed app-wide
- Manage the DELETED_ACCOUNT_SENTINEL pattern to force logout of soft-deleted accounts
- Manage the isBlockedVportIdentity auto-switch guard for blocked/deleted/inactive VPORT actors

**Owner:** Platform infrastructure team. This module is a foundational runtime concern, not a product feature. It is consumed by every feature in the app via `IdentityProvider` (mounted at the app root) and via Zustand stores imported directly.
(Evidence: ARCHITECTURE.md §OWNERSHIP)

**Note:** No OWNERSHIP.md exists for this module. Owner is inferred from ARCHITECTURE.md only. IRONMAN handoff is recommended to formalize ownership.
(Evidence: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX — Owner defined: FAIL)

---

## §2 Entry Points

The following entry points are documented in governance artifacts:
(Evidence: ARCHITECTURE.md §ENTRY POINTS, BlackWidow output §4.2)

| Entry Point | Path | Exposure | Notes |
|---|---|---|---|
| `IdentityProvider` | `apps/VCSM/src/app` (root) | All authenticated content | Mounted at app root; wraps all authenticated content |
| `useIdentity()` | Public hook | Every authenticated feature | Primary public surface; returns `{ actorId, kind, ownerActorId }` only |
| `switchActor()` | `identityContext.jsx:68` | UI-accessible via context | Accepts `actorId` argument; blocked if actorId is falsy |
| `refreshAvailableActors()` | `identityContext.jsx:138` | UI-accessible via context | Forces re-resolution of available actor list |
| `useIdentityDetailsDeprecated()` | Legacy surface | Any component (deprecated) | Full identityDetails including PII — see §6, §9 |
| `useIdentityDisplayDeprecated()` | Legacy surface | Any component (deprecated) | Exposes lifecycle state (isDeleted, isVoid, isActive) — see §6, §9 |
| `useActorStore` (re-exported) | `state/actors/actorStore.js` | Cross-feature actor cache | Re-exports from `@hydration`; the actorStore.js file adds no logic |
| `useFollowRequestsStore` | Zustand store | Social feature | Signal store for follow request invalidation |
| `useProfileGateStore` | Zustand store | Profiles and social features | Signal store for profile gate invalidation |
| `useIdentitySelectionStore` | Zustand store | Active actor tracking | Zustand store for active actor preference |
| `useIdentityResolutionEffect` | Hook | Auto-fires on auth change | Main resolution loop |
| `useIdentitySync` | Hook | Auto-fires on identity change | localStorage sync on identity change |
| `IdentitySwitcher` | Dev-only UI component | Direct UI surface | Dev-only UI; not a production screen |

**Routes:** None. The state module has no navigable routes. It is a provider/store layer only.
(Evidence: INDEX.md §Routes, ARCHITECTURE.md §MODULE RUNTIME READINESS)

---

## §3 User Flows

### 3.1 Boot-time Identity Resolution (Happy Path)
**Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS, VENOM output §3 source inspection note**

1. `IdentityProvider` mounts at app root.
2. `useIdentityResolutionEffect` fires when `user.id` is available from `AuthProvider`.
3. In-flight dedup map (`_identityInflight`) prevents concurrent resolves for the same `userId:attempt` key.
4. `resolveAuthenticatedContext` (identity engine) is called to resolve session → app → access → account → actor links → active actor. This call is session-bound and server-sourced.
5. The resolved identity is committed via `commitIdentity()` to the React context.
6. Before commit, `_engineMeta.userId` is verified to match the current `user.id`. Mismatch causes `commitIdentity(null)` to be called instead.
7. If DELETED_ACCOUNT_SENTINEL is returned, see flow 3.3 (Deleted Account).
8. `hydrateActor` (hydration engine) is called to populate the actor cache (`useActorStore`).
9. `useIdentitySync` persists the `actorId` to localStorage with a user-scoped key.
10. All authenticated features receive identity via `useIdentity()`.

### 3.2 Actor Switch Flow
**Evidence: ARCHITECTURE.md §ENTRY POINTS, BlackWidow output §6.A, §6.B, §6.C**

1. A UI component (e.g., IdentitySwitcher) calls `switchActor(actorId, source)` from context.
2. Call site guard: if `actorId` is falsy, returns `{ success: false, code: "NO_ACTOR_ID" }` immediately.
3. Engine context (`ctx`) is retrieved from the React Query cache (`identityEngineQuery`). The query has `staleTime: 120_000` (2 minutes). See §6 VEN-STATE-009 for security implication.
4. If `ctx` is null (no session or missing `_engineMeta`), returns `SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT`.
5. `availableActors` is searched for the requested `actorId`. If not found, returns `SWITCH_ABORT_LINK_NOT_FOUND`.
6. `isSwitchable` flag is logged but NOT enforced as a pre-flight gate at the app layer. The engine enforces it. See §6 BW-STATE-003.
7. `engineSwitchActiveActor` is called with `{ userAppAccountId, actorLinkId }`. The engine performs a live DB read for the actor link — bypassing the stale app-layer cache.
8. Engine verifies `row.user_app_account_id === userAppAccountId` and `row.status === 'active'`. If either check fails, the switch is rejected.
9. On success, `commitIdentity(result.nextIdentity)` is called and `saveIdentity(actorId, user.id)` persists the preference to localStorage.

### 3.3 Deleted Account Flow (DELETED_ACCOUNT_SENTINEL)
**Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS, VENOM output §3, BlackWidow output §6.I Invariant 3, INDEX.md §Security-Sensitive Surfaces**

1. During resolution, `loadDefaultIdentityForUser` may return `DELETED_ACCOUNT_SENTINEL` — a frozen singleton object (`Object.freeze({ __accountDeleted: true })`).
2. `useIdentityResolutionEffect` detects this via strict equality check (spoofing a lookalike object is not possible).
3. `commitIdentity(null)` is called to clear the active identity.
4. `logout({ accountDeleted: true })` is called, clearing all identity storage and invalidating the Supabase session.
5. The user is logged out. No self-heal or retry loop is triggered.

### 3.4 Blocked VPORT Auto-Switch Flow
**Evidence: SECURITY.md VEN-STATE-007, BlackWidow output §6.I Invariant 2, BW-STATE-005**

1. `isBlockedVportIdentity` evaluates true when the active actor is `kind='vport'` AND is deleted, void, or inactive.
2. The auto-switch guard searches `availableActors` for an actor with `actorKind === 'user'`.
3. If a user-kind actor is found, `switchActor` is called automatically to evict the blocked VPORT.
4. If no user-kind actor is found, the guard silently no-ops. The blocked VPORT identity persists as the active identity. This is VEN-STATE-007 — a THOR blocker.
5. Partial mitigation: the `blockedVport` flag is propagated to route guards. `appRoutes.redirects.jsx:40` redirects blocked VPORT users to `/vport/restore`. The user is functionally redirected but the identity is not evicted at the state layer.

### 3.5 Self-Heal Flow
**Evidence: ARCHITECTURE.md §MODULE LAYER MAP, VENOM output VEN-STATE-003, BlackWidow output §6.E**

UNKNOWN — Full self-heal flow details are not formally documented in any governance artifact. The following is derivable from findings only:

- `identitySelfHeal.controller.js` handles boot self-heal when the user has no engine platform rows.
- `findSelfHealActorForUser(userId)` calls `readUserActorByProfileIdDAL(userId)` — this passes `userId` as `profileId`, which violates the actor_owners-as-authority contract. See §6 VEN-STATE-003.
- On successful self-heal, `finalizeSelfHealedIdentity` is called via `identityResolutionSelfHeal.helper.js`.
- The self-heal path writes to `platform.user_app_preferences` via the engine (not the app DAL).
- Self-heal is only triggered when `user?.id` is confirmed non-null.

Full self-heal trigger conditions and all failure modes are UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

### 3.6 Loading and Empty States
**Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS**

- `loading` and `authLoading` states are tracked in `IdentityProvider`.
- Consumers receive an `identityLoading` flag.
- Null identity is propagated correctly when resolution fails — the module never throws to callers; DAL errors are caught and null is returned.
- `DELETED_ACCOUNT_SENTINEL` triggers logout as described in 3.3.
- RLS PGRST116 errors are handled with specific hint logging (diagnostic path only).

---

## §4 Business Rules

**Rule BR-STATE-001:** `useIdentity()` public surface must expose only `{ actorId, kind, ownerActorId }` — no PII fields, no profileId, no vportId.
(Evidence: VENOM output VEN-STATE-001, ARCHITECTURE.md §MODULE DATA CONTRACT)

**Rule BR-STATE-002:** Actor ownership must be verified through `vc.actor_owners` — not through `profileId` lookup or any other proxy.
(Evidence: VENOM output VEN-STATE-003, ARCHITECTURE.md §MODULE DEPENDENCY GRAPH)

**Rule BR-STATE-003:** The state module is read-only. No INSERT, UPDATE, DELETE, or RPC mutations exist in the app-layer DAL. All writes go through the identity engine (`engines/identity/`).
(Evidence: ARCHITECTURE.md §MODULE DATA CONTRACT, INDEX.md §Write Surface Map)

**Rule BR-STATE-004:** `identityEngineQuery` staleTime is 120 seconds on the security-sensitive `availableActors` list. This is a known design tradeoff. The engine mitigates this with a live DB read on `engineSwitchActiveActor`. See §6 VEN-STATE-009.
(Evidence: VENOM output VEN-STATE-009, BlackWidow output §6.F)

**Rule BR-STATE-005:** Actor switch requires the target actor to appear in the server-resolved `availableActors` list. Actors not in this list cannot be switched to at the app layer.
(Evidence: BlackWidow output §6.A)

**Rule BR-STATE-006:** All `localStorage` identity keys are scoped by `userId` (`vc.identity.actorId.<userId>`). No cross-user persistence is possible.
(Evidence: BlackWidow output §6.H, §6.I localStorage collision attack)

**Rule BR-STATE-007:** The `IdentityDebugger.jsx` component is DEV-gated (Vite build-time dead code elimination removes it in production). It must only receive the public identity surface `{ actorId, kind }` — never `identityDetails`.
(Evidence: VENOM output VEN-STATE-005)

**Rule BR-STATE-008:** `actorStore.js` in the state module is a trivial re-export of `useActorStore` from `@hydration`. Canonical import should be from `@hydration` directly.
(Evidence: ARCHITECTURE.md §MODULE MISSING PIECES, §MODULE BOUNDARY WARNINGS)

**Rule BR-STATE-009:** System posts and VPORT-related realm resolution must use `resolvePublicRealmIdDAL()` — never the viewer session realmId. (Evidence: Platform memory — Void Realm System Post Exclusion Rule)

---

## §5 State Rules

The following state transitions are derivable from governance artifacts:

### Identity Resolution States
(Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS, VENOM output source inspection)

| State | Description | Transition To |
|---|---|---|
| `loading` | Identity resolution is in progress | `resolved` or `null` on completion |
| `authLoading` | Auth provider is still initializing | `loading` once auth resolves |
| `resolved` (active identity) | `_engineMeta.userId` matches `user.id`; actor is not deleted, void, or inactive VPORT | Active until session change or actor state change |
| `null` (no identity) | Resolution failed, user is null, or deleted sentinel was received | Re-triggers resolution on next auth event |
| `DELETED_ACCOUNT_SENTINEL` | Sentinel object returned when resolved actor is soft-deleted | Immediately triggers `commitIdentity(null)` + `logout()` |
| `blockedVport` | Active actor is a VPORT with `isDeleted || isVoid || isActive === false` | Auto-switch to user-kind actor (if available) or redirect to `/vport/restore` |

### Actor Switch States
(Evidence: BlackWidow output §6.A, §6.B, §6.C, VENOM output VEN-STATE-007)

| State | Description |
|---|---|
| `SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT` | Engine context is null; switch aborted |
| `SWITCH_ABORT_LINK_NOT_FOUND` | Requested actorId not found in `availableActors` |
| `SWITCH_ABORT_PLATFORM_WRITE_FAILED` | Engine write failed (includes `isSwitchable=false` cases from engine) |
| `NO_ACTOR_ID` | Falsy actorId passed to `switchActor` call site |
| `ACTOR_LINK_INACTIVE` | Engine live DB read found actor link is not active (bypasses stale app cache) |
| `ACTOR_LINK_FORBIDDEN` | Engine ownership check failed (`user_app_account_id` mismatch) |

### In-flight Dedup
The `_identityInflight` Map prevents concurrent identity resolves for the same `userId:attempt` key. The map is module-level (singleton) and clears correctly on app restart.
(Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS)

---

## §6 Security Constraints

Each VENOM and BlackWidow finding implies a standing security constraint. All findings are SOURCE_VERIFIED.

---

**CONSTRAINT-VEN-STATE-001:** PII fields (email, birthdate, age, sex, is_adult, discoverable, publish) must not appear in the public identity surface or any hook accessible to arbitrary UI components.
Evidence: VEN-STATE-001 — `mapProfileActor()` builds `identityDetails` with these fields; accessible via `useIdentityDetailsDeprecated()`. Severity: HIGH. Status: OPEN.

**CONSTRAINT-VEN-STATE-002:** Deprecated hooks `useIdentityDetailsDeprecated()` and `useIdentityDisplayDeprecated()` expose the full `identityDetails` object including lifecycle state (`isDeleted`, `isVoid`, `isActive`). These hooks must have a documented sunset timeline and must not be used in new components.
Evidence: VEN-STATE-002. Severity: MEDIUM. Status: OPEN — no sunset timeline exists.

**CONSTRAINT-VEN-STATE-003:** Self-heal actor lookup must use `vc.actor_owners` as the authority surface, not `profileId` as a proxy for `userId`. The current `findSelfHealActorForUser(userId)` passes `userId` as `profileId` — this violates the actor_owners-as-authority contract.
Evidence: VEN-STATE-003 — `identitySelfHeal.controller.js:9` uses `readUserActorByProfileIdDAL(userId)`. Severity: MEDIUM. Status: OPEN.

**CONSTRAINT-VEN-STATE-004:** A formal behavioral contract (BEHAVIOR.md) must exist for the state module before any release. This file was PLACEHOLDER at time of all security reviews.
Evidence: VEN-STATE-004. Severity: HIGH. Status: RESOLVING — this file is the resolution.

**CONSTRAINT-VEN-STATE-005:** `IdentityDebugger.jsx` must remain DEV-gated and must only receive the public identity surface. It must never receive `identityDetails`. It must be moved to a `debuggers/` directory (not inside the state source tree).
Evidence: VEN-STATE-005. Severity: LOW. Status: OPEN (hardening recommendation).

**CONSTRAINT-VEN-STATE-006:** `assertActorId()` must not emit `console.error` with actor values in production. An `IS_DEV` gate or throw-only pattern must be used instead.
Evidence: VEN-STATE-006 — `assertActorId.js:5` emits unguarded `console.error("ACTOR CONTRACT VIOLATION:", actor)`. Severity: LOW. Status: OPEN.

**CONSTRAINT-VEN-STATE-007:** When `isBlockedVportIdentity` is true and no user-kind actor exists in `availableActors`, the module must not silently no-op. It must force logout or redirect with a clear reason code. The current silent no-op is a VPORT lifecycle enforcement gap.
Evidence: VEN-STATE-007 — `identityContext.jsx:152-157`. Severity: HIGH. Status: OPEN. THOR BLOCKER.
Partial mitigation: route guard redirects to `/vport/restore`. Identity eviction at state layer is still missing.

**CONSTRAINT-VEN-STATE-008:** `readVportIdentityDAL()` must not fetch `owner_user_id` (auth UID) from `vport.profiles`. This field is not needed for identity resolution and violates data minimization. VPORT ownership is verified through `actor_owners`, not `owner_user_id`.
Evidence: VEN-STATE-008 — `identity.read.dal.js:123`. Severity: MEDIUM. Status: OPEN.

**CONSTRAINT-VEN-STATE-009:** The 2-minute `staleTime` on `identityEngineQuery` is a known security tradeoff. The engine's live DB read on `engineSwitchActiveActor` mitigates the risk of stale actor access in practice. This tradeoff must be documented and acknowledged. A shorter staleTime (30 seconds) is recommended.
Evidence: VEN-STATE-009 — `identityEngineQuery.js:29`. Severity: MEDIUM. Status: OPEN.

**CONSTRAINT-BW-STATE-001:** The state/identity module must be represented in the security path scanner. Its current absence from `security-path-map.json` means it will never appear in automated security path analysis.
Evidence: BW-STATE-001. Severity: HIGH. Status: OPEN. THOR BLOCKER.

**CONSTRAINT-BW-STATE-002:** See VEN-STATE-004. BEHAVIOR.md was PLACEHOLDER — §9 invariants were unanchored. This file resolves this constraint.
Evidence: BW-STATE-002. Severity: HIGH. Status: RESOLVING.

**CONSTRAINT-BW-STATE-003:** `switchActorController` must enforce `isSwitchable` as an app-layer pre-flight check, not rely solely on the engine error path. The current implementation logs but does not gate on `isSwitchable`.
Evidence: BW-STATE-003 — `switchActor.controller.js:76,118`. Severity: MEDIUM. Status: PARTIAL (engine enforces; app layer does not pre-flight).

---

## §7 Error Handling

The following error states are derivable from governance artifacts:

**Identity resolution failures:**
- DAL errors are caught and null is returned. The module never throws to callers.
- RLS PGRST116 (actor_privacy_settings missing) is handled with a specific logged diagnostic hint, not thrown.
- Null identity is propagated correctly to all consumers.
(Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS, INDEX.md §Security-Sensitive Surfaces)

**DELETED_ACCOUNT_SENTINEL:**
- Strict equality check detects the frozen sentinel. A lookalike object cannot spoof it.
- `commitIdentity(null)` + `logout({ accountDeleted: true })` is called immediately.
- No self-heal or retry is triggered.
(Evidence: BlackWidow output §6.I Invariant 3, INDEX.md §Security-Sensitive Surfaces)

**Actor switch abort codes:**
- `NO_ACTOR_ID` — falsy actorId at call site
- `SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT` — null engine context
- `SWITCH_ABORT_LINK_NOT_FOUND` — actorId not in availableActors
- `SWITCH_ABORT_PLATFORM_WRITE_FAILED` — engine write failure (includes isSwitchable=false, ACTOR_LINK_INACTIVE, ACTOR_LINK_FORBIDDEN)
(Evidence: BlackWidow output §6.A, §6.B, §6.E, §6.F)

**Loading states:**
- `identityLoading` flag exposed to consumers while resolution is in progress.
- `authLoading` tracks the auth provider initialization state.
(Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS)

**Specific engine error codes (engine layer, not app layer):**
- `ACTOR_NOT_SWITCHABLE` — isSwitchable=false (engine enforces; not currently surfaced with typed code to app layer — BW-STATE-003)
- `ACTOR_LINK_INACTIVE` — actor link status is not 'active' (live DB check at engine)
- `ACTOR_LINK_FORBIDDEN` — user_app_account_id ownership mismatch at engine
(Evidence: BlackWidow output §6.A, §6.C, §6.F)

**Full error handling details beyond the above are UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.**

---

## §8 Cross-Feature Dependencies

**Engine dependencies (approved boundaries):**
(Evidence: ARCHITECTURE.md §MODULE DEPENDENCY GRAPH)

| Dependency | Type | What Is Used |
|---|---|---|
| `engines/identity` | Engine | `resolveAuthenticatedContext`, `invalidateIdentityResultCache` |
| `engines/hydration` | Engine | `hydrateActor`, `useActorStore` |

**App dependencies (approved):**
(Evidence: ARCHITECTURE.md §MODULE DEPENDENCY GRAPH)

| Dependency | Direction | What Is Used |
|---|---|---|
| `apps/VCSM/src/services/supabase` | Internal service | `supabaseClient`, `vcClient`, `vportClient` |
| `apps/VCSM/src/app/providers/AuthProvider` | App provider | `useAuth()` — auth must be a parent in the provider tree |
| `@tanstack/react-query` | External | `useQueryClient` for cache invalidation |
| `zustand` | External | `create()` for Zustand stores |
| `@debuggers/identity` | Dev-only | `debugLoginEvent`, `debugLoginError` — gated behind `IS_DEV` |
| `@debuggers/feed` | Dev-only | `debugFeedViewer` — gated behind `IS_DEV` |
| `@/bootstrap/bootstrap.invalidate` | Internal | `purgeChatMessageCache`, `purgeNotificationCache` |

**Boundary note:** `identityContext.jsx` imports `purgeChatMessageCache` and `purgeNotificationCache` from `@/bootstrap/bootstrap.invalidate`. This is a cross-module concern (the state layer should not know about chat and notification cache internals). It is an acknowledged pragmatic coupling.
(Evidence: ARCHITECTURE.md §MODULE BOUNDARY WARNINGS)

**Consumed by:** Every authenticated feature in the app via `IdentityProvider` and `useIdentity()`. This module has no isolated consumers — it is platform-wide.
(Evidence: ARCHITECTURE.md §OWNERSHIP)

**Independence status:** MOSTLY INDEPENDENT
(Evidence: CURRENT_STATUS.md, ARCHITECTURE.md §Independence Status)

---

## §9 Must Never Happen — Security Invariants

These invariants are derived from VENOM and BlackWidow findings. All are SOURCE_VERIFIED.

**INVARIANT-001: A committed identity must belong to the authenticated user.**
Active identity must never have `_engineMeta.userId` != `user.id`. Any mismatch must result in `commitIdentity(null)`, not a committed cross-user identity.
Enforcement status: ENFORCED on the resolution path (`useIdentityResolutionEffect.hook.js:152-160`). Note: the ownership check is not on the switch path by design — the switch path uses its own ownership validation (availableActors + engine).
Violated by: VEN-STATE-004 (unanchored invariants), BW-STATE-002.
(Evidence: BlackWidow output §6.I Invariant 1)

**INVARIANT-002: A blocked, deleted, or inactive VPORT actor must never persist as the active identity in an operational state.**
When `isBlockedVportIdentity` is true, the active identity must be evicted — either by auto-switch to a user-kind actor or by forced logout. Silent no-op is not acceptable.
Enforcement status: PARTIAL — auto-switch evicts when a user-kind actor is available; no eviction when only VPORT actors exist (silent no-op). Route guard redirects to `/vport/restore` as partial mitigation. State-layer eviction is absent for VPORT-only accounts.
Violated by: VEN-STATE-007, BW-STATE-005.
(Evidence: VENOM output VEN-STATE-007, BlackWidow output §6.I Invariant 2)

**INVARIANT-003: A soft-deleted account must trigger logout, never self-heal or retry.**
When `DELETED_ACCOUNT_SENTINEL` is returned, `logout({ accountDeleted: true })` must be called immediately. No self-heal loop or retry must be triggered.
Enforcement status: ENFORCED (`useIdentityResolutionEffect.hook.js:65-75` — strict equality check on frozen singleton; logout triggered).
Violated by: VEN-STATE-004 (unanchored), BW-STATE-002.
(Evidence: BlackWidow output §6.I Invariant 3)

**INVARIANT-004: No raw profileId or vportId must ever appear in the public identity surface or in `useIdentity()` output.**
`useIdentity()` must expose only `{ actorId, kind, ownerActorId }`. profileId and vportId are internal and must not travel to the public hook surface.
Enforcement status: ENFORCED (`toPublicIdentity` in `identity.model.js` limits public surface). Risk: `useIdentityDetailsDeprecated()` exposes full identityDetails — this is a standing exposure surface (VEN-STATE-001, VEN-STATE-002).
Violated by: VEN-STATE-001, VEN-STATE-002.
(Evidence: VENOM output VEN-STATE-001)

**INVARIANT-005: Actor switch validation must use the server-resolved `availableActors` list — no client-injectable actorId may bypass this list.**
A requested actorId that is not present in the server-resolved `availableActors` must be rejected at the app layer before any engine write is attempted.
Enforcement status: ENFORCED (`switchActor.controller.js:84` — availableActors.find() check; returns SWITCH_ABORT_LINK_NOT_FOUND if not found).
Violated by: VEN-STATE-004 (unanchored invariants).
(Evidence: BlackWidow output §6.A)

**INVARIANT-006: An actor switch must never succeed if the engine determines the actor link is inactive or the ownership check fails.**
The engine's live DB read on `engineSwitchActiveActor` is the last line of defense — it bypasses the stale app-layer cache.
Enforcement status: ENFORCED at engine layer (`switchActiveActor.controller.js:25,31-37`). App layer does not independently enforce `isSwitchable` (BW-STATE-003 — defense-in-depth gap).
Violated by: BW-STATE-003 (partial — app layer gap), VEN-STATE-009 (stale cache risk).
(Evidence: BlackWidow output §6.A, §6.F)

**INVARIANT-007: localStorage identity keys must be user-scoped. No unscoped write to a global identity key is permitted.**
`identityStorage.js` must scope all keys by `userId`. A null `userId` must not produce a writable identity key.
Enforcement status: ENFORCED (`identityStorage.js:6` — null userId returns key prefix without writing; switch abort fires before `saveIdentity` is reached when ctx is null).
Violated by: VEN-STATE-004 (unanchored).
(Evidence: BlackWidow output §6.I localStorage collision attack)

**INVARIANT-008: PII fields (email, birthdate, age, sex, is_adult) must not be emitted to the production console, analytics, or any third-party service via identity-related paths.**
`assertActorId` must not emit unguarded `console.error` with actor values. `IdentityDebugger.jsx` must only render the public identity surface.
Enforcement status: PARTIALLY VIOLATED — `assertActorId.js:5` emits unguarded `console.error` in production (VEN-STATE-006). IdentityDebugger correctly renders public surface only (VEN-STATE-005 — currently safe).
Violated by: VEN-STATE-006.
(Evidence: VENOM output VEN-STATE-006)

**INVARIANT-009: Actor ownership verification must use `vc.actor_owners` as the canonical authority, not profileId lookup.**
Self-heal and any other actor lookup paths must query through `vc.actor_owners`, not assume profileId equals userId.
Enforcement status: VIOLATED in self-heal path — `findSelfHealActorForUser(userId)` passes `userId` as `profileId` (VEN-STATE-003).
Violated by: VEN-STATE-003.
(Evidence: VENOM output VEN-STATE-003)

---

## §10 Module Responsibilities

The `state` module contains the following sub-modules and layers. Module-level BEHAVIOR.md files are not present (only a STUB exists at `modules/state/BEHAVIOR.md` with no source at time of build).
(Evidence: ARCHITECTURE.md §LAYER MAP, INDEX.md §Source Inventory, modules/state/BEHAVIOR.md status: STUB)

| Layer | Key Files | Documented Responsibility |
|---|---|---|
| DAL (10 files) | `identity.read.dal.js` | SELECT-only reads: `vc.actors`, `vc.realms`, `vc.actor_privacy_settings`, `vc.actor_owners`, `public.profiles`, `vport.profiles`, `vport.profile_categories`. No write surfaces. |
| Model (5 files) | `identity.model.js` | `toPublicIdentity` (public surface reduction), `mapProfileActor` (profile identity construction — includes PII, see VEN-STATE-001), `mapVportActor` (vport identity construction), `getIdentityEngineContext`, `isBlockedVportIdentity` (blocked VPORT detection) |
| Controller (1 + 1 sub) | `identity.controller.js`, `switchActor.controller.js` | `loadDefaultIdentityForUser`, `loadOwnedActorChoices`, `resolveRealmId`; actor switch orchestration |
| Hook (3 files) | `useIdentityResolutionEffect.hook.js`, `useIdentitySync.js`, `useActorSummary.js` | Main resolution loop (with ownership mismatch check and DELETED_ACCOUNT_SENTINEL detection); localStorage sync; actor summary access |
| Context | `identityContext.jsx` | `IdentityProvider`, `switchActor`, `refreshAvailableActors`, `blockedVport` detection, `setIdentity` compat surface |
| Stores | `identitySelection.store.js`, `profileGateStore.js`, `followRequestsStore.js` | Active actor tracking (Zustand); profile gate invalidation signal; follow requests invalidation signal |
| Self-heal | `identitySelfHeal.controller.js`, `identityResolutionSelfHeal.helper.js` | Bootstrap self-heal when user has no engine platform rows (see §3.5, VEN-STATE-003) |
| Inflight dedup | `identity.controller.inflight.js` | In-flight dedup Map (module-level singleton, userId-scoped) |
| Storage | `identityStorage.js` | localStorage read/write with user-scoped key pattern |
| Selectors | `identitySelectors.js` | Derived selectors: `canCitizenBook`, `getProfilePath` — returns `/profile/self`, not UUID-based URL |
| Dev-only | `IdentityDebugger.jsx`, `identitySwitcher.jsx` | DEV-gated debug panel and UI switcher — not production components |
| Barrels (4) | `state/index.js` + sub-folder re-exports | Public surface re-exports; `actorStore.js` is a trivial re-export from `@hydration` (acknowledged boundary smell) |

**Specific behavioral details for each file are UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.** The above is derived from scanner layer data and finding-level source references in governance artifacts, not from source code review.

---

## §11 Known Gaps

### Missing Governance
- **OWNERSHIP.md:** Does not exist. No formal owner record. (Evidence: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX)
- **TESTS.md:** Does not exist. Zero test coverage on the most critical boot-time path in the application. (Evidence: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX — Tests/validation noted: FAIL; INDEX.md — Tests: 0)
- **ELEKTRA scan:** Never run (ELEKTRA Last Run: NEVER per SECURITY.md). Caller-level source-to-sink tracing for PII fields has not been performed.
- **Module BEHAVIOR.md files:** Only one module-level BEHAVIOR.md exists (`modules/state/BEHAVIOR.md`) and it is a STUB with no source files.

### Open VENOM Findings (all OPEN, none resolved at time of governance review)
- VEN-STATE-001 (HIGH) — PII fields in public identity model
- VEN-STATE-002 (MEDIUM) — Deprecated hooks with no sunset timeline
- VEN-STATE-003 (MEDIUM) — Self-heal uses userId as profileId
- VEN-STATE-005 (LOW) — IdentityDebugger in wrong layer
- VEN-STATE-006 (LOW) — Unguarded console.error in production
- VEN-STATE-007 (HIGH, THOR BLOCKER) — Blocked VPORT silent no-op
- VEN-STATE-008 (MEDIUM) — owner_user_id fetched unnecessarily
- VEN-STATE-009 (MEDIUM) — 2-minute stale cache on availableActors

### Open BlackWidow Findings
- BW-STATE-001 (HIGH, THOR BLOCKER) — Module absent from security path scanner
- BW-STATE-002 (HIGH, THOR BLOCKER) — BEHAVIOR.md was PLACEHOLDER (resolved by this file)
- BW-STATE-003 (MEDIUM) — isSwitchable not enforced at app layer
- BW-STATE-004 (LOW) — switchActor has no explicit null-user guard
- BW-STATE-005 (INFO) — Blocked VPORT no-op confirmed; route redirect partially mitigates

### UNKNOWN Items in This Contract
- Full self-heal trigger conditions and all failure modes (§3.5)
- Detailed per-file behavioral responsibilities beyond scanner layer data (§10)
- Full error handling matrix beyond documented abort codes and sentinel patterns (§7)
- ELEKTRA caller-level PII field usage (never run — §6 constraints VEN-STATE-001, VEN-STATE-008 cannot be fully assessed without ELEKTRA)
- DB-level RLS verification for read surfaces (acknowledged as PARTIAL in BlackWidow §6.D)
- Deprecated hook sunset plan (no timeline exists — §4 BR-STATE-002 constraint)

### Recommended Handoffs (from governance)
- **SPIDER-MAN** — Add regression tests for: `loadDefaultIdentityForUser`, `toPublicIdentity`, `mapProfileActor`, `mapVportActor`, DELETED_ACCOUNT_SENTINEL flow, blocked-VPORT-only-account lifecycle enforcement, localStorage key isolation, isSwitchable pre-flight. (Evidence: ARCHITECTURE.md §MODULE BUILD PRIORITY, BlackWidow §13)
- **IRONMAN** — Own deprecated hook sunset plan; own `IdentityDebugger.jsx` relocation; own `actorStore.js` cleanup; own module ownership record. (Evidence: VENOM §10, ARCHITECTURE.md §RECOMMENDED HANDOFFS)
- **SENTRY** — Monitor identity resolution failure rate and PGRST116 RLS blocks in production. (Evidence: ARCHITECTURE.md §RECOMMENDED HANDOFFS)
- **ELEKTRA** — Audit all callers of `useIdentityDetailsDeprecated()`; verify no component renders PII fields; trace `owner_user_id` through downstream consumers. (Evidence: VENOM §10)
- **DB** — Verify: (1) auth.users.id vs public.profiles.id relationship; (2) engineSwitchActiveActor RLS enforcement; (3) actor_owners RLS for blocked VPORT accounts. (Evidence: VENOM §10)

---

## §12 Validation Sources

The following governance files were read to construct this contract. No source code was read.

| File | Status | Key Facts Extracted |
|---|---|---|
| `ZZnotforproduction/APPS/VCSM/features/state/CURRENT_STATUS.md` | READ | Architecture state: STABLE; Independence: MOSTLY INDEPENDENT; Spaghetti: CLEAN; Top gap: BEHAVIOR.md placeholder; Recommended handoffs: LOGAN, SPIDER-MAN, IRONMAN, SENTRY |
| `ZZnotforproduction/APPS/VCSM/features/state/SECURITY.md` | READ | Highest severity: HIGH; THOR blockers: VEN-STATE-004, VEN-STATE-007, BW-STATE-001, BW-STATE-002; VENOM: 0 CRITICAL, 3 HIGH, 4 MEDIUM, 2 LOW; BW: 0 CRITICAL, 2 HIGH, 1 MEDIUM, 1 LOW, 1 INFO; ELEKTRA: NEVER RUN |
| `ZZnotforproduction/APPS/VCSM/features/state/ARCHITECTURE.md` | READ | Full layer map, module completeness matrix, dependency graph, data contract, runtime readiness, boundary warnings, spaghetti score, missing pieces, recommended handoffs |
| `ZZnotforproduction/APPS/VCSM/features/state/INDEX.md` | READ | Source inventory (23 files, 0 tests, 0 routes, 0 write surfaces), engine dependencies, security-sensitive surfaces, documentation links |
| `ZZnotforproduction/APPS/VCSM/features/state/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_state-security-review.md` | READ | All 9 VENOM findings (VEN-STATE-001 through VEN-STATE-009) with full detail; verified-safe paths documented; THOR impact table |
| `ZZnotforproduction/APPS/VCSM/features/state/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_state-adversarial-review.md` | READ | All 5 BW findings; adversarial path analysis for 8 attack categories + §9 invariant attacks; THOR impact; SPIDER-MAN test requirements |
| `ZZnotforproduction/APPS/VCSM/features/state/modules/state/BEHAVIOR.md` | READ | Status: STUB — no source files at time of build; no behavioral content |

**Files not found (secondary governance — absent):**
- `OWNERSHIP.md` — Does not exist
- `TESTS.md` — Does not exist

---

## §13 THOR Release Status

**THOR Release Blocker: YES**
(Evidence: SECURITY.md — THOR Release Blocker field)

**Active THOR Blockers:**

| Blocker ID | Source | Severity | Description | Status |
|---|---|---|---|---|
| VEN-STATE-004 | VENOM | HIGH | BEHAVIOR.md was PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen invariants for the app's most critical security module | RESOLVING — this file is the resolution; THOR must re-evaluate after LOGAN delivery |
| VEN-STATE-007 | VENOM | HIGH | Blocked VPORT auto-switch is a silent no-op when no user-kind actor exists — blocked VPORT identity persists as active | OPEN — not resolved; fix requires implementation change to `identityContext.jsx` |
| BW-STATE-001 | BlackWidow | HIGH | Identity state module absent from security path scanner — zero scanner coverage for the most critical platform module | OPEN — not resolved; requires scanner configuration update |
| BW-STATE-002 | BlackWidow | HIGH | BEHAVIOR.md was PLACEHOLDER — §9 invariants unanchored for platform's most critical security module | RESOLVING — this file is the resolution; THOR must re-evaluate after LOGAN delivery |

**Current THOR status:** BLOCKED

VEN-STATE-004 and BW-STATE-002 are being addressed by this BEHAVIOR.md. THOR must re-evaluate these two blockers after confirming this file is accepted.

VEN-STATE-007 (blocked VPORT silent no-op) and BW-STATE-001 (scanner absence) remain OPEN and unresolved. These require implementation changes and scanner configuration updates respectively before the module can clear THOR.

**Highest Open Severity after BEHAVIOR.md delivery:** HIGH (VEN-STATE-007, BW-STATE-001)
