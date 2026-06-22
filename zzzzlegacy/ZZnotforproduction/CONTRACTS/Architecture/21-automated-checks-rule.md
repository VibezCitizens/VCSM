# Automated Checks Rule

> **Source Contract:** [AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md](../AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md)
> **Section:** Lightweight Automated Checks Rule

---

## Rule

Architecture contracts must be supported by automated checks.

Automation catches obvious violations before human review reaches them.

---

## Minimum Required Checks

| Check | What It Catches |
|---|---|
| Feature boundary violations | Cross-feature internal imports bypassing adapter |
| Direct cross-feature internal imports | Any import reaching non-adapter files of another feature |
| Adapter export violations | Features exporting non-adapter symbols |
| DAL importing models/controllers/hooks/UI | Layer isolation violation above DAL |
| Hooks importing DAL or Supabase | Hook must call controller, not DAL or Supabase |
| Screens/components importing DAL, controllers, or Supabase | UI layer bypassing hook layer |
| `.select('*')` in DAL/resolver files | Missing explicit column projection |
| Files over 300 lines | Hard size limit violation |
| Feature folder depth over 3 levels | Exceeds max nesting rule |
| Forbidden relative `../../` import chains | Cross-directory leakage |
| Zustand used for server truth | Scope violation |
| Manual `useState + useEffect` server-fetch patterns | React Query adoption violation |

---

## Principle

Automation does not replace architecture review.

Automation protects architecture review from wasting time on obvious violations.
