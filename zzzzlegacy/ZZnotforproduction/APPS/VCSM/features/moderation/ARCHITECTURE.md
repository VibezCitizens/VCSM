---
name: vcsm.moderation.architecture
description: ARCHITECT V2 module architecture report for VCSM:moderation
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** moderation
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/moderation
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The moderation module provides trust and safety enforcement for the VCSM platform. It enables Citizens to report content (posts, messages, conversations, actors, comments, profiles, Vports) and provides authorized moderators the ability to review and act on those reports by hiding content, recording moderation actions, and maintaining a full audit trail. It also supports actor-level post and conversation visibility toggles (hide/unhide per-actor) without requiring moderator access.

## OWNERSHIP

Platform safety layer, owned by the VCSM core platform team. It is a cross-cutting concern: it writes into moderation schema tables but also reaches into vc.posts and chat.messages/inbox_entries as enforcement surfaces. No external engine dependency is declared — this feature is self-contained at the DB boundary.

## ENTRY POINTS

- Adapter hooks exposed to other features: `useReportFlow.adapter.js`, `usePostVisibility.adapter.js`, `useCommentVisibility.adapter.js`, `useConversationCover.adapter.js`, `useHidePostForActor.adapter.js`
- Adapter components exposed to other features: `ReportModal.adapter.js`, `ReportThanksOverlay.adapter.js`, `ReportedObjectCover.adapter.js`, `ChatSpamCover.adapter.js`
- No registered routes (moderation is surface-invoked, not route-driven)
- Moderator admin path: `moderationActions.controller.js` — callable from any admin surface

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 19 | reports.dal.js, reports.read.dal.js, moderationActions.dal.js, conversationCover.read.dal.js, conversationCover.write.dal.js |
| Model | 2 | report.model.js (toDomainReport / toDomainReports) |
| Controller | 17 | report.controller.js, moderationActions.controller.js, postVisibility.controller.js, assertModerationAccess.controller.js, commentVisibility.controller.js, getConversationCoverStatus.controller.js, undoConversationCover.controller.js |
| Service | N/A | — |
| Adapter | 9 (fm) | ChatSpamCover.adapter.js, ReportModal.adapter.js, ReportThanksOverlay.adapter.js, ReportedObjectCover.adapter.js, useCommentVisibility.adapter.js, useConversationCover.adapter.js, useHidePostForActor.adapter.js, usePostVisibility.adapter.js, useReportFlow.adapter.js |
| Hook | 5 | useReportFlow.js, usePostVisibility.js, useCommentVisibility.js, useConversationCover.js, useHidePostForActor.js |
| Component | 7 | ChatSpamCover.jsx, ReportCoverScreen.jsx, ReportModal.jsx, ReportThanksOverlay.jsx, ReportedObjectCover.jsx |
| Screen | 0 | No dedicated screens — components render in-place or as overlays |
| Barrel | 8 | types/moderation.js, reports.dal.columns.js, assertModerationAccess.dal.js (and barrel/index files) |

