# Identity Ticket Index

**Generated:** 2026-06-06
**Feature:** `apps/VCSM/src/features/identity/`
**Source:** FEATURE_IMPORT_MAP.json · BIDIR_DEPENDENCY_DECISION.md · FEATURES_ARCHITECTURE_REVIEW.md

---

## Index Table

| ID | Title | Status | Priority | Risk | Weight | Blocked By | Depends On | Source Evidence | Next Action |
|---|---|---|---|---|---|---|---|---|---|
| IDENTITY-001 | Current State Capture | Open | P3 | ZERO | Light | — | — | FEATURE_IMPORT_MAP.md: identity 9 files, 41 inbound, 0 violations | Read identity feature files; write current-state snapshot |
| IDENTITY-002 | actors vs identity Boundary | Open | P3 | ZERO | Light | IDENTITY-001 | IDENTITY-001 | FEATURES_ARCHITECTURE_REVIEW.md: actors 4 files, unclear ownership split; Question #1 | Define boundary in writing; no source changes |
| IDENTITY-003 | Adapter Contract Definition | Open | P2 | ZERO | Light | IDENTITY-001 | IDENTITY-001 | identity.adapter.js + identityOps.adapter.js exist; contract not written | Write adapter surface contract |
| IDENTITY-004 | Import Consumers Audit | Open | P2 | ZERO | Light | IDENTITY-001 | IDENTITY-001, IDENTITY-003 | FEATURE_IMPORT_MAP.json: 41 inbound to identity, 0 violations | Enumerate all 41 consumers; verify adapter compliance |
| IDENTITY-005 | Chat → Identity Dependency | **Complete** | P2 | LOW | Medium | IDENTITY-004 | IDENTITY-004 | IDENTITY-005 audit: 0 @identity imports found (review claim refuted); 8 COMPLIANT; 2 state-layer bypasses | See ticket — RISK-004 revised; IDENTITY-010 scope corrected |
| IDENTITY-006 | Settings → Identity Dependency | Open | P3 | LOW | Medium | IDENTITY-004 | IDENTITY-004 | FEATURES_ARCHITECTURE_REVIEW.md: settings → identity 8x; settings is highest fan-out feature (87 outbound) | Trace 8 import sites; confirm all through adapter |
| IDENTITY-007 | Notifications → Identity Dependency | Open | P3 | LOW | Medium | IDENTITY-004 | IDENTITY-004 | FEATURES_ARCHITECTURE_REVIEW.md: notifications → identity 4x | Trace 4 import sites; confirm all through adapter |
| IDENTITY-008 | Profiles → Identity Dependency | Open | P2 | MEDIUM | Medium | IDENTITY-004 | IDENTITY-004 | FEATURES_ARCHITECTURE_REVIEW.md: shell → profiles imports identity (1x); profiles 374 files | Trace identity imports within profiles surface | 
| IDENTITY-009 | Auth/Session Identity Boundary | Open | P1 | MEDIUM | Medium | IDENTITY-001, IDENTITY-003 | IDENTITY-001, IDENTITY-003 | actor-first-architecture-audit.md: createUserActor.controller.js is the lifecycle entry point | Audit auth→identity handoff; confirm ownership row co-creation |
| IDENTITY-010 | State Layer Access Policy | Open | P2 | MEDIUM | Medium | IDENTITY-005 | IDENTITY-005 | IDENTITY-005: 0 engine alias imports found; actual issue is state/identity/ bypass (useVexSettings) + store access gap (setup.js) | Decide: adapter-only vs allowed state layer access; write policy |
| IDENTITY-011 | Shared Actor Types Planning | Open | P2 | MEDIUM | Medium-Heavy | IDENTITY-004 | IDENTITY-001, IDENTITY-002, IDENTITY-004 | FEATURES_ARCHITECTURE_REVIEW.md: shared/types/ does not exist; actor types referenced across identity/profiles/auth/settings | Plan shared/types/actors.types.js; no source changes in this ticket |
| IDENTITY-012 | actors → identity Merge Planning | Open | P2 | HIGH | Heavy | IDENTITY-002, IDENTITY-011 | IDENTITY-002, IDENTITY-004, IDENTITY-011 | FEATURES_ARCHITECTURE_REVIEW.md: actors 4 files, 2 consumers — dashboard team card + settings privacy | Write merge plan; enumerate 2 consumer import updates; no source changes |

---

## Status Definitions

| Status | Meaning |
|---|---|
| Open | Not started |
| In Progress | Active work in current session |
| Blocked | Cannot proceed — listed blocker not closed |
| Complete | All validation steps passed; output file exists |
| Deferred | Explicitly deferred with recorded reason |

---

## Weight Definitions

| Weight | Meaning |
|---|---|
| Light | Documentation, current state, audit read-only — zero behavioral risk |
| Medium | Per-feature dependency audit or decision record — read-only source inspection |
| Medium-Heavy | Planning document for a future source change |
| Heavy | Planning only for a source-modifying implementation ticket |

---

## Scanner Source Truth

- identity: 9 files, **41 inbound consumers**, 0 outbound, **0 violations**, not a split candidate
- actors: 4 files, 2 inbound (dashboard, settings), 0 outbound, 0 violations
- Source: `FEATURE_IMPORT_MAP.json` generated 2026-06-07T03:51:26.687Z
