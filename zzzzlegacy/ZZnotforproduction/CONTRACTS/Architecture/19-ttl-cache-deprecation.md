# TTL Cache Deprecation Rule

> **Source Contract:** [ARCHITECTURE_GOVERNANCE_CONTRACT.md](../ARCHITECTURE_GOVERNANCE_CONTRACT.md)
> **Section:** TTL Cache Deprecation Rule

---

## Rule

Uncoordinated DAL-level TTL caches are deprecated.

---

## Forbidden

Do not add new DAL-level TTL caches unless explicitly approved by the repository owner.

---

## Migration Path

Existing TTL caches must be migrated to:

- React Query (preferred — aligns with server-state contract)
- Centralized cache ownership (when React Query is not applicable)

---

## Rationale

DAL-level TTL caches bypass React Query's cache coordination, create stale-read risks, and make cache invalidation unpredictable. React Query solves these problems with explicit key management.

---

## Violation Level

| Condition | Level |
|---|---|
| New TTL cache added without explicit approval | MEDIUM |
