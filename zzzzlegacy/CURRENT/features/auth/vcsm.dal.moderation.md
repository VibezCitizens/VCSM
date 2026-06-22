# VCSM DAL — `moderation`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/moderation/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 6 |
| Exported functions | 17 |
| Tables accessed | 6 |
| RPCs called | 1 |
| Risk findings | 0 |

## DAL Files

### `assertModerationAccess.dal.js`

**Path:** `features/moderation/dal/assertModerationAccess.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `isModerationAuthorizedDAL` | `rpc` | —`is_current_user_platform_admin` |

### `conversationCover.read.dal.js`

**Path:** `features/moderation/dal/conversationCover.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readLatestConversationMessageDAL` | `read` | `messages` |

### `conversationCover.write.dal.js`

**Path:** `features/moderation/dal/conversationCover.write.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `updateConversationInboxFolderDAL` | `read` · `update` | `inbox_entries` |
| `updateConversationInboxLastMessageDAL` | `read` · `update` | `inbox_entries` |

### `moderationActions.dal.js`

**Path:** `features/moderation/dal/moderationActions.dal.js`  
**Operations:** `read` · `insert` · `delete`  

**Exported functions:**

| `dalDeleteConversationHideAction` | `read` · `insert` · `delete` | `actions` |
| `dalGetConversationHideAction` | `read` · `insert` · `delete` | `actions` |
| `insertModerationActionDAL` | `read` · `insert` · `delete` | `actions` |
| `listModerationActionsForActorOnObjectsDAL` | `read` · `insert` · `delete` | `actions` |

### `reports.dal.js`

**Path:** `features/moderation/dal/reports.dal.js`  
**Operations:** `read` · `insert` · `update` · `upsert`  

**Exported functions:**

| `hideMessageRow` | `read` · `insert` · `update` · `upsert` | `report_events`, `inbox_entries`, `actions`, `posts`, `reports`, `messages` |
| `hidePostRow` | `read` · `insert` · `update` · `upsert` | `report_events`, `inbox_entries`, `actions`, `posts`, `reports`, `messages` |
| `insertModerationActionRow` | `read` · `insert` · `update` · `upsert` | `report_events`, `inbox_entries`, `actions`, `posts`, `reports`, `messages` |
| `insertReportEventRow` | `read` · `insert` · `update` · `upsert` | `report_events`, `inbox_entries`, `actions`, `posts`, `reports`, `messages` |
| `insertReportRow` | `read` · `insert` · `update` · `upsert` | `report_events`, `inbox_entries`, `actions`, `posts`, `reports`, `messages` |
| `updateReportRowStatus` | `read` · `insert` · `update` · `upsert` | `report_events`, `inbox_entries`, `actions`, `posts`, `reports`, `messages` |
| `upsertInboxEntryFolder` | `read` · `insert` · `update` · `upsert` | `report_events`, `inbox_entries`, `actions`, `posts`, `reports`, `messages` |

### `reports.read.dal.js`

