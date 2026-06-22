---
title: Friends Module — Index
status: STUB
feature: profiles
module: friends
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / friends

Top friend ranking — read, hydrate, and save friend rank lists. IDOR vulnerability on write path.

## Source Files

| File | Layer |
|---|---|
| controller/friends/getFriendLists.controller.js | controller |
| controller/friends/getTopFriendActorIds.controller.js | controller |
| controller/friends/getTopFriendCandidates.controller.js | controller |
| controller/friends/hydrateActorsIntoStore.controller.js | controller |
| controller/friends/saveTopFriendRanks.controller.js | controller |
| dal/friends/friendRanks.reconcile.dal.js | write DAL |
| dal/friends/friendRanks.write.dal.js | write DAL |
| dal/friends/friends.read.dal.js | read DAL |
| model/friends/ | model |
| adapters/kinds/vport/* (friend-related) | adapters |
| hooks/useSaveTopFriendRanks (UNVERIFIED location) | hook |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — FRIENDS-SEC-001 (CRITICAL), FRIENDS-SEC-002 (HIGH)
