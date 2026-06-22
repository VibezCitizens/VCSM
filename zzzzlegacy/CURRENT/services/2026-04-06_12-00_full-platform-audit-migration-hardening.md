# Session Summary — full-platform-audit-migration-hardening (2026-04-06)

## What was worked on
- Full audit of Wentrex + VCSM chat systems against the `chat.*` schema (16 tables), producing a table-by-table compliance report with 19 issues found. Removed all 46 legacy `vc.*` chat DAL/controller files from VCSM — confirmed dead code, replaced with engine-only path.
- End-to-end image/media send pipeline: wired `send_message_atomic` RPC with `p_attachments`, threaded attachments through DAL → service → controller → hook → UI, updated `MessageModel` with `mediaUrl`/`attachments`, added attachment join to timeline reads.
- Migrated all moderation/blocking from `vc.reports`/`vc.moderation_actions`/`vc.user_blocks` to `moderation.reports`/`moderation.actions`/`moderation.blocks`/`moderation.block_events` (22 files). Then migrated block write path to use `moderation.block_actor`/`moderation.unblock_actor` RPCs.
- Created unified actor hydration engine at `engines/hydration/` with canonical store (freshness metadata, safe merge), normalize, extract, DAL, hydrate pipeline, and consumer hook. Rewired all 27 VCSM consumers via re-export shims. Wired chat DI to also update global store.
- Refactored Explore search to use `identity.search_actor_directory` RPC as single source, removing all client-side privacy/block/actor-bridge logic. Created `identity.refresh_actor_directory_row` integration for VCSM + Wentrex mutation paths.
- Decoupled `vc.friend_ranks` from `vc.actor_follows` — friend ranks are now manual-only, no autofill. Fixed `friend_ranks_pkey` duplicate key error caused by DB trigger autofill.
- Fixed multiple chat UI bugs: non-scrollable conversation screen, media border styling, inbox sort order, hidden message preview, archive/spam navigation, missing trash button, spam cover gate not showing.
- Fixed profile page scroll lock (global `overflow: hidden` on body), RLS 403 on `moderation.actions` insert, report lookup 400 (stale column names), `openConversation` resetting inbox folder placement.
- Security audit before git push: hardened `.gitignore` with `.DS_Store`, `planning/`, `logan/`, `session-summaries/`, key/cert exclusions. Gated all ungated debug loggers with `import.meta.env.DEV`.
- Created client-facing user journey guide documenting account creation → profile update → vport creation → dashboard usage → identity switching.

## Decisions made
- All VCSM chat runs exclusively through the `@chat` engine — no local DAL/controller layer. Legacy files replaced with re-export shims then deleted.
- Image send uses `chat.message_attachments` table via atomic RPC, not message `meta` JSONB — supports structured metadata and multiple attachments.
- Moderation uses neutral `moderation.*` schema with domain-aware columns (`reporter_domain`, `target_domain`, `actor_domain`). Block unblock = UPDATE `status='released'` (not DELETE) for permanent audit history.
- Actor hydration consolidated into `engines/hydration/` with 5-minute staleness TTL, safe merge (no null overwrites), and `hydrateAndReturnSummaries` for chat DI store integration.
- Explore search uses single `identity.search_actor_directory` RPC with server-side privacy/block/visibility filtering and trigram ranking. All client-side post-processing removed.
- Friend ranks decoupled from follows — `trg_reconcile_on_actor_follows` only removes stale ranks on unfollow, never autofills. `save_friend_ranks` RPC signature changed to remove `p_autofill`.
- Block/unblock uses `moderation.block_actor`/`moderation.unblock_actor` RPCs — all side effects (block_events, follow deactivation) server-side. Only friend_ranks cleanup remains client-side.
- Profile page scrolling fixed by using `min-h-[100dvh]` instead of `h-[100dvh] overflow-hidden` for non-chat routes, with native document scrolling.
- `logan/`, `planning/`, `session-summaries/`, `docs/`, `db_snapshot/`, `contract/`, `scripts/`, `zcontract/` all gitignored from production.

