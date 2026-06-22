# Identity Execution Order

**Generated:** 2026-06-06
**Feature:** `apps/VCSM/src/features/identity/`
**Principle:** Least risky first, heaviest last. No source-code change until IDENTITY-012 is reviewed.

---

## Ordered Execution Table

| Step | Ticket | Weight | Risk | Why This Order | Required Validation Before Advancing |
|---|---|---|---|---|---|
| 1 | IDENTITY-001 | Light | ZERO | Must capture current state before making any claims about the system. Everything else builds on this. | identity feature files are read; 9 files confirmed; adapter surface confirmed. |
| 2 | IDENTITY-002 | Light | ZERO | actors vs identity boundary must be defined before IDENTITY-004 can audit consumers correctly. Without it, auditors won't know which feature a given import is targeting. | Written boundary definition exists; actors vs identity question answered in writing. |
| 3 | IDENTITY-003 | Light | ZERO | Adapter contract must exist before IDENTITY-004 can check compliance against it. Zero value in auditing 41 consumers against an unwritten contract. | `identity.adapter.js` and `identityOps.adapter.js` surfaces listed explicitly. |
| 4 | IDENTITY-004 | Light | ZERO | Full 41-consumer enumeration is the source of truth for all per-feature audits (IDENTITY-005 through IDENTITY-009). Cannot run per-feature audits without this map. | All 41 inbound consumers listed; adapter vs engine-alias path recorded per consumer. |
| 5 | IDENTITY-005 | Medium | LOW | Chat is the highest-complexity identity consumer (16 engine-alias + 8 feature-adapter). Auditing it before settings/notifications ensures the mixed-alias problem is fully understood before the policy decision in IDENTITY-010. | Chat's 16 `@identity` import sites listed; component-level mapping confirmed. |
| 6 | IDENTITY-006 | Medium | LOW | Settings is the highest fan-out feature (87 outbound). Its 8 identity imports are audit-only and low risk — good to complete before moving to higher-risk tickets. | All 8 settings identity import sites traced; adapter compliance confirmed. |
| 7 | IDENTITY-007 | Medium | LOW | Notifications is a contained 4-import case. Completing it alongside settings clears the easy consumer audits before the heavier profiles and auth boundaries. | All 4 notification identity import sites traced. |
| 8 | IDENTITY-008 | Medium | MEDIUM | Profiles is a 374-file feature with an indirect identity dependency (shell imports from profiles for canonical slug). Must be audited before the auth boundary because the profile identity relationship affects lifecycle ownership. | Identity import sites within profiles surface traced; shell→profiles→identity chain documented. |
| 9 | IDENTITY-009 | Medium | MEDIUM | Auth boundary is a lifecycle write relationship (creates actor rows), not just a read relationship. Must come after all consumer audits (1–8) so the ownership creation chain is understood in context of how identity is consumed downstream. | auth→identity lifecycle handoff documented; co-creation of ownership rows confirmed; 11 hooks with D-002 bug listed. |
| 10 | IDENTITY-010 | Medium | MEDIUM | Engine alias policy must come after IDENTITY-005 (chat audit) because the chat mixed pattern is the primary evidence. Cannot decide the canonical pattern without knowing exactly how chat uses both paths. | Policy decision written and recorded; one canonical pattern defined. |
| 11 | IDENTITY-011 | Medium-Heavy | MEDIUM | Shared actor types planning requires boundary (IDENTITY-002), consumer audit (IDENTITY-004), and consumer details (IDENTITY-005 through IDENTITY-009) to know what fields are actually used and how. Planning without this data produces wrong schemas. | `shared/types/actors.types.js` schema defined in writing; no source changes. |
| 12 | IDENTITY-012 | Heavy | HIGH | actors → identity merge planning is last because it requires all prior tickets. The merge plan must know: what boundary currently exists (IDENTITY-002), who uses actors (IDENTITY-004), what types exist (IDENTITY-011), what the engine alias policy is (IDENTITY-010). | Full merge plan written; 2 consumer import update paths documented; implementation ticket template included. |

