# Architecture — dashboard/modules/leads

ARCHITECT Last Run: 2026-06-04
Architecture State: STABLE

---

## Module Identity

| Field | Value |
|---|---|
| Module | leads |
| Parent Feature | dashboard |
| Category Key | dashboard-leads |
| Module Type | Dashboard card module |
| App | VCSM |
| Source Root | apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/ |
| Independence | MOSTLY INDEPENDENT |

---

## Purpose

Owner-only PII management module. Lets a VPORT owner view, mark-contacted, and delete business card scan leads. Access is intentionally restricted to the VPORT owner — no delegation to team members or staff by design (documented in controller: BW-008).

---

## Layer Map

```
DAL (read)
  vportLeads.read.dal.js
    readVportBusinessCardLeadsByProfileDAL(profileId, { limit })
    readNewLeadsCountByProfileDAL(profileId)

DAL (write)
  vportLeads.write.dal.js
    markVportBusinessCardLeadContactedDAL({ profileId, leadId, source })
    deleteVportBusinessCardLeadDAL({ profileId, leadId })

Model
  vportLead.model.js          → normalizeVportLead(row) — domain shape
  vportLead.display.model.js  → formatLeadDate, formatSourceLabel, previewMessage

Controller
  vportLeads.controller.js
    listVportLeadsController(actorId, { limit }, callerActorId)
    markVportLeadContactedController(actorId, { leadId, source }, callerActorId)
    countNewVportLeadsController(actorId, callerActorId)
    fastCountNewVportLeadsController(actorId, callerActorId, profileId)
    deleteVportLeadController(actorId, { leadId }, callerActorId)
  → All 5 ops: assertActorOwnsVportActorController BEFORE any DAL call

Hook
  useVportLeads(actorId)
    → list, markContacted, deleteLead actions
    → sessionActorId from useIdentity()
  useVportNewLeadsCount(actorId)
    → count badge with 60s polling
    → fastCount fast-path caches profileId in ref

Screen
  VportDashboardLeadsScreen.jsx    — main owner screen
  VportDashboardLeadsFinalScreen.jsx — alternate/final state
  VportDashboardLeadsView.jsx      — view component

Barrel
  index.js — exports models, hooks, screens only (DAL/controller excluded — Rule 9 ✓)
```

---

## Routes

| Path | Access | Handler |
|---|---|---|
| `/actor/:actorId/dashboard/leads` | protected | VportDashboardLeadsScreen (lazy) |
| `/vport/:actorId/dashboard/leads` | protected | Redirect → `/actor/:actorId/dashboard/leads` |

---

## Database Tables

| Table | Schema | Operations | Scope |
|---|---|---|---|
| business_card_leads | vport | SELECT, UPDATE (source field), DELETE | Always scoped by `vport_profile_id` |

---

## Authorization

All controller operations require `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` before any DAL call. Access policy is OWNER ONLY — no delegation to team members or managers.

Write DALs additionally scope by `profileId` AND `leadId` for defense-in-depth.

---

## Dependencies

| Dependency | Type | Boundary |
|---|---|---|
| `@/features/booking/adapters/booking.adapter` | feature | APPROVED — through adapter |
| `@/features/dashboard/vport/dal/read/vportProfile.read.dal` | feature | PARTIAL — direct DAL import (accepted dashboard card pattern) |
| `@/state/identity/identityContext` | service | APPROVED |
| `@/shared/lib/text` | shared | APPROVED |

---

## Write Surfaces (module-owned)

| Operation | Table | Function | Scope |
|---|---|---|---|
| UPDATE | business_card_leads | markVportBusinessCardLeadContactedDAL | profileId + leadId |
| DELETE | business_card_leads | deleteVportBusinessCardLeadDAL | profileId + leadId |

Note: Scanner also found RPC/edge function surfaces for lead creation and email confirmation — those belong to the public business card submission flow, not this dashboard module.

---

## Architecture Findings

| ID | Severity | Description |
|---|---|---|
| ARC-LEADS-001 | LOW | Cross-module DAL import from parent dashboard/vport — accepted pattern |
| ARC-LEADS-002 | MEDIUM | 60s polling fires ownership-gated DB call every cycle — route to KRAVEN |

---

## Tests

| File | Coverage |
|---|---|
| __tests__/vportLeads.controller.test.js | Ownership gate on all 5 controller ops |
| __tests__/leads.index.rule9.test.js | Rule 9 barrel boundary |

Missing: hook-level tests for useVportLeads and useVportNewLeadsCount.

---

## Spaghetti Score: CLEAN

Clear layer separation. No circular dependencies. Rule 9 compliant. Ownership gate consistent.