**Path:** `features/moderation/dal/reports.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getReportRowByDedupeKey` | `read` | `reports` |
| `getReportRowById` | `read` | `reports` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actions` | DELETE, UPSERT | `dalDeleteConversationHideAction`, `dalGetConversationHideAction`, `hideMessageRow`, `hidePostRow`, `insertModerationActionDAL`, `insertModerationActionRow`, `insertReportEventRow`, `insertReportRow`, `listModerationActionsForActorOnObjectsDAL`, `updateReportRowStatus`, `upsertInboxEntryFolder` |
| `inbox_entries` | UPDATE, UPSERT | `hideMessageRow`, `hidePostRow`, `insertModerationActionRow`, `insertReportEventRow`, `insertReportRow`, `updateConversationInboxFolderDAL`, `updateConversationInboxLastMessageDAL`, `updateReportRowStatus`, `upsertInboxEntryFolder` |
| `messages` | READ, UPSERT | `hideMessageRow`, `hidePostRow`, `insertModerationActionRow`, `insertReportEventRow`, `insertReportRow`, `readLatestConversationMessageDAL`, `updateReportRowStatus`, `upsertInboxEntryFolder` |
| `posts` | UPSERT | `hideMessageRow`, `hidePostRow`, `insertModerationActionRow`, `insertReportEventRow`, `insertReportRow`, `updateReportRowStatus`, `upsertInboxEntryFolder` |
| `report_events` | UPSERT | `hideMessageRow`, `hidePostRow`, `insertModerationActionRow`, `insertReportEventRow`, `insertReportRow`, `updateReportRowStatus`, `upsertInboxEntryFolder` |
| `reports` | READ, UPSERT | `getReportRowByDedupeKey`, `getReportRowById`, `hideMessageRow`, `hidePostRow`, `insertModerationActionRow`, `insertReportEventRow`, `insertReportRow`, `updateReportRowStatus`, `upsertInboxEntryFolder` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `is_current_user_platform_admin` | `isModerationAuthorizedDAL` |

---

## Risk Findings

**DEAD CODE — `moderationActions.dal.js` (all 4 exports):** None of the 4 exported functions (`insertModerationActionDAL`, `listModerationActionsForActorOnObjectsDAL`, `dalGetConversationHideAction`, `dalDeleteConversationHideAction`) are imported by any controller, hook, or service in the codebase. The entire file is orphaned.

**DEAD CODE — `moderationActions.controller.js` (2 controller functions):** `hideReportedObjectController` and `dismissReportController` have zero callers in the entire VCSM app. These are complete use-case implementations (hide a reported object; dismiss a report) that were built but never wired to a hook or screen. They import 6 DAL functions whose entire chain traces back to these dead functions.

**DEAD CODE — downstream consequence (4 functions in `reports.dal.js` + 1 in `reports.read.dal.js`):** Because the two controller functions above are dead, everything they exclusively depend on is also dead:
- `insertModerationActionRow` — only called by `hideReportedObjectController`
- `updateReportRowStatus` — only called by `hideReportedObjectController` and `dismissReportController`
- `hidePostRow` — only called by `hideReportedObjectController`
- `hideMessageRow` — only called by `hideReportedObjectController`
- `getReportRowById` — only called by `hideReportedObjectController` and `dismissReportController`

**Guard protecting dead code:** `isModerationAuthorizedDAL` calls RPC `is_current_user_platform_admin` and is structurally live, but it is only used inside `moderationActions.controller.js` as a guard for `hideReportedObjectController` and `dismissReportController`. When those dead functions are removed, this guard becomes unused too.

**`reports.dal.columns.js` — not a missing entry:** This file appears in the Call Chains section but not in the DAL Files section. This is correct — it is a column-constants helper (exports 6 string column lists used in SELECT clauses), not a function DAL. The doc correctly excluded it from DAL Files and listed it in Call Chains.

**DAL-to-DAL import pattern — not a smell:** `reports.read.dal.js` is imported only by `reports.dal.js`, which re-exports its functions. This is intentional cohesion grouping — controllers use `reports.dal.js` as the single import point. No architectural violation.

---

## Pending Reviews

**DELETE CANDIDATES (requires IRONMAN ownership confirmation + VENOM security sign-off before removal):**

1. `features/moderation/dal/moderationActions.dal.js` — entire file (all 4 functions dead, no callers)
2. `hideReportedObjectController` in `features/moderation/controllers/moderationActions.controller.js` — dead use case (no hook, no screen)
3. `dismissReportController` in `features/moderation/controllers/moderationActions.controller.js` — dead use case (no hook, no screen)
4. `insertModerationActionRow`, `updateReportRowStatus`, `hidePostRow`, `hideMessageRow` in `features/moderation/dal/reports.dal.js` — dead downstream of the two dead controllers above
5. `getReportRowById` in `features/moderation/dal/reports.read.dal.js` — dead downstream of the two dead controllers above
6. `isModerationAuthorizedDAL` guard — live structurally but only protects dead code; becomes orphaned once the dead controllers are removed

**Before any deletion:** Confirm the hide/dismiss functionality is not wired through a non-static boundary (Edge Function, admin API route, or external service). A VENOM trust boundary review is strongly recommended before removing moderation code.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `assertModerationAccess.dal.js`

**Classification: GUARD PATTERN — structurally live, but only protects dead controller functions**

**Direct callers:**

- `assertModerationAccess.controller.js` _Controller_

**Chain:**

```
`assertModerationAccess.dal.js` → `assertModerationAccess.controller.js` → `moderationActions.controller.js` → `hideReportedObjectController` [DEAD]
`assertModerationAccess.dal.js` → `assertModerationAccess.controller.js` → `moderationActions.controller.js` → `dismissReportController` [DEAD]
```

> `isModerationAuthorizedDAL` is a permission guard that calls RPC `is_current_user_platform_admin`. The controller function is structurally live (imported, called at runtime when invoked). However, the only callers of the guard are `hideReportedObjectController` and `dismissReportController`, which are themselves dead code with no hook or screen entry point. When the dead controllers are removed, this guard becomes orphaned.

### `conversationCover.read.dal.js`

**Direct callers:**

- `undoConversationCover.controller.js` _Controller_

**Full call chain to screen:**

```
`conversationCover.read.dal.js` → `undoConversationCover.controller.js` → `useConversationCover.js` → `useConversationCover.adapter.js` → `ConversationView.jsx`
```

### `conversationCover.write.dal.js`

**Direct callers:**

- `undoConversationCover.controller.js` _Controller_

**Full call chain to screen:**

```
`conversationCover.write.dal.js` → `undoConversationCover.controller.js` → `useConversationCover.js` → `useConversationCover.adapter.js` → `ConversationView.jsx`
```

### `moderationActions.dal.js`

**Classification: ALL 4 EXPORTS DEAD — no controller imports any function from this file**

> The doc's original call chain listed `commentVisibility.controller.js`, `getConversationCoverStatus.controller.js`, `postVisibility.controller.js`, and `undoConversationCover.controller.js` as callers. These controllers exist but import from `moderationActions.dal.js` only for the functions they use — which are sourced from a different pattern. Static re-analysis confirmed: none of the 4 exported functions (`insertModerationActionDAL`, `listModerationActionsForActorOnObjectsDAL`, `dalGetConversationHideAction`, `dalDeleteConversationHideAction`) are imported anywhere in `apps/VCSM/src/`.

**Dead exports:**
- `insertModerationActionDAL` — 0 callers
- `listModerationActionsForActorOnObjectsDAL` — 0 callers
- `dalGetConversationHideAction` — 0 callers
- `dalDeleteConversationHideAction` — 0 callers

**Entire file is a DELETE CANDIDATE.** The conversation cover and post/comment visibility controllers use `moderationActions` from `reports.dal.js` and engine-level paths, not this file.

### `reports.dal.columns.js`

**Classification: COLUMN-CONSTANTS HELPER — not a function DAL, correctly excluded from DAL Files section**

**Direct consumers:**

- `reports.dal.js` _DAL_
- `reports.read.dal.js` _DAL_

**Chain:**

```
`reports.dal.columns.js` (column constants) → `reports.dal.js` → `report.controller.js` → `useReportFlow.js` → screens [LIVE]
`reports.dal.columns.js` (column constants) → `reports.dal.js` → `moderationActions.controller.js` → `hideReportedObjectController` [DEAD]
`reports.dal.columns.js` (column constants) → `reports.read.dal.js` → re-exported via `reports.dal.js` [mixed vitality]
```

> This file exports 6 string column lists (`REPORT_COLUMNS`, `REPORT_EVENT_COLUMNS`, `MOD_ACTION_COLUMNS`, `POST_HIDE_COLUMNS`, `MESSAGE_HIDE_COLUMNS`, `INBOX_ENTRY_FOLDER_COLUMNS`) used in SELECT clauses. It has no functions. It is a data constant file — not a DAL function file. The doc correctly excludes it from the DAL Files section.

### `reports.dal.js`

**Direct callers:**

- `moderationActions.controller.js` _Controller_
- `report.controller.js` _Controller_

**Full call chain to screen:**

```
`reports.dal.js` → `report.controller.js` → `useReportFlow.js` → `useReportFlow.adapter.js` → `ConversationView.jsx`
```
```
`reports.dal.js` → `report.controller.js` → `useReportFlow.js` → `useReportFlow.adapter.js` → `PostFeed.screen.jsx`
```
```
`reports.dal.js` → `report.controller.js` → `useReportFlow.js` → `useReportFlow.adapter.js` → `actorProfileScreenDependencies.adapter.js`
```

### `reports.read.dal.js`

**Classification: MIXED — 1 function live, 1 function dead. DAL-to-DAL import is intentional cohesion pattern.**

**Direct callers:**

- `reports.dal.js` _DAL_ (re-exports both functions — controllers import from `reports.dal.js` as single entry point)

**Chain by function:**

```
`getReportRowByDedupeKey` → `reports.dal.js` → `report.controller.js` → `useReportFlow.js` → screens [LIVE]
`getReportRowById` → `reports.dal.js` → `moderationActions.controller.js` → `hideReportedObjectController` [DEAD]
                                       → `moderationActions.controller.js` → `dismissReportController` [DEAD]
```

> `reports.read.dal.js` is imported only by `reports.dal.js`, which re-exports its functions. This is an intentional cohesion pattern — controllers use `reports.dal.js` as the canonical import point for all report-related DAL. `getReportRowByDedupeKey` is live (used in the active report submission flow). `getReportRowById` is dead — exclusively consumed by the two dead controller functions.

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `report.model.js` |
| **Controller** | ✓ PRESENT | `assertModerationAccess.controller.js`, `commentVisibility.controller.js`, `getConversationCoverStatus.controller.js`, `moderationActions.controller.js`, `postVisibility.controller.js`, `report.controller.js` +1 more |
| **Adapter** | ✓ PRESENT | `ChatSpamCover.adapter.js`, `ReportModal.adapter.js`, `ReportThanksOverlay.adapter.js`, `ReportedObjectCover.adapter.js`, `useCommentVisibility.adapter.js`, `useConversationCover.adapter.js` +3 more |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useCommentVisibility.js`, `useConversationCover.js`, `useHidePostForActor.js`, `usePostVisibility.js`, `useReportFlow.js` |
| **Component** | ✓ PRESENT | `ChatSpamCover.jsx`, `ReportCoverScreen.jsx`, `ReportModal.jsx`, `ReportThanksOverlay.jsx`, `ReportedObjectCover.jsx` |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✗ MISSING | — |

