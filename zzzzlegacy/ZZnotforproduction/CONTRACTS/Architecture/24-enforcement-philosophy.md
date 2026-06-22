# Enforcement Philosophy

> **Source Contract:** [AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md](../AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md)
> **Section:** Enforcement Philosophy

---

## Philosophy

Automated checks start as warnings.

Once stable, critical rules become merge-blocking errors.

---

## Required Severity Matrix

| Rule | Severity |
|---|---|
| Cross-feature internal imports | ERROR |
| Supabase imported in UI/hooks/models | ERROR |
| `.select('*')` in DAL or resolver | ERROR |
| Files over 300 lines | ERROR |
| Files over 250 lines | WARNING |
| Feature folder over 100 files | WARNING |
| TTL cache usage | WARNING |
| Manual server-state hooks (useState+useEffect) | WARNING |

---

## Transition Protocol

New rules should start as WARNING.

After 2 sprint cycles of zero violations on a rule, promote it to ERROR.

Never skip the WARNING phase for a new rule — silent failures in CI are worse than warnings.

---

## Principle

Automation does not replace architecture review.

Automation protects architecture review from wasting time on obvious violations.
