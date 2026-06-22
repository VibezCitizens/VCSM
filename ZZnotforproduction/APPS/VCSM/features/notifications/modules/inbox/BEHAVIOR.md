---
title: Inbox Module — Behavior
status: STUB
feature: notifications
module: inbox
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / inbox — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder (BW-NOTI-010 THOR BLOCKER).

## Expected Behaviors (UNVERIFIED)

- Notifications screen loads actor's inbox items (unread first)
- Header controller displays unread count badge
- Actor can mark individual notification read/dismissed/archived
- Actor can mark all seen via header action
- Block filter: inbox items from blocked senders filtered via blockFilter.js
- resolveInboxActor: resolves vport vs personal actor identity for inbox scoping
- vport branch with missing ownerActorId silently returns null (BW-NOTI-003)

## Invariants (UNVERIFIED)

- All mutations must be scoped to the authenticated actor's inbox (NOT enforced at application layer — BW-NOTI-001 BYPASSED)
- recipientId must derive from session (NOT enforced — BW-NOTI-002 PARTIAL)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Confirm RLS on notification.inbox_items (BW-NOTI-004 UNRESOLVED)
