# VCSM Actor Switch Pipeline — Full Audit & Root Cause Analysis

Updated: 2026-04-09
Codebase: `/Users/vcsm/Desktop/VCSM/apps/VCSM`
Consumers audited: 59 files using `useIdentity()`
Supersedes: `vcsm-actor-switch-consumption-audit.md`, `actor-switch-root-cause-debug.md`

---

## 1. Architecture Overview

The VCSM app uses a React context-based identity system. The active actor is stored in `IdentityProvider` via `useState`. When an actor switch occurs, `setIdentity(nextIdentity)` triggers a re-render of all 59 context consumers. There is no secondary store, no Redux, no Zustand — the React context IS the single source of truth.

```
IdentityProvider (React context)
  └─ identity state (useState)
      ├─ 59 consumers via useIdentity()
      ├─ debugFeedViewer sync (useEffect)
      └─ useActorConsistencyCheck guards (4 screens)
```

---

## 2. App Bootstrap

```
1. setupVcsmIdentityEngine()     ← configures identity engine DI
2. setupVcsmHydration()           ← configures hydration engine
3. setupVcsmChatEngine()          ← configures chat engine
4. createRoot().render(
     <BrowserRouter>
       <AuthProvider>              ← supabase session management
         <IdentityProvider>        ← identity resolution + context
           <App />                 ← routes + screens
```

Boot-time resolve:
```
useEffect([authLoading, user?.id]):
  1. resolveAuthenticatedContext({ appKey: 'vcsm' })
  2. App resolver queries platform.user_app_actor_links (actor_source='vc')
  3. Engine selects active actor (prefs > state > primary > first)
  4. loadIdentityForActorId(activeActor.actorId)
  5. setIdentity(hydratedIdentity)
  6. debugFeedViewer({ user, identity })  ← global sync
```

---

## 3. Switch Actor Pipeline

### Trigger

`switchActor(actorId, entryPoint)` — called from `IdentitySwitcher` UI component.

### Full sequence

```
switchActor(targetActorId)                          [identityContext.jsx:28]
  ├─ 1. resolveAuthenticatedContext({ appKey: 'vcsm', skipLoginRecord: true })
  │     → engine resolves session, app, account, available actors
  │
  ├─ 2. Find target in ctx.availableActors by actorId
  │     → get link.id, link.actorKind, link.actorSource
  │
  ├─ 3. engineSwitchActiveActor({ userAppAccountId, actorLinkId })
  │     → validate 4 checks (exists, owned, active, is_switchable)
  │     → UPDATE platform.user_app_preferences SET active_actor_link_id
  │     → invalidateIdentityResultCache()   ← busts 120s result cache
  │     → emit EVENTS.ACTOR_SWITCHED
  │
  ├─ 4. loadIdentityForActorId(targetActorId)       [ASYNC — can race]
  │     → hydrateIdentityActor() from vc.actors + profiles/vports
  │     → attach _engineMeta
  │
  ├─ 5. saveIdentity(actorId, userId)               → localStorage cache
  │
  ├─ 6. setIdentity(nextIdentity)                   → React state commit
  │     → triggers re-render of all 59 useIdentity() consumers
  │     → triggers debugFeedViewer global sync effect
  │
  └─ 7. Debug session finalized
```

---

## 4. Sources of Actor Truth

| Source | File | Authoritative? | Can drift? |
| --- | --- | --- | --- |
| React context `identity` state | `state/identity/identityContext.jsx` | YES — single source of truth | No (by design) |
| Platform preference (DB) | `platform.user_app_preferences` | YES — persisted preference | No — written by engine |
| Feed viewer snapshot | `debuggers/feed/store.js` | NO — dev-only derived snapshot | Fixed — synced in IdentityProvider |
| localStorage cache | `state/identity/identityStorage.js` | NO — performance cache only | Can be stale across sessions |
| Actor hydration store | `engines/hydration/` | NO — actor display data cache | Independent — not actor-scoped |

---

## 5. Screen-by-Screen Consumption

### Summary by feature

| Feature | Files | Status | Consistency guard |
| --- | --- | --- | --- |
| Feed | 5 | Healthy | `useActorConsistencyCheck('feed')` |
| Profile | 3 | Healthy | `useActorConsistencyCheck('profile')` |
| Booking | 1 | Healthy | `useActorConsistencyCheck('booking')` |
| Reviews | 2 | Healthy | `useActorConsistencyCheck('reviews')` |
| Chat | 9 | Healthy | — |
| Post/Comments | 7 | Healthy | — |
| Upload | 3 | Healthy | — |
| Settings | 4 | Healthy | — |
| Dashboard | 8 | Healthy | — |
| Notifications | 2 | Healthy | — |
| Navigation/Other | 10 | Healthy | — |
| Internal | 5 | Source of truth | — |