---

## Stop Points Before Source-Code Change

No source code may be modified in any IDENTITY-001 through IDENTITY-012 ticket.
These are planning tickets only.

**STOP POINT 1 — Before any implementation begins:**
All 12 tickets must be Complete status. Owner reviews IDENTITY-012 merge plan.
A separate implementation ticket must be opened for each source change.
Implementation tickets are not part of this planning series.

**STOP POINT 2 — Before IDENTITY-009 mitigation is applied:**
D-002 (11 hooks passing wrong callerActorId) requires a separate implementation ticket.
The fix pattern is documented in IDENTITY-009 (check `identity.kind` before resolving
callerActorId). Each of the 11 hooks is a separate surgical change. They may be batched
in one PR but must be audited one-by-one.

**STOP POINT 3 — Before any actors → identity merge:**
IDENTITY-012 produces a plan, not an implementation. The merge affects 2 confirmed consumers
(`dashboard/vport/dashboard/cards/team/controller/vportTeamAccess.controller.js` and
`settings/privacy/controller/Blocks.controller.js`). A separate heavy implementation ticket
must be opened and approved before any file is renamed or moved.

---

## Required Validation Checklist

Before marking any ticket Complete, confirm:

```
[ ] All claimed imports traced to FEATURE_IMPORT_MAP.json, BIDIR_DEPENDENCY_DECISION.md,
    or direct source file reads
[ ] No UNKNOWN field left unresolved (or explicitly marked CANNOT_RESOLVE with reason)
[ ] No source file modified
[ ] Layer rule preserved:
    [ ] Controller decides ownership
    [ ] DAL executes scoped queries only
    [ ] RLS enforces DB security
    [ ] DAL does not query ownership tables to decide access
[ ] No new dependencies introduced between features
[ ] No imports added or removed
```

---

## Dependency Graph

```
IDENTITY-001 ──┬── IDENTITY-002
               ├── IDENTITY-003
               └── IDENTITY-004 ──┬── IDENTITY-005 ──── IDENTITY-010 ──┐
                                   ├── IDENTITY-006                      │
                                   ├── IDENTITY-007                      │
                                   └── IDENTITY-008 ──── IDENTITY-009   │
                                                                         │
IDENTITY-001 ─────────────────── IDENTITY-009 ──────────────────────────┤
IDENTITY-002 ──────────────────────────────────────────── IDENTITY-011 ──┤
IDENTITY-004 ──────────────────────────────────────────── IDENTITY-011 ──┤
IDENTITY-002 ──────────────────────────────────────────── IDENTITY-012 ──┘
IDENTITY-004 ──────────────────────────────────────────── IDENTITY-012
IDENTITY-011 ──────────────────────────────────────────── IDENTITY-012
```

---

## Risk Escalation Staircase

```
IDENTITY-001  ■ ZERO RISK — documentation
IDENTITY-002  ■ ZERO RISK — boundary description
IDENTITY-003  ■ ZERO RISK — adapter contract writing
IDENTITY-004  ■ ZERO RISK — read-only consumer audit
IDENTITY-005  ▪ LOW  — source inspection only (chat)
IDENTITY-006  ▪ LOW  — source inspection only (settings)
IDENTITY-007  ▪ LOW  — source inspection only (notifications)
IDENTITY-008  ▪ MEDIUM — profiles has indirect shell coupling
IDENTITY-009  ▪ MEDIUM — auth lifecycle boundary; D-002 bug is HIGH but ticket is read-only
IDENTITY-010  ▪ MEDIUM — policy decision with no source change
IDENTITY-011  ▪ MEDIUM — planning document for future shared types
IDENTITY-012  ◆ HIGH — merge plan; authorizes future implementation ticket
────────────────────────────────────────────────────────────
              IMPL TICKET (separate) — actual source changes
```
