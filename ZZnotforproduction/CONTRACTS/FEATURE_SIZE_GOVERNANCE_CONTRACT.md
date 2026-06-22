# FEATURE SIZE GOVERNANCE CONTRACT (Locked)

> **Status:** Locked
> **Type:** Architectural — feature size limits and god-folder prevention
> **Library:** [Architecture/25-mega-feature-prevention-rule.md](Architecture/25-mega-feature-prevention-rule.md) · [Architecture/26-feature-size-thresholds.md](Architecture/26-feature-size-thresholds.md) · [Architecture/27-feature-review-actions.md](Architecture/27-feature-review-actions.md) · [Architecture/28-god-folder-definition.md](Architecture/28-god-folder-definition.md) · [Architecture/29-extraction-rule.md](Architecture/29-extraction-rule.md)
> **Applies To:** All features in `apps/VCSM/` and `apps/wentrex/` — all commands

---

## Purpose

Features grow invisibly.

A feature that starts as a clean bounded context silently accumulates unrelated responsibilities until it becomes a god folder — too large to understand, too interconnected to refactor, too risky to touch safely.

This contract defines the thresholds, required actions, and extraction rules that prevent god-folder formation.

---

## Mega Feature / God Folder Prevention Rule

A feature folder must not grow without architectural review.

Features must remain small enough that one developer can understand:

- the feature boundary
- the responsibilities
- the public adapter surface

...without opening dozens of unrelated files.

---

## Feature Size Thresholds

| File Count | Status | Required Action |
|---|---|---|
| 0–50 files | Healthy | None |
| 51–100 files | Monitor | Track growth |
| 101–150 files | Review required | Feature health review |
| 151+ files | Extraction plan required | Create extraction plan |
| 200+ files | Blocked from new capability | No new unrelated domain work |
| 300+ files | Critical architecture debt | Immediate extraction plan; escalate to THOR |

---

## Required Action At 100 Files

When a feature reaches 100 files, perform a feature health review.

The review must identify:

- modules present inside this feature
- unrelated responsibilities
- cross-feature dependencies
- adapter surface size
- files over 250 lines and files over 300 lines
- extraction candidates

---

## Required Action At 150 Files

When a feature reaches 150 files, create an extraction plan.

The plan must answer:

- Which modules exist inside this feature?
- Which modules are independent bounded contexts?
- Which modules should become their own feature?
- Which adapter exports must remain stable?
- Which imports would need migration?
- What can be extracted safely without behavior change?

---

## Required Action At 200 Files

When a feature reaches 200 files, new unrelated capabilities must not be added to that folder.

**Allowed work at 200+ files:**

- bug fixes
- security fixes
- cleanup
- extraction work
- behavior-preserving modularization

**Forbidden work at 200+ files:**

- new unrelated domain capability
- new dashboard card domain
- new workflow that belongs to a new feature
- deeper nesting to hide growth

---

## God Folder Definition

A feature becomes a god folder when it owns multiple unrelated capabilities that could be independently understood, tested, or extracted.

**Signs of god-folder formation:**

- multiple business domains inside one feature
- many internal modules with separate DAL/controller/hook stacks
- adapter exports from many unrelated capabilities
- folder exceeds 3 directory levels deep
- developers must search instead of navigate
- feature name no longer describes most files inside it

---

## Extraction Rule

When a module inside a feature becomes independently meaningful, it must be promoted to its own feature.

**Examples of valid extractions:**

```txt
profiles/kinds/vport/menu       → features/vportMenu
profiles/kinds/vport/reviews    → features/vportReviews
vportDashboard/cards/gasprices  → features/gasPrices
vportDashboard/cards/bookings   → features/vportBookings
post/commentcard                → features/comments
```

**Extraction is complete when:**

- the promoted feature has its own adapter
- all consumers import through the new adapter
- the original feature no longer holds the extracted logic
- no circular imports exist between the original and extracted feature

---

## Cross-Links

- [Architecture/05-feature-boundaries.md](Architecture/05-feature-boundaries.md) — feature containment rules (precondition for size governance)
- [Architecture/07-adapter-contract.md](Architecture/07-adapter-contract.md) — adapter as public surface (governs extraction point)
- [Architecture/15-sprint-review-rule.md](Architecture/15-sprint-review-rule.md) — sprint review that tracks growth
- [Architecture/16-feature-health-metrics.md](Architecture/16-feature-health-metrics.md) — file count metrics that trigger these thresholds
- [Architecture/17-folder-depth-enforcement.md](Architecture/17-folder-depth-enforcement.md) — folder depth rule (god folders violate this)
- [Architecture/21-automated-checks-rule.md](Architecture/21-automated-checks-rule.md) — automated feature file count check