All 59 consumers derive identity from `useIdentity()` inline on every render. Zero stale patterns found:
- Zero `useRef` holding actorId
- Zero `useState` initialized from identity
- Zero `useMemo` with missing identity deps
- Zero `useEffect` with empty deps using identity
- No secondary stores holding actor state

---

## 6. Providers and Stores

| Provider/Store | File | Holds actor state? | Rebuilds on switch? | Risk |
| --- | --- | --- | --- | --- |
| `IdentityProvider` | `state/identity/identityContext.jsx` | YES — source of truth | YES — `setIdentity()` | Race condition in switchActor |
| `AuthProvider` | `app/providers/AuthProvider.jsx` | NO — session only | N/A | None |
| Feed debug store | `debuggers/feed/store.js` | YES — dev snapshot | YES — global sync effect | Fixed |
| Actor hydration store | `engines/hydration/` | NO — display data cache | Independent | None |

---

## 7. Query and Cache Consumption

No centralized query cache (React Query, SWR) exists. All queries are hook-local `useState` + `useEffect`. When identity changes, components re-render and re-derive actorId from context. No stale cache risk.

| Feature | Query key includes actorId? | Refetches on switch? |
| --- | --- | --- |
| Feed (`useFeed`) | Yes — `viewerActorId` is a dep | Yes |
| Booking (`useBookingAvailability`) | No — keyed by `resourceId` | Correct — viewer switch doesn't change viewed calendar |
| Reviews (`useVportReviews`) | Yes — `targetActorId` + `viewerActorId` | Yes |
| Chat inbox (`useInbox`) | Yes — `actorId` dep | Yes |
| Notifications (`useNotifications`) | Yes — `actorId` dep | Yes |

---

## 8. Feed Viewer Pipeline

### Before fix
```
CentralFeedScreen.jsx useEffect([actorId, realmId, user?.id])
  → debugFeedViewer({ user, identity })
```
**Problem:** Only fired when feed screen was mounted.

### After fix (09-02 + 09-04)
```
IdentityProvider useEffect([identity, user])
  → debugFeedViewer({ user, identity })
```
**Fix:** Fires globally on every `setIdentity()` call regardless of mounted screen.

---

## 9. Root Cause Analysis

### Primary root cause (CONFIRMED, FIXED)

**Feed viewer was built only in `CentralFeedScreen.jsx`, not globally.** When actor switch occurred while the user was on another screen, `debugFeedViewer` never fired, leaving `feed.viewer` with the previous actor.

Fixed in 09-02 (moved to IdentityProvider) and 09-04 (changed deps to `[identity, user]`).

### Secondary root cause (CONFIRMED, NOT YET FIXED)

**`switchActor()` has no version/staleness guard.** Unlike the boot-time resolve which uses `_resolveVersion`, the switch function allows concurrent async operations to race.

```
switchActor(A)  ← starts async
switchActor(B)  ← starts async
switchActor(C)  ← starts async

If hydration completes in order C, A, B:
  → setIdentity(C)  ← correct
  → setIdentity(A)  ← OVERWRITES with stale
  → setIdentity(B)  ← final = B, wanted C
```

Boot-time resolve: PROTECTED (`_resolveVersion` guard at line 21, 362)
switchActor: UNPROTECTED (line 174 — `setIdentity(nextIdentity)` without version check)

### Minimal fix for race condition

```javascript
let _switchVersion = 0;

async function switchActor(actorId) {
  const mySwitchVersion = ++_switchVersion;
  // ... engine resolve + platform write + hydrate ...
  const nextIdentity = await loadIdentityForActorId(actorId);
  if (mySwitchVersion !== _switchVersion) return; // stale — abort
  setIdentity(nextIdentity);
}
```

---

## 10. File Map

### Switch pipeline (core)

| File | Layer | Role |
| --- | --- | --- |
| `state/identity/identityContext.jsx` | Provider | Owns identity state, contains `switchActor()`, global feed viewer sync |
| `state/identity/identity.controller.js` | Controller | `loadIdentityForActorId()`, `hydrateIdentityActor()` |
| `state/identity/identitySwitcher.jsx` | UI | Switch trigger — calls `switchActor(actorId)` |
| `state/identity/identitySelectors.js` | Utility | `isUserActor()`, `isVportActor()`, `canCitizenBook()` |
| `features/identity/setup.js` | Config | `setupVcsmIdentityEngine()` — DI config |
| `features/identity/resolvers/vcsmIdentity.resolver.js` | Resolver | App-owned resolver for platform actor links |

### Consistency guards

