---
title: Menu Module — Index
status: STUB
feature: public
module: menu
source: venom+bw-derived
created: 2026-06-05
---

# public / modules / menu

Anonymous-facing VPORT public menu, QR access, and public reviews. Read-only surface resolved by slug.

## Source Files

| File | Layer |
|---|---|
| vportMenu/controller/getVportPublicDetails.controller.js | controller |
| vportMenu/controller/getVportPublicMenu.controller.js | controller |
| vportMenu/controller/getVportPublicReviews.controller.js | controller |
| vportMenu/controller/resolveMenuSlug.controller.js | controller |
| vportMenu/controller/resolveVportSlug.controller.js | controller |
| vportMenu/dal/readPublicVportReviewDimensions.dal.js | read DAL |
| vportMenu/dal/readPublicVportReviewSummary.dal.js | read DAL |
| vportMenu/dal/readPublicVportReviews.dal.js | read DAL |
| vportMenu/dal/readVportPublicDetails.rpc.dal.js | RPC DAL |
| vportMenu/dal/readVportPublicMenu.rpc.dal.js | RPC DAL |
| vportMenu/dal/resolveMenuSlug.dal.js | read DAL |
| vportMenu/dal/resolveVportSlug.dal.js | read DAL |
| vportMenu/hooks/* | hooks (6 files) |
| vportMenu/model/* | models (4 files) |
| vportMenu/screen/* | screens (7 files) |
| vportMenu/view/* | views (5 files) |
| vportMenu/adapters/vportMenu.adapter.js | adapter |
| screens/VportMenuRedirect.jsx | redirect screen |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

No dedicated THOR blockers scoped to menu. MENU-SEC-001 (MEDIUM): actor UUID in review model; MENU-SEC-002 (MEDIUM): lat/lng in directionsUrl.
