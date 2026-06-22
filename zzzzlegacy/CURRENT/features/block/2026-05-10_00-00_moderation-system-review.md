# VCSM Moderation System Review
**Date:** 2026-05-10  
**Agents:** ARCHITECT · VENOM · DB · KRAVEN  
**Scope:** apps/VCSM — read-only analysis  
**Mode:** No DB writes. No schema changes. No code modifications. All SQL is proposal-only.

---

## 1. MODERATION SYSTEM MAP

### Architecture Overview

VCSM separates moderation into two independent systems that share the `moderation.*` schema:

**System A — User-Facing Moderation (Report/Hide/Cover)**  
Handles reporter-initiated content flagging. Users report content, which creates rows in `moderation.reports`. Separately, actors can hide specific posts, comments, or conversations from their own view via actor-scoped `moderation.actions`.

**System B — Block System (Safety Graph)**  
Handles actor-to-actor safety relationships. Block/unblock is RPC-backed (server-side atomic), producing rows in `moderation.blocks` and `moderation.block_events`.

Both systems are actor-first: identity is always `actorId` + `domain`. Neither system exposes raw `user_id` on the application surface.

### Feature Map

```
features/moderation/
  adapters/
    components/
      ChatSpamCover.adapter.js         ← adapter for spam cover UI
      ReportModal.adapter.js           ← adapter for report modal
      ReportThanksOverlay.adapter.js   ← thanks after report
      ReportedObjectCover.adapter.js   ← content cover overlay
    hooks/
      useCommentVisibility.adapter.js  ← comment visibility cross-feature adapter
      useConversationCover.adapter.js  ← conversation cover cross-feature adapter
      useHidePostForActor.adapter.js   ← post hide cross-feature adapter
      usePostVisibility.adapter.js     ← post visibility cross-feature adapter
      useReportFlow.adapter.js         ← report flow cross-feature adapter
  components/
    ChatSpamCover.jsx                  ← UI: spam/cover overlay in chat
    ReportCoverScreen.jsx              ← UI: blocked content cover
    ReportModal.jsx                    ← UI: report reason picker modal
    ReportThanksOverlay.jsx            ← UI: post-report confirmation
    ReportedObjectCover.jsx            ← UI: covers reported content
  controllers/
    assertModerationAccess.controller.js   ← app-layer admin gate
    commentVisibility.controller.js        ← hide/unhide comment logic
    getConversationCoverStatus.controller.js ← is this convo covered?
    moderationActions.controller.js        ← hide/dismiss report (admin only)
    postVisibility.controller.js           ← hide/unhide post logic
    report.controller.js                   ← create report use-case
    undoConversationCover.controller.js    ← remove spam cover
  dal/
    assertModerationAccess.dal.js       ← DB check: actor in platform_admins?
    conversationCover.read.dal.js       ← read latest message in convo
    conversationCover.write.dal.js      ← update inbox folder
    moderationActions.dal.js            ← CRUD on moderation.actions
    reports.dal.columns.js              ← column projection constants
    reports.dal.js                      ← CRUD on moderation.reports + report_events
    reports.read.dal.js                 ← read reports by id or dedupe_key
  hooks/
    useCommentVisibility.js             ← hook: comment hide/unhide state
    useConversationCover.js             ← hook: convo cover hydration + undo
    useHidePostForActor.js              ← hook: single hide action
    usePostVisibility.js                ← hook: post hide/unhide state
    useReportFlow.js                    ← hook: report modal state machine
  models/
    report.model.js                     ← raw row → domain report translation
  types/
    moderation.js                       ← enum constants: types, reasons, statuses

features/block/
  adapters/
    hooks/
      useBlockActorAction.adapter.js    ← cross-feature adapter
      useBlockStatus.adapter.js         ← cross-feature adapter
    ui/
      ActorActionsMenu.jsx              ← actions menu (block entry point)
      BlockConfirmModal.adapter.js      ← confirm dialog adapter
  controllers/
    blockActor.controller.js            ← block/unblock/toggle (session-bound)
    getBlockStatus.controller.js        ← check current block state
    getBlockedActorSet.controller.js    ← bulk block filter for feed/chat
  dal/
    block.check.dal.js                  ← checkBlockStatus / isBlocked
    block.read.dal.js                   ← fetch block lists + filterBlockedActors
    block.write.dal.js                  ← calls block_actor / unblock_actor RPCs
  guards/
    BlockGate.jsx                       ← render gate for blocked actors
  helpers/
    applyBlockSideEffects.js            ← deleteFriendRankRowsBetweenActors
  hooks/
    useBlockActions.js                  ← block/unblock with session binding
    useBlockActorAction.js              ← single-actor block action hook
    useBlockStatus.js                   ← bidirectional block status hook
  ui/
    BlockButton.jsx
    BlockConfirmModal.jsx
    BlockedState.jsx

engines/chat/src/
  controller/
    markConversationSpam.controller.js  ← spam cover + moderation.actions write
  dal/
    moderationActions.write.dal.js      ← engine-owned moderation action write

features/settings/privacy/
  dal/blocks.dal.js                     ← settings list-blocks + RPC calls
```

### DB Schema Map

```
moderation schema:
  moderation.blocks         — actor-to-actor safety relationships
  moderation.block_events   — audit trail for block/unblock events
  moderation.reports        — reporter-filed content flags
  moderation.report_events  — audit trail for report state changes
  moderation.actions        — per-actor hide/unhide + moderator actions

Chat schema (legacy):
  chat.moderation_actions   — OLD chat-scoped moderation table (appears unused by current system)

vc schema (direct mutation):
  vc.posts                  — is_hidden, hidden_at, hidden_by_actor_id fields
  chat.messages             — is_hidden, hidden_at, hidden_by_actor_id fields

Platform admin:
  learning.platform_admins  — cross-platform admin roster (misaligned with moderation schema)

Chat inbox:
  chat.inbox_entries        — folder field ('inbox', 'spam', 'archived')
```

---

## 2. MODERATION FLOW TRACE

### Flow 1: User Reports a Post

```
User taps "Report" on post
  → useReportFlow.start({ objectType: 'post', objectId: postId })
  → ReportModal opens (reason picker)
  → useReportFlow.submit({ reasonCode, reasonText })
  → createReportController({ reporterActorId, objectType: 'post', objectId })
    → getReportRowByDedupeKey() [optional idempotency check — moderation.reports]
    → insertReportRow() → moderation.reports INSERT
      [if reasonCode='spam' AND objectType='conversation']
      → upsertInboxEntryFolder() → chat.inbox_entries folder='spam'
    → insertReportEventRow() → moderation.report_events INSERT
      [MAY FAIL silently — see FINDING SEC-001]
  → report domain object returned → ReportThanksOverlay shown
```

### Flow 2: User Hides a Post (Actor-Scoped)

```
User taps "Hide" on post
  → useHidePostForActor({ actorId, postId, reason })
  → hidePostForActor() [postVisibility.controller.js]
  → insertModerationActionDAL({ target_type: 'post', action_type: 'hide' })
    → moderation.actions INSERT
  → Feed re-renders: getHiddenPostIdsForActor() reads moderation.actions
    → latest-action-wins over postIds
    → hidden posts excluded from visible set
```

### Flow 3: User Covers/Reports a Conversation (Spam)

**Path A — via moderation feature (report modal):**
```
User taps "Report" on conversation
  → createReportController({ objectType: 'conversation', reasonCode: 'spam' })
    → insertReportRow() → moderation.reports
    → upsertInboxEntryFolder(folder='spam') → chat.inbox_entries
  → conversation moves to spam folder in inbox
```

**Path B — via chat engine (markConversationSpam):**
```
User triggers spam mark in chat UI
  → markConversationSpam({ reporterActorId, conversationId })
    → readConversationMembershipDAL() [membership check]
    → moveConversationToFolder(folder='spam') → chat.inbox_entries
    → insertConversationHideModerationActionDAL() → moderation.actions [non-fatal]
    → publishDomainEvent(REPORT_SUBMITTED) → chat.outbox_events
```

