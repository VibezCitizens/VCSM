VCSM Chat Notification Pipeline
===============================

CURRENT RUNTIME
---------------

Chat unread state and bell notifications are still **two different systems** in VCSM:

- chat unread badge = `chat.inbox_entries`
- bell notifications = `vc.notifications`

I did **not** find current VCSM runtime code that bridges chat message events into `vc.notifications`.


1. Verified Current Truth
-------------------------

What the code clearly shows:

- chat message send is engine-backed
- unread badge reacts to `chat.inbox_entries`
- bell notifications load from `vc.notifications`
- the explicit notification-insert helper exists
- but no current runtime caller was found that uses it for chat messages

Files verified:

- `engines/chat/src/controller/sendMessage.controller.js`
- `engines/chat/src/services/messageService.js`
- `apps/VCSM/src/features/notifications/inbox/dal/notifications.create.dal.js`
- `apps/VCSM/src/features/notifications/inbox/ui/NotificationItem.view.jsx`
- `apps/VCSM/src/features/notifications/inbox/realtime/badgeSubscriptions.js`


2. What Happens When A Chat Message Is Sent
-------------------------------------------

```text
ConversationView
  -> useConversationMessages()
  -> @chat sendMessageController()
  -> chat.send_message_atomic RPC
     -> insert chat.messages
     -> update chat.conversations
     -> fan out chat.inbox_entries
     -> insert/publish engine outbox/domain event state
  -> recipient inbox unread badge changes
```

What I did **not** verify in runtime code:

- no VCSM startup listener subscribing to `message.sent`
- no direct call from chat send flow to `dalInsertNotification(...)`
- no chat-specific notification kind renderer in `NotificationItem.view.jsx`


3. Notification Insert Helper Exists
------------------------------------

`apps/VCSM/src/features/notifications/inbox/dal/notifications.create.dal.js`

That helper:

- first tries RPC `vc.create_notification`
- falls back to direct insert into `vc.notifications`

So the infrastructure exists, but current VCSM runtime code still does not show a chat-specific caller.


4. Notification UI Support Is Still Social/Post-Oriented
--------------------------------------------------------

`apps/VCSM/src/features/notifications/inbox/ui/NotificationItem.view.jsx`

Verified handled kinds are social/post oriented:

- follow
- follow_request
- follow_request_accepted
- comment
- comment_like
- comment_reply
- like
- dislike
- post_rose
- post_mention

I did **not** find a current chat-specific notification kind such as:

- `direct_message`
- `chat_message`
- `message`


5. Realtime Status
------------------

Bell badge realtime exists:

- `subscribeNotificationBadge(...)`
- watches `vc.notifications`

Chat unread badge realtime also exists:

- `subscribeInboxBadge(...)`
- watches `chat.inbox_entries`

That means badge infrastructure is real, but chat-message-to-bell-notification creation is still a missing or off-app step.


6. Current Status Label
-----------------------

CURRENT RUNTIME

- chat unread badge: working
- bell notifications: working for `vc.notifications`
- chat message -> bell notification creation: **not visible in current VCSM runtime code**

HISTORICAL NOTE

Earlier versions of this note mixed two ideas:

- the existence of engine chat events/outbox
- the existence of actual VCSM notification creation for chat

Those are not the same thing. Current code proves the first, not the second.

---

## Audit References

Latest Engine Audit (Chat):
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/CHAT_ENGINE_AUDIT_V3.md`

Latest Engine Audit (Notifications):
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/NOTIFICATIONS_ENGINE_AUDIT_V1.md`
