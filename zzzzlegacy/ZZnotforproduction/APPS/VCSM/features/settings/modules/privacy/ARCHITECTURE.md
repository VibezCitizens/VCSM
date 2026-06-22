---
title: Privacy Module — Architecture
status: STUB
feature: settings
module: privacy
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / privacy — ARCHITECTURE

## Block/Unblock Path

```
ctrlBlockActor / ctrlUnblockActor(callerActorId string-equality check) ← BW-SETTINGS-002
  └── blocks.dal.js → moderation RPC
        └── p_blocker_actor_id = client-supplied actorId ← VEN-SETTINGS-004
              └── RPC auth.uid() binding UNVERIFIABLE from source ← BW-SETTINGS-007
```

## Privacy Setting Path

```
ctrlSetActorPrivacy → dalSetActorPrivacy
  └── vc.actors UPSERT
        └── actor_id = caller-supplied ← VEN-SETTINGS-005 / BW-SETTINGS-005 PARTIAL
              └── RLS is sole ownership backstop
```

## Block Idempotency

```
ctrlBlockActor → existingBlockedIds check (conditional)
  └── RPC must handle duplicates independently ← BW-SETTINGS-009
```

## TODO

- [ ] Confirm moderation RPC name + auth.uid() binding in RPC body