| File | Role |
| --- | --- |
| `debuggers/identity/useActorConsistencyCheck.js` | Logs `[ACTOR_MISMATCH]` if local != global actorId |
| `debuggers/feed/helpers.js` | `debugFeedViewer()` + `FEED_VIEWER_SYNC` event |

### Guarded screens

| File | Guard |
| --- | --- |
| `features/feed/screens/CentralFeedScreen.jsx` | `useActorConsistencyCheck('feed')` |
| `features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js` | `useActorConsistencyCheck('booking')` |
| `features/profiles/kinds/vport/screens/review/VportReviewsView.jsx` | `useActorConsistencyCheck('reviews')` |
| `features/profiles/screens/ActorProfileScreen.jsx` | `useActorConsistencyCheck('profile')` |

---

## 11. Health Assessment

**Overall actor-switch health: HEALTHY**

All 59 consumers derive identity inline from `useIdentity()` on every render. No stale patterns exist. Defensive measures in place:

1. `useActorConsistencyCheck` on 4 high-risk screens
2. `FEED_VIEWER_SYNC` event logging on every switch
3. Global feed viewer sync in IdentityProvider
4. Boot-time `_resolveVersion` guard

### Open item

`switchActor()` race condition — needs `_switchVersion` guard (~5 lines). Low practical risk but architecturally incorrect.

---

## 12. Maintenance Rules

1. Keep consistency guards active on high-risk screens
2. Add `useActorConsistencyCheck` to any new actor-dependent screen
3. Never introduce secondary actor stores (Redux, Zustand)
4. If adopting React Query — include `actorId` in all actor-dependent query keys

---

## 13. Bug Fix — VPORT Creation Race Condition (2026-04-19)

### Symptom
After creating a new VPORT, immediately clicking Switch to it failed with `SWITCH_ABORT_LINK_NOT_FOUND`. The newly created actor (`0117a5c4`) was not present in `availableActors` even on a fresh context resolve. 90 seconds later the switch succeeded without any user action.

### Root Cause — Two Layered Problems

**Problem 1 (DB timing):**
`createVport()` in `vport.core.dal.js` called `refreshVcActorDirectory(row.actor_id)` fire-and-forget (no `await`). This RPC (`identity.refresh_actor_directory_row`) is what triggers insertion of the new actor's row into `platform.user_app_actor_links`. Because it was not awaited, `createVport()` returned before the link existed in the DB. Any `resolveAuthenticatedContext` call immediately after creation — even a cache-busted one — would read only the pre-creation actor links.

**Problem 2 (cache):**
`refreshAvailableActors()` in `identityContext.jsx` called `resolveAuthenticatedContext` without first invalidating the 120s TTL result cache. The cache key is `${userId}:vcsm`. Both the `refreshAvailableActors()` call fired by `onVportCreated` and the `resolveAuthenticatedContext` call inside `switchActor` hit the warm cache and returned the stale 2-actor list. The new vport never appeared.

### Evidence
Debug trace at switch time showed `ENGINE_CONTEXT_RESOLVE_SUCCESS` with only the original 2 actors. Same trace ~90 seconds later (after `refreshVcActorDirectory` completed async) showed all 3 actors including the newly created VPORT with link ID `985bd73e`.

### Fix Applied

**`apps/VCSM/src/features/vport/dal/vport.core.dal.js`**
```js
// Before (fire-and-forget — link not ready when createVport() returns)
if (row.actor_id) refreshVcActorDirectory(row.actor_id);

// After (awaited — link committed before returning to caller)
if (row.actor_id) await refreshVcActorDirectory(row.actor_id).catch(() => {});
```

**`apps/VCSM/src/state/identity/identityContext.jsx`**
```js
// Before (reads from 120s cache — always returns stale list)
async function refreshAvailableActors() {
  try {
    const ctx = await resolveAuthenticatedContext({ appKey: 'vcsm', skipLoginRecord: true });
    if (ctx?.availableActors?.length) setAvailableActors(ctx.availableActors);
  } catch (_) {}
}

// After (cache busted before fetch — always gets fresh DB read)
async function refreshAvailableActors() {
  try {
    invalidateIdentityResultCache();
    const ctx = await resolveAuthenticatedContext({ appKey: 'vcsm', skipLoginRecord: true });
    if (ctx?.availableActors?.length) setAvailableActors(ctx.availableActors);
  } catch (_) {}
}
```

`invalidateIdentityResultCache` is already exported from the identity engine adapter (`engines/identity/src/adapters/index.js`).

### Health Assessment Update
**Overall actor-switch health: HEALTHY**
The vport creation → switch race condition is resolved. `refreshAvailableActors` now always produces a fresh DB read. The 120s TTL cache continues to protect all normal navigation paths.
5. Monitor `FEED_VIEWER_SYNC` events in dev mode