**Path C — view undo (useConversationCover):**
```
App hydrates: getConversationCoverStatus({ actorId, conversationId })
  → dalGetConversationHideAction() → moderation.actions WHERE action_type='hide'
User taps "undo spam":
  → undoConversationCover({ actorId, conversationId })
    → dalDeleteConversationHideAction() → DELETE from moderation.actions
    → updateConversationInboxFolderDAL(folder='inbox') → chat.inbox_entries
    → readLatestConversationMessageDAL() → chat.messages
    → updateConversationInboxLastMessageDAL() → chat.inbox_entries
```

### Flow 4: Moderator Reviews and Hides Content

```
[Hypothetical — no dashboard exists yet]
Moderator calls hideReportedObjectController({ moderatorActorId, reportId })
  → assertModerationAccessController(moderatorActorId)
    → isModerationAuthorizedDAL(actorId) → learning.platform_admins SELECT
    → throws FORBIDDEN if not in platform_admins
  → getReportRowById({ reportId }) → moderation.reports
  → [if post] hidePostRow() → vc.posts UPDATE (is_hidden=true)
  → [if message] hideMessageRow() → chat.messages UPDATE (is_hidden=true)
  → insertModerationActionRow() → moderation.actions INSERT
  → updateReportRowStatus(status='actioned') → moderation.reports UPDATE
  → insertReportEventRow(eventType='content_hidden') → moderation.report_events
```

### Flow 5: Block Actor

```
User taps "Block" on actor profile
  → useBlockActions(myActorId, targetActorId)
    [session binding: uses useIdentity() → sessionActorId]
  → blockActorController(blockerActorId, blockedActorId, assertingActorId)
    → asserts assertingActorId === blockerActorId [throws if mismatch]
    → checkBlockStatus(blockerActorId, blockedActorId) → moderation.blocks SELECT
    → if not already blocked:
      → blockActorDAL() → moderation.block_actor RPC (SECURITY DEFINER)
        [server-side atomically]:
          INSERT moderation.blocks (upsert, reactivates if released)
          INSERT moderation.block_events (event_type='blocked')
          UPDATE vc.actor_follows SET is_active=false [blocker→blocked direction only]
      → deleteFriendRankRowsBetweenActors() → vc.friend_ranks DELETE
    → invalidateFeedBlockCache(blockerActorId) [TTL cache bust]
```

### Flow 6: Feed Block Enforcement

```
Feed loads posts
  → fetchCentralFeedPage()
    → feed.read.blockRows.dal reads moderation.blocks [cached 60s TTL]
    → builds blockedActorSet
  → normalizeFeedRows() applies resolveFeedRowVisibilityModel()
    → isActorBlockedForViewerModel(actorId, blockedActorSet)
    → blocked actor posts get visible=false, reason='blocked_actor'
    → hidden posts from moderation.actions filtered via usePostVisibility
```

### Flow 7: Feed RLS Block Enforcement (DB Layer)

```
posts_select_actor_based policy on vc.posts:
  → allows: owner always OR (NOT blocked in either direction AND (public OR following))
  → block check: EXISTS in moderation.blocks WHERE status='active' AND bidirectional
  → requires blocks_select_blocked policy to see author-blocked-viewer direction
```

### Flow 8: Chat Block Enforcement

```
chat_messages_insert_poster policy on chat.messages:
  → sender = current_actor AND can_current_actor_post(conversation_id)
  → AND NOT EXISTS (blocked pair in moderation.blocks for direct conversations)
  → group chats NOT covered by this policy
```

---

## 3. TABLE INVENTORY

### moderation.blocks

| Field | Type | Notes |
|-------|------|-------|
| blocker_domain | text NOT NULL | 'vc' or 'learning' |
| blocker_actor_id | uuid NOT NULL | composite PK part |
| blocked_domain | text NOT NULL | 'vc' or 'learning' |
| blocked_actor_id | uuid NOT NULL | composite PK part |
| status | text NOT NULL DEFAULT 'active' | CHECK: 'active' or 'released' |
| reason | text NULL | optional block reason |
| created_at | timestamptz NOT NULL DEFAULT now() | |
| updated_at | timestamptz NOT NULL DEFAULT now() | |
| released_at | timestamptz NULL | set on unblock |
| meta | jsonb NOT NULL DEFAULT '{}' | |

**RLS:** ENABLED. **Force RLS:** NO — service_role bypasses all policies.

**Policies:**
- `blocks_select_own` — blocker can see their own blocks (is_current_vc_actor)
- `blocks_select_blocked` — blocked actor can see rows where they are target (migration 20260510010000)
- `blocks_insert_own` — blocker can insert (is_current_vc_actor)
- `blocks_update_own` — blocker can update own blocks
- `moderation_blocks_select_moderator` — can_manage_domain(blocker_domain OR blocked_domain)
- `moderation_blocks_select_self` — duplicate of blocks_select_own (is_self_actor)
- `moderation_blocks_insert_self` — duplicate of blocks_insert_own (is_self_actor)
- `moderation_blocks_update_self` — duplicate of blocks_update_own
- NO explicit DELETE policy — hard delete is not prevented at RLS level

**Sensitive fields:** reason, meta (may contain IP or context)

---

### moderation.block_events

| Field | Type | Notes |
|-------|------|-------|
| id | uuid NOT NULL DEFAULT gen_random_uuid() | PK |
| blocker_domain | text NOT NULL | |
| blocker_actor_id | uuid NOT NULL | |
| blocked_domain | text NOT NULL | |
| blocked_actor_id | uuid NOT NULL | |
| event_type | text NOT NULL | CHECK: 'blocked' or 'unblocked' |
| reason | text NULL | |
| actor_domain | text NULL | who performed the action |
| actor_id | uuid NULL | |
| meta | jsonb NOT NULL DEFAULT '{}' | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**RLS:** ENABLED. **Force RLS:** NO.

**Policies:**
- `block_events_select_own` — blocker can select their own events
- `block_events_insert_own` — blocker can insert (with domain + is_current_vc_actor checks)
- `moderation_block_events_select_self` — duplicate of select_own
- `moderation_block_events_insert_self` — duplicate of insert_own
- `moderation_block_events_select_moderator` — can_manage_domain(blocker OR blocked) **⚠ BROKEN — see SEC-003**
- NO UPDATE or DELETE policy

**Sensitive fields:** actor_id (who blocked whom + who performed action), reason

---

### moderation.reports

| Field | Type | Notes |
|-------|------|-------|
| id | uuid NOT NULL DEFAULT gen_random_uuid() | PK |
| reporter_domain | text NOT NULL | CHECK: vc/learning/chat/system |
| reporter_actor_id | uuid NOT NULL | who filed the report |
| target_domain | text NOT NULL | CHECK: vc/learning/chat/system |
| target_type | text NOT NULL | post/comment/message/conversation/actor/profile/vport |
| target_id | uuid NOT NULL | |
| parent_target_domain | text NULL | context parent (e.g. post for a comment) |
| parent_target_type | text NULL | |
| parent_target_id | uuid NULL | |
| reason_code | text NOT NULL | CHECK: 12 allowed values |
| reason_text | text NULL | optional freeform text |
| status | text NOT NULL DEFAULT 'open' | CHECK: open/triaged/in_review/needs_more_info/actioned/dismissed |
| priority | smallint NOT NULL DEFAULT 3 | CHECK: 1-5 |
| assigned_domain | text NULL | assigned moderator domain |
| assigned_actor_id | uuid NULL | assigned moderator |
| reviewed_at | timestamptz NULL | |
| resolved_at | timestamptz NULL | |
| resolution | text NULL | CHECK: 7 allowed values |
| internal_note | text NULL | moderator-only note |
| dedupe_key | text NULL | idempotency key |
| meta | jsonb NOT NULL DEFAULT '{}' | includes legacy conversationId/postId/messageId |
| created_at | timestamptz NOT NULL DEFAULT now() | |
| updated_at | timestamptz NOT NULL DEFAULT now() | |

**RLS:** ENABLED. **Force RLS:** NO.

**Policies:**
- `moderation_reports_insert_self` — reporter can insert own reports (is_self_actor)
- `moderation_reports_select_self` — reporter can read own reports filed
- `moderation_reports_select_moderator` — can_manage_domain(target_domain) **⚠ BROKEN — see SEC-003**
- `moderation_reports_update_moderator` — can_manage_domain(target_domain) **⚠ BROKEN — see SEC-003**
- NO reporter UPDATE policy — reporters cannot retract or modify
- NO DELETE policy — reports cannot be deleted (intended behavior)

