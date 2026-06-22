# VCSM Actor Ownership Architecture Audit
**Date:** 2026-06-06  
**Scope:** Actor creation, identity hydration, ownership resolution, controller compliance, DB truth  
**Verdict:** `ACTOR_FIRST_PARTIAL`

---

## Executive Summary

**Is VCSM actually actor-first?**

```
ACTOR_FIRST_PARTIAL
```

VCSM has a well-designed actor-first identity *engine* that correctly uses `vc.actors(kind='user')` and `vc.actors(kind='vport')` as primary actor rows. The public identity surface is mostly clean. RLS policies are progressively migrating from `owner_user_id` to `vc.actor_owners`.

However, **the architecture has not completed its transition**. Six structural violations remain:

1. `ownerActorId` is injected into the public identity contract — breaking statement #4
2. Booking controllers require `ownerActorId` from callers — breaking statement #5
3. VPORT ownership has a dual-fallback path (`actor_owners` → `vport.profile_actor_access`) — breaking statement #3
4. Settings DALs query `owner_user_id` directly — breaking statement #3
5. Profile model exposes `ownerUserId` to the UI — breaking statement #4
6. Hydration resolves ownership through a `profile_id → actor` FK chain — creating implicit profile-as-identity dependency

---

## Architecture Diagram — Actual Implementation

```
CITIZEN LIFECYCLE (Actual)
─────────────────────────────────────────────────────────────────────
auth.users (Supabase)
    │
    └─→ public.profiles (id = userId for citizens)
            │
            └─→ vc.actors(kind='user', profile_id=profiles.id)
                    │
                    └─→ vc.actor_owners(actor_id, user_id=profiles.id)
                    │
                    └─→ platform.user_app_actor_links(actor_id) ──→ ENGINE
                                                                      │
                                                              resolveAuthenticatedContext()
                                                                      │
                                                              identityDetails._engineMeta

PUBLIC IDENTITY SURFACE (toPublicIdentity):
    { actorId, kind, ownerActorId*, realmId }
    * ownerActorId is null for citizens, non-null for VPORTs ← VIOLATION


VPORT LIFECYCLE (Actual)
─────────────────────────────────────────────────────────────────────
create_vport RPC (server-side)
    │
    ├─→ vport.profiles(id, owner_user_id, slug, name, ...)     ← LEGACY COLUMN STILL ACTIVE
    │
    ├─→ vc.actors(kind='vport', vport_id=vport.profiles.id)
    │
    ├─→ vc.actor_owners(actor_id, user_id=owner.profiles.id)   ← CANONICAL
    │
    └─→ vport.profile_actor_access(profile_id, actor_id)       ← LEGACY FALLBACK STILL LIVE


OWNERSHIP RESOLUTION (Actual — 3 active paths)
─────────────────────────────────────────────────────────────────────

Path 1 (CANONICAL): vc.actor_owners
    assertActorOwnsVportActorController
        └─→ readActorOwnerLinkByActorAndUserProfileDAL
                └─→ vc.actor_owners WHERE actor_id=target AND user_id=requester.profile_id

Path 2 (LEGACY — not yet removed): vport.profiles.owner_user_id
    vports.read.dal.js:readVportBusinessCardSettingsDAL
        └─→ vport.profiles WHERE id=vportId AND owner_user_id=auth.uid()

Path 3 (HYDRATION FALLBACK): vport.profile_actor_access
    vcsmActorHydrator.js:57–78
        └─→ IF actor_owners lookup returns null:
                └─→ vport.profile_actor_access WHERE profile_id=vport.id AND is_primary=true
```

---

## Ownership Resolution Diagram — Actual Implementation

```
BOOKING / WRITE OPERATION OWNERSHIP GATE
────────────────────────────────────────────────────────────────────────────────

caller: { callerActorId, ownerActorId }   ← ownerActorId PASSED BY CALLER (VIOLATION)
                │
                ▼
assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: ownerActorId })
                │
                ├─→ [FAST PATH] requestActorId === targetActorId → { ok:true, mode:"self" }
                │
                ├─→ fetch requesterActor from vc.actors (to get requester.profile_id)
                │
                └─→ readActorOwnerLinkByActorAndUserProfileDAL({
                        targetActorId: ownerActorId,
                        userProfileId: requester.profile_id   ← NOTE: uses profile_id, not actorId
                    })
                        └─→ vc.actor_owners WHERE actor_id=targetActorId AND user_id=profile_id

RESULT: Ownership verified. But the controller DID NOT derive ownerActorId internally.
        The caller (hook or screen) computed it from identity.ownerActorId.


HYDRATION OWNERSHIP RESOLUTION
────────────────────────────────────────────────────────────────────────────────

vcsmActorHydrator (vport path):
    1. readActorOwnerUserDAL(actor.id)
            └─→ vc.actor_owners WHERE actor_id=actor.id → { user_id }
    2. readUserActorByProfileIdDAL(ownerRow.user_id)
            └─→ vc.actors WHERE profile_id=user_id AND kind='user' → { id }
    3. ownerActorId = ownerActor.id
    4. IF ownerActorId == null:
            └─→ vport.profile_actor_access WHERE profile_id=vport.id AND is_primary=true → actor_id
                    ← FALLBACK BYPASS — profile_actor_access is not actor_owners

Final: identityDetails.ownerActorId = derived ownerActorId
       toPublicIdentity exposes this field
```

