# VCSM Realtime and Event Pipeline

## 1. Architecture Overview

CURRENT RUNTIME

VCSM realtime is mixed across:

- Supabase auth session events
- Supabase `postgres_changes` channels
- Supabase presence channels
- shared engine hooks
- local browser events such as `noti:refresh`, `noti:reload`, and `actor:changed`
- polling layered on top of realtime in badge/list hooks

There is no single centralized event bus for the full app runtime.


## 2. Current Realtime Domains

| Domain | Current runtime source |
| --- | --- |
| Auth/session | `AuthProvider.jsx` via `supabase.auth.onAuthStateChange(...)` |
| Actor switch / actor change | browser `CustomEvent('actor:changed')` |
| Bell notification badge | `vc.notifications` realtime |
| Chat unread badge | `chat.inbox_entries` realtime |
| Notifications list refresh nudges | `noti:refresh` and `noti:reload` browser events |
| Main chat inbox | engine-backed chat realtime |
| Main conversation timeline | engine-backed chat realtime |
| Typing indicators | presence via engine typing hook |


## 3. Verified Badge Realtime

Bell badge:

- file: `apps/VCSM/src/features/notifications/inbox/realtime/badgeSubscriptions.js`
- channel: `noti-badge-${actorId}`
- schema/table: `vc.notifications`

Chat unread badge:

- file: `apps/VCSM/src/features/notifications/inbox/realtime/badgeSubscriptions.js`
- channel: `chat-badge-${actorId}`
- schema/table: `chat.inbox_entries`

OUTDATED CLAIM CORRECTED

The unread chat badge no longer watches `vc.inbox_entries` in current code.


## 4. Verified Chat Realtime

Main runtime chat hooks are engine-backed:

- `useInbox`
- `useConversation`
- `useConversationMessages`
- `useTypingChannel`

Those wrappers are in:

- `apps/VCSM/src/features/chat/**`

and delegate to `@chat`.

Current-runtime conclusion:

- main inbox/conversation realtime should be understood as engine-backed
- app-local realtime helpers still exist on disk, but they are not the primary runtime explanation anymore


## 5. Local Realtime Helpers Still Present

HISTORICAL NOTE

These helpers still exist:

- `apps/VCSM/src/features/chat/inbox/realtime/subscribeToInbox.js`
- `apps/VCSM/src/features/chat/conversation/realtime/subscribeToConversation.js`

Current verification result:

- I did **not** find active imports of those helpers from the migrated wrapper-hook runtime

So they should be treated as:

- historical / fallback / cleanup candidates
- not the authoritative explanation of current runtime behavior


## 6. Browser Event Layer

Verified browser events in current code:

- `actor:changed`
  - dispatched from:
    - `apps/VCSM/src/app/providers/AuthProvider.jsx`
    - `apps/VCSM/src/features/settings/account/hooks/useAccountController.js`

- `noti:refresh`
  - used by bottom nav and notification/chat badge hooks
  - dispatched from:
    - `BottomNavBar.jsx`
    - notifications header hook
    - follow-request response flows

- `noti:reload`
  - used to force notifications list reload
  - dispatched from settings follow-request flows


## 7. Polling Layer

Realtime is not the only freshness mechanism.

Verified polling examples:

- `useUnreadBadge({ refreshMs })`
- `useNotiCount({ pollMs })`

That means badge correctness currently depends on:

- realtime
- browser events
- periodic polling


## 8. Current Status Summary

CURRENT RUNTIME

- auth/session events: active
- bell badge realtime: active on `vc.notifications`
- chat badge realtime: active on `chat.inbox_entries`
- main chat realtime: engine-backed
- presence typing: active
- browser refresh events: active
- local legacy chat realtime helpers: still present, but appear unused by main runtime wrappers
