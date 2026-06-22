# identityContext.jsx — Forensic Review

> **SUPERSEDED — 2026-05-11**
> This forensic review describes identityContext.jsx when it was 91 lines (pre-migration baseline, April 1, 2026).
> The file is now 437+ lines and includes version guards, ownership guards, blockedVport computation, and self-heal logic.
> **Current state:** `vcsm.identity.context-file-map.md` and `vcsm.identity.login-pipeline-trace.md`

**File:** `apps/VCSM/src/state/identity/identityContext.jsx`
**Lines:** 91 (pre-migration — see supersession note above)
**Date reviewed:** 2026-04-01
**Source of truth:** Real code inspection

---

## 1. File Overview

**Path:** `apps/VCSM/src/state/identity/identityContext.jsx`

**Exports:**
- `IdentityProvider` — React context provider component (wraps entire app)
- `useIdentity()` — React hook returning `{ identity, loading, identityLoading, setIdentity, switchActor }`

**Purpose:** This is the single source of truth for "who is the current user and which actor are they using." Every protected feature in VCSM reads from this context. It is the most depended-upon file in the entire application.

**Why the app depends on it:** 50+ files import `useIdentity()`. Without it, the app cannot determine: which actor to scope posts/messages/follows to, what profile to display, which vport dashboard to show, or which realm to use for data queries.

**Immediate imports:**
- `useAuth` from `@/app/providers/AuthProvider` — provides `user` and `loading` from Supabase auth
- `loadDefaultIdentityForUser` from `@/state/identity/identity.controller` — loads and hydrates the preferred actor
- `loadIdentityForActorId` from `@/state/identity/identity.controller` — loads a specific actor by ID
- `loadIdentity` from `@/state/identity/identityStorage` — reads saved actorId from localStorage
- `saveIdentity` from `@/state/identity/identityStorage` — writes actorId to localStorage

---

## 2. Internal Structure

### State variables
- `identity` (useState, null) — the hydrated identity object for the current actor
- `loading` (useState, true) — whether identity is being resolved

### Context value exposed
```javascript
{
  identity,           // hydrated actor object or null
  loading,            // boolean
  identityLoading,    // alias for loading (backward compatibility)
  setIdentity,        // raw setState (escape hatch)
  switchActor,        // async function (actorId) => void
}
```

### Main effect (lines 30-71)
Triggers on: `[authLoading, user?.id]`

Flow:
1. If `authLoading` → set loading=true, wait
2. If no `user?.id` → clear identity, set loading=false
3. Otherwise:
   - Set loading=true
   - Call `loadDefaultIdentityForUser({ userId: user.id, savedActorId: loadIdentity() })`
   - Set identity to result, set loading=false
   - On error: clear identity, set loading=false
4. Cleanup: `cancelled` flag prevents stale updates

### switchActor function (lines 16-28)
- Takes `actorId`
- Calls `loadIdentityForActorId(actorId)` — fetches and hydrates the actor
- If successful: saves to localStorage, sets identity state
- On error: logs warning, does not change state

### Initialization flow
```
App boot → AuthProvider hydrates session → user becomes available
  → IdentityProvider effect fires → loadDefaultIdentityForUser()
    → lists owned actors → picks preferred → hydrates → sets identity
  → loading becomes false → children render
```

### Error flow
- If identity load fails: identity is null, loading is false
- Consumers must handle `identity === null` (most do via early return or loading check)

### No explicit refresh mechanism
- Identity reloads when `user?.id` changes (login/logout)
- No manual refresh function exposed — consumers cannot force reload
- `setIdentity` is exposed as a raw escape hatch but should not be used for normal reload

---

## 3. Downstream Dependency Trace

### identity.controller.js
**Path:** `apps/VCSM/src/state/identity/identity.controller.js`

| Function | Used by identityContext for | DB reads | Writes |
|----------|---------------------------|----------|--------|
| `loadDefaultIdentityForUser({ userId, savedActorId })` | Main identity load on session start | vc.actor_owners (with nested actors join), then hydration queries | None |
| `loadIdentityForActorId(actorId)` | switchActor() | vc.actors, then hydration queries | None |
| `hydrateIdentityActor(actor)` | Called by both above | vc.realms, profiles, vc.actor_privacy_settings, vc.vports, vc.actor_owners | None |