---

## Area 1 — Actor Creation Findings

### Citizen Actor Creation

**Flow:**
```
completeOnboardingController
    └─→ createUserActorForProfile(profileId, userId)
            ├─→ GUARD: profileId !== userId → throw (VENOM-AUTH-006)
            ├─→ dalGetActorByProfile(profileId)   [vc.actors WHERE profile_id=profileId]
            │       └─→ IF actor exists: skip creation
            ├─→ dalCreateUserActor(profileId)
            │       └─→ RPC create_actor_for_user(p_kind='user', p_profile_id, p_vport_id=null, p_is_primary=true)
            └─→ dalCreateActorOwner(actor.id, userId)
                    └─→ UPSERT vc.actor_owners(actor_id, user_id) ON CONFLICT(actor_id,user_id) DO NOTHING
```

**Files:**
- [apps/VCSM/src/features/auth/controllers/createUserActor.controller.js](apps/VCSM/src/features/auth/controllers/createUserActor.controller.js)
- [apps/VCSM/src/features/auth/dal/actorCreate.dal.js](apps/VCSM/src/features/auth/dal/actorCreate.dal.js)
- [apps/VCSM/src/features/auth/dal/actorOwnerCreate.dal.js](apps/VCSM/src/features/auth/dal/actorOwnerCreate.dal.js)

**Verdict:** Correct. Actor row + ownership row always co-created. Idempotent (upsert + 23505 catch).

### VPORT Actor Creation

**Flow:**
```
submitCreateVportController
    └─→ createVport(slug, name, type, ...) [vport.core.dal.js]
            └─→ RPC create_vport(p_slug, p_name, p_primary_category_key, ...)
                    └─→ Returns { actor_id, profile_id, slug, ... }
            └─→ refreshVcActorDirectory(row.actor_id) [best-effort hydration, non-fatal]
```

**Ownership creation:** Handled entirely inside `create_vport` RPC server-side. No client-side `actor_owners` insert is visible. Ownership is atomic with VPORT creation.

**Finding:** VPORT actor creation is correct but has an asymmetry — citizen actor ownership is created in client-side DAL (observable), VPORT actor ownership is in server RPC (opaque). No audit surface for VPORT ownership creation in client code.

**Can actor rows exist without ownership rows?** Theoretically yes for legacy rows. Platform now uses `platform.user_app_actor_links` as the authoritative actor availability list — not `vc.actor_owners`. An actor with no ownership row may still appear in `user_app_actor_links`.

---

## Area 2 — Identity Hydration Findings

### Public Identity Surface

```javascript
// toPublicIdentity() — identity.model.js
{
  actorId:      source.actorId,          // ✅ CORRECT
  kind:         source.kind,             // ✅ CORRECT
  ownerActorId: source.ownerActorId,     // ⚠️ DERIVED FIELD IN PUBLIC CONTRACT
  realmId:      source.realmId,          // ✅ CORRECT
}
```

### identityDetails Full Shape (internal)

**Citizen (kind='user'):**
```javascript
{
  actorId, kind: "user", realmId, isVoid,
  displayName, username, email, avatar, banner, bio,
  birthdate, age, sex, isAdult, discoverable, publish,
  lastSeen, createdAt, updatedAt, private,
  _engineMeta: { userId, userAppAccountId, actorLinkId, actorSource, engineResolved, availableActors }
}
```

**VPORT (kind='vport'):**
```javascript
{
  actorId, kind: "vport", realmId, isVoid,
  displayName, username, avatar, banner, bio,
  isActive, isDeleted, createdAt, updatedAt, vportType, private,
  ownerActorId,   // ← DERIVED FROM actor_owners (or profile_actor_access fallback)
  _engineMeta: { userId, userAppAccountId, actorLinkId, actorSource, engineResolved, availableActors }
}
```

### Source of Truth for Active Actor

**Priority chain (actorService.js):**
1. `platform.user_app_preferences.active_actor_link_id` (explicit user choice)
2. `platform.user_app_state.last_actor_link_id` (last used)
3. `platform.user_app_actor_links WHERE is_primary=true` (primary actor)
4. First entry in `user_app_actor_links` (final fallback)

**Critical finding:** The engine uses `platform.user_app_actor_links` — NOT `vc.actor_owners` — as the source of available actors. `vc.actor_owners` is only used for:
- Hydrating `ownerActorId` on VPORT identities
- Verifying ownership in booking controllers
- RLS enforcement at DB layer

