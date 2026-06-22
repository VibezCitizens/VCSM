# VCSM Identity Migration — Implementation Checklist

**Date:** 2026-04-01
**Status:** COMPLETE — Migration executed April 2026. Engine integration is live.
**Updated:** 2026-05-11 (status updated by Logan Phase 3a audit — migration confirmed complete)
**Source of truth:** Forensic code trace of 24 auth/identity files in apps/VCSM

---

## 1. Migration Objective

### What is being changed
VCSM sign-up, sign-in, and identity resolution will start using the shared `platform.*` schema via `engines/identity`, the same engine Wentrex already uses. This adds a platform app-account and actor-link layer on top of VCSM's existing `vc.*` domain records.

### What is NOT being changed
- `vc.actors` remains the source of truth for VCSM actor records
- `vc.actor_owners` remains for vc-level ownership
- `public.profiles` remains for user profile data
- `vc.vports` remains for business pages
- `vc.realms` remains for realm routing
- All UI screens, components, hooks, and routes stay as-is
- The `useIdentity()` hook contract stays stable

### Why this migration is being done
- VCSM and Wentrex currently share zero identity infrastructure despite identical patterns
- The identity engine is proven (34 files, frozen contract, 7 services)
- Platform-backed identity enables: cross-app actor linking, role/capability system, shared onboarding state, consistent session management

### Success criteria by phase
- **Phase 0:** Aliases wired, no behavior change
- **Phase 1:** New signups get platform rows alongside vc rows. Existing users self-heal on login.
- **Phase 2:** Identity resolution reads platform first, falls back to legacy. No visible change.
- **Phase 3:** `useIdentity()` internally wraps the engine. Same output shape.
- **Phase 4:** Actor switching uses platform preferences. localStorage backup maintained.
- **Phase 5:** Legacy-only identity paths removable (not removed yet — just provably unused).

---

## 2. Critical Contract to Preserve

### useIdentity() runtime contract

Every protected feature in VCSM calls `useIdentity()`. It must continue returning:

```javascript
{
  identity: {
    actorId: string,
    kind: 'user' | 'vport',
    realmId: string | null,
    isVoid: boolean,
    displayName: string,
    username: string,
    email: string,
    avatar: string,
    banner: string,
    bio: string,
    birthdate: string,
    age: number,
    sex: string,
    isAdult: boolean,
    discoverable: boolean,
    publish: boolean,
    private: boolean,
    lastSeen: string,
    createdAt: string,
    updatedAt: string,
    ownerActorId: string | null,  // vport only
    vportType: string | null,     // vport only
  },
  loading: boolean,
  identityLoading: boolean,
  setIdentity: function,
  switchActor: function,
}
```

### Other contracts that must hold
- `AuthProvider` provides `{ user, session, loading, logout }`
- `ProtectedRoute` redirects to `/login` when no user
- `CompleteProfileGate` redirects to `/onboarding` when profile incomplete
- `identityStorage` persists actor selection to localStorage key `vc.identity.actorId`
- `identitySwitcher` lists owned actors and calls `switchActor(actorId)`

### Identity Contract Preservation Rule
- Existing consumers of `useIdentity()` must receive the same shape or a backward-compatible superset
- New fields may be added; no field may be removed or renamed
- Internal resolution changes must be invisible to screens/hooks/components
- If engine resolution fails, legacy resolution must be attempted before surfacing an error

---

## 3. Phased Implementation Checklist

### PHASE 0 — PREPARATION

**Goal:** Wire engine aliases and create the adapter scaffold. Zero behavior change.

**Files to inspect:**
- `apps/VCSM/vite.config.js`
- `apps/VCSM/jsconfig.json`
- `engines/identity/index.js`

**Files to create:**
- `apps/VCSM/src/features/identity/setup.js`
- `apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js` (stub)

**Files to modify:**
- `apps/VCSM/vite.config.js` — add `@identity` alias
- `apps/VCSM/jsconfig.json` — add `@identity` path mapping

