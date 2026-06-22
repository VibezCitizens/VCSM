# VCSM Workspace — Dependency Map

**Generated:** 2026-04-12 | **Last Updated:** 2026-04-16 (portfolio RLS fixes, optimistic delete, debug instrumentation)

---

## 1. Engine Dependencies (App → Engine)

### VCSM App → Engines

| Engine | VCSM Consumers | Setup File |
|--------|---------------|------------|
| @identity | identityContext, AuthProvider, identity.controller, identity.setup | features/identity/setup.js |
| @hydration | actorStore, hydrateActors, useFeed, CentralFeedScreen, senders.read, profiles controllers | features/hydration/setup.js |
| @chat | 15+ chat hooks/adapters, inbox, conversation, start | features/chat/setup.js |
| @reviews | VportReviews.controller, VportReviewsView | features/reviews/setup.js |
| @portfolio | VportPortfolio.controller, VportDashboardPortfolioScreen, useVportPortfolio | features/portfolio/setup.js |
| @notifications | (not yet wired — engine exists but no VCSM setup) | — |
| @debuggers | App.jsx, feed pipeline, useFeed, loginDebug | — (dev-only) |

### Wentrex App → Engines

| Engine | Wentrex Consumers | Setup File |
|--------|------------------|------------|
| @identity | WentrexIdentityContext, provisioning | features/identity/setup.js |
| @chat | communication adapters, inbox, conversation | features/communication/setup.js |

---

## 2. Cross-Feature Dependencies (VCSM)

**Most-imported features (by cross-feature import count):**

| Feature | Cross-Feature Imports | Key Dependents |
|---------|----------------------|----------------|
| profiles | 362 | Almost every feature reads profile data |
| wanders | 131 | Self-contained but many internal imports |
| dashboard | 118 | Vport owner screens import from profiles, booking |
| settings | 105 | Imports from profiles, auth, social, privacy |
| post | 90 | Feed, profiles, notifications import post components |
| booking | 83 | Profiles, dashboard import booking |
| chat | 61 | Engine-backed; adapters import from @chat |
| social | 57 | Profiles, feed, notifications import follow/block state |
| notifications | 50 | Feed, BottomNavBar import badge hooks |
| moderation | 50 | Block, chat, notifications import moderation DALs |

---

## 3. Key Dependency Chains

### Feed Load
```
CentralFeedScreen
  → useFeed (hook)
    → fetchFeedPagePipeline (pipeline)
      → readFeedPostsPage (DAL → vc.posts)
      → Promise.all([
          readPostMediaMap (DAL → vc.post_media)
          fetchPostMentionRows (DAL → vc.post_mentions + vc.actor_presentation)
          readHiddenPostsForViewer (DAL → moderation.actions)
          readActorsBundle (DAL → vc.actors + profiles + vc.actor_privacy_settings + vc.vports)
          readFeedBlockRowsDAL (DAL → moderation.blocks)
          readFeedFollowRowsDAL (DAL → vc.actor_follows)
        ])
      → normalizeFeedRows (model)
    → upsertActors (actorStore via @hydration)
    → hydrateActorsByIds (@hydration — background, DUPLICATE of readActorsBundle)
```

### Identity Resolution
```
AuthProvider
  → supabase.auth.onAuthStateChange()
  → IdentityProvider
    → resolveAuthenticatedContext (@identity)
      → resolveSessionUser (DAL → auth.users)
      → resolveUserAppAccess (DAL → platform.user_app_access)
      → resolveUserAppAccount (DAL → platform.user_app_accounts)
      → resolveAvailableActors (DAL → platform.user_app_actor_links)
    → VCSM identity hydrator
      → identity.read.dal (DAL → vc.actors + profiles + vc.vports + vc.actor_privacy_settings + vc.realms)
```

### Chat Message Send
```
ConversationScreen
  → useConversation (@chat hook)
    → sendMessage (@chat controller)
      → sendMessageAtomic.rpc.dal (RPC → chat.send_message_atomic)
      → outboxService (DAL → chat.outbox_events)
```