### Model

_Pure transforms — no side effects, no DB access_

- `features/moderation/models/report.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/moderation/controllers/assertModerationAccess.controller.js`
- `features/moderation/controllers/commentVisibility.controller.js`
- `features/moderation/controllers/getConversationCoverStatus.controller.js`
- `features/moderation/controllers/moderationActions.controller.js`
- `features/moderation/controllers/postVisibility.controller.js`
- `features/moderation/controllers/report.controller.js`
- `features/moderation/controllers/undoConversationCover.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/moderation/adapters/components/ChatSpamCover.adapter.js`
- `features/moderation/adapters/components/ReportModal.adapter.js`
- `features/moderation/adapters/components/ReportThanksOverlay.adapter.js`
- `features/moderation/adapters/components/ReportedObjectCover.adapter.js`
- `features/moderation/adapters/hooks/useCommentVisibility.adapter.js`
- `features/moderation/adapters/hooks/useConversationCover.adapter.js`
- `features/moderation/adapters/hooks/useHidePostForActor.adapter.js`
- `features/moderation/adapters/hooks/usePostVisibility.adapter.js`
- `features/moderation/adapters/hooks/useReportFlow.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/moderation/hooks/useCommentVisibility.js`
- `features/moderation/hooks/useConversationCover.js`
- `features/moderation/hooks/useHidePostForActor.js`
- `features/moderation/hooks/usePostVisibility.js`
- `features/moderation/hooks/useReportFlow.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/moderation/components/ChatSpamCover.jsx`
- `features/moderation/components/ReportCoverScreen.jsx`
- `features/moderation/components/ReportModal.jsx`
- `features/moderation/components/ReportThanksOverlay.jsx`
- `features/moderation/components/ReportedObjectCover.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan
- 🟡 **Final Screen** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audit Date:_ 2026-05-11  
_Auditor:_ ARCHITECT static scan + live import grep  
_Scope:_ 6 DAL files · 17 exported functions (+ 1 constants helper)  
_Method:_ Every exported function grepped across `apps/VCSM/src/`. Partial chains traced manually to terminal consumer. Controller-level dead code identified and traced back to orphaned DAL functions.

### Function Status Table

| Function | DAL File | Imported By | Status |
|---|---|---|---|
| `isModerationAuthorizedDAL` | `assertModerationAccess.dal.js` | `assertModerationAccess.controller.js` | GUARD — live structurally, only protects dead functions |
| `readLatestConversationMessageDAL` | `conversationCover.read.dal.js` | `undoConversationCover.controller.js` | LIVE |
| `updateConversationInboxFolderDAL` | `conversationCover.write.dal.js` | `undoConversationCover.controller.js` | LIVE |
| `updateConversationInboxLastMessageDAL` | `conversationCover.write.dal.js` | `undoConversationCover.controller.js` | LIVE |
| `insertModerationActionDAL` | `moderationActions.dal.js` | none | **DEAD** |
| `listModerationActionsForActorOnObjectsDAL` | `moderationActions.dal.js` | none | **DEAD** |
| `dalGetConversationHideAction` | `moderationActions.dal.js` | none | **DEAD** |
| `dalDeleteConversationHideAction` | `moderationActions.dal.js` | none | **DEAD** |
| `hideMessageRow` | `reports.dal.js` | `moderationActions.controller.js` | **DEAD** (caller is dead) |
| `hidePostRow` | `reports.dal.js` | `moderationActions.controller.js` | **DEAD** (caller is dead) |
| `insertModerationActionRow` | `reports.dal.js` | `moderationActions.controller.js` | **DEAD** (caller is dead) |
| `insertReportEventRow` | `reports.dal.js` | `report.controller.js`, `moderationActions.controller.js` | LIVE (used in active report submission) |
| `insertReportRow` | `reports.dal.js` | `report.controller.js` | LIVE |
| `updateReportRowStatus` | `reports.dal.js` | `moderationActions.controller.js` | **DEAD** (caller is dead) |
| `upsertInboxEntryFolder` | `reports.dal.js` | `report.controller.js` | LIVE |
| `getReportRowByDedupeKey` | `reports.read.dal.js` | `reports.dal.js` → `report.controller.js` | LIVE |
| `getReportRowById` | `reports.read.dal.js` | `reports.dal.js` → `moderationActions.controller.js` | **DEAD** (caller is dead) |

### Dead Controller Functions (Root Cause)

The 10 dead DAL functions trace back to 2 dead controller functions that were built but never wired to a hook or screen:

| Controller Function | File | Dead Since | Evidence |
|---|---|---|---|
| `hideReportedObjectController` | `moderationActions.controller.js` | Unknown | Zero callers in entire `apps/VCSM/src/` |
| `dismissReportController` | `moderationActions.controller.js` | Unknown | Zero callers in entire `apps/VCSM/src/` |

### DAL File Inventory

| Status | Count |
|---|---|
| DAL function files on disk | 6 |
| DAL function files in doc | 6 |
| Constants helper files (correctly excluded from DAL Files) | 1 (`reports.dal.columns.js`) |
| Fully dead DAL files | 1 (`moderationActions.dal.js`) |
| Partially dead DAL files | 2 (`reports.dal.js`, `reports.read.dal.js`) |
| Fully live DAL files | 3 |

### Verdict by Classification

| Classification | Count | Items |
|---|---|---|
| LIVE | 6 | `readLatestConversationMessageDAL`, `updateConversationInboxFolderDAL`, `updateConversationInboxLastMessageDAL`, `insertReportEventRow`, `insertReportRow`, `upsertInboxEntryFolder`, `getReportRowByDedupeKey` |
| DEAD | 10 | All 4 `moderationActions.dal.js` exports + `hideMessageRow`, `hidePostRow`, `insertModerationActionRow`, `updateReportRowStatus`, `getReportRowById` |
| GUARD (protects dead code) | 1 | `isModerationAuthorizedDAL` |
| TRUE DEAD CODE | **10 functions** | — |

### Deletion Safety Checks

| Candidate | Imports Clear | Routes Clear | Dynamic Refs Clear | Owner Clear | Status |
|---|---|---|---|---|---|
| `moderationActions.dal.js` (whole file) | YES — 0 callers | YES | NEEDS VENOM | NEEDS IRONMAN | DELETE CANDIDATE |
| `hideReportedObjectController` | YES — 0 callers | YES | NEEDS VENOM | NEEDS IRONMAN | DELETE CANDIDATE |
| `dismissReportController` | YES — 0 callers | YES | NEEDS VENOM | NEEDS IRONMAN | DELETE CANDIDATE |
| `hideMessageRow`, `hidePostRow`, `insertModerationActionRow`, `updateReportRowStatus` | YES — dead callers only | YES | NEEDS VENOM | NEEDS IRONMAN | DELETE CANDIDATE |
| `getReportRowById` | YES — dead callers only | YES | NEEDS VENOM | NEEDS IRONMAN | DELETE CANDIDATE |
| `isModerationAuthorizedDAL` | Dependent on above | Dependent | NEEDS VENOM | NEEDS IRONMAN | REMOVE AFTER CONTROLLERS |

> **VENOM review is mandatory before deletion.** Moderation code touches sensitive surfaces (`reports`, `actions`, `posts`, `messages`). Confirm no Edge Function, admin API, or external trigger calls these functions before removing.

---

## Native Parity Notes

Native Relevance: YES  
Falcon Review: REQUIRED  
Related Native Module: `moderation` — report flow, conversation cover, post/comment visibility are user-facing surfaces that must be preserved in native.  
Native Transfer Status: PENDING FALCON  
Known Native Gaps: The dead controller functions (`hideReportedObjectController`, `dismissReportController`) suggest the admin-side moderation action flow was never fully implemented in the PWA. Native should not include these until the web flow is restored and verified. The active report submission path (`report.controller.js` → `useReportFlow`) is live and native-relevant.  
Winter Soldier Handoff: Not yet initiated.

---

## Command Evidence Registry

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.moderation.md` (this doc) | Initial DAL map + dead code audit source | PRESENT |
| VENOM | — | **REQUIRED** before any deletion — moderation touches reports, actions, posts, messages | MISSING |
| IRONMAN | — | **REQUIRED** ownership confirmation before deletion of `moderationActions.dal.js` and dead controllers | MISSING |
| SENTRY | — | Architecture boundary review — guard-protecting-dead-code pattern | MISSING |
| FALCON | — | Native parity for report flow and conversation cover | MISSING |
| LOKI | — | Runtime trace — confirm no dynamic callers of dead functions | MISSING |
| CARNAGE | — | DB migration history for `reports`, `actions`, `report_events` | MISSING |

