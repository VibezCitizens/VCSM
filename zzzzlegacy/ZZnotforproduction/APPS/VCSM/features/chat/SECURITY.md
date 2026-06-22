# Security Posture — chat

Last Updated: 2026-06-05
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-CHAT-001, VEN-CHAT-002, BW-CHAT-002, ELEK-2026-06-04-001

---

## VENOM STATUS
VENOM Last Run: 2026-06-05 (modules: chat-root, start, debug — TICKET-ARCHITECT-DASHBOARD-0001)
VENOM Status: COMPLETE

7 findings total: 0 CRITICAL, 2 HIGH, 3 MEDIUM, 2 LOW

| Finding ID | Severity | Source Run | Description |
|---|---|---|---|
| VEN-CHAT-001 | HIGH | 2026-06-04 | inboxActions.controller (pin/mute/archive/folder-move) has no membership check before writing chat.inbox_entries — former members can mutate their inbox state for conversations they were removed from |
| VEN-CHAT-002 | HIGH | 2026-06-04 | editMessage.write.dal.js has no sender_actor_id SQL filter; chat.messages UPDATE RLS policy not in VCSM-tracked migrations — multi-actor users (Vport active persona) may experience silent edit failures |
| VEN-CHAT-003 | MEDIUM | 2026-06-04 | useMessagePrivacySettings stores whoCanMessage/allowNewMessageRequests in localStorage only — no server-side enforcement; startDirectConversation does not read target actor privacy setting |
| VEN-CHAT-004 | MEDIUM | 2026-06-04 | chatNavDebugger.js and chatBadgeDebugger.js default isEnabled() to true without a module-level import.meta.env.DEV guard — activatable via window flag in production |
| VEN-CHAT-005 | LOW | 2026-06-04 | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen invariants documented |
| VEN-CHAT-006 | MEDIUM | 2026-06-05 | StartConversationModal.pickDirect() passes raw query string as actor ID — no UUID validation at app layer; engine DI resolvers are last line of defense |
| VEN-CHAT-007 | LOW | 2026-06-05 | searchActors reads viewerActorId from Zustand getState() — stale viewer context during identity switch may expose blocked actors in search results |

2026-06-04 output: ZZnotforproduction/APPS/VCSM/features/chat/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_chat-security-review.md
2026-06-05 output: ZZnotforproduction/APPS/VCSM/features/chat/outputs/2026/06/05/Venom/2026-06-05_venom_chat-modules-chat-start-debug.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-05 (modules: chat-root, start, debug — TICKET-ARCHITECT-DASHBOARD-0001)
ELEKTRA Status: COMPLETE

10 findings total: 0 CRITICAL, 1 HIGH, 4 MEDIUM, 4 LOW, 1 INFO
5 False Positives Rejected (3 from 2026-06-04 + 2 from 2026-06-05)

| Finding ID | Severity | Source Run | Description |
|---|---|---|---|
| ELEK-2026-06-04-001 | HIGH | 2026-06-04 | ensureConversationMembership silently re-activates 'left' membership — actor who left can force-rejoin via sendMessage |
| ELEK-2026-06-04-002 | MEDIUM | 2026-06-04 | inboxActions.controller.js — no membership check before inbox mutations; archiveConversationForActor creates ghost inbox_entries |
| ELEK-2026-06-04-003 | MEDIUM | 2026-06-04 | editMessageDAL has no sender_actor_id SQL filter — single-layer defense; RLS on chat.messages UPDATE unconfirmed |
| ELEK-2026-06-04-004 | MEDIUM | 2026-06-04 | recordChatAttachment.controller.js — ownerActorId not verified against message sender before attachment writeback |
| ELEK-2026-06-04-005 | MEDIUM | 2026-06-04 | whoCanMessage / allowNewMessageRequests localStorage-only — zero server enforcement in startDirectConversation |
| ELEK-2026-06-04-006 | LOW | 2026-06-04 | openConversation.rpc.js — unconditional production console.log of actorId, conversationId, conversation metadata |
| ELEK-2026-06-04-007 | LOW | 2026-06-04 | updateInboxFlags accepts arbitrary flags spread into UPDATE — no column allowlist at controller or DAL layer |
| ELEK-2026-06-04-008 | LOW | 2026-06-04 | moveConversationToFolder — folder value not validated against allowlist before DB upsert |
| ELEK-2026-06-04-009 | INFO | 2026-06-04 | chatBadgeDebugger / chatNavDebugger isEnabled() defaults true — no module-level DEV guard (confirmed by ELEK-2026-06-05-CD-001) |
| ELEK-2026-06-05-CD-001 | LOW | 2026-06-05 | chatBadgeDebugger.js:49-52 — actorId full UUID exposed via production console.log; no import.meta.env guard on source chain |