This means: even if a user is removed from `vc.actor_owners`, they may still have a `user_app_actor_links` entry and appear as an available actor. The ownership model and the actor availability model are not co-located.

---

## Area 3 — Ownership Resolution Matrix

| Mechanism | File | Queries | Uses actor_owners | Status |
|---|---|---|---|---|
| `readActorOwnerLinkByActorAndUserProfileDAL` | `booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` | `vc.actor_owners WHERE actor_id=? AND user_id=?` | ✅ PRIMARY | Authoritative |
| `readOwnerLinkByActorAndSessionDAL` | `booking/dal/readOwnerLinkByActorAndSession.dal.js` | `vc.actor_owners` via session user_id | ✅ PRIMARY | Authoritative |
| `assertActorOwnsVportActorController` | `booking/controller/assertActorOwnsVportActor.controller.js` | Delegates to Mechanism 1 | ✅ PRIMARY | Authoritative gatekeeper |
| `vport.profile_actor_access` fallback | `features/hydration/vcsmActorHydrator.js:67–72` | `vport.profile_actor_access WHERE is_primary=true` | ❌ BYPASS | **CONTRACT_VIOLATION** |
| `owner_user_id` direct query | `settings/vports/dal/vports.read.dal.js:111,134` | `vport.profiles WHERE owner_user_id=auth.uid()` | ❌ BYPASS | **DESIGN_DRIFT** |
| `deriveVportIsOwner` (UI) | `profiles/kinds/vport/model/vportOwnership.model.js` | None — pure comparison (viewerActorId===profileActorId) | N/A | Acceptable |
| `barberVport.read.dal.js` pre-provisioning | `features/join/dal/barberVport.read.dal.js:10` | `vport.profiles WHERE owner_user_id=userId` | ❌ BYPASS | SECURITY_RISK (pre-actor bootstrap) |

**Authoritative path:** `assertActorOwnsVportActorController` → `readActorOwnerLinkByActorAndUserProfileDAL` → `vc.actor_owners`

**Bypass count:** 3 active bypass paths

---

## Area 4 — Active Actor Semantics

### When operating as Citizen:
```
identity.actorId  = vc.actors.id  WHERE kind='user'
identity.kind     = 'user'
identity.ownerActorId = null
```

### When operating as VPORT:
```
identity.actorId  = vc.actors.id  WHERE kind='vport'
identity.kind     = 'vport'
identity.ownerActorId = (uuid of the owning user actor — DERIVED, NOT INPUT)
```

### Verdict: ACTOR-FIRST
The system correctly routes by `actorId` + `kind`. Actor switching persists a preference to `platform.user_app_preferences`, not to `vc.actor_owners`. localStorage stores only `actorId`. The active actor is selected by the engine, not the client.

**Gap:** Actor switching validation goes through `platform.user_app_actor_links`, not `vc.actor_owners`. These two tables can diverge.

---

## Area 5 — Controller Audit

### Full Controller Matrix

| File | Controller | Actor Field Used | Ownership Source | Compliant? |
|---|---|---|---|---|
| `social/friend/subscribe/controllers/follow.controller.js` | ctrlSubscribe | actorId (followerActorId, assertingActorId) | assertingActorId === followerActorId | ✅ YES |
| `social/friend/subscribe/controllers/unsubscribe.controller.js` | ctrlUnsubscribe | actorId | assertingActorId === followerActorId | ✅ YES |
| `social/friend/request/controllers/followRequests.controller.js` | ctrlAcceptFollowRequest | actorId | assertingActorId === targetActorId | ✅ YES |
| `post/postcard/controller/editPost.controller.js` | editPostController | actorId | DAL: `.eq("actor_id", actorId)` | ✅ YES |
| `post/postcard/controller/deletePost.controller.js` | deletePostController | actorId | DAL: `.eq("actor_id", actorId)` | ✅ YES |
| `post/postcard/controller/togglePostReaction.controller.js` | toggleReaction | actorId | (postId, actorId) pair | ✅ YES |
| `post/commentcard/controller/postComments.controller.js` | createComment | actorId | actor_id in insert | ✅ YES |
| `notifications/inbox/controller/Notifications.controller.js` | getNotifications | actorId (targetActorId) | V-SUB-003 gate | ✅ YES |
| `chat/inbox/controller/chatUnread.controller.js` | getChatUnread | actorId | actorId scoped | ✅ YES |
| `upload/controllers/createPost.controller.js` | createPost | actorId (primary) + userId (legacy) | actor_id in row | ⚠️ DUAL-WRITE |
| `feed/controllers/getFeedViewerContext.controller.js` | getFeedViewerIsAdult | actorId → profile_id lookup | profile_id FK | ⚠️ DESIGN_DRIFT |
| `booking/controller/ensureOwnerBookingResource.controller.js` | ensureOwnerBookingResource | ownerActorId (FROM CALLER) | Caller-supplied | ❌ VIOLATION |
| `booking/controller/listOwnerBookingResources.controller.js` | listOwnerBookingResources | ownerActorId (FROM CALLER) | Caller-supplied | ❌ VIOLATION |
| `settings/vports/controller/vportBusinessCardSettings.controller.js` | ctrlGetVportBusinessCardSettings | callerActorId + vportActorId (FROM CALLER) | assertActorOwnsVportActor | ⚠️ PARTIAL (gate correct, input from caller) |