---

## Change Log

### 2026-05-11

**Task:** Dead code audit of moderation DAL layer — verify all 6 DAL files and 17 exported functions; resolve partial chains; identify dead code  
**Application Scope:** VCSM  
**Prompt:** User requested ARCHITECT dead code detection on `vcsm.dal.moderation.md`, confirmed findings, then requested Logan update  
**Code Status Before:** All partial chains unlabelled. Risk Findings and Pending Reviews were empty placeholders. `moderationActions.dal.js` appeared live in the doc but had no callers. `reports.dal.columns.js` anomaly unresolved.  
**Code Status After:** No code changes — audit only. Documentation updated.  
**Files Changed:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.moderation.md` (this file)  
**Command Evidence:** ARCHITECT static scan + live import grep across `apps/VCSM/src/` + manual controller-level tracing  
**Architecture Contracts Checked:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md  
**Security / Runtime / DB Notes:** 10 dead functions identified — all trace to 2 dead controller functions (`hideReportedObjectController`, `dismissReportController`) that were built but never wired. VENOM and IRONMAN sign-off required before any deletion. `isModerationAuthorizedDAL` calls RPC `is_current_user_platform_admin` — security-sensitive, must not be removed without VENOM review. `reports.dal.columns.js` confirmed as constants helper, not a DAL file — no action needed.  
**Validation:** 6 live functions confirmed. 10 dead functions confirmed. 1 guard function lives only to protect dead code. DAL-to-DAL import in `reports.read.dal.js` confirmed as intentional cohesion pattern, not a smell.  
**Documentation Truth Status:** VERIFIED  
**Native Documentation Verification:** PENDING FALCON

---

## Layer Consumer Map

_Performed:_ 2026-05-11 · Method: ARCHITECT + Explore agent full import trace across `apps/VCSM/src/`  
_Question answered:_ Which models, controllers, hooks, adapters, and screens touch each DAL function?

---

## ⚠️ DEAD CODE AUDIT CORRECTION

> **The previous dead code audit incorrectly classified all 4 `moderationActions.dal.js` exports as DEAD.**
>
> Full import trace confirms they ARE imported by active controllers with live screen chains:
>
> | Function | Importer | Chain Reaches |
> |---|---|---|
> | `insertModerationActionDAL` | `commentVisibility.controller.js`, `postVisibility.controller.js` | `CentralFeedScreen.jsx` (via `useHidePostForActor`) |
> | `listModerationActionsForActorOnObjectsDAL` | `commentVisibility.controller.js`, `postVisibility.controller.js` | `CentralFeedScreen.jsx` (via `useHidePostForActor`) |
> | `dalGetConversationHideAction` | `getConversationCoverStatus.controller.js`, `undoConversationCover.controller.js` | `ConversationView.jsx` (via `useConversationCover`) |
> | `dalDeleteConversationHideAction` | `undoConversationCover.controller.js` | `ConversationView.jsx` (via `useConversationCover`) |
>
> The original audit stated: "Static re-analysis confirmed: none of the 4 exported functions are imported anywhere." This was a false negative from the static scan. The function-level import trace conducted by the Explore agent found all 4 are imported and connected to live screens.
>
> **Corrected status for `moderationActions.dal.js`:** NOT a dead file. All 4 exports are LIVE.  
> **`moderationActions.dal.js` must be removed from the DELETE CANDIDATES list.**

---

> **NEW dead adapters found** that were not in the previous audit:
>
> | Adapter | Status | Finding |
> |---|---|---|
> | `adapters/components/ReportedObjectCover.adapter.js` | **DEAD** | 0 callers anywhere in codebase |
> | `adapters/hooks/useCommentVisibility.adapter.js` | **DEAD** | 0 callers — `useCommentVisibility` hook is never consumed externally |
> | `adapters/hooks/usePostVisibility.adapter.js` | **DEAD** | 0 callers — post visibility reached via `useHidePostForActor` wrapper instead |

---

### Full System Flow

```
CONVERSATION COVER PATH (ConversationView.jsx)

features/chat/conversation/screen/ConversationView.jsx
  → useConversationCover (adapter: useConversationCover.adapter.js)
      → useConversationCover.js (hook)
          → getConversationCoverStatus.controller.js
              → [DAL] dalGetConversationHideAction
          → undoConversationCover.controller.js
              → [DAL] dalDeleteConversationHideAction     (calls dalGetConversationHideAction internally)
              → [DAL] readLatestConversationMessageDAL
              → [DAL] updateConversationInboxFolderDAL
              → [DAL] updateConversationInboxLastMessageDAL
  → useReportFlow (adapter: useReportFlow.adapter.js)
      → useReportFlow.js (hook)
          → report.controller.js
              → [DAL] insertReportRow
              → [DAL] insertReportEventRow
              → [DAL] getReportRowByDedupeKey
              → [DAL] upsertInboxEntryFolder
  → ChatSpamCover.adapter.js    (component — renders spam overlay)
  → ReportModal.adapter.js      (component — renders report modal)

POST HIDE / VISIBILITY PATH (CentralFeedScreen.jsx)

features/feed/screens/CentralFeedScreen.jsx
  → useCentralFeedActions.js (feed hook)
      → useHidePostForActor (adapter: useHidePostForActor.adapter.js)
          → useHidePostForActor.js (hook)
              → usePostVisibility.js (hook)
                  → postVisibility.controller.js
                      → [DAL] insertModerationActionDAL
                      → [DAL] listModerationActionsForActorOnObjectsDAL
      → useReportFlow (adapter: useReportFlow.adapter.js)
          → report.controller.js → [DAL] insertReportRow, insertReportEventRow, etc.
  → ReportModal.adapter.js      (component)
  → ReportThanksOverlay.adapter.js  (component — aliased as ReportedPostCover)

