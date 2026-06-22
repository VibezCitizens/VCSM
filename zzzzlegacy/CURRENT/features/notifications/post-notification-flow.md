# Post Notification Flow

Last Updated: 2026-05-09

## Overview

Notifications for the post system are routed through a layered adapter chain from controllers to the `engines/notifications` pipeline. The notification engine writes to the `notification.*` Supabase schema. The inbox reads from the same schema.

---

## Publish Path

### Layer 1 — Controller

Each post-related action controller calls the notifications adapter:

```js
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
// or
import { publishVcsmNotificationBatch } from "@/features/notifications/adapters/notifications.adapter";
```

### Layer 2 — App Adapter

```
apps/VCSM/src/features/notifications/adapters/notifications.adapter.js
```

Re-exports `publishVcsmNotification` and `publishVcsmNotificationBatch` from `@/features/notifications/publish`.

### Layer 3 — Publisher Bridge

```
apps/VCSM/src/features/notifications/publish.js
```

Maps VCSM-specific parameters to the engine's `publishEvent` shape:
- `self-notification guard` — skips notification if `actorId === recipientActorId`
- Calls `publishEvent({ event, recipients, renderContext })` from `@notifications`

### Layer 4 — Notifications Engine

```
engines/notifications/src/controller/publishEvent.controller.js
```

Full pipeline:
1. Validate event type against `notification.event_types`
2. Insert event row to `notification.events`
3. Resolve recipients (explicit or injected resolver)
4. Expand recipients per channel (in_app by default)
5. Evaluate preferences (`notification.preferences`)
6. Insert recipient rows to `notification.recipients`
7. Render notification via `templateRenderer.service.js` (reads `notification.templates`)
8. Persist rendered content to `notification.rendered`
9. Deliver via `deliveryOrchestrator.service.js`
10. Optionally track delivery attempts in `notification.delivery_attempts`

---

## All Post-Related Notification Events

| Event Kind | Source File | Trigger |
|---|---|---|
| `social.post.mention` | `createPost.controller.js` | Post created with resolved mentions |
| `social.post.like` | `togglePostReaction.controller.js` | New like reaction (not switch/toggle-off) |
| `social.post.dislike` | `togglePostReaction.controller.js` | New dislike reaction |
| `social.post.rose` | `sendRose.controller.js` | Rose gift sent |
| `social.post.comment` | `postComments.controller.js` | New root comment |
| `social.post.comment_reply` | `postComments.controller.js` | New reply to comment |
| `social.post.comment_like` | `commentReactions.controller.js` | New comment like |

---

## Notification Object Payloads

All post notifications use `linkPath: /post/${postId}` for navigation.

| Event | objectType | objectId | context |
|---|---|---|---|
| `social.post.mention` | `'post'` | `postId` | `{}` |
| `social.post.like` | `'post'` | `postId` | `{ reaction: 'like' }` |
| `social.post.dislike` | `'post'` | `postId` | `{ reaction: 'dislike' }` |
| `social.post.rose` | `'post'` | `postId` | `{ qty }` |
| `social.post.comment` | `'comment'` | `commentId` | `{ body: content.slice(0,120) }` |
| `social.post.comment_reply` | `'comment'` | `commentId` | `{ body: content.slice(0,120) }` |
| `social.post.comment_like` | `'comment'` | `commentId` | `{}` |

---

## Notification Pattern: Fire-and-Forget vs Awaited

All post notification publishes are **not awaited at the call site**. The `publishVcsmNotification` and `publishVcsmNotificationBatch` functions return `Promise<boolean>` but controllers do not `await` them:

```js
// Example from togglePostReaction.controller.js:
publishVcsmNotification({ ... });  // no await
```

Exception: `createPostController` does not await mention notifications either — it dispatches batch notification without await.

**Risk:** If the notification engine throws, the error is swallowed silently. The `publishVcsmNotification` wrapper has a try/catch that returns `false` on error, meaning notification failures are invisible to the caller.

---

## Inbox / Reading Notifications

```
apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js
```

Uses React Query with:
- `staleTime: 60_000` (1 minute)
- `refetchInterval: 60_000` (polling every 60s)
- No realtime subscription

The badge subscription file `badgeSubscriptions.js` explicitly shows both badge subscriptions are **noops**:

```js
export function subscribeInboxBadge() {
  return noopUnsubscribe  // disabled
}
export function subscribeNotificationBadge() {
  return noopUnsubscribe  // disabled
}
```

The badge update path is: notification read → `autoMarkSeen` in controller → `queryClient.invalidateQueries` on `notificationUnread` key.

**Gap:** New notifications only appear after polling (60s delay) or manual refresh (`window.dispatchEvent(new Event('noti:refresh'))`). No push or realtime for immediate notification delivery.

---

## Notification Inbox Schema Tables

| Table | Schema | Purpose |
|---|---|---|
| `events` | `notification` | Event log |
| `recipients` | `notification` | Per-recipient delivery records |
| `rendered` | `notification` | Rendered notification content (title, body, CTA) |
| `inbox_items` | `notification` | Inbox state (seen, read, dismissed, archived) |
| `event_types` | `notification` | Event type registry |
| `templates` | `notification` | Notification templates |
| `preferences` | `notification` | Per-actor channel preferences |
| `delivery_attempts` | `notification` | Delivery attempt log |

---

## Notification View Screens

Notification item views exist for each post-related type:

```
apps/VCSM/src/features/notifications/types/reaction/PostLikeNotificationItem.view.jsx
apps/VCSM/src/features/notifications/types/reaction/PostDislikeNotificationItem.view.jsx
apps/VCSM/src/features/notifications/types/reaction/PostRoseNotificationItem.view.jsx
apps/VCSM/src/features/notifications/types/comment/CommentNotificationItem.view.jsx
apps/VCSM/src/features/notifications/types/comment/CommentReplyNotificationItem.view.jsx
apps/VCSM/src/features/notifications/types/comment/CommentLikeNotificationItem.view.jsx
apps/VCSM/src/features/notifications/types/mention/PostMentionNotificationItem.view.jsx
```

---

## Realtime Status

The post system has **no Supabase Realtime channels**. Feed updates, reaction changes, and new comments do NOT push to connected clients in real time. All updates require:
- Pull-to-refresh (`fetchPosts(true)`)
- Infinite scroll page load
- Manual poll (notifications: 60s interval)
- Explicit post detail reload

This is a known gap — the `badgeSubscriptions.js` has explicit comments that realtime is "disabled for now" and that "React Query polling/refetch owns freshness."
