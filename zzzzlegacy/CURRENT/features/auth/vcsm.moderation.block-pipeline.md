# VCSM Moderation and Block Pipeline

Updated: 2026-05-10

## 1. Architecture Overview

VCSM separates moderation from blocking:

- moderation owns reports, hide/unhide actions, reported-content covers, and conversation spam covers
- block owns actor-to-actor safety relationships and the cleanup side effects on follows/friend ranks

Both systems are actor-first:

- reports are filed by `reporterActorId`
- moderation actions are stored per actor with domain-aware target references
- blocks are stored per blocker actor and blocked actor with domain fields

As of 2026-04-06, all moderation and blocking has been migrated from `vc.*` tables to the neutral `moderation.*` schema.

## 2. Entry Screens and User Flows

Primary user-facing entry points:

- report modal: `apps/VCSM/src/features/moderation/components/ReportModal.jsx`
- conversation spam cover: `apps/VCSM/src/features/moderation/components/ChatSpamCover.jsx`
- reported object cover: `apps/VCSM/src/features/moderation/components/ReportedObjectCover.jsx`
- block confirm UI: `apps/VCSM/src/features/block/ui/BlockConfirmModal.jsx`

Main hooks:

- `features/moderation/hooks/useReportFlow.js`
- `features/moderation/hooks/useHidePostForActor.js`
- `features/moderation/hooks/usePostVisibility.js`
- `features/moderation/hooks/useCommentVisibility.js`
- `features/moderation/hooks/useConversationCover.js`
- `features/block/hooks/useBlockActions.js`
- `features/block/hooks/useBlockStatus.js`

## 3. Database Schema Authority

### Moderation (moderation.* schema)

- `moderation.reports`
  - canonical report rows
  - columns: reporter_domain, reporter_actor_id, target_domain, target_type, target_id, reason_code, status, priority, assigned_domain, assigned_actor_id, dedupe_key, meta
- `moderation.report_events`
  - best-effort client audit trail
  - columns: report_id, actor_domain, actor_id, event_type, data
- `moderation.actions`
  - actor-scoped hide/unhide and similar actions
  - columns: report_id, actor_domain, actor_id, target_domain, target_type, target_id, action_type, reason, meta

### Direct content mutations (stay in original schemas)

- `vc.posts`
  - can be hidden directly by moderation DAL helpers (is_hidden, hidden_at, hidden_by_actor_id)
- `chat.messages`
  - can be hidden directly by moderation DAL helpers
- `chat.inbox_entries`
  - reporter spam reports push conversations into `folder='spam'`

### Blocking (moderation.* schema)

- `moderation.blocks`
  - canonical actor-to-actor block rows
  - composite PK: (blocker_domain, blocker_actor_id, blocked_domain, blocked_actor_id)
  - status: 'active' or 'released'
  - unblock = UPDATE status='released', released_at=now() (not DELETE)
- `moderation.block_events`
  - audit trail for block/unblock actions
  - event_type: 'blocked' or 'unblocked'

### Side effect tables (stay in vc.* schema)

- `vc.actor_follows` — cleaned up when a block is created
- `vc.friend_ranks` — cleaned up when a block is created

## 4. Layer Stack

Moderation:

```text
UI -> hook -> controller -> DAL -> moderation.reports / moderation.actions
```

Blocking:

```text
UI -> hook -> controller -> DAL -> moderation.blocks + moderation.block_events
                       -> helper -> cleanup side effects (vc.actor_follows, vc.friend_ranks)
```

## 5. Pipeline 1: Create Report

Main controller:

- `features/moderation/controllers/report.controller.js`

Runtime:

```text
useReportFlow / report modal
  -> createReportController(...)
  -> optional dedupe check in moderation.reports (by reporter_actor_id + dedupe_key)
  -> insert report row with: reporter_domain='vc', target_domain (resolved from objectType), target_type, target_id
  -> insert moderation.report_events audit row (best effort)
  -> return domain-safe report
```

DAL:

- `features/moderation/dal/reports.dal.js`

Write details:

