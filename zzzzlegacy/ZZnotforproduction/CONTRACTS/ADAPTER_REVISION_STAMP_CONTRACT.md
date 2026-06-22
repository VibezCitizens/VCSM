# ADAPTER REVISION STAMP CONTRACT (Locked)

> **Status:** Locked
> **Type:** Architectural — adapter traceability and blast-radius awareness
> **Library:** [Architecture/30-adapter-revision-rule.md](Architecture/30-adapter-revision-rule.md)
> **Applies To:** All adapter files in `apps/VCSM/` and `apps/wentrex/` — all commands

---

## Purpose

Adapters are the public surface of features.

A change to an adapter can affect every consumer of that feature.

Without a revision stamp, there is no way to know:

- when the adapter was last reviewed
- how many consumers depend on it
- whether a proposed change has high or critical blast radius
- whether a deep review was performed before the last modification

This contract requires every adapter file to include a machine-readable revision stamp that captures these facts at the time of each modification.

---

## Adapter Revision Rule

Every feature adapter file must include an architecture revision stamp.

**Required stamp format:**

```js
/**
 * @adapter
 * @feature <feature-name>
 * @lastReviewed <YYYY-MM-DD>
 * @blastRadius low | medium | high | critical
 * @publicSurface hooks | components | screens | approved-services
 * @requiresDeepReview true | false
 *
 * Deep review required before modifying this adapter.
 */
```

The stamp must appear at the top of the file, before any imports or exports.

---

## Field Definitions

| Field | Required | Description |
|---|---|---|
| `@adapter` | Yes | Marks this file as a feature adapter |
| `@feature` | Yes | Name of the feature this adapter belongs to |
| `@lastReviewed` | Yes | ISO date of the last architecture review of this file |
| `@blastRadius` | Yes | Estimated impact of changes to this adapter |
| `@publicSurface` | Yes | Who is allowed to consume this adapter |
| `@requiresDeepReview` | Yes | Whether this adapter requires a deep review before modification |

---

## Blast Radius Definitions

| Level | Meaning |
|---|---|
| `low` | Used by 1–2 consumers; change is localized |
| `medium` | Used by 3–10 consumers; change requires targeted testing |
| `high` | Used by 10+ consumers or cross-feature; change requires full review |
| `critical` | Platform-wide or session-critical; change requires THOR gate |

---

## Public Surface Definitions

| Value | Meaning |
|---|---|
| `hooks` | Exported hooks consumed by other features |
| `components` | Exported UI components consumed by other features |
| `screens` | Exported screens consumed by shell or navigation |
| `approved-services` | Exported values consumed by engine or service layers |

---

## requiresDeepReview Rule

Set `@requiresDeepReview true` when any of the following are true:

- blast radius is `high` or `critical`
- the adapter exports types or interfaces used in multiple features
- the adapter wraps session, identity, or ownership state
- the adapter exports mutation functions used across features

Commands must refuse to modify a `@requiresDeepReview true` adapter without first confirming a deep architecture review has been performed in the current session.

---

## Enforcement

| Condition | Severity |
|---|---|
| Adapter file missing revision stamp | HIGH |
| Stamp present but `@lastReviewed` is more than 90 days old | WARNING |
| `@blastRadius critical` adapter modified without THOR gate | MERGE_BLOCKED |
| `@requiresDeepReview true` adapter modified without deep review | HIGH |
| `@feature` field missing or incorrect | MEDIUM |

---

## Cross-Links

- [Architecture/07-adapter-contract.md](Architecture/07-adapter-contract.md) — adapter as public surface (defines what must be stamped)
- [Architecture/15-sprint-review-rule.md](Architecture/15-sprint-review-rule.md) — sprint review that updates stamps
- [Architecture/21-automated-checks-rule.md](Architecture/21-automated-checks-rule.md) — automated check for missing stamps
- [Architecture/25-mega-feature-prevention-rule.md](Architecture/25-mega-feature-prevention-rule.md) — blast radius increases with feature size
