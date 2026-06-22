# LOKI — Runtime Trace: Notifications DAL

**Date:** 2026-05-19 (v2 — full pass)  
**Triggered by:** CEREBRO pass on `vcsm.dal.notifications.md`  
**Scope:** Notifications feature — all runtime paths: engine init, inbox load, badge, mark-seen, publish, custom events, cache lifecycle, actor switch  
**Status:** COMPLETE — full static trace; live timing measurements not available (no browser DevTools)  
**Prior pass:** PARTIAL (static-only, limited scope)

---

## 1. Engine Init Chain

**Entry point:** `main.jsx:24` — `setupVcsmNotificationsEngine()` called before any React render

```
main.jsx  (line 24 — synchronous, before createRoot)
  → features/notifications/setup.js
    → setupVcsmNotificationsEngine()
      → _configured guard (idempotent)
      → configureNotificationsEngine({
          supabaseClient: supabase,    ← main supabase client (same auth context as all features)
          resolveActorCard,            ← async fn using @hydration engine
        })
        → configureNotificationsRuntimeDAL({ supabaseClient })
          → stores client reference; all 16 DAL functions now have access
```

**Order in main.jsx:**
```
setupVcsmIdentityEngine()    [1]
setupVcsmHydration()         [2]
setupVcsmChatEngine()        [3]
setupVcsmReviewsEngine()     [4]
setupVcsmPortfolioEngine()   [5]
setupVcsmNotificationsEngine() [6]   ← notifications init position
setupVcsmBookingEngine()     [7]
setupVcsmMediaEngine()       [8]
```

**Findings:**
- Engine init is pre-render, synchronous, idempotent. Correct.
- `resolveActorCard` depends on `@hydration` engine (initialized at position 2) — dependency order is safe.
- `_configured` guard prevents double-init on React StrictMode double-invoke or HMR.
- `supabaseClient` is the shared `supabase` singleton — no separate auth context. Confirmed consistent with DB findings (vportClient is also `supabase.schema('vport')`).

---

## 2. Badge Count Runtime Path

**Lifecycle anchor:** `BottomNavBar.jsx` — mounted in `RootLayout.jsx:96`, never unmounts during session

```
RootLayout.jsx
  → BottomNavBar.jsx (persistent)
    → useBootstrapHydration(personaActorId)   [bootstrap.hydrate.controller.js]
      → useEffect: validates actorId UUID
      → on actorId change: store.getState().setHydrated(actorId)
          → activates React Query unread selectors
      → registers: window.addEventListener('noti:refresh', onGlobalRefresh)
          onGlobalRefresh: invalidate notificationUnread + chatUnread query keys
      → cleanup: removeEventListener on actorId change or unmount

    → useNotificationUnread()   [bootstrap.selectors.js]
      → useQuery({
          queryKey: ['notifications', 'unread', actorId],
          queryFn: getUnreadNotificationCount(actorId),   ← notifications.adapter.js
            → countUnread({ recipientActorId: actorId })  ← @notifications engine
              → 2 DAL ops (5s in-memory cache in engine)
          staleTime: 60_000,
          refetchInterval: 60_000,
          placeholderData: 0,
        })
      → returns data ?? 0
```

**Freshness model:** Polled every 60s while `BottomNavBar` is mounted. Immediately invalidated by `noti:refresh` event.

---

## 3. Inbox Load Path (Full)

```
/notifications route
  → NotificationsScreen.jsx        [Final Screen — identity gate only]
    → NotificationsScreenView.jsx  [View Screen — composition]
      → useNotifications()         [1-line wrapper → useNotificationInbox]
        → useNotificationInbox()   [React Query source of truth]
          → identity = useIdentity().identity
          → actorId = identity?.actorId
          → listIncomingRequests from useSocialFollowRequestOps()
          → useQuery({
              queryKey: queryKeys.notificationsInbox(actorId),
              queryFn: getNotifications(identity, { listIncomingRequests }),
              enabled: !!actorId,
              staleTime: 60_000,
              gcTime: 5 * 60_000,
              retry: 1,
              refetchInterval: 60_000,
              refetchIntervalInBackground: false,
              placeholderData: keepPreviousData,
            })
```

**Inside `getNotifications()` — `Notifications.controller.js`:**
```
→ resolveInboxActor(identity) → { targetActorId, myActorId }
→ getInboxNotifications({ recipientActorId: targetActorId, limit: 20, autoMarkSeen: true })
    → @notifications engine (5 DAL ops: 1 serial + 3 parallel + autoMarkSeen)
→ loadBlockSets(myActorId)
    → 2 parallel queries on moderation.blocks (blockedByMe + blockingMe)
→ filterByBlocks(raw, blocks)
→ filterResolvedFollowRequestRows({ rows, targetActorId, listIncomingRequests })
    → only runs if follow_request rows exist
    → calls listIncomingRequests({ targetActorId }) → social.adapter
→ resolveSenders(actorIds)
    → 3-tier waterfall via @hydration engine (warm cache: 1 RTT; cold: 4 RTT)
→ mapNotification(r, senderMap)   [notification.model.js]
    → normalizeKind: maps engine eventKeys to display kinds
    → normalizeSender: user/vport/fallback-from-payload
→ VPORT identity filter: remove 'follow' kind notifications for vport actors
→ return mapped array
```

