# Adapter Revision Rule

> **Source Contract:** [ADAPTER_REVISION_STAMP_CONTRACT.md](../ADAPTER_REVISION_STAMP_CONTRACT.md)
> **Section:** Adapter Revision Rule

---

## Rule

Every feature adapter file must include an architecture revision stamp at the top of the file, before any imports or exports.

---

## Required Stamp Format

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

---

## Field Definitions

| Field | Required | Description |
|---|---|---|
| `@adapter` | Yes | Marks this file as a feature adapter |
| `@feature` | Yes | Name of the feature this adapter belongs to |
| `@lastReviewed` | Yes | ISO date of the last architecture review of this file |
| `@blastRadius` | Yes | Estimated impact of changes to this adapter |
| `@publicSurface` | Yes | Who is allowed to consume this adapter |
| `@requiresDeepReview` | Yes | Whether a deep review is required before modification |

---

## Blast Radius Definitions

| Level | Meaning |
|---|---|
| `low` | 1–2 consumers; change is localized |
| `medium` | 3–10 consumers; change requires targeted testing |
| `high` | 10+ consumers or cross-feature; change requires full review |
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

Set `@requiresDeepReview true` when any of the following apply:

- blast radius is `high` or `critical`
- the adapter exports types or interfaces used in multiple features
- the adapter wraps session, identity, or ownership state
- the adapter exports mutation functions used across features

Commands must refuse to modify a `@requiresDeepReview true` adapter without confirming a deep architecture review has been performed in the current session.

---

## Enforcement

| Condition | Severity |
|---|---|
| Adapter file missing revision stamp | HIGH |
| `@lastReviewed` more than 90 days old | WARNING |
| `@blastRadius critical` adapter modified without THOR gate | MERGE_BLOCKED |
| `@requiresDeepReview true` adapter modified without deep review | HIGH |
| `@feature` field missing or incorrect | MEDIUM |
