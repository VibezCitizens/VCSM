# VCSM Feature Contract Set — README

**Version:** 1.0  
**Generated:** 2026-06-06  
**Status:** Active  
**Maintained by:** Architecture governance

---

## Purpose

This contract set defines the ownership, boundaries, allowed import directions, dependency rules, and known risks for every feature in the VCSM application (`apps/VCSM/src/features/`).

Each feature contract is the authoritative record for:
- What that feature owns and must not own
- Which adapters form its public API surface
- Which features it is allowed to consume
- Which imports are prohibited
- Current violations and remediation tickets

This contract set does not replace code. It governs code. When the code and the contract conflict, the conflict is a finding — not grounds to update the contract to match the code without a decision record.

---

## Source Files Used

All contracts in this set are derived from scanner output and classified human analysis. No contract invents behavior not proven by these sources:

| Source | Path | Description |
|---|---|---|
| FEATURE_IMPORT_MAP.md | `ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/FEATURE_IMPORT_MAP.md` | Per-feature import summary, violation list, split candidates |
| FEATURE_IMPORT_MAP.json | `ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/FEATURE_IMPORT_MAP.json` | Machine-readable governance data, 34 features, 36 violations |
| BIDIR_DEPENDENCY_DECISION.md | `ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/BIDIR_DEPENDENCY_DECISION.md` | Classification and remediation decisions for all 15 bidirectional pairs |
| FEATURES_ARCHITECTURE_REVIEW.md | `ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/FEATURES_ARCHITECTURE_REVIEW.md` | Full static analysis with per-feature structural assessment |
| FEATURES_TICKET_PLAN.md | `ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/FEATURES_TICKET_PLAN.md` | Execution-ready ticket plan with scanner audit updates |
| Layer Contract | `ZZnotforproduction/CONTRACTS/Architecture/03-layer-contracts.md` | Locked DAL/Controller/Hook/Component/Screen layer rules |
| Scanner data | `apps/scanner/maps/dependency-map.json` | 380 total dependency edges, 106 VCSM feature→feature edges |
| Scanner data | `apps/scanner/maps/feature-map.json` | 34 VCSM features with file counts and layer breakdowns |

**Scanner generation date:** 2026-06-05  
**Analysis date:** 2026-06-06  
**Contract write date:** 2026-06-06

---

## Rules for Future Updates

1. **Source data must be cited.** Any update to a feature contract must reference the source of the claim — a scanner finding, a ticket, or an explicit architecture decision. Do not update contracts from memory.

2. **Violations do not auto-resolve.** A violation listed in this contract is not resolved until a ticket is opened, implemented, and validated. Do not remove a violation entry because the code changed — verify via scanner first.

3. **Contracts are descriptive, not aspirational.** Contracts document current state plus the approved target state. They do not describe plans. Plans live in ticket documents. When a plan is implemented and validated, update the contract.

4. **Do not invent adapters.** The `Public API / Adapter Boundary` section lists only proven adapters confirmed by scanner output or direct file read. If an adapter is planned but not implemented, mark it as `TODO: not yet exposed`.

5. **Split candidate features have provisional contracts.** Features flagged as split candidates (`dashboard`, `post`, `profiles`, `wanders`) have contracts reflecting their current state. When a split ticket executes, the contracts for each resulting feature must be written before implementation begins.

6. **Stub features must not be silently deleted.** If a stub feature's contract says `STATUS: Stub`, the feature must be formally resolved via a ticket (move, merge, or delete with validation) before its contract file is removed.

7. **Every bidirectional pair must have a classification.** No bidirectional import between two features may exist without a classification from `BIDIR_DEPENDENCY_DECISION.md`. If a new bidir pair appears in the scanner, file a ticket immediately.

8. **DAL rule applies universally.** DAL files in any feature must never query ownership tables (`vc.actor_owners`) to make authorization decisions. That is the Controller's responsibility. This rule has no exceptions.

---

## Relationship to Architecture Contracts

This contract set is a specialization of the platform-level architecture contracts:

| Architecture Contract | Relationship |
|---|---|
| `03-layer-contracts.md` | Every feature contract inherits and applies these layer rules. They are not re-stated in full per feature — only feature-specific deviations or clarifications are added. |
| `05-feature-boundaries.md` | The adapter boundary rule described there is the source of the `NO_INTERNAL_WITHOUT_ADAPTER` violation classification used throughout this set. |
| `07-adapter-contract.md` | The adapter pattern (adapters/ folder as public API surface) is the structural basis for allowed/prohibited imports in every feature contract. |
| `08-dependency-rules.md` | The one-direction dependency rules are elaborated at the feature level in `DEPENDENCY_DAG.md`. |

Feature contracts do not supersede architecture contracts. They apply architecture contracts to specific features with specific evidence.

---

## Contract Status Definitions

| Status | Meaning |
|---|---|
| `CLEAN` | No known violations. Scanner confirms all cross-feature imports go through adapter boundaries. |
| `VIOLATIONS` | Active boundary violations confirmed by scanner. Remediation ticket required. |
| `SPLIT_CANDIDATE` | Feature exceeds 100 files or contains 2+ semantically distinct subsystems. Split plan required before new development. |
| `STUB` | Feature contains 1–5 files with no full layer stack. Exists as engine adapter or placeholder. |
| `FROZEN` | Feature is under architectural hold. No new development until a split or remediation ticket completes. |
| `DEPRECATED` | Feature is targeted for deletion. Open ticket required. All consumers must migrate before deletion. |

---

## Directory Structure

```
ZZnotforproduction/CONTRACTS/App/VCSM/
  README.md                      ← This file
  FEATURE_INDEX.md               ← All features, status, risk, notes
  DEPENDENCY_DAG.md              ← Intended dependency direction graph
  BIDIRECTIONAL_DEPENDENCIES.md  ← All 15 bidir pairs, classifications, remediation
  SHARED_BOUNDARIES.md           ← What belongs in shared/ and app/setup/
  RISK_REGISTER.md               ← Feature-level risk tracking
  features/
    [feature-name].md            ← One file per feature
```

---

## Violation Count Summary (as of 2026-06-06)

| Feature | Violations | Severity |
|---|---|---|
| dashboard | 23 | CRITICAL (11 DAL-to-profiles, 7 gas-prices-split, 3 settings-adapter-missing, 1 public-model, 1 public-boundary) |
| profiles | 18 | CRITICAL (10 booking model, 4 dashboard internals, 2 social DAL, 2 dashboard ownership) |
| settings | 5 | MEDIUM (2 social DAL, 3 partial via dashboard) |
| wanders | 2 | MEDIUM (2 public controller+model) |
| **Total** | **36** | — |

Violations in `ads` (CSS leak) and `notifications`/`post` (CSS leak) are tracked in BIDIR pair remediation tickets, not as individual feature violations.

---

## Contracts for Features Not in Scanner Output

The following features appear in the `apps/VCSM/src/features/` folder but were not reported in the scanner's feature-map (typically because they have no cross-feature imports and very few files):

- `analytics` — 1 file, targeted for deletion via ARCH-ANALYTICS-001
- `shell` — 6 files, bottom nav module; has 1 cross-feature import (profiles adapter)
- `debug` — 3 files, dev-only panel; no cross-feature imports

Contracts for these features document their current state and planned fate.
