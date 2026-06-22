# DASHBOARD_DOC_SYNC_REPORT

**Ticket:** TICKET-0004 / LOGAN-DASHBOARD-SYNC-001
**Phase:** 6 — Documentation Synchronization
**Produced:** 2026-06-02
**Status:** Documentation audit only — no production code changes

---

## Scope

Documents audited:
- `vport-dashboard-code-quality-audit.md` (produced 2026-06-02, this sprint)
- `vport-dashboard-governance-matrix.md`
- `vport-dashboard-card-registry.md`
- `deferred-open-items.md`
- `pending-full-audits.md`
- `modules/[26 modules]/audit-status.md`
- All module `findings.md` files
- Selected `security.md` and `release-status.md` files
- Sprint artifacts produced in TICKET-0004 (this session)

---

## 1. Stale Files

### 1-A — `modules/settings/findings.md` (STALE)

**Issue:** Findings ELEK-003, ELEK-004, ELEK-005 are listed as OPEN.
Governance matrix (line 49) states: "ELEK-003/004/005 verified already resolved in code (findings.md was stale)."

The module-level `findings.md` was not updated when the governance matrix was updated.

**Impact:** Developers reading `settings/findings.md` see three open security findings that
are actually closed. Incorrect risk perception — overstates the settings card security work remaining.

**Resolution Required:** Update `modules/settings/findings.md` to mark ELEK-003, ELEK-004,
ELEK-005 as RESOLVED with timestamp and resolution note.

---

### 1-B — `deferred-open-items.md` (INCOMPLETE — 15+ Items Missing)

**Issue:** The file tracks only 9 DEFER entries (DEFER-001 through DEFER-009).
Governance matrix references additional deferred/non-blocking items that have no corresponding
DEFER entry:

| Item | Module | Status in Matrix | Missing from Deferred List |
|---|---|---|---|
| ELEK-027 (barber resource_type) | barber | Resolved 2026-06-01 | YES |
| ELEK-060–063 (availability RLS) | availability | Resolved 2026-06-01 | YES |
| K-BLK-001 (locksmith cache) | locksmith | Cache Optimization Sprint | YES |
| BW-SUB-003 (subscribers kind bypass) | subscribers | BLOCKED | YES — blocking, not deferred |
| VENOM-TEAM-004/007/008 | team | DEFERRED | YES |
| VENOM-SETTINGS-001 (DAL export) | settings | OPEN | YES — needs DEFER or sprint |
| VENOM-SETTINGS-003 | settings | OPEN | YES |
| VENOM-SETTINGS-004 | settings | OPEN | YES |
| ELEK-001/002 (settings controllers) | settings | OPEN | YES — SPIDER-MAN task |

**Impact:** Deferred-open-items is the canonical backlog for non-blocking architecture debt.
An incomplete list means debt items fall off the radar without sprint assignment.

**Resolution Required:** Audit all module `findings.md` files for OPEN/DEFERRED items and
add missing entries to `deferred-open-items.md` with sprint assignments.

---

### 1-C — `vport-dashboard-card-registry.md` — Registry vs Docs Gap

**Issue:** Registry lists some modules as having `SECURITY_REVIEW_PENDING` but corresponding
module-level documentation (security.md, findings.md) exists and is populated.

**Impact:** The registry is used as a status dashboard. If it shows pending where docs are
complete, sprint planning will schedule work that has already been done.

**Resolution Required:** Run a pass aligning `card-registry.md` status columns against
actual file state in each `modules/[name]/` directory.

---

## 2. Contradictions

### 2-A — Gas Card: ARCHITECT = COMPLETE vs Code Audit (CRITICAL CONTRADICTION)

**Governance matrix** (line 34): `gas | ARCHITECT — COMPLETE`

**Code quality audit** (produced 2026-06-02, same day as this document):
- `submitFuelPriceSuggestion.controller.js` documented as 177 lines — "two controllers
  masquerading as one"
- Classified as NEEDS_REFACTOR with "1–2 days" estimated refactor effort
- Risk #2: HIGH

**Contradiction:** ARCHITECT is marked COMPLETE on a module the code quality audit classifies
as NEEDS_REFACTOR with a specific architectural violation (oversized controller).

**Explanation (likely):** The ARCHITECT pass for gas was completed before the code quality
audit. The ARCHITECT scope may have covered module boundaries (no cross-card imports) and
layer compliance, but did not flag the controller size/responsibility violation.

**Resolution Required:** Update governance matrix gas row to reflect the code quality audit
finding. Add DEFER entry or sprint assignment for the controller split. Do not leave
ARCHITECT = COMPLETE when a structural finding is unaddressed.

