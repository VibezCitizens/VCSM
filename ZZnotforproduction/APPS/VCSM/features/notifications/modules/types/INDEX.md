---
title: Types Module — Index
status: STUB
feature: notifications
module: types
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / types

Notification type renderers — one view component per notification category (booking, comment, follow, mention, reaction, review, team). Shared NotificationCard wrapper. Also includes appointments screen.

## Source Files

| File | Type |
|---|---|
| types/booking/BookingCancelledNotificationItem.view.jsx | view |
| types/booking/BookingConfirmedNotificationItem.view.jsx | view |
| types/booking/BookingCreatedNotificationItem.view.jsx | view |
| types/comment/CommentLikeNotificationItem.view.jsx | view |
| types/comment/CommentNotificationItem.view.jsx | view |
| types/comment/CommentReplyNotificationItem.view.jsx | view |
| types/components/NotificationCard.jsx | shared component |
| types/follow/AcceptFriendRequestItem.jsx | view |
| types/follow/FollowNotificationItem.view.jsx | view |
| types/follow/FollowRequestItem.view.jsx | view |
| types/mention/PostMentionNotificationItem.view.jsx | view |
| types/reaction/PostDislikeNotificationItem.view.jsx | view |
| types/reaction/PostLikeNotificationItem.view.jsx | view |
| types/reaction/PostRoseNotificationItem.view.jsx | view |
| types/review/ReviewCreatedNotificationItem.view.jsx | view |
| types/team/TeamInviteNotificationItem.view.jsx | view |
| screen/NotiViewPostScreen.jsx | screen |
| screen/hooks/useMyAppointments.js | hook |
| screen/views/MyAppointmentsView.jsx | view |
| styles/notifications-modern.css | styles |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

No THOR blockers scoped to this module. TYPES-SEC-001 (MEDIUM) — XSS risk requires confirmation.
