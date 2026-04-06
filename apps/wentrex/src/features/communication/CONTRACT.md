# Wentrex Communication Adapter — Contract

**Status:** FROZEN (2026-03-31)
**Owner:** apps/wentrex
**Depends on:** engines/chat (public API only)

---

## Purpose

Translates the generic chat engine into Wentrex-specific messaging: LMS role-based messaging policy, announcement semantics, and course-scoped conversations.

---

## Public Exports (from index.js)

### Screens
- `InboxScreen` — messages list view
- `ConversationScreen` — conversation detail view

### Conversation Lifecycle (Wentrex-specific)
- `createWentrexConversation(params)` — create with Wentrex policy
- `createWentrexAnnouncementConversation(params)` — create LMS announcement
- `evaluateWentrexMessagingPermission(params)` — check Wentrex policy

### Chat Hooks (re-exported from engine)
- `useConversation`, `useConversationMessages`, `useConversationMembers`
- `useInbox`
- `startDirectConversation`

---

## Internal Files (not imported by outside screens)

- `setup.js` — engine configuration (called from main.jsx)
- `adapters/chatEngine.adapter.js` — Wentrex conversation creation wrappers
- `policy/wentrexMessagingPolicy.js` — LMS role-based messaging rules
- `hooks/useIdentity.js` — communication-specific identity resolution

---

## Allowed Imports

| From | Allowed? |
|------|----------|
| `@chat` | YES — only in setup.js, adapters/, policy/, index.js |
| `@/features/identity` | YES — via useWentrexIdentity hooks |
| `@/services/supabase` | YES — for learning.* queries (e.g., get_messageable_contacts) |
| `@identity` | NO |
| `apps/VCSM` | NO |

---

## Forbidden

- Screens/components outside features/communication MUST NOT import from `@chat` directly
- All chat hook consumption goes through `@/features/communication` index.js
- No engine-internal imports (DAL, model, service files from engines/chat/src/)
- No vc.* schema queries
- No VCSM concepts

---

## Wentrex Messaging Policy

The engine delegates policy decisions to Wentrex via `resolveConversationPolicy` config injection.

Wentrex rules:
- Administration <-> Staff (direct)
- Staff <-> Parent (direct)
- Student <-> Staff (direct)
- Student <-> Parent (direct)
- Announcements: Admin -> Staff or Staff -> Parent only
- Students cannot initiate conversations with other students
