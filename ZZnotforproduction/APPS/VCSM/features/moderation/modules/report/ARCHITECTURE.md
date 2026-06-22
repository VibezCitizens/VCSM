---
title: Report Module — Architecture
status: STUB
feature: moderation
module: report
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / report — ARCHITECTURE

## Layer Stack

```
[consuming feature — post, chat, explore]
  └── ReportModal.adapter.js / useReportFlow.adapter.js
        └── useReportFlow.js
              └── report.controller.js
                    ├── dedupeKey check (caller-supplied, not server-enforced)
                    ├── reporter_actor_id (from prop — no session binding) ← CRITICAL
                    ├── reasonCode validation (NOT performed) ← BW-MOD-004
                    └── reports.dal.js → moderation.reports INSERT
                          └── RLS (UNVERIFIED for INSERT)
```

## Read Path

```
reports.read.dal.js → moderation.reports SELECT
  └── RLS (UNVERIFIED — no moderator scope confirmed)
```

## Model Layer

```
report.model.js — maps DAL row → domain object
  └── columns defined in reports.dal.columns.js
```

## console.warn Leak

```
report.controller.js:113 → console.warn (internal state in production) ← VEN-MODERATION-006
```

## TODO

- [ ] Confirm RLS policies on moderation.reports INSERT and SELECT
- [ ] Trace exact prop chain: component prop → useReportFlow → controller → reporter_actor_id
- [ ] Confirm REPORT_REASONS constant location (types/moderation.js)
