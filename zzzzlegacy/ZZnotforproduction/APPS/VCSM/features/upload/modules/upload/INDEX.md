---
title: Upload Module — Index
status: STUB
feature: upload
module: upload
source: venom+bw-derived
created: 2026-06-05
---

# upload / modules / upload

Post creation and media upload. createPostController and related DALs are the primary write surface. Multiple THOR blockers.

## Source Directories

| Directory | Content |
|---|---|
| controllers/createPost.controller.js | post INSERT |
| controller/recordPostMedia.controller.js | media record write |
| controller/searchMentionSuggestions.controller.js | mention autocomplete |
| dal/ | post DALs (deletePostByIdDAL, updatePostMediaAssetIdDAL, filterValidActorIds, etc.) |
| api/ | createSystemPost adapter |
| hooks/ | upload hooks |
| lib/ | upload utilities |
| model/ | post model |
| screens/ | upload screens |
| ui/ | upload UI |
| styles/ | upload styles |
| adapters/ui/ | upload adapters |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — UPLOAD-SEC-001 (HIGH), UPLOAD-SEC-002 (HIGH), UPLOAD-SEC-003 (HIGH), UPLOAD-SEC-004 (HIGH)