**Internal helpers:**
- `mapProfileActor(actor, profile, realmId)` — maps user actor to identity shape
- `mapVportActor(actor, vport, realmId)` — maps vport actor to identity shape
- `resolveRealmId(actor)` — queries vc.realms by void state, fallback to first realm

**Actor selection priority in loadDefaultIdentityForUser:**
1. `savedActorId` (from localStorage) — if it exists among owned actors
2. First actor with `kind === 'user'`
3. First actor in the list

### identity.read.dal.js
**Path:** `apps/VCSM/src/state/identity/identity.read.dal.js`

| DAL Function | Table | Schema | Purpose |
|---|---|---|---|
| `listOwnedActorRowsByUserDAL(userId)` | `actor_owners` + nested `actors` | vc | List all actors owned by user |
| `readIdentityActorByIdDAL(actorId)` | `actors` | vc | Fetch single actor |
| `readPreferredRealmByVoidStateDAL(isVoid)` | `realms` | vc | Find realm matching void state |
| `readFallbackRealmDAL()` | `realms` | vc | First realm as fallback |
| `readProfileIdentityDAL(profileId)` | `profiles` | public | Full profile columns |
| `readActorPrivacyDAL(actorId)` | `actor_privacy_settings` | vc | Privacy flag |
| `readVportIdentityDAL(vportId)` | `vports` | vc | Full vport columns |
| `readActorOwnerUserDAL(actorId)` | `actor_owners` | vc | Find owner user_id |
| `readUserActorByProfileIdDAL(profileId)` | `actors` | vc | Find user actor for a profile |

**Uses two Supabase clients:**
- `supabase` — for `public.profiles`
- `vc` — for all `vc.*` schema tables (from `@/services/supabase/vcClient`)

### identityStorage.js
**Path:** `apps/VCSM/src/state/identity/identityStorage.js`

| Function | Purpose |
|---|---|
| `saveIdentity(actorId)` | `localStorage.setItem('vc.identity.actorId', actorId)` |
| `loadIdentity()` | `localStorage.getItem('vc.identity.actorId')` — returns string or null |
| `clearIdentity()` | `localStorage.removeItem('vc.identity.actorId')` |

**Storage key:** `'vc.identity.actorId'`

---

## 4. Upstream Consumer Trace

**Total consumers: 50+ files** across every major feature.

### Core infrastructure consumers

| File | Imports | Uses | Would break if shape changes? |
|------|---------|------|------------------------------|
| `main.jsx` | `IdentityProvider` | Wraps entire app | Yes — app won't mount |
| `app/providers/index.js` | `IdentityProvider` | Re-exports | Yes |
| `state/identity/identitySwitcher.jsx` | `useIdentity` | `switchActor(actorId)` | Yes — actor switching breaks |
| `state/identity/IdentityDebugger.jsx` | `useIdentity` | `identity, loading` | No — dev only |
| `state/identity/useIdentitySync.js` | `useIdentity` | `identity.actorId` | Yes — sync breaks |

### Navigation/layout consumers

| File | Reads | Purpose |
|------|-------|---------|
| `shared/components/BottomNavBar.jsx` | `identity` | Avatar + profile link in nav |
| `learning/layout/LearningLayout.jsx` | `identity, identityLoading` | LMS layout gating |

### Feed/post consumers

| File | Reads | Purpose |
|------|-------|---------|
| `features/feed/screens/CentralFeedScreen.jsx` | `identity` | actorId + realmId for feed |
| `features/post/screens/PostDetail.view.jsx` | `identity` | actorId for reactions/ownership |
| `features/post/screens/PostFeed.screen.jsx` | `identity` | actorId for feed |
| `features/post/postcard/ui/PostCard.view.jsx` | `identity` | actorId for "is mine" check |
| `features/post/postcard/hooks/usePostReactions.js` | `identity` | actorId for reaction tracking |
| `features/post/postcard/hooks/useActorMode.js` | `identity` | kind check (user vs vport) |
| `features/post/commentcard/hooks/useCommentCard.js` | `identity` | actorId for comment ownership |
| `features/post/commentcard/hooks/useCommentThread.js` | `identity` | actorId for reply authoring |
| `features/post/commentcard/ui/CommentCard.view.jsx` | `identity` | actorId for "is mine" |
| `features/post/commentcard/ui/EditComment.jsx` | `identity` | actorId |
| `features/post/postcard/ui/EditPost.jsx` | `identity` | actorId |