- `insertReportRow()` writes `moderation.reports`
- `insertReportEventRow()` writes `moderation.report_events` with `actor_domain='vc'`
- report events can be skipped for the rest of the session after an RLS failure

Special spam behavior:

- if `reasonCode === 'spam'` and `targetType === 'conversation'`
- the DAL also upserts the reporter's `chat.inbox_entries.folder='spam'`

## 6. Pipeline 2: Hide / Unhide Posts

Controller:

- `features/moderation/controllers/postVisibility.controller.js`

Read path:

- `getHiddenPostIdsForActor({ actorId, postIds })`
- reads `moderation.actions` WHERE target_type='post' AND action_type IN ('hide','unhide')
- applies latest-action-wins logic

Write path:

- `hidePostForActor()` — inserts into `moderation.actions` with target_domain='vc', target_type='post', action_type='hide'
- `unhidePostForActor()` — inserts action_type='unhide'

Important nuance:

- this is actor-scoped hiding, not a global post deletion
- visibility is derived from moderation actions per viewer actor

## 7. Pipeline 3: Hide / Unhide Comments

Controller:

- `features/moderation/controllers/commentVisibility.controller.js`

Behavior:

- same latest-action-wins model as post hiding
- supports propagation from hidden root comment to descendants
- reply-only hides do not propagate upward

Authority:

- `moderation.actions` with target_type='comment'

## 8. Pipeline 4: Conversation Cover / Spam Cover

Conversation cover status:

- `features/moderation/controllers/getConversationCoverStatus.controller.js`
- reads from `moderation.actions` WHERE target_type='conversation' AND action_type='hide'

Undo cover:

- `features/moderation/controllers/undoConversationCover.controller.js`
- deletes hide action from `moderation.actions`
- moves `chat.inbox_entries` folder back to 'inbox'
- restores last_message pointer

Conversation spam action entry (engine-level):

- `engines/chat/src/controller/markConversationSpam.controller.js`
- writes to `moderation.actions` via engine DAL

## 9. Pipeline 5: Direct Moderation Rows

`reports.dal.js` also exposes direct mutation helpers:

- `insertModerationActionRow()` — writes `moderation.actions`
- `hidePostRow()` — writes `vc.posts` (is_hidden flag)
- `hideMessageRow()` — writes `chat.messages` (is_hidden flag)

The actor-scoped hide/unhide path is the primary runtime contract. Direct posts/messages hide helpers are admin/global action primitives.

## 10. Pipeline 6: Block Actor (RPC-backed)

Main controller:

- `features/block/controllers/blockActor.controller.js`

Runtime:

```text
blockActorController(blockerActorId, blockedActorId, assertingActorId)
  -> assert assertingActorId === blockerActorId (throws if mismatch — session binding added 2026-05-10)
  -> validate ids and self-block
  -> check current status via moderation.blocks (status='active')
  -> if not already blocked: call moderation.block_actor RPC
     (RPC handles bidirectional follow deactivation + friend_ranks deletion atomically — Batch 4)
  -> invalidateFeedBlockCache(blockerActorId)  ← added 2026-05-10

Note: `deleteFriendRankRowsBetweenActors()` call in `blockActor.controller.js` is now redundant after Batch 4 — pending removal from app code.
```

DAL:

- `features/block/dal/block.write.dal.js` — calls `moderation.block_actor` and `moderation.unblock_actor` RPCs
- No direct table writes from frontend — all block/event/follow logic is server-side in RPC

Write authority (server-side RPC):

- `moderation.blocks` — upsert with ON CONFLICT reactivation
- `moderation.block_events` — audit trail insert
- `vc.actor_follows` — deactivate (set is_active=false) in blocked direction

Write authority (client-side, not in RPC):

- `vc.friend_ranks` — bidirectional delete via `deleteFriendRankRowsBetweenActors()`

Idempotency:

- RPC uses ON CONFLICT DO UPDATE — re-blocking reactivates the row
- Controller checks `checkBlockStatus()` before calling RPC to avoid unnecessary calls

