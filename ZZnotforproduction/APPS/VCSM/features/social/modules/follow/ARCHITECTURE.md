---
title: Follow Module — Architecture
status: STUB
feature: social
module: follow
source: venom+bw-derived
created: 2026-06-05
---

# social / modules / follow — ARCHITECTURE

## Follow Insert Path

```
useSubscribeAction(followerActorId from prop) ← BW-SOCIAL-003
  └── ctrlInsertFollow / dalInsertFollow → vc.actor_follows INSERT
        └── actor_id = caller-supplied
              └── RLS UNVERIFIED ← BW-SOCIAL-006
```

## Follow Request Path (IDOR)

```
ctrlSendFollowRequest(requesterActorId)
  ├── NO assertingActorId gate ← VEN-SOCIAL-002 / BW-SOCIAL-001 BYPASSED CRITICAL
  └── dalInsertFollowRequest → vc.social_follow_requests INSERT
        └── RLS UNVERIFIED ← VEN-SOCIAL-001
```

## Follow Request Read Path

```
ctrlListIncomingRequests — V-SUB-003 regression status unclear, tests WILL FAIL ← VEN-SOCIAL-001
```

## Deactivate Follow Path

```
dalDeactivateFollow → vc.actor_follows UPDATE is_active=false
  └── No is_active precondition ← BW-SOCIAL-008
```

## TODO

- [ ] Confirm vc.actor_follows RLS policy (INSERT, UPDATE)
- [ ] Confirm vc.social_follow_requests RLS