### Notification Bell Badge
```
BottomNavBar
  → useNotiCount (hook)
    → getUnreadNotificationCount (controller)
      → countUnreadNotifications (DAL → vc.notifications)
    → subscribeNotificationBadge (realtime → vc.notifications)
```

### Portfolio Read + Optimistic Delete
```
VportDashboardPortfolioScreen
  → useVportPortfolio(actorId) (hook)
    → ctrlListPortfolio (app controller — TTL cache 60s)
      → listPortfolio (@portfolio engine)
        → dalGetProfileIdByActorId  (DAL → vport.profiles)
        → dalListPortfolioItemsByProfileId  (DAL → vport.portfolio_items)
        → dalListMediaByItemIds  (DAL → vport.portfolio_media)
        → dalListTagsByItemIds  (DAL → vport.portfolio_tags)
    → ctrlGetPortfolioItem (app controller — cache)
      → getPortfolioItem (@portfolio engine)
        → dalGetPortfolioItemById  (DAL → vport.portfolio_items)
        → dalListMediaByItemId + dalListTagsByItemId (DAL → portfolio_media, portfolio_tags)
        → dalGetLocksmithDetailsByItemId (optional — vport.locksmith_portfolio_details)
    → optimisticRemove(itemId) (hook callback)
        → snapshot = itemsRef.current
        → setItems(filtered)
        → invalidatePortfolioCache(actorId)  (busts TTL cache)
        → returns rollback fn → setItems(snapshot)
  → deleteItem(@portfolio) — server call (after optimistic remove)
      → on failure: rollback()

Portfolio Create (write path)
  → createItem(@portfolio)
      → isActorOwner(actorId)  [DI]
      → dalGetProfileIdByActorId  (DAL → vport.profiles)
      → dalInsertPortfolioItem({ ..., createdByActorId: null })  (DAL → vport.portfolio_items)
      → dalInsertPortfolioTags  (DAL → vport.portfolio_tags)
      → debug?.({ step: 'CREATE_ITEM_INSERT_PAYLOAD', ... })  [DEV only]
```

### Portfolio Engine Setup (DI)
```
apps/VCSM/src/features/portfolio/setup.js
  → configurePortfolioEngine({ supabaseClient, isActorOwner, debugReporter })
      ← supabaseClient  (VCSM supabase service)
      ← isActorOwner    (async fn: vc.actors query — checks actor exists + not void)
      ← debugReporter   (DEV: event → portfolioTraceStore.push; PROD: null)

portfolioTraceStore (DEV pub/sub — setup.js)
  ← engine emits via debugReporter (createItem steps, owner check, profile lookup, payload)
  → PortfolioBugsBunnyPanel subscribes (VportDashboardPortfolioScreen, DEV only)
```

---

## 4. Dependency Violations

### Layer Violations Detected

| File | Issue |
|------|-------|
| `features/settings/profile/controller/Profile.controller.core.js` | Contains `.from()` call — should be in DAL |
| `features/block/helpers/applyBlockSideEffects.js` | Contains `.from()` call — helper performing DB writes |
| `state/identity/identity.controller.js` | Contains `.from()` calls — identity state management with direct DB access |
| `features/identity/resolvers/vcsmIdentity.resolver.js` | Contains `.from()` calls — resolver performing queries |
| `features/reviews/setup.js` | Contains `.from()` call — engine setup with DB read |
| `features/chat/setup.js` | Contains `.from()` call — engine setup with DB read |
| `features/portfolio/setup.js` | Contains `.from()` call — engine setup with DB read |

**Note:** Setup files calling `.from()` for config resolution (e.g., checking actor ownership) are a common pattern in this codebase. These are borderline — not pure DAL layer but serve DI configuration.

### Engine-Side Layer Violations

| File | Issue |
|------|-------|
| `engines/notifications/src/controller/countUnread.controller.js` | Contains `.from('recipients')` and `.from('inbox_items')` — should be in DAL |
| `engines/notifications/src/controller/getInbox.controller.js` | Contains `.from('events')` — should be in DAL |

**VCSM app DAL boundary:** Clean. All `.from()` / `.rpc()` calls contained within `/dal/` directories (verified across 187 DAL files).

### Cross-Engine Violations

**None detected.** No engine imports from another engine.

### Cross-App Violations