**Database objects involved:** None

**Implementation tasks:**
1. Add `@identity` alias to `vite.config.js` pointing to `../../engines/identity/index.js`
2. Add `@identity` path to `jsconfig.json` for IDE resolution
3. Create `features/identity/setup.js` with `setupVcsmIdentityEngine()` that calls `configureIdentityEngine({ supabaseClient })`
4. Create `features/identity/resolvers/vcsmIdentity.resolver.js` as empty stub (will hold the vc-specific resolver later)
5. Verify build passes with `npx vite build`

**Behavioral guarantee:** Zero behavior change. App works exactly as before.

**Pass criteria:**
- Build passes
- No new imports consumed by any existing file
- `@identity` resolves correctly in IDE

**Failure risks:** Alias conflict with existing paths (unlikely — no `@identity` exists)

**Rollback strategy:** Revert vite.config.js and delete new files

**Validation steps:**
- `npx vite build` succeeds
- `grep -r "@identity" apps/VCSM/src/` returns only the new setup.js

---

### PHASE 0.5 — FREEZE THE useIdentity() CONTRACT

**Goal:** Document and lock the current identity shape so migration can be validated against it.

**Files to inspect:**
- `state/identity/identityContext.jsx`
- `state/identity/identity.controller.js`
- `state/identity/identitySelectors.js`

**Files to create:**
- `apps/VCSM/src/features/identity/identityContract.js` — exports a `validateIdentityShape(identity)` function

**Files to modify:** None

**Implementation tasks:**
1. Create `identityContract.js` that exports `validateIdentityShape(obj)` — asserts required fields exist
2. Add dev-only assertion in `identityContext.jsx` that calls `validateIdentityShape` on every identity update (gated by `import.meta.env.DEV`)
3. This assertion catches any regression during migration immediately

**Behavioral guarantee:** Zero production behavior change. Dev mode gains a shape assertion.

**Pass criteria:**
- Assertion passes for current identity shape
- No production code affected

**Failure risks:** None (dev-only)

**Rollback strategy:** Remove assertion

**Validation steps:**
- Load app in dev → identity resolves → no assertion error
- Manually corrupt identity shape → assertion fires

---

### PHASE 1 — SIGNUP DUAL-WRITE + LOGIN SELF-HEALING

**Goal:** New signups create platform rows alongside vc rows. Existing users get platform rows on login (self-healing).

**Files to inspect:**
- `features/auth/controllers/onboarding.controller.js`
- `features/auth/controllers/createUserActor.controller.js`
- `features/auth/hooks/useLogin.js`
- `features/auth/controllers/authSession.controller.js`

**Files to create:**
- `apps/VCSM/src/features/identity/dal/provision.rpc.dal.js`
- `apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js`

**Files to modify:**
- `features/auth/controllers/onboarding.controller.js` — call platform provisioning after actor creation
- `features/auth/hooks/useLogin.js` — call self-healing after successful login

**Database objects involved:**
- `platform.apps` — must have row with `key = 'vcsm'`
- `platform.provision_vcsm_identity` — NEW RPC (must be created)
- `platform.user_app_access`, `platform.user_app_accounts`, `platform.user_app_actor_links`, `platform.user_app_preferences`, `platform.user_app_state` — written by RPC

**Implementation tasks:**
1. **DB prerequisite:** Ensure `platform.apps` has row `(key: 'vcsm', name: 'VCSM', is_active: true)`
2. **DB prerequisite:** Create `platform.provision_vcsm_identity(p_actor_id, p_actor_source)` RPC (see RPC Design section)
3. Create `features/identity/dal/provision.rpc.dal.js` — calls `platform.provision_vcsm_identity`
4. Create `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js`:
   - Takes `{ userId, actorId }`
   - Calls provision RPC
   - Swallows errors (non-fatal — legacy path still works)
   - Returns `{ ok: boolean, error?: string }`