Counts from scanner cg_layerCounts: controller=17, dal=19, hook=5, component=7, model=2, barrel=8.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source reading — report.controller.js, moderationActions.controller.js clearly state intent | — |
| Owner defined | PARTIAL | No OWNERSHIP.md or ownership annotation in docs | Ownership record missing |
| Entry points mapped | PASS | 9 adapters are the defined boundary surface | — |
| Controllers present/delegated | PASS | 17 controllers (cg_layerCounts) — report, moderationActions, postVisibility, assertModerationAccess, commentVisibility, conversationCover, undoConversationCover | — |
| DAL/repository present/delegated | PASS | 19 DAL files (cg_layerCounts) — explicit column selects confirmed in source | — |
| Models/transformers present | PASS | report.model.js provides toDomainReport / toDomainReports; 2 model units | — |
| Hooks/view models present | PASS | 5 hooks covering report flow, post/comment visibility, conversation cover | — |
| Screens/components present | PARTIAL | 5 components (overlays / covers) — no dedicated screen; ReportCoverScreen.jsx is a component not a screen | No full-screen admin UI in this feature |
| Services/adapters present | PASS | 9 adapters define the cross-feature public boundary | — |
| Database objects mapped | PASS | moderation.reports, moderation.report_events, moderation.actions, vc.posts, chat.messages, chat.inbox_entries — all confirmed as write surfaces | — |
| Authorization path mapped | PASS | assertModerationAccess.controller.js calls isModerationAuthorizedDAL (RPC moderation.is_current_user_moderator); called before all write ops | — |
| Cache/runtime behavior mapped | PARTIAL | No cache layer observed; hooks use useState only | No React Query / SWR — could cause stale state on visibility checks |
| Error/loading/empty states mapped | PARTIAL | useReportFlow has loading + error states; post/conversation visibility controllers do not expose error states to UI | Error propagation incomplete in visibility path |
| Documentation linked | PARTIAL | BEHAVIOR.md is PLACEHOLDER status — not a real contract | BEHAVIOR.md needs real content |
| Tests/validation noted | FAIL | 0 tests in scanner data | Security-critical feature with zero test coverage |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | No engines declared (feature is self-contained at DB boundary) — confirmed by scanner engines: [] | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| supabase client | external service | inbound to DAL | Yes | Used directly in DAL files via @/services/supabase/supabaseClient |
| moderation schema | DB | outbound write | Yes | reports, report_events, actions tables |
| vc schema | DB cross-schema | outbound write | WATCH | posts (hide) — moderation feature reaches into vc schema |
| chat schema | DB cross-schema | outbound write | WATCH | messages (hide), inbox_entries (folder, last_message) — moderation feature reaches into chat schema |
| block feature | cross-feature | inbound consumer | Yes | block feature uses moderation.block_actor / unblock_actor RPCs |
| settings feature | cross-feature | inbound consumer | Yes | settings feature calls moderation schema block/unblock RPCs directly |
| identity.is_current_user_moderator | RPC | outbound | Yes | Authorization gate for all moderator write paths |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| moderation.reports | INSERT, UPDATE | moderation feature | report.controller.js, moderationActions.controller.js | HIGH — user-submitted data; dedupeKey prevents resubmits |
| moderation.report_events | INSERT | moderation feature | report.controller.js, moderationActions.controller.js | MEDIUM — audit trail, best-effort only |
| moderation.actions | INSERT, DELETE | moderation feature | moderationActions.dal.js, moderationActions.controller.js | HIGH — enforcement record |
| vc.posts | UPDATE (is_hidden) | vc schema | moderationActions.controller.js (hidePostRow) | HIGH — content visibility, cross-schema write |
| chat.messages | UPDATE (is_hidden) | chat schema | moderationActions.controller.js (hideMessageRow) | HIGH — message visibility, cross-schema write |
| chat.inbox_entries | UPDATE, UPSERT (folder) | chat schema | conversationCover.write.dal.js, reports.dal.js (bridge on spam) | MEDIUM — inbox folder routing |
| moderation.is_current_user_moderator | RPC (read) | moderation schema | assertModerationAccess.dal.js | HIGH — authorization gate; must be correct or privilege escalation |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | No routes — invoked via adapter components/hooks from other features | — |
| Loading state | PARTIAL | useReportFlow exposes loading state; visibility hooks do not expose loading to consumers | Silent failures possible in post visibility |
| Empty state | PARTIAL | useReportFlow handles no-context case; visibility controllers return empty Set on missing actorId | — |
| Error state | PARTIAL | useReportFlow surfaces errors to UI; controller error paths return {ok:false, error} but visibility hooks swallow errors silently | Visibility errors swallowed |
| Auth/owner gates | PASS | assertModerationAccessController throws FORBIDDEN before all moderator writes; reporter gate checked via canReport in useReportFlow | — |
| Cache behavior | WATCH | No caching — visibility queries run on every render cycle that calls them | Performance risk at feed scale |
| Runtime dependencies | PASS | Only dependency is supabase client; no external engine required at runtime | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/moderation/BEHAVIOR.md | PRESENT (PLACEHOLDER — not a real contract) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | No engine dependencies |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder — no real contract | HIGH | This is a trust and safety feature; behavior must be formally specified | LOGAN |
| Zero test coverage | HIGH | Moderation is security-critical — auth gate, content hiding, report deduplication are all untested | SPIDER-MAN |
| No admin/moderator UI in source | MEDIUM | moderationActions.controller.js is implemented but there is no screen consuming it — moderator review workflow is headless | IRONMAN |
| Visibility hooks swallow errors silently | MEDIUM | Post and comment visibility hooks do not surface errors; failed DB calls result in empty Sets with no user feedback | VENOM / LOKI |
| No cache layer on visibility queries | MEDIUM | getHiddenPostIdsForActor queries on every call; at feed scale this is a per-render DB call | KRAVEN |
| OWNERSHIP.md missing | LOW | No formal ownership assignment for this cross-cutting concern | IRONMAN |
| CURRENT_STATUS.md was missing before this run | LOW | Architecture provenance gap | ARCHITECT |