DEAD CONTROLLER PATH (no screen reached)

moderationActions.controller.js
  → hideReportedObjectController()    [DEAD — 0 callers]
      → assertModerationAccess.controller.js → [DAL] isModerationAuthorizedDAL
      → [DAL] insertModerationActionRow
      → [DAL] updateReportRowStatus
      → [DAL] hidePostRow
      → [DAL] hideMessageRow
      → [DAL] getReportRowById
  → dismissReportController()         [DEAD — 0 callers]
      → assertModerationAccess.controller.js → [DAL] isModerationAuthorizedDAL
      → [DAL] updateReportRowStatus
      → [DAL] getReportRowById

COMMENT VISIBILITY PATH (adapter dead — hook not externally consumed)

useCommentVisibility.js (hook)
  → commentVisibility.controller.js
      → [DAL] insertModerationActionDAL
      → [DAL] listModerationActionsForActorOnObjectsDAL
  adapter: useCommentVisibility.adapter.js  → NOT IMPORTED by any screen [DEAD ADAPTER]
```

---

### Per-Function Consumer Table (Corrected)

| DAL Function | Controller | Hook | Adapter | Terminal Screen | Status |
|---|---|---|---|---|---|
| `isModerationAuthorizedDAL` | `assertModerationAccess.controller.js` | — | — | — | GUARD — protects dead controllers only |
| `readLatestConversationMessageDAL` | `undoConversationCover.controller.js` | `useConversationCover.js` | `useConversationCover.adapter.js` | `ConversationView.jsx` (chat feature) | LIVE |
| `updateConversationInboxFolderDAL` | `undoConversationCover.controller.js` | `useConversationCover.js` | `useConversationCover.adapter.js` | `ConversationView.jsx` | LIVE |
| `updateConversationInboxLastMessageDAL` | `undoConversationCover.controller.js` | `useConversationCover.js` | `useConversationCover.adapter.js` | `ConversationView.jsx` | LIVE |
| `insertModerationActionDAL` | `commentVisibility.controller.js`, `postVisibility.controller.js` | `useCommentVisibility.js`, `usePostVisibility.js` → `useHidePostForActor.js` | `useHidePostForActor.adapter.js` | `CentralFeedScreen.jsx` (feed feature) | **LIVE — previously misclassified as DEAD** |
| `listModerationActionsForActorOnObjectsDAL` | `commentVisibility.controller.js`, `postVisibility.controller.js` | `useCommentVisibility.js`, `usePostVisibility.js` → `useHidePostForActor.js` | `useHidePostForActor.adapter.js` | `CentralFeedScreen.jsx` | **LIVE — previously misclassified as DEAD** |
| `dalGetConversationHideAction` | `getConversationCoverStatus.controller.js`, `undoConversationCover.controller.js` | `useConversationCover.js` | `useConversationCover.adapter.js` | `ConversationView.jsx` | **LIVE — previously misclassified as DEAD** |
| `dalDeleteConversationHideAction` | `undoConversationCover.controller.js` | `useConversationCover.js` | `useConversationCover.adapter.js` | `ConversationView.jsx` | **LIVE — previously misclassified as DEAD** |
| `hideMessageRow` | `moderationActions.controller.js` (`hideReportedObjectController`) | — | — | — | DEAD (caller is dead) |
| `hidePostRow` | `moderationActions.controller.js` (`hideReportedObjectController`) | — | — | — | DEAD (caller is dead) |
| `insertModerationActionRow` | `moderationActions.controller.js` (`hideReportedObjectController`) | — | — | — | DEAD (caller is dead) |
| `insertReportEventRow` | `report.controller.js` | `useReportFlow.js` | `useReportFlow.adapter.js` | `ConversationView.jsx`, `CentralFeedScreen.jsx` | LIVE |
| `insertReportRow` | `report.controller.js` | `useReportFlow.js` | `useReportFlow.adapter.js` | `ConversationView.jsx`, `CentralFeedScreen.jsx` | LIVE |
| `updateReportRowStatus` | `moderationActions.controller.js` (dead controllers) | — | — | — | DEAD (callers are dead) |
| `upsertInboxEntryFolder` | `report.controller.js` | `useReportFlow.js` | `useReportFlow.adapter.js` | `ConversationView.jsx`, `CentralFeedScreen.jsx` | LIVE |
| `getReportRowByDedupeKey` | `report.controller.js` | `useReportFlow.js` | `useReportFlow.adapter.js` | `ConversationView.jsx`, `CentralFeedScreen.jsx` | LIVE |
| `getReportRowById` | `moderationActions.controller.js` (dead controllers) | — | — | — | DEAD (callers are dead) |

---

### Controllers

| Controller | DAL Functions Used | Hook Consumer | Notes |
|---|---|---|---|
| `assertModerationAccess.controller.js` | `isModerationAuthorizedDAL` | — | Only called from dead controller functions |
| `commentVisibility.controller.js` | `insertModerationActionDAL`, `listModerationActionsForActorOnObjectsDAL` | `useCommentVisibility.js` | Hook's adapter is dead — externally unreachable |
| `getConversationCoverStatus.controller.js` | `dalGetConversationHideAction` | `useConversationCover.js` | Runs on mount to check spam cover state |
| `moderationActions.controller.js` | `insertModerationActionRow`, `updateReportRowStatus`, `hidePostRow`, `hideMessageRow`, `getReportRowById` | — | Both functions dead — no hook, no screen |
| `postVisibility.controller.js` | `insertModerationActionDAL`, `listModerationActionsForActorOnObjectsDAL` | `usePostVisibility.js` → `useHidePostForActor.js` | Reached via `CentralFeedScreen` |
| `report.controller.js` | `insertReportRow`, `insertReportEventRow`, `upsertInboxEntryFolder`, `getReportRowByDedupeKey` | `useReportFlow.js` | Active report submission path |
| `undoConversationCover.controller.js` | `dalDeleteConversationHideAction`, `dalGetConversationHideAction`, `readLatestConversationMessageDAL`, `updateConversationInboxFolderDAL`, `updateConversationInboxLastMessageDAL` | `useConversationCover.js` | Undoes spam cover — restores conversation folder + last message |

---

### Hooks

| Hook | Controller Consumed | DAL Reached (indirect) | Adapter | External Screen |
|---|---|---|---|---|
| `useConversationCover.js` | `getConversationCoverStatus.controller.js`, `undoConversationCover.controller.js` | `dalGetConversationHideAction`, `dalDeleteConversationHideAction`, `readLatestConversationMessageDAL`, `updateConversationInboxFolderDAL`, `updateConversationInboxLastMessageDAL` | `useConversationCover.adapter.js` | `ConversationView.jsx` (chat feature) |
| `useCommentVisibility.js` | `commentVisibility.controller.js` | `insertModerationActionDAL`, `listModerationActionsForActorOnObjectsDAL` | `useCommentVisibility.adapter.js` (**DEAD**) | None — adapter not consumed |
| `useHidePostForActor.js` | wraps `usePostVisibility.js` | `insertModerationActionDAL`, `listModerationActionsForActorOnObjectsDAL` | `useHidePostForActor.adapter.js` | `CentralFeedScreen.jsx` (feed feature) |
| `usePostVisibility.js` | `postVisibility.controller.js` | `insertModerationActionDAL`, `listModerationActionsForActorOnObjectsDAL` | `usePostVisibility.adapter.js` (**DEAD**) | Reached via `useHidePostForActor` wrapper, not via own adapter |
| `useReportFlow.js` | `report.controller.js` | `insertReportRow`, `insertReportEventRow`, `upsertInboxEntryFolder`, `getReportRowByDedupeKey` | `useReportFlow.adapter.js` | `ConversationView.jsx`, `CentralFeedScreen.jsx` |

---

### Models

| Model | File | Exports Used | Used By |
|---|---|---|---|
| `report.model.js` | `features/moderation/models/report.model.js` | `toDomainReport(row)` | `report.controller.js` (lines 66, 119), `moderationActions.controller.js` (lines 38, 103, 121, 145) |

---

### Adapters — Full Status

| Adapter | Type | External Importer | Terminal Screen | Status |
|---|---|---|---|---|
| `ChatSpamCover.adapter.js` | Component | `ConversationView.jsx` (chat feature, line 27) | `ConversationView.jsx` | LIVE |
| `ReportModal.adapter.js` | Component | `ConversationView.jsx` (line 25), `CentralFeedScreen.jsx` (line 19) | Both screens | LIVE |
| `ReportThanksOverlay.adapter.js` | Component | `CentralFeedScreen.jsx` (line 23, aliased as `ReportedPostCover`) | `CentralFeedScreen.jsx` | LIVE |
| `ReportedObjectCover.adapter.js` | Component | **None** | — | **DEAD — 0 callers** |
| `useCommentVisibility.adapter.js` | Hook | **None** | — | **DEAD — 0 callers** |
| `useConversationCover.adapter.js` | Hook | `ConversationView.jsx` (chat feature, line 15) | `ConversationView.jsx` | LIVE |
| `useHidePostForActor.adapter.js` | Hook | `features/feed/hooks/useCentralFeedActions.js` (line 7) | `CentralFeedScreen.jsx` | LIVE |
| `usePostVisibility.adapter.js` | Hook | **None** | — | **DEAD — post visibility reached via `useHidePostForActor` wrapper instead** |
| `useReportFlow.adapter.js` | Hook | `ConversationView.jsx` (line 11), `features/feed/hooks/useCentralFeedActions.js` (line 8) | Both screens | LIVE |

---

### Screens Reached (External Features)

| Screen | Feature | Moderation Adapters Consumed | DAL Reached |
|---|---|---|---|
| `features/chat/conversation/screen/ConversationView.jsx` | Chat | `useConversationCover.adapter`, `useReportFlow.adapter`, `ChatSpamCover.adapter`, `ReportModal.adapter` | `dalGetConversationHideAction`, `dalDeleteConversationHideAction`, `readLatestConversationMessageDAL`, `updateConversationInboxFolderDAL`, `updateConversationInboxLastMessageDAL`, `insertReportRow`, `insertReportEventRow`, `upsertInboxEntryFolder`, `getReportRowByDedupeKey` |
| `features/feed/screens/CentralFeedScreen.jsx` | Feed | `useHidePostForActor.adapter`, `useReportFlow.adapter`, `ReportModal.adapter`, `ReportThanksOverlay.adapter` | `insertModerationActionDAL`, `listModerationActionsForActorOnObjectsDAL`, `insertReportRow`, `insertReportEventRow`, `upsertInboxEntryFolder`, `getReportRowByDedupeKey` |

The moderation feature has **no screens of its own** — it is a pure cross-feature injection library. All UI surfaces live in chat and feed features. The moderation feature components, hooks, and DAL are consumed exclusively via its adapter layer.

---

### Corrected Dead Code Summary

| Classification | Count | Items |
|---|---|---|
| LIVE | **11** | `readLatestConversationMessageDAL`, `updateConversationInboxFolderDAL`, `updateConversationInboxLastMessageDAL`, `insertModerationActionDAL`, `listModerationActionsForActorOnObjectsDAL`, `dalGetConversationHideAction`, `dalDeleteConversationHideAction`, `insertReportRow`, `insertReportEventRow`, `upsertInboxEntryFolder`, `getReportRowByDedupeKey` |
| DEAD (DAL functions) | **5** | `hideMessageRow`, `hidePostRow`, `insertModerationActionRow`, `updateReportRowStatus`, `getReportRowById` |
| GUARD (protects dead controllers) | **1** | `isModerationAuthorizedDAL` |
| DEAD (adapters) | **3** | `ReportedObjectCover.adapter.js`, `useCommentVisibility.adapter.js`, `usePostVisibility.adapter.js` |

**Revised DELETE CANDIDATES** (removing `moderationActions.dal.js` from list — it is LIVE):

1. `hideReportedObjectController` in `moderationActions.controller.js` — dead use case
2. `dismissReportController` in `moderationActions.controller.js` — dead use case
3. `insertModerationActionRow`, `updateReportRowStatus`, `hidePostRow`, `hideMessageRow` in `reports.dal.js`
4. `getReportRowById` in `reports.read.dal.js`
5. `isModerationAuthorizedDAL` + `assertModerationAccess.controller.js` (after dead controllers removed)
6. `ReportedObjectCover.adapter.js` — dead adapter
7. `useCommentVisibility.adapter.js` — dead adapter (hook itself kept — used internally)
8. `usePostVisibility.adapter.js` — dead adapter (hook itself kept — used via `useHidePostForActor`)

All deletions still require IRONMAN confirmation + VENOM sign-off.

---

### Change Log Entry

### 2026-05-11 — Layer Consumer Map + Dead Code Audit Correction

Task: ARCHITECT full layer consumer trace — models, controllers, hooks, adapters, and screens; corrected previous dead code misclassification  
Application Scope: VCSM  
Code Reviewed: All 6 DAL files + all 7 controllers + all 5 hooks + 9 adapters + 1 model + `ConversationView.jsx` (chat feature) + `CentralFeedScreen.jsx` (feed feature)  
Files Changed: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.moderation.md` (this file)

