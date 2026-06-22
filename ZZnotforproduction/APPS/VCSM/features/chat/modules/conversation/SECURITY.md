---
title: Conversation Module — Security
status: STUB
feature: chat
module: conversation
source: scanner-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/chat/conversation/
---

# chat / modules / conversation — SECURITY

## Status

STUB. No module-scoped security review completed.

## Existing Review Coverage

Parent feature has active security reviews:
- VENOM: `outputs/2026/06/04/Venom/2026-06-04_19-48_venom_chat-security-review.md`
- ELEKTRA: `outputs/2026/06/04/ELEKTRA/2026-06-04_20-00_elektra_chat-security-review.md`
- BlackWidow: `outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_chat-adversarial-review.md`

## Key Risk Surface (unverified)

- `/chat/:conversationId` — conversation ID in URL: confirm caller is a participant, not just authenticated
- Message read access — Supabase RLS must restrict to conversation participants only
- Realtime channel authorization — channel must be scoped to participant actors

## TODO

- [ ] Extract conversation-specific findings from existing feature-level reviews
- [ ] Verify RLS policy on messages table: SELECT restricted to sender or recipient only
- [ ] Confirm conversationId ownership check before rendering conversation
- [ ] Verify realtime channel subscription is participant-scoped
