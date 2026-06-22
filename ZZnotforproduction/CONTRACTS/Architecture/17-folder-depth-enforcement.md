# Folder Depth Enforcement Rule

> **Source Contract:** [ARCHITECTURE_GOVERNANCE_CONTRACT.md](../ARCHITECTURE_GOVERNANCE_CONTRACT.md)
> **Section:** Folder Depth Enforcement Rule
> **Cross-links:** [10-structural-integrity.md](10-structural-integrity.md) §4.4

---

## Rule

Feature folders must respect the max-depth rule.

**Maximum depth:** 3 directory levels below the feature root.

---

## Enforcement

If a feature needs deeper nesting, the required action is:

- extract a module, OR
- extract a new feature

Deepening beyond 3 levels without extraction is a merge-blocking violation.

---

## Examples

**Allowed:**
```
features/booking/
features/booking/dal/
features/booking/dal/reservations/
```
(3 levels below feature root — at limit)

**Violation:**
```
features/booking/
features/booking/dal/
features/booking/dal/reservations/
features/booking/dal/reservations/slots/
```
(4 levels — exceeds limit — extract a module)

---

## Violation Level

| Condition | Level |
|---|---|
| Folder depth exceeds 3 levels below feature root | MEDIUM |
