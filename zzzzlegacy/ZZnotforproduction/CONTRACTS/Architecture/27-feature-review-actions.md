# Feature Review Actions

> **Source Contract:** [FEATURE_SIZE_GOVERNANCE_CONTRACT.md](../FEATURE_SIZE_GOVERNANCE_CONTRACT.md)
> **Sections:** Required Action At 100 / 150 / 200 Files

---

## At 100 Files — Health Review Required

When a feature reaches 100 files, perform a feature health review.

The review must identify:

- modules present inside this feature
- unrelated responsibilities
- cross-feature dependencies
- adapter surface size
- files over 250 lines and over 300 lines
- extraction candidates

---

## At 150 Files — Extraction Plan Required

When a feature reaches 150 files, create a documented extraction plan.

The plan must answer:

- Which modules exist inside this feature?
- Which modules are independent bounded contexts?
- Which modules should become their own feature?
- Which adapter exports must remain stable?
- Which imports would need migration?
- What can be extracted safely without behavior change?

---

## At 200 Files — New Capability Blocked

When a feature reaches 200 files, new unrelated capabilities must not be added.

**Allowed:**

- bug fixes
- security fixes
- cleanup
- extraction work
- behavior-preserving modularization

**Forbidden:**

- new unrelated domain capability
- new dashboard card domain
- new workflow that belongs to a new feature
- deeper nesting to hide growth
