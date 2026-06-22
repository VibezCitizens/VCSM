# VCSM Duplicate Write Authorities

## Scope

- Focus: mutations where more than one write authority can persist the same business action
- Authority types tracked here: app controller + app DAL, shared engine, RPC fallback, direct table fallback, inferred DB trigger

## Duplicate / split write authorities

| Action | Authority path A | Authority path B | Files involved | Tables written | Risk introduced | Recommended consolidation |
| --- | --- | --- | --- | --- | --- | --- |
| Start direct conversation | Engine controller -> `engines/chat/src/controller/startDirectConversation.controller.js` | ~~Legacy VCSM controller~~ **[RESOLVED — see below]** | engine start hook + legacy controller/DALs | `chat.conversations`, `chat.conversation_members`, `chat.inbox_entries` vs legacy `vc.conversation_members`, `vc.inbox_entries` | Conversation creation semantics depend on caller path; migration bugs hide behind fallback | Keep one runtime authority: engine RPC path only |
| Send message | Engine controller -> `engines/chat/src/controller/sendMessage.controller.js` -> `chat.send_message_atomic` | ~~Legacy controller~~ **[RESOLVED — see below]** | engine hooks and legacy conversation stack | `chat.messages`, `chat.inbox_entries`, `chat.outbox_events` vs `vc.messages`, `vc.inbox_entries` | Duplicate message semantics, duplicate idempotency rules, divergent unread behavior | Delete remaining legacy callers and force engine send path |
| Edit message | Engine edit path | ~~Legacy VCSM edit path~~ **[RESOLVED — see below]** | engine message action controllers + legacy message action controllers | `chat.messages` vs `vc.messages` | Same user action can mutate different schemas | Consolidate on engine-only message lifecycle |
| Unsend / delete-for-me | Engine message lifecycle | ~~Legacy message lifecycle~~ **[RESOLVED — see below]** | engine hooks/controllers + legacy controllers | `chat.messages`, `chat.message_receipts` vs `vc.messages`, legacy receipt/delete tables | Visibility semantics differ by path | Consolidate to engine-only lifecycle rules |
| Mark conversation read | Engine controller -> `engines/chat/src/controller/markConversationRead.controller.js` | ~~Legacy mark-read controller~~ **[RESOLVED — see below]** | conversation hooks and legacy DALs | `chat.conversation_members`, `chat.inbox_entries` vs `vc.conversation_members`, `vc.inbox_entries` | Badge and unread projection can drift depending on write path | Consolidate on engine read boundary |
| Inbox delete / spam / archive actions | Engine inbox actions | ~~Legacy inbox and moderation bridge~~ **[RESOLVED — see below]** | engine inbox controllers + legacy inbox/moderation controllers | `chat.inbox_entries` vs `vc.inbox_entries`, plus moderation/report tables | Folder movement and moderation trail can diverge | Keep one inbox authority and emit moderation side effects from that boundary |
| Post creation | Upload flow -> `apps/VCSM/src/features/upload/controllers/createPostController.js` | Legacy postcard DAL -> `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js` | upload screens/hooks + legacy post surfaces | `vc.posts`, `vc.post_media`, `vc.post_mentions` vs legacy `vc.posts`, `vc.post_mentions` | Some posts use media-aware create path, others bypass it; mention semantics differ | Centralize create-post behind one controller and deprecate direct DAL create |
| Block / unblock | Main block system -> `apps/VCSM/src/features/block/controllers/blockActor.controller.js` + cleanup | Settings privacy block system -> `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js` | block feature + settings/privacy feature | `moderation.blocks`, and only main path also touches `vc.actor_follows`, `vc.friend_ranks` | Same block action has two cleanup behaviors | Route settings UI through the main block controller |
| Notification creation | Inferred DB triggers on social/post actions | Dormant fallback helper -> `apps/VCSM/src/features/notifications/inbox/dal/notifications.create.dal.js` | follow/post/reaction flows + notification helper | `vc.notifications`, RPC `vc.create_notification` | Hard to know whether app or DB owns creation; duplicate emits are possible if both paths activate | Pick one owner per notification kind and document it explicitly |
| Delete VPORT | Preferred DB RPC -> `delete_my_vport` | Fallback direct delete -> `dalDeleteOwnedVportById` | `apps/VCSM/src/features/settings/account/controller/account.controller.js` | RPC-owned cleanup vs direct `vc.vports` delete | Cleanup semantics differ depending on fallback path | Remove direct delete fallback once RPC contract is trusted |
| Save friend ranks | Preferred RPC -> `vc.save_friend_ranks` | Fallback delete+insert in DAL | `apps/VCSM/src/features/profiles/dal/friends/friendRanks.write.dal.js` | `vc.friend_ranks` | Atomicity and validation differ by environment | Keep RPC only and treat fallback as development-only or remove it |
| VPORT create + initial services | `vc.create_vport` RPC | Inline post-create services upsert in `CreateVportForm.jsx` | `apps/VCSM/src/features/vport/CreateVportForm.jsx` | `vc.vports`, `vc.vport_services` | Business object creation is split across two authorities | Move initial service selection into VPORT create contract |

## Resolved duplicate authorities (2026-04-05)

Chat duplicate write authorities are now RESOLVED:
- All 9 VCSM chat hooks delegate to the shared @chat engine
- Legacy VCSM chat controllers/DALs (vc.*) are dead code — zero runtime imports from screens/hooks
- Start conversation now uses chat.get_or_create_direct_conversation RPC
- Send message uses chat.send_message_atomic RPC
- Inbox actions use engine controllers writing to chat.inbox_entries
- The chat rows in the table above remain for historical reference but the "Authority path B" (legacy) is no longer active at runtime

## Remaining consolidation targets

1. Block/unblock: settings privacy should call the main block controller so cleanup behavior is consistent.
2. Post creation: remove direct create-post DAL callers and use one upload-aware create controller.
3. Notification creation: either DB-trigger-owned or app-owned per kind, but not both.

## Rule for future mutations

- One business action should have exactly one write authority.
- Fallbacks are acceptable only when they are semantically equivalent and carry the same table side effects.