## 11. Pipeline 7: Block Side Effects

Server-side (handled by `moderation.block_actor` RPC, updated Batch 4):

- Deactivates `vc.actor_follows` in BOTH directions bidirectionally (blocker→blocked AND blocked→blocker) — Batch 4 fixed the unidirectional gap
- Deletes bidirectional `vc.friend_ranks` rows atomically — moved from client-side into RPC in Batch 4
- Inserts `moderation.block_events` audit row

Backfill: Batch 4 deactivated all existing `vc.actor_follows` rows where a block existed but the reverse-direction follow had remained active.

Client-side (pending removal):

- `deleteFriendRankRowsBetweenActors()` still called from `blockActor.controller.js` — now redundant after Batch 4, pending removal

Notably absent:

- no direct message/conversation deletion
- no notification cleanup
- blocking does not archive/hide existing chat conversations

## 12. Pipeline 8: Unblock Actor (RPC-backed)

```text
unblockActorController(blockerActorId, blockedActorId, assertingActorId)
  -> assert assertingActorId === blockerActorId (session binding — added 2026-05-10)
  -> checkBlockStatus() — if not blockedByMe: return { blocked: false } idempotent (ownership check added 2026-05-10)
  -> call moderation.unblock_actor RPC
  -> invalidateFeedBlockCache(blockerActorId)  ← added 2026-05-10
```

RPC behavior:

- Updates `moderation.blocks` SET status='released', released_at=now()
- Inserts `moderation.block_events` with event_type='unblocked'
- Does NOT restore follow edges or friend ranks

Unblock is asymmetric:

- safety relationship is released
- prior social relationships stay removed until the actors explicitly follow/re-rank again

## 13. Visibility and Gate Integration

Observed consumers:

- profile screens use block-status hooks to decide whether a profile can be viewed (`moderation.blocks` bidirectional check)
- `useProfileGate` (profiles/hooks) reads `useBlockStatus` bidirectionally — profile content is gated for blocked actors in either direction; `isBlocked` returned so UI can render a blocked-state component (added 2026-05-10)
- `ctrlSubscribe` (follow.controller.js) calls `ctrlGetBlockStatus` before any follow write — blocked actors cannot follow or re-follow (added 2026-05-10)
- `ctrlSendFollowRequest` (followRequests.controller.js) calls `ctrlGetBlockStatus` before any request write — blocked actors cannot send follow requests (added 2026-05-10)
- profile/post/comment UI uses moderation visibility hooks to hide actor-scoped content (`moderation.actions`)
- conversation UI uses conversation-cover hooks to mask spam/reported threads (`moderation.actions`)
- feed pipeline reads `moderation.actions` to filter hidden posts and `moderation.blocks` for block filtering
- chat engine reads `moderation.blocks` via DI `checkBlockRelation` for block checks
- explore search uses `identity.search_actor_directory` RPC which filters blocked actors server-side via `moderation.blocks`

## 14. Key Files Reference

- `features/moderation/controllers/report.controller.js` — report creation use-case boundary
- `features/moderation/dal/reports.dal.js` — reports, report events, moderation action helpers, spam-folder bridge
- `features/moderation/dal/moderationActions.dal.js` — dedicated moderation actions DAL (hide/unhide/conversation cover)
- `features/moderation/controllers/postVisibility.controller.js` — actor-scoped post hiding
- `features/moderation/controllers/commentVisibility.controller.js` — actor-scoped comment hiding
- `features/block/controllers/blockActor.controller.js` — block/unblock orchestration (calls RPCs)
- `features/block/dal/block.write.dal.js` — calls `moderation.block_actor` / `moderation.unblock_actor` RPCs
- `features/block/dal/block.read.dal.js` — moderation.blocks reads (active only)
- `features/block/dal/block.check.dal.js` — lightweight block status checks (bidirectional)
- `features/block/helpers/applyBlockSideEffects.js` — friend_ranks cleanup (follows now handled by RPC)
- `features/settings/privacy/dal/blocks.dal.js` — settings block/unblock (also calls RPCs)