Key findings:
- **CORRECTION:** `moderationActions.dal.js` all 4 exports are LIVE — previous audit was a false negative from the static scan
- `moderationActions.dal.js` is consumed by `commentVisibility.controller.js`, `postVisibility.controller.js`, `getConversationCoverStatus.controller.js`, and `undoConversationCover.controller.js`
- Moderation feature has no screens of its own — it is a pure cross-feature injection library consumed by chat and feed
- Terminal screens are `ConversationView.jsx` (chat) and `CentralFeedScreen.jsx` (feed) via the adapter layer
- 3 dead adapters found: `ReportedObjectCover.adapter.js`, `useCommentVisibility.adapter.js`, `usePostVisibility.adapter.js`
- `useCommentVisibility` hook path is effectively unreachable externally — its adapter is dead and no other adapter wraps it
- `reports.dal.js` DAL-to-DAL import of `reports.read.dal.js` confirmed at line 10 (re-export pattern)  
Documentation Truth Status: VERIFIED (with correction applied)

---

## Avengers Assembly Report — 2026-05-11

**Run Summary**

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | User — `/AvengersAssemble` scoped to this document |
| Application Scope | VCSM |
| Document Scope | `vcsm.dal.moderation.md` — moderation DAL alignment pass |
| Passes Completed | ARCHITECT · VENOM · LOGAN · review-contract · Session-Summary Structure |
| Branch | `vport-booking-feed-security-updates` |
| Commits verified | `8baf6d5` (2026-05-10) — touched 4 moderation files |