**Sensitive fields:** reporter_actor_id, internal_note, reason_text, meta (contains context IDs)

---

### moderation.report_events

| Field | Type | Notes |
|-------|------|-------|
| id | uuid NOT NULL DEFAULT gen_random_uuid() | PK |
| report_id | uuid NOT NULL | FK → moderation.reports(id) ON DELETE CASCADE |
| actor_domain | text NULL | |
| actor_id | uuid NULL | who performed the event |
| event_type | text NOT NULL | CHECK: created/assigned/status_changed/note_added/action_taken/dismissed/reopened |
| data | jsonb NOT NULL DEFAULT '{}' | event payload |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**RLS:** ENABLED. **Force RLS:** NO.

**Policies:**
- `moderation_report_events_select_self` — reporter can select events on their own reports (subquery join)
- `moderation_report_events_select_moderator` — can_manage_domain(report.target_domain) **⚠ BROKEN — see SEC-003**
- `moderation_report_events_insert_moderator` — can_manage_domain(report.target_domain) **⚠ BROKEN — see SEC-003**
- **NO reporter INSERT policy** — reporters cannot write audit events directly **⚠ see SEC-002**

**Sensitive fields:** actor_id, data (contains target IDs and action details)

---

### moderation.actions

| Field | Type | Notes |
|-------|------|-------|
| id | uuid NOT NULL DEFAULT gen_random_uuid() | PK |
| report_id | uuid NULL | FK → moderation.reports(id) ON DELETE SET NULL |
| actor_domain | text NOT NULL | CHECK: vc/learning/chat/system |
| actor_id | uuid NOT NULL | who performed the action |
| target_domain | text NOT NULL | CHECK: vc/learning/chat/system |
| target_type | text NOT NULL | CHECK: hide/unhide/delete/warn/suspend/ban/mute_conversation/remove_member/block/unblock |
| target_id | uuid NOT NULL | |
| action_type | text NOT NULL | |
| reason | text NULL | |
| expires_at | timestamptz NULL | expiry for temporary actions — NOT ENFORCED BY ANY TRIGGER |
| reversed_at | timestamptz NULL | |
| reversed_by_domain | text NULL | |
| reversed_by_actor_id | uuid NULL | |
| reversal_reason | text NULL | |
| meta | jsonb NOT NULL DEFAULT '{}' | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**RLS:** ENABLED. **Force RLS:** NO.

**Policies:**
- `actions_insert_self_hide` — actor can insert own hide/unhide only (is_current_vc_actor)
- `actions_select_own` — actor can read own actions (is_current_vc_actor)
- `actions_delete_own_hide` — actor can delete own hide/unhide actions
- `moderation_actions_insert_moderator` — can_manage_domain(target_domain) **⚠ BROKEN — see SEC-003**
- `moderation_actions_select_moderator` — can_manage_domain(target_domain) **⚠ BROKEN — see SEC-003**
- `moderation_actions_update_moderator` — can_manage_domain(target_domain) **⚠ BROKEN — see SEC-003**
- NO anon policy

**Sensitive fields:** actor_id, target_id, reason, meta

---

### chat.moderation_actions (LEGACY — appears unused by current system)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid NOT NULL DEFAULT gen_random_uuid() | PK |
| object_type | text NOT NULL | CHECK: message/conversation/member |
| object_id | uuid NOT NULL | |
| conversation_id | uuid NULL | |
| message_id | uuid NULL | |
| actor_id | uuid NULL | |
| action_type | text NOT NULL | CHECK: hide/unhide/delete/warn/mute_conversation/remove_member |
| reason | text NULL | |
| expires_at | timestamptz NULL | |
| meta | jsonb NOT NULL DEFAULT '{}' | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**RLS status:** Unknown — not confirmed in schema extract for RLS enablement.  
**Current usage:** Zero application-layer references found in current codebase. The engine chat CLAUDE.md lists it in the schema but the current system writes to `moderation.actions` instead.  
**Risk:** Table may be publicly readable if RLS not enabled.

---

### learning.platform_admins

| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| actor_id | uuid NOT NULL UNIQUE | FK → learning.actors(id) ON DELETE CASCADE |
| (other fields inferred) | | |

**RLS:** ENABLED.  
**Note:** This is a Learning schema table. The VCSM moderation system borrows it as the admin roster. This is an intentional cross-schema dependency but creates a moderation governance problem — platform admins are managed via the learning product, not a dedicated moderation role table.

---

## 4. CONTROLLER / DAL INVENTORY

### Moderation Feature — Controllers

| Controller | File | Purpose | Ownership Check | Session Binding | Risk |
|---|---|---|---|---|---|
| `createReportController` | report.controller.js | Insert report + audit event | Reporter domain check (is_self_actor at DB) | reporterActorId passed from hook | None critical — users can only report |
| `hideReportedObjectController` | moderationActions.controller.js | Hide post or message globally | `assertModerationAccessController` → `learning.platform_admins` | moderatorActorId from caller | LOW — app-layer guard present |
| `dismissReportController` | moderationActions.controller.js | Dismiss report | `assertModerationAccessController` | same | LOW |
| `assertModerationAccessController` | assertModerationAccess.controller.js | Gate for all mod actions | Checks `learning.platform_admins` | none | MEDIUM — app-layer only, DB bypasses possible |
| `getHiddenPostIdsForActor` | postVisibility.controller.js | Read hidden post set | None — reads own actions only (RLS) | actorId from caller | LOW |
| `hidePostForActor` | postVisibility.controller.js | Actor-scoped post hide | None — RLS actions_insert_self_hide | actorId from caller | LOW |
| `getHiddenCommentIdsForActor` | commentVisibility.controller.js | Read hidden comment set | RLS scoped | actorId from caller | LOW |
| `getConversationCoverStatus` | getConversationCoverStatus.controller.js | Is convo covered? | None — reads own actions | actorId from caller | LOW |
| `undoConversationCover` | undoConversationCover.controller.js | Undo spam cover | None — deletes own actions | actorId from caller | LOW — RLS scoped |

### Block Feature — Controllers

| Controller | File | Purpose | Ownership Check | Session Binding | Risk |
|---|---|---|---|---|---|
| `blockActorController` | blockActor.controller.js | Block actor | `assertingActorId === blockerActorId` + RPC ownership | `assertingActorId` from `useIdentity()` | LOW — properly session-bound |
| `unblockActorController` | blockActor.controller.js | Unblock actor | Same + `checkBlockStatus` ownership check | same | LOW |
| `toggleBlockActorController` | blockActor.controller.js | Toggle block | Same | same | LOW |
| `ctrlGetBlockStatus` | getBlockStatus.controller.js | Read block status | None — public read (RLS scoped) | actorId from caller | LOW |
| `ctrlGetBlockedActorSet` | getBlockedActorSet.controller.js | Bulk block filter | None — RLS scoped | actorId from caller | LOW |

### Moderation DALs

| DAL | File | Tables | Risk |
|---|---|---|---|
| `insertReportRow` | reports.dal.js | moderation.reports | LOW — RLS insert_self |
| `updateReportRowStatus` | reports.dal.js | moderation.reports | MEDIUM — no app-layer auth check in DAL itself |
| `insertReportEventRow` | reports.dal.js | moderation.report_events | HIGH — silently disables on RLS failure (SEC-002) |
| `insertModerationActionRow` | reports.dal.js | moderation.actions | MEDIUM — called by moderator controller but no DAL-level ownership check |
| `hidePostRow` | reports.dal.js | vc.posts | MEDIUM — direct content mutation, only called by moderator controller |
| `hideMessageRow` | reports.dal.js | chat.messages | MEDIUM — same |
| `getReportRowById` | reports.read.dal.js | moderation.reports | LOW |
| `getReportRowByDedupeKey` | reports.read.dal.js | moderation.reports | LOW |
| `isModerationAuthorizedDAL` | assertModerationAccess.dal.js | learning.platform_admins | MEDIUM — cross-schema dependency |
| `listModerationActionsForActorOnObjectsDAL` | moderationActions.dal.js | moderation.actions | LOW — RLS scoped |
| `dalGetConversationHideAction` | moderationActions.dal.js | moderation.actions | LOW |
| `dalDeleteConversationHideAction` | moderationActions.dal.js | moderation.actions | LOW — deletes own actions |

### Block DALs

