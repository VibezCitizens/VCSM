---
title: Types Module — Architecture
status: STUB
feature: notifications
module: types
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / types — ARCHITECTURE

## Type Dispatch

```
NotificationItem.view.jsx
  └── switch(notification.type)
        ├── booking/* → BookingCreated/Confirmed/Cancelled views
        ├── comment/* → Comment/CommentLike/CommentReply views
        ├── follow/* → Follow/FollowRequest/AcceptFriendRequest views
        ├── mention/* → PostMention view
        ├── reaction/* → PostLike/Dislike/Rose views
        ├── review/* → ReviewCreated view
        └── team/* → TeamInvite view
```

## Sender Display Fallback

```
[hydration success] → sender actor display name
[hydration failure] → payload.context.senderName (payload-embedded) ← BW-NOTI-008 XSS RISK
```

## NotiViewPostScreen

```
[tap notification] → NotiViewPostScreen
  └── extract postId from linkPath → navigate to post
```

## TODO

- [ ] Confirm linkPath format for each type
- [ ] Confirm UI escaping on sender display name fallback