## Files changed
### Engines created/modified
- `engines/hydration/index.js` — expanded exports
- `engines/hydration/src/config.js` — added supabaseClient DI
- `engines/hydration/src/store.js` — NEW: Zustand store with freshness + safe merge
- `engines/hydration/src/normalize.js` — NEW: canonical normalization
- `engines/hydration/src/extract.js` — NEW: actor ID extraction
- `engines/hydration/src/dal.js` — NEW: canonical RPC source
- `engines/hydration/src/hydrate.js` — NEW: canonical hydration pipeline
- `engines/hydration/src/useActorSummary.js` — NEW: consumer hook with missing/stale flags
- `engines/chat/src/dal/sendMessageAtomic.rpc.dal.js` — RPC name + attachments param
- `engines/chat/src/dal/messages.timeline.read.dal.js` — attachment join
- `engines/chat/src/dal/moderationActions.write.dal.js` — migrated to moderation.actions
- `engines/chat/src/dal/openConversation.rpc.js` — fixed inbox folder reset bug
- `engines/chat/src/services/messageService.js` — threaded attachments
- `engines/chat/src/controller/sendMessage.controller.js` — threaded attachments
- `engines/chat/src/controller/getInboxEntries.controller.js` — hidden message filtering + sort
- `engines/chat/src/model/Message.model.js` — mediaUrl + attachments extraction
- `engines/chat/src/hooks/useConversationMessages.js` — attachments in optimistic state
- `engines/identity/src/controller/resolveAuthenticatedContext.controller.js` — DEV-gated logger

### VCSM app files (created/modified/deleted)
- 46 legacy chat DAL/controller files DELETED
- `features/chat/setup.js` — inlined identity DALs, chat DI uses hydrateAndReturnSummaries
- `features/chat/conversation/hooks/conversation/useSendMessageActions.js` — builds attachments array
- `features/chat/conversation/hooks/conversation/useConversationActionsMenu.js` — archive/spam navigate replace, removed spam auto-navigate
- `features/chat/conversation/screen/ConversationView.jsx` — layout fixes
- `features/chat/conversation/layout/ChatScreenLayout.jsx` — relative positioning
- `features/chat/conversation/components/MessageMedia.jsx` — border styling fix
- `features/chat/inbox/screens/ArchivedInboxScreen.jsx` — added onDelete + useInboxActions
- `features/chat/inbox/constants/inboxSearchAdapter.js` — rewired to @chat
- `features/moderation/dal/reports.dal.js` — migrated to moderation.* schema
- `features/moderation/dal/moderationActions.dal.js` — migrated to moderation.actions
- `features/moderation/dal/conversationCover.write.dal.js` — chat schema fix
- `features/moderation/dal/conversationCover.read.dal.js` — chat schema fix
- `features/moderation/controllers/report.controller.js` — new column names
- `features/moderation/controllers/moderationActions.controller.js` — fixed import, new schema
- `features/moderation/controllers/postVisibility.controller.js` — targetType/targetIds
- `features/moderation/controllers/commentVisibility.controller.js` — targetType/targetIds
- `features/moderation/models/report.model.js` — new columns + legacy compat
- `features/block/dal/block.write.dal.js` — uses block_actor/unblock_actor RPCs
- `features/block/dal/block.read.dal.js` — moderation.blocks WHERE status='active'
- `features/block/dal/block.check.dal.js` — moderation.blocks, no id column
- `features/block/controllers/blockActor.controller.js` — RPC-backed, friend_ranks only client-side
- `features/block/helpers/applyBlockSideEffects.js` — only friend_ranks cleanup
- `features/block/index.js` — updated exports
- `features/block/ui/BlockedState.jsx` — fixed ActorLink prop (actorId → actor)
- `features/settings/privacy/dal/blocks.dal.js` — uses block_actor/unblock_actor RPCs
- `features/settings/privacy/dal/visibility.dal.js` — unchanged (correct)
- `features/settings/privacy/controller/actorPrivacy.controller.js` — added refreshVcActorDirectory
- `features/settings/privacy/models/blocks.model.js` — new columns, synthetic id
- `features/settings/profile/controller/Profile.controller.core.js` — added refreshVcActorDirectory
- `features/feed/dal/feed.read.hiddenPosts.dal.js` — moderation.actions
- `features/feed/dal/feed.read.blockRows.dal.js` — moderation.blocks
- `features/feed/hooks/useFeed.js` — background canonical hydration
- `features/notifications/inbox/dal/blocks.read.dal.js` — moderation.blocks
- `features/profiles/dal/friends/blockedActorSet.read.dal.js` — moderation.blocks
- `features/profiles/dal/friends/friendRanks.write.dal.js` — RPC-only, no autofill
- `features/profiles/dal/friends/friendRanks.reconcile.dal.js` — read-then-save pattern
- `features/profiles/dal/friends/friends.read.dal.js` — uses get_friend_ranks RPC
- `features/profiles/controller/friends/hydrateActorsIntoStore.controller.js` — re-export from @hydration
- `features/explore/dal/search.data.js` — single identity.search_actor_directory RPC
- `features/explore/dal/search.dal.js` — unified actor search for all tab
- `features/explore/controller/searchTabs.controller.js` — viewerActorId pass-through
- `features/explore/hooks/useSearchTabsActor.js` — viewerActorId pass-through
- `features/explore/ui/ResultList.jsx` — viewer identity from useIdentity
- `features/identity/dal/refreshActorDirectory.dal.js` — NEW: refresh helper
- `features/identity/resolvers/vcsmIdentity.resolver.js` — DEV-gated logger
- `features/hydration/setup.js` — supabaseClient injection
- `features/auth/controllers/createUserActor.controller.js` — refreshVcActorDirectory
- `features/vport/dal/vport.core.dal.js` — refreshVcActorDirectory on create/update
- `state/actors/actorStore.js` — re-export from @hydration
- `state/actors/useActorSummary.js` — re-export from @hydration
- `state/actors/hydrateActors.js` — re-export from @hydration
- `state/identity/identity.controller.js` — DEV-gated logger
- `app/layout/RootLayout.jsx` — min-h-[100dvh] for non-chat, native scrolling
- `shared/components/PageContainer.jsx` — removed h-full constraint
- `styles/global.css` — body overflow-x-hidden only, min-height
- `app/platform/ios/ios.css` — margin-top:auto scroll fix
- 10+ diagnostic files updated
- `.gitignore` — hardened