---

## MODULE BOUNDARY WARNINGS

1. **Cross-schema write: moderation writes into vc.posts** — `hidePostRow` in reports.dal.js updates `vc.posts.is_hidden`. This is a direct cross-schema mutation. The DAL is correctly scoped but the ownership of `vc.posts` belongs to the post feature, not moderation. This is an intentional enforcement pattern but should be noted in the security audit.

2. **Cross-schema write: moderation writes into chat.messages and chat.inbox_entries** — `hideMessageRow` and `updateConversationInboxFolderDAL` reach into the chat schema. Same concern as above. These are enforcement operations, not chat feature operations.

3. **Bridge logic in DAL (insertReportRow)** — A spam report on a conversation triggers `upsertInboxEntryFolder` inside `insertReportRow`. This is DAL-level side-effect logic that belongs in the controller layer, not the DAL. Minor layer violation.

4. **settings and block features bypass the moderation adapter** — Both reach into `moderation` schema RPCs directly (block_actor / unblock_actor) without going through moderation's adapter boundary. This is acceptable for DB RPC calls but creates implicit coupling.

---

## SPAGHETTI SCORE

**Module:** moderation
**Score:** WATCH
**Reasons:** Cross-schema enforcement writes (vc.posts, chat.messages, chat.inbox_entries) are intentional but create coupling. Bridge logic embedded in `insertReportRow` DAL is a layer violation. No cache layer creates performance risk at feed scale. Authorization path is clean and consistently applied. Layer structure (DAL/Model/Controller/Hook/Adapter/Component) is well-organized. Zero tests on a security-critical feature is the primary concern.
**Release risk:** MEDIUM

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — "Behavior contract pending source review."

**Check A (Source without behavior):** FAIL — source is present and operational but BEHAVIOR.md has no real contract. The behavior is unspecified in documentation even though the code is implemented.

**Check B (Behavior without source):** N/A — BEHAVIOR.md has no happy paths defined.

**Check C (§13 engine consistency):** PASS — scanner declares engines: [] (none). No engine imports found in source scan. Consistent.

**Check D (§6 data change consistency):** PARTIAL — scanner write surfaces correctly capture moderation.actions, moderation.reports, moderation.report_events, vc.posts, chat.messages, chat.inbox_entries. No gaps between scanner data and source-confirmed writes.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md contract | Security-critical feature with a placeholder behavior doc — unacceptable for trust and safety work | LOGAN |
| P1 | Add test coverage for auth gate, report deduplication, and hide operations | Zero tests on security-critical paths | SPIDER-MAN |
| P2 | Move bridge logic (spam → inbox folder) from insertReportRow DAL into report.controller.js | Layer violation — side effects belong in controller | VENOM |
| P3 | Add cache layer to visibility queries or batch them | Performance risk at feed scale | KRAVEN |

## RECOMMENDED HANDOFFS

- **LOGAN** — BEHAVIOR.md must be written from source; current PLACEHOLDER is insufficient for a trust and safety feature
- **SPIDER-MAN** — Zero tests on moderation auth gate, report submission, and content hiding are unacceptable regression risk
- **VENOM** — Bridge logic in DAL layer and cross-schema write surfaces should be in the security audit scope
- **IRONMAN** — Moderator admin UI is missing; the controller is built but the review surface does not exist in source
- **LOKI** — Silent error swallowing in visibility hooks needs runtime observability
- **KRAVEN** — Visibility query performance at feed scale needs analysis

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