5. In `onboarding.controller.js` → `completeOnboardingController()`:
   - After `createUserActorForProfile()` succeeds (line ~8 of completion flow)
   - Add: `await ensureVcsmPlatformBootstrap({ userId, actorId: actor.id }).catch(() => {})`
   - Non-blocking — if provisioning fails, user still works via legacy path
6. In `useLogin.js` → `handleLogin()`:
   - After `hydrateAuthSession()` succeeds
   - Add: `ensureVcsmPlatformBootstrap({ userId: data.user.id, actorId: identity.actorId }).catch(() => {})`
   - Requires identity to be available — may need to run after IdentityProvider resolves
   - Alternative: run from `identityContext.jsx` on every identity load (safer location)

**Behavioral guarantee:**
- Signup still works even if platform provisioning fails
- Login still works even if self-healing fails
- Legacy users continue to function
- New users get both vc.* AND platform.* rows

**Pass criteria:**
- New signup → check `platform.user_app_accounts` has row for user
- Existing user login → check `platform.user_app_accounts` has row (self-healed)
- If RPC fails → user still logs in and sees feed

**Failure risks:**
- RPC doesn't exist → 404 error (must create DB objects first)
- Platform app row missing → RPC fails (must insert app row first)
- Race condition if user opens two tabs → RPC must be idempotent

**Rollback strategy:** Remove the two `ensureVcsmPlatformBootstrap()` calls. Delete new files. Platform rows are harmless orphans.

**Validation steps:**
- Signup → query `select * from platform.user_app_accounts where user_id = ?`
- Login as existing user → same query → row exists
- Disconnect RPC (rename function) → login still works → reconnect

---

### PHASE 2 — ENGINE-FIRST RESOLUTION WITH LEGACY FALLBACK

**Goal:** Identity resolution tries the engine first. If engine returns context, use it. If it fails (no platform rows), fall back to legacy vc.* resolution.

**Files to inspect:**
- `state/identity/identity.controller.js`
- `state/identity/identityContext.jsx`
- `engines/identity/src/controller/resolveAuthenticatedContext.controller.js`

**Files to create:**
- `apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js` (fill in the stub from Phase 0)

**Files to modify:**
- `state/identity/identity.controller.js` — add engine-first path
- `features/identity/setup.js` — configure engine with VCSM resolver