### Upload consumers

| File | Reads | Purpose |
|------|-------|---------|
| `features/upload/hooks/useUploadSubmit.js` | `identity` | actorId + realmId for post creation |
| `features/upload/hooks/useResolvedActor.js` | `identity` | actorId resolution |
| `features/upload/ui/ActorPill.jsx` | `identity` | Avatar display in upload |

### Chat consumers

| File | Reads | Purpose |
|------|-------|---------|
| `features/chat/inbox/screens/InboxScreen.jsx` | `identity` | actorId for inbox |
| `features/chat/inbox/screens/ArchivedInboxScreen.jsx` | `identity` | actorId |
| `features/chat/inbox/screens/SpamInboxScreen.jsx` | `identity` | actorId |
| `features/chat/inbox/screens/RequestsInboxScreen.jsx` | `identity` | actorId |
| `features/chat/inbox/screens/settings/BlockedUsersScreen.jsx` | `identity` | actorId |
| `features/chat/inbox/hooks/useVexSettings.js` | `identity` | actorId |
| `features/chat/conversation/screen/ConversationScreen.jsx` | `identity` | actorId |
| `features/chat/conversation/screen/ConversationView.jsx` | `identity` | actorId for "is mine" messages |
| `features/chat/start/hooks/useStartConversation.js` | `identity` | actorId for DM creation |

### Dashboard/vport consumers

| File | Reads | Purpose |
|------|-------|---------|
| `features/dashboard/vport/screens/VportDashboardScreen.jsx` | `identity` | actorId |
| `features/dashboard/vport/screens/VportDashboardGasScreen.jsx` | `identity` | actorId |
| `features/dashboard/vport/screens/VportDashboardServicesScreen.jsx` | `identity` | actorId |
| `features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx` | `identity` | actorId |
| `features/dashboard/vport/screens/VportDashboardReviewScreen.jsx` | `identity` | actorId |
| `features/dashboard/vport/screens/VportDashboardCalendarScreen.jsx` | `identity` | actorId |
| `features/dashboard/vport/screens/VportSettingsScreen.jsx` | `identity` | actorId |
| `features/dashboard/flyerBuilder/screens/VportActorMenuFlyerEditorScreen.jsx` | `identity` | actorId |

### Settings consumers

| File | Reads | Purpose |
|------|-------|---------|
| `features/settings/account/hooks/useAccountController.js` | `identity` | actorId |
| `features/settings/profile/hooks/useProfileController.js` | `identity` | actorId + profile fields |
| `features/settings/privacy/ui/PrivacyTab.view.jsx` | `identity` | actorId |
| `features/settings/vports/hooks/useVportsController.js` | `identity, switchActor` | actorId + switching |

### Other consumers

| File | Reads | Purpose |
|------|-------|---------|
| `features/notifications/inbox/hooks/useNotifications.js` | `identity` | actorId for filtering |
| `features/notifications/inbox/ui/NotificationsHeader.view.jsx` | `identity` | actorId |
| `features/notifications/screen/views/NotificationsScreenView.jsx` | `identity` | actorId |
| `features/block/ui/BlockButton.jsx` | `identity` | actorId for "can't block self" |
| `features/ads/screens/VportAdsSettingsScreen.jsx` | `identity` | actorId |
| `features/professional/briefings/screen/ProfessionalBriefingsScreen.jsx` | `identity` | actorId |
| `features/onboarding/screens/OnboardingCardsView.jsx` | `identity` | actorId |
| `features/onboarding/hooks/useOnboardingVibeTags.js` | `identity` | actorId |

### What consumers actually read

**Most common field read:** `identity.actorId` — used by 45+ files
**Second most common:** `identity.realmId` — used by feed, upload, chat
**Third:** `identity.kind` — used by 5+ files for user/vport branching
**Fourth:** `identity.displayName`, `identity.username`, `identity.avatar` — used by UI display components
**Fifth:** `identity.private` — used by privacy-aware features

---

## 5. Data Contract

