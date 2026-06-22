# ESLint Enforcement Rule

> **Source Contract:** [AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md](../AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md)
> **Section:** ESLint Enforcement Rule

---

## Rule

Use ESLint rules where possible to enforce architecture contracts.

ESLint is preferred for import-related rules because it runs at edit time and provides immediate developer feedback.

---

## Required ESLint Coverage

| Area | ESLint Rule Target |
|---|---|
| Import boundaries | Prevent cross-feature internal imports |
| Forbidden layer imports | DAL→model/controller/hook/UI; hook→DAL/Supabase; UI→DAL/controller/Supabase |
| Forbidden Supabase imports | Block Supabase outside DAL, resolvers, and approved auth adapters |
| Forbidden cross-feature internals | Block `../otherFeature/internal` imports |
| File naming conventions | Enforce layer-encoded filename patterns |
| Forbidden adapter exports | Block non-adapter symbols from feature root index files |

---

## Tool

Use `eslint-plugin-import`, `eslint-plugin-boundaries`, or equivalent custom rules.

Define feature boundaries in the ESLint configuration so rules can resolve feature ownership from file paths.