**None detected.** VCSM and Wentrex do not import from each other.

---

## 5. Circular Dependencies

**No circular feature dependencies detected** in the primary code paths.

Potential risk areas:
- `profiles` ↔ `social` (both import from each other for follow/friend data + profile display)
- `feed` → `profiles` → `post` → `feed` (post components used by profiles which are used by feed — but through component composition, not circular imports)

---

## 6. Cache Dependencies

| Cache Location | Feature | What's Cached | TTL |
|----------------|---------|---------------|-----|
| `shared/lib/ttlCache.js` | Multiple | Shared TTL cache factory | configurable |
| `profiles/dal/readActorKind.dal.js` | Profiles | Actor kind lookup | TTL |
| `profiles/dal/readVportType.dal.js` | Profiles | Vport type lookup | TTL |
| `profiles/dal/readActorProfile.dal.js` | Profiles | Actor profile | TTL |
| `profiles/kinds/vport/dal/rates/` | Vport | Rate data | TTL |
| `profiles/kinds/vport/dal/gas/` | Vport | Fuel prices | TTL |
| `profiles/kinds/vport/dal/subscribersCount.dal.js` | Social | Subscriber count | TTL |
| `notifications/inbox/hooks/useNotiCount.js` | Notifications | Unread count | 15s + poll 60s |
| `notifications/inbox/hooks/useUnreadBadge.js` | Notifications | Chat badge | 10s + poll 20s |
| `engines/hydration/src/store.js` | Hydration | Actor summaries | 5min (Zustand) |
| `state/identity/identityStorage.js` | Identity | Cached identity | session |

---

## 7. Schema Migration Notes

### @portfolio engine — 2026-04-16

**Before migration:**
Portfolio engine queried `vc.vport_portfolio_items`, `vc.vport_portfolio_media`, `vc.vport_portfolio_tags`, `vc.vport_barber_portfolio_details`.
Items and media were keyed by `actor_id`.
Public list used `get_vport_portfolio` RPC (schema `vc`).

**After migration:**
Portfolio engine now queries `vport.portfolio_items`, `vport.portfolio_media`, `vport.portfolio_tags`, `vport.barber_portfolio_details`, `vport.locksmith_portfolio_details`.
Items and media are keyed by `profile_id` (`vport.profiles.id`).
Engine resolves `profile_id` from `actor_id` via `dalGetProfileIdByActorId` (new — queries `vport.profiles`).
Public list uses direct table queries via `dalListPortfolioItemsByProfileId`.
`get_vport_portfolio` RPC is no longer used.

**Audit V1:** `zNOTFORPRODUCTION/logan/engines/PORTFOLIO_ENGINE_AUDIT_V1.md`

### @portfolio engine — 2026-04-16 session 2 (RLS + optimistic delete)

**Changes:**
- `createItem.controller.js`: `createdByActorId: null` (was `actorId`). Root cause: `vc.current_actor_id()` resolves to user actor, not vport actor — passing vport actorId caused RLS 403. INSERT policy explicitly allows null.
- `createItem.controller.js`: Added `getDebugReporter()` + dev trace emissions at each controller step.
- `setup.js`: Added `portfolioTraceStore` (dev pub/sub, last 50 events). Added `debugReporter` DI param.
- `useVportPortfolio.js`: Added `itemsRef` + `optimisticRemove(itemId)` — immediate state removal + cache bust + rollback fn on failure.
- `VportDashboardPortfolioScreen.jsx`: `handleDelete` now uses optimistic removal. Added `PortfolioBugsBunnyPanel` (DEV diagnostic: probe + engine trace).

**SQL migrations proposed (pending user execution):**
- `vport.portfolio_items` RLS policies (INSERT/SELECT/UPDATE/DELETE using `actor_can_manage_profile`)
- `vport.actor_can_manage_profile` + `actor_can_view_profile` functions fixed to use `auth.uid()` directly
- `vport.portfolio_media` RLS policies (INSERT consistency guard: portfolio_item_id.profile_id = profile_id)

**Audit V2:** `zNOTFORPRODUCTION/logan/engines/PORTFOLIO_ENGINE_AUDIT_V2.md`