### Identity object shape (when resolved for a user actor)
```javascript
{
  actorId: string,          // vc.actors.id
  kind: 'user',             // always 'user'
  realmId: string | null,   // vc.realms.id
  isVoid: boolean,          // vc.actors.is_void
  displayName: string,      // profiles.display_name
  username: string,         // profiles.username
  email: string,            // profiles.email
  avatar: string,           // profiles.photo_url
  banner: string,           // profiles.banner_url
  bio: string,              // profiles.bio
  birthdate: string,        // profiles.birthdate
  age: number,              // profiles.age
  sex: string,              // profiles.sex
  isAdult: boolean,         // profiles.is_adult
  discoverable: boolean,    // profiles.discoverable
  publish: boolean,         // profiles.publish
  lastSeen: string,         // profiles.last_seen
  createdAt: string,        // profiles.created_at
  updatedAt: string,        // profiles.updated_at
  private: boolean,         // vc.actor_privacy_settings.is_private
}
```

### Identity object shape (when resolved for a vport actor)
```javascript
{
  actorId: string,          // vc.actors.id
  kind: 'vport',            // always 'vport'
  realmId: string | null,   // vc.realms.id
  isVoid: boolean,          // vc.actors.is_void
  displayName: string,      // vc.vports.name
  username: string,         // vc.vports.slug
  avatar: string,           // vc.vports.avatar_url
  banner: string,           // vc.vports.banner_url
  bio: string,              // vc.vports.bio
  isActive: boolean,        // vc.vports.is_active
  createdAt: string,        // vc.vports.created_at
  updatedAt: string,        // vc.vports.updated_at
  vportType: string,        // vc.vports.vport_type
  private: boolean,         // vc.actor_privacy_settings.is_private
  ownerActorId: string,     // resolved via actor_owners → actors lookup
}
```

### Critical contract fields (most dangerous to change)
1. `actorId` — 45+ consumers. If removed/renamed, entire app breaks.
2. `kind` — used for user/vport branching in 5+ files
3. `realmId` — used by feed, upload, chat for data scoping
4. `loading` / `identityLoading` — used by multiple components for render gating
5. `switchActor` — used by vport controller and identity switcher

### Legacy fields
- `identityLoading` is an alias for `loading` — kept for backward compatibility
- `setIdentity` is a raw escape hatch — should not be part of the contract but is exposed

### Derived vs source-of-truth
- `actorId`, `kind`, `isVoid` — from `vc.actors` (source)
- `displayName`, `username`, `avatar`, etc. — from `profiles` or `vports` (enrichment)
- `private` — from `vc.actor_privacy_settings` (enrichment)
- `realmId` — from `vc.realms` (derived by void state)
- `ownerActorId` — from `vc.actor_owners` → `vc.actors` chain (derived)

---

## 6. Full Execution Flow

### 1. App boot
- `main.jsx` renders `<AuthProvider>` wrapping `<IdentityProvider>` wrapping `<App/>`
- IdentityProvider mounts with `identity=null, loading=true`

### 2. Auth dependency
- `useAuth()` provides `{ user, loading: authLoading }`
- While `authLoading=true`: identity stays loading
- When `user` becomes available: effect fires

### 3. Identity load
- Calls `loadDefaultIdentityForUser({ userId: user.id, savedActorId: loadIdentity() })`
- `loadIdentity()` reads `localStorage['vc.identity.actorId']`
- `listOwnedActorRowsByUserDAL(userId)` → `vc.actor_owners` with nested `vc.actors` join
- Picks preferred actor: saved → user kind → first

### 4. Hydration
- `hydrateIdentityActor(actor)` called on selected actor
- Resolves realm: `vc.realms` by void state, fallback to first
- For user actors: parallel fetch `profiles` + `vc.actor_privacy_settings`
- For vport actors: parallel fetch `vc.vports` + `vc.actor_privacy_settings` + `vc.actor_owners`, then resolve owner's user actor

### 5. State publish
- Sets `identity` to hydrated object
- Sets `loading` to false
- All 50+ consumers re-render with new identity

### 6. Actor switch
- `switchActor(actorId)` called
- `loadIdentityForActorId(actorId)` → fetch actor → hydrate
- `saveIdentity(actorId)` → localStorage write
- `setIdentity(nextIdentity)` → consumers re-render

### 7. Failure behavior
- If DB fetch fails → identity=null, loading=false
- If no actors exist → identity=null (user just signed up, actor not yet created)
- If saved actor not found → falls back to user actor or first actor
- If auth and identity get out of sync → effect re-fires on user.id change

---