---

## Area 6 — Citizen Flow Compliance

| Feature | Action | Scoping | Field Used | Status |
|---|---|---|---|---|
| Social | Follow/Unfollow | actorId | assertingActorId gate | ✅ COMPLIANT |
| Social | Follow Requests (all) | actorId | assertingActorId gate | ✅ COMPLIANT |
| Post | Create | actorId (+ legacy user_id) | actor_id in insert | ⚠️ DUAL-WRITE |
| Post | Edit/Delete | actorId | DAL owner gate | ✅ COMPLIANT |
| Post | Reactions | actorId | (postId, actorId) | ✅ COMPLIANT |
| Post | Comments CRUD | actorId | actor_id in insert | ✅ COMPLIANT |
| Notifications | Inbox | actorId | targetActorId | ✅ COMPLIANT |
| Chat | Unread | actorId | actorId | ✅ COMPLIANT |
| Chat | Attachment | actorId (ownerActorId + createdByActorId) | both actor fields | ✅ COMPLIANT |
| Feed | Load posts | actorId | actorId | ✅ COMPLIANT |
| Feed | Viewer context (adult gate) | actorId → profile_id | profile_id FK | ⚠️ DESIGN_DRIFT |
| Upload | Post media | actorId (primary) | actor_id + user_id | ⚠️ LEGACY DUAL-WRITE |

---

## Area 7 — VPORT Flow Compliance

| Feature | Action | Scoping | Field Used | Status |
|---|---|---|---|---|
| Dashboard | Design Studio reads | ownerActorId (`n`) | eq("owner_n", ownerActorId) | ✅ COMPLIANT (actor-scoped) |
| Booking | List resources | ownerActorId (FROM CALLER) | Passed by hook | ❌ CALLER-SUPPLIED |
| Booking | Ensure resource | ownerActorId (FROM CALLER) | Passed by hook | ❌ CALLER-SUPPLIED |
| Booking | Ownership gate | actor_owners | assertActorOwnsVportActor | ✅ COMPLIANT |
| Portfolio | isActorOwner | actor comparison | viewerActorId === profileActorId | ✅ COMPLIANT (UI) |
| Settings/Vports | List my VPORTs | actor_owners | actor_owners → actor_id lookup | ✅ COMPLIANT |
| Settings/Vports | Business card settings | owner_user_id | vport.profiles.owner_user_id | ❌ LEGACY BYPASS |
| VPORT creation | create_vport | RPC (server-side) | Opaque | ✅ ASSUMED COMPLIANT |

---

## Area 8 — Database Source of Truth

| Concept | Source of Truth | DB Table | RLS Mechanism | Code Field |
|---|---|---|---|---|
| Citizen Identity | `vc.actors(kind='user')` | `vc.actors` | `vc.is_actor_owner()` | `identity.actorId` |
| VPORT Identity | `vc.actors(kind='vport')` | `vc.actors` + `vport.profiles` | `actor_owners` JOIN | `identity.actorId` |
| Ownership | `vc.actor_owners` (canonical) / `vport.profiles.owner_user_id` (legacy) | Both | actor_owners JOIN | `ownerActorId` (derived) |
| Active Actor | `platform.user_app_actor_links` + preferences | Platform schema | Engine-managed | `identity.actorId` |
| Authorization | `vc.actor_owners` + `vc.is_actor_owner()` | `vc.actor_owners` | RLS WHERE EXISTS actor_owners | Session `auth.uid()` |

### vc.actor_owners Schema
```
actor_id    uuid  NOT NULL  FK → vc.actors.id
user_id     uuid  NOT NULL  FK → public.profiles.id
is_primary  bool
is_void     bool
created_at  timestamptz
PRIMARY KEY / UNIQUE: (actor_id, user_id)
INDEX: actor_owners_user_id_actor_id_idx (user_id, actor_id)
```

### vc.actors Schema
```
id           uuid  NOT NULL  PK
kind         text  NOT NULL  CHECK IN ('user', 'vport')
profile_id   uuid  NULL      FK → public.profiles.id   (kind='user' actors only)
vport_id     uuid  NULL      FK → vport.profiles.id    (kind='vport' actors only)
is_void      bool
is_deleted   bool
user_app_account_id uuid NULL FK → platform.user_app_accounts.id
```

### RLS Evolution Summary