## 15. Database RPCs for Block/Unblock

| RPC | Schema | Purpose |
|-----|--------|---------|
| `moderation.block_actor(p_blocker_actor_id, p_blocked_actor_id, p_reason)` | moderation | Block: upsert blocks, insert event, deactivate follow |
| `moderation.unblock_actor(p_blocker_actor_id, p_blocked_actor_id, p_reason)` | moderation | Unblock: release block, insert event |
| `moderation.is_current_vc_actor(p_actor_id)` | moderation | RLS helper: verify actor belongs to auth user |

Both RPCs are `SECURITY DEFINER` with `search_path = moderation, vc, public, auth`.
Both RPCs verify actor ownership via `moderation.is_current_vc_actor()` before mutating.

## 16. Weak Spots / Risks

1. Report-event writes are best-effort and can silently disable themselves for the session after RLS failures.
2. Moderation has both actor-scoped hide semantics (`moderation.actions`) and direct content hide helpers (`vc.posts`, `chat.messages`), which can blur the distinction between viewer hides and global moderation.
3. Blocking deactivates follows but does not archive/hide existing chat conversations — chat cleanup depends on additional guards elsewhere.
4. Spam reporting bridges into `chat.inbox_entries.folder='spam'`, coupling moderation to chat folder state.
5. ~~`vc.friend_ranks` cleanup is still client-side (not in RPC). If the client call fails, stale friend ranks may persist.~~ FIXED Batch 4: friend_ranks deletion moved into RPC atomically. `deleteFriendRankRowsBetweenActors()` in app code is now redundant, pending removal.
6. ~~The `moderation.block_actor` RPC only deactivates follows in one direction (blocker→blocked). Reverse direction (blocked→blocker) follows are not deactivated.~~ FIXED Batch 4: RPC now deactivates both directions. Existing data backfilled.
7. ~~Block/follow cache never invalidated on write paths~~ FIXED 2026-05-10: all write controllers now call the appropriate invalidation function.
8. ~~Block controllers accepted blockerActorId from caller with no session verification~~ FIXED 2026-05-10: assertingActorId assertion added to all three block controller functions.
9. (Deferred — DB-only) `moderation.block_actor` RPC does not cancel pending `vc.social_follow_requests` rows on block. A pending follow request from a now-blocked actor remains in `pending` state. App-layer guard on `ctrlSendFollowRequest` prevents new requests from blocked actors, but the existing pending row persists until the target manually declines it.
10. (Deferred — DB-only) `vc.actor_follows`, `vc.social_follow_requests`, and `vc.actor_privacy_settings` do not have `FORCE ROW LEVEL SECURITY` enabled. Service-role or superuser access bypasses RLS on these tables — expected in admin context, noted for trust-boundary audits.

## 17. Changes — 2026-05-10

### Session Binding on Block/Unblock Controllers
`blockActorController`, `unblockActorController`, and `toggleBlockActorController` now require an `assertingActorId` parameter. The controller asserts `assertingActorId === blockerActorId` and throws if they differ. Hooks supply this from `useIdentity()`:
- `useBlockActions` — calls `useIdentity()` internally, passes `sessionActorId` as `assertingActorId`
- `useBlockActorAction` — same pattern

### Cache Invalidation Wired on All Block Write Paths
`invalidateFeedBlockCache(blockerActorId)` is now called after every successful block, unblock, and toggle. Previously the function was exported but had zero call sites — blocked actor posts remained in the feed until the 60s TTL expired.

Cross-feature import path: `@/features/feed/adapters/feedCache.adapter` (new adapter created to avoid direct feature-to-feature imports).