| DAL | File | Tables | Risk |
|---|---|---|---|
| `blockActor` | block.write.dal.js | moderation.block_actor RPC | LOW — RPC has ownership check |
| `unblockActor` | block.write.dal.js | moderation.unblock_actor RPC | LOW — same |
| `checkBlockStatus` | block.check.dal.js | moderation.blocks | LOW — reads own + partner |
| `isBlocked` | block.check.dal.js | moderation.blocks | LOW |
| `fetchActorsIBlocked` | block.read.dal.js | moderation.blocks | LOW — scoped to actorId |
| `fetchActorsWhoBlockedMe` | block.read.dal.js | moderation.blocks | LOW |
| `fetchBlockGraph` | block.read.dal.js | moderation.blocks (×2 parallel) | MEDIUM — 2 queries per call |
| `filterBlockedActors` | block.read.dal.js | moderation.blocks | LOW — bulk OR query |
| `deleteFriendRankRowsBetweenActors` | applyBlockSideEffects.js | vc.friend_ranks | MEDIUM — client-side, failure silently swallowed |

---

## 5. RLS & SECURITY DEFINER REVIEW

### All Moderation RLS Policies

| Table | Policy | CMD | Roles | Condition | Status |
|---|---|---|---|---|---|
| moderation.blocks | blocks_select_own | SELECT | authenticated | is_current_vc_actor(blocker_actor_id) | ✅ Correct |
| moderation.blocks | blocks_select_blocked | SELECT | authenticated | is_current_vc_actor(blocked_actor_id) | ✅ Added 20260510010000 |
| moderation.blocks | blocks_insert_own | INSERT | authenticated | is_current_vc_actor(blocker_actor_id) | ✅ Correct |
| moderation.blocks | blocks_update_own | UPDATE | authenticated | is_current_vc_actor(blocker_actor_id) | ✅ Correct |
| moderation.blocks | moderation_blocks_select_self | SELECT | authenticated | is_self_actor(blocker_domain, blocker_actor_id) | ⚠️ Duplicate of select_own |
| moderation.blocks | moderation_blocks_insert_self | INSERT | authenticated | is_self_actor(blocker_domain, blocker_actor_id) | ⚠️ Duplicate of insert_own |
| moderation.blocks | moderation_blocks_update_self | UPDATE | authenticated | is_self_actor(blocker_domain, blocker_actor_id) | ⚠️ Duplicate of update_own |
| moderation.blocks | moderation_blocks_select_moderator | SELECT | authenticated | **can_manage_domain(blocker/blocked_domain)** | 🔴 BROKEN — see SEC-003 |
| moderation.block_events | block_events_select_own | SELECT | authenticated | is_current_vc_actor(blocker_actor_id) | ✅ Correct |
| moderation.block_events | block_events_insert_own | INSERT | authenticated | domain checks + is_current_vc_actor(blocker+actor) | ✅ Correct |
| moderation.block_events | moderation_block_events_select_self | SELECT | authenticated | is_self_actor(blocker_domain, blocker_actor_id) | ⚠️ Duplicate |
| moderation.block_events | moderation_block_events_insert_self | INSERT | authenticated | is_self_actor(blocker_domain, blocker_actor_id) | ⚠️ Duplicate |
| moderation.block_events | moderation_block_events_select_moderator | SELECT | authenticated | **can_manage_domain(blocker/blocked)** | 🔴 BROKEN |
| moderation.reports | moderation_reports_insert_self | INSERT | authenticated | is_self_actor(reporter_domain, reporter_actor_id) | ✅ Correct |
| moderation.reports | moderation_reports_select_self | SELECT | authenticated | is_self_actor(reporter_domain, reporter_actor_id) | ✅ Correct |
| moderation.reports | moderation_reports_select_moderator | SELECT | authenticated | **can_manage_domain(target_domain)** | 🔴 BROKEN |
| moderation.reports | moderation_reports_update_moderator | UPDATE | authenticated | **can_manage_domain(target_domain)** | 🔴 BROKEN |
| moderation.report_events | moderation_report_events_select_self | SELECT | authenticated | is_self_actor(report.reporter_domain, reporter_actor_id) | ✅ Correct |
| moderation.report_events | moderation_report_events_select_moderator | SELECT | authenticated | **can_manage_domain(report.target_domain)** | 🔴 BROKEN |
| moderation.report_events | moderation_report_events_insert_moderator | INSERT | authenticated | **can_manage_domain(report.target_domain)** | 🔴 BROKEN |
| moderation.actions | actions_insert_self_hide | INSERT | authenticated | hide/unhide only + is_current_vc_actor | ✅ Correct |
| moderation.actions | actions_select_own | SELECT | authenticated | is_current_vc_actor(actor_id) | ✅ Correct |
| moderation.actions | actions_delete_own_hide | DELETE | authenticated | hide/unhide only + is_current_vc_actor | ✅ Correct |
| moderation.actions | moderation_actions_insert_moderator | INSERT | authenticated | **can_manage_domain(target_domain)** | 🔴 BROKEN |
| moderation.actions | moderation_actions_select_moderator | SELECT | authenticated | **can_manage_domain(target_domain)** | 🔴 BROKEN |
| moderation.actions | moderation_actions_update_moderator | UPDATE | authenticated | **can_manage_domain(target_domain)** | 🔴 BROKEN |

### SECURITY DEFINER Functions — Moderation Scope

| Function | Schema | Type | search_path | Risk |
|---|---|---|---|---|
| `moderation.block_actor` | moderation | plpgsql SECURITY DEFINER | moderation, vc, public, auth | ✅ Ownership check before any DML |
| `moderation.unblock_actor` | moderation | plpgsql SECURITY DEFINER | moderation, vc, public, auth | ✅ Ownership check before any DML |
| `moderation.is_current_vc_actor` | moderation | sql STABLE SECURITY DEFINER | moderation, vc, public, auth | ✅ Pure check function |
| `moderation.current_vc_actor_ids` | moderation | sql STABLE SECURITY DEFINER | moderation, platform, vc, public, auth | ✅ Pure lookup |
| `moderation.is_self_actor` | moderation | sql STABLE (NOT SECURITY DEFINER) | default | ✅ No elevation |
| `moderation.can_manage_domain` | moderation | sql STABLE (NOT SECURITY DEFINER) | default | 🔴 Logic is wrong — see SEC-003 |
| `moderation.set_updated_at` | moderation | plpgsql trigger (no SECURITY DEFINER) | default | ✅ Benign trigger |
| `chat.can_current_actor_moderate` | chat | sql STABLE SECURITY DEFINER | (chat schema) | ✅ Membership-based check |
| `learning.is_current_user_platform_admin` | learning | plpgsql STABLE SECURITY DEFINER | (learning schema) | ✅ Correct admin check |

---

## 6. CURRENT MODERATION CAPABILITIES

| Capability | Implemented | Authority Layer | Notes |
|---|---|---|---|
| Report actor | ✅ | moderation.reports | objectType='actor' or 'profile' or 'vport' |
| Report post | ✅ | moderation.reports | objectType='post' |
| Report comment | ✅ | moderation.reports | objectType='comment' |
| Report message | ✅ | moderation.reports | objectType='message' |
| Report conversation | ✅ | moderation.reports + chat.inbox_entries | Bridges to spam folder |
| Report deduplication | ✅ | moderation.reports.dedupe_key | Optional, controller-level |
| Actor-scoped post hide | ✅ | moderation.actions (action_type='hide') | Viewer-local only |
| Actor-scoped post unhide | ✅ | moderation.actions (action_type='unhide') | Latest-action-wins |
| Actor-scoped comment hide | ✅ | moderation.actions | Propagates to descendants |
| Actor-scoped comment unhide | ✅ | moderation.actions | |
| Conversation spam cover | ✅ | moderation.actions + chat.inbox_entries | Two paths (report modal + chat engine) |
| Conversation spam undo | ✅ | moderation.actions delete + inbox folder restore | |
| Block actor | ✅ | moderation.blocks (RPC) | Bidirectional RLS, follow deactivation |
| Unblock actor | ✅ | moderation.blocks (RPC) | Soft release, no follow restoration |
| Toggle block | ✅ | Same as above | |
| View own blocks list | ✅ | moderation.blocks | In settings privacy |
| Feed block filter | ✅ | moderation.blocks + moderation.actions | Client + DB RLS dual enforcement |
| Chat block filter (INSERT) | ✅ | moderation.blocks (RLS on chat.messages) | Direct chats only |
| Post RLS block exclusion | ✅ | moderation.blocks subquery in posts_select_actor_based | Both directions |
| Moderator hide content globally | ✅ | vc.posts + chat.messages direct mutation | Admin-only, no dashboard |
| Moderator dismiss report | ✅ | moderation.reports UPDATE | Admin-only, no dashboard |
| Block audit trail | ✅ | moderation.block_events | |
| Report audit trail | ⚠️ BROKEN | moderation.report_events | Reporter INSERT silently disabled — see SEC-002 |
| Moderation event log | ✅ | moderation.report_events | Moderator writes work; reporter writes fail |
| Admin-only report queue | ❌ | Missing | No dashboard route, no assignment flow |
| Moderation role table | ❌ | Missing | `moderation.moderators` never created |
| Report priority triage | ❌ | Missing | priority field exists but no triage UI |
| Report assignment | ❌ | Missing | assigned_actor_id field exists but no assignment flow |
| Content expiry enforcement | ❌ | Missing | expires_at on actions never enforced by trigger |
| Spam detection / automation | ❌ | Missing | No automated classifiers |
| Notification on moderation action | ❌ | Missing | No notifications to actor when content hidden |
| Appeal flow | ❌ | Missing | |
| Group chat block enforcement | ❌ | Partial | Block RLS only covers direct conversations |

