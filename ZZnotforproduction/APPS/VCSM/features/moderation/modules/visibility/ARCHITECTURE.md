---
title: Visibility Module — Architecture
status: STUB
feature: moderation
module: visibility
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / visibility — ARCHITECTURE

## assertModerationAccess Gate

```
assertModerationAccessController(actorId)
  └── isModerationAuthorizedDAL()
        └── moderation.* SELECT (role check)
              NOTE: actorId parameter accepted but IGNORED by DAL ← BW-MOD-007
```

## Moderator Hide Path

```
moderationActions.controller
  └── assertModerationAccessController (gate)
        └── [gate passes]
              ├── hidePostRow (exported DAL — no own auth guard) ← VEN-MODERATION-003
              │     └── moderation.* UPDATE — RLS UNVERIFIED
              └── hideMessageRow (exported DAL — no own auth guard) ← VEN-MODERATION-003
                    └── moderation.* UPDATE — RLS UNVERIFIED
```

## Status Update Path

```
moderationActions.controller
  └── updateReportRowStatus
        └── reports.dal → moderation.reports UPDATE
              ├── .eq('id', reportId) ONLY — no ownership filter ← VEN-MODERATION-004 / BW-MOD-003
              └── no status allowlist ← BW-MOD-004
```

## Personal Hide Path

```
useHidePostForActor / usePostVisibility / useCommentVisibility
  └── postVisibility.controller / commentVisibility.controller
        └── moderationActions.dal → moderation.actions INSERT
              ├── actor_id = caller-supplied ← VEN-MODERATION-002 / BW-MOD-001 CRITICAL
              └── no actor kind check ← BW-MOD-005 BYPASSED
```

## Visibility Read Path

```
usePostVisibility → moderation query → ReportedObjectCover | ReportCoverScreen
useCommentVisibility → moderation query → hidden comment UI
```

## TODO

- [ ] Trace isModerationAuthorizedDAL actual role check query
- [ ] Confirm hidePostRow / hideMessageRow export scope (module vs direct import)