### Wentrex app files
- `features/identity/dal/refreshActorDirectory.dal.js` — NEW: refresh helper
- `learning/administration/screens/RegisterStudentScreen.jsx` — refreshLearningActorDirectory
- `learning/parent/screens/ParentSettingsScreen.jsx` — refreshLearningActorDirectory

### Logan docs (created/updated)
- `VCSM_CHAT_MIGRATION_STATUS.md` — full rewrite
- `VCSM_MODERATION_AND_BLOCK_PIPELINE.md` — full rewrite with RPC-backed blocks
- `ACTOR_HYDRATION_DATA_AUDIT.md` — updated for hydration engine
- `VCSM_PIPELINE_MAP.md` — moderation schema refs
- `VCSM_CHAT_RUNTIME_PIPELINE.md` — media, hydration, block refs
- `VCSM_MUTATION_MATRIX.md` — all moderation schema refs
- `VCSM_RUNTIME_AUTHORITY_MATRIX.md` — all moderation schema refs
- `VCSM_TRANSACTION_BOUNDARY_MAP.md` — moderation refs
- `VCSM_HIGH_RISK_MUTATIONS.md` — moderation refs
- `VCSM_DUPLICATE_WRITE_AUTHORITIES.md` — block ref
- `VCSM_PROFILES_AND_SOCIAL_PIPELINE.md` — block/moderation refs
- `VCSM_FEED_AND_POST_PIPELINE.md` — all 4 old table refs
- `VCSM_ACTOR_DIRECTORY_PROJECTION.md` — NEW: search projection architecture
- `VCSM Subscribe Pipeline` — friend ranks decoupling + block integration
- `VCSM_USER_JOURNEY_GUIDE.md` — NEW: client-facing walkthrough
- `native_ios.md`, `Notification System Audit`, `Engine Isolation Audit`, `VCSM vs Wentrex Pipeline Drift Analysis`, `VCSM Explore Search Pipeline` — schema ref updates

