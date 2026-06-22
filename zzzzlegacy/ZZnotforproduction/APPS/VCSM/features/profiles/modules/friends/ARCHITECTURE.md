---
title: Friends Module — Architecture
status: STUB
feature: profiles
module: friends
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / friends — ARCHITECTURE

## Rank Write Path (IDOR)

```
[profile screen]
  └── useSaveTopFriendRanks(ownerActorId from external arg)
        ← ownerActorId derived from URL useParams() ← VEN-PROFILES-002
        └── saveTopFriendRanks.controller.js
              ← NO session binding on ownerActorId ← BW-PROF-001 BYPASSED CRITICAL
              └── friendRanks.write.dal + friendRanks.reconcile.dal
                    └── vc.actor_friend_ranks UPSERT/DELETE
```

## Rank Read Path

```
getTopFriendActorIds / getFriendLists / getTopFriendCandidates
  └── friends.read.dal → vc.actor_followers / vc.actor_friend_ranks SELECT
        └── hydrateActorsIntoStore.controller → hydration engine
```

## TODO

- [ ] Confirm vc.actor_friend_ranks RLS (UPDATE/DELETE)
- [ ] Confirm useParams usage in hook vs controller layer
