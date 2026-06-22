---
title: Briefings Module — Architecture
status: STUB
feature: professional
module: briefings
source: venom+bw-derived
created: 2026-06-05
---

# professional / modules / briefings — ARCHITECTURE

## Read Path

```
useProfessionalBriefings → ctrlListProfessionalBriefings(actorId)
  └── dalListProfessionalBriefings(actorId)
        └── vc.notifications SELECT WHERE actor_id = actorId
              └── actorId from parameter (no session verify) ← VEN-PROFESSIONAL-003
                    └── RLS UNVERIFIED ← BW-PROF-003 (compliance domain)
```

## Mark Seen Path

```
[briefing item tapped] → ctrlMarkProfessionalBriefingsSeen(actorId, ids)
  └── dalMarkProfessionalBriefingsSeen(actorId, ids)
        └── vc.notifications UPDATE WHERE id IN ids AND actor_id = actorId
              └── actorId from parameter (no session verify) ← VEN-PROFESSIONAL-002
                    └── RLS UNVERIFIED ← BW-PROF-003
```

## linkPath Navigation (Open Redirect Risk)

```
BriefingsList → item.linkPath → navigate(item.linkPath)
  └── linkPath from DB — unsanitized ← VEN-PROFESSIONAL-004 / BW-PROF-006
```

## Null Handling Inconsistency

```
ctrlListProfessionalBriefings(null actorId) → throws
ctrlMarkProfessionalBriefingsSeen(null actorId) → silently returns ← BW-PROF-004
```

## TODO

- [ ] Confirm vc.notifications table RLS policies (SELECT + UPDATE)
