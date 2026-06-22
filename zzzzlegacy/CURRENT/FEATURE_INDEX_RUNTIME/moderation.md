# Runtime Feature Index: moderation

## Metadata
| Field | Value |
|---|---|
| Feature | moderation |
| CURRENT Folder | CURRENT/features/moderation |
| Source Folder | apps/VCSM/src/features/moderation |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 7 | assertModerationAccess.controller.js, report.controller.js, moderationActions.controller.js, postVisibility.controller.js, commentVisibility.controller.js, getConversationCoverStatus.controller.js, undoConversationCover.controller.js |
| DALs | 7 | assertModerationAccess.dal.js, reports.dal.js, reports.read.dal.js, reports.dal.columns.js, moderationActions.dal.js, conversationCover.read.dal.js, conversationCover.write.dal.js |
| Hooks | 5 | useReportFlow.js, usePostVisibility.js, useHidePostForActor.js, useCommentVisibility.js, useConversationCover.js |
| Models | 1 | report.model.js |
| Screens | 0 | NONE — no dedicated route; surfaces embedded in post/chat/profiles via adapters |
| Components | 5 | ChatSpamCover.jsx, ReportCoverScreen.jsx, ReportModal.jsx, ReportThanksOverlay.jsx, ReportedObjectCover.jsx |
| Adapters | 9 | adapters/components/ (4 files), adapters/hooks/ (5 files) |
| Routes | 0 | NONE |
| Tests | 0 | NONE |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| NONE dedicated | — | — | All moderation UI is embedded in post, chat, and profile surfaces via adapter components and adapter hooks |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| report.controller.js — createReportController | controllers/report.controller.js | INSERT moderation.reports + moderation.report_events | NO — any authenticated actor; no ownership check | HIGH |
| moderationActions.controller.js — hideReportedObjectController | controllers/moderationActions.controller.js | UPDATE vc.posts or chat.messages + INSERT moderation.actions + UPDATE moderation.reports | YES — assertModerationAccessController (BROKEN: always FORBIDDEN) | CRITICAL |
| moderationActions.controller.js — dismissReportController | controllers/moderationActions.controller.js | UPDATE moderation.reports + INSERT moderation.report_events | YES — assertModerationAccessController (BROKEN: always FORBIDDEN) | CRITICAL |
| postVisibility.controller.js — hidePostForActor / unhidePostForActor | controllers/postVisibility.controller.js | INSERT moderation.actions (actor-scoped hide/unhide) | PARTIAL — actorId presence only; RLS is enforcement layer | MEDIUM |
| commentVisibility.controller.js — hideCommentForActor / unhideCommentForActor | controllers/commentVisibility.controller.js | INSERT moderation.actions (actor-scoped hide/unhide) | PARTIAL — actorId presence only; RLS is enforcement layer | MEDIUM |
| undoConversationCover.controller.js | controllers/undoConversationCover.controller.js | DELETE moderation.actions + UPDATE chat.inbox_entries | PARTIAL — actorId presence only | MEDIUM |
| reports.dal.js — upsertInboxEntryFolder (BRIDGE) | dal/reports.dal.js | UPSERT chat.inbox_entries | PARTIAL — called inline during insertReportRow for spam reason code | MEDIUM |
| conversationCover.write.dal.js | dal/conversationCover.write.dal.js | UPDATE chat.inbox_entries (folder + last_message_id) | PARTIAL — actorId + conversationId required | MEDIUM |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| assertModerationAccess.dal.js | dal/assertModerationAccess.dal.js | CRITICAL: UUID TYPE MISMATCH | Queries learning.platform_admins with vc actor UUID (different namespace) — always returns false — moderator actions permanently blocked |
| moderationActions.controller.js — hideReportedObjectController | controllers/moderationActions.controller.js | PRIVILEGE ESCALATION BLOCKED (but auth gate broken) | Admin-only action behind broken gate — no moderator can take action |
| report_events audit trail | dal/reports.dal.js — insertReportEventRow | BROKEN AUDIT TRAIL | INSERT RLS policy missing on moderation.report_events; session-level flag disables writes (SEC-002) |
| DB migration deployment order | CARNAGE migration plan | OPERATIONAL RISK | Batch 5 (FORCE RLS) must never apply before Batch 1 (fix can_manage_domain); violating order locks out service_role |
| Dual-write on conversation cover | dal/moderationActions.dal.js + engines/chat/src/dal/moderationActions.write.dal.js | DATA CONSISTENCY RISK | Both feature layer and chat engine write to moderation.actions for conversation cover; no coordination |
| Group chat block enforcement | DB RLS | PARTIAL ENFORCEMENT | Block RLS covers direct chats only; group chat messages not filtered |

## CURRENT Governance Evidence
| Document | Path | Key Findings |
|---|---|---|
| CURRENT_STATUS.md | CURRENT/features/moderation/CURRENT_STATUS.md | Full command coverage matrix; 6 CARNAGE batches written but NOT applied; critical app-layer UUID bug documented |
| SECURITY.md | CURRENT/features/moderation/SECURITY.md | VENOM findings (10 total: 1 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW) |
| DR_STRANGE.md | CURRENT/features/moderation/DR_STRANGE.md | Feature oracle output |
| post-visibility-moderation.md | CURRENT/features/moderation/post-visibility-moderation.md | Post visibility moderation subsystem |

## Runtime Risk Summary

Moderation is a HIGH-tier feature with a complete architecture stack (7 controllers, 7 DALs, 1 model, 5 hooks, 9 adapters, 5 components) and zero test coverage. Two CRITICAL production bugs are confirmed: (1) `assertModerationAccessController` always throws FORBIDDEN due to a vc vs learning UUID namespace mismatch — no privileged moderation action can succeed through the app layer; (2) the report audit trail is broken due to a missing INSERT RLS policy on `moderation.report_events`. Six CARNAGE migration batches are written but none confirmed applied. A dangerous deployment order constraint exists: Batch 5 (FORCE RLS) must never apply before Batch 1 (fix `can_manage_domain`). The feature has no dedicated routes — all surfaces are embedded in other features via the adapter layer.

## Recommended Next Command

CARNAGE — Batch 1 (fix can_manage_domain vc branch) and app-layer UUID fix must ship together as the P0 unblock. After verification: Batch 2, 4, then Batch 5 in order.

## Recommended Next Ticket

TICKET-MODERATION-RUNTIME-001 — P0: fix `assertModerationAccess.dal.js` UUID type mismatch (app-layer fix) AND apply Batch 1 migration (fix can_manage_domain vc branch) IN THE SAME DEPLOYMENT. After verification, proceed with Batch 2, 4, then Batch 5 (FORCE RLS) in strict order.
