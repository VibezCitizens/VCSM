# Session Summary — engine-independence-and-schema-truth (2026-04-01)

## What was worked on
- Full engine independence for identity and chat engines (Phases 0-4): audit, refactor, adapter hardening, contracts, regression guardrails
- Schema-truth alignment: removed all phantom columns from chat engine DAL/model/service code to match real database schema
- Send-message refactor: replaced multi-step DAL writes with single `chat.send_message_atomic` RPC
- Parent provisioning fix: updated edge function from stale `ensure_parent_identity` RPC to new `ensure_parent_account` RPC using `learning.*` schema
- Dashboard review across all four roles (admin, teacher, student, parent) with alignment assessment
- Built `/TP` (daily task planner) and `/BUGSBUNNY` (forensic debugger) Claude commands
- Multiple BUGSBUNNY forensic traces: inbox "Unknown" name, outbox 403, parent identity provisioning, student post-password-change redirect

## Decisions made
- Identity engine must export zero app-specific functions — all Wentrex-specific code moved to `apps/wentrex/features/identity/`
- Chat engine must have zero `vc.*` schema queries — actor search, realm routing, and block checking made injectable via config
- Wentrex screens must never import `@chat` or `@identity` directly — all consumption goes through feature adapter layers
- `domainEventService` outbox INSERT gated behind `enableOutboxWrites` config flag (default false) to prevent client-side 403
- Parent provisioning rewritten to use `learning.actors` instead of `vc.actors` to match FK constraints
- Student dashboard shows enrollment-required message when no course memberships exist

## Files changed
- `engines/identity/src/adapters/index.js` — removed Wentrex exports
- `engines/identity/src/resolvers/wentrexIdentity.resolver.js` — deleted (moved to Wentrex)
- `engines/identity/src/controller/provisionWentrexIdentity.controller.js` — deleted (moved to Wentrex)
- `engines/identity/src/dal/provision.rpc.dal.js` — deleted (moved to Wentrex)
- `engines/identity/CONTRACT.md` — created
- `engines/chat/CONTRACT.md` — created
- `engines/chat/src/config.js` — added injectable searchActors, resolveActorRealmContext, checkBlockRelation
- `engines/chat/src/dal/searchActors.dal.js` — delegates to config
- `engines/chat/src/dal/actorRealm.read.dal.js` — delegates to config
- `engines/chat/src/dal/blockRelations.read.dal.js` — delegates to config
- `engines/chat/src/dal/sendMessageAtomic.rpc.dal.js` — created (RPC DAL)
- `engines/chat/src/dal/messages.write.dal.js` — removed insertMessageDAL and claimNextSeq
- `engines/chat/src/dal/inbox.read.dal.js` — added partner_display_name, title to selects
- `engines/chat/src/dal/legacyMappings.dal.js` — rewritten to match real schema columns
- `engines/chat/src/dal/outbox.write.dal.js` — unchanged (still used by non-send flows)
- `engines/chat/src/dal/subscribeToInbox.js` — channel renamed from vc- to chat-
- `engines/chat/src/dal/subscribeToConversation.js` — channel renamed from vc- to chat-
- `engines/chat/src/dal/typingPresence.dal.js` — channel renamed from vc- to chat-
- `engines/chat/src/model/Message.model.js` — removed senderActorSource phantom field
- `engines/chat/src/model/Conversation.model.js` — removed isStealth, createdByActorSource, is_announcement phantom
- `engines/chat/src/model/ConversationMember.model.js` — removed actorSource, vport_* fields
- `engines/chat/src/model/InboxEntry.model.js` — removed actorSource fields, added partner_display_name fallback
- `engines/chat/src/model/DirectorySearchResult.model.js` — removed vport fallbacks
- `engines/chat/src/services/messageService.js` — uses RPC, publishMessageSentEvent is in-memory only
- `engines/chat/src/services/domainEventService.js` — outbox INSERT gated behind enableOutboxWrites
- `engines/chat/src/services/inboxProjectionService.js` — deleted (RPC handles inbox fan-out)
- `engines/chat/src/services/legacyMappings.service.js` — rewritten for real schema
- `engines/chat/src/services/receiptService.js` — removed actorSource params
- `engines/chat/src/services/conversationLifecycleService.js` — removed actorSource params
- `engines/chat/src/services/inboxProjectionService.js` — removed actorSource
- `engines/chat/src/controller/sendMessage.controller.js` — simplified to RPC path
- `engines/chat/src/controller/inboxActions.controller.js` — removed actorSource
- `engines/chat/src/controller/deleteMessageForMe.controller.js` — removed actorSource
- `engines/chat/src/controller/getInboxEntries.controller.js` — added title/metadata to fallback builder
- `engines/chat/src/hooks/useInbox.js` — BUGSBUNNY probe (active)
- `engines/chat/src/utils/idempotency.js` — removed sender_actor_source from select
- `apps/wentrex/src/features/identity/wentrexAccess.js` — created
- `apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js` — created (moved from engine)
- `apps/wentrex/src/features/identity/controller/provisionWentrexIdentity.controller.js` — created
- `apps/wentrex/src/features/identity/dal/provision.rpc.dal.js` — created
- `apps/wentrex/src/features/identity/useWentrexIdentity.js` — added re-exports
- `apps/wentrex/src/features/identity/WentrexIdentityContext.jsx` — local imports, BUGSBUNNY probe (active)
- `apps/wentrex/src/features/identity/setup.js` — local resolver import
- `apps/wentrex/src/features/identity/CONTRACT.md` — created
- `apps/wentrex/src/features/communication/index.js` — re-exports chat hooks
- `apps/wentrex/src/features/communication/setup.js` — provides searchActors, resolveActorRealmContext, checkBlockRelation
- `apps/wentrex/src/features/communication/CONTRACT.md` — created
- `apps/wentrex/src/features/communication/conversation/screen/ConversationView.jsx` — imports from adapter
- `apps/wentrex/src/features/communication/inbox/screens/InboxScreen.jsx` — imports from adapter
- `apps/wentrex/src/learning/components/RequireRole.jsx` — imports from local wentrexAccess
- `apps/wentrex/src/learning/components/TopBar.jsx` — imports from adapter
- `apps/wentrex/src/learning/parent/screens/ParentStudentScreen.jsx` — added parent profile/identity fetch, BUGSBUNNY probe (active)
- `apps/wentrex/src/learning/parent/screens/ParentClassScreen.jsx` — removed public.profiles data leak
- `apps/wentrex/src/learning/student/screens/StudentDashboardScreen.jsx` — enrollment-required message
- `apps/wentrex/src/learning/student/screens/StudentAssignmentScreen.jsx` — replaced .select('*') with explicit columns
- `apps/wentrex/src/learning/staff/teacher/controller/getTeacherDashboard.controller.js` — realmId required
- `apps/wentrex/src/learning/staff/teacher/controller/listTeacherCourses.controller.js` — realmId required
- `apps/wentrex/src/learning/administration/controller/admin/createOrganizationMember.controller.js` — added auth checks
- `apps/wentrex/src/learning/administration/controller/admin/createParentMember.controller.js` — added auth checks
- `apps/wentrex/src/learning/screens/ChangePasswordScreen.jsx` — BUGSBUNNY probe (active)
- `apps/wentrex/src/App.jsx` — legacy route annotations, BUGSBUNNY probe on RequireAuth (active)
- `apps/wentrex/supabase/functions/create-parent/index.ts` — switched to ensure_parent_account RPC
- `apps/wentrex/docs/ENGINE_INDEPENDENCE_AUDIT.md` — created
- `apps/wentrex/docs/ENGINE_INDEPENDENCE_FINAL_REPORT.md` — created
- `apps/wentrex/docs/WENTREX_ARCHITECTURE_REVIEW.md` — created
- `scripts/check-engine-boundaries.sh` — created (regression guardrail)
- `.claude/commands/TP.md` — created (daily task planner)
- `.claude/commands/BUGSBUNNY.md` — created (forensic debugger)
- `planning/april/01/01-01.md` through `01-04.md` — daily planning files

