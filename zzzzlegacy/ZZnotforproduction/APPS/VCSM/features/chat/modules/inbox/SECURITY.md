---
title: Inbox Module — Security
status: ACTIVE
feature: chat
module: inbox
source: review-verified + source-verified + scanner-verified
created: 2026-06-04
updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/inbox/
review-sources: VENOM 2026-06-04, ELEKTRA 2026-06-04, BlackWidow 2026-06-04
---

# chat / modules / inbox — SECURITY

All findings sourced from existing VENOM, ELEKTRA, and BlackWidow security reviews attributed to inbox scope. No findings created without evidence.

## CONFIRMED_FINDINGS

### FINDING-1 — THOR BLOCKER

| Field | Value |
|---|---|
| IDs | VEN-CHAT-001 / BW-CHAT-001 / ELEK-2026-06-04-002 |
| Severity | HIGH |
| Title | Inbox Write Without Actor Membership Check |
| Sources | VENOM, ELEKTRA, BlackWidow 2026-06-04 (independent confirmation) |
| Location | engines/chat/src/controller/inboxActions.controller.js + engines/chat/src/dal/inbox.write.dal.js |
| Review Paths | features/chat/outputs/2026/06/04/ (all three reviews) |
| Status | THOR BLOCKER — OPEN |

chat.inbox_entries UPDATE operations (archive, mark-read, folder-move, delete) execute without first verifying the requesting actor is a member of the target conversation. An attacker controlling actor_id can update another actor's inbox row.

THOR Gate: VEN-CHAT-001 is a confirmed THOR blocker. Feature cannot ship until resolved.

---

### FINDING-2

| Field | Value |
|---|---|
| IDs | VEN-CHAT-003 / ELEK-2026-06-04-005 / BW-CHAT-004 |
| Severity | MEDIUM |
| Title | Message Privacy Settings — Client-Side Only, No Server Enforcement |
| Sources | VENOM, ELEKTRA, BlackWidow 2026-06-04 |
| Location | apps/VCSM/src/features/chat/inbox/hooks/useMessagePrivacySettings.js |
| Review Paths | features/chat/outputs/2026/06/04/ |
| Status | OPEN |

whoCanMessage ('everyone'|'following'|'nobody') and allowNewMessageRequests are stored exclusively in localStorage (key: vc.message_privacy_settings). No server-side enforcement. Direct API calls can initiate a conversation regardless of stated privacy preference. [SOURCE_VERIFIED: useMessagePrivacySettings.js]

---

### FINDING-3

| Field | Value |
|---|---|
| ID | ELEK-2026-06-04-007 |
| Severity | LOW |
| Title | updateInboxFlags — No Flags Allowlist |
| Source | ELEKTRA 2026-06-04 |
| Location | engines/chat/src/dal/inbox.write.dal.js:155-176 |
| Review Path | features/chat/outputs/2026/06/04/ELEKTRA/ |
| Status | OPEN |

Flags object passed to updateInboxFlags is spread directly to UPDATE payload without an allowlist. Unexpected columns can be written if the call is reachable with attacker-controlled input.

---

### FINDING-4

| Field | Value |
|---|---|
| ID | ELEK-2026-06-04-008 |
| Severity | LOW |
| Title | moveConversationToFolder — No Folder Value Allowlist |
| Source | ELEKTRA 2026-06-04 |
| Location | engines/chat/src/controller/inboxActions.controller.js:23-33 |
| Review Path | features/chat/outputs/2026/06/04/ELEKTRA/ |
| Status | OPEN |

folder parameter written directly to chat.inbox_entries.folder without validation against the known enum ('inbox'|'spam'|'requests'|'archived'). Arbitrary string values can be persisted.

---

## SCANNER_SIGNALS

| Signal | Source | Notes |
|---|---|---|
| inbox module ownership confidence LOW | ownership-map.json | Decision, security, data owners all null |
| inbox behaviors scanner confidence MEDIUM | behavior-map.json | Not HIGH — some behaviors may be misclassified |
| BlockedUsersScreen — blocks table RLS not traced from inbox scope | source-verified | useMyBlocks reads from VCSM:block feature; RLS on blocks table not verified from inbox module |

## UNVERIFIED_SURFACES

Not findings — gaps requiring further investigation.

| Surface | Gap | Priority |
|---|---|---|
| engine:reviews dependency | Appears in dependency-map for chat but no inbox source file confirms its use — purpose UNKNOWN | LOW |
| BlockedUsersScreen RLS | Block table RLS not independently traced from inbox module | MEDIUM |
| InboxChatSettingsScreen write surface | Source file not fully traced — write surfaces unconfirmed | LOW |
| Archived/spam/requests filter | Confirmed server-side via useInboxFolder.js WHERE folder=:folder, but RLS restricting actor_id at DB level not independently confirmed | MEDIUM |

## THOR Status

| Gate | Status | Finding |
|---|---|---|
| THOR BLOCKER | OPEN | VEN-CHAT-001 — Inbox write without membership check |

Feature-level THOR eligibility: BLOCKED. See features/chat/SECURITY.md.

## Review Sources

| Review | Date | Path |
|---|---|---|
| VENOM | 2026-06-04 | features/chat/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_chat-security-review.md |
| ELEKTRA | 2026-06-04 | features/chat/outputs/2026/06/04/ELEKTRA/2026-06-04_20-00_elektra_chat-security-review.md |
| BlackWidow | 2026-06-04 | features/chat/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_chat-adversarial-review.md |
| Feature SECURITY.md | 2026-06-04 | features/chat/SECURITY.md |