---

### ARCHITECT

**Status: DRIFT FOUND**

| Finding | Severity | Detail |
|---|---|---|
| `types/moderation.js` undocumented | MODERATE | New file added in commit `8baf6d5`. Exports three constant arrays: `REPORT_OBJECT_TYPES` (7 values), `REPORT_REASONS` (12 values), `REPORT_STATUSES` (6 values). Not listed anywhere in the Architecture Pipeline, Change Log, or any section of this doc. Zero consumers found — no file imports it. |
| `assertModerationAccess.dal.js` major rewrite not in Change Log | MODERATE | Commit `8baf6d5` rewrote this file (45 lines changed). Exported function name changed from `assertModerationAccessDAL` (throwing assertion) to `isModerationAuthorizedDAL` (returns boolean). The direct `learning.platform_admins` table query was replaced with `rpc('is_current_user_platform_admin')`. The doc's DAL Files section correctly shows the current state but the Change Log has no entry for this rewrite. |
| `reports.dal.js` `skipReportEventsInsertForSession` flag removal not in Change Log | MODERATE | Commit `8baf6d5` removed the module-level `skipReportEventsInsertForSession` boolean and the `isRlsDenied` helper (31 lines changed). The return shape of `insertReportEventRow` simplified from `{ row, error, skipped }` to `{ row, error }`. Change Log has no entry for this. |
| All 6 DAL files | ALIGNED | Present and confirmed. |
| All 17 exported functions | ALIGNED | Count and names match. |
| Dead adapters | ALIGNED | 3 still dead: `ReportedObjectCover.adapter.js`, `useCommentVisibility.adapter.js`, `usePostVisibility.adapter.js`. Zero external callers confirmed. |
| Dead controllers | ALIGNED | `hideReportedObjectController`, `dismissReportController` — zero callers confirmed. |

---

### VENOM

**Status: DRIFT FOUND**

| Finding | Severity | Detail |
|---|---|---|
| `assertModerationAccess.dal.js` — `actorId` parameter now decorative | HIGH | After `8baf6d5`, `isModerationAuthorizedDAL(actorId)` accepts `actorId` but does NOT pass it to the RPC. The RPC `is_current_user_platform_admin` resolves the user from the database session via `auth.uid()` server-side. The `actorId` parameter is effectively unused in the authorization check. This means the permission check always evaluates the currently authenticated session user, regardless of what `actorId` is passed. If a caller passes a different `actorId` expecting that actor to be checked, the check silently evaluates the session user instead. The doc does not document this behavioral subtlety. |
| `skipReportEventsInsertForSession` RLS bypass removed | MODERATE | The removed flag previously caused `report_events` inserts to be silently skipped for the entire browser session after any RLS denial. This was a security concern — failed moderation event inserts were swallowed rather than surfaced. The removal means errors now propagate correctly. The doc does not record this security improvement. |
| 7 ungated `console.error` calls in `reports.dal.js` | MODERATE | Lines 46, 102, 151, 182, 225, 246, 267. Each logs the full `insert` object or `reportId`/`actorId` to the browser console on error — in production. None are DEV-gated. Sensitive moderation data (actor IDs, report IDs, message IDs) is logged to the console on any Supabase error. Policy: no `console.log` in production. |
| No `select('*')` violations | ALIGNED | All DAL files use explicit column lists. Confirmed. |
| No new auth surfaces | ALIGNED | RPC `is_current_user_platform_admin` already documented. No new RPCs or auth writes added. |
| Dead enforcement path unchanged | ALIGNED | `hideReportedObjectController` and `dismissReportController` remain dead. Moderation enforcement is not reachable from any live UI surface. |

---

### LOGAN

**Status: DRIFT FOUND**

| Finding | File/Section | Drift Type | Detail |
|---|---|---|---|
| `types/moderation.js` entirely absent from doc | Architecture Pipeline, Change Log | MODERATE | New constants file exists in `features/moderation/types/moderation.js`. Not listed in any section. Not in the Architecture Pipeline. No Change Log entry. Zero consumers — possibly scaffolded for future use. |
| Change Log missing `8baf6d5` security changes | Change Log section | MODERATE | The two existing Change Log entries (both 2026-05-11) do not capture the `8baf6d5` changes: (1) `assertModerationAccess.dal.js` full rewrite, (2) `reports.dal.js` skip-flag removal, (3) `moderationActions.controller.js` import redirect from DAL to controller. These are the most significant security changes in this feature's history and have no record in the doc. |
| `isModerationAuthorizedDAL` `actorId` decorative behavior undocumented | DAL Files section | MODERATE | The current `isModerationAuthorizedDAL(actorId)` signature accepts `actorId` but the implementation ignores it — the RPC resolves via `auth.uid()`. This is a non-obvious behavioral contract that callers need to know. Not noted anywhere. |
| `console.error` calls in `reports.dal.js` not flagged | Risk Findings, Pending Reviews | LOW | 7 ungated `console.error` calls not mentioned in Risk Findings or Pending Reviews. Should be flagged for removal alongside the no-console policy. |
| All dead code classifications | Dead Code sections | ALIGNED | Corrected dead code summary (11 LIVE, 5 DEAD DAL functions, 1 GUARD, 3 dead adapters) remains accurate. No new dead code introduced by `8baf6d5`. |
| All adapter status entries | Adapters section | ALIGNED | 9 adapters, 6 LIVE + 3 DEAD — confirmed unchanged. |

---

### review-contract

**Status: VIOLATIONS FOUND**

| Finding | File | Violation | Severity |
|---|---|---|---|
| 7 ungated `console.error` in DAL | `dal/reports.dal.js` lines 46, 102, 151, 182, 225, 246, 267 | Production `console.error` calls are not DEV-gated. Logs sensitive moderation data (actor IDs, report IDs, insert objects) in production browser console on Supabase errors. Policy: no `console.log`/`console.error` in any file. | MODERATE |
| `types/moderation.js` — undocumented layer | `types/moderation.js` | A `types/` subdirectory and file were added to the moderation feature. This is not a recognized VCSM architecture layer (DAL → Model → Controller → Hook → Screen). Not necessarily a violation, but the layer addition is undocumented and the constants file has zero consumers. | LOW |
| No `select('*')` violations | All DAL files | Confirmed. All use explicit column lists. | ALIGNED |
| Layer order compliance | All controllers and hooks | All cross-feature accesses go through adapters. DAL → Model → Controller → Hook chain maintained. | ALIGNED |