---

## 7. DASHBOARD READINESS REVIEW

### What Already Exists and Can Be Reused

| Asset | Reusability | Notes |
|---|---|---|
| `moderation.reports` table | HIGH | Full schema, indexes, status/priority fields |
| `moderationActions.controller.js` | HIGH | `hideReportedObjectController`, `dismissReportController` — needs admin route wrapper |
| `report.controller.js` | READ-ONLY | Not reusable for dashboard — reporter-side only |
| `assertModerationAccessController` | HIGH | Gate every dashboard operation |
| `moderation.report_events` audit trail | MEDIUM | Exists but reporter events are broken |
| `moderation.actions` visibility table | HIGH | Powers post/comment hide state |
| Block event log | HIGH | `moderation.block_events` — already indexed |
| `moderation.blocks` admin SELECT | BROKEN | `can_manage_domain` needs fix first (SEC-003) |

### What Can Be Reused Safely (As-Is)

- `assertModerationAccessController` — already production-grade
- `hideReportedObjectController` + `dismissReportController` — already production-grade, need only a route
- All DAL functions in reports.dal.js and moderationActions.dal.js
- `moderation.reports` indexes are dashboard-ready (status+priority, target, reporter)

### What Requires New Admin-Only APIs

- Report queue listing — needs a new DAL: `listOpenReportsDAL({ status, priority, page, limit })`
- Report detail view — needs `getReportWithEventsDAL({ reportId })`  
- Moderator action history — needs `listModerationActionsDAL({ page, limit, targetType })`
- Block summary report — needs `listAllActiveBlocksDAL({ page, limit })` — admin only
- Content search by target — needs filter by `target_type` + `target_id`
- Assignment flow — needs `assignReportToModeratorController`

### What Needs Pagination/Filter/Search

- Report queue: paginate by `created_at DESC`, filter by `status`, `priority`, `target_type`, `reason_code`
- Block list (admin view): paginate by `created_at DESC`
- Action log: paginate by `created_at DESC`, filter by `action_type`, `target_type`
- Report events: paginate per-report

### What Must NOT Be Exposed Directly to Dashboard UI

- `internal_note` — should never render in user-facing code, only moderator dashboard
- `meta` — raw JSONB, may contain sensitive context IDs
- `reason_text` — reporter freeform text, must be sanitized before display
- Full `moderation.block_events` — audit trail, not public

### What Needs Event History

- Each report needs a timeline: `moderation.report_events` ordered by `created_at ASC`
- Each block needs a timeline: `moderation.block_events` ordered by `created_at ASC`

### What Needs Escalation Queues

No escalation model exists yet. Recommend:
- Priority 1-2 reports auto-escalate to a `high_priority` queue
- Status `in_review` (exists in DB but not app types) can represent escalated state
- Assignment via `assigned_actor_id` already exists — needs UI only

---

## 8. SECURITY FINDINGS (VENOM)

---

### 🔴 SEC-001 — CRITICAL — Broken Moderation Authorization Gate (CISSP: Access Control, Security Architecture)

**Severity:** CRITICAL  
**Trust Boundary:** Database layer vs. application layer  
**Risk:** Privilege escalation, unauthorized content moderation

**Description:**  
`moderation.can_manage_domain('vc')` returns `TRUE` for **any authenticated user who has a vc actor**:

```sql
when p_domain = 'vc' then exists (
  select 1 from vc.actor_owners ao
  join vc.actors a on a.id = ao.actor_id
  where ao.user_id = auth.uid()
    and coalesce(ao.is_void, false) = false
)
```

This is every VCSM user. Therefore, the following RLS policies grant full access to the moderation system to ALL vc users via direct Supabase client calls, bypassing the application layer entirely:

- `moderation_reports_select_moderator` — any vc user can READ all moderation reports
- `moderation_reports_update_moderator` — any vc user can UPDATE any report status/resolution
- `moderation_report_events_insert_moderator` — any vc user can INSERT audit events
- `moderation_report_events_select_moderator` — any vc user can READ all audit events
- `moderation_actions_insert_moderator` — any vc user can INSERT moderation actions on any target
- `moderation_actions_select_moderator` — any vc user can READ all moderation actions
- `moderation_actions_update_moderator` — any vc user can UPDATE any moderation action
- `moderation_block_events_select_moderator` — any vc user can READ all block events
- `moderation_blocks_select_moderator` — any vc user can READ all block relationships

**The application layer is not the problem** — `assertModerationAccessController` correctly checks `learning.platform_admins`. But the DB layer has no such guard, and the Supabase JS client is fully accessible to any browser.

**Exposure vector:** Open browser DevTools → authenticated Supabase client → direct `.schema('moderation').from('reports').select(...)` → receives all reports.

---

### 🔴 SEC-002 — HIGH — Silent Audit Trail Disablement (CISSP: Audit and Accountability)

**Severity:** HIGH  
**Trust Boundary:** Client-side session state  
**Risk:** Complete loss of report audit trail for the lifetime of a user session

**Description:**  
`reports.dal.js` contains a module-level singleton flag:

```js
let skipReportEventsInsertForSession = false
```

When `insertReportEventRow` receives an RLS denial, it sets this flag to `true` and all subsequent `insertReportEventRow` calls return `{ skipped: true }` for the rest of the session, **without error**. This is a deliberate workaround for the missing reporter INSERT policy on `moderation.report_events`.

The root cause is that `moderation.report_events` has no INSERT policy for the reporter — only `moderation_report_events_insert_moderator` (which is broken per SEC-001 but irrelevant here). Reporters consistently hit RLS denial on first report event, disable audit trail permanently for their session, and file all subsequent reports with no events recorded.

**Result:** Report events for regular users are effectively never written. The audit trail exists in the schema but is empty for all non-admin reports.

---

### 🔴 SEC-003 — HIGH — No Dedicated Moderation Role Table (CISSP: Access Control, Identity Management)

**Severity:** HIGH  
**Trust Boundary:** Cross-schema governance  
**Risk:** Governance violation, incorrect admin roster, schema coupling

**Description:**  
The application checks `learning.platform_admins` for moderation access. The comment in `assertModerationAccess.dal.js` explicitly references `moderation.moderators` as a planned table that does not exist:

```js
// Role tables checked (in order):
//   1. learning.platform_admins  — existing cross-platform admin table
//   2. moderation.moderators     — moderation-specific role table
//      (extend the query here when that table is created)
```

This means:
- Moderation roles are governed by the Learning product's admin table
- A Learning platform admin is automatically a VCSM content moderator and vice versa — no separation of concern
- The moderation schema has no self-contained authority table

---

### 🟡 SEC-004 — MEDIUM — No FORCE ROW LEVEL SECURITY on Moderation Tables (CISSP: Access Control)

**Severity:** MEDIUM  
**Risk:** Service-role keys and admin connections bypass all RLS policies