**After successful fetch (useNotificationInbox:82–91):**
```
useEffect([query.dataUpdatedAt])
  → queryClient.invalidateQueries(notificationUnread)
  → badge immediately reflects cleared unseen count without waiting for next 60s poll
```

---

## 4. Mark-All-Seen Path

```
useNotificationsHeader(actorId)
  → markAllSeen callback
    → markAllNotificationsSeen(actorId)     [NotificationsHeader.controller.js]
      → getInboxNotifications({ limit: 50, autoMarkSeen: true })
          → engine reads + marks 50 items seen in DB
      → window.dispatchEvent(new Event('noti:refresh'))
          → [listener 1] bootstrap.hydrate.controller: invalidate notificationUnread + chatUnread
          → [listener 2] useNotificationInbox: invalidate inbox + unread
    → [after return, in hook] queryClient.invalidateQueries(notificationsInbox)
    → [after return, in hook] queryClient.invalidateQueries(notificationUnread)
```

**LOKI Finding LF-1 — Mark-seen double invalidation (LOW)**

`markAllNotificationsSeen` dispatches `noti:refresh` which triggers up to 2 listeners each invalidating `notificationUnread`. After the function returns, the hook also calls `queryClient.invalidateQueries` for both `notificationsInbox` and `notificationUnread` directly.

Result: `notificationUnread` is invalidated 3 times, `notificationsInbox` is invalidated 2 times in rapid succession. React Query deduplicates in-flight refetches so this is **functionally harmless** — only one actual network request fires per key. The redundancy is a code clarity issue, not a correctness or performance issue.

---

## 5. Follow Request Accept — Optimistic Update Path

```
FollowRequestItem.view.jsx (accept action)
  → window.dispatchEvent(CustomEvent('noti:optimistic:replace', {
        detail: { removeId, add }  ← removes old follow_request, adds accepted version
    }))
  → window.dispatchEvent(new Event('noti:refresh'))

useNotificationInbox.js listener:
  → onReplace: queryClient.setQueryData(notificationsInbox, patch)
      → removes item with removeId, prepends `add` — no network round-trip
  → noti:refresh handler fires concurrently:
      → invalidates inbox + unread
```

**Note:** `noti:optimistic:replace` is also referenced in `useNotificationsInternal.js` (DEAD hook). Since that hook has zero consumers, the listener never registers. No runtime impact.

Other `noti:refresh` dispatchers:
- `usePendingFollowRequestActions.js` — accept/reject from settings/privacy
- `useFollowRequestActions.js` — accept/decline from social/friend
- `BottomNavBar.jsx` — on navigate to `/notifications` or `/chat` **only** (gated: `if (!path.startsWith('/notifications') && !path.startsWith('/chat')) return`)

---

## 6. Publish Path (Adapter → Engine)

```
Any feature controller
  → notifications.adapter.js (publishVcsmNotification | publishVcsmNotificationBatch)
    → publish.js
      → self-notification guard: if actorId === recipientActorId → return false
      → publishEvent({ event, recipients, renderContext })
          → @notifications engine (runtime/index.js)
            → insertNotificationEventDAL     [fixed op 1]
            → insertNotificationRecipientsDAL [fixed op 2]
            → for (const recipient of recipientRows) {  ← SERIAL LOOP (KF-1)
                await upsertNotificationRenderedDAL(...)
                await insertNotificationInboxItemDAL(...)
                await updateNotificationRecipientStatusDAL(...)
              }
      → return true
  → [no automatic badge invalidation for recipient — polling-based]
```

**No post-publish cache invalidation.** After successful publish, the recipient's badge refreshes only via the 60s polling cycle. The publisher's badge is unaffected. This is correct — the publisher is not a recipient of their own notification.

---

## 7. Custom Event System Map

| Event | Dispatchers | Listeners | Behavior |
|---|---|---|---|
| `noti:refresh` | NotificationsHeader.controller.js, FollowRequestItem.view.jsx, usePendingFollowRequestActions.js (×2), useFollowRequestActions.js (×2), BottomNavBar.jsx (route-gated) | bootstrap.hydrate.controller.js, useNotificationInbox.js | Invalidates inbox + unread query keys |
| `noti:optimistic:replace` | FollowRequestItem.view.jsx | useNotificationInbox.js (active), useNotificationsInternal.js (dead — never registers) | Patches inbox cache without network round-trip |

**BottomNavBar route gate:** `noti:refresh` is only dispatched from BottomNavBar when navigating to `/notifications` or `/chat`. Prevents badge refresh storms on every route change. Correct design.

