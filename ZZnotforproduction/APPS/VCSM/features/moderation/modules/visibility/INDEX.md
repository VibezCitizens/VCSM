---
title: Visibility Module — Index
status: STUB
feature: moderation
module: visibility
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / visibility

Content visibility and moderator action surface. Handles post/comment/message visibility for individual actors (personal hide) and moderator-level hide/unhide actions (global scope). Includes assertModerationAccess gatekeeper.

## Source Files

| File | Layer |
|---|---|
| controllers/assertModerationAccess.controller.js | auth gate |
| controllers/commentVisibility.controller.js | controller |
| controllers/postVisibility.controller.js | controller |
| controllers/moderationActions.controller.js | controller |
| dal/assertModerationAccess.dal.js | auth DAL |
| dal/moderationActions.dal.js | write DAL |
| hooks/useCommentVisibility.js | hook |
| hooks/usePostVisibility.js | hook |
| hooks/useHidePostForActor.js | hook |
| components/ReportedObjectCover.jsx | UI |
| components/ReportCoverScreen.jsx | UI |
| adapters/hooks/useCommentVisibility.adapter.js | adapter |
| adapters/hooks/usePostVisibility.adapter.js | adapter |
| adapters/hooks/useHidePostForActor.adapter.js | adapter |
| adapters/components/ReportedObjectCover.adapter.js | adapter |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — VIS-SEC-001 (HIGH), VIS-SEC-002 (HIGH), VIS-SEC-003 (HIGH)