**Description:**  
None of the moderation tables (`moderation.blocks`, `moderation.block_events`, `moderation.reports`, `moderation.report_events`, `moderation.actions`) have `FORCE ROW LEVEL SECURITY` enabled. The tables that DO have it: `vc.posts`, `chat.conversations`, `chat.messages`, `chat.conversation_members`, etc.

Without force-RLS, any `service_role` connection (Edge Functions, background workers, admin tools) bypasses all policies and reads/writes raw data. For content tables like posts this is intentional. For the moderation audit tables, it creates a risk surface for data exposure via misconfigured worker processes.

---

### 🟡 SEC-005 — MEDIUM — Block Side Effects Are Partially Client-Side (CISSP: Integrity)

**Severity:** MEDIUM  
**Risk:** Stale friend ranks after failed client-side cleanup

**Description:**  
The `block_actor` RPC handles: blocks upsert, block_events insert, and follow deactivation (blocker→blocked direction). But `vc.friend_ranks` cleanup (`deleteFriendRankRowsBetweenActors`) is client-side only. The failure is silently swallowed:

```js
try {
  await deleteFriendRankRowsBetweenActors(blockerActorId, blockedActorId);
} catch {}
```

If the client connection drops mid-block, stale friend rank rows persist. Additionally, the RPC only deactivates follows in the **blocker→blocked** direction. If the blocked actor was also following the blocker, that follow edge remains active after the block.

---

### 🟡 SEC-006 — MEDIUM — No Report Event INSERT Policy for Reporters (CISSP: Audit and Accountability)

**Severity:** MEDIUM  
**Risk:** Audit trail integrity permanently broken for all user-filed reports

**Description:**  
There is no `moderation_report_events_insert_self` policy. Reporters cannot write their own `report_events`. The workaround (SEC-002) makes this permanent. Even when SEC-001 is fixed (correcting can_manage_domain), reporters will still need their own INSERT policy.

---

### 🟡 SEC-007 — MEDIUM — Duplicate RLS Policies on moderation.blocks (CISSP: Security Architecture)

**Severity:** LOW-MEDIUM  
**Risk:** Policy maintenance confusion, unexpected policy interaction

**Description:**  
`moderation.blocks` has 6 policies where 3 are functionally equivalent duplicates:
- `blocks_select_own` ≈ `moderation_blocks_select_self`
- `blocks_insert_own` ≈ `moderation_blocks_insert_self`
- `blocks_update_own` ≈ `moderation_blocks_update_self`

Similarly for `moderation.block_events`. Duplicate policies create ambiguity: when one is modified, the duplicate may silently override or conflict. This is a maintenance risk.

---

### 🟡 SEC-008 — MEDIUM — Action expires_at Not Enforced (CISSP: Access Control)

**Severity:** MEDIUM  
**Risk:** Temporary moderation actions (suspend, mute) never expire

**Description:**  
`moderation.actions.expires_at` field exists and is set by `insertModerationActionRow({ expiresAt })`. There is no DB trigger, cron job, or application-level enforcement that reads expired actions and reverses them. A `suspend` or `mute_conversation` action with a 24-hour `expires_at` will remain active forever unless a moderator manually reverses it.

---

### 🟢 SEC-009 — LOW — chat.moderation_actions Legacy Table May Lack RLS

**Severity:** LOW  
**Risk:** Potential unauthenticated read of legacy moderation data

**Description:**  
`chat.moderation_actions` table exists in the schema but its RLS status was not confirmed in the extracted schema fragments. The current application does not read or write this table. If it contains historical data from a previous system and RLS is not enabled, the data is publicly readable.

---

### 🟢 SEC-010 — LOW — No Bidirectional Follow Cleanup on Block (CISSP: Integrity)

**Severity:** LOW  
**Risk:** Phantom social graph edges after block

**Description:**  
`moderation.block_actor` RPC deactivates only `WHERE follower_actor_id = p_blocker_actor_id AND followed_actor_id = p_blocked_actor_id`. The reverse direction (blocked actor follows blocker) is not deactivated. The blocked actor remains a "follower" of the blocker in `vc.actor_follows`.

---

## 9. PERFORMANCE FINDINGS (KRAVEN)

---

### 🔴 PERF-001 — HIGH — N+1 Block Check Pattern in Some Call Sites

**Description:**  
`checkBlockStatus` is called per-actor-pair in several places (profile views, comment rendering), with no batch alternative for bulk scenarios. Each call issues:

```sql
SELECT blocker_actor_id, blocked_actor_id
FROM moderation.blocks
WHERE status='active'
AND (and(...) or and(...))
LIMIT 2
```

For a feed page with 20 posts from different actors, this could be 20 separate block status calls if not batched via `filterBlockedActors`. Confirm that all feed paths use the batch version.

**Mitigation available:** `filterBlockedActors` (block.read.dal.js) handles this correctly for feed pages.

---

### 🟡 PERF-002 — HIGH — getHiddenPostIdsForActor Called Per Feed Page Without Cache

**Description:**  
`getHiddenPostIdsForActor({ actorId, postIds })` issues:

```sql
SELECT ... FROM moderation.actions
WHERE actor_id = ? AND target_type = 'post' AND target_id IN (...)
AND action_type IN ('hide', 'unhide')
ORDER BY created_at DESC
```

This is called on every feed page load with the current page's post IDs. There is no caching layer for this query. For a user who has hidden many posts, this query touches a potentially large set of actions. The index `idx_moderation_actions_target` covers `(target_domain, target_type, target_id, created_at DESC)` but the actual query filters by `actor_id` first — the index `actions_select_own` condition is actor-based but no composite index on `(actor_id, target_type, target_id)` was confirmed.

---

### 🟡 PERF-003 — MEDIUM — Report Events INSERT Policy Subquery Cost

**Description:**  
`moderation_report_events_insert_moderator` policy:

```sql
EXISTS (
  SELECT 1 FROM moderation.reports r
  WHERE r.id = report_events.report_id
    AND moderation.can_manage_domain(r.target_domain)
)
```

This subquery runs on every INSERT into `moderation.report_events`. At low volume this is fine, but as report volume grows this subquery scans `moderation.reports` per insert. The FK `report_events_report_id_fkey` ensures the join hits a PK — this is low risk currently but worth monitoring.

---

### 🟡 PERF-004 — MEDIUM — Duplicate Indexes on moderation.blocks

**Description:**  
The snapshot confirms two pairs of functionally identical indexes:

```
blocks_lookup_idx          = moderation_blocks_lookup_idx
  btree (blocker_domain, blocker_actor_id, blocked_domain, blocked_actor_id, status)

blocks_reverse_lookup_idx  = moderation_blocks_reverse_lookup_idx
  btree (blocked_domain, blocked_actor_id, blocker_domain, blocker_actor_id, status)
```

These are exact duplicates. Both write paths update both indexes on every INSERT/UPDATE to `moderation.blocks`. Double the write overhead and double the storage for zero additional query benefit.

---

### 🟡 PERF-005 — MEDIUM — fetchBlockGraph Issues Two Parallel DB Calls

**Description:**  
`fetchBlockGraph(actorId)` fires:

```js
Promise.all([
  supabase.schema("moderation").from("blocks").select("blocked_actor_id").eq("blocker_actor_id", actorId).eq("status", "active"),
  supabase.schema("moderation").from("blocks").select("blocker_actor_id").eq("blocked_actor_id", actorId).eq("status", "active"),
])
```

Two network roundtrips per call. At low volume fine. Consider a single RPC that returns both sets.

---

### 🟢 PERF-006 — LOW — moderation.reports Status Index May Not Cover Dashboard Query Pattern

**Description:**  
`idx_moderation_reports_status_priority` covers `(status, priority, created_at DESC)`. A dashboard query filtering by `status='open'` with `ORDER BY priority ASC, created_at ASC` would need the index reversed. Monitor this once a dashboard is built.

---

### 🟢 PERF-007 — LOW — Block Cache TTL May Lag After Block Write

**Description:**  
`feedBlockCache` has a 60-second TTL. After a block action, `invalidateFeedBlockCache(blockerActorId)` is called, which is correct. However, the cache stores the blocker's block list only. If a second actor needs a fresh view (e.g., the blocked actor's own feed), no invalidation occurs on the blocked side. The blocked actor's feed will lag up to 60 seconds before excluding their own posts from their own feed (if relevant).

---

## 10. DATABASE REVIEW ITEMS