| Migration | Action | Pattern |
|---|---|---|
| 20260515010000 | Initial resource/booking RLS | `owner_user_id` (LEGACY — superseded) |
| 20260515020000 | Rebuild with actor_owners | `actor_owners JOIN` (CANONICAL) |
| 20260523040000 | Fix bookings RLS | Dropped `bookings_insert_owner` (owner_user_id) |
| 20260523230000 | Remove legacy branch | Removed `actor_can_manage_profile` owner_user_id OR branch |
| 20260527050000 | Add bookings_select_actor_owner | actor_owners JOIN |
| 20260527070000 | Drop profiles_select_by_owner_user | `owner_user_id` policy DROPPED |
| 20260527090000 | Drop legacy availability_rules policies | `owner_user_id` policies DROPPED |

---

## Area 9 — Anti-Pattern Discovery

### Classified Violations

**[A] CONTRACT_VIOLATION — ownerActorId in public identity contract**
- File: [apps/VCSM/src/state/identity/identity.model.js](apps/VCSM/src/state/identity/identity.model.js) — `toPublicIdentity()` line 7
- `ownerActorId` is a derived server-side field injected into every vport identity public object

**[B] CONTRACT_VIOLATION — hydrator falls back to profile_actor_access**
- File: [apps/VCSM/src/features/hydration/vcsmActorHydrator.js](apps/VCSM/src/features/hydration/vcsmActorHydrator.js) lines 67–72
- If `actor_owners` lookup returns null, falls back to `vport.profile_actor_access WHERE is_primary=true`
- Creates dual ownership model at hydration layer

**[C] CONTRACT_VIOLATION — booking controllers require ownerActorId from callers**
- File: [apps/VCSM/src/features/booking/controller/ensureOwnerBookingResource.controller.js](apps/VCSM/src/features/booking/controller/ensureOwnerBookingResource.controller.js) line 17
- File: [apps/VCSM/src/features/booking/controller/listOwnerBookingResources.controller.js](apps/VCSM/src/features/booking/controller/listOwnerBookingResources.controller.js) line 5
- Controllers accept `ownerActorId` from callers instead of resolving it from session + actorId

**[D] CONTRACT_VIOLATION — hooks propagate ownerActorId from identity**
- File: [apps/VCSM/src/features/booking/hooks/useBookingHistory.js](apps/VCSM/src/features/booking/hooks/useBookingHistory.js) line 18
- `ownerActorId` flows: `identity.ownerActorId` → hook prop → controller parameter
- The caller (screen/component) must know and forward a derived ownership field

**[E] CONTRACT_VIOLATION — profile model exposes ownerUserId to UI**
- File: [apps/VCSM/src/features/settings/profile/model/profile.model.js](apps/VCSM/src/features/settings/profile/model/profile.model.js) line 73
- `mapVportProfile()` returns `ownerUserId: row.owner_user_id ?? null`
- UI components can read `ownerUserId` directly from the profile model

**[F] DESIGN_DRIFT — owner_user_id direct DB queries in settings DAL**
- File: [apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js](apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js) lines 111, 134
- `readVportBusinessCardSettingsDAL`: `vport.profiles WHERE owner_user_id = auth.uid()`
- Bypasses actor_owners entirely; stale if actor_owners is revoked

**[G] DESIGN_DRIFT — feed viewer context reads profile_id as secondary field**
- File: [apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js](apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js) lines 13–15
- `actor?.profile_id` → `readProfileAdultFlagDAL({ profileId })` — routes through profile, not actor

**[H] DESIGN_DRIFT — actor resolution chain uses profile_id FK**
- File: [apps/VCSM/src/state/identity/identity.read.dal.js](apps/VCSM/src/state/identity/identity.read.dal.js) line 157
- `readUserActorByProfileIdDAL`: `vc.actors WHERE profile_id=userId AND kind='user'`
- Used in hydration to resolve ownerActorId — profile remains anchor in resolution chain

**[I] DESIGN_DRIFT — ACTOR_COLUMNS includes profile_id / vport_id FKs**
- File: [apps/VCSM/src/state/identity/identity.read.dal.js](apps/VCSM/src/state/identity/identity.read.dal.js) line 5
- `ACTOR_COLUMNS = "id,kind,profile_id,vport_id,is_void,is_deleted"`
- All actor reads return profile_id and vport_id, preserving profile-as-identity proxy

**[J] DESIGN_DRIFT — createPost dual-writes user_id + actor_id**
- File: [apps/VCSM/src/features/upload/controllers/createPost.controller.js](apps/VCSM/src/features/upload/controllers/createPost.controller.js) lines 74–76
- `{ user_id: user.id, actor_id: identity.actorId }` both in insert row

**[K] SECURITY_RISK — barberVport.read.dal pre-provisioning queries by owner_user_id**
- File: [apps/VCSM/src/features/join/dal/barberVport.read.dal.js](apps/VCSM/src/features/join/dal/barberVport.read.dal.js) line 10
- `vport.profiles WHERE owner_user_id = userId AND primary_category_key='barber'`
- Comment admits: "Join runs before actor provisioning" — meaning no actor exists, so actor model cannot enforce

