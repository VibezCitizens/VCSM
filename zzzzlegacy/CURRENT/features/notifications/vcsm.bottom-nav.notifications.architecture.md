# BOTTOM NAV — NOTIFICATIONS BUTTON ARCHITECTURE MAP

**Generated:** 2026-05-11
**Button:** Notifications (Bell icon)
**Route:** `/notifications`
**Feature:** notifications

---

## Button Definition

```jsx
<Tab
  to="/notifications"
  label={notiCount > 0 ? t('nav.notificationsWithCount', { count: notiCount }) : t('nav.notifications')}
  icon={<Bell size={18} />}
  badgeCount={notiCount}
/>
```
- NavLink — React Router push
- Dynamic label + red badge from `useNotificationUnread()`
- Badge capped at 99+

---

## Badge Data Flow (always-running)

```
BottomNavBar (always mounted)
  → useBootstrapHydration(actorId) → bootstrap.store.setHydrated(actorId)
  → useNotificationUnread() → React Query
    → queryFn: getUnreadNotificationCount(actorId) → notifications.adapter
    → refetchInterval: 60_000 (every 60s)
    → badge count driven from query data
  → BottomNavBar useEffect:
    → on /notifications or /chat route enter → window.dispatchEvent('noti:refresh')
    → triggers React Query invalidation of notificationUnread + chatUnread keys
```

---

## Screen Chain

```
/notifications → NotificationsScreen.jsx → NotificationsScreenView.jsx
```

**Screen:** `features/notifications/screen/NotificationsScreen.jsx` (thin wrapper)
**View:** `features/notifications/screen/views/NotificationsScreenView.jsx`

---

## Primary Hooks

| Hook | File | Purpose | Calls |
|---|---|---|---|
| `useIdentity` | `state/identity/identityContext` | Gets actorId + kind for view gating | identity store |
| `useNotifications` | `notifications/inbox/hooks/useNotifications.js` | Re-exports useNotificationInbox | — |
| `useNotificationInbox` | `notifications/inbox/hooks/useNotificationInbox.js` | React Query owner of notification inbox | `getNotifications(identity)` |
| `useNotificationsHeader` | `notifications/inbox/hooks/useNotificationsHeader.js` | Unread count + markAllSeen | `useNotiCount`, mark read controller |
| `useSocialFollowRequestOps` | `social/adapters/social.adapter` | Incoming follow requests list | @social feature |

---

## Primary Controllers

| Controller | File | Purpose |
|---|---|---|
| `getNotifications(identity)` | `notifications/inbox/controller/Notifications.controller.js` | Fetches notification cards | @notifications engine |
| `markAllSeen` | INFERRED: notifications header controller | Marks all notifications seen | DB write |

---

## Primary DAL Reads

- All DB reads delegated to `@notifications` engine (INFERRED)
- INFERRED tables: `notifications.events`, `notifications.inbox`, `notifications.actor_notifications`
- Incoming follow requests merged from `social` feature via `listIncomingRequests`

---

## State Stores

| Store | Data Held |
|---|---|
| React Query cache | Inbox keyed by `['notificationsInbox', actorId]`, staleTime 60s, gcTime 5min |
| React Query cache | Badge count keyed by `['notificationUnread', actorId]` |

---

## Data Flow

```
User taps Bell → navigate('/notifications')
  → BottomNavBar useEffect fires: window.dispatchEvent('noti:refresh')
    → React Query invalidates notificationUnread + chatUnread keys
  → NotificationsScreen mounts → NotificationsScreenView renders
  → useIdentity() → actorId, kind
  → isCitizen = kind === 'user'
  → activeSection = searchParams.get('view') || 'notifications'

useNotificationInbox activates
  → React Query useQuery(queryKeys.notificationsInbox(actorId))
  → staleTime: 60s — cache hit if navigated away within 60s
  → queryFn: getNotifications(identity, { listIncomingRequests })
  → @notifications engine → DB reads
  → On success: autoMarkSeen runs in DB → badge cleared
  → After success: queryClient.invalidateQueries(notificationUnread) → badge updates

Section routing (citizen actors only):
  → activeSection='appointments' → MyAppointmentsView (useMyAppointments hook)
  → activeSection='notifications' → NotificationsView (notification cards)

useNotificationsHeader
  → unreadCount, markAllSeen handler
  → Renders NotificationsHeader with section tabs

Event listeners:
  → 'noti:refresh' → invalidate inbox + badge queries
  → 'noti:optimistic:replace' → patch inbox list (remove old + add updated card)
```

---

## Security / Ownership Gates

- `enabled: !!actorId` — no query without authenticated actor
- INFERRED: notifications engine filters to viewer's actor only
- INFERRED: RLS enforces actor scoping on notification tables

---

## Loading / Error States

| State | Behavior |
|---|---|
| Loading (cold open) | `loading = isPending && !isPlaceholderData` → skeleton (INFERRED) |
| Loading (warm open) | `keepPreviousData` — previous rows render immediately, no skeleton |
| Actor switch | Different queryKey → no placeholder → skeleton shows |
| Error | INFERRED: error prop surfaced from useNotificationInbox |
| Empty | INFERRED: empty notification list state |

---

## Spaghetti / Risk Flags

| Signal | Evidence | Risk | Handoff |
|---|---|---|---|
| DUPLICATE NotiViewPostScreen | `screen/NotiViewPostScreen.jsx` + `screen/views/NotiViewPostScreen.jsx` | HIGH — two files same name | IRONMAN |
| `useMyAppointments.js` in `screen/hooks/` | Hook inside screen folder — layer violation | HIGH | SENTRY |
| MyAppointmentsView ownership | Appointment view in notifications screen — wrong feature home | MEDIUM | IRONMAN |
| `useIdentity` from `identityContext` not adapter | Uses `state/identity/identityContext` directly, not `identity.adapter` | MEDIUM — bypasses adapter boundary | SENTRY |
| `useSocialFollowRequestOps` imported in notification hook | Cross-feature direct import | MEDIUM — should use adapter | SENTRY |
| Realtime disabled | No Supabase Realtime — 60s polling only | MEDIUM — delay up to 60s | IRONMAN |

---

## Missing Pieces

- Resolve DUPLICATE NotiViewPostScreen (two files with same name)
- Move `useMyAppointments` hook out of `screen/hooks/`
- MyAppointmentsView belongs in a booking or scheduling feature, not notifications
- Switch `useIdentity` import to `identity.adapter` not `identityContext` directly