---

## 8. Cache Lifecycle and Actor Switch

**Notification cache keys:**
```js
notificationsInbox:  ['notifications', 'inbox', actorId]
notificationUnread:  ['notifications', 'unread', actorId]
```

**Actor switch / logout path:**
```
bootstrap.invalidate.js
  → purgeNotificationCache()
      → queryClient.removeQueries({ queryKey: ['notifications'] })
          → hard evict — all notification data removed immediately
          → actor A's notifications never bleed into actor B session
```

`purgeNotificationCache()` uses `removeQueries` (hard evict) not `invalidateQueries`. Correct — ensures stale notification data is never displayed for a different actor.

**On actor re-hydration:**
- `useBootstrapHydration` sets new actorId → badge query re-enables with new key
- `useNotificationInbox` query re-enables with new actorId key
- `keepPreviousData` returns `undefined` on key change (actorId change) → skeleton renders correctly

---

## 9. Additional Tables Found in Live DB

The DB pass revealed notification schema tables not documented in the DAL document:

| Table | DAL Document | Live DB | Notes |
|---|---|---|---|
| `notification.recipients` | ✓ documented | ✓ exists | Core — engine-owned |
| `notification.inbox_items` | ✓ documented | ✓ exists | Core — engine-owned |
| `notification.events` | ✓ documented | ✓ exists | Core — engine-owned |
| `notification.rendered` | ✓ documented | ✓ exists | Core — engine-owned |
| `notification.preferences` | NOT documented | ✓ exists | 3 RLS policies — owns_actor/app_account/user |
| `notification.delivery_attempts` | NOT documented | ✓ exists | No RLS policies found in pg_policies |
| `notification.templates` | NOT documented | ✓ exists | authenticated read (is_active = true) |
| `notification.push_subscriptions` | NOT documented | ✓ exists | own read/update/upsert via auth.uid() |
| `notification.event_types` | NOT documented | ✓ exists | authenticated read (is_active = true) |
| `notification.event_categories` | ✓ documented | ✓ exists | public-read reference table |

**LOKI Finding LF-2 — Undocumented notification tables (LOW)**

Five tables exist in the `notification` schema that are not documented in `vcsm.dal.notifications.md` or the IRONMAN ownership record:
- `notification.preferences` — per-actor notification preferences (full CRUD policies)
- `notification.delivery_attempts` — delivery attempt tracking
- `notification.templates` — notification templates
- `notification.push_subscriptions` — push subscription management
- `notification.event_types` — event type reference data

These may be used by the engine but are not referenced in any feature-layer DAL file inspected. They should be documented in the engine ownership record (IF-2 scope — engine audit v1).

---

## 10. LOKI Findings Summary

| ID | Finding | Severity | Recommended Action |
|---|---|---|---|
| LF-1 | Mark-all-seen triple invalidation of notificationUnread | LOW | Informational only; React Query deduplicates. No fix required but could simplify. |
| LF-2 | 5 undocumented notification schema tables | LOW | Document in @notifications engine audit v1 (IF-2) |

---

## 11. Runtime Trace Summary

| Runtime Path | Entry Point | Status | Notes |
|---|---|---|---|
| Engine init | `main.jsx:24` → `setup.js` | VERIFIED | Pre-render, idempotent, correct dependency order |
| Badge count | `BottomNavBar` → `useNotificationUnread` → `countUnread` | VERIFIED | 60s poll, noti:refresh invalidation, 5s engine cache |
| Inbox load | `NotificationsScreen` → `useNotificationInbox` → `getNotifications` | VERIFIED | 60s stale, keepPreviousData, block filter + sender resolution |
| Mark-all-seen | `useNotificationsHeader.markAllSeen` → `NotificationsHeader.controller` | VERIFIED | noti:refresh dispatched; minor double-invalidation (harmless) |
| Optimistic follow accept | `FollowRequestItem` → `noti:optimistic:replace` → cache patch | VERIFIED | No network round-trip; full refresh follows |
| Publish | `notifications.adapter` → `publish.js` → `publishEvent` | VERIFIED | Self-notification guard; serial delivery loop (KF-1) |
| Actor switch cache | `purgeNotificationCache()` → `removeQueries` | VERIFIED | Hard evict; no cross-actor data bleed |
| Custom events | `noti:refresh` (7 dispatchers, 2 listeners) | VERIFIED | Route-gated in BottomNavBar; lifecycle-safe |
| `badgeSubscriptions.js` | Not called, both noops | VERIFIED | INERT — RISK-12 deescalated |

**LOKI Status: COMPLETE**  
All runtime paths statically traced and verified. No correctness issues found. Two low-severity informational findings. Live browser DevTools timing measurements remain unverified (not blocking).  
KF-1 serial delivery loop remains the only actionable finding — confirmed via both KRAVEN (performance) and LOKI (runtime path) passes.