---

### 2-B — Schedule: RELEASED in Production with CRITICAL Architecture Violation

**Governance matrix:** Schedule card has RELEASED status.

**Code quality audit** (2026-06-02): Risk #1 CRITICAL — schedule card directly imports
booking controller files via internal path.

**Governance matrix** (schedule row): `ARCHITECT — NOT_STARTED`

**Contradiction:** A module in production with a CRITICAL architecture violation has never
had an ARCHITECT audit run on it. The module boundary contract violation (cross-card
controller import) is not tracked in any deferred item.

**Resolution Required:**
1. Add a DEFER entry for schedule cross-card import violation (CRITICAL, P0)
2. Run ARCHITECT on schedule card as part of TICKET-0004 remediation sprint
3. The `SCHEDULE_DEPENDENCY_MAP.md` produced in this sprint serves as the ARCHITECT
   pre-analysis for that run

---

### 2-C — BLOCKED Modules vs RELEASED Status

**Issue:** Governance matrix "Notes" column for several modules references BLOCKED findings,
but the matrix table itself does not have a BLOCKED status column — only THOR status
(WATCH/NOT_STARTED), which creates false assurance.

Modules with documented BLOCKED/HIGH open findings but RELEASED production status:

| Module | Finding | Severity | Blocking? |
|---|---|---|---|
| subscribers | BW-SUB-003 (kind bypass) | HIGH | YES |
| delete-lifecycle | 2 HIGH confirmed via testing | HIGH | YES |
| tripoint | 2 HIGH + 2 MEDIUM BYPASSED | HIGH | YES |
| content-pages | BW-CONTENT-001/002/004 BYPASSED | HIGH | YES |
| external-site | CORS, email abuse, listUsers O(n) | HIGH | YES |

**Impact:** The governance matrix is the authoritative release gate tracker. If BLOCKED
findings are in the Notes column but not a structured status field, sprint planning and
release management cannot rely on the matrix to catch blocked modules.

**Resolution Required:** Add a `RELEASE_GATE` column to the governance matrix with values:
`CLEAR | WATCH | BLOCKED`. Populate it for all 26 modules.

---

## 3. Missing Architecture Findings

### 3-A — Portfolio: No DEFER Entry for God Component