---

### DB REVIEW ITEM 1

**Object:** `moderation.can_manage_domain(p_domain text)`  
**Application Scope:** All moderator RLS policies  
**Current behavior:** Returns TRUE for 'vc' when the caller has ANY active vc actor. Effectively grants moderation SELECT/UPDATE/INSERT privileges to every VCSM user.  
**Problem:** Moderation policies intended to protect admin-only data are accessible to all authenticated users via direct Supabase client calls.  
**Why it matters:** Any browser can read all moderation reports, update report statuses, and insert moderation actions on any content without going through the application layer.  
**Recommended improvement:** Rewrite to check `learning.platform_admins` (or the future `moderation.moderators` table) instead of vc actor ownership.  
**Rationale:** Consistent with how `learning.is_current_user_platform_admin()` correctly restricts admin access in the learning schema.  
**Risk if unchanged:** Full moderation data exposure. Any user can dismiss reports, read all filed reports, and perform moderation actions on any content.  
**Example SQL proposal (text only — do not run):**

```sql
-- Proposed replacement for moderation.can_manage_domain
-- Replace the current vc branch with a platform_admins check

CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN p_domain IN ('vc', 'chat', 'system') THEN (
      -- Check learning.platform_admins joined through actor ownership
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    WHEN p_domain = 'learning' THEN learning.is_current_user_platform_admin()
    ELSE false
  END;
$$;
```

---

### DB REVIEW ITEM 2

**Object:** `moderation.report_events` — INSERT policy  
**Application Scope:** All report creation flows  
**Current behavior:** No INSERT policy for reporters. Only `moderation_report_events_insert_moderator` exists (which is also broken per Item 1). Reporters cannot write their own events, causing permanent session-level audit trail disablement.  
**Problem:** The audit trail for all user-filed reports is empty. The workaround in the application layer (`skipReportEventsInsertForSession`) makes this permanent and silent.  
**Why it matters:** Moderation compliance requires an audit trail of when reports were created. Without reporter INSERT, there is no record of who filed what and when beyond the report row itself.  
**Recommended improvement:** Add a reporter self-insert policy mirroring the existing `moderation_reports_insert_self` pattern.  
**Rationale:** Reporter should be able to write their own `created` event — same trust as inserting the report row itself.  
**Risk if unchanged:** Audit trail is permanently empty for all user-filed reports.  
**Example SQL proposal (text only — do not run):**

```sql
DROP POLICY IF EXISTS "moderation_report_events_insert_self" ON moderation.report_events;

CREATE POLICY "moderation_report_events_insert_self"
  ON moderation.report_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM moderation.reports r
      WHERE r.id = report_events.report_id
        AND moderation.is_self_actor(r.reporter_domain, r.reporter_actor_id)
    )
    AND event_type = 'created'
  );
```

---

### DB REVIEW ITEM 3

**Object:** `moderation.blocks` — FORCE ROW LEVEL SECURITY  
**Application Scope:** All block enforcement  
**Current behavior:** RLS enabled but not forced. service_role connections bypass all policies.  
**Problem:** Edge Functions, workers, or admin scripts connected with service_role can read or write blocks without restriction.  
**Why it matters:** Block relationships are privacy-sensitive. A compromised worker or misconfigured Edge Function could expose or manipulate the block graph.  
**Recommended improvement:** Enable FORCE ROW LEVEL SECURITY on moderation tables.  
**Rationale:** Matches the pattern used on vc.posts, chat.conversations, and chat.messages.  
**Risk if unchanged:** Service-role access to block data bypasses all privacy guarantees.  
**Example SQL proposal (text only — do not run):**

```sql
ALTER TABLE moderation.blocks FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.block_events FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.reports FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.report_events FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.actions FORCE ROW LEVEL SECURITY;
```

---

### DB REVIEW ITEM 4

**Object:** Duplicate indexes on `moderation.blocks`  
**Application Scope:** Block write performance  
**Current behavior:** Four indexes exist where two pairs are identical (`blocks_lookup_idx` = `moderation_blocks_lookup_idx`, `blocks_reverse_lookup_idx` = `moderation_blocks_reverse_lookup_idx`).  
**Problem:** Double write cost on every block/unblock operation. Double storage. Zero additional query coverage.  
**Why it matters:** Every call to `block_actor` or `unblock_actor` RPC updates 5 indexes (PK + 4 indexes where 2 are redundant). As block volume grows, this wastes IO.  
**Recommended improvement:** Drop the older `moderation_blocks_*` variants and keep the newer `blocks_*` pair plus `idx_moderation_blocks_blocked`.  
**Rationale:** The snapshot explicitly notes: "duplicate of blocks_lookup_idx — consider dropping."  
**Risk if unchanged:** Minor write performance degradation at scale.  
**Example SQL proposal (text only — do not run):**

```sql
DROP INDEX IF EXISTS moderation.moderation_blocks_lookup_idx;
DROP INDEX IF EXISTS moderation.moderation_blocks_reverse_lookup_idx;
```

---

### DB REVIEW ITEM 5

**Object:** `moderation.actions.expires_at` — unenforced expiry  
**Application Scope:** Temporary moderation actions (suspend, mute, warn)  
**Current behavior:** `expires_at` column exists and can be set, but no trigger or job reverses expired actions.  
**Problem:** A temporary 24-hour suspend never expires. The actor remains suspended indefinitely.  
**Why it matters:** Temporary enforcement is a standard moderation pattern. Without expiry enforcement, all time-bound decisions become permanent.  
**Recommended improvement:** Add a trigger or scheduled function that reverses actions where `expires_at < now()` and `reversed_at IS NULL`.  
**Rationale:** Schema already supports the expiry lifecycle (reversed_at, reversed_by_domain, reversed_by_actor_id, reversal_reason) — only the enforcement mechanism is missing.  
**Risk if unchanged:** Temporary bans/suspends become permanent.  
**Example SQL proposal (text only — do not run):**

```sql
-- Proposal: scheduled function to expire actions (run via pg_cron or Edge Function worker)
-- Text only — do not run

CREATE OR REPLACE FUNCTION moderation.expire_timed_actions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE moderation.actions
  SET
    reversed_at = now(),
    reversed_by_domain = 'system',
    reversal_reason = 'expired'
  WHERE expires_at IS NOT NULL
    AND expires_at < now()
    AND reversed_at IS NULL
    AND action_type IN ('suspend', 'mute_conversation', 'ban', 'warn');
END;
$$;
```

---

### DB REVIEW ITEM 6

**Object:** `moderation.block_actor` RPC — unidirectional follow deactivation  
**Application Scope:** Block flow, follow graph integrity  
**Current behavior:** RPC deactivates `vc.actor_follows WHERE follower_actor_id = p_blocker_actor_id AND followed_actor_id = p_blocked_actor_id`. Only the blocker's outbound follow is removed.  
**Problem:** If the blocked actor was also following the blocker, that follow remains active. The blocked actor continues to receive content from the person they've been blocked by.  
**Why it matters:** Safety expectation: a block should prevent both parties from seeing each other in follows/feed.  
**Recommended improvement:** Add a second UPDATE to deactivate follows in both directions.  
**Rationale:** Matches the bidirectional expectation for the block safety model.  
**Risk if unchanged:** Blocked actor's follow of their blocker remains active, they may see blocker content.  
**Example SQL proposal (text only — do not run):**

```sql
-- Inside moderation.block_actor, after the existing UPDATE:
UPDATE vc.actor_follows
SET is_active = false
WHERE followed_actor_id = p_blocker_actor_id
  AND follower_actor_id = p_blocked_actor_id;
```

---

### DB REVIEW ITEM 7

**Object:** `moderation.moderators` — missing table  
**Application Scope:** Moderation authorization  
**Current behavior:** No dedicated moderator role table. All admin checks fall through to `learning.platform_admins`.  
**Problem:** Moderation governance is coupled to the Learning product schema. VCSM content moderators and Learning platform admins are forced to be the same role.  
**Why it matters:** As VCSM scales, you will want moderators who are not LMS admins, and LMS admins who cannot moderate VCSM content.  
**Recommended improvement:** Create `moderation.moderators` with domain, actor_id, role (viewer, moderator, admin), and then update `can_manage_domain` to check this table with `learning.platform_admins` as a fallback.  
**Rationale:** The DAL comment already anticipates this: `// extend the query here when that table is created`.  
**Risk if unchanged:** All moderation access is gated by LMS admin status. Governance cannot be separated by product.  
**Example SQL proposal (text only — do not run):**