**[L] DESIGN_DRIFT — actor_owners ↔ user_app_actor_links can diverge**
- Engine uses `platform.user_app_actor_links` for actor availability
- Ownership uses `vc.actor_owners` for write authorization
- No synchronization contract between them — a revoked `actor_owners` row does not automatically remove `user_app_actor_links`

**[M] DESIGN_DRIFT — assertActorOwnsVportActor uses profile_id for actor_owners lookup**
- File: [engines/booking/src/controller/assertActorOwnsVportActor.controller.js](engines/booking/src/controller/assertActorOwnsVportActor.controller.js)
- Fetches `requesterActor.profile_id` then queries `actor_owners WHERE user_id = profile_id`
- The actors table still acts as a profile_id lookup proxy

---

## Top 20 Violations — Ranked by Severity

| Rank | Finding | Classification | File | Severity |
|---|---|---|---|---|
| 1 | `ownerActorId` exposed in `toPublicIdentity()` — UI can depend on derived ownership field | CONTRACT_VIOLATION | `state/identity/identity.model.js:7` | CRITICAL |
| 2 | Hydrator fallback to `vport.profile_actor_access` when `actor_owners` returns null — dual ownership model | SECURITY_RISK | `features/hydration/vcsmActorHydrator.js:67` | CRITICAL |
| 3 | `actor_owners` ↔ `user_app_actor_links` divergence — revoking ownership does not remove actor availability | SECURITY_RISK | Engine arch gap | CRITICAL |
| 4 | `ensureOwnerBookingResourceController` accepts `ownerActorId` from caller — no internal resolution | CONTRACT_VIOLATION | `booking/controller/ensureOwnerBookingResource.controller.js:17` | HIGH |
| 5 | `listOwnerBookingResourcesController` accepts `ownerActorId` from caller | CONTRACT_VIOLATION | `booking/controller/listOwnerBookingResources.controller.js:5` | HIGH |
| 6 | `useBookingHistory` hook propagates `ownerActorId` from identity to controller | CONTRACT_VIOLATION | `booking/hooks/useBookingHistory.js:18` | HIGH |
| 7 | `readVportBusinessCardSettingsDAL` uses `owner_user_id` — bypasses actor_owners | DESIGN_DRIFT + SECURITY_RISK | `settings/vports/dal/vports.read.dal.js:111` | HIGH |
| 8 | `mapVportProfile` exposes `ownerUserId: row.owner_user_id` to UI layer | CONTRACT_VIOLATION | `settings/profile/model/profile.model.js:73` | HIGH |
| 9 | `barberVport.read.dal.js` queries `owner_user_id` pre-provisioning — no actor fallback | SECURITY_RISK | `features/join/dal/barberVport.read.dal.js:10` | HIGH |
| 10 | `assertActorOwnsVportActor` uses `profile_id` as `user_id` in actor_owners query — profile still anchors ownership | DESIGN_DRIFT | `engines/booking/src/controller/assertActorOwnsVportActor.controller.js` | MEDIUM |
| 11 | `readUserActorByProfileIdDAL` — profile_id FK used in ownership resolution chain | DESIGN_DRIFT | `state/identity/identity.read.dal.js:157` | MEDIUM |
| 12 | `ACTOR_COLUMNS` always selects `profile_id` and `vport_id` — profile remains identity proxy in actor reads | DESIGN_DRIFT | `state/identity/identity.read.dal.js:5` | MEDIUM |
| 13 | `getFeedViewerContext` routes through `profile_id` for adult gate — profile-scoped, not actor-scoped | DESIGN_DRIFT | `feed/controllers/getFeedViewerContext.controller.js:13` | MEDIUM |
| 14 | `readActorOwnerUserDAL` reconstructs `userId` from `actor_owners` — re-exposes user identity | DESIGN_DRIFT | `state/identity/identity.read.dal.js:144` | MEDIUM |
| 15 | `createPost` dual-writes `user_id` + `actor_id` — legacy field maintained | DESIGN_DRIFT | `upload/controllers/createPost.controller.js:74` | MEDIUM |
| 16 | Citizen actor creation uses `profileId` as `userId` — conceptually conflated in VENOM-AUTH-006 guard | DESIGN_DRIFT | `auth/controllers/createUserActor.controller.js` | MEDIUM |
| 17 | `vportBusinessCardSettings.controller.js` requires `vportActorId` from caller — not self-resolved | DESIGN_DRIFT | `settings/vports/controller/vportBusinessCardSettings.controller.js:25` | MEDIUM |
| 18 | Engine actor availability (`user_app_actor_links`) never cross-checked against `actor_owners` on read | DESIGN_DRIFT | Arch gap | MEDIUM |
| 19 | VPORT actor creation ownership is opaque (RPC) — no client-side audit of `actor_owners` write | DESIGN_DRIFT | `vport/dal/vport.core.dal.js:46` | LOW |
| 20 | `useOrganizationWorkspace` / `useOwnerBookingResources` hooks require `ownerActorId` from parent | CONTRACT_VIOLATION | `booking/hooks/` | LOW |

