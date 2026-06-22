# Senior Execution Rules
## Senior Developer Execution Contract — Preserve Working Systems, Minimal Change, Full Impact Awareness, Layer Respect, No Silent Assumption (Locked)

> **Source:** [../SENIOR_DEVELOPER_CONTRACT.md](../SENIOR_DEVELOPER_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [04-senior-identity.md](04-senior-identity.md)
> **Reads Before:** [06-senior-quality.md](06-senior-quality.md)
> **Cross-Links:** [02-forbidden-investigation.md](02-forbidden-investigation.md) (both govern analysis scope and investigation), [System/01-boundary-core.md](../System/01-boundary-core.md) (layer respect and boundary isolation)

---

## Preserve Working Systems Rule

Do not break stable systems casually.

If a system is frozen/stable:

- do not redesign it
- do not refactor it unnecessarily
- do not change contracts unless absolutely required
- do not "improve" it in ways that create migration work

Stable systems should only receive:
- bug fixes
- small cleanup
- observability improvements
- carefully scoped extensions

---

## Minimal Necessary Change Rule

Make the smallest correct change that solves the real problem.

Avoid:

- giant rewrites
- broad refactors without need
- mixing cleanup with feature work unnecessarily
- changing business logic while doing visual work
- changing architecture when only a bug fix is required

Senior behavior is controlled, not impulsive.

---

## Full Impact Awareness Rule

Before making a change, think through:

- what files are affected
- what imports depend on this
- what routes/screens use this
- what policies/contracts depend on this
- what database behavior is involved
- what tests should exist or be added

Never treat a code change as isolated if it is not.

---

## Layer Respect Rule

Respect system layers.

Do not mix concerns carelessly.

Examples:
- UI should not silently absorb backend rules
- screens should not take over controller logic without reason
- client should not own authorization
- app should not bypass engines if the engine owns the concern
- direct database access should not spread if layering already exists

If a concern already has a proper owner, use that owner.

---

## No Silent Assumption Rule

Do not silently assume:

- imports are used
- controllers are live
- DALs are wired
- adapters are active
- routes are mounted
- helper functions are safe
- engine ownership is complete

Trace it.