## Problems solved
- Identity engine decoupled from Wentrex (zero learning.* queries, zero Wentrex exports)
- Chat engine decoupled from VC (zero vc.* queries, injectable dependencies)
- 7 phantom chat columns removed (sender_actor_source, is_stealth, is_announcement, created_by_actor_source, actor_source on 3 tables)
- idempotency_key phantom column removed from 14 files
- legacyMappings DAL rewritten to match real schema (was using 7 non-existent columns)
- Outbox 403 fixed (client-side direct INSERT blocked by RLS, now gated behind config flag)
- Send-message path consolidated to single RPC call
- Parent provisioning switched from stale ensure_parent_identity (core.* references) to ensure_parent_account (learning.* only)
- Parent dashboard Guardian Contact now reads from parent's own profile instead of student's actor_identities
- Admin write controllers (createOrganizationMember, createParentMember) now have auth checks
- Teacher controllers now require realmId
- Student .select('*') violations fixed
- Parent public.profiles data leak removed
- Student post-password-change redirect root cause identified: empty roleKeys + invalid defaultDestination "wentrex_dashboard"

## Open items
- BUGSBUNNY debug probes still active in: useInbox.js, WentrexIdentityContext.jsx, ParentStudentScreen.jsx, ChangePasswordScreen.jsx, App.jsx (RequireAuth) — remove after confirming all bugs resolved
- `vcsmIdentity.resolver.js` still in identity engine (pending VCSM app migration)
- `createVcsmActorEnricher` still exported from identity engine (pending VCSM migration)
- `vport_*` fields in `memberActorPresentation.js` — in-memory enrichment, not DB columns, deferred cleanup
- `platform.user_app_state.default_destination_key` contains "wentrex_dashboard" for some users — invalid route value needs investigation
- Student dashboard requires course enrollment to show — enrollment-required message added but the routing issue (empty roleKeys → invalid destination) is not fixed at the routing layer
- Inbox "Unknown" participant name: partner_display_name/partner_username null in DB for existing conversations — needs backfill or write-time population in send_message_atomic RPC
- Planning file `01-04.md` left open (not marked complete) — parent dashboard and password-change debugging still in progress
- Existing parents created before edge function update have no actor_profiles/actor_identities rows — need manual SQL backfill
- `actorSource` concept still exists in conversationPolicy.rules.js and actorRefs.js as in-memory abstraction — not a schema issue but may need cleanup

## Context for next session
Engine independence is complete and locked with contracts + regression script (11/11 checks passing). The chat engine is schema-truthful against the real database. The main open work is: (1) remove all active BUGSBUNNY debug probes once bugs are confirmed resolved, (2) fix the student routing issue where empty roleKeys causes navigation to invalid "wentrex_dashboard" destination, (3) backfill missing actor_profiles/actor_identities rows for existing parents, (4) continue Phase 2 of the dashboard migration plan (teacher assignment creation, student assignment view, parent settings screen in new pattern). The TP command and BUGSBUNNY command are operational and should be used for all future planning and debugging work.