## 7. Persistence Trace

### Current DB reads (proven)
| Table | Schema | When |
|-------|--------|------|
| `actor_owners` | vc | Every identity load (with nested actors join) |
| `actors` | vc | Every identity load (via join), every switchActor |
| `realms` | vc | Every identity load (realm resolution) |
| `profiles` | public | Every user actor hydration |
| `actor_privacy_settings` | vc | Every actor hydration |
| `vports` | vc | Every vport actor hydration |

### Current writes (proven)
- `localStorage['vc.identity.actorId']` — on every identity load and switch

### Platform tables NOT yet used
- `platform.user_app_accounts` — not queried
- `platform.user_app_actor_links` — not queried
- `platform.user_app_preferences` — not queried
- `platform.user_app_state` — not queried

### Mismatch with migration goals
The migration plan calls for the engine's `resolveAuthenticatedContext({ appKey: 'vcsm' })` to become the primary resolution path. This would read from `platform.*` tables instead of `vc.*` for account/actor-link resolution, while keeping `vc.*` for enrichment (profile, vport, privacy).

---

## 8. Architectural Role

`identityContext.jsx` acts as **all five of these simultaneously:**

1. **State container** — holds the current identity object in React state
2. **Session bridge** — bridges Supabase auth (user/session) to app identity (actor/realm)
3. **Actor resolver** — selects which actor to use from owned actors
4. **App bootstrap coordinator** — blocks rendering until identity is resolved
5. **Selection manager** — provides switchActor for multi-actor switching

### Mixed responsibilities
- It is both a React provider AND an orchestration layer
- It combines auth listening, DB querying (indirectly), localStorage, and state management
- It is tightly coupled to `vc.*` schema through the controller and DAL

### Is it a good adapter candidate for engine migration?
**Yes.** The file is only 91 lines. Its structure (effect-based resolution + context provision) mirrors Wentrex's `WentrexIdentityContext.jsx` almost exactly. The migration would:
1. Replace the `loadDefaultIdentityForUser` call with `resolveAuthenticatedContext({ appKey: 'vcsm' })`
2. Keep `hydrateIdentityActor` as the enrichment layer (vc-specific)
3. Add self-healing for missing platform rows
4. Preserve the exact same context value shape

---

## 9. Risk Analysis

### Most fragile function
`loadDefaultIdentityForUser` — if it returns null or wrong shape, the entire app renders in a degraded state (identity=null).

### Hidden coupling
- `vc` schema client (`@/services/supabase/vcClient`) is used by the DAL but not visible from identityContext.jsx itself
- `useAuth()` dependency means auth changes can cascade into identity failures

### Stale storage risk
`localStorage['vc.identity.actorId']` can point to a deleted or transferred actor. The code handles this gracefully (falls back to user actor), but the stale ID causes an unnecessary DB query.

### Auth mismatch risk
If `user.id` changes (e.g., session refresh with different user), the effect re-fires. But there's no explicit logout cleanup in this file — `AuthProvider.logout()` handles localStorage cleanup separately.

### Multiple actor edge cases
- User with 0 actors: identity=null (onboarding not complete)
- User with 1 actor: always selected
- User with N actors: saved preference → user kind → first

### Race condition
The `cancelled` flag prevents stale updates, but there's a window between auth change and identity resolution where `loading=true` and `identity=null`. Components must handle this.

### Shape change risks
Any change to the identity object shape (renaming `actorId` to `id`, removing `identityLoading`, etc.) would break 50+ files simultaneously.

### Top 10 files most coupled to identityContext

1. `features/feed/screens/CentralFeedScreen.jsx` — reads actorId + realmId
2. `features/upload/hooks/useUploadSubmit.js` — reads actorId + realmId for post creation
3. `features/chat/conversation/screen/ConversationView.jsx` — reads actorId for message ownership
4. `features/chat/inbox/screens/InboxScreen.jsx` — reads actorId for inbox
5. `features/settings/vports/hooks/useVportsController.js` — reads identity + switchActor
6. `features/post/postcard/ui/PostCard.view.jsx` — reads actorId for "is mine"
7. `features/notifications/inbox/hooks/useNotifications.js` — reads actorId
8. `features/dashboard/vport/screens/VportDashboardScreen.jsx` — reads actorId
9. `shared/components/BottomNavBar.jsx` — reads identity for nav avatar
10. `state/identity/identitySwitcher.jsx` — uses switchActor

