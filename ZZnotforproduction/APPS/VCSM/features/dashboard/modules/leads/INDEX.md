# INDEX — dashboard/modules/leads

Status: ACTIVE
Last Updated: 2026-06-04
ARCHITECT Last Run: 2026-06-04 — STABLE

---

## Source Inventory (2026-06-04)

| Layer | Count | Files |
|---|---|---|
| controller | 1 | vportLeads.controller.js (5 ops) |
| dal | 2 | vportLeads.read.dal.js, vportLeads.write.dal.js |
| model | 2 | vportLead.model.js, vportLead.display.model.js |
| hook | 2 | useVportLeads.js, useVportNewLeadsCount.js |
| screen | 3 | VportDashboardLeadsScreen, VportDashboardLeadsFinalScreen, VportDashboardLeadsView |
| test | 2 | vportLeads.controller.test.js, leads.index.rule9.test.js |
| index | 1 | index.js (Rule 9 compliant) |

Mutation surfaces: 2 (UPDATE source, DELETE — both scoped by profileId + leadId)
Routes: 2 (/actor/:actorId/dashboard/leads + legacy redirect)
Engine dependencies: 0

---

## Governance Documents

| Document | Status | Last Updated |
|---|---|---|
| ARCHITECTURE.md | PRESENT | 2026-06-04 |
| CURRENT_STATUS.md | PRESENT | 2026-06-04 |
| BEHAVIOR.md | MISSING | — |
| SECURITY.md | MISSING | — |
| OWNERSHIP.md | MISSING | — |
| PERFORMANCE.md | MISSING | — |

---

## Outputs

| Date | Command | File |
|---|---|---|
| 2026-06-04 | ARCHITECT | outputs/2026/06/04/ARCHITECT/001_dashboard-leads_architect_leads-module-run.md |