**Code quality audit** (Risk #3, HIGH): `PortfolioItemForm.jsx` is 292 lines — god component.
**Code quality audit** (Risk #6, MEDIUM): Hooks nested inside component subfolder.

**`deferred-open-items.md`:** No DEFER entry for either finding.
**`modules/portfolio/audit-status.md`:** `ARCHITECT — PARTIAL` (correctly flagged as partial).
**Governance matrix:** Portfolio ARCHITECT = PARTIAL.

**Gap:** The specific architectural violations (god component, hook misplacement) are
documented in the code quality audit but are not tracked as actionable deferred items.
Without a DEFER entry, there is no sprint assignment and no clear owner.

**Resolution Required:**
- DEFER-010: `PortfolioItemForm.jsx` split (god component, 292 lines) — P1 with ARCHITECT sprint
- DEFER-011: Hooks misplaced in `components/portfolio/hooks/` — P1, same sprint

The `PORTFOLIO_SPLIT_PLAN.md` produced in this sprint serves as the implementation plan
for both DEFER entries.

---

### 3-B — Settings: No DEFER Entry for Domain Fragmentation

**Code quality audit** (Risk #8, MEDIUM): Settings domain fragmented across 5+ features;
10+ imports in screen.

**`deferred-open-items.md`:** No DEFER entry.
**Governance matrix:** Settings ARCHITECT = NOT_STARTED.

**Gap:** The settings fragmentation is documented but not tracked as a refactor target.
The `SETTINGS_DEPENDENCY_MAP.md` produced in this sprint provides the full map needed
to create this entry.

**Resolution Required:**
- DEFER-012: Settings domain consolidation — `settingsCoordinator.controller.js` creation,
  reduce screen import surface, merge validation to model/controller — P1

---

### 3-C — Schedule: Critical Violation Has No DEFER Entry

**Code quality audit** (Risk #1, CRITICAL): Schedule card imports booking controllers
via internal path.

**`deferred-open-items.md`:** No DEFER entry.

**Gap:** This is the highest-severity finding in the entire dashboard audit. It has no
deferred item, no sprint assignment, and the ARCHITECT command has never run on this module.

**Resolution Required:**
- DEFER-013: Schedule cross-card import violation — P0 — ARCHITECT + implementation sprint
  The `SCHEDULE_DEPENDENCY_MAP.md` produced in this sprint is the complete implementation plan.

---

## 4. Missing Debt Tracking

### Open Findings Without Sprint Assignment

| Finding | Module | Severity | Current Status | Sprint Needed |
|---|---|---|---|---|
| DEFER-013 (schedule cross-card import) | schedule | CRITICAL | NOT IN LIST | Immediate P0 |
| DEFER-010 (portfolio god component) | portfolio | HIGH | NOT IN LIST | P1 sprint |
| DEFER-011 (portfolio hooks misplaced) | portfolio | MEDIUM | NOT IN LIST | P1 sprint |
| DEFER-012 (settings fragmentation) | settings | MEDIUM | NOT IN LIST | P1 sprint |
| VENOM-SETTINGS-001 (DAL export) | settings | HIGH | OPEN / no sprint | P1 security sprint |
| ELEK-001/002 (controller ownership gaps) | settings | HIGH | OPEN / SPIDER-MAN | P1 security sprint |
| ELEK-004 (dalSetActorPrivacy session binding) | settings | HIGH | OPEN / DB | P1 DB sprint |
| BW-SUB-003 (subscribers kind bypass) | subscribers | HIGH | BLOCKED | Blocking sprint |
| Gas controller split | gas | HIGH | NOT IN LIST | P2 sprint |
| Gas FuelPriceCacheService | gas | MEDIUM | NOT IN LIST | P2 sprint |
| DEFER-004 (gas screen split) | gas | MEDIUM | IN LIST | S2 structural sprint |

---

## 5. Recommended Deferred Item Additions

The following DEFER entries should be added to `deferred-open-items.md` as a result of
this sprint's planning work:

```
DEFER-010
Module: portfolio
Finding: PortfolioItemForm.jsx is 292 lines — god component
Priority: P1
Sprint: ARCHITECT + implementation sprint
Plan: PORTFOLIO_SPLIT_PLAN.md (TICKET-0004)

DEFER-011
Module: portfolio
Finding: Hooks misplaced inside components/portfolio/hooks/ (violates architecture contract)
Priority: P1
Sprint: Same as DEFER-010 (combined portfolio refactor)
Plan: PORTFOLIO_SPLIT_PLAN.md (TICKET-0004)

DEFER-012
Module: settings
Finding: Settings domain fragmented across 5+ features; 10+ imports in screen
Priority: P1
Sprint: ARCHITECT + implementation sprint
Plan: SETTINGS_DEPENDENCY_MAP.md (TICKET-0004)

DEFER-013
Module: schedule
Finding: useVportOwnerSchedule imports booking controllers via internal path (CRITICAL)
Priority: P0
Sprint: Immediate — block any booking controller rename/split until resolved
Plan: SCHEDULE_DEPENDENCY_MAP.md (TICKET-0004)
Dependency: Coordinate with TICKET-BOOKING-RPC-001
```

---

## 6. Sprint Artifacts → Governance Linkage

The 6 planning artifacts produced in TICKET-0004 map to governance updates as follows:

| Artifact | Governance Update Required |
|---|---|
| `SCHEDULE_DEPENDENCY_MAP.md` | Add DEFER-013 to deferred-open-items; mark ARCHITECT = IN_PROGRESS for schedule |
| `SETTINGS_DEPENDENCY_MAP.md` | Add DEFER-012 to deferred-open-items; update ARCHITECT = IN_PROGRESS for settings |
| `PORTFOLIO_SPLIT_PLAN.md` | Add DEFER-010/011 to deferred-open-items; update ARCHITECT = PARTIAL → IN_PROGRESS |
| `SETTINGS_SECURITY_ARCHITECTURE.md` | Update modules/settings/findings.md with ELEK-003/004/005 RESOLVED; document ELEK-001/002/004 sprint assignment |
| `GAS_COMPLEXITY_REPORT.md` | Add gas controller split + FuelPriceCacheService to deferred; note ARCHITECT contradiction |
| `DASHBOARD_DOC_SYNC_REPORT.md` (this doc) | Add RELEASE_GATE column to governance matrix; add 4 new DEFER entries |

---

## Summary

| Category | Count |
|---|---|
| Stale files requiring update | 3 |
| Contradictions identified | 3 |
| Missing architecture findings (not tracked) | 4 |
| Missing deferred item entries | 10+ |
| New DEFER entries required (P0–P2) | 4 (DEFER-010 through DEFER-013) |
| Governance matrix structural gap | 1 (RELEASE_GATE column missing) |

**Highest priority sync action:** Add DEFER-013 (schedule cross-card import — CRITICAL) to
the deferred list and assign it to the P0 implementation sprint before any booking
controller work begins.