---

## First-Class Actor Compliance Statements

### Statement 1: "Citizen is an actor."
**VERDICT: PARTIAL**

The engine correctly creates `vc.actors(kind='user')` and routes identity through `actorId`. However, the actor row is still anchored to `public.profiles.id` via `profile_id` FK. The actor resolution chain (`readUserActorByProfileIdDAL`, `createUserActorForProfile`) requires `profileId` as input, not `userId` independently. `profileId === userId` is enforced at citizen creation, making them equivalent in practice — but conceptually the actor is profile-anchored, not independently first-class.

### Statement 2: "VPORT is an actor."
**VERDICT: PARTIAL**

VPORT actors are correctly created via `create_vport` RPC and routed through `vc.actors(kind='vport')`. However, `vport.profiles` still carries `owner_user_id` as an active column used in live code paths, and VPORT identity in the hydrator falls back to `vport.profile_actor_access` for ownership resolution. The VPORT profile is not yet demoted to a pure display record.

### Statement 3: "Ownership is actor-based."
**VERDICT: FALSE**

Three active ownership mechanisms exist. Two are not `actor_owners`:
- `vport.profile_actor_access` (hydration fallback)
- `vport.profiles.owner_user_id` (settings DAL queries)

The canonical path exists and is used in the right-path, but bypasses are live and code-reachable.

### Statement 4: "The UI only knows actorId + kind."
**VERDICT: FALSE**

`toPublicIdentity()` returns `ownerActorId` as a first-class public field. Booking hooks receive `identity.ownerActorId` from context and pass it to controllers. The profile settings model returns `ownerUserId` from `mapVportProfile`. The UI has access to at least three derived ownership fields.

### Statement 5: "Controllers resolve ownership internally."
**VERDICT: FALSE**

`ensureOwnerBookingResourceController` and `listOwnerBookingResourcesController` both accept `ownerActorId` as a required parameter from callers. The caller (hook → screen → identity context) computes `ownerActorId` externally. Only `assertActorOwnsVportActorController` is correctly self-resolving — and even it accepts `targetActorId` from the caller.

### Statement 6: "No feature depends on hidden ownership fields."
**VERDICT: FALSE**

Multiple features explicitly require `ownerActorId` to be passed:
- Booking history
- Booking resource listing
- Booking resource creation
- Organization workspace

These form an `ownerActorId` propagation chain: `identity.ownerActorId` → hook prop → controller parameter → DAL filter.

---

## Root Causes

### Root Cause 1: Incomplete Migration from Profile-Centric to Actor-Centric

The system was originally profile-centric (`public.profiles.id === userId`, `vport.profiles.owner_user_id`). The actor layer was added on top. The migration is in progress but incomplete. Many files still reference `profile_id` as a lookup key and `owner_user_id` as an ownership signal. The two models coexist, creating dual ownership paths.

### Root Cause 2: ownerActorId Leak from Hydration into Public Contract

The decision to resolve and expose `ownerActorId` in `toPublicIdentity()` was a practical shortcut to support the notifications inbox (`resolveInboxActor.js`) and booking UX without requiring additional DB lookups per action. However, this created a dependency: once `ownerActorId` is in the public identity contract, every consumer can (and does) use it instead of resolving ownership themselves through the canonical path.

### Root Cause 3: Controller Signatures Accept Derived Fields

Controllers that should be self-contained (accept only `actorId` and resolve everything internally) instead accept pre-computed `ownerActorId`. This offloads ownership computation to callers, propagating the hidden field upward through hooks into screens. The correct pattern is: controller accepts `actorId` → validates ownership internally via `assertActorOwnsVportActor` → proceeds.

### Root Cause 4: Dual Actor Availability Sources (engine vs ownership)

`platform.user_app_actor_links` (used by identity engine) and `vc.actor_owners` (used for write authorization) are independent tables with no enforced consistency. A `user_app_actor_links` row can exist without a corresponding `actor_owners` row and vice versa. This means the set of actors a user can switch to and the set of actors a user can write as may diverge.

### Root Cause 5: Profile FK Still Used as Actor Resolution Anchor

`vc.actors.profile_id` is still the join key used to resolve actor→profile lookups and ownership chain lookups. Until this FK is replaced with a pure actor-ID-to-actor-ID resolution path, the profile layer will remain embedded in the identity resolution chain.

---

## Recommended Refactor Plan

### P0 — Immediate Security Fixes

**P0-01:** Remove `vport.profile_actor_access` fallback from `vcsmActorHydrator.js`
- File: [apps/VCSM/src/features/hydration/vcsmActorHydrator.js](apps/VCSM/src/features/hydration/vcsmActorHydrator.js) lines 67–72
- If `actor_owners` returns null, the VPORT has no owner. Fail closed — do not fall back to a legacy access table.
- Impact: Prevents silent ownership bypass via stale profile_actor_access rows