---

## 10. Engine Migration Readiness

### VCSM-specific parts (must stay in app)
- `hydrateIdentityActor` — enriches with vc.vports, vc.actor_privacy_settings, profiles
- `mapProfileActor`, `mapVportActor` — vc-specific shape mapping
- `resolveRealmId` — queries vc.realms
- `readVportIdentityDAL`, `readActorPrivacyDAL` — vc schema queries

### Generic identity concerns (should delegate to engine)
- Session user resolution → engine's `resolveSessionUser`
- App access check → engine's `resolveUserAppAccess`
- Account resolution → engine's `resolveUserAppAccount`
- Actor link listing → engine's `resolveAvailableActors`
- Active actor selection → engine's `resolveActiveActor`
- Preferences read/write → engine's preferences DAL

### What identityContext should become
A wrapper that:
1. Calls engine's `resolveAuthenticatedContext({ appKey: 'vcsm' })`
2. Extracts `activeActor.actorId` from engine output
3. Calls existing `hydrateIdentityActor()` for vc-specific enrichment
4. Returns the existing identity shape unchanged

### Fields/functions that must remain stable during migration
1. `identity.actorId` — 45+ consumers
2. `identity.kind` — user/vport branching
3. `identity.realmId` — data scoping
4. `loading` / `identityLoading` — render gating
5. `switchActor(actorId)` — actor switching

---

## 11. Executive Summary

**What identityContext really does:** Bridges Supabase auth → vc.* actor resolution → React context. Provides the current actor identity to 50+ files across every feature.

**Why it is critical:** It is the single point through which the entire app knows who the user is and which actor they are acting as. If it breaks, every feature breaks.

**Main imported dependencies:**
- `useAuth` (AuthProvider) — provides `user.id`
- `identity.controller.js` — `loadDefaultIdentityForUser`, `loadIdentityForActorId`
- `identityStorage.js` — `loadIdentity`, `saveIdentity` (localStorage)

**Main app consumers:** 50+ files across feed, post, chat, notifications, settings, dashboard, upload, social, booking, learning, onboarding, professional, ads, block.

**Current contract shape:** `{ identity: { actorId, kind, realmId, displayName, username, avatar, ... }, loading, identityLoading, setIdentity, switchActor }`

**Biggest risk if modified:** Shape change to `identity` object breaks 50+ files simultaneously. The field `actorId` is the most critical — it appears in every consumer.

**Best safe place to start migration:** Add engine resolution as a new code path inside `identity.controller.js` → `loadDefaultIdentityForUser()`, with fallback to existing vc.* path. This changes internal resolution without touching the context shape or any consumer.

**Top 15 files to inspect next for identity migration:**
1. `state/identity/identity.controller.js` — resolution logic
2. `state/identity/identity.read.dal.js` — all vc.* queries
3. `state/identity/identityStorage.js` — localStorage persistence
4. `state/identity/identitySwitcher.jsx` — actor switching UI
5. `state/identity/identitySelectors.js` — pure selectors
6. `app/providers/AuthProvider.jsx` — auth context
7. `app/guards/ProtectedRoute.jsx` — auth guard
8. `features/auth/screens/CompleteProfileGate.jsx` — onboarding gate
9. `features/auth/controllers/onboarding.controller.js` — actor creation point
10. `features/auth/controllers/createUserActor.controller.js` — RPC create_actor_for_user
11. `main.jsx` — provider mounting order
12. `services/supabase/vcClient.js` — vc schema client
13. `features/feed/screens/CentralFeedScreen.jsx` — highest-impact consumer
14. `features/chat/conversation/screen/ConversationView.jsx` — chat identity usage
15. `features/settings/vports/hooks/useVportsController.js` — switchActor consumer

**Top 5 fields/functions that must not break:**
1. `identity.actorId` — used by 45+ files
2. `identity.kind` — branching logic
3. `identity.realmId` — data scoping
4. `loading` — render gating
5. `switchActor()` — multi-actor switching

**Classification:** `identityContext.jsx` is primarily a **bootstrap coordinator + state container**. It is NOT a resolver itself — it delegates resolution to `identity.controller.js`. This clean separation makes it an excellent migration target: the controller can be swapped to engine-backed resolution while the context wrapper remains stable.