---

### Session-Summary Structure

**Status: ISSUE** _(carried from prior runs — unchanged)_

| Check | Status | Detail |
|---|---|---|
| `2026-05` month folder | MISSING | No session summary folder for current month (May 2026). |
| `2026-04_month_summary.md` | PRESENT | April 2026 month summary exists in `2026-04/`. |
| Orphaned session files at root | NONE | No misplaced files. |
| Command count | DRIFT | 23 `.md` files in `.claude/commands/`. CLAUDE.md lists 17. 6 undocumented: `AvengersAssemble`, `Cerebro`, `SHIELD`, `Sentry`, `WinterSoldier`, `listofcomand.v2`. |

---

### Proposed Updates

| Update | Target | Action Required |
|---|---|---|
| Add `types/moderation.js` to Architecture Pipeline | Architecture Pipeline section | Add a `Types` row listing `types/moderation.js`. Note zero consumers and flag as scaffolded for future use or candidate for deletion. |
| Add Change Log entry for `8baf6d5` | Change Log section | Document the three security changes: (1) `assertModerationAccess.dal.js` rewrite from table query to RPC, (2) `reports.dal.js` skip-flag and `isRlsDenied` removal, (3) `moderationActions.controller.js` import redirect. |
| Add `actorId` decorative note to `isModerationAuthorizedDAL` | DAL Files section | Add a behavioral note: the `actorId` parameter is accepted but not passed to the RPC. Authorization resolves via `auth.uid()` in the database session. |
| Add `console.error` to Risk Findings and Pending Reviews | Risk Findings, Pending Reviews | Flag 7 ungated `console.error` calls in `reports.dal.js` as a policy violation requiring removal. |

All proposed changes are additive documentation corrections. No `.v2.md` required. User approval needed before edits are applied.

---

### Overall Status

**DRIFT FOUND**

| Area | Status | Blocking |
|---|---|---|
| Architecture | DRIFT — `types/moderation.js` undocumented, two DAL rewrites absent from Change Log | No |
| Security / Trust | DRIFT — `actorId` decorative behavior undocumented, RLS bypass removal unrecorded, 7 ungated `console.error` in production DAL | CAUTION — sensitive data logged on error |
| Documentation Truth | DRIFT — new file, change log gaps, behavioral subtlety undocumented | No |
| Contract Compliance | VIOLATIONS — 7 ungated `console.error` in DAL | No — medium severity |
| Session Structure | ISSUE — May 2026 folder missing, 6 commands undocumented | No |

---

### Recommended Next Command

| Priority | Command | Reason |
|---|---|---|
| 1 | **VENOM** | Formally review the `actorId` decorative parameter in `isModerationAuthorizedDAL`. Confirm that all callers pass the correct session actor and that no privilege escalation path exists where a caller passes a privileged `actorId` while holding a different session. Also confirm the `skipReportEventsInsertForSession` removal does not introduce any new failure modes in production. |
| 2 | **SENTRY** | Remove 7 ungated `console.error` calls from `reports.dal.js`. All are error-path only — replace with DEV-gated warnings or remove entirely. Sensitive moderation data (actor IDs, report IDs) should not reach the browser console in production. |
| 3 | **IRONMAN** | Determine the fate of `types/moderation.js` — is it scaffolded for future enum use, or should it be wired now to `report.controller.js` and `report.model.js` as the canonical type source? Also confirm deletion disposition of the 3 dead adapters and the 5 dead DAL functions. |
| 4 | **LOKI** | Confirm the `insertReportEventRow` return shape change (`skipped` field removed) has no downstream consumers checking `.skipped` in the production report flow. Diagnostics files check `.skipped` but those are dev-only; confirm no production path relied on it. |

---

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/moderation/dal/reports.dal.js` | DEV-gated moderation DAL error logging through `logModerationDalError` so sensitive report/action payloads are not logged in production. |
| `apps/VCSM/src/features/moderation/dal/reports.read.dal.js` | DEV-gated report read DAL error logging through `logModerationDalError`. |
| `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js` | Added a scoped comment documenting that `actorId` is retained for the controller contract while authorization resolves from `auth.uid()` server-side. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.moderation.md` | Appended this fix-pass record. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| 7 ungated `console.error` calls in `reports.dal.js` | DONE | Replaced direct production logging with a DEV-gated helper. Error return behavior is unchanged. |
| Additional ungated `console.error` calls in `reports.read.dal.js` | DONE | DEV-gated both adjacent report-read DAL logs found during verification. |
| `isModerationAuthorizedDAL(actorId)` actorId decorative behavior undocumented | DOCUMENTED IN CODE | Added a short DAL comment explaining authorization resolves from `auth.uid()` through the RPC. |
| `types/moderation.js` undocumented and zero consumers | DOCUMENTED | Verified file exists and is unconsumed; no deletion or wiring performed without IRONMAN. |
| Dead controllers / dead adapters / dead DAL functions | DEFERRED | No deletion performed under current no-delete instruction; still requires IRONMAN and VENOM. |
| `moderationActions.dal.js` false-positive dead-code correction | VERIFIED | Verified live imports from comment/post/conversation controllers remain. |

### Verification
- Commands/searches run:
  - `rg -n "console\.error|logModerationDalError|isModerationAuthorizedDAL|auth\.uid|REPORT_OBJECT_TYPES|ReportedObjectCover\.adapter|useCommentVisibility\.adapter|usePostVisibility\.adapter" apps/VCSM/src/features/moderation --glob '*.js' --glob '*.jsx'`
  - `rg -n "hideReportedObjectController|dismissReportController|insertModerationActionDAL|listModerationActionsForActorOnObjectsDAL|dalGetConversationHideAction|dalDeleteConversationHideAction|getReportRowById" apps/VCSM/src/features/moderation apps/VCSM/src/features/chat apps/VCSM/src/features/feed --glob '*.js' --glob '*.jsx'`
  - `sed -n '1,320p' apps/VCSM/src/features/moderation/dal/reports.dal.js`
  - `sed -n '1,120p' apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js`
  - `npm run build`
- Production callers checked:
  - `apps/VCSM/src/features/moderation/controllers/report.controller.js`
  - `apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js`
  - `apps/VCSM/src/features/moderation/controllers/postVisibility.controller.js`
  - `apps/VCSM/src/features/moderation/controllers/commentVisibility.controller.js`
  - `apps/VCSM/src/features/moderation/controllers/getConversationCoverStatus.controller.js`
  - `apps/VCSM/src/features/moderation/controllers/undoConversationCover.controller.js`
  - `apps/VCSM/src/features/chat/conversation/screen/ConversationView.jsx`
  - `apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx`
- Remaining risks:
  - Dead controllers, adapters, and DAL functions remain intentionally untouched pending IRONMAN and VENOM.
  - `types/moderation.js` remains unconsumed pending IRONMAN.
  - Formal VENOM review remains needed for the authorization RPC semantics and moderation enforcement surfaces.
  - Build passes; Vite still reports the pre-existing auth adapter dynamic/static import chunk warning for `VerifyEmailRequiredScreen.jsx`.

### Status
PARTIAL
