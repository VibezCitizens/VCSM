# Extraction Rule

> **Source Contract:** [FEATURE_SIZE_GOVERNANCE_CONTRACT.md](../FEATURE_SIZE_GOVERNANCE_CONTRACT.md)
> **Section:** Extraction Rule

---

## Rule

When a module inside a feature becomes independently meaningful, it must be promoted to its own feature.

---

## Valid Extraction Examples

```txt
profiles/kinds/vport/menu       → features/vportMenu
profiles/kinds/vport/reviews    → features/vportReviews
vportDashboard/cards/gasprices  → features/gasPrices
vportDashboard/cards/bookings   → features/vportBookings
post/commentcard                → features/comments
```

---

## Extraction Completion Criteria

Extraction is complete only when all of the following are true:

- the promoted feature has its own adapter
- all consumers import through the new adapter
- the original feature no longer holds the extracted logic
- no circular imports exist between the original and extracted feature

---

## Extraction Is Not Refactoring

Extraction creates a new feature boundary.

It is not a rename or move — it is a boundary decision that must survive independently.

Extraction without a proper adapter is just a file move and does not satisfy this rule.
