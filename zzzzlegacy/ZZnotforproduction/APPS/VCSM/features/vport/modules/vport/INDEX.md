---
title: Vport Module — Index
status: STUB
feature: vport
module: vport
source: venom+bw-derived
created: 2026-06-05
---

# vport / modules / vport

VPORT lifecycle — create, update, soft delete, restore, media asset update. Lifecycle-critical feature; RLS is sole ownership barrier for several write paths.

## Source Directories

| Directory | Content |
|---|---|
| controller/ | vportCoreOps.controller.js (zero-logic DAL bridge), vport lifecycle controllers |
| dal/ | vport.core.dal.js (updateVport, media asset updates), dal helpers |
| adapters/ | vport adapters |
| components/ | vport UI components |
| hooks/ | vport hooks |
| model/ | vport model |
| public/ | public vport helpers |
| screens/ | vport screens |
| utils/ | vport utilities |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**CONDITIONAL THOR RELEASE BLOCKER** — VPORT-SEC-001, VPORT-SEC-002 become hard blockers if DB confirms vport.profiles RLS UPDATE policy is absent.