**Implementation tasks:**
1. Fill `vcsmIdentity.resolver.js` with a `createVcsmAppContextResolver(supabase)` function:
   - Reads `platform.user_app_actor_links` where `actor_source = 'vc'`
   - Extracts `actor_id` from the active link
   - Returns `{ actorLinks, roleKeys: [], capabilityKeys: [], isSuspended: false, defaultDestination: null }`
   - Does NOT derive roles from vc.* (VCSM doesn't have LMS role semantics)
2. Update `features/identity/setup.js` to pass resolver:
   ```js
   configureIdentityEngine({
     supabaseClient: supabase,
     resolveAppContext: createVcsmAppContextResolver(supabase),
   })
   ```
3. Update `identity.controller.js` → `loadDefaultIdentityForUser()`:
   - Try: `resolveAuthenticatedContext({ appKey: 'vcsm', skipLoginRecord: true })`
   - If succeeds: extract `activeActor.actorId`, then hydrate with existing `hydrateIdentityActor()` (same vc.* enrichment)
   - If fails (ACCOUNT_NOT_FOUND, ACCESS_DENIED.none, etc.): fall back to existing vc.* flow
   - This is the same self-healing pattern Wentrex uses
4. Call `setupVcsmIdentityEngine()` from `main.jsx` before any component renders

**Behavioral guarantee:**
- Users WITH platform rows → resolved via engine (faster, consistent with Wentrex)
- Users WITHOUT platform rows → resolved via legacy (self-healing provisions platform rows)
- Identity shape unchanged — `hydrateIdentityActor()` still does the enrichment
- `useIdentity()` output unchanged

**Pass criteria:**
- User with platform rows → engine path hits (verify via dev log)
- User without platform rows → legacy path hits → platform rows created (self-heal)
- Identity shape assertion (Phase 0.5) passes in all cases

**Failure risks:**
- Engine resolution returns wrong actor → identity mismatch (test thoroughly)
- Engine throws unexpected error → must catch all codes, not just known ones
- Performance: engine adds 2-3 extra queries (platform tables) — acceptable for consistency

**Rollback strategy:** Remove engine-first path from `identity.controller.js`. Remove `setupVcsmIdentityEngine()` call.

**Validation steps:**
- Login as user with platform rows → check dev log → "engine path"
- Login as user without platform rows → check dev log → "legacy fallback" → then "engine path" on next load
- Identity shape assertion passes both paths
- All routes accessible, no redirect loops

---

### PHASE 3 — WRAP identityContext AROUND ENGINE

**Goal:** `IdentityProvider` internally uses the engine's `resolveAuthenticatedContext` as its primary resolution path, with the VCSM enricher layered on top.

**Files to modify:**
- `state/identity/identityContext.jsx` — restructure to call engine
- `features/identity/setup.js` — ensure called before provider mounts

**Implementation tasks:**
1. Restructure `IdentityProvider` to mirror Wentrex's `WentrexIdentityProvider`:
   - On `INITIAL_SESSION` → `resolveAuthenticatedContext({ appKey: 'vcsm', skipLoginRecord: true })` (read-only)
   - On `SIGNED_IN` → full provision + resolve
   - On `SIGNED_OUT` → clear identity
   - Self-heal: if engine fails with ACCOUNT_NOT_FOUND → call `ensureVcsmPlatformBootstrap()` then retry
2. After engine returns `AuthenticatedContext`, enrich with vc.* data using existing `hydrateIdentityActor()`
3. Map engine output + vc enrichment → existing identity shape
4. Keep `switchActor()` working via existing vc.* path (Phase 4 upgrades this)
5. Keep `identityStorage` (localStorage) working — save actorId on every resolution

**Behavioral guarantee:**
- `useIdentity()` returns same shape
- All screens, hooks, components work unchanged
- Actor switching still works (uses legacy path temporarily)
- Route guards unchanged

**Pass criteria:**
- Full app smoke test: login, browse feed, post, chat, switch actor, logout, login again
- Identity shape assertion passes
- No console errors related to identity

**Failure risks:**
- Auth event listener mismatch — must handle INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED correctly
- Self-healing loop if provisioning keeps failing
- Missing `setupVcsmIdentityEngine()` call → engine not configured → crash

**Rollback strategy:** Revert `identityContext.jsx` to pre-migration version (git checkout).

---

### PHASE 4 — PLATFORM-BACKED ACTOR SWITCHING

**Goal:** Actor switching uses `platform.user_app_preferences` instead of localStorage-only.

**Files to modify:**
- `state/identity/identityContext.jsx` — `switchActor()` writes to platform
- `state/identity/identity.controller.js` — reads active actor from platform preferences

**Implementation tasks:**
1. On `switchActor(actorId)`:
   - Call engine's `switchActiveActor({ userAppAccountId, actorLinkId })` (updates platform.user_app_preferences)
   - Keep localStorage write as backup
2. On identity load:
   - Engine already returns the active actor from preferences
   - Keep localStorage as fallback if engine doesn't have a preference

**Pass criteria:**
- Switch to vport → reload page → vport identity persists (via platform, not just localStorage)
- Clear localStorage → reload → still on vport (platform preference is source of truth)

---

### PHASE 5 — REDUCE LEGACY IDENTITY DEPENDENCE

**Goal:** Make legacy-only paths provably unused. Do NOT delete them yet.

**Implementation tasks:**
1. Add dev-only counters: how often legacy path vs engine path fires
2. Monitor for 1 week
3. If legacy path fires = 0 for all users → mark legacy DALs as deprecated
4. Do NOT delete until confident

---

## 4. New Building Blocks to Add

| Building Block | Location | Purpose | App/Engine/Adapter | Safe to add without behavior change? |
|---|---|---|---|---|
| `@identity` alias | `vite.config.js` | Resolve engine imports | Config | Yes |
| `features/identity/setup.js` | App | Configure engine with VCSM deps | Adapter | Yes |
| `features/identity/resolvers/vcsmIdentity.resolver.js` | App | VC-specific actor enrichment for engine | Adapter | Yes (stub) |
| `features/identity/dal/provision.rpc.dal.js` | App | Call `platform.provision_vcsm_identity` RPC | DAL | Yes (not called yet) |
| `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` | App | Orchestrate provisioning with error swallowing | Controller | Yes (not called yet) |
| `features/identity/identityContract.js` | App | Validate identity shape in dev | Shared util | Yes (dev-only) |
| `platform.provision_vcsm_identity` RPC | Database | Idempotent platform row provisioning | DB function | Yes (no callers yet) |
| `platform.apps` row (key='vcsm') | Database | App registration | DB data | Yes (no impact) |

---

## 5. First 10 Files to Change

| Order | File | Change Category | Risk | Behavior Change? |
|-------|------|----------------|------|-----------------|
| 1 | `apps/VCSM/vite.config.js` | Alias/config | Low | No |
| 2 | `apps/VCSM/jsconfig.json` | Alias/config | Low | No |
| 3 | `features/identity/setup.js` | Setup (NEW) | Low | No |
| 4 | `features/identity/resolvers/vcsmIdentity.resolver.js` | Resolver (NEW stub) | Low | No |
| 5 | `features/identity/identityContract.js` | Validator (NEW) | Low | Dev-only |
| 6 | `features/identity/dal/provision.rpc.dal.js` | DAL (NEW) | Low | No (not called) |
| 7 | `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` | Controller (NEW) | Low | No (not called) |
| 8 | `features/auth/controllers/onboarding.controller.js` | Controller (modify) | Medium | Yes — dual-write |
| 9 | `features/auth/hooks/useLogin.js` or `state/identity/identityContext.jsx` | Hook/Context (modify) | Medium | Yes — self-heal |
| 10 | `state/identity/identity.controller.js` | Controller (modify) | High | Yes — engine-first resolution |

---

## 6. RPC Design Checklist — provision_vcsm_identity

### Required inputs
- `p_actor_id UUID` — the vc.actors.id to link
- `p_actor_source TEXT DEFAULT 'vc'` — actor source tag

### Required outputs
```sql
RETURNS TABLE (
  ok boolean,
  user_id uuid,
  app_id uuid,
  user_app_account_id uuid,
  actor_link_id uuid,
  actor_id uuid
)
```

### Tables touched (all upserts, idempotent)
1. `platform.user_app_access` — status: 'granted'
2. `platform.user_app_accounts` — status: 'active'
3. `platform.user_app_actor_links` — actor_source: 'vc', actor_id, is_primary: true
4. `platform.user_app_preferences` — active_actor_link_id
5. `platform.user_app_state` — default state row

### Idempotency
- All inserts use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`
- Safe to call on every login
- Safe to call concurrently from two tabs

### Recommended RPC Responsibility Boundary
**Account bootstrap + actor link bootstrap (combined).**

Rationale: Wentrex uses this pattern (`provision_wentrex_identity` does both). Splitting them creates a window where account exists but actor link doesn't — fragile. One atomic RPC is safer and proven.

### Behavior requirements
- Uses `auth.uid()` internally — cannot provision for other users
- Validates actor ownership before linking (`vc.actor_owners` must have matching row)
- If platform rows already exist → no-op (returns existing IDs)
- If vc actor is missing → raise exception (caller must handle)

---

## 7. Legacy User Self-Healing Plan

### When self-healing runs
- On every identity resolution in `identityContext.jsx`
- If engine returns `ACCOUNT_NOT_FOUND` or `ACCESS_DENIED` with `accessStatus='none'`

### What missing rows it creates
- Calls `ensureVcsmPlatformBootstrap({ userId, actorId })`
- Which calls `provision_vcsm_identity` RPC
- Which creates: user_app_access, user_app_accounts, user_app_actor_links, user_app_preferences, user_app_state

### Should login block if self-healing fails?
**No.** Self-healing is non-fatal. Legacy path continues to work. Platform provisioning is best-effort.

### Fatal vs non-fatal failures
- **Non-fatal:** RPC fails, platform tables unreachable, duplicate key (already healed)
- **Fatal:** None — legacy path always available as fallback

### Avoiding duplicates
- RPC uses `ON CONFLICT DO NOTHING` / `DO UPDATE` — inherently idempotent
- Multiple concurrent calls produce same result

### Self-heal detection
- Dev-only console log: `[identity] self-healed platform rows for user ${userId}`
- No production logging needed — it's a normal migration path

### Self-Heal Decision Rules

| Scenario | Action |
|----------|--------|
| Account exists, actor link missing | Re-run provision RPC (upserts link) |
| Account missing entirely | Run full provision RPC |
| Multiple actor links exist | Engine selects by preference → fallback to primary → fallback to first |
| No primary actor exists | Legacy resolution picks first owned actor (existing behavior preserved) |
| Legacy vc actor exists but platform preferences empty | Provision RPC creates default preferences |

---

## 8. useIdentity() Wrapper Plan

### How engine resolution is introduced
Phase 2: `identity.controller.js` tries engine first, falls back to legacy.
Phase 3: `identityContext.jsx` wraps engine provider pattern (like Wentrex).

### Legacy shape compatibility
The engine returns `AuthenticatedContext`:
```javascript
{
  userId, appId, userAppAccountId,
  activeActor: { actorId, actorKind, actorSource, isPrimary, isSwitchable, displayName, avatarUrl, meta },
  actors: ActorLink[],
  roleKeys: [],
  capabilityKeys: [],
  isSuspended: false,
  defaultDestination: null,
  state: DomainState,
  preferences: DomainPreferences,
}
```

The app expects the existing identity shape (see Section 2). The wrapper must:
1. Extract `activeActor.actorId` from engine output
2. Call existing `hydrateIdentityActor(actor)` with the vc.actors row for that actorId
3. Return the hydrated shape unchanged

### Fallback chain
1. Engine resolution (`resolveAuthenticatedContext({ appKey: 'vcsm' })`)
2. If fails with healable error → self-heal → retry once
3. If still fails → legacy vc.* resolution (`loadDefaultIdentityForUser()` existing code)
4. If legacy fails → `{ identity: null, loading: false }`

### DO NOT BREAK Rules
- No screen rewrites in Phases 0-3
- No controller receives a different identity shape
- Route guards behave exactly as before
- Onboarding gating behaves exactly as before
- `switchActor()` continues to work (localStorage + context state)

---

## 9. Validation Matrix

| Scenario | Expected Result | Must-Pass Checks | Blocking? |
|----------|----------------|-----------------|-----------|
| New signup | Profile + vc.actor + vc.actor_owners + platform.* rows created | All 4 table groups have rows | Yes |
| New signup + onboarding | Same as above + identity resolves | useIdentity() returns valid shape | Yes |
| Existing user login, no platform rows | Login succeeds, self-heal creates platform rows | Feed loads, platform rows exist after | Yes |
| Existing user login, partial platform rows | Login succeeds, missing rows created | No errors, identity resolves | Yes |
| Existing user login, complete platform rows | Login succeeds via engine path | Dev log shows "engine path" | Yes |
| User with one actor | Identity resolves to that actor | actorId matches vc.actors.id | Yes |
| User with multiple actors (user + vport) | Identity resolves to saved preference or user actor | Correct actor active | Yes |
| User with vport actor | Identity has vportType, ownerActorId | Vport dashboard accessible | Yes |
| Actor switching | switchActor() updates context + storage | New actor visible in UI immediately | Yes |
| Route protection | ProtectedRoute redirects when no user | /login reached when unauthenticated | Yes |
| Complete profile gate | Redirects to /onboarding when incomplete | Onboarding screen reached | Yes |
| Logout/login round trip | Identity clears then resolves fresh | No stale identity after re-login | Yes |
| Broken provisioning RPC | Login still works via legacy | Feed loads, console warning | No |
| Missing platform app row | Self-healing fails gracefully | Legacy path takes over | No |
| Duplicate actor link attempt | RPC handles idempotently | No error, no duplicate rows | Yes |

---

## 10. Final Implementation Order

1. **DB:** Insert `platform.apps` row with `key = 'vcsm'`
2. **DB:** Create `platform.provision_vcsm_identity` RPC
3. **Code:** Add `@identity` alias to `vite.config.js` + `jsconfig.json`
4. **Code:** Create `features/identity/setup.js` (stub)
5. **Code:** Create `features/identity/identityContract.js` (dev-only shape validator)
6. **Code:** Create `features/identity/resolvers/vcsmIdentity.resolver.js` (stub)
7. **Code:** Create `features/identity/dal/provision.rpc.dal.js`
8. **Code:** Create `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js`
9. **Verify:** Build passes, no behavior change
10. **Code:** Add provisioning call to `onboarding.controller.js` (non-blocking)
11. **Verify:** New signup creates platform rows
12. **Code:** Add self-healing call to `identityContext.jsx` (on identity load, non-blocking)
13. **Verify:** Existing user login self-heals
14. **Code:** Fill `vcsmIdentity.resolver.js` with real resolver
15. **Code:** Update `setup.js` to configure engine with resolver
16. **Code:** Call `setupVcsmIdentityEngine()` in `main.jsx`
17. **Code:** Add engine-first path to `identity.controller.js`
18. **Verify:** Engine path fires for users with platform rows
19. **Verify:** Legacy fallback fires for users without platform rows
20. **Verify:** Identity shape assertion passes both paths
21. **Code:** Restructure `identityContext.jsx` to wrap engine (Phase 3)
22. **Verify:** Full smoke test — login, feed, post, chat, switch actor, logout, login
23. **Code:** Add platform-backed actor switching (Phase 4)
24. **Verify:** Actor switch persists across page reload without localStorage

---

## 11. Implementation Summary

- **Best lowest-risk starting point:** Add `@identity` alias + create scaffold files (steps 3-9). Zero behavior change.
- **First behavior-changing step:** Add provisioning call to `onboarding.controller.js` (step 10). Non-blocking — if it fails, legacy works.
- **Most dangerous step:** Restructure `identityContext.jsx` to wrap engine (step 21). This is where `useIdentity()` internals change. Must be preceded by shape assertion and thorough testing.
- **Phase that unlocks the most value:** Phase 2 (engine-first resolution). Once this works, VCSM and Wentrex share the same identity resolution path.
- **Biggest compatibility risk:** `useIdentity()` shape change. Mitigated by identity contract assertion (Phase 0.5) that catches regressions immediately.
- **Biggest reason this plan is safe:** Every phase has a rollback strategy. Legacy path is never removed — only deprioritized. Self-healing pattern is proven in Wentrex. All new code is additive before it becomes active.

### Top 5 checkpoints where you should stop and verify

1. **After step 9** — build passes, zero behavior change confirmed
2. **After step 11** — new signup creates platform rows (verify in DB)
3. **After step 13** — existing user login self-heals (verify in DB)
4. **After step 20** — engine path and legacy fallback both produce correct identity shape
5. **After step 22** — full smoke test passes with engine-wrapped identity context