### Unblock Ownership Check
`unblockActorController` now calls `checkBlockStatus()` before calling the RPC. If `blockedByMe = false` (block doesn't exist), returns `{ blocked: false }` idempotently without calling the RPC.

### New RLS Policy: blocks_select_blocked
Added to `moderation.blocks` via migration `20260510010000`:
```sql
CREATE POLICY "blocks_select_blocked" ON moderation.blocks
  FOR SELECT TO authenticated
  USING (blocked_domain = 'vc' AND moderation.is_current_vc_actor(blocked_actor_id));
```
Allows the blocked actor to see rows where they are the target. Required for bidirectional block enforcement in `vc.posts` SELECT RLS and `postVisibility.dal.js`.

### feedCache.adapter.js (new cross-feature adapter)
`apps/VCSM/src/features/feed/adapters/feedCache.adapter.js`
Re-exports three invalidation functions so block/follow/settings controllers can import without violating the architecture contract:
- `invalidateFeedBlockCache` — from `feed.read.blockRows.dal`
- `invalidateFeedFollowCache` — from `feed.read.followRows.dal`
- `invalidateActorBundleEntry` — from `feed.read.actorsBundle.dal` (targeted per-actor bust)

### Batch 1 — moderation.can_manage_domain Bug Fix (2026-05-10)

`moderation.can_manage_domain` had a broken `'vc'` branch that returned `true` for any user with a `vc.actors` row — effectively every platform user. Fixed to require `learning.platform_admins` membership, matching the `'learning'` branch.

Before:
```sql
WHEN 'vc' THEN RETURN EXISTS (SELECT 1 FROM vc.actors WHERE id = actor_id);
```
After:
```sql
WHEN 'vc' THEN RETURN EXISTS (
  SELECT 1 FROM learning.platform_admins WHERE user_id = auth.uid() AND is_active = true
);
```

### Batch 3 — moderation.moderators Table + Circular RLS Fix (2026-05-10)

Created `moderation.moderators` table with columns: `id`, `actor_domain`, `actor_id`, `role` (`viewer`|`moderator`|`admin`), `granted_by_actor_id`, `granted_at`, `is_active`, `expires_at`.

Circular RLS dependency discovered and fixed: `can_manage_domain` (SECURITY INVOKER) queries `moderators` → RLS on `moderators` only allowed platform admins to read → non-admin moderators couldn't see their own row → function always returned false → no moderator access to anything.

Fixed by adding `moderators_self_read` policy allowing users to read their own grant row via `vc.actor_owners` join.

### Batch 4 — block_actor RPC Bidirectional Fix + friend_ranks Atomicity (2026-05-10)

`moderation.block_actor` RPC updated to:
1. Deactivate `vc.actor_follows` in BOTH directions (previously only blocker→blocked)
2. Delete bidirectional `vc.friend_ranks` rows atomically inside the RPC (previously client-side with swallowed try/catch in `deleteFriendRankRowsBetweenActors()`)

Backfill applied: existing `vc.actor_follows` rows with an active block but active reverse-direction follow were deactivated.

Pending: `deleteFriendRankRowsBetweenActors()` call in `blockActor.controller.js` is now redundant — pending removal from app code.

### DB Security Hardening Migrations (2026-05-10)

Applied 8 migration files covering:
- Revoke dangerous EXECUTE (step1)
- RLS policy repairs for `public.profiles`, `learning.courses`, `wanders.cards`, `vc.friend_ranks` (step2)
- Drop 16+ dead legacy SECURITY DEFINER functions (step4)
- Harden `public.admin_delete_user_everywhere` with admin guard (step5)
- `SET search_path` on 33 SECURITY DEFINER functions — CVE-2018-1058 fix (secdef_a)
- Add policies to 21 zero-policy tables including `platform.legal_documents` (secdef_b)
- Enable RLS + add policies on 15 RLS-disabled tables including all 14 `traffic.*` tables (secdef_c)

Full log: `logan/marvel/wolverine/2026-05-10.security-hardening-full-remediation.md`

### Pending — Security Hardening Remaining

| Item | Status |
|------|--------|
| step5b Part B — 12 `vc.trg_*_notify` functions need live search_path check | PENDING |
| Moderation Batch 5 — FORCE RLS on all 5 moderation tables | PENDING (gate: Batch 1 verified) |
| Audit 29 `row_security=off` functions | PENDING |
| Remove `deleteFriendRankRowsBetweenActors()` from `blockActor.controller.js` | PENDING |
