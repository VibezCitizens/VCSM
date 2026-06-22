---
title: Report Module — Index
status: STUB
feature: moderation
module: report
source: venom+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/moderation/controllers/report.controller.js
---

# moderation / modules / report

User-facing reporting flow. Handles submitting, deduplicating, and reading reports on content (posts, messages, actors). Exposes modal UI and "thanks" overlay.

## Module Summary

| Field | Value |
|---|---|
| Module | report |
| Feature | moderation |
| Source Path | apps/VCSM/src/features/moderation/{controllers,dal,hooks,components,adapters}/ |
| No dedicated route — modal overlay only |

## Source Files

| File | Layer |
|---|---|
| controllers/report.controller.js | controller |
| dal/reports.dal.js | write DAL |
| dal/reports.read.dal.js | read DAL |
| dal/reports.dal.columns.js | column constants |
| models/report.model.js | model |
| types/moderation.js | type constants |
| hooks/useReportFlow.js | hook |
| components/ReportModal.jsx | UI |
| components/ReportThanksOverlay.jsx | UI |
| adapters/hooks/useReportFlow.adapter.js | adapter |
| adapters/components/ReportModal.adapter.js | adapter |
| adapters/components/ReportThanksOverlay.adapter.js | adapter |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — REPORT-SEC-001 (CRITICAL), REPORT-SEC-002 (HIGH)
