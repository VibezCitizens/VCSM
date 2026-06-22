# MODULE ARCHITECTURE REPORT

**Module:** moderation
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Content Moderation & Reporting
**Primary Root:** `apps/VCSM/src/features/moderation/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns content moderation: report submission, post visibility (hide reported posts), comment visibility (hide reported comments), conversation cover (hide reported chat), moderation access assertion, and moderation action execution (dismiss, resolve, block from report). Exposed primarily via adapters to other features.

---

## ENTRY POINTS

No direct routing screens — all consumed via adapters.

---

## LAYER MAP

**DAL:**
- `assertModerationAccess.dal.js`
- `conversationCover.read.dal.js`, `conversationCover.write.dal.js`
- `moderationActions.dal.js`
- `reports.dal.js`, `reports.dal.columns.js`, `reports.read.dal.js`

**Controllers:**
- `assertModerationAccess.controller.js`
- `commentVisibility.controller.js`
- `getConversationCoverStatus.controller.js`
- `moderationActions.controller.js`
- `postVisibility.controller.js`
- `report.controller.js`
- `undoConversationCover.controller.js`

**Hooks:**
- `useCommentVisibility.js`
- `useConversationCover.js`
- `useHidePostForActor.js`
- `usePostVisibility.js`
- `useReportFlow.js`

**Model:** `report.model.js`
**Types:** `moderation.js` — moderation type constants

**Components:**
- `ChatSpamCover.jsx`
- `ReportCoverScreen.jsx`
- `ReportModal.jsx`
- `ReportThanksOverlay.jsx`
- `ReportedObjectCover.jsx`

**Adapters:**
- `moderation/adapters/components/ChatSpamCover.adapter.js`
- `adapters/components/ReportModal.adapter.js`
- `adapters/components/ReportThanksOverlay.adapter.js`
- `adapters/components/ReportedObjectCover.adapter.js`
- `adapters/hooks/useCommentVisibility.adapter.js`
- `adapters/hooks/useConversationCover.adapter.js`
- `adapters/hooks/useHidePostForActor.adapter.js`
- `adapters/hooks/usePostVisibility.adapter.js`
- `adapters/hooks/useReportFlow.adapter.js`

**Store:** None
**Engine Consumers:** None

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Moderation domain clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | All via adapters — correct | — |
| Controllers present/delegated | PASS | 7 controllers | — |
| DAL/repository present/delegated | PASS | 7 DAL files | — |
| Models/transformers present | PASS | report.model.js | — |
| Hooks/view models present | PASS | 5 hooks | — |
| Screens/components present | PARTIAL | 5 components, no screens | No moderator admin screen |
| Services/adapters present | PASS | 9 adapter exports | — |
| Database objects mapped | PARTIAL | moderation schema | — |
| Authorization path mapped | PARTIAL | assertModerationAccess.controller | Moderator role not fully documented |
| Cache/runtime behavior mapped | FAIL | Not documented | — |
| Error/loading/empty states mapped | FAIL | No screens | — |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | No engine deps | — |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Moderator role documentation | HIGH | Who can take moderation actions? | VENOM |
| Logan documentation | HIGH | No canonical moderation flow | LOGAN |
| Moderator admin screen | MEDIUM | Admin actions currently have no UI | IRONMAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- VENOM (security: moderator role access, assertModerationAccess coverage)
- LOGAN (documentation)
- IRONMAN (ownership: admin moderation UI)