2026-06-05 False Positives Rejected:
- resolveActorRealmContext realm spoofing — no write sink reachable from app scope (chat-root module)
- pickDirect actor ID IDOR — engine sink chain unverifiable from app scope; engine source required (start module)

THOR Release Blocker: ELEK-2026-06-04-001 (HIGH, Open)

2026-06-04 output: ZZnotforproduction/APPS/VCSM/features/chat/outputs/2026/06/04/ELEKTRA/2026-06-04_20-00_elektra_chat-security-review.md
2026-06-05 output: ZZnotforproduction/APPS/VCSM/features/chat/outputs/2026/06/05/ELEKTRA/2026-06-05_15-00_elektra_chat-modules-chat-start-debug.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-05 (modules: chat-root, start, debug — TICKET-ARCHITECT-DASHBOARD-0001)
BLACKWIDOW Status: COMPLETE

10 findings total: 0 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW, 2 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-CHAT-001 | HIGH | inboxActions controllers (pin/mute/archive/folder-move/deleteThread) have no ownership assertion — actorId is passed through without verifying it matches the session actor; RLS is the only barrier | PARTIAL | OPEN |
| BW-CHAT-002 | HIGH | ensureConversationMembership silently re-activates 'left' membership status when sendMessage or deleteMessageForMe is called — an actor who left a conversation can re-enter it without explicit re-invite | BYPASSED | OPEN |
| BW-CHAT-003 | MEDIUM | navigate() uses raw conversationId UUID in URL path (/chat/[UUID]) — violates platform "No raw IDs in public URLs" policy | PARTIAL | OPEN |
| BW-CHAT-004 | MEDIUM | whoCanMessage privacy setting is localStorage-only; startDirectConversation does not read target actor's privacy preference — server does not enforce message blocking preference | BYPASSED | OPEN |
| BW-CHAT-005 | MEDIUM | chatNavDebugger.isEnabled() and chatBadgeDebugger.isEnabled() default to true when window flag is not set — no import.meta.env.DEV guard; both are activatable in production | BYPASSED | OPEN — re-verified 2026-06-05 SOURCE_VERIFIED |
| BW-CHAT-006 | LOW | recordChatAttachmentController has no ownership assertion — does not verify ownerActorId is the sender of the target messageId before writing media_asset_id to attachment row | PARTIAL | OPEN |
| BW-CHAT-007 | LOW | Multiple unconditional console.log statements in engines/chat/src/dal/openConversation.rpc.js (lines 16, 28-33, 49-54, 93-99) log conversationId and actorId in production with no DEV guard | BYPASSED | OPEN |
| BW-CHAT-008 | INFO | Actor-switch race condition in useInboxActions — memoized callbacks close over stale actorId during active identity switch; mutations in-flight complete against wrong actor's inbox | PARTIAL | OPEN |
| BW-CHAT-009 | MEDIUM | pickDirect() in StartConversationModal bypasses identity.search_actor_directory visibility filters — actors excluded from search (deactivated, private realm, RPC-filtered) can be directly addressed by UUID if known | BYPASSED | OPEN |
| BW-CHAT-010 | INFO | pickDirect() non-UUID string — SQL injection BLOCKED by parameterized queries; DB-layer error terminates chain; app-layer UUID validation absent | PARTIAL | OPEN |

2026-06-04 output: ZZnotforproduction/APPS/VCSM/features/chat/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_chat-adversarial-review.md
2026-06-05 output: ZZnotforproduction/APPS/VCSM/features/chat/outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_chat-modules-chat-start-debug.md