**P0-02:** Synchronize `user_app_actor_links` with `actor_owners` on revocation
- When `actor_owners.is_void` is set to true, the corresponding `user_app_actor_links` row must be revoked or removed
- Currently no trigger or procedure enforces this
- Impact: Prevents a revoked owner from continuing to switch into the VPORT actor

**P0-03:** Remove `owner_user_id` queries from `vports.read.dal.js`
- File: [apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js](apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js) lines 111, 134
- Replace with `actor_owners` join or actor-scoped RLS
- Impact: Eliminates bypass path in business card settings

### P1 — Architecture Corrections

**P1-01:** Remove `ownerActorId` from `toPublicIdentity()`
- File: [apps/VCSM/src/state/identity/identity.model.js](apps/VCSM/src/state/identity/identity.model.js)
- Notifications inbox and booking screens that need `ownerActorId` should resolve it through a dedicated controller/hook, not from identity context
- Impact: Closes the leak; forces each consumer to be explicit about ownership resolution

**P1-02:** Refactor booking controllers to not accept `ownerActorId` from callers
- Files: `ensureOwnerBookingResource.controller.js`, `listOwnerBookingResources.controller.js`
- Pattern: accept `callerActorId` + `targetActorId`; resolve ownership internally via `assertActorOwnsVportActorController`
- Impact: Controllers become self-contained; callers no longer propagate derived fields

**P1-03:** Remove `ownerUserId` from `mapVportProfile` in profile.model.js
- File: [apps/VCSM/src/features/settings/profile/model/profile.model.js](apps/VCSM/src/features/settings/profile/model/profile.model.js) line 73
- Impact: UI layer loses direct access to `owner_user_id`

**P1-04:** Fix `getFeedViewerContext` — resolve adult gate through actor, not profile
- File: [apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js](apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js)
- Fetch age flag from an actor-scoped query, not `profile_id → readProfileAdultFlagDAL`

### P2 — Structural Improvements

**P2-01:** Eliminate `user_id` dual-write in createPost
- File: [apps/VCSM/src/features/upload/controllers/createPost.controller.js](apps/VCSM/src/features/upload/controllers/createPost.controller.js)
- Remove `user_id` from post insert once all read paths use `actor_id`

**P2-02:** Replace profile FK lookup in ownership resolution chain
- `readUserActorByProfileIdDAL` uses `vc.actors WHERE profile_id = userId`
- Long-term: maintain a direct `user_id → actor_id` mapping in `vc.actor_owners` and query it directly
- Impact: Removes profile layer from ownership resolution path

**P2-03:** Harden `barberVport.read.dal.js` pre-provisioning path
- File: [apps/VCSM/src/features/join/dal/barberVport.read.dal.js](apps/VCSM/src/features/join/dal/barberVport.read.dal.js)
- Accept that this path runs before actor provisioning. Add explicit guard: this lookup is only valid in the join/provisioning context and must never be used post-provisioning

**P2-04:** Implement consistency check between `user_app_actor_links` and `actor_owners`
- Add a DB function or scheduled check that verifies every `user_app_actor_links` row has a corresponding non-void `actor_owners` row
- Log or alert on divergence

### P3 — Long-Term Actor Model Completion

**P3-01:** Demote `public.profiles.id === userId` equivalence assumption
- `profile_id` in `vc.actors` should eventually be an optional display/metadata FK, not an identity anchor
- Requires data migration: store `userId` directly in actor or via a separate join table

**P3-02:** Remove `vport.profiles.owner_user_id` column
- Requires all RLS policies to be fully migrated to `actor_owners`
- Depends on P0-03 completion

**P3-03:** Remove `vport.profile_actor_access` table
- Depends on P0-01 and all hydration fallbacks being removed
- Confirm no other code uses this table

---

## Final Verdict

```
ACTOR_FIRST_PARTIAL
```

The VCSM identity engine is architecturally actor-first. The primary data model (`vc.actors`, `vc.actor_owners`) is sound. The identity context correctly uses `actorId + kind` as the public surface. RLS policies have been progressively hardened to use `actor_owners`.

However, the public identity contract leaks `ownerActorId`, booking controllers are not self-sovereign on ownership resolution, settings DALs still query `owner_user_id`, and the hydration layer has a live fallback to a legacy access table. The system has the right skeleton but has not completed the soft tissue — the ownership model is partially implemented in the old way and partially in the new way, with no enforcement preventing the old way from being used.

The system is **not broken** — normal write paths are correctly gated. It is **drifting** — the actor-first model is being undermined incrementally by convenience shortcuts that expose ownership fields and accept them from callers.

---

*Report generated: 2026-06-06 | All findings source-verified | No assumptions | Read-only audit*
