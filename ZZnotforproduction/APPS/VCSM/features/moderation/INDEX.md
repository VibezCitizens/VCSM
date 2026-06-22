---
name: vcsm.moderation.index
description: VCSM moderation feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / moderation

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 17 | report.controller.js, moderationActions.controller.js, postVisibility.controller.js, assertModerationAccess.controller.js, commentVisibility.controller.js, getConversationCoverStatus.controller.js, undoConversationCover.controller.js |
| DAL files | 19 | reports.dal.js, reports.read.dal.js, reports.dal.columns.js, moderationActions.dal.js, conversationCover.read.dal.js, conversationCover.write.dal.js, assertModerationAccess.dal.js |
| Hooks | 5 | useReportFlow.js, usePostVisibility.js, useCommentVisibility.js, useConversationCover.js, useHidePostForActor.js |
| Models | 2 | report.model.js (toDomainReport, toDomainReports) |
| Screens | 0 | No dedicated screens — moderation surfaces are overlays/components |
| Components | 7 | ChatSpamCover.jsx, ReportCoverScreen.jsx, ReportModal.jsx, ReportThanksOverlay.jsx, ReportedObjectCover.jsx |
| Adapters | 9 | ChatSpamCover.adapter.js, ReportModal.adapter.js, ReportThanksOverlay.adapter.js, ReportedObjectCover.adapter.js, useCommentVisibility.adapter.js, useConversationCover.adapter.js, useHidePostForActor.adapter.js, usePostVisibility.adapter.js, useReportFlow.adapter.js |
| Barrels | 8 | types/moderation.js + barrel/re-export files |
| Tests | 0 | No tests detected — CRITICAL gap for a security feature |
| Routes | 0 | No route-map entries — moderation is surface-invoked, not route-driven |
| Total source files | 35 | From scanner sourceFileCount |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | moderation | — | isModerationAuthorizedDAL → is_current_user_moderator |
| update | chat | inbox_entries | updateConversationInboxFolderDAL |
| update | chat | inbox_entries | updateConversationInboxLastMessageDAL |
| delete | moderation | actions | dalDeleteConversationHideAction |
| insert | moderation | actions | insertModerationActionDAL |
| insert | moderation | reports | insertReportRow |
| insert | moderation | report_events | insertReportEventRow |
| insert | moderation | actions | insertModerationActionRow |
| update | moderation | reports | updateReportRowStatus |
| update | vc | posts | hidePostRow |
| update | chat | messages | hideMessageRow |
| upsert | chat | inbox_entries | upsertInboxEntryFolder |

## Security-Sensitive Surfaces

The following write surfaces are high-sensitivity and must be in scope for security audits:

- **moderation.is_current_user_moderator (RPC)** — This is the authorization gate for all moderator write paths. If this RPC can be bypassed or returns an incorrect result, privilege escalation is possible.
- **moderation.actions INSERT** — Records enforcement actions (hide, ban) against platform objects. Must only be writable by authorized moderators.
- **moderation.reports INSERT** — Accepts user-submitted reports. Deduplication is controller-level only; no DB-enforced uniqueness beyond optional dedupe_key.
- **vc.posts UPDATE (is_hidden)** — Cross-schema write from moderation feature. Content visibility for posts is controlled here.
- **chat.messages UPDATE (is_hidden)** — Cross-schema write from moderation feature. Message visibility controlled here.
- **chat.inbox_entries UPDATE/UPSERT (folder)** — Inbox folder routing modified by moderation; spam reports automatically move conversations to spam folder (bridge logic in DAL).

## Engine Dependencies

None detected — moderation feature is self-contained at the DB boundary. No engine imports found in static scan.

## Routes

No routes in route-map for this feature. Moderation is surface-invoked via adapter hooks and components from other features (feed, post, chat, profiles).

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — needs real contract authored) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