## Problems solved
- Image URL was never persisted — `mediaUrl` validated but dropped at controller layer. Fixed by threading `attachments` array through entire pipeline to atomic RPC.
- Chat screen not scrollable — `justify-content: flex-end` on scroll container prevents scroll-to-top. Replaced with `margin-top: auto` on first child.
- Profile page not scrollable — global `body { overflow: hidden; height: 100% }` locked viewport. Changed to `min-height: 100%; overflow-x: hidden` with per-route overflow control.
- Archive/spam conversations reset to inbox on open — `openConversation` upserted `folder='inbox'` on every open. Changed to check-then-insert (only creates row if missing).
- Deleted-for-me messages showing in inbox — inbox preview wasn't checking `message_receipts.hidden_at`. Added hidden message filtering with backfill to find previous visible message.
- Spam cover gate not showing — `navigate("/chat/spam")` fired before React could render the cover. Removed auto-navigate; cover buttons handle navigation.
- RLS 403 on moderation.actions insert — `actions_insert_self_hide` policy was never created. Provided SQL for user self-service hide/unhide policy.
- Report lookup 400 — `assigned_to_actor_id` column doesn't exist in new schema. Updated to `assigned_domain`/`assigned_actor_id`.
- `moderation.blocks` has no `id` column (composite PK) — fixed all `select('id')` references to use `blocker_actor_id`.
- `friend_ranks_pkey` duplicate key on unfollow — DB trigger called `reconcile_friend_ranks(autofill=true)` which re-inserted rows. Fixed trigger to only delete stale rows, no autofill.
- `PGRST203` function overload ambiguity — old `save_friend_ranks(uuid, uuid[], boolean, integer)` coexisted with new 3-param version. Advised dropping old overload.
- `moderation_actions` 403 from chat engine — DAL still used `chat.moderation_actions` (old table). Updated to `moderation.actions` with correct column names.
- Ungated debug loggers in production — `[IdentityEngine]`, `[VCSMResolver]`, `[IdentityHydration]` used `typeof console !== 'undefined'` (always true). Gated with `import.meta.env.DEV`.

## Open items
- `chat.audit_log` — only written by `send_message_atomic` RPC; other operations (edit, delete, leave) still don't write audit entries
- `chat.participant_snapshots` — never written by any code path
- `chat.conversation_keys` / encryption — schema exists, not implemented
- `chat.conversation_pins` and `chat.saved_messages` — engine DAL exists but no React hooks for UI
- Outbox events conditional for edit/unsend/delete operations (only sendMessage guaranteed via RPC)
- Edge functions (create-student, create-parent, create-org-member) should call `identity.refresh_actor_directory_row` server-side after actor creation
- Old `save_friend_ranks(uuid, uuid[], boolean, integer)` overload needs to be dropped from DB
- `moderation.*` tables need RLS policies for all 5 tables (reports, report_events, actions, blocks, block_events) — SQL provided but must be run manually
- `vc.user_blocks` trigger `trg_reconcile_on_user_blocks` is dead code (table no longer written to) but still exists in DB
- Feed pipeline still uses 4-table manual join (`readActorsBundle`) alongside background canonical hydration — could be fully replaced with RPC

## Context for next session
The VCSM platform has been significantly hardened: chat is engine-only with media support, moderation/blocking uses the neutral `moderation.*` schema with RPC-backed writes, actor hydration is consolidated in `engines/hydration/`, and explore search uses a single unified RPC. The codebase is ready for git push with the updated `.gitignore`. Key remaining work: run the RLS policy SQL for `moderation.*` tables, drop the old `save_friend_ranks` overload, and wire `identity.refresh_actor_directory_row` into Wentrex edge functions. The `logan/` directory contains comprehensive up-to-date architecture documentation including a new client-facing user journey guide.