```sql
CREATE TABLE IF NOT EXISTS moderation.moderators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL CHECK (domain IN ('vc', 'learning', 'chat', 'system')),
  actor_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'moderator' CHECK (role IN ('viewer', 'moderator', 'admin')),
  granted_by_actor_id uuid,
  granted_at timestamptz DEFAULT now() NOT NULL,
  revoked_at timestamptz,
  UNIQUE (domain, actor_id)
);

ALTER TABLE moderation.moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation.moderators FORCE ROW LEVEL SECURITY;
```

---

## 11. MODERATION DASHBOARD PLAN (Design Only)

### Recommended Architecture

A moderation dashboard must be a **protected admin-only route family** inside `apps/VCSM/src/features/moderation/`. It must be completely separate from the existing user-facing moderation adapters.

```
apps/VCSM/src/features/moderation/
  dashboard/
    screens/
      ModerationDashboardScreen.jsx        ← Final Screen (identity gate only)
      ModerationQueueView.jsx              ← View Screen (report list)
      ModerationReportDetailView.jsx       ← View Screen (report + actions)
      ModerationBlockLogView.jsx           ← View Screen (block audit log)
    hooks/
      useReportQueue.js                    ← read open reports, paginated
      useReportDetail.js                   ← read report + events
      useModerationAction.js               ← perform hide/dismiss
      useBlockAuditLog.js                  ← read block_events
    controllers/ (NEW)
      listOpenReports.controller.js        ← paginated report queue
      getReportWithEvents.controller.js    ← report + event timeline
      listModerationActions.controller.js  ← action history
      listBlockEvents.controller.js        ← block audit log
    dal/ (NEW)
      reportQueue.read.dal.js              ← SELECT from moderation.reports WHERE status='open'
      reportDetail.read.dal.js             ← SELECT reports + report_events
      blockAuditLog.read.dal.js            ← SELECT block_events
```

### Admin Route Structure

```
/admin/moderation                       ← queue overview
/admin/moderation/reports               ← paginated report queue
/admin/moderation/reports/:reportId     ← report detail + action
/admin/moderation/blocks                ← block audit log
/admin/moderation/actions               ← moderation action history
```

All routes must be gated by a `<ModerationAdminGate>` component that:
1. Calls `isModerationAuthorizedDAL(actorId)` on mount
2. Renders a `403` screen if unauthorized
3. Never renders children for non-admins

### Controller Boundaries

- All dashboard read operations go through new admin controllers — never expose raw DAL to the screen
- All dashboard write operations go through existing `moderationActions.controller.js` (already admin-gated)
- New controllers must call `assertModerationAccessController` before any DB read

### RLS Strategy

**Fix SEC-001 first (can_manage_domain).** Without this fix, the dashboard RLS policies are bypassed by all users. After the fix:

- Report queue read: `moderation_reports_select_moderator` (target_domain check)
- Report update: `moderation_reports_update_moderator`
- Action insert: `moderation_actions_insert_moderator`
- Block log read: `moderation_block_events_select_moderator`

### Moderation Queue Model

```
Priority Queue:
  status='open'
  ORDER BY priority ASC, created_at ASC
  
Filter dimensions:
  - status: open / triaged / in_review / actioned / dismissed
  - priority: 1-5
  - target_type: post / comment / message / actor / conversation
  - reason_code: spam / harassment / hate / etc.
  - created_at: date range

Pagination:
  - cursor-based by created_at + id (stable sort)
  - page size: 25-50

Assignment:
  - assigned_actor_id: moderator assigned to this report
  - in_review status: report being actively worked
```

### Escalation Model

```
Priority 1-2 → High Priority Queue (auto-route)
Priority 3   → Standard Queue
Priority 4-5 → Low Priority Queue

Status flow:
  open → triaged → in_review → actioned | dismissed
                              ↓
                         needs_more_info
                              ↓
                           reopened
```

### Audit/Event Model

Each report gets a timeline from `moderation.report_events`:
```
created → assigned → status_changed → note_added → action_taken → dismissed/actioned
```

Each block gets a timeline from `moderation.block_events`:
```
blocked → unblocked
```

### Pagination/Search/Filter Strategy

```
Report queue:
  GET /admin/moderation/reports?status=open&priority=1&page=2&limit=25
  Cursor: (created_at, id) for stable pagination under concurrent inserts

Block log:
  GET /admin/moderation/blocks?actor_id=...&from=...&to=...

Needed index (does not exist):
  CREATE INDEX idx_moderation_reports_dashboard
    ON moderation.reports (status, priority ASC, created_at ASC, id)
    WHERE status IN ('open', 'triaged', 'in_review', 'needs_more_info');
```

### Realtime Updates

Use Supabase Realtime channel on `moderation.reports` to push new report counts to a dashboard badge. Subscribe only to `INSERT` events with `status='open'`. Do not subscribe to full report payloads in realtime — admin pulls detail on demand.

---

## 12. PRIORITY PLAN

### CRITICAL (Fix Before Dashboard Exists)

1. **SEC-001 / DB-001** — Fix `moderation.can_manage_domain` to check `platform_admins` not vc actor ownership. Every moderator RLS policy is broken without this. Currently any user can read all reports.

2. **SEC-002 / DB-002** — Add `moderation_report_events_insert_self` policy. Remove or refactor `skipReportEventsInsertForSession`. The audit trail must work.

### HIGH (Fix Before Public Launch)

3. **SEC-003 / DB-007** — Create `moderation.moderators` table. Separate moderation governance from Learning admin.

4. **DB-006** — Fix `block_actor` RPC to deactivate follows bidirectionally.

5. **SEC-005** — Move `vc.friend_ranks` cleanup into the `block_actor` RPC so it is atomic and server-side.

6. **DB-003** — Enable FORCE ROW LEVEL SECURITY on all moderation tables after fixing can_manage_domain.

### MEDIUM (Before Scale)

7. **DB-005** — Implement `moderation.expire_timed_actions()` enforcement mechanism.

8. **PERF-002** — Add composite index on `moderation.actions (actor_id, target_type, target_id, created_at DESC)`.

9. **SEC-008 / DB-005** — Expiry enforcement for temporary actions.

10. **SEC-004** — FORCE RLS on moderation tables.

### LOW (Cleanup / Dashboard Prep)

11. **DB-004** — Drop duplicate indexes on moderation.blocks.

12. **SEC-007** — Drop duplicate RLS policies on moderation.blocks.

13. **SEC-009** — Confirm RLS status on `chat.moderation_actions` legacy table.

14. **App type sync** — Add `'in_review'` to `REPORT_STATUSES` in `moderation.js` (currently missing from app types but present in DB check constraint).

15. **Dashboard implementation** — After SEC-001 and SEC-002 are fixed, build `features/moderation/dashboard/` per Section 11 plan.

---

## 13. FINAL READ-ONLY STATEMENT

**No DB writes were executed during this review.**  
**No schema changes were applied.**  
**No application code was modified.**  
**No migrations were created or run.**  
**All SQL blocks in this document are proposals only — labeled "text only — do not run."**  
**All findings are based on static analysis of:**
- `apps/VCSM/src/features/moderation/` — all files
- `apps/VCSM/src/features/block/` — all files
- `apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js`
- `apps/VCSM/src/features/feed/model/feedRowVisibility.model.js`
- `engines/chat/src/controller/markConversationSpam.controller.js`
- `engines/chat/src/dal/moderationActions.write.dal.js`
- `apps/VCSM/supabase/migrations/20260510010000_moderation_blocks_rls_and_indexes.sql`
- `apps/VCSM/supabase/migrations/20260510020000_vc_posts_privacy_rls.sql`
- `apps/VCSM/supabase/migrations/20260510060000_chat_messages_block_rls.sql`
- `zNOTFORPRODUCTION/_HISTORY/db/snapshots/full_schema.sql`
- `zNOTFORPRODUCTION/db_snapshot/2026-05-10_pre-migration_moderation_blocks.snapshot.sql`
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/moderation/vcsm.moderation.block-pipeline.md`

**Scope respected:** Only `apps/VCSM/` and `engines/` were read. No cross-app imports or modifications.
